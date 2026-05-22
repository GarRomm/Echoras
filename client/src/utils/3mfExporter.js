import * as THREE from 'three';
import { toSlicerCoords } from './stlExporter';

// --- CRC-32 ---
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// --- Deflate via native CompressionStream ---
async function deflateRaw(uint8Array) {
  const cs = new CompressionStream('deflate-raw');
  const writer = cs.writable.getWriter();
  writer.write(uint8Array);
  writer.close();
  return new Uint8Array(await new Response(cs.readable).arrayBuffer());
}

// --- ZIP builder ---
// files: [{ name: string, data: Uint8Array }]
async function buildZip(files) {
  const enc = new TextEncoder();
  const entries = [];
  const chunks = [];
  let dataOffset = 0;

  for (const file of files) {
    const nameBytes = enc.encode(file.name);
    const compressed = await deflateRaw(file.data);
    const checksum = crc32(file.data);

    const lh = new DataView(new ArrayBuffer(30 + nameBytes.length));
    lh.setUint32(0, 0x04034b50, true); // local file header signature
    lh.setUint16(4, 20, true);          // version needed
    lh.setUint16(6, 0, true);           // flags
    lh.setUint16(8, 8, true);           // compression: deflate
    lh.setUint16(10, 0, true);          // mod time
    lh.setUint16(12, 0, true);          // mod date
    lh.setUint32(14, checksum, true);
    lh.setUint32(18, compressed.length, true);
    lh.setUint32(22, file.data.length, true);
    lh.setUint16(26, nameBytes.length, true);
    lh.setUint16(28, 0, true);          // extra length
    new Uint8Array(lh.buffer, 30).set(nameBytes);

    entries.push({ offset: dataOffset, nameBytes, checksum, compressedSize: compressed.length, uncompressedSize: file.data.length });
    chunks.push(new Uint8Array(lh.buffer), compressed);
    dataOffset += lh.buffer.byteLength + compressed.length;
  }

  // Central directory
  const cdStart = dataOffset;
  for (const { offset, nameBytes, checksum, compressedSize, uncompressedSize } of entries) {
    const cd = new DataView(new ArrayBuffer(46 + nameBytes.length));
    cd.setUint32(0, 0x02014b50, true);  // central directory signature
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0, true);
    cd.setUint16(10, 8, true);          // deflate
    cd.setUint16(12, 0, true);
    cd.setUint16(14, 0, true);
    cd.setUint32(16, checksum, true);
    cd.setUint32(20, compressedSize, true);
    cd.setUint32(24, uncompressedSize, true);
    cd.setUint16(28, nameBytes.length, true);
    cd.setUint16(30, 0, true);
    cd.setUint16(32, 0, true);
    cd.setUint16(34, 0, true);
    cd.setUint16(36, 0, true);
    cd.setUint32(38, 0, true);
    cd.setUint32(42, offset, true);     // local header offset
    new Uint8Array(cd.buffer, 46).set(nameBytes);
    chunks.push(new Uint8Array(cd.buffer));
    dataOffset += cd.buffer.byteLength;
  }

  // End of central directory
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(4, 0, true);
  eocd.setUint16(6, 0, true);
  eocd.setUint16(8, files.length, true);
  eocd.setUint16(10, files.length, true);
  eocd.setUint32(12, dataOffset - cdStart, true);
  eocd.setUint32(16, cdStart, true);
  eocd.setUint16(20, 0, true);
  chunks.push(new Uint8Array(eocd.buffer));

  return new Blob(chunks, { type: 'application/octet-stream' });
}

// --- 3MF XML builder ---
// parts: [{ geometries: THREE.BufferGeometry[], color: '#rrggbb' }]
function buildModelXml(parts, zLift) {
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<model unit="millimeter" xml:lang="en-US"');
  lines.push('  xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"');
  lines.push('  xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">');
  lines.push('  <resources>');

  // Declare one color per part so the slicer shows them with the right colour
  lines.push('    <m:colorgroup id="1">');
  for (const part of parts) lines.push(`      <m:color color="${part.color || '#888888'}"/>`);
  lines.push('    </m:colorgroup>');

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();

  parts.forEach(({ geometries }, idx) => {
    lines.push(`    <object id="${idx + 2}" type="model" pid="1" pindex="${idx}">`);
    lines.push('      <mesh>');
    lines.push('        <vertices>');

    let vi = 0;
    const triLines = [];

    for (const geo of geometries) {
      const ni = geo.index ? geo.toNonIndexed() : geo;
      const pos = ni.getAttribute('position');
      const tc = pos.count / 3;
      for (let i = 0; i < tc; i++) {
        const i3 = i * 3;
        toSlicerCoords(vA.fromBufferAttribute(pos, i3));
        toSlicerCoords(vB.fromBufferAttribute(pos, i3 + 1));
        toSlicerCoords(vC.fromBufferAttribute(pos, i3 + 2));
        vA.z += zLift; vB.z += zLift; vC.z += zLift;
        lines.push(`        <vertex x="${vA.x.toFixed(4)}" y="${vA.y.toFixed(4)}" z="${vA.z.toFixed(4)}"/>`);
        lines.push(`        <vertex x="${vB.x.toFixed(4)}" y="${vB.y.toFixed(4)}" z="${vB.z.toFixed(4)}"/>`);
        lines.push(`        <vertex x="${vC.x.toFixed(4)}" y="${vC.y.toFixed(4)}" z="${vC.z.toFixed(4)}"/>`);
        triLines.push(`        <triangle v1="${vi}" v2="${vi + 1}" v3="${vi + 2}"/>`);
        vi += 3;
      }
    }

    lines.push('        </vertices>');
    lines.push('        <triangles>');
    lines.push(...triLines);
    lines.push('        </triangles>');
    lines.push('      </mesh>');
    lines.push('    </object>');
  });

  lines.push('  </resources>');
  lines.push('  <build>');
  parts.forEach((_, idx) => lines.push(`    <item objectid="${idx + 2}"/>`));
  lines.push('  </build>');
  lines.push('</model>');
  return lines.join('\n');
}

// --- Public API ---
// parts: [{ geometries: THREE.BufferGeometry[], color: '#rrggbb' }]
// zLift: shared lift in mm (from computeZLift)
export async function export3MF(parts, zLift) {
  const enc = new TextEncoder();

  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;

  const relationships = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model" Id="rel0"/>
</Relationships>`;

  return buildZip([
    { name: '[Content_Types].xml', data: enc.encode(contentTypes) },
    { name: '_rels/.rels',         data: enc.encode(relationships) },
    { name: '3D/3dmodel.model',    data: enc.encode(buildModelXml(parts, zLift)) },
  ]);
}

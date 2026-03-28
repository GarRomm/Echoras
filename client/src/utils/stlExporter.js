import * as THREE from 'three';

/**
 * Export a THREE.BufferGeometry to a binary STL Blob.
 *
 * Binary STL format:
 *   80-byte header
 *   4-byte uint32 triangle count
 *   For each triangle:
 *     12 bytes normal (3x float32)
 *     36 bytes vertices (3x3 float32)
 *      2 bytes attribute byte count (0)
 *
 * @param {THREE.BufferGeometry} geometry
 * @returns {Blob}
 */
export function exportSTLBinary(geometry) {
  const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry;
  const positions = nonIndexed.getAttribute('position');
  const triangleCount = positions.count / 3;

  const bufferLength = 80 + 4 + triangleCount * 50;
  const buffer = new ArrayBuffer(bufferLength);
  const view = new DataView(buffer);

  // Header (80 bytes) — fill with zeros (already default)
  const header = 'Echoras STL Export';
  for (let i = 0; i < header.length && i < 80; i++) {
    view.setUint8(i, header.charCodeAt(i));
  }

  // Triangle count
  view.setUint32(80, triangleCount, true);

  let offset = 84;
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();

  for (let i = 0; i < triangleCount; i++) {
    const i3 = i * 3;
    vA.fromBufferAttribute(positions, i3);
    vB.fromBufferAttribute(positions, i3 + 1);
    vC.fromBufferAttribute(positions, i3 + 2);

    // Compute face normal
    cb.subVectors(vC, vB);
    ab.subVectors(vA, vB);
    normal.crossVectors(cb, ab).normalize();

    // Normal
    view.setFloat32(offset, normal.x, true); offset += 4;
    view.setFloat32(offset, normal.y, true); offset += 4;
    view.setFloat32(offset, normal.z, true); offset += 4;

    // Vertex A
    view.setFloat32(offset, vA.x, true); offset += 4;
    view.setFloat32(offset, vA.y, true); offset += 4;
    view.setFloat32(offset, vA.z, true); offset += 4;

    // Vertex B
    view.setFloat32(offset, vB.x, true); offset += 4;
    view.setFloat32(offset, vB.y, true); offset += 4;
    view.setFloat32(offset, vB.z, true); offset += 4;

    // Vertex C
    view.setFloat32(offset, vC.x, true); offset += 4;
    view.setFloat32(offset, vC.y, true); offset += 4;
    view.setFloat32(offset, vC.z, true); offset += 4;

    // Attribute byte count
    view.setUint16(offset, 0, true); offset += 2;
  }

  return new Blob([buffer], { type: 'application/octet-stream' });
}

/**
 * Export multiple THREE.BufferGeometry objects into a single binary STL Blob.
 * Merges all geometries by concatenating their triangle data.
 *
 * @param {THREE.BufferGeometry[]} geometries
 * @returns {Blob}
 */
export function exportMultiGeometrySTL(geometries) {
  // Convert all geometries to non-indexed and count total triangles
  const nonIndexedList = [];
  let totalTriangles = 0;

  for (const geo of geometries) {
    const nonIndexed = geo.index ? geo.toNonIndexed() : geo;
    const posAttr = nonIndexed.getAttribute('position');
    nonIndexedList.push(posAttr);
    totalTriangles += posAttr.count / 3;
  }

  const bufferLength = 80 + 4 + totalTriangles * 50;
  const buffer = new ArrayBuffer(bufferLength);
  const view = new DataView(buffer);

  // Header
  const header = 'Echoras STL Export';
  for (let i = 0; i < header.length && i < 80; i++) {
    view.setUint8(i, header.charCodeAt(i));
  }

  // Total triangle count
  view.setUint32(80, totalTriangles, true);

  let offset = 84;
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();

  for (const posAttr of nonIndexedList) {
    const triCount = posAttr.count / 3;
    for (let i = 0; i < triCount; i++) {
      const i3 = i * 3;
      vA.fromBufferAttribute(posAttr, i3);
      vB.fromBufferAttribute(posAttr, i3 + 1);
      vC.fromBufferAttribute(posAttr, i3 + 2);

      cb.subVectors(vC, vB);
      ab.subVectors(vA, vB);
      normal.crossVectors(cb, ab).normalize();

      view.setFloat32(offset, normal.x, true); offset += 4;
      view.setFloat32(offset, normal.y, true); offset += 4;
      view.setFloat32(offset, normal.z, true); offset += 4;

      view.setFloat32(offset, vA.x, true); offset += 4;
      view.setFloat32(offset, vA.y, true); offset += 4;
      view.setFloat32(offset, vA.z, true); offset += 4;

      view.setFloat32(offset, vB.x, true); offset += 4;
      view.setFloat32(offset, vB.y, true); offset += 4;
      view.setFloat32(offset, vB.z, true); offset += 4;

      view.setFloat32(offset, vC.x, true); offset += 4;
      view.setFloat32(offset, vC.y, true); offset += 4;
      view.setFloat32(offset, vC.z, true); offset += 4;

      view.setUint16(offset, 0, true); offset += 2;
    }
  }

  return new Blob([buffer], { type: 'application/octet-stream' });
}

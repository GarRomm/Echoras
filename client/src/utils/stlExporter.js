import * as THREE from 'three';

// Three.js uses centimetre-scale units; slicers expect millimetres.
const CM_TO_MM = 10;

/**
 * Convert a Three.js vertex (Y-up, cm) to slicer space (Z-up, mm).
 * Rotation: (x, y, z) → (x, -z, y)  - equivalent to −90° around X.
 * Mutates and returns the vector.
 * @param {THREE.Vector3} v
 * @returns {THREE.Vector3}
 */
export function toSlicerCoords(v) {
  const sx = v.x * CM_TO_MM;
  const sy = v.y * CM_TO_MM;
  const sz = v.z * CM_TO_MM;
  // Y-up → Z-up: new_x = sx, new_y = -sz, new_z = sy
  v.set(sx, -sz, sy);
  return v;
}

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
 * Coordinates are converted from Three.js Y-up (cm) to slicer Z-up (mm).
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

  // Header (80 bytes), filled with zeros by default
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
    toSlicerCoords(vA.fromBufferAttribute(positions, i3));
    toSlicerCoords(vB.fromBufferAttribute(positions, i3 + 1));
    toSlicerCoords(vC.fromBufferAttribute(positions, i3 + 2));

    // Compute face normal from transformed vertices
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
 * Compute the Z lift (mm) needed to bring the bottom of a set of geometries to z=0.
 * Both STL files of a multi-color pair must use the same lift to stay aligned.
 *
 * @param {THREE.BufferGeometry[]} geometries
 * @returns {number}
 */
export function computeZLift(geometries) {
  let minY = Infinity;
  for (const geo of geometries) {
    const posAttr = (geo.index ? geo.toNonIndexed() : geo).getAttribute('position');
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      if (y < minY) minY = y;
    }
  }
  return minY === Infinity ? 0 : -minY * CM_TO_MM;
}

/**
 * Export multiple THREE.BufferGeometry objects into a single binary STL Blob.
 * Merges all geometries by concatenating their triangle data.
 *
 * Coordinates are converted from Three.js Y-up (cm) to slicer Z-up (mm).
 *
 * @param {THREE.BufferGeometry[]} geometries
 * @param {number|null} forcedZLift - shared lift value for multi-color pairs; auto-computed if null
 * @returns {Blob}
 */
export function exportMultiGeometrySTL(geometries, forcedZLift = null) {
  // Convert all geometries to non-indexed and count total triangles
  const nonIndexedList = [];
  let totalTriangles = 0;

  for (const geo of geometries) {
    const nonIndexed = geo.index ? geo.toNonIndexed() : geo;
    const posAttr = nonIndexed.getAttribute('position');
    nonIndexedList.push(posAttr);
    totalTriangles += posAttr.count / 3;
  }

  // Use provided lift or compute from this geometry set
  let zLift;
  if (forcedZLift !== null) {
    zLift = forcedZLift;
  } else {
    let minY = Infinity;
    for (const posAttr of nonIndexedList) {
      for (let i = 0; i < posAttr.count; i++) {
        const y = posAttr.getY(i);
        if (y < minY) minY = y;
      }
    }
    zLift = -minY * CM_TO_MM;
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
      toSlicerCoords(vA.fromBufferAttribute(posAttr, i3));
      toSlicerCoords(vB.fromBufferAttribute(posAttr, i3 + 1));
      toSlicerCoords(vC.fromBufferAttribute(posAttr, i3 + 2));

      // Lift so the bottom of the model rests on z = 0
      vA.z += zLift;
      vB.z += zLift;
      vC.z += zLift;

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

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { toSlicerCoords, computeZLift, exportSTLBinary, exportMultiGeometrySTL } from '../../utils/stlExporter';

// Helper: create a minimal triangle BufferGeometry
function makeTriangleGeo(vertices) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
  return geo;
}

describe('toSlicerCoords', () => {
  it('scales by 10 (cm → mm) and converts Y-up to Z-up', () => {
    const v = new THREE.Vector3(1, 2, 3);
    toSlicerCoords(v);
    // new_x = x*10 = 10, new_y = -z*10 = -30, new_z = y*10 = 20
    expect(v.x).toBeCloseTo(10);
    expect(v.y).toBeCloseTo(-30);
    expect(v.z).toBeCloseTo(20);
  });

  it('maps origin to origin', () => {
    const v = new THREE.Vector3(0, 0, 0);
    toSlicerCoords(v);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(0);
    expect(v.z).toBeCloseTo(0);
  });

  it('mutates and returns the same vector instance', () => {
    const v = new THREE.Vector3(1, 0, 0);
    const result = toSlicerCoords(v);
    expect(result).toBe(v);
  });

  it('handles negative coordinates', () => {
    const v = new THREE.Vector3(-1, -2, -3);
    toSlicerCoords(v);
    expect(v.x).toBeCloseTo(-10);
    expect(v.y).toBeCloseTo(30);
    expect(v.z).toBeCloseTo(-20);
  });
});

describe('computeZLift', () => {
  it('returns 0 for an empty array', () => {
    expect(computeZLift([])).toBe(0);
  });

  it('computes lift so the minimum Y is raised to z=0 (in mm)', () => {
    // triangle with minimum y = -2 cm → lift = 20 mm
    const geo = makeTriangleGeo([0, -2, 0,  1, 1, 0,  0, 0, 1]);
    expect(computeZLift([geo])).toBeCloseTo(20);
  });

  it('takes the global minimum Y across multiple geometries', () => {
    const geo1 = makeTriangleGeo([0, -1, 0,  1, 0, 0,  0, 0, 1]);
    const geo2 = makeTriangleGeo([0, -3, 0,  1, 0, 0,  0, 0, 1]);
    // minY = -3 cm → lift = 30 mm
    expect(computeZLift([geo1, geo2])).toBeCloseTo(30);
  });

  it('returns 0 when all vertices are at or above y=0', () => {
    const geo = makeTriangleGeo([0, 0, 0,  1, 1, 0,  0, 0, 1]);
    expect(Math.abs(computeZLift([geo]))).toBe(0);
  });
});

describe('exportSTLBinary', () => {
  it('returns a Blob', () => {
    const geo = makeTriangleGeo([0, 0, 0,  1, 0, 0,  0, 1, 0]);
    const blob = exportSTLBinary(geo);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('blob has correct byte length for N triangles (80 + 4 + N*50)', () => {
    // 1 triangle → 80 + 4 + 1*50 = 134 bytes
    const geo = makeTriangleGeo([0, 0, 0,  1, 0, 0,  0, 1, 0]);
    const blob = exportSTLBinary(geo);
    expect(blob.size).toBe(134);
  });

  it('handles indexed geometry by converting to non-indexed', () => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const blob = exportSTLBinary(geo);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(84);
  });

  it('blob contains "Echoras STL Export" header (read via FileReader)', async () => {
    const geo = makeTriangleGeo([0, 0, 0,  1, 0, 0,  0, 1, 0]);
    const blob = exportSTLBinary(geo);
    const header = await new Promise((resolve) => {
      const fr = new FileReader();
      // Read only the first 18 bytes as a binary string
      fr.onload = () => resolve(fr.result.slice(0, 18));
      fr.readAsBinaryString(blob.slice(0, 18));
    });
    expect(header).toBe('Echoras STL Export');
  });
});

describe('exportMultiGeometrySTL', () => {
  it('returns a Blob', () => {
    const geo = makeTriangleGeo([0, 0, 0,  1, 0, 0,  0, 1, 0]);
    expect(exportMultiGeometrySTL([geo])).toBeInstanceOf(Blob);
  });

  it('merges two geometries into a single STL with combined triangle count', () => {
    const geo1 = makeTriangleGeo([0, 0, 0,  1, 0, 0,  0, 1, 0]);
    const geo2 = makeTriangleGeo([0, 0, 0,  1, 0, 0,  0, 0, 1]);
    const blob = exportMultiGeometrySTL([geo1, geo2]);
    // 2 triangles → 80 + 4 + 2*50 = 184 bytes
    expect(blob.size).toBe(184);
  });

  it('accepts a forced zLift without recomputing', () => {
    const geo = makeTriangleGeo([0, -1, 0,  1, 0, 0,  0, 0, 1]);
    const blob1 = exportMultiGeometrySTL([geo], 0);
    const blob2 = exportMultiGeometrySTL([geo], 50);
    // Same structure, same size, but different z values
    expect(blob1.size).toBe(blob2.size);
  });
});

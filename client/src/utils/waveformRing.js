import * as THREE from 'three';
import { Font } from 'three-stdlib';
import { TextGeometry } from 'three-stdlib';
import { mergeBufferGeometries } from 'three-stdlib';

// ---------------------------------------------------------------------------
// Shared helper: sample waveform data and apply smoothing
// ---------------------------------------------------------------------------

function sampleAmplitudes(waveformData, count, smoothing) {
  let amplitudes = new Float32Array(count);

  if (waveformData && waveformData.length > 0) {
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const srcIdx = t * (waveformData.length - 1);
      const lo = Math.floor(srcIdx);
      const hi = Math.min(lo + 1, waveformData.length - 1);
      const frac = srcIdx - lo;
      amplitudes[i] = (1 - frac) * waveformData[lo] + frac * waveformData[hi];
    }
  } else {
    // Demo: gentle sine wave so the sculpture looks interesting without audio
    for (let i = 0; i < count; i++) {
      amplitudes[i] = Math.sin((i / count) * Math.PI * 8) * 0.3;
    }
  }

  if (smoothing > 0) {
    const kernelRadius = Math.max(1, Math.round(smoothing * count * 0.05));
    const smoothed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      let sum = 0;
      let weightSum = 0;
      for (let k = -kernelRadius; k <= kernelRadius; k++) {
        const idx = Math.max(0, Math.min(count - 1, i + k));
        const w = 1 - Math.abs(k) / (kernelRadius + 1);
        sum += amplitudes[idx] * w;
        weightSum += w;
      }
      smoothed[i] = sum / weightSum;
    }
    amplitudes = smoothed;
  }

  return amplitudes;
}

function setVec3(arr, vertexIndex, x, y, z) {
  const i = vertexIndex * 3;
  arr[i] = x;
  arr[i + 1] = y;
  arr[i + 2] = z;
}

// ---------------------------------------------------------------------------
// Helix ribbon geometry
// ---------------------------------------------------------------------------

/**
 * Build a watertight helix ribbon that spirals around a central cylinder.
 * The ribbon's radial extent is modulated by audio waveform amplitude.
 *
 * @param {Float32Array|number[]|null} waveformData
 * @param {object} params
 * @returns {THREE.BufferGeometry}
 */
export function buildHelixRibbonGeometry(waveformData, params) {
  const {
    peakHeight = 1.0,
    smoothing = 0.5,
    cylinderRadius = 1.0,
    cylinderHeight = 4.0,
    ringThickness = 0.3,
    segments = 256,
    helixTurns = 6,
    ribbonWidth = 0.15,
  } = params || {};

  const N = segments;
  const amplitudes = sampleAmplitudes(waveformData, N, smoothing);

  // Light guard against extreme self-intersection, but allow full user control
  const clampedPeakHeight = peakHeight;

  // 4 vertices per cross-section: inner_bottom, inner_top, outer_bottom, outer_top
  const vertCount = N * 4;
  const positions = new Float32Array(vertCount * 3);

  // Inner radius slightly penetrates the cylinder for watertight 3D printing
  const R_inner = cylinderRadius - 0.01;
  const halfW = ribbonWidth / 2;

  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const theta = t * 2 * Math.PI * helixTurns;
    const y = t * cylinderHeight - cylinderHeight / 2;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    const amp = Math.abs(amplitudes[i]);
    const R_outer = cylinderRadius + ringThickness + amp * clampedPeakHeight;

    const base = i * 4;
    // 0: inner_bottom
    setVec3(positions, base + 0, R_inner * cosT, y - halfW, R_inner * sinT);
    // 1: inner_top
    setVec3(positions, base + 1, R_inner * cosT, y + halfW, R_inner * sinT);
    // 2: outer_bottom
    setVec3(positions, base + 2, R_outer * cosT, y - halfW, R_outer * sinT);
    // 3: outer_top
    setVec3(positions, base + 3, R_outer * cosT, y + halfW, R_outer * sinT);
  }

  const indices = [];

  for (let i = 0; i < N - 1; i++) {
    const b = i * 4;
    const n = (i + 1) * 4;

    // Inner face (facing toward cylinder axis)
    indices.push(b + 0, b + 1, n + 1);
    indices.push(b + 0, n + 1, n + 0);

    // Outer face (facing outward)
    indices.push(b + 2, n + 2, n + 3);
    indices.push(b + 2, n + 3, b + 3);

    // Top face (ribbon top, facing +Y direction)
    indices.push(b + 1, b + 3, n + 3);
    indices.push(b + 1, n + 3, n + 1);

    // Bottom face (ribbon bottom, facing -Y direction)
    indices.push(b + 0, n + 0, n + 2);
    indices.push(b + 0, n + 2, b + 2);
  }

  // Start cap (close the ribbon beginning)
  indices.push(0, 2, 3);
  indices.push(0, 3, 1);

  // End cap (close the ribbon end)
  const last = (N - 1) * 4;
  indices.push(last + 0, last + 1, last + 3);
  indices.push(last + 0, last + 3, last + 2);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

// ---------------------------------------------------------------------------
// Font loading (cached)
// ---------------------------------------------------------------------------

let _fontCache = null;
let _fontPromise = null;

export function loadFont() {
  if (_fontCache) return Promise.resolve(_fontCache);
  if (_fontPromise) return _fontPromise;
  _fontPromise = fetch('/fonts/helvetiker_bold.typeface.json')
    .then(r => r.json())
    .then(json => { _fontCache = new Font(json); return _fontCache; });
  return _fontPromise;
}

// ---------------------------------------------------------------------------
// Engraving geometry (text raised on top of the base)
// ---------------------------------------------------------------------------

/**
 * Build text geometries (artistName + songTitle) raised on the top face of the base.
 * Returns null if no text or font not loaded.
 *
 * @param {string|null} artistName
 * @param {string|null} songTitle
 * @param {object} params
 * @param {Font} font
 * @returns {THREE.BufferGeometry|null}
 */
export function buildEngravingGeometry(artistName, songTitle, params, font) {
  if (!font) return null;

  const lines = [artistName, songTitle].map(s => s?.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const {
    cylinderRadius = 1.0,
    cylinderHeight = 4.0,
  } = params || {};

  const baseRadius = cylinderRadius + 0.5;
  // Top face of the base cylinder
  const baseTopY = -cylinderHeight / 2;

  const TEXT_SIZE = 0.18;   // ~1.8 mm — readable when printed
  const TEXT_DEPTH = 0.07;  // ~0.7 mm extrusion above surface
  const LINE_SPACING = TEXT_SIZE * 1.55;
  const MAX_WIDTH = baseRadius * 1.75;

  const geos = [];

  for (let i = 0; i < lines.length; i++) {
    const geo = new TextGeometry(lines[i], {
      font,
      size: TEXT_SIZE,
      height: TEXT_DEPTH,
      curveSegments: 3,
      bevelEnabled: false,
    });

    // Scale down if text is wider than available base diameter
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const w = bb.max.x - bb.min.x;
    if (w > MAX_WIDTH) {
      const s = MAX_WIDTH / w;
      geo.scale(s, s, 1);
      geo.computeBoundingBox();
    }

    // Center horizontally (X) and distribute lines vertically (Y) before rotation
    const cx = -(geo.boundingBox.min.x + geo.boundingBox.max.x) / 2;
    const totalSpan = (lines.length - 1) * LINE_SPACING;
    const cy = (totalSpan / 2) - i * LINE_SPACING - (geo.boundingBox.min.y + geo.boundingBox.max.y) / 2;
    geo.translate(cx, cy, 0);

    geos.push(geo);
  }

  // Merge all lines into one geometry
  const merged = geos.length === 1 ? geos[0] : mergeBufferGeometries(geos);
  if (!merged) return null;

  // Rotate -90° around X: text XY plane → XZ plane, extrusion now goes in +Y
  merged.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

  // Place on top face of base (front face at baseTopY, text protrudes upward)
  merged.translate(0, baseTopY, 0);

  merged.computeVertexNormals();
  return merged;
}

// ---------------------------------------------------------------------------
// Central cylinder geometry
// ---------------------------------------------------------------------------

/**
 * Build a smooth central cylinder (watertight, with caps).
 *
 * @param {object} params
 * @returns {THREE.BufferGeometry}
 */
export function buildCentralCylinderGeometry(params) {
  const {
    cylinderRadius = 1.0,
    cylinderHeight = 4.0,
  } = params || {};

  const geometry = new THREE.CylinderGeometry(
    cylinderRadius,
    cylinderRadius,
    cylinderHeight,
    32,  // radial segments
    1,   // height segments
    false // closed (caps included)
  );

  return geometry;
}

// ---------------------------------------------------------------------------
// Base / pedestal geometry
// ---------------------------------------------------------------------------

/**
 * Build a circular base disk positioned below the cylinder.
 *
 * @param {object} params
 * @returns {THREE.BufferGeometry}
 */
export function buildBaseGeometry(params) {
  const {
    cylinderRadius = 1.0,
    cylinderHeight = 4.0,
    ringThickness = 0.3,
    baseHeight = 1.2,
  } = params || {};

  // Base radius: just slightly larger than the cylinder
  const baseRadius = cylinderRadius + 0.5;

  const geometry = new THREE.CylinderGeometry(
    baseRadius,
    baseRadius,
    baseHeight,
    32,
    1,
    false
  );

  // Position the base just below the cylinder bottom
  geometry.translate(0, -cylinderHeight / 2 - baseHeight / 2, 0);

  return geometry;
}

// ---------------------------------------------------------------------------
// Legacy: original modulated cylinder (kept for backward compatibility)
// ---------------------------------------------------------------------------

/**
 * @deprecated Use buildHelixRibbonGeometry + buildCentralCylinderGeometry + buildBaseGeometry
 */
export function buildWaveformRingGeometry(waveformData, params) {
  const {
    peakHeight = 1.0,
    smoothing = 0.5,
    cylinderRadius = 1.0,
    cylinderHeight = 4.0,
    ringThickness = 0.3,
    segments = 256,
  } = params || {};

  const radialSegments = 32;
  const amplitudes = sampleAmplitudes(waveformData, segments, smoothing);

  const sideVerts = segments * radialSegments;
  const totalVerts = sideVerts + 2;
  const positions = new Float32Array(totalVerts * 3);
  const indices = [];

  for (let i = 0; i < segments; i++) {
    const t = i / (segments - 1);
    const y = t * cylinderHeight - cylinderHeight / 2;
    const amp = Math.abs(amplitudes[i]);
    const r = cylinderRadius + ringThickness + amp * peakHeight * 0.5;

    for (let j = 0; j < radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2;
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      const vi = (i * radialSegments + j) * 3;
      positions[vi] = x;
      positions[vi + 1] = y;
      positions[vi + 2] = z;

      if (i < segments - 1) {
        const nextI = i + 1;
        const nextJ = (j + 1) % radialSegments;
        const a = i * radialSegments + j;
        const b = nextI * radialSegments + j;
        const c = nextI * radialSegments + nextJ;
        const d = i * radialSegments + nextJ;
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }
  }

  const bottomCenterIdx = sideVerts;
  const topCenterIdx = sideVerts + 1;

  positions[bottomCenterIdx * 3] = 0;
  positions[bottomCenterIdx * 3 + 1] = -cylinderHeight / 2;
  positions[bottomCenterIdx * 3 + 2] = 0;

  positions[topCenterIdx * 3] = 0;
  positions[topCenterIdx * 3 + 1] = cylinderHeight / 2;
  positions[topCenterIdx * 3 + 2] = 0;

  for (let j = 0; j < radialSegments; j++) {
    const nextJ = (j + 1) % radialSegments;
    indices.push(bottomCenterIdx, nextJ, j);
  }

  const topRowStart = (segments - 1) * radialSegments;
  for (let j = 0; j < radialSegments; j++) {
    const nextJ = (j + 1) % radialSegments;
    indices.push(topCenterIdx, topRowStart + j, topRowStart + nextJ);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

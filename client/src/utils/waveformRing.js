import * as THREE from 'three';
import { Font } from 'three-stdlib';
import { TextGeometry } from 'three-stdlib';
import { mergeBufferGeometries } from 'three-stdlib';

// ---------------------------------------------------------------------------
// Utilitaire partagé : sous-échantillonnage et lissage des amplitudes
// ---------------------------------------------------------------------------

/**
 * Réduit le tableau waveformData (2048 points) au nombre de segments souhaité,
 * puis applique un lissage par fenêtre glissante à poids triangulaires.
 *
 * @param {Float32Array|null} waveformData - amplitudes normalisées [0, 1]
 * @param {number} count - nombre de points de sortie (= nombre de segments de la sculpture)
 * @param {number} smoothing - intensité du lissage, entre 0 (aucun) et 1 (maximal)
 */
function sampleAmplitudes(waveformData, count, smoothing) {
  let amplitudes = new Float32Array(count);

  if (waveformData && waveformData.length > 0) {
    for (let i = 0; i < count; i++) {
      // Interpolation linéaire entre les deux échantillons sources les plus proches.
      // Cela évite un aliasing visuel quand count < waveformData.length.
      const t = i / (count - 1);
      const srcIdx = t * (waveformData.length - 1);
      const lo = Math.floor(srcIdx);
      const hi = Math.min(lo + 1, waveformData.length - 1);
      const frac = srcIdx - lo;
      amplitudes[i] = (1 - frac) * waveformData[lo] + frac * waveformData[hi];
    }
  } else {
    // Mode démo : on génère une sinusoïde factice pour que la sculpture soit
    // visuellement intéressante même sans fichier audio chargé.
    for (let i = 0; i < count; i++) {
      amplitudes[i] = Math.sin((i / count) * Math.PI * 8) * 0.3;
    }
  }

  if (smoothing > 0) {
    // Lissage par noyau triangulaire (poids = 1 - |k| / (rayon + 1)).
    // On choisit un noyau triangulaire plutôt qu'une moyenne uniforme (box filter)
    // car il évite les artefacts de banding visibles aux bords de fenêtre.
    // Le rayon croît avec smoothing : à smoothing=1, il vaut ~5% du nombre de points.
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

/**
 * Ecrit un vecteur 3D (x, y, z) à la position vertexIndex dans un Float32Array aplati.
 * Three.js stocke les positions sous la forme [x0,y0,z0, x1,y1,z1, ...],
 * donc l'index dans le tableau vaut vertexIndex * 3.
 */
function setVec3(arr, vertexIndex, x, y, z) {
  const i = vertexIndex * 3;
  arr[i] = x;
  arr[i + 1] = y;
  arr[i + 2] = z;
}

// ---------------------------------------------------------------------------
// Géométrie ruban hélicoïdal (coeur du produit)
// ---------------------------------------------------------------------------

/**
 * Construit un ruban hélicoïdal étanche (watertight) qui s'enroule autour
 * du cylindre central. L'épaisseur radiale du ruban est modulée par l'amplitude
 * audio : là où le son est fort, le ruban s'écarte davantage du cylindre.
 *
 * Le maillage doit être watertight (hermétique) pour l'impression 3D :
 * le logiciel de tranchage (slicer) exige un volume fermé sans trou ni face manquante.
 * C'est pourquoi on construit 4 faces par section (intérieure, extérieure, haut, bas)
 * et on ferme les deux extrémités du ruban avec des caps.
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

  const clampedPeakHeight = peakHeight;

  // Chaque section transversale du ruban est définie par 4 sommets :
  //   0 = inner_bottom  (bord intérieur, bas)
  //   1 = inner_top     (bord intérieur, haut)
  //   2 = outer_bottom  (bord extérieur, bas)
  //   3 = outer_top     (bord extérieur, haut)
  const vertCount = N * 4;
  const positions = new Float32Array(vertCount * 3);

  // Le rayon intérieur pénètre légèrement dans le cylindre (-0.01).
  // Sans cette pénétration, un espace de 0 mm existait entre le ruban et le cylindre,
  // ce qui créait un "non-manifold edge" détecté comme une erreur par les slicers
  // (Cura, PrusaSlicer) et pouvait faire échouer l'impression.
  const R_inner = cylinderRadius - 0.01;
  const halfW = ribbonWidth / 2;

  for (let i = 0; i < N; i++) {
    // t ∈ [0, 1] représente la progression le long de l'hélice.
    const t = i / (N - 1);

    // theta donne l'angle de rotation (en radians) à ce point de l'hélice.
    // En multipliant par helixTurns, on complète le nombre de tours voulu.
    const theta = t * 2 * Math.PI * helixTurns;

    // y est la coordonnée verticale : le ruban monte de -cylinderHeight/2 à +cylinderHeight/2.
    const y = t * cylinderHeight - cylinderHeight / 2;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    // Le rayon extérieur est la somme de :
    //   - cylinderRadius  : rayon de base du cylindre
    //   - ringThickness   : épaisseur minimale du ruban (même là où l'amplitude est nulle)
    //   - amp * peakHeight : déplacement supplémentaire proportionnel à l'amplitude audio
    const amp = Math.abs(amplitudes[i]);
    const R_outer = cylinderRadius + ringThickness + amp * clampedPeakHeight;

    const base = i * 4;
    // Les 4 sommets de cette section, en coordonnées cylindriques converties en cartésiennes.
    // x = R * cos(theta), z = R * sin(theta) (Three.js : Y est l'axe vertical).
    setVec3(positions, base + 0, R_inner * cosT, y - halfW, R_inner * sinT); // inner_bottom
    setVec3(positions, base + 1, R_inner * cosT, y + halfW, R_inner * sinT); // inner_top
    setVec3(positions, base + 2, R_outer * cosT, y - halfW, R_outer * sinT); // outer_bottom
    setVec3(positions, base + 3, R_outer * cosT, y + halfW, R_outer * sinT); // outer_top
  }

  const indices = [];

  for (let i = 0; i < N - 1; i++) {
    const b = i * 4;       // indices des 4 sommets de la section courante
    const n = (i + 1) * 4; // indices des 4 sommets de la section suivante

    // Chaque face est composée de deux triangles (un quad = 2 triangles).
    // L'ordre des sommets (sens anti-horaire vu de l'extérieur) détermine la direction
    // de la normale : Three.js utilise la règle de la main droite pour calculer
    // automatiquement les normales via computeVertexNormals().

    // Face intérieure : tourne vers l'axe du cylindre.
    indices.push(b + 0, b + 1, n + 1);
    indices.push(b + 0, n + 1, n + 0);

    // Face extérieure : tourne vers l'extérieur de la sculpture.
    indices.push(b + 2, n + 2, n + 3);
    indices.push(b + 2, n + 3, b + 3);

    // Face supérieure du ruban (normale vers +Y).
    indices.push(b + 1, b + 3, n + 3);
    indices.push(b + 1, n + 3, n + 1);

    // Face inférieure du ruban (normale vers -Y).
    indices.push(b + 0, n + 0, n + 2);
    indices.push(b + 0, n + 2, b + 2);
  }

  // Cap de début : ferme la première section du ruban.
  // Sans ce cap, la tranche initiale serait ouverte : le volume ne serait pas fermé
  // et le slicer considérerait le mesh comme non-manifold.
  indices.push(0, 2, 3);
  indices.push(0, 3, 1);

  // Cap de fin : ferme la dernière section du ruban.
  const last = (N - 1) * 4;
  indices.push(last + 0, last + 1, last + 3);
  indices.push(last + 0, last + 3, last + 2);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);

  // computeVertexNormals calcule automatiquement les normales de chaque sommet
  // en moyennant les normales des faces adjacentes. Ces normales sont nécessaires
  // pour que Three.js calcule l'éclairage (shading) correctement dans le rendu 3D.
  geometry.computeVertexNormals();

  return geometry;
}

// ---------------------------------------------------------------------------
// Chargement de police (mis en cache)
// ---------------------------------------------------------------------------

let _fontCache = null;
let _fontPromise = null;

/**
 * Charge la police Helvetiker (format JSON Three.js) et la met en cache module.
 * Si la police est déjà chargée, retourne immédiatement sans faire de requête réseau.
 */
export function loadFont() {
  if (_fontCache) return Promise.resolve(_fontCache);
  if (_fontPromise) return _fontPromise;
  _fontPromise = fetch('/fonts/helvetiker_bold.typeface.json')
    .then(r => r.json())
    .then(json => { _fontCache = new Font(json); return _fontCache; });
  return _fontPromise;
}

// ---------------------------------------------------------------------------
// Géométrie de gravure (texte en relief sur la plaque)
// ---------------------------------------------------------------------------

/**
 * Construit les géométries de texte (nom de l'artiste + titre) en relief sur la
 * face avant de la plaque nominative. Retourne null si aucun texte ou police absente.
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
    baseHeight = 1.2,
  } = params || {};

  const baseRadius = cylinderRadius + 0.5;
  const baseCenterY = -cylinderHeight / 2 - baseHeight / 2;

  const usableHeight = baseHeight * 0.80;
  const lineCount = lines.length;
  const TEXT_SIZE = Math.min(0.45, usableHeight / (1 + (lineCount - 1) * 1.4));
  // TEXT_DEPTH : hauteur d'extrusion du texte au-dessus de la plaque (en unités Three.js ≈ mm).
  const TEXT_DEPTH = 0.06;
  const LINE_SPACING = TEXT_SIZE * 1.4;
  // Largeur maximale limitée à baseRadius pour que la corde du texte reste
  // dans la courbure de la base (sagitta ≈ 0.13R à w=R, soit < 1 mm à R=3).
  const MAX_WIDTH = baseRadius * 1.0;

  const geos = [];

  for (let i = 0; i < lineCount; i++) {
    const geo = new TextGeometry(lines[i], {
      font,
      size: TEXT_SIZE,
      height: TEXT_DEPTH,
      curveSegments: 3,
      bevelEnabled: false,
    });

    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const w = bb.max.x - bb.min.x;
    if (w > MAX_WIDTH) {
      const s = MAX_WIDTH / w;
      geo.scale(s, s, 1);
      geo.computeBoundingBox();
    }

    const cx = -(geo.boundingBox.min.x + geo.boundingBox.max.x) / 2;
    const totalSpan = (lines.length - 1) * LINE_SPACING;
    const cy = (totalSpan / 2) - i * LINE_SPACING - (geo.boundingBox.min.y + geo.boundingBox.max.y) / 2;
    geo.translate(cx, cy, 0);

    geos.push(geo);
  }

  const textMerged = geos.length === 1 ? geos[0] : mergeBufferGeometries(geos);
  if (!textMerged) return null;

  // On place le texte sur la face avant de la plaque (voir buildNameplateGeometry pour PLATE_DEPTH).
  const PLATE_DEPTH = 0.05;
  textMerged.translate(0, baseCenterY, baseRadius + PLATE_DEPTH);

  textMerged.computeVertexNormals();
  return textMerged;
}

// ---------------------------------------------------------------------------
// Géométrie de la plaque nominative
// ---------------------------------------------------------------------------

/**
 * Plaque rectangulaire plate sur la paroi latérale de la base, derrière le texte gravé.
 * Rendue comme un mesh séparé pour éviter de fusionner une TextGeometry avec une BoxGeometry.
 *
 * @param {string|null} artistName
 * @param {string|null} songTitle
 * @param {object} params
 * @returns {THREE.BufferGeometry|null}
 */
export function buildNameplateGeometry(artistName, songTitle, params) {
  const lines = [artistName, songTitle].map(s => s?.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const {
    cylinderRadius = 1.0,
    cylinderHeight = 4.0,
    baseHeight = 1.2,
  } = params || {};

  const baseRadius = cylinderRadius + 0.5;
  const baseCenterY = -cylinderHeight / 2 - baseHeight / 2;
  const PLATE_DEPTH = 0.05;
  // Largeur légèrement supérieure à MAX_WIDTH du texte pour former un cadre visible.
  const plateW = baseRadius * 1.05;
  const plateH = baseHeight * 0.88;

  const geo = new THREE.BoxGeometry(plateW, plateH, PLATE_DEPTH);
  // Face arrière à z = baseRadius (affleure la surface du cylindre de base),
  // face avant à z = baseRadius + PLATE_DEPTH (sur laquelle repose le texte).
  geo.translate(0, baseCenterY, baseRadius + PLATE_DEPTH / 2);

  return geo;
}

// ---------------------------------------------------------------------------
// Géométrie du cylindre central
// ---------------------------------------------------------------------------

/**
 * Construit le cylindre central lisse (avec caps, donc watertight).
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
    32,   // 32 segments radiaux : suffisant pour paraître rond sans alourdir le maillage
    1,    // 1 segment en hauteur : pas de subdivision verticale nécessaire
    false // openEnded = false : les caps (dessus et dessous) sont inclus
  );

  return geometry;
}

// ---------------------------------------------------------------------------
// Géométrie du socle / piédestal
// ---------------------------------------------------------------------------

/**
 * Construit le disque circulaire de base positionné sous le cylindre.
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

  // Le rayon de la base déborde légèrement du cylindre pour créer un socle visible.
  const baseRadius = cylinderRadius + 0.5;

  const geometry = new THREE.CylinderGeometry(
    baseRadius,
    baseRadius,
    baseHeight,
    32,
    1,
    false
  );

  // On déplace la base sous le cylindre : son centre Y = -(cylinderHeight/2 + baseHeight/2).
  geometry.translate(0, -cylinderHeight / 2 - baseHeight / 2, 0);

  return geometry;
}

// ---------------------------------------------------------------------------
// Héritage : cylindre modulé original (conservé pour compatibilité ascendante)
// ---------------------------------------------------------------------------

/**
 * @deprecated Utiliser buildHelixRibbonGeometry + buildCentralCylinderGeometry + buildBaseGeometry
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

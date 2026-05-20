import React, { useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import {
  buildHelixRibbonGeometry,
  buildCentralCylinderGeometry,
  buildBaseGeometry,
  buildEngravingGeometry,
  loadFont,
} from '../utils/waveformRing';

const MAT      = { metalness: 0,    roughness: 0.88, envMapIntensity: 0.2 };
const BRILLANT = { metalness: 0.05, roughness: 0.12, envMapIntensity: 1.8 };

export default function WaveformRingMesh({ waveformData, params }) {
  const finish = params.finishMode === 'brillant' ? BRILLANT : MAT;
  const helixGeometry = useMemo(() => {
    return buildHelixRibbonGeometry(waveformData, params);
  }, [waveformData, params]);

  const cylinderGeometry = useMemo(() => {
    return buildCentralCylinderGeometry(params);
  }, [params]);

  const baseGeometry = useMemo(() => {
    return buildBaseGeometry(params);
  }, [params]);

  const [font, setFont] = useState(null);
  useEffect(() => { loadFont().then(setFont).catch(() => {}); }, []);

  const engravingGeometry = useMemo(() => {
    if (!params.showBase || !font) return null;
    return buildEngravingGeometry(params.artistName, params.songTitle, params, font);
  }, [font, params]);

  // Libère la VRAM à chaque changement de géométrie pour éviter les context lost
  useEffect(() => () => helixGeometry.dispose(), [helixGeometry]);
  useEffect(() => () => cylinderGeometry.dispose(), [cylinderGeometry]);
  useEffect(() => () => baseGeometry.dispose(), [baseGeometry]);
  useEffect(() => () => engravingGeometry?.dispose(), [engravingGeometry]);

  return (
    <group>
      {/* Central smooth cylinder */}
      <mesh geometry={cylinderGeometry}>
        <meshStandardMaterial
          color={params.cylinderColor}
          metalness={finish.metalness}
          roughness={finish.roughness}
          envMapIntensity={finish.envMapIntensity}
        />
      </mesh>

      {/* Helix waveform ribbon */}
      <mesh geometry={helixGeometry}>
        <meshStandardMaterial
          color={params.waveformColor}
          metalness={finish.metalness}
          roughness={finish.roughness}
          envMapIntensity={finish.envMapIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Base pedestal */}
      {params.showBase && (
        <mesh geometry={baseGeometry}>
          <meshStandardMaterial
            color={params.cylinderColor}
            metalness={0}
            roughness={0.7}
          />
        </mesh>
      )}

      {/* Raised text engraving on top of base */}
      {params.showBase && engravingGeometry && (
        <mesh geometry={engravingGeometry}>
          <meshStandardMaterial
            color={params.waveformColor}
            metalness={finish.metalness}
            roughness={finish.roughness}
          />
        </mesh>
      )}
    </group>
  );
}

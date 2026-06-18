import React, { useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import {
  buildHelixRibbonGeometry,
  buildCentralCylinderGeometry,
  buildBaseGeometry,
  buildEngravingGeometry,
  buildNameplateGeometry,
  loadFont,
} from '../utils/waveformRing';

const MAT      = { metalness: 0,    roughness: 0.88, envMapIntensity: 0.2 };
const BRILLANT = { metalness: 0.05, roughness: 0.12, envMapIntensity: 1.8 };

export default function WaveformRingMesh({ waveformData, params }) {
  const { invalidate } = useThree();
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
  // Déclenche un re-render Three.js après que React a commité le chargement de la font
  useEffect(() => { if (font) invalidate(); }, [font, invalidate]);

  const engravingGeometry = useMemo(() => {
    if (!params.showBase || !font) return null;
    return buildEngravingGeometry(params.artistName, params.songTitle, params, font);
  }, [font, params]);

  const nameplateGeometry = useMemo(() => {
    if (!params.showBase) return null;
    return buildNameplateGeometry(params.artistName, params.songTitle, params);
  }, [params]);

  // Libère la VRAM à chaque changement de géométrie pour éviter les context lost
  useEffect(() => () => helixGeometry.dispose(), [helixGeometry]);
  useEffect(() => () => cylinderGeometry.dispose(), [cylinderGeometry]);
  useEffect(() => () => baseGeometry.dispose(), [baseGeometry]);
  useEffect(() => () => engravingGeometry?.dispose(), [engravingGeometry]);
  useEffect(() => () => nameplateGeometry?.dispose(), [nameplateGeometry]);

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

      {/* Flat nameplate backing plate - bridges the gap between curved base and flat text */}
      {params.showBase && nameplateGeometry && (
        <mesh geometry={nameplateGeometry}>
          <meshStandardMaterial
            color={params.nameplateColor}
            metalness={0}
            roughness={0.65}
          />
        </mesh>
      )}

      {/* Raised text engraving on top of nameplate */}
      {params.showBase && engravingGeometry && (
        <mesh geometry={engravingGeometry}>
          <meshStandardMaterial
            color={params.engravingColor}
            metalness={finish.metalness}
            roughness={finish.roughness}
          />
        </mesh>
      )}
    </group>
  );
}

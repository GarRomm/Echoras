import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import {
  buildHelixRibbonGeometry,
  buildCentralCylinderGeometry,
  buildBaseGeometry,
} from '../utils/waveformRing';

export default function WaveformRingMesh({ waveformData, params }) {
  const helixGeometry = useMemo(() => {
    return buildHelixRibbonGeometry(waveformData, params);
  }, [waveformData, params]);

  const cylinderGeometry = useMemo(() => {
    return buildCentralCylinderGeometry(params);
  }, [params]);

  const baseGeometry = useMemo(() => {
    return buildBaseGeometry(params);
  }, [params]);

  // Libère la VRAM à chaque changement de géométrie pour éviter les context lost
  useEffect(() => () => helixGeometry.dispose(), [helixGeometry]);
  useEffect(() => () => cylinderGeometry.dispose(), [cylinderGeometry]);
  useEffect(() => () => baseGeometry.dispose(), [baseGeometry]);

  return (
    <group>
      {/* Central smooth cylinder */}
      <mesh geometry={cylinderGeometry}>
        <meshStandardMaterial
          color={params.cylinderColor}
          metalness={0.1}
          roughness={0.6}
        />
      </mesh>

      {/* Helix waveform ribbon */}
      <mesh geometry={helixGeometry}>
        <meshStandardMaterial
          color={params.waveformColor}
          metalness={0.3}
          roughness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Base pedestal */}
      {params.showBase && (
        <mesh geometry={baseGeometry}>
          <meshStandardMaterial
            color={params.cylinderColor}
            metalness={0.1}
            roughness={0.6}
          />
        </mesh>
      )}
    </group>
  );
}

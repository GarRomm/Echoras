import React, { useMemo } from 'react';
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

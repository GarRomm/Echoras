import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  buildHelixRibbonGeometry,
  buildCentralCylinderGeometry,
  buildBaseGeometry,
} from '../utils/waveformRing';

export default function WaveformRingMesh({ waveformData, params }) {
  const groupRef = useRef();

  const helixGeometry = useMemo(() => {
    return buildHelixRibbonGeometry(waveformData, params);
  }, [waveformData, params]);

  const cylinderGeometry = useMemo(() => {
    return buildCentralCylinderGeometry(params);
  }, [params]);

  const baseGeometry = useMemo(() => {
    return buildBaseGeometry(params);
  }, [params]);

  // Slow idle rotation
  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
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

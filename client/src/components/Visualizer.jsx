import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import WaveformRingMesh from './WaveformRingMesh';

export default function Visualizer({ waveformData, params }) {
  return (
    <Canvas
      camera={{ position: [0, 3, 5], fov: 50 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#1a1a2e']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 3]} intensity={1.2} />
      <directionalLight position={[-3, 4, -2]} intensity={0.4} />
      <pointLight position={[-3, 2, -4]} intensity={0.5} color="#40E0D0" />

      <WaveformRingMesh waveformData={waveformData} params={params} />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={15}
      />

      <gridHelper args={[10, 20, '#222233', '#1a1a2e']} position={[0, -0.01, 0]} />
    </Canvas>
  );
}

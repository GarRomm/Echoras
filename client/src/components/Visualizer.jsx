import React, { useMemo, Component } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import WaveformRingMesh from './WaveformRingMesh';

class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0e0e16', color: 'rgba(240,237,230,0.5)',
          flexDirection: 'column', gap: 8, fontFamily: 'sans-serif', fontSize: 14,
        }}>
          <span>Impossible d'initialiser le rendu 3D.</span>
          <button
            style={{ background: 'none', border: '1px solid rgba(240,237,230,0.2)', color: 'inherit', padding: '6px 14px', borderRadius: 6, cursor: 'pointer' }}
            onClick={() => this.setState({ failed: false })}
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Visualizer({ waveformData, params, controlsRef, autoRotate }) {
  const gridY = -(params.cylinderHeight / 2 + (params.showBase ? params.baseHeight : 0));

  return (
    <WebGLErrorBoundary>
      <Canvas
        camera={{ position: [0, 3, 5], fov: 50 }}
        frameloop="always"
        gl={{
          antialias: false,
          preserveDrawingBuffer: true,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#1a1a2e']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 3]} intensity={1.2} />
        <directionalLight position={[-3, 4, -2]} intensity={0.4} />
        <pointLight position={[-3, 2, -4]} intensity={0.5} color="#40E0D0" />

        <WaveformRingMesh waveformData={waveformData} params={params} />

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          minDistance={2}
          maxDistance={15}
          autoRotate={autoRotate}
          autoRotateSpeed={2}
        />

        <gridHelper args={[10, 20, '#222233', '#1a1a2e']} position={[0, gridY, 0]} />
      </Canvas>
    </WebGLErrorBoundary>
  );
}

import React, { useEffect, useState, useCallback, Component } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
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

// Invalide la scène à chaque changement de props (requis avec frameloop="demand")
function SceneInvalidator({ waveformData, params }) {
  const { invalidate } = useThree();
  useEffect(() => { invalidate(); }, [waveformData, params, invalidate]);
  return null;
}

export default function Visualizer({ waveformData, params, controlsRef, autoRotate }) {
  const [canvasKey, setCanvasKey] = useState(0);
  const gridY = -(params.cylinderHeight / 2 + (params.showBase ? params.baseHeight : 0));

  const handleContextLost = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleContextRestored = useCallback(() => {
    setCanvasKey((k) => k + 1);
  }, []);

  return (
    <WebGLErrorBoundary>
      <Canvas
        key={canvasKey}
        camera={{ position: [0, 2, 16], fov: 50 }}
        frameloop="demand"
        gl={{
          antialias: false,
          preserveDrawingBuffer: true,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
          stencil: false,
        }}
        style={{ width: '100%', height: '100%' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', handleContextLost, false);
          gl.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);
        }}
      >
        <color attach="background" args={['#12121A']} />
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 8, 3]} intensity={1.2} />
        <directionalLight position={[-3, 4, -2]} intensity={0.4} />
        <directionalLight position={[0, -4, 2]} intensity={0.15} />
        <pointLight position={[-3, 2, -4]} intensity={0.5} color="#40E0D0" />

        <Environment preset="studio" />
        <SceneInvalidator waveformData={waveformData} params={params} />
        <WaveformRingMesh waveformData={waveformData} params={params} />

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          minDistance={3}
          maxDistance={50}
          autoRotate={autoRotate}
          autoRotateSpeed={2}
        />

        <gridHelper args={[20, 20, '#222233', '#1a1a2e']} position={[0, gridY, 0]} />
      </Canvas>
    </WebGLErrorBoundary>
  );
}

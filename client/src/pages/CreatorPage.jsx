import React, { useState, useCallback, useRef } from 'react';
import AudioUploader from '../components/AudioUploader';
import Visualizer from '../components/Visualizer';
import ControlPanel from '../components/ControlPanel';
import ExportPanel from '../components/ExportPanel';
import { useAudioAnalysis } from '../hooks/useAudioAnalysis';
import './CreatorPage.css';

export default function CreatorPage() {
  const [audioFile, setAudioFile] = useState(null);
  const [params, setParams] = useState({
    peakHeight: 1.5,
    smoothing: 0,
    cylinderRadius: 1.0,
    cylinderHeight: 4.0,
    ringThickness: 0.3,
    segments: 512,
    material: 'plastic_white',
    helixTurns: 6,
    ribbonWidth: 0.15,
    waveformColor: '#40E0D0',
    cylinderColor: '#FFFFFF',
    baseHeight: 0.2,
    showBase: true,
  });

  const { waveformData, isAnalyzing } = useAudioAnalysis(audioFile);

  const controlsRef = useRef(null);
  const [autoRotate, setAutoRotate] = useState(false);

  const handleReset = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.dollyIn(1.3);
      controlsRef.current.update();
    }
  }, []);

  const handleFileSelected = useCallback((file) => {
    setAudioFile(file);
  }, []);

  const handleParamChange = useCallback((key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const summaryRows = [
    { label: 'Matériau', value: params.material.replace('_', ' ') },
    { label: 'Hauteur pics', value: params.peakHeight.toFixed(2) },
    { label: 'Tours hélice', value: params.helixTurns },
    { label: 'Rayon', value: params.cylinderRadius.toFixed(1) },
    { label: 'Hauteur', value: params.cylinderHeight.toFixed(1) },
  ];

  return (
    <div className="creator">
      <div className="creator__left">
        <div className="creator__viewer">
          <Visualizer waveformData={waveformData} params={params} controlsRef={controlsRef} autoRotate={autoRotate} />
          <div className="creator__viewer-controls">
            <button
              className={`creator__viewer-hint${autoRotate ? ' creator__viewer-hint--active' : ''}`}
              onClick={() => setAutoRotate((r) => !r)}
              type="button"
            >
              Rotation {autoRotate ? 'ON' : 'OFF'}
            </button>
            <span className="creator__viewer-sep" />
            <button className="creator__viewer-hint" onClick={handleZoomIn} type="button">
              Zoom +
            </button>
            <span className="creator__viewer-sep" />
            <button className="creator__viewer-hint" onClick={handleReset} type="button">
              Réinitialiser
            </button>
          </div>
        </div>

        <div className="creator__bottom">
          <div className="creator__summary">
            <p className="creator__summary-title">Résumé</p>
            <div className="creator__summary-list">
              {summaryRows.map((row) => (
                <div key={row.label} className="creator__summary-row">
                  <span className="creator__summary-label">{row.label}</span>
                  <span className="creator__summary-value">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {waveformData && waveformData.length > 0 && (
            <div className="creator__waveform-info">
              <p className="creator__waveform-title">Dynamique du son</p>
              <div className="creator__waveform-bars" aria-hidden="true">
                {waveformData.slice(0, 32).map((v, i) => (
                  <div
                    key={i}
                    className="creator__waveform-bar"
                    style={{ height: `${Math.max(4, v * 40)}px` }}
                  />
                ))}
              </div>
              {audioFile && <p className="creator__waveform-name">"{audioFile.name.replace(/\.[^.]+$/, '')}"</p>}
            </div>
          )}
        </div>
      </div>

      <aside className="creator__panel">
        <div className="creator__panel-header">
          <h1 className="creator__panel-title">Studio 3D</h1>
          <p className="creator__panel-subtitle">Importez votre musique et personnalisez votre sculpture.</p>
        </div>

        <AudioUploader onFileSelected={handleFileSelected} isAnalyzing={isAnalyzing} audioFile={audioFile} />

        <ControlPanel params={params} onChange={handleParamChange} />

        <ExportPanel waveformData={waveformData} params={params} audioFileName={audioFile?.name} />
      </aside>
    </div>
  );
}

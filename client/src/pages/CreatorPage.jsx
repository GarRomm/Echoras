import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AudioUploader from '../components/AudioUploader';
import Visualizer from '../components/Visualizer';
import ControlPanel from '../components/ControlPanel';
import ExportPanel from '../components/ExportPanel';
import { useAudioAnalysis } from '../hooks/useAudioAnalysis';
import './CreatorPage.css';

const DEFAULT_PARAMS = {
  peakHeight: 1.5,
  smoothing: 0,
  cylinderRadius: 2.5,
  cylinderHeight: 10.0,
  ringThickness: 0.35,
  segments: 512,
  helixTurns: 8,
  ribbonWidth: 0.20,
  waveformColor: '#40E0D0',
  cylinderColor: '#FFFFFF',
  nameplateColor: '#FFFFFF',
  engravingColor: '#40E0D0',
  baseHeight: 1.2,
  showBase: true,
  finishMode: 'mat',
  artistName: '',
  songTitle: '',
};

export default function CreatorPage() {
  const location = useLocation();

  useEffect(() => { document.title = 'Studio 3D — Echoras'; }, []);

  const [audioFile, setAudioFile] = useState(null);
  const [params, setParams] = useState(() => {
    const s = location.state;
    return { ...DEFAULT_PARAMS, ...(s?.params ?? {}) };
  });
  const [resumedWaveform, setResumedWaveform] = useState(() => {
    const wd = location.state?.waveformData;
    return wd && wd.length > 0 ? new Float32Array(wd) : null;
  });
  const [resumeBanner, setResumeBanner] = useState(() => !!location.state);

  // Filet de sécurité : si le useState initializer a tourné avant la propagation
  // du location.state (rendu concurrent), on le rattrape ici.
  useEffect(() => {
    const s = location.state;
    if (!s) return;
    if (s.params) {
      setParams({ ...DEFAULT_PARAMS, ...s.params });
    }
    if (s.waveformData && s.waveformData.length > 0) {
      setResumedWaveform(new Float32Array(s.waveformData));
    }
    setResumeBanner(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionnellement vide : s'exécute une seule fois au montage

  const { waveformData: analyzedData, isAnalyzing } = useAudioAnalysis(audioFile);
  const waveformData = analyzedData ?? resumedWaveform;

  const [savedSculptureId, setSavedSculptureId] = useState(
    () => location.state?.sculptureId ?? null
  );

  const getCanvasDataUrl = useCallback(() => {
    const canvas = viewerRef.current?.querySelector('canvas');
    if (!canvas) return null;
    return canvas.toDataURL('image/jpeg', 0.85);
  }, []);

  const handleSculptureSaved = useCallback((id) => {
    setSavedSculptureId(id);
  }, []);

  const controlsRef = useRef(null);
  const viewerRef = useRef(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  const handleFullscreen = useCallback(() => {
    const el = viewerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const handleSnapshot = useCallback(() => {
    const canvas = viewerRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = audioFile
      ? `${audioFile.name.replace(/\.[^.]+$/, '')}.png`
      : 'echoras-sculpture.png';
    a.click();
  }, [audioFile]);

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
    if (file) setResumeBanner(false);
  }, []);

  const handleParamChange = useCallback((key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const summaryRows = [
    { label: 'Finition', value: params.finishMode === 'brillant' ? 'PETG brillant' : 'PLA mat' },
    { label: 'Hauteur pics', value: params.peakHeight.toFixed(2) },
    { label: 'Tours hélice', value: params.helixTurns },
    { label: 'Rayon', value: params.cylinderRadius.toFixed(1) },
    { label: 'Hauteur', value: params.cylinderHeight.toFixed(1) },
  ];

  return (
    <div className="creator">
      {resumeBanner && (
        <div className="creator__resume-banner">
          <span>
            Reprise de <strong>{location.state?.sculptureName || 'votre sculpture'}</strong>
            {resumedWaveform
              ? <> — votre sculpture est prête, vous pouvez modifier les paramètres</>
              : location.state?.audioFileName
                ? <> — re-uploadez <em>{location.state.audioFileName}</em> pour retrouver votre son</>
                : null
            }
          </span>
          <button className="creator__resume-banner-close" onClick={() => setResumeBanner(false)} aria-label="Fermer">×</button>
        </div>
      )}
      <div className="creator__row">
        <div className="creator__left">
        <div className="creator__viewer" ref={viewerRef}>
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
            <span className="creator__viewer-sep" />
            <button className="creator__viewer-hint" onClick={handleSnapshot} type="button">
              Instantané
            </button>
            <span className="creator__viewer-sep" />
            <button
              className={`creator__viewer-hint${isFullscreen ? ' creator__viewer-hint--active' : ''}`}
              onClick={handleFullscreen}
              type="button"
            >
              {isFullscreen ? 'Réduire' : 'Plein écran'}
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
                {Array.from(waveformData.slice(0, 32)).map((v, i) => (
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

        <ExportPanel
          waveformData={waveformData}
          params={params}
          audioFileName={audioFile?.name}
          resumedSculptureId={location.state?.sculptureId ?? null}
          resumedMaterialId={location.state?.materialId ?? null}
          onSaved={handleSculptureSaved}
          getCanvasDataUrl={getCanvasDataUrl}
        />
      </aside>
      </div>
    </div>
  );
}

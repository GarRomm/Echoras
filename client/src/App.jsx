import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import AudioUploader from './components/AudioUploader';
import Visualizer from './components/Visualizer';
import ControlPanel from './components/ControlPanel';
import ExportPanel from './components/ExportPanel';
import { useAudioAnalysis } from './hooks/useAudioAnalysis';
import './styles/App.css';

export default function App() {
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

  const handleFileSelected = useCallback((file) => {
    setAudioFile(file);
  }, []);

  const handleParamChange = useCallback((key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="app">
      <Header />
      <main className="app__main">
        <aside className="app__sidebar">
          <AudioUploader onFileSelected={handleFileSelected} isAnalyzing={isAnalyzing} />
          <ControlPanel params={params} onChange={handleParamChange} />
        </aside>
        <section className="app__visualizer">
          <Visualizer waveformData={waveformData} params={params} />
        </section>
        <aside className="app__sidebar app__sidebar--right">
          <ExportPanel waveformData={waveformData} params={params} audioFileName={audioFile?.name} />
        </aside>
      </main>
    </div>
  );
}

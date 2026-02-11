import { useState, useEffect } from 'react';

/**
 * Custom hook: decode an audio file using Web Audio API and extract
 * a downsampled waveform amplitude array for geometry generation.
 *
 * @param {File|null} file – the audio file selected by the user
 * @returns {{ waveformData: Float32Array|null, isAnalyzing: boolean }}
 */
export function useAudioAnalysis(file) {
  const [waveformData, setWaveformData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!file) return;

    let cancelled = false;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    async function analyze() {
      setIsAnalyzing(true);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        // Take the first channel
        const raw = audioBuffer.getChannelData(0);

        // Downsample to a manageable size (e.g. 2048 points)
        const targetLength = 2048;
        const blockSize = Math.floor(raw.length / targetLength);
        const downsampled = new Float32Array(targetLength);

        for (let i = 0; i < targetLength; i++) {
          const start = i * blockSize;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(raw[start + j]);
          }
          // Average absolute amplitude for this block
          downsampled[i] = sum / blockSize;
        }

        // Normalize to [0, 1]
        let max = 0;
        for (let i = 0; i < downsampled.length; i++) {
          if (downsampled[i] > max) max = downsampled[i];
        }
        if (max > 0) {
          for (let i = 0; i < downsampled.length; i++) {
            downsampled[i] /= max;
          }
        }

        if (!cancelled) {
          setWaveformData(downsampled);
        }
      } catch (err) {
        console.error('Audio analysis failed:', err);
      } finally {
        if (!cancelled) setIsAnalyzing(false);
      }
    }

    analyze();

    return () => {
      cancelled = true;
      audioCtx.close();
    };
  }, [file]);

  return { waveformData, isAnalyzing };
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAudioAnalysis } from '../../hooks/useAudioAnalysis';

// Minimal AudioBuffer mock
function makeAudioBuffer(rawData) {
  return { getChannelData: () => rawData };
}

function makeAudioContextMock(decodedBuffer) {
  return {
    decodeAudioData: vi.fn().mockResolvedValue(decodedBuffer),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

function buildFileWithArrayBuffer(name = 'test.mp3', size = 100) {
  const file = new File([new Uint8Array(size)], name, { type: 'audio/mp3' });
  // jsdom's File.prototype.arrayBuffer may not be spyable via vi.spyOn — assign directly
  file.arrayBuffer = () => Promise.resolve(new ArrayBuffer(size));
  return file;
}

describe('useAudioAnalysis', () => {
  it('starts with null waveformData and isAnalyzing false when no file', () => {
    const { result } = renderHook(() => useAudioAnalysis(null));
    expect(result.current.waveformData).toBeNull();
    expect(result.current.isAnalyzing).toBe(false);
  });

  it('resolves waveformData as a Float32Array of 2048 entries', async () => {
    const rawData = new Float32Array(4096).fill(0.5);
    const mockCtx = makeAudioContextMock(makeAudioBuffer(rawData));
    vi.stubGlobal('AudioContext', vi.fn(() => mockCtx));

    const file = buildFileWithArrayBuffer();
    const { result } = renderHook(() => useAudioAnalysis(file));

    await waitFor(() => expect(result.current.waveformData).not.toBeNull());

    expect(result.current.waveformData).toBeInstanceOf(Float32Array);
    expect(result.current.waveformData.length).toBe(2048);
  });

  it('normalizes output values to [0, 1]', async () => {
    // Non-uniform data to test normalization
    const rawData = new Float32Array(4096).fill(0);
    rawData[0] = 0.2;
    rawData[2048] = 0.8; // will be the max block
    const mockCtx = makeAudioContextMock(makeAudioBuffer(rawData));
    vi.stubGlobal('AudioContext', vi.fn(() => mockCtx));

    const file = buildFileWithArrayBuffer();
    const { result } = renderHook(() => useAudioAnalysis(file));

    await waitFor(() => expect(result.current.waveformData).not.toBeNull());

    const values = Array.from(result.current.waveformData);
    const max = Math.max(...values);
    const min = Math.min(...values);
    expect(max).toBeCloseTo(1, 5);
    expect(min).toBeGreaterThanOrEqual(0);
  });

  it('sets isAnalyzing to false once analysis completes', async () => {
    const rawData = new Float32Array(4096).fill(0.3);
    const mockCtx = makeAudioContextMock(makeAudioBuffer(rawData));
    vi.stubGlobal('AudioContext', vi.fn(() => mockCtx));

    const file = buildFileWithArrayBuffer();
    const { result } = renderHook(() => useAudioAnalysis(file));

    await waitFor(() => expect(result.current.isAnalyzing).toBe(false));
    expect(result.current.waveformData).not.toBeNull();
  });

  it('returns all-zero waveform data when audio is silent', async () => {
    const rawData = new Float32Array(4096).fill(0);
    const mockCtx = makeAudioContextMock(makeAudioBuffer(rawData));
    vi.stubGlobal('AudioContext', vi.fn(() => mockCtx));

    const file = buildFileWithArrayBuffer();
    const { result } = renderHook(() => useAudioAnalysis(file));

    await waitFor(() => expect(result.current.isAnalyzing).toBe(false));

    const values = Array.from(result.current.waveformData);
    expect(values.every((v) => v === 0)).toBe(true);
  });

  it('closes the AudioContext on unmount', async () => {
    const rawData = new Float32Array(4096).fill(0.1);
    const mockCtx = makeAudioContextMock(makeAudioBuffer(rawData));
    vi.stubGlobal('AudioContext', vi.fn(() => mockCtx));

    const file = buildFileWithArrayBuffer();
    const { result, unmount } = renderHook(() => useAudioAnalysis(file));

    await waitFor(() => expect(result.current.waveformData).not.toBeNull());

    unmount();
    expect(mockCtx.close).toHaveBeenCalled();
  });

  it('resets waveformData when file changes to null', async () => {
    const rawData = new Float32Array(4096).fill(0.5);
    const mockCtx = makeAudioContextMock(makeAudioBuffer(rawData));
    vi.stubGlobal('AudioContext', vi.fn(() => mockCtx));

    const file = buildFileWithArrayBuffer();
    const { result, rerender } = renderHook(({ f }) => useAudioAnalysis(f), {
      initialProps: { f: file },
    });

    await waitFor(() => expect(result.current.waveformData).not.toBeNull());

    act(() => { rerender({ f: null }); });

    // After switching back to null, no further analysis runs
    expect(result.current.isAnalyzing).toBe(false);
  });
});

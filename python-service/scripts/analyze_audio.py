"""
analyze_audio.py — Deep audio analysis using Librosa.

Called by the Node.js backend when advanced frequency analysis is needed
beyond what Web Audio API provides on the client.

Usage:
    python analyze_audio.py --input /path/to/audio.wav --output /path/to/analysis.json

Output JSON format:
{
    "duration": 180.5,
    "sample_rate": 44100,
    "tempo": 120.0,
    "waveform_envelope": [0.1, 0.3, ...],       // 2048 downsampled points
    "spectral_centroid": [1200, 1350, ...],      // brightness over time
    "frequency_bands": {                          // energy per band
        "sub_bass":  [0.1, 0.2, ...],
        "bass":      [0.3, 0.2, ...],
        "mid":       [0.5, 0.6, ...],
        "high_mid":  [0.4, 0.3, ...],
        "presence":  [0.2, 0.1, ...]
    },
    "onset_times": [0.5, 1.2, 2.0, ...],         // beat/onset positions in seconds
    "chroma": [[...], [...], ...]                 // 12xN chroma features
}
"""

import argparse
import json
import sys
import os

import numpy as np
import librosa


def parse_args():
    parser = argparse.ArgumentParser(description="Analyze audio for 3D generation")
    parser.add_argument("--input", required=True, help="Path to audio file")
    parser.add_argument("--output", required=True, help="Path to output JSON")
    parser.add_argument("--target-points", type=int, default=2048,
                        help="Number of waveform envelope points")
    return parser.parse_args()


def analyze(filepath, target_points=2048):
    y, sr = librosa.load(filepath, sr=None, mono=True)
    duration = librosa.get_duration(y=y, sr=sr)

    # ----- Tempo & beats -----
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    onset_times = librosa.frames_to_time(beat_frames, sr=sr).tolist()

    # ----- Waveform envelope (downsampled RMS) -----
    hop_length = max(1, len(y) // target_points)
    rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]
    # Resample to exact target length
    rms_resampled = np.interp(
        np.linspace(0, len(rms) - 1, target_points),
        np.arange(len(rms)),
        rms,
    )
    # Normalize
    rms_max = rms_resampled.max()
    if rms_max > 0:
        rms_resampled /= rms_max
    waveform_envelope = rms_resampled.tolist()

    # ----- Spectral centroid (brightness) -----
    cent = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=hop_length)[0]
    cent_resampled = np.interp(
        np.linspace(0, len(cent) - 1, target_points),
        np.arange(len(cent)),
        cent,
    )
    spectral_centroid = cent_resampled.tolist()

    # ----- Frequency band energy -----
    S = np.abs(librosa.stft(y, hop_length=hop_length))
    freqs = librosa.fft_frequencies(sr=sr)

    bands = {
        "sub_bass":  (20, 60),
        "bass":      (60, 250),
        "mid":       (250, 2000),
        "high_mid":  (2000, 6000),
        "presence":  (6000, 20000),
    }

    frequency_bands = {}
    for name, (lo, hi) in bands.items():
        mask = (freqs >= lo) & (freqs < hi)
        band_energy = S[mask, :].sum(axis=0)
        resampled = np.interp(
            np.linspace(0, len(band_energy) - 1, target_points),
            np.arange(len(band_energy)),
            band_energy,
        )
        bmax = resampled.max()
        if bmax > 0:
            resampled /= bmax
        frequency_bands[name] = resampled.tolist()

    # ----- Chroma -----
    chroma = librosa.feature.chroma_stft(y=y, sr=sr, hop_length=hop_length)
    chroma_list = chroma.tolist()  # 12 x N

    return {
        "duration": round(duration, 2),
        "sample_rate": sr,
        "tempo": round(float(tempo), 1),
        "waveform_envelope": waveform_envelope,
        "spectral_centroid": spectral_centroid,
        "frequency_bands": frequency_bands,
        "onset_times": onset_times,
        "chroma": chroma_list,
    }


def main():
    args = parse_args()

    if not os.path.isfile(args.input):
        print(f"ERROR: File not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)

    result = analyze(args.input, target_points=args.target_points)

    with open(args.output, "w") as f:
        json.dump(result, f)

    print(f"Analysis complete: {args.output}")


if __name__ == "__main__":
    main()

"""Decode the song and separate stems.

* work/<song>/mix.wav: gapless 44.1 kHz stereo decode of song.mp3. ffmpeg trims
  the encoder delay like browsers do, so this is the time reference of every
  analysis result and of the video.
* Demucs htdemucs_ft stems (vocals / drums / bass / other) of mix.wav in
  stems/<song>/htdemucs_ft/mix/.
* work/<song>/stem_offset.json: residual lag of the stems against the mix,
  measured by cross-correlation; common.load_stem removes it.

Run:  SONG=<slug> uv run python stems.py
"""
import common
import json
import os
import subprocess
import sys

import numpy as np


def decode():
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(common.AUDIO), "-map", "0:a:0",
                    "-ar", "44100", "-ac", "2", "-c:a", "pcm_f32le", str(common.MIX_WAV)], check=True)


def separate():
    import torch
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    out = common.STEMS.parent.parent  # demucs writes <out>/htdemucs_ft/<input name>/
    subprocess.run([sys.executable, "-m", "demucs", "-n", "htdemucs_ft", "-d", device, "-o", str(out),
                    str(common.MIX_WAV)], check=True, env={**os.environ, "PYTORCH_ENABLE_MPS_FALLBACK": "1"})


def measure_offset(max_lag=4410):
    """Lag (samples) of the stem sum against the mix, from their cross-correlation
    over a 30 s window: stem[i + lag] lines up with mix[i]."""
    import soundfile as sf
    from scipy.signal import fftconvolve
    mix, sr = sf.read(common.MIX_WAV, dtype="float32", always_2d=True)
    mix = mix.mean(axis=1)
    stems = np.sum([sf.read(common.STEMS / f"{n}.wav", dtype="float32", always_2d=True)[0].mean(axis=1)
                    for n in ("vocals", "drums", "bass", "other")], axis=0)
    a = min(len(mix), len(stems)) // 3
    x = mix[a:a + 30 * sr]
    y = stems[a - max_lag:a + len(x) + max_lag]
    c = fftconvolve(y, x[::-1], mode="valid")  # c[k]: lag k - max_lag
    k = int(np.argmax(c))
    corr = float(c[k] / (np.linalg.norm(x) * np.linalg.norm(y[k:k + len(x)]) + 1e-12))
    return k - max_lag, corr


def main():
    decode()
    separate()
    lag, corr = measure_offset()
    (common.WORK / "stem_offset.json").write_text(json.dumps(dict(samples=lag, sr=44100, corr=round(corr, 4))))
    print(f"stems in {common.STEMS}; stem lag {lag} samples ({lag / 44.1:.2f} ms), correlation {corr:.3f}")


if __name__ == "__main__":
    main()

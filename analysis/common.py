"""Shared paths / cache setup for the analysis scripts.

Import this module FIRST (before torch / huggingface / mlx imports) so that all
model downloads land in analysis/.cache/.

The song is a folder under songs/, selected with the SONG environment variable
(pipeline.py sets it); with a single song folder it is picked automatically.
"""
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent          # analysis/
PROJECT = ROOT.parent
CACHE = ROOT / ".cache"
for var, sub in [("TORCH_HOME", "torch"), ("HF_HOME", "hf"), ("HF_HUB_CACHE", "hf/hub"),
                 ("XDG_CACHE_HOME", "xdg"), ("HUGGINGFACE_HUB_CACHE", "hf/hub"),
                 ("TRANSFORMERS_CACHE", "hf/transformers"), ("MPLCONFIGDIR", "mpl"),
                 ("NUMBA_CACHE_DIR", "numba"), ("UV_CACHE_DIR", "uv")]:
    os.environ.setdefault(var, str(CACHE / sub))
    (CACHE / sub).mkdir(parents=True, exist_ok=True)

SONGS = PROJECT / "songs"


def _song() -> str:
    name = os.environ.get("SONG")
    if name:
        if not (SONGS / name / "song.json").is_file():
            raise SystemExit(f"SONG={name}: no songs/{name}/song.json")
        return name
    found = sorted(p.parent.name for p in SONGS.glob("*/song.json"))
    if len(found) != 1:
        raise SystemExit(f"set SONG to one of: {', '.join(found) or '(no songs)'}")
    return found[0]


SONG = _song()
SONG_DIR = SONGS / SONG
AUDIO = SONG_DIR / "song.mp3"
LYRICS_TXT = SONG_DIR / "lyrics.txt"
CONFIG = json.loads((SONG_DIR / "song.json").read_text(encoding="utf-8"))
DATA = SONG_DIR / "data"
QA = ROOT / "qa" / SONG
WORK = ROOT / "work" / SONG          # intermediate results (mix decode, whisper json, alignments)
STEMS = ROOT / "stems" / SONG / "htdemucs_ft" / "mix"
MIX_WAV = WORK / "mix.wav"
for _d in (QA, WORK, DATA):
    _d.mkdir(parents=True, exist_ok=True)


def part_ids(labels):
    """Unique section ids for a sequence of section labels ('Pre-Chorus' x2 ->
    'prechorus1', 'prechorus2'; 'Verse 1' -> 'verse1')."""
    slugs = [re.sub(r"[^a-z0-9]", "", lab.lower()) or "part" for lab in labels]
    seen = {}
    out = []
    for s in slugs:
        seen[s] = seen.get(s, 0) + 1
        n = slugs.count(s)
        out.append(s if n == 1 else f"{s}{'_' if s[-1].isdigit() else ''}{seen[s]}")
    return out


def load_lyrics():
    """Parse lyrics.txt (Suno format: '[Section]' headers, one sung line per
    line) -> list of dict(text, section, part). `section` is the header as
    written, `part` a unique id per section instance ('chorus2')."""
    lines, label, instance = [], "Lyrics", -1
    labels = []
    for raw in LYRICS_TXT.read_text(encoding="utf-8").splitlines():
        s = " ".join(raw.split())
        if not s:
            continue
        m = re.fullmatch(r"\[(.+)\]", s)
        if m:
            label = m.group(1).strip()
            instance = -1
            continue
        if instance < 0:
            labels.append(label)
            instance = len(labels) - 1
        lines.append(dict(text=s, section=label, instance=instance))
    ids = part_ids(labels)
    for ln in lines:
        ln["part"] = ids[ln.pop("instance")]
    if not lines:
        raise SystemExit(f"{LYRICS_TXT}: no lyric lines")
    return lines


def duration():
    """Song length (s) of the gapless decode."""
    import soundfile as sf
    return sf.info(str(MIX_WAV)).duration


def stem_offset():
    """Samples (44.1 kHz) by which the Demucs stems lag the mix (measured by stems.py)."""
    return int(json.loads((WORK / "stem_offset.json").read_text())["samples"])


def load_stem(name, sr=None, mono=True):
    """Load a Demucs stem, time-aligned to the gapless mp3 decode."""
    import soundfile as sf
    import numpy as np
    y, s = sf.read(STEMS / f"{name}.wav", dtype="float32", always_2d=True)
    assert s == 44100
    off = stem_offset()
    y = y[off:] if off >= 0 else np.pad(y, ((-off, 0), (0, 0)))
    y = y.mean(axis=1) if mono else y.T
    if sr and sr != s:
        import soxr
        y = soxr.resample(y, s, sr) if mono else np.stack([soxr.resample(c, s, sr) for c in y])
        s = sr
    return y, s


def load_vocal_source(name, sr=None):
    """'vocals' = Demucs vocal stem (mono sum), 'vocL'/'vocR' = its left/right
    channel (double-tracked parts are often panned L/R, so each channel is
    closer to a single voice)."""
    if name in ("vocL", "vocR"):
        y, s = load_stem("vocals", sr=sr, mono=False)
        return y[0 if name == "vocL" else 1], s
    return load_stem("vocals", sr=sr)


def load_mix(sr=44100, mono=True):
    import librosa
    y, s = librosa.load(str(MIX_WAV), sr=sr, mono=mono)
    return y, s


def beat_grid():
    """(beat period, first beat) from data/audio.json, or None before analyze.py has run."""
    p = DATA / "audio.json"
    if not p.exists():
        return None
    a = json.loads(p.read_text())
    return a["beat_period"], a["beats"][0]

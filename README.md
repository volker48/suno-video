# Suno song videos

Generative, code-rendered music videos with word-synced karaoke typography, for songs made with Suno. Every frame is a deterministic function of song time, so the live preview in the browser and the offline 1080p60 (or 4K60) export are identical.

A song goes from an mp3 to a video in three stages:

1. **Set up** a song folder from the Suno mp3 (title, artist and lyrics come from its tags).
2. **Analyze** it: stem separation, word-level lyric alignment, beat grid, sections, onsets and envelopes.
3. **Render** it: the default edit is a karaoke plate per section, which a song can replace plate by plate with its own scenes.

The step-by-step process, including alignment QA, is the `song-video` skill in [`.claude/skills/song-video/`](.claude/skills/song-video/SKILL.md). The engine and scene API are documented in [`docs/ENGINE.md`](docs/ENGINE.md).

The engine was built for [“I’m Upping My P(doom)”](https://www.youtube.com/watch?v=5EoO5413dBY); that video's 17 bespoke scenes, treatment and data are in the git history up to commit `bdbad53`.

## Layout

- `songs/<slug>/` — one folder per song:
  - `song.mp3` — the song (the time reference for everything).
  - `lyrics.txt` — the sung lyrics, Suno format (`[Verse 1]` headers, one sung line per line). It must match what is sung, repeats included.
  - `song.json` — title, artist, Suno id, pronunciation spellings, alignment corrections, analysis overrides.
  - `data/lyrics.json` — word-level (and syllable-level) lyric timings, with each line's section.
  - `data/audio.json` — tempo, beats, downbeats, sections, drum/vocal onsets and loudness envelopes.
- `analysis/` — Python (uv) tools that produce the data: `pipeline.py` sets up songs and runs the steps (Demucs stems, CTC forced alignment cross-checked with Whisper, beat/downbeat/onset analysis).
- `app/` — the renderer: TypeScript + three.js, bun + Vite.
  - `src/engine/` — renderer core: timeline playback, post-processing (bloom, halation, grain), typography (Archivo, IBM Plex Mono, Cormorant Garamond, single-stroke plotter fonts), GPU line batches.
  - `src/scenes/` — scenes any song can use (`lyrics`: the karaoke plate).
  - `src/timeline.ts` — the default edit (one plate per section) and the helpers for a song's own edit in `src/songs/<slug>/timeline.ts`, with its scenes in `src/songs/<slug>/scenes/`.
  - `scripts/render.ts` — offline renderer (headless Chrome → raw frames over WebSocket → ffmpeg).
- `out/` — renders (not in the repo).

## Requirements

[bun](https://bun.sh) 1.4 or newer, Google Chrome (the offline renderer drives it headless through playwright-core) and ffmpeg with libx264. The analysis needs [uv](https://docs.astral.sh/uv/) and an Apple Silicon Mac (Whisper runs on MLX); the renderer doesn't.

## Add a song

```sh
cd analysis
uv run python pipeline.py new ~/Downloads/"Dance, Gryffy.mp3"   # -> songs/dance-gryffy/
uv run python pipeline.py run dance-gryffy --plots
```

`run` executes `stems`, `feats`, `emissions`, `whisper`, `align` and `analyze` in order (`--from align` or `--only analyze` to redo part of it) and prints a QA table: lines Whisper doesn't hear where they were aligned, low-confidence words, the tempo fit, downbeat scores and the section map. QA plots go to `analysis/qa/<slug>/`. Fix mismatches in `lyrics.txt` or `song.json` and rerun from `align`.

The first run downloads about 4 GB of model weights into `analysis/.cache/`; stems and intermediates go to `analysis/stems/` and `analysis/work/` (all gitignored).

## Preview

```sh
cd app
bun install --frozen-lockfile
bunx vite
```

Open http://localhost:5173/?song=dance-gryffy and use the keys below (`?song=` is optional while there is a single song). `&t=23` starts at a given time.

| Key | Action |
|---|---|
| space | play / pause |
| ← / → | seek ±1 s (±5 s with shift) |
| `,` / `.` | step one frame |
| `[` / `]` | previous / next scene |
| `l` | loop the current scene |
| `h` | hide the UI |

The preview renders in real time on a recent Mac. The export is not real time and is heavier.

## Render the video

```sh
cd app
bun scripts/render.ts video --song dance-gryffy --samples auto --shutter 0.2   # -> out/dance-gryffy.mp4
```

- **Output:** 1920×1080 at 60 fps, x264 CRF 16, AAC audio from `songs/<slug>/song.mp3`.
- **Motion blur:** every frame is the average of many sub-frames spread over a short shutter (`--shutter 0.2`, a fifth of the frame time), so fast motion leaves a continuous streak instead of a few stepped copies. `--samples auto` picks the count per frame: 12 for a still frame, 36 for ordinary camera motion, 108 or 324 for whips, slams and fast zooms. It stops once more sub-frames would no longer change the image by more than `--tol` levels of 255 (default 3). `--samples N` takes a fixed N instead (`--samples 4` makes a quick draft). How it works: "Motion blur and sampling" in [`docs/ENGINE.md`](docs/ENGINE.md).
- **Other modes:** `stills`, `sheet` (contact sheets, `--cuts` for every scene boundary) and `perf`.

### 4K

```sh
cd app
bun scripts/render.ts video --song dance-gryffy --scale 2 --samples auto --shutter 0.2 --x264 aq-mode=3:rc-lookahead=30 --out ../out/dance-gryffy-4k.mp4
```

- **Output:** a true 3840×2160 render (not an upscale): every layer, line and shader is rendered at the physical resolution. Scenes are laid out in 1920×1080 logical pixels, so the 4K frame looks like the 1080p one, only sharper.
- **Cost:** GPU-bound; heavy 3D scenes at many sub-frames can take seconds per frame. Long renders can be split into segments (`--from`/`--to`) in parallel pipelines and joined with a lossless concat. Each pipeline uses about 5 GB for headless Chrome plus about 4 GB for ffmpeg; the shorter x264 lookahead above keeps ffmpeg's memory down.
- **Encoding:** the film grain is rendered per 4K pixel, which is expensive to encode: `--crf 18` or `--crf 20` cuts the bitrate a lot.
- `--scale 2` works with every mode. `stills` then saves full-resolution PNGs, and `perf` measures 4K frame times. In the browser preview, add `&scale=2` to the URL.

## Credits

- **Songs:** “Dance, Gryffy” (`songs/dance-gryffy/`), about Gryffy the Frenchton, made with Suno.
- **Fonts:** Archivo, IBM Plex Mono and Cormorant Garamond (SIL Open Font License). Single-stroke EMS and Hershey fonts via the `hersheytext` package (OFL / public domain).

## License

The code is released under the [MIT License](LICENSE). The fonts in `app/public/fonts/` keep their own licenses (see Credits), and the songs and lyrics (`songs/`) are not covered by it: they belong to their authors.

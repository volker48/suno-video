---
name: song-video
description: Turn a Suno song (mp3 with embedded lyrics, or mp3 + lyrics text) into a word-synced, code-rendered lyric music video in this repo. Covers creating songs/<slug>/, running the analysis pipeline (stems, forced alignment, beat grid, sections), QA and correction of the lyric timing, previewing and rendering the default karaoke video, and building a bespoke edit with custom scenes. Use when adding a new song, re-running or fixing a song's analysis or lyric timing, rendering a song video, or starting custom scenes for a song.
---

# Song video

Pipeline: `songs/<slug>/{song.mp3, lyrics.txt, song.json}` → `analysis/pipeline.py` → `songs/<slug>/data/{lyrics.json, audio.json}` → `app/` renders it. Commands below run from the repo root unless noted.

## 1. Set up the song

```sh
cd analysis && uv run python pipeline.py new <path/to/song.mp3> [--slug s] [--lyrics lyrics.txt]
```

- Reads title, artist and the Suno id (`comment` tag) and the lyrics Suno embeds in the ID3 lyrics frame. Prefer the embedded lyrics to lyrics pasted by the user: they are what Suno generated from. Pass `--lyrics` only when the mp3 has none.
- Existing `lyrics.txt` / `song.json` are never overwritten; delete them to regenerate.
- Before running, read the lyrics and add `song.json` `"pron"` spellings for acronyms, numbers and names the aligner's letters won't sound out (`"VIP": "vee eye pee"`, `"Gryffy": "griffy"`, `"2nd": "second"`). Keys match the token with or without edge punctuation. `SONG=<slug> uv run python pron.py` prints every token's spelling; tokens with digits fail loudly until spelled.
- Add `"whisper_prompt"`: one sentence that names the song's proper nouns and slang.

## 2. Run the analysis

```sh
cd analysis && uv run python pipeline.py run <slug> --plots
```

Steps: `stems` (ffmpeg decode + Demucs; prints the stem lag, expect ~0 and correlation > 0.99), `feats`, `emissions`, `whisper`, `align`, `analyze`. It takes a few minutes; the first run downloads ~4 GB of models. Redo part of it with `--from align` or `--only analyze` (`analyze` reads `lyrics.json`, so rerun it after `align`).

## 3. QA the alignment (do not skip)

`align` prints one row per line: start time, the share of words Whisper heard at the aligned place, and low-confidence words. `!` marks lines Whisper heard under half of.

1. **Read the Whisper transcript first** (it is printed by the `whisper` step; words with times are in `analysis/work/<slug>/whisper.json`). Suno often sings more than the prompt lyrics: repeated couplets at chorus ends, extra tag lines, ad-libs. Every *sung* lyric line must be in `lyrics.txt`, in order, or the aligner smears a line across two repetitions. Add missing repeats. Leave out short ad-libs and backing vocals (a garbage token absorbs them between lines); describe them in `song.json` `align.extras`.
2. **Compare timings for each `!` line and each low-confidence cluster.** Print Whisper's words and the aligned words side by side for the time range. Whisper mishears names ("graffiti" for Gryffy) but its timing is usually right. If the timing agrees and only the words differ, the line is fine.
3. **Look at the plot** `analysis/qa/<slug>/line_NN.png` (Read tool): the spectrogram with pitch, the final alignment, the fused CTC path, the single models (mms, lv60k) and Whisper. When the single models and Whisper agree against the fused path, pin the line with a window. For finer detail: `SONG=<slug> uv run python zoom.py lines 10 11` → `qa/<slug>/zl_*.png`.
4. **Correct in `song.json` `align`**, most general first, then rerun `--from align --plots`:
   - `line_windows: [{"line": 10, "lo": 39.4, "hi": 44.2, "note": "..."}]`: every word of the line must lie in the window. This is the usual fix for a line that lands on the wrong repetition or on an unlisted tag. Pinning one line can shift its neighbours, so recheck them.
   - `anchors: [{"line", "word", "sub": 0, "lo", "hi"}]`: constrains one sub-word on the CTC path.
   - `fix: [{"line", "word", "start"?, "end"?, "syl"?, "conf"?}]`: final boundaries, only where the plot clearly shows the result is wrong.
   Indices are 0-based, as printed. Put a `note` on each entry saying why.
5. **Check the music analysis** printed by `analyze`:
   - Kick drift per quarter should be within ±10 ms. If the tempo is half or double, set `"tempo": {"min", "max"}`.
   - The winning downbeat phase score should clearly beat the others. If not, set `"downbeat_phase"`.
   - Sections should start on downbeats matching the song's structure. Otherwise set `"section_bars": [[name, first bar|null, end bar|null], ...]`.
6. Record the lyric decisions in `align.notes` (e.g. "lyrics.txt follows the vocal, not the Suno prompt: ...").

## 4. Preview and render

```sh
cd app && bun install --frozen-lockfile        # once; needs bun >= 1.4
VIDEO_NO_HMR=1 bunx vite --port 5191 &         # a server without live reload for renders
bun scripts/render.ts sheet --url http://localhost:5191 --song <slug> --times 1.5,25,60,100,150 --cols 3 --out ../out/wip/sheet.png
bun scripts/render.ts video --url http://localhost:5191 --song <slug> --samples auto --shutter 0.2   # -> out/<slug>.mp4
```

- Always pass `--url` to a server you started: without it `render.ts` uses whatever answers on port 5173 (possibly another project's dev server), and the page never boots. When piping the renderer's output, `set -o pipefail` so a failed render isn't reported as success.

- Render a whole song in segments of about a minute (`--from/--to` on exact frame times, `--noaudio`). Then join them with ffmpeg's concat demuxer (`-c:v copy`) and mux `songs/<slug>/song.mp3` once as AAC. One headless page over a whole song can die partway through (it did at 94 s of 162 s), and a single audio mux avoids seams at the joins.
- Look at the stills and sheets (Read tool) before rendering the full video. Check that the sung word matches the vocal at a few times from the QA table, especially the corrected lines.
- A short clip with audio (`--from 23 --to 27 --preset veryfast`) proves sync cheaply; `ffprobe` it.
- The interactive preview is http://localhost:5173/?song=<slug>&t=23 (the user can scrub it with the audio).

## 5. Bespoke edit (optional, the creative phase)

The default edit (`defaultTimeline`) plays the shared `lyrics` karaoke plate once per section. To make the video the song's own:

1. Write `songs/<slug>/TREATMENT.md` with the user: the concept, palette, type voices, recurring motifs, and one plate per section with its lyric integration. The P(doom) treatment is a worked example of the depth that pays off: `git show bdbad53:docs/TREATMENT.md`.
2. Create `app/src/songs/<slug>/timeline.ts`, exporting a default `(lyrics, audio, song) => TimelineEntry[]`. Anchor cuts with `cuts(lyrics, audio).cut('first words of a line', nth)`. Use `scene('<slug>/<name>')` for bespoke scenes in `app/src/songs/<slug>/scenes/` and `scene('lyrics')` for sections still on the default plate. Replace plates one at a time.
3. Follow `docs/ENGINE.md` for the scene API, determinism rules, typography and 4K. P(doom)'s scenes show the idioms (engraving shaders, text on paths, raymarched rooms): `git show bdbad53:app/src/scenes/<name>.ts`.
4. Check each scene with `stills`/`sheet --only <entry id>` and typecheck with `cd app && bunx tsc --noEmit -p tsconfig.json`.

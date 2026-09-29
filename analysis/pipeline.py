"""Song setup and the analysis pipeline.

  uv run python pipeline.py new <song.mp3> [--slug s] [--lyrics lyrics.txt]
      Create songs/<slug>/ from a Suno mp3: song.mp3, lyrics.txt and song.json.
      Title, artist, Suno id and lyrics come from the mp3's tags (Suno embeds the
      lyrics in the ID3 lyrics frame); --lyrics overrides them. Existing
      lyrics.txt / song.json are kept.

  uv run python pipeline.py run <slug> [--from STEP] [--only STEP[,STEP]] [--plots]
      Run the analysis steps in order (each in its own process):
      stems, feats, emissions, whisper, align, analyze.
      --plots also writes the QA plots to analysis/qa/<slug>/.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
SONGS = HERE.parent / "songs"

STEPS = {
    "stems": ["stems.py"],
    "feats": ["vocal_feats.py"],
    "emissions": ["ctc_emissions.py"],
    "whisper": ["whisper_run.py"],
    "align": ["align.py"],
    "analyze": ["analyze.py"],
}
PLOTTING = {"align", "analyze"}


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "song"


def probe_tags(mp3: Path) -> dict:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format_tags", "-of", "json", str(mp3)],
                         check=True, capture_output=True, text=True).stdout
    return {k.lower(): v for k, v in json.loads(out).get("format", {}).get("tags", {}).items()}


def suno_meta(tags: dict) -> dict:
    """Suno writes 'made with suno; created=<iso>; id=<uuid>' into the comment tag."""
    fields = dict(re.findall(r"(\w+)=([^;]+)", tags.get("comment", "")))
    return {k: fields[k].strip() for k in ("id", "created") if k in fields}


def cmd_new(a):
    src = Path(a.mp3).resolve()
    tags = probe_tags(src)
    title = tags.get("title") or src.stem
    slug = a.slug or slugify(title)
    d = SONGS / slug
    d.mkdir(parents=True, exist_ok=True)
    dst = d / "song.mp3"
    if src != dst.resolve():
        shutil.copyfile(src, dst)
    lyr = d / "lyrics.txt"
    if not lyr.exists():
        text = Path(a.lyrics).read_text(encoding="utf-8") if a.lyrics else next(
            (v for k, v in tags.items() if k.startswith("lyrics")), "")
        if not text.strip():
            raise SystemExit(f"{src.name} has no embedded lyrics: pass --lyrics")
        lyr.write_text(text.strip() + "\n", encoding="utf-8")
    cfg = d / "song.json"
    if not cfg.exists():
        meta = {"title": title, "artist": tags.get("artist", "")}
        if suno := suno_meta(tags):
            meta["suno"] = suno
        meta |= {"pron": {}, "align": {"fix": []}}
        cfg.write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"songs/{slug}/: song.mp3, lyrics.txt, song.json")
    print(f"next: uv run python pipeline.py run {slug} --plots")


def cmd_run(a):
    if not (SONGS / a.slug / "song.json").is_file():
        raise SystemExit(f"no songs/{a.slug}/song.json (create it with: pipeline.py new <mp3>)")
    names = list(STEPS)
    if a.only:
        todo = a.only.split(",")
        unknown = set(todo) - set(names)
        if unknown:
            raise SystemExit(f"unknown steps {sorted(unknown)}; steps: {', '.join(names)}")
    else:
        todo = names[names.index(a.__dict__["from"]):]
    env = {**os.environ, "SONG": a.slug}
    for step in todo:
        args = STEPS[step] + (["--plots"] if a.plots and step in PLOTTING else [])
        print(f"\n== {step}: {' '.join(args)}", flush=True)
        subprocess.run([sys.executable, *args], cwd=HERE, env=env, check=True)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    n = sub.add_parser("new")
    n.add_argument("mp3")
    n.add_argument("--slug")
    n.add_argument("--lyrics")
    r = sub.add_parser("run")
    r.add_argument("slug")
    r.add_argument("--from", default="stems", choices=list(STEPS))
    r.add_argument("--only")
    r.add_argument("--plots", action="store_true")
    a = p.parse_args()
    {"new": cmd_new, "run": cmd_run}[a.cmd](a)


if __name__ == "__main__":
    main()

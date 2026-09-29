"""Run mlx-whisper (word timestamps) on the time-corrected vocal stem.

Writes work/<song>/whisper.json. Used as an independent cross-check of the CTC
forced alignment in align.py, and to spot lyric lines that were not sung as
written. song.json "whisper_prompt" can list unusual words (names, slang).

Run:  SONG=<slug> uv run python whisper_run.py
"""
import common
import json
import mlx_whisper
import soundfile as sf

MODEL = "mlx-community/whisper-large-v3-turbo"


def main():
    y, sr = common.load_stem("vocals", sr=16000)
    wav = common.WORK / "vocals16k.wav"
    sf.write(wav, y, sr)
    prompt = common.CONFIG.get("whisper_prompt") or f"Song lyrics: {common.CONFIG.get('title', '')}."
    res = mlx_whisper.transcribe(
        str(wav), path_or_hf_repo=MODEL, language="en",
        word_timestamps=True, condition_on_previous_text=False, initial_prompt=prompt,
        temperature=0.0, no_speech_threshold=None, hallucination_silence_threshold=None,
    )
    (common.WORK / "whisper.json").write_text(json.dumps(res, indent=1, default=float))
    for seg in res["segments"]:
        print(f"{seg['start']:7.2f} {seg['end']:7.2f} {seg['text']}")


if __name__ == "__main__":
    main()

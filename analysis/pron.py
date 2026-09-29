"""Display token -> pronunciation spelling used for CTC alignment.

Each display token (lyric line split on spaces) maps to one or more
pronunciation sub-words made of plain letters (and internal apostrophes).
Acronyms, numbers and odd spellings go in song.json "pron", keyed by the token
with or without its surrounding punctuation: {"VIP": "vee eye pee"}.
"""
import re

import common

PRON = common.CONFIG.get("pron", {})
EDGE_PUNCT = ".,!?;:\"'“”‘’()"


def pron(token: str) -> list[str]:
    spelled = PRON.get(token) or PRON.get(token.strip(EDGE_PUNCT))
    if spelled:
        return spelled.split()
    w = token.lower()
    w = w.replace("’", "'")
    w = re.sub(r"[^a-z' ]", " ", w)
    w = w.strip("' ")
    subs = [p.strip("'") for p in w.split() if p.strip("'")]
    if not subs or re.search(r"[0-9]", token):
        raise ValueError(f"no pronunciation for lyric token {token!r}: add it to song.json \"pron\"")
    return subs


if __name__ == "__main__":
    for ln in common.load_lyrics():
        print(ln["text"], "->", " | ".join(" ".join(pron(w)) for w in ln["text"].split(" ")))

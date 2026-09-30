// Per-word karaoke for The Gryffy Ball (TREATMENT.md Karaoke rules): lines are set as runs of
// pieces (a word, or part of a word split at an em dash), each drawn at its kerned position in the
// run. Sung words are full strength, unsung ones dim; the word being sung wipes on, and on paper a
// ball-green highlighter swipe runs behind it.
import { Lyrics, type Line, type Word } from '../../../engine/lyrics';
import { font, glyphX, measure } from '../../../engine/type';
import { rgba } from '../../../engine/palette';
import { clamp, smoothstep } from '../../../engine/util';

/** A drawable piece of a word: characters [c0, c1) of word.w. `joined` = no space before it. */
export interface Piece { text: string; word: Word; c0: number; c1: number; joined: boolean }

/** The pieces of a line's words, splitting "set—let" after the dash so the two halves can sit in different places. */
export function piecesOf(line: Line): Piece[] {
  const out: Piece[] = [];
  for (const w of line.words) {
    const k = w.w.indexOf('—');
    if (k > 0 && k < w.w.length - 1) {
      out.push({ text: w.w.slice(0, k + 1), word: w, c0: 0, c1: k + 1, joined: false });
      out.push({ text: w.w.slice(k + 1), word: w, c0: k + 1, c1: w.w.length, joined: true });
    } else out.push({ text: w.w, word: w, c0: 0, c1: w.w.length, joined: false });
  }
  return out;
}

/** Sung progress (0..1) of a piece: its share of its word's progress, by characters. */
export function pieceProgress(p: Piece, t: number) {
  const n = p.word.w.length;
  return clamp((Lyrics.wordProgress(p.word, t) * n - p.c0) / (p.c1 - p.c0));
}

export interface RunStyle {
  family: string;
  size: number;
  /** Ink of sung text, and the opacity of unsung text. */
  ink: string;
  dim: number;
  /** Highlighter swipe colour behind the word being sung (paper plates), or null. */
  swipe?: string | null;
  /** Colour of the word being sung (dark plates: ball green), default ink. */
  lit?: string;
  /** Unsung words appear this long (s) before they are sung. */
  lead?: number;
  /** Overall opacity. */
  alpha?: number;
}

/** The run's text (pieces joined with spaces, except joined halves). */
export const runText = (ps: Piece[]) => ps.map((p, i) => (i && !p.joined ? ' ' : '') + p.text).join('');

/** Draws a run of pieces left-aligned at (x, baseline y); returns its width. */
export function drawRun(c: CanvasRenderingContext2D, ps: Piece[], x: number, y: number, t: number, st: RunStyle) {
  const text = runText(ps);
  const a0 = st.alpha ?? 1;
  const lead = st.lead ?? 0.4;
  c.font = font(st.family, st.size);
  c.textBaseline = 'alphabetic';
  let ci = 0;
  const places = ps.map((p, i) => {
    if (i && !p.joined) ci++;
    const x0 = x + glyphX(text, ci, st.family, st.size);
    const x1 = x + glyphX(text, ci + Array.from(p.text).length, st.family, st.size);
    ci += Array.from(p.text).length;
    return { p, x0, x1 };
  });
  for (const { p, x0, x1 } of places) {
    const k = pieceProgress(p, t);
    const shown = smoothstep(p.word.start - lead, p.word.start - lead + 0.2, t);
    if (shown <= 0) continue;
    // the swipe: runs on with the word, then fades once the word is done
    if (st.swipe && k > 0) {
      const fade = 1 - smoothstep(p.word.end + 0.15, p.word.end + 0.5, t);
      if (fade > 0) {
        c.globalAlpha = a0 * fade;
        c.fillStyle = st.swipe;
        c.fillRect(x0 - st.size * 0.06, y - st.size * 0.74, (x1 - x0 + st.size * 0.12) * k, st.size * 0.86);
      }
    }
    // unsung, then the sung part clipped on top
    c.globalAlpha = a0 * shown * st.dim;
    c.fillStyle = st.ink;
    c.fillText(p.text, x0, y);
    if (k > 0) {
      c.save();
      c.beginPath(); c.rect(x0 - 4, y - st.size * 1.2, (x1 - x0 + 8) * k, st.size * 1.6); c.clip();
      c.globalAlpha = a0;
      const singing = k < 1 && t < p.word.end;
      c.fillStyle = singing && st.lit ? st.lit : st.ink;
      c.fillText(p.text, x0, y);
      c.restore();
    }
  }
  c.globalAlpha = 1;
  return places.length ? places[places.length - 1]!.x1 - x : 0;
}

export const PAPER_RUN = (family: string, size: number): RunStyle => ({ family, size, ink: rgba('ink'), dim: 0.22, swipe: rgba('signal') });

/** Greedy word wrap of a run of pieces into rows no wider than maxW (a joined half stays with its word). */
export function wrapRun(ps: Piece[], family: string, size: number, maxW: number): Piece[][] {
  const rows: Piece[][] = [];
  let row: Piece[] = [];
  for (const p of ps) {
    const next = [...row, p];
    if (row.length && !p.joined && measure(runText(next), family, size) > maxW) { rows.push(row); row = [{ ...p, joined: false }]; }
    else row = next;
  }
  if (row.length) rows.push(row);
  return rows;
}

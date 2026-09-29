// Shared karaoke plate: the default scene for every section of a song without its own edit (see
// timeline.ts defaultTimeline), and a baseline to replace plate by plate with bespoke scenes.
// The section's lines scroll up as they come due; each word wipes from dim to bone as it is sung
// (per syllable where the aligner split the word), the word being sung in signal. Sections without
// lyrics (intro, instrumentals, outro) show the title card. params.label = the lyrics.txt header,
// which picks the voice: choruses loud (wide heavy grotesk), bridge/outro soft (serif italic).
import type * as THREE from 'three';
import { Scene, type Frame } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { Lyrics, type Line } from '../engine/lyrics';
import { F, fitSize, font, glyphX, measure, smart } from '../engine/type';
import { HEX, rgba, type PaletteKey } from '../engine/palette';
import { clamp, ease, lerp, prog, smoothstep } from '../engine/util';

const MARGIN = 160;
const BASE_Y = H * 0.56;

interface Voice { family: string; size: number; gap: number; energy: number }

export default class LyricsScene extends Scene {
  bg = new FSPass(/* glsl */ `
    uniform float t, level, kick, energy;
    void main() {
      vec2 p = FRAG_PX / vec2(${W}.0, ${H}.0);
      float n = fbm(vec3(p * vec2(2.4, 1.35), t * 0.04), 4);
      vec3 col = mix(C_INK, C_INK2, smoothstep(-0.4, 0.7, n));
      // warm glow behind the text block, breathing with the mix and the kick
      float glow = exp(-2.4 * length((p - vec2(0.24, 0.42)) * vec2(1.3, 1.0)));
      col += C_SIGNAL * glow * energy * (0.025 + 0.06 * level + 0.08 * kick);
      fragColor = vec4(col, 1.0);
    }`, { t: { value: 0 }, level: { value: 0 }, kick: { value: 0 }, energy: { value: 0 } });
  text = new Layer2D();
  lines: Line[] = [];
  voice!: Voice;
  label = '';

  override init() {
    const { lyrics, start, end, params } = this.ctx;
    this.label = String(params.label ?? '');
    this.lines = lyrics.lines.filter((l) => l.start >= start - 0.05 && l.start < end);
    const kind = this.label.toLowerCase();
    const loud = /chorus|hook|drop/.test(kind) && !/pre/.test(kind);
    const soft = /bridge|outro/.test(kind);
    const family = loud ? F.archivo(87.5, 900) : soft ? F.serif(600, true) : F.archivo(100, 700);
    // one size per section, so lines don't change size as they scroll
    const widest = Math.max(1, ...this.lines.map((l) => measure(l.text, family, 100)));
    const size = Math.min(loud ? 128 : soft ? 124 : 100, (100 * (W - 2 * MARGIN)) / widest);
    this.voice = { family, size, gap: size * 1.3, energy: loud ? 1 : soft ? 0.35 : 0.6 };
  }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp, audio, start, end } = this.ctx;
    const u = this.bg.u;
    u.t!.value = f.t;
    u.level!.value = f.a.rms;
    u.kick!.value = f.a.kick;
    u.energy!.value = this.voice.energy;
    this.bg.render(renderer, out);

    const L = this.text;
    L.clear();
    const c = L.ctx;
    if (this.lines.length) this.drawLyrics(c, f.t);
    else this.drawTitle(c, f);
    this.drawMeter(c, f);
    comp.draw(renderer, L.upload(), out);

    // fade in from black at the top of the song, out at the very end
    const fade = Math.max(start <= 0 ? 1 - smoothstep(0, 1.2, f.t) : 0, end >= audio.duration - 0.01 ? smoothstep(end - 2.5, end, f.t) : 0);
    return { zoom: 1 + 0.005 * f.a.kick * this.voice.energy, bloom: 0.4, fade };
  }

  /** Scrolls so each line reaches the reading position just before its first word. */
  private drawLyrics(c: CanvasRenderingContext2D, t: number) {
    const ls = this.lines;
    let s = 0;
    for (let k = 1; k < ls.length; k++) s += prog(t, ls[k]!.start - 0.4, ls[k]!.start - 0.05, ease.inOutCubic);
    const enter = smoothstep(this.ctx.start, this.ctx.start + 0.25, t);
    for (let k = 0; k < ls.length; k++) {
      const d = k - s; // 0 = reading position, < 0 above (sung), > 0 below (upcoming)
      if (Math.abs(d) > 1.6) continue;
      const a = lerp(1, d < 0 ? 0.25 : 0.3, clamp(Math.abs(d))) * (1 - smoothstep(1, 1.6, Math.abs(d)));
      this.drawLine(c, ls[k]!, MARGIN, BASE_Y + d * this.voice.gap, a * enter, t);
    }
  }

  private drawLine(c: CanvasRenderingContext2D, line: Line, x: number, y: number, alpha: number, t: number) {
    const { family, size } = this.voice;
    c.font = font(family, size);
    c.textBaseline = 'alphabetic';
    let i = 0; // char index of the word in line.text
    for (const w of line.words) {
      const wx = x + glyphX(line.text, i, family, size);
      i += Array.from(w.w).length + 1;
      const p = Lyrics.wordProgress(w, t);
      if (p < 1) {
        c.fillStyle = rgba('bone', 0.3 * alpha);
        c.fillText(w.w, wx, y);
      }
      if (p <= 0) continue;
      // the sung word glows signal, cooling to bone just after it ends
      c.fillStyle = mix('signal', 'bone', smoothstep(w.end, w.end + 0.3, t), alpha);
      if (p >= 1) { c.fillText(w.w, wx, y); continue; }
      c.save();
      c.beginPath();
      c.rect(wx - size * 0.2, y - size * 1.2, size * 0.2 + measure(w.w, family, size) * p, size * 1.6);
      c.clip();
      c.fillText(w.w, wx, y);
      c.restore();
    }
  }

  private drawTitle(c: CanvasRenderingContext2D, f: Frame) {
    const { song, start } = this.ctx;
    const title = smart(song.meta.title);
    const family = F.serif(600, true);
    const size = Math.min(170, fitSize(title, family, W - 2 * MARGIN));
    const a = prog(f.t, start, start + 1.2, ease.outCubic);
    c.textBaseline = 'alphabetic';
    c.font = font(family, size);
    c.fillStyle = rgba('bone', a);
    c.fillText(title, MARGIN, BASE_Y + (1 - a) * 24);
    // a signal rule that grows bar by bar through the section
    const bars = Math.max(1, this.ctx.audio.barAt(this.ctx.end) - this.ctx.audio.barAt(start));
    const k = clamp((f.bar - this.ctx.audio.barAt(start)) / bars);
    c.fillStyle = rgba('signal', a);
    c.fillRect(MARGIN, BASE_Y + 44, (W - 2 * MARGIN) * k, 2);
    if (song.meta.artist) {
      c.font = font(F.mono(500), 22);
      c.letterSpacing = '4px';
      c.fillStyle = rgba('ash', a);
      c.fillText(song.meta.artist.toUpperCase(), MARGIN, BASE_Y + 96);
      c.letterSpacing = '0px';
    }
  }

  /** Section label and a beat meter (one square per beat of the bar, the current one lit). */
  private drawMeter(c: CanvasRenderingContext2D, f: Frame) {
    const { audio, start } = this.ctx;
    const a = smoothstep(start, start + 0.4, f.t) * 0.8;
    c.font = font(F.mono(500), 16);
    c.letterSpacing = '4px';
    c.textBaseline = 'alphabetic';
    c.fillStyle = rgba('ash', a);
    c.fillText(this.label.toUpperCase(), MARGIN, 128);
    c.letterSpacing = '0px';
    const perBar = Math.max(1, Math.round(audio.beats.length / Math.max(1, audio.downbeats.length)));
    const beat = Math.floor(f.barPhase * perBar);
    for (let b = 0; b < perBar; b++) {
      const lit = b === beat ? 1 - 0.6 * (f.barPhase * perBar - beat) : 0;
      c.fillStyle = lit > 0 ? mix('signal', 'graphite', 1 - lit, a) : rgba('graphite', a);
      c.fillRect(W - MARGIN - (perBar - b) * 22, 114, 12, 12);
    }
  }
}

/** Palette colour between two keys, as CSS. */
function mix(from: PaletteKey, to: PaletteKey, k: number, alpha = 1) {
  const rgb = (key: PaletteKey) => { const n = parseInt(HEX[key].slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const [a, b] = [rgb(from), rgb(to)];
  return `rgba(${a.map((v, i) => Math.round(v + (b[i]! - v) * k)).join(',')},${alpha})`;
}

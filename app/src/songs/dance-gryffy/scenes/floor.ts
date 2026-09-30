// floor — "The Gryffy, a basic figure" (TREATMENT.md), chorus 1 up to "…right back around".
// Top-down on the dark parquet. "tear up the floor": the giraffe drops off the lens, leaving a nose
// print that a cloth wipes off, and Gryffy zooms across with the planks flying up behind him.
// "Little black-and-white blur…": he laps the floor as a streak and the lyric stretches with his
// speed; on "back" he turns round. "Snort, spin…": the chalk dance chart, paw prints stamped round
// the ball on the beats, the lyric riding the arc.
import type * as THREE from 'three';
import { Scene, type Frame } from '../../../engine/scene';
import { Layer2D, W, H, clearRT } from '../../../engine/gl';
import { LIN, rgba } from '../../../engine/palette';
import { F, font, layout, measure } from '../../../engine/type';
import { Lyrics, type Line } from '../../../engine/lyrics';
import { clamp, ease, hash, lerp, prog, pulse, smoothstep, springStep, TAU } from '../../../engine/util';
import { drawSmear, drawTop, type TopPose } from './gryffy';
import { drawRun, piecesOf, runText, type RunStyle } from './karaoke';
import { drawNosePrint, drawSmoosh } from './smoosh';
import { type Cam, drawParquet, PLANK, ROW, withCam } from './parquet';
import { ball, paw } from './props';

const PATH_Y = 330;
const CHART: [number, number, number] = [1150, 610, 285];

export default class Floor extends Scene {
  layer = new Layer2D();
  l6!: Line; l7!: Line; l8!: Line;
  bp = 0.45;
  /** The zoomies run across the floor in the first movement. */
  run0 = 0; run1 = 0;
  /** Beats the chart's paw prints land on. */
  steps: number[] = [];

  override init() {
    const { lyrics, audio } = this.ctx;
    this.l6 = lyrics.get('tear up the floor', 0);
    this.l7 = lyrics.get('black-and-white blur', 0);
    this.l8 = lyrics.get('Snort, spin', 0);
    this.bp = 60 / audio.bpm;
    // he goes once the giraffe has dropped off the lens, flat out through "tear up"
    this.run0 = this.ctx.start + 0.14;
    this.run1 = this.run0 + 0.8;
    const b0 = Math.ceil(audio.beatAt(this.l8.start));
    this.steps = Array.from({ length: 8 }, (_, i) => audio.timeOfBeat(b0 + i));
  }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp } = this.ctx;
    const t = f.t;
    clearRT(renderer, out, LIN.ink);
    const L = this.layer;
    L.clear(rgba('ink'));
    const c = L.ctx;
    let post = {};
    if (t < this.l7.start - 0.05) post = this.tearUp(c, t);
    else if (t < this.l8.start - 0.05) post = this.blur(c, t);
    else post = this.chart(c, t);
    this.houseRule(c, t);
    comp.draw(renderer, L.upload(), out);
    return { bloom: 0.45, halation: 0, ca: 0.5, vignette: 0.4, grain: 0.05, ...post };
  }

  // ---------------------------------------------------------------- 1. tear up the floor

  private runX(t: number) { return lerp(-350, 2350, (t - this.run0) / (this.run1 - this.run0)); }

  private tearUp(c: CanvasRenderingContext2D, t: number) {
    const cam: Cam = { x: W / 2, y: H / 2, zoom: 1, rot: 0 };
    // a plank on the run's rows is torn up as he passes over it
    const rows = new Set([Math.floor((PATH_Y - 40) / ROW), Math.floor(PATH_Y / ROW), Math.floor((PATH_Y + 40) / ROW)]);
    const passT = (x: number) => this.run0 + ((x + 350) / 2700) * (this.run1 - this.run0);
    const peel = (r: number, i: number) => {
      if (!rows.has(r)) return 0;
      const off = ((r * 149) % PLANK + PLANK) % PLANK;
      return prog(t, passT(off + i * PLANK + PLANK / 2) + 0.03, passT(off + i * PLANK + PLANK / 2) + 0.6);
    };
    withCam(c, cam, () => {
      drawParquet(c, cam, peel);
      // the torn planks fly up at the camera, spinning, then fall away
      for (const r of rows) {
        const off = ((r * 149) % PLANK + PLANK) % PLANK;
        for (let i = -2; i < 8; i++) {
          const k = peel(r, i);
          if (k <= 0 || k >= 1) continue;
          const x = off + i * PLANK + PLANK / 2, y = r * ROW + ROW / 2;
          const up = Math.sin(Math.PI * k);
          c.save();
          c.translate(x + 60 * k * (hash(r, i) - 0.5), y - 220 * up - 120 * k);
          c.rotate((hash(i, r) - 0.5) * 2.2 * k);
          const sc = 1 + 0.45 * up;
          c.scale(sc, sc * Math.abs(Math.cos(k * 2.6)) + 0.08);
          c.globalAlpha = 0.85 * (1 - smoothstep(0.55, 1, k));
          c.fillStyle = '#26262A'; c.fillRect(-PLANK / 2, -ROW / 2, PLANK, ROW);
          c.strokeStyle = rgba('ash', 0.25); c.lineWidth = 1;
          c.beginPath(); c.moveTo(-PLANK / 2 + 12, -8); c.lineTo(PLANK / 2 - 12, -4); c.moveTo(-PLANK / 2 + 12, 12); c.lineTo(PLANK / 2 - 12, 10); c.stroke();
          c.strokeStyle = rgba('bone', 0.5); c.lineWidth = 1.5; c.strokeRect(-PLANK / 2, -ROW / 2, PLANK, ROW);
          c.restore();
        }
      }
      // Gryffy, flat out
      if (t > this.run0 - 0.1 && t < this.run1 + 0.1) {
        drawSmear(c, Array.from({ length: 12 }, (_, g) => [this.runX(t - g * 0.02) - 120, PATH_Y] as [number, number]), 150);
        drawTop(c, this.topAt(this.runX(t), PATH_Y, 0, t, 1.3, 400));
      }
    });
    // the lyric, set into the floor above his lane
    const st: RunStyle = { family: F.archivo(100, 900), size: 150, ink: rgba('bone'), dim: 0.22, lit: rgba('signal'), lead: 3 };
    const ps = piecesOf(this.l6);
    drawRun(c, ps.slice(0, 2), 170, 720, t, st);
    drawRun(c, ps.slice(2), 170, 880, t, st);
    // the giraffe drops off the lens, and the nose print stays until a cloth wipes it off
    const t0 = this.ctx.start;
    const pull = prog(t, t0, t0 + 0.24);
    if (pull < 1) drawSmoosh(c, { approach: 1, push: 0.9, pull, fold: 0 });
    const wipe = this.l6.words[5]!.start; // "floor"
    const wx = prog(t, wipe, wipe + 0.35, ease.inOutCubic) * (W + 900) - 450;
    c.save();
    c.beginPath(); c.rect(wx, 0, W, H); c.clip();
    drawNosePrint(c, smoothstep(t0 + 0.1, t0 + 0.3, t));
    c.restore();
    if (wx > -450 && wx < W + 450) {
      const g = c.createLinearGradient(wx - 260, 0, wx + 40, 0);
      g.addColorStop(0, rgba('bone', 0)); g.addColorStop(0.8, rgba('bone', 0.1)); g.addColorStop(1, rgba('bone', 0));
      c.fillStyle = g; c.fillRect(wx - 260, 0, 300, H);
    }
    const k = pulse(t, this.run0, 0.1);
    return { shake: [Math.sin(t * 83) * 8 * k, Math.cos(t * 71) * 6 * k] as [number, number] };
  }

  private topAt(x: number, y: number, heading: number, t: number, stretch: number, s = 250): TopPose {
    return { x, y, s, heading, phase: t * TAU * 5.5, stride: 1, stretch, wind: 0.6, turn: 0 };
  }

  // ---------------------------------------------------------------- 2. the blur

  /** Angle round the lap at t: one lap per 1.15 s, reversing on "back". */
  private lapAngle(t: number) {
    const w = TAU / 1.15;
    const t0 = this.l7.start, tb = this.l7.words[4]!.start;
    if (t < tb) return Math.PI + w * (t - t0);
    // decelerate, turn, and go back the other way
    const a = Math.PI + w * (tb - t0);
    const d = t - tb;
    return a + w * 0.12 * (1 - Math.exp(-d / 0.06)) - w * Math.max(0, d - 0.12) * smoothstep(0.12, 0.3, d);
  }

  private blur(c: CanvasRenderingContext2D, t: number) {
    const cam: Cam = { x: 960 + 400, y: 540 - 900, zoom: 0.95, rot: 0.1 * Math.sin((t - this.l7.start) * 0.9) };
    const cx = cam.x, cy = cam.y, rx = 780, ry = 360;
    withCam(c, cam, () => {
      drawParquet(c, cam);
      const at = (tt: number) => {
        const a = this.lapAngle(tt);
        return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), a };
      };
      const p = at(t), q = at(t + 0.01);
      const heading = Math.atan2(q.y - p.y, q.x - p.x);
      drawSmear(c, Array.from({ length: 16 }, (_, g) => { const s = at(t - 0.02 - g * 0.018); return [s.x, s.y] as [number, number]; }), 140);
      drawTop(c, this.topAt(p.x, p.y, heading, t, 1.35, 360));
    });
    // the lyric stretches with his speed: condensed, flat out on "blur", pulled in on "back", out again on "more"
    const w7 = this.l7.words;
    const widths: [number, number][] = [[w7[0]!.start, 62], [w7[2]!.start, 125], [w7[4]!.start, 75], [w7[6]!.start, 125]];
    let width = 62;
    for (const [ts, wd] of widths) if (t >= ts) width = wd;
    const fam = F.archivo(width, 900);
    const ps = piecesOf(this.l7);
    const lines = [ps.slice(0, 3), ps.slice(3)];
    const size = Math.min(170, ...lines.map((l) => (1500 * 100) / measure(runText(l), fam, 100)));
    const st: RunStyle = { family: fam, size, ink: rgba('bone'), dim: 0.22, lit: rgba('signal') };
    lines.forEach((l, i) => {
      const wdt = measure(runText(l), fam, size);
      drawRun(c, l, W / 2 - wdt / 2, 500 + i * size * 1.02, t, st);
    });
    return { zoom: 1 + 0.01 * pulse(t, w7[2]!.start, 0.12) };
  }

  // ---------------------------------------------------------------- 3. the chart

  private chart(c: CanvasRenderingContext2D, t: number) {
    const [cx, cy, R] = CHART;
    const cam: Cam = { x: W / 2, y: H / 2, zoom: 1, rot: 0 };
    const w8 = this.l8.words;
    const fc: Cam = { ...cam, x: 3000, y: 1800 };
    withCam(c, fc, () => drawParquet(c, fc));
    // chalk circle
    c.save();
    c.strokeStyle = rgba('bone', 0.35); c.lineWidth = 2; c.setLineDash([4, 12]);
    c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
    c.setLineDash([]);
    c.restore();
    // paw prints: eight steps round the circle, one per beat, left and right forepaws
    const angle = (i: number) => -Math.PI / 2 - 0.35 + (i / 8) * TAU;
    this.steps.forEach((ts, i) => {
      if (t < ts - 0.02) return;
      const a = angle(i), side = i % 2 ? 1 : -1;
      const x = cx + (R + side * 24) * Math.cos(a), y = cy + (R + side * 24) * Math.sin(a);
      const pop = springStep(t - ts + 0.02, 5, 0.45);
      const current = t < (this.steps[i + 1] ?? Infinity);
      c.save();
      c.translate(x, y); c.rotate(a + Math.PI); c.scale(pop, pop);
      c.fillStyle = current ? rgba('signal') : rgba('bone', 0.85);
      paw(c, 26);
      c.restore();
      if (side > 0) {
        c.font = font(F.mono(500), 22); c.textAlign = 'center';
        c.fillStyle = current ? rgba('signal') : rgba('bone', 0.6);
        c.fillText(String(i + 1), cx + (R + 84) * Math.cos(a), cy + (R + 84) * Math.sin(a) + 8);
        c.textAlign = 'left';
      }
    });
    // the ball at the centre of the floor
    ball(c, cx, cy, 44, 1 + 0.08 * pulse(t, Math.floor(t / this.bp) * this.bp, 0.1));
    // Gryffy follows the prints round the circle; he spins on the spot on "spin"
    const spin0 = w8[1]!.start, spin1 = w8[1]!.end;
    const run = (tt: number) => clamp((tt - this.steps[0]!) / (this.steps[7]! - this.steps[0]! + this.bp));
    {
      const a = angle(0) + run(t) * TAU;
      const spin = prog(t, spin0, spin1, ease.inOutCubic) * TAU;
      const heading = a + Math.PI / 2 + spin;
      drawTop(c, { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), s: 270, heading, phase: t * TAU * 4, stride: 0.8, stretch: 1.1, wind: 0.3, turn: 0 });
    }
    // the snort: a short puff of breath from his nose on "Snort,"
    const sn = prog(t, w8[0]!.start, w8[0]!.start + 0.45);
    if (sn > 0 && sn < 1) {
      const a = angle(0) + run(t) * TAU, hd = a + Math.PI / 2;
      const nx = cx + R * Math.cos(a) + 150 * Math.cos(hd), ny = cy + R * Math.sin(a) + 150 * Math.sin(hd);
      c.strokeStyle = rgba('bone', 0.8 * (1 - sn)); c.lineWidth = 3;
      for (const da of [-0.35, 0, 0.35]) {
        const r0 = 12 + 40 * sn, r1 = r0 + 26;
        c.beginPath(); c.moveTo(nx + r0 * Math.cos(hd + da), ny + r0 * Math.sin(hd + da)); c.lineTo(nx + r1 * Math.cos(hd + da), ny + r1 * Math.sin(hd + da)); c.stroke();
      }
    }
    // the lyric riding the arc above the circle
    arcRun(c, this.l8, cx, cy, R + 205, t);
    // the manual's key, top left
    c.fillStyle = rgba('bone', 0.6);
    c.font = font(F.mono(500), 18); c.letterSpacing = '3px';
    c.fillText('THE GRYFFY · BASIC FIGURE', 150, 150);
    c.fillText('4/4 · 132 BPM · 8 COUNTS', 150, 182);
    c.fillRect(150, 206, 380, 1);
    const key: [string, string, number][] = [['1', 'SNORT', 0], ['2', 'SPIN', 1], ['3–4', 'BRING IT', 2], ['5–8', 'BACK AROUND', 5]];
    key.forEach(([n, label, wi], i) => {
      const w = w8[wi]!, next = key[i + 1] ? w8[key[i + 1]![2]]!.start : Infinity;
      const on = t >= w.start && t < next;
      c.fillStyle = on ? rgba('signal') : rgba('bone', t >= w.start ? 0.8 : 0.35);
      c.font = font(F.mono(500), 22);
      c.fillText(n, 150, 252 + i * 38);
      c.fillText(label, 230, 252 + i * 38);
    });
    c.letterSpacing = '0px';
    return {};
  }

  private houseRule(c: CanvasRenderingContext2D, t: number) {
    const a = smoothstep(this.l7.start, this.l7.start + 0.4, t);
    if (a <= 0) return;
    c.globalAlpha = a;
    c.fillStyle = rgba('bone', 0.5);
    c.font = font(F.mono(400), 16); c.letterSpacing = '2px';
    c.fillText('HOUSE RULE 3 · ZOOMING IS DISCOURAGED ON THE PARQUET', 150, 980);
    c.letterSpacing = '0px';
    c.globalAlpha = 1;
  }
}

/** A line set along an arc (centred at the top), glyph by glyph, sung glyphs bone, the word being sung ball green. */
function arcRun(c: CanvasRenderingContext2D, line: Line, cx: number, cy: number, r: number, t: number) {
  const fam = F.archivo(75, 900), size = 70;
  const lay = layout(line.text, fam, size, 1);
  const sung = Lyrics.lineCharProgress(line, t);
  // the word being sung, as a char range
  let ci = 0, cur: [number, number] = [-1, -1];
  for (const w of line.words) {
    const n = Array.from(w.w).length;
    if (t >= w.start && t < w.end) cur = [ci, ci + n];
    ci += n + 1;
  }
  c.font = font(fam, size);
  c.textAlign = 'center';
  for (const g of lay.glyphs) {
    const s = g.x + g.w / 2 - lay.width / 2;
    const a = -Math.PI / 2 + s / r;
    c.save();
    c.translate(cx + r * Math.cos(a), cy + r * Math.sin(a));
    c.rotate(a + Math.PI / 2);
    const lit = g.i >= cur[0] && g.i < cur[1];
    c.fillStyle = lit ? rgba('signal') : rgba('bone', g.i < sung ? 1 : 0.24);
    c.fillText(g.ch, 0, 0);
    c.restore();
  }
  c.textAlign = 'left';
}

// chorusline — "The Busby Berkeley number" (TREATMENT.md), chorus 2 up to "…you own this town".
// The giraffe drops off the lens as in chorus 1, then overhead: a dozen Gryffys on the black floor
// in formations that change every bar. "Little black-and-white blur": the ring spins into a pinwheel
// blur. "Snort, spin…": all twelve spin in unison on the beat. "My Frenchton king…": the formation
// folds into a crown, then the throne, the crown fitting at last. House rule 5.
import type * as THREE from 'three';
import { Scene, type Frame } from '../../../engine/scene';
import { Layer2D, W, H, clearRT } from '../../../engine/gl';
import { LIN, rgba } from '../../../engine/palette';
import { F, font } from '../../../engine/type';
import type { Line } from '../../../engine/lyrics';
import { ease, lerp, prog, pulse, smoothstep, springStep, TAU } from '../../../engine/util';
import { drawSmear, drawTop } from './gryffy';
import { drawRun, piecesOf, wrapRun, type RunStyle } from './karaoke';
import { photoPoint, Portrait, TUX_CROP } from './portrait';
import { drawNosePrint, drawSmoosh } from './smoosh';
import { crown } from './props';

const C0: [number, number] = [1310, 540];
const N = 12;
const RULE_5 = 'HOUSE RULE 5 · ZOOMING IS NOW MANDATORY';

export default class Chorusline extends Scene {
  layer = new Layer2D();
  front = new Layer2D();
  portrait = new Portrait();
  l: Line[] = [];
  bars: number[] = [];

  override async init() {
    const { lyrics, audio, start, end } = this.ctx;
    this.l = [lyrics.get('tear up the floor', 1), lyrics.get('black-and-white blur', 1), lyrics.get('Snort, spin', 1), lyrics.get('My Frenchton king', 1)];
    this.bars = audio.downbeats.filter((d) => d >= start - 0.01 && d < end);
    await this.portrait.load(this.ctx.song);
  }

  private w(li: number, wi: number) { return this.l[li]!.words[wi]!; }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp } = this.ctx;
    const t = f.t;
    clearRT(renderer, out, LIN.ink);
    this.layer.clear(rgba('ink')); this.front.clear();
    const c = this.layer.ctx;
    const king = this.w(3, 2).start, you = this.w(3, 3).start;
    if (t >= you - 0.02) {
      // the throne
      comp.draw(renderer, this.layer.upload(), out);
      const view = { ...TUX_CROP, cx: 1330, cy: 580, rx: 250, ry: 320, pitch: 4.5, reveal: prog(t, you, you + 0.4) };
      this.throne(c, view.cx, view.cy);
      comp.draw(renderer, this.layer.upload(), out);
      comp.draw(renderer, this.portrait.render(renderer, view), out);
      const f2 = this.front.ctx;
      const [hx, hy] = photoPoint(view, 0.37, 0.44);
      crown(f2, hx, hy - 10 * (1 - springStep(t - you, 3, 0.6)), 210);
      this.lyric(f2, t, 3);
      this.rule(f2, t);
      comp.draw(renderer, this.front.upload(), out);
      return { bloom: 0.45, halation: 0, ca: 0.4, vignette: 0.5 };
    }
    this.formation(c, t, king);
    const f2 = this.front.ctx;
    const li = t < this.l[1]!.start - 0.05 ? 0 : t < this.l[2]!.start - 0.05 ? 1 : t < this.l[3]!.start - 0.05 ? 2 : 3;
    this.lyric(f2, t, li);
    this.rule(f2, t);
    // the giraffe drops off the lens, the nose print wiped off on "floor"
    const t0 = this.ctx.start;
    const pull = prog(t, t0, t0 + 0.24);
    if (pull < 1) drawSmoosh(f2, { approach: 1, push: 0.9, pull, fold: -0.6 });
    const wipe = this.w(0, 3).start;
    const wx = prog(t, wipe, wipe + 0.35, ease.inOutCubic) * (W + 900) - 450;
    f2.save(); f2.beginPath(); f2.rect(wx, 0, W, H); f2.clip();
    drawNosePrint(f2, smoothstep(t0 + 0.1, t0 + 0.3, t));
    f2.restore();
    comp.draw(renderer, this.layer.upload(), out);
    comp.draw(renderer, this.front.upload(), out);
    const bar = this.bars.find((b) => t >= b && t < b + 0.2) ?? -1;
    return { bloom: 0.45, halation: 0, ca: 0.5, vignette: 0.5, zoom: 1 + 0.012 * (bar >= 0 ? pulse(t, bar, 0.1) : 0) };
  }

  /** Twelve Gryffys from above, in the formation of the current bar. */
  private formation(c: CanvasRenderingContext2D, t: number, king: number) {
    const [cx, cy] = C0;
    const bi = Math.max(0, this.bars.findIndex((b, i) => t >= b && t < (this.bars[i + 1] ?? Infinity)));
    const lt = t - (this.bars[bi] ?? this.ctx.start);
    const spin0 = this.w(2, 1).start, spin1 = this.w(2, 1).end;
    const blur0 = this.w(1, 1).start, blur1 = this.w(1, 3).start;
    const crownK = prog(t, king - 0.9, king, ease.inOutCubic);
    // a spotlight pool
    const g = c.createRadialGradient(cx, cy, 50, cx, cy, 620);
    g.addColorStop(0, rgba('bone', 0.08)); g.addColorStop(1, rgba('bone', 0));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const bloom = 1 + 0.08 * Math.sin(lt * TAU / 1.8);
    const blurSpin = prog(t, blur0, blur1, ease.inOutQuad) * TAU * 1.5;
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * TAU;
      // formations by bar: heads in, alternating rings, pinwheel
      const kind = bi % 3;
      let r = 310 * bloom, a = a0 + t * 0.4 + blurSpin, heading = a + Math.PI;
      if (kind === 1) { r = (i % 2 ? 400 : 230) * bloom; a = a0 + (i % 2 ? -1 : 1) * t * 0.6; heading = a + Math.PI; }
      if (kind === 2) { heading = a + Math.PI / 2; }
      // the crown: the ring squashes into a band with five points
      if (crownK > 0) {
        const u = i / (N - 1);
        const x = lerp(-320, 320, u), tip = [0, 3, 6, 8, 11].includes(i) ? 1 : 0;
        const y = 120 - tip * 260 - (i === 6 ? 60 : 0);
        const px = lerp(cx + r * Math.cos(a), cx + x, crownK), py = lerp(cy + r * Math.sin(a), cy + y, crownK);
        drawTop(c, { x: px, y: py, s: 170, heading: lerp(heading, -Math.PI / 2, crownK), phase: t * 8, stride: 0.4, stretch: 1, wind: 0, turn: 0 });
        continue;
      }
      const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      // all twelve spin on the spot on "spin,"
      const spin = prog(t, spin0, spin1, ease.inOutCubic) * TAU;
      const blurring = t > blur0 && t < blur1 + 0.2;
      if (blurring) drawSmear(c, Array.from({ length: 8 }, (_, k) => { const ak = a - (k + 1) * 0.06; return [cx + r * Math.cos(ak), cy + r * Math.sin(ak)] as [number, number]; }), 120);
      drawTop(c, { x, y, s: 230, heading: heading + spin + (blurring ? -Math.PI / 2 : 0), phase: t * TAU * 3 + i, stride: blurring ? 1 : 0.35, stretch: blurring ? 1.3 : 1, wind: 0.2, turn: 0 });
    }
  }

  private lyric(c: CanvasRenderingContext2D, t: number, li: number) {
    const st: RunStyle = { family: F.archivo(87.5, 900), size: 92, ink: rgba('bone'), dim: 0.22, lit: rgba('signal'), lead: 0.6 };
    const rows = wrapRun(piecesOf(this.l[li]!), st.family, st.size, 640);
    rows.forEach((r, i) => drawRun(c, r, 150, 540 - (rows.length - 1) * 52 + i * 104, t, st));
  }

  private rule(c: CanvasRenderingContext2D, t: number) {
    const a = smoothstep(this.l[1]!.start, this.l[1]!.start + 0.4, t);
    if (a <= 0) return;
    c.globalAlpha = a; c.fillStyle = rgba('bone', 0.55);
    c.font = font(F.mono(400), 16); c.letterSpacing = '2px';
    c.fillText(RULE_5, 150, 980);
    c.letterSpacing = '0px'; c.globalAlpha = 1;
  }

  /** A gilt throne behind the portrait: a tall back with finials, arms, a red-less (ink) velvet seat. */
  private throne(c: CanvasRenderingContext2D, x: number, y: number) {
    c.save();
    c.fillStyle = rgba('ink2'); c.strokeStyle = rgba('accent'); c.lineWidth = 10;
    const back = new Path2D();
    back.moveTo(x - 330, y + 420); back.lineTo(x - 330, y - 300); back.quadraticCurveTo(x - 330, y - 470, x, y - 500); back.quadraticCurveTo(x + 330, y - 470, x + 330, y - 300); back.lineTo(x + 330, y + 420); back.closePath();
    c.fill(back); c.stroke(back);
    for (const s of [-1, 1]) {
      c.fillStyle = rgba('accent');
      c.beginPath(); c.arc(x + s * 330, y - 320, 26, 0, TAU); c.fill();
      c.beginPath(); c.roundRect(x + s * 330 - 40, y + 150, 80, 280, 16); c.fill();
    }
    c.fillStyle = rgba('accent'); c.beginPath(); c.arc(x, y - 510, 30, 0, TAU); c.fill();
    c.restore();
  }
}

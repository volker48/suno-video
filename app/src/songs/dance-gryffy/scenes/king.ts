// king — the coronation line of chorus 1 (TREATMENT.md, floor: "My Frenchton king, you own this town").
// "My Frenchton king,": a gilt oval frame drops into a spotlight around his engraved portrait, and on
// "king" a crown is lowered onto his head, a size too big, and slips over one ear. "you own this
// town": cut to the deed of ownership, the town plan drawing itself, OWNER: GRYFFY stamped on "town",
// signed with a paw print.
import type * as THREE from 'three';
import { Scene, type Frame } from '../../../engine/scene';
import { Layer2D, W, H, clearRT } from '../../../engine/gl';
import { LIN, rgba } from '../../../engine/palette';
import { F, font } from '../../../engine/type';
import type { Line } from '../../../engine/lyrics';
import { ease, lerp, mulberry32, prog, pulse, springStep, TAU } from '../../../engine/util';
import { drawRun, PAPER_RUN, piecesOf, type RunStyle } from './karaoke';
import { paperPass } from './paper';
import { Portrait, TUX_CROP, type PortraitView } from './portrait';
import { paw } from './props';

const FRAME = { cx: 720, cy: 560, rx: 290, ry: 380 };
const CREST = { cx: 330, cy: 500, rx: 165, ry: 215 };
const MAP = { x0: 660, y0: 250, x1: 1770, y1: 900 };

export default class King extends Scene {
  back = new Layer2D();
  front = new Layer2D();
  paper = paperPass();
  portrait = new Portrait();
  line!: Line;
  streets: [number, number][][] = [];

  override async init() {
    this.line = this.ctx.lyrics.get('My Frenchton king', 0);
    await this.portrait.load(this.ctx.song);
    this.paper.u.seed!.value = 11;
    // the town plan: a loose grid of streets with a little wander, fixed by a seed
    const r = mulberry32(21);
    const { x0, y0, x1, y1 } = MAP;
    for (let i = 1; i < 7; i++) {
      const y = lerp(y0, y1, i / 7) + (r() - 0.5) * 30;
      this.streets.push([[x0, y], [lerp(x0, x1, 0.35), y + (r() - 0.5) * 40], [lerp(x0, x1, 0.7), y + (r() - 0.5) * 40], [x1, y + (r() - 0.5) * 30]]);
    }
    for (let i = 1; i < 9; i++) {
      const x = lerp(x0, x1, i / 9) + (r() - 0.5) * 40;
      this.streets.push([[x, y0], [x + (r() - 0.5) * 50, lerp(y0, y1, 0.5)], [x + (r() - 0.5) * 50, y1]]);
    }
  }

  private view(v: Partial<PortraitView> & { cx: number; cy: number; rx: number; ry: number }): PortraitView {
    return { ...TUX_CROP, ...v };
  }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp } = this.ctx;
    const t = f.t;
    const you = this.line.words[3]!.start;
    this.back.clear(); this.front.clear();
    if (t < you - 0.02) {
      clearRT(renderer, out, LIN.ink);
      this.spotlight(this.back.ctx, t);
      comp.draw(renderer, this.back.upload(), out);
      const drop = this.frameDrop(t);
      comp.draw(renderer, this.portrait.render(renderer, this.view({ ...FRAME, cy: FRAME.cy + drop, pitch: 5.5 })), out);
      this.coronation(this.front.ctx, t, drop);
      comp.draw(renderer, this.front.upload(), out);
      const k = pulse(t, this.line.words[2]!.start + 0.16, 0.08);
      return { bloom: 0.35, halation: 0, ca: 0.4, vignette: 0.5, shake: [0, 10 * k] as [number, number] };
    }
    this.paper.render(renderer, out);
    comp.draw(renderer, this.portrait.render(renderer, this.view({ ...CREST, pitch: 4, reveal: prog(t, you, you + 0.5) })), out);
    this.deed(this.front.ctx, t);
    comp.draw(renderer, this.front.upload(), out);
    const town = this.line.words[6]!.start;
    const k = pulse(t, town, 0.08);
    return { bloom: 0, halation: 0, ca: 0.3, vignette: 0.15, grain: 0.04, shake: [Math.sin(t * 80) * 10 * k, Math.cos(t * 67) * 8 * k] as [number, number] };
  }

  /** The frame falls in from above and lands with a bounce as "My" is sung. */
  private frameDrop(t: number) {
    const t0 = this.ctx.start;
    return -1100 * (1 - springStep(t - t0 - 0.05, 2.2, 0.5));
  }

  private spotlight(c: CanvasRenderingContext2D, t: number) {
    const on = prog(t, this.ctx.start, this.ctx.start + 0.3);
    const g = c.createRadialGradient(FRAME.cx, FRAME.cy - 40, 50, FRAME.cx, FRAME.cy, 720);
    g.addColorStop(0, rgba('bone', 0.16 * on)); g.addColorStop(1, rgba('bone', 0));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }

  /** The gilt frame, the crown, and the line. */
  private coronation(c: CanvasRenderingContext2D, t: number, drop: number) {
    const { cx, rx, ry } = FRAME, cy = FRAME.cy + drop;
    // gilt oval: a thick moulding with a bead inside
    c.save();
    for (const [w, col] of [[46, rgba('accent')], [30, '#C99842'], [12, rgba('accent')]] as const) {
      c.strokeStyle = col; c.lineWidth = w;
      c.beginPath(); c.ellipse(cx, cy, rx + 26, ry + 26, 0, 0, TAU); c.stroke();
    }
    c.fillStyle = '#F6D58E';
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * TAU;
      c.beginPath(); c.arc(cx + (rx + 6) * Math.cos(a), cy + (ry + 6) * Math.sin(a), 3.2, 0, TAU); c.fill();
    }
    c.strokeStyle = rgba('ink', 0.6); c.lineWidth = 1.5;
    c.beginPath(); c.ellipse(cx, cy, rx + 50, ry + 50, 0, 0, TAU); c.stroke();
    c.restore();
    // the crown: lowered on "king", a size too big; it settles, then slips down over his left ear
    const king = this.line.words[2]!;
    const head = this.photoToScreen(0.37, 0.44, cy);
    const land = springStep(t - king.start + 0.12, 3.2, 0.6);
    const slip = prog(t, king.start + 0.18, king.start + 0.42, ease.inOutCubic);
    if (t > king.start - 0.4) {
      const x = head[0] - 70 * slip;
      const y = lerp(head[1] - 700, head[1], land) + 80 * slip;
      crown(c, x, y, 260, -0.04 - 0.62 * slip);
    }
    // the line
    const st: RunStyle = { family: F.archivo(87.5, 900), size: 120, ink: rgba('bone'), dim: 0.22, lit: rgba('signal'), lead: 0.5 };
    const ps = piecesOf(this.line);
    drawRun(c, ps.slice(0, 2), 1120, 470, t, st);
    drawRun(c, ps.slice(2, 3), 1120, 700, t, { ...st, size: 240 });
  }

  /** A point of the photo (uv, y down) where the framed portrait shows it on screen. */
  private photoToScreen(u: number, v: number, cy: number): [number, number] {
    const hv = TUX_CROP.hv, hu = hv * (FRAME.rx / FRAME.ry) * (1448 / 1086);
    return [FRAME.cx + ((u - TUX_CROP.u) / hu) * FRAME.rx, cy + ((v - TUX_CROP.v) / hv) * FRAME.ry];
  }

  /** The deed: header, the crest's frame, the town plan drawing itself, the stamp and the paw signature. */
  private deed(c: CanvasRenderingContext2D, t: number) {
    const w = this.line.words;
    const you = w[3]!.start, town = w[6]!.start;
    const ink = rgba('ink');
    c.fillStyle = ink;
    c.font = font(F.serif(600, true), 76); c.fillText('Deed of Ownership', 150, 170);
    c.font = font(F.mono(500), 17); c.letterSpacing = '3px';
    c.fillText('THE TOWN, IN ITS ENTIRETY · WITH ALL SOFAS, RUGS AND BALLS', 152, 212);
    c.letterSpacing = '0px';
    // the crest's frame: a double hairline oval
    c.strokeStyle = ink; c.lineWidth = 2;
    c.beginPath(); c.ellipse(CREST.cx, CREST.cy, CREST.rx + 12, CREST.ry + 12, 0, 0, TAU); c.stroke();
    c.lineWidth = 0.8;
    c.beginPath(); c.ellipse(CREST.cx, CREST.cy, CREST.rx + 20, CREST.ry + 20, 0, 0, TAU); c.stroke();
    crown(c, CREST.cx - 4, CREST.cy - CREST.ry - 6, 120, -0.2);
    // the map: border, streets drawn in, a river, the park, the landmarks
    const { x0, y0, x1, y1 } = MAP;
    c.lineWidth = 2; c.strokeRect(x0, y0, x1 - x0, y1 - y0);
    c.lineWidth = 0.8; c.strokeRect(x0 - 8, y0 - 8, x1 - x0 + 16, y1 - y0 + 16);
    c.save();
    c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.clip();
    const draw = prog(t, you, you + 1.0, ease.outCubic);
    c.lineWidth = 6; c.strokeStyle = rgba('ink', 0.85);
    this.streets.forEach((s, i) => {
      const k = Math.min(1, Math.max(0, draw * 1.6 - i * 0.04));
      if (k <= 0) return;
      c.save(); c.setLineDash([2000 * k, 4000]);
      c.beginPath(); c.moveTo(s[0]![0], s[0]![1]); for (const p of s.slice(1)) c.lineTo(p[0], p[1]); c.stroke();
      c.restore();
    });
    // the river, hatched
    if (draw > 0.3) {
      c.strokeStyle = ink; c.lineWidth = 1.2;
      for (let k = -3; k <= 3; k++) {
        c.beginPath(); c.moveTo(x0, y0 + 480 + k * 7); c.bezierCurveTo(x0 + 400, y0 + 360 + k * 7, x0 + 700, y0 + 640 + k * 7, x1, y0 + 520 + k * 7); c.stroke();
      }
    }
    // landmarks, deadpan
    const marks: [string, number, number][] = [['THE SOFA', 0.2, 0.2], ['THE RUG', 0.52, 0.38], ['THE PARK', 0.8, 0.22], ['BALL STORAGE', 0.3, 0.62], ['NAP DISTRICT', 0.62, 0.84], ['THE VET (AVOID)', 0.76, 0.66]];
    c.font = font(F.mono(500), 17); c.letterSpacing = '2px';
    marks.forEach(([label, u, v], i) => {
      const a = prog(t, you + 0.3 + i * 0.12, you + 0.5 + i * 0.12);
      if (a <= 0) return;
      const x = lerp(x0, x1, u), y = lerp(y0, y1, v);
      c.globalAlpha = a;
      c.fillStyle = rgba('bone'); c.fillRect(x - 8, y - 20, c.measureText(label).width + 16, 28);
      c.fillStyle = ink; c.fillText(label, x, y);
      c.beginPath(); c.arc(x - 16, y - 6, 5, 0, TAU); c.fill();
      c.globalAlpha = 1;
    });
    c.letterSpacing = '0px';
    c.restore();
    c.font = font(F.mono(400), 14); c.letterSpacing = '2px'; c.fillStyle = ink;
    c.fillText('PLAN OF THE TOWN · SCALE: ONE ZOOMIE', x0, y1 + 36);
    c.letterSpacing = '0px';
    // the stamp on "town"
    if (t > town) {
      const s = 1 + 0.45 * (1 - prog(t, town, town + 0.07));
      c.save(); c.translate(1260, 600); c.rotate(-0.12); c.scale(s, s);
      c.strokeStyle = rgba('blood', 0.92); c.lineWidth = 7;
      c.strokeRect(-360, -72, 720, 144);
      c.lineWidth = 2.5; c.strokeRect(-346, -58, 692, 116);
      c.fillStyle = rgba('blood', 0.92); c.textAlign = 'center';
      c.font = font(F.archivo(75, 900), 96); c.fillText('OWNER: GRYFFY', 0, 34);
      c.textAlign = 'left';
      c.restore();
    }
    // signed with a paw
    const sig = town + 0.9;
    c.strokeStyle = ink; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(1420, 950); c.lineTo(1770, 950); c.stroke();
    c.font = font(F.mono(400), 14); c.letterSpacing = '2px'; c.fillText("OWNER'S MARK", 1420, 976); c.letterSpacing = '0px';
    if (t > sig) {
      c.save(); c.translate(1600, 914); c.rotate(0.25); c.scale(1 + 0.3 * (1 - prog(t, sig, sig + 0.08)), 1 + 0.3 * (1 - prog(t, sig, sig + 0.08)));
      c.fillStyle = rgba('ink', 0.9); paw(c, 22);
      c.restore();
    }
    // the line, set as the deed's operative clause
    const st = { ...PAPER_RUN(F.archivo(87.5, 900), 108), lead: 0.3 };
    const ps = piecesOf(this.line);
    drawRun(c, ps.slice(3, 5), 150, 850, t, st);
    drawRun(c, ps.slice(5), 150, 960, t, st);
  }
}

/** A crown: a gilt band with five points, pearls on the tips and one green stone. Base centre at (x, y), width w. */
function crown(c: CanvasRenderingContext2D, x: number, y: number, w: number, rot: number) {
  c.save();
  c.translate(x, y); c.rotate(rot);
  const h = w * 0.5;
  const p = new Path2D();
  p.moveTo(-w / 2, 0);
  const tips = 4;
  for (let i = 0; i <= tips * 2; i++) {
    const u = i / (tips * 2);
    const tip = i % 2 === 0;
    p.lineTo(-w / 2 + u * w, tip ? -h * (i === tips ? 1 : 0.82) : -h * 0.42);
  }
  p.lineTo(w / 2, 0);
  p.closePath();
  c.fillStyle = rgba('accent'); c.fill(p);
  c.strokeStyle = rgba('ink', 0.8); c.lineWidth = Math.max(1, w * 0.01); c.stroke(p);
  c.fillStyle = '#C99842'; c.fillRect(-w / 2, -h * 0.2, w, h * 0.2);
  c.strokeRect(-w / 2, -h * 0.2, w, h * 0.2);
  c.fillStyle = '#F6EFD8';
  for (let i = 0; i <= tips; i++) {
    const u = i / tips;
    c.beginPath(); c.arc(-w / 2 + u * w, -h * (i === tips / 2 ? 1 : 0.82) - w * 0.03, w * 0.035, 0, TAU); c.fill();
  }
  c.fillStyle = rgba('signal'); c.beginPath(); c.arc(0, -h * 0.1, w * 0.05, 0, TAU); c.fill();
  c.restore();
}

// rosette — "My silly Frenchton, best boy in town" (TREATMENT.md encore). The engraved portrait on the
// page of a show catalogue; on "best" a dog-show rosette in black, white and green swings in and is
// pinned to his lapel: BEST BOY IN TOWN.
import type * as THREE from 'three';
import { Scene, type Frame } from '../../../engine/scene';
import { Layer2D, W } from '../../../engine/gl';
import { rgba } from '../../../engine/palette';
import { F, font } from '../../../engine/type';
import type { Line } from '../../../engine/lyrics';
import { lerp, prog, pulse, springStep, TAU } from '../../../engine/util';
import { drawRun, PAPER_RUN, piecesOf } from './karaoke';
import { paperPass } from './paper';
import { photoPoint, Portrait, TUX_CROP, type PortraitView } from './portrait';

export default class Rosette extends Scene {
  paper = paperPass();
  layer = new Layer2D();
  portrait = new Portrait();
  line!: Line;

  override async init() {
    this.line = this.ctx.lyrics.get('My silly Frenchton');
    this.paper.u.seed!.value = 23;
    await this.portrait.load(this.ctx.song);
  }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp, start } = this.ctx;
    const t = f.t;
    this.paper.render(renderer, out);
    const view: PortraitView = { ...TUX_CROP, cx: 640, cy: 570, rx: 310, ry: 395, pitch: 5, reveal: prog(t, start, start + 0.7) };
    comp.draw(renderer, this.portrait.render(renderer, view), out);
    const L = this.layer; L.clear();
    const c = L.ctx;
    const ink = rgba('ink');
    c.strokeStyle = ink; c.lineWidth = 2;
    c.beginPath(); c.ellipse(view.cx, view.cy, view.rx + 14, view.ry + 14, 0, 0, TAU); c.stroke();
    c.fillStyle = ink;
    c.font = font(F.serif(600, true), 76); c.fillText('Best in Show', 1060, 190);
    c.font = font(F.mono(500), 16); c.letterSpacing = '3px';
    c.fillText("THE GRYFFY BALL · THE JUDGE'S DECISION IS FINAL", 1062, 232);
    c.letterSpacing = '0px';
    // the rosette swings in on "best" and is pinned to the lapel
    const best = this.line.words[3]!.start;
    const [px, py] = photoPoint(view, 0.47, 0.74);
    if (t > best - 0.25) {
      const k = springStep(t - best + 0.25, 2.4, 0.45);
      const x = lerp(W + 300, px, Math.min(1.05, k)), y = lerp(-200, py, Math.min(1.05, k));
      rosette(c, x, y, 1 + 0.12 * pulse(t, best, 0.08), 0.25 * (1 - Math.min(1, k)) + 0.06 * Math.sin((t - best) * 5) * Math.exp(-(t - best) * 1.5));
    }
    const st = { ...PAPER_RUN(F.archivo(87.5, 900), 86), lead: 0.5 };
    const ps = piecesOf(this.line);
    drawRun(c, ps.slice(0, 3), 1060, 700, t, st);
    drawRun(c, ps.slice(3), 1060, 830, t, st);
    comp.draw(renderer, L.upload(), out);
    return { bloom: 0, halation: 0, ca: 0.3, vignette: 0.15, grain: 0.04, shake: [0, 8 * pulse(t, best + 0.2, 0.06)] as [number, number] };
  }
}

/** A dog-show rosette: two tails, a pleated ring in green and black, a bone centre with its title. */
function rosette(c: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number) {
  c.save();
  c.translate(x, y); c.rotate(rot); c.scale(s, s);
  // tails with V-cut ends
  for (const [dx, col] of [[-40, rgba('ink')], [40, rgba('signal')]] as const) {
    c.save(); c.translate(dx, 60); c.rotate(dx < 0 ? 0.12 : -0.12);
    c.fillStyle = col;
    c.beginPath(); c.moveTo(-34, 0); c.lineTo(34, 0); c.lineTo(34, 230); c.lineTo(0, 200); c.lineTo(-34, 230); c.closePath(); c.fill();
    c.restore();
  }
  // pleated rings
  const ring = (r0: number, r1: number, n: number, col: string) => {
    c.fillStyle = col; c.beginPath();
    for (let i = 0; i <= n * 2; i++) {
      const a = (i / (n * 2)) * TAU, r = i % 2 ? r0 : r1;
      if (i === 0) c.moveTo(r * Math.cos(a), r * Math.sin(a)); else c.lineTo(r * Math.cos(a), r * Math.sin(a));
    }
    c.closePath(); c.fill();
  };
  ring(140, 170, 36, rgba('signal'));
  ring(110, 138, 30, rgba('ink'));
  c.fillStyle = rgba('bone'); c.beginPath(); c.arc(0, 0, 100, 0, TAU); c.fill();
  c.strokeStyle = rgba('ink'); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 92, 0, TAU); c.stroke();
  c.fillStyle = rgba('ink'); c.textAlign = 'center';
  c.font = font(F.mono(500), 14); c.letterSpacing = '3px'; c.fillText('FIRST PRIZE', 0, -44); c.letterSpacing = '0px';
  c.font = font(F.serif(600, true), 40); c.fillText('Best Boy', 0, 0);
  c.font = font(F.serif(600, true), 34); c.fillText('in Town', 0, 36);
  c.textAlign = 'left';
  c.restore();
}

// Gryffy's favourite toy (TREATMENT.md Motifs 4, the smoosh): a baby-blue plush squeaky giraffe.
// Giraffe blue belongs to this toy and nothing else.
import { rgba } from '../../../engine/palette';
import { mulberry32 } from '../../../engine/util';

export const TOY = '#9CCBEA';
const SPOT = '#79AED6';
const LIGHT = '#CFE7F7';
const DARK = '#5F93BE';

export interface GiraffeOpts {
  /** Rotation (rad) about the body centre. */
  rot?: number;
  /** 0..1: pressed against the glass (flattened, with a pale contact patch). */
  squash?: number;
  /** Neck fold (-1..1): 0 straight up, ±1 folded over sideways (head-first smoosh). */
  fold?: number;
  /** Mirror (face left). */
  flip?: boolean;
}

/** Draws the plush giraffe side-on, body centre at (x, y), `size` = body length in px. */
export function drawGiraffe(c: CanvasRenderingContext2D, x: number, y: number, size: number, o: GiraffeOpts = {}) {
  const sq = o.squash ?? 0, fold = o.fold ?? 0;
  c.save();
  c.translate(x, y);
  c.rotate(o.rot ?? 0);
  c.scale((o.flip ? -1 : 1) * size * (1 + 0.1 * sq), size * (1 - 0.14 * sq));
  c.lineJoin = 'round';
  c.lineCap = 'round';
  const edge = rgba('ink', 0.55);
  const lw = 2.2 / size;

  // neck: base on the body's front shoulder, a mid point that swings over with the fold, the head
  const base: [number, number] = [0.26, -0.14];
  const mid: [number, number] = [0.36 + 0.28 * fold, -0.42 + 0.12 * Math.abs(fold)];
  const head: [number, number] = [0.46 + 0.62 * fold, -0.66 + 0.5 * Math.abs(fold)];
  const headAng = -0.35 + fold * 1.9;

  // legs and tail behind the body
  c.fillStyle = TOY;
  for (const lx of [-0.3, -0.13, 0.12, 0.29]) {
    c.beginPath(); c.roundRect(lx - 0.055, 0.1, 0.11, 0.22, 0.05); c.fill();
    c.strokeStyle = edge; c.lineWidth = lw; c.stroke();
    c.fillStyle = DARK; c.beginPath(); c.roundRect(lx - 0.055, 0.27, 0.11, 0.06, 0.03); c.fill();
    c.fillStyle = TOY;
  }
  c.strokeStyle = TOY; c.lineWidth = 0.022;
  c.beginPath(); c.moveTo(-0.4, -0.06); c.quadraticCurveTo(-0.47, -0.04, -0.49, 0.04); c.stroke();
  c.fillStyle = DARK; c.beginPath(); c.ellipse(-0.49, 0.07, 0.022, 0.036, 0.3, 0, Math.PI * 2); c.fill();

  // neck (a thick stroke through the three points, outlined)
  const neck = new Path2D();
  neck.moveTo(base[0], base[1]);
  neck.quadraticCurveTo(mid[0], mid[1], head[0], head[1]);
  c.strokeStyle = edge; c.lineWidth = 0.19 + lw * 2; c.stroke(neck);
  c.strokeStyle = TOY; c.lineWidth = 0.19; c.stroke(neck);

  // body
  const body = new Path2D();
  body.ellipse(0, 0, 0.42, 0.26, 0, 0, Math.PI * 2);
  c.fillStyle = TOY; c.fill(body);
  c.strokeStyle = edge; c.lineWidth = lw; c.stroke(body);
  // spots on body and neck (fixed layout)
  const rnd = mulberry32(7);
  c.save(); c.clip(body);
  c.fillStyle = SPOT;
  for (let i = 0; i < 9; i++) {
    const sx = -0.34 + (i % 5) * 0.16 + (rnd() - 0.5) * 0.05, sy = -0.13 + Math.floor(i / 5) * 0.17 + (rnd() - 0.5) * 0.05;
    c.beginPath(); c.ellipse(sx, sy, 0.05 + rnd() * 0.02, 0.04 + rnd() * 0.015, rnd() * 3, 0, Math.PI * 2); c.fill();
  }
  c.restore();
  // the seam along the belly
  c.strokeStyle = rgba('bone', 0.7); c.lineWidth = 0.008; c.setLineDash([0.025, 0.02]);
  c.beginPath(); c.ellipse(0, 0.02, 0.36, 0.2, 0, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  c.setLineDash([]);

  // head
  c.save();
  c.translate(head[0], head[1]);
  c.rotate(headAng);
  // ossicones and ears
  c.strokeStyle = TOY; c.lineWidth = 0.035;
  for (const ox of [-0.06, 0.02]) { c.beginPath(); c.moveTo(ox, -0.08); c.lineTo(ox - 0.02, -0.19); c.stroke(); }
  c.fillStyle = DARK;
  for (const ox of [-0.08, 0.0]) { c.beginPath(); c.arc(ox, -0.2, 0.03, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = TOY;
  c.beginPath(); c.ellipse(-0.14, -0.06, 0.07, 0.03, -0.5, 0, Math.PI * 2); c.fill();
  const headP = new Path2D();
  headP.ellipse(0.04, 0, 0.19, 0.12, 0, 0, Math.PI * 2);
  c.fill(headP);
  c.strokeStyle = edge; c.lineWidth = lw; c.stroke(headP);
  c.fillStyle = LIGHT; c.beginPath(); c.ellipse(0.16, 0.02, 0.08, 0.075, 0, 0, Math.PI * 2); c.fill();
  // button eye and a stitched smile
  c.fillStyle = '#000'; c.beginPath(); c.arc(0.02, -0.03, 0.028, 0, Math.PI * 2); c.fill();
  c.fillStyle = rgba('bone', 1); c.beginPath(); c.arc(0.028, -0.038, 0.009, 0, Math.PI * 2); c.fill();
  c.strokeStyle = rgba('ink', 0.7); c.lineWidth = 0.01;
  c.beginPath(); c.arc(0.15, 0.03, 0.05, 0.15 * Math.PI, 0.7 * Math.PI); c.stroke();
  c.restore();

  // pressed against the glass: a pale flattened patch where the plush touches, and a sheen
  if (sq > 0) {
    const g = c.createRadialGradient(0.02, -0.02, 0, 0.02, -0.02, 0.36);
    g.addColorStop(0, `rgba(223,240,251,${0.75 * sq})`);
    g.addColorStop(0.7, `rgba(223,240,251,${0.35 * sq})`);
    g.addColorStop(1, 'rgba(223,240,251,0)');
    c.save(); c.clip(body);
    c.fillStyle = g; c.fillRect(-0.5, -0.4, 1, 0.8);
    c.restore();
  }
  c.restore();
}

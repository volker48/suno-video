// Small props shared by the plates: the ball and a paw print.
import { rgba } from '../../../engine/palette';
import { TAU } from '../../../engine/util';

/** The ball: ball green with its two seams, glowing a little. */
export function ball(c: CanvasRenderingContext2D, x: number, y: number, r: number, scale = 1, glow = 1) {
  r *= scale;
  if (glow > 0) {
    const g = c.createRadialGradient(x, y, r * 0.6, x, y, r * 3.2);
    g.addColorStop(0, rgba('signal', 0.28 * glow)); g.addColorStop(1, rgba('signal', 0));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 3.2, 0, TAU); c.fill();
  }
  c.fillStyle = rgba('signal'); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.strokeStyle = rgba('ember', 0.9); c.lineWidth = r * 0.09; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - r * 0.68, y - r * 0.72); c.quadraticCurveTo(x - r * 0.18, y, x - r * 0.68, y + r * 0.72); c.stroke();
  c.beginPath(); c.moveTo(x + r * 0.68, y - r * 0.72); c.quadraticCurveTo(x + r * 0.18, y, x + r * 0.68, y + r * 0.72); c.stroke();
}

/** A paw print (pad and four toes), pointing up, `r` = pad half-width, in the current fill. */
export function paw(c: CanvasRenderingContext2D, r: number) {
  c.beginPath(); c.ellipse(0, r * 0.35, r, r * 0.8, 0, 0, TAU); c.fill();
  for (const [x, y] of [[-1.1, -0.55], [-0.4, -1.05], [0.4, -1.05], [1.1, -0.55]] as const) {
    c.beginPath(); c.ellipse(x * r, y * r, r * 0.34, r * 0.44, x * 0.3, 0, TAU); c.fill();
  }
}

/** A crown: a gilt band with five points, pearls on the tips and one green stone. Base centre at (x, y), width w. */
export function crown(c: CanvasRenderingContext2D, x: number, y: number, w: number, rot = 0) {
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

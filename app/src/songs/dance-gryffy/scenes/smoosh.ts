// The smoosh (TREATMENT.md Motifs 4): Gryffy pushes a toy into the lens to make you play. Shared by
// the plate where it lands (crouch: the approach and the hit) and the plate after it (floor: the
// peel-away and the nose print left on the glass).
import { rgba } from '../../../engine/palette';
import { clamp, ease, lerp } from '../../../engine/util';
import { W } from '../../../engine/gl';
import { drawFront } from './gryffy';
import { drawGiraffe } from './giraffe';

export interface SmooshState {
  /** 0 = far away, 1 = on the glass. */
  approach: number;
  /** 0..1: how hard he's pushing (the toy flattens). */
  push: number;
  /** 0 = on the glass, 1 = gone (he has let go and dropped back). */
  pull: number;
  /** Neck fold of the giraffe (the second smoosh goes in head first). */
  fold: number;
}

/** Where his nose meets the glass (canvas px), and the print's radius. */
export const NOSE: [number, number, number] = [960, 452, 105];

/** Draws Gryffy and the giraffe coming at the lens, pressed on it, or dropping away. */
export function drawSmoosh(c: CanvasRenderingContext2D, s: SmooshState) {
  const a = ease.inCubic(clamp(s.approach));
  const out = ease.inQuad(clamp(s.pull));
  const k = a * (1 - 0.7 * out);
  // Gryffy: small and sharp far away, huge and a little soft up against the glass
  const r = lerp(70, 560, k);
  const fx = 960, fy = lerp(600, 360, a) + 1100 * out;
  c.save();
  c.filter = `blur(${(3 + 9 * k).toFixed(1)}px)`;
  drawFront(c, fx, fy, r, s.push * (1 - out));
  c.restore();
  // the giraffe, held crosswise in his mouth, in focus on the glass
  const size = lerp(170, 1100, k);
  const gx = lerp(fx - 60, 880, a), gy = lerp(fy + r * 0.6, 800, a) + 1300 * out;
  drawGiraffe(c, gx, gy, size, { squash: s.push * (1 - out), fold: s.fold, rot: -0.05 + 0.25 * out });
  // the glass itself: a faint diagonal sheen while something is pressed on it
  const on = a * (1 - out);
  if (on > 0.5) {
    const g = c.createLinearGradient(W * 0.1, 0, W * 0.5, 1080);
    g.addColorStop(0.35, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, `rgba(255,255,255,${0.06 * on})`);
    g.addColorStop(0.65, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, 1080);
  }
}

/** The nose print he leaves on the lens: a soft smudge with the texture of a nose. */
export function drawNosePrint(c: CanvasRenderingContext2D, alpha: number) {
  if (alpha <= 0) return;
  const [x, y, r] = NOSE;
  c.save();
  c.globalAlpha = alpha;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba('bone', 0.2));
  g.addColorStop(0.7, rgba('bone', 0.12));
  g.addColorStop(1, rgba('bone', 0));
  c.fillStyle = g;
  c.beginPath(); c.ellipse(x, y, r * 1.2, r * 0.8, 0, 0, Math.PI * 2); c.fill();
  // nose-leather texture: small cells, and the philtrum crease down the middle
  c.strokeStyle = rgba('bone', 0.16);
  c.lineWidth = 1.5;
  for (let i = -5; i <= 5; i++) for (let j = -3; j <= 3; j++) {
    const px = x + i * 18 + (j % 2) * 9, py = y + j * 16;
    const d = Math.hypot((px - x) / (r * 1.1), (py - y) / (r * 0.7));
    if (d > 1) continue;
    c.beginPath(); c.arc(px, py, 6, 0, Math.PI * 2); c.stroke();
  }
  c.strokeStyle = rgba('bone', 0.22); c.lineWidth = 3;
  c.beginPath(); c.moveTo(x, y + r * 0.1); c.lineTo(x, y + r * 0.7); c.stroke();
  c.restore();
}

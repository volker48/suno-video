// gala — the last lines of the final chorus (TREATMENT.md encore): the whole gala at full tilt. A
// mirror ball descends, throwing spots round the ballroom; confetti in black, white and green; Gryffy
// zooming back and forth across the floor. On the long "VIP" the mirror ball turns out to be the
// ball, green, and on the last "Bright green ball's your VIP" it fills the frame.
import type * as THREE from 'three';
import { Scene, type Frame } from '../../../engine/scene';
import { Layer2D, W, H, clearRT } from '../../../engine/gl';
import { LIN, rgba } from '../../../engine/palette';
import { F } from '../../../engine/type';
import type { Line } from '../../../engine/lyrics';
import { ease, hash, lerp, prog, pulse, TAU } from '../../../engine/util';
import { drawSide, drawSmear, stand, trot } from './gryffy';
import { drawRun, piecesOf, type RunStyle } from './karaoke';
import { ball } from './props';

const FLOOR = 900;

export default class Gala extends Scene {
  layer = new Layer2D();
  l: Line[] = [];
  bp = 0.45;

  override init() {
    const { lyrics, audio } = this.ctx;
    // the last two VIP lines are the 5th and 6th containing "your VIP"
    this.l = [lyrics.get('run wild, run free', 4), lyrics.get('your VIP', 4), lyrics.get('your VIP', 5)];
    this.bp = 60 / audio.bpm;
  }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp, start } = this.ctx;
    const t = f.t;
    clearRT(renderer, out, LIN.ink);
    const L = this.layer; L.clear(rgba('ink'));
    const c = L.ctx;
    const vip = this.l[1]!.words[5]!, last = this.l[2]!;
    // the mirror ball comes down, and on the held VIP it becomes the ball
    const down = prog(t, start, start + 1.0, ease.outCubic);
    const green = prog(t, vip.start, vip.start + 0.8, ease.inOutCubic);
    const fill = prog(t, last.start - 0.2, last.start + 0.8, ease.inOutCubic);
    const bx = 960, by = lerp(-200, 300, down) + (560 - 300) * fill;
    const R = lerp(175, lerp(210, 640, fill), Math.max(green * 0.3, fill));
    // light spots thrown round the room, turning green with the ball
    const spin = t * 0.9;
    for (let i = 0; i < 46; i++) {
      const a = hash(i, 1) * TAU + spin * (0.6 + 0.4 * hash(i, 2));
      const x = W / 2 + Math.cos(a) * (500 + 700 * hash(i, 3)), y = 480 + Math.sin(a * 1.3) * 420;
      c.fillStyle = green > 0.5 ? rgba('signal', 0.35 * down) : rgba('bone', 0.28 * down);
      c.beginPath(); c.ellipse(x, y, 14 + 10 * hash(i, 4), 9 + 6 * hash(i, 5), a, 0, TAU); c.fill();
    }
    c.strokeStyle = rgba('graphite', 0.5); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(0, FLOOR); c.lineTo(W, FLOOR); c.stroke();
    // Gryffy zooming back and forth under it all (off the floor once the ball fills the frame)
    if (fill < 1) {
      const lap = 2.4, ph = ((t - start) % lap) / lap;
      const goingRight = ph < 0.5, u = goingRight ? ph * 2 : (1 - ph) * 2;
      const x = lerp(250, 1670, ease.inOutQuad(u));
      const p = trot({ ...stand(x, FLOOR, 330, goingRight ? 1 : -1), stretch: 1.25, wind: 0.6, mouth: 0.4, tongue: 0.8 }, t * TAU * 3.2, 1.4);
      drawSmear(c, Array.from({ length: 8 }, (_, g) => [x - (goingRight ? 1 : -1) * (80 + g * 40), FLOOR - 150] as [number, number]), 180, 0.8);
      drawSide(c, p, { alpha: 1 - fill });
    }
    // the mirror ball: facets, or the ball, or both mid-change
    c.strokeStyle = rgba('bone', 0.5); c.lineWidth = 2;
    c.beginPath(); c.moveTo(bx, 0); c.lineTo(bx, by - R); c.stroke();
    if (green < 1) mirrorBall(c, bx, by, R, spin, 1 - green);
    if (green > 0) { c.globalAlpha = green; ball(c, bx, by, R, 1, 1 - 0.6 * fill); c.globalAlpha = 1; }
    // confetti
    const colours = [rgba('bone'), rgba('signal'), '#3A3A3F'];
    for (let i = 0; i < 160; i++) {
      const sp = 140 + 160 * hash(i, 7);
      const y = ((t - start) * sp + hash(i, 8) * (H + 200)) % (H + 200) - 100;
      const x = hash(i, 9) * W + 30 * Math.sin(t * 2 + i);
      c.save(); c.translate(x, y); c.rotate(t * (2 + 3 * hash(i, 10)) + i);
      c.fillStyle = colours[i % 3]!; c.fillRect(-7, -4, 14, 8);
      c.restore();
    }
    // the lines
    const st: RunStyle = { family: F.archivo(87.5, 900), size: 104, ink: rgba('bone'), dim: 0.22, lit: rgba('signal'), lead: 0.6 };
    if (t < this.l[1]!.start - 0.05) {
      const ps = piecesOf(this.l[0]!);
      drawRun(c, ps.slice(0, 2), 150, 180, t, st); drawRun(c, ps.slice(2), 150, 300, t, st);
    } else if (t < last.start - 0.05) {
      const ps = piecesOf(this.l[1]!);
      drawRun(c, ps.slice(0, 3), 150, 180, t, st); drawRun(c, ps.slice(3), 150, 300, t, st);
    } else {
      // printed across the ball
      const ink: RunStyle = { family: F.archivo(75, 900), size: 150, ink: rgba('ink'), dim: 0.25, lit: rgba('ink'), lead: 0.6, swipe: rgba('bone', 0.6) };
      const ps = piecesOf(last);
      drawRun(c, ps.slice(0, 2), 520, 560, t, ink); drawRun(c, ps.slice(2), 520, 720, t, ink);
    }
    comp.draw(renderer, L.upload(), out);
    const beat = Math.floor((t - start) / this.bp) * this.bp + start;
    return { bloom: 0.55, halation: 0, ca: 0.5, vignette: 0.5, zoom: 1 + 0.008 * pulse(t, beat, 0.1), flash: 0.25 * pulse(t, vip.start, 0.1) };
  }
}

/** A mirror ball: rows of small square facets catching the light, turning. */
function mirrorBall(c: CanvasRenderingContext2D, x: number, y: number, R: number, spin: number, alpha: number) {
  c.save();
  c.globalAlpha = alpha;
  c.beginPath(); c.arc(x, y, R, 0, TAU); c.fillStyle = '#2A2A2E'; c.fill();
  c.clip();
  const rows = 12;
  for (let j = 0; j < rows; j++) {
    const lat = -Math.PI / 2 + ((j + 0.5) / rows) * Math.PI;
    const ry = y + R * Math.sin(lat), rr = R * Math.cos(lat);
    const cols = Math.max(4, Math.round(24 * Math.cos(lat)));
    for (let i = 0; i < cols; i++) {
      const lon = (i / cols) * TAU + spin;
      if (Math.cos(lon) < 0) continue;
      const fx = x + rr * Math.sin(lon), w = (TAU / cols) * rr * Math.cos(lon) * 0.9, h = (Math.PI / rows) * R * 0.9;
      const b = 0.35 + 0.65 * Math.pow(Math.max(0, Math.sin(lon * 3 + j + spin * 4)), 6);
      c.fillStyle = rgba('bone', b);
      c.fillRect(fx - w / 2, ry - h / 2, w, h);
    }
  }
  c.restore();
}

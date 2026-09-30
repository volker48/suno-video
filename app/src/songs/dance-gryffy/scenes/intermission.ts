// intermission — "A short intermission" (TREATMENT.md). The two-bar gap between chorus 1 and verse 2:
// a theatre intermission card; the ball bounces across it landing on every beat, and every landing
// sets a "squeak" in the margin. House rule 4. The unlisted vocal tag ("…green… VIP") gets a small
// VIP stamp and nothing more.
import type * as THREE from 'three';
import { Scene, type Frame } from '../../../engine/scene';
import { Layer2D, W, H, clearRT } from '../../../engine/gl';
import { LIN, rgba } from '../../../engine/palette';
import { F, font } from '../../../engine/type';
import { lerp, prog, pulse, smoothstep } from '../../../engine/util';
import { ball } from './props';

const CARD = { x: 360, y: 200, w: 1200, h: 620 };

export default class Intermission extends Scene {
  layer = new Layer2D();
  beats: number[] = [];
  /** The unlisted tag from song.json align.extras (start, end), if any falls in this window. */
  tag: [number, number] | null = null;

  override init() {
    const { audio, start, end, song } = this.ctx;
    const b0 = Math.round(audio.beatAt(start)), b1 = Math.round(audio.beatAt(end));
    for (let b = b0; b <= b1; b++) this.beats.push(audio.timeOfBeat(b));
    const extras = ((song.meta as { align?: { extras?: { start: number; end: number }[] } }).align?.extras ?? []);
    const x = extras.find((e) => e.start >= start - 0.5 && e.start < end);
    this.tag = x ? [x.start, x.end] : null;
  }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp, start } = this.ctx;
    const t = f.t;
    clearRT(renderer, out, LIN.ink);
    const L = this.layer; L.clear(rgba('ink'));
    const c = L.ctx;
    const { x, y, w, h } = CARD;
    // the card
    c.fillStyle = rgba('bone'); c.fillRect(x, y, w, h);
    c.strokeStyle = rgba('ink'); c.lineWidth = 2.5; c.strokeRect(x + 26, y + 26, w - 52, h - 52);
    c.lineWidth = 1; c.strokeRect(x + 36, y + 36, w - 72, h - 72);
    c.fillStyle = rgba('ink'); c.textAlign = 'center';
    c.font = font(F.mono(500), 18); c.letterSpacing = '6px';
    c.fillText('THE GRYFFY BALL · ACT I ENDS', x + w / 2, y + 110);
    c.letterSpacing = '0px';
    c.font = font(F.serif(600, true), 150); c.fillText('Intermission', x + w / 2, y + 290);
    c.font = font(F.serif(400, false), 38); c.fillText('There will now be a short intermission.', x + w / 2, y + 360);
    c.fillRect(x + w / 2 - 120, y + 400, 240, 1.5);
    const ra = smoothstep(start + 0.5, start + 0.9, t);
    c.globalAlpha = ra;
    c.font = font(F.mono(400), 17); c.letterSpacing = '3px';
    c.fillText('HOUSE RULE 4 · SQUEAKING IS PERMITTED DURING THE INTERMISSION', x + w / 2, y + h - 80);
    c.letterSpacing = '0px'; c.globalAlpha = 1;
    c.textAlign = 'left';
    // the tag: a small VIP stamp in the corner while it is sung
    if (this.tag && t > this.tag[0]) {
      const k = 1 + 0.5 * (1 - prog(t, this.tag[0], this.tag[0] + 0.07));
      c.save(); c.translate(x + w - 190, y + 150); c.rotate(0.12); c.scale(k, k);
      c.strokeStyle = rgba('blood', 0.9); c.lineWidth = 4; c.strokeRect(-70, -40, 140, 60);
      c.fillStyle = rgba('blood', 0.9); c.font = font(F.archivo(75, 900), 46); c.textAlign = 'center'; c.fillText('VIP', 0, 5);
      c.textAlign = 'left'; c.restore();
    }
    // the ball bouncing across, landing on the beats; "squeak" where it lands
    const i = this.beats.findIndex((b, k) => t >= b && t < (this.beats[k + 1] ?? Infinity));
    const n = this.beats.length;
    const xAt = (k: number) => lerp(-80, W + 80, k / (n - 1));
    const floor = y + h + 60;
    for (let k = 0; k <= Math.max(0, i); k++) {
      const tb = this.beats[k]!;
      const a = 1 - smoothstep(tb + 0.3, tb + 0.9, t);
      if (a <= 0 || t < tb) continue;
      c.globalAlpha = a; c.fillStyle = rgba('bone', 0.85);
      c.font = font(F.serif(400, true), 44 + 12 * pulse(t, tb, 0.08));
      c.textAlign = 'center'; c.fillText('squeak', xAt(k), floor + 70);
      c.textAlign = 'left'; c.globalAlpha = 1;
    }
    if (i >= 0 && i < n - 1) {
      const t0 = this.beats[i]!, t1 = this.beats[i + 1]!;
      const u = (t - t0) / (t1 - t0);
      const bx = lerp(xAt(i), xAt(i + 1), u);
      const by = floor - 40 - 380 * 4 * u * (1 - u);
      const squash = 1 - 0.25 * pulse(t, t0, 0.05);
      c.save(); c.translate(bx, by); c.scale(1 / squash, squash);
      ball(c, 0, 0, 40);
      c.restore();
    }
    comp.draw(renderer, L.upload(), out);
    return { bloom: 0.4, halation: 0, ca: 0.3, vignette: 0.4 };
  }
}

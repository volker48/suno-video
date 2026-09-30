// invite — "You are cordially invited" (TREATMENT.md). The intro: the invitation slides up out of
// the dark and lands on the first downbeat; the seal glints on the beat before verse 1 and the card
// splits down the middle, light behind the crack, as the camera pushes in: its halves are the
// ballroom doors of the next plate.
import type * as THREE from 'three';
import { Scene, type Frame } from '../../../engine/scene';
import { Layer2D, W, H, clearRT } from '../../../engine/gl';
import { LIN, rgba } from '../../../engine/palette';
import { ease, prog, pulse } from '../../../engine/util';
import { CARD, drawInvitation } from './invitation';

export const RULE_1 = 'Guests are kindly asked not to zoom.';

export default class Invite extends Scene {
  layer = new Layer2D();
  card = new Layer2D();
  land = 0.7;
  glint = 2;

  override init() {
    const { audio, end } = this.ctx;
    this.land = audio.downbeats[0] ?? 0.7;
    this.glint = audio.timeOfBeat(Math.round(audio.beatAt(end)) - 2);
  }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp, end } = this.ctx;
    const t = f.t;
    clearRT(renderer, out, LIN.ink);
    const L = this.layer; L.clear(rgba('ink'));
    const c = L.ctx;
    // the card slides up and lands on the first downbeat
    const dy = 900 * (1 - prog(t, 0.05, this.land, ease.outExpo));
    const glint = pulse(t, this.glint, 0.25);
    // split: the two halves part down the middle, light in the crack, the camera pushing in
    const split = prog(t, end - 0.35, end, ease.inCubic);
    const push = 1 + 0.35 * split;
    c.save();
    c.translate(W / 2, H / 2); c.scale(push, push); c.translate(-W / 2, -H / 2);
    if (split <= 0) drawInvitation(c, 0, dy, RULE_1, glint);
    else {
      this.card.clear();
      drawInvitation(this.card.ctx, 0, dy, RULE_1, glint);
      const gap = 40 * split, mid = CARD.x + CARD.w / 2;
      const g = c.createLinearGradient(mid - gap - 60, 0, mid + gap + 60, 0);
      g.addColorStop(0, rgba('bone', 0)); g.addColorStop(0.5, rgba('bone', 0.9 * split)); g.addColorStop(1, rgba('bone', 0));
      c.fillStyle = g; c.fillRect(mid - gap - 60, CARD.y, 2 * gap + 120, CARD.h);
      const src = this.card.canvas, k = src.width / W;
      c.drawImage(src, 0, 0, mid * k, H * k, -gap, 0, mid, H);
      c.drawImage(src, mid * k, 0, (W - mid) * k, H * k, mid + gap, 0, W - mid, H);
    }
    c.restore();
    comp.draw(renderer, L.upload(), out);
    return { bloom: 0.35, halation: 0, ca: 0.3, vignette: 0.4, fade: 1 - prog(t, 0, 0.25), zoom: 1 + 0.01 * pulse(t, this.land, 0.1) };
  }
}

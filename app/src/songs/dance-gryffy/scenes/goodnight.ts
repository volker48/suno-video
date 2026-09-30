// goodnight — "Good boy" (TREATMENT.md), the outro. The invitation from the opening comes back and a
// pen writes "Good boy" across it as it is sung. On "Tuxedo tucked in" the card turns over: on its back,
// engraved, he is asleep, the ball by his paws, and the last house rule. One last snore flutters the
// card and it slides back down into the dark it came from, so the end runs into the start.
import type * as THREE from 'three';
import { Scene, type Frame } from '../../../engine/scene';
import { Layer2D, W, H, clearRT } from '../../../engine/gl';
import { LIN, rgba } from '../../../engine/palette';
import { F, font } from '../../../engine/type';
import { drawStrokeText, strokeText, writtenLength, type StrokeText } from '../../../engine/stroke';
import type { Line } from '../../../engine/lyrics';
import { ease, prog, pulse } from '../../../engine/util';
import { CARD, drawInvitation } from './invitation';
import { drawRun, piecesOf, wrapRun, type RunStyle } from './karaoke';
import { drawSide, flop, stand } from './gryffy';
import { ball } from './props';

const RULE_7 = 'The ball stays with Gryffy.';

export default class Goodnight extends Scene {
  layer = new Layer2D();
  card = new Layer2D();
  text = new Layer2D();
  l: Line[] = [];
  pen!: StrokeText;
  snore = 0;

  override init() {
    const { lyrics, audio, end } = this.ctx;
    this.l = [lyrics.get('Good boy, Gryffy'), lyrics.get('Tuxedo tucked in')];
    this.pen = strokeText('Good boy', 'script', 190);
    // the last snore: two beats before the end
    this.snore = audio.timeOfBeat(Math.floor(audio.beatAt(end)) - 2);
  }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp, start, end } = this.ctx;
    const t = f.t;
    clearRT(renderer, out, LIN.ink);
    const L = this.layer; L.clear(rgba('ink'));
    const c = L.ctx;
    // the card comes up out of the dark, and at the end goes back down into it
    const up = prog(t, start, start + 0.35, ease.outExpo);
    const downK = prog(t, end - 0.7, end, ease.inCubic);
    const dy = 900 * (1 - up) + 1000 * downK;
    // the flip on "Tuxedo": the card narrows to an edge and widens again, showing its back
    const flip0 = this.l[1]!.start;
    const flip = prog(t, flip0 - 0.05, flip0 + 0.3, ease.inOutCubic);
    const sx = Math.abs(Math.cos(flip * Math.PI));
    const back = flip > 0.5;
    // the last snore flutters it
    const flutter = 0.035 * Math.sin((t - this.snore) * 30) * pulse(t, this.snore, 0.2);
    const cx = CARD.x + CARD.w / 2, cy = CARD.y + CARD.h / 2 + dy;
    const face = this.card; face.clear();
    if (!back) {
      drawInvitation(face.ctx, 0, 0, RULE_7);
      // "Good boy", written across the card as it is sung
      const words = this.l[0]!.words;
      const times: [number, number][] = Array.from('Good boy').map((ch, i) => (i < 4 ? [words[0]!.start, words[0]!.end] : [words[1]!.start, words[1]!.end]));
      const fc = face.ctx;
      fc.save(); fc.translate(CARD.x + 230, CARD.y + 470); fc.rotate(-0.1);
      fc.strokeStyle = rgba('blood'); fc.lineWidth = 7; fc.lineCap = 'round'; fc.lineJoin = 'round';
      drawStrokeText(fc, this.pen, writtenLength(this.pen, times, t));
      fc.restore();
    } else {
      this.cardBack(face.ctx);
    }
    // place the card (front or back) with the flip squeeze and the flutter
    c.save();
    c.translate(cx, cy); c.rotate(flutter); c.scale(sx, 1); c.translate(-cx, -cy + dy);
    const k = face.canvas.width / W;
    c.drawImage(face.canvas, 0, 0, W * k, H * k, 0, 0, W, H);
    c.restore();
    comp.draw(renderer, L.upload(), out);
    if (back) {
      // the sleeper, drawn on the back of the card: asleep in the tux, the ball by his paws
      const f2 = this.card.ctx; this.card.clear();
      f2.save(); f2.translate(cx, cy); f2.rotate(flutter); f2.scale(sx, 1); f2.translate(-cx, -cy);
      const p = flop(stand(cx + 60, CARD.y + 430 + dy, 380, -1));
      const breath = Math.sin((t - flip0) * Math.PI / 0.45) * 0.006 + 0.02 * pulse(t, this.snore, 0.2);
      p.chest += breath; p.hip += breath * 0.6; p.bow = 1.2;
      drawSide(f2, p, { paper: true });
      ball(f2, cx - 190, CARD.y + 404 + dy, 30, 1, 0.4);
      f2.restore();
      comp.draw(renderer, this.card.upload(), out);
    }
    // the lines above the card
    const text = this.text; text.clear();
    const st: RunStyle = { family: F.serif(600, true), size: 76, ink: rgba('bone'), dim: 0.24, lit: rgba('signal'), lead: 0.6, alpha: 1 - downK };
    const li = t < this.l[1]!.start - 0.05 ? 0 : 1;
    const rows = wrapRun(piecesOf(this.l[li]!), st.family, st.size, 1500);
    rows.forEach((r, i) => drawRun(text.ctx, r, 210, 150 + i * 84, t, st));
    comp.draw(renderer, text.upload(), out);
    return { bloom: 0.35, halation: 0, ca: 0.3, vignette: 0.45, zoom: 1 + 0.01 * pulse(t, this.snore, 0.15) };
  }

  /** The back of the card: a caption, a frame for the sleeper, the last house rule. */
  private cardBack(c: CanvasRenderingContext2D) {
    const { x, y, w, h } = CARD;
    c.fillStyle = rgba('bone'); c.fillRect(x, y, w, h);
    c.strokeStyle = rgba('ink'); c.lineWidth = 2.5; c.strokeRect(x + 28, y + 28, w - 56, h - 56);
    c.lineWidth = 1; c.strokeRect(x + 38, y + 38, w - 76, h - 76);
    c.fillStyle = rgba('ink'); c.textAlign = 'center';
    c.font = font(F.mono(500), 15); c.letterSpacing = '5px';
    c.fillText('THE GUEST OF HONOUR HAS RETIRED FOR THE EVENING', x + w / 2, y + 80);
    c.font = font(F.mono(400), 15); c.letterSpacing = '3px';
    c.fillText(`HOUSE RULE 7 · ${RULE_7.toUpperCase()}`, x + w / 2, y + h - 64);
    c.letterSpacing = '0px'; c.textAlign = 'left';
  }
}

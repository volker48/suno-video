// The invitation card (TREATMENT.md invite and goodnight): bone card, double hairline border, ADMIT
// ONE · BLACK TIE, The Gryffy Ball, the house rule in the fine print and the ball as its wax seal.
// The opening and the closing card are the same object, so the video can loop.
import { rgba } from '../../../engine/palette';
import { F, font } from '../../../engine/type';
import { mulberry32 } from '../../../engine/util';
import { ball } from './props';

export const CARD = { x: 510, y: 250, w: 900, h: 580 };

/** Draws the card at CARD (plus an offset); `rule` is the house rule in its fine print. */
export function drawInvitation(c: CanvasRenderingContext2D, dx: number, dy: number, rule: string, glint = 0) {
  const { x, y, w, h } = CARD;
  c.save();
  c.translate(x + dx, y + dy);
  c.fillStyle = rgba('bone'); c.fillRect(0, 0, w, h);
  // paper fibre
  const r = mulberry32(5);
  c.strokeStyle = rgba('ash', 0.08); c.lineWidth = 1;
  for (let i = 0; i < 160; i++) {
    const fx = r() * w, fy = r() * h, l = 10 + r() * 40;
    c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + l, fy + (r() - 0.5) * 3); c.stroke();
  }
  const ink = rgba('ink');
  c.strokeStyle = ink; c.lineWidth = 2.5; c.strokeRect(28, 28, w - 56, h - 56);
  c.lineWidth = 1; c.strokeRect(38, 38, w - 76, h - 76);
  c.fillStyle = ink; c.textAlign = 'center';
  c.font = font(F.mono(500), 17); c.letterSpacing = '6px';
  c.fillText('ADMIT ONE · BLACK TIE', w / 2, 118);
  c.letterSpacing = '0px';
  c.font = font(F.serif(600, true), 118); c.fillText('The Gryffy Ball', w / 2, 262);
  c.font = font(F.serif(400, false), 34); c.fillText('requests the pleasure of your company', w / 2, 320);
  c.fillRect(w / 2 - 130, 360, 260, 1.5);
  c.font = font(F.mono(400), 16); c.letterSpacing = '3px';
  c.fillText(rule.toUpperCase(), w / 2, 446);
  c.letterSpacing = '0px';
  c.textAlign = 'left';
  // the seal: the ball pressed into the bottom edge
  ball(c, w / 2, h, 56, 1, 0.4 + 0.8 * glint);
  if (glint > 0) {
    c.strokeStyle = rgba('ember', glint); c.lineWidth = 3;
    const gx = w / 2 + 22, gy = h - 26, s = 34 * glint;
    c.beginPath(); c.moveTo(gx - s, gy); c.lineTo(gx + s, gy); c.moveTo(gx, gy - s); c.lineTo(gx, gy + s); c.stroke();
  }
  c.restore();
}

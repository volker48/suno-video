// afterparty — "After the ball" (TREATMENT.md), the bridge. The one slow plate: the ballroom after
// the party, chairs up on the tables, one lamp. He flops down by a pair of empty dress shoes; asleep in
// his suit, his paws paddle and the lamp throws a dream on the wall, the ball bouncing on a loop. The
// snore lands on the beat: the chandelier tinkles, the lamp flickers, the line puffs up, the monitor
// reads 94 dB; on "eyelids get slow" the frame closes like an iris. "My little gentleman, stealing
// the show": the spotlight finds him asleep on the evening's programme. The lyric turns to italic.
import type * as THREE from 'three';
import { Scene, type Frame } from '../../../engine/scene';
import { Layer2D, W, H, clearRT } from '../../../engine/gl';
import { LIN, rgba } from '../../../engine/palette';
import { F, font } from '../../../engine/type';
import type { Line } from '../../../engine/lyrics';
import { ease, lerp, mulberry32, prog, pulse, TAU } from '../../../engine/util';
import { anchors, drawSide, flop, lerpPose, stand, type SidePose } from './gryffy';
import { drawRun, piecesOf, wrapRun, type RunStyle } from './karaoke';
import { ball } from './props';

const FLOOR = 870;
const LAMP: [number, number] = [1640, 330];
const RULE_6 = 'HOUSE RULE 6 · QUIET PLEASE. THE GUEST OF HONOUR IS SNORING.';

export default class Afterparty extends Scene {
  layer = new Layer2D();
  l: Line[] = [];
  beats: number[] = [];
  bp = 0.45;

  override init() {
    const { lyrics, audio, start, end } = this.ctx;
    this.l = ['When the last game', 'Still in your suit', 'One sleepy snuffle', 'My little gentleman'].map((q) => lyrics.get(q));
    this.bp = 60 / audio.bpm;
    const b0 = Math.ceil(audio.beatAt(start)), b1 = Math.floor(audio.beatAt(end));
    for (let b = b0; b <= b1; b++) this.beats.push(audio.timeOfBeat(b));
  }

  private w(li: number, wi: number) { return this.l[li]!.words[wi]!; }

  /** The snore: one on every other beat once he's asleep, a pulse 0..1. */
  private snore(t: number) {
    const s0 = this.w(0, 6).end + 0.6;
    let v = 0;
    this.beats.forEach((b, i) => { if (i % 2 === 0 && b > s0) v = Math.max(v, pulse(t, b, 0.18)); });
    return v;
  }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp } = this.ctx;
    const t = f.t;
    clearRT(renderer, out, LIN.ink);
    const L = this.layer; L.clear(rgba('ink'));
    const c = L.ctx;
    const show = this.l[3]!.start - 0.05;
    const post = t < show ? this.room(c, t) : this.show(c, t);
    comp.draw(renderer, L.upload(), out);
    return { bloom: 0.5, halation: 0, ca: 0.3, vignette: 0.55, grain: 0.06, ...post };
  }

  private room(c: CanvasRenderingContext2D, t: number) {
    const sn = this.snore(t);
    // lamplight, flickering with the snore
    const flick = 1 - 0.25 * sn;
    const g = c.createRadialGradient(LAMP[0], LAMP[1], 20, LAMP[0], LAMP[1], 1300);
    g.addColorStop(0, rgba('accent', 0.32 * flick)); g.addColorStop(0.45, rgba('accent', 0.06 * flick)); g.addColorStop(1, rgba('accent', 0));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // the dream: the ball's shadow bouncing on the wall, on a loop
    const dream = prog(t, this.w(1, 6).start, this.w(1, 7).start);
    if (dream > 0) {
      const ph = ((t - this.w(1, 6).start) / (2 * this.bp)) % 1;
      const bx = lerp(700, 1100, ph), by = 640 - 300 * 4 * ph * (1 - ph);
      c.fillStyle = `rgba(0,0,0,${0.55 * dream})`;
      c.beginPath(); c.ellipse(bx, by, 60, 60, 0, 0, TAU); c.fill();
      c.globalAlpha = 0.5 * dream; c.fillStyle = rgba('bone');
      c.font = font(F.mono(400), 16); c.letterSpacing = '3px'; c.fillText('↻ REPEAT', 1000, 360); c.letterSpacing = '0px';
      c.globalAlpha = 1;
    }
    // tables with chairs stacked upside down, streamers on the floor
    c.strokeStyle = rgba('graphite', 0.7); c.lineWidth = 2;
    for (const x of [520, 900, 1260]) {
      const y = 600;
      c.beginPath(); c.moveTo(x - 110, y); c.lineTo(x + 110, y); c.moveTo(x - 95, y); c.lineTo(x - 95, FLOOR); c.moveTo(x + 95, y); c.lineTo(x + 95, FLOOR); c.stroke();
      for (const s of [-1, 1]) {
        const cx = x + s * 52;
        c.beginPath(); c.moveTo(cx - 32, y - 4); c.lineTo(cx + 32, y - 4); c.moveTo(cx - 28, y - 4); c.lineTo(cx - 28, y - 70); c.moveTo(cx + 28, y - 4); c.lineTo(cx + 28, y - 70); c.moveTo(cx + 28, y - 4); c.lineTo(cx + 28, y + 50); c.stroke();
      }
    }
    c.strokeStyle = rgba('graphite', 0.5); c.beginPath(); c.moveTo(0, FLOOR); c.lineTo(W, FLOOR); c.stroke();
    const r = mulberry32(8);
    c.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const x = 150 + r() * 1600, col = [rgba('bone', 0.35), rgba('signal', 0.4), rgba('ink2', 1)][i % 3]!;
      c.strokeStyle = col; c.beginPath(); c.moveTo(x, FLOOR + 30 + r() * 120);
      for (let k = 1; k < 8; k++) c.lineTo(x + k * 18, FLOOR + 30 + r() * 120);
      c.stroke();
    }
    // the lamp
    c.strokeStyle = rgba('bone', 0.5); c.lineWidth = 2;
    c.beginPath(); c.moveTo(LAMP[0], LAMP[1] + 40); c.lineTo(LAMP[0], FLOOR); c.moveTo(LAMP[0] - 60, FLOOR); c.lineTo(LAMP[0] + 60, FLOOR); c.stroke();
    c.fillStyle = rgba('accent', 0.75 * flick);
    c.beginPath(); c.moveTo(LAMP[0] - 80, LAMP[1] + 40); c.lineTo(LAMP[0] + 80, LAMP[1] + 40); c.lineTo(LAMP[0] + 50, LAMP[1] - 50); c.lineTo(LAMP[0] - 50, LAMP[1] - 50); c.closePath(); c.fill();
    // the chandelier, tinkling on every snore
    this.chandelier(c, 1300, 60, sn, t);
    // the empty dress shoes
    for (const dx of [0, 70]) {
      c.fillStyle = rgba('ink2'); c.strokeStyle = rgba('bone', 0.6); c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(280 + dx, FLOOR); c.bezierCurveTo(280 + dx, FLOOR - 40, 330 + dx, FLOOR - 46, 360 + dx, FLOOR - 40); c.lineTo(430 + dx, FLOOR - 22); c.quadraticCurveTo(452 + dx, FLOOR - 14, 448 + dx, FLOOR); c.closePath(); c.fill(); c.stroke();
    }
    // Gryffy: tired, then the flop on "flop", then asleep, breathing
    const flopT = this.w(0, 6).start;
    const k = prog(t, flopT - 0.05, flopT + 0.25, ease.outBack);
    const base = stand(760, FLOOR, 420, -1);
    let p: SidePose = { ...base, pitch: -0.05, blink: 0.5 };
    const asleep = flop(base);
    if (k > 0) p = lerpPose(p, asleep, Math.min(1, k));
    const breath = Math.sin((t - flopT) * Math.PI / this.bp) * 0.008 + 0.018 * sn;
    p.chest += breath; p.hip += breath * 0.6;
    p.bow = t > this.w(1, 3).start ? 1.2 : 0;
    // dreaming paws
    const dr = prog(t, this.w(1, 5).start, this.w(1, 6).end);
    p.fn = [p.fn[0] + 0.03 * Math.sin(t * 22) * dr, p.fn[1] + 0.015 * Math.max(0, Math.sin(t * 22)) * dr];
    drawSide(c, p);
    // the snore monitor and the house rule
    const s0 = this.l[2]!.start;
    if (t > s0 - 0.2) {
      const a = prog(t, s0 - 0.2, s0);
      c.globalAlpha = a;
      c.fillStyle = rgba('bone', 0.55); c.font = font(F.mono(500), 16); c.letterSpacing = '3px';
      c.fillText('SNORE MONITOR', 1180, 450);
      c.fillStyle = rgba('signal'); c.font = font(F.mono(500), 44); c.letterSpacing = '0px';
      c.fillText(`${Math.round(62 + 32 * sn)} dB`, 1180, 504);
      c.fillStyle = rgba('bone', 0.55); c.font = font(F.mono(400), 15); c.letterSpacing = '2px';
      c.fillText('≈ LAWNMOWER', 1360, 504);
      c.fillText(RULE_6, 150, 1000 - 20);
      c.letterSpacing = '0px';
      // the trace: breathing, with a spike on each snore
      c.strokeStyle = rgba('bone', 0.6); c.lineWidth = 1.5; c.beginPath();
      for (let i = 0; i <= 120; i++) {
        const tt = t - 2 + i / 60, v = this.snore(tt);
        const y = 560 - 6 * Math.sin(tt * Math.PI / this.bp) - 50 * v;
        if (i === 0) c.moveTo(1180 + i * 3, y); else c.lineTo(1180 + i * 3, y);
      }
      c.stroke();
      c.globalAlpha = 1;
    }
    // the line, in italic, puffing up on each snore
    const st: RunStyle = { family: F.serif(600, true), size: 92 * (1 + 0.06 * sn), ink: rgba('bone'), dim: 0.24, lit: rgba('signal'), lead: 0.8 };
    const line = t < this.l[1]!.start - 0.05 ? 0 : t < this.l[2]!.start - 0.05 ? 1 : 2;
    const rows = wrapRun(piecesOf(this.l[line]!), st.family, 92, 1050);
    rows.forEach((row, i) => drawRun(c, row, 150, 170 + i * 104, t, st));
    // eyelids get slow: an iris closing on his face
    const iris = prog(t, this.w(2, 4).start, this.w(2, 6).end, ease.inOutCubic);
    if (iris > 0) {
      const a = anchors(p).head;
      const R = lerp(1500, 190, iris);
      c.fillStyle = rgba('ink');
      c.beginPath(); c.rect(0, 0, W, H); c.arc(a[0], a[1], R, 0, TAU, true); c.fill('evenodd');
    }
    return { zoom: 1 + 0.01 * sn };
  }

  private chandelier(c: CanvasRenderingContext2D, x: number, y: number, sn: number, t: number) {
    c.strokeStyle = rgba('bone', 0.4); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(x, 0); c.lineTo(x, y); c.stroke();
    c.beginPath(); c.ellipse(x, y + 40, 150, 34, 0, 0, Math.PI); c.stroke();
    for (let i = 0; i < 9; i++) {
      const u = i / 8, cx = x - 150 + 300 * u, cy = y + 40 + 34 * Math.sin(Math.PI * u);
      const sw = 0.25 * sn * Math.sin(t * 40 + i);
      c.save(); c.translate(cx, cy); c.rotate(sw);
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 30); c.stroke();
      c.fillStyle = rgba('bone', 0.5 + 0.5 * sn);
      c.beginPath(); c.moveTo(0, 30); c.lineTo(6, 42); c.lineTo(0, 56); c.lineTo(-6, 42); c.closePath(); c.fill();
      c.restore();
    }
  }

  /** Stealing the show: close, in a spotlight, asleep on the programme. */
  private show(c: CanvasRenderingContext2D, t: number) {
    const t0 = this.l[3]!.start;
    const spot = prog(t, t0, t0 + 0.4, ease.outCubic);
    const g = c.createRadialGradient(900, 700, 40, 900, 700, 700);
    g.addColorStop(0, rgba('bone', 0.24 * spot)); g.addColorStop(1, rgba('bone', 0));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = rgba('bone', 0.06 * spot);
    c.beginPath(); c.moveTo(820, 0); c.lineTo(980, 0); c.lineTo(1400, 1000); c.lineTo(400, 1000); c.closePath(); c.fill();
    const base = stand(1010, 960, 760, -1);
    const p = flop(base);
    const breath = Math.sin((t - t0) * Math.PI / this.bp) * 0.008;
    p.chest += breath; p.hip += breath * 0.6; p.bow = 1.2;
    // the programme under his chin
    const a = anchors(p);
    c.save(); c.translate(a.nose[0] + 40, 930); c.rotate(-0.06);
    c.fillStyle = rgba('bone'); c.fillRect(-300, -90, 460, 110);
    c.strokeStyle = rgba('ink'); c.lineWidth = 2; c.strokeRect(-290, -80, 440, 90);
    c.fillStyle = rgba('ink'); c.font = font(F.serif(600, true), 40); c.fillText('Tonight’s Show', -260, -32);
    c.font = font(F.mono(500), 13); c.letterSpacing = '2px'; c.fillText('THE GRYFFY BALL · PROGRAMME', -258, -6); c.letterSpacing = '0px';
    c.restore();
    drawSide(c, p);
    // the ball, close by as always
    ball(c, 330, 930, 26, 1, 0.6);
    const st: RunStyle = { family: F.serif(600, true), size: 96, ink: rgba('bone'), dim: 0.24, lit: rgba('signal'), lead: 0.6 };
    const rows = wrapRun(piecesOf(this.l[3]!), st.family, st.size, 1300);
    rows.forEach((row, i) => drawRun(c, row, 150, 170 + i * 108, t, st));
    return {};
  }
}

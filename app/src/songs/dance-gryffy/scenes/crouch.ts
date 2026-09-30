// crouch ×2 — "The dance manual" (TREATMENT.md). params.n: 1 | 2.
// A page of a ballroom dance manual. The pre-chorus is set as the manual's numbered steps while
// Gryffy demonstrates: the play bow with dimension lines, a callout on the grin, a magnifier on the
// nub, X marks under the paws, a count-in, then the pounce: he comes at the lens with the giraffe
// and smooshes it flat on the chorus downbeat, "Dance, Gryffy" printed across it.
import type * as THREE from 'three';
import { Scene, type Frame } from '../../../engine/scene';
import { Layer2D, W, H } from '../../../engine/gl';
import { rgba } from '../../../engine/palette';
import { F, font } from '../../../engine/type';
import { strokeText, drawStrokeText, type StrokeText } from '../../../engine/stroke';
import type { Line } from '../../../engine/lyrics';
import { clamp, ease, lerp, prog, pulse, smoothstep, springStep } from '../../../engine/util';
import { anchors, drawSide, lerpPose, playBow, stand, type SidePose } from './gryffy';
import { drawRun, PAPER_RUN, piecesOf, type Piece } from './karaoke';
import { paperPass } from './paper';
import { drawSmoosh } from './smoosh';

const INK = () => rgba('ink');
const LEFT = 150;
const STEP_Y = [372, 474, 576, 678];
const GROUND = 842;

export default class Crouch extends Scene {
  paper = paperPass();
  layer = new Layer2D();
  n = 1;
  lines!: { crouch: Line; tail: Line; dance: Line };
  steps: Piece[][] = [];
  /** Beat period, the chorus downbeat (the hit) and the pounce (the beat before). */
  bp = 0.45;
  hit = 0;
  pounce = 0;
  notes: StrokeText[] = [];

  override init() {
    const { lyrics, audio, params } = this.ctx;
    this.n = params.n === 2 ? 2 : 1;
    const k = this.n - 1;
    this.lines = { crouch: lyrics.get('You crouch down low', k), tail: lyrics.get('Tail up', k), dance: lyrics.get('tear up the floor', k) };
    const a = piecesOf(this.lines.crouch), b = piecesOf(this.lines.tail);
    // 1 You crouch down low, / 2 I know that grin / 3 Tail up, paws set— / 4 let the trouble begin
    this.steps = [a.slice(0, 4), a.slice(4), b.slice(0, 4), b.slice(4)];
    this.bp = 60 / audio.bpm;
    this.hit = audio.downbeats.find((d) => d > this.lines.dance.words[0]!.start - 0.05)!;
    this.pounce = this.hit - this.bp;
    this.paper.u.seed!.value = 3 + this.n;
    if (this.n === 2) this.notes = [strokeText('see: trouble, p. 12', 'script', 34), strokeText('he knows', 'script', 34)];
  }

  private word(l: Line, i: number) { return l.words[i]!; }

  /** Gryffy's pose at t: standing, easing down into the bow on "crouch down low", wiggling, springing. */
  private pose(t: number): SidePose {
    const { crouch, tail } = this.lines;
    const base = stand(1440, GROUND, 520, -1);
    const bow = playBow(base);
    // down in two moves, on "down" and "low,"
    const k = 0.55 * prog(t, this.word(crouch, 2).start - 0.05, this.word(crouch, 2).start + 0.3, ease.outCubic)
      + 0.45 * prog(t, this.word(crouch, 3).start - 0.05, this.word(crouch, 3).start + 0.3, ease.outBack);
    let p = lerpPose(base, bow, k);
    // the grin: mouth and tongue on "grin"
    const grin = prog(t, this.word(crouch, 7).start, this.word(crouch, 7).start + 0.25, ease.outBack);
    p.mouth = lerp(0.15, 0.6, grin); p.tongue = lerp(0, 0.85, grin);
    if (t < this.word(crouch, 7).start) { p.mouth *= k; p.tongue = 0; }
    // the nub goes up on "up,"
    p.tail = lerp(0.3, 1.25, prog(t, this.word(tail, 1).start, this.word(tail, 1).start + 0.2, ease.outBack));
    // paws set: each front paw lifts and lands on its mark
    const set1 = this.word(tail, 2).start, set2 = this.word(tail, 3).start;
    p.fn = [p.fn[0], 0.06 * Math.max(0, Math.sin(Math.PI * prog(t, set1 - 0.22, set1)))];
    p.ff = [p.ff[0], 0.06 * Math.max(0, Math.sin(Math.PI * prog(t, set2 - 0.22, set2)))];
    // the wiggle: rump sways and the nub wags on eighths from "the trouble" to the pounce
    const w0 = this.word(tail, 5).start;
    const wig = smoothstep(w0, w0 + 0.3, t) * (1 - smoothstep(this.pounce - 0.3, this.pounce - 0.1, t));
    const ph = Math.sin((t - w0) * Math.PI * 2 / (this.bp / 2));
    p.hip += 0.022 * wig * ph;
    p.tail += 0.35 * wig * ph;
    // anticipation, then the spring
    const sink = prog(t, this.pounce - 0.28, this.pounce, ease.inOutCubic);
    p.chest -= 0.05 * sink; p.hip -= 0.06 * sink;
    const jump = prog(t, this.pounce, this.pounce + this.bp * 0.5, ease.outCubic);
    if (jump > 0) {
      p = lerpPose(p, { ...p, chest: 0.85, hip: 0.62, lean: 0.25, fn: [0.3, 0.35], ff: [0.26, 0.3], hn: [-0.22, 0.05], hf: [-0.18, 0.1], pitch: 0.45, mouth: 0.8 }, jump);
    }
    return p;
  }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp } = this.ctx;
    const t = f.t;
    this.paper.render(renderer, out);
    const L = this.layer;
    L.clear();
    const c = L.ctx;
    const approach0 = this.pounce + this.bp * 0.5;
    let post = {};
    if (t < approach0) post = this.drawPage(c, t);
    else post = this.drawSmooshPhase(c, t, approach0);
    comp.draw(renderer, L.upload(), out);
    return { bloom: 0, halation: 0, ca: 0.3, grain: 0.04, vignette: 0.15, ...post };
  }

  private drawPage(c: CanvasRenderingContext2D, t: number) {
    const { crouch, tail } = this.lines;
    const p = this.pose(t);
    const an = anchors(p);
    // the camera pushes into him as he springs
    const push = prog(t, this.pounce, this.pounce + this.bp * 0.5, ease.inExpo);
    const zoom = 1 + 5 * push;
    c.save();
    c.translate(an.head[0], an.head[1]);
    c.scale(zoom, zoom);
    c.translate(-an.head[0], -an.head[1]);

    // running head
    c.fillStyle = INK();
    c.font = font(F.mono(500), 17);
    c.letterSpacing = '3px';
    c.fillText('THE GRYFFY BALL · A MANUAL OF DANCE', LEFT, 128);
    c.textAlign = 'right';
    c.fillText(this.n === 1 ? 'p. 11' : 'p. 12', W - LEFT, 128);
    c.textAlign = 'left';
    c.letterSpacing = '0px';
    c.fillRect(LEFT, 146, W - 2 * LEFT, 2);
    c.fillRect(LEFT, 152, W - 2 * LEFT, 0.8);
    // heading
    c.font = font(F.serif(600, true), 64);
    const hIn = smoothstep(this.word(crouch, 1).start - 0.3, this.word(crouch, 1).start, t);
    c.globalAlpha = hIn;
    c.fillText(t < this.word(tail, 2).start ? 'Position 1: The Crouch' : 'Position 2: Paws Set', LEFT, 250);
    c.globalAlpha = 1;

    // the steps
    const st = PAPER_RUN(F.archivo(87.5, 800), 62);
    this.steps.forEach((ps, i) => {
      const y = STEP_Y[i]!;
      const shown = smoothstep(ps[0]!.word.start - 0.5, ps[0]!.word.start - 0.3, t);
      c.globalAlpha = shown;
      c.fillStyle = INK();
      c.font = font(F.mono(500), 22);
      c.fillText(`${i + 1}.`, LEFT, y - 6);
      c.globalAlpha = 1;
      drawRun(c, ps, LEFT + 52, y, t, st);
    });

    // margin notes on the second visit, in pencil
    if (this.n === 2) {
      const n0 = this.word(crouch, 0).start;
      c.strokeStyle = rgba('graphite', 0.9); c.lineWidth = 2;
      c.save(); c.translate(LEFT + 60, STEP_Y[3]! + 70); c.rotate(-0.03);
      drawStrokeText(c, this.notes[0]!, (t - n0) * 900);
      c.restore();
      c.save(); c.translate(LEFT + 640, STEP_Y[1]! + 22); c.rotate(-0.06);
      drawStrokeText(c, this.notes[1]!, (t - this.word(crouch, 5).start) * 600);
      c.restore();
    }

    // the count-in
    const counts = [4, 3, 2, 1].map((k) => this.hit - k * this.bp);
    if (t > counts[0]! - 0.3) {
      c.fillStyle = INK();
      c.font = font(F.mono(500), 18); c.letterSpacing = '3px';
      c.globalAlpha = smoothstep(counts[0]! - 0.3, counts[0]!, t);
      c.fillText('COUNT-IN', LEFT, 792);
      c.letterSpacing = '0px';
      counts.forEach((ct, i) => {
        if (t < ct) return;
        const pop = springStep(t - ct, 5, 0.4);
        const current = i === counts.length - 1 || t < counts[i + 1]!;
        c.globalAlpha = current ? 1 : 0.25;
        c.font = font(F.archivo(100, 900), 150 * (0.7 + 0.3 * pop));
        c.fillText(String(5 + i), LEFT + i * 130, 950);
      });
      c.globalAlpha = 1;
    }

    // the floor
    c.strokeStyle = INK(); c.lineWidth = 2;
    c.beginPath(); c.moveTo(1020, GROUND); c.lineTo(1860, GROUND); c.stroke();
    c.lineWidth = 1;
    for (let x = 1030; x < 1860; x += 14) { c.beginPath(); c.moveTo(x, GROUND + 2); c.lineTo(x - 12, GROUND + 16); c.stroke(); }
    c.font = font(F.mono(400), 15); c.letterSpacing = '2px'; c.fillStyle = INK();
    c.fillText('FIG. 1 — GRYFFY, SEEN FROM THE SIDE', 1030, GROUND + 48);
    c.letterSpacing = '0px';

    // X marks under the front paws, stamped on "paws" and "set"
    const stamps = [this.word(tail, 2).start, this.word(tail, 3).start];
    an.frontPaws.forEach((pp, i) => {
      const s0 = stamps[i]!;
      if (t < s0) return;
      const s = 1 + 0.6 * pulse(t, s0, 0.06);
      const x = pp[0] + (i ? 14 : 0), y = GROUND + 4;
      c.strokeStyle = INK(); c.lineWidth = 6;
      c.beginPath(); c.moveTo(x - 26 * s, y - 12 * s); c.lineTo(x + 26 * s, y + 12 * s); c.moveTo(x - 26 * s, y + 12 * s); c.lineTo(x + 26 * s, y - 12 * s); c.stroke();
    });

    drawSide(c, p, { paper: true });

    // dimension lines: FRONT: LOW and REAR: HIGH, grown on "down" and "low,"
    const dimIn = prog(t, this.word(crouch, 2).start, this.word(crouch, 3).end, ease.outCubic);
    if (dimIn > 0) {
      this.dimension(c, Math.min(an.frontPaws[0]![0], an.frontPaws[1]![0]) - 110, GROUND, lerp(GROUND, an.chestLow[1], dimIn), 'FRONT: LOW', -1);
      this.dimension(c, an.nub[0] + 110, GROUND, lerp(GROUND, an.rumpTop[1], dimIn), 'REAR: HIGH', 0);
    }

    // the grin, circled
    const g0 = this.word(crouch, 6).start;
    if (t > g0) {
      const k = prog(t, g0, g0 + 0.35, ease.outCubic);
      c.strokeStyle = INK(); c.lineWidth = 2;
      c.beginPath(); c.arc(an.grin[0], an.grin[1], 62, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); c.stroke();
      if (k >= 1) {
        c.beginPath(); c.moveTo(an.grin[0] - 44, an.grin[1] - 44); c.lineTo(an.grin[0] - 150, an.grin[1] - 150); c.lineTo(an.grin[0] - 290, an.grin[1] - 150); c.stroke();
        c.font = font(F.mono(500), 19); c.letterSpacing = '2px'; c.fillStyle = INK();
        c.fillText('GRIN: KNOWN', an.grin[0] - 290, an.grin[1] - 162);
        c.letterSpacing = '0px';
      }
    }

    // the magnifier on the nub
    const m0 = this.word(tail, 0).start;
    if (t > m0 - 0.05) this.magnifier(c, p, an.nub, springStep(t - m0 + 0.05, 3.5, 0.45));
    c.restore();
    return { zoom: 1 + 0.004 * pulse(t, this.hit - this.bp, 0.1) };
  }

  /** A dimension line from the floor up to a height, with arrowheads and a label (side -1 left, 1 right, 0 on top). */
  private dimension(c: CanvasRenderingContext2D, x: number, y0: number, y1: number, label: string, side: number) {
    c.strokeStyle = INK(); c.fillStyle = INK(); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke();
    for (const [y, dir] of [[y0, -1], [y1, 1]] as const) {
      c.beginPath(); c.moveTo(x - 16, y); c.lineTo(x + 16, y); c.stroke();
      c.beginPath(); c.moveTo(x, y); c.lineTo(x - 6, y - dir * 14); c.lineTo(x + 6, y - dir * 14); c.closePath(); c.fill();
    }
    c.font = font(F.mono(500), 19); c.letterSpacing = '2px';
    c.textAlign = side < 0 ? 'right' : side > 0 ? 'left' : 'center';
    if (side) c.fillText(label, x + side * 22, (y0 + y1) / 2 + 7);
    else c.fillText(label, x, y1 - 24);
    c.textAlign = 'left'; c.letterSpacing = '0px';
  }

  /** A round lens over the nub, showing it at 2.6×, with a scale bar. */
  private magnifier(c: CanvasRenderingContext2D, p: SidePose, nub: [number, number], k: number) {
    const R = 125 * k, mag = 2.0;
    const cx = nub[0] + 170, cy = nub[1] - 250;
    if (R < 2) return;
    c.save();
    c.strokeStyle = INK(); c.lineWidth = 1.5;
    c.beginPath(); c.arc(nub[0], nub[1], 26, 0, Math.PI * 2); c.stroke();
    const dx = cx - nub[0], dy = cy - nub[1], dl = Math.hypot(dx, dy);
    c.beginPath(); c.moveTo(nub[0] + (dx / dl) * 26, nub[1] + (dy / dl) * 26); c.lineTo(cx - (dx / dl) * R, cy - (dy / dl) * R); c.stroke();
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2);
    c.fillStyle = rgba('bone'); c.fill();
    c.save(); c.clip();
    c.translate(cx, cy); c.scale(mag, mag); c.translate(-nub[0], -nub[1]);
    drawSide(c, p, { paper: true });
    c.restore();
    c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, R + 7, 0, Math.PI * 2); c.stroke();
    if (k > 0.8) {
      c.font = font(F.mono(500), 19); c.letterSpacing = '2px'; c.fillStyle = INK();
      c.textAlign = 'center';
      c.fillText('TAIL (UP)', cx, cy + R + 44);
      c.letterSpacing = '0px';
      // scale bar: 2 cm at this magnification
      const bar = 0.02 / 0.33 * p.s * mag * 0.5;
      c.fillRect(cx - bar / 2, cy + R + 64, bar, 3);
      c.fillRect(cx - bar / 2, cy + R + 58, 1.5, 15); c.fillRect(cx + bar / 2 - 1.5, cy + R + 58, 1.5, 15);
      c.font = font(F.mono(400), 15);
      c.fillText('2 cm', cx, cy + R + 94);
      c.textAlign = 'left';
    }
    c.restore();
  }

  /** From the spring to the cut: he comes at the lens, the giraffe hits on the downbeat and stays flattened. */
  private drawSmooshPhase(c: CanvasRenderingContext2D, t: number, t0: number) {
    const approach = prog(t, t0, this.hit, ease.linear);
    const onGlass = t >= this.hit;
    // after the hit he keeps pushing, a little harder on every beat
    const push = onGlass ? 0.85 + 0.15 * Math.abs(Math.sin(((t - this.hit) / this.bp) * Math.PI)) : 0;
    // the page behind, darkened by his bulk as he gets close
    c.fillStyle = rgba('ink', 0.25 + 0.6 * approach);
    c.fillRect(0, 0, W, H);
    drawSmoosh(c, { approach, push, pull: 0, fold: this.n === 2 ? -0.6 : 0 });
    if (onGlass) {
      // "Dance, Gryffy" printed across the flattened toy
      const dance = piecesOf(this.lines.dance).slice(0, 2);
      const st = { ...PAPER_RUN(F.archivo(75, 900), 150), lead: 1 };
      drawRun(c, dance, 470, 905, t, st);
      // squeak, on the hit and on the next beat
      for (const [k, x, y] of [[0, 190, 300], [1, 250, 390]] as const) {
        const ts = this.hit + k * this.bp;
        if (t < ts) continue;
        c.globalAlpha = 1 - smoothstep(ts + 0.25, ts + 0.6, t);
        c.fillStyle = rgba('bone');
        c.font = font(F.serif(400, true), 58 + 10 * pulse(t, ts, 0.08));
        c.fillText('squeak', x, y);
        c.globalAlpha = 1;
      }
    }
    const hitK = pulse(t, this.hit, 0.09);
    return { shake: [Math.sin(t * 90) * 14 * hitK, Math.cos(t * 77) * 10 * hitK] as [number, number], zoom: 1 + 0.03 * hitK, flash: 0.15 * hitK, vignette: 0.35 };
  }
}

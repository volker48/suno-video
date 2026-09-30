// encore — "Give us one more" (TREATMENT.md), the final chorus up to "…right back around".
// "Dance, Gryffy, tear up the floor": he's awake at once, the lights slam on, the zoomies again.
// "Little tuxedo king, give us one more": the play bow with the ball in his mouth, then the last and
// biggest smoosh, the ball itself, on "one"; on "more" it's thrown. "Snort, spin…": the chalk floor
// covered edge to edge in paw prints, ENCORE in the middle.
import type * as THREE from 'three';
import { Scene, type Frame } from '../../../engine/scene';
import { Layer2D, W, H, clearRT } from '../../../engine/gl';
import { LIN, rgba } from '../../../engine/palette';
import { F, font, measure } from '../../../engine/type';
import type { Line } from '../../../engine/lyrics';
import { ease, hash, lerp, prog, pulse, smoothstep, TAU } from '../../../engine/util';
import { anchors, drawSide, drawTop, playBow, stand } from './gryffy';
import { drawRun, piecesOf, runText, wrapRun, type RunStyle } from './karaoke';
import { type Cam, drawParquet, withCam } from './parquet';
import { ball, paw } from './props';
import { drawNosePrint, drawSmoosh } from './smoosh';
import { drawTornRun } from './zoomies';

const DARK = (size: number): RunStyle => ({ family: F.archivo(87.5, 900), size, ink: rgba('bone'), dim: 0.22, lit: rgba('signal'), lead: 0.6 });

export default class Encore extends Scene {
  layer = new Layer2D();
  l: Line[] = [];
  beats: number[] = [];

  override init() {
    const { lyrics, audio, start, end } = this.ctx;
    this.l = [lyrics.get('tear up the floor', 2), lyrics.get('give us one more'), lyrics.get('Snort, spin', 2)];
    const b0 = Math.ceil(audio.beatAt(start)), b1 = Math.floor(audio.beatAt(end));
    for (let b = b0; b <= b1; b++) this.beats.push(audio.timeOfBeat(b));
  }

  private w(li: number, wi: number) { return this.l[li]!.words[wi]!; }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp } = this.ctx;
    const t = f.t;
    clearRT(renderer, out, LIN.ink);
    const L = this.layer; L.clear(rgba('ink'));
    const c = L.ctx;
    let post = {};
    if (t < this.l[1]!.start - 0.05) post = this.wake(c, t);
    else if (t < this.l[2]!.start - 0.05) post = this.oneMore(c, t);
    else post = this.prints(c, t);
    comp.draw(renderer, L.upload(), out);
    return { bloom: 0.45, halation: 0, ca: 0.5, vignette: 0.45, ...post };
  }

  private wake(c: CanvasRenderingContext2D, t: number) {
    const t0 = this.w(0, 0).start;
    drawTornRun(c, t, t0 + 0.2, t0 + 1.0, 330);
    const ps = piecesOf(this.l[0]!);
    const st = { ...DARK(150), family: F.archivo(100, 900), lead: 0.3 };
    drawRun(c, ps.slice(0, 2), 170, 720, t, st);
    drawRun(c, ps.slice(2), 170, 880, t, st);
    // the lights slam on as the chorus comes back
    return { flash: 0.45 * pulse(t, t0, 0.07), fade: 1 - prog(t, this.ctx.start, t0 + 0.02) };
  }

  private oneMore(c: CanvasRenderingContext2D, t: number) {
    const give = this.w(1, 3).start, one = this.w(1, 5).start, more = this.w(1, 6).start;
    const ps = piecesOf(this.l[1]!);
    if (t < give) {
      // the play bow, ball in his mouth, wiggling for it
      const g = c.createRadialGradient(960, 760, 40, 960, 760, 760);
      g.addColorStop(0, rgba('bone', 0.14)); g.addColorStop(1, rgba('bone', 0));
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.strokeStyle = rgba('graphite', 0.5); c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(0, 900); c.lineTo(W, 900); c.stroke();
      const p = playBow(stand(1100, 900, 500, -1));
      const wig = Math.sin((t - this.l[1]!.start) * TAU * 2.2);
      p.hip += 0.02 * wig; p.tail += 0.4 * wig; p.mouth = 0.5; p.tongue = 0;
      drawSide(c, p);
      const a = anchors(p);
      ball(c, a.grin[0] - 10, a.grin[1] + 12, 44, 1, 0.6);
    } else {
      // the last smoosh: the ball on the glass on "one", thrown on "more"
      const approach = prog(t, give, one);
      const push = t >= one ? 0.85 + 0.15 * Math.abs(Math.sin((t - one) * 7)) : 0;
      const pull = prog(t, more, more + 0.3, ease.inQuad);
      c.fillStyle = rgba('ink2'); c.fillRect(0, 0, W, H);
      drawSmoosh(c, { approach, push, pull, fold: 0, toy: 'ball' });
      if (t > more) {
        // thrown: the ball flies off into the room, the camera whipping after it
        const k = prog(t, more, more + 0.6, ease.outCubic);
        ball(c, lerp(960, 1700, k), lerp(700, 200, k), lerp(300, 30, k), 1, 1);
        drawNosePrint(c, smoothstep(more, more + 0.2, t), 1.5);
      }
    }
    drawRun(c, ps.slice(0, 3), 150, 180, t, DARK(104));
    drawRun(c, ps.slice(3), 150, 300, t, DARK(104));
    const k = pulse(t, one, 0.09);
    return { shake: [Math.sin(t * 90) * 18 * k, Math.cos(t * 77) * 12 * k] as [number, number], zoom: 1 + 0.04 * k, flash: 0.2 * k };
  }

  private prints(c: CanvasRenderingContext2D, t: number) {
    const cam: Cam = { x: 7000, y: -3000, zoom: 1, rot: 0.04 * Math.sin(t * 0.7) };
    withCam(c, cam, () => drawParquet(c, cam));
    const t0 = this.l[2]!.start;
    // paw prints everywhere, more on every beat
    const beatsIn = this.beats.filter((b) => b <= t && b >= t0 - 0.2).length;
    const n = Math.min(260, 40 + beatsIn * 34);
    for (let i = 0; i < n; i++) {
      const x = 80 + hash(i, 1) * (W - 160), y = 80 + hash(i, 2) * (H - 160);
      const a = hash(i, 3) * TAU;
      c.save(); c.translate(x, y); c.rotate(a);
      c.fillStyle = rgba('bone', 0.14 + 0.2 * hash(i, 4));
      paw(c, 14 + 8 * hash(i, 5));
      c.restore();
    }
    // ENCORE, in chalk, and the ball at the centre
    c.fillStyle = rgba('bone', 0.2);
    c.font = font(F.archivo(125, 900), 300); c.textAlign = 'center';
    c.fillText('ENCORE', W / 2, 720);
    c.textAlign = 'left';
    ball(c, W / 2, 540, 50, 1 + 0.1 * pulse(t, this.beats.find((b) => b > t - 0.45 && b <= t) ?? -9, 0.1));
    // Gryffy spinning round the ball on "spin", galloping the circle after
    const spin0 = this.w(2, 1).start, spin1 = this.w(2, 1).end;
    const run = prog(t, spin1, this.ctx.end, ease.inOutQuad);
    const a = -Math.PI / 2 + run * TAU * 1.5;
    const R = 300;
    const spin = prog(t, spin0, spin1, ease.inOutCubic) * TAU;
    drawTop(c, { x: W / 2 + R * Math.cos(a), y: 540 + R * Math.sin(a), s: 300, heading: a + Math.PI / 2 + spin, phase: t * TAU * 4, stride: 0.9, stretch: 1.15, wind: 0.3, turn: 0 });
    const st = DARK(96);
    const rows = wrapRun(piecesOf(this.l[2]!), st.family, st.size, 1600);
    rows.forEach((r, i) => drawRun(c, r, W / 2 - measure(runText(r), st.family, st.size) / 2, 170 + i * 110, t, st));
    return {};
  }
}

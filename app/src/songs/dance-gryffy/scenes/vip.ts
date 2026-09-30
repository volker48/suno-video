// vip ×2 — "The velvet rope" (TREATMENT.md). params.n: 1 | 2.
// "Dance, Gryffy, run wild, run free": laps of a chalk running track on the ballroom floor, a deadpan
// lap counter in the corner. "That bright green ball's your VIP": the ball comes bouncing down the
// carpet between the velvet ropes under camera flashes, wearing its lanyard, and VIP is stamped on
// the guest list, a letter per sung syllable. Each couplet plays twice; the second time the stamp is
// already there and the flashes double. On the second visit the list runs to three pages, every
// entry is the ball, and one rope has been chewed through.
import type * as THREE from 'three';
import { Scene, type Frame } from '../../../engine/scene';
import { Layer2D, W, H, clearRT } from '../../../engine/gl';
import { LIN, rgba } from '../../../engine/palette';
import { F, font, measure } from '../../../engine/type';
import type { Line, Word } from '../../../engine/lyrics';
import { ease, hash, lerp, prog, pulse, TAU } from '../../../engine/util';
import { drawSmear, drawTop } from './gryffy';
import { drawRun, piecesOf, runText, type RunStyle } from './karaoke';
import { type Cam, drawParquet, withCam } from './parquet';
import { ball } from './props';

const TRACK = { x: 960, y: 560, rx: 720, ry: 330 };
const VP: [number, number] = [1400, 470];

export default class Vip extends Scene {
  layer = new Layer2D();
  n = 1;
  runs: Line[] = [];
  vips: Line[] = [];
  bp = 0.45;

  override init() {
    const { lyrics, audio, params } = this.ctx;
    this.n = params.n === 2 ? 2 : 1;
    const k = this.n === 1 ? 0 : 2;
    this.runs = [lyrics.get('run wild, run free', k), lyrics.get('run wild, run free', k + 1)];
    this.vips = [lyrics.get('your VIP', k), lyrics.get('your VIP', k + 1)];
    this.bp = 60 / audio.bpm;
  }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp } = this.ctx;
    const t = f.t;
    clearRT(renderer, out, LIN.ink);
    const L = this.layer;
    L.clear(rgba('ink'));
    const c = L.ctx;
    const [r1, r2] = this.runs, [v1, v2] = this.vips;
    let post = {};
    if (t < v1!.start - 0.05) post = this.laps(c, t, r1!, 0);
    else if (t < r2!.start - 0.05) post = this.entrance(c, t, v1!, 0);
    else if (t < v2!.start - 0.05) post = this.laps(c, t, r2!, 1);
    else post = this.entrance(c, t, v2!, 1);
    comp.draw(renderer, L.upload(), out);
    return { bloom: 0.5, halation: 0, ca: 0.5, vignette: 0.45, grain: 0.05, ...post };
  }

  // ---------------------------------------------------------------- the laps

  private laps(c: CanvasRenderingContext2D, t: number, line: Line, rep: number) {
    const t0 = line.words[0]!.start;
    const lapT = rep ? 1.0 : 1.2; // faster the second time
    const cam: Cam = { x: 3600 + 900 * this.n, y: -1200, zoom: 1, rot: 0 };
    const at = (tt: number) => {
      const a = Math.PI * 0.5 + ((tt - t0) / lapT) * TAU;
      return { x: TRACK.x + TRACK.rx * Math.cos(a), y: TRACK.y + TRACK.ry * Math.sin(a), a };
    };
    withCam(c, cam, () => drawParquet(c, cam));
    // the chalk track: two lanes, a start line
    c.strokeStyle = rgba('bone', 0.3); c.lineWidth = 2; c.setLineDash([14, 12]);
    for (const d of [-90, 0, 90]) {
      c.beginPath(); c.ellipse(TRACK.x, TRACK.y, TRACK.rx + d, TRACK.ry + d, 0, 0, TAU); c.stroke();
    }
    c.setLineDash([]);
    c.strokeStyle = rgba('bone', 0.6); c.lineWidth = 4;
    c.beginPath(); c.moveTo(TRACK.x, TRACK.y + TRACK.ry - 90); c.lineTo(TRACK.x, TRACK.y + TRACK.ry + 90); c.stroke();
    // Gryffy, flat out, anticlockwise from the start line
    const p = at(t), q = at(t + 0.01);
    drawSmear(c, Array.from({ length: 16 }, (_, g) => { const s = at(t - 0.02 - g * 0.018); return [s.x, s.y] as [number, number]; }), 130);
    drawTop(c, { x: p.x, y: p.y, s: 330, heading: Math.atan2(q.y - p.y, q.x - p.x), phase: t * TAU * 6, stride: 1, stretch: 1.35, wind: 0.5, turn: 0 });
    // the lyric in the infield
    const st: RunStyle = { family: F.archivo(100, 900), size: 128, ink: rgba('bone'), dim: 0.22, lit: rgba('signal'), lead: 2.5 };
    const ps = piecesOf(line);
    const rows = [ps.slice(0, 2), ps.slice(2)];
    rows.forEach((r, i) => drawRun(c, r, W / 2 - measure(runText(r), st.family, st.size) / 2, 520 + i * 140, t, st));
    // the lap counter, deadpan
    const lapsBefore = this.n === 1 ? (rep ? 4 : 0) : (rep ? 61 : 57);
    const lap = lapsBefore + 1 + Math.max(0, Math.floor((t - t0) / lapT));
    c.textAlign = 'right';
    c.fillStyle = rgba('bone', 0.55); c.font = font(F.mono(500), 18); c.letterSpacing = '3px';
    c.fillText('LAP', W - 150, 130);
    c.fillStyle = rgba('bone'); c.font = font(F.archivo(75, 900), 110); c.letterSpacing = '0px';
    c.fillText(String(lap), W - 150, 240);
    c.fillStyle = rgba('bone', 0.55); c.font = font(F.mono(400), 17); c.letterSpacing = '2px';
    c.fillText(`BEST LAP ${lapT.toFixed(2)} s · ${rep ? 23 : 19} KM/H`, W - 150, 280);
    c.letterSpacing = '0px'; c.textAlign = 'left';
    return { zoom: 1 + 0.006 * this.ctx.audio.hit('kick', t, 0.1) };
  }

  // ---------------------------------------------------------------- the entrance

  /** A point on the carpet: u 0 at the door .. 1 at the front edge, s -1 left edge .. 1 right edge. */
  private carpet(u: number, s: number): [number, number, number] {
    const y = lerp(VP[1], H + 40, u * u);
    const half = lerp(55, 560, u * u);
    return [lerp(VP[0], 1340, u * u) + s * half, y, lerp(0.1, 1, u * u)];
  }

  private entrance(c: CanvasRenderingContext2D, t: number, line: Line, rep: number) {
    const vip = line.words[line.words.length - 1]!;
    const t0 = line.words[0]!.start - 0.05;
    // door light
    const g = c.createRadialGradient(VP[0], VP[1] - 70, 10, VP[0], VP[1] - 70, 520);
    g.addColorStop(0, rgba('bone', 0.2)); g.addColorStop(1, rgba('bone', 0));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = rgba('bone', 0.85); c.fillRect(VP[0] - 55, VP[1] - 150, 110, 150);
    // the carpet runner: ink, gilt edges, perspective seams
    const [a0, a1, b0, b1] = [this.carpet(0, -1), this.carpet(0, 1), this.carpet(1, 1), this.carpet(1, -1)];
    c.fillStyle = rgba('ink2'); c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(a1[0], a1[1]); c.lineTo(b0[0], b0[1]); c.lineTo(b1[0], b1[1]); c.closePath(); c.fill();
    c.strokeStyle = rgba('accent', 0.7); c.lineWidth = 3; c.stroke();
    c.strokeStyle = rgba('bone', 0.05); c.lineWidth = 1;
    for (let i = 1; i < 14; i++) { const u = i / 14; const l = this.carpet(u, -1), r = this.carpet(u, 1); c.beginPath(); c.moveTo(l[0], l[1]); c.lineTo(r[0], r[1]); c.stroke(); }
    // stanchions and velvet ropes
    const posts = [0.22, 0.42, 0.62, 0.82, 1.02];
    for (const side of [-1, 1]) {
      const pts = posts.map((u) => { const [x, y, s] = this.carpet(u, side * 1.12); return [x, y, s] as const; });
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0, s0] = pts[i]!, [x1, y1, s1] = pts[i + 1]!;
        const h0 = 240 * s0, h1 = 240 * s1;
        const chewed = this.n === 2 && side > 0 && i === 2;
        c.strokeStyle = rgba('ink'); c.lineWidth = 14 * (s0 + s1) / 2;
        c.lineCap = 'round';
        const mx = (x0 + x1) / 2, my = (y0 - h0 * 0.85 + y1 - h1 * 0.85) / 2 + 60 * (s0 + s1) / 2;
        if (!chewed) {
          c.beginPath(); c.moveTo(x0, y0 - h0 * 0.85); c.quadraticCurveTo(mx, my, x1, y1 - h1 * 0.85); c.stroke();
          c.strokeStyle = rgba('bone', 0.5); c.lineWidth = 2;
          c.beginPath(); c.moveTo(x0, y0 - h0 * 0.85 - 5 * s0); c.quadraticCurveTo(mx, my - 6 * s0, x1, y1 - h1 * 0.85 - 5 * s1); c.stroke();
        } else {
          // chewed through: two frayed ends hanging from the posts
          for (const [x, y, h, s, dir] of [[x0, y0, h0, s0, 1], [x1, y1, h1, s1, -1]] as const) {
            c.strokeStyle = rgba('ink'); c.lineWidth = 14 * s;
            c.beginPath(); c.moveTo(x, y - h * 0.85); c.quadraticCurveTo(x + dir * 30 * s, y - h * 0.5, x + dir * 22 * s, y - h * 0.3); c.stroke();
            c.strokeStyle = rgba('bone', 0.6); c.lineWidth = 1.5;
            for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x + dir * 22 * s, y - h * 0.3); c.lineTo(x + dir * (22 + k * 4) * s, y - h * 0.3 + 18 * s); c.stroke(); }
          }
        }
      }
      for (const [x, y, s] of pts) {
        c.strokeStyle = rgba('accent'); c.lineWidth = 9 * s;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 240 * s); c.stroke();
        c.fillStyle = rgba('accent'); c.beginPath(); c.arc(x, y - 240 * s, 14 * s, 0, TAU); c.fill();
        c.beginPath(); c.ellipse(x, y, 34 * s, 10 * s, 0, 0, TAU); c.fill();
      }
    }
    // camera flashes along the ropes: on the beats, doubled the second time (and on the second visit)
    const per = rep || this.n === 2 ? this.bp / 2 : this.bp;
    const k0 = Math.floor((t - t0) / per);
    for (let k = Math.max(0, k0 - 1); k <= k0; k++) {
      const tf = t0 + k * per;
      const a = pulse(t, tf, 0.05);
      if (a < 0.02) continue;
      for (let j = 0; j < (rep ? 2 : 1) * this.n; j++) {
        const side = hash(k, j, 3) > 0.5 ? 1 : -1;
        const [x, y, s] = this.carpet(0.2 + 0.7 * hash(k, j, 5), side * (1.35 + 0.3 * hash(k, j)));
        flash(c, x, y - 300 * s, 260 * s + 80, a);
      }
    }
    // the ball bounces down the carpet and stops front and centre for "VIP"
    const u = lerp(0.05, 0.84, prog(t, t0, vip.start, ease.outCubic));
    const [bx, by, bs] = this.carpet(u, 0);
    const bounce = Math.abs(Math.sin(((t - t0) / this.bp) * Math.PI)) * (1 - prog(t, vip.start - 0.2, vip.start + 0.2));
    const R = 150 * bs;
    const cy = by - R - bounce * 180 * bs;
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.beginPath(); c.ellipse(bx, by, R * (1.1 - 0.3 * bounce), R * 0.22, 0, 0, TAU); c.fill();
    ball(c, bx, cy, R);
    this.lanyard(c, bx, cy, R, t);
    // the guest list, and the stamp
    this.guestList(c, t, vip, rep);
    // the lyric
    const st: RunStyle = { family: F.archivo(87.5, 900), size: 104, ink: rgba('bone'), dim: 0.22, lit: rgba('signal'), lead: 0.5 };
    const ps = piecesOf(line);
    drawRun(c, ps.slice(0, 3), 650, 180, t, st);
    drawRun(c, ps.slice(3), 650, 300, t, st);
    return { flash: 0.06 * pulse(t, vip.start, 0.08) };
  }

  /** The VIP lanyard: a cord over the ball and a badge hanging in front, swinging. */
  private lanyard(c: CanvasRenderingContext2D, x: number, y: number, R: number, t: number) {
    const sway = 0.12 * Math.sin(t * 7.1);
    const bx = x + Math.sin(sway) * R * 0.9, by = y + R * 0.85;
    c.strokeStyle = rgba('ink'); c.lineWidth = Math.max(2, R * 0.05);
    c.beginPath(); c.moveTo(x - R * 0.75, y - R * 0.55); c.quadraticCurveTo(x - R * 0.4, y + R * 0.2, bx - R * 0.12, by - R * 0.28); c.stroke();
    c.beginPath(); c.moveTo(x + R * 0.75, y - R * 0.55); c.quadraticCurveTo(x + R * 0.4, y + R * 0.2, bx + R * 0.12, by - R * 0.28); c.stroke();
    c.save();
    c.translate(bx, by); c.rotate(sway);
    const w = R * 1.25, h = R * 0.78;
    c.fillStyle = rgba('bone'); c.fillRect(-w / 2, -h / 2, w, h);
    c.strokeStyle = rgba('ink'); c.lineWidth = Math.max(1, R * 0.015); c.strokeRect(-w / 2, -h / 2, w, h);
    c.fillStyle = rgba('ink'); c.textAlign = 'center';
    c.font = font(F.archivo(75, 900), R * 0.42); c.fillText('VIP', 0, R * 0.08);
    c.font = font(F.mono(500), R * 0.1); c.letterSpacing = `${R * 0.02}px`; c.fillText('ALL ACCESS', 0, R * 0.26);
    c.letterSpacing = '0px'; c.textAlign = 'left';
    c.restore();
  }

  /** The clipboard at the door: the ball on the list, VIP stamped on it a letter per syllable. */
  private guestList(c: CanvasRenderingContext2D, t: number, vip: Word, rep: number) {
    c.save();
    c.translate(120, 380); c.rotate(-0.035); c.scale(1.18, 1.18);
    const w = 450, h = 560;
    c.fillStyle = rgba('graphite'); c.fillRect(-14, -14, w + 28, h + 28);
    c.fillStyle = rgba('bone'); c.fillRect(0, 0, w, h);
    c.fillStyle = rgba('accent'); c.fillRect(w / 2 - 70, -30, 140, 40);
    c.fillStyle = rgba('ink');
    c.font = font(F.serif(600, true), 40); c.fillText('The Gryffy Ball', 30, 76);
    c.font = font(F.mono(500), 15); c.letterSpacing = '3px';
    c.fillText(this.n === 1 ? 'GUEST LIST · DOOR 1' : 'GUEST LIST · PAGE 3 OF 3', 30, 108);
    c.fillRect(30, 124, w - 60, 1.5);
    c.letterSpacing = '0px';
    c.font = font(F.mono(500), 21);
    const entries = this.n === 1 ? ['01  THE BALL', '    +1 GIRAFFE (BLUE)'] : Array.from({ length: 11 }, (_, i) => `${String(29 + i).padStart(2, '0')}  THE BALL`);
    entries.forEach((e, i) => c.fillText(e, 30, 168 + i * 36));
    if (this.n === 1) {
      c.strokeStyle = rgba('ink', 0.25); c.setLineDash([3, 7]); c.lineWidth = 1.5;
      for (let i = 2; i < 11; i++) { c.beginPath(); c.moveTo(30, 170 + i * 36); c.lineTo(w - 30, 170 + i * 36); c.stroke(); }
      c.setLineDash([]);
    }
    // stamps: the first time on the first entry; the second time, it is already there and gets another
    const stampAt = (sx: number, sy: number, rot: number, tt: number, syl: [number, number][] | undefined) => {
      const times = syl && syl.length === 3 ? syl.map((s) => s[0]) : [0, 1, 2].map((i) => tt + i * 0.2);
      c.save(); c.translate(sx, sy); c.rotate(rot);
      c.font = font(F.archivo(75, 900), 64);
      c.fillStyle = rgba('blood');
      let x = 0;
      'VIP'.split('').forEach((ch, i) => {
        const ti = times[i]!;
        const k = prog(t, ti, ti + 0.06);
        if (k > 0) {
          c.save(); c.translate(x, 0); const s = 1 + 0.5 * (1 - k); c.scale(s, s);
          c.globalAlpha = 0.92; c.fillText(ch, 0, 0); c.restore();
        }
        x += measure(ch, F.archivo(75, 900), 64);
      });
      c.strokeStyle = rgba('blood', 0.92); c.lineWidth = 5;
      if (t > times[2]!) c.strokeRect(-14, -58, x + 28, 72);
      c.restore();
    };
    const first = this.vips[0]!.words[this.vips[0]!.words.length - 1]!;
    stampAt(260, 176, -0.14, first.start, first.syl);
    if (rep) stampAt(250, this.n === 1 ? 250 : 300, 0.1, vip.start, vip.syl);
    c.restore();
  }
}

/** A camera flash: a bright core with four spikes, fading fast. */
function flash(c: CanvasRenderingContext2D, x: number, y: number, r: number, a: number) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba('bone', 0.95 * a)); g.addColorStop(0.15, rgba('bone', 0.5 * a)); g.addColorStop(1, rgba('bone', 0));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.strokeStyle = rgba('bone', 0.8 * a); c.lineWidth = 3;
  c.beginPath(); c.moveTo(x - r * 0.9, y); c.lineTo(x + r * 0.9, y); c.moveTo(x, y - r * 0.9); c.lineTo(x, y + r * 0.9); c.stroke();
}

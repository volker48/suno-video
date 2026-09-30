// profile — "The society pages" (TREATMENT.md), verse 2, four movements.
// 1 "Button nose and a crooked little smile": the society portrait, annotated like a naturalist's plate.
// 2 "Skids past the sofa like a champion mile": a photo finish, the sofa as the finish line, a
//   telestrator arc over the skid and the official result.
// 3 "Bow tie sideways, ears standing tall": the Beaufort Scale for Bat Ears, Gryffy in the wind.
// 4 "He claims the rug like he owns it all": top-down, three circles and down; the surveyor draws
//   the boundary and the plan is stamped HIS.
import type * as THREE from 'three';
import { Scene, type Frame } from '../../../engine/scene';
import { Layer2D, W, H, clearRT } from '../../../engine/gl';
import { LIN, rgba } from '../../../engine/palette';
import { F, font } from '../../../engine/type';
import type { Line } from '../../../engine/lyrics';
import { ease, lerp, prog, pulse, smoothstep, TAU } from '../../../engine/util';
import { drawSide, drawSmear, drawTop, stand, TONGUE, type SidePose } from './gryffy';
import { drawRun, PAPER_RUN, piecesOf, type RunStyle } from './karaoke';
import { paperPass } from './paper';
import { type Cam, drawParquet, withCam } from './parquet';
import { photoPoint, Portrait, TUX_CROP, TUX_FEATURES, type PortraitView } from './portrait';

const DARK = (size: number): RunStyle => ({ family: F.archivo(87.5, 900), size, ink: rgba('bone'), dim: 0.22, lit: rgba('signal'), lead: 0.5 });

export default class Profile extends Scene {
  paper = paperPass();
  front = new Layer2D();
  portrait = new Portrait();
  l: Line[] = [];

  override async init() {
    const { lyrics } = this.ctx;
    this.l = ['Button nose', 'Skids past the sofa', 'Bow tie sideways', 'claims the rug'].map((q) => lyrics.get(q));
    this.paper.u.seed!.value = 17;
    await this.portrait.load(this.ctx.song);
  }

  private w(li: number, wi: number) { return this.l[li]!.words[wi]!; }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp } = this.ctx;
    const t = f.t;
    this.front.clear();
    if (t < this.l[1]!.start - 0.05) {
      this.paper.render(renderer, out);
      const view = this.portraitView(t);
      comp.draw(renderer, this.portrait.render(renderer, view), out);
      this.society(this.front.ctx, t, view);
      comp.draw(renderer, this.front.upload(), out);
      return { bloom: 0, halation: 0, ca: 0.3, vignette: 0.15, grain: 0.04 };
    }
    if (t < this.l[2]!.start - 0.05) {
      clearRT(renderer, out, LIN.ink);
      const post = this.finish(this.front.ctx, t);
      comp.draw(renderer, this.front.upload(), out);
      return { bloom: 0.4, halation: 0, ca: 0.4, vignette: 0.45, ...post };
    }
    if (t < this.l[3]!.start - 0.05) {
      this.paper.render(renderer, out);
      this.beaufort(this.front.ctx, t);
      comp.draw(renderer, this.front.upload(), out);
      return { bloom: 0, halation: 0, ca: 0.3, vignette: 0.15, grain: 0.04 };
    }
    clearRT(renderer, out, LIN.ink);
    const post = this.rug(this.front.ctx, t);
    comp.draw(renderer, this.front.upload(), out);
    return { bloom: 0.4, halation: 0, ca: 0.4, vignette: 0.45, ...post };
  }

  // ---------------------------------------------------------------- 1. the society portrait

  private portraitView(t: number): PortraitView {
    const t0 = this.ctx.start;
    return { ...TUX_CROP, cx: 640, cy: 590, rx: 300, ry: 380, pitch: 5, reveal: prog(t, t0, t0 + 0.9, ease.outCubic) };
  }

  private society(c: CanvasRenderingContext2D, t: number, view: PortraitView) {
    const ink = rgba('ink');
    c.fillStyle = ink;
    c.font = font(F.serif(600, true), 64); c.fillText('The Society Pages', 1060, 170);
    c.font = font(F.mono(500), 16); c.letterSpacing = '3px';
    c.fillText('PLATE III · THE GUEST OF HONOUR, FROM LIFE', 1062, 208);
    c.letterSpacing = '0px';
    c.strokeStyle = ink; c.lineWidth = 2;
    c.beginPath(); c.ellipse(view.cx, view.cy, view.rx + 14, view.ry + 14, 0, 0, TAU); c.stroke();
    c.lineWidth = 0.8; c.beginPath(); c.ellipse(view.cx, view.cy, view.rx + 22, view.ry + 22, 0, 0, TAU); c.stroke();
    // naturalist's callouts, each drawn on its word
    const call = (feature: readonly [number, number], label: string, ty: number, t0: number) => {
      const k = prog(t, t0, t0 + 0.3, ease.outCubic);
      if (k <= 0) return;
      const [fx, fy] = photoPoint(view, feature[0], feature[1]);
      const lx = 1060, ly = ty;
      c.strokeStyle = ink; c.lineWidth = 1.5;
      c.beginPath(); c.arc(fx, fy, 9, 0, TAU); c.stroke();
      c.beginPath(); c.moveTo(fx + 9, fy); c.lineTo(lerp(fx + 9, lx - 20, k), lerp(fy, ly - 8, k)); c.stroke();
      if (k >= 1) {
        c.beginPath(); c.moveTo(lx - 20, ly - 8); c.lineTo(lx - 4, ly - 8); c.stroke();
        c.font = font(F.mono(500), 22); c.letterSpacing = '3px'; c.fillStyle = ink;
        c.fillText(label, lx, ly); c.letterSpacing = '0px';
      }
    };
    call(TUX_FEATURES.nose, 'NOSE: BUTTON', 330, this.w(0, 1).start);
    call(TUX_FEATURES.eyeR, 'EYES: BROWN, 2', 410, this.w(0, 2).start);
    call(TUX_FEATURES.mouthCorner, 'SMILE: CROOKED (L)', 490, this.w(0, 6).start);
    call(TUX_FEATURES.earL, 'EARS: SEE PLATE IV', 570, this.w(0, 6).start + 0.35);
    const st = { ...PAPER_RUN(F.archivo(87.5, 900), 82), lead: 0.5 };
    const ps = piecesOf(this.l[0]!);
    drawRun(c, ps.slice(0, 4), 1060, 790, t, st);
    drawRun(c, ps.slice(4), 1060, 890, t, st);
  }

  // ---------------------------------------------------------------- 2. the photo finish

  private finish(c: CanvasRenderingContext2D, t: number) {
    const skid = this.w(1, 0).start, champ = this.w(1, 6).start, mile = this.w(1, 7).start;
    const GROUND = 850, LINE = 1260;
    // the photo-finish print: time ticks along the top, the finish line
    c.strokeStyle = rgba('bone', 0.35); c.lineWidth = 1; c.fillStyle = rgba('bone', 0.5);
    c.font = font(F.mono(400), 15); c.letterSpacing = '2px';
    for (let i = 0; i <= 16; i++) {
      const x = 150 + i * 100;
      c.beginPath(); c.moveTo(x, 360); c.lineTo(x, i % 2 ? 372 : 384); c.stroke();
      if (i % 4 === 0) c.fillText(`0:0${(3 + i * 0.025).toFixed(2)}`, x - 30, 350);
    }
    c.letterSpacing = '0px';
    c.fillStyle = rgba('bone', 0.9); c.fillRect(LINE - 2, 390, 4, GROUND - 390 + 80);
    c.font = font(F.mono(500), 16); c.letterSpacing = '4px'; c.fillText('FINISH', LINE + 14, 410); c.letterSpacing = '0px';
    c.strokeStyle = rgba('graphite', 0.5); c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke();
    sofa(c, LINE + 60, GROUND, 520);
    // Gryffy skids in, braking, and stops with his nose on the line on "champion"
    const k = prog(t, skid, champ, ease.outCubic);
    const x = lerp(-400, LINE - 250, k);
    const speed = 1 - k;
    const p: SidePose = {
      ...stand(x, GROUND, 400, 1), stretch: 1 + 0.45 * speed, chest: 0.44, hip: 0.5, lean: 0.06,
      fn: [0.3, 0], ff: [0.24, 0], hn: [-0.14, 0], hf: [-0.08, 0], wind: 0.8 * speed, pitch: -0.05, mouth: 0.4, tongue: 0.7,
    };
    if (speed > 0.05) drawSmear(c, Array.from({ length: 10 }, (_, g) => [x - 60 - g * 50 * (0.3 + speed), GROUND - 180] as [number, number]), 240, speed);
    // skid marks under the front paws
    c.strokeStyle = rgba('bone', 0.35); c.lineWidth = 4;
    c.beginPath(); c.moveTo(Math.max(0, x - 900 * k), GROUND + 4); c.lineTo(x + 0.35 * 400, GROUND + 4); c.stroke();
    drawSide(c, p);
    // the replay: a telestrator arc over the skid
    const arc = prog(t, champ, mile, ease.inOutCubic);
    if (arc > 0) {
      c.strokeStyle = rgba('signal'); c.lineWidth = 6; c.lineCap = 'round';
      c.beginPath();
      const n = 40;
      for (let i = 0; i <= n * arc; i++) {
        const u = i / n, ax = lerp(200, LINE - 60, u), ay = GROUND - 460 - 160 * Math.sin(Math.PI * u);
        if (i === 0) c.moveTo(ax, ay); else c.lineTo(ax, ay);
      }
      c.stroke();
    }
    // the official result
    if (t > mile) {
      const s = 1 + 0.3 * (1 - prog(t, mile, mile + 0.08));
      c.save(); c.translate(LINE + 330, 520); c.scale(s, s);
      c.fillStyle = rgba('signal'); c.fillRect(-250, -70, 500, 140);
      c.fillStyle = rgba('ink'); c.textAlign = 'center';
      c.font = font(F.mono(500), 17); c.letterSpacing = '3px'; c.fillText('OFFICIAL RESULT', 0, -30);
      c.font = font(F.archivo(75, 900), 56); c.letterSpacing = '0px'; c.fillText('1 MILE · 3.2 s', 0, 28);
      c.font = font(F.mono(500), 15); c.letterSpacing = '3px'; c.fillText('NEW RECORD', 0, 56);
      c.textAlign = 'left'; c.letterSpacing = '0px';
      c.restore();
    }
    const ps = piecesOf(this.l[1]!);
    drawRun(c, ps.slice(0, 4), 150, 170, t, DARK(100));
    drawRun(c, ps.slice(4), 150, 280, t, DARK(100));
    return { shake: [0, 8 * pulse(t, champ, 0.06)] as [number, number] };
  }

  // ---------------------------------------------------------------- 3. the Beaufort scale

  private beaufort(c: CanvasRenderingContext2D, t: number) {
    const ink = rgba('ink');
    const sideways = this.w(2, 2).start, ears = this.w(2, 3).start;
    c.fillStyle = ink;
    c.font = font(F.serif(600, true), 64); c.fillText('The Beaufort Scale for Bat Ears', 150, 150);
    c.font = font(F.mono(500), 16); c.letterSpacing = '3px';
    c.fillText('AS OBSERVED ON ONE (1) FRENCHTON · PLATE IV', 152, 190);
    c.letterSpacing = '0px';
    c.fillRect(150, 214, W - 300, 2); c.fillRect(150, 220, W - 300, 0.8);
    const rows: [number, number | null, number, number, string][] = [
      [0, 0, 1, 0, 'Calm · ears up, fully operational'],
      [2, 0.2, 1, 0.2, 'Light breeze · ears twitch; Gryffy suspicious'],
      [4, 0.07, 1.18, 1.3, 'Moderate breeze · ears standing tall, bow tie sideways'],
      [6, 1.9, 1, 1.57, 'Strong breeze · ears inside out; Gryffy reconsiders'],
      [8, null, 1, 0, 'Gale · Gryffy has gone back inside'],
    ];
    rows.forEach(([force, ang, tall, bow, desc], i) => {
      const y = 290 + i * 118;
      const a = prog(t, this.ctx.start + 0.1 + i * 0.12, this.ctx.start + 0.3 + i * 0.12);
      if (a <= 0) return;
      c.globalAlpha = a;
      if (force === 4 && t > ears) { c.fillStyle = rgba('signal'); c.fillRect(144, y - 52, 1030 * prog(t, ears, ears + 0.25), 104); }
      c.fillStyle = ink; c.strokeStyle = rgba('ink', 0.18); c.lineWidth = 1;
      c.beginPath(); c.moveTo(150, y + 58); c.lineTo(1180, y + 58); c.stroke();
      c.font = font(F.mono(500), 20); c.letterSpacing = '2px'; c.fillText(`FORCE ${force}`, 160, y + 8); c.letterSpacing = '0px';
      earDiagram(c, 380, y + 12, ang, tall, bow);
      c.fillStyle = ink; c.font = font(F.mono(400), 19); c.fillText(desc, 470, y + 8);
      c.globalAlpha = 1;
    });
    // Gryffy in the wind: ears standing tall, the bow tie blown round to sideways
    const wind = smoothstep(this.ctx.start, sideways, t);
    const p: SidePose = { ...stand(1560, 770, 400, -1), bow: 1.45 * prog(t, sideways, sideways + 0.35, ease.outBack), twitch: 0.08 * Math.sin(t * 23) * wind, pitch: 0.12, mouth: 0.1 };
    // wind lines blowing across the figure
    c.strokeStyle = rgba('ink', 0.35); c.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      const k = ((t - this.ctx.start) * 1.8 + i * 0.29) % 1;
      const y = 380 + i * 42, x0 = W - k * 900;
      c.globalAlpha = wind * Math.sin(Math.PI * k);
      c.beginPath(); c.moveTo(x0, y); c.bezierCurveTo(x0 - 60, y - 10, x0 - 120, y + 10, x0 - 200, y); c.stroke();
    }
    c.globalAlpha = 1;
    drawSide(c, p, { paper: true });
    const st = { ...PAPER_RUN(F.archivo(87.5, 900), 74), lead: 0.5 };
    const ps = piecesOf(this.l[2]!);
    drawRun(c, ps.slice(0, 3), 1230, 890, t, st);
    drawRun(c, ps.slice(3), 1230, 972, t, st);
  }

  // ---------------------------------------------------------------- 4. the rug

  private rug(c: CanvasRenderingContext2D, t: number) {
    const cam: Cam = { x: -2400, y: 3000, zoom: 1, rot: 0 };
    withCam(c, cam, () => drawParquet(c, cam));
    const claims = this.w(3, 1).start, rug = this.w(3, 3).start, owns = this.w(3, 6).start;
    const R = { x: 560, y: 300, w: 900, h: 600 };
    // the rug: fringe, a border of two gilt rules, a lozenge medallion
    c.fillStyle = '#1D1B1E'; c.fillRect(R.x, R.y, R.w, R.h);
    c.strokeStyle = rgba('bone', 0.4); c.lineWidth = 1.5;
    for (let x = R.x; x <= R.x + R.w; x += 10) { c.beginPath(); c.moveTo(x, R.y - 14); c.lineTo(x, R.y); c.moveTo(x, R.y + R.h); c.lineTo(x, R.y + R.h + 14); c.stroke(); }
    c.strokeStyle = rgba('accent', 0.8); c.lineWidth = 4; c.strokeRect(R.x + 30, R.y + 30, R.w - 60, R.h - 60);
    c.lineWidth = 1.5; c.strokeRect(R.x + 52, R.y + 52, R.w - 104, R.h - 104);
    const cx = R.x + R.w / 2, cy = R.y + R.h / 2;
    c.beginPath(); c.moveTo(cx, cy - 190); c.lineTo(cx + 290, cy); c.lineTo(cx, cy + 190); c.lineTo(cx - 290, cy); c.closePath(); c.stroke();
    c.strokeStyle = rgba('bone', 0.25);
    c.beginPath(); c.moveTo(cx, cy - 150); c.lineTo(cx + 230, cy); c.lineTo(cx, cy + 150); c.lineTo(cx - 230, cy); c.closePath(); c.stroke();
    // Gryffy: trots on, three circles on the medallion on "rug", and down
    const on = prog(t, claims - 0.3, rug, ease.outCubic);
    const circles = prog(t, rug, owns - 0.3, ease.inOutCubic);
    const down = prog(t, owns - 0.3, owns);
    const px = lerp(-200, cx, on) + 90 * Math.sin(circles * 3 * TAU) * (1 - down);
    const py = cy + 90 * (1 - Math.cos(circles * 3 * TAU)) * 0.5 * (1 - down) - 45 * (1 - down) * (circles > 0 ? 1 : 0) * Math.sin(circles * Math.PI);
    const heading = on < 1 ? 0 : circles * 3 * TAU;
    drawTop(c, { x: px, y: py, s: 300 - 30 * down, heading, phase: t * TAU * 3, stride: 1 - down, stretch: 1, wind: 0, turn: 0.3 * down });
    // the surveyor's boundary, and the stamp
    const b = prog(t, owns - 0.2, owns + 0.5);
    if (b > 0) {
      c.save(); c.setLineDash([16, 10]); c.strokeStyle = rgba('bone', 0.9); c.lineWidth = 3;
      c.beginPath(); c.rect(R.x - 40, R.y - 40, (R.w + 80) * Math.min(1, b * 2), R.h + 80); c.stroke(); c.restore();
      c.fillStyle = rgba('bone', 0.8); c.font = font(F.mono(500), 17); c.letterSpacing = '2px';
      c.fillText('BOUNDARY · N 0° E · 12 FT × 8 FT', R.x - 40, R.y - 56);
      c.letterSpacing = '0px';
    }
    if (t > owns) {
      const s = 1 + 0.5 * (1 - prog(t, owns, owns + 0.07));
      c.save(); c.translate(R.x + R.w - 160, R.y + R.h - 110); c.rotate(-0.14); c.scale(s, s);
      c.strokeStyle = rgba('signal'); c.lineWidth = 8; c.strokeRect(-130, -70, 260, 130);
      c.fillStyle = rgba('signal'); c.textAlign = 'center'; c.font = font(F.archivo(75, 900), 110); c.fillText('HIS', 0, 40);
      c.textAlign = 'left'; c.restore();
    }
    const ps = piecesOf(this.l[3]!);
    drawRun(c, ps.slice(0, 4), 150, 170, t, DARK(96));
    drawRun(c, ps.slice(4), 150, 1000, t, DARK(96));
    return { shake: [0, 10 * pulse(t, owns, 0.06)] as [number, number] };
  }
}

/** A chesterfield in profile: rolled arms, tufted back, turned legs. Front-left foot at (x, y), length w. */
function sofa(c: CanvasRenderingContext2D, x: number, y: number, w: number) {
  const h = w * 0.55;
  c.save();
  c.fillStyle = rgba('ink2'); c.strokeStyle = rgba('bone', 0.7); c.lineWidth = 2;
  const body = new Path2D();
  body.roundRect(x, y - h * 0.62, w, h * 0.5, 18);
  body.roundRect(x + w * 0.04, y - h, w * 0.92, h * 0.5, 30);
  body.ellipse(x + 20, y - h * 0.6, 44, 70, 0, 0, TAU);
  body.ellipse(x + w - 20, y - h * 0.6, 44, 70, 0, 0, TAU);
  c.fill(body); c.stroke(body);
  c.fillStyle = rgba('bone', 0.6);
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { c.beginPath(); c.arc(x + w * (0.15 + i * 0.14), y - h * (0.88 - j * 0.16), 4, 0, TAU); c.fill(); }
  c.strokeStyle = rgba('bone', 0.7);
  for (const lx of [x + 30, x + w - 30]) { c.beginPath(); c.moveTo(lx, y - h * 0.12); c.lineTo(lx, y); c.stroke(); }
  c.restore();
}

/** A head with its bat ears at an angle (null: gone inside), ear stretch, and the bow tie's rotation. */
function earDiagram(c: CanvasRenderingContext2D, cx: number, cy: number, ang: number | null, tall: number, bow: number) {
  if (ang === null) {
    c.strokeStyle = rgba('ink', 0.5); c.setLineDash([3, 6]); c.lineWidth = 1.5;
    c.beginPath(); c.arc(cx, cy, 26, 0, TAU); c.stroke(); c.setLineDash([]);
    c.fillStyle = rgba('ink', 0.6); c.font = font(F.mono(400), 12); c.textAlign = 'center'; c.fillText('(inside)', cx, cy + 4); c.textAlign = 'left';
    return;
  }
  for (const s of [-1, 1]) {
    c.save(); c.translate(cx + s * 12, cy - 14); c.rotate(s * (0.3 + ang)); c.scale(s, tall);
    c.fillStyle = rgba('ink'); c.beginPath(); c.moveTo(-8, 4); c.lineTo(-4, -34); c.quadraticCurveTo(-1, -40, 3, -34); c.lineTo(9, 2); c.closePath(); c.fill();
    c.fillStyle = TONGUE; c.beginPath(); c.moveTo(-4, 0); c.lineTo(-2, -27); c.quadraticCurveTo(0, -30, 2, -27); c.lineTo(5, -1); c.closePath(); c.fill();
    c.restore();
  }
  c.fillStyle = rgba('ink'); c.beginPath(); c.arc(cx, cy, 22, 0, TAU); c.fill();
  c.fillStyle = rgba('bone'); c.beginPath(); c.ellipse(cx, cy - 10, 2, 5, 0, 0, TAU); c.fill();
  c.save(); c.translate(cx, cy + 30); c.rotate(bow);
  c.fillStyle = rgba('ink'); c.beginPath(); c.moveTo(0, 0); c.lineTo(-13, -7); c.lineTo(-13, 7); c.closePath(); c.moveTo(0, 0); c.lineTo(13, -7); c.lineTo(13, 7); c.closePath(); c.fill();
  c.restore();
}

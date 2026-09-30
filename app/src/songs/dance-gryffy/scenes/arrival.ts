// arrival — "The entrance" (TREATMENT.md), verse 1.
// 1 "Gryffy kicks the door with a bow tie loose": the ballroom doors (the invitation's halves) burst
//   open on "kicks"; a draught blows in, his ears flip back and he stops dead for a beat, then
//   trots in anyway. House rule 2 goes up.
// 2 "Tiny tux, big attitude, nothing to lose": the tailor's ticket on his bow tie, typed as sung.
// 3 "One snort and the whole room's looking his way": the snort, every spotlight swings onto him,
//   and the ancestor portraits on the wall (all him) snap their heads round to look.
// 4 "Then that green ball rolls—he's gone, no delay": the ball rolls past, he bolts after it as a
//   streak, and his bow tie is left in mid-air, floating down to the floor.
import type * as THREE from 'three';
import { Scene, type Frame } from '../../../engine/scene';
import { Layer2D, W, H, clearRT } from '../../../engine/gl';
import { LIN, rgba } from '../../../engine/palette';
import { F, font } from '../../../engine/type';
import type { Line } from '../../../engine/lyrics';
import { ease, lerp, prog, pulse, springStep, TAU } from '../../../engine/util';
import { drawBowTie, drawSide, drawSmear, stand, trot, type SidePose } from './gryffy';
import { drawRun, PAPER_RUN, piecesOf, type RunStyle } from './karaoke';
import { Portrait, TUX_CROP } from './portrait';
import { ball, crown } from './props';

const FLOOR = 880;
const DOOR = { x0: 660, x1: 1260, top: 250 };
const RULE_2 = 'HOUSE RULE 2 · PLEASE CLOSE THE DOORS: DRAUGHTS UPSET THE GUEST OF HONOUR’S EARS';
const WALL = [240, 560, 1400, 1700];

export default class Arrival extends Scene {
  back = new Layer2D();
  front = new Layer2D();
  portrait = new Portrait();
  l: Line[] = [];
  bp = 0.45;

  override async init() {
    const { lyrics, audio } = this.ctx;
    this.l = ['kicks the door', 'Tiny tux', 'One snort', 'green ball rolls'].map((q) => lyrics.get(q));
    this.bp = 60 / audio.bpm;
    await this.portrait.load(this.ctx.song);
  }

  private w(li: number, wi: number) { return this.l[li]!.words[wi]!; }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp } = this.ctx;
    const t = f.t;
    clearRT(renderer, out, LIN.ink);
    this.back.clear(rgba('ink')); this.front.clear();
    let post = {};
    if (t < this.l[1]!.start - 0.05) post = this.doors(t);
    else if (t < this.l[2]!.start - 0.05) post = this.ticket(t);
    else if (t < this.l[3]!.start - 0.05) {
      comp.draw(renderer, this.back.upload(), out);
      post = this.room(t, out);
      comp.draw(renderer, this.front.upload(), out);
      return { bloom: 0.45, halation: 0, ca: 0.4, vignette: 0.45, ...post };
    } else post = this.bolt(t);
    comp.draw(renderer, this.back.upload(), out);
    comp.draw(renderer, this.front.upload(), out);
    return { bloom: 0.45, halation: 0, ca: 0.4, vignette: 0.45, ...post };
  }

  /** The ballroom: a dark wall with faint panelling, a floor with plank lines running to the back. */
  private ballroom(c: CanvasRenderingContext2D) {
    c.strokeStyle = rgba('graphite', 0.18); c.lineWidth = 1.5;
    for (let x = 120; x < W; x += 300) c.strokeRect(x, 140, 240, FLOOR - 220);
    c.fillStyle = rgba('ink2'); c.fillRect(0, FLOOR, W, H - FLOOR);
    c.strokeStyle = rgba('graphite', 0.35); c.lineWidth = 1;
    c.beginPath(); c.moveTo(0, FLOOR); c.lineTo(W, FLOOR); c.stroke();
    for (let i = -12; i <= 12; i++) { c.beginPath(); c.moveTo(W / 2 + i * 60, FLOOR); c.lineTo(W / 2 + i * 260, H); c.stroke(); }
  }

  // ---------------------------------------------------------------- 1. the doors

  private doors(t: number) {
    const c = this.back.ctx;
    this.ballroom(c);
    const kick = this.w(0, 1).start;
    const open = prog(t, kick, kick + 0.22, ease.outExpo);
    // the light in the doorway (a crack before the kick)
    const { x0, x1, top } = DOOR, mid = (x0 + x1) / 2;
    const glow = c.createRadialGradient(mid, FLOOR - 200, 20, mid, FLOOR - 200, 700);
    glow.addColorStop(0, rgba('bone', 0.35 * open)); glow.addColorStop(1, rgba('bone', 0));
    c.fillStyle = glow; c.fillRect(0, 0, W, H);
    c.fillStyle = rgba('bone', lerp(0.0, 0.95, open)); c.fillRect(x0, top, x1 - x0, FLOOR - top);
    // the draught: streaks blowing out of the doorway towards the camera
    const gust = prog(t, kick, kick + 1.4) * (1 - prog(t, kick + 1.2, kick + 1.8));
    if (gust > 0) {
      c.strokeStyle = rgba('bone', 0.4 * gust); c.lineWidth = 2;
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * TAU, k = ((t - kick) * 1.6 + i * 0.137) % 1;
        const r0 = 120 + k * 900, r1 = r0 + 120;
        c.beginPath(); c.moveTo(mid + r0 * Math.cos(a) * 1.4, FLOOR - 300 + r0 * Math.sin(a)); c.lineTo(mid + r1 * Math.cos(a) * 1.4, FLOOR - 300 + r1 * Math.sin(a)); c.stroke();
      }
    }
    // Gryffy in the doorway: frozen by the draught for a beat, then trotting in towards the camera
    const walk0 = this.w(0, 4).start; // "with"
    const walk = Math.max(0, t - walk0);
    const s = lerp(360, 620, prog(t, walk0, walk0 + 1.3, ease.inQuad));
    let p: SidePose = stand(mid - 40 + walk * 560, FLOOR - 4 + walk * 60, s, 1);
    if (walk > 0) p = trot(p, walk * TAU * 2.6, 1);
    p.wind = open > 0 ? Math.max(0, 1 - prog(t, walk0 - 0.1, walk0 + 0.4)) : 0;
    p.bow = 0.5 * Math.sin(t * 30) * gust;
    p.blink = t > kick + 0.3 && t < kick + 0.45 ? 1 : 0; // one deadpan blink while he's stopped
    if (open > 0.2) drawSide(c, p, { paper: walk < 0.4 });
    // the doors swing in towards the camera on their hinges
    for (const side of [-1, 1]) {
      const hinge = side < 0 ? x0 : x1;
      const k = 1 - 0.78 * open;
      const free = lerp(hinge, mid, k);
      const grow = 150 * open;
      c.fillStyle = rgba('bone'); c.strokeStyle = rgba('ink'); c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(hinge, top); c.lineTo(free, top - grow); c.lineTo(free, FLOOR + grow); c.lineTo(hinge, FLOOR); c.closePath();
      c.fill(); c.stroke();
      // the panel's double rule, squeezed with the door
      const inset = (u: number, v: number) => [lerp(hinge, free, u), lerp(lerp(top, top - grow, u), lerp(FLOOR, FLOOR + grow, u), v)] as const;
      c.lineWidth = 1.2;
      c.beginPath();
      const q = [inset(0.1, 0.06), inset(0.9, 0.06), inset(0.9, 0.94), inset(0.1, 0.94)];
      c.moveTo(q[0]![0], q[0]![1]); for (const pt of q.slice(1)) c.lineTo(pt[0], pt[1]); c.closePath(); c.stroke();
      const h = inset(0.85, 0.5);
      c.fillStyle = rgba('accent'); c.beginPath(); c.arc(h[0], h[1], 9, 0, TAU); c.fill();
    }
    // the line, and the house rule going up once he's in
    const f = this.front.ctx;
    const st: RunStyle = { family: F.archivo(87.5, 900), size: 104, ink: rgba('bone'), dim: 0.22, lit: rgba('signal'), lead: 0.5 };
    const ps = piecesOf(this.l[0]!);
    drawRun(f, ps.slice(0, 4), 150, 220, t, st);
    drawRun(f, ps.slice(4), 150, 980, t, st);
    const ra = prog(t, walk0, walk0 + 0.3);
    if (ra > 0) {
      f.globalAlpha = ra; f.fillStyle = rgba('bone', 0.6);
      f.font = font(F.mono(400), 15); f.letterSpacing = '2px'; f.textAlign = 'right';
      f.fillText(RULE_2, W - 150, 110);
      f.textAlign = 'left'; f.letterSpacing = '0px'; f.globalAlpha = 1;
    }
    const k = pulse(t, kick, 0.08);
    return { shake: [Math.sin(t * 90) * 16 * k, Math.cos(t * 70) * 12 * k] as [number, number], flash: 0.12 * k };
  }

  // ---------------------------------------------------------------- 2. the tailor's ticket

  private ticket(t: number) {
    const c = this.back.ctx;
    const t0 = this.l[1]!.start;
    // his chest, close: the bib, the studs and the bow tie
    const drift = (t - t0) * 12;
    const p = { ...stand(-120 - drift, 1500, 1500, 1 as const), pitch: 0.12 };
    drawSide(c, p);
    // the ticket on its string, from the bow tie, swinging a little
    const f = this.front.ctx;
    const sw = 0.05 * Math.sin((t - t0) * 2.6) * Math.exp(-(t - t0) * 0.3) - 0.03;
    const hang = springStep(t - t0 + 0.1, 1.6, 0.4);
    f.save();
    f.translate(870, lerp(-400, 300, hang)); f.rotate(sw);
    f.strokeStyle = rgba('bone', 0.7); f.lineWidth = 2;
    f.beginPath(); f.moveTo(-340, -220); f.quadraticCurveTo(-200, -120, -40, -30); f.stroke();
    const w = 900, h = 470;
    f.fillStyle = '#E9DCC0';
    // a tag with its corner clipped, and the reinforced eyelet the string runs through
    f.beginPath(); f.moveTo(60, 0); f.lineTo(w, 0); f.lineTo(w, h); f.lineTo(0, h); f.lineTo(0, 60); f.closePath(); f.fill();
    f.strokeStyle = rgba('ink', 0.5); f.lineWidth = 3; f.beginPath(); f.arc(46, 46, 16, 0, TAU); f.stroke();
    f.fillStyle = rgba('ink');
    f.font = font(F.mono(500), 18); f.letterSpacing = '4px';
    f.fillText("TAILOR'S TICKET · No. 1 · FITTING: THE GRYFFY BALL", 100, 58);
    f.fillRect(100, 76, w - 160, 1.5);
    const rows = ['TUX', 'ATTITUDE', 'TO LOSE'];
    const ps = piecesOf(this.l[1]!);
    const groups = [ps.slice(0, 2), ps.slice(2, 4), ps.slice(4)];
    const st: RunStyle = { ...PAPER_RUN(F.mono(500), 58), dim: 0, lead: 0 };
    rows.forEach((r, i) => {
      const y = 170 + i * 110;
      f.font = font(F.mono(400), 17); f.letterSpacing = '3px'; f.fillStyle = rgba('ink', 0.6);
      f.fillText(r, 100, y - 14);
      f.letterSpacing = '0px';
      f.strokeStyle = rgba('ink', 0.3); f.lineWidth = 1; f.setLineDash([3, 6]);
      f.beginPath(); f.moveTo(290, y + 12); f.lineTo(w - 60, y + 12); f.stroke(); f.setLineDash([]);
      drawRun(f, groups[i]!, 290, y, t, st);
    });
    f.font = font(F.mono(400), 16); f.letterSpacing = '2px'; f.fillStyle = rgba('ink', 0.55);
    f.fillText('CHEST 18 in · EARS 4.5 in, UPRIGHT · TAIL: NUB', 100, h - 36);
    f.letterSpacing = '0px';
    f.restore();
    return {};
  }

  // ---------------------------------------------------------------- 3. the whole room

  private room(t: number, out: THREE.WebGLRenderTarget) {
    const { renderer, comp } = this.ctx;
    const c = this.back.ctx;
    this.ballroom(c);
    const snort = this.w(2, 1).start, whole = this.w(2, 4).start, look = this.w(2, 6).start;
    // spotlights: four cones swinging from the room onto him
    const sw = prog(t, whole - 0.1, whole + 0.5, ease.outBack);
    const gx = 960, gy = FLOOR;
    for (let i = 0; i < 4; i++) {
      const sx = 200 + i * 507, aim0 = WALL[i]!, aim = lerp(aim0, gx, sw);
      const g = c.createLinearGradient(sx, -40, aim, gy);
      g.addColorStop(0, rgba('bone', 0.2)); g.addColorStop(1, rgba('bone', 0.05));
      c.fillStyle = g;
      c.beginPath(); c.moveTo(sx - 18, -40); c.lineTo(sx + 18, -40); c.lineTo(aim + 170, gy + 40); c.lineTo(aim - 170, gy + 40); c.closePath(); c.fill();
      c.fillStyle = rgba('bone', 0.08 * sw); c.beginPath(); c.ellipse(aim, gy + 10, 180, 30, 0, 0, TAU); c.fill();
    }
    // the ancestors: engraved portraits, looking away until "looking", then snapping round to him
    comp.draw(renderer, this.back.upload(), out);
    const f = this.front.ctx;
    WALL.forEach((x, i) => {
      const turn = t > look + i * 0.09;
      // in the photo he looks to our left: mirrored, he looks right
      const mirror = x < gx ? turn : !turn;
      comp.draw(renderer, this.portrait.render(renderer, { ...TUX_CROP, cx: x, cy: 520, rx: 105, ry: 135, pitch: 3.5, mirror }), out);
      f.strokeStyle = rgba('accent'); f.lineWidth = 12;
      f.beginPath(); f.ellipse(x, 520, 118, 148, 0, 0, TAU); f.stroke();
      // regalia: a crown on some, a ruff on others
      if (i % 2 === 0) crown(f, x + 6, 402, 90, 0.1);
      else ruff(f, x, 620, 95);
    });
    // Gryffy, centre, snorting
    const sn = pulse(t, snort, 0.15);
    const p = { ...stand(gx, gy, 400, 1 as const), pitch: 0.05 + 0.25 * sn, mouth: 0.2 * sn, tongue: prog(t, look, look + 0.3) * 0.6 };
    drawSide(f, p);
    if (t > snort && t < snort + 0.6) {
      const k = prog(t, snort, snort + 0.6);
      const nx = gx + 0.47 * 400, ny = gy - 0.8 * 400;
      f.strokeStyle = rgba('bone', 0.85 * (1 - k)); f.lineWidth = 3;
      for (const da of [-0.4, 0, 0.4]) {
        const r0 = 20 + 80 * k;
        f.beginPath(); f.moveTo(nx + r0 * Math.cos(da), ny + r0 * Math.sin(da)); f.lineTo(nx + (r0 + 36) * Math.cos(da), ny + (r0 + 36) * Math.sin(da)); f.stroke();
      }
    }
    const st: RunStyle = { family: F.archivo(87.5, 900), size: 96, ink: rgba('bone'), dim: 0.22, lit: rgba('signal'), lead: 0.5 };
    const ps = piecesOf(this.l[2]!);
    drawRun(f, ps.slice(0, 6), 150, 170, t, st);
    drawRun(f, ps.slice(6), 150, 280, t, st);
    return { zoom: 1 + 0.02 * pulse(t, snort, 0.1) };
  }

  // ---------------------------------------------------------------- 4. gone

  private bolt(t: number) {
    const c = this.back.ctx;
    this.ballroom(c);
    const green = this.w(3, 2).start, gone = this.w(3, 5).start, delay = this.w(3, 7).end;
    // the ball rolls in from the right, past him, and away left
    const bx = lerp(W + 150, -300, prog(t, green - 0.3, gone + 0.6));
    const R = 46;
    ball(c, bx, FLOOR - R, R);
    // Gryffy watches it come (head following), then he's gone
    const gx = 1080;
    const out = prog(t, gone - 0.05, gone + 0.18, ease.inQuad);
    const bow: [number, number] = [gx + 0.18 * 420, FLOOR - 0.72 * 420];
    if (out < 1) {
      const x = gx - out * 1500;
      const p: SidePose = { ...stand(x, FLOOR, 420, -1), tux: true, pitch: -0.1 + 0.15 * Math.sin(t * 3), mouth: 0.3, tongue: 0.5, chest: 0.47 };
      if (out > 0) drawSmear(c, Array.from({ length: 10 }, (_, g) => [x + 200 + g * 60, FLOOR - 220] as [number, number]), 260);
      drawSide(c, p);
    }
    // the bow tie, left in mid-air where his neck was, drifting down to the floor
    if (out > 0) {
      const k = prog(t, gone + 0.15, delay, ease.inQuad);
      const x = bow[0] + 40 * Math.sin((t - gone) * 5) * (1 - k) - 60 * k;
      const y = lerp(bow[1], FLOOR - 12, k);
      drawBowTie(c, x, y, 110, 0.4 * Math.sin((t - gone) * 6) * (1 - k) + 0.1);
    }
    const f = this.front.ctx;
    const st: RunStyle = { family: F.archivo(87.5, 900), size: 110, ink: rgba('bone'), dim: 0.22, lit: rgba('signal'), lead: 0.5 };
    const ps = piecesOf(this.l[3]!);
    const cut = ps.findIndex((p) => p.joined);
    drawRun(f, ps.slice(0, cut), 150, 180, t, st);
    drawRun(f, ps.slice(cut), 150, 310, t, st);
    return { shake: [6 * pulse(t, gone, 0.06), 0] as [number, number] };
  }
}

/** An Elizabethan ruff: a white pleated collar. */
function ruff(c: CanvasRenderingContext2D, x: number, y: number, w: number) {
  c.fillStyle = rgba('bone'); c.strokeStyle = rgba('ink', 0.6); c.lineWidth = 1.2;
  for (let i = -5; i <= 5; i++) {
    c.beginPath(); c.ellipse(x + i * w * 0.09, y + Math.abs(i) * -3, w * 0.07, w * 0.14, 0, 0, TAU); c.fill(); c.stroke();
  }
}

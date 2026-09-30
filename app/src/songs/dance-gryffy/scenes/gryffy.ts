// Gryffy, the figure (TREATMENT.md "Gryffy"): a rigged side-view puppet drawn in Canvas2D as
// scratchboard, a black mass with bone lines scratched into it. Every plate that shows the figure
// draws him through this module so he looks the same everywhere. Poses are plain data (SidePose);
// scenes build them from the named poses below, blend them with lerpPose, and animate the fields.
// Units: one unit is roughly his body length; y is up in pose space, down on the canvas.
import { rgba } from '../../../engine/palette';
import { clamp, lerp } from '../../../engine/util';

/** Gryffy's own colours (TREATMENT.md Palette): never used for type or graphics. */
export const TONGUE = '#EE8F98';
const EYE = '#3A2416';
const COAT = '#0D0D0F';
const COAT_FAR = '#070708';

type V = [number, number];
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]];
const mul = (a: V, k: number): V => [a[0] * k, a[1] * k];
const len = (a: V) => Math.hypot(a[0], a[1]);
const norm = (a: V): V => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
const perp = (a: V): V => [-a[1], a[0]];
const rot = (a: V, r: number): V => [a[0] * Math.cos(r) - a[1] * Math.sin(r), a[0] * Math.sin(r) + a[1] * Math.cos(r)];
/** a + d*x + n*y: a point in a local frame. */
const at = (a: V, d: V, n: V, x: number, y: number): V => [a[0] + d[0] * x + n[0] * y, a[1] + d[1] * x + n[1] * y];

export interface SidePose {
  /** Canvas px of the ground point under the middle of his body, px per unit, facing (1 = right). */
  x: number;
  y: number;
  s: number;
  dir: 1 | -1;
  /** Heights (units above ground) of the chest and hip centres, and a forward shift of the body. */
  chest: number;
  hip: number;
  lean: number;
  /** Body length multiplier (zoomies stretch). */
  stretch: number;
  /** Paw positions relative to the ground point under the shoulder / hip (units, y up). */
  fn: V; ff: V; hn: V; hf: V;
  /** Head: pitch (rad, + = nose up), extra lift (units), and the face. */
  pitch: number;
  lift: number;
  mouth: number;
  tongue: number;
  blink: number;
  /** Ears: 0 upright, 1 blown flat back (wind); twitch adds a small flick (rad). */
  wind: number;
  twitch: number;
  /** The nub: angle (rad, + = up). */
  tail: number;
  /** The tuxedo: bow tie and studs and cuffs; the bow tie's rotation (rad, π/2 = sideways). */
  tux: boolean;
  bow: number;
}

export const stand = (x: number, y: number, s: number, dir: 1 | -1 = 1): SidePose => ({
  x, y, s, dir,
  chest: 0.5, hip: 0.53, lean: 0, stretch: 1,
  fn: [0.03, 0], ff: [-0.04, 0], hn: [-0.03, 0], hf: [0.04, 0],
  pitch: 0.05, lift: 0, mouth: 0, tongue: 0, blink: 0,
  wind: 0, twitch: 0, tail: 0.3, tux: true, bow: 0,
});

/** The play bow: front end down on the forearms, rear up, grinning. */
export const playBow = (p: SidePose): SidePose => ({
  ...p,
  chest: 0.27, hip: 0.56, lean: 0.03,
  fn: [0.3, 0], ff: [0.24, 0], hn: [0.0, 0], hf: [0.06, 0],
  pitch: 0.3, lift: -0.06, mouth: 0.55, tongue: 0.7, tail: 0.9,
});

/** Blend two poses (numbers and paw positions; the discrete fields come from b). */
export function lerpPose(a: SidePose, b: SidePose, k: number): SidePose {
  const o: any = { ...b };
  for (const key of Object.keys(a) as (keyof SidePose)[]) {
    const va = a[key], vb = b[key];
    if (typeof va === 'number' && typeof vb === 'number') o[key] = lerp(va, vb, k);
    else if (Array.isArray(va) && Array.isArray(vb)) o[key] = [lerp(va[0], vb[0], k), lerp(va[1], vb[1], k)];
  }
  return o as SidePose;
}

/** Two-bone IK: the joint between root and target, bent towards `side` (+1 = the frame's left of the root→target line). */
function ik(root: V, target: V, a: number, b: number, side: number): [V, V] {
  let d = sub(target, root);
  const L = clamp(len(d), Math.abs(a - b) + 1e-4, a + b - 1e-4);
  d = mul(norm(d), L);
  const end = add(root, d);
  const x = (a * a - b * b + L * L) / (2 * L);
  const h = Math.sqrt(Math.max(0, a * a - x * x));
  const u = norm(d);
  return [add(add(root, mul(u, x)), mul(perp(u), h * side)), end];
}

/** A closed Catmull-Rom spline through points, as a Path2D (canvas coords). */
function closedSpline(pts: V[], tension = 0.5): Path2D {
  const p = new Path2D();
  const n = pts.length;
  p.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]!, p1 = pts[i]!, p2 = pts[(i + 1) % n]!, p3 = pts[(i + 2) % n]!;
    const k = tension / 3;
    p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k, p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
  }
  p.closePath();
  return p;
}

/** An open Catmull-Rom spline (canvas coords). */
function openSpline(pts: V[], path = new Path2D(), move = true): Path2D {
  const n = pts.length;
  if (move) path.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!, p1 = pts[i]!, p2 = pts[i + 1]!, p3 = pts[Math.min(n - 1, i + 2)]!;
    path.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  return path;
}

export interface DrawOpts {
  /** Overall opacity (0..1). */
  alpha?: number;
  /** Line colour of the scratched lines (default bone). */
  line?: string;
  /** On a light ground: the white bib gets an ink edge so it doesn't dissolve into the paper. */
  paper?: boolean;
}

/** The body frame in pose space: chest and hip centres, spine axes, head centre and axes. */
function skeleton(p: SidePose) {
  const half = 0.2 * p.stretch;
  const C: V = [p.lean + half, p.chest];
  const P: V = [p.lean - half, p.hip];
  const M = mul(add(C, P), 0.5);
  const d = norm(sub(C, P));
  const n = perp(d);
  const bodyAng = Math.atan2(d[1], d[0]);
  const H = add(C, rot([0.19, 0.36 + p.lift], bodyAng * 0.45));
  const dH: V = [Math.cos(p.pitch), Math.sin(p.pitch)];
  const nH = perp(dH);
  return { C, P, M, d, n, bodyAng, H, dH, nH };
}

/** Canvas positions of features, for callouts and props: the grin, the nub, the nose, the head, the chest and the front paws. */
export function anchors(p: SidePose) {
  const { C, P, d, n, H, dH, nH } = skeleton(p);
  const toC = (v: V): V => [p.x + p.dir * v[0] * p.s, p.y - v[1] * p.s];
  return {
    grin: toC(at(H, dH, nH, 0.19, -0.1)),
    nub: toC(at(P, d, n, -0.19, 0.13)),
    nose: toC(at(H, dH, nH, 0.268, -0.025)),
    head: toC(H),
    ear: toC(at(H, dH, nH, -0.03, 0.45)),
    chestLow: toC(at(C, d, n, 0, -0.25)),
    rumpTop: toC(at(P, d, n, 0, 0.2)),
    frontPaws: [toC([C[0] + 0.05 + p.fn[0], p.fn[1]]), toC([C[0] + 0.05 + p.ff[0], p.ff[1]])] as V[],
  };
}

/**
 * Gryffy head-on and close, as he looks pressed up behind something on the lens (the smoosh):
 * big head, ears, the white fleck and bib, tongue out. Centre (x, y), head radius r px.
 * `squash` (0..1) flattens his nose against the glass.
 */
export function drawFront(c: CanvasRenderingContext2D, x: number, y: number, r: number, squash = 0) {
  const line = rgba('bone', 1);
  c.save();
  c.translate(x, y);
  // bib and chest below the head
  c.fillStyle = COAT;
  c.beginPath(); c.ellipse(0, r * 1.25, r * 1.05, r * 0.8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = line;
  c.beginPath(); c.moveTo(-r * 0.28, r * 0.75); c.quadraticCurveTo(0, r * 0.95, r * 0.28, r * 0.75); c.lineTo(r * 0.45, r * 2.1); c.lineTo(-r * 0.45, r * 2.1); c.closePath(); c.fill();
  // ears
  for (const s of [-1, 1]) {
    c.fillStyle = COAT;
    c.beginPath(); c.moveTo(s * r * 0.35, -r * 0.6); c.quadraticCurveTo(s * r * 0.75, -r * 1.75, s * r * 0.98, -r * 1.55); c.quadraticCurveTo(s * r * 1.08, -r * 0.8, s * r * 0.82, -r * 0.3); c.closePath(); c.fill();
    c.fillStyle = TONGUE;
    c.beginPath(); c.moveTo(s * r * 0.5, -r * 0.62); c.quadraticCurveTo(s * r * 0.78, -r * 1.5, s * r * 0.92, -r * 1.38); c.quadraticCurveTo(s * r * 0.96, -r * 0.8, s * r * 0.78, -r * 0.45); c.closePath(); c.fill();
  }
  // head
  c.fillStyle = COAT;
  c.beginPath(); c.ellipse(0, 0, r, r * 0.9, 0, 0, Math.PI * 2); c.fill();
  // forehead fleck
  c.fillStyle = line;
  c.beginPath(); c.ellipse(0, -r * 0.42, r * 0.035, r * 0.14, 0, 0, Math.PI * 2); c.fill();
  // eyes
  for (const s of [-1, 1]) {
    c.fillStyle = EYE; c.beginPath(); c.arc(s * r * 0.36, -r * 0.12, r * 0.15, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#000'; c.beginPath(); c.arc(s * r * 0.36, -r * 0.1, r * 0.09, 0, Math.PI * 2); c.fill();
    c.fillStyle = line; c.beginPath(); c.arc(s * r * 0.36 + r * 0.05, -r * 0.17, r * 0.035, 0, Math.PI * 2); c.fill();
  }
  // muzzle, lip and tongue
  c.fillStyle = '#16161A';
  c.beginPath(); c.ellipse(0, r * 0.36, r * 0.46, r * 0.32, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = TONGUE;
  c.beginPath(); c.ellipse(0, r * 0.66, r * 0.2, r * 0.26, 0, 0, Math.PI); c.fill();
  c.beginPath(); c.ellipse(0, r * 0.58, r * 0.3, r * 0.08, 0, 0, Math.PI * 2); c.fill();
  // the nose, flattening against the glass
  c.fillStyle = '#000';
  c.beginPath(); c.ellipse(0, r * 0.18, r * (0.2 + 0.08 * squash), r * (0.13 - 0.03 * squash), 0, 0, Math.PI * 2); c.fill();
  c.restore();
}

/**
 * Draws Gryffy in profile. The figure is built in pose space (units, y up) and mapped to the canvas
 * by the pose's ground point, scale and facing.
 */
export function drawSide(c: CanvasRenderingContext2D, p: SidePose, o: DrawOpts = {}) {
  const S = p.s;
  const toC = (v: V): V => [p.x + p.dir * v[0] * S, p.y - v[1] * S];
  const toCs = (vs: V[]) => vs.map(toC);
  const line = o.line ?? rgba('bone', 1);
  // the outer outline: bone on a dark ground, ink on paper (where the white bib meets the page)
  const edge = o.paper ? rgba('ink', 1) : line;
  const edgeA = (o.alpha ?? 1) * (o.paper ? 1 : 0.9);
  const rim = Math.max(1.1, 0.011 * S);

  c.save();
  c.globalAlpha = o.alpha ?? 1;
  c.lineJoin = 'round';
  c.lineCap = 'round';

  const { C, P, M, d, n, bodyAng, H, dH, nH } = skeleton(p);

  // ---- legs (far side first, darker, then near side)
  const shoulder = at(C, d, n, 0.05, -0.08);
  const hipJ = at(P, d, n, 0.0, -0.06);
  const frontLeg = (foot: V, near: boolean) => {
    const root: V = near ? shoulder : add(shoulder, [-0.035, 0.01]);
    const paw: V = [shoulder[0] + foot[0], foot[1] + 0.035];
    const [elbow, end] = ik(root, paw, 0.22, 0.21, -1);
    return { pts: [root, elbow, end] as V[], paw: end };
  };
  const hindLeg = (foot: V, near: boolean) => {
    const root: V = near ? hipJ : add(hipJ, [0.035, 0.01]);
    const paw: V = [hipJ[0] + foot[0], foot[1] + 0.035];
    const hock: V = add(paw, [-0.04, 0.12]);
    const [stifle, end] = ik(root, hock, 0.2, 0.19, 1);
    return { pts: [root, stifle, end, paw] as V[], paw };
  };
  const drawLeg = (pts: V[], paw: V, near: boolean, cuff: boolean) => {
    const cp = toCs(pts);
    const w0 = 0.12 * S, w1 = 0.088 * S;
    const seg = (a: V, b: V, w: number, col: string) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); };
    const pawC = toC(paw);
    const pawPath = new Path2D();
    pawPath.ellipse(pawC[0] + p.dir * 0.03 * S, pawC[1] - 0.01 * S, 0.056 * S, 0.03 * S, 0, 0, Math.PI * 2);
    if (near) {
      // rim: the same strokes, wider, in bone, under the fill
      c.globalAlpha = edgeA;
      for (let i = 0; i < cp.length - 1; i++) seg(cp[i]!, cp[i + 1]!, (i === 0 ? w0 : w1) + 2 * rim, edge);
      c.lineWidth = 2 * rim; c.strokeStyle = edge; c.stroke(pawPath);
      c.globalAlpha = o.alpha ?? 1;
    }
    const col = near ? COAT : COAT_FAR;
    for (let i = 0; i < cp.length - 1; i++) seg(cp[i]!, cp[i + 1]!, i === 0 ? w0 : w1, col);
    c.fillStyle = col; c.fill(pawPath);
    if (cuff && near) {
      const a = cp[cp.length - 2]!, b = cp[cp.length - 1]!;
      const k0 = 0.42, k1 = 0.62;
      seg([lerp(a[0], b[0], k0), lerp(a[1], b[1], k0)], [lerp(a[0], b[0], k1), lerp(a[1], b[1], k1)], w1 + 1, line);
    }
  };
  const fF = frontLeg(p.ff, false), hF = hindLeg(p.hf, false);
  drawLeg(hF.pts, hF.paw, false, false);
  drawLeg(fF.pts, fF.paw, false, false);

  // ---- far ear (behind the skull)
  const ear = (near: boolean) => {
    const base = at(H, dH, nH, near ? -0.03 : -0.1, 0.13);
    const ang = lerp(-0.12, -1.35, p.wind) + p.twitch + (near ? 0 : 0.12);
    const ea: V = rot(nH, ang), eb: V = perp(ea).map((x) => -x) as V; // ea: along the ear, eb: towards its front edge
    const e = (x: number, y: number) => at(base, eb, ea, x * 0.85, y * 0.85);
    const outline: V[] = [e(-0.11, 0), e(-0.1, 0.18), e(-0.06, 0.34), e(0.0, 0.4), e(0.06, 0.33), e(0.09, 0.14), e(0.08, 0)];
    const inner: V[] = [e(-0.05, 0.05), e(-0.045, 0.2), e(-0.005, 0.32), e(0.045, 0.2), e(0.05, 0.06)];
    return { outline: closedSpline(toCs(outline)), inner: closedSpline(toCs(inner)) };
  };
  const earF = ear(false);
  c.fillStyle = COAT_FAR; c.fill(earF.outline);
  c.fillStyle = TONGUE; c.globalAlpha = (o.alpha ?? 1) * 0.35; c.fill(earF.inner); c.globalAlpha = o.alpha ?? 1;

  // ---- near legs
  const fN = frontLeg(p.fn, true), hN = hindLeg(p.hn, true);
  drawLeg(hN.pts, hN.paw, true, false);
  drawLeg(fN.pts, fN.paw, true, p.tux);

  // ---- body and neck
  const bodyPts: V[] = [
    at(C, d, n, -0.02, 0.25), at(M, d, n, 0, 0.2), at(P, d, n, 0.02, 0.2), at(P, d, n, -0.19, 0.1),
    at(P, d, n, -0.2, -0.08), at(P, d, n, -0.07, -0.19), at(P, d, n, 0.1, -0.15), at(M, d, n, 0.02, -0.11),
    at(C, d, n, -0.04, -0.25), at(C, d, n, 0.16, -0.19), at(C, d, n, 0.26, 0.0), at(C, d, n, 0.18, 0.18),
  ];
  const neckPts: V[] = [at(C, d, n, -0.06, 0.22), at(H, dH, nH, -0.16, 0.04), at(H, dH, nH, -0.03, -0.16), at(H, dH, nH, 0.07, -0.17), at(C, d, n, 0.26, 0.02), at(C, d, n, 0.12, 0.16)];
  const body = closedSpline(toCs(bodyPts));
  const neck = closedSpline(toCs(neckPts));
  const nub = new Path2D(), nb = toC(at(P, d, n, -0.19, 0.13));
  nub.ellipse(nb[0], nb[1], 0.042 * S, 0.03 * S, -p.dir * (bodyAng + p.tail), 0, Math.PI * 2);
  // the rim of the union: every part stroked double width, then all filled over it
  c.strokeStyle = edge; c.lineWidth = 2 * rim; c.globalAlpha = edgeA;
  c.stroke(body); c.stroke(neck); c.stroke(nub);
  c.globalAlpha = o.alpha ?? 1;
  c.fillStyle = COAT;
  c.fill(body); c.fill(neck); c.fill(nub);
  // the nub keeps its own scratched outline so it reads against the rump
  c.strokeStyle = line; c.lineWidth = rim * 0.8; c.globalAlpha = (o.alpha ?? 1) * 0.7;
  c.stroke(nub);
  c.globalAlpha = o.alpha ?? 1;

  // sheen: lines along the back, scratched into the coat, fading down the flank
  c.save();
  c.clip(body);
  c.strokeStyle = line;
  for (let k = 0; k < 4; k++) {
    const off = 0.03 + k * 0.03;
    const pts = toCs([at(P, d, n, -0.15, 0.16 - off), at(P, d, n, 0.04, 0.2 - off), at(M, d, n, 0, 0.2 - off), at(C, d, n, -0.02, 0.24 - off), at(C, d, n, 0.14, 0.18 - off)]);
    c.globalAlpha = (o.alpha ?? 1) * 0.3 * Math.pow(0.6, k);
    c.lineWidth = Math.max(0.8, 0.007 * S);
    c.stroke(openSpline(pts));
  }
  c.restore();
  c.globalAlpha = o.alpha ?? 1;

  // the bib: shirt-front white down the chest (clipped to the chest and neck)
  c.save();
  const chestClip = new Path2D(); chestClip.addPath(body); chestClip.addPath(neck);
  c.clip(chestClip);
  const bib = closedSpline(toCs([at(H, dH, nH, 0.02, -0.17), at(C, d, n, 0.29, 0.1), at(C, d, n, 0.27, -0.1), at(C, d, n, 0.1, -0.26), at(C, d, n, 0.11, -0.06), at(C, d, n, 0.14, 0.13)]));
  c.fillStyle = line; c.fill(bib);
  if (p.tux) {
    c.fillStyle = COAT;
    for (let i = 0; i < 3; i++) {
      const s = toC(at(C, d, n, 0.215 - i * 0.012, 0.06 - i * 0.085));
      c.beginPath(); c.arc(s[0], s[1], 0.014 * S, 0, Math.PI * 2); c.fill();
    }
  }
  c.restore();


  // ---- head
  const skull = new Path2D();
  const hc = toC(H);
  skull.ellipse(hc[0], hc[1], 0.205 * S, 0.19 * S, -p.dir * p.pitch, 0, Math.PI * 2);
  const J = at(H, dH, nH, 0.05, -0.1); // jaw hinge
  const jawAng = -p.mouth * 0.32;
  const jd = rot(dH, jawAng), jn = perp(jd);
  const muzzle = closedSpline(toCs([at(H, dH, nH, 0.1, 0.07), at(H, dH, nH, 0.22, 0.03), at(H, dH, nH, 0.28, -0.02), at(H, dH, nH, 0.275, -0.08), at(H, dH, nH, 0.21, -0.115), at(H, dH, nH, 0.1, -0.115)]));
  const jaw = closedSpline(toCs([at(J, jd, jn, 0.0, 0.0), at(J, jd, jn, 0.16, 0.0), at(J, jd, jn, 0.2, -0.04), at(J, jd, jn, 0.16, -0.08), at(J, jd, jn, 0.02, -0.08)]));
  const lip = closedSpline(toCs([at(J, jd, jn, 0.08, -0.004), at(J, jd, jn, 0.195, -0.016), at(J, jd, jn, 0.188, -0.044), at(J, jd, jn, 0.1, -0.036)]));
  // mouth interior and tongue (under the upper muzzle)
  if (p.mouth > 0.02 || p.tongue > 0.02) {
    const mouthIn = closedSpline(toCs([at(H, dH, nH, 0.08, -0.1), at(H, dH, nH, 0.24, -0.1), at(J, jd, jn, 0.19, -0.02), at(J, jd, jn, 0.05, -0.02)]));
    c.fillStyle = '#2A0F12'; c.fill(mouthIn);
    const tl = 0.04 + 0.16 * p.tongue;
    const tongue = closedSpline(toCs([at(J, jd, jn, 0.08, 0.0), at(J, jd, jn, 0.2, 0.0), at(J, jd, jn, 0.22 + 0.02 * p.tongue, -tl * 0.7), at(J, jd, jn, 0.18, -tl), at(J, jd, jn, 0.13, -tl * 0.8)]));
    c.fillStyle = TONGUE; c.fill(tongue);
  }
  c.strokeStyle = edge; c.lineWidth = 2 * rim; c.globalAlpha = edgeA;
  c.stroke(skull); c.stroke(muzzle); c.stroke(jaw);
  c.globalAlpha = o.alpha ?? 1;
  c.fillStyle = COAT;
  c.fill(jaw); c.fill(skull); c.fill(muzzle);
  c.fillStyle = TONGUE; c.fill(lip);
  // the jaw line stays: it separates the open mouth from the muzzle
  if (p.mouth > 0.02) { c.strokeStyle = line; c.lineWidth = rim * 0.8; c.stroke(jaw); }
  // skull sheen
  c.save(); c.clip(skull);
  c.strokeStyle = line; c.lineWidth = Math.max(0.8, 0.007 * S);
  for (let k = 0; k < 3; k++) {
    c.globalAlpha = (o.alpha ?? 1) * 0.35 * Math.pow(0.6, k);
    c.beginPath();
    // the back of the crown (1.1π..1.55π facing right; mirrored facing left)
    const [a0, a1] = p.dir > 0 ? [1.1 * Math.PI, 1.55 * Math.PI] : [-0.55 * Math.PI, -0.1 * Math.PI];
    c.ellipse(hc[0], hc[1], (0.175 - k * 0.03) * S, (0.16 - k * 0.03) * S, -p.dir * p.pitch, a0, a1);
    c.stroke();
  }
  c.restore();
  c.globalAlpha = o.alpha ?? 1;
  // nose, with a glint
  const nose = new Path2D(), nz = toC(at(H, dH, nH, 0.268, -0.025));
  nose.ellipse(nz[0], nz[1], 0.034 * S, 0.026 * S, -p.dir * p.pitch, 0, Math.PI * 2);
  c.fillStyle = '#000000'; c.fill(nose);
  c.strokeStyle = line; c.lineWidth = rim; c.stroke(nose);
  const gl = toC(at(H, dH, nH, 0.272, -0.012));
  c.fillStyle = line; c.beginPath(); c.arc(gl[0], gl[1], 0.008 * S, 0, Math.PI * 2); c.fill();
  // muzzle grey (chin fleck) and the forehead fleck
  c.globalAlpha = (o.alpha ?? 1) * 0.5;
  c.lineWidth = Math.max(0.8, 0.006 * S);
  for (let i = 0; i < 5; i++) {
    const a0 = toC(at(J, jd, jn, 0.06 + i * 0.025, -0.066)), a1 = toC(at(J, jd, jn, 0.07 + i * 0.025, -0.08));
    c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(a1[0], a1[1]); c.stroke();
  }
  c.globalAlpha = o.alpha ?? 1;
  const f0 = toC(at(H, dH, nH, 0.105, 0.15)), f1 = toC(at(H, dH, nH, 0.13, 0.085));
  c.lineWidth = 0.014 * S; c.beginPath(); c.moveTo(f0[0], f0[1]); c.lineTo(f1[0], f1[1]); c.stroke();
  // eye
  const e = toC(at(H, dH, nH, 0.1, 0.025)), er = 0.045 * S;
  c.fillStyle = EYE; c.beginPath(); c.arc(e[0], e[1], er, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#000'; c.beginPath(); c.arc(e[0] + p.dir * er * 0.2, e[1], er * 0.55, 0, Math.PI * 2); c.fill();
  c.strokeStyle = line; c.lineWidth = rim * 0.9; c.beginPath(); c.arc(e[0], e[1], er, 0, Math.PI * 2); c.stroke();
  if (p.blink < 0.95) { c.fillStyle = line; c.beginPath(); c.arc(e[0] + p.dir * er * 0.35, e[1] - er * 0.35, er * 0.22, 0, Math.PI * 2); c.fill(); }
  if (p.blink > 0.02) {
    // the lid comes down over the eye; closed, it is a curve
    c.fillStyle = COAT; c.beginPath(); c.rect(e[0] - er * 1.3, e[1] - er * 1.3, er * 2.6, er * 2.6 * p.blink); c.save(); c.clip(); c.beginPath(); c.arc(e[0], e[1], er * 1.05, 0, Math.PI * 2); c.fill(); c.restore();
    if (p.blink > 0.9) { c.strokeStyle = line; c.lineWidth = rim; c.beginPath(); c.arc(e[0], e[1] - er * 0.4, er, 0.25 * Math.PI, 0.75 * Math.PI); c.stroke(); }
  }

  // ---- near ear
  const earN = ear(true);
  c.fillStyle = COAT; c.fill(earN.outline);
  c.fillStyle = TONGUE; c.globalAlpha = (o.alpha ?? 1) * 0.8; c.fill(earN.inner); c.globalAlpha = o.alpha ?? 1;
  c.strokeStyle = edge; c.lineWidth = rim; c.stroke(earN.outline);

  // ---- the bow tie, under the jaw
  if (p.tux) {
    const b = toC(at(H, dH, nH, -0.03, -0.22));
    c.save();
    c.translate(b[0], b[1]);
    c.rotate(p.dir * p.bow);
    const w = 0.08 * S, h = 0.045 * S;
    const bow = new Path2D();
    bow.moveTo(0, 0); bow.lineTo(-w, -h); bow.quadraticCurveTo(-w * 1.12, 0, -w, h); bow.closePath();
    bow.moveTo(0, 0); bow.lineTo(w, -h); bow.quadraticCurveTo(w * 1.12, 0, w, h); bow.closePath();
    bow.rect(-0.018 * S, -0.023 * S, 0.036 * S, 0.046 * S);
    c.fillStyle = COAT; c.fill(bow);
    c.strokeStyle = line; c.lineWidth = rim; c.stroke(bow);
    c.restore();
  }
  c.restore();
}

export interface TopPose {
  /** Canvas px of the body centre, px per unit, heading (rad, 0 = +x). */
  x: number;
  y: number;
  s: number;
  heading: number;
  /** Gallop phase (radians; one stride per 2π) and stride amount (0 standing .. 1 flat out). */
  phase: number;
  stride: number;
  /** Body length multiplier (zoomies stretch). */
  stretch: number;
  /** Ears blown back (0..1), head turn (rad). */
  wind: number;
  turn: number;
}

/**
 * Gryffy seen from directly above: the black back with its sheen, big ears, the white fleck on
 * the crown, the nub, and paws that show past the body as he gallops.
 */
export function drawTop(c: CanvasRenderingContext2D, p: TopPose, o: DrawOpts = {}) {
  const line = o.line ?? rgba('bone', 1);
  const rim = Math.max(1.1, 0.011 * p.s);
  c.save();
  c.globalAlpha = o.alpha ?? 1;
  c.translate(p.x, p.y);
  c.rotate(p.heading);
  c.scale(p.s * p.stretch, p.s);
  const lw = rim / p.s;
  c.lineJoin = 'round'; c.lineCap = 'round';

  // legs: front pair and hind pair swing in opposition, reaching past the body at full stride
  const sw = Math.sin(p.phase) * 0.2 * p.stride, lift = Math.cos(p.phase);
  const legs: [number, number, number][] = [
    [0.14, 0.11, sw], [0.14, -0.11, sw * 0.8], [-0.2, 0.1, -sw], [-0.2, -0.1, -sw * 0.8],
  ];
  for (const [lx, ly, reach] of legs) {
    const px = lx + reach + (lx > 0 ? 0.08 : -0.06) * p.stride, py = ly * (lx > 0 ? 1.7 : 1.3) * (1 + 0.1 * lift);
    c.strokeStyle = line; c.lineWidth = 0.085 + 2 * lw;
    c.beginPath(); c.moveTo(lx, ly * 0.8); c.lineTo(px, py); c.stroke();
    c.strokeStyle = COAT; c.lineWidth = 0.085;
    c.beginPath(); c.moveTo(lx, ly * 0.8); c.lineTo(px, py); c.stroke();
    // the paw, a little wider than the leg
    c.fillStyle = COAT; c.strokeStyle = line; c.lineWidth = lw;
    c.beginPath(); c.ellipse(px + 0.02, py, 0.055, 0.05, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  }
  // body, head and ears as one outlined mass
  const body = new Path2D();
  body.ellipse(0.1, 0, 0.23, 0.19, 0, 0, Math.PI * 2);
  body.ellipse(-0.18, 0, 0.19, 0.16, 0, 0, Math.PI * 2);
  body.rect(-0.18, -0.15, 0.3, 0.3);
  const hx = 0.38;
  const head = new Path2D();
  const ht = p.turn;
  head.ellipse(hx + 0.03 * Math.cos(ht), 0.03 * Math.sin(ht), 0.18, 0.2, ht, 0, Math.PI * 2);
  head.ellipse(hx + 0.13 * Math.cos(ht), 0.13 * Math.sin(ht), 0.07, 0.085, ht, 0, Math.PI * 2);
  const ears = new Path2D();
  for (const s of [-1, 1]) {
    // bat ears splay out sideways from the top of the head; wind folds them back
    const back = 0.1 * p.wind;
    ears.moveTo(hx + 0.07, s * 0.12);
    ears.quadraticCurveTo(hx + 0.06 - back, s * (0.33 - 0.06 * p.wind), hx - 0.02 - back * 1.6, s * (0.36 - 0.08 * p.wind));
    ears.quadraticCurveTo(hx - 0.1 - back, s * 0.24, hx - 0.09, s * 0.1);
    ears.closePath();
  }
  const nub = new Path2D(); nub.ellipse(-0.39, 0, 0.04, 0.035, 0, 0, Math.PI * 2);
  c.strokeStyle = line; c.lineWidth = 2 * lw;
  for (const P of [body, head, ears, nub]) c.stroke(P);
  c.fillStyle = COAT;
  for (const P of [body, head, ears, nub]) c.fill(P);
  // inner ears: a sliver of pink where the ear faces forward
  c.fillStyle = TONGUE; c.globalAlpha = (o.alpha ?? 1) * 0.75;
  for (const s of [-1, 1]) {
    const back = 0.1 * p.wind;
    c.beginPath(); c.moveTo(hx + 0.04, s * 0.15); c.quadraticCurveTo(hx + 0.03 - back, s * (0.3 - 0.06 * p.wind), hx - 0.01 - back * 1.6, s * (0.32 - 0.08 * p.wind)); c.quadraticCurveTo(hx - 0.06 - back, s * 0.22, hx - 0.05, s * 0.14); c.fill();
  }
  c.globalAlpha = o.alpha ?? 1;
  // the spine's sheen and the fleck on the crown
  c.strokeStyle = line; c.lineWidth = lw * 0.9;
  for (const k of [-1, 0, 1]) {
    c.globalAlpha = (o.alpha ?? 1) * (k ? 0.18 : 0.35);
    c.beginPath(); c.moveTo(-0.3, k * 0.05); c.quadraticCurveTo(0, k * 0.07, 0.24, k * 0.05); c.stroke();
  }
  c.globalAlpha = o.alpha ?? 1;
  c.lineWidth = 0.022;
  c.beginPath(); c.moveTo(hx + 0.07 * Math.cos(ht), 0.07 * Math.sin(ht)); c.lineTo(hx - 0.04 * Math.cos(ht), -0.04 * Math.sin(ht)); c.stroke();
  // nose tip
  c.fillStyle = '#000';
  c.beginPath(); c.ellipse(hx + 0.19 * Math.cos(ht), 0.19 * Math.sin(ht), 0.03, 0.035, ht, 0, Math.PI * 2); c.fill();
  c.restore();
}

/**
 * The black-and-white blur behind him at speed: a streak along his recent positions (newest first),
 * tapering and fading, with two bone speed lines along its edges.
 */
export function drawSmear(c: CanvasRenderingContext2D, pts: [number, number][], width: number, alpha = 1) {
  const n = pts.length;
  if (n < 2) return;
  c.save();
  c.lineCap = 'round';
  for (let i = n - 2; i >= 0; i--) {
    const [x0, y0] = pts[i]!, [x1, y1] = pts[i + 1]!;
    const k = 1 - i / (n - 1);
    c.strokeStyle = `rgba(13,13,15,${(0.85 * k * alpha).toFixed(3)})`;
    c.lineWidth = width * (0.35 + 0.65 * k);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < n - 1; i++) {
      const [x0, y0] = pts[i]!, [x1, y1] = pts[i + 1]!;
      const k = 1 - i / (n - 1);
      const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1;
      const o = (side * width * (0.35 + 0.65 * k)) / 2 * 0.8;
      c.strokeStyle = rgba('bone', 0.55 * k * alpha); c.lineWidth = 2;
      c.beginPath(); c.moveTo(x0 - (dy / l) * o, y0 + (dx / l) * o); c.lineTo(x1 - (dy / l) * o, y1 + (dx / l) * o); c.stroke();
    }
  }
  c.restore();
}

/**
 * A trot on the spot: diagonal pairs of paws swing together (phase in radians, one stride per 2π),
 * each lifting on its swing; the body bobs twice per stride. Move the pose's x to travel.
 */
export function trot(p: SidePose, phase: number, stride = 1): SidePose {
  const swing = (ph: number): [number, number] => [0.1 * stride * Math.sin(ph), 0.07 * stride * Math.max(0, Math.cos(ph))];
  const a = swing(phase), b = swing(phase + Math.PI);
  const bob = 0.012 * stride * Math.cos(2 * phase);
  return {
    ...p,
    fn: [p.fn[0] + a[0], p.fn[1] + a[1]], hf: [p.hf[0] + a[0], p.hf[1] + a[1]],
    ff: [p.ff[0] + b[0], p.ff[1] + b[1]], hn: [p.hn[0] + b[0], p.hn[1] + b[1]],
    chest: p.chest + bob, hip: p.hip + bob,
    pitch: p.pitch + 0.03 * stride * Math.sin(2 * phase),
  };
}

/** His bow tie on its own (left behind in mid-air when he bolts): centre (x, y), width w px, rotation. */
export function drawBowTie(c: CanvasRenderingContext2D, x: number, y: number, w: number, rot: number, o: DrawOpts = {}) {
  const line = o.paper ? rgba('ink', 1) : (o.line ?? rgba('bone', 1));
  c.save();
  c.translate(x, y); c.rotate(rot);
  const hw = w / 2, h = w * 0.28;
  const bow = new Path2D();
  bow.moveTo(0, 0); bow.lineTo(-hw, -h); bow.quadraticCurveTo(-hw * 1.12, 0, -hw, h); bow.closePath();
  bow.moveTo(0, 0); bow.lineTo(hw, -h); bow.quadraticCurveTo(hw * 1.12, 0, hw, h); bow.closePath();
  bow.rect(-w * 0.09, -w * 0.115, w * 0.18, w * 0.23);
  c.fillStyle = COAT; c.fill(bow);
  c.strokeStyle = line; c.lineWidth = Math.max(1.2, w * 0.03); c.lineJoin = 'round'; c.stroke(bow);
  c.restore();
}

/** Flopped down asleep: chest on the floor, forelegs out in front, hind legs tucked, eyes shut. */
export const flop = (p: SidePose): SidePose => ({
  ...p,
  chest: 0.2, hip: 0.22, lean: 0,
  fn: [0.36, 0], ff: [0.3, 0], hn: [0.14, 0], hf: [0.2, 0],
  pitch: -0.1, lift: -0.2, blink: 1, mouth: 0, tongue: 0.15, tail: -0.1, twitch: -0.25,
});

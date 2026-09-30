// Gryffy, the portrait (TREATMENT.md "Gryffy" register 1): the tuxedo photo engraved in line, like
// a society-page plate or a banknote portrait, inside an oval. Shared by the plates with a formal
// portrait (the coronation, the deed, the society pages, the rosette).
import * as THREE from 'three';
import { FSPass, makeRT } from '../../../engine/gl';
import type { Song } from '../../../song';

/** Where the oval sits on screen (logical px) and which part of the photo it shows (uv, y down). */
export interface PortraitView {
  cx: number; cy: number; rx: number; ry: number;
  /** Photo crop: centre in uv (0..1, y down) and half-height in uv (the width follows the oval's aspect). */
  u: number; v: number; hv: number;
  /** Line pitch (px) and angle (rad). */
  pitch?: number;
  angle?: number;
  /** Ink on paper (default) or bone lines on ink. */
  dark?: boolean;
  /** 0..1 how much of the engraving has been cut (a wipe from the top). */
  reveal?: number;
  /** Mirror the photo (he looks the other way). */
  mirror?: boolean;
}

/** The default crop of ref/tuxedo.jpg: ears to bow tie. */
export const TUX_CROP = { u: 0.37, v: 0.47, hv: 0.34 };
/** ref/tuxedo.jpg's height / width (1448 / 1086). */
export const TUX_ASPECT = 1448 / 1086;
/** Features of ref/tuxedo.jpg in uv (y down), for callouts and props. */
export const TUX_FEATURES = {
  crown: [0.37, 0.44], nose: [0.267, 0.5], lip: [0.252, 0.589], mouthCorner: [0.2, 0.6],
  eyeL: [0.185, 0.445], eyeR: [0.4, 0.483], earL: [0.2, 0.3], bowTie: [0.3, 0.67],
} as const;

/** Where a point of the photo (uv, y down) shows on screen in a portrait view. */
export function photoPoint(v: PortraitView, u: number, vv: number): [number, number] {
  const hu = v.hv * (v.rx / v.ry) * TUX_ASPECT * (v.mirror ? -1 : 1);
  return [v.cx + ((u - v.u) / hu) * v.rx, v.cy + ((vv - v.v) / v.hv) * v.ry];
}

export class Portrait {
  rt = makeRT();
  /** Photo height / width. */
  private aspect = 1;
  pass = new FSPass(/* glsl */ `
    uniform sampler2D photo;
    uniform vec4 oval;      // cx, cy, rx, ry (px)
    uniform vec4 crop;      // u, v, hu, hv
    uniform float pitch, angle, dark, reveal;
    void main() {
      vec2 p = FRAG_PX;
      p.y = 1080.0 - p.y;   // FRAG_PX is y-up; the layout is y-down
      vec2 q = (p - oval.xy) / oval.zw;
      float r = length(q);
      if (r > 1.0) { fragColor = vec4(0.0); return; }
      vec2 uv = crop.xy + q * crop.zw;
      // tone in perceptual units, with local contrast: a black dog is mostly one dark value, so
      // the detail (eyes, nose, the sheen of the coat) comes from the difference to the neighbourhood
      vec2 st = vec2(uv.x, 1.0 - uv.y);
      float L = pow(luma(texture(photo, st).rgb), 1.0 / 2.2);
      float o = 0.006;
      float n0 = pow(luma(texture(photo, st + vec2(o, 0.0)).rgb), 1.0 / 2.2);
      float n1 = pow(luma(texture(photo, st - vec2(o, 0.0)).rgb), 1.0 / 2.2);
      float n2 = pow(luma(texture(photo, st + vec2(0.0, o)).rgb), 1.0 / 2.2);
      float n3 = pow(luma(texture(photo, st - vec2(0.0, o)).rgb), 1.0 / 2.2);
      float blur = 0.25 * (n0 + n1 + n2 + n3);
      float detail = L - blur;
      float edge = length(vec2(n0 - n1, n2 - n3));
      float tone = smoothstep(0.02, 0.75, L) + 2.2 * detail;
      float d = sat(1.0 - tone);
      d = 0.12 + 0.88 * d;
      // the plate fades to paper towards the oval's edge (a vignette of fewer lines)
      d *= 1.0 - smoothstep(0.82, 1.0, r) * 0.85;
      float ink = engrave(p, d, 1.0 / pitch, angle);
      // the engraver cuts the contours out of the dark: strong edges become paper
      ink *= 1.0 - 0.7 * smoothstep(0.05, 0.14, edge) * step(0.35, d);
      // an engraver's border: a hairline just inside the oval
      ink = max(ink, pxLine(abs(r - 0.965) * oval.w, 0.6, 1.4));
      // cut from the top down
      float cut = smoothstep(reveal - 0.02, reveal, (p.y - (oval.y - oval.w)) / (2.0 * oval.w));
      ink *= 1.0 - cut;
      vec3 paper = dark > 0.5 ? C_INK : C_BONE;
      vec3 line = dark > 0.5 ? C_BONE : C_INK;
      fragColor = vec4(mix(paper, line, ink), 1.0);
    }`, {
    photo: { value: null }, oval: { value: new THREE.Vector4() }, crop: { value: new THREE.Vector4() },
    pitch: { value: 6 }, angle: { value: 0.5 }, dark: { value: 0 }, reveal: { value: 1 },
  });

  async load(song: Song) {
    const tex = await new THREE.TextureLoader().loadAsync(song.url('ref/tuxedo.jpg'));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    this.pass.u.photo!.value = tex;
    const img = tex.image as { width: number; height: number };
    this.aspect = img.height / img.width;
  }

  /** Renders the engraved oval into its own target (transparent outside the oval); returns its texture. */
  render(renderer: THREE.WebGLRenderer, v: PortraitView) {
    const u = this.pass.u;
    (u.oval!.value as THREE.Vector4).set(v.cx, v.cy, v.rx, v.ry);
    (u.crop!.value as THREE.Vector4).set(v.u, v.v, (v.mirror ? -1 : 1) * v.hv * (v.rx / v.ry) * this.aspect, v.hv);
    u.pitch!.value = v.pitch ?? 6;
    u.angle!.value = v.angle ?? 0.5;
    u.dark!.value = v.dark ? 1 : 0;
    u.reveal!.value = v.reveal ?? 1;
    this.pass.render(renderer, this.rt);
    return this.rt.texture;
  }
}

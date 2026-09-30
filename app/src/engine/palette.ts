import { hexToLinear } from './util';

// The default palette: ink, bone, one signal colour and one rare accent. A song's treatment
// (songs/<slug>/TREATMENT.md) may retune the values through song.json "palette" (see
// applyPalette in glsl/common.ts); scenes use the keys, never raw hex.
const DEFAULT_HEX = {
  ink: '#0A0A0B', // background black (slightly warm)
  ink2: '#151517', // raised black (panels, paper-in-the-dark)
  graphite: '#5E5B57', // dim lines, secondary text
  ash: '#9C978F', // mid grey
  bone: '#EEE9DF', // paper white, primary text
  signal: '#FF4D12', // hazard orange: highlights, the sung word
  ember: '#FF8A3D', // hotter, lighter orange for cores/highlights
  blood: '#C21D0B', // deep red-orange for shadows of signal
  accent: '#D8FF3C', // rare second accent: one motif or moment
};

export type PaletteKey = keyof typeof DEFAULT_HEX;

/** The palette in use, as #RRGGBB. */
export const HEX: Record<PaletteKey, string> = { ...DEFAULT_HEX };

/** Linear RGB triplets for GL uniforms. */
export const LIN = Object.fromEntries(
  Object.entries(HEX).map(([k, v]) => [k, hexToLinear(v)]),
) as Record<PaletteKey, [number, number, number]>;

/**
 * Replaces palette values in place (HEX and LIN). Throws on an unknown key or a value that is not
 * #RRGGBB, naming it. Shaders bake the palette in when they are built: call applyPalette
 * (glsl/common.ts), which also rebuilds GLSL_COMMON, before any scene or pass is constructed.
 */
export function setPalette(values: Record<string, string>) {
  for (const [k, v] of Object.entries(values)) {
    if (!(k in DEFAULT_HEX)) throw new Error(`palette: unknown key '${k}' (keys: ${Object.keys(DEFAULT_HEX).join(', ')})`);
    if (!/^#[0-9a-fA-F]{6}$/.test(v)) throw new Error(`palette: '${k}' must be #RRGGBB, got '${v}'`);
    HEX[k as PaletteKey] = v;
    LIN[k as PaletteKey] = hexToLinear(v);
  }
}

/** CSS rgba() for Canvas2D. */
export function rgba(key: PaletteKey | string, a = 1): string {
  const hex = (HEX as Record<string, string>)[key] ?? key;
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// The stationery of the gala: bone paper with a faint fibre and a soft falloff at the edges, for
// every paper plate (invitation, house rules, the dance manual, deeds).
import { FSPass } from '../../../engine/gl';

export const paperPass = () => new FSPass(/* glsl */ `
  uniform float seed;
  void main() {
    vec2 p = FRAG_PX;
    // long fibres along x, short flecks, and a slow cloud
    float fib = snoise(vec2(p.x * 0.004, p.y * 0.09) + seed) * 0.5 + snoise(p * 0.03 + seed * 2.0) * 0.25;
    float cloud = fbm(vec3(p * 0.0012, seed), 3);
    vec3 col = C_BONE * (0.965 + 0.012 * fib + 0.02 * cloud);
    vec2 q = vUv - 0.5;
    col *= 1.0 - 0.08 * dot(q, q) * 2.0;
    fragColor = vec4(col, 1.0);
  }`, { seed: { value: 0 } });

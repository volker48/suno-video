// The zoomies across the floor, seen from above: Gryffy flat out along a lane, and the planks of
// that lane torn up behind him, flying at the camera. Shared by chorus 1 and the final chorus.
import { W, H } from '../../../engine/gl';
import { rgba } from '../../../engine/palette';
import { hash, lerp, prog, smoothstep, TAU } from '../../../engine/util';
import { drawSmear, drawTop } from './gryffy';
import { type Cam, drawParquet, PLANK, ROW, withCam } from './parquet';

/** He runs from off the left edge (run0) to off the right edge (run1) along y = pathY. */
export function drawTornRun(c: CanvasRenderingContext2D, t: number, run0: number, run1: number, pathY: number) {
  const runX = (tt: number) => lerp(-350, 2350, (tt - run0) / (run1 - run0));
    const cam: Cam = { x: W / 2, y: H / 2, zoom: 1, rot: 0 };
    // a plank on the run's rows is torn up as he passes over it
    const rows = new Set([Math.floor((pathY - 40) / ROW), Math.floor(pathY / ROW), Math.floor((pathY + 40) / ROW)]);
    const passT = (x: number) => run0 + ((x + 350) / 2700) * (run1 - run0);
    const peel = (r: number, i: number) => {
      if (!rows.has(r)) return 0;
      const off = ((r * 149) % PLANK + PLANK) % PLANK;
      return prog(t, passT(off + i * PLANK + PLANK / 2) + 0.03, passT(off + i * PLANK + PLANK / 2) + 0.6);
    };
    withCam(c, cam, () => {
      drawParquet(c, cam, peel);
      // the torn planks fly up at the camera, spinning, then fall away
      for (const r of rows) {
        const off = ((r * 149) % PLANK + PLANK) % PLANK;
        for (let i = -2; i < 8; i++) {
          const k = peel(r, i);
          if (k <= 0 || k >= 1) continue;
          const x = off + i * PLANK + PLANK / 2, y = r * ROW + ROW / 2;
          const up = Math.sin(Math.PI * k);
          c.save();
          c.translate(x + 60 * k * (hash(r, i) - 0.5), y - 220 * up - 120 * k);
          c.rotate((hash(i, r) - 0.5) * 2.2 * k);
          const sc = 1 + 0.45 * up;
          c.scale(sc, sc * Math.abs(Math.cos(k * 2.6)) + 0.08);
          c.globalAlpha = 0.85 * (1 - smoothstep(0.55, 1, k));
          c.fillStyle = '#26262A'; c.fillRect(-PLANK / 2, -ROW / 2, PLANK, ROW);
          c.strokeStyle = rgba('ash', 0.25); c.lineWidth = 1;
          c.beginPath(); c.moveTo(-PLANK / 2 + 12, -8); c.lineTo(PLANK / 2 - 12, -4); c.moveTo(-PLANK / 2 + 12, 12); c.lineTo(PLANK / 2 - 12, 10); c.stroke();
          c.strokeStyle = rgba('bone', 0.5); c.lineWidth = 1.5; c.strokeRect(-PLANK / 2, -ROW / 2, PLANK, ROW);
          c.restore();
        }
      }
      // Gryffy, flat out
      if (t > run0 - 0.1 && t < run1 + 0.1) {
        drawSmear(c, Array.from({ length: 12 }, (_, g) => [runX(t - g * 0.02) - 120, pathY] as [number, number]), 150);
        drawTop(c, { x: runX(t), y: pathY, s: 400, heading: 0, phase: t * TAU * 5.5, stride: 1, stretch: 1.3, wind: 0.6, turn: 0 });
      }
    });
}

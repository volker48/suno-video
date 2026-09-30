// The ballroom floor seen from above: rows of planks in slightly different tones with hairline
// joints and a little grain, under a 2D camera. Shared by the top-down plates.
import { W, H } from '../../../engine/gl';
import { rgba } from '../../../engine/palette';
import { hash } from '../../../engine/util';

export const ROW = 64, PLANK = 384;

/** A top-down camera: the world point at the frame centre, zoom and roll. */
export interface Cam { x: number; y: number; zoom: number; rot: number }

export function withCam(c: CanvasRenderingContext2D, cam: Cam, draw: () => void) {
  c.save();
  c.translate(W / 2, H / 2);
  c.scale(cam.zoom, cam.zoom);
  c.rotate(cam.rot);
  c.translate(-cam.x, -cam.y);
  draw();
  c.restore();
}

/** The planks around the camera (call inside withCam). `hole(row, i)` > 0 leaves that plank torn up. */
export function drawParquet(c: CanvasRenderingContext2D, cam: Cam, hole?: (row: number, i: number) => number) {
  const R = Math.hypot(W, H) / 2 / cam.zoom + PLANK;
  const r0 = Math.floor((cam.y - R) / ROW), r1 = Math.ceil((cam.y + R) / ROW);
  for (let r = r0; r <= r1; r++) {
    const off = ((r * 149) % PLANK + PLANK) % PLANK;
    const i0 = Math.floor((cam.x - R - off) / PLANK), i1 = Math.ceil((cam.x + R - off) / PLANK);
    for (let i = i0; i <= i1; i++) {
      const x = off + i * PLANK, y = r * ROW;
      const torn = hole ? hole(r, i) : 0;
      const tone = 0.06 + 0.035 * hash(r, i);
      c.fillStyle = torn > 0 ? rgba('ink', 1) : `rgba(${Math.round(255 * tone)},${Math.round(255 * tone * 0.97)},${Math.round(255 * tone * 0.93)},1)`;
      c.fillRect(x, y, PLANK, ROW);
      c.strokeStyle = rgba('graphite', 0.45); c.lineWidth = 1.2;
      c.strokeRect(x, y, PLANK, ROW);
      if (!torn) {
        c.strokeStyle = rgba('ash', 0.07); c.lineWidth = 1;
        for (const g of [0.3, 0.68]) {
          const gy = y + ROW * (g + 0.08 * (hash(i, r, g) - 0.5));
          c.beginPath(); c.moveTo(x + 10, gy); c.bezierCurveTo(x + PLANK * 0.3, gy - 4, x + PLANK * 0.6, gy + 4, x + PLANK - 10, gy); c.stroke();
        }
      }
    }
  }
}

/*
  Each lead project's stage has a strip of track along its foot. As the stage
  passes through the screen its vehicle pulls in, stops with the doors open in
  the middle of the screen, then leaves. Its position follows the scroll,
  eased a little so it rolls rather than jumps.
*/
import { SHEETS, STOPPED_FRAME, MOVING_FRAMES, sheet, drawFrame, drawGround, groundFor, reducedMotion, fitCanvas, type SheetName } from './sprites';

const ROWS = 24;
const GROUND_Y = 18;
const ARRIVE_BY = 0.36; // share of the stage's journey through the screen
const LEAVE_AT = 0.62;

interface Strip {
  el: HTMLElement;
  cnv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  name: SheetName;
  img: HTMLCanvasElement | null;
  dot: number;
  W: number;
  x: number;
  travelled: number;
  dwell: boolean;
}

const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const easeIn = (p: number) => p * p * p;
const clamp01 = (p: number) => Math.min(1, Math.max(0, p));

export function stations(els: HTMLElement[]): void {
  if (els.length === 0) return;
  const still = reducedMotion();
  const strips: Strip[] = els.map((el) => {
    const cnv = el.querySelector<HTMLCanvasElement>('.station-track canvas')!;
    const strip: Strip = {
      el,
      cnv,
      ctx: cnv.getContext('2d')!,
      name: el.dataset.vehicle as SheetName,
      img: null,
      dot: 4,
      W: 200,
      x: -200,
      travelled: 0,
      dwell: false,
    };
    sheet(strip.name, el.dataset.colour ?? '#0c0c0a').then((img) => (strip.img = img));
    return strip;
  });

  const size = (s: Strip) => {
    const cssW = s.cnv.parentElement!.clientWidth;
    s.dot = Math.max(2, Math.min(7, Math.floor((cssW * (cssW < 700 ? 0.9 : 0.5)) / SHEETS['train-long'].w)));
    s.W = fitCanvas(s.cnv, s.dot, ROWS).w;
  };
  strips.forEach(size);
  addEventListener('resize', () => strips.forEach(size));

  /** Where the vehicle should be for how far the stage has travelled through the screen. */
  const target = (s: Strip): { x: number; dwell: boolean } => {
    const r = s.el.getBoundingClientRect();
    const vh = innerHeight;
    const p = clamp01((vh - r.top) / (r.height + vh));
    const w = SHEETS[s.name].w;
    const stop = Math.round((s.W - w) / 2);
    if (still) return { x: stop, dwell: true };
    if (p < ARRIVE_BY) return { x: -w - 2 + (stop + w + 2) * easeOut(p / ARRIVE_BY), dwell: false };
    if (p < LEAVE_AT) return { x: stop, dwell: true };
    return { x: stop + (s.W + 4 - stop) * easeIn(clamp01((p - LEAVE_AT) / (1 - LEAVE_AT))), dwell: false };
  };

  let last = performance.now();
  const frame = (ms: number) => {
    const dt = Math.min(0.05, (ms - last) / 1000);
    last = ms;
    for (const s of strips) {
      const r = s.el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > innerHeight + 50) continue;
      const t = target(s);
      const k = still ? 1 : 1 - Math.exp(-9 * dt);
      const nx = s.x + (t.x - s.x) * k;
      s.travelled += Math.abs(nx - s.x);
      const moving = Math.abs(t.x - nx) > 0.3;
      s.x = nx;
      s.dwell = t.dwell && !moving;
      const { ctx, W } = s;
      ctx.clearRect(0, 0, W, ROWS);
      drawGround(ctx, groundFor(s.name), GROUND_Y, 0, W, ROWS, ms / 1000);
      if (s.img) {
        const f = s.dwell ? STOPPED_FRAME : Math.floor(s.travelled / 3) % MOVING_FRAMES;
        drawFrame(ctx, s.img, SHEETS[s.name], f, s.x, GROUND_Y);
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

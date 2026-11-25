/*
  Strips of track with one vehicle on each, drawn from the TransitTracker
  sprites. Two kinds:

  - data-track="scroll": the vehicle's place follows how far its scope (the
    nearest [data-track-scope], or the strip itself) has travelled through the
    screen. It pulls in, stops with its doors open in the middle, and leaves.
  - data-track="arrive": the vehicle pulls in the first time the strip is on
    screen and stands with its doors open.
  - data-track="pass": the vehicle runs straight through without stopping,
    every few seconds (the 404 page).

  data-stop sets where it stops, as a share of the width (default 0.5).
  Under reduced motion every vehicle simply stands at its stop.
*/
import { SHEETS, STOPPED_FRAME, MOVING_FRAMES, sheet, drawFrame, drawGround, groundFor, reducedMotion, fitCanvas, type SheetName } from './sprites';

const ROWS = 24;
const GROUND_Y = 18;
const ARRIVE_BY = 0.36; // scroll: share of the journey through the screen
const LEAVE_AT = 0.62;
const ARRIVE_TIME = 1.8; // arrive: seconds to pull in

interface Strip {
  el: HTMLElement;
  scope: HTMLElement;
  mode: 'scroll' | 'arrive' | 'pass';
  stop: number;
  cnv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  name: SheetName;
  img: HTMLCanvasElement | null;
  dot: number;
  W: number;
  x: number;
  travelled: number;
  started: number | null;
}

const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const easeIn = (p: number) => p * p * p;
const clamp01 = (p: number) => Math.min(1, Math.max(0, p));

export function tracks(els: HTMLElement[]): void {
  if (els.length === 0) return;
  document.documentElement.classList.add('js');
  const still = reducedMotion();

  const strips: Strip[] = els.map((el) => {
    const cnv = el.querySelector('canvas')!;
    const s: Strip = {
      el,
      scope: el.closest<HTMLElement>('[data-track-scope]') ?? el,
      mode: (['arrive', 'pass'].includes(el.dataset.track ?? '') ? el.dataset.track : 'scroll') as Strip['mode'],
      stop: Number(el.dataset.stop ?? 0.5),
      cnv,
      ctx: cnv.getContext('2d')!,
      name: el.dataset.vehicle as SheetName,
      img: null,
      dot: 4,
      W: 200,
      x: -400,
      travelled: 0,
      started: null,
    };
    sheet(s.name, el.dataset.colour ?? '#0c0c0a').then((img) => (s.img = img));
    return s;
  });

  const size = (s: Strip) => {
    const cssW = s.cnv.parentElement!.clientWidth;
    const share = cssW < 700 ? 0.9 : 0.5;
    s.dot = Math.max(2, Math.min(7, Math.floor((cssW * share) / SHEETS['train-long'].w)));
    s.W = fitCanvas(s.cnv, s.dot, ROWS).w;
  };
  strips.forEach(size);
  addEventListener('resize', () => strips.forEach(size));

  const stopX = (s: Strip) => Math.round((s.W - SHEETS[s.name].w) * s.stop);
  const offLeft = (s: Strip) => -SHEETS[s.name].w - 2;

  /** Where the vehicle should be now, and whether it is standing with its doors open. */
  const target = (s: Strip, t: number): { x: number; dwell: boolean } => {
    const stop = stopX(s);
    if (still) return { x: stop, dwell: s.mode !== 'pass' };
    if (s.mode === 'pass') {
      const w = SHEETS[s.name].w;
      const lap = s.W + w + 160; // the gap is the wait before the next one
      return { x: offLeft(s) + (((t - (s.started ?? t)) * 70) % lap), dwell: false };
    }
    if (s.mode === 'arrive') {
      if (s.started === null) return { x: offLeft(s), dwell: false };
      const p = clamp01((t - s.started) / ARRIVE_TIME);
      return { x: offLeft(s) + (stop - offLeft(s)) * easeOut(p), dwell: p >= 1 };
    }
    const r = s.scope.getBoundingClientRect();
    const p = clamp01((innerHeight - r.top) / (r.height + innerHeight));
    if (p < ARRIVE_BY) return { x: offLeft(s) + (stop - offLeft(s)) * easeOut(p / ARRIVE_BY), dwell: false };
    if (p < LEAVE_AT) return { x: stop, dwell: true };
    return { x: stop + (s.W + 4 - stop) * easeIn(clamp01((p - LEAVE_AT) / (1 - LEAVE_AT))), dwell: false };
  };

  let last = performance.now();
  const frame = (ms: number) => {
    const t = ms / 1000;
    const dt = Math.min(0.05, (ms - last) / 1000);
    last = ms;
    for (const s of strips) {
      const r = s.el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > innerHeight + 50) continue;
      if (s.started === null && r.top < innerHeight - r.height * 0.5) s.started = t + 0.15;
      const goal = target(s, t);
      // Arrivals follow their own easing; scroll-driven ones are eased toward the scroll.
      const k = still || s.mode !== 'scroll' ? 1 : 1 - Math.exp(-9 * dt);
      const nx = s.x + (goal.x - s.x) * k;
      s.travelled += Math.abs(nx - s.x);
      const moving = s.mode === 'pass' ? !still : Math.abs(goal.x - nx) > 0.3;
      s.x = nx;
      const dwell = goal.dwell && !moving;
      s.ctx.clearRect(0, 0, s.W, ROWS);
      drawGround(s.ctx, groundFor(s.name), GROUND_Y, 0, s.W, ROWS, t);
      if (s.img) {
        const f = dwell ? STOPPED_FRAME : Math.floor(s.travelled / 3) % MOVING_FRAMES;
        drawFrame(s.ctx, s.img, SHEETS[s.name], f, s.x, GROUND_Y);
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

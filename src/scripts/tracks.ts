/*
  Strips of track with one vehicle on each, drawn from the TransitTracker
  sprites. Three kinds:

  - data-track="scroll": scrolling decides where the vehicle should be, and
    the vehicle then drives there in its own time, so it always moves
    smoothly however the page is scrolled. When its scope (the nearest
    [data-track-scope], or the strip) is coming onto the screen it pulls in
    and stops with its doors open; when the scope is leaving it pulls out.
    Scrolling back reverses it out the way it came.
  - data-track="arrive": the vehicle pulls in the first time the strip is on
    screen and stands with its doors open.
  - data-track="pass": the vehicle runs straight through without stopping,
    every few seconds (the 404 page).

  data-stop sets where it stops, as a share of the width (default 0.5).
  Under reduced motion every vehicle simply stands at its stop.
*/
import { SHEETS, STOPPED_FRAME, MOVING_FRAMES, sheet, drawFrame, drawGround, groundFor, reducedMotion, fitCanvas, type SheetName } from './sprites';
import { ready } from './loader';

const ROWS = 24;
const GROUND_Y = 18;
// Scroll: how far the scope has come through the screen (0 = its top at the bottom of the
// screen, 1 = its bottom gone off the top) when the vehicle is called in, and sent on.
const CALL_AT = 0.24;
const SEND_AT = 0.6;
const DOORS = 0.2; // seconds between stopping and the doors opening

type Place = 'away' | 'in' | 'gone';

interface Move {
  from: number;
  to: number;
  t0: number;
  dur: number;
  ease: (p: number) => number;
}

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
  cssW: number;
  x: number;
  travelled: number;
  place: Place;
  move: Move | null;
  stoppedAt: number;
  started: number | null;
}

const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const easeIn = (p: number) => p * p * p;
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const clamp01 = (p: number) => Math.min(1, Math.max(0, p));

export function tracks(els: HTMLElement[]): void {
  if (els.length === 0) return;
  document.documentElement.classList.add('js');
  const still = reducedMotion();
  let uncovered = false;
  ready.then(() => (uncovered = true));

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
      cssW: 0,
      x: -400,
      travelled: 0,
      place: 'away',
      move: null,
      stoppedAt: 0,
      started: null,
    };
    sheet(s.name, el.dataset.colour ?? '#0c0c0a').then((img) => (s.img = img));
    return s;
  });

  const stopX = (s: Strip) => Math.round((s.W - SHEETS[s.name].w) * s.stop);
  const offLeft = (s: Strip) => -SHEETS[s.name].w - 2;
  const offRight = (s: Strip) => s.W + 2;

  // Only redraw the canvas when the strip's width changes: a phone's address bar showing and
  // hiding fires resize events while scrolling, and resetting a canvas then makes it flicker.
  const size = (s: Strip) => {
    const cssW = s.cnv.parentElement!.clientWidth;
    if (cssW === s.cssW) return;
    s.cssW = cssW;
    const share = cssW < 700 ? 0.9 : 0.5;
    s.dot = Math.max(2, Math.min(7, Math.floor((cssW * share) / SHEETS['train-long'].w)));
    s.W = fitCanvas(s.cnv, s.dot, ROWS).w;
    if (s.place === 'in' && !s.move) s.x = stopX(s);
    if (s.place === 'gone' && !s.move) s.x = offRight(s);
  };
  strips.forEach(size);
  addEventListener('resize', () => strips.forEach(size));
  strips.forEach((s) => {
    s.x = still ? stopX(s) : offLeft(s);
    s.place = still ? 'in' : 'away';
  });

  /** Sends the vehicle to [place] from wherever it is now, in its own time. */
  const go = (s: Strip, place: Place, t: number) => {
    if (s.place === place) return;
    const prev = s.place;
    s.place = place;
    const to = place === 'in' ? stopX(s) : place === 'gone' ? offRight(s) : offLeft(s);
    // A vehicle that has to come back round from the far side reappears where it should come from.
    if (place === 'in' && prev === 'gone' && s.x >= offRight(s) - 1) s.x = offRight(s);
    if (place === 'in' && prev === 'away' && s.x <= offLeft(s) + 1) s.x = offLeft(s);
    // Scrolled straight back past a vehicle that has already gone: put it back without a show.
    if (place === 'away' && prev === 'gone' && s.x >= offRight(s) - 1) {
      s.x = offLeft(s);
      s.move = null;
      return;
    }
    const dist = Math.abs(to - s.x);
    const full = s.W + SHEETS[s.name].w;
    const dur = Math.max(0.5, (place === 'in' ? 1.5 : 1.1) * Math.min(1, dist / (full * 0.6)));
    const ease = place === 'in' ? easeOut : s.place === 'gone' && prev === 'in' ? easeIn : easeInOut;
    s.move = { from: s.x, to, t0: t, dur, ease };
  };

  const scrollPlace = (s: Strip): Place => {
    const r = s.scope.getBoundingClientRect();
    const p = (innerHeight - r.top) / (r.height + innerHeight);
    return p < CALL_AT ? 'away' : p < SEND_AT ? 'in' : 'gone';
  };

  const frame = (ms: number) => {
    const t = ms / 1000;
    for (const s of strips) {
      const r = s.el.getBoundingClientRect();
      const visible = r.bottom > -50 && r.top < innerHeight + 50;

      if (!still && uncovered) {
        if (s.mode === 'scroll') go(s, scrollPlace(s), t);
        else if (s.mode === 'arrive' && visible && s.started === null && r.top < innerHeight - r.height * 0.5) {
          s.started = t;
          go(s, 'in', t + 0.1);
        } else if (s.mode === 'pass' && visible && s.started === null) s.started = t;
      }
      if (!visible) continue;

      // Move.
      let moving = false;
      if (s.mode === 'pass' && s.started !== null && !still) {
        const lap = s.W + SHEETS[s.name].w + 160; // the gap is the wait before the next one
        const nx = offLeft(s) + (((t - s.started) * 70) % lap);
        s.travelled += Math.abs(nx - s.x);
        s.x = nx;
        moving = true;
      } else if (s.move) {
        const m = s.move;
        const p = clamp01((t - m.t0) / m.dur);
        const nx = m.from + (m.to - m.from) * m.ease(p);
        s.travelled += Math.abs(nx - s.x);
        s.x = nx;
        moving = p < 1;
        if (p >= 1) {
          s.move = null;
          s.stoppedAt = t;
        }
      }

      // Draw.
      const { ctx, W } = s;
      ctx.clearRect(0, 0, W, ROWS);
      drawGround(ctx, groundFor(s.name), GROUND_Y, 0, W, ROWS, t);
      if (s.img) {
        const doors = !moving && s.place === 'in' && (still || t - s.stoppedAt > DOORS);
        const f = doors ? STOPPED_FRAME : Math.floor(s.travelled / 3) % MOVING_FRAMES;
        drawFrame(ctx, s.img, SHEETS[s.name], f, s.x, GROUND_Y);
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

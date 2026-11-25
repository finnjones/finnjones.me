/*
  The departures board and its platform. One project is "at the platform" at a
  time: its row is lit on the board, its screenshot is beside the list, and its
  vehicle stands at the platform with the doors open. The board moves on to the
  next service when the bar under the row fills, or straight away when you
  point at a row. Your pointer also sets where the person on the platform walks.
*/
import {
  SHEETS,
  STOPPED_FRAME,
  MOVING_FRAMES,
  sheet,
  drawFrame,
  drawGround,
  groundFor,
  reducedMotion,
  fitCanvas,
  type Ground,
  type SheetName,
} from './sprites';

const ROWS = 27; // canvas height in dots
const GROUND_Y = 19; // the rail's top row
const ARRIVE = 1.7; // seconds to pull in
const LEAVE = 1.1; // seconds to pull out
const DOORS = 0.18; // seconds between stopping and the doors opening

interface Service {
  name: SheetName;
  colour: string;
}

interface Run {
  service: Service;
  img: HTMLCanvasElement | null;
  kind: 'arrive' | 'dwell' | 'leave';
  from: number;
  to: number;
  t0: number;
  dur: number;
  x: number;
  travelled: number;
  stoppedAt: number;
}

const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const easeIn = (p: number) => p * p * p;
const clamp01 = (p: number) => Math.min(1, Math.max(0, p));

/** Board text flickers through other characters before it settles, as an indicator does when it updates. */
const GLYPHS = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
function scramble(el: HTMLElement, delay: number, dur: number): void {
  const text = el.textContent ?? '';
  const start = performance.now() + delay * 1000;
  el.style.minWidth = `${el.getBoundingClientRect().width}px`;
  const tick = (now: number) => {
    const p = (now - start) / (dur * 1000);
    if (p >= 1) {
      el.textContent = text;
      el.style.minWidth = '';
      return;
    }
    const settled = Math.max(0, Math.floor(p * text.length));
    let out = text.slice(0, settled);
    for (let i = settled; i < text.length; i++) {
      out += text[i] === ' ' || p < 0 ? (p < 0 ? ' ' : ' ') : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function startClock(el: HTMLElement): void {
  const fmt = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const set = () => {
    const now = new Date();
    el.textContent = fmt.format(now);
    el.setAttribute('datetime', now.toISOString());
  };
  set();
  setInterval(set, 1000);
}

export function departures(root: HTMLElement): void {
  document.documentElement.classList.add('js');
  const still = reducedMotion();
  const rows = [...root.querySelectorAll<HTMLAnchorElement>('[data-service]')];
  const panels = [...root.querySelectorAll<HTMLElement>('[data-now]')];
  const cnv = root.querySelector<HTMLCanvasElement>('.platform canvas')!;
  const ctx = cnv.getContext('2d')!;
  const services: Service[] = rows.map((r) => ({ name: r.dataset.vehicle as SheetName, colour: r.dataset.colour! }));
  const images = new Map<Service, HTMLCanvasElement>();
  services.forEach((s) => sheet(s.name, s.colour).then((img) => images.set(s, img)));
  let walkerImg: HTMLCanvasElement | null = null;
  sheet('walker', '#ffd23f').then((img) => (walkerImg = img));

  const clock = root.querySelector<HTMLElement>('[data-clock]');
  if (clock) startClock(clock);

  let dot = 4;
  let W = 200;
  let current = -1;
  let runs: Run[] = [];
  let ground: Ground = groundFor(services[0].name);
  let nextGround: Ground = ground;
  let groundFrom = 0; // time the next ground starts rolling out
  const walker = { x: 20, target: 20, travelled: 0, flip: false, speed: 0 };

  const stopX = (s: Service) => Math.round((W - SHEETS[s.name].w) / 2);

  function resize(): void {
    const cssW = cnv.parentElement!.clientWidth;
    const share = cssW < 700 ? 0.92 : 0.58;
    const byWidth = Math.floor((cssW * share) / SHEETS['train-long'].w);
    const byHeight = Math.floor((innerHeight * 0.2) / ROWS);
    dot = Math.max(2, Math.min(8, byWidth, byHeight));
    W = fitCanvas(cnv, dot, ROWS).w;
    root.style.setProperty('--dot', `${dot}px`);
    for (const r of runs) if (r.kind === 'dwell') r.x = r.from = r.to = stopX(r.service);
    walker.x = Math.min(walker.x, W - 12);
    walker.target = Math.min(walker.target, W - 12);
  }

  function setCurrent(i: number, now = performance.now() / 1000): void {
    if (i === current) return;
    const first = current === -1;
    current = i;
    rows.forEach((r, k) => {
      r.classList.toggle('is-current', k === i);
      if (k === i) r.setAttribute('aria-current', 'true');
      else r.removeAttribute('aria-current');
    });
    panels.forEach((p, k) => (p.hidden = k !== i));

    const s = services[i];
    if (still) {
      runs = [{ service: s, img: null, kind: 'dwell', from: stopX(s), to: stopX(s), t0: now, dur: 0, x: stopX(s), travelled: 0, stoppedAt: now - 1 }];
      ground = nextGround = groundFor(s.name);
      return;
    }
    let delay = first ? 0.45 : 0;
    for (const r of runs) {
      if (r.kind === 'leave') continue;
      r.kind = 'leave';
      r.from = r.x;
      r.to = W + 6;
      r.t0 = now;
      r.dur = LEAVE;
      delay = 0.35;
    }
    const w = SHEETS[s.name].w;
    runs.push({ service: s, img: null, kind: 'arrive', from: -w - 2, to: stopX(s), t0: now + delay, dur: ARRIVE, x: -w - 2, travelled: 0, stoppedAt: 0 });
    nextGround = groundFor(s.name);
    groundFrom = now + delay;
    if (first) ground = nextGround;
  }

  // ---- The frame loop ----
  let last = performance.now() / 1000;
  let running = false;

  function frame(ms: number): void {
    const t = ms / 1000;
    const dt = Math.min(0.05, t - last);
    last = t;
    ctx.clearRect(0, 0, W, ROWS);

    // The ground rolls out ahead of a service on a different kind of track.
    if (nextGround !== ground) {
      const p = clamp01((t - groundFrom) / 0.7);
      const split = Math.round(W * easeOut(p));
      drawGround(ctx, nextGround, GROUND_Y, 0, split, ROWS, t);
      drawGround(ctx, ground, GROUND_Y, split, W, ROWS, t);
      if (p >= 1) ground = nextGround;
    } else {
      drawGround(ctx, ground, GROUND_Y, 0, W, ROWS, t);
    }

    // The vehicles.
    for (const r of runs) {
      if (t >= r.t0 && r.kind !== 'dwell') {
        const p = clamp01((t - r.t0) / r.dur);
        const x = r.from + (r.to - r.from) * (r.kind === 'arrive' ? easeOut(p) : easeIn(p));
        r.travelled += Math.abs(x - r.x);
        r.x = x;
        if (p >= 1 && r.kind === 'arrive') {
          r.kind = 'dwell';
          r.stoppedAt = t;
        }
      }
      if (t < r.t0) continue;
      const img = images.get(r.service);
      if (!img) continue;
      const s = SHEETS[r.service.name];
      const f = r.kind === 'dwell' && t - r.stoppedAt > DOORS ? STOPPED_FRAME : Math.floor(r.travelled / 3) % MOVING_FRAMES;
      drawFrame(ctx, img, s, f, r.x, GROUND_Y);
    }
    runs = runs.filter((r) => !(r.kind === 'leave' && r.x >= W + 4));

    // The person on the platform walks, or runs, to where you point.
    if (walkerImg) {
      const d = walker.target - walker.x;
      let f = STOPPED_FRAME;
      if (Math.abs(d) > 0.5 && !still) {
        const run = Math.abs(d) > 28;
        const v = (run ? 34 : 13) * dt;
        const step = Math.sign(d) * Math.min(Math.abs(d), v);
        walker.x += step;
        walker.travelled += Math.abs(step);
        walker.flip = d < 0;
        f = run ? 5 + (Math.floor(walker.travelled / 2.5) % 4) : Math.floor(walker.travelled / 2) % 4;
      }
      drawFrame(ctx, walkerImg, SHEETS.walker, f, walker.x, GROUND_Y, walker.flip);
    }

    if (running) requestAnimationFrame(frame);
  }

  function play(): void {
    if (running) return;
    running = true;
    last = performance.now() / 1000;
    requestAnimationFrame(frame);
  }
  function pause(): void {
    running = false;
  }

  // Only draw while the platform is on screen and the tab is visible.
  const visible = () => {
    const r = root.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight && document.visibilityState === 'visible';
  };
  const check = () => (visible() ? play() : pause());
  addEventListener('scroll', check, { passive: true });
  document.addEventListener('visibilitychange', check);
  root.classList.toggle('is-paused', false);

  // ---- Input ----
  let intent = 0;
  rows.forEach((row, i) => {
    row.addEventListener('pointerenter', () => {
      clearTimeout(intent);
      intent = window.setTimeout(() => setCurrent(i), 110);
    });
    row.addEventListener('pointerleave', () => clearTimeout(intent));
    row.addEventListener('focus', () => setCurrent(i));
    // The screenshot travels into the project page.
    row.addEventListener('click', () => {
      const shot = root.querySelector<HTMLElement>(`[data-shot="${row.dataset.service}"]`);
      if (shot) shot.style.viewTransitionName = `shot-${row.dataset.service}`;
    });
    row.querySelector('.service-bar')?.addEventListener('animationend', () => setCurrent((i + 1) % rows.length));
  });

  const aim = (clientX: number) => {
    const r = cnv.getBoundingClientRect();
    walker.target = Math.max(1, Math.min(W - SHEETS.walker.w - 1, (clientX - r.left) / dot - SHEETS.walker.w / 2));
  };
  root.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') aim(e.clientX);
  });
  cnv.parentElement!.addEventListener('pointerdown', (e) => aim(e.clientX));

  // ---- Start ----
  resize();
  new ResizeObserver(resize).observe(cnv.parentElement!);
  walker.x = walker.target = Math.round(W * 0.14);

  // The board flickers into place once per visit. Storage can be unavailable; then it always does.
  let seen = false;
  try {
    seen = sessionStorage.getItem('fj-board') === '1';
    sessionStorage.setItem('fj-board', '1');
  } catch {
    seen = false;
  }
  if (!still && !seen) {
    const items = [...root.querySelectorAll<HTMLElement>('[data-scramble]')];
    items.forEach((el, k) => scramble(el, 0.1 + k * 0.07, k === 0 ? 0.9 : 0.5));
  }
  setCurrent(0);
  check();
  if (still) frame(performance.now());
}

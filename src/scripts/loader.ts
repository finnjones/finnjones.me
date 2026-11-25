/*
  The loading screen, shown once per visit. It is TransitTracker's own two
  loaders at full size (app/ui/.../loading/Loading.kt): the treadmill, where a
  vehicle holds the centre while the ground runs under it and the fleet takes
  turns, and the flap board, whose letters spin and settle. A row of cars
  lights up as the fonts, sprites and first images finish loading.

  When everything is in, the vehicle drives off and the dark screen closes
  down onto the departures board (or wipes up, on other pages). `ready`
  resolves when the page is uncovered, so the board can start its show.

  The head of every page sets html.loading before first paint, and clears it
  itself after 8 seconds if this script never runs.
*/
import { SHEETS, MOVING_FRAMES, sheet, drawFrame, drawGround, groundFor, reducedMotion, type SheetName } from './sprites';

const MIN_TIME = 1.9; // seconds the loader is on screen at least
const MAX_TIME = 6; // and at most, however slow the network
const TICK = 1 / 8; // the app's sprite clock: 8 ticks a second
const VEHICLE_TICKS = 9; // each vehicle's turn (LoaderTiming.VEHICLE_TICKS)
const WINDOW_W = 48; // the treadmill window, in dots (Loading.kt)
const WINDOW_H = 22;
const WINDOW_GROUND = 16;

// LoaderFleet: T1, the bus fleet, F1, L2, M1.
const FLEET: { name: SheetName; livery: string }[] = [
  { name: 'train', livery: '#f99d1c' },
  { name: 'bus', livery: '#00b5ef' },
  { name: 'ferry', livery: '#00774b' },
  { name: 'lightrail', livery: '#e4022d' },
  { name: 'metro', livery: '#168388' },
];

const root = document.documentElement;
const shown = root.classList.contains('loading');

let resolveReady: () => void = () => {};
/** Resolves once the page is uncovered (straight away when there is no loading screen). */
export const ready: Promise<void> = shown ? new Promise((r) => (resolveReady = r)) : Promise.resolve();
/** True on the visit that showed the loading screen. */
export const firstVisit = shown;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const GLYPHS = 'ABCDEFGHJKLMNPRSTUVWXYZ';

/** One frame of the treadmill at [tick], as treadmillFrame() in LoadingModel.kt. */
function treadmill(tick: number) {
  const t = tick + 4;
  const step = t % VEHICLE_TICKS;
  const offset = step === 0 ? -30 : step === 1 ? -10 : step === VEHICLE_TICKS - 2 ? 10 : step === VEHICLE_TICKS - 1 ? 30 : 0;
  return { vehicle: Math.floor(t / VEHICLE_TICKS) % FLEET.length, offset, scroll: (t * 2) % 28, frame: t % MOVING_FRAMES };
}

async function run(): Promise<void> {
  const el = document.querySelector<HTMLElement>('[data-loader]');
  if (!el) return finish(null);
  const still = reducedMotion();
  const start = performance.now();
  const cnv = el.querySelector('canvas')!;
  const ctx = cnv.getContext('2d')!;
  const cars = [...el.querySelectorAll<HTMLElement>('.loader-cars span')];
  const name = el.querySelector<HTMLElement>('[data-flap]');

  // ---- What there is to wait for ----
  const tasks: Promise<unknown>[] = [document.fonts.ready];
  const fleet = FLEET.map((f) => sheet(f.name, f.livery));
  tasks.push(...fleet);
  for (const s of document.querySelectorAll<HTMLElement>('[data-vehicle][data-colour]')) {
    tasks.push(sheet(s.dataset.vehicle as SheetName, s.dataset.colour!));
  }
  for (const img of document.querySelectorAll<HTMLImageElement>('img[loading="eager"]')) {
    tasks.push(img.complete ? Promise.resolve() : img.decode().catch(() => undefined));
  }
  let done = 0;
  tasks.forEach((p) => p.then(() => done++, () => done++));
  const images: (HTMLCanvasElement | null)[] = FLEET.map(() => null);
  fleet.forEach((p, i) => p.then((img) => (images[i] = img)));

  // ---- The flap board: the name's letters spin, then settle from the left ----
  if (name && !still) {
    const text = name.textContent ?? '';
    name.textContent = '';
    const cells = [...text].map((ch) => {
      const c = document.createElement('span');
      c.className = ch === ' ' ? 'flap gap' : 'flap';
      c.textContent = ch === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      name.append(c);
      return { c, ch };
    });
    name.setAttribute('aria-label', text);
    const spin = setInterval(() => {
      const s = (performance.now() - start) / 1000;
      cells.forEach(({ c, ch }, i) => {
        if (ch === ' ') return;
        if (s > 0.45 + i * 0.09) c.textContent = ch;
        else c.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      });
      if (s > 0.45 + cells.length * 0.09) clearInterval(spin);
    }, 60);
  }

  // ---- The treadmill, and the cars filling in ----
  let leaving: number | null = null;
  let progress = 0;
  const dot = () => Math.max(3, Math.min(10, Math.floor(Math.min(innerWidth * 0.5, innerHeight * 0.42) / WINDOW_W)));
  const size = () => {
    const d = dot();
    cnv.width = WINDOW_W;
    cnv.height = WINDOW_H;
    cnv.style.width = `${WINDOW_W * d}px`;
    cnv.style.height = `${WINDOW_H * d}px`;
  };
  size();

  const draw = (ms: number) => {
    const s = (ms - start) / 1000;
    const tick = still ? 0 : Math.floor(s / TICK);
    const f = treadmill(tick);
    let off = f.offset;
    let v = f.vehicle;
    if (leaving !== null) {
      // On the way out the current vehicle keeps its place in the fleet and drives off.
      v = leavingVehicle;
      off = Math.round(Math.pow((s - leaving) / 0.45, 2) * 60);
    }
    const veh = FLEET[v];
    const sh = SHEETS[veh.name];
    ctx.clearRect(0, 0, WINDOW_W, WINDOW_H);
    drawGround(ctx, groundFor(veh.name), WINDOW_GROUND, 0, WINDOW_W, WINDOW_H, s, still ? 0 : f.scroll);
    const img = images[v];
    if (img) drawFrame(ctx, img, sh, still ? 0 : f.frame, Math.round(WINDOW_W / 2 - sh.w / 2) + off, WINDOW_GROUND);

    // Progress is the share of tasks done, but never ahead of the minimum time.
    const loaded = done / tasks.length;
    const target = Math.min(loaded, s / MIN_TIME, 1);
    progress += (target - progress) * 0.2;
    const lit = Math.round(progress * cars.length);
    cars.forEach((c, i) => c.classList.toggle('on', i < lit));
    if (running) requestAnimationFrame(draw);
  };
  let running = true;
  let leavingVehicle = 0;
  requestAnimationFrame(draw);

  // ---- Wait for everything, within the time limits ----
  await Promise.race([Promise.allSettled(tasks), wait(MAX_TIME * 1000)]);
  const elapsed = (performance.now() - start) / 1000;
  if (elapsed < MIN_TIME) await wait((MIN_TIME - elapsed) * 1000);
  done = tasks.length;
  await wait(260); // let the last cars light

  // ---- Out: the vehicle drives off, then the screen closes onto the board ----
  const s = (performance.now() - start) / 1000;
  leavingVehicle = treadmill(Math.floor(s / TICK)).vehicle;
  leaving = still ? null : s;
  await wait(still ? 0 : 300);
  el.classList.add('is-leaving');

  const board = document.querySelector<HTMLElement>('.board');
  const r = board?.getBoundingClientRect();
  const onScreen = r && r.top >= 0 && r.bottom <= innerHeight;
  if (still) {
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' });
    await wait(250);
  } else if (board && r && onScreen) {
    const to = `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px)`;
    await el.animate([{ clipPath: 'inset(0px 0px 0px 0px)' }, { clipPath: to }], {
      duration: 900,
      delay: 120,
      easing: 'cubic-bezier(0.76, 0, 0.24, 1)',
      fill: 'forwards',
    }).finished;
  } else {
    await el.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }], {
      duration: 750,
      delay: 120,
      easing: 'cubic-bezier(0.76, 0, 0.24, 1)',
      fill: 'forwards',
    }).finished;
  }
  running = false;
  finish(el);
}

function finish(el: HTMLElement | null): void {
  try {
    sessionStorage.setItem('fj-seen', '1');
  } catch {
    // No storage: the loading screen will show again on the next page, which is harmless.
  }
  root.classList.remove('loading');
  el?.remove();
  resolveReady();
}

if (shown) run();

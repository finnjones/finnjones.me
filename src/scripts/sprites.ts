/*
  The TransitTracker sprites, drawn the way the app draws them
  (app/ui/.../sprites/SpriteSheets.kt): the base layer, then the livery mask
  tinted in the line colour, then the outline. One art pixel is one "dot";
  canvases are drawn at one pixel per dot and scaled up without smoothing.
*/

export type SheetName =
  | 'train-long'
  | 'metro-long'
  | 'lightrail-pair'
  | 'bus'
  | 'coach'
  | 'ferry'
  | 'walker';

export interface Sheet {
  w: number; // frame width in dots
  h: number; // frame height in dots
  n: number; // frames in the sheet
  ground: number; // the row the vehicle stands on (the waterline for the ferry)
}

// Sizes from SpriteSheet in SpriteSheets.kt.
export const SHEETS: Record<SheetName, Sheet> = {
  'train-long': { w: 113, h: 16, n: 5, ground: 15 },
  'metro-long': { w: 113, h: 16, n: 5, ground: 15 },
  'lightrail-pair': { w: 67, h: 16, n: 5, ground: 14 },
  bus: { w: 30, h: 15, n: 5, ground: 14 },
  coach: { w: 34, h: 15, n: 5, ground: 14 },
  ferry: { w: 34, h: 18, n: 5, ground: 13 },
  walker: { w: 10, h: 14, n: 9, ground: 13 },
};

/** Frames 0 to 3 are the moving cycle; frame 4 stands still with the doors open and lit. */
export const MOVING_FRAMES = 4;
export const STOPPED_FRAME = 4;

export type Ground = 'rail' | 'wire' | 'road' | 'water';

export function groundFor(name: SheetName): Ground {
  if (name === 'lightrail-pair') return 'wire';
  if (name === 'bus' || name === 'coach') return 'road';
  if (name === 'ferry') return 'water';
  return 'rail';
}

// Ground colours: the app's Night tokens, which also read on the site's colour fields.
export const COLOURS = {
  ink: '#0c0c0a',
  rail: '#a3a092',
  sleeper: '#3d3d38',
  line: '#f3ecd8',
  water: '#3f8fe8',
  wave: '#6cb6ff',
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

const sheets = new Map<string, Promise<HTMLCanvasElement>>();

/** The whole sheet for [name] with its livery in [livery], composed once and cached. */
export function sheet(name: SheetName, livery: string): Promise<HTMLCanvasElement> {
  const key = `${name}|${livery}`;
  let found = sheets.get(key);
  if (!found) {
    found = (async () => {
      const base = `/sprites/layers/${name}`;
      const [body, mask, outline] = await Promise.all([
        loadImage(`${base}.png`),
        loadImage(`${base}-livery.png`),
        loadImage(`${base}-outline.png`),
      ]);
      const out = canvas(body.width, body.height);
      const ctx = out.getContext('2d')!;
      ctx.drawImage(body, 0, 0);
      const tint = canvas(mask.width, mask.height);
      const t = tint.getContext('2d')!;
      t.drawImage(mask, 0, 0);
      t.globalCompositeOperation = 'source-in';
      t.fillStyle = livery;
      t.fillRect(0, 0, tint.width, tint.height);
      ctx.drawImage(tint, 0, 0);
      ctx.drawImage(outline, 0, 0);
      return out;
    })();
    sheets.set(key, found);
  }
  return found;
}

/** Draws frame [frame] of a composed sheet with its ground row on [groundY]. [flip] faces it left. */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLCanvasElement,
  s: Sheet,
  frame: number,
  x: number,
  groundY: number,
  flip = false,
): void {
  const f = Math.max(0, Math.min(s.n - 1, frame));
  const left = Math.round(x);
  const top = groundY - s.ground;
  if (flip) {
    ctx.save();
    ctx.translate(left + s.w, top);
    ctx.scale(-1, 1);
    ctx.drawImage(img, f * s.w, 0, s.w, s.h, 0, 0, s.w, s.h);
    ctx.restore();
  } else {
    ctx.drawImage(img, f * s.w, 0, s.w, s.h, left, top, s.w, s.h);
  }
}

/**
 * Draws [ground] from [from] to [to] (dots) with its surface on [groundY], after Ground.kt:
 * rails and sleepers, a rail under an overhead wire, a road with a dashed centre line, or water.
 * Everything below the surface is filled with ink down to [bottom].
 */
export function drawGround(
  ctx: CanvasRenderingContext2D,
  ground: Ground,
  groundY: number,
  from: number,
  to: number,
  bottom: number,
  t = 0,
): void {
  const w = to - from;
  if (w <= 0) return;
  ctx.fillStyle = COLOURS.ink;
  ctx.fillRect(from, groundY, w, bottom - groundY);
  if (ground === 'rail' || ground === 'wire') {
    ctx.fillStyle = COLOURS.rail;
    ctx.fillRect(from, groundY, w, 1);
    ctx.fillStyle = COLOURS.sleeper;
    for (let x = from - (from % 4); x < to; x += 4) {
      if (x >= from) ctx.fillRect(x, groundY + 1, 1, 2);
    }
    if (ground === 'wire') {
      ctx.fillStyle = COLOURS.ink;
      ctx.fillRect(from, groundY - SHEETS['lightrail-pair'].ground, w, 1);
    }
  } else if (ground === 'road') {
    ctx.fillStyle = COLOURS.sleeper;
    ctx.fillRect(from, groundY, w, 1);
    ctx.fillStyle = COLOURS.line;
    for (let x = from - (from % 7); x < to; x += 7) {
      const a = Math.max(x, from);
      const b = Math.min(x + 3, to);
      if (b > a) ctx.fillRect(a, groundY + 3, b - a, 1);
    }
  } else {
    // Water: a sea band with a row of moving wave dots on its surface.
    ctx.fillStyle = COLOURS.water;
    ctx.fillRect(from, groundY, w, 4);
    ctx.fillStyle = COLOURS.wave;
    const shift = Math.floor(t * 3) % 6;
    for (let x = from - (from % 6) + shift - 6; x < to; x += 6) {
      const a = Math.max(x, from);
      const b = Math.min(x + 2, to);
      if (b > a) ctx.fillRect(a, groundY, b - a, 1);
    }
  }
}

export function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** A canvas sized to its box at one pixel per dot, scaled up crisp. Returns the dot size in CSS px. */
export function fitCanvas(c: HTMLCanvasElement, dot: number, rows: number): { w: number; h: number } {
  const cssW = c.parentElement!.clientWidth;
  const w = Math.ceil(cssW / dot);
  c.width = w;
  c.height = rows;
  c.style.width = `${w * dot}px`;
  c.style.height = `${rows * dot}px`;
  return { w, h: rows };
}

/**
 * Generative character field — the signature "toy".
 * A monospace grid of digits/glyphs that ripples and "re-prices" around the
 * cursor, like a trading terminal reacting to a touch. Canvas 2D, DPR-capped,
 * paused when off-screen, static under reduced motion.
 */

const GLYPHS = '0123456789$%.,+-▲▼↑↓/\\|='.split('');

interface Cell {
  ch: string;
  baseAlpha: number;
  lit: number; // 0..1 highlight amount
  nextFlip: number;
}

export function initHeroField(canvas: HTMLCanvasElement) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return () => {};

  const style = getComputedStyle(document.documentElement);
  let fg = style.getPropertyValue('--fg').trim() || '#efece6';
  let accent = style.getPropertyValue('--accent').trim() || '#c6ff3d';

  const CELL = 22; // px in CSS units
  const FONT_PX = 15;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let cols = 0, rows = 0;
  let cells: Cell[] = [];
  let w = 0, h = 0;

  const pointer = { x: -9999, y: -9999, active: false };
  let ripples: Array<{ x: number; y: number; t: number }> = [];

  function rand(min: number, max: number) {
    return min + Math.random() * (max - min);
  }

  function build() {
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `${FONT_PX}px 'JetBrains Mono Variable', 'JetBrains Mono', monospace`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    cols = Math.ceil(w / CELL);
    rows = Math.ceil(h / CELL);
    cells = new Array(cols * rows);
    for (let i = 0; i < cells.length; i++) {
      cells[i] = {
        ch: GLYPHS[(Math.random() * GLYPHS.length) | 0],
        baseAlpha: rand(0.05, 0.16),
        lit: 0,
        nextFlip: rand(0, 4),
      };
    }
    // refresh theme colors
    fg = style.getPropertyValue('--fg').trim() || fg;
    accent = style.getPropertyValue('--accent').trim() || accent;
  }

  function hexToRgb(hex: string): [number, number, number] {
    const h2 = hex.replace('#', '');
    const n = parseInt(h2.length === 3 ? h2.replace(/(.)/g, '$1$1') : h2, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  let fgRgb = hexToRgb(fg);
  let accRgb = hexToRgb(accent);

  function draw(dt: number, time: number) {
    ctx.clearRect(0, 0, w, h);
    const R = 150; // influence radius (px)
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const idx = gy * cols + gx;
        const cell = cells[idx];
        const cx = gx * CELL + CELL / 2;
        const cy = gy * CELL + CELL / 2;

        // pointer influence
        let target = 0;
        if (pointer.active) {
          const d = Math.hypot(cx - pointer.x, cy - pointer.y);
          if (d < R) target = Math.max(target, 1 - d / R);
        }
        // ripple influence
        for (const rp of ripples) {
          const age = time - rp.t;
          const radius = age * 420; // px/s
          const d = Math.hypot(cx - rp.x, cy - rp.y);
          const band = Math.abs(d - radius);
          if (band < 46) target = Math.max(target, (1 - band / 46) * Math.max(0, 1 - age / 1.2));
        }

        // ease lit toward target
        cell.lit += (target - cell.lit) * Math.min(1, dt * 8);

        // re-price: flip glyph when highly lit, or occasionally at rest
        cell.nextFlip -= dt;
        if (cell.nextFlip <= 0) {
          if (cell.lit > 0.25 || Math.random() < 0.12) {
            cell.ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }
          cell.nextFlip = cell.lit > 0.25 ? rand(0.05, 0.18) : rand(1.5, 5);
        }

        const alpha = cell.baseAlpha + cell.lit * 0.85;
        if (cell.lit > 0.08) {
          const t = cell.lit;
          const r = Math.round(fgRgb[0] + (accRgb[0] - fgRgb[0]) * t);
          const g = Math.round(fgRgb[1] + (accRgb[1] - fgRgb[1]) * t);
          const b = Math.round(fgRgb[2] + (accRgb[2] - fgRgb[2]) * t);
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        } else {
          ctx.fillStyle = `rgba(${fgRgb[0]},${fgRgb[1]},${fgRgb[2]},${alpha})`;
        }
        ctx.fillText(cell.ch, cx, cy);
      }
    }
    ripples = ripples.filter((rp) => time - rp.t < 1.3);
  }

  function drawStatic() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const gx = i % cols;
      const gy = (i / cols) | 0;
      ctx.fillStyle = `rgba(${fgRgb[0]},${fgRgb[1]},${fgRgb[2]},${cell.baseAlpha})`;
      ctx.fillText(cell.ch, gx * CELL + CELL / 2, gy * CELL + CELL / 2);
    }
  }

  let raf = 0;
  let prev = performance.now() / 1000;
  let running = false;

  function loop(now: number) {
    const time = now / 1000;
    const dt = Math.min(0.05, time - prev);
    prev = time;
    draw(dt, time);
    raf = requestAnimationFrame(loop);
  }
  function start() {
    if (running || reduce) return;
    running = true;
    prev = performance.now() / 1000;
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  // Pointer tracking (relative to canvas)
  const onMove = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.active = true;
  };
  const onLeave = () => { pointer.active = false; pointer.x = -9999; pointer.y = -9999; };
  const onDown = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    ripples.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, t: performance.now() / 1000 });
  };

  const host = canvas.parentElement || canvas;
  host.addEventListener('pointermove', onMove);
  host.addEventListener('pointerleave', onLeave);
  host.addEventListener('pointerdown', onDown);

  const onResize = () => { build(); fgRgb = hexToRgb(style.getPropertyValue('--fg').trim() || fg); accRgb = hexToRgb(style.getPropertyValue('--accent').trim() || accent); if (reduce) drawStatic(); };
  window.addEventListener('resize', onResize);

  // Re-read theme colors when it changes
  const themeObserver = new MutationObserver(() => {
    fgRgb = hexToRgb(style.getPropertyValue('--fg').trim() || fg);
    accRgb = hexToRgb(style.getPropertyValue('--accent').trim() || accent);
    if (reduce) drawStatic();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Pause when off-screen
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (en.isIntersecting) start();
        else stop();
      }
    },
    { threshold: 0 }
  );
  io.observe(canvas);

  build();
  if (reduce) drawStatic();
  else start();

  return () => {
    stop();
    io.disconnect();
    themeObserver.disconnect();
    host.removeEventListener('pointermove', onMove);
    host.removeEventListener('pointerleave', onLeave);
    host.removeEventListener('pointerdown', onDown);
    window.removeEventListener('resize', onResize);
  };
}

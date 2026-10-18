import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

let lenis: Lenis | null = null;
const cleanups: Array<() => void> = [];

function teardown() {
  while (cleanups.length) cleanups.pop()!();
  ScrollTrigger.getAll().forEach((t) => t.kill());
}

/* ---------- Live Sydney clock ---------- */
function initClock() {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Australia/Sydney',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const els = document.querySelectorAll<HTMLElement>('[data-clock]');
  if (!els.length) return;
  // The top-bar clock keeps a .bar-tz label as its last child; set only the
  // leading text node there. The footer clock is plain text.
  const tick = () => {
    const t = fmt.format(new Date());
    els.forEach((el) => {
      const tz = el.querySelector('.bar-tz');
      if (tz) {
        if (el.firstChild) el.firstChild.textContent = t + ' ';
      } else {
        el.textContent = t;
      }
    });
  };
  tick();
  const id = window.setInterval(tick, 1000);
  cleanups.push(() => clearInterval(id));
}

/* ---------- Theme toggle ---------- */
function initTheme() {
  const btn = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  const label = document.querySelector<HTMLElement>('[data-theme-label]');
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  const sync = () => {
    const paper = document.documentElement.getAttribute('data-theme') === 'paper';
    if (label) label.textContent = paper ? 'PAPER' : 'INK';
    if (btn) btn.setAttribute('aria-pressed', String(paper));
    if (meta) meta.setAttribute('content', paper ? '#f2efe8' : '#0c0c0b');
  };
  sync();
  if (!btn) return;
  const onClick = () => {
    const paper = document.documentElement.getAttribute('data-theme') === 'paper';
    if (paper) {
      document.documentElement.removeAttribute('data-theme');
      try { localStorage.setItem('ledger-theme', 'ink'); } catch (e) {}
    } else {
      document.documentElement.setAttribute('data-theme', 'paper');
      try { localStorage.setItem('ledger-theme', 'paper'); } catch (e) {}
    }
    sync();
  };
  btn.addEventListener('click', onClick);
  cleanups.push(() => btn.removeEventListener('click', onClick));
}

/* ---------- Custom cursor ---------- */
function initCursor() {
  if (isTouch || prefersReduced) return;
  const dot = document.querySelector<HTMLElement>('[data-cursor-dot]');
  const ring = document.querySelector<HTMLElement>('[data-cursor-ring]');
  if (!dot || !ring) return;

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;
  let raf = 0;

  const onMove = (e: MouseEvent) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
  };
  const loop = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    raf = requestAnimationFrame(loop);
  };
  window.addEventListener('mousemove', onMove);
  raf = requestAnimationFrame(loop);

  const hoverTargets = 'a, button, [data-magnetic], [data-row], input, textarea';
  const onOver = (e: Event) => {
    if ((e.target as HTMLElement).closest(hoverTargets)) ring.classList.add('is-hover');
  };
  const onOut = (e: Event) => {
    if ((e.target as HTMLElement).closest(hoverTargets)) ring.classList.remove('is-hover');
  };
  document.addEventListener('mouseover', onOver);
  document.addEventListener('mouseout', onOut);

  cleanups.push(() => {
    cancelAnimationFrame(raf);
    window.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseover', onOver);
    document.removeEventListener('mouseout', onOut);
  });
}

/* ---------- Magnetic elements ---------- */
function initMagnetic() {
  if (isTouch || prefersReduced) return;
  const els = document.querySelectorAll<HTMLElement>('[data-magnetic]');
  els.forEach((el) => {
    const strength = 0.3;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      gsap.to(el, { x, y, duration: 0.5, ease: 'power3.out' });
    };
    const onLeave = () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' });
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    cleanups.push(() => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    });
  });
}

/* ---------- Scroll reveals + SplitText ---------- */
function initReveals() {
  if (prefersReduced) {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
    return;
  }

  // Simple reveals
  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => el.classList.add('is-in'),
    });
  });

  // SplitText line-mask headings
  gsap.utils.toArray<HTMLElement>('[data-split]').forEach((el) => {
    const split = new SplitText(el, { type: 'lines', linesClass: 'split-line' });
    split.lines.forEach((l) => {
      const wrap = document.createElement('span');
      wrap.className = 'line-mask';
      l.parentNode!.insertBefore(wrap, l);
      wrap.appendChild(l);
    });
    gsap.set(split.lines, { yPercent: 115 });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () =>
        gsap.to(split.lines, {
          yPercent: 0,
          duration: 1,
          stagger: 0.08,
          ease: 'power4.out',
        }),
    });
    cleanups.push(() => split.revert());
  });

  // Staggered ledger rows
  gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((group) => {
    const items = group.querySelectorAll(':scope > *');
    gsap.set(items, { opacity: 0, y: 20 });
    ScrollTrigger.create({
      trigger: group,
      start: 'top 82%',
      once: true,
      onEnter: () =>
        gsap.to(items, { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out' }),
    });
  });
}

/* ---------- Animated counters ---------- */
function initCounters() {
  gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count || '0');
    if (prefersReduced) {
      el.textContent = target.toLocaleString();
      return;
    }
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () =>
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = Math.round(obj.v).toLocaleString();
          },
        }),
    });
  });
}

/* ---------- Bar auto-hide ---------- */
function initBar() {
  const bar = document.querySelector<HTMLElement>('[data-bar]');
  if (!bar) return;
  let last = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    if (y > last && y > 160) bar.setAttribute('data-hidden', 'true');
    else bar.removeAttribute('data-hidden');
    last = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  cleanups.push(() => window.removeEventListener('scroll', onScroll));
}

/* ---------- Click to copy email ---------- */
function initCopy() {
  const toast = document.querySelector<HTMLElement>('[data-toast]');
  const els = document.querySelectorAll<HTMLElement>('[data-copy]');
  els.forEach((el) => {
    const onClick = async (e: Event) => {
      const value = el.dataset.copy || '';
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = value;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (err) {}
        ta.remove();
      }
      if (toast) {
        toast.setAttribute('data-show', 'true');
        window.setTimeout(() => toast.removeAttribute('data-show'), 1800);
      }
    };
    el.addEventListener('click', onClick);
    cleanups.push(() => el.removeEventListener('click', onClick));
  });
}

/* ---------- Lenis smooth scroll ---------- */
function initLenis() {
  if (lenis) { lenis.destroy(); lenis = null; }
  if (isTouch || prefersReduced) return;
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  const onTick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(onTick);
  gsap.ticker.lagSmoothing(0);
  cleanups.push(() => {
    gsap.ticker.remove(onTick);
    lenis?.destroy();
    lenis = null;
  });

  // Anchor links -> smooth scroll via Lenis
  document.querySelectorAll<HTMLAnchorElement>('a[href^="/#"], a[href^="#"]').forEach((a) => {
    const onClick = (e: MouseEvent) => {
      const href = a.getAttribute('href') || '';
      const id = href.split('#')[1];
      const target = id ? document.getElementById(id) : null;
      if (target && (href.startsWith('#') || window.location.pathname === '/')) {
        e.preventDefault();
        lenis?.scrollTo(target, { offset: -70 });
      }
    };
    a.addEventListener('click', onClick);
    cleanups.push(() => a.removeEventListener('click', onClick));
  });
}

/* ---------- Preloader (first visit per session) ---------- */
function initPreloader() {
  const pre = document.querySelector<HTMLElement>('[data-preloader]');
  if (!pre) return;
  let seen = false;
  try { seen = sessionStorage.getItem('ledger-visited') === '1'; } catch (e) {}

  const finish = () => {
    pre.setAttribute('data-done', 'true');
    try { sessionStorage.setItem('ledger-visited', '1'); } catch (e) {}
  };

  if (seen || prefersReduced) {
    finish();
    return;
  }

  const num = pre.querySelector<HTMLElement>('[data-preloader-num]');
  const fill = pre.querySelector<HTMLElement>('[data-preloader-fill]');
  const obj = { v: 0 };
  gsap.to(obj, {
    v: 100,
    duration: 1.0,
    ease: 'power2.inOut',
    onUpdate: () => {
      const val = Math.round(obj.v);
      if (num) num.textContent = String(val).padStart(3, '0');
      if (fill) fill.style.width = val + '%';
    },
    onComplete: () => window.setTimeout(finish, 120),
  });
}

/* ---------- Boot ---------- */
function boot() {
  teardown();
  initPreloader();
  initClock();
  initTheme();
  initCursor();
  initMagnetic();
  initBar();
  initCopy();
  initLenis();
  initReveals();
  initCounters();
  ScrollTrigger.refresh();
}

document.addEventListener('astro:page-load', boot);

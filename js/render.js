/**
 * render.js — loads data/profile.json and renders all dynamic sections,
 * then initialises scroll reveals, navbar state, and smooth scrolling.
 *
 * Content lives in data/profile.json — edit that file, not this one.
 * See data/README.md for the update / LinkedIn-sync workflow.
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------- helpers

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function slot(name) {
    return document.querySelector('[data-slot="' + name + '"]');
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function dateRange(start, end) {
    if (start && end) return start + ' — ' + end;
    return start || end || '';
  }

  // ---------------------------------------------------------------- renders

  function renderHeadline(data) {
    var target = slot('headline');
    if (!target) return;
    target.textContent = data.subheadline || data.headline || '';
  }

  function renderCurrently(data) {
    var target = slot('currently');
    if (!target) return;
    var parts = [data.headline, data.location].filter(Boolean);
    target.textContent = parts.join(' · ');
  }

  function renderAbout(data) {
    var target = slot('about');
    if (!target || !Array.isArray(data.about)) return;
    data.about.forEach(function (para) {
      target.appendChild(el('p', 'about-para', para));
    });
  }

  function renderProjects(data) {
    var target = slot('projects');
    if (!target || !Array.isArray(data.projects)) return;

    data.projects.forEach(function (project, i) {
      var card = document.createElement('a');
      card.className = 'project-row reveal';
      card.href = project.link || '#';
      card.target = '_blank';
      card.rel = 'noopener';

      var body = el('div', 'project-body');
      body.appendChild(el('span', 'mono-label project-index', pad(i + 1) + ' /'));
      body.appendChild(el('h3', 'project-title', project.title));
      body.appendChild(el('p', 'project-desc', project.description));

      if (Array.isArray(project.tech) && project.tech.length) {
        var tags = el('div', 'tag-row');
        project.tech.forEach(function (t) {
          tags.appendChild(el('span', 'tag', t));
        });
        body.appendChild(tags);
      }

      body.appendChild(el('span', 'project-cta', 'View project →'));
      card.appendChild(body);

      if (project.image) {
        var frame = el('div', 'project-media');
        var img = document.createElement('img');
        img.src = project.image;
        img.alt = project.title + ' screenshot';
        img.loading = 'lazy';
        frame.appendChild(img);
        card.appendChild(frame);
      }

      target.appendChild(card);
    });
  }

  function renderTimeline(target, entries, mapper) {
    entries.forEach(function (entry) {
      var item = el('div', 'timeline-item reveal');
      var mapped = mapper(entry);

      var range = dateRange(entry.start, entry.end);
      if (range) item.appendChild(el('span', 'mono-label timeline-date', range));

      item.appendChild(el('h3', 'timeline-role', mapped.title));
      if (mapped.subtitle) item.appendChild(el('p', 'timeline-company', mapped.subtitle));

      if (Array.isArray(entry.highlights) && entry.highlights.length) {
        var list = el('ul', 'timeline-highlights');
        entry.highlights.forEach(function (h) {
          list.appendChild(el('li', null, h));
        });
        item.appendChild(list);
      }

      target.appendChild(item);
    });
  }

  function renderExperience(data) {
    var target = slot('experience');
    if (!target || !Array.isArray(data.experience)) return;
    renderTimeline(target, data.experience, function (job) {
      return { title: job.role, subtitle: job.company };
    });
  }

  function renderEducation(data) {
    var target = slot('education');
    if (!target || !Array.isArray(data.education)) return;
    renderTimeline(target, data.education, function (edu) {
      return { title: edu.degree, subtitle: edu.institution };
    });
  }

  function renderEmail(data) {
    if (!data.email) return;
    document.querySelectorAll('[data-slot="email"]').forEach(function (target) {
      var link = document.createElement('a');
      link.className = 'email-link';
      link.href = 'mailto:' + data.email;
      link.textContent = data.email;
      target.appendChild(link);
    });
  }

  function renderSocials(data) {
    if (!Array.isArray(data.socials)) return;
    document.querySelectorAll('[data-slot="socials"]').forEach(function (target) {
      var asCards = target.hasAttribute('data-social-cards');
      data.socials.forEach(function (social) {
        var link = document.createElement('a');
        link.href = social.url;
        link.target = '_blank';
        link.rel = 'noopener';
        if (asCards) {
          link.className = 'social-card reveal';
          link.appendChild(el('span', 'mono-label', social.label));
          link.appendChild(el('span', 'social-card-arrow', '→'));
        } else {
          link.className = 'footer-link';
          link.textContent = social.label;
        }
        target.appendChild(link);
      });
    });
  }

  function renderFallback() {
    // JSON failed to load — keep the page presentable with the essentials.
    var target = slot('projects') || slot('experience');
    if (target) {
      var note = el('p', 'load-fallback',
        'Content is taking a moment to load. In the meantime, find me on ');
      var link = document.createElement('a');
      link.href = 'https://www.linkedin.com/in/finn-jones/';
      link.textContent = 'LinkedIn';
      link.target = '_blank';
      link.rel = 'noopener';
      note.appendChild(link);
      note.appendChild(document.createTextNode('.'));
      target.appendChild(note);
    }
  }

  // ------------------------------------------------------------- behaviours

  function initReveals() {
    var revealElements = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );
      revealElements.forEach(function (node) {
        observer.observe(node);
      });
    } else {
      revealElements.forEach(function (node) {
        node.classList.add('visible');
      });
    }
  }

  function initNavbar() {
    var navbar = document.getElementById('navbar');
    if (!navbar) return;
    var update = function () {
      navbar.classList.toggle('scrolled', window.pageYOffset > 50);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function initCursorFX() {
    // Only for real pointers, and never when the visitor prefers reduced motion.
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || reduce.matches) return;

    var root = document.documentElement;
    document.body.classList.add('cursor-fx');

    var glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    var vw = window.innerWidth;
    var vh = window.innerHeight;
    window.addEventListener('resize', function () {
      vw = window.innerWidth;
      vh = window.innerHeight;
    }, { passive: true });

    // Frame-rate-independent damping: how far to close the gap in `ms`.
    function damp(rate, dt) {
      return 1 - Math.pow(1 - rate, dt / 16.667);
    }

    // Two smoothed pointer positions: parallax responds a little quicker,
    // the light trails a little slower so it feels like it has weight.
    var tx = vw / 2, ty = vh / 2; // target (raw pointer)
    var pxv = tx, pyv = ty;       // parallax-smoothed
    var gx = tx, gy = ty;         // glow-smoothed (more lag)

    // Per-element reactive state (target + current, all eased in the loop).
    var magnets = [];
    document.querySelectorAll('.btn, .nav-link').forEach(function (el) {
      var m = {
        el: el,
        strength: el.classList.contains('btn') ? 0.22 : 0.16,
        tX: 0, tY: 0, cX: 0, cY: 0, active: false
      };
      el.addEventListener('pointerenter', function () { m.active = true; wake(); });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        m.tX = (e.clientX - (r.left + r.width / 2)) * m.strength;
        m.tY = (e.clientY - (r.top + r.height / 2)) * m.strength;
        wake();
      }, { passive: true });
      el.addEventListener('pointerleave', function () {
        m.active = false; m.tX = 0; m.tY = 0; wake();
      });
      magnets.push(m);
    });

    var cards = [];
    document.querySelectorAll('.project-row, .social-card, .currently-panel')
      .forEach(function (el) {
        var c = {
          el: el,
          tRX: 0, tRY: 0, cRX: 0, cRY: 0,   // tilt (deg)
          tL: 0, cL: 0,                       // lift (px)
          tPX: 50, tPY: 50, cPX: 50, cPY: 50, // sheen position (%)
          active: false
        };
        el.addEventListener('pointerenter', function () {
          c.active = true; c.tL = -6; wake();
        });
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          var xr = (e.clientX - r.left) / r.width;
          var yr = (e.clientY - r.top) / r.height;
          c.tRY = (xr - 0.5) * 10;   // rotateY: ±5°
          c.tRX = (0.5 - yr) * 8;    // rotateX: ±4°
          c.tPX = xr * 100;
          c.tPY = yr * 100;
          wake();
        }, { passive: true });
        el.addEventListener('pointerleave', function () {
          c.active = false; c.tRX = 0; c.tRY = 0; c.tL = 0; wake();
        });
        cards.push(c);
      });

    var running = false;
    var last = 0;

    function wake() {
      if (!running) {
        running = true;
        last = performance.now();
        requestAnimationFrame(loop);
      }
    }

    function near(a, b, eps) { return Math.abs(a - b) < eps; }

    function loop(now) {
      var dt = Math.min(now - last, 50);
      last = now;
      var kFast = damp(0.16, dt); // parallax
      var kSlow = damp(0.09, dt); // trailing light
      var settled = true;

      pxv += (tx - pxv) * kFast; pyv += (ty - pyv) * kFast;
      gx += (tx - gx) * kSlow;   gy += (ty - gy) * kSlow;
      root.style.setProperty('--mx', (pxv / vw).toFixed(4));
      root.style.setProperty('--my', (pyv / vh).toFixed(4));
      root.style.setProperty('--cursor-x', gx.toFixed(1) + 'px');
      root.style.setProperty('--cursor-y', gy.toFixed(1) + 'px');
      if (!near(pxv, tx, 0.3) || !near(pyv, ty, 0.3) ||
          !near(gx, tx, 0.3) || !near(gy, ty, 0.3)) settled = false;

      magnets.forEach(function (m) {
        m.cX += (m.tX - m.cX) * kFast;
        m.cY += (m.tY - m.cY) * kFast;
        if (m.active || !near(m.cX, 0, 0.05) || !near(m.cY, 0, 0.05)) {
          settled = false;
          m.el.style.transform =
            'translate3d(' + m.cX.toFixed(2) + 'px,' + m.cY.toFixed(2) + 'px,0)';
        } else if (m.el.style.transform) {
          m.el.style.transform = '';
        }
      });

      cards.forEach(function (c) {
        c.cRX += (c.tRX - c.cRX) * kFast;
        c.cRY += (c.tRY - c.cRY) * kFast;
        c.cL += (c.tL - c.cL) * kFast;
        c.cPX += (c.tPX - c.cPX) * kFast;
        c.cPY += (c.tPY - c.cPY) * kFast;
        c.el.style.setProperty('--px', c.cPX.toFixed(1) + '%');
        c.el.style.setProperty('--py', c.cPY.toFixed(1) + '%');
        var atRest = near(c.cRX, 0, 0.02) && near(c.cRY, 0, 0.02) &&
          near(c.cL, 0, 0.1);
        if (c.active || !atRest) {
          settled = false;
          c.el.style.transform =
            'perspective(1200px) rotateX(' + c.cRX.toFixed(3) +
            'deg) rotateY(' + c.cRY.toFixed(3) +
            'deg) translateY(' + c.cL.toFixed(2) + 'px)';
        } else if (c.el.style.transform) {
          c.el.style.transform = '';
        }
      });

      if (settled) { running = false; return; }
      requestAnimationFrame(loop);
    }

    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY; wake();
    }, { passive: true });
  }

  // ------------------------------------------------------------------ boot

  function boot() {
    fetch('data/profile.json?v=7')
      .then(function (res) {
        if (!res.ok) throw new Error('profile.json HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        renderHeadline(data);
        renderCurrently(data);
        renderAbout(data);
        renderProjects(data);
        renderExperience(data);
        renderEducation(data);
        renderEmail(data);
        renderSocials(data);
      })
      .catch(function (err) {
        console.error('Failed to load data/profile.json:', err);
        renderFallback();
      })
      .then(function () {
        document.body.classList.add('profile-loaded');
        initReveals();
        initCursorFX();
      });

    initNavbar();
    initSmoothScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

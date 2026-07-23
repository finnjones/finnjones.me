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

  // ------------------------------------------------------------------ boot

  function boot() {
    fetch('data/profile.json')
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

/* ═══════════════════════════════════════════
   NAVIGATE — GSAP, ScrollTrigger & Lenis
   ═══════════════════════════════════════════ */

// ─── Lenis Smooth Scroll ───
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});

gsap.registerPlugin(ScrollTrigger);

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);

// ─── Nav pill blur on scroll ───
const navPill = document.querySelector('.nav__pill');
window.addEventListener('scroll', () => {
  navPill.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// ─── Mobile menu ───
const navToggle = document.getElementById('nav-toggle');
const mobileMenu = document.getElementById('mobile-menu');

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('active');
  mobileMenu.classList.toggle('open');
});

mobileMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('active');
    mobileMenu.classList.remove('open');
  });
});

// ─── Smooth anchor scrolling ───
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    const id = this.getAttribute('href');
    if (id === '#') return;
    const el = document.querySelector(id);
    if (el) {
      e.preventDefault();
      lenis.scrollTo(el, { offset: -80, duration: 1.5 });
      navToggle.classList.remove('active');
      mobileMenu.classList.remove('open');
    }
  });
});

// ═══════════════════════════════════════════
//  HERO ANIMATIONS
// ═══════════════════════════════════════════

gsap.timeline({ delay: 0.3 })
  .from('.hero__line span', { y: '110%', opacity: 0, duration: 1.2, stagger: 0.2, ease: 'power4.out' })
  .from('.hero__sub',       { y: 30, opacity: 0, duration: 1,   ease: 'power3.out' }, '-=0.7')
  .from('.hero__cta',       { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
  .from('.nav',             { y: -30, opacity: 0, duration: 1,  ease: 'power3.out' }, '-=1')
  .from('.hero__scroll',    { opacity: 0, duration: 1,           ease: 'power2.out' }, '-=0.5')
  .from('.icon-card',       { scale: 0, opacity: 0, duration: 1.2, stagger: 0.1, ease: 'elastic.out(1, 0.5)' }, '-=0.8');

// ─── Hero Icon Idle Loop ───
// Continuously shuffles icon positions while hero is visible.
// Stops cleanly before the scroll-morph trigger fires.
(function () {
  const cards = Array.from(document.querySelectorAll('.icon-card'));
  let nat = null;
  let activeTl = null;

  function readNat() {
    if (nat) return nat;
    const pl = document.getElementById('icon-cards').getBoundingClientRect().left;
    nat = cards.map((c) => c.getBoundingClientRect().left - pl);
    return nat;
  }

  function derangement() {
    const a = [0, 1, 2, 3, 4];
    do {
      for (let i = 4; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
    } while (a.every((v, i) => v === i));
    return a;
  }

  function cycle() {
    const offsets = readNat();
    const order = derangement();

    activeTl = gsap.timeline({ onComplete: cycle });

    // Fade out — staggered
    cards.forEach((card, i) => {
      activeTl.to(card, { opacity: 0, duration: 0.3, ease: 'power2.in' }, i * 0.08);
    });

    // Teleport to shuffled positions
    const swapAt = cards.length * 0.08 + 0.3;
    cards.forEach((card, i) => {
      activeTl.set(card, { x: offsets[order[i]] - offsets[i] }, swapAt);
    });

    // Fade in — staggered
    cards.forEach((card, i) => {
      activeTl.to(card, { opacity: 1, duration: 0.4, ease: 'power2.out' }, swapAt + i * 0.08);
    });

    // Hold before next cycle
    activeTl.to({}, { duration: 1.2 });
  }

  function stop() {
    if (activeTl) { activeTl.kill(); activeTl = null; }
    gsap.killTweensOf(cards);
    gsap.set(cards, { clearProps: 'x,opacity' });
  }

  // Kill before the morph scroll trigger fires (morph starts at 'top 55%')
  ScrollTrigger.create({
    trigger: '#icon-cards',
    start: 'top 60%',
    onEnter: stop,
  });

  // Start after entrance animation settles
  gsap.delayedCall(2.8, cycle);
})();

// ═══════════════════════════════════════════
//  ICON MORPH — Fixed overlay approach
//
//  The hero and icon-card both have overflow:hidden, so SVGs cannot
//  escape their parents. We clone each SVG into a position:fixed overlay
//  that is appended directly to <body>, bypassing all clip paths entirely.
// ═══════════════════════════════════════════

const ICON_COLORS = {
  music:  '#7A78FF',
  film:   '#3CB043',
  ghost:  '#FF6D38',
  shop:   '#FFC412',
  tshirt: '#478BFF',
};

const DARK_BG  = '#0a0a0c';
const LIGHT_BG = '#ffffff';

// Hex to "r,g,b" string for rgba() usage
function hexToRgbStr(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

// Hex to rgb blend helper
function blendHex(from, to, t) {
  const f = parseInt(from.slice(1), 16);
  const fR = (f >> 16) & 255, fG = (f >> 8) & 255, fB = f & 255;
  const e = parseInt(to.slice(1), 16);
  const eR = (e >> 16) & 255, eG = (e >> 8) & 255, eB = e & 255;
  return `rgb(${Math.round(fR+(eR-fR)*t)},${Math.round(fG+(eG-fG)*t)},${Math.round(fB+(eB-fB)*t)})`;
}

// Fixed overlay — lives outside any overflow:hidden ancestor
const morphOverlay = document.createElement('div');
morphOverlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:500;';
document.body.appendChild(morphOverlay);

// Build one clone wrapper per icon card
const iconCards = Array.from(document.querySelectorAll('.icon-card'));
const morphItems = iconCards.map((card) => {
  const name   = card.dataset.icon;
  const color  = ICON_COLORS[name] || '#fff';
  const origSvg = card.querySelector('.icon-card__svg');
  const target  = document.querySelector(`.icon-target[data-target="${name}"]`);

  const wrapper = document.createElement('div');
  wrapper.style.cssText = [
    'position:absolute;top:0;left:0;',
    'display:flex;align-items:center;justify-content:center;',
    `background:${color};border-radius:16px;opacity:0;`,
    'will-change:transform,opacity;overflow:hidden;',
  ].join('');

  const svgClone = origSvg.cloneNode(true);
  svgClone.style.cssText = 'width:55%;height:55%;flex-shrink:0;';
  wrapper.appendChild(svgClone);
  morphOverlay.appendChild(wrapper);

  return { card, name, color, wrapper, target };
});

// Start inline text + heading hidden — phase 4 of the morph owns their opacity
gsap.set('.problem__inline-text', { opacity: 0, y: 12 });
gsap.set('.problem__slide--1 .problem__heading', { opacity: 0, y: 20 });

// ─── Main morph ScrollTrigger ───
// Starts when icon-cards row hits 55% viewport, ends when inline text is centred.
let phase2Targets = null; // per-card Y displacement to reach viewport centre, captured at onEnter

ScrollTrigger.create({
  trigger: '#icon-cards',
  start: 'top 55%',
  endTrigger: '.problem__inline-text',
  end: 'center center',
  scrub: 1.5,
  onEnter() {
    // Capture natural card positions before any transforms are applied
    phase2Targets = iconCards.map((card) => {
      const r = card.getBoundingClientRect();
      return window.innerHeight / 2 - (r.top + r.height / 2);
    });
  },
  onUpdate(self) {
    const p = self.progress;

    // ── Hide original cards once clones take over (p 0.03)
    if (p >= 0.03) gsap.set(iconCards, { opacity: 0 });

    // ── Phase 2 (p 0→0.3): icons gather to viewport centre, scale to 50%
    // ── Phase 3 (p 0.3→0.6): icons diverge — music up, film centre, rest down; scale to 30%
    const p2 = Math.min(1, p / 0.3);
    const p3 = p < 0.3 ? 0 : Math.min(1, (p - 0.3) / 0.3);
    // Per-icon additional Y displacement from centre during phase 3 (px)
    // order: music, film, ghost, shop, tshirt
    const PHASE3_DY = [-150, 10, 110, 130, 110];
    if (phase2Targets) {
      iconCards.forEach((card, i) => {
        gsap.set(card, {
          y: phase2Targets[i] * p2 + PHASE3_DY[i] * p3,
          scale: 1 - p2 * 0.5 - p3 * 0.2,
          transformOrigin: 'center center',
        });
      });
    }

    // ── Body background: dark → white only during phase 3 (p 0.3 → 0.6)
    const bgP = p < 0.3 ? 0 : Math.min(1, (p - 0.3) / 0.3);
    document.body.style.backgroundColor = blendHex(DARK_BG, LIGHT_BG, bgP);
    document.body.classList.toggle('bg-light', bgP > 0.4);

    // ── Phase 4 (p 0.6→1.0): heading then inline text fade in
    const headingAlpha = p < 0.60 ? 0 : Math.min(1, (p - 0.60) / 0.20);
    gsap.set('.problem__slide--1 .problem__heading', { opacity: headingAlpha, y: 20 * (1 - headingAlpha) });

    const textAlpha = p < 0.65 ? 0 : Math.min(1, (p - 0.65) / 0.20);
    gsap.set('.problem__inline-text', { opacity: textAlpha, y: 12 * (1 - textAlpha) });

    // ── Reveal target SVGs once clone background is fully dissolved (p > 0.80)
    morphItems.forEach(({ target }) => {
      if (!target) return;
      target.querySelector('svg')?.classList.toggle('visible', p > 0.80);
    });

    // ── Fly each clone; dock into inline spans during phase 4
    morphItems.forEach(({ card, color, wrapper, target }) => {
      if (!target) return;

      const cR = card.getBoundingClientRect();
      const tR = target.getBoundingClientRect();

      // Full-range ease-in-out — unchanged, preserves phases 2+3 fly trajectory
      const ep = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

      const w  = cR.width  + (tR.width  - cR.width)  * ep;
      const h  = cR.height + (tR.height - cR.height) * ep;
      const cx = (cR.left + cR.width  * 0.5) + ((tR.left + tR.width  * 0.5) - (cR.left + cR.width  * 0.5)) * ep;
      const cy = (cR.top  + cR.height * 0.5) + ((tR.top  + tR.height * 0.5) - (cR.top  + cR.height * 0.5)) * ep;

      const radius = Math.max(0, 16 * (1 - p));
      const opIn   = Math.min(1, p / 0.06);
      // Phase 4: dissolve colored background as clone docks (p 0.60→1.0)
      const bgFade = p < 0.6 ? 1 : Math.max(0, 1 - (p - 0.6) / 0.4);
      // Fade entire clone only in the final stretch of phase 4 (p 0.80→1.0)
      const opOut  = p > 0.80 ? Math.max(0, 1 - (p - 0.80) / 0.20) : 1;

      wrapper.style.background   = `rgba(${hexToRgbStr(color)},${bgFade})`;
      wrapper.style.width        = `${w}px`;
      wrapper.style.height       = `${h}px`;
      wrapper.style.borderRadius = `${radius}px`;
      wrapper.style.opacity      = opIn * opOut;
      wrapper.style.transform    = `translate(${cx - w * 0.5}px,${cy - h * 0.5}px)`;
    });
  },
  onLeaveBack() {
    // Scrolled back above the trigger — reset everything
    morphItems.forEach(({ wrapper, target }) => {
      wrapper.style.opacity = '0';
      if (target) target.querySelector('svg')?.classList.remove('visible');
    });
    document.body.style.backgroundColor = DARK_BG;
    document.body.classList.remove('bg-light');
    gsap.set('.problem__inline-text', { opacity: 0, y: 12 });
    // Reset phase-2 card transforms and clear captured targets
    iconCards.forEach((card) => gsap.set(card, { clearProps: 'y,scale' }));
    gsap.set(iconCards, { opacity: 1 });
    phase2Targets = null;
    // Reset phase-4 text
    gsap.set('.problem__slide--1 .problem__heading', { opacity: 0, y: 20 });
  },
});

// ─── Background revert on Slide 2 (light cream → dark) ───
ScrollTrigger.create({
  trigger: '.problem__slide--2',
  start: 'top 75%',
  end: 'top 20%',
  scrub: 1,
  onUpdate(self) {
    const p = self.progress;
    document.body.style.backgroundColor = blendHex(LIGHT_BG, DARK_BG, p);
    document.body.classList.toggle('bg-light', p < 0.55);
  },
  onLeave() {
    document.body.style.backgroundColor = DARK_BG;
    document.body.classList.remove('bg-light');
  },
  onEnterBack() {
    document.body.classList.add('bg-light');
  },
});

// ═══════════════════════════════════════════
//  PROBLEM SECTION — Staggered Reveals
// ═══════════════════════════════════════════

gsap.from('.problem__slide--1 .problem__label', {
  scrollTrigger: { trigger: '.problem__slide--1', start: 'top 80%' },
  y: 20, opacity: 0, duration: 0.8, ease: 'power3.out',
});
// .problem__slide--1 .problem__heading is controlled by phase 4 of the morph ScrollTrigger

// ─── Slide 2 — word-by-word reveal ───
document.querySelectorAll('.reveal-words').forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="word">${w}</span>`).join(' ');
  const spans = el.querySelectorAll('.word');

  ScrollTrigger.create({
    trigger: el,
    start: 'top 80%',
    end: 'bottom 30%',
    scrub: 0.5,
    onUpdate(self) {
      const p = self.progress;
      spans.forEach((span, i) => {
        span.classList.toggle('active', i / spans.length <= p);
      });
    },
  });
});

// ─── Slide 3 ───
gsap.from('.problem__slide--3 .problem__heading', {
  scrollTrigger: { trigger: '.problem__slide--3', start: 'top 80%' },
  y: 50, opacity: 0, duration: 1, ease: 'power3.out',
});

gsap.from('.problem__slide--3 .problem__body', {
  scrollTrigger: { trigger: '.problem__slide--3', start: 'top 70%' },
  y: 30, opacity: 0, duration: 1, delay: 0.2, ease: 'power3.out',
});

// ═══════════════════════════════════════════
//  CHAPTERS — Staggered entry
// ═══════════════════════════════════════════

document.querySelectorAll('.chapter').forEach((chapter) => {
  gsap.timeline({ scrollTrigger: { trigger: chapter, start: 'top 75%' } })
    .from(chapter.querySelector('.chapter__number'), {
      y: 20, opacity: 0, duration: 0.6, ease: 'power3.out',
    })
    .from(chapter.querySelectorAll('.chapter__line span'), {
      y: '100%', opacity: 0, duration: 1, stagger: 0.15, ease: 'power4.out',
    }, '-=0.3')
    .from(chapter.querySelector('.chapter__desc'), {
      y: 20, opacity: 0, duration: 0.8, ease: 'power3.out',
    }, '-=0.5');
});

// ═══════════════════════════════════════════
//  GENERIC FADE-UP
// ═══════════════════════════════════════════

gsap.utils.toArray('.fade-up').forEach((el) => {
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: 'top 85%' },
    y: 50, opacity: 0, duration: 0.9, ease: 'power3.out',
  });
});

// ═══════════════════════════════════════════
//  CTA — Text reveal
// ═══════════════════════════════════════════

gsap.timeline({ scrollTrigger: { trigger: '.cta-section', start: 'top 70%' } })
  .from('.cta__line span', { y: '100%', opacity: 0, duration: 1.1, stagger: 0.2, ease: 'power4.out' })
  .from('.cta__body',      { y: 30, opacity: 0, duration: 0.9, ease: 'power3.out' }, '-=0.6')
  .from('.cta-section .btn', { y: 20, opacity: 0, duration: 0.7, ease: 'power3.out' }, '-=0.4');

// ═══════════════════════════════════════════
//  FAQ ACCORDION
// ═══════════════════════════════════════════

document.querySelectorAll('.faq__question').forEach((btn) => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq__item');
    const isActive = item.classList.contains('active');
    document.querySelectorAll('.faq__item').forEach((i) => i.classList.remove('active'));
    if (!isActive) item.classList.add('active');
  });
});

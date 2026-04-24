/* ═══════════════════════════════════════════════════════════════
   SMARTTRADEHQ — app.js
   Canvas frame playback · GSAP ScrollTrigger · Lenis smooth scroll
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── CONFIG ───────────────────────────────────────────────── */
  const TOTAL_FRAMES   = 151;
  const FRAME_SPEED    = 2.0;     // 1.8–2.2: higher = animation completes earlier
  const IMAGE_SCALE    = 0.85;    // padded-cover sweet spot
  const SCROLL_HEIGHT  = 900;     // 900vh
  const PRELOAD_FIRST  = 12;      // frames to load before hiding loader

  /* Scene scroll ranges [enter%, leave%] */
  const SCENES = {
    s2:  [20, 38],
    s3:  [40, 55],
    s4:  [57, 70],
    s5:  [72, 83],
    s6:  [76, 88],
    s7:  [90, 100],
    marquee: [55, 70],
    overlay: [18, 90],
  };

  const FRAME_PATH = (n) =>
    `public/assets/frame_${String(n).padStart(4, '0')}.jpg`;

  /* ─── STATE ────────────────────────────────────────────────── */
  const frames      = new Array(TOTAL_FRAMES).fill(null);
  let framesLoaded  = 0;
  let currentFrame  = 0;
  let lenis;

  /* ─── DOM REFS ─────────────────────────────────────────────── */
  const loader        = document.getElementById('loader');
  const loaderBar     = document.getElementById('loader-bar');
  const loaderPercent = document.getElementById('loader-percent');
  const canvasWrap    = document.getElementById('canvas-wrap');
  const canvas        = document.getElementById('canvas');
  const ctx           = canvas ? canvas.getContext('2d') : null;
  const scrollCont    = document.getElementById('scroll-container');
  const darkOverlay   = document.getElementById('dark-overlay');
  const progressFill  = document.getElementById('progress-fill');
  const progressDot   = document.getElementById('progress-dot');
  const marqueeEl     = document.getElementById('marquee');
  const header        = document.getElementById('site-header');
  const isMobile      = window.innerWidth < 768;

  /* ════════════════════════════════════════════════════════════
     1. LENIS SMOOTH SCROLL
  ════════════════════════════════════════════════════════════ */
  function initLenis() {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ════════════════════════════════════════════════════════════
     2. FRAME PRELOADER
  ════════════════════════════════════════════════════════════ */
  function loadFrame(index) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        frames[index] = img;
        framesLoaded++;
        const pct = Math.round((framesLoaded / TOTAL_FRAMES) * 100);
        loaderBar.style.width = pct + '%';
        loaderPercent.textContent = pct + '%';
        resolve();
      };
      img.onerror = () => { framesLoaded++; resolve(); };
      img.src = FRAME_PATH(index + 1); // 1-indexed files
    });
  }

  async function preloadFrames() {
    // Phase 1: first N frames for fast first paint
    const phase1 = [];
    for (let i = 0; i < Math.min(PRELOAD_FIRST, TOTAL_FRAMES); i++) {
      phase1.push(loadFrame(i));
    }
    await Promise.all(phase1);

    // Draw first frame immediately
    if (frames[0]) {
      resizeCanvas();
      drawFrame(0);
    }

    // Phase 2: remaining frames in background
    const phase2 = [];
    for (let i = PRELOAD_FIRST; i < TOTAL_FRAMES; i++) {
      phase2.push(loadFrame(i));
    }
    await Promise.all(phase2);

    // All loaded — hide loader
    hideLoader();
  }

  function hideLoader() {
    loader.classList.add('hidden');
    document.body.style.overflow = '';
    initScrollAnimations();
  }

  /* ════════════════════════════════════════════════════════════
     3. CANVAS RENDERER — padded-cover mode
  ════════════════════════════════════════════════════════════ */
  let bgColor = '#0A0A0F';
  let lastBgSample = -1;

  function sampleBgColor(img) {
    if (!img) return;
    try {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 4;
      tempCanvas.height = 4;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(img, 0, 0, 4, 4);
      const data = tempCtx.getImageData(0, 0, 1, 1).data;
      bgColor = `rgb(${data[0]},${data[1]},${data[2]})`;
    } catch (e) { /* cross-origin or no data */ }
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
  }

  function drawFrame(index) {
    const img = frames[index];
    if (!img || !ctx) return;

    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    // Sample bg color every 20 frames
    if (Math.floor(index / 20) !== Math.floor(lastBgSample / 20)) {
      sampleBgColor(img);
      lastBgSample = index;
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    drawFrame(currentFrame);
  });

  /* ════════════════════════════════════════════════════════════
     4. HERO CIRCLE-WIPE + PARALLAX
  ════════════════════════════════════════════════════════════ */
  function initHeroTransition() {
    const heroEl = document.getElementById('hero');

    ScrollTrigger.create({
      trigger: scrollCont,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;

        // Hero fades out as scroll begins
        if (heroEl) {
          heroEl.style.opacity = Math.max(0, 1 - p * 12).toString();
        }

        // Canvas circle-wipe reveal: expands from 0% → 75% as scroll 0→8%
        const wipeProgress = Math.min(1, Math.max(0, (p - 0.005) / 0.08));
        const radius = wipeProgress * 75;
        canvasWrap.style.clipPath = `circle(${radius}% at 50% 50%)`;
      },
    });
  }

  /* ════════════════════════════════════════════════════════════
     5. FRAME-TO-SCROLL BINDING
  ════════════════════════════════════════════════════════════ */
  function initFrameBinding() {
    if (isMobile) return; // no canvas on mobile

    ScrollTrigger.create({
      trigger: scrollCont,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const accelerated = Math.min(self.progress * FRAME_SPEED, 1);
        const index = Math.min(
          Math.floor(accelerated * TOTAL_FRAMES),
          TOTAL_FRAMES - 1
        );
        if (index !== currentFrame) {
          currentFrame = index;
          requestAnimationFrame(() => drawFrame(currentFrame));
        }
      },
    });
  }

  /* ════════════════════════════════════════════════════════════
     6. SCROLL PROGRESS BAR
  ════════════════════════════════════════════════════════════ */
  function initProgressBar() {
    ScrollTrigger.create({
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const pct = (self.progress * 100).toFixed(2);
        progressFill.style.height = pct + '%';
        progressDot.style.top     = pct + '%';
      },
    });
  }

  /* ════════════════════════════════════════════════════════════
     7. DARK OVERLAY
  ════════════════════════════════════════════════════════════ */
  function initDarkOverlay() {
    if (isMobile) return;
    const [enter, leave] = SCENES.overlay.map((v) => v / 100);
    const fade = 0.04;

    ScrollTrigger.create({
      trigger: scrollCont,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        let opacity = 0;
        if (p >= enter - fade && p <= enter) {
          opacity = (p - (enter - fade)) / fade;
        } else if (p > enter && p < leave) {
          opacity = 0.9;
        } else if (p >= leave && p <= leave + fade) {
          opacity = 0.9 * (1 - (p - leave) / fade);
        }
        darkOverlay.style.opacity = opacity.toString();
      },
    });
  }

  /* ════════════════════════════════════════════════════════════
     8. SECTION ANIMATION SYSTEM
  ════════════════════════════════════════════════════════════ */
  function positionSection(section) {
    const enter = parseFloat(section.dataset.enter);
    const leave = parseFloat(section.dataset.leave);
    const midPct = (enter + leave) / 2;
    // 900vh total → 1% = 9vh
    section.style.top = (midPct * 9) + 'vh';
    section.style.transform = 'translateY(-50%)';
  }

  function buildTimeline(section) {
    const type    = section.dataset.animation || 'fade-up';
    const persist = section.dataset.persist === 'true';

    // Collect children in stagger order
    const children = Array.from(section.querySelectorAll(
      '.section-label, .section-heading, .section-body, ' +
      '.problem-line, .dsp-row, .method-step, ' +
      '.tier-card, .testimonial-card, ' +
      '.bio-line, .faq-item, ' +
      '.manifesto-line, .brand-mark, .close-subtext, .close-cta'
    ));

    const tl = gsap.timeline({ paused: true });
    const ease = 'power3.out';

    switch (type) {
      case 'slide-left':
        tl.from(children, { x: -80, opacity: 0, stagger: 0.12, duration: 0.9, ease });
        break;
      case 'slide-right':
        tl.from(children, { x: 80, opacity: 0, stagger: 0.12, duration: 0.9, ease });
        break;
      case 'stagger-up':
        tl.from(children, { y: 60, opacity: 0, stagger: 0.13, duration: 0.85, ease });
        break;
      case 'scale-up':
        tl.from(children, { scale: 0.88, opacity: 0, stagger: 0.1, duration: 1.0,
          ease: 'power2.out',
          transformOrigin: 'center bottom',
        });
        break;
      case 'rotate-in':
        tl.from(children, {
          y: 40, rotationX: 15, opacity: 0,
          stagger: 0.12, duration: 0.9, ease,
          transformOrigin: 'center top',
          transformPerspective: 1000,
        });
        break;
      case 'fade-up':
        tl.from(children, { y: 40, opacity: 0, stagger: 0.1, duration: 0.8, ease });
        break;
      case 'clip-reveal':
        tl.from(children, {
          clipPath: 'inset(100% 0 0 0)',
          opacity: 0,
          stagger: 0.15,
          duration: 1.2,
          ease: 'power4.inOut',
        });
        break;
      default:
        tl.from(children, { y: 30, opacity: 0, stagger: 0.1, duration: 0.8, ease });
    }

    return { tl, persist };
  }

  function initSections() {
    const sections = document.querySelectorAll('.scroll-section');
    const totalVH  = SCROLL_HEIGHT; // 900

    sections.forEach((section) => {
      positionSection(section);

      const enter  = parseFloat(section.dataset.enter) / 100;
      const leave  = parseFloat(section.dataset.leave) / 100;
      const { tl, persist } = buildTimeline(section);
      let hasPlayed = false;

      ScrollTrigger.create({
        trigger: scrollCont,
        start: 'top top',
        end: 'bottom bottom',
        scrub: false,
        onUpdate: (self) => {
          const p = self.progress;

          if (p >= enter && p <= leave) {
            if (!hasPlayed) {
              hasPlayed = true;
              section.style.opacity = '1';
              section.classList.add('is-visible');
              tl.play();
            }
          } else {
            if (hasPlayed && !persist) {
              hasPlayed = false;
              section.style.opacity = '';
              section.classList.remove('is-visible');
              tl.reverse();
            }
          }
        },
      });
    });
  }

  /* ════════════════════════════════════════════════════════════
     9. MARQUEE
  ════════════════════════════════════════════════════════════ */
  function initMarquee() {
    if (!marqueeEl) return;
    const text = marqueeEl.querySelector('.marquee-text');
    const speed = parseFloat(marqueeEl.dataset.scrollSpeed) || -25;
    const [enter, leave] = SCENES.marquee.map((v) => v / 100);
    const fade = 0.03;

    gsap.to(text, {
      xPercent: speed,
      ease: 'none',
      scrollTrigger: {
        trigger: scrollCont,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
      },
    });

    ScrollTrigger.create({
      trigger: scrollCont,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        let opacity = 0;
        if (p >= enter - fade && p < enter) {
          opacity = (p - (enter - fade)) / fade;
        } else if (p >= enter && p <= leave) {
          opacity = 1;
        } else if (p > leave && p <= leave + fade) {
          opacity = 1 - (p - leave) / fade;
        }
        marqueeEl.style.opacity = opacity.toString();
      },
    });
  }

  /* ════════════════════════════════════════════════════════════
     10. 3D CARD HOVER TILT
  ════════════════════════════════════════════════════════════ */
  function initCardTilt() {
    const cards = document.querySelectorAll('.tier-card, .testimonial-card');
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width  - 0.5;
        const y = (e.clientY - rect.top)  / rect.height - 0.5;
        gsap.to(card, {
          rotateY: x * 12,
          rotateX: -y * 12,
          duration: 0.3,
          ease: 'power2.out',
          transformPerspective: 1000,
        });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.5, ease: 'power2.out' });
      });
    });
  }

  /* ════════════════════════════════════════════════════════════
     11. FAQ ACCORDION
  ════════════════════════════════════════════════════════════ */
  function initFAQ() {
    document.querySelectorAll('.faq-q').forEach((btn) => {
      const answer = btn.nextElementSibling;
      answer.style.height = '0px';
      answer.style.overflow = 'hidden';

      btn.addEventListener('click', () => {
        const isOpen = btn.classList.contains('open');

        // Close all
        document.querySelectorAll('.faq-q.open').forEach((openBtn) => {
          openBtn.classList.remove('open');
          const a = openBtn.nextElementSibling;
          gsap.to(a, { height: 0, duration: 0.35, ease: 'power2.inOut' });
        });

        // Open clicked if was closed
        if (!isOpen) {
          btn.classList.add('open');
          const naturalH = answer.scrollHeight;
          gsap.to(answer, { height: naturalH, duration: 0.4, ease: 'power2.out' });
        }
      });
    });
  }

  /* ════════════════════════════════════════════════════════════
     12. HEADER SCROLL BLUR
  ════════════════════════════════════════════════════════════ */
  function initHeader() {
    ScrollTrigger.create({
      start: 'top -10',
      onEnter:      () => header.classList.add('scrolled'),
      onLeaveBack:  () => header.classList.remove('scrolled'),
    });

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -80, duration: 1.6 });
      });
    });

    // Mobile nav toggle
    const toggle = document.querySelector('.nav-toggle');
    if (toggle) {
      // Create mobile nav
      const mobileNav = document.createElement('nav');
      mobileNav.className = 'mobile-nav';
      mobileNav.innerHTML = `
        <a href="#how-it-works">How It Works</a>
        <a href="#the-system">The System</a>
        <a href="#tiers">Tiers</a>
        <a href="#about">About</a>
        <a href="payment.html" class="btn btn--orange">Apply Now</a>
        <button class="mobile-nav-close" aria-label="Close">✕</button>
      `;
      document.body.appendChild(mobileNav);

      toggle.addEventListener('click', () => {
        mobileNav.classList.toggle('open');
        document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
      });
      mobileNav.querySelector('.mobile-nav-close').addEventListener('click', () => {
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
      mobileNav.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => {
          mobileNav.classList.remove('open');
          document.body.style.overflow = '';
        });
      });
    }
  }

  /* ════════════════════════════════════════════════════════════
     INIT SCROLL ANIMATIONS (called after all frames loaded)
  ════════════════════════════════════════════════════════════ */
  function initScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    if (!isMobile) {
      initFrameBinding();
      initHeroTransition();
      initDarkOverlay();
    }

    initProgressBar();
    initSections();
    initMarquee();
    initCardTilt();
    initFAQ();
    initHeader();

    // Hero CTA scroll
    const heroCta = document.querySelector('.hero-cta');
    if (heroCta && lenis) {
      heroCta.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById('how-it-works');
        if (target) lenis.scrollTo(target, { offset: -80, duration: 1.6 });
      });
    }

    // Refresh ScrollTrigger after layout
    setTimeout(() => ScrollTrigger.refresh(), 300);
  }

  /* ════════════════════════════════════════════════════════════
     BOOT
  ════════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    // Lock scroll during load
    document.body.style.overflow = 'hidden';

    // Init Lenis first
    initLenis();

    // Init GSAP plugin early
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ limitCallbacks: true });

    // Canvas setup (desktop only)
    if (!isMobile && canvas) {
      resizeCanvas();
    }

    // Start loading
    preloadFrames();
  });

})();

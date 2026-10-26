(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = Boolean(window.gsap && window.ScrollTrigger);

  /* ---------- Surface color + chapter nav (works without GSAP) ---------- */
  const sections = [...document.querySelectorAll('main > section')];
  const nowLabel = document.querySelector('.chapters .now');
  const navLinks = [...document.querySelectorAll('.chapters ul a')];
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  function setSurface(sec) {
    root.style.setProperty('--mat', sec.dataset.bg);
    root.style.setProperty('--ink', sec.dataset.ink);
    if (themeMeta) themeMeta.setAttribute('content', sec.dataset.bg);
    if (nowLabel) nowLabel.textContent = sec.dataset.label;
    navLinks.forEach((a) => a.classList.toggle('active', a.dataset.target === sec.id));
  }

  const surfaceObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setSurface(e.target); });
  }, { rootMargin: '-50% 0px -50% 0px' });
  sections.forEach((s) => surfaceObserver.observe(s));

  /* The chapter bar stays out of the way on the cover, then slides in */
  const nav = document.querySelector('.chapters');
  const toggleNav = () => nav.classList.toggle('is-hidden', window.scrollY < window.innerHeight * 0.5);
  window.addEventListener('scroll', toggleNav, { passive: true });
  toggleNav();

  /* ---------- Red string across the build timeline ---------- */
  const track = document.querySelector('.build-track');
  const stringSvg = document.querySelector('.string');
  function drawString() {
    if (!track || !stringSvg) return;
    const w = track.scrollWidth;
    const step = 260;
    let d = 'M0 50';
    for (let x = step, up = true; x < w + step; x += step, up = !up) {
      d += ` Q ${x - step / 2} ${up ? 6 : 94} ${x} 50`;
    }
    stringSvg.setAttribute('viewBox', `0 0 ${w} 100`);
    stringSvg.style.width = `${w}px`;
    stringSvg.removeAttribute('preserveAspectRatio');
    const path = stringSvg.querySelector('path');
    path.removeAttribute('vector-effect');
    path.setAttribute('d', d);
  }
  drawString();

  /* ---------- Smooth scrolling ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add((t) => lenis.raf(t * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.4 });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      history.replaceState(null, '', id);
    });
  });

  /* ---------- Without GSAP or with reduced motion: static page + progress bar ---------- */
  const bar = document.querySelector('.progress-bar');
  if (!hasGsap || reduce) {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  /* Hero: the sheet lands on the desk, then the letters stick on one by one */
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.hero-sheet', { y: 70, rotation: -5, opacity: 0, duration: 1 })
    .from('.hero-title span', {
      yPercent: 110, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'back.out(2.2)',
      rotation: (i) => [-18, 12, -10, 16][i % 4],
    }, '-=0.55')
    .from('.year-badge', { scale: 0, rotation: -60, duration: 0.6, ease: 'back.out(3)' }, '-=0.35')
    .from('.hero-lede, .proof li, .hero-sheet .btn', { y: 22, opacity: 0, duration: 0.6, stagger: 0.07 }, '-=0.3')
    .from('.cursor', { x: 80, y: 60, opacity: 0, duration: 0.7 }, '-=0.4')
    .from('.hero-photo', { y: -140, rotation: -25, opacity: 0, duration: 0.9, ease: 'back.out(1.4)' }, '-=0.6')
    .from('.hero-note', { scale: 1.4, rotation: 20, opacity: 0, duration: 0.5, ease: 'back.out(2)' }, '-=0.5');

  /* Hero: desk props drift at different speeds */
  gsap.utils.toArray('.hero [data-speed]').forEach((el) => {
    gsap.to(el, {
      y: () => parseFloat(el.dataset.speed) * 320, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  });
  gsap.to('.hero-sheet', { yPercent: -5, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* Generic reveals: papers slide up, sticky notes get slapped on, photos drop */
  const reveals = {
    up: { y: 70, rotation: -2, opacity: 0, duration: 1, ease: 'power3.out' },
    slap: { scale: 1.25, rotation: 12, opacity: 0, duration: 0.6, ease: 'back.out(2.4)' },
    drop: { y: -80, rotation: -15, opacity: 0, duration: 0.9, ease: 'back.out(1.5)' },
  };
  gsap.utils.toArray('[data-reveal]').filter((el) => !el.closest('.hero')).forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.matches('[data-reveal]'));
    gsap.from(el, {
      ...reveals[el.dataset.reveal] || reveals.up,
      delay: Math.max(0, siblings.indexOf(el)) * 0.12,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  /* 01: the badge swings on its lanyard */
  gsap.timeline({ scrollTrigger: { trigger: '.lanyard', start: 'top 80%', once: true } })
    .from('.lanyard', { y: -220, opacity: 0, duration: 0.7, ease: 'power2.in' })
    .from('.badge', { rotation: 16, transformOrigin: '50% -150px', duration: 2.4, ease: 'elastic.out(1, 0.28)' }, '-=0.05');

  /* 02: the stamp hits the page */
  gsap.timeline({ scrollTrigger: { trigger: '.stamp', start: 'top 82%', once: true } })
    .from('.stamp', { scale: 3, rotation: -30, opacity: 0, duration: 0.4, ease: 'power4.in' })
    .fromTo('.v0', { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });

  /* 05: results pop in and count up when they are real numbers */
  gsap.from('.stat', { scale: 0, rotation: -40, duration: 0.8, stagger: 0.12, ease: 'back.out(1.8)', scrollTrigger: { trigger: '.stats', start: 'top 85%', once: true } });
  document.querySelectorAll('[data-count], .proof b').forEach((el) => {
    const m = el.textContent.trim().match(/^([^\d]*)([\d][\d,.]*)(.*)$/);
    if (!m) return;
    const end = parseFloat(m[2].replace(/,/g, ''));
    const state = { v: 0 };
    gsap.to(state, {
      v: end, duration: 1.6, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => { el.textContent = m[1] + Math.round(state.v).toLocaleString('en-US') + m[3]; },
    });
  });

  /* Layout-dependent scenes */
  const mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899px)' }, (ctx) => {
    const { desktop } = ctx.conditions;
    const pin = document.querySelector('.build-pin');
    const cards = gsap.utils.toArray('.build-track .ms, .build-track .build-card, .build-note');

    if (desktop) {
      /* 03: vertical scroll drives a horizontal walk along the timeline */
      pin.classList.add('is-h');
      drawString();
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const walk = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: pin, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1, refreshPriority: 2 },
      });
      gsap.fromTo('.string path', { strokeDashoffset: 1 }, {
        strokeDashoffset: 0, ease: 'none',
        scrollTrigger: { trigger: pin, start: 'top top', end: () => `+=${dist()}`, scrub: 1, invalidateOnRefresh: true, refreshPriority: 2 },
      });
      cards.forEach((card) => {
        gsap.from(card, {
          y: 90, rotation: 8, opacity: 0, duration: 0.8, ease: 'back.out(1.6)',
          scrollTrigger: { trigger: card, containerAnimation: walk, start: 'left 92%', toggleActions: 'play none none reverse' },
        });
      });
    } else {
      cards.forEach((card) => {
        gsap.from(card, { y: 60, opacity: 0, rotation: 6, duration: 0.8, ease: 'back.out(1.4)', scrollTrigger: { trigger: card, start: 'top 88%', once: true } });
      });
    }

    /* 04: the automation runs step by step while the page holds still */
    const casePin = document.querySelector('.case-pin');
    const sheet = document.querySelector('.case-sheet');
    const canPin = desktop && sheet.offsetHeight < window.innerHeight - 40;
    if (canPin) casePin.classList.add('is-p');
    const caseTl = gsap.timeline({
      scrollTrigger: canPin
        ? { trigger: casePin, start: 'top top', end: '+=130%', pin: true, scrub: 1, refreshPriority: 1 }
        : { trigger: '.flow', start: 'top 80%', end: 'bottom 30%', scrub: 1 },
    });
    caseTl
      .from('.flow .node', { opacity: 0.15, y: 24, scale: 0.94, duration: 0.5, stagger: 0.5 })
      .from('.ba-card', { y: 40, opacity: 0, duration: 0.5, stagger: 0.3 })
      .from('.case-note', { scale: 1.3, rotation: 15, opacity: 0, duration: 0.4 });

    return () => {
      pin.classList.remove('is-h');
      casePin.classList.remove('is-p');
    };
  });

  /* Pins refresh first (refreshPriority) so everything below them accounts for the pinned distance */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { drawString(); ScrollTrigger.refresh(); });
  }
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();

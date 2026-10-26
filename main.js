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

  /* ---------- Red string between pinned items ---------- */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  function pinPoint(el) {
    return { x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + 2 };
  }
  function sag(a, b) {
    const dx = Math.abs(b.x - a.x);
    return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${((a.x + b.x) / 2).toFixed(1)} ${(Math.max(a.y, b.y) + 18 + dx * 0.08).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  function layoutStrings() {
    document.querySelectorAll('[data-strings]').forEach((box) => {
      let svg = box.querySelector(':scope > .strings');
      if (!svg) {
        svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('class', 'strings');
        svg.setAttribute('aria-hidden', 'true');
        box.appendChild(svg);
      }
      const w = box.offsetWidth;
      const h = box.offsetHeight;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      const pts = [...box.querySelectorAll(':scope > [data-pin]')].map(pinPoint);
      const pairs = [];
      if (box.dataset.strings === 'star') {
        const [hub, ...rest] = pts;
        rest.forEach((p) => pairs.push([hub, p]));
        rest.forEach((p, i) => { if (i < rest.length - 1) pairs.push([p, rest[i + 1]]); });
      } else {
        pts.forEach((p, i) => { if (i < pts.length - 1) pairs.push([p, pts[i + 1]]); });
      }
      const existing = [...svg.querySelectorAll('path')];
      pairs.forEach(([a, b], i) => {
        const path = existing[i] || svg.appendChild(document.createElementNS(SVG_NS, 'path'));
        path.setAttribute('pathLength', '1');
        path.setAttribute('d', sag(a, b));
      });
      existing.slice(pairs.length).forEach((p) => p.remove());
    });
  }
  layoutStrings();
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(layoutStrings, 150); });

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

  /* ---------- Without GSAP or with reduced motion: static page ---------- */
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

  const drawOn = (paths, trigger, opts = {}) => gsap.fromTo(paths, { strokeDashoffset: 1 }, {
    strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.12,
    scrollTrigger: { trigger, start: 'top 80%', once: true },
    ...opts,
  });

  /* Cover: the folder lands, the title is stamped, the evidence gets pinned and strung */
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.folder', { y: 90, rotation: -6, opacity: 0, duration: 1 })
    .from('.burst', { scale: 0, rotation: -120, duration: 0.7, ease: 'back.out(2.2)' }, '-=0.4')
    .from('.t-l', { yPercent: 100, opacity: 0, duration: 0.6, stagger: 0.07, ease: 'back.out(2)' }, '-=0.5')
    .from('.disc', { scale: 0, rotation: -180, duration: 0.8, ease: 'back.out(1.8)' }, '-=0.35')
    .fromTo('.t-serif', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power2.inOut' }, '-=0.4')
    .from('.roles, .thesis, .spec, .folder-copy .btn', { y: 20, opacity: 0, duration: 0.6, stagger: 0.08 }, '-=0.5')
    .from('.cluster .pc', { y: -60, scale: 1.15, opacity: 0, duration: 0.6, stagger: 0.12, ease: 'back.out(1.6)' }, '-=0.9')
    .fromTo('.cluster .strings path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, stagger: 0.08, ease: 'power2.inOut' }, '-=0.2')
    .from('.lanyard', { y: -260, duration: 0.8, ease: 'power2.in' }, 0.5)
    .from('.idcard', { rotation: 20, transformOrigin: '50% -180px', duration: 2.4, ease: 'elastic.out(1, 0.28)' }, 1.3)
    .from('.motto', { scale: 1.6, opacity: 0, duration: 0.5, ease: 'back.out(2.5)' }, 1.8);

  gsap.utils.toArray('.hero [data-speed]').forEach((el) => {
    gsap.to(el, { y: () => parseFloat(el.dataset.speed) * 300, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  });
  gsap.to('.folder', { yPercent: -4, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* Generic reveals */
  const reveals = {
    up: { y: 70, rotation: -2, opacity: 0, duration: 1, ease: 'power3.out' },
    slap: { scale: 1.25, rotation: 12, opacity: 0, duration: 0.6, ease: 'back.out(2.4)' },
    drop: { y: -70, rotation: -12, opacity: 0, duration: 0.8, ease: 'back.out(1.5)' },
  };
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.matches('[data-reveal]'));
    const delay = Math.max(0, siblings.indexOf(el)) * 0.12;
    const st = { trigger: el, start: 'top 88%', once: true };
    if (el.dataset.reveal === 'write') {
      gsap.fromTo(el, { clipPath: 'inset(-10% 100% -10% 0)' }, { clipPath: 'inset(-10% 0% -10% 0)', duration: 1.1, ease: 'power2.inOut', delay, scrollTrigger: st });
    } else {
      gsap.from(el, { ...reveals[el.dataset.reveal] || reveals.up, delay, scrollTrigger: st });
    }
  });

  /* Impact: numbers rise, chalk arrows are drawn, real numbers count up */
  gsap.from('.metric-num', { y: 50, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.metrics', start: 'top 82%', once: true } });
  drawOn('.metric .arrow path', '.metrics', { delay: 0.4, stagger: 0.18 });
  document.querySelectorAll('[data-count], .spec dd').forEach((el) => {
    const m = el.textContent.trim().match(/^([^\d]*)(\d[\d,.]*)(.*)$/);
    if (!m) return;
    const end = parseFloat(m[2].replace(/,/g, ''));
    const state = { v: 0 };
    gsap.to(state, {
      v: end, duration: 1.6, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => { el.textContent = m[1] + Math.round(state.v).toLocaleString('en-US') + m[3]; },
    });
  });

  /* Problem: the stamp lands on version 0 */
  gsap.timeline({ scrollTrigger: { trigger: '.v0 .stamp', start: 'top 85%', once: true } })
    .from('.v0 .stamp', { scale: 3, rotation: -30, opacity: 0, duration: 0.4, ease: 'power4.in' })
    .fromTo('.v0', { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });

  /* Build: the clapper snaps shut, then the frames are laid on the slate */
  gsap.timeline({ scrollTrigger: { trigger: '.clapper', start: 'top 72%', once: true } })
    .fromTo('.clapper-stick', { rotation: -24 }, { rotation: 0, duration: 0.32, ease: 'power4.in', delay: 0.3 })
    .fromTo('.slate', { y: 0 }, { y: 6, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.out' })
    .from('.frame', { x: 120, y: 30, rotation: 10, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'back.out(1.4)' }, '-=0.05')
    .from('.frame .tape-red', { scaleX: 0, duration: 0.3, stagger: 0.12 }, '-=0.6');

  /* Ending: a small clap to close the story */
  gsap.fromTo('.mc-stick', { rotation: -30 }, { rotation: 0, duration: 0.3, ease: 'power4.in', scrollTrigger: { trigger: '.end', start: 'top 90%', once: true } });

  /* Case: the evidence is pinned and strung together while the page holds still */
  const mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899px)' }, (ctx) => {
    const casePin = document.querySelector('.case-pin');
    const board = document.querySelector('.board');
    const canPin = ctx.conditions.desktop && board.offsetHeight < window.innerHeight - 40;
    if (canPin) casePin.classList.add('is-p');
    layoutStrings();
    const tl = gsap.timeline({
      scrollTrigger: canPin
        ? { trigger: casePin, start: 'top top', end: '+=140%', pin: true, scrub: 1, refreshPriority: 1 }
        : { trigger: '.evidence', start: 'top 80%', end: 'bottom 45%', scrub: 1 },
    });
    const evs = gsap.utils.toArray('.evidence .ev');
    const strings = gsap.utils.toArray('.evidence .strings path');
    evs.forEach((ev, i) => {
      tl.from(ev, { y: -50, scale: 1.12, opacity: 0, duration: 0.5, ease: 'back.out(1.6)' });
      if (strings[i - 1]) tl.fromTo(strings[i - 1], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.4 }, '<');
    });
    tl.from('.delta', { scale: 0.8, opacity: 0, duration: 0.5, ease: 'back.out(2)' })
      .from('.role li', { y: 20, opacity: 0, duration: 0.3, stagger: 0.08 });
    return () => casePin.classList.remove('is-p');
  });

  const refresh = () => { layoutStrings(); ScrollTrigger.refresh(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh);
})();

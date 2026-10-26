(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = Boolean(window.gsap && window.ScrollTrigger);
  const clamp = (min, max, v) => Math.min(max, Math.max(min, v));

  /* ---------- Sound (off until the visitor turns it on) ---------- */
  const audio = { ctx: null, on: false };
  const soundBtn = document.querySelector('.chapters .sound');
  function ctx() {
    if (!audio.ctx) audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    return audio.ctx;
  }
  function noise(dur, freq, gain, q = 0.8) {
    const c = ctx();
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    g.gain.value = gain;
    src.connect(f).connect(g).connect(c.destination);
    src.start();
  }
  function tone(freq, dur, type, gain, glideTo) {
    const c = ctx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, c.currentTime + dur);
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur);
  }
  const sfx = {
    clap: () => { noise(0.14, 1900, 1.1); tone(95, 0.14, 'sine', 0.5, 45); },
    pluck: (s = 1) => tone(190 + Math.random() * 90, 0.55, 'triangle', 0.14 * s, 170),
    thump: () => { tone(120, 0.2, 'sine', 0.55, 55); noise(0.06, 700, 0.35); },
    pick: () => noise(0.035, 3200, 0.18, 1.5),
    drop: () => noise(0.05, 1300, 0.22),
    key: () => noise(0.025, 4200, 0.22, 2),
    spin: () => noise(0.12, 2600, 0.08, 4),
  };
  const play = (name, arg) => { if (audio.on) { try { sfx[name](arg); } catch (e) { /* audio unavailable */ } } };
  soundBtn.addEventListener('click', () => {
    audio.on = !audio.on;
    soundBtn.setAttribute('aria-pressed', String(audio.on));
    if (audio.on) { ctx(); play('pick'); }
  });

  /* ---------- Surface color + chapter nav ---------- */
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

  const nav = document.querySelector('.chapters');
  const toggleNav = () => nav.classList.toggle('is-hidden', window.scrollY < window.innerHeight * 0.5);
  window.addEventListener('scroll', toggleNav, { passive: true });
  toggleNav();

  /* ---------- Red strings: they follow the photos and can be plucked or pulled ---------- */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const gx = (el, prop) => (hasGsap ? parseFloat(window.gsap.getProperty(el, prop)) || 0 : 0);
  const boards = [...document.querySelectorAll('[data-strings]')].map((box) => {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'strings');
    svg.setAttribute('aria-hidden', 'true');
    box.appendChild(svg);
    const pins = [...box.querySelectorAll(':scope > [data-pin]')];
    const pairs = [];
    if (box.dataset.strings === 'star') {
      for (let i = 1; i < pins.length; i++) pairs.push([0, i]);
      for (let i = 1; i < pins.length - 1; i++) pairs.push([i, i + 1]);
    } else {
      for (let i = 0; i < pins.length - 1; i++) pairs.push([i, i + 1]);
    }
    const lines = pairs.map(([a, b]) => {
      const str = document.createElementNS(SVG_NS, 'path');
      str.setAttribute('class', 'str');
      str.setAttribute('pathLength', '1');
      const hit = document.createElementNS(SVG_NS, 'path');
      hit.setAttribute('class', 'hit');
      svg.append(str, hit);
      return { a, b, str, hit, pull: null, from: null, t0: 0, ctrl: { x: 0, y: 0 }, rest: { x: 0, y: 0 } };
    });
    const board = { box, svg, pins, lines, visible: true, w: 0, h: 0 };
    lines.forEach((L) => wireString(board, L));
    return board;
  });

  function pinAt(el) {
    return {
      x: el.offsetLeft + el.offsetWidth / 2 + gx(el, 'x'),
      y: el.offsetTop + 3 + gx(el, 'y'),
    };
  }
  function drawBoard(B, now) {
    const w = B.box.offsetWidth;
    const h = B.box.offsetHeight;
    if (w !== B.w || h !== B.h) {
      B.w = w; B.h = h;
      B.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      B.svg.setAttribute('width', w);
      B.svg.setAttribute('height', h);
    }
    const P = B.pins.map(pinAt);
    B.lines.forEach((L) => {
      const A = P[L.a];
      const Z = P[L.b];
      const rest = { x: (A.x + Z.x) / 2, y: Math.max(A.y, Z.y) + 18 + Math.abs(Z.x - A.x) * 0.08 };
      let c = rest;
      if (L.pull) {
        c = { x: 2 * L.pull.x - (A.x + Z.x) / 2, y: 2 * L.pull.y - (A.y + Z.y) / 2 };
      } else if (L.from) {
        const dt = (now - L.t0) / 1000;
        if (dt > 2.6) L.from = null;
        else {
          const k = Math.exp(-3.4 * dt) * Math.cos(21 * dt);
          c = { x: rest.x + L.from.x * k, y: rest.y + L.from.y * k };
        }
      }
      L.rest = rest;
      L.ctrl = c;
      const d = `M${A.x.toFixed(1)} ${A.y.toFixed(1)} Q ${c.x.toFixed(1)} ${c.y.toFixed(1)} ${Z.x.toFixed(1)} ${Z.y.toFixed(1)}`;
      L.str.setAttribute('d', d);
      L.hit.setAttribute('d', d);
    });
  }
  function pluck(L, amount = 26) {
    L.from = { x: (Math.random() - 0.5) * amount * 0.4, y: amount };
    L.t0 = performance.now();
  }
  let activePull = null;
  function localPoint(B, e) {
    const r = B.box.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function wireString(B, L) {
    let lastHover = 0;
    L.hit.addEventListener('pointerenter', () => {
      if (activePull || document.querySelector('.is-dragging')) return;
      const now = performance.now();
      if (now - lastHover < 350) return;
      lastHover = now;
      pluck(L, 8);
      play('pluck', 0.4);
    });
    L.hit.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!finePointer) { pluck(L, 34); play('pluck', 1); return; }
      L.hit.setPointerCapture(e.pointerId);
      activePull = { B, L };
      L.pull = localPoint(B, e);
    });
    L.hit.addEventListener('pointermove', (e) => {
      if (!activePull || activePull.L !== L) return;
      const p = localPoint(B, e);
      const mid = L.rest;
      const dx = clamp(-160, 160, p.x - mid.x);
      const dy = clamp(-160, 160, p.y - mid.y);
      L.pull = { x: mid.x + dx, y: mid.y + dy };
    });
    const release = () => {
      if (!activePull || activePull.L !== L) return;
      activePull = null;
      L.from = { x: L.ctrl.x - L.rest.x, y: L.ctrl.y - L.rest.y };
      L.pull = null;
      L.t0 = performance.now();
      play('pluck', 1.3);
    };
    L.hit.addEventListener('pointerup', release);
    L.hit.addEventListener('pointercancel', release);
  }
  const stringObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => { const B = boards.find((b) => b.box === e.target); if (B) B.visible = e.isIntersecting; });
  });
  boards.forEach((B) => stringObserver.observe(B.box));
  const stringLoop = (now) => {
    boards.forEach((B) => { if (B.visible) drawBoard(B, now); });
    requestAnimationFrame(stringLoop);
  };
  boards.forEach((B) => drawBoard(B, performance.now()));
  requestAnimationFrame(stringLoop);

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

  /* ---------- Clapperboard state (works with or without GSAP) ---------- */
  const takeNum = document.querySelector('.take-num');
  const sceneNum = document.querySelector('.scene-num');
  let take = 1;
  document.querySelectorAll('.frame').forEach((f, i) => {
    const show = () => { sceneNum.textContent = String(i + 1).padStart(2, '0'); };
    f.addEventListener('pointerenter', show);
    f.addEventListener('focusin', show);
  });

  const bar = document.querySelector('.progress-bar');
  if (!hasGsap || reduce) {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    document.querySelector('.clapper-stick').addEventListener('click', () => {
      take += 1;
      takeNum.textContent = String(take).padStart(2, '0');
      play('clap');
    });
    return;
  }

  /* =====================================================================
     Motion (GSAP)
     ===================================================================== */
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  const hasDrag = Boolean(window.Draggable);
  if (hasDrag) gsap.registerPlugin(window.Draggable);
  gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  /* Cover intro */
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.folder', { y: 90, rotation: -6, opacity: 0, duration: 1 })
    .from('.burst', { scale: 0, rotation: -120, duration: 0.7, ease: 'back.out(2.2)' }, '-=0.4')
    .from('.t-l', { yPercent: 100, opacity: 0, duration: 0.6, stagger: 0.07, ease: 'back.out(2)' }, '-=0.5')
    .from('.disc', { scale: 0, rotation: -180, duration: 0.8, ease: 'back.out(1.8)' }, '-=0.35')
    .fromTo('.t-serif', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power2.inOut' }, '-=0.4')
    .from('.roles, .thesis, .spec, .folder-copy .btn', { y: 20, opacity: 0, duration: 0.6, stagger: 0.08 }, '-=0.5')
    .from('.cluster .pc', { y: -60, scale: 1.15, opacity: 0, duration: 0.6, stagger: 0.12, ease: 'back.out(1.6)' }, '-=0.9')
    .fromTo('.cluster .strings .str', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, stagger: 0.08, ease: 'power2.inOut' }, '-=0.2')
    .from('.cluster .hint', { opacity: 0, y: 10, duration: 0.5 }, '-=0.3')
    .from('.lanyard', { y: -260, duration: 0.8, ease: 'power2.in' }, 0.5)
    .from('.idcard', { rotation: 20, transformOrigin: '50% -180px', duration: 2.4, ease: 'elastic.out(1, 0.28)' }, 1.3)
    .from('.motto', { scale: 1.6, opacity: 0, duration: 0.5, ease: 'back.out(2.5)' }, 1.8);

  /* Depth: props drift with the page; blurred foreground props move fastest */
  gsap.utils.toArray('[data-speed]').forEach((el) => {
    const s = parseFloat(el.dataset.speed);
    const sec = el.closest('section');
    const isHero = sec.classList.contains('hero');
    gsap.fromTo(el, { y: isHero ? 0 : -s * 170 }, {
      y: s * (isHero ? 320 : 170), ease: 'none',
      scrollTrigger: { trigger: sec, start: isHero ? 'top top' : 'top bottom', end: 'bottom top', scrub: true },
    });
  });

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

  /* Impact */
  gsap.from('.metric-num', { y: 50, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.metrics', start: 'top 82%', once: true } });
  gsap.fromTo('.metric .arrow path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.18, delay: 0.4, scrollTrigger: { trigger: '.metrics', start: 'top 80%', once: true } });
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

  /* Problem: the stamp lands; click it to stamp again */
  const stamp = document.querySelector('.v0 .stamp');
  const stampIt = () => gsap.timeline()
    .fromTo(stamp, { scale: 3, rotation: -30, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.35, ease: 'power4.in', onComplete: () => play('thump') })
    .fromTo('.v0', { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
  gsap.set(stamp, { opacity: 0 });
  ScrollTrigger.create({ trigger: stamp, start: 'top 85%', once: true, onEnter: stampIt });
  stamp.addEventListener('click', stampIt);

  /* Build: the clapperboard */
  const stick = document.querySelector('.clapper-stick');
  const slate = document.querySelector('.slate');
  const pop = document.querySelector('.clap-pop');
  let clapping = false;
  function clap() {
    if (clapping) return;
    clapping = true;
    gsap.to(stick, {
      rotation: 0, duration: 0.16, ease: 'power4.in',
      onComplete: () => {
        clapping = false;
        play('clap');
        take += 1;
        const t = String(take).padStart(2, '0');
        takeNum.textContent = t;
        pop.textContent = `Take ${t}!`;
        gsap.fromTo(slate, { y: 0 }, { y: 7, duration: 0.07, yoyo: true, repeat: 1, ease: 'power1.out' });
        gsap.fromTo(pop, { opacity: 0, y: 14, scale: 0.7 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(2.5)' });
        gsap.to(pop, { opacity: 0, y: -12, duration: 0.5, delay: 0.9 });
        gsap.fromTo('.frame .strip', { filter: 'brightness(1.6)' }, { filter: 'brightness(1)', duration: 0.5, stagger: 0.03 });
      },
    });
  }
  function openAndClap() {
    gsap.to(stick, { rotation: -30, duration: 0.25, ease: 'power2.out', onComplete: () => gsap.delayedCall(0.12, clap) });
  }
  let stickDrag = null;
  stick.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    stick.setPointerCapture(e.pointerId);
    stickDrag = { y: e.clientY, start: gsap.getProperty(stick, 'rotation'), moved: false };
  });
  stick.addEventListener('pointermove', (e) => {
    if (!stickDrag) return;
    const dy = e.clientY - stickDrag.y;
    if (Math.abs(dy) > 3) stickDrag.moved = true;
    gsap.set(stick, { rotation: clamp(-40, 0, stickDrag.start + dy * 0.35) });
  });
  const stickUp = () => {
    if (!stickDrag) return;
    const { moved } = stickDrag;
    stickDrag = null;
    if (!moved) openAndClap();
    else if (gsap.getProperty(stick, 'rotation') < -4) clap();
    else gsap.to(stick, { rotation: 0, duration: 0.2 });
  };
  stick.addEventListener('pointerup', stickUp);
  stick.addEventListener('pointercancel', stickUp);
  stick.addEventListener('click', (e) => { if (e.detail === 0) openAndClap(); });

  gsap.timeline({ scrollTrigger: { trigger: '.clapper', start: 'top 72%', once: true } })
    .fromTo(stick, { rotation: -24 }, { rotation: 0, duration: 0.32, ease: 'power4.in', delay: 0.3, onComplete: () => play('clap') })
    .fromTo(slate, { y: 0 }, { y: 6, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.out' })
    .from('.frame', { x: 120, y: 30, rotation: 10, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'back.out(1.4)' }, '-=0.05')
    .from('.frame .tape-red', { scaleX: 0, duration: 0.3, stagger: 0.12 }, '-=0.6');

  /* Ending: the small clapper claps on arrival and on click */
  const mini = document.querySelector('.mini-clap');
  const miniClap = () => gsap.fromTo('.mc-stick', { rotation: -32 }, { rotation: 0, duration: 0.28, ease: 'power4.in', onComplete: () => play('clap') });
  ScrollTrigger.create({ trigger: '.end', start: 'top 90%', once: true, onEnter: miniClap });
  mini.addEventListener('click', miniClap);

  /* Case: pinned evidence board */
  const mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899px)' }, (c) => {
    const casePin = document.querySelector('.case-pin');
    const board = document.querySelector('.board');
    const canPin = c.conditions.desktop && board.offsetHeight < window.innerHeight - 40;
    if (canPin) casePin.classList.add('is-p');
    const tl = gsap.timeline({
      scrollTrigger: canPin
        ? { trigger: casePin, start: 'top top', end: '+=140%', pin: true, scrub: 1, refreshPriority: 1 }
        : { trigger: '.evidence', start: 'top 80%', end: 'bottom 45%', scrub: 1 },
    });
    const evs = gsap.utils.toArray('.evidence .ev');
    const strs = gsap.utils.toArray('.evidence .strings .str');
    evs.forEach((ev, i) => {
      tl.from(ev, { scale: 1.12, autoAlpha: 0, duration: 0.5, ease: 'back.out(1.6)' });
      if (strs[i - 1]) tl.fromTo(strs[i - 1], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.4 }, '<');
    });
    tl.from('.delta', { scale: 0.8, opacity: 0, duration: 0.5, ease: 'back.out(2)' })
      .from('.role li', { y: 20, opacity: 0, duration: 0.3, stagger: 0.08 });
    return () => casePin.classList.remove('is-p');
  });

  /* =====================================================================
     Hands-on: things you can pick up, spin, swing and press
     ===================================================================== */

  /* Pick up photos, notes, receipts and stickers */
  if (hasDrag && finePointer) {
    const makeDrag = (selector, bounds) => {
      gsap.utils.toArray(selector).forEach((el) => {
        el.classList.add('can-drag');
        const tilt = gsap.quickTo(el, 'rotation', { duration: 0.45, ease: 'power3' });
        window.Draggable.create(el, {
          type: 'x,y', bounds, zIndexBoost: true, minimumMovement: 3,
          onPress() { el.classList.add('is-dragging'); gsap.to(el, { scale: 1.05, duration: 0.2 }); play('pick'); },
          onDrag() { tilt(clamp(-14, 14, this.deltaX * 1.6)); },
          onRelease() {
            el.classList.remove('is-dragging');
            tilt(0);
            gsap.to(el, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
            play('drop');
          },
        });
      });
    };
    makeDrag('.cluster .pc', '.hero');
    makeDrag('.evidence .ev', '.board');
    makeDrag('.cork-notes .note, .quote, .origin', '.problem');
    makeDrag('.receipt', '.impact');
    makeDrag('.lessons .note', '.next');
    makeDrag('.lockers .stk', '.problem');
    document.querySelector('.lockers').style.pointerEvents = 'none';
    document.querySelectorAll('.lockers .stk').forEach((s) => { s.style.pointerEvents = 'auto'; });

    /* Spin the record */
    const disc = document.querySelector('.disc');
    let lastRot = 0;
    let vel = 0;
    window.Draggable.create(disc, {
      type: 'rotation',
      onPress() { gsap.killTweensOf(disc, 'rotation'); lastRot = this.rotation; vel = 0; },
      onDrag() { vel = this.rotation - lastRot; lastRot = this.rotation; },
      onRelease() { play('spin'); gsap.to(disc, { rotation: `+=${clamp(-900, 900, vel * 30)}`, duration: 1.8, ease: 'power3.out' }); },
    });
  } else {
    /* Touch: a tap gives a little wiggle */
    document.querySelectorAll('.pc, .note, .receipt, .ev').forEach((el) => {
      el.addEventListener('click', () => gsap.fromTo(el, { rotation: -4 }, { rotation: 0, duration: 0.8, ease: 'elastic.out(1, 0.3)' }));
    });
    document.querySelector('.disc').addEventListener('click', () => gsap.to('.disc', { rotation: '+=360', duration: 1.2, ease: 'power3.out' }));
  }

  /* Swing the ID card on its lanyard */
  const card = document.querySelector('.idcard');
  gsap.set(card, { transformOrigin: '50% -180px' });
  const swing = gsap.quickTo(card, 'rotation', { duration: 0.35, ease: 'power3' });
  let cardDrag = null;
  card.addEventListener('pointerdown', (e) => {
    if (!finePointer) return;
    e.preventDefault();
    card.setPointerCapture(e.pointerId);
    cardDrag = { x: e.clientX };
    gsap.killTweensOf(card, 'rotation');
  });
  card.addEventListener('pointermove', (e) => {
    if (cardDrag) swing(clamp(-35, 35, (e.clientX - cardDrag.x) * 0.18));
  });
  const cardUp = () => {
    if (!cardDrag) return;
    cardDrag = null;
    gsap.to(card, { rotation: 0, duration: 2.4, ease: 'elastic.out(1, 0.22)', overwrite: true });
  };
  card.addEventListener('pointerup', cardUp);
  card.addEventListener('pointercancel', cardUp);
  card.addEventListener('pointerenter', () => { if (!cardDrag) gsap.fromTo(card, { rotation: 4 }, { rotation: 0, duration: 1.6, ease: 'elastic.out(1, 0.25)', overwrite: true }); });
  card.addEventListener('click', () => { if (!finePointer) gsap.fromTo(card, { rotation: 18 }, { rotation: 0, duration: 2, ease: 'elastic.out(1, 0.22)' }); });

  /* The 2026 sticker spins when you touch it */
  const burst = document.querySelector('.burst');
  burst.addEventListener('pointerenter', () => gsap.to(burst, { rotation: '+=72', duration: 0.6, ease: 'back.out(2)' }));

  /* Magnetic buttons */
  if (finePointer) {
    document.querySelectorAll('.btn, .chapters .brand').forEach((b) => {
      const qx = gsap.quickTo(b, 'x', { duration: 0.4, ease: 'power3' });
      const qy = gsap.quickTo(b, 'y', { duration: 0.4, ease: 'power3' });
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        qx((e.clientX - r.left - r.width / 2) * 0.3);
        qy((e.clientY - r.top - r.height / 2) * 0.4);
      });
      b.addEventListener('pointerleave', () => { qx(0); qy(0); });
    });
  }

  /* Keys click */
  document.querySelectorAll('.keyboard span').forEach((k) => {
    k.addEventListener('pointerdown', () => { k.classList.add('is-down'); play('key'); });
    k.addEventListener('pointerup', () => k.classList.remove('is-down'));
    k.addEventListener('pointerleave', () => k.classList.remove('is-down'));
  });

  /* A warm desk light follows the pointer */
  if (finePointer) {
    const light = document.querySelector('.light');
    let tx = window.innerWidth * 0.3, ty = window.innerHeight * 0.2, cx = tx, cy = ty;
    window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    gsap.ticker.add(() => {
      if (Math.abs(tx - cx) < 0.5 && Math.abs(ty - cy) < 0.5) return;
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      light.style.setProperty('--lx', `${cx}px`);
      light.style.setProperty('--ly', `${cy}px`);
    });

    /* The cover leans toward you */
    const hero = document.querySelector('.hero');
    const stage = document.querySelector('.hero-stage');
    gsap.set(hero, { perspective: 1400 });
    const rotX = gsap.quickTo(stage, 'rotationX', { duration: 0.9, ease: 'power3' });
    const rotY = gsap.quickTo(stage, 'rotationY', { duration: 0.9, ease: 'power3' });
    const floppyX = gsap.quickTo('.floppy', 'x', { duration: 1, ease: 'power3' });
    hero.addEventListener('pointermove', (e) => {
      if (document.querySelector('.is-dragging') || activePull || cardDrag) return;
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      rotY(px * 4);
      rotX(-py * 3);
      floppyX(px * 40);
    });
    hero.addEventListener('pointerleave', () => { rotX(0); rotY(0); floppyX(0); });
  }

  const refresh = () => ScrollTrigger.refresh();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh);
})();

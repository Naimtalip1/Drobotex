/* DROBOTEX 2026 — interactions & scroll choreography */
gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(pointer: fine)').matches;

/* ================= PRELOADER ================= */
(function preloader() {
  const lines = [
    '> DROBOTEX.OS v2.6 — cold boot',
    '> mounting /arena ......... OK',
    '> linking 9 competition grids ... OK',
    '> prize pool: RM 25,000 .... LOCKED',
    '> telemetry: DEWAN BKIH .... ONLINE',
    '> all systems nominal. launch.'
  ];
  const box = document.getElementById('boot-lines');
  const bar = document.getElementById('boot-bar');
  const pct = document.getElementById('boot-pct');
  const pre = document.getElementById('preloader');

  if (reduced) {
    pre.remove();
    heroIntro(true);
    return;
  }

  let i = 0;
  const lineTimer = setInterval(() => {
    if (i < lines.length) {
      const p = document.createElement('p');
      p.textContent = lines[i];
      p.className = i === lines.length - 1 ? 'text-cyan' : '';
      box.appendChild(p);
      i++;
    }
  }, 220);

  /* Pure CSS/DOM exit — GSAP tweens are rAF-driven and freeze in
     background tabs, so the boot screen must never depend on them */
  let exited = false;
  function exitPreloader() {
    if (exited) return;
    exited = true;
    clearInterval(lineTimer);
    bar.style.width = '100%';
    pct.textContent = '100%';
    heroIntro(false);
    pre.classList.add('exit');
    setTimeout(() => pre.remove(), 1000);
  }

  /* animate the bar with JS timers (throttle-tolerant), not rAF tweens */
  let v = 0;
  const barTimer = setInterval(() => {
    v = Math.min(100, v + 4 + Math.random() * 6);
    bar.style.width = v + '%';
    pct.textContent = Math.round(v) + '%';
    if (v >= 100) {
      clearInterval(barTimer);
      setTimeout(exitPreloader, 300);
    }
  }, 90);

  /* hard fallback: never trap the user behind the boot screen */
  setTimeout(exitPreloader, 4000);
})();

/* ================= HERO INTRO ================= */
function heroIntro(instant) {
  const els = ['#hero-kicker', '#hero-l1', '#hero-l2', '#hero-sub', '#mascot'];
  if (instant) {
    gsap.set(els, { opacity: 1, y: 0 });
    return;
  }
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  tl.fromTo('#hero-kicker', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 })
    .fromTo('#hero-l1', { opacity: 0, y: 90, skewY: 4 }, { opacity: 1, y: 0, skewY: 0, duration: 1.1 }, '-=0.5')
    .fromTo('#hero-l2', { opacity: 0, y: 90, skewY: 4 }, { opacity: 1, y: 0, skewY: 0, duration: 1.1 }, '-=0.85')
    .fromTo('#hero-sub', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.6')
    .fromTo('#mascot', { opacity: 0, scale: 0.8, rotate: -8 }, { opacity: 1, scale: 1, rotate: 0, duration: 1.2, ease: 'elastic.out(1,0.6)' }, '-=0.7');

  /* safety net: rAF tweens stall in hidden tabs — force final state if stuck */
  setTimeout(() => {
    els.forEach(sel => {
      const el = document.querySelector(sel);
      if (el && parseFloat(getComputedStyle(el).opacity) < 0.05) {
        gsap.set(el, { opacity: 1, y: 0, skewY: 0, scale: 1, rotate: 0, clearProps: 'transform' });
        el.style.opacity = 1;
      }
    });
  }, 3500);
}

/* ================= CUSTOM CURSOR ================= */
if (fine && !reduced) {
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  const pos = { x: -100, y: -100 }, rp = { x: -100, y: -100 };
  window.addEventListener('pointermove', e => { pos.x = e.clientX; pos.y = e.clientY; }, { passive: true });
  gsap.ticker.add(() => {
    rp.x += (pos.x - rp.x) * 0.16;
    rp.y += (pos.y - rp.y) * 0.16;
    dot.style.transform = `translate(${pos.x - 3}px, ${pos.y - 3}px)`;
    const half = ring.offsetWidth / 2;
    ring.style.transform = `translate(${rp.x - half}px, ${rp.y - half}px)`;
  });
  document.querySelectorAll('[data-hover], a, button, .zone-row').forEach(el => {
    el.addEventListener('pointerenter', () => ring.classList.add('hovering'));
    el.addEventListener('pointerleave', () => ring.classList.remove('hovering'));
  });
} else {
  document.getElementById('cursor-dot')?.remove();
  document.getElementById('cursor-ring')?.remove();
}

/* ================= SCROLL PROGRESS + NAV ================= */
const prog = document.getElementById('scroll-progress');
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  prog.style.width = (scrollY / max) * 100 + '%';
  nav.classList.toggle('bg-ink/85', scrollY > 60);
  nav.classList.toggle('backdrop-blur-md', scrollY > 60);
  nav.classList.toggle('border-b', scrollY > 60);
  nav.classList.toggle('border-line', scrollY > 60);
}, { passive: true });

/* ================= MOBILE MENU ================= */
const toggle = document.getElementById('nav-toggle');
const menu = document.getElementById('mobile-menu');
let menuOpen = false;
function setMenu(open) {
  menuOpen = open;
  toggle.textContent = open ? 'CLOSE' : 'MENU';
  if (open) {
    menu.classList.remove('hidden');
    menu.classList.add('flex');
    document.body.style.overflow = 'hidden';
    gsap.fromTo('.mob-link', { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.06, duration: 0.5, ease: 'power3.out' });
  } else {
    menu.classList.add('hidden');
    menu.classList.remove('flex');
    document.body.style.overflow = '';
  }
}
toggle.addEventListener('click', () => setMenu(!menuOpen));
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

/* ================= HORIZONTAL COMPETITION SCROLL ================= */
/* created FIRST so its pin-spacer exists before any other trigger measures layout */
(function horizontal() {
  const track = document.getElementById('comp-track');
  const section = document.getElementById('competitions');
  const dist = () => track.scrollWidth - document.getElementById('comp-viewport').clientWidth;
  gsap.to(track, {
    x: () => -dist(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => '+=' + dist(),
      scrub: 1,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });
})();

/* ================= GENERIC REVEALS ================= */
gsap.utils.toArray('.reveal').forEach(el => {
  gsap.fromTo(el, { opacity: 0, y: 40 }, {
    opacity: 1, y: 0, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 88%' }
  });
});

/* ================= ABOUT STATEMENT — word reveal ================= */
(function wordReveal() {
  const el = document.getElementById('about-statement');
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
  gsap.fromTo(el.querySelectorAll('.w'),
    { opacity: 0.12 },
    {
      opacity: 1, stagger: 0.05, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'top 30%', scrub: 0.6 }
    });
})();

/* ================= STAT COUNTERS ================= */
document.querySelectorAll('[data-count]').forEach(el => {
  const target = +el.dataset.count;
  const obj = { v: 0 };
  ScrollTrigger.create({
    trigger: el, start: 'top 90%', once: true,
    onEnter() {
      gsap.to(obj, {
        v: target, duration: 1.8, ease: 'power2.out',
        onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString('en-MY'); }
      });
    }
  });
});

/* ================= MASCOT PARALLAX ================= */
if (!reduced) {
  gsap.to('#mascot', {
    yPercent: -30, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.8 }
  });
  if (fine) {
    window.addEventListener('pointermove', e => {
      const x = (e.clientX / innerWidth - 0.5) * 2;
      gsap.to('#mascot', { x: x * -18, duration: 1.2, ease: 'power2.out', overwrite: 'auto' });
    }, { passive: true });
  }
}

/* ================= HERO TEXT DRIFT ON SCROLL ================= */
/* opacity fades go on the wrapper so they never fight the intro tween,
   xPercent drift stays on the individual lines */
gsap.to('#hero-fade', {
  opacity: 0.08, y: -60, ease: 'none',
  scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
});
gsap.to('#hero-l1', {
  xPercent: -8, ease: 'none',
  scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
});
gsap.to('#hero-l2', {
  xPercent: 6, ease: 'none',
  scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
});

/* ================= ZONE ROWS — tap toggle for touch ================= */
document.querySelectorAll('.zone-row').forEach(row => {
  row.addEventListener('click', () => row.classList.toggle('open'));
});

/* ================= REGISTRATION FORM ================= */
document.getElementById('reg-form').addEventListener('submit', e => {
  e.preventDefault();
  const msg = document.getElementById('form-msg');
  msg.classList.remove('hidden');
  gsap.fromTo(msg, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5 });
  e.target.querySelector('button span').textContent = '✓ TRANSMITTED';
  e.target.querySelectorAll('input,select,button').forEach(el => el.disabled = true);
});

/* refresh now that all triggers exist, and again once fonts/images settle */
ScrollTrigger.refresh();
window.addEventListener('load', () => ScrollTrigger.refresh());

/* if the 3D module never booted (old browser, blocked script), fall back gracefully */
setTimeout(() => {
  const canvas = document.getElementById('webgl');
  const hero = document.getElementById('hero');
  if (canvas && hero && !canvas.dataset.booted) {
    hero.classList.add('webgl-fallback');
  }
}, 2500);

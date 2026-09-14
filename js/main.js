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

/* ================= GALLERY CAROUSEL ================= */
(function galleryCarousel() {
  const track = document.getElementById('gallery-track');
  if (!track) return;
  const prev = document.getElementById('gallery-prev');
  const next = document.getElementById('gallery-next');
  const step = () => (track.querySelector('.gallery-slide')?.getBoundingClientRect().width || 320) + 20;
  next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
})();

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

/* ================= COMPETITION DETAILS MODAL ================= */
(function initCompModal() {
  const modal = document.getElementById('comp-modal');
  const box = document.getElementById('comp-modal-box');
  const closeBtn = document.getElementById('comp-modal-close');
  const cancelBtn = document.getElementById('comp-modal-cancel');
  const actionBtn = document.getElementById('modal-action-btn');
  if (!modal || !box) return;

  const COMPETITIONS_DATA = {
    1: {
      num: "01",
      tag: "AERIAL RACE",
      title: "TINYWHOOP DRONE RACE",
      org: "CATCITY DRONE RACING",
      theme: "cyan",
      highlight: "Race FPV micro drones under and through Tiny Whoop gates — the fastest lap wins!",
      description: "High-speed indoor drone racing showdown. Pilots fly ultra-lightweight micro quadcopters (Tiny Whoops) equipped with FPV cameras through illuminated obstacle gates, tight chicanes, and technical elevation changes. The fastest qualifier and knockout heats take the podium.",
      format: "Time-trial qualification heats leading to double-elimination bracket finals.",
      hardware: "Micro FPV Tiny Whoop quadcopters (ducted frame, analog / digital FPV).",
      prizes: { total: "RM 2,850", p1: "RM 1,450", p2: "RM 850", p3: "RM 550" },
      isPrereg: false
    },
    2: {
      num: "02",
      tag: "AERIAL · EDU",
      title: "EDUCATIONAL DRONE CHALLENGE",
      org: "DRONESKAKI SARAWAK",
      theme: "cyan",
      highlight: "Program and code autonomous drones to complete intricate aerial flight missions hands-free.",
      description: "An autonomous flight and algorithmic coding arena. Teams program indoor educational drones to autonomously take off, recognize visual markers, navigate 3D space, and execute precise mission tasks without manual remote control. Evaluated on code efficiency, task accuracy, and execution speed.",
      format: "Script-based mission runs with timed autonomous flight execution.",
      hardware: "Programmable educational quadcopters (Python / Block coding compatible).",
      prizes: { total: "RM 2,850", p1: "RM 1,450", p2: "RM 850", p3: "RM 550" },
      isPrereg: false
    },
    3: {
      num: "03",
      tag: "AERIAL SPORT",
      title: "DRONE SOCCER CHALLENGE",
      org: "AKSADRON",
      theme: "cyan",
      highlight: "High-octane aerial soccer played in a netted arena with spherical caged drones.",
      description: "A fast-paced aerial esports clash where teams fly 360° protective mesh-caged drones inside a dedicated arena. Striker drones attempt to pierce through the opponent's suspended circular goal ring while defenders block, collide mid-air, and hold defensive formations.",
      format: "3v3 team matches with 3-minute periods, group stages to knockout finals.",
      hardware: "Standard spherical protective cage soccer drones (20cm / 30cm class).",
      prizes: { total: "RM 2,850", p1: "RM 1,450", p2: "RM 850", p3: "RM 550" },
      isPrereg: false
    },
    4: {
      num: "04",
      tag: "GROUND SPORT",
      title: "ROBOSOCCER COMPETITION",
      org: "LIGHTHOUSE OF HOPE",
      theme: "cyan",
      highlight: "Play competitive tactical soccer using customized Makeblock mBot2 ground robots.",
      description: "Teams maneuver CyberPi-powered mBot2 robots equipped with ball-control pushers on an enclosed pitch. Pilot your robot squad in real time to dribble, tackle, pass, and shoot past the opponent's goalkeeper into the net. Demands fast wireless driving, pitch strategy, and synchronized teamwork.",
      format: "Round-robin group matches leading to sudden-death elimination stages.",
      hardware: "Makeblock mBot2 platform with approved mechanical dribblers / ball bumpers.",
      prizes: { total: "RM 2,850", p1: "RM 1,450", p2: "RM 850", p3: "RM 550" },
      isPrereg: false
    },
    5: {
      num: "05",
      tag: "COMBAT",
      title: "BORNEO BATTLEBOTS",
      org: "TCIL",
      theme: "red",
      highlight: "Modify mBot2 chassis for heavy combat to deliver sumo attacks and push rivals out of the ring.",
      description: "The arena where mechanical engineering meets combat aggression. Builders customize and reinforce mBot2 platforms with specialized sumo wedges, armor plating, and traction upgrades to dominate the combat circle. Slam, out-leverage, and push opposing robots completely out of the arena to score victory.",
      format: "1v1 robot sumo elimination bouts inside the official battle ring.",
      hardware: "Modified Makeblock mBot2 platforms adhering to weight, dimension & safety specs.",
      prizes: { total: "RM 2,850", p1: "RM 1,450", p2: "RM 850", p3: "RM 550" },
      isPrereg: false
    },
    6: {
      num: "06",
      tag: "AUTONOMOUS",
      title: "RERO:MICRO ROBOT COMP",
      org: "TCIL",
      theme: "cyan",
      highlight: "Code autonomous micro:bit robots to navigate intricate track obstacles and sensory puzzles.",
      description: "A test of algorithmic robotics. Competitors code micro:bit-powered rero:micro mobile robots to autonomously negotiate an obstacle-heavy track. Robots must utilize optical line sensors, ultrasonic rangefinders, and custom logic to conquer tight chicanes, dynamic barriers, and precision stop zones.",
      format: "Timed autonomous track trials scored on accuracy, autonomy, and speed.",
      hardware: "rero:micro educational robot kit powered by BBC micro:bit.",
      prizes: { total: "RM 2,850", p1: "RM 1,450", p2: "RM 850", p3: "RM 550" },
      isPrereg: false
    },
    7: {
      num: "07",
      tag: "INNOVATION",
      title: "DROBOTEX INNOVATION CHALLENGE",
      org: "TCIL",
      theme: "cyan",
      highlight: "Build and engineer original LEGO robotic inventions — the most creative solution wins!",
      description: "Open robotics and creative engineering showcase. Teams design, assemble, and program innovative robotic machines using LEGO robotics platforms to solve real-world community or industry challenges. Judged on creativity, engineering mechanics, software functionality, and live stage presentation.",
      format: "Live booth exhibition, prototype demonstration, and panel judging session.",
      hardware: "LEGO Mindstorms (EV3 / Robot Inventor) / LEGO SPIKE Prime / compatible kits.",
      prizes: { total: "RM 1,300", p1: "RM 700", p2: "RM 400", p3: "RM 200" },
      isPrereg: false
    },
    8: {
      num: "08",
      tag: "CODING",
      title: "SCRATCHATHON",
      org: "STEMGROUND",
      theme: "cyan",
      highlight: "Fast-paced creative Scratch coding hackathon — reserved exclusively for pre-registered participants.",
      description: "An intensive on-site creative coding sprint using MIT Scratch. Participants receive a surprise theme and must brainstorm, design mechanics, code algorithms, and animate an original interactive project within the countdown clock.",
      format: "Closed Invitational / Cohort Sprint — strictly reserved for pre-registered participants.",
      hardware: "Scratch 3.0 programming environment (laptops / tablets).",
      prizes: null,
      isPrereg: true,
      preregNote: "RESERVED FOR PRE-REGISTERED PARTICIPANTS"
    },
    9: {
      num: "09",
      tag: "ROBOTICS",
      title: "XYRO ROBOT COMPETITION",
      org: "STEMGROUND",
      theme: "cyan",
      highlight: "Specialized tactical robotics tournament — reserved exclusively for pre-registered participants.",
      description: "A precision tactical tournament spotlighting the XYRO educational robotics ecosystem. Cohort teams assemble custom XYRO bot configurations to navigate tactical challenges, payload deliveries, and agility courses developed exclusively for qualifying teams.",
      format: "Closed Invitational Tournament — strictly reserved for pre-registered cohort participants.",
      hardware: "Official XYRO Robot System & specialized arena components.",
      prizes: { total: "RM 2,000", p1: "RM 800", p2: "RM 500", p3: "RM 300", consolation: "RM 200 (×2)" },
      isPrereg: true,
      preregNote: "RESERVED FOR PRE-REGISTERED PARTICIPANTS"
    }
  };

  let isAnimating = false;

  function openModal(id) {
    const data = COMPETITIONS_DATA[id];
    if (!data || isAnimating) return;

    // Populate data
    document.getElementById('modal-num-badge').textContent = `ARENA // ${data.num}`;
    document.getElementById('modal-tag').textContent = data.tag;
    document.getElementById('modal-title').textContent = data.title;
    document.getElementById('modal-org').textContent = data.org;
    document.getElementById('modal-highlight').textContent = data.highlight;
    document.getElementById('modal-desc').textContent = data.description;
    document.getElementById('modal-format').textContent = data.format;
    document.getElementById('modal-hardware').textContent = data.hardware;

    // Theme color adjustments (red for Battlebots, cyan for others)
    const isRed = data.theme === 'red';
    box.classList.toggle('border-red-glow', isRed);
    const numBadge = document.getElementById('modal-num-badge');
    const orgSpan = document.getElementById('modal-org');
    const highlightBox = document.getElementById('modal-highlight-box');
    const highlightIcon = highlightBox.querySelector('span:first-child');
    const highlightTitle = highlightBox.querySelector('span:last-child');
    const actionBtn = document.getElementById('modal-action-btn');

    if (isRed) {
      numBadge.className = 'px-2 py-0.5 border border-red/60 text-red bg-red/10 font-bold';
      orgSpan.className = 'text-red font-bold';
      highlightBox.className = 'mb-6 p-4 border border-red/40 bg-panel/60 relative overflow-hidden';
      highlightIcon.className = 'w-1.5 h-1.5 bg-red rotate-45';
      highlightTitle.className = 'text-red';
      if (actionBtn) actionBtn.className = 'btn-glitch inline-flex items-center border border-red px-6 py-3 text-red font-mono text-xs tracking-[0.25em] cursor-pointer';
    } else {
      numBadge.className = 'px-2 py-0.5 border border-cyan/60 text-cyan bg-cyan/10 font-bold';
      orgSpan.className = 'text-cyan font-bold';
      highlightBox.className = 'mb-6 p-4 border border-cyan/40 bg-panel/60 relative overflow-hidden';
      highlightIcon.className = 'w-1.5 h-1.5 bg-cyan rotate-45';
      highlightTitle.className = 'text-cyan';
      if (actionBtn) actionBtn.className = 'btn-glitch inline-flex items-center border border-cyan px-6 py-3 text-cyan font-mono text-xs tracking-[0.25em] cursor-pointer';
    }

    // Prizes handling
    const prizesSec = document.getElementById('modal-prizes-section');
    const prizeGrid = document.getElementById('modal-prizes-grid');
    const preregNotice = document.getElementById('modal-prereg-notice');
    const consolationRow = document.getElementById('modal-consolation');
    const prizeTotal = document.getElementById('modal-prize-total');

    if (data.prizes) {
      prizesSec.classList.remove('hidden');
      prizeGrid.classList.remove('hidden');
      prizeTotal.classList.remove('hidden');
      prizeTotal.textContent = `TOTAL ${data.prizes.total}`;
      document.getElementById('modal-prize-1').textContent = data.prizes.p1;
      document.getElementById('modal-prize-2').textContent = data.prizes.p2;
      document.getElementById('modal-prize-3').textContent = data.prizes.p3;

      if (data.prizes.consolation) {
        consolationRow.classList.remove('hidden');
        consolationRow.classList.add('flex');
        document.getElementById('modal-consolation-val').textContent = data.prizes.consolation;
      } else {
        consolationRow.classList.add('hidden');
        consolationRow.classList.remove('flex');
      }
    } else {
      prizeGrid.classList.add('hidden');
      prizeTotal.classList.add('hidden');
      consolationRow.classList.add('hidden');
      consolationRow.classList.remove('flex');
    }

    if (data.isPrereg) {
      preregNotice.classList.remove('hidden');
      document.getElementById('modal-action-text').textContent = 'VIEW REGISTRATION TRACKS ↗';
    } else {
      preregNotice.classList.add('hidden');
      document.getElementById('modal-action-text').textContent = 'REGISTER FOR ARENA ↗';
    }

    // Open native dialog
    if (typeof modal.showModal === 'function') {
      modal.showModal();
    } else {
      modal.setAttribute('open', '');
    }
    document.body.style.overflow = 'hidden';

    // GSAP display pop-up animation
    isAnimating = true;
    gsap.fromTo(box,
      { opacity: 0, scale: 0.90, y: 35 },
      { opacity: 1, scale: 1, y: 0, duration: 0.38, ease: 'back.out(1.4)', onComplete: () => { isAnimating = false; } }
    );
  }

  function closeModal() {
    if ((!modal.open && !modal.hasAttribute('open')) || isAnimating) return;
    isAnimating = true;
    gsap.to(box, {
      opacity: 0,
      scale: 0.92,
      y: 20,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        if (typeof modal.close === 'function') {
          try { modal.close(); } catch(e) {}
        }
        modal.removeAttribute('open');
        document.body.style.overflow = '';
        isAnimating = false;
      }
    });
  }

  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  modal.addEventListener('cancel', e => {
    e.preventDefault();
    closeModal();
  });

  actionBtn?.addEventListener('click', () => {
    closeModal();
    setTimeout(() => {
      const regSection = document.getElementById('register');
      if (regSection) {
        regSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 240);
  });

  document.querySelectorAll('.comp-card[data-comp-id]').forEach(card => {
    let downX = 0, downY = 0;
    card.addEventListener('mousedown', e => { downX = e.clientX; downY = e.clientY; });
    card.addEventListener('mouseup', e => {
      const dx = Math.abs(e.clientX - downX);
      const dy = Math.abs(e.clientY - downY);
      if (dx < 8 && dy < 8) {
        const id = card.getAttribute('data-comp-id');
        openModal(id);
      }
    });
    let touchStartX = 0, touchStartY = 0;
    card.addEventListener('touchstart', e => {
      if (e.touches[0]) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });
    card.addEventListener('touchend', e => {
      if (e.changedTouches[0]) {
        const dx = Math.abs(e.changedTouches[0].clientX - touchStartX);
        const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
        if (dx < 12 && dy < 12) {
          const id = card.getAttribute('data-comp-id');
          openModal(id);
        }
      }
    });
  });
})();

'use strict';

/* =============================================================
   BACKGROUND — floating hearts & sparkles
   ============================================================= */
(function () {
  const cvs = document.getElementById('bg-canvas');
  const ctx = cvs.getContext('2d');
  const N = 32;
  const parts = [];

  function resize() {
    cvs.width  = window.innerWidth;
    cvs.height = window.innerHeight;
  }

  function rnd(a, b) { return a + Math.random() * (b - a); }

  class Particle {
    constructor(randomY) { this.reset(randomY); }

    reset(randomY) {
      this.x     = rnd(0, cvs.width);
      this.y     = randomY ? rnd(0, cvs.height) : cvs.height + 20;
      this.r     = rnd(4, 9);
      this.vy    = rnd(.07, .25);
      this.vx    = rnd(-.1, .1);
      this.alpha = 0;
      this.maxA  = rnd(.07, .2);
      this.up    = true;
      this.type  = Math.random() > .42 ? 'heart' : 'star';
      this.rot   = rnd(0, Math.PI * 2);
      this.drot  = rnd(-.007, .007);
    }

    step() {
      this.y   -= this.vy;
      this.x   += this.vx;
      this.rot += this.drot;
      if (this.up) {
        this.alpha += .0025;
        if (this.alpha >= this.maxA) { this.alpha = this.maxA; this.up = false; }
      } else {
        this.alpha -= .0012;
      }
      if (this.alpha <= 0 || this.y < -20) this.reset(false);
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);

      if (this.type === 'heart') {
        const s = this.r;
        ctx.fillStyle = 'rgba(212,122,158,1)';
        ctx.beginPath();
        ctx.moveTo(0, s * .25);
        ctx.bezierCurveTo(0, 0, -s*.5, 0, -s*.5, s*.3);
        ctx.bezierCurveTo(-s*.5, s*.62, 0, s*.92, 0, s);
        ctx.bezierCurveTo(0, s*.92, s*.5, s*.62, s*.5, s*.3);
        ctx.bezierCurveTo(s*.5, 0, 0, 0, 0, s*.25);
        ctx.fill();
      } else {
        const s = this.r * .52;
        ctx.strokeStyle = 'rgba(200,164,78,1)';
        ctx.lineWidth = .65;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2;
          const b = ((i + .5) / 4) * Math.PI * 2;
          ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
          ctx.lineTo(Math.cos(b) * s * .32, Math.sin(b) * s * .32);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function init() {
    parts.length = 0;
    for (let i = 0; i < N; i++) parts.push(new Particle(true));
  }

  function loop() {
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    parts.forEach(p => { p.step(); p.draw(); });
    requestAnimationFrame(loop);
  }

  resize(); init(); loop();
  window.addEventListener('resize', () => { resize(); init(); });
})();

/* =============================================================
   SCREEN MANAGER
   ============================================================= */
let currentScreen = 1;

function goTo(n) {
  const from = document.getElementById('screen-' + currentScreen);
  const to   = document.getElementById('screen-' + n);

  if (currentScreen === 1) resetNoBtn();

  from.classList.add('leaving');
  setTimeout(() => {
    from.classList.remove('active', 'leaving');
    to.classList.add('active');
    currentScreen = n;
  }, 450);
}

/* =============================================================
   SCREEN 1 — "NO" BUTTON ESCAPE
   ============================================================= */
(function () {
  const btnYes = document.getElementById('btn-yes');
  const btnNo  = document.getElementById('btn-no');

  btnYes.addEventListener('click', () => goTo(2));

  /* --- position helpers --- */
  function safePos() {
    const bw = btnNo.offsetWidth  + 10;
    const bh = btnNo.offsetHeight + 10;
    const pw = window.innerWidth;
    const ph = window.innerHeight;
    const margin = 16;
    return {
      nx: margin + Math.random() * (pw - bw - margin * 2),
      ny: margin + Math.random() * (ph - bh - margin * 2)
    };
  }

  function flyAway() {
    /* First call: anchor to current visual position (no animation yet) */
    if (btnNo.style.position !== 'fixed') {
      const r = btnNo.getBoundingClientRect();
      btnNo.style.transition = 'none';
      btnNo.style.position   = 'fixed';
      btnNo.style.margin     = '0';
      btnNo.style.zIndex     = '999';
      btnNo.style.left       = r.left + 'px';
      btnNo.style.top        = r.top  + 'px';
      btnNo.style.width      = r.width + 'px';
    }
    /* Next frame: animate to new position */
    requestAnimationFrame(() => {
      btnNo.style.transition = 'left .34s cubic-bezier(0.22,1,0.36,1), top .34s cubic-bezier(0.22,1,0.36,1)';
      const { nx, ny } = safePos();
      btnNo.style.left = nx + 'px';
      btnNo.style.top  = ny + 'px';
    });
  }

  const isTouch = window.matchMedia('(hover: none)').matches;

  if (!isTouch) {
    /* Desktop: flee when cursor gets close */
    const FLEE = 130;
    document.addEventListener('mousemove', e => {
      if (currentScreen !== 1) return;
      const r  = btnNo.getBoundingClientRect();
      const cx = r.left + r.width  / 2;
      const cy = r.top  + r.height / 2;
      if (Math.hypot(e.clientX - cx, e.clientY - cy) < FLEE) flyAway();
    });
  } else {
    /* Mobile: tap teleports the button */
    btnNo.addEventListener('touchstart', e => {
      e.preventDefault();
      flyAway();
    }, { passive: false });
    btnNo.addEventListener('click', e => {
      e.preventDefault();
      flyAway();
    });
  }

  /* expose reset for screen transitions */
  window.resetNoBtn = function () {
    btnNo.style.cssText = '';
  };
})();

/* =============================================================
   SCREEN 2
   ============================================================= */
document.getElementById('btn-s2').addEventListener('click', () => goTo(3));

/* =============================================================
   SCREEN 3 — PLACE CARDS + DATE/TIME
   ============================================================= */
(function () {
  let selectedPlace = null;

  const dateInp = document.getElementById('inp-date');
  const timeInp = document.getElementById('inp-time');
  const dtWrap  = document.getElementById('dt-wrap');

  /* sensible defaults */
  const today = new Date().toISOString().slice(0, 10);
  dateInp.min   = today;
  dateInp.value = today;
  timeInp.value = '19:00';

  /* Place card selection */
  document.querySelectorAll('.place-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.place-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedPlace = card.dataset.value;

      if (!dtWrap.classList.contains('visible')) {
        dtWrap.classList.add('visible');
        setTimeout(() => {
          dtWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 60);
      }
    });
  });

  /* Submit */
  document.getElementById('btn-submit').addEventListener('click', () => {
    if (!selectedPlace) {
      shake(document.getElementById('place-grid'));
      return;
    }
    const dv = dateInp.value;
    const tv = timeInp.value;
    if (!dv) { shake(dateInp); return; }
    if (!tv) { shake(timeInp); return; }

    const dateObj  = new Date(dv + 'T00:00:00');
    const dateFmt  = dateObj.toLocaleDateString('ru-RU', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    /* capitalise first letter */
    const dateStr = dateFmt.charAt(0).toUpperCase() + dateFmt.slice(1);

    const data = { place: selectedPlace, date: dateStr, time: tv };

    try { localStorage.setItem('dateInvite', JSON.stringify(data)); } catch (_) {}

    fillSummary(data);
    goTo(4);
    setTimeout(launchConfetti, 720);
  });
})();

/* =============================================================
   SUMMARY FILL
   ============================================================= */
function fillSummary(data) {
  document.getElementById('s-place').textContent = data.place || '—';
  document.getElementById('s-date').textContent  = data.date  || '—';
  document.getElementById('s-time').textContent  = data.time  || '—';
}

/* Restore on page load */
(function () {
  try {
    const raw = localStorage.getItem('dateInvite');
    if (raw) fillSummary(JSON.parse(raw));
  } catch (_) {}
})();

/* =============================================================
   SHAKE UTILITY
   ============================================================= */
function shake(el) {
  el.classList.remove('shaking');
  void el.offsetWidth;
  el.classList.add('shaking');
  el.addEventListener('animationend', () => el.classList.remove('shaking'), { once: true });
}

/* =============================================================
   CONFETTI
   ============================================================= */
(function () {
  const cvs = document.getElementById('confetti-canvas');
  const ctx = cvs.getContext('2d');
  let pieces = [];
  let spawning = false;

  function resize() {
    cvs.width  = window.innerWidth;
    cvs.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function rnd(a, b) { return a + Math.random() * (b - a); }

  const COLORS = ['#c8a44e','#e5c97a','#d47a96','#f2b8cc','#a8d8c0','#c4a8e0','#f5e2c2'];

  class Piece {
    constructor() {
      this.x     = rnd(0, cvs.width);
      this.y     = rnd(-80, -10);
      this.w     = rnd(5, 12);
      this.h     = rnd(4, 7);
      this.vy    = rnd(2, 4.5);
      this.vx    = rnd(-1.8, 1.8);
      this.rot   = rnd(0, Math.PI * 2);
      this.drot  = rnd(-.1, .1);
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.alpha = 1;
      this.heart = Math.random() > .6;
    }

    step() {
      this.y   += this.vy;
      this.x   += this.vx;
      this.rot += this.drot;
      this.vx  += rnd(-.02, .02);
      if (this.y > cvs.height * .7) this.alpha -= .024;
    }

    draw() {
      if (this.alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.fillStyle   = this.color;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);

      if (this.heart) {
        const s = this.w * .48;
        ctx.beginPath();
        ctx.moveTo(0, s * .3);
        ctx.bezierCurveTo(0,0,-s,0,-s,s*.4);
        ctx.bezierCurveTo(-s,s*.85,0,s*1.25,0,s*1.6);
        ctx.bezierCurveTo(0,s*1.25,s,s*.85,s,s*.4);
        ctx.bezierCurveTo(s,0,0,0,0,s*.3);
        ctx.fill();
      } else {
        ctx.fillRect(-this.w/2, -this.h/2, this.w, this.h);
      }
      ctx.restore();
    }

    dead() { return this.alpha <= 0; }
  }

  function loop() {
    if (!spawning && pieces.length === 0) {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      return;
    }
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    pieces = pieces.filter(p => !p.dead());
    pieces.forEach(p => { p.step(); p.draw(); });
    requestAnimationFrame(loop);
  }

  window.launchConfetti = function () {
    pieces = [];
    spawning = true;

    let count = 0;
    const total   = 120;
    const perTick = 7;
    const id = setInterval(() => {
      for (let i = 0; i < perTick; i++) pieces.push(new Piece());
      count += perTick;
      if (count >= total) { clearInterval(id); spawning = false; }
    }, 75);

    loop();
  };
})();

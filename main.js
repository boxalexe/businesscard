/* ============================================
   HINTERGRUND-NEBEL — weiche Cyan/Grün-Schwaden,
   die der Maus ausweichen. Sehr dezent gehalten.
   ============================================ */
(function () {
  const canvas = document.getElementById('fogCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Zwei Farbtöne, bewusst schwach
  const COLORS = ['34, 211, 238', '61, 220, 132']; // cyan, grün

  const COUNT = 9;
  const blobs = [];
  for (let i = 0; i < COUNT; i++) {
    blobs.push({
      x: Math.random() * W,
      y: Math.random() * H,
      ox: 0, oy: 0,                                  // Verdrängungs-Offset durch die Maus
      r: 160 + Math.random() * 240,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      c: COLORS[i % 2],
      a: 0.030 + Math.random() * 0.028
    });
  }

  const mouse = { x: -99999, y: -99999 };
  if (window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('mousemove', e => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });
    document.addEventListener('mouseleave', () => {
      mouse.x = -99999;
      mouse.y = -99999;
    });
  }

  function step() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    for (const b of blobs) {
      // langsames Treiben
      b.x += b.vx;
      b.y += b.vy;

      // Ränder: sanft umschlagen
      if (b.x < -b.r) b.x = W + b.r;
      if (b.x > W + b.r) b.x = -b.r;
      if (b.y < -b.r) b.y = H + b.r;
      if (b.y > H + b.r) b.y = -b.r;

      // Verdrängung durch die Maus (mit Rückstellfeder)
      const dx = (b.x + b.ox) - mouse.x;
      const dy = (b.y + b.oy) - mouse.y;
      const dist = Math.hypot(dx, dy);
      const range = b.r * 0.85;

      if (dist < range && dist > 0.5) {
        const push = (1 - dist / range) * 5.5;
        b.ox += (dx / dist) * push;
        b.oy += (dy / dist) * push;
      }
      // zurück zur Ruhelage
      b.ox *= 0.94;
      b.oy *= 0.94;

      const px = b.x + b.ox;
      const py = b.y + b.oy;
      const g = ctx.createRadialGradient(px, py, 0, px, py, b.r);
      g.addColorStop(0, 'rgba(' + b.c + ',' + b.a + ')');
      g.addColorStop(1, 'rgba(' + b.c + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, b.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!reduced) requestAnimationFrame(step);
  }
  step();
})();

/* ============================================
   CURSOR — reiner Dot, 1:1
   ============================================ */
const dot = document.getElementById('cursorDot');

if (dot && window.matchMedia('(hover: hover)').matches) {
  document.addEventListener('mousemove', e => {
    dot.style.left = e.clientX + 'px';
    dot.style.top  = e.clientY + 'px';
  }, { passive: true });

  document.querySelectorAll('a, button, .projekt:not(.projekt--wip), .social-link, .pillar-head, .a11y-toggle, .a11y-opt, #scrollTopBtn, .imp-toggle').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('c-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('c-hover'));
  });
}

/* ============================================
   NAV SCROLL
   ============================================ */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

/* ============================================
   DREI SÄULEN — ein Panel offen, die anderen
   auf einen schmalen, vertikal beschrifteten
   Streifen reduziert.
   ============================================ */
const pillarsRow = document.getElementById('pillarsRow');
const pillars = Array.from(document.querySelectorAll('.pillar'));

function openPillar(name, scrollIntoView) {
  const target = pillars.find(p => p.dataset.pillar === name);

  pillars.forEach(p => {
    const isTarget = p.dataset.pillar === name;
    p.classList.toggle('is-open', isTarget);
    p.querySelector('.pillar-head').setAttribute('aria-expanded', isTarget ? 'true' : 'false');
  });
  pillarsRow.classList.add('has-open');
  updateActiveNav();

  // Nur in der mobilen Stapel-Ansicht (Layout wechselt bei 900px) den geöffneten
  // Kopf in den sichtbaren Bereich holen. Wichtig: erst NACHDEM die max-height-
  // Aufklapp-Animation des Body durch ist, sonst wird zur halben Höhe gescrollt.
  if (scrollIntoView && target && window.matchMedia('(max-width: 900px)').matches) {
    const doScroll = () => {
      const navEl = document.getElementById('nav');
      const navH = navEl ? navEl.getBoundingClientRect().height : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - navH - 12;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    };
    const body = target.querySelector('.pillar-body');
    if (body) {
      let done = false;
      const finish = () => { if (done) return; done = true; body.removeEventListener('transitionend', onEnd); doScroll(); };
      const onEnd = (e) => { if (e.propertyName === 'max-height') finish(); };
      body.addEventListener('transitionend', onEnd);
      // Fallback, falls transitionend nicht feuert (z. B. reduzierte Bewegung)
      setTimeout(finish, 700);
    } else {
      requestAnimationFrame(doScroll);
    }
  }
}

pillars.forEach(p => {
  p.querySelector('.pillar-head').addEventListener('click', () => {
    if (p.classList.contains('is-open')) return; // bereits offen, kein Zuklappen ohne Ersatz
    openPillar(p.dataset.pillar, true);
  });
});

/* ============================================
   NAV-LINKS ÖFFNEN DIE PASSENDE SÄULE
   ============================================ */
document.querySelectorAll('.nav-links a[data-open-pillar]').forEach(a => {
  a.addEventListener('click', () => openPillar(a.dataset.openPillar, true));
});

/* ============================================
   SCROLL REVEAL
   ============================================ */
const revObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      revObs.unobserve(e.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));

/* ============================================
   ACTIVE NAV — folgt Scroll-Position und
   dem aktuell offenen Panel
   ============================================ */
const navAs = document.querySelectorAll('.nav-links a');
const kontaktSection = document.getElementById('kontakt');
const pillarsSection = document.getElementById('pillars');

function updateActiveNav() {
  const openPillar = document.querySelector('.pillar.is-open');
  navAs.forEach(a => a.classList.remove('active'));
  const scrollMid = window.scrollY + window.innerHeight / 2;
  const kontaktTop = kontaktSection.offsetTop;

  if (scrollMid >= kontaktTop) {
    const kontaktLink = Array.from(navAs).find(a => a.getAttribute('href') === '#kontakt');
    if (kontaktLink) kontaktLink.classList.add('active');
  } else if (openPillar) {
    const link = Array.from(navAs).find(a => a.dataset.openPillar === openPillar.dataset.pillar);
    if (link) link.classList.add('active');
  }
}

window.addEventListener('scroll', updateActiveNav, { passive: true });
updateActiveNav();

/* ============================================
   KONTAKT FORMULAR — HONEYPOT + TIMING
   ============================================ */
const form   = document.getElementById('kontaktForm');
const fmsg   = document.getElementById('fmsg');
const fbtn   = document.getElementById('fbtn');
const tsEl   = document.getElementById('form_ts');

if (tsEl) tsEl.value = Date.now();
// Nach Zurück-Navigation (bfcache) den Startzeitpunkt frisch setzen,
// damit die Timing-Prüfung nicht mit einem veralteten Wert arbeitet.
window.addEventListener('pageshow', () => { if (tsEl) tsEl.value = Date.now(); });

if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    fmsg.textContent = '';
    fmsg.className = 'fmsg';

    // Honeypot
    const hp1 = document.getElementById('hp_web');
    const hp2 = document.getElementById('hp_tel');
    if ((hp1 && hp1.value) || (hp2 && hp2.value)) {
      fakeSuccess(); return;
    }

    // Timing — nur greifen, wenn ein gültiger Startzeitpunkt existiert.
    // Ohne gesetzten Timestamp (z. B. nach bfcache-Restore) NICHT blockieren.
    const started = parseInt(tsEl && tsEl.value ? tsEl.value : 0, 10);
    if (started && Date.now() - started < 2000) {
      fakeSuccess(); return;
    }

    // Validation
    const name    = document.getElementById('f_name');
    const email   = document.getElementById('f_email');
    const subject = document.getElementById('f_subject');
    const msg     = document.getElementById('f_msg');

    [name, email, subject, msg].forEach(f => f.classList.remove('err'));
    let ok = true;

    if (!name.value.trim())                              { name.classList.add('err');  ok = false; }
    if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { email.classList.add('err'); ok = false; }
    if (msg.value.trim().length < 10)                   { msg.classList.add('err');   ok = false; }

    if (!ok) {
      fmsg.textContent = 'Pflichtfelder prüfen.';
      fmsg.className = 'fmsg err';
      return;
    }

    fbtn.disabled = true;
    document.querySelector('.fbtn-text').textContent = 'Wird gesendet...';

    try {
      const endpoint = form.dataset.endpoint || '';
      if (endpoint) {
        const fd = new FormData();
        fd.append('name',    name.value.trim());
        fd.append('email',   email.value.trim());
        fd.append('subject', subject.value.trim());
        fd.append('message', msg.value.trim());
        const res = await fetch(endpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error();
      } else {
        await new Promise(r => setTimeout(r, 700));
      }
      showSuccess();
    } catch {
      fmsg.textContent = 'Fehler. Bitte erneut versuchen.';
      fmsg.className = 'fmsg err';
      fbtn.disabled = false;
      document.querySelector('.fbtn-text').textContent = 'Senden';
    }
  });
}

function showSuccess() {
  form.reset();
  if (tsEl) tsEl.value = Date.now();
  fmsg.textContent = 'Nachricht gesendet. Ich melde mich.';
  fmsg.className = 'fmsg ok';
  fbtn.disabled = false;
  document.querySelector('.fbtn-text').textContent = 'Senden';
  if (window.runMatrixGlitch) window.runMatrixGlitch('Nachricht gesendet');
}

function fakeSuccess() {
  fmsg.textContent = 'Nachricht gesendet. Ich melde mich.';
  fmsg.className = 'fmsg ok';
  form.reset();
}

/* ============================================
   BARRIEREFREIHEIT — Kontrast-Umschalter (Auge)
   Übernommen aus L8A, an Portfolio angepasst.
   ============================================ */
(function () {
  const toggle = document.getElementById('a11yToggle');
  const menu = document.getElementById('a11yMenu');
  if (!toggle || !menu) return;
  const opts = menu.querySelectorAll('.a11y-opt');
  const STORE_KEY = 'box_theme';

  function currentTheme() {
    try { return localStorage.getItem(STORE_KEY) || 'default'; } catch (e) { return 'default'; }
  }
  function markActive(theme) {
    opts.forEach(o => o.classList.toggle('active', o.dataset.theme === theme));
  }
  function applyTheme(theme) {
    if (theme === 'default') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORE_KEY, theme); } catch (e) {}
    markActive(theme);
  }
  function openMenu() { menu.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); }
  function closeMenu() { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }

  // Beim Laden gespeichertes Theme anwenden
  applyTheme(currentTheme());

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.contains('open') ? closeMenu() : openMenu();
  });
  opts.forEach(o => {
    o.addEventListener('click', () => { applyTheme(o.dataset.theme); closeMenu(); });
  });
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && e.target !== toggle) closeMenu();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
})();

/* ============================================
   SCROLL TO TOP
   ============================================ */
const scrollTopBtn = document.getElementById('scrollTopBtn');
if (scrollTopBtn) {
  let ticking = false;
  function update() {
    ticking = false;
    if (window.scrollY > 400) scrollTopBtn.classList.add('show');
    else scrollTopBtn.classList.remove('show');
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================
   IMPRESSUM — auf-/zuklappen
   ============================================ */
const impToggle = document.getElementById('impToggle');
const impBody = document.getElementById('impBody');
if (impToggle && impBody) {
  impToggle.addEventListener('click', () => {
    const open = impBody.hasAttribute('hidden');
    if (open) { impBody.removeAttribute('hidden'); impToggle.setAttribute('aria-expanded', 'true'); }
    else { impBody.setAttribute('hidden', ''); impToggle.setAttribute('aria-expanded', 'false'); }
    impToggle.classList.toggle('is-open', open);
  });
}

/* ============================================
   GLITCH FLASH — dezenter Effekt bei Versand.
   Ein paar transparente Magenta-Glitch-Slices,
   die kurz aufflackern und wieder verschwinden.
   Kein Vollbild, kein Regen.
   ============================================ */
window.runMatrixGlitch = (function () {
  const flash = document.getElementById('glitchFlash');
  if (!flash) return function () {};
  const bars = Array.from(flash.querySelectorAll('.glitch-bar'));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let running = false;

  function run() {
    if (running) return;
    running = true;
    flash.classList.add('active');

    if (reduced) {
      // Nur ein kurzes, ruhiges Aufblinken
      flash.classList.add('reduced');
      setTimeout(end, 400);
      return;
    }

    // Jeder Balken bekommt zufällige Höhe, Position und Timing,
    // damit das Flackern unregelmäßig und lebendig wirkt.
    bars.forEach((bar, i) => {
      const h = 2 + Math.random() * 10;                 // dünne Slices
      const top = Math.random() * 100;                  // vertikale Position in %
      const delay = Math.random() * 320;                // gestaffeltes Auftreten
      const shift = (Math.random() - 0.5) * 14;         // horizontaler Versatz
      bar.style.height = h + 'px';
      bar.style.top = top + '%';
      bar.style.setProperty('--shift', shift + 'px');
      bar.style.animationDelay = delay + 'ms';
      bar.classList.remove('go');
      // Reflow erzwingen, damit die Animation neu startet
      void bar.offsetWidth;
      bar.classList.add('go');
    });

    setTimeout(end, 900);
  }

  function end() {
    flash.classList.remove('active', 'reduced');
    bars.forEach(b => b.classList.remove('go'));
    running = false;
  }

  return run;
})();

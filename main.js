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

  document.querySelectorAll('a, button, .projekt:not(.projekt--wip), .social-link, .pillar-head').forEach(el => {
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

function openPillar(name) {
  pillars.forEach(p => {
    const isTarget = p.dataset.pillar === name;
    p.classList.toggle('is-open', isTarget);
    p.querySelector('.pillar-head').setAttribute('aria-expanded', isTarget ? 'true' : 'false');
  });
  pillarsRow.classList.add('has-open');
  updateActiveNav();
}

pillars.forEach(p => {
  p.querySelector('.pillar-head').addEventListener('click', () => {
    if (p.classList.contains('is-open')) return; // bereits offen, kein Zuklappen ohne Ersatz
    openPillar(p.dataset.pillar);
  });
});

/* ============================================
   NAV-LINKS ÖFFNEN DIE PASSENDE SÄULE
   ============================================ */
document.querySelectorAll('.nav-links a[data-open-pillar]').forEach(a => {
  a.addEventListener('click', () => openPillar(a.dataset.openPillar));
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

    // Timing
    if (Date.now() - parseInt(tsEl.value || 0) < 4000) {
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
      fmsg.textContent = '// Pflichtfelder prüfen.';
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
      fmsg.textContent = '// Fehler. Bitte erneut versuchen.';
      fmsg.className = 'fmsg err';
      fbtn.disabled = false;
      document.querySelector('.fbtn-text').textContent = 'Senden';
    }
  });
}

function showSuccess() {
  form.reset();
  if (tsEl) tsEl.value = Date.now();
  fmsg.textContent = '// Nachricht gesendet. Ich melde mich.';
  fmsg.className = 'fmsg ok';
  fbtn.disabled = false;
  document.querySelector('.fbtn-text').textContent = 'Senden';
}

function fakeSuccess() {
  fmsg.textContent = '// Nachricht gesendet. Ich melde mich.';
  fmsg.className = 'fmsg ok';
  form.reset();
}

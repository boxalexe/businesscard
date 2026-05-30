/* ============================================
   CURSOR — reiner Dot, 1:1
   ============================================ */
const dot = document.getElementById('cursorDot');

if (dot && window.matchMedia('(hover: hover)').matches) {
  document.addEventListener('mousemove', e => {
    dot.style.left = e.clientX + 'px';
    dot.style.top  = e.clientY + 'px';
  }, { passive: true });

  document.querySelectorAll('a, button, .projekt:not(.projekt--wip), .social-link, .skill-card').forEach(el => {
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
   DYNAMIC PARALLAX BACKGROUND
   Beim Scrollen bewegen sich Grid + Glows dezent
   ============================================ */
const bgGrid  = document.getElementById('bgGrid');
const bgScan  = document.getElementById('bgScan');

let lastScroll = 0;
let ticking = false;

function updateBg(scroll) {
  const gridY = scroll * -0.12;
  bgGrid.style.transform = `translateY(${gridY}px)`;

  const scanY = scroll * -0.03;
  bgScan.style.transform = `translateY(${scanY}px)`;

  ticking = false;
}

window.addEventListener('scroll', () => {
  lastScroll = window.scrollY;
  if (!ticking) {
    requestAnimationFrame(() => updateBg(lastScroll));
    ticking = true;
  }
}, { passive: true });

/* ============================================
   SKILL BARS
   ============================================ */
const bars = document.querySelectorAll('.skill-bar');
const barObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('anim'), 100);
      barObs.unobserve(e.target);
    }
  });
}, { threshold: 0.4 });
bars.forEach(b => barObs.observe(b));

/* ============================================
   SCROLL REVEAL
   ============================================ */
document.querySelectorAll(
  '.section-eyebrow, .section-title, .ueber-grid, .skills-grid, .projekte-list, .timeline, .kontakt-grid'
).forEach(el => el.classList.add('reveal'));

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
   ACTIVE NAV
   ============================================ */
const sections = document.querySelectorAll('section[id]');
const navAs = document.querySelectorAll('.nav-links a');

const secObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navAs.forEach(a => {
        a.style.color = a.getAttribute('href') === `#${e.target.id}`
          ? 'var(--cyan)' : '';
      });
    }
  });
}, { threshold: 0.35 });

sections.forEach(s => secObs.observe(s));

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
    const name  = document.getElementById('f_name');
    const email = document.getElementById('f_email');
    const msg   = document.getElementById('f_msg');

    [name, email, msg].forEach(f => f.classList.remove('err'));
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
        fd.append('subject', document.getElementById('f_subject').value.trim());
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

/* ═══════════════════════════════════════════
   PERFECT DAY — SITE JS
═══════════════════════════════════════════ */

/* ─── DOT FOLLOWS MOUSE ─── */
(function () {
  const dot = document.querySelector('.nav-sun-dot');
  const inner = document.querySelector('.nav-sun-inner');
  if (!dot || !inner) return;
  const DOT = 7;
  let mouseX = 0, mouseY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function tick() {
    const rect = inner.getBoundingClientRect();
    const x = Math.min(Math.max(mouseX - rect.left - DOT / 2, 0), rect.width - DOT);
    const y = Math.min(Math.max(mouseY - rect.top  - DOT / 2, 0), rect.height - DOT);
    dot.style.left = x + 'px';
    dot.style.top  = y + 'px';
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}());

/* ─── NAV SCROLL ─── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ─── BURGER / MOBILE MENU ─── */
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobile-menu');

burger.addEventListener('click', () => {
  const open = burger.classList.toggle('open');
  mobileMenu.classList.remove('hidden');
  requestAnimationFrame(() => {
    mobileMenu.classList.toggle('open', open);
  });
});

mobileMenu.querySelectorAll('.mm-link').forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});

/* ─── SCROLL REVEAL ─── */
const reveals = document.querySelectorAll('[data-reveal]');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

reveals.forEach(el => revealObserver.observe(el));

/* ─── SUN PARALLAX / TILT ─── */
const sunOuter = document.getElementById('sun-outer');
const sunWrap  = document.getElementById('sun-wrap');

if (sunWrap && sunOuter) {
  sunWrap.addEventListener('mousemove', (e) => {
    const rect = sunWrap.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width  / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    sunOuter.style.transform = `
      translate(${dx * 8}px, ${dy * 8}px)
      rotate(${dx * 3}deg)
      scale(1.03)
    `;
    sunOuter.style.animationPlayState = 'paused';
  });

  sunWrap.addEventListener('mouseleave', () => {
    sunOuter.style.transform = '';
    sunOuter.style.animationPlayState = 'running';
  });

  sunWrap.addEventListener('click', () => {
    sunOuter.style.transition = 'transform 0.15s';
    sunOuter.style.transform = 'scale(0.95)';
    setTimeout(() => {
      sunOuter.style.transform = '';
      setTimeout(() => {
        sunOuter.style.transition = '';
      }, 350);
    }, 150);

    const next = document.getElementById('features');
    if (next) next.scrollIntoView({ behavior: 'smooth' });
  });
}

/* ─── CATEGORY PILLS TOGGLE ─── */
document.querySelectorAll('.cat-pill').forEach(pill => {
  pill.addEventListener('click', () => pill.classList.toggle('active'));
});

/* ─── CAT MINI GRID TOGGLE ─── */
document.querySelectorAll('.cmg-cell').forEach(cell => {
  cell.addEventListener('click', () => cell.classList.toggle('sel'));
});

/* ─── SMOOTH ANCHOR LINKS ─── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 72;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ═══════════════════════════════════════════
   PERFECT DAY — SITE JS
═══════════════════════════════════════════ */


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
  const PROXIMITY = 320;
  let mouseX = 0, mouseY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  (function proximityTick() {
    const rect = sunWrap.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < PROXIMITY) {
      const strength = (1 - dist / PROXIMITY);
      const tx = (dx / dist || 0) * strength * 18;
      const ty = (dy / dist || 0) * strength * 18;
      sunOuter.style.transform = `translate(${tx}px, ${ty}px) scale(${1 + strength * 0.04})`;
      sunOuter.style.animationPlayState = 'paused';
    } else {
      sunOuter.style.transform = '';
      sunOuter.style.animationPlayState = 'running';
    }
    requestAnimationFrame(proximityTick);
  }());

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

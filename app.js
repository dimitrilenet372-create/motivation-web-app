/* ═══════════════════════════════════════════
   PERFECT DAY — APP JS
═══════════════════════════════════════════ */

/* ─── STATE ─── */
const state = {
  currentModal: null,
  selectedColor: '#6B7F3E',
  challenges: {
    meditation: { name: 'Méditation', icon: '🧘', freq: '2 days / week', done: 2, total: 365 },
    sport:      { name: 'Sport',      icon: '🏋️', freq: 'every day',      done: 0, total: 365 },
    lecture:    { name: 'Lecture',    icon: '📚', freq: '5 days / week',   done: 0, total: 365 },
  }
};

/* ═══════════════════════
   SCREEN TRANSITIONS
═══════════════════════ */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
}

/* ═══════════════════════
   SUN TRANSITION ANIMATION
═══════════════════════ */
const canvas   = document.getElementById('transition-canvas');
const ctx      = canvas.getContext('2d');
const sunOuter = document.getElementById('sun-outer');

let animFrame  = 0;
const FRAMES   = 72;
let raf        = null;

function resizeCanvas() {
  const splash = document.getElementById('screen-splash');
  canvas.width  = splash.offsetWidth;
  canvas.height = splash.offsetHeight;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function lerp(a, b, t) { return a + (b - a) * t; }

function getSunCenter() {
  const splash = document.getElementById('screen-splash').getBoundingClientRect();
  const sun    = sunOuter.getBoundingClientRect();
  return {
    x: sun.left - splash.left + sun.offsetWidth  / 2,
    y: sun.top  - splash.top  + sun.offsetHeight / 2,
  };
}

function animateSun() {
  animFrame++;
  const t = Math.min(animFrame / FRAMES, 1);
  const e = easeInOut(t);

  resizeCanvas();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const c    = getSunCenter();
  const maxR = Math.hypot(canvas.width, canvas.height) * 1.1;

  // Phase 1 (0→0.55): sun grows to fill screen
  const p1 = Math.min(e / 0.55, 1);
  // Phase 2 (0.55→1): white wash
  const p2 = Math.max((e - 0.55) / 0.45, 0);

  const outerR = lerp(100, maxR,        p1);
  const innerR = lerp(65,  maxR * 0.75, p1);
  const dotR   = lerp(17,  maxR * 0.45, p1);

  ctx.beginPath();
  ctx.arc(c.x, c.y, outerR, 0, Math.PI * 2);
  ctx.fillStyle = '#F97316';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(c.x, c.y, innerR, 0, Math.PI * 2);
  ctx.fillStyle = '#EAB308';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(c.x, c.y, dotR, 0, Math.PI * 2);
  ctx.fillStyle = '#FEF9E7';
  ctx.fill();

  if (p2 > 0) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, maxR, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${p2})`;
    ctx.fill();
  }

  // Pulse the real sun element during phase 1
  sunOuter.style.transform = `scale(${1 + p1 * 0.08})`;

  if (t < 1) {
    raf = requestAnimationFrame(animateSun);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sunOuter.style.transform = '';
    showScreen('screen-onboard');
  }
}

function triggerSunTransition() {
  if (raf) return;
  animFrame = 0;
  resizeCanvas();
  raf = requestAnimationFrame(animateSun);
}

document.getElementById('btn-start').addEventListener('click', triggerSunTransition);
document.getElementById('sun-scene').addEventListener('click', triggerSunTransition);

/* ═══════════════════════
   ONBOARDING
═══════════════════════ */
document.querySelectorAll('.cat-card').forEach(card => {
  card.addEventListener('click', () => card.classList.toggle('selected'));
});

document.getElementById('btn-next').addEventListener('click', () => {
  showScreen('screen-home');
  buildHeatmap();
  raf = null;
});

/* ═══════════════════════
   SIDEBAR NAV
═══════════════════════ */
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    const tab = link.dataset.tab;
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
  });
});

/* ═══════════════════════
   CHALLENGE INTERACTIONS
═══════════════════════ */
function toggleDone(btn) {
  btn.classList.toggle('done');
  btn.textContent = btn.classList.contains('done') ? '✓' : '';
}

function increment(btn) {
  const card = btn.closest('.challenge-card');
  const countEl = card.querySelector('.cc-count');
  const fillEl  = card.querySelector('.cc-fill');
  let [done, total] = countEl.textContent.split(' / ').map(Number);
  done = Math.min(done + 1, total);
  countEl.textContent = `${done} / ${total}`;
  fillEl.style.width = `${(done / total * 100).toFixed(1)}%`;
}

/* ═══════════════════════
   MODAL — CHALLENGE DETAIL
═══════════════════════ */
function openModal(key) {
  const ch = state.challenges[key];
  if (!ch) return;
  state.currentModal = key;

  document.getElementById('modal-icon-wrap').textContent = ch.icon;
  document.getElementById('modal-title').textContent     = ch.name;
  document.getElementById('modal-freq').textContent      = ch.freq;
  document.getElementById('ms-done').textContent         = ch.done;
  document.getElementById('ms-left').textContent         = ch.total - ch.done;
  const pct = ((ch.done / ch.total) * 100).toFixed(1);
  document.getElementById('ms-pct').textContent          = pct + '%';
  document.getElementById('modal-prog-fill').style.width = pct + '%';

  document.getElementById('modal-detail').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-detail').classList.add('hidden');
  state.currentModal = null;
}

function validateChallenge() {
  const key = state.currentModal;
  if (!key) return;
  const ch = state.challenges[key];
  ch.done = Math.min(ch.done + 1, ch.total);

  const card     = document.getElementById('c-' + key);
  const countEl  = card ? card.querySelector('.cc-count') : null;
  const fillEl   = card ? card.querySelector('.cc-fill')  : null;
  if (countEl) countEl.textContent = `${ch.done} / ${ch.total}`;
  if (fillEl)  fillEl.style.width  = `${(ch.done / ch.total * 100).toFixed(1)}%`;

  const btn = document.getElementById('modal-validate-btn');
  btn.textContent = 'Validé ✓';
  btn.style.background = '#6B7F3E';
  setTimeout(() => {
    closeModal();
    btn.textContent = "Valider aujourd'hui ✓";
    btn.style.background = '';
  }, 900);
}

document.getElementById('modal-detail').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-detail')) closeModal();
});

/* ═══════════════════════
   MODAL — ADD GOAL
═══════════════════════ */
function openAddGoal() {
  document.getElementById('modal-add-goal').classList.remove('hidden');
}

function closeAddGoal() {
  document.getElementById('modal-add-goal').classList.add('hidden');
}

function addGoal() {
  const name  = document.getElementById('goal-name-input').value.trim();
  const freq  = document.getElementById('goal-freq-input').value.trim();
  if (!name) {
    document.getElementById('goal-name-input').focus();
    return;
  }

  const list = document.getElementById('goals-list');
  const item = document.createElement('div');
  item.className = 'goal-item blue-goal';
  item.innerHTML = `
    <div class="goal-left-bar" style="background:${state.selectedColor}"></div>
    <div class="goal-icon-wrap blue-icon">🎯</div>
    <div class="goal-info">
      <div class="goal-name">${name}</div>
      <div class="goal-prog-row">
        <div class="goal-prog-bar"><div class="goal-prog-fill blue-fill" style="width:0%;background:${state.selectedColor}"></div></div>
        <span class="goal-prog-label">0 / 365</span>
      </div>
    </div>
    <div class="goal-badge orange-badge">+1</div>
  `;
  list.appendChild(item);

  document.getElementById('goal-name-input').value = '';
  document.getElementById('goal-freq-input').value = '';
  closeAddGoal();
}

document.getElementById('modal-add-goal').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-add-goal')) closeAddGoal();
});

/* Color chips */
document.querySelectorAll('#color-chips .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#color-chips .chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    state.selectedColor = chip.dataset.color;
  });
});

/* ═══════════════════════
   TRACKING HEATMAP
═══════════════════════ */
function buildHeatmap() {
  const hm = document.getElementById('heatmap');
  if (!hm || hm.children.length) return;
  for (let i = 0; i < 28; i++) {
    const cell = document.createElement('div');
    cell.className = 'hm-cell';
    const r = Math.random();
    if (r > 0.72)      cell.classList.add('l3');
    else if (r > 0.45) cell.classList.add('l2');
    else if (r > 0.25) cell.classList.add('l1');
    hm.appendChild(cell);
  }
}

/* Toggles in profile */
document.querySelectorAll('.toggle').forEach(t => {
  t.addEventListener('click', () => t.classList.toggle('on'));
});

/* Resize canvas on window resize */
window.addEventListener('resize', resizeCanvas);

/* ═══════════════════════════════════════
   PERFECT DAY — APP JS
═══════════════════════════════════════ */

const CATEGORIES = [
  { id: 'sport',      name: 'Sport',      emoji: '🏃', color: 'blue'   },
  { id: 'business',   name: 'Business',   emoji: '💼', color: 'yellow' },
  { id: 'meditation', name: 'Méditation', emoji: '🧘', color: 'green'  },
  { id: 'goals',      name: 'Goals',      emoji: '🎯', color: 'red'    },
  { id: 'reading',    name: 'Lecture',    emoji: '📚', color: 'purple' },
  { id: 'health',     name: 'Santé',      emoji: '💪', color: 'pink'   },
  { id: 'finance',    name: 'Finance',    emoji: '💰', color: 'yellow' },
  { id: 'growth',     name: 'Growth',     emoji: '🌱', color: 'green'  },
  { id: 'sleep',      name: 'Sommeil',    emoji: '😴', color: 'blue'   },
];

const DAYS_FR = ['D','L','M','M','J','V','S'];

const GOAL_COLORS = [
  { border: '#F97316', bg: '#FFF7ED' }, // orange
  { border: '#2563EB', bg: '#BFDBFE' }, // blue
  { border: '#16A34A', bg: '#BBFFD5' }, // green
  { border: '#7C3AED', bg: '#E9D5FF' }, // purple
  { border: '#DB2777', bg: '#FCE7F3' }, // pink
  { border: '#CA8A04', bg: '#FEF08A' }, // yellow
  { border: '#DC2626', bg: '#FFC9C9' }, // red
];

let state = {
  user: { name: '', onboarded: false },
  challenges: [],
  goals: [],
};

/* ── STORAGE ── */
function save() {
  localStorage.setItem('perfectday', JSON.stringify(state));
}
function load() {
  const raw = localStorage.getItem('perfectday');
  if (raw) state = JSON.parse(raw);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function isDoneToday(challenge) {
  return (challenge.completions || []).includes(today());
}

/* ── ROUTING ── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showTab(id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === id);
  });
  renderCurrentTab(id);
}

function renderCurrentTab(id) {
  if (id === 'tab-home')       renderHome();
  if (id === 'tab-challenges') renderAllChallenges();
  if (id === 'tab-tracking')   renderTracking();
  if (id === 'tab-profile')    renderProfile();
  if (id === 'tab-add')        renderAddTab();
}

/* ── WEEK STRIP ── */
function renderWeekStrip() {
  const strip = document.getElementById('week-strip');
  const now   = new Date();
  strip.innerHTML = '';
  for (let i = -3; i <= 3; i++) {
    const d    = new Date(now);
    d.setDate(now.getDate() + i);
    const pill = document.createElement('div');
    pill.className = 'day-pill' + (i === 0 ? ' today' : i < 0 ? ' past' : '');
    pill.innerHTML = `
      <span class="day-letter">${DAYS_FR[d.getDay()]}</span>
      <span class="day-num">${d.getDate()}</span>
    `;
    strip.appendChild(pill);
  }
}

/* ── HOME ── */
function renderHome() {
  document.getElementById('user-name-display').textContent = state.user.name;
  renderWeekStrip();
  renderGoalsList();
  renderChallengesHome();
}

function renderGoalsList() {
  const el = document.getElementById('goals-list');
  if (!state.goals.length) {
    el.innerHTML = '<button class="btn-add-first-goal" id="add-first-goal">Add your first goal</button>';
    document.getElementById('add-first-goal').addEventListener('click', openGoalModal);
    return;
  }
  el.innerHTML = state.goals.map(g => goalCardHTML(g)).join('');
  el.querySelectorAll('.goal-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = state.goals.find(x => x.id === btn.dataset.id);
      if (g && !g.paused && g.progress < g.target) {
        g.progress++;
        save();
        renderGoalsList();
        if (g.progress >= g.target) showToast(`🏆 ${g.name} — objectif atteint !`);
      }
    });
  });
  el.querySelectorAll('.goal-swipe-pause').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = state.goals.find(x => x.id === btn.dataset.id);
      if (g) { g.paused = !g.paused; save(); renderGoalsList(); }
    });
  });
  el.querySelectorAll('.goal-swipe-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Supprimer ce goal ?')) return;
      state.goals = state.goals.filter(x => x.id !== btn.dataset.id);
      save();
      renderGoalsList();
    });
  });
  initGoalSwipe(el);
}

function goalCardHTML(g) {
  const pct = Math.min(100, (g.progress / g.target) * 100).toFixed(1);
  const complete = g.progress >= g.target;
  const col = (g.paused || complete) ? null : GOAL_COLORS[g.colorIndex ?? 0];
  const cardStyle = complete
    ? ''
    : g.paused
      ? 'border-left:5px solid var(--c-yellow);background:#FFFBEB;opacity:0.75'
      : `border-left:5px solid ${col.border};background:${col.bg}`;
  const fillStyle = g.paused ? 'background:var(--c-yellow)' : complete ? '' : `background:${col.border}`;
  const rowClass = complete ? 'is-complete' : g.paused ? 'is-paused' : '';
  return `
    <div class="goal-row ${rowClass}" data-id="${g.id}">
      <div class="goal-swipe-actions">
        <button class="goal-swipe-pause" data-id="${g.id}">
          <span class="goal-swipe-icon">${g.paused ? '▶' : '⏸'}</span>
          ${g.paused ? 'Reprise' : 'Pause'}
        </button>
        <button class="goal-swipe-delete" data-id="${g.id}">
          <span class="goal-swipe-icon">✕</span>
          Supp.
        </button>
      </div>
      <div class="goal-card ${g.paused ? 'paused' : ''}" style="${cardStyle}">
        <span class="goal-emoji">${g.emoji}</span>
        <div class="goal-info">
          <div class="goal-name">${g.name}${complete ? ' ✓' : ''}</div>
          <div class="goal-prog">${complete ? 'Objectif atteint 🎉' : `${g.progress}/${g.target}${g.paused ? ' · En pause' : ''}`}</div>
          <div class="goal-prog-bar"><div class="goal-prog-fill" style="width:${pct}%;${fillStyle}"></div></div>
        </div>
        ${(!g.paused && !complete) ? `<button class="goal-action" data-id="${g.id}" style="background:${col.border}">+1</button>` : ''}
        ${complete ? `<span class="goal-complete-badge">🏆</span>` : ''}
      </div>
    </div>`;
}

function renderChallengesHome() {
  const el = document.getElementById('challenges-home-list');
  if (!state.challenges.length) {
    el.innerHTML = '<div class="empty-state">Aucun challenge — va dans "Add" pour en créer un</div>';
    return;
  }
  el.innerHTML = state.challenges.slice(0, 5).map(c => challengeCardHTML(c)).join('');
  bindChallengeActions(el);
}

/* ── CHALLENGE CARD ── */
function challengeCardHTML(c) {
  const done = isDoneToday(c);
  const pct  = Math.min(100, (c.progress / c.target) * 100).toFixed(1);
  const colorClass = done ? 'done-today' : 'color-' + c.color;
  return `
    <div class="challenge-row" data-id="${c.id}">
      <div class="challenge-swipe-del">
        <button class="ch-del-btn" data-id="${c.id}">
          <span class="ch-del-icon">✕</span>Supp.
        </button>
      </div>
      <div class="challenge-card ${colorClass}" style="--fill:${pct}%">
        <div class="ch-avatar">${c.emoji}</div>
        <div class="ch-info">
          <div class="ch-name">${c.name}</div>
          <div class="ch-prog">${c.progress}/${c.target}</div>
        </div>
        <button class="ch-action ${done ? 'done' : ''}" data-id="${c.id}">
          ${done ? '✓' : '+1'}
        </button>
      </div>
    </div>`;
}

function bindChallengeActions(container) {
  container.querySelectorAll('.ch-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = state.challenges.find(x => x.id === btn.dataset.id);
      if (!c || isDoneToday(c)) return;
      if (!c.completions) c.completions = [];
      c.completions.push(today());
      c.progress = Math.min(c.progress + 1, c.target);
      save();
      renderCurrentTab(document.querySelector('.tab.active').id);
    });
  });
  container.querySelectorAll('.ch-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Supprimer ce challenge ?')) return;
      state.challenges = state.challenges.filter(x => x.id !== btn.dataset.id);
      save();
      renderCurrentTab(document.querySelector('.tab.active').id);
    });
  });
  initChallengeSwipe(container);
}

/* ── ALL CHALLENGES ── */
function renderAllChallenges() {
  const el = document.getElementById('all-challenges-list');
  if (!state.challenges.length) {
    el.innerHTML = '<div class="empty-state" style="margin:0">Aucun challenge</div>';
    return;
  }
  el.innerHTML = state.challenges.map(c => challengeCardHTML(c)).join('');
  bindChallengeActions(el);
}

/* ── TRACKING ── */
function renderTracking() {
  const el = document.getElementById('tracking-list');
  if (!state.challenges.length) {
    el.innerHTML = '<div class="empty-state" style="margin:0">Aucun challenge à tracker</div>';
    return;
  }
  el.innerHTML = state.challenges.map(c => {
    const pct    = Math.min(100, (c.progress / c.target) * 100).toFixed(1);
    const streak = getStreak(c);
    return `
      <div class="tracking-card">
        <div class="tracking-header">
          <span class="tracking-emoji">${c.emoji}</span>
          <span class="tracking-name">${c.name}</span>
          <span class="tracking-pct">${pct}%</span>
        </div>
        <div class="tracking-body">
          <div class="progress-bar-big">
            <div class="progress-bar-fill" style="width:${pct}%"></div>
          </div>
          <div class="tracking-stats">
            <div class="tracking-stat">
              <span class="tracking-stat-num">${c.progress}</span>
              <span class="tracking-stat-label">jours</span>
            </div>
            <div class="tracking-stat">
              <span class="tracking-stat-num">${c.target - c.progress}</span>
              <span class="tracking-stat-label">restants</span>
            </div>
            <div class="tracking-stat">
              <span class="tracking-stat-num">${streak} 🔥</span>
              <span class="tracking-stat-label">streak</span>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function getStreak(c) {
  if (!c.completions || !c.completions.length) return 0;
  const sorted = [...c.completions].sort().reverse();
  let streak = 0;
  let d = new Date();
  for (const dateStr of sorted) {
    const expected = d.toISOString().slice(0, 10);
    if (dateStr === expected) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

/* ── PROFILE ── */
function renderProfile() {
  document.getElementById('profile-name-display').textContent = state.user.name;
  const done  = state.challenges.filter(c => isDoneToday(c)).length;
  const total = state.challenges.length;
  const best  = state.challenges.reduce((m, c) => Math.max(m, getStreak(c)), 0);
  document.getElementById('profile-stats').innerHTML = `
    <div class="stat-box"><div class="stat-num">${total}</div><div class="stat-label">Challenges</div></div>
    <div class="stat-box"><div class="stat-num">${done}</div><div class="stat-label">Aujourd'hui</div></div>
    <div class="stat-box"><div class="stat-num">${best}</div><div class="stat-label">Best streak</div></div>
  `;
}

/* ── ADD TAB ── */
let addSelectedCat = null;
let addTarget = 365;

function syncPresets(presetsId, val) {
  document.querySelectorAll(`#${presetsId} .preset-btn`).forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.days) === val);
  });
}

function renderAddTab() {
  addSelectedCat = null;
  addTarget = 365;
  document.getElementById('t-val').value = addTarget;
  syncPresets('t-presets', addTarget);
  document.getElementById('new-name').value = '';
  document.getElementById('add-form').classList.add('hidden');
  buildCatGrid('add-cat-grid', (cat) => {
    addSelectedCat = cat;
    document.getElementById('new-name').value = cat.name;
    document.getElementById('add-form').classList.remove('hidden');
  });
}

function buildCatGrid(containerId, onSelect) {
  const el = document.getElementById(containerId);
  el.innerHTML = CATEGORIES.map(c => `
    <div class="cat-item" data-id="${c.id}">
      <span class="cat-emoji">${c.emoji}</span>
      <span class="cat-name">${c.name}</span>
    </div>`).join('');
  el.querySelectorAll('.cat-item').forEach(item => {
    item.addEventListener('click', () => {
      el.querySelectorAll('.cat-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      const cat = CATEGORIES.find(c => c.id === item.dataset.id);
      if (cat) onSelect(cat);
    });
  });
}

/* ── TOAST ── */
function showToast(msg) {
  const app = document.getElementById('app');
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  app.appendChild(t);
  requestAnimationFrame(() => { requestAnimationFrame(() => t.classList.add('show')); });
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 2800);
}

/* ── GOAL SWIPE ── */
const SWIPE_W = 130;

function togglePause(id) {
  const g = state.goals.find(x => x.id === id);
  if (g) { g.paused = !g.paused; save(); renderGoalsList(); }
}

function initGoalSwipe(container) {
  container.querySelectorAll('.goal-row').forEach(row => {
    const card = row.querySelector('.goal-card');
    let startX = 0, startY = 0, tracking = false;

    card.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
      row._wasTouched = true;
      card.style.transition = 'none';
    }, { passive: true });

    card.addEventListener('touchmove', e => {
      if (!tracking) return;
      if (row.classList.contains('is-paused')) { tracking = false; return; }
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (!row._swiped && Math.abs(dy) > Math.abs(dx) + 4) { tracking = false; return; }
      const base = row._swiped ? -SWIPE_W : 0;
      const x = Math.max(-SWIPE_W, Math.min(0, base + dx));
      card.style.transform = `translateX(${x}px)`;
    }, { passive: true });

    card.addEventListener('touchend', e => {
      if (!tracking) return;
      tracking = false;
      card.style.transition = `transform 0.28s var(--ease-out)`;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const isTap = Math.abs(dx) < 8 && Math.abs(dy) < 8;

      if (row.classList.contains('is-paused')) {
        if (isTap) togglePause(row.dataset.id);
        return;
      }
      const base = row._swiped ? -SWIPE_W : 0;
      if (base + dx < -SWIPE_W / 3) {
        openGoalSwipe(row);
      } else {
        closeGoalSwipe(row);
      }
    });

    card.addEventListener('click', e => {
      if (row._wasTouched) { row._wasTouched = false; return; }
      if (e.target.closest('.goal-action')) return;
      if (row.classList.contains('is-paused')) { togglePause(row.dataset.id); return; }
      row._swiped ? closeGoalSwipe(row) : openGoalSwipe(row);
    });
  });
}

function openGoalSwipe(row) {
  closeAllGoalSwipes();
  const card = row.querySelector('.goal-card');
  card.style.transition = `transform 0.28s var(--ease-out)`;
  card.style.transform = `translateX(-${SWIPE_W}px)`;
  row._swiped = true;
}

function closeGoalSwipe(row) {
  const card = row.querySelector('.goal-card');
  card.style.transition = `transform 0.28s var(--ease-out)`;
  card.style.transform = 'translateX(0)';
  row._swiped = false;
}

function closeAllGoalSwipes() {
  document.querySelectorAll('.goal-row').forEach(r => { if (r._swiped) closeGoalSwipe(r); });
}

/* ── CHALLENGE SWIPE ── */
const CH_SWIPE_W = 80;

function initChallengeSwipe(container) {
  container.querySelectorAll('.challenge-row').forEach(row => {
    const card = row.querySelector('.challenge-card');
    let startX = 0, startY = 0, tracking = false;

    card.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
      row._wasTouched = true;
      card.style.transition = 'none';
    }, { passive: true });

    card.addEventListener('touchmove', e => {
      if (!tracking) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (!row._swiped && Math.abs(dy) > Math.abs(dx) + 4) { tracking = false; return; }
      const base = row._swiped ? -CH_SWIPE_W : 0;
      card.style.transform = `translateX(${Math.max(-CH_SWIPE_W, Math.min(0, base + dx))}px)`;
    }, { passive: true });

    card.addEventListener('touchend', e => {
      if (!tracking) return;
      tracking = false;
      card.style.transition = `transform 0.28s var(--ease-out)`;
      const dx = e.changedTouches[0].clientX - startX;
      const base = row._swiped ? -CH_SWIPE_W : 0;
      base + dx < -CH_SWIPE_W / 3 ? openChallengeSwipe(row) : closeChallengeSwipe(row);
    });

    card.addEventListener('click', e => {
      if (row._wasTouched) { row._wasTouched = false; return; }
      if (e.target.closest('.ch-action')) return;
      row._swiped ? closeChallengeSwipe(row) : openChallengeSwipe(row);
    });
  });
}

function openChallengeSwipe(row) {
  closeAllChallengeSwipes();
  const card = row.querySelector('.challenge-card');
  card.style.transition = `transform 0.28s var(--ease-out)`;
  card.style.transform = `translateX(-${CH_SWIPE_W}px)`;
  row._swiped = true;
}

function closeChallengeSwipe(row) {
  const card = row.querySelector('.challenge-card');
  card.style.transition = `transform 0.28s var(--ease-out)`;
  card.style.transform = 'translateX(0)';
  row._swiped = false;
}

function closeAllChallengeSwipes() {
  document.querySelectorAll('.challenge-row').forEach(r => { if (r._swiped) closeChallengeSwipe(r); });
}

document.addEventListener('touchstart', e => {
  if (!e.target.closest('.goal-row')) closeAllGoalSwipes();
  if (!e.target.closest('.challenge-row')) closeAllChallengeSwipes();
}, { passive: true });

document.addEventListener('click', e => {
  if (!e.target.closest('.goal-row')) closeAllGoalSwipes();
  if (!e.target.closest('.challenge-row')) closeAllChallengeSwipes();
});

/* ── SAVE CHALLENGE ── */
document.getElementById('save-challenge').addEventListener('click', () => {
  const name = document.getElementById('new-name').value.trim();
  if (!name || !addSelectedCat) return;
  const tRaw = parseInt(document.getElementById('t-val').value);
  const target = (!isNaN(tRaw) && tRaw >= 1) ? Math.min(3650, tRaw) : addTarget;
  state.challenges.push({
    id: uid(),
    name,
    emoji: addSelectedCat.emoji,
    color: addSelectedCat.color,
    category: addSelectedCat.id,
    progress: 0,
    target,
    completions: [],
    createdAt: today(),
  });
  save();
  showTab('tab-home');
});

document.getElementById('t-minus').addEventListener('click', () => {
  addTarget = Math.max(1, addTarget - 1);
  document.getElementById('t-val').value = addTarget;
  syncPresets('t-presets', addTarget);
});
document.getElementById('t-plus').addEventListener('click', () => {
  addTarget = Math.min(3650, addTarget + 1);
  document.getElementById('t-val').value = addTarget;
  syncPresets('t-presets', addTarget);
});
document.getElementById('t-val').addEventListener('input', () => {
  const v = parseInt(document.getElementById('t-val').value);
  if (!isNaN(v) && v >= 1) addTarget = Math.min(3650, v);
  syncPresets('t-presets', addTarget);
});
document.getElementById('t-presets').addEventListener('click', e => {
  const btn = e.target.closest('.preset-btn');
  if (!btn) return;
  addTarget = Number(btn.dataset.days);
  document.getElementById('t-val').value = addTarget;
  syncPresets('t-presets', addTarget);
});

/* ── GOAL MODAL ── */
let goalSelectedCat = null;
let goalTarget = 365;

document.getElementById('add-goal-btn').addEventListener('click', openGoalModal);

function openGoalModal() {
  goalSelectedCat = null;
  goalTarget = 365;
  document.getElementById('g-val').value = goalTarget;
  syncPresets('g-presets', goalTarget);
  document.getElementById('goal-name').value = '';
  buildCatGrid('goal-cat-grid', (cat) => {
    goalSelectedCat = cat;
    document.getElementById('goal-name').value = cat.name;
  });
  document.getElementById('goal-modal').classList.remove('hidden');
}

document.getElementById('close-modal').addEventListener('click', () => {
  document.getElementById('goal-modal').classList.add('hidden');
});
document.getElementById('goal-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('goal-modal'))
    document.getElementById('goal-modal').classList.add('hidden');
});
document.getElementById('g-minus').addEventListener('click', () => {
  goalTarget = Math.max(1, goalTarget - 1);
  document.getElementById('g-val').value = goalTarget;
  syncPresets('g-presets', goalTarget);
});
document.getElementById('g-plus').addEventListener('click', () => {
  goalTarget = Math.min(3650, goalTarget + 1);
  document.getElementById('g-val').value = goalTarget;
  syncPresets('g-presets', goalTarget);
});
document.getElementById('g-val').addEventListener('input', () => {
  const v = parseInt(document.getElementById('g-val').value);
  if (!isNaN(v) && v >= 1) goalTarget = Math.min(3650, v);
  syncPresets('g-presets', goalTarget);
});
document.getElementById('g-presets').addEventListener('click', e => {
  const btn = e.target.closest('.preset-btn');
  if (!btn) return;
  goalTarget = Number(btn.dataset.days);
  document.getElementById('g-val').value = goalTarget;
  syncPresets('g-presets', goalTarget);
});
document.getElementById('save-goal').addEventListener('click', () => {
  const name = document.getElementById('goal-name').value.trim();
  if (!name) return;
  const gRaw = parseInt(document.getElementById('g-val').value);
  const target = (!isNaN(gRaw) && gRaw >= 1) ? Math.min(3650, gRaw) : goalTarget;
  state.goals.push({
    id: uid(),
    name,
    emoji: goalSelectedCat ? goalSelectedCat.emoji : '🎯',
    colorIndex: state.goals.length % GOAL_COLORS.length,
    progress: 0,
    target,
  });
  save();
  document.getElementById('goal-modal').classList.add('hidden');
  renderHome();
});

/* ── BOTTOM NAV ── */
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showTab(btn.dataset.tab));
});

/* ── PROFILE ACTIONS ── */
document.getElementById('edit-name-btn').addEventListener('click', () => {
  const name = prompt('Nouveau prénom :', state.user.name);
  if (name && name.trim()) {
    state.user.name = name.trim();
    save();
    renderProfile();
    document.getElementById('user-name-display').textContent = state.user.name;
  }
});
document.getElementById('reset-btn').addEventListener('click', () => {
  if (confirm('Réinitialiser toutes les données ?')) {
    localStorage.removeItem('perfectday');
    location.reload();
  }
});

/* ── ONBOARDING ── */
const obSelected = new Set();

function buildOnboardingGrid() {
  const grid = document.getElementById('cat-grid');
  grid.innerHTML = CATEGORIES.map(c => `
    <div class="cat-item" data-id="${c.id}">
      <span class="cat-emoji">${c.emoji}</span>
      <span class="cat-name">${c.name}</span>
    </div>`).join('');
  grid.querySelectorAll('.cat-item').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('selected');
      const id = item.dataset.id;
      if (obSelected.has(id)) obSelected.delete(id);
      else obSelected.add(id);
      updateObBtn();
    });
  });
}

function updateObBtn() {
  const name = document.getElementById('ob-name').value.trim();
  document.getElementById('ob-next').disabled = !(name && obSelected.size > 0);
}

document.getElementById('ob-name').addEventListener('input', updateObBtn);

document.getElementById('ob-next').addEventListener('click', () => {
  const name = document.getElementById('ob-name').value.trim();
  if (!name || obSelected.size === 0) return;
  state.user.name = name;
  state.user.onboarded = true;
  obSelected.forEach(catId => {
    const cat = CATEGORIES.find(c => c.id === catId);
    if (cat) {
      state.challenges.push({
        id: uid(),
        name: cat.name,
        emoji: cat.emoji,
        color: cat.color,
        category: cat.id,
        progress: 0,
        target: 365,
        completions: [],
        createdAt: today(),
      });
    }
  });
  save();
  enterApp();
});

/* ── INIT ── */
function enterApp() {
  showScreen('app');
  showTab('tab-home');
}

function init() {
  load();
  buildOnboardingGrid();
  setTimeout(() => {
    if (state.user.onboarded) {
      enterApp();
    } else {
      showScreen('onboarding');
    }
  }, 1200);
}

init();

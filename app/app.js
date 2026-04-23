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
/* Maps old colorIndex → category color name (backwards compat) */
const COLORINDEX_MAP = ['blue', 'yellow', 'green', 'purple', 'pink', 'yellow', 'red'];

/* ── CHALLENGE PRESETS ── */
const CHALLENGE_SUGGESTIONS = {
  sport:      ['🏃 Courir', '💪 Musculation', '🧘 Yoga', '🚴 Vélo', '🏊 Natation', '🥊 HIIT'],
  business:   ['📊 Revue daily', '💡 Une idée/jour', '📩 Inbox zero', '🤝 Call client'],
  meditation: ['🌿 Méditation', '🌬️ Respiration', '🎧 Guidée', '🧘 Body scan'],
  goals:      ['🎯 Objectif perso', '📝 Journaling', '🌱 Nouvelle habitude'],
  reading:    ['📖 Lire', '📚 Non-fiction', '📰 Articles', '🧠 Flashcards'],
  health:     ['💧 Boire 2 L d\'eau', '🥗 Manger sain', '💊 Vitamines', '🚶 Marche'],
  finance:    ['💰 Épargner', '📈 Investir', '📋 Budget hebdo'],
  growth:     ['🌱 Apprendre', '🎓 Formation en ligne', '🤝 Réseauter'],
  sleep:      ['🌙 Coucher avant 23 h', '😴 8 h de sommeil', '📵 No écrans le soir'],
};

const CATEGORY_SUBTYPES = {
  sport:      ['Course', 'Musculation', 'Yoga', 'HIIT', 'Natation', 'Vélo', 'Football', 'Tennis', 'Boxe'],
  meditation: ['Pleine conscience', 'Respiration', 'Guidée', 'Body scan', 'Mantra', 'Visualisation'],
  reading:    ['Pages/jour', 'Minutes/jour', 'Chapitres/sem.'],
  sleep:      ['Heure de coucher', 'Durée de sommeil'],
  health:     ['Hydratation', 'Nutrition', 'Vitamines', 'Marche', 'Étirements'],
  growth:     ['Compétence', 'Langue', 'Instrument', 'Code', 'Cours en ligne'],
  business:   ['Stratégie', 'Prospection', 'Contenu', 'Admin'],
  finance:    ['Épargne', 'Investissement', 'Budget', 'Crypto'],
};

/* Categories that show a per-session duration picker */
const HAS_DURATION = new Set(['sport', 'meditation', 'reading', 'health', 'growth']);
/* Category that shows a bedtime picker */
const HAS_BEDTIME  = new Set(['sleep']);

/* ── SCOREBOARD ── */
function computeScore() {
  const items = [...state.challenges, ...state.goals];
  if (!items.length) return 0;
  const sum = items.reduce((s, x) => s + Math.min(1, (x.progress || 0) / (x.target || 1)), 0);
  return Math.round(sum / items.length * 100);
}

function toB64(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return decodeURIComponent(escape(atob(str)));
}

function generateShareURL() {
  const payload = {
    n: state.user.name,
    s: computeScore(),
    c: state.challenges.map(c => ({ e: c.emoji, n: c.name, p: c.progress, t: c.target })),
    g: state.goals.map(g => ({ e: g.emoji, n: g.name, p: g.progress, t: g.target })),
    d: today(),
  };
  return `${location.origin}${location.pathname}?friend=${toB64(JSON.stringify(payload))}`;
}

function parseFriendURL(input) {
  try {
    input = input.trim();
    let param = null;
    /* Try full URL first */
    if (input.startsWith('http')) {
      try { param = new URL(input).searchParams.get('friend'); } catch {}
    }
    /* Fallback: extract ?friend= or &friend= from string */
    if (!param) {
      const m = input.match(/[?&]friend=([^&\s]+)/);
      if (m) param = decodeURIComponent(m[1]);
    }
    /* Last resort: assume raw base64 was pasted */
    if (!param) param = input;
    if (!param) return null;
    return JSON.parse(fromB64(param));
  } catch { return null; }
}

function addFriend(data) {
  if (!state.friends) state.friends = [];
  const idx = state.friends.findIndex(f => f.n === data.n);
  if (idx >= 0) state.friends[idx] = data; else state.friends.push(data);
  save();
}

function checkShareURL() {
  const param = new URLSearchParams(location.search).get('friend');
  if (!param) return;
  history.replaceState({}, '', location.pathname);
  try {
    const data = JSON.parse(fromB64(param));
    if (!data?.n) return;
    if (confirm(`Ajouter ${data.n} à ton classement ? (Score : ${data.s} %)`)) {
      addFriend(data);
      showTab('tab-scores');
    }
  } catch {}
}

let state = {
  user: { name: '', onboarded: false },
  challenges: [],
  goals: [],
  friends: [],
};

/* ── STORAGE ── */
function save() {
  localStorage.setItem('perfectday', JSON.stringify(state));
}
function load() {
  const raw = localStorage.getItem('perfectday');
  if (raw) {
    state = JSON.parse(raw);
    if (!state.friends) state.friends = [];
  }
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

/* Maps real % to a more visible fill % (power curve + minimum) */
function visualFill(pct, minPct = 8) {
  if (pct <= 0) return 0;
  if (pct >= 100) return 100;
  return Math.max(minPct, Math.round(Math.pow(pct / 100, 0.5) * 100));
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

function renderCurrentTab(id, animate = true) {
  if (id === 'tab-home')     renderHome(animate);
  if (id === 'tab-scores')   renderScoreboard();
  if (id === 'tab-tracking') renderTracking();
  if (id === 'tab-profile')  renderProfile();
  if (id === 'tab-add')      renderAddTab();
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
function renderHome(animate = true) {
  document.getElementById('user-name-display').textContent = state.user.name;
  renderWeekStrip();
  renderGoalsList(animate);
  renderChallengesHome(animate);
}

function renderGoalsList(animate = true) {
  const el = document.getElementById('goals-list');
  if (!state.goals.length) {
    el.innerHTML = '<button class="btn-add-first-goal" id="add-first-goal">Add your first goal</button>';
    document.getElementById('add-first-goal').addEventListener('click', openGoalModal);
    return;
  }
  el.innerHTML = state.goals.map(g => goalCardHTML(g)).join('');
  if (animate) addEntryStagger(el, '.goal-row');
  el.querySelectorAll('.goal-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = state.goals.find(x => x.id === btn.dataset.id);
      if (!g || g.paused || g.progress >= g.target) return;
      const r        = btn.getBoundingClientRect();
      const accColor = CAT_COLORS[btn.dataset.color] || '#F97316';
      spawnFloatText(r.left + r.width / 2, r.top, '+1', accColor);
      g.progress++;
      save();
      const willComplete = g.progress >= g.target;
      renderGoalsList(false);
      const newCard = el.querySelector(`.goal-row[data-id="${g.id}"] .goal-card`);
      addShine(newCard);
      if (willComplete) {
        pulseRing(newCard, 'rgba(22,163,74,.55)');
        spawnConfetti(r.left + r.width / 2, r.top + r.height / 2);
        showToast(`🏆 ${g.name} — objectif atteint !`);
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
  const pct      = Math.min(100, (g.progress / g.target) * 100);
  const complete = g.progress >= g.target;
  const color    = g.color || COLORINDEX_MAP[g.colorIndex ?? 0] || 'blue';
  const fill     = complete ? 100 : visualFill(pct, 5);
  const colorClass = (complete || g.paused) ? '' : `color-${color}`;
  const rowClass   = complete ? 'is-complete' : g.paused ? 'is-paused' : '';
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
      <div class="goal-card ${colorClass} ${g.paused ? 'paused' : ''}" style="--fill:${fill}%">
        <span class="goal-emoji">${g.emoji}</span>
        <div class="goal-info">
          <div class="goal-name">${g.name}${complete ? ' ✓' : ''}</div>
          <div class="goal-prog">${complete ? 'Objectif atteint 🎉' : `${g.progress}/${g.target}${g.paused ? ' · En pause' : ''}`}</div>
        </div>
        ${(!g.paused && !complete) ? `<button class="goal-action" data-id="${g.id}" data-color="${color}">+1</button>` : ''}
        ${complete ? `<span class="goal-complete-badge">🏆</span>` : ''}
      </div>
    </div>`;
}

function renderChallengesHome(animate = true) {
  const el = document.getElementById('challenges-home-list');
  if (!state.challenges.length) {
    el.innerHTML = '<div class="empty-state">Aucun challenge — va dans "Add" pour en créer un</div>';
    return;
  }
  el.innerHTML = state.challenges.slice(0, 5).map(c => challengeCardHTML(c)).join('');
  if (animate) addEntryStagger(el, '.challenge-row');
  bindChallengeActions(el);
}

/* ── CHALLENGE CARD ── */
function buildSubtitle(c) {
  const parts = [];
  if (c.subtype)   parts.push(c.subtype);
  if (c.duration)  parts.push(`${c.duration} min`);
  if (c.bedtime)   parts.push(`🌙 ${c.bedtime}`);
  return parts.length ? `<div class="ch-subtitle">${parts.join(' · ')}</div>` : '';
}

function challengeCardHTML(c) {
  const done     = isDoneToday(c);
  const complete = c.progress >= c.target;
  const pct      = Math.min(100, (c.progress / c.target) * 100);
  const fill     = complete ? 100 : visualFill(pct);
  const colorClass = complete ? 'is-complete' : done ? 'done-today' : 'color-' + c.color;
  return `
    <div class="challenge-row" data-id="${c.id}">
      <div class="challenge-swipe-del">
        <button class="ch-del-btn" data-id="${c.id}">
          <span class="ch-del-icon">✕</span>Supp.
        </button>
      </div>
      <div class="challenge-card ${colorClass}" style="--fill:${fill}%">
        <div class="ch-avatar">${c.emoji}</div>
        <div class="ch-info">
          <div class="ch-name">${c.name}${complete ? ' ✓' : ''}</div>
          ${buildSubtitle(c)}
          <div class="ch-prog">${complete ? 'Challenge terminé 🎉' : `${c.progress}/${c.target} jours`}</div>
        </div>
        ${complete
          ? '<span class="ch-complete-badge">🏆</span>'
          : `<button class="ch-action ${done ? 'done' : ''}" data-id="${c.id}">${done ? '✓' : '+1'}</button>`}
      </div>
    </div>`;
}

const CAT_COLORS = { blue:'#2563EB', green:'#16A34A', red:'#DC2626', yellow:'#CA8A04', purple:'#7C3AED', pink:'#DB2777' };

function bindChallengeActions(container) {
  container.querySelectorAll('.ch-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = state.challenges.find(x => x.id === btn.dataset.id);
      if (!c || isDoneToday(c) || c.progress >= c.target) return;
      const r   = btn.getBoundingClientRect();
      const col = CAT_COLORS[c.color] || '#F97316';
      spawnFloatText(r.left + r.width / 2, r.top, '+1', col);
      if (!c.completions) c.completions = [];
      c.completions.push(today());
      c.progress = Math.min(c.progress + 1, c.target);
      save();
      const willComplete = c.progress >= c.target;
      const cid = c.id;
      const activeTabId = document.querySelector('.tab.active').id;
      /* Re-render without stagger so other cards don't dance on each tap */
      if (activeTabId === 'tab-home') {
        renderChallengesHome(false);
        renderGoalsList(false);
      }
      const activeTab = document.querySelector('.tab.active');
      const newChCard = activeTab.querySelector(`.challenge-row[data-id="${cid}"] .challenge-card`);
      addShine(newChCard);
      if (willComplete) {
        pulseRing(newChCard, `${col}88`);
        spawnConfetti(r.left + r.width / 2, r.top + r.height / 2);
        showToast(`🏆 ${c.name} — challenge terminé !`);
      }
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
function renderAllChallenges(animate = true) {
  const el = document.getElementById('all-challenges-list');
  if (!state.challenges.length) {
    el.innerHTML = '<div class="empty-state" style="margin:0">Aucun challenge</div>';
    return;
  }
  el.innerHTML = state.challenges.map(c => challengeCardHTML(c)).join('');
  if (animate) addEntryStagger(el, '.challenge-row');
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

function renderScoreboard() {
  const myScore = computeScore();
  document.getElementById('my-score-num').textContent = `${myScore} %`;

  const friends = state.friends || [];
  const all = [
    { name: state.user.name || 'Toi', score: myScore, isMe: true,
      sub: `${state.challenges.length} challenges · ${state.goals.length} goals` },
    ...friends.map(f => ({
      name: f.n, score: f.s, isMe: false,
      sub: `${(f.c||[]).length} challenges · ${(f.g||[]).length} goals · ${f.d || ''}`,
    })),
  ].sort((a, b) => b.score - a.score);

  const medals = ['🥇','🥈','🥉'];
  const el = document.getElementById('leaderboard');
  if (all.length <= 1) {
    el.innerHTML = '<div class="no-friends-msg">Partage ton lien pour te comparer à tes amis !</div>';
    return;
  }
  el.innerHTML = all.map((p, i) => `
    <div class="friend-row ${p.isMe ? 'is-me' : ''}">
      <span class="friend-rank">${medals[i] || (i + 1)}</span>
      <div class="friend-detail">
        <div class="friend-name">${p.name}</div>
        <div class="friend-sub">${p.sub}</div>
        <div class="friend-score-bar"><div class="friend-score-fill" style="width:${p.score}%"></div></div>
      </div>
      <span class="friend-score">${p.score}%</span>
    </div>`).join('');
}

/* ── ADD TAB ── */
let addSelectedCat = null;
let addTarget      = 365;
let addSubtype     = '';
let addDuration    = 20;

function syncPresets(presetsId, val) {
  document.querySelectorAll(`#${presetsId} .preset-btn`).forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.days) === val);
  });
}
function syncDurPresets(val) {
  document.querySelectorAll('#dur-presets .preset-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.mins) === val);
  });
}

function showDurPicker() {
  document.getElementById('add-duration-wrap').classList.remove('hidden');
  document.getElementById('dur-add-btn').classList.add('hidden');
}
function hideDurPicker() {
  document.getElementById('add-duration-wrap').classList.add('hidden');
  document.getElementById('dur-add-btn').classList.remove('hidden');
  addDuration = 20;
}

function renderAddTab() {
  addSelectedCat = null;
  addTarget      = 365;
  addSubtype     = '';
  addDuration    = 20;
  document.getElementById('t-val').value = addTarget;
  syncPresets('t-presets', addTarget);
  document.getElementById('new-name').value = '';
  document.getElementById('add-form').classList.add('hidden');
  document.getElementById('add-suggestions').classList.add('hidden');
  document.getElementById('add-suggestions').innerHTML = '';
  document.getElementById('add-duration-wrap').classList.add('hidden');
  document.getElementById('dur-add-btn').classList.add('hidden');
  document.getElementById('add-bedtime-wrap').classList.add('hidden');
  document.getElementById('add-subtype-wrap').classList.add('hidden');

  buildCatGrid('add-cat-grid', (cat) => {
    addSelectedCat = cat;
    addSubtype     = '';
    document.getElementById('new-name').value = cat.name;
    document.getElementById('add-form').classList.remove('hidden');

    /* 1. Suggestions de noms */
    const sugs = CHALLENGE_SUGGESTIONS[cat.id] || [];
    const sugWrap = document.getElementById('add-suggestions');
    if (sugs.length) {
      sugWrap.innerHTML = sugs.map(s =>
        `<button class="suggestion-chip">${s}</button>`).join('');
      sugWrap.classList.remove('hidden');
      sugWrap.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          document.getElementById('new-name').value = chip.textContent.trim();
        });
      });
    } else {
      sugWrap.classList.add('hidden');
    }

    /* 2. Sous-types */
    const subtypes = CATEGORY_SUBTYPES[cat.id] || [];
    const stWrap   = document.getElementById('add-subtype-wrap');
    const stChips  = document.getElementById('add-subtype-chips');
    if (subtypes.length) {
      stChips.innerHTML = subtypes.map(s =>
        `<button class="subtype-chip" data-val="${s}">${s}</button>`).join('');
      stWrap.classList.remove('hidden');
      stChips.querySelectorAll('.subtype-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          stChips.querySelectorAll('.subtype-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          addSubtype = chip.dataset.val;
        });
      });
    } else {
      stWrap.classList.add('hidden');
    }

    /* 3. Durée : visible pour les catégories compatibles */
    addDuration = 20;
    document.getElementById('dur-val').value = addDuration;
    syncDurPresets(addDuration);
    document.getElementById('dur-add-btn').classList.add('hidden');
    if (HAS_DURATION.has(cat.id)) {
      document.getElementById('add-duration-wrap').classList.remove('hidden');
    } else {
      document.getElementById('add-duration-wrap').classList.add('hidden');
    }

    /* 4. Heure de coucher — UNIQUEMENT catégorie sleep */
    const btWrap = document.getElementById('add-bedtime-wrap');
    if (cat.id === 'sleep') {
      btWrap.classList.remove('hidden');
    } else {
      btWrap.classList.add('hidden');
    }
  });

  document.getElementById('dur-add-btn').onclick = showDurPicker;
  document.getElementById('dur-remove').onclick   = hideDurPicker;
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
    t.classList.add('hide');
    setTimeout(() => t.remove(), 300);
  }, 2800);
}

/* ── ANIMATION HELPERS ── */
function spawnFloatText(x, y, text, color) {
  const el = document.createElement('div');
  el.className = 'float-label';
  el.textContent = text;
  el.style.cssText = `left:${x}px; top:${y}px; color:${color};`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

function spawnConfetti(x, y) {
  const COLS = ['#F97316','#2563EB','#16A34A','#7C3AED','#DB2777','#CA8A04','#FBBF24','#DC2626'];
  for (let i = 0; i < 20; i++) {
    const dot = document.createElement('div');
    dot.className = 'confetti-bit';
    const angle = (i / 20) * 2 * Math.PI + Math.random() * 0.5;
    const dist  = 40 + Math.random() * 65;
    dot.style.cssText = `
      left:${x}px; top:${y}px;
      background:${COLS[i % COLS.length]};
      --tx:${(Math.cos(angle) * dist).toFixed(1)}px;
      --ty:${(Math.sin(angle) * dist).toFixed(1)}px;
      --tr:${Math.round(Math.random() * 540)}deg;
      animation-delay:${(Math.random() * 0.08).toFixed(3)}s;
      border-radius:${Math.random() > 0.5 ? '50%' : '3px'};
    `;
    document.body.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove(), { once: true });
  }
}

function pulseRing(el, color = 'rgba(22,163,74,.55)') {
  if (!el) return;
  el.style.setProperty('--ring-col', color);
  el.classList.remove('anim-ring');
  void el.offsetWidth;
  el.classList.add('anim-ring');
  el.addEventListener('animationend', () => el.classList.remove('anim-ring'), { once: true });
}

function addEntryStagger(container, selector) {
  container.querySelectorAll(selector).forEach((el, i) => {
    el.style.animation = `fadeSlideUp 0.28s ease-out ${(i * 0.055).toFixed(3)}s both`;
  });
}

function addShine(el) {
  if (!el) return;
  el.classList.remove('anim-shine');
  void el.offsetWidth;
  el.classList.add('anim-shine');
  setTimeout(() => el.classList.remove('anim-shine'), 700);
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
  const durRaw = parseInt(document.getElementById('dur-val').value);
  const duration = (!isNaN(durRaw) && durRaw >= 1) ? durRaw : addDuration;
  const bedtime  = document.getElementById('add-bedtime').value || '';
  const cat = addSelectedCat.id;
  state.challenges.push({
    id: uid(), name,
    emoji: addSelectedCat.emoji,
    color: addSelectedCat.color,
    category: cat,
    subtype:  addSubtype || '',
    duration: HAS_DURATION.has(cat) ? duration : null,
    bedtime:  HAS_BEDTIME.has(cat)  ? bedtime  : null,
    progress: 0, target,
    completions: [], createdAt: today(),
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
document.getElementById('dur-minus').addEventListener('click', () => {
  addDuration = Math.max(1, addDuration - 5);
  document.getElementById('dur-val').value = addDuration;
  syncDurPresets(addDuration);
});
document.getElementById('dur-plus').addEventListener('click', () => {
  addDuration = Math.min(240, addDuration + 5);
  document.getElementById('dur-val').value = addDuration;
  syncDurPresets(addDuration);
});
document.getElementById('dur-val').addEventListener('input', () => {
  const v = parseInt(document.getElementById('dur-val').value);
  if (!isNaN(v) && v >= 1) addDuration = Math.min(240, v);
  syncDurPresets(addDuration);
});
document.getElementById('dur-presets').addEventListener('click', e => {
  const btn = e.target.closest('.preset-btn');
  if (!btn) return;
  addDuration = Number(btn.dataset.mins);
  document.getElementById('dur-val').value = addDuration;
  syncDurPresets(addDuration);
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
    color: goalSelectedCat ? goalSelectedCat.color : 'blue',
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
document.getElementById('nav-fab').addEventListener('click', () => showTab('tab-add'));

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

/* ── SCOREBOARD ACTIONS ── */
document.getElementById('share-score-btn').addEventListener('click', () => {
  const url = generateShareURL();
  navigator.clipboard.writeText(url).then(() => {
    showToast('🔗 Lien copié ! Envoie-le à tes amis.');
  }).catch(() => {
    prompt('Copie ce lien :', url);
  });
});

document.getElementById('add-friend-btn').addEventListener('click', () => {
  const url = prompt('Colle le lien de ton ami :');
  if (!url) return;
  const data = parseFriendURL(url);
  if (!data?.n) { showToast('❌ Lien invalide'); return; }
  addFriend(data);
  renderScoreboard();
  showToast(`✅ ${data.n} ajouté au classement !`);
});

/* ── INIT ── */
function enterApp() {
  showScreen('app');
  showTab('tab-home');
}

function init() {
  load();
  buildOnboardingGrid();
  checkShareURL();
  setTimeout(() => {
    if (state.user.onboarded) {
      enterApp();
    } else {
      showScreen('onboarding');
    }
  }, 1200);
}

init();

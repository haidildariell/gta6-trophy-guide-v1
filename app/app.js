// Leonida Legend — GTA VI trophy guide & tracker.
// Offline static app: all data is local (app/data/trophies.json). Progress lives in
// localStorage and never leaves the browser unless the user exports it.
const doc = await (await fetch('data/trophies.json')).json();
const TROPHIES = doc.trophies;
const BY_ID = new Map(TROPHIES.map((t) => [t.id, t]));

const KIND_LABEL = {
  story: 'Story', side: 'Side strands', collectibles: 'Collectibles', activities: 'Activities',
  robbery: 'Robbery', exploration: 'Exploration', money: 'Money', combat: 'Combat',
  partner: 'Partner', secret: 'Secret', completion: '100% Completion', platinum: 'Platinum',
};
const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

const PHASES = [
  { title: '1 · Before you start — saves', note: 'GTA 6 has no mission replay and no New Game Plus. These four habits keep one playthrough enough.', ids: [], saveBox: true },
  { title: '2 · Story — Chapters 1–4 + finale', note: 'Twelve unmissable trophies. Play the story and they pop; chapter trophies can pop at the start of the next chapter rather than on the last cutscene.', ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] },
  { title: '3 · Stranger strands', note: 'Eight mission strands for strangers, plus five named-stranger finales. Andy’s, Billy’s and Tyrone’s strands do NOT count toward Strangers & Freaks — they have their own trophies.', ids: [22, 23, 24, 25, 26, 27, 29] },
  { title: '4 · Partner & robberies', note: 'Needs Jason and Lucia together (switching opens in Chapter 2). Vaults open near the end of Chapter 4; jewelry robberies open with the Chapter 3 mission Yasmani’s Jewelry Jobs.', ids: [33, 34, 39, 40, 41, 43, 46] },
  { title: '5 · Collectibles & exploration', note: 'Meditation spots, card sets, WAiNK scans, vehicles and the whole map. The one missable trophy lives here — do its Chapter 1 step early.', ids: [28, 30, 31, 35, 42] },
  { title: '6 · Activities & combat', note: 'Stunts, races, shooting range, drone races, fishing, arcade, challenges — plus Combat Focus, the airliner and the tank.', ids: [15, 16, 17, 18, 19, 20, 21, 32, 36, 37, 38] },
  { title: '7 · Money & properties', note: 'Launder marked bills, spend across shops, buy the eight garages, register ten cars. Garages unlock after the Chapter 2 mission Daily Driver.', ids: [52, 53, 54, 55] },
  { title: '8 · Secrets & the long tail', note: 'Five of these have no confirmed unlock method at launch — this guide says so plainly instead of guessing. The other two fill up as you play.', ids: [44, 45, 47, 48, 49, 50, 51] },
  { title: '9 · 100% & Platinum', note: 'The 100% checklist (Progress > Stats > 100% Completion) only appears after the story, but earlier work already counts. Finish it, and the Platinum pops.', ids: [14, 1] },
];

const DEMO_EARNED = [2, 3, 4, 8, 10, 16, 20, 21, 33, 35, 42, 52, 53]; // 13 of 55, demo seed only

// ---------- state ----------
const STORE_KEY = 'gta6-trophy-progress-v1';
let saved = null;
try { saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null'); } catch { saved = null; }
const params = new URLSearchParams(location.search);
const state = {
  earned: new Set(saved?.earned ?? []),
  counts: saved?.counts ?? {},
  notes: saved?.notes ?? {},
  settings: { spoilers: saved?.settings?.spoilers ?? true, theme: saved?.settings?.theme ?? 'dark' },
  view: 'checklist',
  q: '', kind: 'all', grade: 'all', earnedOnly: false, hideEarned: false,
};
if (params.get('demo') === '1' && state.earned.size === 0) {
  for (const id of DEMO_EARNED) state.earned.add(id);
}
if (params.get('spoilers') === 'off') state.settings.spoilers = false;
if (params.get('spoilers') === 'on') state.settings.spoilers = true;
if (params.get('view') && ['checklist', 'roadmap', 'missables', 'nextup', 'about'].includes(params.get('view'))) state.view = params.get('view');
if (params.get('kind')) state.kind = params.get('kind');
if (params.get('grade')) state.grade = params.get('grade');
if (params.get('q')) state.q = params.get('q');
document.documentElement.dataset.theme = state.settings.theme;

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify({
    earned: [...state.earned], counts: state.counts, notes: state.notes, settings: state.settings,
  }));
}
const isEarned = (t) => state.earned.has(t.id);
const isHidden = (t) => t.hidden && state.settings.spoilers && !isEarned(t);
const fmt = (n) => n.toLocaleString('en-US');

// ---------- header progress ----------
function renderHeader() {
  const n = state.earned.size;
  const score = TROPHIES.filter(isEarned).reduce((s, t) => s + t.gamerscore, 0);
  document.getElementById('earnedCount').textContent = n;
  document.getElementById('progressFill').style.width = `${(n / 55) * 100}%`;
  document.getElementById('progressBar').setAttribute('aria-valuenow', String(n));
  document.getElementById('scoreLine').textContent = `${fmt(score)} / 1,000 Gamerscore`;
  const byGrade = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const tot = TROPHIES.filter((t) => t.grade === g).length;
    const got = TROPHIES.filter((t) => t.grade === g && isEarned(t)).length;
    return `${got}/${tot} ${g}`;
  }).join(' · ');
  document.getElementById('gradeLine').textContent = byGrade;
  const btn = document.getElementById('themeToggle');
  btn.textContent = state.settings.theme === 'dark' ? '☀️ Leonida Day' : '🌙 Vice Nights';
}

// ---------- filtering ----------
function visibleTrophies() {
  const q = state.q.trim().toLowerCase();
  return TROPHIES.filter((t) => {
    if (state.kind === 'missable' && !t.missable) return false;
    if (state.kind === 'online') return false; // there are no online trophies
    if (state.kind !== 'all' && state.kind !== 'missable' && t.kind !== state.kind) return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.earnedOnly && !isEarned(t)) return false;
    if (state.hideEarned && isEarned(t)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
    return true;
  }).sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.id - b.id);
}

// ---------- checklist ----------
function badge(t) {
  const out = [`<span class="badge ${t.grade}">${t.grade}</span>`];
  if (t.gamerscore > 0) out.push(`<span class="badge">${t.gamerscore}G</span>`);
  if (t.hidden) out.push('<span class="badge hidden">Hidden</span>');
  if (t.missable) out.push('<span class="badge missable">⚠ Missable</span>');
  if (t.timeSensitive) out.push('<span class="badge timesens">Time-sensitive</span>');
  out.push(`<span class="badge">${KIND_LABEL[t.kind]}</span>`);
  return out.join('');
}
function cardHTML(t) {
  const hidden = isHidden(t);
  const earned = isEarned(t);
  const count = t.target ? (state.counts[t.id] ?? 0) : null;
  const note = state.notes[t.id];
  return `<article class="card${earned ? ' earned' : ''}" data-id="${t.id}">
    <div class="topline">
      <input type="checkbox" data-earn="${t.id}" ${earned ? 'checked' : ''} aria-label="Mark ${hidden ? 'hidden trophy' : t.name} earned">
      <div>
        <div class="name${hidden ? ' hidden-name' : ''}">${hidden ? 'Hidden trophy — earn it to reveal' : escapeHtml(t.name)}${note ? ' <span class="note-dot" title="You left a note">🗒</span>' : ''}</div>
        <div class="desc">${hidden ? 'Hidden until earned — this trophy is hidden on PS5 until you unlock it.' : escapeHtml(t.description)}</div>
      </div>
    </div>
    <div class="badges">${badge(t)}</div>
    ${hidden ? '' : `<p class="guide-teaser">${escapeHtml(t.guide)}</p>`}
    <div class="row">
      ${hidden ? '<button type="button" disabled title="Earn this trophy to reveal its guide">Guide hidden</button>'
        : `<button type="button" class="guidebtn" data-guide="${t.id}">Guide &amp; sources</button>`}
      ${t.target ? `<span class="counter"><button type="button" data-dec="${t.id}" aria-label="Decrease count">−</button><input type="number" min="0" max="${t.target.n}" value="${count}" data-count="${t.id}" aria-label="Progress toward ${t.target.n} ${t.target.unit}"><button type="button" data-inc="${t.id}" aria-label="Increase count">+</button><span>${fmt(count)} / ${fmt(t.target.n)} ${escapeHtml(t.target.unit)}</span></span>` : ''}
    </div>
  </article>`;
}
function renderChecklist(view) {
  const list = visibleTrophies();
  view.innerHTML = `<div class="viewhead"><h2>Checklist — all 55 trophies</h2>
    <p>Tick a trophy when it pops. Official names, descriptions and grades, exactly as listed. Every guide cites its sources.</p></div>
    <p class="countline">Showing ${list.length} of 55 trophies${state.kind === 'online' ? ' — there are no online trophies in GTA 6; all 55 are single-player.' : ''}</p>
    ${list.length ? `<div class="cards">${list.map(cardHTML).join('')}</div>` : '<p class="empty">No trophies match these filters.</p>'}`;
}
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------- roadmap ----------
function renderRoadmap(view) {
  const saveBox = `<div class="savebox"><h3>Save habits that protect a one-playthrough Platinum</h3><ul>
    <li><b>No mission replay, no New Game Plus.</b> The game has 15 manual save slots plus one autosave: keep one save at the start of each chapter and an untouched one from just before the final mission, and rotate the rest.</li>
    <li><b>Do Lucia’s balcony meditation in Chapter 1.</b> It counts toward Positive Mental Attitude and is gone once Chapter 1 ends.</li>
    <li><b>Do Race Against Yago the moment it appears.</b> This Chapter 3 race in Yago’s street racing strand is time-sensitive (hourglass icon) and the strand counts toward Strangers &amp; Freaks. Save first, then race.</li>
    <li><b>Never use cheats on your trophy save.</b> Cheats should switch off both trophies and saving.</li>
  </ul></div>`;
  const phases = PHASES.map((p) => {
    if (p.saveBox) return '';
    const got = p.ids.filter((id) => state.earned.has(id)).length;
    const pct = Math.round((got / p.ids.length) * 100);
    const items = p.ids.map((id) => {
      const t = BY_ID.get(id);
      const done = state.earned.has(id);
      return `<li class="${done ? 'done' : ''}"><button type="button" data-guide="${id}">${done ? '✓ ' : ''}${escapeHtml(t.name)}</button></li>`;
    }).join('');
    return `<section class="phase"><h3>${escapeHtml(p.title)} <span class="pct">${got}/${p.ids.length} · ${pct}%</span></h3>
      <p>${escapeHtml(p.note)}</p><div class="bar"><span style="width:${pct}%"></span></div><ul>${items}</ul></section>`;
  }).join('');
  const total = state.earned.size;
  view.innerHTML = `<div class="viewhead"><h2>Roadmap to the Platinum</h2>
    <p>“Vice Got a Price!” needs the other 54 trophies — about 200 hours at difficulty 4/10, per guide-site estimates. Work the phases in order; the story first, then strands, then the open-world grind. You are ${total} of 55 there.</p></div>${saveBox}${phases}`;
}

// ---------- missables ----------
function renderMissables(view) {
  const m = BY_ID.get(28);
  const s = BY_ID.get(25);
  view.innerHTML = `<div class="viewhead"><h2>Missables</h2>
    <p>Good news: only one trophy is reported as possibly missable, and one strand mission is time-sensitive. Everything else stays available after the credits.</p></div>
    <div class="alert"><h3>⚠ ${escapeHtml(m.name)} — possibly missable ${isEarned(m) ? '✓ earned' : ''}</h3>
      <p>${escapeHtml(m.guide)}</p>
      <button type="button" class="guidebtn" data-guide="28">Full guide &amp; sources</button></div>
    <div class="alert" style="border-left-color: var(--gold)"><h3>⏳ ${escapeHtml(s.name)} — one time-sensitive mission ${isEarned(s) ? '✓ earned' : ''}</h3>
      <p>Race Against Yago in Chapter 3 carries an hourglass icon: miss the window and that strand mission is gone for this playthrough. Save first, then race. The trophy itself is not missable — other strands can fill the 8.</p>
      <button type="button" class="guidebtn" data-guide="25">Full guide &amp; sources</button></div>
    <div class="phase"><h3>Everything else is safe</h3>
    <p>Side-story finales, robberies, collectibles and the whole 100% checklist stay open after the story, and the checklist only appears after the story (Progress &gt; Stats &gt; 100% Completion) while counting work done earlier. No trophy needs online play or a difficulty setting, and there are no mission medals.</p></div>`;
}

// ---------- next up ----------
function nextUpList() {
  const phaseIndex = new Map();
  PHASES.forEach((p, i) => p.ids.forEach((id) => phaseIndex.set(id, i)));
  return TROPHIES.filter((t) => !isEarned(t)).sort((a, b) => {
    const sa = a.missable ? 0 : a.timeSensitive ? 1 : 2;
    const sb = b.missable ? 0 : b.timeSensitive ? 1 : 2;
    if (sa !== sb) return sa - sb;
    const pa = phaseIndex.get(a.id) ?? 9, pb = phaseIndex.get(b.id) ?? 9;
    if (pa !== pb) return pa - pb;
    return (a.target?.n ?? 0) - (b.target?.n ?? 0) || a.id - b.id;
  });
}
function renderNextUp(view) {
  const list = nextUpList().slice(0, 5);
  view.innerHTML = `<div class="viewhead"><h2>Next Up — your planner</h2>
    <p>The five most useful trophies to chase next: the missable one first, then anything time-sensitive, then the roadmap order. Tick one off and the list re-sorts.</p></div>
    <div class="nextlist">${list.map((t, i) => {
      const hidden = isHidden(t);
      return `<div class="nextitem"><div class="rank">${i + 1}</div><div class="body">
        <b>${hidden ? 'Hidden trophy' : escapeHtml(t.name)}</b> <span class="badge ${t.grade}">${t.grade}</span>
        <p>${hidden ? 'Hidden until earned.' : escapeHtml(t.description)}${t.target ? ` — ${fmt(state.counts[t.id] ?? 0)} / ${fmt(t.target.n)} ${escapeHtml(t.target.unit)} so far.` : ''}</p>
        <span class="why">${t.missable ? 'Do first — missable' : t.timeSensitive ? 'Time-sensitive mission inside' : 'Next in the roadmap'}</span>
      </div>
      ${hidden ? '' : `<button type="button" class="guidebtn" data-guide="${t.id}">Guide</button>`}
      <button type="button" data-earn="${t.id}">Mark earned</button></div>`;
    }).join('')}</div>
    <p class="countline" style="margin-top:14px">${state.earned.size} of 55 earned — ${55 - state.earned.size} to go.</p>`;
}

// ---------- about ----------
function renderAbout(view) {
  view.innerHTML = `<div class="viewhead"><h2>About &amp; sources</h2>
    <p>How this guide is built, what it will and will not claim, and where every fact comes from.</p></div>
    <section class="phase"><h3>What this is</h3><p>An offline, open-source tracker and guide for the 55 official Grand Theft Auto VI trophies on PlayStation 5 (1 Platinum, 2 Gold, 6 Silver, 46 Bronze; 28 hidden; 1,000 Gamerscore on Xbox). It runs from its own files — no network requests, no account, no ads. Your progress is stored in this browser's localStorage; export it to a file to back it up or move it.</p></section>
    <section class="phase"><h3>What it will not do</h3><p>Five trophies (In The Beginning…, Capital Offense, Bad Luck, I Guess, The Truth Is Out There, Ten Pin) have no confirmed unlock method at launch. Their guides say so plainly instead of inventing steps. Where a place or step is not pinned down, the guide says “not yet checked in the game”. No text is copied from other guides — every guide is written in this guide's own words.</p></section>
    <section class="phase"><h3>Sources</h3><p>Names, descriptions and grades: the official list as carried by Exophase (reported by Push Square, 18 Nov 2026). Hidden / visible split and Gamerscore values: Output Lag's trophy list, which prints both tables. Method details: Output Lag, GTABase and KeenGamer, cited beside each guide. Platinum estimate (~200 hours, 4/10): PowerPyx via GTABase / KeenGamer. Rarity data is not published yet — PSNProfiles and TrueTrophies had no GTA VI page at launch — so no rarity figures are shown anywhere in this guide.</p>
    <ul class="sources">
      <li><a href="https://www.gtabase.com/articles/gta-6/gta-6-achievements-trophies-list-ps5-xbox-series" target="_blank" rel="noopener">GTABase — GTA 6 Trophy Guide &amp; Achievements List</a></li>
      <li><a href="https://outputlag.com/guides/gta-6-trophy-list/" target="_blank" rel="noopener">Output Lag — GTA 6 Trophy List: All 55 Trophies and Achievements</a></li>
      <li><a href="https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/" target="_blank" rel="noopener">KeenGamer — GTA 6 Trophy Guide &amp; Platinum Roadmap</a></li>
      <li><a href="https://www.radiotimes.com/technology/gaming/gta-6-trophies-achievements-list/" target="_blank" rel="noopener">Radio Times — GTA 6 trophy guide: full list</a></li>
      <li><a href="https://egamers.io/gta-6-trophy-list-all-55-trophies-and-achievements-plus-the-hardest-ones/" target="_blank" rel="noopener">EGamers.io — GTA 6 Trophy List: All 55 Trophies and Achievements</a></li>
    </ul></section>
    <section class="phase"><h3>Demo mode</h3><p>Open this page with <code>?demo=1</code> to preview the tracker with 13 of 55 trophies already earned. Demo progress is only seeded when you have no saved progress, and it is saved like your own ticks — use Reset to clear it.</p></section>`;
}

// ---------- guide panel ----------
let openId = null;
function openGuide(id) {
  const t = BY_ID.get(Number(id));
  if (!t) return;
  openId = t.id;
  const panel = document.getElementById('guidePanel');
  const body = document.getElementById('panelBody');
  const count = t.target ? (state.counts[t.id] ?? 0) : null;
  const unconfirmed = /No confirmed unlock method/.test(t.guide);
  body.innerHTML = `
    <div class="badges">${badge(t)}</div>
    <h2>${escapeHtml(t.name)}</h2>
    <p class="desc">${escapeHtml(t.description)}</p>
    <div class="earnrow"><input type="checkbox" id="panelEarn" ${isEarned(t) ? 'checked' : ''}> <label for="panelEarn"><b>${isEarned(t) ? 'Earned ✓' : 'Mark as earned'}</b></label></div>
    ${t.target ? `<div class="counter-big"><button type="button" id="panelDec">−</button><input type="number" id="panelCount" min="0" max="${t.target.n}" value="${count}"><button type="button" id="panelInc">+</button><span>${fmt(count)} / ${fmt(t.target.n)} ${escapeHtml(t.target.unit)}</span></div>` : ''}
    ${unconfirmed ? '<p class="warn">⚠ No confirmed unlock method at launch. The description is the only hint — this guide will not invent steps that have not been checked in the game.</p>' : ''}
    <h4>How to get it</h4><p class="guide">${escapeHtml(t.guide)}</p>
    <h4>Sources</h4>
    <ul class="sources">${t.sources.map((s) => s.url ? `<li><a href="${s.url}" target="_blank" rel="noopener">${escapeHtml(s.label)}</a></li>` : `<li>${escapeHtml(s.label)}</li>`).join('')}</ul>
    <h4>Your note</h4>
    <textarea id="panelNote" placeholder="Your own note — a spot, a loadout, a reminder…">${escapeHtml(state.notes[t.id] ?? '')}</textarea>`;
  panel.hidden = false;
  document.getElementById('panelEarn').addEventListener('change', (e) => {
    if (e.target.checked) state.earned.add(t.id); else state.earned.delete(t.id);
    save(); renderHeader(); render();
  });
  const pc = document.getElementById('panelCount');
  if (pc) {
    const setCount = (v) => {
      state.counts[t.id] = Math.max(0, Math.min(t.target.n, v || 0));
      save(); openGuide(t.id); renderHeader(); render();
    };
    pc.addEventListener('change', () => setCount(Number(pc.value)));
    document.getElementById('panelInc').addEventListener('click', () => setCount((state.counts[t.id] ?? 0) + 1));
    document.getElementById('panelDec').addEventListener('click', () => setCount((state.counts[t.id] ?? 0) - 1));
  }
  document.getElementById('panelNote').addEventListener('input', (e) => {
    const v = e.target.value.trim();
    if (v) state.notes[t.id] = v; else delete state.notes[t.id];
    save();
  });
}
function closeGuide() {
  document.getElementById('guidePanel').hidden = true;
  openId = null;
  renderHeader(); render();
}

// ---------- render dispatch ----------
const RENDER = { checklist: renderChecklist, roadmap: renderRoadmap, missables: renderMissables, nextup: renderNextUp, about: renderAbout };
function render() {
  renderHeader();
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.view === state.view));
  RENDER[state.view](document.getElementById('view'));
  if (openId) { /* keep panel as-is; its content refreshes on open */ }
}

// ---------- events ----------
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => {
  state.view = b.dataset.view; closeGuideIfOpen(); render();
}));
function closeGuideIfOpen() { document.getElementById('guidePanel').hidden = true; openId = null; }
document.getElementById('panelClose').addEventListener('click', closeGuide);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeGuide();
  if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
    e.preventDefault(); document.getElementById('search').focus();
  }
});
const searchEl = document.getElementById('search');
searchEl.value = state.q;
searchEl.addEventListener('input', () => { state.q = searchEl.value; if (state.view !== 'checklist') state.view = 'checklist'; render(); });
document.getElementById('kind').value = state.kind;
document.getElementById('kind').addEventListener('change', (e) => { state.kind = e.target.value; if (state.view !== 'checklist') state.view = 'checklist'; render(); });
document.getElementById('grade').value = state.grade;
document.getElementById('grade').addEventListener('change', (e) => { state.grade = e.target.value; if (state.view !== 'checklist') state.view = 'checklist'; render(); });
document.getElementById('earnedOnly').addEventListener('change', (e) => { state.earnedOnly = e.target.checked; if (state.view !== 'checklist') state.view = 'checklist'; render(); });
document.getElementById('hideEarned').addEventListener('change', (e) => { state.hideEarned = e.target.checked; if (state.view !== 'checklist') state.view = 'checklist'; render(); });
const spoilEl = document.getElementById('spoilers');
spoilEl.checked = state.settings.spoilers;
spoilEl.addEventListener('change', () => { state.settings.spoilers = spoilEl.checked; save(); render(); });
document.getElementById('themeToggle').addEventListener('click', () => {
  state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = state.settings.theme;
  save(); renderHeader();
});
document.getElementById('export').addEventListener('click', () => {
  const data = { game: doc.game, exportedAt: new Date().toISOString(), earned: [...state.earned], counts: state.counts, notes: state.notes };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
});
document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = (data.earned ?? []).filter((id) => BY_ID.has(Number(id))).map(Number);
    state.earned = new Set(ids);
    if (data.counts) state.counts = Object.fromEntries(Object.entries(data.counts).filter(([k]) => BY_ID.has(Number(k))));
    if (data.notes) state.notes = Object.fromEntries(Object.entries(data.notes).filter(([k]) => BY_ID.has(Number(k))));
    save(); render();
  } catch { alert('That file is not a valid progress export.'); }
  e.target.value = '';
});
document.getElementById('reset').addEventListener('click', () => {
  if (!confirm('Clear all earned ticks, counters and notes?')) return;
  state.earned = new Set(); state.counts = {}; state.notes = {};
  save(); render();
});
// Delegated clicks inside the view: earn checkboxes, counters, guide buttons.
document.getElementById('view').addEventListener('click', (e) => {
  const g = e.target.closest('[data-guide]');
  if (g) { openGuide(g.dataset.guide); return; }
  const inc = e.target.closest('[data-inc]');
  if (inc) {
    const t = BY_ID.get(Number(inc.dataset.inc));
    state.counts[t.id] = Math.min(t.target.n, (state.counts[t.id] ?? 0) + 1); save(); render(); return;
  }
  const dec = e.target.closest('[data-dec]');
  if (dec) {
    const t = BY_ID.get(Number(dec.dataset.dec));
    state.counts[t.id] = Math.max(0, (state.counts[t.id] ?? 0) - 1); save(); render(); return;
  }
});
document.getElementById('view').addEventListener('change', (e) => {
  const earn = e.target.closest('[data-earn]');
  if (earn) {
    const id = Number(earn.dataset.earn);
    if (earn.checked) state.earned.add(id); else state.earned.delete(id);
    save(); render(); return;
  }
  const cnt = e.target.closest('[data-count]');
  if (cnt) {
    const t = BY_ID.get(Number(cnt.dataset.count));
    state.counts[t.id] = Math.max(0, Math.min(t.target.n, Number(cnt.value) || 0));
    save(); render();
  }
});

save();
render();
if (params.get('open')) openGuide(params.get('open'));

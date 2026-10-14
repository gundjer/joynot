// JoyNot learning-game engine (v6). Every mini-game is one file that calls start({...}).
// The engine does: screens, lessons (I do → we do → you do), rounds, adaptive levels, grade editions
// (the look grows up with the kid), graduation badges, challenges, saving, sounds, read-aloud and the answer log.
// v6 teaching loop:
//   • Quiet support: when a kid struggles, questions silently come from an easier level, with a "let's do one
//     together" walk-through, then step back up. The kid only ever sees their real level.
//   • Mastery: a level counts as learned at 5 of the last 6 right on the first try with no help.
//   • Grade Boss: a grade badge needs every level of that grade mastered AND a mixed check round (80%).
//   • Rounds sized to attention span (K–1: 5, 2–3: 8, 4–5: 10), brain breaks, missed skills come back later.
//   • Play styles (modes.js): Critter Hatchery, Turbo Race, Block Builder, Dungeon Quest.
// Works on phones (upright + sideways), tablets and computers: touch, mouse, pen and keyboard.
//
// A game gives:
//   question(level, ctx)  -> { key, prompt, say?, expected, explain?, steps?: [..], tries?, timer?, ...anything }
//   mount(q, ui)          -> { hint?(i), reveal?(), retry?(), destroy?(), onTimeout?(), resize?() }
//   lessons(level, ed)    -> [ { title, text, say?, art?: html | (el, api) => cleanup } ]   (optional)
import { Store } from './storage.js';
import { Sfx } from './audio.js';
import { Voice } from './speech.js';
import { DragDrop } from './drag.js';
import { Keys, choices, numpad, timeEntry } from './ui.js';
import { el, $, pick, sleep, shuffle } from './util.js';
import { scene, sceneFits } from './scene.js';
import { REAL } from './reallife.js';
import { MODE_LIST, HEROES, defaultMode, loadMeta, saveMeta, createMode, collectionView, critterCount, CRITTER_COUNT } from './modes.js';

const G = window.JOY_GAME || { title: 'Game', track: 'game', levels: [{ name: 'Level 1', grade: 'K' }], defaults: {} };
const CFG = Store.config;
const PRAISE = ['Great job!', 'You got it!', 'Awesome!', 'Nailed it!', 'Way to go!', 'Fantastic!', 'Yes! That’s right!', 'Brilliant!', 'Your hard work is paying off!', 'You used the steps — great thinking!'];
const PRAISE_PRO = ['Correct.', 'Nice work.', 'Solid.', 'Excellent.', 'Clean solve.', 'Spot on.', 'Sharp thinking.'];
const AGAIN = ['Not quite — try again!', 'Almost! Give it another try.', 'Mistakes help your brain grow. Try again!', 'Good try! Check each step.'];
export const EDITIONS = [
  { key: 'K', name: 'Kindergarten', title: 'Sprout', icon: '🌱' },
  { key: '1', name: '1st grade', title: 'Explorer', icon: '🧭' },
  { key: '2', name: '2nd grade', title: 'Adventurer', icon: '🗺️' },
  { key: '3', name: '3rd grade', title: 'Inventor', icon: '🔧' },
  { key: '4', name: '4th grade', title: 'Expert', icon: '🚀' },
  { key: '5', name: '5th grade', title: 'Master', icon: '👑' },
];
const RANKS = [[0, 'Rookie', '🥉'], [25, 'Apprentice', '🔰'], [75, 'Pro', '⭐'], [150, 'Expert', '🏅'], [300, 'Master', '🏆'], [500, 'Legend', '👑']];

let def, ui, cur = null, inst = {}, roundN = 0, qIndex = 0, round = null, mode = 'loading', dd = [];
let timer = null, paused = false, leaving = false, nextTimer = null, overlayOpen = false, pendingGrad = [];
let meta = null, play = null, breakTimer = null;
const MASTER_OF = 6, MASTER_NEED = 5;          // mastery: 5 of the last 6 clean
const BREAK_MIN = [12, 12, 18, 18, 25, 25];       // brain-break reminder (minutes) by grade
const ROUND_AUTO = [5, 5, 8, 8, 10, 10];          // questions per round by grade (attention span)
const S = () => Store.data.settings;
const on = k => String(S()[k] ?? 'on') !== 'off';
const levelInfo = n => G.levels[Math.max(0, Math.min(G.levels.length - 1, n - 1))] || { name: '', grade: '' };
/** 'K' -> 0, '2-3' -> 2, 'PK' -> 0 */
export const gradeNum = label => { const s = String(label || 'K').split('-')[0].trim(); return s === 'K' || s === 'PK' ? 0 : Math.max(0, Math.min(5, parseInt(s, 10) || 0)); };
const GRADES_IN_GAME = [...new Set(G.levels.map(l => gradeNum(l.grade)))].sort((a, b) => a - b);

export function edition(level = Store.data.level) {
  const look = S().look || 'auto';
  if (look === 'young') return 0;
  if (look === 'middle') return 2;
  if (look === 'older') return 4;
  return gradeNum(levelInfo(level).grade);
}
const band = e => (e <= 1 ? 'little' : e <= 3 ? 'mid' : 'pro');
const rankOf = xp => { let r = RANKS[0]; for (const x of RANKS) if (xp >= x[0]) r = x; const next = RANKS.find(x => x[0] > xp); return { name: r[1], icon: r[2], next: next ? next[0] : null, base: r[0] }; };

export function start(gameDef) {
  def = { tokenIcon: '⭐', tokenName: 'stars', howTo: [], mascot: '⭐', mascotName: 'Buddy', ...gameDef };
  window.__joyDef = def; // used by automated tests
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
}

// ------------------------------------------------------------------ layout
function build() {
  const kid = CFG.kid || { name: 'Player', avatar: '🙂', color: '#ff9d3d' };
  $('#app').innerHTML = `
  <section id="scr-loading" class="scr center">
    <div class="load-card">
      <div class="kid-av" style="--c:${kid.color}">${kid.avatar}</div>
      <h1 class="logo sm"></h1>
      <p class="sub">Getting ${esc(kid.name)}'s game ready<span class="dots3"></span></p>
    </div>
  </section>
  <section id="scr-title" class="scr hidden">
    <div class="title-card">
      <div class="mascot-big" aria-hidden="true"><span></span></div>
      <div class="ed-chip"></div>
      <h1 class="logo"></h1>
      <p class="story"></p>
      <div class="kid-line">
        <span class="kid-chip" style="--c:${kid.color}"><span>${kid.avatar}</span>${esc(kid.name)}</span>
        <button class="btn ghost sm" id="bSwitch" type="button">👥 Switch player</button>
      </div>
      <div class="title-extra"></div>
      <div class="t-stats"></div>
      <div class="badge-shelf" aria-label="Grade badges"></div>
      <div class="gc-banner hidden"></div>
      <div class="mode-pick" aria-label="Choose how to play"></div>
      <div class="row">
        <button class="btn big go" id="bPlay" type="button">▶ PLAY</button>
      </div>
      <div class="row">
        <button class="btn ghost" id="bLesson" type="button">📘 Lesson</button>
        <button class="btn ghost" id="bLessons" type="button">📚 All lessons</button>
        <button class="btn ghost" id="bChallenge" type="button">⚡ Challenge</button>
        <button class="btn ghost" id="bStuff" type="button">🎒 My stuff</button>
        <button class="btn ghost" id="bBack" type="button">🏠 Back to games</button>
      </div>
      <ul class="howto"></ul>
      <div class="key-hint">⌨️ Keyboard: 1–4 pick an answer · Enter = Check / Next · Esc = Pause</div>
      <a class="grownups" href="${CFG.urls.grownups || '/grown-ups'}">Grown-ups 🔒</a>
    </div>
  </section>
  <section id="scr-play" class="scr play hidden">
    <header class="hud">
      <button class="round-btn" id="bPause" type="button" aria-label="Pause">⏸</button>
      <div class="qdots" aria-label="Progress"></div>
      <div class="pill lvl"></div>
      <div class="pill tok"></div>
    </header>
    <div class="modestrip hidden" aria-hidden="true"></div>
    <div class="prompt">
      <div class="mascot-sm" aria-hidden="true"></div>
      <div class="bubble"><div class="qtag hidden"></div><div class="ptext" aria-live="polite"></div><button class="speak" id="bSpeak" type="button" aria-label="Read it to me">🔊</button></div>
      <div class="timerbar hidden"><div></div></div>
    </div>
    <main class="stage" id="stage"></main>
    <footer class="actions">
      <button class="btn ghost" id="bHelp" type="button">💡 Help</button>
      <button class="btn ghost hidden" id="bReLesson" type="button">📘</button>
      <button class="btn go hidden" id="bCheck" type="button">✔ Check</button>
      <button class="btn go hidden" id="bNext" type="button">Next ▶</button>
    </footer>
    <div class="feedback" role="status"></div>
  </section>
  <div id="ov-pause" class="ov hidden"><div class="panel">
    <h2>Paused</h2>
    <button class="btn big go" id="bResume" type="button">▶ Keep playing</button>
    <button class="btn ghost" id="bPauseLesson" type="button">📘 Show the lesson again</button>
    <button class="btn ghost" id="bVoice" type="button"></button>
    <button class="btn ghost" id="bSfx" type="button"></button>
    <button class="btn ghost" id="bMusic" type="button"></button>
    <button class="btn ghost" id="bRestart" type="button">🔄 Start this round over</button>
    <button class="btn ghost" id="bMenu" type="button">🏠 Main menu</button>
    <button class="btn ghost" id="bExit" type="button">🚪 Exit to JoyNot</button>
  </div></div>
  <div id="ov-done" class="ov hidden"><div class="panel">
    <div class="done-stars" aria-hidden="true"></div>
    <h2 class="done-title">Round complete!</h2>
    <div class="done-reward"></div>
    <p class="done-text"></p>
    <div class="done-extra"></div>
    <div class="brainbreak hidden"></div>
    <button class="btn big go" id="bAgain" type="button">▶ Play again</button>
    <button class="btn ghost" id="bDoneMenu" type="button">🏠 Main menu</button>
    <button class="btn ghost" id="bDoneExit" type="button">🚪 Exit to JoyNot</button>
  </div></div>
  <div id="ov-learn" class="ov hidden"><div class="panel lesson">
    <div class="ls-head"><span class="ls-tag">📘 Lesson</span><span class="ls-level"></span><button class="x" id="bLsClose" type="button" aria-label="Close lesson">✖</button></div>
    <div class="ls-dots"></div>
    <h2 class="ls-title"></h2>
    <div class="ls-art"></div>
    <p class="ls-text"></p>
    <div class="ls-actions">
      <button class="btn ghost" id="bLsBack" type="button">◀ Back</button>
      <button class="btn ghost" id="bLsSay" type="button" aria-label="Read it to me">🔊</button>
      <button class="btn go" id="bLsNext" type="button">Next ▶</button>
    </div>
  </div></div>
  <div id="ov-list" class="ov hidden"><div class="panel wide">
    <h2>📚 Lessons</h2>
    <p class="sub">Tap any lesson to learn it again.</p>
    <div class="ls-list"></div>
    <button class="btn ghost" id="bListClose" type="button">Close</button>
  </div></div>
  <div id="ov-stuff" class="ov hidden"><div class="panel wide">
    <h2>🎒 My stuff</h2>
    <div class="stuff-body"></div>
    <button class="btn go" id="bStuffClose" type="button">Close</button>
  </div></div>
  <div id="ov-gc" class="ov hidden"><div class="panel cert">
    <div class="cert-ribbon">🎓</div>
    <h2 class="gc-title">Grade Boss!</h2>
    <p class="gc-text"></p>
    <button class="btn big go" id="bGcGo" type="button">⚔️ I'm ready!</button>
    <button class="btn ghost" id="bGcLater" type="button">Practice a little first</button>
  </div></div>
  <div id="ov-grad" class="ov hidden"><div class="panel cert">
    <div class="cert-ribbon">🎓</div>
    <h2 class="cert-title">Graduation!</h2>
    <p class="cert-text"></p>
    <div class="cert-badge"></div>
    <p class="cert-next"></p>
    <button class="btn big go" id="bGradOk" type="button">Keep going ▶</button>
  </div></div>
  <div class="toast" role="status"></div>
  <div class="confetti" aria-hidden="true"></div>`;
  $('#scr-loading .logo').textContent = G.title;
  $('#scr-title .logo').textContent = G.title;
  $('.mascot-big span').textContent = def.mascot;
  $('.mascot-sm').textContent = def.mascot;
  $('.howto').innerHTML = def.howTo.map(t => `<li>${t}</li>`).join('');
  if (!def.lessons) ['#bLesson', '#bLessons', '#bPauseLesson'].forEach(hide);
}
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function show(id) { $(id).classList.remove('hidden'); }
function hide(id) { $(id).classList.add('hidden'); }
function toScreen(id) { ['#scr-loading', '#scr-title', '#scr-play'].forEach(s => (s === id ? show(s) : hide(s))); }

function sizeApp() {
  const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  document.documentElement.style.setProperty('--app-h', Math.round(h) + 'px');
}

/** Puts ed-0 … ed-5 and band-little / band-mid / band-pro on <body> so the look grows with the kid. */
function applyEdition() {
  const e = edition();
  const b = document.body;
  // dark or light: each game has its own (space, tech and coding games are dark); grown-ups can change it
  const t = S().theme || 'auto', dark = t === 'dark' || (t !== 'light' && !!G.dark);
  b.className = b.className.replace(/\b(ed-\d|band-\w+|dark)\b/g, '').replace(/\s+/g, ' ').trim() + ` ed-${e} band-${band(e)}${dark ? ' dark' : ''}`;
  try { document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0e1424' : '#fff8ee'); } catch (x) {}
  return e;
}

// ------------------------------------------------------------------ boot
async function boot() {
  if (G.theme) for (const [k, v] of Object.entries(G.theme)) document.documentElement.style.setProperty('--' + k, v);
  build();
  sizeApp();
  window.addEventListener('resize', sizeApp);
  window.addEventListener('orientationchange', () => setTimeout(sizeApp, 300));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', sizeApp);
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { Voice.stop(); Sfx.stopMusic(); Store.save(); Store.beacon(); if (mode === 'play') pauseGame(); }
    else applySettings();
  });
  window.addEventListener('pagehide', () => Store.beacon());
  document.addEventListener('keydown', onKey);
  wire();
  const stage = $('#stage');
  if (window.ResizeObserver) new ResizeObserver(() => sizeStage()).observe(stage);
  window.addEventListener('resize', sizeStage);

  const res = (await Store.load()) || {};
  const d = Store.data;
  d.extra = d.extra || {};
  d.extra.lessons = d.extra.lessons && !Array.isArray(d.extra.lessons) ? d.extra.lessons : {};
  d.extra.badges = d.extra.badges && !Array.isArray(d.extra.badges) ? d.extra.badges : {};
  initTeaching(d);
  try { if (!sessionStorage.getItem('joynot_session_start')) sessionStorage.setItem('joynot_session_start', String(Date.now())); } catch (e) {}
  Store.onExternalChange = () => { initTeaching(Store.data); applySettings(); applyEdition(); refreshTitle(); refreshHud(); };
  applySettings(false);
  applyEdition();
  refreshTitle();
  toScreen('#scr-title'); mode = 'title';
  if (res.offline) toast('📶 No internet right now. Progress saves on this device for now.', 4200);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
}

/** v6 bookkeeping: mastery per level, quiet support depth, Grade Boss, review queue, play style, rewards. */
function initTeaching(d) {
  const x = d.extra;
  const obj = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  x.m = obj(x.m);                       // { level: { h: [1,0,1…], ok: time } }
  x.sup = Math.max(0, parseInt(x.sup, 10) || 0);
  x.supLevel = parseInt(x.supLevel, 10) || 0;
  if (x.supLevel !== d.level) { x.sup = 0; x.supLevel = d.level; } // a grown-up moved the level: start fresh
  x.gc = x.gc && typeof x.gc === 'object' && !Array.isArray(x.gc) ? x.gc : null;
  x.rq = Array.isArray(x.rq) ? x.rq.filter(r => r && r.l >= 1 && r.l <= G.levels.length) : [];
  if (!x.v6) { x.v6 = Date.now(); if (String(S().round) === '8') S().round = 'auto'; } // move existing kids to attention-span rounds
  meta = loadMeta(d, (CFG.kid || {}).id ?? 0);
  if (!x.mode || !MODE_LIST.some(m => m.key === x.mode)) x.mode = '';
  if (x.gc && gradeNum(levelInfo(d.level).grade) !== x.gc.g) x.gc = null; // a grown-up moved the level
}
const modesOn = () => S().modes !== 'off';
const curMode = () => (modesOn() ? (Store.data.extra.mode || defaultMode(edition())) : '');
const supportOn = () => S().support !== 'off';
const gradeLevels = g => G.levels.map((L, i) => i + 1).filter(n => gradeNum(levelInfo(n).grade) === g);
const workLevel = () => { const d = Store.data; return Math.max(1, d.level - (supportOn() ? d.extra.sup : 0)); };
const mastered = n => !!(Store.data.extra.m[n] && Store.data.extra.m[n].ok);

function sizeStage() {
  const s = $('#stage'); if (!s) return;
  const r = s.getBoundingClientRect();
  s.style.setProperty('--sw', Math.max(120, Math.floor(r.width)) + 'px');
  s.style.setProperty('--sh', Math.max(120, Math.floor(r.height)) + 'px');
  s.style.setProperty('--sm', Math.max(120, Math.floor(Math.min(r.width, r.height))) + 'px');
  inst && inst.resize && inst.resize(r);
}

function applySettings(music = true) {
  Voice.enabled = on('voice');
  Sfx.enabled = on('sfx');
  if (music && mode === 'play' && S().music === 'on') Sfx.startMusic(); else if (S().music !== 'on') Sfx.stopMusic();
  $('#bVoice').textContent = '🗣️ Read aloud: ' + (on('voice') ? 'On' : 'Off');
  $('#bSfx').textContent = '🔔 Sounds: ' + (on('sfx') ? 'On' : 'Off');
  $('#bMusic').textContent = '🎵 Music: ' + (S().music === 'on' ? 'On' : 'Off');
}

function wire() {
  const unlock = () => { Sfx.init(); Voice.unlock(); };
  $('#bPlay').addEventListener('click', () => { unlock(); goFullscreen(); playPressed(); });
  $('#bStuff').addEventListener('click', () => { unlock(); const b = $('.stuff-body'); b.innerHTML = ''; b.appendChild(collectionView(meta)); overlayOpen = true; show('#ov-stuff'); });
  $('#bStuffClose').addEventListener('click', () => { hide('#ov-stuff'); overlayOpen = false; });
  $('#bGcGo').addEventListener('click', () => { hide('#ov-gc'); overlayOpen = false; startRound({ check: true }); });
  $('#bGcLater').addEventListener('click', () => { hide('#ov-gc'); overlayOpen = false; startRound(); });
  $('#bChallenge').addEventListener('click', () => { unlock(); goFullscreen(); startRound({ challenge: true }); });
  $('#bLesson').addEventListener('click', () => { unlock(); showLesson(Store.data.level, () => {}, { fromMenu: true }); });
  $('#bLessons').addEventListener('click', () => { unlock(); showLessonList(); });
  $('#bListClose').addEventListener('click', () => { hide('#ov-list'); overlayOpen = false; });
  $('#bBack').addEventListener('click', () => exitTo(CFG.urls.exit || '/dashboard'));
  $('#bSwitch').addEventListener('click', () => exitTo(CFG.urls.switch || '/dashboard'));
  $('#bPause').addEventListener('click', () => pauseGame());
  $('#bResume').addEventListener('click', () => resumeGame());
  $('#bPauseLesson').addEventListener('click', () => { hide('#ov-pause'); showLesson(cur ? cur.q.level : Store.data.level, () => show('#ov-pause'), { fromMenu: true }); });
  $('#bReLesson').addEventListener('click', () => { if (cur) { pauseTimer(); showLesson(cur.q.level, () => resumeTimer(), { fromMenu: true }); } });
  $('#bVoice').addEventListener('click', () => { S().voice = on('voice') ? 'off' : 'on'; Store.save(); applySettings(); if (!on('voice')) Voice.stop(); });
  $('#bSfx').addEventListener('click', () => { S().sfx = on('sfx') ? 'off' : 'on'; Store.save(); applySettings(); });
  $('#bMusic').addEventListener('click', () => { S().music = S().music === 'on' ? 'off' : 'on'; Store.save(); applySettings(false); if (S().music === 'on') Sfx.startMusic(); });
  $('#bRestart').addEventListener('click', () => { hide('#ov-pause'); paused = false; startRound({ challenge: round?.challenge }); });
  $('#bMenu').addEventListener('click', () => toTitle());
  $('#bExit').addEventListener('click', () => exitTo(CFG.urls.exit || '/dashboard'));
  $('#bAgain').addEventListener('click', () => { if ($('#bAgain').disabled) return; hide('#ov-done'); if (round?.challenge) startRound({ challenge: true }); else playPressed(); });
  $('#bDoneMenu').addEventListener('click', () => { hide('#ov-done'); toTitle(); });
  $('#bDoneExit').addEventListener('click', () => exitTo(CFG.urls.exit || '/dashboard'));
  $('#bSpeak').addEventListener('click', () => { Sfx.init(); if (cur) { if (cur.spoken) Voice.speak(cur.spoken, { force: true }); else speakQuestion(cur, true); } });
  $('#bHelp').addEventListener('click', () => help());
  $('#bCheck').addEventListener('click', () => { if (cur && !cur.done && ui._check) { Sfx.click(); ui._check(); } });
  $('#bNext').addEventListener('click', () => nextQuestion());
  $('#bGradOk').addEventListener('click', () => closeGrad());
}

function onKey(e) {
  if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
  if (!$('#ov-learn').classList.contains('hidden')) {
    if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); $('#bLsNext').click(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); $('#bLsBack').click(); }
    else if (e.key === 'Escape') $('#bLsClose').click();
    return;
  }
  if (!$('#ov-stuff').classList.contains('hidden')) { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); $('#bStuffClose').click(); } return; }
  if (!$('#ov-gc').classList.contains('hidden')) { if (e.key === 'Enter') { e.preventDefault(); $('#bGcGo').click(); } else if (e.key === 'Escape') $('#bGcLater').click(); return; }
  if (!$('#ov-grad').classList.contains('hidden')) { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); closeGrad(); } return; }
  if (mode === 'title' && e.key === 'Enter' && !$('#scr-title').classList.contains('hidden') && !overlayOpen) { e.preventDefault(); $('#bPlay').click(); return; }
  if (mode !== 'play') { if (e.key === 'Escape' && !$('#ov-done').classList.contains('hidden')) toTitle(); return; }
  if (e.key === 'Escape') { e.preventDefault(); paused ? resumeGame() : pauseGame(); return; }
  if (paused || overlayOpen) return;
  if (e.key === 'Enter' && !$('#bNext').classList.contains('hidden')) { e.preventDefault(); nextQuestion(); return; }
  if (cur && !cur.done && Keys.handle(e)) { e.preventDefault(); return; }
  if (e.key === 'Enter' && !$('#bCheck').classList.contains('hidden')) { e.preventDefault(); $('#bCheck').click(); }
}

function goFullscreen() {
  try {
    const coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    const d = document.documentElement;
    if (coarse && !document.fullscreenElement && d.requestFullscreen && !/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)) d.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
  } catch (e) {}
}

async function exitTo(url) {
  if (leaving) return; leaving = true;
  Voice.stop(); Sfx.stopMusic(); clearQuestion();
  ['#ov-pause', '#ov-done', '#ov-learn', '#ov-list', '#ov-grad', '#ov-stuff', '#ov-gc'].forEach(hide);
  $('#scr-loading .sub').textContent = 'Saving…'; toScreen('#scr-loading');
  mode = 'leaving';
  Store.save();
  try { if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen().catch(() => {}); } catch (e) {}
  await Store.flushNow();
  location.href = url;
}

// ------------------------------------------------------------------ title
function refreshTitle() {
  const d = Store.data, L = levelInfo(d.level), e = applyEdition(), Ed = EDITIONS[e];
  const story = typeof def.story === 'function' ? def.story(d, e) : def.story;
  $('.story').textContent = story || '';
  const rk = rankOf(d.stars);
  $('.ed-chip').innerHTML = `${Ed.icon} ${Ed.name} edition · <b>${Ed.title}</b>`;
  const pct = rk.next ? Math.round((d.stars - rk.base) / (rk.next - rk.base) * 100) : 100;
  $('.t-stats').innerHTML = `Level <b>${d.level}</b> of ${G.levels.length} · ${esc(L.name)} <span class="tag">Grade ${esc(L.grade)}</span><br>` +
    `${def.tokenIcon} <b>${d.stars}</b> ${def.tokenName} · ${rk.icon} Rank: <b>${rk.name}</b> · ${d.stats.rounds || 0} ${d.stats.rounds === 1 ? 'round' : 'rounds'}` +
    `<div class="xpbar" title="${rk.next ? `${rk.next - d.stars} to the next rank` : 'Top rank!'}"><span style="width:${pct}%"></span></div>` +
    (d.extra?.challengeBest ? `<small>⚡ Best challenge: ${d.extra.challengeBest}/5</small>` : '');
  const ex = $('.title-extra'); ex.innerHTML = '';
  if (def.titleExtra) { const x = def.titleExtra(d, e); if (x) ex.appendChild(x); }
  // badge shelf: one badge per grade this game covers
  const shelf = $('.badge-shelf'); shelf.innerHTML = '';
  GRADES_IN_GAME.forEach(g => {
    const E = EDITIONS[g], got = d.extra?.badges?.[E.key];
    shelf.appendChild(el('div', { class: 'gbadge' + (got ? ' got' : ''), title: got ? `${E.name} graduated!` : `Master the ${E.name} levels and beat the Grade Boss to earn this badge` }, [el('span', { class: 'gb-ic' }, got ? E.icon : '🔒'), el('small', {}, E.key === 'K' ? 'K' : E.key)]));
  });
  $('#bChallenge').classList.toggle('hidden', !(d.stats.rounds >= 1));
  // Grade Boss waiting?
  const gc = gcReady();
  const ban = $('.gc-banner');
  ban.classList.toggle('hidden', !d.extra.gc);
  if (d.extra.gc) ban.innerHTML = gc ? `🎓 <b>${EDITIONS[d.extra.gc.g].name} Grade Boss</b> is ready! Win it to graduate.` : `🎓 Grade Boss after one more practice round. You're close!`;
  $('#bPlay').textContent = gc ? '🎓 GRADE BOSS' : '▶ PLAY';
  renderModePick();
}

/** Choose a play style (and a hero for Dungeon Quest). */
function renderModePick() {
  const box = $('.mode-pick'); box.innerHTML = '';
  $('#bStuff').classList.toggle('hidden', !modesOn());
  if (!modesOn()) return;
  const cur = curMode(), m = meta || {};
  const counts = { hatch: `${critterCount(m)}/${CRITTER_COUNT}`, race: `🥇 ${m.wins || 0}`, build: `🧱 ${(m.builds || []).length}`, dungeon: `💰 ${m.gold || 0}` };
  MODE_LIST.forEach(M => {
    const b = el('button', { type: 'button', class: 'mp' + (M.key === cur ? ' on' : ''), title: M.blurb, 'aria-pressed': M.key === cur ? 'true' : 'false' }, [el('span', { class: 'mp-ic' }, M.icon), el('b', {}, M.name), el('small', {}, counts[M.key])]);
    b.addEventListener('click', () => { Sfx.init(); Sfx.click(); Store.data.extra.mode = M.key; Store.save(); renderModePick(); if (on('voice')) Voice.speak(M.name + '. ' + M.blurb); });
    box.appendChild(b);
  });
  if (cur === 'dungeon') {
    const row = el('div', { class: 'hero-pick' }, [el('small', {}, 'Your hero:')]);
    Object.entries(HEROES).forEach(([k, [ic, nm]]) => {
      const b = el('button', { type: 'button', class: 'hp' + (meta.hero === k ? ' on' : '') }, `${ic} ${nm}`);
      b.addEventListener('click', () => { Sfx.click(); meta.hero = k; saveMeta(Store.data, (CFG.kid || {}).id ?? 0, meta); Store.save(); renderModePick(); });
      row.appendChild(b);
    });
    box.appendChild(row);
  }
}

const gcReady = () => { const g = Store.data.extra.gc; return !!(g && !(g.wait > 0) && S().autoLevel !== 'off'); };
function playPressed() {
  if (gcReady()) {
    const g = Store.data.extra.gc.g, E = EDITIONS[g], mode = curMode();
    const boss = { hatch: 'a 🌟 Golden Egg', race: 'the 🏆 Championship Cup', build: 'the 🏰 Grand Castle', dungeon: 'the 🐉 Grade Guardian' }[mode] || 'the Grade Boss';
    $('.gc-title').textContent = `${E.name} Grade Boss!`;
    $('.gc-text').innerHTML = `You mastered every ${E.name} level! Now face ${boss}: <b>${checkLength()} mixed questions</b> from the whole grade. Get <b>${checkNeed()}</b> right on the first try to graduate. No Help button, so do your best thinking!`;
    overlayOpen = true; show('#ov-gc');
    if (on('voice')) Voice.speak(`${E.name} Grade Boss! You mastered every level. Get ${checkNeed()} of ${checkLength()} right on the first try to graduate.`);
    return;
  }
  startRound();
}
const checkLength = () => (edition() <= 1 ? 6 : 8);
const checkNeed = () => Math.ceil(checkLength() * 0.8);

function toTitle() {
  clearQuestion(); Voice.stop(); Sfx.stopMusic();
  ['#ov-pause', '#ov-done', '#ov-learn', '#ov-list'].forEach(hide); paused = false; overlayOpen = false;
  refreshTitle(); toScreen('#scr-title'); mode = 'title';
  Store.save();
}

// ------------------------------------------------------------------ lessons (I do)
const realFor = level => ((REAL[G.key] || {})[level] || null);
function lessonFor(level) {
  if (!def.lessons) return [];
  let list = [];
  try { list = (typeof def.lessons === 'function' ? def.lessons(level, edition(level)) : def.lessons[level]) || []; } catch (e) { console.error(e); return []; }
  const r = realFor(level);
  // every lesson ends with where kids will use it in real life
  return r && list.length ? [...list, { title: '🌍 In real life', text: r[1], art: `<div class="real-art">${r[0]}</div>` }] : list;
}

function showLesson(level, then, { fromMenu = false } = {}) {
  const slides = lessonFor(level);
  if (!slides.length) { then && then(); return; }
  let i = 0, cleanup = null;
  overlayOpen = true;
  const L = levelInfo(level);
  $('.ls-level').textContent = mode === 'play' ? L.name : `Level ${level}: ${L.name}`; // in play, never show a lower level number
  const draw = () => {
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    const sl = slides[i];
    $('.ls-title').textContent = sl.title || '';
    $('.ls-text').innerHTML = sl.html || esc(sl.text || '');
    const art = $('.ls-art'); art.innerHTML = '';
    art.className = 'ls-art' + (sl.art ? '' : ' empty');
    if (typeof sl.art === 'string') art.innerHTML = sl.art;
    else if (typeof sl.art === 'function') { try { cleanup = sl.art(art, { sfx: Sfx, voice: Voice, edition: edition(level), level }) || null; } catch (e) { console.error(e); } }
    $('.ls-dots').innerHTML = slides.map((_, j) => `<span class="${j === i ? 'on' : j < i ? 'done' : ''}"></span>`).join('');
    $('#bLsBack').disabled = i === 0;
    $('#bLsNext').textContent = i < slides.length - 1 ? 'Next ▶' : fromMenu ? '✔ Done' : '🤝 Let’s try one together!';
    if (on('voice')) Voice.speak(sl.say || stripTags(sl.html || sl.text || ''));
  };
  const close = () => {
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    Voice.stop(); hide('#ov-learn'); overlayOpen = false;
    $('#bLsNext').onclick = $('#bLsBack').onclick = $('#bLsSay').onclick = $('#bLsClose').onclick = null;
    const d = Store.data; d.extra.lessons[level] = Date.now(); Store.save();
    then && then();
  };
  $('#bLsNext').onclick = () => { Sfx.click(); if (i < slides.length - 1) { i++; draw(); } else close(); };
  $('#bLsBack').onclick = () => { if (i > 0) { i--; draw(); } };
  $('#bLsSay').onclick = () => { const sl = slides[i]; Voice.speak(sl.say || stripTags(sl.html || sl.text || ''), { force: true }); };
  $('#bLsClose').onclick = close;
  show('#ov-learn');
  draw();
}
const stripTags = h => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function showLessonList() {
  const box = $('.ls-list'); box.innerHTML = '';
  const d = Store.data;
  G.levels.forEach((L, idx) => {
    const n = idx + 1, open = n <= Math.max(d.level, 1) + 1, has = lessonFor(n).length > 0;
    if (!has) return;
    const b = el('button', { type: 'button', class: 'ls-item' + (open ? '' : ' locked') + (d.extra.lessons[n] ? ' seen' : ''), disabled: !open }, [
      el('b', {}, `${n}`), el('span', {}, L.name), el('small', {}, open ? (d.extra.lessons[n] ? '✔ seen' : `Grade ${L.grade}`) : '🔒'),
    ]);
    b.addEventListener('click', () => { hide('#ov-list'); showLesson(n, () => { show('#ov-list'); overlayOpen = true; }, { fromMenu: true }); });
    box.appendChild(b);
  });
  overlayOpen = true;
  show('#ov-list');
}

// ------------------------------------------------------------------ rounds
function roundLength() { const n = parseInt(S().round, 10); return n >= 3 && n <= 30 ? n : ROUND_AUTO[edition()] || 8; }

function startRound(opts = {}) {
  clearQuestion();
  ['#ov-done', '#ov-pause'].forEach(hide); paused = false;
  const d = Store.data;
  const challenge = !!opts.challenge, check = !!opts.check && !!d.extra.gc;
  roundN = challenge ? 5 : check ? checkLength() : roundLength(); qIndex = 0;
  round = { clean: 0, right: 0, tokens: 0, startLevel: d.level, results: [], challenge, check, guided: false, guideNext: false, reviewDone: false };
  if (check) { // Grade Boss: every level of the grade, mixed together (interleaved)
    const lv = gradeLevels(d.extra.gc.g); const list = [];
    while (list.length < roundN) list.push(...shuffle(lv));
    round.checkLevels = shuffle(list.slice(0, roundN));
  }
  toScreen('#scr-play'); mode = 'play';
  applySettings(); applyEdition();
  // play style strip
  const strip = $('.modestrip');
  try { play && play.destroy && play.destroy(); } catch (e) {}
  play = null;
  const mk = curMode();
  if (mk && !challenge) play = createMode(mk, { strip, total: roundN, edition: edition(), boss: check, meta, kid: CFG.kid || {}, sfx: Sfx });
  strip.classList.toggle('hidden', !play);
  if (!play) strip.innerHTML = '';
  sizeStage();
  refreshHud();
  if (check) { nextQuestion(); return; }
  // "I do": show the lesson the first time a kid reaches a level (or every round, if the grown-up chose that)
  const want = S().lessons || 'auto';
  if (!challenge && def.lessons && want !== 'off' && (want === 'always' || !d.extra.lessons[d.level]) && lessonFor(d.level).length) {
    showLesson(d.level, () => { round.guided = true; nextQuestion(); });
  } else nextQuestion();
}

function refreshHud() {
  if (!round) return;
  const d = Store.data, L = levelInfo(d.level), e = edition(), rk = rankOf(d.stars);
  // Always the kid's real level, even while quiet support is giving easier questions.
  $('.hud .lvl').textContent = round.challenge ? `⚡ Challenge · Lv ${Math.min(G.levels.length, d.level + 1)}` : round.check ? `🎓 ${EDITIONS[d.extra.gc.g].name} Grade Boss` : e >= 4 ? `Mission ${d.level} · ${L.name}` : `Lv ${d.level} · ${L.name}`;
  const fire = (d.streak || 0) >= 2 ? `  🔥${d.streak}` : '';
  $('.hud .tok').textContent = (e >= 2 ? `${rk.icon} ${d.stars} XP` : `${def.tokenIcon} ${d.stars}`) + fire;
  const dots = $('.qdots'); dots.innerHTML = '';
  for (let i = 0; i < roundN; i++) {
    const r = round.results[i];
    dots.appendChild(el('span', { class: 'qd' + (r === 'clean' ? ' ok' : r === 'ok' ? ' meh' : r === 'miss' ? ' no' : '') + (i === qIndex && !r ? ' now' : '') }));
  }
}

function pickLevel() {
  const d = Store.data, max = G.levels.length, lvl = workLevel(), x = d.extra;
  if (round.challenge) return { level: Math.min(max, d.level + 1), review: true, tag: '⚡ Challenge' };
  if (round.check) return { level: round.checkLevels[qIndex], review: true, check: true, tag: '🎓 Grade Boss' };
  if (round.guided && qIndex === 0) return { level: d.level, review: true, guided: true, tag: '🤝 Together' };
  // quiet support just kicked in: walk through an easier one together (no level shown)
  if (round.guideNext) { round.guideNext = false; return { level: lvl, review: false, guided: true, tag: '🤝 Let’s do one together' }; }
  // warm-up: the first question of a round comes from an earlier, easier level (spaced practice)
  if (qIndex === 0 && lvl > 1) return { level: Math.max(1, lvl - 1 - Math.floor(Math.random() * Math.min(3, lvl - 1))), review: true, tag: '🔁 Warm-up' };
  // retrieval practice: a skill missed in an earlier round comes back once
  const due = !round.reviewDone && qIndex >= 2 && x.rq.find(r => r.due <= (d.stats.rounds || 0) && r.l <= d.level);
  if (due) { round.reviewDone = true; return { level: due.l, review: true, recall: due, tag: '🧠 Remember this one?' }; }
  // interleaving: now and then mix in an earlier level
  if (lvl > 1 && Math.random() < 0.15) return { level: Math.max(1, lvl - 1 - (lvl > 2 && Math.random() < 0.3 ? 1 : 0)), review: true, tag: '🔁 Review' };
  return { level: lvl, review: false, tag: '' };
}

function clearQuestion() {
  clearTimeout(nextTimer); stopTimer();
  try { inst && inst.destroy && inst.destroy(); } catch (e) { console.error(e); }
  dd.forEach(x => x.destroy()); dd = [];
  inst = {}; Keys.clear();
  const st = $('#stage'); if (st) { st.innerHTML = ''; st.className = 'stage'; }
  const fb = $('.feedback'); if (fb) fb.className = 'feedback';
}

function nextQuestion() {
  if (pendingGrad.length) { showGrad(); return; }
  clearQuestion();
  hide('#bNext'); hide('#bCheck');
  if (qIndex >= roundN) { finishRound(); return; }
  const pickd = pickLevel();
  const { level, review } = pickd;
  const d = Store.data, e = edition(level);
  let q = null;
  for (let i = 0; i < 12; i++) {
    try { q = def.question(level, { settings: S(), state: d, review, edition: e, guided: !!pickd.guided }); } catch (err) { console.error(err); q = null; }
    if (q && !(d.recent || []).includes(q.key)) break;
  }
  if (!q) { toast('Oops — something went wrong. Try again!'); return; }
  q.level = level; q.review = review; q.guided = !!pickd.guided; q.edition = e; q.check = !!pickd.check; q.recall = pickd.recall || null;
  d.recent = [...(d.recent || []), q.key].slice(-12);
  cur = { q, tries: 0, helped: false, done: false, hints: 0, spoken: null };
  ui = makeUi(cur);
  setPrompt(q.promptHtml || esc(q.prompt));
  const tag = $('.qtag'); tag.textContent = pickd.tag || ''; tag.classList.toggle('hidden', !pickd.tag);
  const helpBtn = $('#bHelp');
  helpBtn.disabled = false;
  const stage = $('#stage');
  stage.classList.add('q-' + (q.mode || 'default'));
  try { inst = def.mount(q, ui) || {}; } catch (err) { console.error(err); toast('Oops — skipping that one.'); qIndex++; setTimeout(nextQuestion, 300); return; }
  const canHint = !!inst.hint || !!(q.steps && q.steps.length);
  helpBtn.classList.toggle('hidden', !canHint || S().hints === 'off' || q.check);
  $('#bReLesson').classList.toggle('hidden', !lessonFor(level).length || q.check);
  refreshHud();
  sizeStage();
  if (on('voice')) speakQuestion(cur);
  const t = q.timer || (round.challenge && def.challengeTimer !== 0 ? (def.challengeTimer || 45) : 0);
  if (t) startTimer(t);
  // "we do": walk through the first step together
  if (q.guided && canHint) setTimeout(() => { if (cur && cur.q === q && !cur.done) help(true); }, on('voice') ? 2600 : 600);
}

// ------------------------------------------------------------------ little readers: hear the answer choices
// Auto: on when the kid reads at Pre-K, K or 1st grade (from Grown-ups), or for K–1 levels if no reading grade is set.
// A game sets q.readOptions = false when reading the choices would give the answer away (letters, sounds, spelling…),
// or true to read picture choices that have names (they are not read by default, e.g. clock faces).
const READ_GRADES = ['PK', 'K', '1'];
function preReader(q) {
  const m = S().readChoices || 'auto';
  if (m === 'off' || !on('voice')) return false;
  if (m === 'always') return true;
  const reads = (CFG.kid || {}).reads;
  if (reads) return READ_GRADES.includes(String(reads));
  return String(levelInfo(q.level).grade).startsWith('K');
}
function readsChoices(q, options) {
  if (q.readOptions === false || !preReader(q)) return false;
  if (q.readOptions === true) return true;
  return options.every(o => !o.html && /[A-Za-z0-9]/.test(String(o.label ?? o.value)));
}
const optionWords = o => String(o.say || o.label || stripTags(o.html || '') || o.value).replace(/¢/g, ' cents');
function addListenButtons(c, comp, options) {
  c.readList = comp.buttons.map((b, i) => [b, optionWords(options[i])]);
  comp.el.classList.add('read-aloud');
  c.readList.forEach(([b, words]) => {
    const ear = el('span', { class: 'ear', role: 'button', 'aria-label': 'Hear this answer', title: 'Hear this answer' }, '🔊');
    ear.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); readTok++; Sfx.init(); Voice.speak(words, { force: true }); });
    b.appendChild(ear);
  });
}
let readTok = 0;
/** Read the question, then (for little readers) each answer while its button lights up. */
async function speakQuestion(c, force = false) {
  const tok = ++readTok, q = c.q;
  await Voice.speak(q.say || q.prompt, { force });
  if (!c.readList || tok !== readTok || c.done || cur !== c) return;
  await sleep(250);
  for (let i = 0; i < c.readList.length; i++) {
    const [b, words] = c.readList[i];
    if (tok !== readTok || c.done || cur !== c || paused || overlayOpen) break;
    if (b.disabled) continue;
    b.classList.add('reading');
    await Voice.speak((i === c.readList.length - 1 && c.readList.length > 1 ? 'or ' : '') + words, { force });
    b.classList.remove('reading');
    await sleep(120);
  }
}

function setPrompt(html) { $('.ptext').innerHTML = html; }

function makeUi(c) {
  const stage = $('#stage');
  const api = {
    stage, q: c.q, level: c.q.level, edition: c.q.edition, index: qIndex, total: roundN, roundData: round, settings: S(), state: Store.data, sfx: Sfx, voice: Voice,
    get done() { return c.done; },
    get tries() { return c.tries; },
    submit: (correct, given = '', msg = '', opts = {}) => submit(c, correct, given, msg, opts),
    check(fn, label = '✔ Check') { api._check = fn; const b = $('#bCheck'); if (fn) { b.textContent = label; show('#bCheck'); } else hide('#bCheck'); },
    say(text, { speak = true } = {}) { setPrompt(esc(text)); c.spoken = text; if (speak) Voice.speak(text); },
    bubble(html) { setPrompt(html); },
    toast, confetti,
    dd(opts = {}) { const x = new DragDrop({ sfx: Sfx, ...opts }); dd.push(x); return x; },
    onKey: fn => Keys.on(fn),
    timer: s => startTimer(s), stopTimer,
    choices: (o, f, x) => choices(o, f, x),
    numpad: o => numpad(o), timeEntry: o => timeEntry(o),
    /** Answer buttons that check themselves. options [{value,label|html}], answer = right value. */
    choose(options, answer, { onWrong = null, cols = 0, size = '', cls = '', into = stage, sameValue = (a, b) => String(a) === String(b) } = {}) {
      const readIt = readsChoices(c.q, options);
      // little readers: fewer buttons (3) for Kindergarten-level questions, so listening isn't too much
      if (readIt && options.length > 3 && gradeNum(levelInfo(c.q.level).grade) === 0 && c.q.trim !== false) {
        const right = options.find(o => sameValue(o.value, answer));
        if (right) options = shuffle([right, ...shuffle(options.filter(o => o !== right)).slice(0, 2)]);
      }
      // In a play style, answers are things in the game world (gates, monsters, bubbles, crates) instead of test buttons.
      const useScene = !!play && !round.challenge && curMode() && sceneFits(options, cls) && S().scenes !== 'off';
      const make = useScene ? (o, f) => scene(o, f, { theme: curMode(), kid: CFG.kid || {}, hero: meta && meta.hero, edition: c.q.edition, cls }) : (o, f) => choices(o, f, { cols, size, cls });
      const comp = make(options, (v, b, opt) => {
        if (c.done) return;
        if (sameValue(v, answer)) { comp.mark(v, 'right'); comp.lock(); api.submit(true, opt.label || String(v)); }
        else { comp.mark(v, 'wrong'); comp.disable(v); api.submit(false, opt.label || String(v), onWrong ? onWrong(v, opt) : ''); }
      });
      api._reveal = () => { comp.mark(answer, 'right'); comp.lock(); };
      if (readIt) addListenButtons(c, comp, options);
      into && into.appendChild(comp.el);
      return comp;
    },
  };
  return api;
}

function help(auto = false) {
  if (!cur || cur.done) return;
  readTok++;
  Sfx.init();
  let msg = null;
  if (inst.hint) msg = inst.hint(cur.hints);
  else if (cur.q.steps) msg = cur.q.steps.slice(0, cur.hints + 1).map((s, i) => `Step ${i + 1}: ${s}`).join('  ');
  cur.hints++;
  cur.helped = true;
  if (msg) { setPrompt(`${auto ? '🤝' : '💡'} ${esc(msg)}`); cur.spoken = msg; Voice.speak(msg, { force: true }); }
}

function submit(c, correct, given, msg, opts) {
  if (c !== cur || c.done || paused || overlayOpen) return;
  readTok++; // stop reading the choices
  c.tries++;
  const maxTries = c.q.tries || 2;
  if (correct) return finish(c, true, given);
  if (c.tries < maxTries && !opts.final) {
    Sfx.wrong();
    feedback('again', msg || pick(AGAIN));
    Voice.speak(msg || 'Try again.');
    try { inst.retry && inst.retry(); } catch (e) { console.error(e); }
    return;
  }
  finish(c, false, given, msg);
}

function finish(c, correct, given, msg = '') {
  c.done = true;
  stopTimer();
  ui.check(null);
  $('#bHelp').disabled = true;
  const q = c.q, d = Store.data, firstTry = c.tries === 1, max = G.levels.length;
  const clean = correct && firstTry && !c.helped;
  const before = d.level;

  const change = adapt(q, clean, correct);

  d.stats.questions = (d.stats.questions || 0) + 1;
  if (clean) d.stats.right = (d.stats.right || 0) + 1; else d.stats.wrong = (d.stats.wrong || 0) + 1;
  if (c.helped) d.stats.helped = (d.stats.helped || 0) + 1;
  let earned = 0;
  d.streak = clean ? (d.streak || 0) + 1 : 0;
  if (correct) { earned = (clean ? 2 : 1) * (round.challenge ? 2 : 1) + (clean && d.streak >= 3 ? 1 : 0); d.stars += earned; round.tokens += earned; round.right++; }
  if (clean) round.clean++;
  round.results[qIndex] = clean ? 'clean' : correct ? 'ok' : 'miss';
  try { play && play.answer({ clean, correct, index: qIndex }); } catch (e) { console.error(e); }
  d.bestStreak = Math.max(d.bestStreak || 0, d.streak);
  Store.logAttempt({
    track: G.track, level: q.level, prompt: String(q.prompt).slice(0, 900), expected: String(q.expected ?? '').slice(0, 250),
    heard: given ? String(given).slice(0, 250) : null, correct, first_try: firstTry, helped: c.helped, review: !!q.review, at: new Date().toISOString(),
  });
  Store.save();
  qIndex++;
  refreshHud();
  $('#stage').classList.add('locked');
  const pro = edition() >= 4;

  if (correct) {
    Sfx.correct();
    if (clean && d.streak && d.streak % 5 === 0) { confetti(); toast(`🔥 ${d.streak} in a row!`); }
    const praise = pick(pro ? PRAISE_PRO : PRAISE) + (earned ? `  +${earned} ${edition() >= 2 ? 'XP' : def.tokenIcon}` : '');
    if (q.explain && S().explain !== 'off') { feedback('right', `${praise}<small>${esc(q.explain)}</small>`, true); Voice.speak(q.explain); show('#bNext'); }
    else { feedback('right', praise, true); show('#bNext'); nextTimer = setTimeout(() => { if (cur === c && !paused && !overlayOpen) nextQuestion(); }, change ? 2400 : 1500); }
  } else {
    try { (inst.reveal || ui._reveal || (() => {}))(); } catch (e) { console.error(e); }
    const ans = q.revealText || (q.expected !== undefined && q.expected !== '' ? `The answer is ${q.expected}.` : '');
    const steps = q.steps && q.steps.length ? `<ol class="fb-steps">${q.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : '';
    const text = [msg, ans, q.explain].filter(Boolean).join(' ');
    feedback('reveal', `Let’s learn this one!<small>${esc(text)}</small>${steps}`, true);
    Voice.speak([text, ...(q.steps || [])].join(' '));
    show('#bNext');
  }
  if (change > 0) {
    const L = levelInfo(d.level);
    applyEdition();
    setTimeout(() => { Sfx.levelUp(); confetti(); toast(`⬆️ Level up! Now level ${d.level}: ${L.name}`, 3000); }, 500);
  } else if (change === 'gc') {
    setTimeout(() => { Sfx.levelUp(); toast(`🎓 You mastered every ${EDITIONS[d.extra.gc.g].name} level! The Grade Boss is ready.`, 3600); }, 500);
  }
}

/**
 * The teaching loop for one answer. Returns 1 (level up), 'gc' (Grade Boss unlocked) or 0.
 * Kids never move down a visible level: quiet support only changes where the next questions come from.
 */
function adapt(q, clean, correct) {
  const d = Store.data, x = d.extra, max = G.levels.length;
  if (round.challenge || q.check || q.guided) return 0; // walk-throughs don't count either way
  // retrieval practice item: done when answered cleanly, otherwise it comes back again later
  if (q.recall) {
    x.rq = x.rq.filter(r => r !== q.recall);
    if (!clean) x.rq.push({ l: q.level, due: (d.stats.rounds || 0) + 2 });
    return 0;
  }
  if (q.review) return 0;
  // remember misses so the skill comes back next round
  if (!correct && !x.rq.some(r => r.l === q.level)) x.rq = [...x.rq, { l: q.level, due: (d.stats.rounds || 0) + 1 }].slice(-6);
  // mastery record for this level
  const rec = x.m[q.level] = x.m[q.level] && typeof x.m[q.level] === 'object' ? x.m[q.level] : { h: [] };
  rec.h = [...(Array.isArray(rec.h) ? rec.h : []), clean ? 1 : correct ? 0.5 : 0].slice(-MASTER_OF);
  const cleanCount = rec.h.filter(v => v === 1).length;
  if (rec.h.length >= MASTER_NEED && cleanCount >= MASTER_NEED) rec.ok = rec.ok || Date.now();
  const last2 = rec.h.slice(-2), last3 = rec.h.slice(-3);

  const struggling = supportOn() && last2.length === 2 && last2.every(v => v < 1) && last2.some(v => v === 0);
  const fresh = () => { const r = x.m[workLevel()]; if (r && typeof r === 'object') r.h = []; };
  if (q.level < d.level) {
    // in quiet support: 3 clean in a row steps back up toward the real level (easier → harder)
    if (last3.length === 3 && last3.every(v => v === 1)) { x.sup = Math.max(0, x.sup - 1); fresh(); }
    else if (struggling && q.level > 1) { x.sup++; round.guideNext = true; fresh(); }
    return 0;
  }
  // at the real level: 2 rough answers in a row → quietly step down one level and walk through one together
  if (struggling && d.level > 1) { x.sup = 1; x.supLevel = d.level; round.guideNext = true; fresh(); return 0; }
  if (struggling) { round.guideNext = true; rec.h = []; return 0; } // level 1: nothing easier, so walk through one together
  if (S().autoLevel === 'off' || !rec.ok || x.gc) return 0;
  // mastered the real level: move up, unless that finishes a grade (then the Grade Boss decides)
  const g0 = gradeNum(levelInfo(d.level).grade);
  const nextG = d.level < max ? gradeNum(levelInfo(d.level + 1).grade) : 99;
  if (nextG > g0 && GRADES_IN_GAME.includes(g0) && !x.badges[EDITIONS[g0].key]) { x.gc = { g: g0, wait: 0, tries: 0 }; return 'gc'; }
  if (d.level < max) { d.level++; x.sup = 0; x.supLevel = d.level; d.history = []; return 1; }
  return 0;
}

// ------------------------------------------------------------------ graduation badges
function awardGrades(from, to) {
  const d = Store.data;
  for (let g = from; g <= to; g++) {
    if (!GRADES_IN_GAME.includes(g)) continue;
    const E = EDITIONS[g];
    if (d.extra.badges[E.key]) continue;
    d.extra.badges[E.key] = Date.now();
    pendingGrad.push(g);
  }
  Store.save();
}
function showGrad() {
  const g = pendingGrad.shift(), E = EDITIONS[g], d = Store.data;
  const nextE = EDITIONS[GRADES_IN_GAME.find(x => x > g) ?? -1];
  overlayOpen = true; pauseTimer();
  $('.cert-text').innerHTML = `<b>${esc(d.name)}</b> graduated from <b>${E.name}</b> in <b>${esc(G.title)}</b>! Every level mastered and the Grade Boss beaten.`;
  $('.cert-badge').innerHTML = `<span>${E.icon}</span><small>${E.name} · ${E.title}</small>`;
  $('.cert-next').innerHTML = nextE ? `Next up: <b>${nextE.name}</b> — a new look, new lessons and bigger challenges!` : 'You finished every grade in this game. You are a true master! 👑';
  show('#ov-grad');
  Sfx.win(); confetti(); setTimeout(confetti, 700);
  Voice.speak(`Graduation! ${d.name} graduated from ${E.name} in ${G.title}! ${nextE ? 'Next up, ' + nextE.name + '.' : ''}`);
}
function closeGrad() {
  hide('#ov-grad'); overlayOpen = false; Voice.stop(); resumeTimer();
  applyEdition(); refreshHud();
  if (pendingGrad.length) return showGrad();
  if (mode === 'play' && $('#ov-done').classList.contains('hidden')) nextQuestion();
}

function feedback(kind, html, sticky = false) {
  const fb = $('.feedback');
  fb.className = 'feedback show ' + kind;
  fb.innerHTML = `<div>${kind === 'right' ? '✔ ' : kind === 'again' ? '↺ ' : '💡 '}${html}</div>`;
  clearTimeout(feedback._t);
  if (!sticky) feedback._t = setTimeout(() => { fb.className = 'feedback'; }, 1900);
}

function finishRound() {
  const d = Store.data, x = d.extra;
  d.stats.rounds = (d.stats.rounds || 0) + 1;
  const ratio = round.clean / roundN;
  const stars = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
  if (stars === 3 && !round.challenge && !round.check) d.stats.perfect = (d.stats.perfect || 0) + 1;
  let best = '', gcHtml = '';
  if (round.challenge) {
    const prev = x.challengeBest || 0;
    if (round.right > prev) { x.challengeBest = round.right; best = ' 🏆 New best!'; }
  }
  // Grade Boss result
  let passed = false;
  if (round.check && x.gc) {
    const g = x.gc.g, E = EDITIONS[g];
    passed = round.clean >= checkNeed();
    x.gc.tries = (x.gc.tries || 0) + 1;
    if (passed) {
      awardGrades(g, g);
      x.gc = null;
      if (d.level < G.levels.length) { d.level++; x.sup = 0; x.supLevel = d.level; d.history = []; }
      gcHtml = `<div class="gc-result win">🎓 You beat the ${esc(E.name)} Grade Boss with <b>${round.clean} of ${roundN}</b>!</div>`;
    } else {
      x.gc.wait = 1; // one practice round, then try again
      // the levels missed in the check come back for practice
      round.results.forEach((r, i) => { if (r !== 'clean') { const l = round.checkLevels[i]; if (!x.rq.some(q => q.l === l)) x.rq.push({ l, due: d.stats.rounds }); } });
      x.rq = x.rq.slice(-6);
      gcHtml = `<div class="gc-result">So close! You got <b>${round.clean}</b> and need <b>${checkNeed()}</b>. Play one practice round and the Grade Boss will be ready again. You've got this!</div>`;
    }
  } else if (!round.challenge && x.gc && x.gc.wait > 0) x.gc.wait--;
  d.lastRound = { at: Date.now(), clean: round.clean, of: roundN, level: d.level };
  if (def.onRoundEnd) try { def.onRoundEnd(round, d); } catch (e) { console.error(e); }
  // play-style reward
  const rw = $('.done-reward'); rw.innerHTML = '';
  let rewardTitle = '', rewardSay = '';
  if (play) {
    try {
      const r = play.finish({ clean: round.clean, total: roundN, right: round.right, passed });
      if (r) { rewardTitle = r.title || ''; rewardSay = r.say || ''; if (r.node) rw.appendChild(r.node); else rw.innerHTML = r.html || ''; }
    } catch (e) { console.error(e); }
    saveMeta(d, (CFG.kid || {}).id ?? 0, meta);
  }
  Store.save();
  Sfx.win(); Sfx.stopMusic();
  if (stars >= 2 || passed) confetti();
  $('.done-stars').innerHTML = [1, 2, 3].map(i => `<span class="${i <= stars ? 'on' : ''}">★</span>`).join('');
  $('.done-title').textContent = round.challenge ? `Challenge: ${round.right}/5${best}` : rewardTitle || (stars === 3 ? 'Amazing round!' : stars === 2 ? 'Great round!' : 'Round complete!');
  const L = levelInfo(d.level), moved = d.level - round.startLevel, rk = rankOf(d.stars);
  // Never tell a kid they moved down. Only celebrate moving up.
  $('.done-text').innerHTML = gcHtml + `${esc(d.name)} got <b>${round.clean} of ${roundN}</b> right on the first try and earned <b>${round.tokens} ${edition() >= 2 ? 'XP' : def.tokenIcon}</b>. ${rk.icon} Rank: <b>${rk.name}</b><br>` +
    (moved > 0 ? `⬆️ You moved up to <b>level ${d.level}</b>: ${esc(L.name)}!` : `Level <b>${d.level}</b>: ${esc(L.name)}`) +
    (x.gc && !round.check ? `<br>🎓 <b>Grade Boss ${gcReady() ? 'is ready!' : 'after one more round'}</b>` : '') +
    (stars < 2 && !round.challenge && !round.check ? '<br><small>Every mistake is your brain growing. Keep going: you are getting stronger!</small>' : '');
  const ex = $('.done-extra'); ex.innerHTML = '';
  const rl = realFor(d.level);
  if (rl && !round.challenge) ex.appendChild(el('div', { class: 'real-life' }, [el('span', { class: 'rl-ic' }, rl[0]), el('span', {}, [el('b', {}, '🌍 In real life: '), rl[1]])]));
  if (def.doneExtra) { const xx = def.doneExtra(d, round); if (xx) ex.appendChild(xx); }
  $('#bAgain').textContent = gcReady() ? '🎓 Grade Boss' : '▶ Play again';
  brainBreak();
  Voice.speak(`${$('.done-title').textContent} ${rewardSay} You got ${round.clean} out of ${roundN} on the first try.`);
  clearQuestion();
  show('#ov-done');
  if (pendingGrad.length) setTimeout(() => { if (pendingGrad.length) showGrad(); }, 1200);
}

// ------------------------------------------------------------------ brain breaks (attention span)
const BREAKS = [
  ['🦘', 'Do 10 kangaroo jumps!'], ['🦒', 'Stretch up tall like a giraffe, then touch your toes 5 times.'], ['🦀', 'Crab-walk across the room and back.'],
  ['🎈', 'Take 5 slow balloon breaths: breathe in big, then let the air out slowly.'], ['💧', 'Go get a drink of water.'], ['🌀', 'Spin your arms in 10 big circles, then 10 the other way.'],
  ['🐸', 'Do 8 frog hops!'], ['🧘', 'Sit still like a statue and count to 20 in your head.'], ['🕺', 'Have a 20-second dance party!'],
];
function brainBreak() {
  const box = $('.brainbreak'), again = $('#bAgain');
  clearInterval(breakTimer); again.disabled = false; box.classList.add('hidden');
  if (S().breaks === 'off') return;
  let started = 0, lastBreak = 0;
  try { started = +sessionStorage.getItem('joynot_session_start') || 0; lastBreak = +sessionStorage.getItem('joynot_last_break') || 0; } catch (e) {}
  const now = Date.now();
  if (!started) return;
  const mins = BREAK_MIN[edition()] || 15, since = (now - Math.max(started, lastBreak)) / 60000;
  if (since < mins) return;
  try { sessionStorage.setItem('joynot_last_break', String(now)); } catch (e) {}
  const [ic, txt] = pick(BREAKS);
  let left = 30;
  box.innerHTML = `<b>🧠 Brain break!</b><div class="bb-ic">${ic}</div><p>${esc(txt)}</p><small>Your brain saves what you learned while you move and rest.</small>`;
  box.classList.remove('hidden');
  again.disabled = true;
  const label = again.textContent;
  const tick = () => { again.textContent = `Back in ${left}…`; if (left-- <= 0) { clearInterval(breakTimer); again.disabled = false; again.textContent = label; } };
  tick(); breakTimer = setInterval(tick, 1000);
  setTimeout(() => Voice.speak(`Brain break! ${txt}`), 2600);
}

// ------------------------------------------------------------------ pause + timer
function pauseGame() {
  if (mode !== 'play' || paused || overlayOpen) return;
  paused = true; Voice.stop(); Sfx.stopMusic();
  pauseTimer();
  clearTimeout(nextTimer);
  applySettings(false);
  show('#ov-pause');
}
function resumeGame() {
  if (!paused) return;
  paused = false; hide('#ov-pause'); Sfx.init();
  resumeTimer();
  if (S().music === 'on') Sfx.startMusic();
  if (cur && cur.done && !$('#bNext').classList.contains('hidden') && !cur.q.explain && $('.feedback').classList.contains('right')) nextTimer = setTimeout(() => nextQuestion(), 900);
}
function pauseTimer() { if (timer && !timer.pausedAt) timer.pausedAt = performance.now(); }
function resumeTimer() { if (timer && timer.pausedAt) { timer.start += performance.now() - timer.pausedAt; timer.pausedAt = 0; } }

function startTimer(sec) {
  stopTimer();
  const bar = $('.timerbar'); bar.classList.remove('hidden');
  const fill = bar.firstElementChild;
  timer = { start: performance.now(), ms: sec * 1000, pausedAt: 0, raf: 0, lastTick: 0 };
  const t = timer;
  const tickFn = now => {
    if (timer !== t) return;
    if (!paused && !t.pausedAt) {
      const left = Math.max(0, 1 - (now - t.start) / t.ms);
      fill.style.width = (left * 100) + '%';
      fill.classList.toggle('low', left < 0.3);
      if (left < 0.3 && now - t.lastTick > 500) { t.lastTick = now; Sfx.tick(); }
      if (left <= 0) {
        stopTimer();
        if (cur && !cur.done) {
          if (inst.onTimeout) inst.onTimeout();
          submit(cur, false, '(time ran out)', '⏰ Time’s up!', { final: true });
        }
        return;
      }
    }
    t.raf = requestAnimationFrame(tickFn);
  };
  t.raf = requestAnimationFrame(tickFn);
}
function stopTimer() { if (timer) cancelAnimationFrame(timer.raf); timer = null; const b = $('.timerbar'); b && b.classList.add('hidden'); }

// ------------------------------------------------------------------ toast + confetti
export function toast(t, ms = 2600) {
  const e = $('.toast'); if (!e) return;
  e.textContent = t; e.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => e.classList.remove('show'), ms);
}
export function confetti() {
  const box = $('.confetti'); if (!box || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#ff6b4a', '#ffc93c', '#3dd6a3', '#4ba8ff', '#8b6cff', '#ff6b9d'];
  for (let i = 0; i < 40; i++) {
    const p = el('i', { style: { left: Math.random() * 100 + '%', background: pick(colors), animationDelay: (Math.random() * 0.3) + 's', animationDuration: (1.2 + Math.random() * 1.1) + 's', transform: `rotate(${Math.random() * 360}deg)` } });
    box.appendChild(p);
    setTimeout(() => p.remove(), 2800);
  }
}

// automated tests only
window.__joyEngine = { Store, adapt, answer: ok => cur && !cur.done && submit(cur, ok, 'test', '', { final: !ok }), next: () => nextQuestion(), cur: () => cur, roundN: () => roundN, pickLevel, workLevel, setRound: r => { round = r; }, getRound: () => round, finishRound, initTeaching };

export { G as GAME, Store, Sfx, Voice, sleep };

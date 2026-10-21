// JoyNot Play engine: real games, not quizzes. Used by Clock Dash (racing), Star Academy (space explorer)
// and Compass Cove (town explorer). Kids move with a joystick, arrow keys or taps; learning happens at
// obstacles, gates, doors and missions inside the game. 3 hearts and checkpoints. A narrator chimes in with
// real-life situations for the kid's age. Teaching loop: mastery to level up, quiet extra help when stuck,
// a Grade Boss stage to graduate. Saves with the same JoyNot storage as the other learning games.
import { Store } from '../_joy/js/storage.js';
import { Sfx } from '../_joy/js/audio.js';
import { Voice } from '../_joy/js/speech.js';
import { mountTogether } from './together.js';

export { Sfx, Voice, Store };
const G = window.JOY_GAME || { title: 'Game', key: 'demo', levels: [{ name: 'Level 1', grade: 'K' }], defaults: {} };
const CFG = Store.config;
const $ = s => document.querySelector(s);
export const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const gradeNum = label => { const s = String(label || 'K').split('-')[0].trim(); return s === 'K' || s === 'PK' ? 0 : clamp(parseInt(s, 10) || 0, 0, 5); };
export const levelInfo = n => G.levels[clamp(n, 1, G.levels.length) - 1] || { name: '', grade: 'K' };
const EDITIONS = [['K', 'Kindergarten', '🌱'], ['1', '1st grade', '🧭'], ['2', '2nd grade', '🗺️'], ['3', '3rd grade', '🔧'], ['4', '4th grade', '🚀'], ['5', '5th grade', '👑']];
const GRADES_IN_GAME = [...new Set(G.levels.map(l => gradeNum(l.grade)))];
const S = () => Store.data.settings;
const on = k => String(S()[k] ?? 'on') !== 'off';

let together = null;
let def, scene, api, mode = 'loading', last = 0, raf = 0, hearts = 3, paused = false, stage = null, overlay = false;
const input = { x: 0, y: 0, keys: new Set(), stick: null, pressed: new Set(), held: new Set() };

export function startGame(gameDef) {
  def = { mascot: '⭐', howTo: [], actions: [], maxHearts: 3, ...gameDef };
  window.__playDef = def; // tests
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
}

// ------------------------------------------------------------------ teaching loop (same save format as the other games)
const L = {
  init(d) {
    d.extra = d.extra && typeof d.extra === 'object' && !Array.isArray(d.extra) ? d.extra : {};
    const x = d.extra, obj = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
    x.m = obj(x.m); x.badges = obj(x.badges); x.lessons = obj(x.lessons);
    x.sup = Math.max(0, parseInt(x.sup, 10) || 0);
    if ((parseInt(x.supLevel, 10) || 0) !== d.level) { x.sup = 0; x.supLevel = d.level; }
    x.gc = x.gc && typeof x.gc === 'object' && !Array.isArray(x.gc) ? x.gc : null;
    if (x.gc && gradeNum(levelInfo(d.level).grade) !== x.gc.g) x.gc = null;
    x.best = obj(x.best);
  },
  /** Level to build content from right now (quietly easier when the kid is struggling). */
  work() { const d = Store.data; return Math.max(1, d.level - (S().support === 'off' ? 0 : d.extra.sup)); },
  /** One learning moment inside the game. Returns { levelUp, gradeBoss }. */
  record({ level, correct, firstTry = true, helped = false, prompt = '', expected = '', given = '', review = false, boss = false, track = null, adapt = true }) {
    const d = Store.data, x = d.extra, clean = correct && firstTry && !helped;
    d.stats.questions = (d.stats.questions || 0) + 1;
    if (clean) d.stats.right = (d.stats.right || 0) + 1; else d.stats.wrong = (d.stats.wrong || 0) + 1;
    if (helped) d.stats.helped = (d.stats.helped || 0) + 1;
    d.streak = clean ? (d.streak || 0) + 1 : 0;
    d.bestStreak = Math.max(d.bestStreak || 0, d.streak);
    Store.logAttempt({ track: track || G.track, level, prompt: String(prompt).slice(0, 900), expected: String(expected).slice(0, 250), heard: given ? String(given).slice(0, 250) : null, correct, first_try: firstTry, helped, review: !!review, at: new Date().toISOString() });
    if (stage) { stage.n++; if (clean) stage.clean++; }
    let out = { levelUp: false, gradeBoss: false };
    if (!boss && !review && adapt !== false) out = L.adapt(level, clean, correct); // adapt:false = logged, but doesn't move levels (e.g. guided practice, a second skill track)
    Store.save();
    return out;
  },
  adapt(level, clean, correct) {
    const d = Store.data, x = d.extra, max = G.levels.length;
    const rec = x.m[level] = x.m[level] && typeof x.m[level] === 'object' ? x.m[level] : { h: [] };
    rec.h = [...(Array.isArray(rec.h) ? rec.h : []), clean ? 1 : correct ? 0.5 : 0].slice(-6);
    if (rec.h.length >= 5 && rec.h.filter(v => v === 1).length >= 5) rec.ok = rec.ok || Date.now();
    const l2 = rec.h.slice(-2), l3 = rec.h.slice(-3);
    const struggling = S().support !== 'off' && l2.length === 2 && l2.every(v => v < 1) && l2.some(v => v === 0);
    const fresh = () => { const r = x.m[L.work()]; if (r && typeof r === 'object') r.h = []; };
    if (level < d.level) {
      if (l3.length === 3 && l3.every(v => v === 1)) { x.sup = Math.max(0, x.sup - 1); fresh(); }
      else if (struggling && level > 1) { x.sup++; fresh(); }
      return { levelUp: false, gradeBoss: false };
    }
    if (struggling && d.level > 1) { x.sup = 1; x.supLevel = d.level; fresh(); return { levelUp: false, gradeBoss: false }; }
    if (S().autoLevel === 'off' || !rec.ok || x.gc) return { levelUp: false, gradeBoss: false };
    const g0 = gradeNum(levelInfo(d.level).grade), nextG = d.level < max ? gradeNum(levelInfo(d.level + 1).grade) : 99;
    if (nextG > g0 && !x.badges[EDITIONS[g0][0]]) { x.gc = { g: g0, tries: 0 }; return { levelUp: false, gradeBoss: true }; }
    if (d.level < max) { d.level++; x.sup = 0; x.supLevel = d.level; return { levelUp: true, gradeBoss: false }; }
    return { levelUp: false, gradeBoss: false };
  },
  gradeLevels(g) { return G.levels.map((_, i) => i + 1).filter(n => gradeNum(levelInfo(n).grade) === g); },
};
export const learn = L;

// ------------------------------------------------------------------ boot + DOM
async function boot() {
  if (!document.querySelector('link[data-play]')) { const ln = document.createElement('link'); ln.rel = 'stylesheet'; ln.href = '/games/_play/play.css?v=' + (G.version || '1'); ln.dataset.play = '1'; document.head.appendChild(ln); }
  if (G.theme) for (const [k, v] of Object.entries(G.theme)) document.documentElement.style.setProperty('--' + k, v);
  document.body.classList.add('playgame');
  const kid = CFG.kid || { name: 'Player', avatar: '🙂', color: '#ff9d3d' };
  $('#app').innerHTML = `
  <canvas id="pg-canvas" aria-label="${esc(G.title)} game"></canvas>
  <div id="pg-hud" class="hidden">
    <button class="pg-round" id="pgPause" type="button" aria-label="Pause">⏸</button>
    <div class="pg-hearts" aria-label="Hearts"></div>
    <div class="pg-goal" aria-live="polite"></div>
    <div class="pg-right"><span class="pg-level"></span><span class="pg-score"></span></div>
    <div class="pg-prog hidden"><span></span></div>
  </div>
  <div id="pg-chime" class="hidden" role="status"><span class="pc-ic"></span><div class="pc-tx"></div></div>
  <div id="pg-stick" class="hidden"><div class="knob"></div></div>
  <div id="pg-actions" class="hidden"></div>
  <div id="pg-flash"></div>
  <section id="pg-title" class="pg-screen">
    <div class="pg-card">
      <div class="pg-mascot">${def.mascot}</div>
      <h1>${esc(G.title)}</h1>
      <p class="pg-story"></p>
      <div class="pg-kid"><span style="--c:${kid.color}">${kid.avatar}</span> ${esc(kid.name)}</div>
      <div class="pg-stats"></div>
      <div class="pg-badges"></div>
      <div class="pg-boss hidden"></div>
      <button class="pg-btn big go" id="pgPlay" type="button" disabled>Loading…</button>
      <div class="pg-row"><button class="pg-btn ghost" id="pgHow" type="button">❓ How to play</button><button class="pg-btn ghost" id="pgLesson" type="button">📘 Lesson</button><button class="pg-btn ghost" id="pgBack" type="button">🏠 Games</button></div>
      <ul class="pg-howto hidden"></ul>
      <p class="pg-keys">⌨️ Arrow keys or WASD to move · Space = action · Esc = pause</p>
    </div>
  </section>
  <div id="pg-panel" class="pg-ov hidden"><div class="pg-card"><div class="pg-pbody"></div><div class="pg-pbtns"></div></div></div>
  <div id="pg-lesson" class="pg-ov hidden"><div class="pg-card lesson"><div class="pl-head"><b class="pl-tag">📘 Lesson</b><span class="pl-lv"></span></div><div class="pl-art"></div><h2 class="pl-title"></h2><p class="pl-text"></p><div class="pg-pbtns"><button class="pg-btn ghost" id="plSay" type="button">🔊</button><button class="pg-btn go" id="plNext" type="button">Next ▶</button></div></div></div>`;
  const res = (await Store.load()) || {};
  L.init(Store.data);
  Store.onExternalChange = () => { L.init(Store.data); refreshTitle(); };
  Voice.enabled = on('voice'); Sfx.enabled = on('sfx');
  const canvas = $('#pg-canvas');
  api = makeApi(canvas);
  scene = def.create(api);
  window.__playScene = scene; window.__playApi = api; // tests
  together = mountPlayTogether(canvas);
  wire();
  $('#pgPlay').disabled = false;
  sizeCanvas();
  refreshTitle();
  mode = 'title';
  if (res.offline) toast('📶 No internet. Progress saves on this device for now.');
  raf = requestAnimationFrame(loop);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
}

function refreshTitle() {
  const d = Store.data, Lv = levelInfo(d.level), e = gradeNum(Lv.grade);
  $('.pg-story').textContent = typeof def.story === 'function' ? def.story(d, e) : def.story || '';
  $('.pg-stats').innerHTML = `Level <b>${d.level}</b> of ${G.levels.length}: ${esc(Lv.name)} <span class="tag">Grade ${esc(Lv.grade)}</span><br>⭐ ${d.stars || 0} · 🏁 ${d.stats.rounds || 0} played`;
  $('.pg-badges').innerHTML = GRADES_IN_GAME.map(g => { const E = EDITIONS[g], got = d.extra.badges[E[0]]; return `<span class="b${got ? ' got' : ''}" title="${E[1]}">${got ? E[2] : '🔒'}<small>${E[0]}</small></span>`; }).join('');
  const gc = d.extra.gc;
  $('.pg-boss').classList.toggle('hidden', !gc);
  if (gc) $('.pg-boss').innerHTML = `🎓 <b>${EDITIONS[gc.g][1]} Grade Boss</b> is ready! Beat it to graduate.`;
  $('#pgPlay').textContent = gc ? '🎓 GRADE BOSS' : '▶ PLAY';
  $('.pg-howto').innerHTML = def.howTo.map(t => `<li>${t}</li>`).join('');
  document.body.classList.toggle('dark', S().theme === 'dark' || (S().theme !== 'light' && !!G.dark));
}

function wire() {
  const unlock = () => { Sfx.init(); Voice.unlock(); };
  $('#pgPlay').addEventListener('click', () => { unlock(); goFull(); beginStage(); });
  $('#pgHow').addEventListener('click', () => $('.pg-howto').classList.toggle('hidden'));
  $('#pgLesson').addEventListener('click', () => { unlock(); showLesson(Store.data.level, () => {}); });
  $('#pgBack').addEventListener('click', () => exitTo(CFG.urls.exit || '/dashboard'));
  $('#pgPause').addEventListener('click', () => pause());
  window.addEventListener('resize', sizeCanvas);
  window.addEventListener('orientationchange', () => setTimeout(sizeCanvas, 300));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', sizeCanvas);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { Voice.stop(); Store.save(); Store.beacon(); if (mode === 'play') pause(); } });
  window.addEventListener('pagehide', () => Store.beacon());
  document.addEventListener('keydown', e => {
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    const k = keyName(e);
    if (k === 'pause') { e.preventDefault(); if (mode === 'play') (paused ? resume() : pause()); return; }
    if (mode !== 'play') { if (e.key === 'Enter') { const b = document.querySelector('.pg-ov:not(.hidden) .pg-btn.go, #pg-title:not(.hidden) #pgPlay'); if (b) { e.preventDefault(); b.click(); } } return; }
    if (k) { e.preventDefault(); if (!input.held.has(k)) input.pressed.add(k); input.held.add(k); }
    if (/^[0-9]$/.test(e.key)) input.pressed.add('n' + e.key);
    if (e.key === 'Backspace') input.pressed.add('back');
  });
  document.addEventListener('keyup', e => { const k = keyName(e); if (k) input.held.delete(k); });
  // joystick (left half of the screen on touch)
  const canvas = $('#pg-canvas'), stick = $('#pg-stick'), knob = stick.querySelector('.knob');
  canvas.addEventListener('pointerdown', e => {
    if (mode !== 'play' || paused) return;
    const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const wantStick = def.stick !== false && e.pointerType !== 'mouse' && x < r.width * 0.45 && !(scene.tapZone && scene.tapZone(x, y));
    if (wantStick) {
      input.stick = { id: e.pointerId, x0: x, y0: y };
      stick.style.left = (x - 55) + 'px'; stick.style.top = (y - 55) + 'px'; stick.classList.remove('hidden');
      try { canvas.setPointerCapture(e.pointerId); } catch (er) {}
      return;
    }
    dragId = e.pointerId; try { canvas.setPointerCapture(e.pointerId); } catch (er) {}
    scene.onTap && scene.onTap(x, y, e);
  });
  let dragId = null;
  const at = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  canvas.addEventListener('pointermove', e => {
    if (dragId === e.pointerId && scene.onMove && mode === 'play') { const [x, y] = at(e); scene.onMove(x, y, e); }
    if (!input.stick || input.stick.id !== e.pointerId) return;
    const r = canvas.getBoundingClientRect(), dx = e.clientX - r.left - input.stick.x0, dy = e.clientY - r.top - input.stick.y0;
    const m = Math.hypot(dx, dy), lim = 46, k = m > lim ? lim / m : 1;
    knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    input.x = clamp(dx / lim, -1, 1); input.y = clamp(dy / lim, -1, 1);
  });
  const endStick = e => { if (input.stick && input.stick.id === e.pointerId) { input.stick = null; input.x = input.y = 0; knob.style.transform = ''; stick.classList.add('hidden'); } };
  const endDrag = e => { if (dragId === e.pointerId) { dragId = null; if (scene.onUp && mode === 'play') { const [x, y] = at(e); scene.onUp(x, y, e); } } };
  canvas.addEventListener('pointerup', e => { endStick(e); endDrag(e); }); canvas.addEventListener('pointercancel', e => { endStick(e); endDrag(e); });
}
const KEYS = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ' ': 'action', Enter: 'action', Escape: 'pause', p: 'pause' };
const keyName = e => KEYS[e.key] || null;

function sizeCanvas() {
  const c = $('#pg-canvas'); if (!c) return;
  const w = window.innerWidth, h = window.visualViewport ? window.visualViewport.height : window.innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.style.width = w + 'px'; c.style.height = h + 'px';
  api.W = w; api.H = h; api.dpr = dpr;
  api.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  scene && scene.resize && scene.resize(w, h);
}
function goFull() { try { const coarse = matchMedia('(pointer: coarse)').matches, d = document.documentElement; if (coarse && !document.fullscreenElement && d.requestFullscreen && !/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)) d.requestFullscreen({ navigationUI: 'hide' }).catch(() => {}); } catch (e) {} }

// ------------------------------------------------------------------ the game loop
function loop(t) {
  const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
  if (mode === 'play' && !paused && !overlay) {
    // virtual direction from keys
    const kx = (input.held.has('right') ? 1 : 0) - (input.held.has('left') ? 1 : 0), ky = (input.held.has('down') ? 1 : 0) - (input.held.has('up') ? 1 : 0);
    api.input.x = input.stick ? input.x : kx; api.input.y = input.stick ? input.y : ky;
    try { scene.update(dt); } catch (e) { console.error(e); }
    input.pressed.clear();
  }
  try { api.ctx.save(); scene.draw(api.ctx, api.W, api.H, mode === 'title'); api.ctx.restore(); } catch (e) { console.error(e); }
  raf = requestAnimationFrame(loop);
}

// ------------------------------------------------------------------ play together (grown-ups join from their phones)
// Every game gets it. A game can add its own help buttons (def.together.helps + scene.onHelp(id, g)), a hint that
// replays the "we do" step (scene.hint(g) → true), and a coaching tip for the grown-up (scene.coach() → text, never the answer).
// def.together === false: the game runs its own (Bee Smart).
function mountPlayTogether(canvas) {
  if (!CFG.urls || !CFG.urls.coop || def.together === false) return null;
  const t = mountTogether({
    canvas, kid: CFG.kid, game: G.key, url: CFG.urls.coop, csrf: () => Store.csrf,
    speak: x => Voice.speak(x, { force: true }), stopSpeak: () => Voice.stop(), sfx: Sfx,
    duck: on => { try { if (Sfx.master) Sfx.master.gain.value = on ? 0.15 : 0.8; } catch (e) {} },
    toast, confetti,
    helps: (def.together && def.together.helps) || [],
    onHelp: (id, g) => (mode === 'play' && scene.onHelp ? scene.onHelp(id, g) : ''),
    onHint: g => !!(mode === 'play' && scene.hint && scene.hint(g)),
    status: () => {
      const vis = s => { const e = $(s); return e && !e.classList.contains('hidden') ? e.textContent.replace(/\s+/g, ' ').trim() : ''; };
      const screen = vis('#pg-lesson') || vis('#pg-panel') || (mode === 'title' ? `On the menu · ${$('.pg-stats') ? $('.pg-stats').textContent : ''}` : '') || (scene.screen ? scene.screen() : '');
      return { goal: mode === 'play' ? $('.pg-goal').textContent : '', screen, tip: mode === 'play' && scene.coach ? scene.coach() : '', level: $('.pg-level').textContent || `Level ${Store.data.level}` };
    },
  });
  return t;
}

// ------------------------------------------------------------------ stage flow
function beginStage() {
  const d = Store.data, boss = !!d.extra.gc;
  $('#pg-title').classList.add('hidden');
  if (together) together.start(G.title);
  const level = boss ? d.level : L.work();
  const want = S().lessons || 'auto';
  const go = () => {
    hearts = def.maxHearts; drawHearts();
    stage = { n: 0, clean: 0, boss, level, real: d.level, started: performance.now() };
    mode = 'play'; paused = false;
    ['#pg-hud', '#pg-actions'].forEach(s => $(s).classList.remove('hidden'));
    $('.pg-level').textContent = boss ? `🎓 Grade Boss` : `Lv ${d.level} · ${levelInfo(d.level).name}`;
    try { scene.start({ level, real: d.level, boss, bossLevels: boss ? L.gradeLevels(d.extra.gc.g) : null, edition: gradeNum(levelInfo(d.level).grade) }); } catch (e) { console.error(e); }
    if (S().music === 'on') Sfx.startMusic();
  };
  if (!boss && want !== 'off' && def.lessons && (want === 'always' || !d.extra.lessons[d.level]) && (def.lessons(d.level) || []).length) showLesson(d.level, go);
  else go();
}

/** The scene says the stage is over. result: { win, stars?, title?, text?, time? } */
function finishStage(result = {}) {
  if (mode !== 'play') return;
  mode = 'done'; Sfx.stopMusic(); Voice.stop();
  const d = Store.data, x = d.extra;
  d.stats.rounds = (d.stats.rounds || 0) + 1;
  const ratio = stage.n ? stage.clean / stage.n : 0;
  let extra = '';
  if (stage.boss && x.gc) {
    const pass = result.win !== false && ratio >= 0.8;
    x.gc.tries = (x.gc.tries || 0) + 1;
    if (pass) {
      const E = EDITIONS[x.gc.g]; x.badges[E[0]] = Date.now(); x.gc = null;
      if (d.level < G.levels.length) { d.level++; x.sup = 0; x.supLevel = d.level; }
      extra = `<div class="pg-cert">🎓<b>Graduation!</b><br>${esc(d.name)} graduated from <b>${E[1]}</b> in ${esc(G.title)}!</div>`;
      setTimeout(() => { Sfx.win(); confetti(); }, 300);
    } else extra = `<p class="pg-near">So close! You got ${stage.clean} of ${stage.n} right on the first try. You need 80%. Practice a stage, then try the Grade Boss again!</p>`;
  }
  const stars = result.stars ?? (ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : 1);
  const earned = stage.clean * 2 + (stage.n - stage.clean) + (result.win ? 5 : 0);
  d.stars = (d.stars || 0) + earned;
  if (result.time && result.bestKey) { const b = x.best[result.bestKey]; if (!b || result.time < b) { x.best[result.bestKey] = result.time; extra += '<p class="pg-near">🏆 New best time!</p>'; } }
  Store.save();
  const real = realLine(stage.real);
  panel(`<div class="pg-stars">${[1, 2, 3].map(i => `<span class="${i <= stars ? 'on' : ''}">★</span>`).join('')}</div>
    <h2>${esc(result.title || (result.win ? 'Stage clear!' : 'Nice try!'))}</h2>
    <p>${result.text ? result.text + '<br>' : ''}${stage.clean} of ${stage.n} right on the first try · +${earned} ⭐</p>${extra}
    ${real ? `<div class="pg-real">🌍 <b>In real life:</b> ${esc(real)}</div>` : ''}`,
  [['▶ Play again', 'go', () => { closePanel(); beginStage(); }], ['🏠 Menu', 'ghost', () => { closePanel(); toTitle(); }]]);
  if (result.win) { Sfx.win(); confetti(); }
  Voice.speak(`${result.title || 'Stage clear'}! ${real || ''}`);
}

function toTitle() {
  mode = 'title'; paused = false; Voice.stop(); Sfx.stopMusic();
  ['#pg-hud', '#pg-actions', '#pg-chime', '#pg-stick'].forEach(s => $(s).classList.add('hidden'));
  try { scene.stop && scene.stop(); } catch (e) {}
  refreshTitle(); $('#pg-title').classList.remove('hidden'); Store.save();
}
function pause() {
  if (mode !== 'play' || paused) return;
  paused = true; Voice.stop(); Sfx.stopMusic();
  panel('<h2>Paused</h2>', [
    ['▶ Keep playing', 'go', () => { closePanel(); resume(); }],
    ['📘 Lesson', 'ghost', () => { closePanel(); showLesson(stage ? stage.level : Store.data.level, () => { paused = false; pause(); }); }],
    [`🗣️ Voice: ${on('voice') ? 'On' : 'Off'}`, 'ghost', () => { S().voice = on('voice') ? 'off' : 'on'; Voice.enabled = on('voice'); Store.save(); closePanel(); paused = false; pause(); }],
    [`🔔 Sounds: ${on('sfx') ? 'On' : 'Off'}`, 'ghost', () => { S().sfx = on('sfx') ? 'off' : 'on'; Sfx.enabled = on('sfx'); Store.save(); closePanel(); paused = false; pause(); }],
    ['🏠 Menu', 'ghost', () => { closePanel(); toTitle(); }],
    ['🚪 Exit to JoyNot', 'ghost', () => exitTo(CFG.urls.exit || '/dashboard')],
  ]);
}
function resume() { paused = false; overlay = false; if (S().music === 'on') Sfx.startMusic(); }
async function exitTo(url) { Voice.stop(); Sfx.stopMusic(); Store.save(); await Store.flushNow(); location.href = url; }

function panel(html, buttons) {
  overlay = true;
  $('#pg-panel .pg-pbody').innerHTML = html;
  const box = $('#pg-panel .pg-pbtns'); box.innerHTML = '';
  buttons.forEach(([label, cls, fn]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'pg-btn ' + cls; b.textContent = label; b.addEventListener('click', () => { Sfx.click(); fn(); }); box.appendChild(b); });
  $('#pg-panel').classList.remove('hidden');
}
function closePanel() { $('#pg-panel').classList.add('hidden'); overlay = false; }

// ------------------------------------------------------------------ hearts + checkpoints
function drawHearts() { $('.pg-hearts').innerHTML = Array.from({ length: def.maxHearts }, (_, i) => `<span class="${i < hearts ? '' : 'lost'}">❤️</span>`).join(''); }
function loseHeart(why = '') {
  if (mode !== 'play') return false;
  hearts--; drawHearts(); Sfx.wrong();
  const f = $('#pg-flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
  if (navigator.vibrate) try { navigator.vibrate(120); } catch (e) {}
  if (hearts > 0) { if (why) toast(why); return false; }
  // out of hearts: back to the last checkpoint
  overlay = true; Voice.stop();
  panel(`<h2>💥 Out of hearts!</h2><p>${esc(why || 'Ouch!')}</p><p>You'll start again from your last checkpoint 🚩 with full hearts.</p>`,
    [['🚩 Back to checkpoint', 'go', () => { closePanel(); hearts = def.maxHearts; drawHearts(); try { scene.checkpoint && scene.checkpoint(); } catch (e) { console.error(e); } }], ['🏠 Menu', 'ghost', () => { closePanel(); toTitle(); }]]);
  Voice.speak('Out of hearts! Back to your last checkpoint.');
  return true;
}

// ------------------------------------------------------------------ narrator: real life chimes + speech
let chimeT = 0;
function chime(text, icon = def.mascot, { speak = true, ms = 6500 } = {}) {
  const b = $('#pg-chime');
  b.querySelector('.pc-ic').textContent = icon; b.querySelector('.pc-tx').innerHTML = text;
  b.classList.remove('hidden', 'pop'); void b.offsetWidth; b.classList.add('pop');
  b.onclick = () => b.classList.add('hidden'); // tap to tuck it away
  clearTimeout(chimeT); chimeT = setTimeout(() => b.classList.add('hidden'), ms);
  if (speak && on('voice')) Voice.speak(text.replace(/<[^>]+>/g, ' '));
}
const realLine = lvl => { const r = (def.realLife || {})[lvl]; return Array.isArray(r) ? pick(r) : r || ''; };

export function toast(t, ms = 2400) {
  let e = $('#pg-toast'); if (!e) { e = document.createElement('div'); e.id = 'pg-toast'; document.body.appendChild(e); }
  e.textContent = t; e.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => e.classList.remove('show'), ms);
}
export function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let box = $('#pg-confetti'); if (!box) { box = document.createElement('div'); box.id = 'pg-confetti'; document.body.appendChild(box); }
  const colors = ['#ff6b4a', '#ffc93c', '#3dd6a3', '#4ba8ff', '#8b6cff', '#ff6b9d'];
  for (let i = 0; i < 40; i++) { const p = document.createElement('i'); p.style.left = Math.random() * 100 + '%'; p.style.background = pick(colors); p.style.animationDelay = Math.random() * 0.3 + 's'; box.appendChild(p); setTimeout(() => p.remove(), 2600); }
}

// ------------------------------------------------------------------ lessons (I do), short and visual
function showLesson(level, then) {
  const slides = (def.lessons && def.lessons(level)) || [];
  if (!slides.length) { then(); return; }
  overlay = true; let i = 0, stopArt = null;
  const draw = () => {
    const s = slides[i];
    if (stopArt) { try { stopArt(); } catch (e) {} stopArt = null; }
    $('.pl-lv').textContent = levelInfo(level).name;
    $('.pl-title').textContent = s.title || '';
    $('.pl-text').innerHTML = s.html || esc(s.text || '');
    const art = $('.pl-art');
    if (typeof s.art === 'function') { art.innerHTML = ''; try { stopArt = s.art(art) || null; } catch (e) { console.error(e); } } else art.innerHTML = s.art || '';
    $('#plNext').textContent = i < slides.length - 1 ? 'Next ▶' : "▶ Let's play!";
    if (on('voice')) Voice.speak((s.text || '').replace(/<[^>]+>/g, ' '));
  };
  $('#plNext').onclick = () => { Sfx.click(); if (i < slides.length - 1) { i++; draw(); } else { if (stopArt) { try { stopArt(); } catch (e) {} stopArt = null; } $('#pg-lesson').classList.add('hidden'); overlay = false; Voice.stop(); Store.data.extra.lessons[level] = Date.now(); Store.save(); then(); } };
  $('#plSay').onclick = () => Voice.speak((slides[i].text || '').replace(/<[^>]+>/g, ' '), { force: true });
  $('#pg-lesson').classList.remove('hidden'); draw();
}

// ------------------------------------------------------------------ the API handed to each game
function makeApi(canvas) {
  const a = {
    canvas, ctx: canvas.getContext('2d'), W: 0, H: 0, dpr: 1,
    input: { x: 0, y: 0, held: k => input.held.has(k), pressed: k => input.pressed.has(k) },
    get state() { return Store.data; }, get settings() { return S(); }, sfx: Sfx, voice: Voice,
    get paused() { return paused || overlay || mode !== 'play'; },
    get kid() { return CFG.kid || { name: 'Player', avatar: '🙂', color: '#ff6b4a' }; },
    levelInfo, gradeNum, learn: L,
    record: o => L.record(o), loseHeart, chime, toast, confetti, realLine,
    finish: r => finishStage(r),
    goal(text, { speak = true } = {}) { $('.pg-goal').innerHTML = text; if (speak && on('voice')) Voice.speak(text.replace(/<[^>]+>/g, ' ')); },
    score(text) { $('.pg-score').textContent = text; },
    progress(frac, label = '') { const p = $('.pg-prog'); if (frac === null) { p.classList.add('hidden'); return; } p.classList.remove('hidden'); p.firstElementChild.style.width = clamp(frac, 0, 1) * 100 + '%'; p.title = label; },
    /** Touch buttons on the right: [{ key: 'action', label: '⤴ Jump' }] */
    actions(list) {
      const box = $('#pg-actions'); box.innerHTML = '';
      (list || []).forEach(o => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'pg-act' + (o.big ? ' big' : ''); b.innerHTML = o.label;
        const down = e => { e.preventDefault(); input.pressed.add(o.key); input.held.add(o.key); b.classList.add('down'); };
        const up = () => { input.held.delete(o.key); b.classList.remove('down'); };
        b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
        box.appendChild(b);
      });
    },
    speak: (t, o) => on('voice') && Voice.speak(t, o),
    hearts: () => hearts,
    /** Grown-ups playing along right now: [{ name, color, token }] */
    grownups: () => (together ? together.grownups() : []),
    heal() { hearts = Math.min(def.maxHearts, hearts + 1); drawHearts(); },
  };
  return a;
}

// ------------------------------------------------------------------ drawing helpers games share
export function emoji(ctx, ch, x, y, size, { flip = false, rot = 0, alpha = 1 } = {}) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = '#000'; ctx.translate(x, y); if (rot) ctx.rotate(rot); if (flip) ctx.scale(-1, 1); // opaque fill: Chrome tints color emoji with the fill's alpha
  ctx.font = `${Math.round(size)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, 0, size * 0.06); ctx.restore();
}
export function label(ctx, text, x, y, { size = 16, color = '#fff', bg = 'rgba(0,0,0,.55)', pad = 6, font = 'Fredoka, system-ui, sans-serif', align = 'center' } = {}) {
  ctx.save(); ctx.font = `700 ${size}px ${font}`; const w = ctx.measureText(text).width;
  const bx = align === 'center' ? x - w / 2 - pad : x - pad;
  if (bg) { ctx.fillStyle = bg; roundRect(ctx, bx, y - size / 2 - pad * 0.8, w + pad * 2, size + pad * 1.6, (size + pad) / 2); ctx.fill(); }
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 1); ctx.restore();
}
export function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
/** Analog clock face for gates and signs. minutes = minutes after midnight. */
export function clockFace(ctx, x, y, r, minutes, { color = '#fff', ring = '#2b2350', colored = true, numbers = true } = {}) {
  const h = Math.floor(minutes / 60) % 12, m = minutes % 60;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = color; ctx.strokeStyle = ring; ctx.lineWidth = Math.max(2, r * 0.09);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (numbers && r >= 22) { ctx.fillStyle = '#2b2350'; ctx.font = `700 ${Math.round(r * 0.26)}px Fredoka, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; ctx.fillText(String(i), Math.sin(a) * r * 0.76, -Math.cos(a) * r * 0.76); } }
  else for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ctx.fillStyle = '#2b2350'; ctx.beginPath(); ctx.arc(Math.sin(a) * r * 0.8, -Math.cos(a) * r * 0.8, r * 0.05, 0, 7); ctx.fill(); }
  const hand = (ang, len, w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(ang) * len, -Math.cos(ang) * len); ctx.stroke(); };
  hand((h + m / 60) / 12 * Math.PI * 2, r * 0.48, r * 0.12, colored ? '#e5484d' : '#2b2350');
  hand(m / 60 * Math.PI * 2, r * 0.72, r * 0.08, colored ? '#2f7de1' : '#2b2350');
  ctx.fillStyle = '#2b2350'; ctx.beginPath(); ctx.arc(0, 0, r * 0.08, 0, 7); ctx.fill();
  ctx.restore();
}
export { EDITIONS };
/** Bottom of the HUD (goal box, hearts…) in CSS px, so games can lay out below it. */
let _hudB = 80, _hudT = 0;
export function hudBottom() { const now = performance.now(); if (now - _hudT > 250) { _hudT = now; const el = document.getElementById('pg-hud'); if (el && !el.classList.contains('hidden')) _hudB = Math.round(el.getBoundingClientRect().bottom) + 6; } return _hudB; }
/** The free play area: below the HUD, clear of the touch buttons (bottom on portrait phones, right side on landscape). */
/** Left edge of the touch buttons (so short screens can keep content clear of them). */
export function actionsLeft(W) { const el = document.getElementById('pg-actions'); if (!el || el.classList.contains('hidden') || !el.children.length) return W; return Math.round(el.getBoundingClientRect().left); }
export function playBox(W, H) {
  const top = hudBottom(), short = H <= 500, phone = W < 900;
  // phones (portrait): buttons along the bottom · phones (landscape): buttons on the right · desktop: a row of buttons at the bottom
  const bottom = phone && !short ? H - 118 : short ? H - 12 : H - 84, right = phone && short ? Math.min(W - 100, actionsLeft(W) - 12) : W - 10;
  return { x: 10, y: top, w: right - 10, h: bottom - top };
}
/** Turn the shared "In real life" lines (_joy/js/reallife.js format) into realLife for startGame. */
export const realFrom = table => Object.fromEntries(Object.entries(table || {}).map(([k, v]) => [k, Array.isArray(v) && typeof v[0] === 'string' && v.length === 2 && !/ /.test(v[0]) ? [`${v[0]} ${v[1]}`] : v]));

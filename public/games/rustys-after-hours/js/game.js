// Rusty's After Hours — main game loop, controls, screens.
// Every reading or math LEVEL-UP unlocks the next adventure in a cycle (it starts after the one you're on):
//   🌙 Flashlight night → 🔧 Workshop (build a robot friend) → 🏃 Hallway run (side view chase) → 🔧 Workshop → 🌙 …
// Robots you build become helpers: they follow you on nights (their glow lights the room, and once a night they scare
// off an animatronic that's about to catch you) and run with you in hallway runs (tap 🤖 to push the chaser back).
// Grown-ups can join from their own phone (Play together): live picture, pointing, cheer, hints, talk, chat, video.
import { Store } from './storage.js';
import { Tutor } from './tutor.js';
import { Voice, Ears } from './speech.js';
import { Sfx } from './audio.js';
import { buildNight, solidForPlayer, roomAt, lineOfSight, T } from './world.js';
import { Monster } from './monsters.js';
import { Renderer } from './render.js';
import { CHARACTERS, LINES, castForNight, drawCharacter } from './characters.js';
import { Challenge } from './challenge.js';
import { exitProblem, FLASHLIGHT_STEPS } from './curriculum-math.js';
import { Workshop } from './workshop.js';
import { Hallway } from './hallway.js';
import { drawBot } from './bots.js';
import { mountTogether } from '/games/_play/together.js';

const $ = id => document.getElementById(id);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SPARKY = { pitch: 1.3, rate: 0.95 };

const TIPS = [
  'When you hear footsteps getting louder, find a hiding spot!',
  'Shine your flashlight right at an animatronic to make it disappear!',
  'Watch the footprint arrow at the top. It points to the closest animatronic.',
  'Turn your flashlight off sometimes so the battery can charge back up.',
  'Look at the little map in the corner to plan where to go next.',
  'Hiding spots get a yellow outline when you are close. Tap HIDE!',
  'Make a plan: find the power cells first, then go to the red EXIT.',
  'If you see glowing eyes, stop and think. Hide, or get your flashlight ready!',
];

const store = Store;
const tutor = new Tutor(store);
let renderer, challenge;
let g = null; // current night state
let st = null; // current workshop / hallway run
let mode = 'title';
let together = null;
const CYCLE = ['night', 'build', 'chase', 'build'];
const STAGE_INFO = {
  night: { icon: '🌙', name: 'Flashlight Night' },
  build: { icon: '🔧', name: 'Robot Workshop' },
  chase: { icon: '🏃', name: 'Hallway Run' },
};
const stageKind = () => CYCLE[((store.data.stage | 0) % CYCLE.length + CYCLE.length) % CYCLE.length];
const input = { x: 0, y: 0, keys: new Set(), stick: null, aim: null };

// ------------------------------------------------------------------ boot
window.addEventListener('load', async () => {
  renderer = new Renderer($('game'));
  challenge = new Challenge(store, tutor);
  window.__challenge = challenge; // tests
  // phones: keep the canvas sized right when rotating or when the browser bar shows/hides
  const resize = () => renderer.resize();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 300));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  // phones: pause when the screen locks or he switches apps
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { Voice.stop(); if (mode === 'play') pauseGame(); }
    else Sfx.init();
  });
  // iPhone: stop pinch-zoom and double-tap zoom from wrecking the game screen
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
  store.onExternalChange = () => refreshTitle();
  // closing the tab / swiping the app away: last-chance save
  window.addEventListener('pagehide', () => store.beacon());
  bindUI();
  requestAnimationFrame(loop);
  boot();
  together = mountRustyTogether();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
});

// ------------------------------------------------------------------ JoyNot: who is playing comes from the page
async function boot() {
  mode = 'loading';
  const { offline } = (await store.load()) || {};
  refreshTitle(); hide('loading'); show('title'); mode = 'title';
  if (offline) toast('📶 No internet right now. Progress saves on this device for now.', 4000);
}

// Leave the game: save, then go back to JoyNot (the kid's game cards, or "Who's playing?").
let leaving = false;
async function exitTo(url) {
  if (leaving) return; leaving = true;
  Voice.stop(); Ears.stop(); Sfx.stopAmbient();
  ['pause', 'hud', 'controls', 'caught', 'done', 'steps', 'intro', 'quitConfirm', 'scare', 'title', ...STAGE_UI].forEach(hide);
  $('loadingText').textContent = 'Saving...'; show('loading');
  if (g) store.save();
  g = null; st = null; window.__game = null; mode = 'leaving';
  try { if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen().catch(() => {}); } catch (e) {}
  await store.flushNow();
  location.href = url;
}
const exitToJoyNot = () => exitTo(store.config.urls.exit || '/dashboard');

function refreshTitle() {
  const d = store.data;
  const ri = tutor.levelInfo('reading', d.reading.level), mi = tutor.levelInfo('math', d.math.level);
  const hi = (d.tokens || d.stats.nights) ? 'Welcome back' : 'Welcome';
  $('titleName').textContent = d.name && d.name !== 'Player' ? `${hi}, ${d.name}!` : `${hi}, night guard!`;
  const S = STAGE_INFO[stageKind()], bots = (d.bots || []).length;
  $('titleStats').innerHTML = `📖 Reading level <b>${d.reading.level}</b> <small>(${ri.name})</small> &nbsp; 🔢 Math level <b>${d.math.level}</b> <small>(${mi.name})</small><br>${S.icon} Next: <b>${S.name}</b>${stageKind() === 'night' ? ` ${d.night}` : ''} &nbsp; ★ <b>${d.tokens}</b> tokens${bots ? ` &nbsp; 🤖 <b>${bots}</b> robot${bots === 1 ? '' : 's'}` : ''}`;
  drawTitleArt();
}

function drawTitleArt() {
  const c = $('titleArt'); const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  const ids = ['hoot', 'rusty', 'chomps', 'major'];
  ids.forEach((id, i) => drawCharacter(ctx, id, 70 + i * 120, 120, 150, i));
}

function speakSparky(t, o = {}) { return Voice.speak(t, { ...SPARKY, ...o }); }
function toast(t, ms = 2600) { const el = $('toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), ms); }
function sparkyTalk(t) { toast('🤖 ' + t, 3500); if (!Voice.speaking) speakSparky(t); }

function show(id) { $(id).classList.remove('hidden'); }
function hide(id) { $(id).classList.add('hidden'); }

// ------------------------------------------------------------------ UI wiring
function bindUI() {
  $('btnPlay').addEventListener('click', () => { Sfx.init(); Voice.unlock(); goFullscreen(); if (together) together.start("Rusty's After Hours"); startStage(); });
  $('btnSwitch').addEventListener('click', () => exitTo(store.config.urls.switch || '/dashboard'));
  $('btnTitleExit').addEventListener('click', () => exitToJoyNot());
  $('btnPauseExit').addEventListener('click', () => exitToJoyNot());
  $('btnDoneExit').addEventListener('click', () => exitToJoyNot());
  $('btnQuitExit').addEventListener('click', () => exitToJoyNot());
  $('btnPlayAgain').addEventListener('click', () => playAgain());
  $('btnStartNight').addEventListener('click', () => beginNight());
  $('btnPause').addEventListener('click', () => pauseGame());
  $('btnExit').addEventListener('click', () => askQuit());
  $('btnQuitYes').addEventListener('click', () => quitToTitle());
  $('btnQuitNo').addEventListener('click', () => { hide('quitConfirm'); mode = 'play'; });
  $('btnIntroBack').addEventListener('click', () => quitToTitle());
  $('btnCaughtQuit').addEventListener('click', () => quitToTitle());
  $('btnResume').addEventListener('click', () => resumeGame());
  $('btnSteps').addEventListener('click', () => { hide('pause'); show('steps'); speakSparky('The Flashlight Steps. ' + FLASHLIGHT_STEPS.map((s, i) => `Step ${i + 1}: ${s.title}. ${s.text}`).join(' ')); });
  $('btnStepsClose').addEventListener('click', () => { Voice.stop(); hide('steps'); show('pause'); });
  $('btnQuit').addEventListener('click', () => quitToTitle());
  $('btnTryAgain').addEventListener('click', () => respawn());
  $('btnNextNight').addEventListener('click', () => { hide('done'); nextStage(); });
  $('btnDoneTitle').addEventListener('click', () => { hide('done'); quitToTitle(); });
  $('btnLight').addEventListener('click', () => toggleLight());
  $('btnAction').addEventListener('click', () => doAction());
  // workshop + hallway run
  $('btnStageGo').addEventListener('click', () => beginStage());
  $('btnStageBack').addEventListener('click', () => quitToTitle());
  $('shPause').addEventListener('click', () => pauseGame());
  $('shExit').addEventListener('click', () => askQuit());
  $('sdNext').addEventListener('click', () => { hide('stageDone'); nextStage(); });
  $('sdMenu').addEventListener('click', () => { hide('stageDone'); quitToTitle(); });
  $('sdExit').addEventListener('click', () => exitToJoyNot());
  const hold = (id, fn) => $(id).addEventListener('pointerdown', e => { e.preventDefault(); fn(); });
  hold('rbJump', () => st && st.jump && st.jump());
  hold('rbAct', () => st && st.action && st.action());
  hold('rbHelp', () => { if (st && st.help && !st.help()) toast('🤖 Your robots already helped this run!'); });
  const touch = $('stageTouch');
  const at = e => [e.clientX, e.clientY];
  touch.addEventListener('pointerdown', e => { if (mode !== 'play' || !st) return; e.preventDefault(); try { touch.setPointerCapture(e.pointerId); } catch (er) {} Sfx.init(); if (st.onDown) st.onDown(...at(e)); else if (st.jump) st.jump(); });
  touch.addEventListener('pointermove', e => { if (mode === 'play' && st && st.onMove) st.onMove(...at(e)); });
  const up = e => { if (st && st.onUp) st.onUp(...at(e)); };
  touch.addEventListener('pointerup', up); touch.addEventListener('pointercancel', up);

  $('stepsList').innerHTML = FLASHLIGHT_STEPS.map((s, i) => `<li><span class="si">${s.icon}</span><div><b>${i + 1}. ${s.title}</b><br>${s.text}</div></li>`).join('');

  // keyboard (for testing on a computer)
  window.addEventListener('keydown', e => {
    input.keys.add(e.key.toLowerCase());
    if (mode !== 'play') return;
    if (st) {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); st.jump && st.jump(); }
      if (e.key === 'e' || e.key === 'Enter') { e.preventDefault(); st.action && st.action(); }
      if (e.key === 'h') st.help && st.help();
      if (e.key === 'Escape') askQuit();
      return;
    }
    if (e.key === 'f' || e.key === 'F') toggleLight();
    if (e.key === 'e' || e.key === ' ') { e.preventDefault(); doAction(); }
    if (e.key === 'Escape') askQuit();
  });
  window.addEventListener('keyup', e => input.keys.delete(e.key.toLowerCase()));

  // joystick (left side) + aim (right side)
  const zone = $('stickZone'), base = $('stickBase'), knob = $('stickKnob');
  zone.addEventListener('pointerdown', e => {
    e.preventDefault(); zone.setPointerCapture(e.pointerId);
    const r = zone.getBoundingClientRect();
    input.stick = { id: e.pointerId, cx: e.clientX, cy: e.clientY };
    base.style.left = (e.clientX - r.left) + 'px'; base.style.top = (e.clientY - r.top) + 'px'; base.classList.add('on');
    knob.style.transform = 'translate(-50%,-50%)';
  });
  zone.addEventListener('pointermove', e => {
    const s = input.stick; if (!s || s.id !== e.pointerId) return;
    let dx = e.clientX - s.cx, dy = e.clientY - s.cy; const R = Math.max(40, base.offsetWidth * 0.42), d = Math.hypot(dx, dy);
    if (d > R) { dx = dx / d * R; dy = dy / d * R; }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    input.x = dx / R; input.y = dy / R;
  });
  const endStick = e => { const s = input.stick; if (!s || s.id !== e.pointerId) return; input.stick = null; input.x = 0; input.y = 0; base.classList.remove('on'); };
  zone.addEventListener('pointerup', endStick); zone.addEventListener('pointercancel', endStick);

  const can = $('aimZone');
  const aimAt = e => { if (!g) return; input.aim = { x: e.clientX, y: e.clientY, t: performance.now() }; };
  can.addEventListener('pointerdown', e => { can.setPointerCapture(e.pointerId); aimAt(e); });
  can.addEventListener('pointermove', e => { if (input.aim) aimAt(e); });
  const endAim = () => { input.aim = null; };
  can.addEventListener('pointerup', endAim); can.addEventListener('pointercancel', endAim);
}

function goFullscreen() {
  // Android Chrome goes full screen. iPhone Safari doesn't allow it, and that's fine.
  try { const el = document.documentElement; if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {}); } catch (e) {}
}

// ------------------------------------------------------------------ night flow
function startNightIntro() {
  hide('title'); mode = 'intro'; Voice.stop();
  const n = store.data.night; const cast = castForNight(n);
  $('introNight').textContent = `Night ${n}`;
  const need = n === 1 ? 2 : 3;
  $('introGoal').innerHTML = `Find <b>${need} power cells</b> ⚡, then escape through the red <b>EXIT</b>!`;
  const wrap = $('introCast'); wrap.innerHTML = '';
  cast.forEach(id => {
    const d = document.createElement('div'); d.className = 'cast';
    const c = document.createElement('canvas'); c.width = 120; c.height = 150; d.appendChild(c);
    d.insertAdjacentHTML('beforeend', `<div>${CHARACTERS[id].name}</div>`);
    wrap.appendChild(d); drawCharacter(c.getContext('2d'), id, 60, 85, 115, 0);
  });
  const helpers = (store.data.bots || []).slice(-2);
  if (helpers.length) {
    const d = document.createElement('div'); d.className = 'cast helper';
    const c = document.createElement('canvas'); c.width = 120 * helpers.length; c.height = 150; d.appendChild(c);
    d.insertAdjacentHTML('beforeend', `<div>🤖 ${helpers.map(b => b.name).join(' & ')}</div>`);
    wrap.appendChild(d); helpers.forEach((b, i) => drawBot(c.getContext('2d'), b, 60 + i * 120, 85, 110, 0));
  }
  show('intro');
  speakSparky(`Night ${n}! Find ${need} power cells and escape through the red exit. Read words and solve problems to open doors. Shine your flashlight on the animatronics to make them disappear. If you hear footsteps, hide!${helpers.length ? ` Your robot ${helpers.map(b => b.name).join(' and ')} will help you tonight!` : ''}`);
}

function applySpeeds() {
  const n = store.data.night, sp = { slow: 0.7, normal: 1, fast: 1.2 }[store.data.settings.monsterSpeed] || 1;
  g.huntSpeed = Math.min(2.4, 1.5 + 0.12 * (n - 1)) * sp * g.adapt;
  g.wanderSpeed = 1.0 * sp * g.adapt;
}

function beginNight() {
  hide('intro'); Voice.stop();
  const n = store.data.night;
  const world = buildNight(n, store.data.settings);
  g = {
    world, player: { x: world.startPos.x, y: world.startPos.y, hidden: null }, monsters: [], time: 0, graceUntil: n === 1 ? 25 : 15,
    lightOn: true, lightAngle: 0, lightHalf: 0.5, lightRange: 7, battery: 100, cells: 0, danger: 0, moving: false,
    nearHide: null, nearDoor: null, adapt: 1, room: world.start, stepsRead: 0, stepsMath: 0, zaps: 0, caught: 0, tokensAtStart: store.data.tokens,
    beatT: 0, mmT: 0, spotCool: 0,
    // robots you built follow you: their glow lights the room, and once a night each one scares off an animatronic
    helpers: (store.data.bots || []).slice(-2).map(b => ({ ...b, x: world.startPos.x, y: world.startPos.y, saved: false })), trail: [], trailT: 0,
  };
  applySpeeds();
  g.onMonsterSpots = m => {
    if (g.spotCool > 0) return; g.spotCool = 6;
    if (store.data.settings.voices && !Voice.speaking) Voice.speak(pick(LINES.hunt), { pitch: m.c.pitch, rate: m.c.rate });
  };
  g.onMonsterLost = m => { if (store.data.settings.voices && !Voice.speaking && Math.hypot(m.x - g.player.x, m.y - g.player.y) < 7) Voice.speak(pick(LINES.lost), { pitch: m.c.pitch, rate: m.c.rate, volume: 0.8 }); };
  // monsters start in far rooms
  const far = [...world.rooms].sort((a, b) => b.dist - a.dist);
  castForNight(n).forEach((id, i) => { const r = far[i % far.length]; g.monsters.push(new Monster(id, r.x0 + 4.5, r.y0 + 3.5)); });
  window.__game = g;
  show('hud'); show('controls');
  mode = 'play';
  Sfx.startAmbient();
  const newest = castForNight(n).slice(-1)[0];
  const c = CHARACTERS[newest];
  setTimeout(() => { if (mode === 'play' && store.data.settings.voices) Voice.speak(c.intro, { pitch: c.pitch, rate: c.rate }); }, 800);
}

function pauseGame() { if (mode !== 'play') return; mode = 'pause'; Voice.stop(); show('pause'); }
// stage helpers for co-op and HUD: stop everything from the workshop / hallway run
const STAGE_UI = ['stageHud', 'stageTouch', 'runBtns', 'stageDone', 'stageIntro'];
function resumeGame() { hide('pause'); mode = 'play'; }
// 🏠 button: ask first so a bump on the screen doesn't end the night by accident
function askQuit() {
  if (mode !== 'play') return;
  mode = 'quit'; Voice.stop(); input.x = input.y = 0; input.stick = null; input.aim = null;
  $('stickBase').classList.remove('on');
  show('quitConfirm');
}
// 🔄 Play Again: start this night over (new map), staying full screen
function playAgain() {
  Voice.stop(); Ears.stop(); Sfx.stopAmbient();
  ['pause', 'hud', 'controls', 'caught', 'done', 'steps', 'quitConfirm', 'scare', ...STAGE_UI].forEach(hide);
  input.x = input.y = 0; input.stick = null; input.aim = null; input.keys.clear();
  $('stickBase').classList.remove('on');
  store.save();
  g = null; st = null; window.__game = null;
  startStage();
}
function quitToTitle() {
  Voice.stop(); Ears.stop(); Sfx.stopAmbient();
  ['pause', 'hud', 'controls', 'caught', 'done', 'steps', 'intro', 'quitConfirm', 'scare', ...STAGE_UI].forEach(hide);
  input.x = input.y = 0; input.stick = null; input.aim = null; input.keys.clear();
  store.save();
  g = null; st = null; window.__game = null; window.__stage = null; mode = 'title'; refreshTitle(); show('title');
  try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); } catch (e) {}
}

function toggleLight() {
  if (!g) return;
  if (!g.lightOn && g.battery < 5) { sparkyTalk('The battery is empty. Wait for it to charge, or find a battery!'); return; }
  g.lightOn = !g.lightOn; Sfx.click();
  $('btnLight').classList.toggle('off', !g.lightOn);
}

async function doAction() {
  if (!g || mode !== 'play') return;
  const p = g.player;
  if (p.hidden) { // come out
    p.hidden = null; Sfx.click(); return;
  }
  if (g.nearDoor) return openDoor(g.nearDoor);
  if (g.nearHide) {
    const h = g.nearHide; p.hidden = h; p.preHide = { x: p.x, y: p.y };
    Sfx.door(); toast('🤫 Shhh... You are hiding. Tap COME OUT when it is safe.');
  }
}

async function openDoor(door) {
  const w = g.world;
  if (door.exit && g.cells < w.cellsNeeded) {
    const left = w.cellsNeeded - g.cells;
    sparkyTalk(`The exit needs power! Find ${left} more power ${left === 1 ? 'cell' : 'cells'}.`);
    return;
  }
  mode = 'challenge'; Voice.stop(); input.x = input.y = 0;
  if (!door.item) {
    if (door.exit) door.item = exitProblem(store.data.math.level);
    else door.item = tutor.pick(door.kind === 'read' ? 'reading' : 'math');
  }
  const res = await challenge.open(door.item, { exit: !!door.exit });
  if (!g) return;
  mode = 'play';
  if (res.levelUp) levelUp();
  if (res.solved) {
    if (door.item.track === 'reading') g.stepsRead++; else g.stepsMath++;
    door.open = true; door.item = null; Sfx.door();
    g.graceUntil = Math.max(g.graceUntil, g.time + 2); // a moment to breathe
    if (door.exit) sparkyTalk('The exit is open! Run through it!');
  }
}

// ------------------------------------------------------------------ caught / win
function caught(m) {
  mode = 'scare'; Voice.stop();
  store.data.stats.caught++; g.caught++; store.save();
  g.adapt = Math.max(0.6, g.adapt * 0.88); applySpeeds(); // it gets a little easier
  jumpScare(m.id).then(() => showCaught(m));
}
/** The jump scare (Grown-ups → Scare level). Resolves when it's over. */
function jumpScare(id) {
  const m = { id, c: CHARACTERS[id] };
  const level = store.data.settings.scare;
  const sc = $('scare');
  if (level === 'off') return Promise.resolve();
  return new Promise(done => {
  sc.classList.remove('hidden');
  const ctx = sc.getContext('2d'); sc.width = innerWidth; sc.height = innerHeight;
  Sfx.scream(level === 'full');
  if (store.data.settings.voices) Voice.speak(pick(LINES.caught), { pitch: m.c.pitch, rate: m.c.rate });
  const t0 = performance.now(); const dur = level === 'full' ? 1300 : 1500;
  const anim = now => {
    const t = (now - t0) / dur;
    ctx.fillStyle = level === 'full' ? '#000' : 'rgba(10,0,20,0.92)'; ctx.fillRect(0, 0, sc.width, sc.height);
    const sh = level === 'full' ? (1 - t) * 18 : 0;
    const size = level === 'full' ? Math.min(sc.width, sc.height) * (1.4 + t * 0.6) : Math.min(sc.width, sc.height) * 0.9 * Math.min(1, t * 3);
    drawCharacter(ctx, m.id, sc.width / 2 + (Math.random() - 0.5) * sh, sc.height / 2 + (level === 'full' ? size * 0.25 : size * 0.1) + (Math.random() - 0.5) * sh, size, now / 1000, {});
    if (level !== 'full') { ctx.fillStyle = '#ffd84a'; ctx.font = `bold ${Math.round(sc.height * 0.1)}px system-ui`; ctx.textAlign = 'center'; ctx.fillText('GOTCHA!', sc.width / 2, sc.height * 0.15); }
    if (t < 1) requestAnimationFrame(anim); else { sc.classList.add('hidden'); done(); }
  };
  requestAnimationFrame(anim);
  });
}

function showCaught(m) {
  mode = 'caught';
  const tip = pick(TIPS);
  $('caughtTitle').textContent = `${m.c.name} caught you!`;
  $('caughtTip').textContent = tip;
  show('caught');
  speakSparky(`Oh no! That's okay, let's try again. Here's a tip: ${tip}`);
}

function respawn() {
  hide('caught'); Voice.stop();
  if (!g) return;
  const p = g.player; p.x = g.world.startPos.x; p.y = g.world.startPos.y; p.hidden = null;
  g.battery = 100; g.lightOn = true; $('btnLight').classList.remove('off');
  g.monsters.forEach(m => { m.respawn(g); m.glare = 0; });
  g.graceUntil = g.time + 8;
  mode = 'play';
}

function nightComplete() {
  mode = 'done'; Voice.stop(); Sfx.stopAmbient(); Sfx.win();
  const d = store.data; d.stats.nights++; d.night++; d.tokens += 10;
  store.save();
  const stars = g.caught === 0 ? 3 : g.caught <= 2 ? 2 : 1;
  $('doneStars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  $('doneStats').innerHTML = `📖 Doors read: <b>${g.stepsRead}</b><br>🔢 Gates solved: <b>${g.stepsMath}</b><br>🔦 Animatronics zapped: <b>${g.zaps}</b><br>★ Tokens earned: <b>${d.tokens - g.tokensAtStart}</b>`;
  hide('hud'); hide('controls'); show('done');
  const nx = upcoming();
  $('btnNextNight').textContent = nx === 'night' ? '🌙 Play Next Night' : `${STAGE_INFO[nx].icon} ${d.stageUp ? 'New adventure: ' : ''}${STAGE_INFO[nx].name}`;
  speakSparky(`You escaped! Great job! You read ${g.stepsRead} doors and solved ${g.stepsMath} gates. ${nx === 'night' ? `Ready for night ${d.night}?` : `Next up: the ${STAGE_INFO[nx].name}!`}`);
}

// ------------------------------------------------------------------ main loop
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (st && !g) {
    if (mode === 'play') st.update(dt);
    const c = renderer.ctx; c.setTransform(renderer.dpr, 0, 0, renderer.dpr, 0, 0);
    st.draw(c, renderer.w, renderer.h, store.config.kid || {});
    stageHud();
  }
  if (g) {
    if (mode === 'play') update(dt);
    renderer.draw(g);
    g.mmT -= dt; if (g.mmT <= 0) { g.mmT = 0.25; renderer.minimap($('minimap'), g); updateHUD(); }
  }
  requestAnimationFrame(loop);
}

function update(dt) {
  const p = g.player, w = g.world;
  g.time += dt; g.spotCool -= dt;

  // ---- movement
  let mx = input.x, my = input.y;
  const k = input.keys;
  if (k.has('arrowleft') || k.has('a')) mx = -1; if (k.has('arrowright') || k.has('d')) mx = 1;
  if (k.has('arrowup') || k.has('w')) my = -1; if (k.has('arrowdown') || k.has('s')) my = 1;
  const mag = Math.hypot(mx, my);
  g.moving = false;
  if (!p.hidden && mag > 0.15) {
    const sp = 3.2 * Math.min(1, mag);
    const vx = mx / mag * sp * dt, vy = my / mag * sp * dt;
    const r = 0.28;
    const free = (x, y) => !solidForPlayer(w, Math.floor(x - r), Math.floor(y - r)) && !solidForPlayer(w, Math.floor(x + r), Math.floor(y - r)) && !solidForPlayer(w, Math.floor(x - r), Math.floor(y + r)) && !solidForPlayer(w, Math.floor(x + r), Math.floor(y + r));
    if (free(p.x + vx, p.y)) p.x += vx;
    if (free(p.x, p.y + vy)) p.y += vy;
    g.moving = true;
    if (!input.aim) g.lightAngle = turnToward(g.lightAngle, Math.atan2(my, mx), dt * 10);
  }
  if (input.aim) {
    const ax = (input.aim.x - renderer.w / 2), ay = (input.aim.y - renderer.h / 2);
    if (Math.hypot(ax, ay) > 10) g.lightAngle = turnToward(g.lightAngle, Math.atan2(ay, ax), dt * 14);
  }

  // ---- robot helpers follow your trail
  g.trailT -= dt;
  if (g.trailT <= 0 && !p.hidden) { g.trailT = 0.08; const last = g.trail[g.trail.length - 1]; if (!last || Math.hypot(last.x - p.x, last.y - p.y) > 0.15) g.trail.push({ x: p.x, y: p.y }); if (g.trail.length > 60) g.trail.shift(); }
  g.helpers.forEach((h, i) => { const tp = g.trail[Math.max(0, g.trail.length - 1 - (i + 1) * 6)] || p; h.moving = Math.hypot(tp.x - h.x, tp.y - h.y) > 0.05; h.x += (tp.x - h.x) * Math.min(1, dt * 4); h.y += (tp.y - h.y) * Math.min(1, dt * 4); });

  // ---- rooms
  const room = roomAt(w, Math.floor(p.x), Math.floor(p.y));
  if (room && room !== g.room) { g.room = room; if (!room.visited) { room.visited = true; toast(`📍 ${room.name}`, 1800); } }

  // ---- items
  for (const it of w.items) {
    if (it.taken || Math.hypot(it.x - p.x, it.y - p.y) > 0.6) continue;
    it.taken = true;
    if (it.type === 'cell') {
      g.cells++; Sfx.power();
      const left = w.cellsNeeded - g.cells;
      sparkyTalk(left > 0 ? `Power cell! ${left} more to go.` : 'All the power cells! Now find the red EXIT!');
    } else if (it.type === 'battery') { g.battery = 100; Sfx.pickup(); toast('🔋 Flashlight battery full!'); }
    else { store.data.tokens++; Sfx.pickup(); }
  }

  // ---- nearby things
  g.nearDoor = null; g.nearHide = null;
  if (!p.hidden) {
    let best = 1.35;
    for (const d of w.doors) {
      if (d.open) continue;
      for (const [tx, ty] of d.tiles) { const dd = Math.hypot(tx + 0.5 - p.x, ty + 0.5 - p.y); if (dd < best) { best = dd; g.nearDoor = d; } }
    }
    if (!g.nearDoor) { let hb = 1.3; for (const h of w.hides) { const dd = Math.hypot(h.x + 0.5 - p.x, h.y + 0.5 - p.y); if (dd < hb) { hb = dd; g.nearHide = h; } } }
  }
  // exit reached?
  if (w.exit.open) for (const [tx, ty] of w.exit.tiles) if (Math.hypot(tx + 0.5 - p.x, ty + 0.5 - p.y) < 0.95) { nightComplete(); return; }

  // ---- flashlight battery
  if (g.lightOn && !p.hidden) { g.battery -= dt * 1.5; if (g.battery <= 0) { g.battery = 0; g.lightOn = false; $('btnLight').classList.add('off'); sparkyTalk('Your flashlight battery ran out! Turn it off to let it charge, or find a battery.'); } }
  else g.battery = Math.min(100, g.battery + dt * 3);

  // ---- monsters
  let nearest = null, nd = 1e9;
  for (const m of g.monsters) {
    m.update(dt, g);
    if (!m.active) continue;
    const dx = m.x - p.x, dy = m.y - p.y, d = Math.hypot(dx, dy);
    if (d < nd) { nd = d; nearest = m; }
    // flashlight zap
    let lit = false;
    if (g.lightOn && !p.hidden && d < g.lightRange - 0.3 && d > 0.1) {
      let da = Math.atan2(dy, dx) - g.lightAngle; da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(da) < g.lightHalf + 0.12 && lineOfSight(w, p.x, p.y, m.x, m.y)) lit = true;
    }
    if (lit) { m.glare += dt; if (m.glare >= 0.6) zap(m); }
    else m.glare = Math.max(0, m.glare - dt * 0.6);
    // caught (a robot helper jumps in once per night)
    if (!p.hidden && d < 0.62 && g.time > g.graceUntil && m.active) {
      const h = g.helpers.find(h => !h.saved);
      if (h) { h.saved = true; m.vanish(g.time); g.graceUntil = g.time + 3; Sfx.vanish(0); toast(`🤖 ${h.name} scared ${m.c.name} away!`, 3000); speakSparky(`${h.name} scared ${m.c.name} away! ${h.name} can only do that once a night.`); continue; }
      caught(m); return;
    }
    // footsteps
    m.stepT -= dt;
    if (m.moving && m.stepT <= 0) {
      m.stepT = m.state === 'hunt' ? 0.33 : 0.5;
      if (d < 13) Sfx.footstep(clamp(dx / 6, -1, 1), Math.pow(1 - d / 13, 1.6), m.c.heavy);
    }
    // chatter
    m.talkT -= dt;
    if (m.talkT <= 0) {
      m.talkT = 8 + Math.random() * 8;
      if (store.data.settings.voices && d < 9 && !Voice.speaking) Voice.speak(pick(m.state === 'hunt' ? LINES.hunt : LINES.near), { pitch: m.c.pitch, rate: m.c.rate, volume: clamp(1.15 - d / 9, 0.2, 1) });
    }
  }
  g.nearest = nearest; g.nearestD = nd;
  g.danger = nearest ? (nearest.state === 'hunt' ? clamp((6 - nd) / 5, 0, 1) : clamp((3.5 - nd) / 3.5, 0, 0.5)) : 0;
  if (p.hidden) g.danger *= 0.5;
  g.beatT -= dt;
  if (g.danger > 0.45 && g.beatT <= 0) { Sfx.heartbeat(g.danger * 0.6); g.beatT = 1.1 - g.danger * 0.5; }
}

function zap(m) {
  m.vanish(g.time); g.zaps++;
  const pan = clamp((m.x - g.player.x) / 6, -1, 1);
  Sfx.vanish(pan); store.data.tokens += 1;
  toast(`🔦 You zapped ${m.c.name}!`);
  if (store.data.settings.voices) { Voice.stop(); Voice.speak(pick(LINES.flashed), { pitch: m.c.pitch, rate: m.c.rate }); }
}

function turnToward(a, b, s) { let d = Math.atan2(Math.sin(b - a), Math.cos(b - a)); return a + clamp(d, -s, s); }

function updateHUD() {
  if (!g) return;
  $('hudCells').textContent = `⚡ ${g.cells}/${g.world.cellsNeeded}`;
  $('hudTokens').textContent = `★ ${store.data.tokens}`;
  const b = $('hudBattery'); b.style.width = g.battery + '%'; b.style.background = g.battery < 20 ? '#e53935' : g.battery < 50 ? '#fdd835' : '#7cd67c';
  const act = $('btnAction'); const p = g.player;
  if (p.hidden) { act.textContent = '🚪 Come out'; act.className = 'act'; }
  else if (g.nearDoor) { act.textContent = g.nearDoor.exit ? '🚪 EXIT' : g.nearDoor.kind === 'read' ? '🎤 Read door' : '🎤 Solve gate'; act.className = 'act pulse'; }
  else if (g.nearHide) { act.textContent = '🤫 HIDE'; act.className = 'act pulse hide'; }
  else act.className = 'act hidden';
  // footsteps direction arrow
  const dg = $('danger');
  if (g.nearest && g.nearestD < 11) {
    dg.style.opacity = clamp(1.2 - g.nearestD / 11, 0.25, 1);
    const ang = Math.atan2(g.nearest.y - p.y, g.nearest.x - p.x);
    $('dangerArrow').style.transform = `rotate(${ang}rad)`;
    dg.classList.toggle('hot', g.nearest.state === 'hunt');
  } else dg.style.opacity = 0;
}

// ------------------------------------------------------------------ the level-up cycle
/** Which adventure comes after the current one finishes. */
function upcoming() { const d = store.data; return d.stageUp ? CYCLE[((d.stage | 0) + 1) % CYCLE.length] : stageKind(); }
function levelUp() {
  const d = store.data;
  if (!d.stageUp) { d.stageUp = true; store.save(); }
  const nx = CYCLE[((d.stage | 0) + 1) % CYCLE.length];
  setTimeout(() => { toast(`⭐ Level up! ${STAGE_INFO[nx].icon} ${STAGE_INFO[nx].name} unlocks after this!`, 4200); speakSparky(`Level up! When you finish this one, the ${STAGE_INFO[nx].name} unlocks!`); }, 300);
}
function nextStage() {
  const d = store.data;
  if (d.stageUp) { d.stage = ((d.stage | 0) + 1) % CYCLE.length; d.stageUp = false; store.save(); }
  startStage();
}
function startStage() {
  const k = stageKind();
  if (k === 'night') return startNightIntro();
  hide('title'); mode = 'intro'; Voice.stop();
  const I = STAGE_INFO[k], d = store.data;
  $('siTitle').textContent = `${I.icon} ${I.name}`;
  const art = $('siArt'), ctx = art.getContext('2d'); ctx.clearRect(0, 0, art.width, art.height);
  let say;
  if (k === 'build') {
    const n = (d.bots || []).length;
    $('siGoal').innerHTML = n ? `Build robot friend number <b>${n + 1}</b>!` : 'Build your very own <b>robot friend</b>!';
    $('siHow').innerHTML = '<li>🧰 Pick a robot kit and a paint color.</li><li>📦 Tap the glowing crate. Read the word 📖 or solve the problem 🔢 to open it.</li><li>✋ Drag each part onto your robot.</li><li>⚡ Hold the lever to wake it up. Your robot helps you on the next nights!</li>';
    ['bunny', 'bear', 'pup', 'penguin'].forEach((kind, i) => drawBot(ctx, { kind, color: ['#4fb6ff', '#ff7ab8', '#7ed957', '#ffb84a'][i] }, 60 + i * 120, 120, 150, i));
    say = 'The robot workshop! Build your own robot friend. Open crates by reading words and solving problems, then put the parts on your robot.';
  } else {
    const cast = castForNight(Math.max(1, d.night - 1)), chaser = cast[(d.runs | 0) % cast.length];
    d.chaser = chaser;
    $('siGoal').innerHTML = `<b>${CHARACTERS[chaser].name}</b> is chasing you! Get to the <b>EXIT</b>!`;
    $('siHow').innerHTML = '<li>🏃 You run by yourself. Tap <b>JUMP</b> (or tap the screen) to hop over toys.</li><li>🚪 At a door, tap <b>OPEN</b>, then read the word 📖 or solve the problem 🔢.</li><li>🔒 Red glow? It is rushing! Tap <b>HIDE</b> at a blue locker.</li><li>🤖 Tap your robot to push the chaser back (once each).</li>';
    drawCharacter(ctx, chaser, 120, 125, 170, 0);
    (d.bots || []).slice(-2).forEach((b, i) => drawBot(ctx, b, 300 + i * 110, 140, 120, 0));
    say = `Hallway run! ${CHARACTERS[chaser].name} is chasing you. Run to the exit! Read words and solve problems to open the doors. Jump over toys, and hide in lockers when it rushes!`;
  }
  show('stageIntro');
  speakSparky(say);
}
function beginStage() {
  hide('stageIntro'); Voice.stop();
  const k = stageKind(), d = store.data;
  const env = {
    store, tutor, say: t => speakSparky(t), toast, sfx: Sfx, kid: store.config.kid || {},
    voice: (t, id) => { const c = CHARACTERS[id]; if (c && !Voice.speaking) Voice.speak(t, { pitch: c.pitch, rate: c.rate }); },
    challenge: { open: async (item, o) => { mode = 'challenge'; Voice.stop(); const r = await challenge.open(item, o); if (mode === 'challenge') mode = 'play'; return r; } },
    onLevelUp: () => levelUp(),
  };
  if (k === 'build') {
    st = new Workshop({ ...env, firstTime: !(d.bots || []).length, onDone: bot => buildDone(bot) });
  } else {
    st = new Hallway({ ...env, chaser: d.chaser || 'rusty', bots: d.bots || [], doors: Math.min(7, 4 + Math.floor((d.runs | 0) / 2)),
      onHearts: n => { hearts(n); },
      onCaught: async (id, out) => { mode = 'scare'; Voice.stop(); d.stats.caught++; store.save(); await jumpScare(id); mode = 'play'; if (out) { toast('💔 Out of hearts! Back to your last locker with full hearts.', 3500); speakSparky('Out of hearts! Back to your last checkpoint with full hearts. You can do it!'); } else toast('💔 Caught! Back to the last locker.', 2500); },
      onDone: s => runDone(s) });
    hearts(3);
  }
  window.__stage = st;
  show('stageHud'); show('stageTouch');
  $('runBtns').classList.toggle('hidden', k !== 'chase');
  $('shHearts').classList.toggle('hidden', k !== 'chase');
  mode = 'play';
  st.start();
}
function hearts(n) { $('shHearts').innerHTML = [0, 1, 2].map(i => `<span class="${i < n ? '' : 'lost'}">❤️</span>`).join(''); }
let lastGoal = '';
function stageHud() {
  if (!st) return;
  const goal = st.goal; if (goal !== lastGoal) { lastGoal = goal; $('shGoal').textContent = goal; }
  if (st instanceof Hallway) {
    const n = st.near, a = $('rbAct');
    const label = n === 'hidden' ? '🚪 Come out' : n === 'door' ? '🎤 OPEN' : n === 'locker' ? '🤫 HIDE' : '';
    if (a.textContent !== label) a.textContent = label;
    a.classList.toggle('hidden', !label); a.classList.toggle('pulse', !!label); a.classList.toggle('hide', n === 'locker');
    const h = st.helpersLeft(); $('rbHelp').classList.toggle('hidden', !h); $('rbHelp').textContent = `🤖 ×${h}`;
  }
}
function buildDone(bot) {
  const d = store.data;
  d.bots = [...(d.bots || []), bot].slice(-12); d.builds = (d.builds | 0) + 1; d.tokens += 10;
  store.save();
  stageDone('🤖 Robot built!', `<b>${bot.name}</b> is your new robot friend!<br>${bot.name} will help you on the next nights.<br>★ +10 tokens`, ctx => drawBot(ctx, bot, 240, 125, 190, 0, { wave: 1 }));
  speakSparky(`${bot.name} is ready! ${bot.name} will follow you and help you. ${nextLine()}`);
}
function runDone(s) {
  const d = store.data;
  d.runs = (d.runs | 0) + 1; d.tokens += 10; d.stats.runs = (d.stats.runs | 0) + 1;
  store.save();
  stageDone('🏃 You escaped the hallway!', `📖 Doors read: <b>${s.read}</b><br>🔢 Gates solved: <b>${s.math}</b><br>⤴ Toys jumped: <b>${s.jumps}</b><br>★ +10 tokens`, ctx => { drawCharacter(ctx, d.chaser || 'rusty', 120, 130, 160, 0); ctx.font = '60px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.fillText('🏆', 300, 140); });
  speakSparky(`You made it out! You read ${s.read} doors and solved ${s.math} gates. ${nextLine()}`);
}
function nextLine() { const nx = upcoming(); return nx === stageKind() ? `Let's do another ${STAGE_INFO[nx].name}!` : `Next up: ${STAGE_INFO[nx].name}!`; }
function stageDone(title, html, art) {
  mode = 'done'; Voice.stop();
  hide('stageHud'); hide('stageTouch'); hide('runBtns');
  $('sdTitle').textContent = title; $('sdStats').innerHTML = html;
  const c = $('sdArt'), ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height); art(ctx);
  const nx = upcoming();
  $('sdNext').textContent = `${STAGE_INFO[nx].icon} ${store.data.stageUp ? 'New adventure: ' : ''}${STAGE_INFO[nx].name}${nx === 'night' ? ' ' + store.data.night : ''}`;
  show('stageDone');
}

// ------------------------------------------------------------------ play together (grown-ups join from their phones)
function mountRustyTogether() {
  const C = store.config;
  if (!C.urls || !C.urls.coop) return null;
  return mountTogether({
    canvas: $('game'), kid: C.kid, game: C.game || 'rustys-after-hours', url: C.urls.coop, csrf: () => store.csrf,
    speak: t => Voice.speak(t), stopSpeak: () => Voice.stop(), sfx: { pop: () => Sfx.click(), coin: () => Sfx.pickup() },
    toast: (t, ms) => toast(t, ms), confetti: () => Sfx.win(),
    helps: [{ id: 'battery', icon: '🔋', label: 'Charge light', cool: 30 }, { id: 'shield', icon: '🛡️', label: 'Shield', cool: 40 }],
    onHelp: (id, gu) => {
      if (mode !== 'play') return '';
      if (g) {
        if (id === 'battery') { g.battery = 100; g.lightOn = true; $('btnLight').classList.remove('off'); Sfx.pickup(); return 'charged your flashlight!'; }
        if (id === 'shield') { g.graceUntil = Math.max(g.graceUntil, g.time + 8); Sfx.power(); return 'gave you a shield! The animatronics can’t catch you for a little bit.'; }
      }
      if (st instanceof Hallway) {
        if (id === 'battery' || id === 'shield') { st.c.x = Math.min(st.c.x, st.p.x - 9); st.c.rush = 0; Sfx.power(); return 'pushed the animatronic back!'; }
      }
      return '';
    },
    onHint: () => {
      if (challenge.isOpen) { challenge.help(); return true; }
      if (g) { const left = g.world.cellsNeeded - g.cells; sparkyTalk(left > 0 ? `Look for the glowing power cells. ${left} more!` : 'Find the red EXIT sign!'); return true; }
      return false;
    },
    status: () => {
      let goal = '', screen = '', tip = '';
      if (challenge.isOpen && challenge.item) {
        const it = challenge.item;
        screen = it.track === 'reading' ? `Reading door: “${it.text}”` : `Math gate: ${it.story || it.text}`;
        tip = 'Let them try first. Tap 💡 Hint and Sparky will teach it (counts as helped).';
      }
      if (g) goal = `🌙 Night ${store.data.night}: power cells ${g.cells}/${g.world.cellsNeeded}, then the red EXIT`;
      else if (st) { goal = st.goal; tip = tip || (st.coach ? st.coach() : ''); }
      else if (mode === 'title') screen = 'On the main menu';
      return { goal, screen, tip, level: `📖 Reading ${store.data.reading.level} · 🔢 Math ${store.data.math.level} · Next: ${STAGE_INFO[stageKind()].name}` };
    },
  });
}

// Rusty's After Hours — main game loop, controls, screens.
// The level loop (every level finished moves on to the next):
//   🌙 Flashlight Night (3D rooms, the cast chases you) → 🔧 Robot Workshop (build your own animatronic with reading
//   and math) → 🙈 Hide & Seek (the animatronic YOU built comes to life in a far room and searches the 3D rooms for you,
//   using the powers you gave it) → 🌙 the next night …
// After its Hide & Seek, each robot you built becomes a helper (its glow lights the room, and once a level it scares
// off an animatronic that's about to catch you).
// Scare tier (tier.js) follows the kid's grade: Gentle (Pre-K, K), Spooky-lite (1st–3rd), Spooky (4th–5th).
// A grown-up can turn it down (never up) in Grown-ups → this game's settings.
// Grown-ups can join from their own phone (Play together): live picture + the same problem and voice the kid gets,
// pointing, cheer, hints (the hint teaches the answer), hold-to-talk, chat, and a two-way video call.
import { Store } from './storage.js';
import { Tutor } from './tutor.js';
import { Voice, Ears } from './speech.js';
import { Sfx } from './audio.js';
import { buildNight, solidForPlayer, roomAt, lineOfSight } from './world.js';
import { Monster } from './monsters.js';
import { Renderer3D } from './render3d.js';
import { CHARACTERS, LINES, castForNight, drawCharacter, introLine, setTier } from './characters.js';
import { Challenge } from './challenge.js';
import { exitProblem, FLASHLIGHT_STEPS } from './curriculum-math.js';
import { Workshop } from './workshop.js';
import { drawBot } from './bots.js';
import { Art } from './animatronics.js';
import { scareTier, gradeTier, TIERS } from './tier.js';
import { mountTogether } from '/games/_play/together.js';
import { fillVoiceSelect, onVoices, getPref, setPref } from '/js/joynot-voice.js';

const $ = id => document.getElementById(id);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SPARKY = { pitch: 1.3, rate: 0.95 };

const TIPS = [
  'When you hear footsteps getting louder, find a hiding spot!',
  'Shine your flashlight right at an animatronic to make it go away!',
  'Watch the footprint arrow at the top. It points to the closest animatronic.',
  'Turn your flashlight off sometimes so the battery can charge back up.',
  'Look at the little map in the corner to plan where to go next.',
  'Hiding spots get a yellow outline when you are close. Tap HIDE!',
  'Make a plan: find the power cells first, then go to the EXIT.',
  'If you see glowing eyes, stop and think. Hide, or get your flashlight ready!',
];

const store = Store;
const tutor = new Tutor(store);
let renderer, challenge;
let g = null; // current night state
let st = null; // current workshop / hallway run
let mode = 'title';
let together = null;
let tier = 1;
const CYCLE = ['night', 'build', 'chase'];
const STAGE_INFO = {
  night: { icon: '🌙', name: 'Flashlight Night' },
  build: { icon: '🔧', name: 'Robot Workshop' },
  chase: { icon: '🙈', name: 'Hide & Seek' },
};
// old saves counted 4 stages (night, workshop, run, workshop): the 4th one was a workshop
const stageKind = () => { const s = store.data.stage | 0; return s === 3 ? 'build' : CYCLE[((s % 3) + 3) % 3]; };
const input = { x: 0, y: 0, keys: new Set(), stick: null, aim: null };

// ------------------------------------------------------------------ boot
window.addEventListener('load', async () => {
  renderer = new Renderer3D($('game'));
  challenge = new Challenge(store, tutor);
  window.__challenge = challenge; // tests
  const resize = () => { renderer.resize(); if (mode === 'title') drawTitleArt(); };
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 300));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { Voice.stop(); if (mode === 'play') pauseGame(); }
    else Sfx.init();
  });
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
  store.onExternalChange = () => { applyTier(); refreshTitle(); };
  window.addEventListener('pagehide', () => store.beacon());
  bindUI();
  requestAnimationFrame(loop);
  boot();
  together = mountRustyTogether();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
});

async function boot() {
  mode = 'loading';
  const { offline } = (await store.load()) || {};
  if ((store.data.stage | 0) > 2) { store.data.stage = 1; } // old 4-step loop → workshop
  applyTier();
  await Promise.race([Art.whenReady(), new Promise(r => setTimeout(r, 2500))]);
  refreshTitle(); hide('loading'); show('title'); mode = 'title';
  if (offline) toast('📶 No internet right now. Progress saves on this device for now.', 4000);
}

/** Scare tier from the kid's grade (and the grown-up's setting, which can only turn it down). */
function applyTier() {
  tier = scareTier(store.config.kid || {}, store.data.settings);
  setTier(tier); Sfx.setTier(tier);
  document.body.dataset.tier = TIERS[tier].id;
  Art.preload(tier, (store.data.bots || []).slice(-3)).then(() => { if (mode === 'title') drawTitleArt(); });
}

let leaving = false;
async function exitTo(url) {
  if (leaving) return; leaving = true;
  Voice.stop(); Ears.stop(); Sfx.stopAmbient();
  ['pause', 'hud', 'controls', 'caught', 'done', 'steps', 'intro', 'quitConfirm', 'scare', 'title', ...STAGE_UI].forEach(hide);
  $('loadingText').textContent = 'Saving...'; show('loading');
  if (g) store.save();
  g = null; st = null; window.__game = null; mode = 'leaving';
  if (together) together.stop();
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
  const k = stageKind(), S = STAGE_INFO[k], bots = (d.bots || []).length;
  $('titleStats').innerHTML = `📖 Reading level <b>${d.reading.level}</b> <small>(${ri.name})</small> &nbsp; 🔢 Math level <b>${d.math.level}</b> <small>(${mi.name})</small><br>★ <b>${d.tokens}</b> tokens${bots ? ` &nbsp; 🤖 <b>${bots}</b> robot${bots === 1 ? '' : 's'} built` : ''}`;
  $('btnPlay').innerHTML = `▶ ${k === 'night' ? `Play Night ${d.night}` : `Play: ${S.name}`}`;
  const byGrade = tier === gradeTier((store.config.kid || {}).grade || (store.config.kid || {}).reads);
  $('titleMode').innerHTML = `<span class="mode-dot"></span>${TIERS[tier].name} · ${byGrade ? 'set by grade' : 'set by a grown-up'}`;
  drawTitleArt();
}

/** Title screen: the cast on a lit stage, in this kid's scare tier. */
function drawTitleArt() {
  const c = $('titleArt'); if (!c) return;
  const W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
  if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
  const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const T = tier, wall = ['#3b1f4f', '#1e1629', '#120a10'][T], floorY = H * 0.78;
  ctx.fillStyle = wall; ctx.fillRect(0, 0, W, H);
  const portrait = H > W * 1.05;
  // party banner (not on tall phones, where the logo sits there)
  if (!portrait) {
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W * 0.08, H * 0.06); ctx.quadraticCurveTo(W / 2, H * 0.16, W * 0.92, H * 0.06); ctx.stroke();
  const flags = ['#ff6b5b', '#4fb6ff', '#7ed957', '#ffb84a', '#b28cff', '#ff7ab8'];
  for (let i = 0; i < 12; i++) { const t = (i + 0.5) / 12, x = W * (0.08 + 0.84 * t), y = H * 0.06 + Math.sin(t * Math.PI) * H * 0.05; ctx.fillStyle = T === 2 ? '#3a2a2a' : flags[i % 6]; ctx.globalAlpha = T === 2 ? 0.7 : 1; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x + 12, y); ctx.lineTo(x, y + 26); ctx.fill(); }
  ctx.globalAlpha = 1;
  }
  // checker band + lower wall + stage
  const by = floorY - H * 0.2;
  for (let x = 0; x < W; x += 28) { ctx.fillStyle = (x / 28) % 2 ? '#e9e2d4' : '#141018'; ctx.fillRect(x, by, 28, 14); ctx.fillStyle = (x / 28) % 2 ? '#141018' : '#e9e2d4'; ctx.fillRect(x, by + 14, 28, 14); }
  ctx.fillStyle = ['#5a2a52', '#2a1d36', '#1a0e14'][T]; ctx.fillRect(0, by + 28, W, floorY - by - 28);
  ctx.fillStyle = T === 0 ? '#7a4a2a' : '#3b2516'; ctx.fillRect(0, floorY, W, H - floorY);
  ctx.fillStyle = '#5a3a22'; ctx.fillRect(0, floorY - 6, W, 8);
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2; for (let i = 1; i < 4; i++) { const y = floorY + (H - floorY) * i / 4; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  // the cast: two on each side (landscape) or a row behind the buttons (portrait)
  const ids = ['rusty', 'hoot', 'chomps', 'major'];
  const s = portrait ? Math.min(W * 0.26, H * 0.2) : Math.min(H * 0.34, W * 0.13);
  const xs = portrait ? [0.14, 0.38, 0.62, 0.86] : [0.1, 0.24, 0.76, 0.9];
  ids.forEach((id, i) => {
    const x = W * xs[i], y = floorY - s * 0.62;
    if (T > 0) { const gr = ctx.createLinearGradient(0, 0, 0, floorY); gr.addColorStop(0, 'rgba(255,243,196,.28)'); gr.addColorStop(1, 'rgba(255,243,196,.03)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x - 20, 0); ctx.lineTo(x + 20, 0); ctx.lineTo(x + s * 0.75, floorY + 10); ctx.lineTo(x - s * 0.75, floorY + 10); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,243,196,.22)'; ctx.beginPath(); ctx.ellipse(x, floorY + 4, s * 0.6, s * 0.1, 0, 0, 7); ctx.fill();
    drawCharacter(ctx, id, x, y, s, 0, {});
  });
  // curtains
  ctx.fillStyle = '#7a1f2b'; ctx.fillRect(0, 0, W, 26);
  const cw = Math.max(40, W * 0.06);
  ctx.fillStyle = '#8e2533'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(cw, 0); ctx.quadraticCurveTo(cw * 0.7, H * 0.4, cw * 1.05, H); ctx.lineTo(0, H); ctx.fill();
  ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(W - cw, 0); ctx.quadraticCurveTo(W - cw * 0.7, H * 0.4, W - cw * 1.05, H); ctx.lineTo(W, H); ctx.fill();
  if (T === 2) { const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); }
}
/** Draw now, and again when the animatronic pictures are ready (they're made when the game loads). */
function drawSoon(fn) { fn(); Art.whenReady().then(fn); }

function speakSparky(t, o = {}) { return Voice.speak(t, { ...SPARKY, ...o }); }
function toast(t, ms = 2600) { const el = $('toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), ms); }
function sparkyTalk(t) { toast('🤖 ' + t, 3500); if (!Voice.speaking) speakSparky(t); }
function charSay(text, c, o = {}) { return Voice.speak(text, { pitch: c.pitch, rate: c.rate, voice: c.voice, ...o }); }

function show(id) { $(id).classList.remove('hidden'); if (together) together.poke(); }
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
  $('btnNextNight').addEventListener('click', () => { hide('done'); startStage(); });
  $('btnDoneTitle').addEventListener('click', () => { hide('done'); quitToTitle(); });
  $('btnLight').addEventListener('click', () => toggleLight());
  // 🗣️ Voice: any voice installed on this device (saved on this device, same as Grown-ups → Account)
  const vSel = $('gVoiceSel'), vRate = $('gVoiceRate');
  const openVoice = from => { Voice.unlock(); fillVoiceSelect(vSel); vRate.value = String(getPref().rate || 1); $('voicePick').dataset.from = from; hide(from); show('voicePick'); };
  const saveVoice = () => { setPref({ name: vSel.value || null, rate: Number(vRate.value) || 1 }); Voice.stop(); speakSparky('Hi! This is how I sound now. Let\'s play!'); };
  onVoices(() => { if (!$('voicePick').classList.contains('hidden')) fillVoiceSelect(vSel); });
  $('btnVoice').addEventListener('click', () => openVoice('title'));
  $('btnVoice2').addEventListener('click', () => openVoice('pause'));
  vSel.addEventListener('change', saveVoice); vRate.addEventListener('change', saveVoice);
  $('gVoiceTry').addEventListener('click', () => { Voice.stop(); speakSparky('Hi! This is how I sound. Let\'s play!'); });
  $('gVoiceDone').addEventListener('click', () => { Voice.stop(); hide('voicePick'); show($('voicePick').dataset.from || 'title'); });
  $('btnAction').addEventListener('click', () => doAction());
  $('btnStageGo').addEventListener('click', () => beginStage());
  $('btnStageBack').addEventListener('click', () => quitToTitle());
  $('shPause').addEventListener('click', () => pauseGame());
  $('shExit').addEventListener('click', () => askQuit());
  $('sdNext').addEventListener('click', () => { hide('stageDone'); startStage(); });
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

  // keyboard (computers): ↑/W walk, ↓/S back up, ←/→ or A/D turn
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

  // left thumb: joystick (up = walk forward, down = back up, sideways = turn)
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

  // right thumb: drag left/right to look around (turn)
  const can = $('aimZone');
  can.addEventListener('pointerdown', e => { can.setPointerCapture(e.pointerId); input.aim = { x: e.clientX, id: e.pointerId }; });
  can.addEventListener('pointermove', e => { const a = input.aim; if (!a || a.id !== e.pointerId || !g || mode !== 'play') return; g.lightAngle += (e.clientX - a.x) * 0.0065; a.x = e.clientX; });
  const endAim = () => { input.aim = null; };
  can.addEventListener('pointerup', endAim); can.addEventListener('pointercancel', endAim);
}

function goFullscreen() {
  try { const el = document.documentElement; if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {}); } catch (e) {}
}

// ------------------------------------------------------------------ night flow
function startNightIntro() {
  hide('title'); mode = 'intro'; Voice.stop();
  const n = store.data.night; const cast = castForNight(n);
  $('introNight').textContent = `Night ${n}`;
  const need = n === 1 ? 2 : 3;
  $('introGoal').innerHTML = tier === 0
    ? `Find <b>${need} power cells</b> ⚡, then go out the green <b>EXIT</b>! Play hide-and-seek with ${CHARACTERS[cast[0]].name.split(' ')[0]}!`
    : `Find <b>${need} power cells</b> ⚡, then escape through the <b>EXIT</b>!`;
  const wrap = $('introCast'); wrap.innerHTML = '';
  const draws = [];
  cast.forEach(id => {
    const d = document.createElement('div'); d.className = 'cast';
    const c = document.createElement('canvas'); c.width = 120; c.height = 150; d.appendChild(c);
    d.insertAdjacentHTML('beforeend', `<div>${CHARACTERS[id].name}</div>`);
    wrap.appendChild(d); draws.push(() => { const x = c.getContext('2d'); x.clearRect(0, 0, 120, 150); drawCharacter(x, id, 60, 92, 100, 0); });
  });
  const helpers = helperBots();
  if (helpers.length) {
    const d = document.createElement('div'); d.className = 'cast helper';
    const c = document.createElement('canvas'); c.width = 120 * helpers.length; c.height = 150; d.appendChild(c);
    d.insertAdjacentHTML('beforeend', `<div>🤖 ${helpers.map(b => b.name).join(' & ')}</div>`);
    wrap.appendChild(d); draws.push(() => { const x = c.getContext('2d'); x.clearRect(0, 0, c.width, 150); helpers.forEach((b, i) => drawBot(x, b, 60 + i * 120, 92, 92, 0)); });
  }
  drawSoon(() => draws.forEach(f => f()));
  show('intro');
  speakSparky(tier === 0
    ? `Night ${n}! It's hide-and-seek time! Find ${need} power cells and go out the exit. Read words and solve problems to open doors. If a friend finds you, it's just tag. Shine your flashlight to make them giggle and run away!${helpers.length ? ` Your robot ${helpers.map(b => b.name).join(' and ')} will help you!` : ''}`
    : `Night ${n}! Find ${need} power cells and escape through the exit. Read words and solve problems to open doors. Shine your flashlight on the animatronics to make them go away. If you hear footsteps, hide!${helpers.length ? ` Your robot ${helpers.map(b => b.name).join(' and ')} will help you tonight!` : ''}`);
}
/** Robots help on nights. (Each one has already had its Hallway Run by then: the loop is night → build → run.) */
function helperBots(except = null) { return (store.data.bots || []).filter(b => !except || b.at !== except.at || b.name !== except.name).slice(-2); }

function applySpeeds() {
  const n = store.data.night, sp = { slow: 0.7, normal: 1, fast: 1.2 }[store.data.settings.monsterSpeed] || 1;
  const tk = [0.72, 1, 1.1][tier];
  if (g.chaseBot) { // Hide & Seek: the robot's Speed power (1–5). Even at 5 it stays a little slower than you (you walk at 3).
    const pw = { speed: 2, ...(g.chaseBot.powers || {}) };
    g.huntSpeed = Math.min(2.6, (1.45 + 0.22 * (pw.speed - 1)) * sp * tk * g.adapt);
    g.wanderSpeed = Math.min(1.8, (0.85 + 0.1 * pw.speed) * sp * tk * g.adapt);
    return;
  }
  g.huntSpeed = Math.min(2.4, 1.5 + 0.12 * (n - 1)) * sp * g.adapt * tk;
  g.wanderSpeed = 1.0 * sp * g.adapt * tk;
}

function beginNight(opt = {}) {
  hide('intro'); Voice.stop();
  const n = store.data.night, bot = opt.bot || null;
  // Hide & Seek uses a bigger map (more rooms each time you play it)
  const world = buildNight(bot ? 2 + Math.min(2, store.data.runs | 0) : n, store.data.settings);
  g = {
    world, player: { x: world.startPos.x, y: world.startPos.y, hidden: null }, monsters: [], time: 0, graceUntil: n === 1 ? 25 : 15,
    lightOn: true, lightAngle: 0, lightHalf: [0.5, 0.42, 0.34][tier], lightRange: [9, 8, 6.4][tier], battery: 100, cells: 0, danger: 0, moving: false,
    nearHide: null, nearDoor: null, adapt: 1, room: world.start, stepsRead: 0, stepsMath: 0, zaps: 0, caught: 0, tokensAtStart: store.data.tokens,
    beatT: 0, mmT: 0, spotCool: 0,
    helpers: helperBots(bot).map(b => ({ ...b, x: world.startPos.x, y: world.startPos.y, saved: false })), trail: [], trailT: 0,
    chaseBot: bot,
  };
  if (bot) g.graceUntil = 12; // it counts to ten first
  // face into the room (toward its middle) at the start
  g.lightAngle = facingFrom(world, g.player);
  applySpeeds();
  g.onMonsterSpots = m => {
    if (g.spotCool > 0) return; g.spotCool = 6;
    if (store.data.settings.voices && !Voice.speaking) charSay(pick(LINES.hunt), m.c);
  };
  g.onMonsterLost = m => { if (store.data.settings.voices && !Voice.speaking && Math.hypot(m.x - g.player.x, m.y - g.player.y) < 7) charSay(pick(LINES.lost), m.c, { volume: 0.8 }); };
  g.onMonsterHears = m => { if (g.spotCool > 0) return; g.spotCool = 6; if (store.data.settings.voices && !Voice.speaking) charSay(tier === 0 ? pick(['I hear you! Hee hee!', 'Is that you?']) : pick(['I hear you...', 'What was that?', 'I heard footsteps...']), m.c); };
  const far = [...world.rooms].sort((a, b) => b.dist - a.dist);
  if (bot) { // your robot starts in the farthest room and searches for you
    const pw = { speed: 2, ears: 2, eyes: 2, ...(bot.powers || {}) }, r = far[0];
    g.monsters.push(new Monster('bot', r.x0 + 4.5, r.y0 + 3.5, { bot, vision: 3 + pw.eyes * 0.9, hear: 1.6 + pw.ears * 1.1, speedK: 1 }));
  } else castForNight(n).forEach((id, i) => { const r = far[i % far.length]; g.monsters.push(new Monster(id, r.x0 + 4.5, r.y0 + 3.5)); });
  renderer.setWorld(world, tier);
  window.__game = g;
  show('hud'); show('controls');
  mode = 'play';
  Sfx.startAmbient();
  if (bot) {
    const c = g.monsters[0].c;
    setTimeout(() => { if (mode === 'play') charSay(tier === 0 ? `I'm ${bot.name}! Let's play hide and seek! I'll count to ten. One, two, three, four, five, six, seven, eight, nine, ten! Ready or not, here I come!` : `I am ${bot.name}... I will count to ten. One... two... three... four... five... six... seven... eight... nine... ten. Ready or not... here I come.`, c); }, 700);
    return;
  }
  const newest = castForNight(n).slice(-1)[0];
  const c = CHARACTERS[newest];
  setTimeout(() => { if (mode === 'play' && store.data.settings.voices) charSay(introLine(newest), c); }, 800);
}
function facingFrom(w, p) {
  const opts = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
  let best = 0, bd = -1;
  for (const a of opts) { let d = 0; while (d < 8 && !solidForPlayer(w, Math.floor(p.x + Math.cos(a) * d), Math.floor(p.y + Math.sin(a) * d))) d += 0.5; if (d > bd) { bd = d; best = a; } }
  return best;
}

function pauseGame() { if (mode !== 'play') return; mode = 'pause'; Voice.stop(); show('pause'); }
const STAGE_UI = ['stageHud', 'stageTouch', 'runBtns', 'stageDone', 'stageIntro'];
function resumeGame() { hide('pause'); mode = 'play'; }
function askQuit() {
  if (mode !== 'play') return;
  mode = 'quit'; Voice.stop(); input.x = input.y = 0; input.stick = null; input.aim = null;
  $('stickBase').classList.remove('on');
  show('quitConfirm');
}
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
  g.lightOn = !g.lightOn; Sfx.light();
  $('btnLight').classList.toggle('off', !g.lightOn);
}

async function doAction() {
  if (!g || mode !== 'play') return;
  const p = g.player;
  if (p.hidden) { p.hidden = null; Sfx.close(); return; }
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
    g.graceUntil = Math.max(g.graceUntil, g.time + 2);
    if (door.exit) sparkyTalk('The exit is open! Run through it!');
  }
}

// ------------------------------------------------------------------ caught / win
function caught(m) {
  mode = 'scare'; Voice.stop();
  store.data.stats.caught++; g.caught++; store.save();
  g.adapt = Math.max(0.6, g.adapt * 0.88); applySpeeds();
  jumpScare(m.bot ? { bot: m.bot } : m.id).then(() => showCaught(m));
}
/**
 * Caught! What happens depends on the tier (and the grown-up's scare setting, which can only lower it):
 * Gentle: the animatronic bounces in smiling — "TAG! You're it!" Spooky-lite: a quick "Gotcha!" pop.
 * Spooky: the full jump scare (big, shaking, loud). who = cast id or { bot }.
 */
function jumpScare(who) {
  const bot = who && who.bot ? who.bot : null, id = bot ? null : who;
  const c = bot ? { pitch: 1.1, rate: 0.95, voice: 'bright' } : CHARACTERS[id];
  const sc = $('scare');
  const T = tier;
  return new Promise(done => {
    sc.classList.remove('hidden');
    const ctx = sc.getContext('2d'); sc.width = innerWidth; sc.height = innerHeight;
    Sfx.scream(T === 2);
    if (store.data.settings.voices) charSay(pick(LINES.caught), c);
    const t0 = performance.now(); const dur = T === 2 ? 1300 : T === 1 ? 1400 : 1900;
    const anim = now => {
      const t = (now - t0) / dur, W = sc.width, H = sc.height, m = Math.min(W, H);
      if (T === 0) { ctx.fillStyle = '#ffe9f3'; ctx.fillRect(0, 0, W, H); for (let i = 0; i < 24; i++) { ctx.fillStyle = ['#ffcf4a', '#4fb6ff', '#7ed957', '#ff7ab8'][i % 4]; const a = i * 0.9 + t * 4; ctx.beginPath(); ctx.arc(W / 2 + Math.cos(a) * m * (0.2 + t * 0.4), H / 2 + Math.sin(a) * m * (0.2 + t * 0.3), 8, 0, 7); ctx.fill(); } }
      else { ctx.fillStyle = T === 2 ? '#000' : 'rgba(10,0,20,0.92)'; ctx.fillRect(0, 0, W, H); }
      const sh = T === 2 ? (1 - t) * 18 : 0;
      const size = T === 2 ? m * (1.4 + t * 0.6) : T === 1 ? m * 0.9 * Math.min(1, t * 3) : m * 0.75 * (1 + Math.abs(Math.sin(t * 9)) * 0.06);
      const x = W / 2 + (Math.random() - 0.5) * sh, y = H / 2 + (T === 2 ? size * 0.25 : size * 0.12) + (Math.random() - 0.5) * sh - (T === 0 ? Math.abs(Math.sin(t * 9)) * m * 0.04 : 0);
      if (bot) drawBot(ctx, bot, x, y, size, now / 1000, { mood: 'chase', tier: T }); else drawCharacter(ctx, id, x, y, size, now / 1000, {});
      if (T !== 2) { ctx.fillStyle = T === 0 ? '#7a3a9a' : '#ffd84a'; ctx.font = `bold ${Math.round(H * 0.1)}px Fredoka, system-ui`; ctx.textAlign = 'center'; ctx.fillText(T === 0 ? 'TAG! You\'re it!' : 'GOTCHA!', W / 2, H * 0.15); }
      if (t < 1) requestAnimationFrame(anim); else { sc.classList.add('hidden'); done(); }
    };
    requestAnimationFrame(anim);
  });
}

function showCaught(m) {
  mode = 'caught';
  const tip = pick(TIPS);
  $('caughtTitle').textContent = tier === 0 ? `${m.c.name.split(' ')[0]} tagged you! Hee hee!` : `${m.c.name} caught you!`;
  $('caughtTip').textContent = tip;
  show('caught');
  speakSparky(tier === 0 ? `Tag! ${m.c.name.split(' ')[0]} found you. That was fun! Let's play again. Here's a tip: ${tip}` : `Oh no! That's okay, let's try again. Here's a tip: ${tip}`);
}

function respawn() {
  hide('caught'); Voice.stop();
  if (!g) return;
  const p = g.player; p.x = g.world.startPos.x; p.y = g.world.startPos.y; p.hidden = null;
  g.lightAngle = facingFrom(g.world, p);
  g.battery = 100; g.lightOn = true; $('btnLight').classList.remove('off');
  g.monsters.forEach(m => { m.respawn(g); m.glare = 0; });
  g.graceUntil = g.time + 8;
  mode = 'play';
}

function nightComplete() {
  if (g.chaseBot) return seekDone();
  mode = 'done'; Voice.stop(); Sfx.stopAmbient(); Sfx.win();
  const d = store.data; d.stats.nights++; d.night++; d.tokens += 10;
  advance();
  const stars = g.caught === 0 ? 3 : g.caught <= 2 ? 2 : 1;
  $('doneStars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  $('doneStats').innerHTML = `📖 Doors read: <b>${g.stepsRead}</b><br>🔢 Gates solved: <b>${g.stepsMath}</b><br>🔦 Animatronics zapped: <b>${g.zaps}</b><br>★ Tokens earned: <b>${d.tokens - g.tokensAtStart}</b>`;
  hide('hud'); hide('controls'); show('done');
  $('btnNextNight').textContent = `🔧 Next level: ${STAGE_INFO.build.name}`;
  speakSparky(`You escaped! Great job! You read ${g.stepsRead} doors and solved ${g.stepsMath} gates. Next level: the Robot Workshop! You get to build your own animatronic!`);
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

  // ---- movement (first person): forward/back + turn
  const k = input.keys;
  let fwd = -input.y, turn = Math.abs(input.x) > 0.2 ? Math.sign(input.x) * (Math.abs(input.x) - 0.2) / 0.8 : 0;
  if (k.has('arrowup') || k.has('w')) fwd = 1; if (k.has('arrowdown') || k.has('s')) fwd = -1;
  if (k.has('arrowleft') || k.has('a')) turn = -1; if (k.has('arrowright') || k.has('d')) turn = 1;
  g.moving = false;
  if (!p.hidden) {
    g.lightAngle += turn * dt * 2.4;
    if (Math.abs(fwd) > 0.15) {
      const sp = (fwd > 0 ? 3.0 : 1.8) * Math.min(1, Math.abs(fwd)) * Math.sign(fwd);
      const vx = Math.cos(g.lightAngle) * sp * dt, vy = Math.sin(g.lightAngle) * sp * dt;
      const r = 0.28;
      const free = (x, y) => !solidForPlayer(w, Math.floor(x - r), Math.floor(y - r)) && !solidForPlayer(w, Math.floor(x + r), Math.floor(y - r)) && !solidForPlayer(w, Math.floor(x - r), Math.floor(y + r)) && !solidForPlayer(w, Math.floor(x + r), Math.floor(y + r));
      if (free(p.x + vx, p.y)) p.x += vx;
      if (free(p.x, p.y + vy)) p.y += vy;
      g.moving = true;
    }
  }

  // ---- robot helpers follow your trail
  g.trailT -= dt;
  if (g.trailT <= 0 && !p.hidden) { g.trailT = 0.08; const lt = g.trail[g.trail.length - 1]; if (!lt || Math.hypot(lt.x - p.x, lt.y - p.y) > 0.15) g.trail.push({ x: p.x, y: p.y }); if (g.trail.length > 60) g.trail.shift(); }
  g.helpers.forEach((h, i) => { const tp = g.trail[Math.max(0, g.trail.length - 1 - (i + 1) * 8)] || p; h.moving = Math.hypot(tp.x - h.x, tp.y - h.y) > 0.05; h.x += (tp.x - h.x) * Math.min(1, dt * 4); h.y += (tp.y - h.y) * Math.min(1, dt * 4); });

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
      sparkyTalk(left > 0 ? `Power cell! ${left} more to go.` : 'All the power cells! Now find the EXIT!');
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
  if (w.exit.open) for (const [tx, ty] of w.exit.tiles) if (Math.hypot(tx + 0.5 - p.x, ty + 0.5 - p.y) < 0.95) { nightComplete(); return; }

  // ---- flashlight battery (drains slowly in Gentle mode, where the lights are on)
  if (g.lightOn && !p.hidden) { g.battery -= dt * (tier === 0 ? 0.5 : 1.5); if (g.battery <= 0) { g.battery = 0; g.lightOn = false; $('btnLight').classList.add('off'); sparkyTalk('Your flashlight battery ran out! Turn it off to let it charge, or find a battery.'); } }
  else g.battery = Math.min(100, g.battery + dt * 3);

  // ---- monsters
  let nearest = null, nd = 1e9;
  for (const m of g.monsters) {
    m.update(dt, g);
    if (!m.active) continue;
    const dx = m.x - p.x, dy = m.y - p.y, d = Math.hypot(dx, dy);
    if (d < nd) { nd = d; nearest = m; }
    let lit = false;
    if (g.lightOn && !p.hidden && d < g.lightRange - 0.3 && d > 0.1) {
      let da = Math.atan2(dy, dx) - g.lightAngle; da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(da) < g.lightHalf + 0.12 && lineOfSight(w, p.x, p.y, m.x, m.y)) lit = true;
    }
    if (lit) { m.glare += dt; if (m.glare >= 0.6) zap(m); }
    else m.glare = Math.max(0, m.glare - dt * 0.6);
    if (!p.hidden && d < 0.62 && g.time > g.graceUntil && m.active) {
      const h = g.helpers.find(h => !h.saved);
      if (h) { h.saved = true; m.vanish(g.time); g.graceUntil = g.time + 3; Sfx.vanish(0); toast(`🤖 ${h.name} scared ${m.c.name} away!`, 3000); speakSparky(`${h.name} scared ${m.c.name} away! ${h.name} can only do that once a night.`); continue; }
      caught(m); return;
    }
    // footsteps (sound comes from where it is, left/right of where you face)
    m.stepT -= dt;
    if (m.moving && m.stepT <= 0) {
      m.stepT = m.state === 'hunt' ? 0.33 : 0.5;
      const rel = Math.atan2(dy, dx) - g.lightAngle;
      if (d < 13) Sfx.footstep(clamp(Math.sin(rel), -1, 1), Math.pow(1 - d / 13, 1.6), m.c.heavy);
    }
    m.talkT -= dt;
    if (m.talkT <= 0) {
      m.talkT = 8 + Math.random() * 8;
      if (store.data.settings.voices && d < 9 && !Voice.speaking) charSay(pick(m.state === 'hunt' ? LINES.hunt : LINES.near), m.c, { volume: clamp(1.15 - d / 9, 0.2, 1) });
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
  const rel = Math.atan2(m.y - g.player.y, m.x - g.player.x) - g.lightAngle;
  Sfx.vanish(clamp(Math.sin(rel), -1, 1)); store.data.tokens += 1;
  toast(tier === 0 ? `🔦 You found ${m.c.name.split(' ')[0]}! Hee hee!` : `🔦 You zapped ${m.c.name}!`);
  if (store.data.settings.voices) { Voice.stop(); charSay(pick(LINES.flashed), m.c); }
}

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
  // footsteps arrow: up = ahead of you
  const dg = $('danger');
  if (g.nearest && g.nearestD < 11) {
    dg.style.opacity = clamp(1.2 - g.nearestD / 11, 0.25, 1);
    const rel = Math.atan2(g.nearest.y - p.y, g.nearest.x - p.x) - g.lightAngle - Math.PI / 2;
    $('dangerArrow').style.transform = `rotate(${rel}rad)`;
    dg.classList.toggle('hot', g.nearest.state === 'hunt');
  } else dg.style.opacity = 0;
}

// ------------------------------------------------------------------ the level loop
function levelUp() {
  setTimeout(() => { toast('⭐ Level up! The problems get a little harder now.', 3600); }, 300);
}
/** Finished a level: the next one is unlocked (saved right away, so it's there next time too). */
function advance() { const d = store.data; d.stage = (((d.stage | 0) === 3 ? 1 : (d.stage | 0)) + 1) % CYCLE.length; d.stageUp = false; store.save(); }

function startStage() {
  const k = stageKind();
  if (k === 'night') return startNightIntro();
  hide('title'); mode = 'intro'; Voice.stop();
  const I = STAGE_INFO[k], d = store.data;
  $('siTitle').textContent = `${I.icon} ${I.name}`;
  const art = $('siArt'), ctx = art.getContext('2d');
  let say, drawArt;
  if (k === 'build') {
    const n = (d.bots || []).length;
    $('siGoal').innerHTML = n ? `Build animatronic number <b>${n + 1}</b>! When it wakes up, it chases <b>you</b>!` : 'Build your very own <b>animatronic</b>! When it wakes up, it chases <b>you</b>!';
    $('siHow').innerHTML = '<li>🧰 Pick a robot kit. Read the color words on the paint cans to paint it.</li><li>📦 Tap the glowing crate. Read the word 📖 or solve the problem 🔢 to open it.</li><li>✋ Drag each part onto your robot. Read the name tags to name it.</li><li>⚡ Give it powers (speed, ears, eyes) — solve a math problem to lock each one in.</li><li>🔌 Hold the lever... and it comes to life!</li>';
    drawArt = () => { ctx.clearRect(0, 0, art.width, art.height); ['bunny', 'bear', 'pup', 'penguin'].forEach((kind, i) => drawBot(ctx, { kind, color: ['#4fb6ff', '#ff7ab8', '#7ed957', '#ffb84a'][i] }, 60 + i * 120, 130, 120, i)); };
    say = 'The robot workshop! Build your own animatronic. Open the crates by reading words and solving problems, then put the parts on. Give it powers with math. Then bring it to life... and get ready, because next it chases you!';
  } else {
    const bot = (d.bots || []).slice(-1)[0];
    if (bot) {
      $('siGoal').innerHTML = tier === 0 ? `<b>${bot.name}</b> wants to play hide-and-seek! Find the power cells and get to the <b>EXIT</b> before ${bot.name} finds you!` : `<b>${bot.name}</b> came to life and is searching for you! Find the power cells and escape through the <b>EXIT</b>!`;
      const pw = { speed: 2, ears: 2, eyes: 2, ...(bot.powers || {}) };
      drawArt = () => { ctx.clearRect(0, 0, art.width, art.height); drawBot(ctx, bot, 130, 130, 125, 0, { mood: 'chase', tier }); ctx.fillStyle = '#fff'; ctx.font = '700 18px Fredoka, Andika, sans-serif'; ctx.textAlign = 'left'; ['⚡ Speed', '👂 Ears', '👀 Eyes'].forEach((l, i) => { const v = [pw.speed, pw.ears, pw.eyes][i]; ctx.fillText(l, 250, 80 + i * 40); for (let j = 0; j < 5; j++) { ctx.fillStyle = j < v ? ['#ffcf4a', '#4fb6ff', '#7ed957'][i] : '#3a4558'; ctx.fillRect(350 + j * 22, 66 + i * 40, 18, 16); } ctx.fillStyle = '#fff'; }); };
      say = tier === 0 ? `Hide and seek time! ${bot.name} will count to ten, then come looking for you. Find the power cells and go out the exit. Read words and solve problems to open the doors. If ${bot.name} gets close, hide!`
        : `${bot.name} came to life! It starts in a room far away, and it is looking for you. Its ears hear your footsteps, so stand still or hide when it is close. Find the power cells and escape through the exit!`;
      $('siHow').innerHTML = `<li>🕹️ Walk with the left side of the screen. Drag the right side to look around.</li><li>🚪 Read the doors 📖 and solve the gates 🔢 to open them. Find the power cells ⚡, then the EXIT.</li><li>👂 ${bot.name} hears footsteps (ears ${pw.ears}) and sees you from far away (eyes ${pw.eyes}). Stand still or <b>HIDE</b> when it's close.</li><li>🔦 Shine your flashlight on ${bot.name} to make it run away for a little while.</li>`;
    } else {
      $('siGoal').innerHTML = 'Build an animatronic in the Robot Workshop first!';
      drawArt = () => { ctx.clearRect(0, 0, art.width, art.height); };
      say = 'Build an animatronic in the workshop first!';
      d.stage = 1; store.save();
    }
  }
  drawSoon(drawArt);
  show('stageIntro');
  speakSparky(say);
}
function beginStage() {
  hide('stageIntro'); Voice.stop();
  const k = stageKind(), d = store.data;
  const env = {
    store, tutor, say: t => speakSparky(t), toast, sfx: Sfx, kid: store.config.kid || {},
    voice: (t, id) => { const c = id === 'bot' ? { pitch: 1.1, rate: 0.95, voice: 'bright' } : CHARACTERS[id]; if (c && !Voice.speaking) charSay(t, c); },
    challenge: { open: async (item, o) => { mode = 'challenge'; Voice.stop(); const r = await challenge.open(item, o); if (mode === 'challenge') mode = 'play'; return r; } },
    onLevelUp: () => levelUp(),
  };
  if (k === 'chase') { const bot = (d.bots || []).slice(-1)[0]; if (bot) { beginNight({ bot }); return; } return startStage(); }
  st = new Workshop({ ...env, firstTime: !(d.bots || []).length, onDone: bot => buildDone(bot) });
  window.__stage = st;
  show('stageHud'); show('stageTouch');
  $('runBtns').classList.add('hidden');
  $('shHearts').classList.add('hidden');
  mode = 'play';
  Sfx.startAmbient();
  st.start();
}
function hearts(n) { $('shHearts').innerHTML = [0, 1, 2].map(i => `<span class="${i < n ? '' : 'lost'}">❤️</span>`).join(''); }
let lastGoal = '';
function stageHud() {
  if (!st) return;
  const goal = st.goal; if (goal !== lastGoal) { lastGoal = goal; $('shGoal').textContent = goal; if (together) together.poke(); }
}
/** The animatronic woke up: save it and go straight to the next level, where it chases you. */
function buildDone(bot) {
  const d = store.data;
  d.bots = [...(d.bots || []), bot].slice(-12); d.builds = (d.builds | 0) + 1; d.tokens += 10;
  advance();
  Art.preload(tier, [bot]);
  st = null; Sfx.stopAmbient();
  hide('stageHud'); hide('stageTouch'); hide('runBtns');
  toast(`🤖 ${bot.name} is alive! ★ +10 tokens`, 3000);
  startStage();
}
/** Escaped your own animatronic in Hide & Seek. */
function seekDone() {
  mode = 'done'; Voice.stop(); Sfx.stopAmbient(); Sfx.win();
  const d = store.data, bot = g.chaseBot, s = g;
  d.runs = (d.runs | 0) + 1; d.tokens += 10; d.stats.runs = (d.stats.runs | 0) + 1;
  const pw = bot && bot.powers ? bot.powers.speed + bot.powers.ears + bot.powers.eyes : 0;
  const bonus = pw >= 12 ? 5 : pw >= 9 ? 3 : 0; d.tokens += bonus; // a tougher robot = more stars
  advance();
  hide('hud'); hide('controls');
  g = null; window.__game = null;
  stageDone(`🙈 You beat ${bot.name}!`, `📖 Doors read: <b>${s.stepsRead}</b><br>🔢 Gates solved: <b>${s.stepsMath}</b><br>🔦 Times you made it run: <b>${s.zaps}</b><br>★ +${10 + bonus} tokens${bonus ? ' (tough robot bonus!)' : ''}<br>🤖 ${bot.name} is your helper now!`,
    ctx => { drawBot(ctx, bot, 140, 130, 125, 0, { mood: 'friendly' }); ctx.font = '60px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.fillText('🏆', 300, 140); });
  speakSparky(`You escaped! You read ${s.stepsRead} doors and solved ${s.stepsMath} gates. ${bot.name} is your helper now! Next up: Night ${d.night}!`);
}
function stageDone(title, html, art) {
  mode = 'done'; Voice.stop();
  hide('stageHud'); hide('stageTouch'); hide('runBtns');
  $('sdTitle').textContent = title; $('sdStats').innerHTML = html;
  const c = $('sdArt'), ctx = c.getContext('2d');
  drawSoon(() => { ctx.clearRect(0, 0, c.width, c.height); art(ctx); });
  const nx = stageKind();
  $('sdNext').textContent = `${STAGE_INFO[nx].icon} Next level: ${STAGE_INFO[nx].name}${nx === 'night' ? ' ' + store.data.night : ''}`;
  show('stageDone');
}

// ------------------------------------------------------------------ play together (grown-ups join from their phones)
/** Draw the on-screen buttons, map, messages and menus onto the grown-up's live video, so it matches the kid's screen. */
function composeHud(ctx, W, H) {
  const sx = W / innerWidth, sy = H / innerHeight;
  const visible = el => el && !el.classList.contains('hidden') && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
  const box = (el, fill, stroke) => { const r = el.getBoundingClientRect(); if (!r.width) return null; const x = r.left * sx, y = r.top * sy, w = r.width * sx, h = r.height * sy; ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, Math.min(h / 2, 14 * sx)) : ctx.rect(x, y, w, h); ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); } return { x, y, w, h }; };
  const text = (el, t, color = '#fff', size = 15) => { const r = el.getBoundingClientRect(); if (!r.width) return; ctx.fillStyle = color; ctx.font = `700 ${Math.max(10, size * sx)}px Andika, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, (r.left + r.width / 2) * sx, (r.top + r.height / 2) * sy, r.width * sx); };
  ctx.save();
  if (visible($('hud'))) {
    for (const id of ['hudCells', 'hudTokens']) { const el = $(id); box(el, 'rgba(10,6,18,.8)', '#3b2d52'); text(el, el.textContent, id === 'hudCells' ? '#8fff8f' : '#fff'); }
    const bat = document.querySelector('.pill.battery'); const b = bat && box(bat, 'rgba(10,6,18,.8)', '#3b2d52');
    if (b && g) { ctx.fillStyle = '#222'; ctx.fillRect(b.x + b.w * 0.35, b.y + b.h * 0.35, b.w * 0.55, b.h * 0.3); ctx.fillStyle = g.battery < 20 ? '#e53935' : g.battery < 50 ? '#fdd835' : '#7cd67c'; ctx.fillRect(b.x + b.w * 0.35, b.y + b.h * 0.35, b.w * 0.55 * g.battery / 100, b.h * 0.3); ctx.font = `${Math.max(10, 14 * sx)}px sans-serif`; ctx.textAlign = 'left'; ctx.fillText('🔦', b.x + 4, b.y + b.h / 2); }
    const mm = $('minimap'), r = mm.getBoundingClientRect(); if (r.width) ctx.drawImage(mm, r.left * sx, r.top * sy, r.width * sx, r.height * sy);
    const dg = $('danger'); if (+getComputedStyle(dg).opacity > 0.05) text(dg, '👣 ⚠', '#ffd84a', 22);
  }
  if (visible($('controls'))) {
    const act = $('btnAction'); if (visible(act)) { box(act, act.classList.contains('hide') ? '#6a4a00' : '#3b7a2b', '#9cf08a'); text(act, act.textContent, '#fff', 16); }
    const li = $('btnLight'); box(li, g && g.lightOn ? '#f5d76e' : '#444', '#fff3b0'); text(li, '🔦', '#000', 22);
  }
  if (visible($('stageHud'))) { for (const id of ['shGoal', 'shHearts']) { const el = $(id); if (visible(el)) { box(el, 'rgba(10,6,18,.8)', '#3b2d52'); text(el, el.textContent, '#fff', 14); } } }
  if (visible($('runBtns'))) for (const id of ['rbAct', 'rbJump', 'rbHelp']) { const el = $(id); if (visible(el)) { box(el, id === 'rbJump' ? '#f5d76e' : '#3b7a2b', '#fff'); text(el, el.textContent, id === 'rbJump' ? '#000' : '#fff', 18); } }
  const tst = $('toast'); if (tst.classList.contains('show')) { box(tst, 'rgba(15,10,25,.92)', '#ffd84a'); text(tst, tst.textContent, '#fff', 16); }
  // a menu or level screen is open (not the problem card — that one is shown on the grown-up's phone as-is)
  const scr = ['title', 'intro', 'stageIntro', 'pause', 'caught', 'done', 'stageDone', 'quitConfirm', 'steps', 'loading'].map($).find(visible);
  if (scr) {
    if (scr.id === 'title') { try { ctx.drawImage($('titleArt'), 0, 0, W, H); } catch (e) {} ctx.fillStyle = 'rgba(8,4,14,.35)'; } else ctx.fillStyle = 'rgba(8,4,14,.82)';
    ctx.fillRect(0, 0, W, H);
    const h = scr.querySelector('h1, h2'), goal = scr.querySelector('.goal, .tip, .welcome, .done-stats, .stats');
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (h) { ctx.fillStyle = '#ffd84a'; ctx.font = `700 ${Math.round(H * 0.08)}px Fredoka, Andika, sans-serif`; ctx.fillText(h.textContent.replace(/\s+/g, ' ').trim(), W / 2, H * 0.3, W * 0.9); }
    if (goal) { ctx.fillStyle = '#fff'; ctx.font = `600 ${Math.round(H * 0.045)}px Andika, sans-serif`; const lines = goal.innerText.split('\n').filter(Boolean).slice(0, 4); lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.45 + i * H * 0.07, W * 0.9)); }
    const btn = scr.querySelector('.big-btn'); if (btn) { ctx.fillStyle = '#ffd84a'; ctx.font = `700 ${Math.round(H * 0.05)}px Fredoka, sans-serif`; ctx.fillText(btn.textContent.trim(), W / 2, H * 0.8, W * 0.9); }
  }
  ctx.restore();
}
function mountRustyTogether() {
  const C = store.config;
  if (!C.urls || !C.urls.coop) return null;
  const T = mountTogether({
    canvas: $('game'), kid: C.kid, game: C.game || 'rustys-after-hours', url: C.urls.coop, csrf: () => store.csrf,
    speak: t => Voice.speak(t), stopSpeak: () => Voice.stop(), sfx: { pop: () => Sfx.click(), coin: () => Sfx.pickup() },
    duck: on => Sfx.duck(on),
    toast: (t, ms) => toast(t, ms), confetti: () => Sfx.win(),
    helps: [{ id: 'battery', icon: '🔋', label: 'Charge light', cool: 30 }, { id: 'shield', icon: '🛡️', label: 'Shield', cool: 40 }],
    onHelp: (id) => {
      if (mode !== 'play') return '';
      if (g) {
        if (id === 'battery') { g.battery = 100; g.lightOn = true; $('btnLight').classList.remove('off'); Sfx.pickup(); return 'charged your flashlight!'; }
        if (id === 'shield') { g.graceUntil = Math.max(g.graceUntil, g.time + 8); Sfx.power(); return 'gave you a shield! The animatronics can’t catch you for a little bit.'; }
      }
      return '';
    },
    // 💡 Hint: the same as the kid's "Help me" — Sparky teaches how to get the answer, step by step.
    onHint: () => {
      if (challenge.isOpen) { challenge.help(); return true; }
      if (g) { const left = g.world.cellsNeeded - g.cells; sparkyTalk(left > 0 ? `Look for the glowing power cells. ${left} more!` : 'Find the EXIT sign!'); return true; }
      return false;
    },
    status: () => {
      let goal = '', screen = '', tip = '';
      if (challenge.isOpen && challenge.item) {
        const it = challenge.item;
        screen = it.track === 'reading' ? `Reading door: “${it.text}”` : `Math gate: ${it.story || it.text}`;
        tip = 'Let them try first. Hold to talk and coach them, or tap 💡 Hint and Sparky will teach it (counts as helped).';
      }
      if (g) goal = g.chaseBot ? `🙈 Hide & Seek with ${g.chaseBot.name}: power cells ${g.cells}/${g.world.cellsNeeded}, then the EXIT` : `🌙 Night ${store.data.night}: power cells ${g.cells}/${g.world.cellsNeeded}, then the EXIT`;
      else if (st) { goal = st.goal; tip = tip || (st.coach ? st.coach() : ''); }
      else if (mode === 'title') screen = 'On the main menu';
      return { goal, screen, tip, level: `📖 Reading ${store.data.reading.level} · 🔢 Math ${store.data.math.level} · ${TIERS[tier].name} · Next: ${STAGE_INFO[stageKind()].name}` };
    },
    // the grown-up's phone shows the same problem card the kid sees (drawn with the game's own styles)
    view: () => ({ ch: challenge.mirror(), css: '/games/rustys-after-hours/css/game.css' }),
    // the live game video for grown-ups also gets the buttons, map and messages that sit on top of the game
    compose: (ctx, W, H) => composeHud(ctx, W, H),
  });
  if (T) {
    // grown-ups hear what the kid hears: every line Sparky and the animatronics say is said on their phone too
    Voice.onSpeak = (text, o) => T.say(text, o);
    challenge.onChange = () => T.poke();
  }
  return T;
}

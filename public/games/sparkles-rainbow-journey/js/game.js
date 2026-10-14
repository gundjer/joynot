// Sparkle's Rainbow Journey — main loop, controls and screens.
// Works with touch (phones/tablets), mouse, and keyboard (arrows / WASD, Space or Enter, Esc).
import { Store } from './storage.js';
import { Tutor } from './tutor.js';
import { Voice, Ears } from './speech.js';
import { Sfx } from './audio.js';
import { buildStage, solid, roomAt, stagePlan } from './world.js';
import { Renderer } from './render.js';
import { SPARKLE, FAMILY, memberForStage, drawUnicorn, rainbowArc, heart, star } from './characters.js';
import { Challenge } from './challenge.js';
import { exitProblem, FLASHLIGHT_STEPS as RAINBOW_STEPS } from './curriculum-math.js';
import { mountTogether } from '/games/_play/together.js';

const $ = id => document.getElementById(id);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const PIP = { pitch: 1.6, rate: 0.95 };

const store = Store;
const tutor = new Tutor(store);
let renderer, challenge;
let g = null;
let mode = 'loading';
const input = { x: 0, y: 0, keys: new Set(), stick: null };
let clock = 0;
let together = null;

// ------------------------------------------------------------------ boot
window.addEventListener('load', () => {
  renderer = new Renderer($('game'));
  challenge = new Challenge(store, tutor);
  const resize = () => { renderer.resize(); if (mode === 'title') drawTitleArt(); };
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 300));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { Voice.stop(); Sfx.stopMusic(); if (mode === 'play') pauseGame(); }
    else { Sfx.init(); if (g && store.data.settings.music) Sfx.startMusic(); }
  });
  document.addEventListener('gesturestart', e => e.preventDefault());           // iPhone pinch-zoom
  document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
  window.addEventListener('pagehide', () => store.beacon());
  store.onExternalChange = () => refreshTitle();
  bindUI();
  requestAnimationFrame(loop);
  boot();
  together = mountSparkleTogether();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
});

async function boot() {
  const { offline } = (await store.load()) || {};
  if (!store.data.stage) store.data.stage = 1;
  refreshTitle(); hide('loading'); show('title'); mode = 'title';
  if (offline) toast('📶 No internet right now. Progress saves on this device for now.', 4000);
}

let leaving = false;
async function exitTo(url) {
  if (leaving) return; leaving = true;
  Voice.stop(); Ears.stop(); Sfx.stopMusic();
  ['pause', 'hud', 'controls', 'done', 'steps', 'intro', 'quitConfirm', 'title'].forEach(hide);
  $('loadingText').textContent = 'Saving...'; show('loading');
  store.save(); g = null; mode = 'leaving';
  try { if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen().catch(() => {}); } catch (e) {}
  await store.flushNow();
  location.href = url;
}
const exitToJoyNot = () => exitTo(store.config.urls.exit || '/dashboard');

// family found so far = stages finished (max 5)
const familyFound = () => Math.min(FAMILY.length, (store.data.stage || 1) - 1);

function refreshTitle() {
  const d = store.data;
  const ri = tutor.levelInfo('reading', d.reading.level), mi = tutor.levelInfo('math', d.math.level);
  const hi = (d.tokens || d.stats.stages) ? 'Welcome back' : 'Welcome';
  $('titleName').textContent = `${hi}, ${d.name}!`;
  const found = familyFound();
  $('titleStory').textContent = found >= FAMILY.length
    ? 'Sparkle found her whole family! Now they explore Candy Land together.'
    : found === 0 ? 'Sparkle the unicorn is lost! Help her find her family.'
    : `Sparkle has found ${found} of ${FAMILY.length} family members. Keep going!`;
  $('titleStats').innerHTML = `📖 Reading level <b>${d.reading.level}</b> <small>(${ri.name})</small> &nbsp; 🔢 Math level <b>${d.math.level}</b> <small>(${mi.name})</small><br>🌈 Stage <b>${d.stage}</b> &nbsp; 🍬 <b>${d.tokens}</b> jelly beans`;
  drawTitleArt();
}

function drawTitleArt() {
  const c = $('titleArt'); const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  rainbowArc(ctx, c.width / 2, c.height - 10, 210, 14, 0.9);
  drawUnicorn(ctx, SPARKLE, c.width / 2 - 10, c.height - 18, 150, { facing: 1, t: clock });
  const found = familyFound();
  FAMILY.slice(0, found).forEach((m, i) => {
    const x = i % 2 ? c.width / 2 + 120 + (i >> 1) * 55 : c.width / 2 - 120 - (i >> 1) * 55;
    drawUnicorn(ctx, m, x, c.height - 14, 90 * m.size, { facing: x < c.width / 2 ? 1 : -1, t: clock + i });
  });
}

function speakPip(t, o = {}) { return Voice.speak(t, { ...PIP, ...o }); }
function toast(t, ms = 2600) { const el = $('toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), ms); }
function pipTalk(t) { toast('🐦 ' + t, 3500); if (!Voice.speaking) speakPip(t); }
function show(id) { $(id).classList.remove('hidden'); }
function hide(id) { $(id).classList.add('hidden'); }

// ------------------------------------------------------------------ UI wiring
function bindUI() {
  $('btnPlay').addEventListener('click', () => { Sfx.init(); Voice.unlock(); goFullscreen(); if (together) together.start("Sparkle's Rainbow Journey"); startIntro(); });
  $('btnSwitch').addEventListener('click', () => exitTo(store.config.urls.switch || '/dashboard'));
  $('btnTitleExit').addEventListener('click', () => exitToJoyNot());
  $('btnStart').addEventListener('click', () => { Sfx.init(); beginStage(); });
  $('btnIntroBack').addEventListener('click', () => toTitle());
  $('btnPause').addEventListener('click', () => pauseGame());
  $('btnExit').addEventListener('click', () => askQuit());
  $('btnResume').addEventListener('click', () => resumeGame());
  $('btnSteps').addEventListener('click', () => { hide('pause'); show('steps'); speakPip('The Rainbow Steps. ' + RAINBOW_STEPS.map((s, i) => `Step ${i + 1}: ${s.title}. ${s.text}`).join(' ')); });
  $('btnStepsClose').addEventListener('click', () => { Voice.stop(); hide('steps'); show('pause'); });
  $('btnMusic').addEventListener('click', () => toggleMusic());
  $('btnQuit').addEventListener('click', () => toTitle());
  $('btnPauseExit').addEventListener('click', () => exitToJoyNot());
  $('btnQuitNo').addEventListener('click', () => { hide('quitConfirm'); mode = 'play'; });
  $('btnPlayAgain').addEventListener('click', () => playAgain());
  $('btnQuitYes').addEventListener('click', () => toTitle());
  $('btnQuitExit').addEventListener('click', () => exitToJoyNot());
  $('btnNext').addEventListener('click', () => { hide('done'); startIntro(); });
  $('btnDoneTitle').addEventListener('click', () => { hide('done'); toTitle(); });
  $('btnDoneExit').addEventListener('click', () => exitToJoyNot());
  $('btnAction').addEventListener('click', () => doAction());
  $('stepsList').innerHTML = RAINBOW_STEPS.map((s, i) => `<li><span class="si">${s.icon}</span><div><b>${i + 1}. ${s.title}</b><br>${s.text}</div></li>`).join('');

  // keyboard (computers)
  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k) && mode === 'play') e.preventDefault();
    input.keys.add(k);
    if (mode === 'play') {
      if (k === ' ' || k === 'enter' || k === 'e') { e.preventDefault(); doAction(); }
      if (k === 'escape' || k === 'p') pauseGame();
      if (k === 'm') toggleMusic();
    } else if (mode === 'pause' && (k === 'escape' || k === 'p')) resumeGame();
    else if (mode === 'title' && k === 'enter' && !$('title').classList.contains('hidden')) $('btnPlay').click();
    else if (mode === 'intro' && (k === 'enter' || k === ' ')) { e.preventDefault(); $('btnStart').click(); }
  });
  window.addEventListener('keyup', e => input.keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => input.keys.clear());

  // touch / mouse joystick: press anywhere on the play area and drag
  const zone = $('stickZone'), base = $('stickBase'), knob = $('stickKnob');
  zone.addEventListener('pointerdown', e => {
    if (mode !== 'play') return;
    e.preventDefault(); try { zone.setPointerCapture(e.pointerId); } catch (er) {}
    input.stick = { id: e.pointerId, cx: e.clientX, cy: e.clientY };
    base.style.left = e.clientX + 'px'; base.style.top = e.clientY + 'px'; base.classList.add('on');
    knob.style.transform = 'translate(-50%,-50%)';
    $('stickHint').classList.add('hidden');
  });
  zone.addEventListener('pointermove', e => {
    const s = input.stick; if (!s || s.id !== e.pointerId) return;
    let dx = e.clientX - s.cx, dy = e.clientY - s.cy; const R = Math.max(40, base.offsetWidth * 0.42), d = Math.hypot(dx, dy);
    if (d > R) { dx = dx / d * R; dy = dy / d * R; }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    input.x = dx / R; input.y = dy / R;
  });
  const end = e => { const s = input.stick; if (!s || s.id !== e.pointerId) return; input.stick = null; input.x = 0; input.y = 0; base.classList.remove('on'); };
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
}

function goFullscreen() {
  // Android Chrome + computers go full screen. iPhone Safari doesn't allow it — that's fine.
  try { const el = document.documentElement; if (!document.fullscreenElement && el.requestFullscreen && matchMedia('(pointer: coarse)').matches) el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {}); } catch (e) {}
}

function toggleMusic() {
  store.data.settings.music = !store.data.settings.music; store.save();
  $('btnMusic').textContent = store.data.settings.music ? '🎵 Music: On' : '🔇 Music: Off';
  if (store.data.settings.music && g) Sfx.startMusic(); else Sfx.stopMusic();
}

// ------------------------------------------------------------------ stage flow
function startIntro() {
  hide('title'); mode = 'intro'; Voice.stop();
  const n = store.data.stage, need = Math.min(stagePlan(n).rainbows, stagePlan(n).size[0] * stagePlan(n).size[1] - 1);
  const m = memberForStage(n), allFound = n > FAMILY.length;
  $('introStage').textContent = `Stage ${n}`;
  $('introGoal').innerHTML = `Find <b>${need} rainbows</b> 🌈, then go through the <b>Rainbow Gate</b>!`;
  $('introWho').textContent = allFound ? `${m.name} is waiting with a surprise party!` : `Sparkle's ${m.who}, ${m.name}, is waiting on the other side!`;
  const c = $('introArt'), ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height);
  drawUnicorn(ctx, SPARKLE, 110, c.height - 10, 130, { facing: 1 });
  ctx.font = '42px system-ui'; ctx.textAlign = 'center'; ctx.fillText('❓', 235, 90);
  drawUnicorn(ctx, m, 350, c.height - 10, 120 * m.size, { facing: -1 });
  show('intro');
  speakPip(`Stage ${n}! Find ${need} rainbows, then go through the Rainbow Gate. ${allFound ? `${m.name} has a surprise for you!` : `Sparkle's ${m.who}, ${m.name}, is waiting!`} Read words and solve problems to open the gates.`);
}

function beginStage() {
  hide('intro'); Voice.stop();
  const n = store.data.stage;
  const world = buildStage(n, store.data.settings);
  const found = FAMILY.slice(0, familyFound());
  g = {
    world, player: { x: world.startPos.x, y: world.startPos.y, facing: 1 }, sparkle: SPARKLE,
    rainbows: 0, beansAtStart: store.data.tokens, read: 0, solved: 0, moving: false, nearGate: null,
    room: world.start, bursts: [], trail: [], snapCam: true, mmT: 0,
    followers: found.map(c => ({ c, x: world.startPos.x, y: world.startPos.y, facing: 1, moving: false })),
  };
  window.__game = g;
  show('hud'); show('controls'); $('stickHint').classList.remove('hidden');
  mode = 'play';
  if (store.data.settings.music) Sfx.startMusic();
  $('btnMusic').textContent = store.data.settings.music ? '🎵 Music: On' : '🔇 Music: Off';
  toast(`📍 ${world.start.name}`, 2000);
}

function pauseGame() { if (mode !== 'play') return; mode = 'pause'; Voice.stop(); show('pause'); }
function resumeGame() { hide('pause'); mode = 'play'; }
function askQuit() { if (mode !== 'play') return; mode = 'quit'; Voice.stop(); clearInput(); show('quitConfirm'); }
function clearInput() { input.x = input.y = 0; input.stick = null; input.keys.clear(); $('stickBase').classList.remove('on'); }

function playAgain() {
  Voice.stop(); Ears.stop(); Sfx.stopMusic();
  ['pause', 'hud', 'controls', 'done', 'steps', 'quitConfirm'].forEach(hide);
  clearInput(); store.save(); g = null; startIntro();
}
function toTitle() {
  Voice.stop(); Ears.stop(); Sfx.stopMusic();
  ['pause', 'hud', 'controls', 'done', 'steps', 'intro', 'quitConfirm'].forEach(hide);
  clearInput(); store.save();
  g = null; mode = 'title'; refreshTitle(); show('title');
  try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); } catch (e) {}
}

async function doAction() {
  if (!g || mode !== 'play' || !g.nearGate) return;
  const gate = g.nearGate, w = g.world;
  if (gate.exit && g.rainbows < w.rainbowsNeeded) {
    const left = w.rainbowsNeeded - g.rainbows;
    pipTalk(`The Rainbow Gate needs more color! Find ${left} more ${left === 1 ? 'rainbow' : 'rainbows'}.`);
    return;
  }
  mode = 'challenge'; Voice.stop(); clearInput();
  if (!gate.item) gate.item = gate.exit ? exitProblem(store.data.math.level) : tutor.pick(gate.kind === 'read' ? 'reading' : 'math');
  const res = await challenge.open(gate.item, { exit: !!gate.exit });
  if (!g) return;
  mode = 'play';
  if (res.solved) {
    if (gate.item.track === 'reading') g.read++; else g.solved++;
    gate.open = true; gate.item = null; Sfx.gate();
    const [tx, ty] = gate.tiles[0]; g.bursts.push({ x: tx + 0.5, y: ty + 0.5, t: 0, life: 0.8, c: '#fff' });
    if (gate.exit) pipTalk('The Rainbow Gate is open! Walk through it!');
  }
}

// ------------------------------------------------------------------ stage complete: family hug!
function stageComplete() {
  mode = 'done'; Voice.stop(); Sfx.stopMusic(); Sfx.hug();
  const d = store.data, n = d.stage, m = memberForStage(n), firstTime = n <= FAMILY.length;
  d.stats.stages = (d.stats.stages || 0) + 1; d.stage = n + 1; d.tokens += 10;
  store.save();
  hide('hud'); hide('controls');
  $('doneTitle').textContent = firstTime ? `You found ${m.name}!` : `Party with ${m.name}!`;
  $('doneText').textContent = firstTime
    ? (n === FAMILY.length ? `Sparkle found her WHOLE family! Hooray!` : `${m.name} will follow Sparkle on the next adventure.`)
    : 'The whole family is so proud of you!';
  $('doneStats').innerHTML = `📖 Gates read: <b>${g.read}</b> &nbsp; 🔢 Gates solved: <b>${g.solved}</b><br>🍬 Jelly beans: <b>+${d.tokens - g.beansAtStart}</b>`;
  $('btnNext').textContent = `🌈 Play Stage ${d.stage}`;
  show('done');
  hugAnim(m);
  speakPip(firstTime
    ? `Hooray! Sparkle found ${m.name}, her ${m.who}! ${n === FAMILY.length ? 'The whole family is together again!' : 'Great job reading and solving!'} Ready for stage ${d.stage}?`
    : `Great job! You read ${g.read} gates and solved ${g.solved}. Ready for stage ${d.stage}?`);
}

function hugAnim(m) {
  const c = $('doneArt'), ctx = c.getContext('2d'); const t0 = performance.now();
  const frame = now => {
    if (mode !== 'done') return;
    const t = (now - t0) / 1000, k = Math.min(1, t / 1.2);
    ctx.clearRect(0, 0, c.width, c.height);
    rainbowArc(ctx, c.width / 2, c.height - 6, 180, 12, 0.8);
    drawUnicorn(ctx, SPARKLE, 70 + 90 * k, c.height - 10, 120, { facing: 1, t, walking: k < 1, hearts: k >= 1 });
    drawUnicorn(ctx, m, c.width - 70 - 90 * k, c.height - 10, 120 * m.size, { facing: -1, t: t + 1, walking: k < 1 });
    if (k >= 1) for (let i = 0; i < 6; i++) star(ctx, c.width / 2 + Math.cos(t * 2 + i) * 150, 60 + Math.sin(t * 3 + i * 2) * 30, 6, ['#ff6b9d', '#ffd84a', '#6ec6ff'][i % 3]);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ main loop
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
  if (g) {
    if (mode === 'play') update(dt);
    g.bursts = g.bursts.filter(b => (b.t += dt) < b.life);
    renderer.draw(g, clock);
    g.mmT -= dt; if (g.mmT <= 0) { g.mmT = 0.25; renderer.minimap($('minimap'), g); updateHUD(); }
  } else if (mode === 'title' && Math.floor(clock * 10) !== Math.floor((clock - dt) * 10)) drawTitleArt();
  requestAnimationFrame(loop);
}

function update(dt) {
  const p = g.player, w = g.world;
  let mx = input.x, my = input.y; const k = input.keys;
  if (k.has('arrowleft') || k.has('a')) mx = -1; if (k.has('arrowright') || k.has('d')) mx = 1;
  if (k.has('arrowup') || k.has('w')) my = -1; if (k.has('arrowdown') || k.has('s')) my = 1;
  const mag = Math.hypot(mx, my);
  g.moving = false;
  if (mag > 0.15) {
    const speed = { slow: 2.6, normal: 3.4, fast: 4.2 }[store.data.settings.speed] || 3.4;
    const sp = speed * Math.min(1, mag), vx = mx / mag * sp * dt, vy = my / mag * sp * dt, r = 0.3;
    const free = (x, y) => !solid(w, Math.floor(x - r), Math.floor(y - r)) && !solid(w, Math.floor(x + r), Math.floor(y - r)) && !solid(w, Math.floor(x - r), Math.floor(y + r)) && !solid(w, Math.floor(x + r), Math.floor(y + r));
    if (free(p.x + vx, p.y)) p.x += vx;
    if (free(p.x, p.y + vy)) p.y += vy;
    if (Math.abs(mx) > 0.2) p.facing = mx > 0 ? 1 : -1;
    g.moving = true;
    g.trail.push([p.x, p.y, p.facing]); if (g.trail.length > 200) g.trail.shift();
  }
  // family follows along Sparkle's path
  g.followers.forEach((f, i) => {
    const idx = g.trail.length - 1 - (i + 1) * 14;
    if (idx >= 0) { const [tx, ty, fc] = g.trail[idx]; f.moving = Math.hypot(tx - f.x, ty - f.y) > 0.01; f.x = tx; f.y = ty; f.facing = fc; } else f.moving = false;
  });

  const room = roomAt(w, Math.floor(p.x), Math.floor(p.y));
  if (room && room !== g.room) { g.room = room; if (!room.visited) { room.visited = true; toast(`📍 ${room.name}`, 1800); } }

  for (const it of w.items) {
    if (it.taken || Math.hypot(it.x - p.x, it.y - p.y) > 0.62) continue;
    it.taken = true;
    if (it.type === 'rainbow') {
      g.rainbows++; store.data.stats.rainbows = (store.data.stats.rainbows || 0) + 1; Sfx.rainbow();
      g.bursts.push({ x: it.x, y: it.y, t: 0, life: 0.9, c: '#ff6b9d' });
      const left = w.rainbowsNeeded - g.rainbows;
      pipTalk(left > 0 ? `A rainbow! ${left} more to go.` : 'All the rainbows! Now find the Rainbow Gate!');
    } else { store.data.tokens++; Sfx.bean(); g.bursts.push({ x: it.x, y: it.y, t: 0, life: 0.5, c: it.c }); }
  }

  g.nearGate = null; let best = 1.4;
  for (const gt of w.gates) {
    if (gt.open) continue;
    for (const [tx, ty] of gt.tiles) { const dd = Math.hypot(tx + 0.5 - p.x, ty + 0.5 - p.y); if (dd < best) { best = dd; g.nearGate = gt; } }
  }
  if (w.exit.open) for (const [tx, ty] of w.exit.tiles) if (Math.hypot(tx + 0.5 - p.x, ty + 0.5 - p.y) < 0.95) { stageComplete(); return; }
}

function updateHUD() {
  if (!g) return;
  $('hudRainbows').textContent = `🌈 ${g.rainbows}/${g.world.rainbowsNeeded}`;
  $('hudBeans').textContent = `🍬 ${store.data.tokens}`;
  $('hudStage').textContent = `Stage ${store.data.stage}`;
  const act = $('btnAction'), gt = g.nearGate;
  if (gt) {
    act.textContent = gt.exit ? '🌈 Rainbow Gate' : gt.kind === 'read' ? '📖 Read gate' : '🔢 Solve gate';
    act.className = 'act pulse' + (gt.exit ? ' exit' : gt.kind === 'read' ? ' read' : ' math');
  } else act.className = 'act hidden';
}

// ------------------------------------------------------------------ play together (grown-ups join from their phones)
// Live picture, pointing, cheer, hints (Pip teaches the gate — counts as helped), plus two helps:
// 🌈 Rainbow trail (glowing sparkles toward the nearest rainbow) and 🍬 Jelly bean gift.
function mountSparkleTogether() {
  const C = store.config;
  if (!C.urls || !C.urls.coop) return null;
  return mountTogether({
    canvas: $('game'), kid: C.kid, game: C.game || 'sparkles-rainbow-journey', url: C.urls.coop, csrf: () => store.csrf,
    speak: t => Voice.speak(t), stopSpeak: () => Voice.stop(),
    sfx: { pop: () => Sfx.click(), coin: () => Sfx.bean() },
    toast: (t, ms) => toast(t, ms),
    helps: [{ id: 'trail', icon: '🌈', label: 'Show the way', cool: 20 }, { id: 'beans', icon: '🍬', label: 'Gift a jelly bean', cool: 30 }],
    onHelp: id => {
      if (mode !== 'play' || !g) return '';
      if (id === 'trail') {
        const p = g.player, left = (g.world.items || []).filter(it => it.type === 'rainbow' && !it.taken);
        const tgt = left.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
        if (tgt) { for (let i = 1; i <= 6; i++) g.bursts.push({ x: p.x + (tgt.x - p.x) * i / 6, y: p.y + (tgt.y - p.y) * i / 6, t: 0, life: 1.2 + i * 0.25, c: '#ffd84a' }); return 'showed you the way! Follow the sparkles!'; }
        return 'says: find the Rainbow Gate!';
      }
      if (id === 'beans') { store.data.tokens += 1; store.save(); Sfx.bean(); return 'gave you a jelly bean!'; }
      return '';
    },
    onHint: () => { if (challenge.isOpen) { challenge.help(); return true; } return false; },
    status: () => {
      let goal = '', screen = '', tip = '';
      if (challenge.isOpen && challenge.item) {
        const it = challenge.item;
        screen = it.track === 'reading' ? `Reading gate: “${it.text}”` : `Math gate: ${it.story || it.text}`;
        tip = 'Let them try first. Tap 💡 Hint and Pip will teach it (counts as helped).';
      }
      if (g) goal = `🌈 Stage ${store.data.stage}: rainbows ${g.rainbows}/${g.world.rainbowsNeeded}, then the Rainbow Gate`;
      else if (mode === 'title') screen = 'On the main menu';
      return { goal, screen, tip, level: `📖 Reading ${store.data.reading.level} · 🔢 Math ${store.data.math.level}` };
    },
  });
}

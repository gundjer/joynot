// Compass Cove: you're a pirate captain sailing a treasure map! Turn the COMPASS to set your heading, set how many
// squares to sail, and press ⛵ SAIL. Reach the X and your crew digs up the treasure. Watch out: ⛰️ rocks and ⛈️ storms
// (storms drift after every sail). Hitting one costs a heart; each treasure is a checkpoint.
// A new island chart every level, from a simple up/down/left/right map to latitude & longitude and an (x, y) grid.
// Levels (must match app/Games/CompassCove.php):
// 1 Up, Down, Left, Right · 2 North, South, East, West · 3 Map Keys · 4 Two-Step Directions · 5 Grid Maps: Find the Square
// 6 Fly to a Square · 7 Treasure Trails · 8 Map Scale: How Far? · 9 In-Between Directions · 10 Which Way From Here?
// 11 Latitude & Longitude · 12 Coordinate Plane (x, y)
import { startGame, rand, pick, shuffle, clamp, emoji, roundRect, realFrom, playBox, Sfx } from '../_play/play.js';
import { REAL } from '../_joy/js/reallife.js';
import { LESSONS } from './lessons.js';
import { text, panel, button, bubble, hand, popups, particles, teach, taskLevel, inBox, INK } from '../_play/kit.js';

const COLS = 8, ROWS = 6, LET = 'ABCDEFGH';
// heading index 0..7 = N, NE, E, SE, S, SW, W, NW
const HD = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
const HN = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
const HS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const UDLR = ['up', '', 'right', '', 'down', '', 'left', ''];
const CHARTS = [
  { name: 'Turtle Bay', sea: '#3fb4e6', land: '#8fd16a', deco: '🐢' }, { name: 'Parrot Point', sea: '#2fa6d9', land: '#9ad86f', deco: '🦜' },
  { name: 'Skull Isle', sea: '#2d8fc4', land: '#c9b27a', deco: '💀' }, { name: 'Coral Keys', sea: '#33b8c9', land: '#f3d899', deco: '🐠' },
  { name: 'Volcano Reef', sea: '#2a7fb0', land: '#a86a4a', deco: '🌋' }, { name: 'Mermaid Lagoon', sea: '#3fc6d6', land: '#9ad8a0', deco: '🐚' },
  { name: 'Whale Rock', sea: '#2b6fa6', land: '#9aa3ad', deco: '🐳' }, { name: 'Iceberg Sound', sea: '#5aa8d6', land: '#eaf4ff', deco: '🐧' },
  { name: 'Kraken Deep', sea: '#1f5f90', land: '#7a9a6a', deco: '🐙' }, { name: 'Lighthouse Cape', sea: '#2f8fc4', land: '#b5d98a', deco: '⛵' },
  { name: 'Equator Seas', sea: '#2b80bf', land: '#a8d878', deco: '🧭' }, { name: 'Grid Galleon Bay', sea: '#2a78b8', land: '#a0c878', deco: '⚓' },
];
const KEYSYM = [['▲', 'volcano', '#c94a2d'], ['●', 'harbor', '#2b2350'], ['✚', 'doctor’s hut', '#e5484d'], ['★', 'pirate fort', '#d9a400'], ['◆', 'crystal cave', '#8b6cff'], ['■', 'lighthouse', '#555']];
const sq = (x, y) => `${LET[x]}${y + 1}`;
const LAT = y => 60 - y * 10, LON = x => 80 - x * 10; // map is in the north-west: top = 60°N, left = 80°W
const XY = (x, y) => [x, ROWS - 1 - y]; // coordinate plane: origin bottom-left

/** Build the chart and the task. Returns { target, legs?: [[h, n]], say, show, axes, key?, mark? } */
function makeTask(lv, ship, G) {
  const free = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS && G[y][x] === '.' && !(x === ship.x && y === ship.y);
  const go = (h, n) => [ship.x + HD[h][0] * n, ship.y + HD[h][1] * n];
  const pickLeg = (dirs, nMin, nMax) => { for (let i = 0; i < 80; i++) { const h = pick(dirs), n = rand(nMin, nMax), [x, y] = go(h, n); if (free(x, y) && clearPath(G, ship, h, n)) return [h, n, x, y]; } return null; };
  const T = { lv, axes: lv >= 12 ? 'xy' : lv === 11 ? 'latlon' : lv >= 5 ? 'grid' : lv >= 2 ? 'compass' : 'udlr' };
  if (lv === 1 || lv === 2 || lv === 8 || lv === 9) {
    const dirs = lv === 9 ? [1, 3, 5, 7] : [0, 2, 4, 6], L = pickLeg(dirs, lv === 1 ? 1 : 2, lv === 1 ? 3 : 4); if (!L) return null;
    const [h, n, x, y] = L; T.target = { x, y }; T.legs = [[h, n]];
    if (lv === 1) T.say = `Sail ${UDLR[h]} ${n} square${n > 1 ? 's' : ''}!`;
    else if (lv === 8) { const scale = pick([5, 10, 100]); T.scale = scale; T.say = `Each square is ${scale} miles. Sail ${HN[h]} ${n * scale} miles!`; }
    else T.say = `Sail ${HN[h]} ${n} square${n > 1 ? 's' : ''}!`;
    T.show = T.say; return T;
  }
  if (lv === 3) { // map key: find the symbol, then sail there (any way you like)
    const spots = []; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (free(x, y) && (x === ship.x || y === ship.y)) spots.push([x, y]);
    const ks = shuffle(KEYSYM).slice(0, 4); const placed = shuffle(spots).slice(0, 4); if (placed.length < 4) return null;
    T.key = ks.map((k, i) => ({ sym: k[0], name: k[1], col: k[2], x: placed[i][0], y: placed[i][1] }));
    const tgt = pick(T.key); T.target = { x: tgt.x, y: tgt.y }; T.say = `Sail to the ${tgt.name}! Look at the MAP KEY to find its symbol.`; T.show = `Sail to the ${tgt.name}!`; T.keyAns = tgt; return T;
  }
  if (lv === 4) { const A = pickLeg([0, 2, 4, 6], 1, 3); if (!A) return null; const s2 = { x: A[2], y: A[3] }, h2s = [0, 2, 4, 6].filter(h => h % 4 !== A[0] % 4); for (let i = 0; i < 60; i++) { const h = pick(h2s), n = rand(1, 3), x = s2.x + HD[h][0] * n, y = s2.y + HD[h][1] * n; if (free(x, y) && clearPath(G, s2, h, n)) { T.target = { x, y }; T.legs = [[A[0], A[1]], [h, n]]; T.say = `Sail ${HN[A[0]]} ${A[1]}, then ${HN[h]} ${n}!`; T.show = T.say; return T; } } return null; }
  if (lv === 5 || lv === 6 || lv === 10 || lv === 11 || lv === 12) {
    const cand = []; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (free(x, y) && Math.abs(x - ship.x) + Math.abs(y - ship.y) >= (lv === 5 ? 2 : 3) && (lv !== 5 || x === ship.x || y === ship.y)) cand.push([x, y]);
    if (!cand.length) return null; const [x, y] = pick(cand); T.target = { x, y };
    if (lv === 11) { T.say = `Sail to ${LAT(y)} degrees North, ${LON(x)} degrees West!`; T.show = `Sail to ${LAT(y)}°N, ${LON(x)}°W`; }
    else if (lv === 12) { const [px, py] = XY(x, y); T.say = `Sail to the point ${px} comma ${py}. Across ${px}, up ${py}!`; T.show = `Sail to (${px}, ${py})`; }
    else if (lv === 10) { T.mark = true; T.say = 'See the red X? Figure out which way and how far, then sail there!'; T.show = 'Sail to the ❌! Which way? How far?'; }
    else { T.say = `Sail to square ${sq(x, y)}!`; T.show = `Sail to ${sq(x, y)}`; }
    return T;
  }
  // 7 treasure trail: from a landmark go … and … — dig there
  const lm = []; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (G[y][x] === 'L') lm.push([x, y]);
  const [lx, ly] = pick(lm.length ? lm : [[ship.x, ship.y]]);
  for (let i = 0; i < 80; i++) { const a = pick([0, 4]), b = pick([2, 6]), na = rand(1, 3), nb = rand(1, 3), x = lx + HD[a][0] * na + HD[b][0] * nb, y = ly + HD[a][1] * na + HD[b][1] * nb; if (free(x, y)) { T.target = { x, y }; T.say = `Treasure trail! From the skull rock, go ${HN[b]} ${nb} and ${HN[a]} ${na}. Then dig!`; T.show = `From 💀: ${HS[b]} ${nb}, ${HS[a]} ${na}`; T.from = { x: lx, y: ly }; return T; } }
  return null;
}
function clearPath(G, from, h, n) { for (let i = 1; i <= n; i++) { const x = from.x + HD[h][0] * i, y = from.y + HD[h][1] * i; if (x < 0 || y < 0 || x >= COLS || y >= ROWS || G[y][x] !== '.') return false; } return true; }
function makeChart(lv) {
  const G = Array.from({ length: ROWS }, () => Array(COLS).fill('.'));
  const n = lv <= 2 ? 3 : 6; for (let i = 0; i < n; i++) G[rand(0, ROWS - 1)][rand(0, COLS - 1)] = 'R';
  if (lv === 7) for (let i = 0; i < 2; i++) { const x = rand(1, COLS - 2), y = rand(1, ROWS - 2); G[y][x] = 'L'; }
  return G;
}

function createGame(api) {
  let P = null;
  const pops = popups(), fx = particles();

  function start(o) {
    P = { o, t: 0, chart: CHARTS[(o.real - 1) % CHARTS.length], n: o.boss ? 5 : o.edition <= 1 ? 3 : 4, done: 0, gold: 0, phase: 'set', guidedDone: !!o.boss, ship: { x: 0, y: rand(1, ROWS - 2), fx: 0, fy: 0 }, head: 2, dist: 1, storms: [], sail: null };
    P.ship.fx = P.ship.x; P.ship.fy = P.ship.y;
    api.score('💰 0'); api.progress(0, 'Treasures');
    api.goal(`🏴‍☠️ Welcome to <b>${P.chart.name}</b>, Captain!`, { speak: true });
    nextTask();
  }
  function nextTask() {
    if (P.done >= P.n) { P.phase = 'over'; api.finish({ win: true, title: `🏴‍☠️ ${P.chart.name} treasure found!`, text: `You dug up ${P.done} treasures worth ${P.gold} gold.` }); return; }
    const lv = taskLevel(api, P.o);
    let T = null, G;
    for (let i = 0; i < 40 && !T; i++) { G = makeChart(lv); if (G[P.ship.y][P.ship.x] !== '.') G[P.ship.y][P.ship.x] = '.'; T = makeTask(lv, P.ship, G); }
    if (!T) { P.ship.x = 0; P.ship.y = 2; return nextTask(); }
    P.G = G; P.T = T; P.storms = lv >= 4 && !P.o.boss ? [{ x: rand(2, COLS - 2), y: rand(0, ROWS - 1), dx: pick([-1, 1]) }] : [];
    const guided = !P.guidedDone;
    P.teach = teach(api, { level: lv, guided, prompt: T.say, expected: T.axes === 'latlon' ? `${LAT(T.target.y)}°N ${LON(T.target.x)}°W` : T.axes === 'xy' ? `(${XY(T.target.x, T.target.y).join(', ')})` : sq(T.target.x, T.target.y) });
    P.showSol = guided ? 1 : 0; P.leg = 0; P.phase = 'set'; P.dist = 1; P.startPos = { x: P.ship.x, y: P.ship.y };
    api.actions([{ key: 'help', label: '💡 Help' }, { key: 'check', label: '⛵ SAIL', big: true }]);
    api.goal(`🗺️ ${T.show}`, { speak: false });
    api.speak((guided ? "Let's sail this one together. " : '') + T.say + (guided ? ' First tap the compass to point the ship, then set how many squares, then press SAIL.' : ''));
  }
  function sail() {
    const h = P.head, n = P.dist;
    if (P.T.axes === 'udlr' && h % 2) return;
    P.phase = 'sailing'; P.sail = { h, n, i: 0, t: 0, from: { x: P.ship.x, y: P.ship.y } }; Sfx.click();
  }
  function stepSail(dt) {
    const S = P.sail; S.t += dt;
    if (S.t < 0.38) return;
    S.t = 0; S.i++;
    const x = P.ship.x + HD[S.h][0], y = P.ship.y + HD[S.h][1];
    const out = x < 0 || y < 0 || x >= COLS || y >= ROWS;
    const rock = !out && P.G[y][x] === 'R', storm = P.storms.some(s => s.x === x && s.y === y);
    if (out) { Sfx.wrong(); pops.add('🌊 Edge of the map!', api.W / 2, api.H * 0.3, '#fff'); return endSail(false); }
    if (rock || storm) { Sfx.wrong(); fx.burst(...cellXY(x, y), 14, ['#fff', '#8ab']); api.loseHeart(rock ? '⛰️ You sailed into the rocks!' : '⛈️ You sailed into a storm!'); return endSail(false); }
    P.ship.x = x; P.ship.y = y;
    if (S.i >= S.n) endSail(true);
  }
  function endSail() {
    const T = P.T; P.phase = 'set'; P.sail = null;
    P.storms.forEach(s => { s.x += s.dx; if (s.x < 1 || s.x > COLS - 2) s.dx *= -1; if (s.x === P.ship.x && s.y === P.ship.y) s.x += s.dx; });
    if (P.ship.x === T.target.x && P.ship.y === T.target.y) return dig();
    // instruction levels: was this leg what we asked for?
    const legs = T.legs;
    let off = false;
    if (legs) { const want = legs[P.leg]; if (want && (P.lastH !== want[0] || P.lastN !== want[1])) off = true; else P.leg++; }
    else { const before = Math.abs(P.lastFrom.x - T.target.x) + Math.abs(P.lastFrom.y - T.target.y), after = Math.abs(P.ship.x - T.target.x) + Math.abs(P.ship.y - T.target.y); if (after >= before) off = true; }
    if (!off) { api.speak(pick(['Land ho! Keep going.', 'Good sailing! Next step.', 'Aye! Keep sailing.']), { force: true }); return; }
    const n = P.teach.miss(); Sfx.wrong();
    if (n >= 3) {
      P.teach.done(false, P.T.axes === 'grid' ? sq(P.ship.x, P.ship.y) : `${P.ship.x},${P.ship.y}`);
      api.speak('Arr, let me steer this time. Watch the path!', { force: true });
      P.showSol = 1; P.phase = 'auto';
      if (!api.loseHeart('Your first mate steered for you.')) setTimeout(() => { if (P && P.phase === 'auto') { P.ship.x = T.target.x; P.ship.y = T.target.y; dig(true); } }, 1800);
      return;
    }
    if (n === 2) { P.teach.help(); P.showSol = 1; }
    api.speak(hintFor(), { force: true });
  }
  function hintFor() {
    const T = P.T, dx = T.target.x - P.ship.x, dy = T.target.y - P.ship.y;
    if (T.legs && T.legs[P.leg]) { const [h, n] = T.legs[P.leg]; return T.axes === 'udlr' ? `Point the ship ${UDLR[h]}, and sail ${n}.` : `${HN[h]} is ${['up', 'up and right', 'right', 'down and right', 'down', 'down and left', 'left', 'up and left'][h]} on this map. Sail ${n}${T.scale ? ` squares (${n * T.scale} miles ÷ ${T.scale})` : ''}.`; }
    const h = dx === 0 ? (dy < 0 ? 0 : 4) : dy === 0 ? (dx > 0 ? 2 : 6) : null;
    if (T.axes === 'latlon') return `Latitude lines go across: find ${LAT(T.target.y)}°N on the side. Longitude lines go up and down: find ${LON(T.target.x)}°W on top.`;
    if (T.axes === 'xy') { const [px, py] = XY(T.target.x, T.target.y); return `Start at zero. Go across ${px} on the bottom, then up ${py}.`; }
    if (h != null) return `The target is ${Math.abs(dx || dy)} square${Math.abs(dx || dy) > 1 ? 's' : ''} ${HN[h]}.`;
    return `It's ${Math.abs(dx)} ${dx > 0 ? 'East' : 'West'} and ${Math.abs(dy)} ${dy < 0 ? 'North' : 'South'}. Sail one way, then the other${P.o.real >= 9 ? ', or go diagonal' : ''}.`;
  }
  function dig(already) {
    const T = P.T;
    if (!already) { const r = P.teach.done(true, T.axes === 'grid' ? sq(T.target.x, T.target.y) : 'arrived'); if (r.levelUp) api.chime('⭐ <b>Level up!</b> A new island chart next voyage!', '🦜'); }
    P.phase = 'dig'; P.digT = 0; Sfx.correct(); api.speak('X marks the spot! Dig!');
    setTimeout(() => { if (!P) return; const g = rand(5, 12); P.gold += g; P.done++; P.guidedDone = true; api.score(`💰 ${P.gold}`); api.progress(P.done / P.n, 'Treasures'); fx.burst(...cellXY(T.target.x, T.target.y), 30, ['#ffd34d', '#ffb000', '#fff']); Sfx.win(); pops.add(`+${g} 💰`, ...cellXY(T.target.x, T.target.y)); setTimeout(() => P && nextTask(), 1300); }, 1100);
  }

  // ------------------------------------------------ layout
  function L() {
    const b = playBox(api.W, api.H), short = api.H <= 500, side = short || b.w > b.h * 1.25;
    const ctrl = side ? { x: b.x + b.w - Math.min(260, b.w * 0.34), y: b.y, w: Math.min(260, b.w * 0.34), h: b.h } : { x: b.x, y: b.y + b.h - Math.min(230, b.h * 0.38), w: b.w, h: Math.min(230, b.h * 0.38) };
    const mapArea = side ? { x: b.x + 26, y: b.y + 22, w: b.w - ctrl.w - 36, h: b.h - 30 } : { x: b.x + 26, y: b.y + 22, w: b.w - 30, h: b.h - ctrl.h - 34 };
    const c = Math.floor(Math.min(mapArea.w / COLS, mapArea.h / ROWS));
    return { b, side, ctrl, map: { x: mapArea.x + (mapArea.w - c * COLS) / 2, y: mapArea.y + (mapArea.h - c * ROWS) / 2, c } };
  }
  /** Shortest safe route to the target (around rocks and storms) for the ghost path. */
  function route() {
    const T = P.T, diag = T.lv === 9 || T.lv === 10, dirs = diag ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 2, 4, 6], key = (x, y) => x + ',' + y;
    const prev = new Map([[key(P.ship.x, P.ship.y), null]]), q = [[P.ship.x, P.ship.y]];
    while (q.length) { const [x, y] = q.shift(); if (x === T.target.x && y === T.target.y) break; for (const h of dirs) { const nx = x + HD[h][0], ny = y + HD[h][1]; if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || prev.has(key(nx, ny)) || P.G[ny][nx] === 'R' || P.storms.some(s => s.x === nx && s.y === ny)) continue; prev.set(key(nx, ny), [x, y]); q.push([nx, ny]); } }
    const out = []; let cur = [T.target.x, T.target.y]; if (!prev.has(key(...cur))) return [cur];
    while (cur) { out.unshift(cur); cur = prev.get(key(...cur)); }
    return out.slice(1);
  }
  function cellXY(x, y) { const M = L().map; return [M.x + x * M.c + M.c / 2, M.y + y * M.c + M.c / 2]; }
  const keyH = () => (P && P.T && P.T.key ? 24 + P.T.key.length * 20 : 0);
  function compassUI() {
    const C = L().ctrl, side = L().side, kh = side ? keyH() : 0, r = Math.min(C.w * 0.32, (C.h - kh) * (kh ? 0.24 : 0.3), 80);
    const cx = side ? C.x + C.w / 2 : C.x + C.w * 0.3, cy = side ? C.y + kh + r * 1.28 + 8 : C.y + C.h / 2;
    const dirs = HD.map((d, i) => { const a = i * Math.PI / 4; return { i, x: cx + Math.sin(a) * r, y: cy - Math.cos(a) * r, r: i % 2 ? r * 0.26 : r * 0.32 }; });
    const nx = side ? C.x + C.w / 2 : C.x + C.w * 0.72, bs = Math.min(56, r * 0.7), ny = side ? Math.min(cy + r * 1.28 + bs * 0.5 + 12, C.y + C.h - bs * 0.5 - 14) : keyH() ? C.y + C.h - bs * 0.5 - 22 : cy;
    return { cx, cy, r, dirs, minus: { x: nx - bs * 1.6, y: ny - bs / 2, w: bs, h: bs }, plus: { x: nx + bs * 0.6, y: ny - bs / 2, w: bs, h: bs }, num: { x: nx, y: ny } };
  }

  return {
    start(o) { start(o); },
    checkpoint() { if (P) { P.ship.x = P.startPos ? P.startPos.x : 0; P.ship.y = P.startPos ? P.startPos.y : 2; P.phase = 'set'; P.sail = null; } },
    stop() { P = null; },
    update(dt) {
      if (!P) return; P.t += dt; pops.update(dt); fx.update(dt);
      P.ship.fx += (P.ship.x - P.ship.fx) * Math.min(1, dt * 8); P.ship.fy += (P.ship.y - P.ship.fy) * Math.min(1, dt * 8);
      if (P.phase === 'sailing') { stepSail(dt); return; }
      if (P.phase !== 'set') return;
      const I = api.input;
      if (I.pressed('check')) { P.lastFrom = { x: P.ship.x, y: P.ship.y }; P.lastH = P.head; P.lastN = P.dist; sail(); }
      if (I.pressed('help')) this.hint();
      for (let d = 1; d <= 9; d++) if (I.pressed('n' + d)) P.dist = d;
      const map = { up: 0, right: 2, down: 4, left: 6 }; for (const k in map) if (I.pressed(k)) { P.head = map[k]; Sfx.click(); }
    },
    hint() { if (!P || P.phase !== 'set') return false; P.teach.help(); P.showSol = 1; api.speak(hintFor(), { force: true }); return true; },
    coach() { if (!P || !P.T) return ''; const T = P.T; return T.axes === 'latlon' ? 'Latitude = the side numbers (N). Longitude = the top numbers (W).' : T.axes === 'xy' ? 'Across first (x), then up (y).' : T.lv === 3 ? 'Find the symbol in the map key first.' : T.lv === 8 ? 'Divide the miles by the miles in one square.' : 'Point to North on the compass together, then count squares.'; },
    onHelp(id) { if (!P) return ''; if (id === 'calm') { P.storms = []; return 'calmed the seas — the storm is gone!'; } return ''; },
    screen() { if (!P || !P.T) return ''; return `${P.T.show} · Ship at ${P.T.axes === 'latlon' ? `${LAT(P.ship.y)}°N ${LON(P.ship.x)}°W` : P.T.axes === 'xy' ? `(${XY(P.ship.x, P.ship.y).join(', ')})` : sq(P.ship.x, P.ship.y)} · heading ${HN[P.head]} · ${P.dist} squares`; },
    onTap(x, y) {
      if (!P || P.phase !== 'set') return;
      const U = compassUI();
      const d = U.dirs.find(q => Math.hypot(x - q.x, y - q.y) < q.r + 10);
      if (d) { if (P.T.axes === 'udlr' && d.i % 2) return; if (P.o.real < 9 && d.i % 2 && P.T.lv < 9 && P.T.lv !== 10) return; P.head = d.i; Sfx.click(); api.speak(P.T.axes === 'udlr' ? UDLR[d.i] : HN[d.i]); return; }
      if (inBox(x, y, U.minus)) { P.dist = Math.max(1, P.dist - 1); Sfx.click(); api.speak(String(P.dist)); return; }
      if (inBox(x, y, U.plus)) { P.dist = Math.min(COLS - 1, P.dist + 1); Sfx.click(); api.speak(String(P.dist)); return; }
    },
    draw(ctx, W, H, onTitle) {
      const ch = P ? P.chart : CHARTS[0];
      ctx.fillStyle = '#f3e3b8'; ctx.fillRect(0, 0, W, H); // parchment
      if (onTitle || !P || !P.T) { emoji(ctx, '🏴‍☠️', W / 2, H * 0.45, Math.min(120, H * 0.25)); emoji(ctx, '🧭', W * 0.7, H * 0.6, 60); return; }
      const lay = L(), M = lay.map, c = M.c, T = P.T;
      // sea + grid
      ctx.fillStyle = ch.sea; roundRect(ctx, M.x, M.y, c * COLS, c * ROWS, 10); ctx.fill();
      for (let i = 0; i < 18; i++) { ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; const wx = M.x + ((i * 97 + P.t * 12) % (c * COLS)), wy = M.y + (i * 53) % (c * ROWS); ctx.beginPath(); ctx.arc(wx, wy, 6, Math.PI, 0); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1;
      for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(M.x + x * c, M.y); ctx.lineTo(M.x + x * c, M.y + ROWS * c); ctx.stroke(); }
      for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(M.x, M.y + y * c); ctx.lineTo(M.x + COLS * c, M.y + y * c); ctx.stroke(); }
      // axis labels
      const ls = Math.max(11, Math.min(16, c * 0.28));
      if (T.axes === 'grid') { for (let x = 0; x < COLS; x++) text(ctx, LET[x], M.x + x * c + c / 2, M.y - 11, { size: ls, color: '#7a5a1c' }); for (let y = 0; y < ROWS; y++) text(ctx, String(y + 1), M.x - 12, M.y + y * c + c / 2, { size: ls, color: '#7a5a1c' }); }
      if (T.axes === 'latlon') { for (let x = 0; x < COLS; x++) text(ctx, `${LON(x)}°W`, M.x + x * c + c / 2, M.y - 11, { size: ls * 0.8, color: '#7a5a1c' }); for (let y = 0; y < ROWS; y++) text(ctx, `${LAT(y)}°N`, M.x - 4, M.y + y * c + c / 2, { size: ls * 0.8, color: '#7a5a1c', align: 'right' }); }
      if (T.axes === 'xy') { for (let x = 0; x < COLS; x++) text(ctx, String(x), M.x + x * c + c / 2, M.y + ROWS * c + 11, { size: ls, color: '#7a5a1c' }); for (let y = 0; y < ROWS; y++) text(ctx, String(ROWS - 1 - y), M.x - 12, M.y + y * c + c / 2, { size: ls, color: '#7a5a1c' }); text(ctx, 'x →', M.x + COLS * c - 14, M.y + ROWS * c + 11, { size: ls * 0.8, color: '#c94a2d' }); text(ctx, 'y ↑', M.x - 12, M.y - 10, { size: ls * 0.8, color: '#c94a2d' }); }
      if (T.axes === 'compass' || T.axes === 'udlr') { text(ctx, T.axes === 'udlr' ? '⬆ up' : 'N ⬆', M.x + COLS * c / 2, M.y - 11, { size: ls, color: '#c94a2d' }); }
      // things on the chart
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const [cx, cy] = [M.x + x * c + c / 2, M.y + y * c + c / 2], t = P.G[y][x];
        if (t === 'R') emoji(ctx, '⛰️', cx, cy, c * 0.6);
        if (t === 'L') emoji(ctx, '💀', cx, cy, c * 0.6);
      }
      if (T.key) for (const k of T.key) { ctx.fillStyle = ch.land; ctx.beginPath(); ctx.arc(...cellXY(k.x, k.y), c * 0.38, 0, 7); ctx.fill(); text(ctx, k.sym, ...cellXY(k.x, k.y), { size: c * 0.42, color: k.col }); }
      else { const [tx, ty] = cellXY(T.target.x, T.target.y); ctx.fillStyle = ch.land; ctx.beginPath(); ctx.arc(tx, ty, c * 0.42, 0, 7); ctx.fill(); if (T.mark || P.phase === 'dig' || P.showSol) text(ctx, '❌', tx, ty, { size: c * 0.45 }); else emoji(ctx, '🌴', tx, ty - c * 0.05, c * 0.5); }
      for (const s of P.storms) emoji(ctx, '⛈️', ...cellXY(s.x, s.y), c * 0.7);
      emoji(ctx, ch.deco, M.x + COLS * c - c * 0.4, M.y + c * 0.4, c * 0.45, { alpha: 0.6 });
      // ghost route (we do / help)
      if (P.showSol && P.phase === 'set') { const [sx, sy] = cellXY(P.ship.x, P.ship.y); ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, sy); if (T.legs) { let x = P.ship.x, y = P.ship.y; for (const [h, n] of T.legs.slice(P.leg)) { x += HD[h][0] * n; y += HD[h][1] * n; ctx.lineTo(...cellXY(x, y)); } } else for (const [x, y] of route()) ctx.lineTo(...cellXY(x, y)); ctx.stroke(); ctx.restore(); }
      // the ship
      const [sx, sy] = [M.x + P.ship.fx * c + c / 2, M.y + P.ship.fy * c + c / 2];
      emoji(ctx, P.phase === 'dig' ? '⛏️' : '⛵', sx, sy + Math.sin(P.t * 3) * 2, c * 0.7, { flip: HD[P.head][0] < 0 });
      // heading arrow
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(P.head * Math.PI / 4); ctx.strokeStyle = '#ff6b4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -c * 0.42); ctx.lineTo(0, -c * (0.42 + 0.3 * P.dist)); ctx.stroke(); ctx.restore();
      if (T.key) this.drawKey(ctx, lay, T);
      this.drawControls(ctx, lay);
      fx.draw(ctx); pops.draw(ctx);
    },
    drawKey(ctx, lay, T) {
      const C = lay.ctrl, side = lay.side, w = side ? C.w - 10 : C.w * 0.44, h = 24 + T.key.length * 20, x = side ? C.x + 5 : C.x + C.w * 0.54, y = side ? C.y + 2 : C.y + 2;
      panel(ctx, { x, y, w, h }, { fill: '#fffaf0', stroke: '#c9a24a', r: 10 });
      text(ctx, '🗝️ MAP KEY', x + w / 2, y + 12, { size: 12, color: '#7a5a1c' });
      T.key.forEach((k, i) => { text(ctx, k.sym, x + 16, y + 32 + i * 20, { size: 16, color: k.col }); text(ctx, k.name, x + 32, y + 32 + i * 20, { size: 13, align: 'left' }); });
    },
    drawControls(ctx, lay) {
      const U = compassUI(), T = P.T;
      ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(U.cx, U.cy, U.r * 1.28, 0, 7); ctx.fill(); ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 4; ctx.stroke();
      const ok = i => !(T.axes === 'udlr' && i % 2) && !(i % 2 && T.lv < 9 && T.lv !== 10 && P.o.real < 9);
      for (const d of U.dirs) {
        if (!ok(d.i)) continue;
        const on = P.head === d.i; ctx.fillStyle = on ? '#e5484d' : '#2b2350'; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fill();
        text(ctx, T.axes === 'udlr' ? ['⬆', '', '➡', '', '⬇', '', '⬅', ''][d.i] : HS[d.i], d.x, d.y + 1, { size: d.r * (d.i % 2 ? 0.7 : 0.85), color: '#fff' });
      }
      ctx.save(); ctx.translate(U.cx, U.cy); ctx.rotate(P.head * Math.PI / 4); ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.moveTo(0, -U.r * 0.6); ctx.lineTo(U.r * 0.14, 0); ctx.lineTo(-U.r * 0.14, 0); ctx.fill(); ctx.fillStyle = '#2b2350'; ctx.beginPath(); ctx.moveTo(0, U.r * 0.6); ctx.lineTo(U.r * 0.14, 0); ctx.lineTo(-U.r * 0.14, 0); ctx.fill(); ctx.restore();
      button(ctx, U.minus, '−', { fill: '#fff' }); button(ctx, U.plus, '+');
      text(ctx, `${P.dist}`, U.num.x, U.num.y - 2, { size: 30 }); text(ctx, T.scale ? `squares (${P.dist * T.scale} mi)` : 'squares', U.num.x, U.num.y + 24, { size: 12, color: '#7a5a1c' });
      if (P.showSol && P.phase === 'set') { const want = T.legs && T.legs[P.leg] ? T.legs[P.leg] : null; if (want) { const d = U.dirs[want[0]]; if (P.head !== want[0]) hand(ctx, d.x, d.y, P.t, 30); else if (P.dist !== want[1]) hand(ctx, P.dist < want[1] ? U.plus.x + U.plus.w / 2 : U.minus.x + U.minus.w / 2, U.plus.y + U.plus.h / 2, P.t, 30); } }
    },
    _test: { step() {
      if (!P || !P.T) return 'none';
      if (P.phase !== 'set') return P.phase;
      const T = P.T;
      P.ship.x = T.target.x; P.ship.y = T.target.y; P.lastFrom = { x: 0, y: 0 }; endSail(); return 'sail';
    }, get P() { return P; } },
  };
}

startGame({
  mascot: '🦜',
  stick: false,
  story: (d, e) => (e >= 4 ? 'Captain, chart your course with compass headings, map scales, latitude & longitude and (x, y) grids to find the treasure.' : 'Ahoy, Captain! Point your ship with the compass, choose how far to sail, and find the treasure on every island chart.'),
  howTo: ['🧭 Tap the compass to point your ship.', '➖ ➕ Choose how many squares to sail.', '⛵ Press SAIL. Reach the ❌ and dig up the treasure!', '⛰️ Rocks and ⛈️ storms cost a heart. Storms move after every sail.'],
  together: { helps: [{ id: 'calm', icon: '🌤️', label: 'Calm the sea', cool: 30 }] },
  lessons: level => LESSONS[level] || [],
  realLife: realFrom(REAL['compass-cove']),
  create: createGame,
});

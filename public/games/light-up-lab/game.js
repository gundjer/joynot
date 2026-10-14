// Lumi's Light-Up Lab: the town went dark! Every job powers one more building and the town lights up window by window.
// Circuits first (turn wire tiles until the loop is closed, fill gaps with a conductor, flip switches, light two bulbs),
// then the town's power grows: protect an LED with a resistor, charge a capacitor for a blackout,
// put solar panels on the roof, place wind turbines on windy hills, and mix sun + wind for the whole grid.
// Levels (must match app/Games/LightUpLab.php):
// 1 What Is a Circuit? · 2 Turn the Corners · 3 Bigger Boards · 4 Conductors & Insulators · 5 Switches · 6 Two Bulbs
// 7 Resistors · 8 Capacitors · 9 Solar Power · 10 Wind Power · 11 Master Electrician
import { startGame, rand, pick, shuffle, clamp, emoji, roundRect, realFrom, playBox, Sfx } from '../_play/play.js';
import { LESSONS } from './science.js';
import { REAL } from '../_joy/js/reallife.js';
import { text, panel, button, hand, popups, particles, teach, taskLevel, inBox } from '../_play/kit.js';

// ---------------------------------------------------------------- circuit boards (random closed loops)
const N = 1, E = 2, S = 4, W = 8;
const DIRS = [[N, -1, 0, S], [E, 0, 1, W], [S, 1, 0, N], [W, 0, -1, E]];
const rot = (m, r = 1) => { for (let i = 0; i < ((r % 4) + 4) % 4; i++) m = ((m << 1) | (m >> 3)) & 15; return m; };
const STRAIGHT = new Set([N | S, E | W]);
const CONDUCT = [['🔑', 'metal key'], ['🥄', 'metal spoon'], ['📎', 'paper clip'], ['🔩', 'metal bolt']];
const INSUL = [['🎈', 'rubber balloon', 'rubber'], ['🖍️', 'wax crayon', 'wax'], ['🧶', 'ball of yarn', 'wool'], ['🥤', 'plastic cup', 'plastic'], ['🧽', 'sponge', 'sponge'], ['🍂', 'dry leaf', 'a leaf']];
const LV = [null,
  { r: 3, c: 3, faces: [1, 2], bulbs: 1, decoy: 0, wrong: 2 }, { r: 3, c: 4, faces: [2, 3], bulbs: 1, decoy: 0.2, wrong: 3 }, { r: 4, c: 4, faces: [3, 4], bulbs: 1, decoy: 0.3, wrong: 4 },
  { r: 4, c: 4, faces: [3, 5], bulbs: 1, decoy: 0.8, wrong: 5 }, { r: 4, c: 4, faces: [3, 5], bulbs: 1, decoy: 0.5, wrong: 4, gap: true }, { r: 5, c: 5, faces: [4, 7], bulbs: 1, decoy: 0.6, wrong: 6, sw: true },
  { r: 5, c: 5, faces: [5, 8], bulbs: 2, decoy: 0.6, wrong: 7 }, { r: 6, c: 6, faces: [6, 11], bulbs: 2, decoy: 0.7, wrong: 9, gap: true, sw: true }];
function boundary(faces, R, C) {
  const edges = new Map(), addE = (a, b) => { const k = a < b ? `${a}|${b}` : `${b}|${a}`; edges.set(k, (edges.get(k) || 0) + 1); }, id = (r, c) => r * C + c;
  faces.forEach(f => { const [r, c] = f.split(',').map(Number); addE(id(r, c), id(r, c + 1)); addE(id(r + 1, c), id(r + 1, c + 1)); addE(id(r, c), id(r + 1, c)); addE(id(r, c + 1), id(r + 1, c + 1)); });
  const deg = new Array(R * C).fill(0), masks = new Array(R * C).fill(0), bE = [];
  edges.forEach((n, k) => { if (n !== 1) return; const [a, b] = k.split('|').map(Number); bE.push([a, b]); deg[a]++; deg[b]++; });
  if (deg.some(d => d !== 0 && d !== 2)) return null;
  const adj = {}; bE.forEach(([a, b]) => { (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a); });
  const s0 = bE[0][0]; let prev = -1, cur = s0, steps = 0;
  do { const nx = adj[cur][0] === prev ? adj[cur][1] : adj[cur][0]; prev = cur; cur = nx; steps++; } while (cur !== s0 && steps < 999);
  if (steps !== bE.length) return null;
  bE.forEach(([a, b]) => { const ar = Math.floor(a / C), ac = a % C, br = Math.floor(b / C), bc = b % C; if (ar === br) { if (bc > ac) { masks[a] |= E; masks[b] |= W; } else { masks[a] |= W; masks[b] |= E; } } else if (br > ar) { masks[a] |= S; masks[b] |= N; } else { masks[a] |= N; masks[b] |= S; } });
  return masks;
}
function makeLoop(R, C, size) {
  for (let at = 0; at < 200; at++) {
    const faces = new Set([`${rand(0, R - 2)},${rand(0, C - 2)}`]); let tries = 0;
    while (faces.size < size && tries++ < 200) { const [fr, fc] = pick([...faces]).split(',').map(Number), [dr, dc] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), nr = fr + dr, nc = fc + dc; if (nr < 0 || nc < 0 || nr >= R - 1 || nc >= C - 1) continue; const k = `${nr},${nc}`; if (faces.has(k)) continue; faces.add(k); if (!boundary(faces, R, C)) faces.delete(k); }
    const m = boundary(faces, R, C); if (m) return m;
  }
  return null;
}
function buildBoard(level) {
  const L = LV[level];
  for (let at = 0; at < 60; at++) {
    const masks = makeLoop(L.r, L.c, rand(L.faces[0], L.faces[1])); if (!masks) continue;
    const loop = masks.map((m, i) => (m ? i : -1)).filter(i => i >= 0), straight = shuffle(loop.filter(i => STRAIGHT.has(masks[i])));
    if (straight.length < 1 + L.bulbs + (L.gap ? 1 : 0) + (L.sw ? 1 : 0)) continue;
    const C = L.c, dist = (a, b) => Math.abs(Math.floor(a / C) - Math.floor(b / C)) + Math.abs((a % C) - (b % C));
    const battery = straight[0], rest = straight.slice(1).sort((a, b) => dist(b, battery) - dist(a, battery)), bulbs = rest.splice(0, L.bulbs), others = shuffle(rest);
    const gap = L.gap ? others.pop() : -1, sw = L.sw ? others.pop() : -1;
    if ((L.gap && gap === undefined) || (L.sw && sw === undefined)) continue;
    const t = masks.map((m, i) => ({ i, base: m, rot: 0, onLoop: !!m, type: 'wire' }));
    t[battery].type = 'battery'; bulbs.forEach(b => (t[b].type = 'bulb'));
    if (gap >= 0) t[gap].type = 'gap';
    if (sw >= 0) { t[sw].type = 'switch'; t[sw].closed = false; }
    t.forEach(x => { if (x.onLoop) return; if (Math.random() < L.decoy) x.base = pick([N | S, N | E, N | E, N | S, N | E | S, N]); else x.type = 'empty'; });
    let wrong = 0;
    shuffle(t.filter(x => x.onLoop && x.type === 'wire')).forEach(x => { if (wrong < L.wrong) { const o = [1, 2, 3].filter(r => rot(x.base, r) !== x.base); if (o.length) { x.rot = pick(o); wrong++; } } });
    if (wrong < 2) continue;
    t.forEach(x => { if (!x.onLoop && x.type === 'wire') x.rot = rand(0, 3); });
    return { L, tiles: t, battery, bulbs, gap, sw, R: L.r, C: L.c };
  }
  return null;
}
const maskOf = t => (t.type === 'empty' ? 0 : rot(t.base, t.rot));
function power(p, filled) {
  const { tiles: T, R, C } = p, pass = t => t.type !== 'empty' && !(t.type === 'switch' && !t.closed) && !(t.type === 'gap' && !filled);
  const nb = (i, d) => { const r = Math.floor(i / C) + d[1], c = (i % C) + d[2]; return r < 0 || c < 0 || r >= R || c >= C ? -1 : r * C + c; };
  const linked = (i, d) => { const j = nb(i, d); if (j < 0) return -1; return (maskOf(T[i]) & d[0]) && (maskOf(T[j]) & d[3]) ? j : -1; };
  const lit = new Set([p.battery]), st = [p.battery];
  while (st.length) { const i = st.pop(); if (i !== p.battery && !pass(T[i])) continue; DIRS.forEach(d => { const j = linked(i, d); if (j >= 0 && !lit.has(j)) { lit.add(j); st.push(j); } }); }
  const sides = DIRS.filter(d => maskOf(T[p.battery]) & d[0]); let solved = false;
  const j0 = sides.length === 2 ? linked(p.battery, sides[0]) : -1;
  if (j0 >= 0) { const seen = new Set([p.battery]); const dfs = i => { if (solved || !pass(T[i])) return; seen.add(i); for (const d of DIRS) { const j = linked(i, d); if (j < 0) continue; if (j === p.battery && d[3] === sides[1][0] && i !== j0) { if (p.bulbs.every(b => seen.has(b))) { solved = true; return; } continue; } if (!seen.has(j)) dfs(j); } seen.delete(i); }; dfs(j0); }
  return { lit, solved };
}


// game level → kind (circuit levels map onto LV boards)
const KIND = { 1: 1, 2: 2, 3: 3, 4: 5, 5: 6, 6: 7, 7: 'resistor', 8: 'capacitor', 9: 'solar', 10: 'wind', 11: 'master' };
const TOWN = ['🏠', '🏡', '🏫', '🏪', '🏥', '🏠', '🏢', '🏡', '🏨', '🏠', '🏬', '🏡'];
const RES = [0, 10, 47, 100, 220, 330, 470, 1000, 4700, 10000, 100000];
const fmtOhm = r => (r >= 1000 ? `${r / 1000}k Ω` : `${r} Ω`);

function makeTask(lv, P) {
  const k = KIND[lv];
  const T = { lv, k: typeof k === 'number' || (k === 'master' && Math.random() < 0.5) ? 'circuit' : k };
  if (T.k === 'circuit') {
    const lvl = typeof k === 'number' ? k : 8; T.board = buildBoard(lvl);
    if (T.board.gap >= 0) T.mats = shuffle([...shuffle(CONDUCT).slice(0, 1).map(m => ({ e: m[0], n: m[1], ok: true })), ...shuffle(INSUL).slice(0, 2).map(m => ({ e: m[0], n: m[1], stuff: m[2], ok: false }))]);
    T.filled = null;
    T.ask = T.board.gap >= 0 ? 'Turn the wires to make one loop, and fill the ❓ gap with something electricity can flow through.' : T.board.sw >= 0 ? 'Turn the wires to make one loop, then switch the switch ON.' : T.board.bulbs.length > 1 ? 'Light BOTH bulbs with one big loop. Tap wires to turn them.' : 'Tap the wires to turn them. Make one loop from the battery, through the bulb, and back.';
  }
  if (T.k === 'resistor') {
    if (P.o.edition >= 4 && Math.random() < 0.6) { const amps = rand(1, 4), ohms = rand(2, 6); T.ohm = { V: amps * ohms, A: amps, R: ohms }; T.r = 1; T.ask = `Ohm’s law! Make exactly ${amps} amps flow from a ${amps * ohms}-volt battery. Set the resistor (Amps = Volts ÷ Ohms).`; }
    else { T.V = pick([3, 9]); T.ri = 0; T.ask = `A tiny LED needs protection! With a ${T.V}-volt battery, pick a resistor so the LED glows safely: not burned out, not too dim.`; }
  }
  if (T.k === 'capacitor') { T.need = rand(3, 7); T.rate = T.need + 2; T.charge = 0; T.ask = `A ${T.need}-second blackout is coming! Hold ⚡ Charge to fill the capacitor so the streetlight stays on. Don’t go past its ${T.rate}-unit limit!`; }
  if (T.k === 'solar') { const W = pick([20, 30, 40, 50]), sky = pick([['☀️', 'a sunny noon', 1], ['🌤️', 'the morning', 0.5], ['⛅', 'a cloudy day', 0.5]]), n = rand(2, 5), per = W * sky[2]; T.W = W; T.sky = sky; T.D = per * n; T.min = n; T.on = Array(6).fill(false); T.ask = `It’s ${sky[1]}. Each panel makes ${W} watts in full sun${sky[2] < 1 ? ', but only HALF now' : ''}. The ${pick(['school', 'shop', 'library'])} needs ${T.D} watts. Use as few panels as you can!`; }
  if (T.k === 'wind') { const p = pick([2, 3, 4]), n = rand(2, 3); T.p = p; T.H = p * n; T.max = n; T.spots = shuffle([1, 1, 1, 0, 0, 0]).map(w => ({ w, t: false })); T.ask = `Each turbine powers ${p} homes on a WINDY hill, but only ${p / 2 === Math.floor(p / 2) ? p / 2 : 1} in a calm valley. Power ${T.H} homes with only ${n} turbines!`; T.calm = p / 2 === Math.floor(p / 2) ? p / 2 : 1; }
  if (T.k === 'master') { const a = rand(1, 4), b = rand(1, 5); T.D = a * 100 + b * 30; T.sol = { a, b }; T.a = 0; T.b = 0; T.ask = `Power the whole grid: exactly ${T.D} watts. Each 💨 turbine makes 100 watts. Each ☀️ panel makes 30 watts.`; }
  return T;
}

function createGame(api) {
  let P = null;
  const pops = popups(), fx = particles();

  function start(o) {
    P = { o, t: 0, n: o.boss ? 5 : o.edition <= 1 ? 3 : 4, done: 0, guidedDone: !!o.boss, phase: 'wait', lit: 0 };
    api.score('💡 0'); api.progress(0, 'Buildings lit');
    api.goal('🌃 The town went dark! Every job you finish lights up a building.', { speak: true });
    setTimeout(() => P && nextTask(), 1200);
  }
  function nextTask() {
    if (P.done >= P.n) { P.phase = 'over'; api.finish({ win: true, title: '🌃 The town is shining!', text: `You lit up ${P.done} buildings.` }); return; }
    const lv = taskLevel(api, P.o), T = makeTask(lv, P), guided = !P.guidedDone;
    P.T = T; P.phase = 'work'; P.anim = null; P.showSol = guided ? 1 : 0; P.guided = guided; P.hold = false;
    P.teach = teach(api, { level: lv, guided, prompt: T.ask, expected: T.k });
    api.actions([{ key: 'help', label: '💡 Help' }, { key: 'check', label: T.k === 'circuit' ? '⚡ Power on' : T.k === 'capacitor' ? '🌑 Blackout!' : '⚡ Test', big: true }]);
    api.goal(`🔌 ${T.ask}`, { speak: false }); api.speak((guided ? "Let's do this one together. " : '') + T.ask);
  }

  // ------------------------------------------------ judging
  function judge() {
    const T = P.T;
    if (T.k === 'circuit') {
      const B = T.board, st = power(B, T.filled && T.filled.ok);
      if (st.solved) return { ok: true, lit: st.lit };
      if (B.gap >= 0 && !T.filled) return { ok: false, lit: st.lit, why: 'The ❓ gap is empty, so the loop is open. Fill it with something electricity can flow through.', hint: 'Which one is made of metal?' };
      if (B.gap >= 0 && !T.filled.ok) return { ok: false, lit: st.lit, bad: 'mat', why: `A ${T.filled.n} is made of ${T.filled.stuff}. That’s an INSULATOR: electricity can’t flow through it. Try metal!`, hint: 'Metal is a conductor. Rubber, plastic, wax and wool are insulators.' };
      if (B.sw >= 0 && !B.tiles[B.sw].closed) { const loopOk = B.tiles.every(t => !t.onLoop || t.type !== 'wire' || maskOf(t) === t.base); if (loopOk) return { ok: false, lit: st.lit, why: 'The switch is OFF. Off means the loop is open. Tap the switch to turn it ON.', hint: 'Look at the switch.' }; }
      return { ok: false, lit: st.lit, why: 'The loop is still broken. Follow the glow from the battery. Where it stops, turn the next wire.', hint: 'Start at the battery and follow the wire.' };
    }
    if (T.k === 'resistor') {
      if (T.ohm) { const amps = T.ohm.V / T.r; return { ok: T.r === T.ohm.R, amps, why: `${T.ohm.V} volts ÷ ${T.r} ohms = ${Math.round(amps * 100) / 100} amps. ${amps > T.ohm.A ? 'Too much! More ohms = less current.' : 'Too little! Fewer ohms = more current.'}`, hint: `Amps = Volts ÷ Ohms. ${T.ohm.V} ÷ ? = ${T.ohm.A}` }; }
      const R = RES[T.ri], mA = R ? (T.V / R) * 1000 : Infinity;
      return { ok: mA >= 5 && mA <= 25, mA, burn: mA > 25, why: mA > 25 ? (R ? `Too much current (${Math.round(mA)} mA): the LED burned out! Use MORE resistance.` : 'No resistor: way too much current rushed through and the LED burned out!') : `Only ${Math.round(mA * 10) / 10} mA got through, so the LED is too dim. Use LESS resistance.`, hint: 'More resistance = less current. Find the middle!' };
    }
    if (T.k === 'capacitor') { if (!T.charge) return { none: 'Hold the ⚡ Charge button first to fill the capacitor.' }; const c = Math.round(T.charge); return { ok: c >= T.need && T.charge <= T.rate + 0.01, pop: T.charge > T.rate + 0.01, why: T.charge > T.rate + 0.01 ? `Pop! You charged past the ${T.rate}-unit limit. Capacitors have a safe limit.` : `The light only lasted ${c} seconds. The blackout was ${T.need} seconds. Charge it more!`, hint: `The light uses 1 unit each second. ${T.need} seconds needs ${T.need} units.` }; }
    if (T.k === 'solar') { const n = T.on.filter(Boolean).length, w = n * T.W * T.sky[2]; if (!n) return { none: 'Tap the roof to put solar panels on it.' }; return { ok: w >= T.D && n === T.min, w, why: w < T.D ? `${n} panel${n > 1 ? 's' : ''} make${n > 1 ? '' : 's'} ${w} watts. That’s not enough for ${T.D} watts. Add panels!` : `${n} panels make ${w} watts. It works, but you used too many. Panels cost money. Use fewer!`, hint: `Each panel makes ${T.W * T.sky[2]} watts right now. How many make ${T.D}?` }; }
    if (T.k === 'wind') { const used = T.spots.filter(s => s.t), homes = used.reduce((a, s) => a + (s.w ? T.p : T.calm), 0); if (!used.length) return { none: 'Drag turbines onto the map first.' }; return { ok: homes >= T.H, homes, why: homes < T.H ? `Only ${homes} homes got power. Turbines on windy hills (💨💨💨) make more electricity!` : '', hint: 'Look for the windy spots with lots of 💨.' }; }
    if (T.k === 'master') { const w = T.a * 100 + T.b * 30; if (!w) return { none: 'Add turbines and panels first.' }; return { ok: w === T.D, w, why: `That makes ${w} watts. You need exactly ${T.D}. ${w > T.D ? 'Too much!' : 'Not enough!'}`, hint: `Try turbines first: how many hundreds fit? Then fill the rest with 30s.` }; }
    return { ok: false };
  }
  function check() { const r = judge(); if (r.none) { api.speak(r.none, { force: true }); return; } P.phase = 'anim'; P.anim = { t: 0, r }; Sfx.zap(); }
  function after() {
    const r = P.anim.r, T = P.T; P.anim = null;
    if (r.ok) return solved();
    P.phase = 'work'; Sfx.wrong();
    if (T.k === 'capacitor') T.charge = 0;
    if (r.bad === 'mat') { T.filled.used = true; T.filled = null; }
    const n = P.teach.miss();
    if (n >= 3) { P.teach.done(false, T.k); api.speak(`Watch Lumi do it. ${r.why}`, { force: true }); solveTask(T); P.phase = 'auto'; if (!api.loseHeart('Lumi fixed that one for you.')) setTimeout(() => { if (P && P.T === T) { P.phase = 'anim'; P.anim = { t: 0, r: judge(), win: true }; } }, 1600); return; }
    if (n === 2) { P.teach.help(); P.showSol = 1; }
    api.speak(n === 1 && r.hint ? `${r.why} ${r.hint}` : r.why, { force: true });
  }
  function solveTask(T) {
    if (T.k === 'circuit') { const B = T.board; B.tiles.forEach(x => { if (x.onLoop && x.type === 'wire') x.rot = 0; if (x.type === 'switch') x.closed = true; }); if (T.mats) T.filled = T.mats.find(m => m.ok); }
    if (T.k === 'resistor') { if (T.ohm) T.r = T.ohm.R; else T.ri = RES.findIndex(R => R && (T.V / R) * 1000 >= 5 && (T.V / R) * 1000 <= 25); }
    if (T.k === 'capacitor') T.charge = T.need + 0.5;
    if (T.k === 'solar') T.on = T.on.map((_, i) => i < T.min);
    if (T.k === 'wind') { T.spots.forEach(s => { s.t = false; }); T.spots.filter(s => s.w).slice(0, T.max).forEach(s => { s.t = true; }); }
    if (T.k === 'master') { T.a = T.sol.a; T.b = T.sol.b; }
  }
  function solved() {
    const r = P.teach.done(true, P.T.k); if (r.levelUp) api.chime('⭐ <b>Level up!</b> The town’s power grid grows!', '💡');
    Sfx.win(); P.lit++; P.done++; P.guidedDone = true; api.score(`💡 ${P.done}`); api.progress(P.done / P.n, 'Buildings lit');
    api.speak(pick(['Lights on! Another building is glowing!', 'Power is flowing! Look at the town!', 'Zap! It works!']));
    P.phase = 'cheer'; P.cheerT = 0; api.actions([]);
    setTimeout(() => P && nextTask(), 2400);
  }

  // ------------------------------------------------ layout
  const L = () => { const b = playBox(api.W, api.H), short = api.H <= 500; return { b, short }; };
  function work() {
    const { b, short } = L(), T = P.T, side = T.k === 'circuit' && T.mats || T.k === 'wind';
    if (!side) return { area: { x: b.x + 8, y: b.y + 8, w: b.w - 16, h: b.h - 16 }, tray: null };
    if (short) return { area: { x: b.x + 8, y: b.y + 8, w: b.w * 0.74 - 12, h: b.h - 16 }, tray: { x: b.x + b.w * 0.74, y: b.y + 8, w: b.w * 0.26 - 8, h: b.h - 16 } };
    const th = Math.min(110, b.h * 0.18); return { area: { x: b.x + 8, y: b.y + 8, w: b.w - 16, h: b.h - th - 24 }, tray: { x: b.x + 8, y: b.y + b.h - th - 8, w: b.w - 16, h: th } };
  }
  function grid() { const A = work().area, B = P.T.board, cs = Math.min((A.w - 20) / B.C, (A.h - 20) / B.R, 92), gx = A.x + (A.w - cs * B.C) / 2, gy = A.y + (A.h - cs * B.R) / 2; return { cs, gx, gy, rect: i => ({ x: gx + (i % B.C) * cs, y: gy + Math.floor(i / B.C) * cs, w: cs, h: cs }) }; }
  function trayItems() {
    const W = work(), T = P.T, R = W.tray; if (!R) return [];
    const list = T.k === 'wind' ? Array.from({ length: T.max - T.spots.filter(s => s.t).length }, (_, i) => ({ e: '🌬️', n: 'turbine', i })) : T.mats;
    const short = L().short, n = T.k === 'wind' ? T.max : list.length;
    return list.map((m, i) => short ? { m, x: R.x + 4, y: R.y + 4 + i * ((R.h - 8) / n), w: R.w - 8, h: (R.h - 8) / n - 4 } : { m, x: R.x + 4 + i * ((R.w - 8) / n), y: R.y + 4, w: (R.w - 8) / n - 4, h: R.h - 8 });
  }
  const minusPlus = (cx, cy, s) => ({ minus: { x: cx - s * 1.9, y: cy - s / 2, w: s, h: s }, plus: { x: cx + s * 0.9, y: cy - s / 2, w: s, h: s } });
  function ctrls() {
    const A = work().area, T = P.T, s = Math.min(58, A.h * 0.16);
    if (T.k === 'resistor') return { r: minusPlus(A.x + A.w / 2, A.y + A.h * 0.8, s) };
    if (T.k === 'master') return { a: minusPlus(A.x + A.w * 0.28, A.y + A.h * 0.78, s), b: minusPlus(A.x + A.w * 0.72, A.y + A.h * 0.78, s) };
    if (T.k === 'capacitor') { const w = Math.min(220, A.w * 0.4), h = Math.min(70, A.h * 0.2); return { charge: { x: A.x + A.w * 0.3 - w / 2, y: A.y + A.h * 0.78 - h / 2, w, h } }; }
    if (T.k === 'solar') { const rw = Math.min(A.w * 0.5, 360), x0 = A.x + A.w * 0.08, y0 = A.y + A.h * 0.42, pw = rw / 3; return { roof: T.on.map((_, i) => ({ i, x: x0 + (i % 3) * pw + 3, y: y0 + Math.floor(i / 3) * Math.min(pw * 0.55, A.h * 0.18) + 3, w: pw - 6, h: Math.min(pw * 0.55, A.h * 0.18) - 6 })) }; }
    if (T.k === 'wind') { return { spots: T.spots.map((s, i) => { const col = i % 3, row = Math.floor(i / 3), w = A.w / 3, h = A.h / 2; return { s, i, x: A.x + col * w + 6, y: A.y + row * h + 6, w: w - 12, h: h - 12 }; }) }; }
    return {};
  }

  return {
    start(o) { start(o); },
    checkpoint() { if (P && P.T && P.phase === 'anim') { P.phase = 'work'; P.anim = null; } },
    stop() { P = null; },
    update(dt) {
      if (!P) return; P.t += dt; pops.update(dt); fx.update(dt);
      const T = P.T;
      if (P.phase === 'work') {
        if (api.input.pressed('check')) check(); if (api.input.pressed('help')) this.hint();
        if (T.k === 'capacitor' && (P.hold || api.input.held('action'))) { T.charge = Math.min(T.rate + 1.5, T.charge + dt * 1.6); if (Math.floor(T.charge * 2) !== Math.floor((T.charge - dt * 1.6) * 2)) Sfx.tick(); }
      }
      if (P.phase === 'anim') { P.anim.t += dt; const dur = T.k === 'capacitor' ? Math.max(2.4, T.need * 0.5 + 1) : 2.2; if (P.anim.t > dur) { if (P.anim.win) { P.anim = null; solved(); } else after(); } }
      if (P.phase === 'cheer') P.cheerT += dt;
    },
    hint() {
      if (!P || !P.T || P.phase !== 'work') return false;
      P.teach.help(); P.showSol = 1; const r = judge();
      api.speak(r.hint || (r.ok ? 'It looks ready. Press the big button to test it!' : r.why || 'Try it and see!'), { force: true });
      return true;
    },
    coach() { if (!P || !P.T) return ''; const T = P.T; return { circuit: 'Make one loop: battery → bulb(s) → back.', resistor: T.ohm ? `Answer: ${T.ohm.R} ohms` : 'Middle resistance: 5–25 mA.', capacitor: `Charge to ${T.need}, under ${T.rate}.`, solar: `${T.min} panels`, wind: 'Use the windy hills.', master: T.sol ? `${T.sol.a} turbines + ${T.sol.b} panels` : '' }[T.k] || ''; },
    onHelp(id) { if (!P || !P.T || P.phase !== 'work') return ''; if (id === 'spark') { const T = P.T; if (T.k === 'circuit') { const bad = T.board.tiles.filter(t => t.onLoop && t.type === 'wire' && maskOf(t) !== t.base); if (bad.length) { pick(bad).rot = 0; Sfx.zap(); P.teach.help(); return 'fixed a wire!'; } } P.showSol = 1; P.teach.help(); return 'showed the way!'; } return ''; },
    screen() { if (!P || !P.T) return ''; return `Job: ${P.T.ask}`; },
    onTap(x, y) {
      if (!P || !P.T || P.phase !== 'work') return;
      const T = P.T;
      if (T.k === 'circuit') {
        const it = trayItems().find(q => inBox(x, y, q)); if (it) { if (it.m.used) { api.speak(`${it.m.n}: that one didn't work.`); return; } T.filled = it.m; Sfx.pop(); api.speak(it.m.n); this.auto(); return; }
        const G = grid(), B = T.board, i = B.tiles.findIndex((t, k) => inBox(x, y, G.rect(k))); if (i < 0) return;
        const t = B.tiles[i]; if (t.type === 'wire' && t.base) { t.rot = (t.rot + 1) % 4; Sfx.click(); } else if (t.type === 'switch') { t.closed = !t.closed; Sfx.pop(); api.speak(t.closed ? 'on' : 'off'); } else if (t.type === 'gap' && T.filled) { T.filled = null; Sfx.click(); }
        this.auto(); return;
      }
      const C = ctrls();
      if (T.k === 'resistor') { const d = inBox(x, y, C.r.plus) ? 1 : inBox(x, y, C.r.minus) ? -1 : 0; if (!d) return; if (T.ohm) { T.r = clamp(T.r + d, 1, 12); api.speak(`${T.r} ohms`); } else { T.ri = clamp(T.ri + d, 0, RES.length - 1); api.speak(RES[T.ri] ? fmtOhm(RES[T.ri]).replace('Ω', 'ohms').replace('k ', ' thousand ') : 'no resistor'); } Sfx.click(); return; }
      if (T.k === 'master') { for (const key of ['a', 'b']) { const d = inBox(x, y, C[key].plus) ? 1 : inBox(x, y, C[key].minus) ? -1 : 0; if (d) { T[key] = clamp(T[key] + d, 0, 9); Sfx.click(); api.speak(`${T.a * 100 + T.b * 30} watts`); } } return; }
      if (T.k === 'capacitor') { if (inBox(x, y, C.charge)) P.hold = true; return; }
      if (T.k === 'solar') { const s = C.roof.find(q => inBox(x, y, q)); if (s) { T.on[s.i] = !T.on[s.i]; Sfx.click(); const n = T.on.filter(Boolean).length; api.speak(`${n} panel${n === 1 ? '' : 's'}`); } return; }
      if (T.k === 'wind') { const it = trayItems().find(q => inBox(x, y, q)); if (it) { P.drag = { x, y }; return; } const s = C.spots.find(q => inBox(x, y, q)); if (s && s.s.t) { s.s.t = false; Sfx.click(); } }
    },
    onMove(x, y) { if (P && P.drag) { P.drag.x = x; P.drag.y = y; } },
    onUp(x, y) {
      if (!P || !P.T) return; P.hold = false;
      if (P.drag) { P.drag = null; const s = ctrls().spots.find(q => inBox(x, y, q)); if (s && !s.s.t) { s.s.t = true; Sfx.click(); api.speak(s.s.w ? 'windy hill' : 'calm valley'); } }
    },
    auto() { const T = P.T; if (T.k === 'circuit' && power(T.board, T.filled && T.filled.ok).solved) { P.phase = 'anim'; P.anim = { t: 1, r: judge() }; Sfx.zap(); } },
    draw(ctx, W, H, onTitle) {
      ctx.fillStyle = '#0d1230'; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect((i * 97) % W, (i * 53) % (H * 0.5), 2, 2); }
      this.drawTown(ctx, W, H);
      if (onTitle || !P || !P.T || P.phase === 'cheer' || P.phase === 'over') { if (onTitle || !P) emoji(ctx, '💡', W / 2, H * 0.35, 80); fx.draw(ctx); pops.draw(ctx); return; }
      const { b } = L(); panel(ctx, { x: b.x, y: b.y, w: b.w, h: b.h }, { fill: 'rgba(22,28,60,.94)', r: 16 });
      const T = P.T;
      ({ circuit: this.drawCircuit, resistor: this.drawResistor, capacitor: this.drawCap, solar: this.drawSolar, wind: this.drawWind, master: this.drawMaster })[T.k].call(this, ctx);
      if (P.anim && P.anim.t > 1.4 && T.k !== 'circuit') text(ctx, P.anim.r.ok ? '✅ It works!' : '❌ Not yet…', b.x + b.w / 2, b.y + 24, { size: 22, color: P.anim.r.ok ? '#7be07b' : '#ff8a7a' });
      fx.draw(ctx); pops.draw(ctx);
    },
    drawTown(ctx, W, H) {
      const n = TOWN.length, w = W / n, gy = H - 6; ctx.fillStyle = '#1b1f3d'; ctx.fillRect(0, gy - 4, W, 10);
      const lit = P ? P.lit : 0, glowNew = P && P.phase === 'cheer' ? Math.min(1, P.cheerT / 0.8) : 1;
      for (let i = 0; i < n; i++) {
        const on = i < lit, x = w * (i + 0.5), s = Math.min(w * 0.9, 60);
        if (on) { const a = i === lit - 1 ? glowNew : 1; ctx.save(); ctx.globalAlpha = 0.5 * a; ctx.fillStyle = '#ffe680'; ctx.beginPath(); ctx.arc(x, gy - s * 0.45, s * 0.7, 0, 7); ctx.fill(); ctx.restore(); }
        emoji(ctx, TOWN[i], x, gy - s * 0.45, s, { alpha: on ? 1 : 0.28 });
      }
      if (P && P.phase === 'cheer') text(ctx, '💡 Lights on!', W / 2, H * 0.4, { size: 34, color: '#ffe680' });
    },
    drawCircuit(ctx) {
      const T = P.T, B = T.board, G = grid(), cs = G.cs, A = P.anim, glow = api.settings.glow !== 'off';
      const st = power(B, T.filled && T.filled.ok), solved = st.solved, flow = A ? A.r.lit : glow ? st.lit : new Set();
      ctx.fillStyle = '#141a33'; roundRect(ctx, G.gx - 6, G.gy - 6, cs * B.C + 12, cs * B.R + 12, 14); ctx.fill();
      B.tiles.forEach((t, i) => {
        const r = G.rect(i), on = (solved || (flow && flow.has(i))) && t.type !== 'empty';
        ctx.fillStyle = t.type === 'empty' ? '#1b2245' : '#232c58'; roundRect(ctx, r.x + 2, r.y + 2, cs - 4, cs - 4, 10); ctx.fill();
        if (t.type === 'empty') return;
        const m = maskOf(t), cx = r.x + cs / 2, cy = r.y + cs / 2; ctx.lineCap = 'round';
        [[N, 0, -1], [E, 1, 0], [S, 0, 1], [W, -1, 0]].forEach(([bit, dx, dy]) => { if (!(m & bit)) return; ctx.strokeStyle = '#0b0f22'; ctx.lineWidth = cs * 0.26; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + dx * cs / 2, cy + dy * cs / 2); ctx.stroke(); ctx.strokeStyle = on ? '#ffd23a' : '#8aa0d8'; ctx.lineWidth = cs * 0.14; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + dx * cs / 2, cy + dy * cs / 2); ctx.stroke(); });
        if (t.type === 'wire') { ctx.fillStyle = on ? '#ffd23a' : '#8aa0d8'; ctx.beginPath(); ctx.arc(cx, cy, cs * 0.09, 0, 7); ctx.fill(); }
        if (t.type === 'battery') emoji(ctx, '🔋', cx, cy, cs * 0.55);
        if (t.type === 'bulb') { if (solved) { ctx.fillStyle = 'rgba(255,230,90,.45)'; ctx.beginPath(); ctx.arc(cx, cy, cs * 0.48, 0, 7); ctx.fill(); } emoji(ctx, '💡', cx, cy, cs * 0.55, { alpha: solved ? 1 : 0.45 }); }
        if (t.type === 'switch') { ctx.fillStyle = '#ddd'; roundRect(ctx, cx - cs * 0.3, cy - cs * 0.12, cs * 0.6, cs * 0.24, 6); ctx.fill(); ctx.save(); ctx.translate(cx - cs * 0.22, cy); ctx.rotate(t.closed ? 0 : -0.7); ctx.fillStyle = t.closed ? '#2f9e44' : '#e5484d'; ctx.fillRect(0, -4, cs * 0.44, 8); ctx.restore(); text(ctx, t.closed ? 'ON' : 'OFF', cx, cy + cs * 0.32, { size: Math.max(9, cs * 0.14), color: t.closed ? '#7be07b' : '#ff8a7a' }); }
        if (t.type === 'gap') { ctx.fillStyle = '#fff'; roundRect(ctx, cx - cs * 0.26, cy - cs * 0.26, cs * 0.52, cs * 0.52, 8); ctx.fill(); if (T.filled) emoji(ctx, T.filled.e, cx, cy, cs * 0.4); else text(ctx, '❓', cx, cy, { size: cs * 0.3 }); }
      });
      const W2 = work();
      if (W2.tray) { panel(ctx, W2.tray, { fill: '#2a3466', r: 12, shadow: false }); for (const q of trayItems()) { panel(ctx, q, { fill: q.m.used ? '#555' : T.filled === q.m ? '#ffe680' : '#fff', r: 10, shadow: false }); emoji(ctx, q.m.e, q.x + q.w / 2, q.y + q.h * 0.4, Math.min(34, q.h * 0.45), { alpha: q.m.used ? 0.4 : 1 }); text(ctx, q.m.n, q.x + q.w / 2, q.y + q.h - 10, { size: 11, max: q.w - 4 }); } }
      if (P.showSol && !A) {
        const bad = B.tiles.findIndex(t => t.onLoop && t.type === 'wire' && maskOf(t) !== t.base);
        if (bad >= 0) { const r = G.rect(bad); hand(ctx, r.x + cs / 2, r.y + cs / 2, P.t, Math.min(34, cs * 0.6)); }
        else if (B.gap >= 0 && !(T.filled && T.filled.ok)) { const q = trayItems().find(q => q.m.ok); if (q) hand(ctx, q.x + q.w / 2, q.y + q.h / 2, P.t, 30); }
        else if (B.sw >= 0 && !B.tiles[B.sw].closed) { const r = G.rect(B.sw); hand(ctx, r.x + cs / 2, r.y + cs / 2, P.t, Math.min(34, cs * 0.6)); }
      }
      if (A && A.t > 1.2) text(ctx, A.r.ok ? '✅ Lights on!' : '❌ The loop is open…', W2.area.x + W2.area.w / 2, W2.area.y + 14, { size: 18, color: A.r.ok ? '#7be07b' : '#ff8a7a' });
    },
    drawResistor(ctx) {
      const T = P.T, A2 = work().area, C = ctrls(), An = P.anim, cy = A2.y + A2.h * 0.42, x0 = A2.x + A2.w * 0.15, x1 = A2.x + A2.w * 0.85;
      ctx.strokeStyle = '#8aa0d8'; ctx.lineWidth = 6; roundRect(ctx, x0, cy - A2.h * 0.18, x1 - x0, A2.h * 0.36, 12); ctx.stroke();
      emoji(ctx, '🔋', x0, cy, 44); text(ctx, `${T.ohm ? T.ohm.V : T.V} V`, x0, cy + 32, { size: 14, color: '#fff' });
      const rx = (x0 + x1) / 2, ry = cy - A2.h * 0.18; ctx.fillStyle = '#d9b382'; roundRect(ctx, rx - 40, ry - 14, 80, 28, 10); ctx.fill(); ['#a0522d', '#000', '#e5484d'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(rx - 22 + i * 16, ry - 14, 7, 28); });
      const label = T.ohm ? `${T.r} Ω` : RES[T.ri] ? fmtOhm(RES[T.ri]) : 'no resistor';
      text(ctx, label, rx, ry - 30, { size: 18, color: '#ffe680' });
      const res = An ? An.r : null, ok = res && res.ok, burn = res && (res.burn || (T.ohm && res.amps > T.ohm.A)), t = An ? An.t : 0;
      const lx = x1, ly = cy; if (An && t > 0.6) { if (burn && !T.ohm) { emoji(ctx, '💥', lx, ly, 46); } else { const glow = T.ohm ? (ok ? 1 : 0.4) : res.ok ? 1 : 0.15; ctx.fillStyle = `rgba(255,90,90,${0.5 * glow})`; ctx.beginPath(); ctx.arc(lx, ly, 34, 0, 7); ctx.fill(); emoji(ctx, '🔴', lx, ly, 30); } } else emoji(ctx, '🔴', lx, ly, 30, { alpha: 0.5 });
      text(ctx, T.ohm ? 'motor' : 'LED', lx, ly + 32, { size: 13, color: '#fff' });
      if (An && t > 0.6) text(ctx, T.ohm ? `⚡ ${Math.round(res.amps * 100) / 100} amps` : `⚡ ${res.mA === Infinity ? 'way too much!' : Math.round(res.mA * 10) / 10 + ' mA'}`, rx, cy + A2.h * 0.18 + 26, { size: 16, color: '#fff' });
      button(ctx, C.r.minus, '−', { fill: '#fff' }); button(ctx, C.r.plus, '+'); text(ctx, T.ohm ? 'ohms' : 'resistance', (C.r.minus.x + C.r.plus.x + C.r.plus.w) / 2, C.r.minus.y + C.r.minus.h / 2, { size: 14, color: '#fff' });
      if (P.showSol && !An) { const t2 = { ...T }; solveTask(t2); const cur = T.ohm ? T.r : T.ri, want = T.ohm ? t2.r : t2.ri; if (cur !== want) { const q = want > cur ? C.r.plus : C.r.minus; hand(ctx, q.x + q.w / 2, q.y + q.h / 2, P.t, 28); } }
    },
    drawCap(ctx) {
      const T = P.T, A2 = work().area, C = ctrls(), An = P.anim, cx = A2.x + A2.w * 0.3, top = A2.y + 30, h = A2.h * 0.5, w = Math.min(70, A2.w * 0.12);
      ctx.fillStyle = '#2a3466'; roundRect(ctx, cx - w / 2, top, w, h, 10); ctx.fill();
      const max = T.rate + 1.5, used = An ? Math.min(T.charge, (An.t / 0.5)) : 0, lvl = Math.max(0, T.charge - used);
      ctx.fillStyle = T.charge > T.rate ? '#ff6b4a' : '#3dc2ff'; const fh = h * lvl / max; roundRect(ctx, cx - w / 2 + 4, top + h - fh, w - 8, Math.max(0, fh - 2), 8); ctx.fill();
      const ly = top + h - h * T.rate / max; ctx.strokeStyle = '#ff6b4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - w, ly); ctx.lineTo(cx + w, ly); ctx.stroke(); text(ctx, `limit ${T.rate}`, cx + w + 6, ly, { size: 12, color: '#ff8a7a', align: 'left' });
      const ny = top + h - h * T.need / max; ctx.strokeStyle = '#7be07b'; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(cx - w, ny); ctx.lineTo(cx + w, ny); ctx.stroke(); ctx.setLineDash([]); text(ctx, `need ${T.need}`, cx + w + 6, ny, { size: 12, color: '#7be07b', align: 'left' });
      text(ctx, `⚡ ${Math.floor(T.charge)} units`, cx, top - 14, { size: 15, color: '#fff' });
      for (let i = 0; i <= Math.floor(max); i++) { const y = top + h - h * i / max; ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(cx - w / 2 - 6, y - 1, 6, 2); }
      const lx = A2.x + A2.w * 0.72, lyy = A2.y + A2.h * 0.5, on = !An || lvl > 0.05 && !(An.r.pop && An.t > 0.3);
      ctx.fillStyle = '#555'; ctx.fillRect(lx - 3, lyy - 40, 6, 110); if (on) { ctx.fillStyle = An ? `rgba(255,230,90,${0.25 + 0.4 * Math.min(1, lvl / 2)})` : 'rgba(255,230,90,.5)'; ctx.beginPath(); ctx.moveTo(lx, lyy - 40); ctx.lineTo(lx - 50, lyy + 70); ctx.lineTo(lx + 50, lyy + 70); ctx.closePath(); ctx.fill(); }
      emoji(ctx, '💡', lx, lyy - 46, 34, { alpha: on ? 1 : 0.35 });
      if (An) { text(ctx, `🌑 blackout: ${Math.min(T.need, Math.floor(An.t / 0.5))} s of ${T.need}`, lx, A2.y + 20, { size: 15, color: '#fff' }); if (An.r.pop && An.t > 0.3) emoji(ctx, '💥', cx, top + h / 2, 56); }
      const held = P.hold || api.input.held('action'); button(ctx, C.charge, '⚡ Hold', { fill: held ? '#ffe680' : '#ffc93c' });
      if (P.showSol && !An && T.charge < T.need) hand(ctx, C.charge.x + C.charge.w / 2, C.charge.y + C.charge.h / 2, P.t, 30);
    },
    drawSolar(ctx) {
      const T = P.T, A2 = work().area, C = ctrls(), An = P.anim, n = T.on.filter(Boolean).length, w = n * T.W * T.sky[2];
      ctx.fillStyle = T.sky[2] === 1 ? '#5fb6ff' : '#8aa6c8'; roundRect(ctx, A2.x, A2.y, A2.w, A2.h, 12); ctx.fill();
      emoji(ctx, T.sky[0], A2.x + A2.w * 0.82, A2.y + 44, 52);
      const r0 = C.roof[0], r5 = C.roof[5]; ctx.fillStyle = '#a0522d'; ctx.beginPath(); ctx.moveTo(r0.x - 16, r5.y + r5.h + 10); ctx.lineTo(r0.x + (r5.x + r5.w - r0.x) / 2, r0.y - 30); ctx.lineTo(r5.x + r5.w + 16, r5.y + r5.h + 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f2e3c6'; ctx.fillRect(r0.x, r5.y + r5.h + 10, r5.x + r5.w - r0.x, A2.y + A2.h - (r5.y + r5.h + 10) - 6);
      emoji(ctx, '🚪', r0.x + (r5.x + r5.w - r0.x) / 2, A2.y + A2.h - 28, 36);
      for (const s of C.roof) { if (T.on[s.i]) { ctx.fillStyle = '#1d3f8f'; roundRect(ctx, s.x, s.y, s.w, s.h, 4); ctx.fill(); ctx.strokeStyle = '#8fb5ff'; ctx.lineWidth = 1; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(s.x + s.w * k / 4, s.y); ctx.lineTo(s.x + s.w * k / 4, s.y + s.h); ctx.stroke(); } if (An) { ctx.fillStyle = `rgba(255,240,120,${0.3 + 0.3 * Math.sin(An.t * 8)})`; roundRect(ctx, s.x, s.y, s.w, s.h, 4); ctx.fill(); } } else { ctx.setLineDash([4, 3]); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; roundRect(ctx, s.x, s.y, s.w, s.h, 4); ctx.stroke(); ctx.setLineDash([]); text(ctx, '+', s.x + s.w / 2, s.y + s.h / 2, { size: 18, color: '#fff' }); } }
      const mx = A2.x + A2.w * 0.78, my = A2.y + A2.h * 0.55;
      panel(ctx, { x: mx - 90, y: my - 40, w: 180, h: 96 }, { fill: '#fff', r: 12, shadow: false });
      text(ctx, `need ${T.D} W`, mx, my - 20, { size: 16 }); text(ctx, An ? `making ${w} W` : `${n} panel${n === 1 ? '' : 's'}`, mx, my + 8, { size: 16, color: An ? (w >= T.D ? '#2fae66' : '#e5484d') : '#2b2350' }); text(ctx, `${T.W * T.sky[2]} W each now`, mx, my + 34, { size: 12, color: '#6b6380' });
      if (P.showSol && !An) { const s = C.roof.find(q => (q.i < T.min) !== T.on[q.i]); if (s) hand(ctx, s.x + s.w / 2, s.y + s.h / 2, P.t, 28); }
    },
    drawWind(ctx) {
      const T = P.T, C = ctrls(), An = P.anim;
      for (const q of C.spots) {
        const s = q.s; ctx.fillStyle = s.w ? '#6fbf5a' : '#3c7d4a'; roundRect(ctx, q.x, q.y, q.w, q.h, 12); ctx.fill();
        if (s.w) { ctx.fillStyle = '#8fd17a'; ctx.beginPath(); ctx.moveTo(q.x + 6, q.y + q.h - 4); ctx.quadraticCurveTo(q.x + q.w / 2, q.y + q.h * 0.25, q.x + q.w - 6, q.y + q.h - 4); ctx.fill(); }
        text(ctx, s.w ? '💨💨💨 windy hill' : '💨 calm valley', q.x + q.w / 2, q.y + 14, { size: 12, color: '#fff', max: q.w - 6 });
        if (s.t) { const spin = An ? An.t * (s.w ? 14 : 4) : P.t * (s.w ? 3 : 1); const tx = q.x + q.w / 2, ty = q.y + q.h * 0.5, R = Math.min(q.h * 0.3, 34); ctx.strokeStyle = '#eee'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx, q.y + q.h - 6); ctx.stroke(); ctx.save(); ctx.translate(tx, ty); ctx.rotate(spin); ctx.fillStyle = '#fff'; for (let k = 0; k < 3; k++) { ctx.rotate(Math.PI * 2 / 3); ctx.beginPath(); ctx.ellipse(0, -R / 2, 5, R / 2, 0, 0, 7); ctx.fill(); } ctx.restore(); if (An) text(ctx, `+${s.w ? T.p : T.calm} 🏠`, tx, q.y + q.h - 14, { size: 13, color: '#ffe680' }); }
      }
      const R = work().tray; panel(ctx, R, { fill: '#2a3466', r: 12, shadow: false });
      for (const q of trayItems()) { panel(ctx, q, { fill: '#fff', r: 10, shadow: false }); text(ctx, '🌬️', q.x + q.w / 2, q.y + q.h * 0.4, { size: Math.min(30, q.h * 0.4) }); text(ctx, 'turbine', q.x + q.w / 2, q.y + q.h - 10, { size: 11 }); }
      if (!trayItems().length) text(ctx, 'all placed', R.x + R.w / 2, R.y + R.h / 2, { size: 13, color: '#fff' });
      const used = T.spots.filter(s => s.t), homes = used.reduce((a, s) => a + (s.w ? T.p : T.calm), 0);
      if (An) { const Ar = work().area; panel(ctx, { x: Ar.x + Ar.w / 2 - 120, y: Ar.y + Ar.h / 2 - 22, w: 240, h: 44 }, { fill: '#fff', r: 12 }); text(ctx, `🏠 ${homes} of ${T.H} homes powered`, Ar.x + Ar.w / 2, Ar.y + Ar.h / 2, { size: 16, color: homes >= T.H ? '#2fae66' : '#e5484d' }); }
      if (P.drag) { const q = { x: P.drag.x, y: P.drag.y }; text(ctx, '🌬️', q.x, q.y, { size: 34 }); }
      if (P.showSol && !An) { const q = trayItems()[0]; const target = C.spots.find(z => z.s.w && !z.s.t); if (q && target) { hand(ctx, q.x + q.w / 2, q.y + q.h / 2, P.t, 28); text(ctx, '⬇️', target.x + target.w / 2, target.y + target.h / 2, { size: 26 }); } }
    },
    drawMaster(ctx) {
      const T = P.T, A2 = work().area, C = ctrls(), An = P.anim, w = T.a * 100 + T.b * 30;
      text(ctx, `Goal: exactly ${T.D} watts`, A2.x + A2.w / 2, A2.y + 20, { size: 18, color: '#ffe680' });
      [['a', '💨', 'turbines', 100], ['b', '☀️', 'panels', 30]].forEach(([k, e, nm, v]) => { const m = C[k], cx = (m.minus.x + m.plus.x + m.plus.w) / 2, n = T[k]; const row = Math.min(n, 9), sz = Math.min(28, A2.w * 0.04); for (let i = 0; i < row; i++) emoji(ctx, k === 'a' ? '🌬️' : '☀️', cx + (i % 5 - 2) * (sz + 4), A2.y + A2.h * 0.3 + Math.floor(i / 5) * (sz + 6), sz); text(ctx, `${n} ${nm} × ${v} W`, cx, m.minus.y - 16, { size: 14, color: '#fff' }); button(ctx, m.minus, '−', { fill: '#fff' }); button(ctx, m.plus, '+'); void e; });
      text(ctx, `= ${w} watts`, A2.x + A2.w / 2, A2.y + A2.h * 0.6, { size: 20, color: An ? (w === T.D ? '#7be07b' : '#ff8a7a') : '#fff' });
      if (P.showSol && !An) { const k = T.a !== T.sol.a ? 'a' : T.b !== T.sol.b ? 'b' : null; if (k) { const q = T[k] < T.sol[k] ? C[k].plus : C[k].minus; hand(ctx, q.x + q.w / 2, q.y + q.h / 2, P.t, 28); } }
    },
    _test: {
      step() { if (!P || !P.T) return 'none'; if (P.phase === 'anim') { P.anim.t = 9; return 'anim'; } if (P.phase !== 'work') return P.phase; solveTask(P.T); check(); return P.T.k; },
      go() { if (P && P.phase === 'work') check(); },
      get P() { return P; },
    },
  };
}

startGame({
  mascot: '💡',
  story: (d, e) => (e >= 4 ? 'The town needs a whole power grid! Resistors, capacitors, solar panels and wind turbines. Light up every building.' : 'The town went dark! Help Lumi fix the circuits, and every job lights up another building.'),
  howTo: ['🔌 Tap a wire tile to turn it. Make one loop: battery → bulb → back.', '❓ Fill gaps with a conductor. Flip switches ON.', '⚡ Press Power on to test it. Each job lights a building in town!'],
  together: { helps: [{ id: 'spark', icon: '⚡', label: 'Spark of help', cool: 25 }] },
  lessons: level => LESSONS[level] || [],
  realLife: realFrom(REAL['light-up-lab']),
  create: createGame,
});

// Beep's Code Quest: program a robot and watch it run through the factory!
// Snap command blocks into Beep's program, press ▶ RUN and Beep does them one at a time. Reach the 🔋 battery.
// Factory floor: 📦 crates block the way, ⛰️ rocks need a jump, 🕳️ holes are a fall (lose a heart), and in later
// levels conveyor belts carry Beep one square when it stops on them.
// I do: the lesson. We do: the first puzzle shows the ghost path and Beep says each block as you add it.
// You do: the rest. Bugs are part of coding: a failed run shows exactly where Beep went wrong.
// Levels (must match app/Games/CodeQuest.php):
// 1 Arrow Steps · 2 Arrow Paths · 3 Turn Left, Turn Right · 4 Jump the Rocks · 5 Predict the Path · 6 Debug It! ·
// 7 Repeat Loops · 8 Loops With Turns · 9 If / Else · 10 Loop + If Master
import { startGame, rand, pick, shuffle, clamp, emoji, roundRect, realFrom, playBox, Sfx } from '../_play/play.js';
import { REAL } from '../_joy/js/reallife.js';
import { LESSONS } from './lessons.js';
import { text, panel, button, bubble, hand, popups, particles, teach, taskLevel, inBox, INK } from '../_play/kit.js';

const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0]; // up, right, down, left
const ABS = { U: 0, R: 1, D: 2, L: 3 };
const BLOCK = {
  U: { icon: '⬆️', say: 'up' }, R: { icon: '➡️', say: 'right' }, D: { icon: '⬇️', say: 'down' }, L: { icon: '⬅️', say: 'left' },
  F: { icon: '⬆️', say: 'forward', label: 'Fwd' }, TL: { icon: '↰', say: 'turn left', label: 'Left' }, TR: { icon: '↱', say: 'turn right', label: 'Right' }, J: { icon: '⤴', say: 'jump', label: 'Jump' },
};
const COLS = 8, ROWS = 6;

// ---------------------------------------------------------------- puzzles
function emptyGrid() { return Array.from({ length: ROWS }, () => Array(COLS).fill('.')); }
/** Walk a command list from a start pose on a grid. Returns { path: [{x,y,d,cmd,ok,why}], end, ok, reason } */
function simulate(G, start, prog, { maxSteps = 60 } = {}) {
  let x = start.x, y = start.y, d = start.d; const path = [{ x, y, d }];
  const at = (cx, cy) => (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS ? '#' : G[cy][cx]);
  const steps = flatten(prog, () => ({ x, y, d, ahead: at(x + DX[d], y + DY[d]) }));
  let n = 0;
  for (const s of steps()) {
    if (++n > maxSteps) return { path, ok: false, reason: 'loop' };
    let nx = x, ny = y;
    if (s in ABS) { d = ABS[s]; nx = x + DX[d]; ny = y + DY[d]; }
    else if (s === 'F') { nx = x + DX[d]; ny = y + DY[d]; }
    else if (s === 'TL') { d = (d + 3) % 4; path.push({ x, y, d, cmd: s }); continue; }
    else if (s === 'TR') { d = (d + 1) % 4; path.push({ x, y, d, cmd: s }); continue; }
    else if (s === 'J') { const mx = x + DX[d], my = y + DY[d]; nx = x + DX[d] * 2; ny = y + DY[d] * 2; if (at(mx, my) === '#' || at(mx, my) === 'C') { path.push({ x, y, d, cmd: s, bonk: true }); return { path, ok: false, reason: 'bonk' }; } }
    const t = at(nx, ny);
    if (t === '#' || t === 'C') { path.push({ x, y, d, cmd: s, bonk: true }); return { path, ok: false, reason: 'bonk' }; }
    if (t === 'K' && s !== 'J') { path.push({ x, y, d, cmd: s, bonk: true }); return { path, ok: false, reason: 'rock' }; }
    x = nx; y = ny; path.push({ x, y, d, cmd: s });
    if (t === 'H') return { path, ok: false, reason: 'hole' };
    // conveyor: carried one square
    const belt = { '>': 1, '<': 3, '^': 0, 'v': 2 }[t];
    if (belt != null) { const bx = x + DX[belt], by = y + DY[belt], bt = at(bx, by); if (bt !== '#' && bt !== 'C' && bt !== 'K') { x = bx; y = by; path.push({ x, y, d, belt: true }); if (bt === 'H') return { path, ok: false, reason: 'hole' }; } }
    if (G[y][x] === 'G') return { path, ok: true, end: { x, y, d } };
  }
  return { path, ok: G[y][x] === 'G', end: { x, y, d }, reason: G[y][x] === 'G' ? null : 'short' };
}
/** Program items: 'F', ... or { rep: n, body: [...] } or { if: 'rock'|'wall'|'yellow', then: [...], else: [...] } */
function flatten(prog, sense) {
  return function* run(list = prog) {
    for (const it of list) {
      if (typeof it === 'string') { if (it) yield it; }
      else if (it.rep != null) { for (let i = 0; i < it.rep; i++) yield* run(it.body); }
      else if (it.ifs) { const s = sense(); const hit = it.ifs.find(c => (c.on === 'rock' && s.ahead === 'K') || (c.on === 'wall' && (s.ahead === '#' || s.ahead === 'C'))); yield* run(hit ? hit.then : it.else); }
    }
  };
}
const flat = prog => { const out = []; for (const s of flatten(prog, () => ({}))()) out.push(s); return out; };
/** A random self-avoiding path: list of moves as absolute dirs. */
function randomPath(len, start, { turns = 2, straightMin = 1 } = {}) {
  for (let tries = 0; tries < 200; tries++) {
    let x = start.x, y = start.y, d = rand(0, 3); const seen = new Set([x + ',' + y]), dirs = []; let ok = true, t = 0, run = 0;
    for (let i = 0; i < len; i++) {
      if (run >= straightMin && t < turns && Math.random() < 0.4) { d = (d + (Math.random() < 0.5 ? 1 : 3)) % 4; t++; run = 0; }
      const nx = x + DX[d], ny = y + DY[d];
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || seen.has(nx + ',' + ny)) { ok = false; break; }
      x = nx; y = ny; seen.add(x + ',' + y); dirs.push(d); run++;
    }
    if (ok) return { dirs, end: { x, y }, cells: [...seen] };
  }
  return null;
}
function decorate(G, keep, n, ch) { const free = []; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (G[y][x] === '.' && !keep.has(x + ',' + y)) free.push([x, y]); shuffle(free).slice(0, n).forEach(([x, y]) => (G[y][x] = ch)); }
/** Relative program for absolute directions from a starting facing. */
function relProg(dirs, d0) { const out = []; let d = d0; for (const nd of dirs) { const diff = (nd - d + 4) % 4; if (diff === 1) out.push('TR'); else if (diff === 3) out.push('TL'); else if (diff === 2) out.push('TR', 'TR'); out.push('F'); d = nd; } return out; }

function makePuzzle(level) {
  const G = emptyGrid(), start = { x: rand(0, 2), y: rand(1, ROWS - 2), d: 1 };
  const P = { level, G, start, palette: [], slots: 8, mode: 'build' };
  if (level <= 2) {
    let pth; do { pth = level === 1 ? randomPath(rand(2, 3), start, { turns: 0 }) : randomPath(rand(4, 6), start, { turns: 1, straightMin: 2 }); } while (!pth);
    G[pth.end.y][pth.end.x] = 'G';
    decorate(G, new Set(pth.cells), level === 1 ? 3 : 6, 'C');
    P.sol = pth.dirs.map(d => 'URDL'[d]); P.palette = ['U', 'R', 'D', 'L']; P.slots = level === 1 ? 4 : 7;
    return P;
  }
  if (level === 3 || level === 4 || level === 6) {
    let pth; do { pth = randomPath(rand(4, 6), start, { turns: level === 6 ? 2 : 1, straightMin: 2 }); } while (!pth);
    start.d = pth.dirs[0]; // facing the way it goes first
    if (Math.random() < 0.5 && level === 3) start.d = (pth.dirs[0] + 1) % 4; // needs a turn at the start
    G[pth.end.y][pth.end.x] = 'G';
    let prog = relProg(pth.dirs, start.d);
    if (level === 4) { // put a rock on a straight run and make the jump
      const cells = pth.cells.map(c => c.split(',').map(Number)); let x = start.x, y = start.y, d = start.d, placed = false; const out = [];
      for (let i = 0; i < prog.length; i++) {
        const c = prog[i];
        if (!placed && c === 'F' && prog[i + 1] === 'F' && i > 0) { const mx = x + DX[d], my = y + DY[d]; G[my][mx] = 'K'; out.push('J'); x += DX[d] * 2; y += DY[d] * 2; i++; placed = true; continue; }
        out.push(c); if (c === 'TL') d = (d + 3) % 4; else if (c === 'TR') d = (d + 1) % 4; else { x += DX[d]; y += DY[d]; }
      }
      prog = out; void cells;
    }
    decorate(G, new Set(pth.cells), 6, 'C');
    P.sol = prog; P.palette = level === 4 ? ['F', 'TL', 'TR', 'J'] : ['F', 'TL', 'TR']; P.slots = Math.max(prog.length + 1, 6);
    if (level === 6) { // debug it: one block is wrong
      P.mode = 'debug'; const bug = prog.slice(), i = rand(0, bug.length - 1); bug[i] = bug[i] === 'F' ? pick(['TL', 'TR']) : bug[i] === 'TL' ? 'TR' : 'TL'; P.given = bug; P.slots = bug.length;
      if (Math.random() < 0.5) decorate(G, new Set(pth.cells), 2, pick(['>', '<', '^', 'v']));
    }
    return P;
  }
  if (level === 5) { // predict where Beep ends
    let pth; do { pth = randomPath(rand(3, 5), start, { turns: 2, straightMin: 1 }); } while (!pth);
    start.d = pth.dirs[0]; const prog = relProg(pth.dirs, start.d);
    decorate(G, new Set(pth.cells), 4, 'C');
    if (Math.random() < 0.5) { const end = pth.end; const bd = rand(0, 3), bx = end.x - DX[bd], by = end.y - DY[bd]; void bx; void by; }
    P.mode = 'predict'; P.given = prog; P.sol = prog; P.pred = null;
    const r = simulate(G, start, prog); P.endAt = r.path[r.path.length - 1];
    return P;
  }
  if (level === 7) { // a long straight line: Repeat N [Forward]
    start.x = 0; start.d = 1; const n = rand(5, 7); G[start.y][n] = 'G'; decorate(G, new Set(Array.from({ length: n + 1 }, (_, i) => i + ',' + start.y)), 7, 'C');
    P.mode = 'loop'; P.loop = { rep: 2, body: ['', ''] }; P.solRep = n; P.sol = [{ rep: n, body: ['F'] }]; P.palette = ['F', 'TL', 'TR']; P.slots = 2;
    return P;
  }
  if (level === 8) { // staircase: Repeat N [Forward, Turn left, Forward, Turn right]
    start.x = 0; start.y = ROWS - 1; start.d = 1; const n = rand(2, 4); let x = 0, y = ROWS - 1; const keep = new Set([x + ',' + y]);
    for (let i = 0; i < n; i++) { x++; keep.add(x + ',' + y); y--; keep.add(x + ',' + y); }
    G[y][x] = 'G'; decorate(G, keep, 6, 'C');
    P.mode = 'loop'; P.loop = { rep: 2, body: ['', '', '', ''] }; P.solRep = n; P.sol = [{ rep: n, body: ['F', 'TL', 'F', 'TR'] }]; P.palette = ['F', 'TL', 'TR']; P.slots = 4;
    return P;
  }
  // 9: Repeat N [ IF rock ahead: Jump ELSE: Forward ]   10: + IF wall ahead: Turn right
  start.x = 0; start.d = 1;
  if (level === 9) {
    const n = COLS - 1; let x = 0; const keep = new Set(); const row = start.y;
    const rocks = new Set(); for (let i = 2; i < n - 1; i += rand(2, 3)) rocks.add(i);
    for (let i = 0; i <= n; i++) { keep.add(i + ',' + row); if (rocks.has(i)) G[row][i] = 'K'; }
    G[row][n] = 'G'; decorate(G, keep, 6, 'C');
    let steps = 0; for (x = 0; x < n;) { if (G[row][x + 1] === 'K') x += 2; else x++; steps++; }
    P.mode = 'cond'; P.cond = { rep: 2, then: [''], else: [''] }; P.solRep = steps; P.condOn = ['rock']; P.palette = ['F', 'TL', 'TR', 'J'];
    P.sol = [{ rep: steps, body: [{ ifs: [{ on: 'rock', then: ['J'] }], else: ['F'] }] }];
    return P;
  }
  // level 10: go right, hit the wall, turn right (down), keep going, rocks along the way
  start.y = 0; const row = 0, col = rand(4, COLS - 2), downTo = ROWS - 1;
  for (let i = 0; i <= col; i++) G[row][i] = '.';
  G[row][col + 1] = 'C';
  const keep = new Set(); for (let i = 0; i <= col; i++) keep.add(i + ',' + row); for (let j = 0; j <= downTo; j++) keep.add(col + ',' + j);
  const rx = rand(2, col - 1); G[row][rx] = 'K'; const ry = rand(2, downTo - 1); G[ry][col] = 'K';
  G[downTo][col] = 'G'; decorate(G, keep, 4, 'C');
  let x = 0, y = 0, d = 1, steps = 0;
  const at = (cx, cy) => (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS ? '#' : G[cy][cx]);
  while (!(x === col && y === downTo) && steps < 40) { const a = at(x + DX[d], y + DY[d]); if (a === 'K') { x += DX[d] * 2; y += DY[d] * 2; } else if (a === '#' || a === 'C') d = (d + 1) % 4; else { x += DX[d]; y += DY[d]; } steps++; }
  P.mode = 'cond'; P.cond = { rep: 2, then: [''], then2: [''], else: [''] }; P.solRep = steps; P.condOn = ['rock', 'wall']; P.palette = ['F', 'TL', 'TR', 'J'];
  P.sol = [{ rep: steps, body: [{ ifs: [{ on: 'rock', then: ['J'] }, { on: 'wall', then: ['TR'] }], else: ['F'] }] }];
  return P;
}
/** The kid's program as runnable items. */
function program(Z) {
  if (Z.mode === 'loop') return [{ rep: Z.loop.rep, body: Z.loop.body.filter(Boolean) }];
  if (Z.mode === 'cond') { const ifs = [{ on: 'rock', then: Z.cond.then.filter(Boolean) }]; if (Z.condOn.includes('wall')) ifs.push({ on: 'wall', then: Z.cond.then2.filter(Boolean) }); return [{ rep: Z.cond.rep, body: [{ ifs, else: Z.cond.else.filter(Boolean) }] }]; }
  return Z.prog.filter(Boolean);
}
const sayProg = list => list.map(c => (typeof c === 'string' ? BLOCK[c].say : '')).join(', ');

function createGame(api) {
  let P = null;
  const pops = popups(), fx = particles();

  function start(o) {
    P = { o, t: 0, n: o.boss ? 5 : o.edition <= 1 ? 3 : 4, done: 0, phase: 'build', guidedDone: !!o.boss, run: null };
    api.score('🔋 0'); api.progress(0, 'Puzzles');
    nextPuzzle();
  }
  function nextPuzzle() {
    if (P.done >= P.n) { P.phase = 'over'; api.finish({ win: true, title: '🤖 Factory complete!', text: `Beep reached ${P.done} batteries thanks to your code.` }); return; }
    const lv = taskLevel(api, P.o), Z = makePuzzle(lv), guided = !P.guidedDone;
    Z.prog = Z.mode === 'debug' ? Z.given.slice() : Array(Z.slots).fill('');
    P.Z = Z; P.phase = 'build'; P.run = null; P.showSol = guided ? 1 : 0;
    P.teach = teach(api, { level: lv, guided, prompt: `Code Quest level ${lv}`, expected: Z.mode === 'predict' ? `ends at ${Z.endAt.x},${Z.endAt.y}` : sayProg(flat(Z.sol)) });
    api.actions([{ key: 'help', label: '💡 Help' }, { key: 'clear', label: '↺ Clear' }, { key: 'check', label: Z.mode === 'predict' ? '▶ Check' : '▶ RUN', big: true }]);
    const intro = { build: lv <= 2 ? 'Tap the arrows to tell Beep how to reach the battery. Then press RUN.' : 'Beep moves the way it FACES. Use forward and turns. Then press RUN.', debug: 'This code has a BUG! Run it to see what goes wrong, then tap the wrong block to change it.', predict: 'Read the code. Where will Beep stop? Tap that square!', loop: lv === 7 ? 'Use the REPEAT loop! Put Forward inside and set how many times.' : 'Find the pattern of the staircase. Put ONE step of it inside the loop.', cond: lv === 9 ? 'Fill the IF block: IF there is a rock ahead, what should Beep do? ELSE what?' : 'IF rock ahead, IF wall ahead, ELSE… fill all three!' }[Z.mode];
    api.goal(`🤖 ${intro}`, { speak: false });
    api.speak((guided ? "Let's code this one together. " : '') + intro);
  }
  function runIt() {
    const Z = P.Z;
    if (Z.mode === 'predict') {
      if (!Z.pred) { api.speak('Tap the square where Beep will stop first!', { force: true }); return; }
      P.phase = 'run'; P.run = { r: simulate(Z.G, Z.start, Z.given), i: 0, t: 0 }; return;
    }
    const prog = program(Z);
    if (!flat(prog).length) { api.speak('Add some blocks to the program first!', { force: true }); return; }
    P.phase = 'run'; P.run = { r: simulate(Z.G, Z.start, prog), i: 0, t: 0 };
    Sfx.click();
  }
  function runOver() {
    const Z = P.Z, R = P.run.r;
    if (Z.mode === 'predict') {
      const e = R.path[R.path.length - 1], ok = e.x === Z.pred.x && e.y === Z.pred.y;
      if (ok) return solved();
      return failed(`Beep stopped here instead. ${P.teach.misses === 0 ? 'Follow the code one block at a time with your finger.' : `The code says: ${sayProg(Z.given)}.`}`);
    }
    if (R.ok) return solved();
    const why = R.reason === 'bonk' ? 'Bonk! Beep bumped into something.' : R.reason === 'rock' ? 'A rock is in the way! Beep needs to jump.' : R.reason === 'hole' ? 'Oh no, Beep fell in a hole!' : R.reason === 'loop' ? 'Beep ran too long!' : 'Beep stopped before the battery.';
    if (R.reason === 'hole') api.loseHeart('Beep fell in a hole! Watch out for 🕳️.');
    failed(why);
  }
  function failed(why) {
    const n = P.teach.miss(); Sfx.wrong();
    if (n >= 3) {
      P.teach.done(false, P.Z.mode === 'predict' ? `${P.Z.pred.x},${P.Z.pred.y}` : sayProg(flat(program(P.Z))));
      api.speak(`${why} Here's code that works. Watch!`, { force: true });
      const Z = P.Z; if (Z.mode === 'predict') { P.phase = 'run'; P.run = null; setTimeout(() => P && P.Z === Z && solved(true), 1500); return; }
      setSolution(Z); P.phase = 'build';
      if (!api.loseHeart('Beep needed help with that one.')) setTimeout(() => { if (P && P.Z === Z) { P.phase = 'run'; P.run = { r: simulate(Z.G, Z.start, program(Z)), i: 0, t: 0, after: 'solved' }; } }, 1400);
      return;
    }
    if (n === 2) { P.teach.help(); P.showSol = 1; why += ' Look at the dotted path — follow it!'; }
    else why += ' Try again! Change your code and press RUN.';
    api.speak(why, { force: true });
    P.phase = 'build';
  }
  function setSolution(Z) {
    if (Z.mode === 'loop') { Z.loop.rep = Z.solRep; Z.loop.body = Z.sol[0].body.concat(Array(Z.loop.body.length).fill('')).slice(0, Z.loop.body.length); }
    else if (Z.mode === 'cond') { Z.cond.rep = Z.solRep; Z.cond.then = ['J']; Z.cond.then2 = ['TR']; Z.cond.else = ['F']; }
    else { const s = flat(Z.sol); Z.prog = s.concat(Array(Math.max(0, Z.slots - s.length)).fill('')); }
  }
  function solved(already) {
    if (!already) { const r = P.teach.done(true, P.Z.mode === 'predict' ? 'predicted' : sayProg(flat(program(P.Z)))); if (r.levelUp) api.chime('⭐ <b>Level up!</b> New coding blocks are coming!', '🤖'); }
    Sfx.correct(); fx.burst(api.W / 2, api.H * 0.4, 24); api.speak(pick(['Beep boop! Battery charged!', 'Your code works!', 'Great coding!']));
    P.done++; P.guidedDone = true; api.score(`🔋 ${P.done}`); api.progress(P.done / P.n, 'Puzzles'); P.phase = 'cheer'; api.actions([]);
    setTimeout(() => P && nextPuzzle(), 1600);
  }

  // ------------------------------------------------ layout
  function L() {
    const b = playBox(api.W, api.H), short = api.H <= 500;
    const progH = short ? 0 : Math.min(190, b.h * 0.36);
    const gridArea = short ? { x: b.x, y: b.y, w: b.w * 0.55, h: b.h } : { x: b.x, y: b.y, w: b.w, h: b.h - progH - 6 };
    const cell = Math.floor(Math.min(gridArea.w / COLS, gridArea.h / ROWS));
    const grid = { x: gridArea.x + (gridArea.w - cell * COLS) / 2, y: gridArea.y + (gridArea.h - cell * ROWS) / 2, cell };
    const prog = short ? { x: b.x + b.w * 0.56, y: b.y, w: b.w * 0.44, h: b.h } : { x: b.x, y: b.y + b.h - progH, w: b.w, h: progH };
    return { b, short, grid, prog };
  }
  /** Buttons + slots inside the program panel. */
  function progUI() {
    const { prog: R } = L(), Z = P.Z, pal = Z.mode === 'predict' ? [] : Z.palette, pw = Math.min(70, (R.w - 20) / Math.max(4, pal.length) - 8);
    const palette = pal.map((k, i) => ({ k, x: R.x + 10 + i * (pw + 8), y: R.y + 8, w: pw, h: Math.min(56, R.h * 0.3) }));
    const top = R.y + (pal.length ? Math.min(56, R.h * 0.3) + 18 : 8), area = { x: R.x + 8, y: top, w: R.w - 16, h: R.y + R.h - top - 8 };
    const slots = [];
    if (Z.mode === 'build' || Z.mode === 'debug' || Z.mode === 'predict') {
      const list = Z.mode === 'predict' ? Z.given : Z.prog, per = Math.max(4, Math.floor(area.w / 58)), s = Math.min(54, area.w / per - 6);
      list.forEach((c, i) => slots.push({ i, c, x: area.x + (i % per) * (s + 6), y: area.y + Math.floor(i / per) * (s + 6), w: s, h: s }));
    } else if (Z.mode === 'loop') {
      const s = Math.min(52, (area.w - 120) / Z.loop.body.length - 6);
      slots.push({ rep: true, x: area.x, y: area.y, w: 110, h: s });
      Z.loop.body.forEach((c, i) => slots.push({ i, c, x: area.x + 118 + i * (s + 6), y: area.y, w: s, h: s, arr: Z.loop.body }));
    } else {
      const rows = [['then', '❓ IF rock ahead']];
      if (Z.condOn.includes('wall')) rows.push(['then2', '❓ IF wall ahead']);
      rows.push(['else', '➡ ELSE']);
      const tall = area.h > 150, s = Math.min(58, tall ? area.h / (rows.length + 1) - 26 : area.h - 34), colW = tall ? area.w : (area.w - 120) / rows.length;
      slots.push({ rep: true, x: area.x, y: area.y, w: 110, h: Math.min(46, s) });
      rows.forEach(([key, lab], r) => { const x = tall ? area.x + 120 : area.x + 120 + r * colW, y = tall ? area.y + r * (s + 26) : area.y; slots.push({ i: 0, c: Z.cond[key][0], key, lab, x: tall ? x + 130 : x + (colW - s) / 2, y: tall ? y + 4 : y + 22, w: s, h: s, arr: Z.cond[key], lx: tall ? x : x + colW / 2, ly: tall ? y + 4 + s / 2 : y + 10, tall }); });
    }
    return { palette, slots, area };
  }
  function addBlock(k) {
    const Z = P.Z;
    if (Z.mode === 'build') { const i = Z.prog.indexOf(''); if (i < 0) { api.speak('No room! Tap a block to take it out.', { force: true }); return; } Z.prog[i] = k; }
    else if (Z.mode === 'loop') { const i = Z.loop.body.indexOf(''); if (i < 0) return; Z.loop.body[i] = k; }
    else if (Z.mode === 'cond') { const sel = P.sel || 'then'; Z.cond[sel][0] = k; const order = Z.condOn.includes('wall') ? ['then', 'then2', 'else'] : ['then', 'else']; P.sel = order[(order.indexOf(sel) + 1) % order.length]; }
    Sfx.click(); api.speak(BLOCK[k].say);
  }

  return {
    start(o) { start(o); },
    checkpoint() { if (P && P.Z) { P.phase = 'build'; P.run = null; } },
    stop() { P = null; },
    update(dt) {
      if (!P) return; P.t += dt; pops.update(dt); fx.update(dt);
      const I = api.input;
      if (P.phase === 'build') {
        if (I.pressed('check')) runIt();
        if (I.pressed('clear')) { const Z = P.Z; if (Z.mode === 'build') Z.prog = Z.prog.map(() => ''); else if (Z.mode === 'debug') Z.prog = Z.given.slice(); else if (Z.mode === 'loop') Z.loop.body = Z.loop.body.map(() => ''); else if (Z.mode === 'cond') { Z.cond.then = ['']; Z.cond.then2 = ['']; Z.cond.else = ['']; } else Z.pred = null; Sfx.click(); }
        if (I.pressed('help')) this.hint();
        // keyboard: arrows add blocks in levels 1–2
        if (P.Z.mode === 'build' && P.Z.palette.includes('U')) for (const [k, key] of [['U', 'up'], ['R', 'right'], ['D', 'down'], ['L', 'left']]) if (I.pressed(key)) addBlock(k);
      }
      if (P.phase === 'run' && P.run) {
        const R = P.run; R.t += dt;
        if (R.t > 0.42) { R.t = 0; R.i++; const st = R.r.path[R.i]; if (st) { if (st.belt) Sfx.click(); else if (st.cmd === 'J') Sfx.whoosh ? Sfx.whoosh() : Sfx.click(); else Sfx.tick ? Sfx.tick() : 0; } }
        if (R.i >= R.r.path.length - 1 && R.t > 0.3) { const after = R.after; P.run.doneAt = true; if (after === 'solved') { P.run = null; solved(true); } else runOver(); }
      }
    },
    hint() {
      if (!P || !P.Z || P.phase !== 'build') return false;
      P.teach.help(); P.showSol = 1;
      const Z = P.Z;
      api.speak(Z.mode === 'predict' ? `Follow the code: ${sayProg(Z.given)}. Keep track of which way Beep faces.` : Z.mode === 'loop' ? (Z.level === 7 ? 'Count the squares to the battery. Put Forward in the loop and repeat that many times.' : 'One step of the staircase is: forward, turn left, forward, turn right. Repeat it!') : Z.mode === 'cond' ? 'If there is a rock ahead, Beep should JUMP. Else, go forward.' + (Z.condOn.includes('wall') ? ' If a wall is ahead, turn right.' : '') : `Follow the dotted path. The first block is ${BLOCK[flat(Z.sol)[0]].say}.`, { force: true });
      return true;
    },
    coach() { if (!P || !P.Z) return ''; const Z = P.Z; return Z.mode === 'predict' ? 'Have them trace the code with a finger, block by block.' : Z.mode === 'debug' ? 'Run it and find the FIRST moment Beep goes wrong.' : Z.mode === 'loop' ? 'Look for the part that repeats.' : Z.mode === 'cond' ? 'IF rock → jump. ELSE → forward.' : 'Ask: "Which way does Beep need to go first?"'; },
    onHelp(id) { if (!P || !P.Z) return ''; if (id === 'peek') { P.showSol = 1; P.teach.help(); return 'turned on the path map!'; } return ''; },
    screen() { if (!P || !P.Z) return ''; return `Program: ${sayProg(flat(program(P.Z))) || '(empty)'}`; },
    onTap(x, y) {
      if (!P || !P.Z || P.phase !== 'build') return;
      const Z = P.Z, U = progUI(), G = L().grid;
      if (Z.mode === 'predict') { const cx = Math.floor((x - G.x) / G.cell), cy = Math.floor((y - G.y) / G.cell); if (cx >= 0 && cy >= 0 && cx < COLS && cy < ROWS) { Z.pred = { x: cx, y: cy }; Sfx.click(); } return; }
      const p = U.palette.find(q => inBox(x, y, q)); if (p) return addBlock(p.k);
      for (const s of U.slots) {
        if (!inBox(x, y, s)) continue;
        if (s.rep) { const right = x > s.x + s.w / 2; if (Z.mode === 'loop') Z.loop.rep = clamp(Z.loop.rep + (right ? 1 : -1), 1, 12); else Z.cond.rep = clamp(Z.cond.rep + (right ? 1 : -1), 1, 16); Sfx.click(); api.speak(`repeat ${Z.mode === 'loop' ? Z.loop.rep : Z.cond.rep} times`); return; }
        if (Z.mode === 'debug') { const order = Z.palette, cur = Z.prog[s.i]; Z.prog[s.i] = order[(order.indexOf(cur) + 1) % order.length]; Sfx.click(); api.speak(BLOCK[Z.prog[s.i]].say); return; }
        if (Z.mode === 'cond') { P.sel = s.key; if (s.c) s.arr[0] = ''; Sfx.click(); return; }
        if (s.arr) { s.arr[s.i] = ''; } else Z.prog[s.i] = '';
        Sfx.click(); return;
      }
    },
    draw(ctx, W, H, onTitle) {
      ctx.fillStyle = '#1a2233'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,.04)'; for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      if (onTitle || !P || !P.Z) { emoji(ctx, '🤖', W / 2, H * 0.5, Math.min(120, H * 0.25)); emoji(ctx, '🔋', W * 0.7, H * 0.55, 50); return; }
      const Z = P.Z, lay = L(), G = lay.grid, c = G.cell;
      // floor
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const X = G.x + x * c, Y = G.y + y * c, t = Z.G[y][x];
        ctx.fillStyle = (x + y) % 2 ? '#3a4a5e' : '#34445a'; ctx.fillRect(X, Y, c, c);
        if (t === 'C') emoji(ctx, '📦', X + c / 2, Y + c / 2, c * 0.8);
        else if (t === 'K') emoji(ctx, '⛰️', X + c / 2, Y + c / 2, c * 0.75);
        else if (t === 'H') { ctx.fillStyle = '#0a0d14'; ctx.beginPath(); ctx.ellipse(X + c / 2, Y + c / 2, c * 0.38, c * 0.3, 0, 0, 7); ctx.fill(); }
        else if (t === 'G') emoji(ctx, '🔋', X + c / 2, Y + c / 2, c * 0.7);
        else if ('<>^v'.includes(t)) { ctx.fillStyle = '#4a5260'; ctx.fillRect(X + 2, Y + 2, c - 4, c - 4); const d = { '>': 1, '<': 3, '^': 0, 'v': 2 }[t]; ctx.save(); ctx.translate(X + c / 2, Y + c / 2); ctx.rotate(d * Math.PI / 2); ctx.fillStyle = '#ffc93c'; const o = (P.t * 30) % (c / 3); for (let k = -1; k < 2; k++) { ctx.beginPath(); ctx.moveTo(-8, k * c / 3 - o + 4); ctx.lineTo(0, k * c / 3 - o - 4); ctx.lineTo(8, k * c / 3 - o + 4); ctx.fill(); } ctx.restore(); }
      }
      ctx.strokeStyle = '#0a0d14'; ctx.lineWidth = 3; ctx.strokeRect(G.x, G.y, c * COLS, c * ROWS);
      // ghost path (we do / help)
      if (P.showSol && Z.mode !== 'predict') { const r = simulate(Z.G, Z.start, Z.sol); ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(255,201,60,.8)'; ctx.lineWidth = 4; ctx.beginPath(); r.path.forEach((p, i) => { const X = G.x + p.x * c + c / 2, Y = G.y + p.y * c + c / 2; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke(); ctx.restore(); }
      // prediction marker
      if (Z.mode === 'predict' && Z.pred) { ctx.strokeStyle = '#ff6b9d'; ctx.lineWidth = 4; ctx.strokeRect(G.x + Z.pred.x * c + 3, G.y + Z.pred.y * c + 3, c - 6, c - 6); emoji(ctx, '📍', G.x + Z.pred.x * c + c / 2, G.y + Z.pred.y * c + c * 0.3, c * 0.5); }
      // Beep
      let pose = { ...Z.start }, bonk = false;
      if (P.run) { const R = P.run, a = R.r.path[Math.min(R.i, R.r.path.length - 1)], b = R.r.path[Math.min(R.i + 1, R.r.path.length - 1)], k = Math.min(1, R.t / 0.42); pose = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, d: k > 0.5 ? b.d : a.d, jump: b.cmd === 'J' ? Math.sin(k * Math.PI) : 0 }; bonk = !!b.bonk && k > 0.5; }
      const bx = G.x + pose.x * c + c / 2, by = G.y + pose.y * c + c / 2 - (pose.jump || 0) * c * 0.6;
      emoji(ctx, '🤖', bx + (bonk ? Math.sin(P.t * 60) * 3 : 0), by, c * 0.78);
      ctx.save(); ctx.translate(bx, by); ctx.rotate(pose.d * Math.PI / 2); ctx.fillStyle = '#ffc93c'; ctx.beginPath(); ctx.moveTo(0, -c * 0.52); ctx.lineTo(-c * 0.12, -c * 0.38); ctx.lineTo(c * 0.12, -c * 0.38); ctx.fill(); ctx.restore();
      if (bonk) emoji(ctx, '💥', bx + DX[pose.d] * c * 0.4, by + DY[pose.d] * c * 0.4, c * 0.5);
      this.drawProgram(ctx, lay);
      fx.draw(ctx); pops.draw(ctx);
    },
    drawProgram(ctx, lay) {
      const Z = P.Z, U = progUI(), R = lay.prog;
      panel(ctx, R, { fill: '#26324a', r: 16 });
      for (const p of U.palette) { button(ctx, p, BLOCK[p.k].label || '', { fill: '#3dc2ff', icon: BLOCK[p.k].icon }); }
      const hl = P.run && P.run.r.path[P.run.i + 1] ? P.run.r.path[P.run.i + 1].cmd : null;
      const nextSol = P.showSol && (Z.mode === 'build') ? (() => { const s = flat(Z.sol), i = Z.prog.indexOf(''); return i >= 0 && Z.prog.slice(0, i).every((c, j) => c === s[j]) ? s[i] : null; })() : null;
      for (const s of U.slots) {
        if (s.rep) { const n = Z.mode === 'loop' ? Z.loop.rep : Z.cond.rep; panel(ctx, s, { fill: '#8b6cff', r: 12, shadow: false }); text(ctx, `🔁 −  ${n}  +`, s.x + s.w / 2, s.y + s.h / 2, { size: 17, color: '#fff' }); continue; }
        if (s.lab) text(ctx, s.lab + (s.tall ? ':' : ''), s.lx, s.ly, { size: 13, color: '#fff', align: s.tall ? 'left' : 'center' });
        const on = Z.mode === 'cond' && (P.sel || 'then') === s.key;
        panel(ctx, s, { fill: s.c ? '#3dc2ff' : 'rgba(255,255,255,.12)', r: 10, shadow: false, stroke: on ? '#ffc93c' : hl && s.c === hl ? '#fff' : null, lw: 3 });
        if (s.c) { text(ctx, BLOCK[s.c].icon, s.x + s.w / 2, s.y + s.h * 0.42, { size: s.h * 0.42, color: INK }); if (BLOCK[s.c].label) text(ctx, BLOCK[s.c].label, s.x + s.w / 2, s.y + s.h * 0.82, { size: 10, color: INK }); }
      }
      if (Z.mode === 'loop') text(ctx, 'Tap − / + to set how many times. Tap a block to take it out.', U.area.x, U.area.y + 70, { size: 12, color: '#a8b4c8', align: 'left', max: U.area.w });
      if (Z.mode === 'debug') text(ctx, '🐛 Tap a block to change it.', U.area.x, U.area.y + U.area.h - 10, { size: 12, color: '#a8b4c8', align: 'left' });
      if (Z.mode === 'predict') text(ctx, '👆 Tap the square where Beep will stop.', U.area.x, U.area.y + U.area.h - 10, { size: 13, color: '#ffc93c', align: 'left' });
      if (nextSol) { const p = U.palette.find(q => q.k === nextSol); if (p) hand(ctx, p.x + p.w * 0.6, p.y + p.h * 0.6, P.t, 32); }
    },
    _test: { step() {
      if (!P || !P.Z) return 'none';
      if (P.phase === 'run' && P.run) { if (P.run.i < P.run.r.path.length - 1) { P.run.i = P.run.r.path.length - 1; P.run.t = 0.31; } return 'run'; }
      if (P.phase !== 'build') return P.phase;
      const Z = P.Z;
      if (Z.mode === 'predict') { Z.pred = { x: Z.endAt.x, y: Z.endAt.y }; runIt(); return 'predict'; }
      setSolution(Z); runIt(); return Z.mode;
    }, stress(level, n = 200) { let bad = 0; for (let i = 0; i < n; i++) { const Z = makePuzzle(level); const r = simulate(Z.G, Z.start, Z.sol); if (!r.ok) bad++; } return bad; }, get P() { return P; } },
  };
}

startGame({
  mascot: '🤖',
  stick: false,
  story: (d, e) => (e >= 3 ? 'Code Beep through the robot factory with loops, if/else checks, jumps and conveyor belts.' : 'Help Beep the robot reach the batteries! Snap command blocks into Beep’s program, then press RUN.'),
  howTo: ['🧩 Tap blocks to add them to Beep’s program. Tap a block in the program to take it out.', '▶ Press RUN and watch Beep do each block in order.', '🐛 If Beep goes the wrong way, find the first wrong block and fix it.', '🔁 Big kids: use Repeat loops and ❓ IF blocks.'],
  together: { helps: [{ id: 'peek', icon: '🗺️', label: 'Show path', cool: 20 }] },
  lessons: level => LESSONS[level] || [],
  realLife: realFrom(REAL['code-quest']),
  create: createGame,
});

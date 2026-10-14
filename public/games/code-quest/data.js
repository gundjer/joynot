// Code Quest data: blocks, puzzle maker, program runner and teaching steps.
import { rand, pick, chance } from '../_joy/js/util.js';

// game level -> puzzle generator level
export const GEN = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8, 10: 9 };

export const DV = [[-1, 0], [0, 1], [1, 0], [0, -1]]; // N E S W  (row, col)
export const ARROW = ['⬆️', '➡️', '⬇️', '⬅️'];
export const BLOCK = {
  up: { ic: '⬆️', name: 'Up', abs: 0, code: 'moveUp()' }, right: { ic: '➡️', name: 'Right', abs: 1, code: 'moveRight()' }, down: { ic: '⬇️', name: 'Down', abs: 2, code: 'moveDown()' }, left: { ic: '⬅️', name: 'Left', abs: 3, code: 'moveLeft()' },
  fwd: { ic: '⬆', name: 'Forward', code: 'forward()' }, tl: { ic: '↰', name: 'Turn left', code: 'turnLeft()' }, tr: { ic: '↱', name: 'Turn right', code: 'turnRight()' }, jump: { ic: '⤴', name: 'Jump', code: 'jump()' },
  rep: { ic: '🔁', name: 'Repeat', code: 'repeat' }, smart: { ic: '❓', name: 'If rock: jump, else: forward', code: 'if (rockAhead) jump() else forward()' },
};
export const PALETTE = {
  1: ['up', 'right', 'down', 'left'], 2: ['up', 'right', 'down', 'left'],
  3: ['fwd', 'tl', 'tr'], 4: ['fwd', 'tl', 'tr', 'jump'], 5: ['fwd', 'tl', 'tr', 'jump'],
  6: ['fwd', 'tl', 'tr', 'jump', 'rep'], 7: ['fwd', 'tl', 'tr', 'jump', 'rep'], 8: ['fwd', 'tl', 'tr', 'jump', 'smart', 'rep'], 9: ['fwd', 'tl', 'tr', 'jump', 'smart', 'rep'],
};
export const SIZE = { 1: [5, 5], 2: [5, 5], 3: [6, 6], 4: [6, 6], 5: [6, 6], 6: [7, 7], 7: [7, 7], 8: [7, 7], 9: [7, 7] };
export const SPEED = { slow: 650, normal: 420, fast: 220 };

// ---- simulate a program. rocks: Set of "r,c". Returns {cells (visited path), end, dir, ok, why}
export function flatten(prog, out = []) { prog.forEach(b => { if (b.t === 'rep') { for (let i = 0; i < b.n; i++) flatten(b.kids, out); } else out.push(b.t); }); return out; }
export function countBlocks(prog) { return prog.reduce((s, b) => s + 1 + (b.t === 'rep' ? countBlocks(b.kids) : 0), 0); }
export function codeText(prog, ind = '') { return prog.map(b => (b.t === 'rep' ? `${ind}repeat (${b.n}) {\n${codeText(b.kids, ind + '  ')}\n${ind}}` : ind + BLOCK[b.t].code + ';')).join('\n'); }
/** Run a program without animation. Returns true if Beep reaches the battery. */
export function simulate(prog, p) {
  const rockSet = new Set(p.rocks.map(x => x.join(','))), pathSet = new Set(p.path.map(x => x.join(',')));
  let pos = p.start.slice(), dir = p.dir;
  for (const op of flatten(prog)) {
    if (op === 'tl' || op === 'tr') { dir = (dir + (op === 'tr' ? 1 : 3)) % 4; continue; }
    let d = dir; if (BLOCK[op].abs !== undefined) { d = BLOCK[op].abs; dir = d; }
    const ahead = [pos[0] + DV[d][0], pos[1] + DV[d][1]], rock = rockSet.has(ahead.join(','));
    const jump = op === 'jump' || (op === 'smart' && rock);
    if (!jump && rock) return false;
    pos = jump ? [ahead[0] + DV[d][0], ahead[1] + DV[d][1]] : ahead;
    if (!pathSet.has(pos.join(','))) return false;
    if (pos.join(',') === p.goal.join(',')) return true;
  }
  return false;
}
/** Put one bug in a working program (for Debug It!). */
export function addBug(sol, p) {
  for (let t = 0; t < 40; t++) {
    const prog = JSON.parse(JSON.stringify(sol)), i = rand(0, prog.length - 1), b = prog[i];
    const kind = rand(0, 3);
    if (kind === 0 && (b.t === 'tl' || b.t === 'tr')) b.t = b.t === 'tl' ? 'tr' : 'tl';
    else if (kind === 1 && b.t === 'fwd' && prog.length > 2) prog.splice(i, 1);
    else if (kind === 2 && b.t === 'jump') b.t = 'fwd';
    else if (kind === 3) prog.splice(i, 0, { t: pick(['fwd', 'tl', 'tr']) });
    else continue;
    if (!simulate(prog, p)) return prog;
  }
  return null;
}
export function progText(prog) { return prog.map(b => (b.t === 'rep' ? `Repeat ${b.n} [${progText(b.kids)}]` : BLOCK[b.t].name)).join(', '); }

/** Make a path by running a solution program on an empty, big board. Decides rocks as it goes. */
function trace(ops, startDir, opts = {}) {
  let r = 0, c = 0, d = startDir;
  const cells = [[0, 0]], rocks = [], seen = new Set(['0,0']);
  for (const op of ops) {
    if (op in { up: 1, right: 1, down: 1, left: 1 }) d = BLOCK[op].abs;
    if (op === 'tl') { d = (d + 3) % 4; continue; }
    if (op === 'tr') { d = (d + 1) % 4; continue; }
    let jump = op === 'jump' || (op === 'smart' && chance(opts.rockChance ?? 0.45));
    if (op === 'smart' && opts.forceRock !== undefined) jump = opts.forceRock;
    if (jump) {
      const rr = r + DV[d][0], rc = c + DV[d][1];
      rocks.push([rr, rc]);
      if (seen.has(`${rr},${rc}`)) return null;
      seen.add(`${rr},${rc}`); cells.push([rr, rc]);
      r = rr + DV[d][0]; c = rc + DV[d][1];
    } else { r += DV[d][0]; c += DV[d][1]; }
    const k = `${r},${c}`; if (seen.has(k)) return null;
    seen.add(k); cells.push([r, c]);
  }
  return { cells, rocks, end: [r, c] };
}

function makeSolution(level) {
  const segs = (n, maxLen, rocks) => {
    const out = []; let d = null;
    for (let i = 0; i < n; i++) {
      if (i) out.push(chance(0.5) ? 'tl' : 'tr');
      let len = rand(1, maxLen);
      while (len > 0) { if (rocks && len >= 2 && chance(0.35)) { out.push('jump'); len -= 2; } else { out.push('fwd'); len--; } }
    }
    return out;
  };
  if (level === 1) { const d = pick(['up', 'right', 'down', 'left']); return { prog: Array.from({ length: rand(2, 3) }, () => ({ t: d })), dir: 0 }; }
  if (level === 2) {
    const prog = []; let d = rand(0, 3);
    for (let s = 0; s < rand(2, 3); s++) { const k = ['up', 'right', 'down', 'left'][d]; for (let i = 0; i < rand(1, 2); i++) prog.push({ t: k }); d = (d + (chance(0.5) ? 1 : 3)) % 4; }
    return { prog, dir: 0 };
  }
  if (level === 3) return { prog: segs(rand(2, 3), 2, false).map(t => ({ t })), dir: rand(0, 3) };
  if (level === 4) return { prog: segs(rand(2, 3), 3, true).map(t => ({ t })), dir: rand(0, 3), needJump: true };
  if (level === 5) return { prog: segs(rand(3, 4), 3, true).map(t => ({ t })), dir: rand(0, 3) };
  if (level === 6) {
    const v = rand(0, 2);
    if (v === 0) { const n = rand(4, 6); return { prog: [{ t: 'rep', n, kids: [{ t: 'fwd' }] }], dir: rand(0, 3), limit: 2 }; }
    if (v === 1) { const n = rand(2, 3); return { prog: [{ t: 'rep', n, kids: [{ t: 'fwd' }, { t: 'fwd' }, { t: 'tr' }] }], dir: rand(0, 3), limit: 4 }; }
    const n = rand(3, 4); return { prog: [{ t: 'rep', n, kids: [{ t: 'fwd' }, { t: 'tl' }, { t: 'fwd' }, { t: 'tr' }] }], dir: rand(0, 3), limit: 5 };
  }
  if (level === 7) {
    const bodies = [[['fwd', 'tr', 'fwd', 'tl'], [3, 4]], [['fwd', 'fwd', 'tl'], [2, 3]], [['jump', 'fwd'], [2, 3]], [['fwd', 'jump', 'tr'], [2, 3]], [['fwd', 'tl', 'fwd', 'tr', 'fwd'], [2, 2]]];
    const [b, [lo, hi]] = pick(bodies), n = rand(lo, hi);
    const pre = chance(0.4) ? [{ t: 'fwd' }] : [];
    return { prog: [...pre, { t: 'rep', n, kids: b.map(t => ({ t })) }], dir: rand(0, 3), limit: pre.length + 1 + b.length };
  }
  if (level === 8) { const n = rand(5, 7); return { prog: [{ t: 'rep', n, kids: [{ t: 'smart' }] }], dir: rand(0, 3), limit: 2, smart: true }; }
  const turn = chance(0.5) ? 'tr' : 'tl';
  const n = rand(2, 3), k = rand(2, 3);
  return { prog: [{ t: 'rep', n, kids: [...Array.from({ length: k }, () => ({ t: 'smart' })), { t: turn }] }], dir: rand(0, 3), limit: k + 2, smart: true };
}

export function makePuzzle(level) {
  const [R, C] = SIZE[level];
  for (let a = 0; a < 200; a++) {
    const sol = makeSolution(level);
    const ops = flatten(sol.prog);
    const tr = trace(ops, sol.dir, { rockChance: 0.45 });
    if (!tr) continue;
    if (sol.needJump && !tr.rocks.length) continue;
    if (sol.smart && (tr.rocks.length < 1 || tr.rocks.length > ops.filter(o => o === 'smart').length - 1)) continue;
    const rs = tr.cells.map(x => x[0]), cs = tr.cells.map(x => x[1]);
    const h = Math.max(...rs) - Math.min(...rs) + 1, w = Math.max(...cs) - Math.min(...cs) + 1;
    if (h > R || w > C) continue;
    const offR = rand(0, R - h) - Math.min(...rs), offC = rand(0, C - w) - Math.min(...cs);
    const mv = ([r, c]) => [r + offR, c + offC];
    return { R, C, dir: sol.dir, start: mv(tr.cells[0]), goal: mv(tr.end), path: tr.cells.map(mv), rocks: tr.rocks.map(mv), sol: sol.prog, limit: sol.limit || 0, smart: !!sol.smart };
  }
  return null;
}

// ---------------------------------------------------------------- worked steps: think like a programmer
const runs = ops => ops.reduce((a, o) => { const l = a[a.length - 1]; if (l && l[0] === o) l[1]++; else a.push([o, 1]); return a; }, []);
const runText = ops => runs(ops).map(([o, n]) => `${BLOCK[o].name}${n > 1 ? ' ×' + n : ''}`).join(', then ');
export function teach(q) {
  const p = q.p, ops = flatten(p.sol), facing = ['up', 'right', 'down', 'left'][p.dir];
  const S = [q.kind === 'predict' ? 'Put your finger on Beep 🤖. You will move it like the code says.' : 'Find Beep 🤖 and the battery 🔋. Trace the path with your finger first.'];
  if (q.kind === 'predict') {
    S.push(`Beep starts facing ${facing}. Follow the code one block at a time.`);
    if (p.sol.some(b => b.t === 'rep')) S.push('A Repeat block runs the blocks inside it again and again. Count every time around.');
    S.push(`All the moves in order: ${runText(ops)}.`);
    S.push(`Beep stops at row ${p.goal[0] + 1}, column ${p.goal[1] + 1}.`);
    q.steps = S; return q;
  }
  if (q.kind === 'debug') S.push('Run the buggy code and watch where Beep goes wrong. The wrong block is right where Beep first leaves the path.');
  if (q.abs) S.push(`Count the squares in each direction: ${runText(ops)}.`);
  else {
    S.push(`Beep is facing ${facing}. "Forward" moves the way Beep faces. Turns don't move Beep, they only change the way it faces.`);
    if (ops.includes('jump')) S.push('A rock is in the way? Use Jump to hop over it.');
    if (ops.includes('smart')) S.push('The ❓ if/else block checks each square: IF a rock is ahead, jump; ELSE, step forward. One block handles both!');
    S.push(`Step by step: ${runText(ops)}.`);
  }
  const rep = p.sol.find(b => b.t === 'rep');
  if (rep) S.push(`Spot the pattern: "${progText(rep.kids)}" happens ${rep.n} times, so put it inside Repeat ${rep.n}. Loops make code short!`);
  S.push(`One program that works: ${progText(p.sol)}.`);
  q.steps = S; return q;
}

export function makeQ(level) {
    const g = GEN[level];
    const p = makePuzzle(g) || makePuzzle(Math.max(1, g - 1));
    const abs = g <= 2;
    const lim = p.limit ? ` Use ${p.limit} blocks or fewer.` : '';
    const key = 'b' + level + p.path.map(x => x.join('.')).join('-');
    if (level === 5) return { kind: 'predict', key, p, abs, g, mode: 'bot', prompt: 'Read Beep’s code. Where will Beep stop? Tap that square!', expected: `row ${p.goal[0] + 1}, column ${p.goal[1] + 1}`, explain: 'Reading code and predicting what it does is how programmers check their work before running it.' };
    if (level === 6) {
      const bug = addBug(p.sol, p);
      if (bug) return { kind: 'debug', key, p, abs, g, bug, mode: 'bot', tries: 3, prompt: 'Beep’s code has a BUG — one block is wrong. Run it to see what happens, then fix it!', expected: progText(p.sol), explain: 'Finding and fixing mistakes in code is called DEBUGGING. Every programmer does it every day!' };
    }
    return {
      key, p, abs, g, mode: 'bot', tries: 3,
      prompt: (abs ? 'Tap the arrows to get Beep to the battery 🔋, then tap Run.' : g === 3 ? 'Beep moves the way it is facing. Use Forward and Turn blocks to reach the battery 🔋.' : g >= 8 ? `Use the ❓ if/else block — IF there is a rock, jump, ELSE step forward.${lim}` : g >= 6 ? `Use a 🔁 Repeat block (a loop) to make your code short!${lim}` : 'Program Beep to reach the battery 🔋. Jump over the rocks!'),
      expected: progText(p.sol),
    };
  }

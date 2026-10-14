// =====================================================================
// MATH CURRICULUM  (Kindergarten -> 4th grade)
// Every generator returns an "item" the door/gate shows.
// =====================================================================

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

const NAMES = ['Sparkle', 'Pip', 'Daisy', 'Button', 'Luna'];
const THINGS = [['jelly bean', 'jelly beans'], ['balloon', 'balloons'], ['rainbow', 'rainbows'], ['cupcake', 'cupcakes'], ['flower', 'flowers'],
  ['gumdrop', 'gumdrops'], ['lollipop', 'lollipops'], ['seashell', 'seashells'], ['cookie', 'cookies'], ['star', 'stars']];
const PLACES = ['the meadow', 'the garden', 'the beach', 'the castle', 'the clouds', 'the pond'];

function two(a) { let n1 = pick(NAMES), n2; do { n2 = pick(NAMES); } while (n2 === n1); return [n1, n2]; }

// ------------------------------------------------------------------
function addItem(level, a, b) {
  return { track: 'math', level, kind: 'add', a, b, op: '+', answer: a + b, key: `${a}+${b}`,
    text: `${a} + ${b} = ?`, say: `What is ${a} plus ${b}?` };
}
function subItem(level, a, b) {
  return { track: 'math', level, kind: 'sub', a, b, op: '-', answer: a - b, key: `${a}-${b}`,
    text: `${a} − ${b} = ?`, say: `What is ${a} minus ${b}?` };
}
function mulItem(level, a, b, groups = false) {
  return { track: 'math', level, kind: 'mul', a, b, op: '×', answer: a * b, key: `${a}x${b}`,
    text: groups ? `${a} groups of ${b} = ?` : `${a} × ${b} = ?`,
    say: groups ? `What is ${a} groups of ${b}?` : `What is ${a} times ${b}?` };
}
function divItem(level, a, b) {
  return { track: 'math', level, kind: 'div', a, b, op: '÷', answer: a / b, key: `${a}/${b}`,
    text: `${a} ÷ ${b} = ?`, say: `What is ${a} divided by ${b}?` };
}

// ---------------- word problems ----------------
function wordAdd(level, a, b) {
  const [n1, n2] = two(); const [s, p] = pick(THINGS);
  const t = pick([
    { story: `${n1} has ${a} ${a === 1 ? s : p}. ${n2} gives ${n1} ${b} more. How many ${p} does ${n1} have now?`, clue: 'more' },
    { story: `${n1} found ${a} ${a === 1 ? s : p} in ${pick(PLACES)} and ${b} ${b === 1 ? s : p} by the rainbow. How many ${p} did ${n1} find in all?`, clue: 'in all' },
    { story: `There are ${a} ${a === 1 ? s : p} on a table. ${n1} puts ${b} more on the table. How many ${p} are on the table altogether?`, clue: 'altogether' },
  ]);
  return { track: 'math', level, kind: 'word', story: t.story, clue: t.clue, unit: p, answer: a + b, key: t.story,
    steps: [{ op: '+', a, b, ans: a + b }], text: t.story, say: t.story };
}
function wordSub(level, a, b) {
  const [n1, n2] = two(); const [s, p] = pick(THINGS);
  const t = pick([
    { story: `${n1} had ${a} ${p}. ${n1} gave ${b} to ${n2}. How many ${p} are left?`, clue: 'left' },
    { story: `There were ${a} ${p} on the table. ${b} fell off. How many ${p} are still on the table?`, clue: 'fell off' },
    { story: `${n1} has ${a} ${p}. ${n2} has ${b} ${p}. How many more ${p} does ${n1} have than ${n2}?`, clue: 'how many more' },
  ]);
  return { track: 'math', level, kind: 'word', story: t.story, clue: t.clue, unit: p, answer: a - b, key: t.story,
    steps: [{ op: '-', a, b, ans: a - b }], text: t.story, say: t.story };
}
function wordMul(level, g, e) {
  const [s, p] = pick(THINGS);
  const story = `There are ${g} tables. Each table has ${e} ${e === 1 ? s : p}. How many ${p} are there in all?`;
  return { track: 'math', level, kind: 'word', story, clue: 'each', unit: p, answer: g * e, key: story,
    steps: [{ op: '×', a: g, b: e, ans: g * e }], text: story, say: story };
}
function wordDiv(level, total, g) {
  const n1 = pick(NAMES); const [s, p] = pick(THINGS);
  const story = `${n1} has ${total} ${p} to share equally with ${g} friends. How many ${p} does each friend get?`;
  return { track: 'math', level, kind: 'word', story, clue: 'share equally', unit: p, answer: total / g, key: story,
    steps: [{ op: '÷', a: total, b: g, ans: total / g }], text: story, say: story };
}
function word2Step(level, max) {
  const n1 = pick(NAMES); const [s, p] = pick(THINGS);
  const a = ri(Math.floor(max / 4), Math.floor(max / 2)), b = ri(2, Math.floor(max / 3)), c = ri(2, a + b - 1);
  const story = `${n1} had ${a} ${p}. ${n1} found ${b} more, then gave away ${c}. How many ${p} does ${n1} have now?`;
  const ans = a + b - c;
  return { track: 'math', level, kind: 'word', story, clue: 'more, then gave away', unit: p, answer: ans, key: story,
    steps: [{ op: '+', a, b, ans: a + b }, { op: '-', a: a + b, b: c, ans }], text: story, say: story };
}
function wordMulAdd(level) {
  const g = ri(2, 6), e = ri(2, 9), extra = ri(2, 15); const [s, p] = pick(THINGS);
  const story = `There are ${g} boxes with ${e} ${p} in each box. Sparkle adds ${extra} more ${p}. How many ${p} are there in all?`;
  return { track: 'math', level, kind: 'word', story, clue: 'in each, then more', unit: p, answer: g * e + extra, key: story,
    steps: [{ op: '×', a: g, b: e, ans: g * e }, { op: '+', a: g * e, b: extra, ans: g * e + extra }], text: story, say: story };
}

// ------------------------------------------------------------------
export const MATH_LEVELS = [
  { n: 1, name: 'Counting to 5', grade: 'K', gen: L => { const n = ri(1, 5); return { track: 'math', level: L, kind: 'count', n, answer: n, key: 'count' + n, text: 'How many?', say: 'How many lights do you see? Count them!' }; } },
  { n: 2, name: 'Adding to 5', grade: 'K', gen: L => { const a = ri(1, 4); return addItem(L, a, ri(1, 5 - a)); } },
  { n: 3, name: 'Subtracting from 5', grade: 'K', gen: L => { const a = ri(2, 5); return subItem(L, a, ri(1, a)); } },
  { n: 4, name: 'Adding to 10', grade: 'K-1', gen: L => { const a = ri(1, 8); return addItem(L, a, ri(1, 10 - a)); } },
  { n: 5, name: 'Subtracting from 10', grade: '1', gen: L => { const a = ri(4, 10); return subItem(L, a, ri(1, a - 1)); } },
  { n: 6, name: 'Missing Number', grade: '1', gen: L => { const t = ri(4, 10), a = ri(1, t - 1);
      return { track: 'math', level: L, kind: 'missing', a, total: t, answer: t - a, key: `${a}+?=${t}`, text: `${a} + ? = ${t}`, say: `${a} plus what number makes ${t}?` }; } },
  { n: 7, name: 'Adding to 20', grade: '1', gen: L => { const a = ri(5, 12); return addItem(L, a, ri(3, Math.min(9, 20 - a))); } },
  { n: 8, name: 'Subtracting from 20', grade: '1', gen: L => { const a = ri(11, 20); return subItem(L, a, ri(2, 9)); } },
  { n: 9, name: 'Tens and Ones', grade: '1-2', gen: L => {
      const r = Math.random();
      if (r < 0.5) { const t = ri(1, 9), o = ri(0, 9); return { track: 'math', level: L, kind: 'place', mode: 'build', tens: t, ones: o, answer: t * 10 + o, key: `pv${t}${o}`, text: `${t} tens and ${o} ones = ?`, say: `What number is ${t} tens and ${o} ones?` }; }
      const n = ri(11, 89); const more = r < 0.75;
      return { track: 'math', level: L, kind: 'place', mode: more ? 'more' : 'less', n, answer: more ? n + 10 : n - 10, key: `pv${more ? '+' : '-'}${n}`,
        text: `10 ${more ? 'more' : 'less'} than ${n} = ?`, say: `What is 10 ${more ? 'more' : 'less'} than ${n}?` }; } },
  { n: 10, name: '2-Digit Adding', grade: '2', gen: L => { const a1 = ri(1, 7), b1 = ri(1, 8 - a1), a0 = ri(0, 8), b0 = ri(0, 9 - a0); return addItem(L, a1 * 10 + a0, b1 * 10 + b0); } },
  { n: 11, name: '2-Digit Subtracting', grade: '2', gen: L => { const a1 = ri(3, 9), b1 = ri(1, a1 - 1), a0 = ri(1, 9), b0 = ri(0, a0); return subItem(L, a1 * 10 + a0, b1 * 10 + b0); } },
  { n: 12, name: 'Story Problems', grade: '2', gen: L => Math.random() < 0.5 ? (() => { const a = ri(3, 12); return wordAdd(L, a, ri(2, 20 - a)); })() : (() => { const a = ri(8, 20); return wordSub(L, a, ri(2, a - 2)); })() },
  { n: 13, name: 'Adding with Carrying', grade: '2', gen: L => { const a1 = ri(1, 6), b1 = ri(1, 7 - a1), a0 = ri(2, 9), b0 = ri(10 - a0, 9); return addItem(L, a1 * 10 + a0, b1 * 10 + b0); } },
  { n: 14, name: 'Subtracting with Borrowing', grade: '2', gen: L => { const a1 = ri(3, 9), b1 = ri(1, a1 - 1), a0 = ri(0, 7), b0 = ri(a0 + 1, 9); return subItem(L, a1 * 10 + a0, b1 * 10 + b0); } },
  { n: 15, name: 'Equal Groups', grade: '2', gen: L => mulItem(L, ri(2, 5), pick([2, 5, 10]), true) },
  { n: 16, name: 'Times Tables 2-5', grade: '3', gen: L => mulItem(L, ri(2, 5), ri(1, 10)) },
  { n: 17, name: 'Times Tables 6-10', grade: '3', gen: L => mulItem(L, ri(6, 10), ri(2, 10)) },
  { n: 18, name: 'Dividing', grade: '3', gen: L => { const b = ri(2, 10), q = ri(1, 10); return divItem(L, b * q, b); } },
  { n: 19, name: 'Story Problems 2', grade: '3', gen: L => { const r = Math.random();
      if (r < 0.35) return wordMul(L, ri(2, 6), ri(2, 10));
      if (r < 0.65) { const g = ri(2, 6); return wordDiv(L, g * ri(2, 8), g); }
      return word2Step(L, 40); } },
  { n: 20, name: '3-Digit Add & Subtract', grade: '3', gen: L => { if (Math.random() < 0.5) { const a = ri(105, 650); return addItem(L, a, ri(105, 980 - a)); } const a = ri(300, 999); return subItem(L, a, ri(101, a - 100)); } },
  { n: 21, name: 'Big Times', grade: '4', gen: L => mulItem(L, ri(12, 49), ri(2, 9)) },
  { n: 22, name: 'Fractions of a Group', grade: '3-4', gen: L => { const d = pick([2, 3, 4, 5]), k = (d === 2 || Math.random() < 0.7) ? 1 : ri(2, d - 1), m = d * ri(2, 6);
      return { track: 'math', level: L, kind: 'frac', num: k, den: d, total: m, answer: (m / d) * k, key: `${k}/${d}of${m}`, text: `${k}/${d} of ${m} = ?`, say: `What is ${fracWords(k, d)} of ${m}?` }; } },
  { n: 23, name: 'Multi-Step Problems', grade: '4', gen: L => Math.random() < 0.5 ? word2Step(L, 200) : wordMulAdd(L) },
];

export function fracWords(k, d) {
  const names = { 2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['fourth', 'fourths'], 5: ['fifth', 'fifths'] };
  if (d === 2 && k === 1) return 'one half';
  return `${k === 1 ? 'one' : k} ${k === 1 ? names[d][0] : names[d][1]}`;
}

export function mathItem(level, recent = []) {
  const L = MATH_LEVELS[Math.max(0, Math.min(MATH_LEVELS.length - 1, level - 1))];
  let it; for (let i = 0; i < 10; i++) { it = L.gen(level); if (!recent.includes(it.key)) break; }
  return it;
}

// The Rainbow Gate always uses a story problem so she practices problem-solving every stage
export function exitProblem(mathLevel) {
  if (mathLevel < 12) {
    const add = Math.random() < 0.5;
    const max = mathLevel < 5 ? 5 : 10;
    if (add) { const a = ri(1, max - 1); return { ...wordAdd(mathLevel, a, ri(1, max - a)), exit: true }; }
    const a = ri(3, max); return { ...wordSub(mathLevel, a, ri(1, a - 1)), exit: true };
  }
  const L = mathLevel >= 23 ? 23 : mathLevel >= 19 ? 19 : 12;
  return { ...MATH_LEVELS[L - 1].gen(mathLevel), exit: true, level: mathLevel };
}

export const FLASHLIGHT_STEPS = [
  { icon: '🌈', title: 'Look closely', text: 'Read the problem. Read it again!' },
  { icon: '🔢', title: 'Find the numbers', text: 'What numbers do we know?' },
  { icon: '❓', title: 'What is the question?', text: 'What are we trying to find out?' },
  { icon: '🗺️', title: 'Make a plan', text: 'Look for clue words. Add, subtract, groups, or share? You can draw it!' },
  { icon: '✏️', title: 'Solve it', text: 'Do the math one step at a time.' },
  { icon: '✅', title: 'Check it', text: 'Does the answer make sense?' },
];

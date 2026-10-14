// Bee Smart skills: two ladders that grow by grade.
//  📖 LIT  = letters, sounds, ABC order, spelling, word parts. Uses the engine's level (kid's "Reads at" grade).
//            Must match BeeSmart::LEVELS.
//  🔢 MATH = counting → add/subtract → multiply/divide. Its own ladder in extra.math (kid's "Does math at" grade).
//            Must match BeeSmart::MATH_LEVELS. Logged as level 100 + n on the 'math' track.
// Every item is plain data (it can be saved and asked again later for spaced review).
import { rand, pick, shuffle } from '../_play/play.js';
import { BEE } from './words.js';
import { PICS, CVC } from './data.js';

export const LIT = [
  null,
  { name: 'Letter Names', g: 0 }, { name: 'ABC Order', g: 0 }, { name: 'Letter Sounds', g: 0 },
  { name: 'Big & Little Letters', g: 1 }, { name: 'Build Short Words', g: 1 }, { name: 'Blends & Digraphs', g: 1 },
  { name: 'Spelling Bee: Grade 2', g: 2 }, { name: 'ABC Order of Words', g: 2 },
  { name: 'Spelling Bee: Grade 3', g: 3 }, { name: 'Prefixes & Suffixes', g: 3 },
  { name: 'Spelling Bee: Grade 4', g: 4 }, { name: 'More Word Parts', g: 4 },
  { name: 'Spelling Bee: Grade 5', g: 5 }, { name: 'Greek & Latin Roots', g: 5 },
];
export const MATH = [
  null,
  { name: 'Count to 10', g: 0 }, { name: 'Count to 20', g: 0 }, { name: 'Add Within 5', g: 0 }, { name: 'Take Away Within 5', g: 0 },
  { name: 'Add Within 10', g: 1 }, { name: 'Subtract Within 10', g: 1 }, { name: 'Tens & Ones', g: 1 },
  { name: 'Add Within 20', g: 2 }, { name: 'Subtract Within 20', g: 2 }, { name: 'Skip Counting', g: 2 }, { name: 'Add & Subtract to 100', g: 2 },
  { name: 'Equal Groups', g: 3 }, { name: 'Times Tables', g: 3 }, { name: 'Share Equally', g: 3 },
  { name: 'Big Add & Subtract', g: 4 }, { name: 'Multiply Big Numbers', g: 4 }, { name: 'Divide with Remainders', g: 4 },
  { name: 'Multiply 2-Digit by 2-Digit', g: 5 }, { name: 'Long Division', g: 5 }, { name: 'Two-Step Word Problems', g: 5 },
];
export const MATH_MAX = MATH.length - 1;
export const LIT_MAX = LIT.length - 1;
/** First math level for a grade key ('PK','K','1'..'8'). */
export function mathStart(grade) {
  const g = grade === 'K' || grade === 'PK' || grade == null || grade === '' ? 0 : Math.min(5, parseInt(grade, 10) || 0);
  for (let i = 1; i <= MATH_MAX; i++) if (MATH[i].g === g) return i;
  return 1;
}

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export const NUMWORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
/** How the narrator says each letter's sound (speech engines read these well). */
export const SOUNDS = { A: 'ah', B: 'buh', C: 'kuh', D: 'duh', E: 'eh', F: 'fff', G: 'guh', H: 'huh', I: 'ih', J: 'juh', K: 'kuh', L: 'lll', M: 'mmm', N: 'nnn', O: 'aw', P: 'puh', Q: 'kwuh', R: 'rrr', S: 'sss', T: 'tuh', U: 'uh', V: 'vvv', W: 'wuh', X: 'ks', Y: 'yuh', Z: 'zzz' };
const firstPic = l => (PICS[l.toLowerCase()] || [['', '']])[0];

// ---------------------------------------------------------------- word data
const DIGRAPH = [
  ['🚢', 'ship', ['sh', 'i', 'p']], ['🐟', 'fish', ['f', 'i', 'sh']], ['🍽️', 'dish', ['d', 'i', 'sh']], ['🏪', 'shop', ['sh', 'o', 'p']],
  ['', 'chin', ['ch', 'i', 'n']], ['', 'chip', ['ch', 'i', 'p']], ['', 'thin', ['th', 'i', 'n']], ['🛁', 'bath', ['b', 'a', 'th']],
  ['🦆', 'duck', ['d', 'u', 'ck']], ['🧦', 'sock', ['s', 'o', 'ck']], ['🐸', 'frog', ['f', 'r', 'o', 'g']], ['🦀', 'crab', ['c', 'r', 'a', 'b']],
  ['🚩', 'flag', ['f', 'l', 'a', 'g']], ['🛷', 'sled', ['s', 'l', 'e', 'd']], ['🥁', 'drum', ['d', 'r', 'u', 'm']], ['🏊', 'swim', ['s', 'w', 'i', 'm']],
  ['🛑', 'stop', ['s', 't', 'o', 'p']], ['👏', 'clap', ['c', 'l', 'a', 'p']], ['', 'snap', ['s', 'n', 'a', 'p']], ['', 'shell', ['sh', 'e', 'll']],
];
// [whole, [parts], meaning prompt, which parts are given]
const AFFIX3 = [
  ['unhappy', ['un', 'happy'], 'means NOT happy'], ['unlock', ['un', 'lock'], 'means to open a lock'], ['redo', ['re', 'do'], 'means do it AGAIN'],
  ['reread', ['re', 'read'], 'means read it AGAIN'], ['preheat', ['pre', 'heat'], 'means heat it BEFORE'], ['dislike', ['dis', 'like'], 'means NOT like'],
  ['helpful', ['help', 'ful'], 'means FULL of help'], ['careful', ['care', 'ful'], 'means FULL of care'], ['fearless', ['fear', 'less'], 'means WITHOUT fear'],
  ['homeless', ['home', 'less'], 'means WITHOUT a home'], ['teacher', ['teach', 'er'], 'means a person who TEACHES'], ['quickly', ['quick', 'ly'], 'means in a quick WAY'],
  ['unfair', ['un', 'fair'], 'means NOT fair'], ['refill', ['re', 'fill'], 'means fill AGAIN'], ['painless', ['pain', 'less'], 'means WITHOUT pain'],
];
const CH3 = ['un', 're', 'pre', 'dis', 'ful', 'less', 'er', 'ly'];
const AFFIX4 = [
  ['enjoyment', ['enjoy', 'ment'], 'means the feeling of enjoying'], ['movement', ['move', 'ment'], 'means the act of moving'], ['kindness', ['kind', 'ness'], 'means being kind'],
  ['darkness', ['dark', 'ness'], 'means being dark'], ['dangerous', ['danger', 'ous'], 'means FULL of danger'], ['joyous', ['joy', 'ous'], 'means FULL of joy'],
  ['misspell', ['mis', 'spell'], 'means spell WRONG'], ['misplace', ['mis', 'place'], 'means put in the WRONG place'], ['nonstop', ['non', 'stop'], 'means WITHOUT stopping'],
  ['overcook', ['over', 'cook'], 'means cook TOO much'], ['readable', ['read', 'able'], 'means ABLE to be read'], ['washable', ['wash', 'able'], 'means ABLE to be washed'],
  ['invention', ['invent', 'ion'], 'means something invented'], ['payment', ['pay', 'ment'], 'means the money you pay'], ['nonfiction', ['non', 'fiction'], 'means NOT made up'],
];
const CH4 = ['ment', 'ness', 'ous', 'mis', 'non', 'over', 'able', 'ion'];
const ROOTS = [
  ['telescope', ['tele', 'scope'], 'tele = far, scope = see: a tool to SEE FAR'], ['microscope', ['micro', 'scope'], 'micro = small, scope = see: a tool to SEE SMALL things'],
  ['telephone', ['tele', 'phone'], 'tele = far, phone = sound: SOUND from FAR away'], ['microphone', ['micro', 'phone'], 'micro = small, phone = sound: makes a SMALL SOUND louder'],
  ['biology', ['bio', 'logy'], 'bio = life, logy = study of: the STUDY OF LIFE'], ['geology', ['geo', 'logy'], 'geo = earth, logy = study of: the STUDY OF the EARTH and rocks'],
  ['photograph', ['photo', 'graph'], 'photo = light, graph = write: WRITING with LIGHT (a picture)'], ['autograph', ['auto', 'graph'], 'auto = self, graph = write: WRITING your own name'],
  ['thermometer', ['thermo', 'meter'], 'thermo = heat, meter = measure: MEASURES HEAT'], ['astronaut', ['astro', 'naut'], 'astro = star, naut = sailor: a STAR SAILOR'],
  ['transport', ['trans', 'port'], 'trans = across, port = carry: CARRY ACROSS'], ['portable', ['port', 'able'], 'port = carry, able = can be: CAN BE CARRIED'],
  ['tricycle', ['tri', 'cycle'], 'tri = three, cycle = wheel: THREE WHEELS'], ['bicycle', ['bi', 'cycle'], 'bi = two, cycle = wheel: TWO WHEELS'],
  ['automobile', ['auto', 'mobile'], 'auto = self, mobile = moving: a SELF-MOVING machine'],
];
const CH5 = ['tele', 'micro', 'scope', 'phone', 'bio', 'geo', 'logy', 'photo', 'graph', 'auto', 'thermo', 'meter', 'astro', 'naut', 'trans', 'port', 'able', 'tri', 'bi', 'cycle', 'mobile'];

// ---------------------------------------------------------------- literacy items
/** Make one literacy item at a level. */
export function litItem(lvl) {
  if (lvl === 1) {
    const L = pick(ABC), [ic, w] = firstPic(L);
    return { fam: 'lit', lvl, type: 'board', board: 'upper', ans: [L], slots: [{ show: '?' }], key: 'L' + L,
      say: `Find the letter ${L}. ${L}, like ${w}.`, show: 'Find the letter you hear!', cue: ic ? `${ic} ${w}` : '', why: `That is the letter ${L}${w ? `, like in ${w}` : ''}.` };
  }
  if (lvl === 2) {
    const s = rand(0, 21), seq = ABC.slice(s, s + 5), nb = Math.random() < 0.5 ? 1 : 2;
    const blanks = shuffle([1, 2, 3, 4]).slice(0, nb).sort();
    return { fam: 'lit', lvl, type: 'board', board: 'upper', ans: blanks.map(i => seq[i]), key: 'O' + seq.join(''),
      slots: seq.map((c, i) => (blanks.includes(i) ? { show: '?' } : { fixed: c })),
      say: `Fill in the missing letter${nb > 1 ? 's' : ''}. ${seq.map((c, i) => (blanks.includes(i) ? 'hmm' : c)).join(', ')}.`, show: 'What letter is missing?',
      why: `In ABC order: ${seq.join(', ')}.` };
  }
  if (lvl === 3) {
    const L = pick(ABC.filter(c => c !== 'X' && c !== 'Q')), [ic, w] = firstPic(L);
    return { fam: 'lit', lvl, type: 'board', board: 'upper', ans: [L], slots: [{ show: '?' }], key: 'S' + L,
      say: `Which letter makes the sound ${SOUNDS[L]}? ${SOUNDS[L]}, like ${w}.`, show: `${ic} Which letter says “${SOUNDS[L]}”?`, cue: `${ic} ${w}`, pic: ic,
      why: `${L} says ${SOUNDS[L]}. ${SOUNDS[L]}… ${w}!` };
  }
  if (lvl === 4) {
    const L = pick(ABC), up = Math.random() < 0.5;
    return up
      ? { fam: 'lit', lvl, type: 'board', board: 'lower', ans: [L.toLowerCase()], slots: [{ show: '?' }], key: 'C' + L, big: L,
          say: `This is big ${L}. Find the little ${L}.`, show: `Big <b>${L}</b> → find little`, why: `${L} and ${L.toLowerCase()} are the same letter.` }
      : { fam: 'lit', lvl, type: 'board', board: 'upper', ans: [L], slots: [{ show: '?' }], key: 'c' + L, big: L.toLowerCase(),
          say: `This is little ${L}. Find the big ${L}.`, show: `Little <b>${L.toLowerCase()}</b> → find BIG`, why: `${L.toLowerCase()} and ${L} are the same letter.` };
  }
  if (lvl === 5) {
    const [ic, w] = pick(CVC);
    return spellItem(lvl, w, w.split(''), { pic: ic, say: `Spell ${w}. ${w.split('').map(c => SOUNDS[c.toUpperCase()]).join(', ')}. ${w}.`, sounds: true });
  }
  if (lvl === 6) {
    const [ic, w, units] = pick(DIGRAPH);
    return spellItem(lvl, w, units, { pic: ic, say: `Spell ${w}. ${w}.`, sounds: true, note: units.some(u => u.length > 1) ? `${units.find(u => u.length > 1)} makes one sound` : 'two letters blend together' });
  }
  if (lvl === 8) {
    const pool = shuffle([...new Set(BEE[1].map(r => r[0]).concat(CVC.map(c => c[1])))]);
    const out = [], sameFirst = Math.random() < 0.3;
    for (const w of pool) { if (out.length >= (sameFirst ? 3 : 4)) break; if (!out.some(o => o[0] === w[0])) out.push(w); }
    if (sameFirst) { const mate = pool.find(w => !out.includes(w) && out.some(o => o[0] === w[0])); out.push(mate || pool.find(w => !out.includes(w))); }
    const ans = out.slice().sort();
    return { fam: 'lit', lvl, type: 'order', words: shuffle(out), ans, key: 'W' + ans.join(','),
      say: `Put these words in ABC order: ${out.join(', ')}.`, show: 'Tap the words in ABC order!', why: `ABC order: ${ans.join(', ')}. Look at the first letter${sameFirst ? ', then the next letter if they match' : ''}.` };
  }
  if (lvl === 7 || lvl === 9 || lvl === 11 || lvl === 13) {
    const tier = { 7: 1, 9: 2, 11: 3, 13: 4 }[lvl], [w, sentence, meaning] = pick(BEE[tier]);
    return spellItem(lvl, w.toLowerCase(), w.toLowerCase().split(''), { sentence, meaning, say: `Your word is ${w}. ${sentence} ${w}.`, bee: true });
  }
  if (lvl === 10 || lvl === 12) {
    const [w, parts, mean] = pick(lvl === 10 ? AFFIX3 : AFFIX4), chunks = lvl === 10 ? CH3 : CH4;
    const base = parts.find(p => !chunks.includes(p)) || parts[0];
    const ans = parts.filter(p => p !== base);
    return { fam: 'lit', lvl, type: 'board', board: 'chunks', chunks: shuffle(chunks), ans, key: 'A' + w,
      slots: parts.map(p => (p === base ? { fixed: p } : { show: '?' })),
      say: `Build a word that ${mean}. Start with ${base}.`, show: `Build a word that <b>${mean}</b>`, why: `${parts.join(' + ')} = ${w}. It ${mean}.` };
  }
  // 14: roots
  const [w, parts, mean] = pick(ROOTS);
  const extra = shuffle(CH5.filter(c => !parts.includes(c))).slice(0, 6);
  return { fam: 'lit', lvl, type: 'board', board: 'chunks', chunks: shuffle(parts.concat(extra)), ans: parts, key: 'R' + w,
    slots: parts.map(() => ({ show: '?' })), say: `Build the word: ${mean.split(':').pop().trim()}.`, show: `Build the word: <b>${mean.split(':').pop().trim()}</b>`, hintText: mean,
    why: `${mean}. ${parts.join(' + ')} = ${w}.` };
}

function spellItem(lvl, w, units, o) {
  const ans = [], slots = [];
  units.forEach(u => { u.split('').forEach((c, i) => { ans.push(c); slots.push({ show: '', group: u.length > 1 ? (i === 0 ? 'start' : i === u.length - 1 ? 'end' : 'mid') : null, unit: u }); }); });
  return { fam: 'lit', lvl, type: 'board', board: 'lower', ans, slots, units, word: w, key: 'P' + w, spell: true,
    show: o.pic ? `${o.pic} Spell it!` : '🐝 Spell the word you hear!', why: `${w}: ${units.join('-')}.${o.note ? ' ' + o.note[0].toUpperCase() + o.note.slice(1) + '.' : ''}${o.meaning ? ' It means ' + o.meaning + '.' : ''}`, ...o };
}

// ---------------------------------------------------------------- math items
const FR = ['🌸', '🌼', '🌻', '🌷'];
const name = () => pick(['Buzzy', 'Honey', 'Bumble', 'Pip', 'Goldie']);
const real = {
  add: ['Adding helps when you put snacks together in one bowl.', 'When friends join a game, you add to find how many players.', 'Adding is how stores find what you owe.'],
  sub: ['Take away helps you know how many cookies are left after you eat some.', 'Subtracting shows how much money is left after you buy something.', 'Counting down the days to your birthday is subtracting!'],
  count: ['You count snacks, steps, toys and stairs every day.', 'Counting helps you share fairly and set the table.'],
  tens: ['Money works in tens: ten dimes make a dollar!', 'Egg cartons and crayon boxes come in groups too.'],
  skip: ['Counting by 5s is how you read the minutes on a clock!', 'Count shoes by 2s, nickels by 5s and dimes by 10s.'],
  mul: ['Multiplying is fast adding: 4 packs of 6 juice boxes is 24 drinks.', 'Rows of seats, egg cartons and window panes are all arrays.'],
  div: ['Dividing is fair sharing: pizza slices, cards in a game, or treats for friends.', 'Teachers divide the class into equal teams.'],
  big: ['Big numbers show up in prices, distances on a trip and points in games.', 'Shops and bakers do math like this every day.'],
};
export const realMath = k => pick(real[k] || real.add);

/** Make one math item at a math level. ans is a string ("12" or "7 R 2"). */
export function mathItem(lvl) {
  const N = name(), f = pick(FR);
  const mk = (o) => ({ fam: 'math', lvl, type: 'num', key: 'M' + lvl + ':' + o.ans, ...o, ans: String(o.ans) });
  switch (lvl) {
    case 1: case 2: {
      const n = lvl === 1 ? rand(3, 10) : rand(11, 20);
      return mk({ ans: n, model: { kind: 'count', n }, tap: true, real: 'count', say: 'Tap each pollen grain to collect it. Then tell how many!', show: '🌼 Tap every pollen grain, then type how many', why: `There were ${n}. The last number you count tells how many.` });
    }
    case 3: { const a = rand(1, 4), b = rand(1, 5 - a); return mk({ ans: a + b, model: { kind: 'add', a, b }, real: 'add', say: `${N} has ${a} pollen. She finds ${b} more. How many now?`, show: `${a} + ${b} = ?`, why: `${a} and ${b} more makes ${a + b}.` }); }
    case 4: { const a = rand(2, 5), b = rand(1, a); return mk({ ans: a - b, model: { kind: 'sub', a, b }, real: 'sub', say: `${N} had ${a} pollen. The wind blew ${b} away. How many are left?`, show: `${a} − ${b} = ?`, why: `${a} take away ${b} leaves ${a - b}.` }); }
    case 5: { const a = rand(2, 8), b = rand(1, 10 - a); return mk({ ans: a + b, model: { kind: 'add', a, b }, real: 'add', say: `There are ${a} bees on one flower and ${b} on another. How many bees in all?`, show: `${a} + ${b} = ?`, why: `${a} + ${b} = ${a + b}. Start at ${Math.max(a, b)} and count on ${Math.min(a, b)}.` }); }
    case 6: { const a = rand(4, 10), b = rand(1, a - 1); return mk({ ans: a - b, model: { kind: 'sub', a, b }, real: 'sub', say: `The hive had ${a} drops of honey. The bees ate ${b}. How many are left?`, show: `${a} − ${b} = ?`, why: `${a} − ${b} = ${a - b}. Count back ${b} from ${a}.` }); }
    case 7: { const t = rand(1, 9), o = rand(0, 9); return mk({ ans: t * 10 + o, model: { kind: 'tens', t, o }, real: 'tens', say: `The bees bundled pollen into tens. ${t} bundle${t > 1 ? 's' : ''} of ten and ${o} more. How many pollen?`, show: `${t} tens and ${o} ones = ?`, why: `${t} tens is ${t * 10}, plus ${o} is ${t * 10 + o}.` }); }
    case 8: { const a = rand(6, 12), b = rand(3, 20 - a); return mk({ ans: a + b, model: { kind: 'add', a, b }, real: 'add', say: `${N} visited ${a} flowers in the morning and ${b} in the afternoon. How many flowers in all?`, show: `${a} + ${b} = ?`, why: `${a} + ${b} = ${a + b}. Make a ten first: ${a} + ${10 - a} = 10, then add the rest.` }); }
    case 9: { const a = rand(11, 20), b = rand(3, a - 2); return mk({ ans: a - b, model: { kind: 'sub', a, b }, real: 'sub', say: `There were ${a} flowers. A deer ate ${b} of them. How many flowers are left?`, show: `${a} − ${b} = ?`, why: `${a} − ${b} = ${a - b}.` }); }
    case 10: {
      const by = pick([2, 5, 10]), s0 = by * rand(1, by === 10 ? 6 : 8), seq = [0, 1, 2, 3].map(i => s0 + i * by);
      return mk({ ans: s0 + 4 * by, model: { kind: 'line', seq, by }, real: 'skip', say: `Count by ${by}s. ${seq.join(', ')}. What comes next?`, show: `Count by ${by}s: ${seq.join(', ')}, ?`, why: `${seq[3]} + ${by} = ${s0 + 4 * by}.` });
    }
    case 11: {
      if (Math.random() < 0.5) { const a = rand(12, 68), b = rand(11, 99 - a); return mk({ ans: a + b, model: { kind: 'tens2', a, b, op: '+' }, real: 'add', say: `The hive has ${a} worker bees. ${b} new bees hatch. How many bees now?`, show: `${a} + ${b} = ?`, why: `Add tens: ${Math.floor(a / 10) * 10} + ${Math.floor(b / 10) * 10}. Add ones: ${a % 10} + ${b % 10}. Total ${a + b}.` }); }
      const a = rand(40, 99), b = rand(11, a - 5); return mk({ ans: a - b, model: { kind: 'tens2', a, b, op: '−' }, real: 'sub', say: `A beekeeper had ${a} jars of honey and sold ${b}. How many jars are left?`, show: `${a} − ${b} = ?`, why: `${a} − ${b} = ${a - b}.` });
    }
    case 12: { const k = pick([2, 5, 10]), g = rand(2, 9); return mk({ ans: g * k, model: { kind: 'groups', g, k }, real: 'mul', say: `There are ${g} flowers with ${k} pollen on each. How many pollen in all?`, show: `${g} groups of ${k} = ?  (${g} × ${k})`, why: `${g} groups of ${k}: ${Array(g).fill(k).join(' + ')} = ${g * k}.` }); }
    case 13: { const r = rand(2, 10), c = rand(2, 10); return mk({ ans: r * c, model: { kind: 'array', r, c }, real: 'mul', say: `A honeycomb frame has ${r} rows with ${c} cells in each row. How many cells?`, show: `${r} × ${c} = ?`, why: `${r} rows of ${c} = ${r * c}.` }); }
    case 14: { const g = rand(2, 6), k = rand(2, 8), n = g * k; return mk({ ans: k, model: { kind: 'deal', n, g }, real: 'div', say: `${N} has ${n} pollen to share equally with ${g} baby bees. How many does each baby bee get?`, show: `${n} ÷ ${g} = ?`, why: `${n} shared by ${g} is ${k} each, because ${g} × ${k} = ${n}.` }); }
    case 15: {
      if (Math.random() < 0.5) { const a = rand(120, 650), b = rand(100, 349); return mk({ ans: a + b, model: { kind: 'column', a, b, op: '+' }, real: 'big', say: `A beekeeper collected ${a} grams of honey on Monday and ${b} grams on Tuesday. How many grams in all?`, show: `${a} + ${b} = ?`, why: `Line up the places and add ones, tens, then hundreds: ${a + b}.` }); }
      const a = rand(400, 999), b = rand(110, a - 50); return mk({ ans: a - b, model: { kind: 'column', a, b, op: '−' }, real: 'big', say: `The farm had ${a} flowers. ${b} were picked for a market. How many are left?`, show: `${a} − ${b} = ?`, why: `Line up the places and subtract (regroup when you need to): ${a - b}.` });
    }
    case 16: { const a = rand(12, 89), b = rand(3, 9); return mk({ ans: a * b, model: { kind: 'area', a, b }, real: 'mul', say: `Each hive box holds ${a} frames. A beekeeper has ${b} boxes. How many frames?`, show: `${a} × ${b} = ?`, why: `Break it apart: ${Math.floor(a / 10) * 10} × ${b} = ${Math.floor(a / 10) * 10 * b}, ${a % 10} × ${b} = ${(a % 10) * b}. Total ${a * b}.` }); }
    case 17: {
      const d = rand(3, 9), q = rand(3, 12), r = rand(1, d - 1), n = d * q + r;
      return mk({ ans: `${q} R ${r}`, rem: true, model: { kind: 'deal', n, g: d }, real: 'div', say: `${n} bees fly into ${d} hives, the same number in each. How many in each hive, and how many are left over?`, show: `${n} ÷ ${d} = ? R ?`, why: `${d} × ${q} = ${d * q}. ${n} − ${d * q} = ${r} left over. So ${q} R ${r}.` });
    }
    case 18: { const a = rand(12, 49), b = rand(11, 29); return mk({ ans: a * b, model: { kind: 'area2', a, b }, real: 'mul', say: `A field has ${a} rows of sunflowers with ${b} in each row. How many sunflowers?`, show: `${a} × ${b} = ?`, why: `Split both numbers into tens and ones and add the four parts: ${a * b}.` }); }
    case 19: { const d = rand(3, 9), q = rand(21, 99), n = d * q; return mk({ ans: q, model: { kind: 'longdiv', n, d }, real: 'div', say: `${n} jars of honey are packed into ${d} boxes equally. How many jars in each box?`, show: `${n} ÷ ${d} = ?`, why: `Divide, multiply, subtract, bring down. ${n} ÷ ${d} = ${q}.` }); }
    default: {
      const t = rand(0, 2);
      if (t === 0) { const boxes = rand(3, 8), per = rand(4, 12), sold = rand(2, boxes * per - 5); return mk({ ans: boxes * per - sold, model: { kind: 'steps', steps: [`${boxes} × ${per} = ${boxes * per}`, `${boxes * per} − ${sold} = ?`] }, real: 'big', say: `A beekeeper fills ${boxes} boxes with ${per} jars each. She sells ${sold} jars. How many jars are left?`, show: `${boxes} boxes × ${per} jars, sell ${sold}. Left?`, why: `First ${boxes} × ${per} = ${boxes * per}. Then ${boxes * per} − ${sold} = ${boxes * per - sold}.` }); }
      if (t === 1) { const g = rand(3, 8), k = rand(4, 9), more = rand(5, 30); return mk({ ans: g * k + more, model: { kind: 'steps', steps: [`${g} × ${k} = ${g * k}`, `${g * k} + ${more} = ?`] }, real: 'mul', say: `${g} hives each make ${k} jars of honey. Then a new hive makes ${more} more jars. How many jars in all?`, show: `${g} × ${k}, then + ${more} = ?`, why: `${g} × ${k} = ${g * k}, plus ${more} = ${g * k + more}.` }); }
      const kids = rand(3, 8), each = rand(3, 9), total = kids * each + rand(0, 0), cost = rand(2, 5);
      return mk({ ans: total * cost, model: { kind: 'steps', steps: [`${kids} × ${each} = ${total}`, `${total} × $${cost} = ?`] }, real: 'big', say: `${kids} kids each pick ${each} honey sticks. Each honey stick costs ${cost} dollars. How many dollars in all?`, show: `${kids} × ${each} sticks, $${cost} each. Total $?`, why: `${kids} × ${each} = ${total} sticks. ${total} × ${cost} = ${total * cost} dollars.` });
    }
  }
}

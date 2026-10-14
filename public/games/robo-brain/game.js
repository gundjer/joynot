// Robo Brain: you are the teacher of Robo, a robot pet that REALLY learns from you. Sort the training cards into
// Robo's boxes, then watch the sorting race: Robo sorts brand-new cards using only what you taught it.
// Wrong labels or missing examples make Robo wrong, so you debug the data, build Robo's decision tree,
// pick how sure Robo must be before it answers, write clear prompts and tune a real neuron's weights.
// Levels (must match app/Games/RoboBrain.php):
// 1 What Is AI? · 2 Teach the Robot · 3 Finding Patterns · 4 More Examples, Smarter AI · 5 When AI Makes Mistakes
// 6 Decision Trees · 7 How Sure Is the Robot? · 8 Chatbots & Prompts · 9 Using AI Wisely · 10 Neural Networks
import { startGame, rand, pick, shuffle, clamp, emoji, roundRect, realFrom, playBox, Sfx } from '../_play/play.js';
import { REAL } from '../_joy/js/reallife.js';
import { TASKS, TREE, TREE_ITEMS, QKEY, leafFor, LESSONS } from './data.js';
import { text, panel, button, hand, popups, particles, teach, taskLevel, inBox } from '../_play/kit.js';

// ------------------------------------------------ data
const AI_OR_NOT = [['🗣️', 'voice helper', 1], ['🗺️', 'traffic map app', 1], ['📸', 'face-unlock phone', 1], ['📧', 'spam filter', 1], ['🎵', 'song picker app', 1], ['🌐', 'translation app', 1], ['🚗', 'self-driving car', 1], ['🔦', 'flashlight', 0], ['⏰', 'wind-up clock', 0], ['🧮', 'calculator', 0], ['💡', 'light switch', 0], ['🎈', 'balloon', 0], ['📖', 'paper book', 0], ['🚪', 'door lock & key', 0]];
const WISE = [['🔐', 'Tell a chatbot your password', 0], ['🏠', 'Type your home address into an AI app', 0], ['📝', 'Turn in AI writing as your own work', 0], ['📤', 'Share a wild video without checking if it’s real', 0], ['📞', 'Give an AI your phone number', 0],
  ['🧮', 'Ask AI to explain fractions step by step', 1], ['📚', 'Check an AI fact in a book', 1], ['🙋', 'Ask a grown-up when an AI answer seems strange', 1], ['💡', 'Use AI to brainstorm, then write it yourself', 1], ['🗣️', 'Say when you used AI for help', 1]];
// flies-or-swims with sub-groups, so missing examples really fool Robo. features: feathers, wings, mammal, fins, small, water
const VARIED = { a: ['✈️', 'FLIES'], b: ['🌊', 'SWIMS'], items: [['🦅', 'eagle', 'a', [1, 1, 0, 0, 0, 0]], ['🐦', 'robin', 'a', [1, 1, 0, 0, 0, 0]], ['🦉', 'owl', 'a', [1, 1, 0, 0, 0, 0]], ['🦋', 'butterfly', 'a', [0, 1, 0, 0, 1, 0]], ['🐝', 'bee', 'a', [0, 1, 0, 0, 1, 0]], ['🦇', 'bat', 'a', [0, 1, 1, 0, 1, 0]],
  ['🐟', 'fish', 'b', [0, 0, 0, 1, 0, 1]], ['🦈', 'shark', 'b', [0, 0, 0, 1, 0, 1]], ['🐠', 'clownfish', 'b', [0, 0, 0, 1, 0, 1]], ['🐳', 'whale', 'b', [0, 0, 1, 1, 0, 1]], ['🐬', 'dolphin', 'b', [0, 0, 1, 1, 0, 1]], ['🐧', 'penguin', 'b', [1, 1, 0, 0, 0, 1]], ['🐙', 'octopus', 'b', [0, 0, 0, 0, 0, 1]]] };
const PAT = [['AB', [0, 1]], ['AAB', [0, 0, 1]], ['ABB', [0, 1, 1]], ['ABC', [0, 1, 2]], ['AABB', [0, 0, 1, 1]], ['ABAC', [0, 1, 0, 2]]];
const SYM = [['🔴', '🔵', '⚫'], ['⭐', '🌙', '☁️'], ['🐶', '🐱', '🐭'], ['🍎', '🍌', '🍇'], ['🔺', '🔷', '⚪'], ['❤️', '💙', '💚']];
const PROMPTS = [
  { ask: 'Mia: “I need a short poem about octopuses for my 2nd grade class. Just 4 lines!”', want: { what: 'a poem', about: 'octopuses', who: 'a 2nd grader', len: '4 lines' }, out: 'Eight wiggly arms go swish and sway,\nAn octopus hides in the reef all day…' },
  { ask: 'Leo: “Give me 3 fun facts about volcanoes. I’m in 4th grade.”', want: { what: 'fun facts', about: 'volcanoes', who: 'a 4th grader', len: '3 facts' }, out: '1. Lava can be hotter than 1,000 °C.\n2. Some volcanoes are under the ocean…' },
  { ask: 'Ava: “Write a bedtime story about a sleepy dragon for my little brother. Keep it short, like 5 sentences.”', want: { what: 'a story', about: 'a sleepy dragon', who: 'a little kid', len: '5 sentences' }, out: 'Once upon a time, a dragon named Puff yawned a cloud of smoke…' },
  { ask: 'Sam: “I want a joke about penguins to tell my teacher. Just one!”', want: { what: 'a joke', about: 'penguins', who: 'a teacher', len: '1 joke' }, out: 'Why don’t penguins fly? They’re too cool to leave the ice!' },
  { ask: 'Zoe: “Explain how plants make food, step by step, for a 3rd grader. 4 steps please.”', want: { what: 'an explanation', about: 'how plants make food', who: 'a 3rd grader', len: '4 steps' }, out: 'Step 1: Leaves catch sunlight.\nStep 2: Roots drink water…' },
];
const SLOT = [['what', 'WHAT'], ['about', 'ABOUT'], ['who', 'FOR WHO'], ['len', 'HOW LONG']];
const VAGUE = ['something', 'stuff', 'whatever', 'idk'];
const NEURON = [
  { q: 'Is it a CAT?', clues: [['😺', 'whiskers'], ['🎶', 'meows'], ['🗯️', 'barks']], ex: [['🐱', 'cat', [1, 1, 0], 1], ['🐶', 'dog', [1, 0, 1], 0], ['🐈', 'kitten', [1, 1, 0], 1], ['🐭', 'mouse', [1, 0, 0], 0]] },
  { q: 'Is it a FRUIT?', clues: [['🍬', 'sweet'], ['🌱', 'grows on a plant'], ['🏭', 'made in a factory']], ex: [['🍎', 'apple', [1, 1, 0], 1], ['🍭', 'candy', [1, 0, 1], 0], ['🥕', 'carrot', [0, 1, 0], 0], ['🍓', 'strawberry', [1, 1, 0], 1]] },
  { q: 'Is it a BIRD?', clues: [['🐦', 'feathers'], ['👄', 'beak'], ['🐻', 'fur']], ex: [['🦜', 'parrot', [1, 1, 0], 1], ['🦆', 'duck', [1, 1, 0], 1], ['🦇', 'bat', [0, 0, 1], 0], ['🐢', 'turtle', [0, 1, 0], 0]] },
  { q: 'Is it a DOG?', clues: [['🐾', 'furry'], ['🗯️', 'barks'], ['🎶', 'meows']], ex: [['🐕', 'dog', [1, 1, 0], 1], ['🐈', 'cat', [1, 0, 1], 0], ['🦊', 'fox', [1, 0, 0], 0], ['🐩', 'poodle', [1, 1, 0], 1]] },
];
const FIRE = 3; // neuron fires when the weighted sum is at least 3

/** Robo's brain: nearest neighbour. Each card also carries a tiny "who am I" tag, so a card it saw before is matched exactly. */
function guess(train, item) {
  if (!train.length) return null;
  let best = [], bd = 1e9;
  for (const t of train) { let d = t.f.reduce((s, v, i) => s + (v - item.f[i]) ** 2, 0) + (t.n === item.n ? 0 : 0.25); if (d < bd - 1e-9) { bd = d; best = [t]; } else if (Math.abs(d - bd) < 1e-9) best.push(t); }
  const votes = {}; best.forEach(t => { votes[t.lab] = (votes[t.lab] || 0) + 1; });
  return { lab: Object.keys(votes).sort((a, b) => votes[b] - votes[a])[0], from: best[0] };
}
const card = it => ({ e: it[0], n: it[1], truth: it[2], f: it[3] || [] });

// decision tree: fixed shape, question slots the kid fills
const TQ = ['Does it have feathers?', 'Can it fly?', 'Does it live in water?', 'Does it have fur?'];
const TDECOY = ['Is it big?', 'Is it cute?'];
const TNODES = [{ id: 0, want: TQ[0], yes: 1, no: 2 }, { id: 1, want: TQ[1], yes: 'Flying bird 🦅', no: 'Penguin-type bird 🐧' }, { id: 2, want: TQ[2], yes: 'Fish or sea animal 🐟', no: 3 }, { id: 3, want: TQ[3], yes: 'Furry mammal 🐻', no: 'Reptile 🦎' }];
const LEAVES = ['Flying bird 🦅', 'Penguin-type bird 🐧', 'Fish or sea animal 🐟', 'Furry mammal 🐻', 'Reptile 🦎'];
void TREE;

function makeTask(lv, P) {
  const T = { lv };
  if (lv === 1 || lv === 9) {
    const src = lv === 1 ? AI_OR_NOT : WISE, n = lv === 1 ? 4 : 5, yes = shuffle(src.filter(x => x[2])), no = shuffle(src.filter(x => !x[2])), k = rand(2, n - 2);
    T.mode = 'sort'; T.bins = lv === 1 ? [['🧠', 'Learns from examples (AI)', 1], ['⚙️', 'Same steps every time', 0]] : [['✅', 'Smart & safe', 1], ['🛑', 'Not safe or not honest', 0]];
    T.cards = shuffle([...yes.slice(0, k), ...no.slice(0, n - k)]).map(x => ({ e: x[0], n: x[1], truth: x[2], at: null }));
    T.ask = lv === 1 ? 'Sort the gadgets for Robo! Does it LEARN from examples (that’s AI), or do the same steps every time?' : 'Help Robo learn to use AI wisely! Sort each choice: smart & safe, or not?';
  }
  if (lv === 2) {
    const S = pick(TASKS.filter(t => t !== P.lastSet)); P.lastSet = S; const A = shuffle(S.items.filter(i => i[2] === 'a')), B = shuffle(S.items.filter(i => i[2] === 'b'));
    T.mode = 'train'; T.set = S; T.bins = [[S.a[0], S.a[1], 'a'], [S.b[0], S.b[1], 'b']];
    T.cards = shuffle([...A.slice(0, 2), ...B.slice(0, 2)]).map(x => ({ ...card(x), at: null })); T.test = shuffle([...A.slice(2, 4), ...B.slice(2, 4)]).map(card);
    T.ask = `Teach Robo “${S.name}”! Drag each training card into the right box. Then Robo sorts NEW cards all by itself.`;
  }
  if (lv === 4) {
    const S = VARIED, pool = S.items.map(card), tricky = pick(pool.filter(c => c.n === 'penguin' || c.n === 'bat' || c.n === 'whale'));
    T.mode = 'train'; T.set = S; T.bins = [[S.a[0], S.a[1], 'a'], [S.b[0], S.b[1], 'b']];
    const test = [tricky, ...shuffle(pool.filter(c => c !== tricky && c.n !== 'octopus')).slice(0, 4)];
    T.test = shuffle(test.map(c => ({ ...c }))); T.cards = shuffle([...pool.filter(c => !test.includes(c)), tricky]).map(c => ({ ...c, at: null }));
    T.more = true; T.ask = 'Robo will race on 5 animals, even tricky ones! Teach it with enough DIFFERENT examples so it gets them all right.';
  }
  if (lv === 5) {
    const S = pick(TASKS.filter(t => t !== P.lastSet)); P.lastSet = S; const A = shuffle(S.items.filter(i => i[2] === 'a')), B = shuffle(S.items.filter(i => i[2] === 'b'));
    T.mode = 'train'; T.fix = true; T.set = S; T.bins = [[S.a[0], S.a[1], 'a'], [S.b[0], S.b[1], 'b']];
    T.cards = [...A.slice(0, 3), ...B.slice(0, 3)].map(x => ({ ...card(x), at: x[2] }));
    const bad = pick(T.cards); bad.at = bad.truth === 'a' ? 'b' : 'a'; T.bad = bad;
    T.test = shuffle([card(S.items.find(i => i[1] === bad.n)), ...shuffle([...A.slice(3), ...B.slice(3)]).slice(0, 3).map(card)]);
    T.ask = `Uh-oh! Robo keeps getting the ${bad.n} wrong. Someone put a training card in the wrong box. Find it and fix it, then race again!`;
  }
  if (lv === 3) {
    const [nm, rule] = pick(PAT), sym = shuffle(pick(SYM)).slice(0, Math.max(...rule) + 1), len = rule.length * 2 + 2, seq = Array.from({ length: len + 3 }, (_, i) => sym[rule[i % rule.length]]);
    T.mode = 'pattern'; T.sym = sym; T.seq = seq; T.show = len; T.fill = [null, null, null]; T.rule = nm;
    T.ask = 'Robo found a pattern! What comes next? Tap the shapes to fill the 3 empty spots.';
  }
  if (lv === 6) {
    T.mode = 'tree'; T.slots = [null, null, null, null]; T.tray = shuffle([...TQ, pick(TDECOY)]);
    T.animals = shuffle(TREE_ITEMS).slice(0, 5).map(x => ({ e: x[0], n: x[1], f: x[2] }));
    T.ask = 'Build Robo’s decision tree! Drag a yes-or-no question into each empty box so every animal ends up in the right group.';
  }
  if (lv === 7) {
    const n = 6, wrong = rand(1, 2), cut = rand(5, 7) * 10;
    T.mode = 'sure'; T.items = shuffle(Array.from({ length: n }, (_, i) => { const right = i >= wrong; return { e: pick(['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯']), conf: right ? rand(cut / 5, 19) * 5 : rand(6, cut / 5 - 1) * 5, right }; }));
    T.items.forEach(it => { it.conf = clamp(it.conf, 35, 99); }); T.lo = Math.max(...T.items.filter(i => !i.right).map(i => i.conf)); T.hi = Math.min(...T.items.filter(i => i.right).map(i => i.conf)); T.th = 30; T.need = T.items.filter(i => i.right).length;
    T.ask = `Robo guesses animals and says how SURE it is. Set the “sure enough” line: Robo answers only above it, and asks a person below it. No mistakes, but Robo must answer at least ${T.need} by itself!`;
  }
  if (lv === 8) {
    const R = pick(PROMPTS.filter(p => p !== P.lastP)); P.lastP = R; T.mode = 'prompt'; T.R = R; T.slots = { what: null, about: null, who: null, len: null };
    const others = PROMPTS.filter(p => p !== R), dis = SLOT.map(([k]) => pick(others).want[k]);
    T.chips = shuffle([...SLOT.map(([k]) => ({ t: R.want[k], k })), ...dis.map((t, i) => ({ t, k: SLOT[i][0], wrong: true })), { t: pick(VAGUE), k: 'vague', wrong: true }]).filter((c, i, a) => a.findIndex(d => d.t === c.t) === i);
    T.ask = `${R.ask} Build Robo a clear prompt: drag a chip into each box.`;
  }
  if (lv === 10) {
    const N = pick(NEURON.filter(x => x !== P.lastN)); P.lastN = N; T.mode = 'neuron'; T.N = N; T.w = N.clues.map(() => 0);
    T.ask = `Tune Robo’s neuron for “${N.q}” Each clue has a weight. The neuron lights up when the total is ${FIRE} or more. Make it light up ONLY for the right ones.`;
  }
  return T;
}

function createGame(api) {
  let P = null;
  const pops = popups(), fx = particles();

  function start(o) {
    P = { o, t: 0, n: o.boss ? 5 : o.edition <= 1 ? 3 : 4, done: 0, guidedDone: !!o.boss, phase: 'wait', mood: 0 };
    api.score('🧠 0'); api.progress(0, 'Lessons taught');
    api.goal('🤖 Robo is ready to learn. You are the teacher!', { speak: true });
    setTimeout(() => P && nextTask(), 1100);
  }
  function nextTask() {
    if (P.done >= P.n) { P.phase = 'over'; api.finish({ win: true, title: '🤖 Robo got smarter!', text: `You taught Robo ${P.done} lessons.` }); return; }
    const lv = taskLevel(api, P.o), T = makeTask(lv, P), guided = !P.guidedDone;
    P.T = T; P.phase = 'work'; P.anim = null; P.showSol = guided ? 1 : 0; P.drag = null;
    P.teach = teach(api, { level: lv, guided, prompt: T.ask, expected: T.mode });
    const go = { sort: '✅ Check', train: '🏁 Race!', pattern: '✅ Check', tree: '▶️ Run animals', sure: '▶️ Run', prompt: '💬 Send prompt', neuron: '▶️ Test neuron' }[T.mode];
    api.actions([{ key: 'help', label: '💡 Help' }, { key: 'check', label: go, big: true }]);
    api.goal(`🤖 ${T.ask}`, { speak: false }); api.speak((guided ? "Let's do this one together. " : '') + T.ask.replace(/[“”]/g, ''));
  }

  // ------------------------------------------------ judging
  function race(T) {
    const train = T.cards.filter(c => c.at).map(c => ({ n: c.n, f: c.f, lab: c.at }));
    return T.test.map(t => { const g = guess(train, t); return { t, g: g && g.lab, from: g && g.from, ok: !!g && g.lab === t.truth }; });
  }
  function judge() {
    const T = P.T;
    if (T.mode === 'sort') { if (T.cards.some(c => c.at === null)) return { none: 'Drag every card into a box first.' }; const bad = T.cards.filter(c => c.at !== c.truth); return { ok: !bad.length, bad, why: bad.length ? (T.lv === 1 ? `Look again at the ${bad[0].n}. ${bad[0].truth ? 'It learns from lots of examples, so it uses AI.' : 'It does the same thing every time, so it is not AI.'}` : `“${bad[0].n}” ${bad[0].truth ? 'is a smart, safe way to use AI.' : 'is not safe or not honest.'}`) : '', hint: T.lv === 1 ? 'Ask: does it LEARN from examples to make guesses?' : 'Ask: is it private? Is it honest? Did you check the facts?' }; }
    if (T.mode === 'train') {
      if (!T.more && T.cards.some(c => c.at === null)) return { none: 'Put every training card in a box first.' };
      if (!T.cards.some(c => c.at)) return { none: 'Teach Robo with some cards first.' };
      const res = race(T), wrong = res.filter(r => !r.ok);
      if (!wrong.length) return { ok: true, res };
      const w = wrong[0], lab = l => T.bins.find(b => b[2] === l)[1];
      const mis = T.cards.find(c => c.at && c.at !== c.truth);
      const why = mis ? `Robo learned from YOUR boxes. The ${mis.n} card is in ${lab(mis.at)}, so Robo guessed the ${w.t.n} ${lab(w.g)}. Fix the box!` : T.more ? `Robo never saw an animal like the ${w.t.n}. It looked most like the ${w.from.n}, so Robo guessed ${lab(w.g)}. Teach Robo more DIFFERENT examples!` : `Robo guessed the ${w.t.n} ${lab(w.g)}.`;
      return { ok: false, res, why, hint: mis ? 'Check each card: is it in the right box?' : 'Which kind of animal hasn’t Robo seen yet?' };
    }
    if (T.mode === 'pattern') { if (T.fill.some(f => !f)) return { none: 'Fill all 3 empty spots first.' }; const bad = T.fill.findIndex((f, i) => f !== T.seq[T.show + i]); return { ok: bad < 0, bad, why: bad >= 0 ? `Spot ${bad + 1} doesn’t follow the pattern. Say it out loud from the start and listen for what repeats.` : '', hint: `Find the part that repeats. It’s ${T.rule.length} shapes long.` }; }
    if (T.mode === 'tree') {
      if (T.slots.some(s => !s)) return { none: 'Fill every question box first.' };
      const route = a => { let id = 0, path = []; for (let k = 0; k < 6; k++) { const node = TNODES[id], q = T.slots[id], key = QKEY[q], ans = key ? !!a.f[key] : false; path.push(id); const nx = ans ? node.yes : node.no; if (typeof nx === 'string') return { leaf: nx, path }; id = nx; } return { leaf: null, path }; };
      const res = T.animals.map(a => ({ a, ...route(a), want: leafFor(a.f) })), bad = res.filter(r => r.leaf !== r.want);
      const slotBad = T.slots.findIndex((q, i) => q !== TNODES[i].want);
      return { ok: !bad.length, res, slotBad, why: bad.length ? `The ${bad[0].a.n} ended up in “${bad[0].leaf}”, but it should be “${bad[0].want}”. Look at the question in box ${slotBad + 1}.` : '', hint: 'Read the groups under each box. What question splits them?' };
    }
    if (T.mode === 'sure') { const ans = T.items.filter(i => i.conf >= T.th), mist = ans.filter(i => !i.right); return { ok: !mist.length && ans.length >= T.need, mist: mist.length, ans: ans.length, why: mist.length ? `Robo answered ${ans.length} and made ${mist.length} mistake${mist.length > 1 ? 's' : ''}! Those guesses weren’t sure enough. Move the line UP.` : `No mistakes, but Robo only answered ${ans.length}. It asked a person too often. Move the line DOWN a bit.`, hint: 'Low numbers mean Robo is not sure, and unsure guesses are often wrong.' }; }
    if (T.mode === 'prompt') { const empty = SLOT.find(([k]) => !T.slots[k]); if (empty) return { none: 'Fill all 4 boxes of the prompt first.' }; const bad = SLOT.find(([k]) => T.slots[k].t !== T.R.want[k]); return { ok: !bad, bad: bad && bad[0], why: bad ? (T.slots[bad[0]].k === 'vague' ? `“${T.slots[bad[0]].t}” is too vague. Robo can’t guess what you mean!` : `Read the request again: ${bad[1]} should match what they asked for.`) : '', hint: 'Look for WHAT they want, what it’s ABOUT, WHO it’s for, and HOW LONG.' }; }
    if (T.mode === 'neuron') { const res = T.N.ex.map(([e, n, x, y]) => { const sum = x.reduce((s, v, i) => s + v * T.w[i], 0); return { e, n, sum, fire: sum >= FIRE, want: !!y }; }), bad = res.filter(r => r.fire !== r.want); return { ok: !bad.length, res, why: bad.length ? (bad[0].fire ? `The ${bad[0].n} lit up, but it shouldn’t! Its total is ${bad[0].sum}. Give a clue it has a smaller (or negative) weight.` : `The ${bad[0].n} should light up, but its total is only ${bad[0].sum}. It needs ${FIRE}. Give its clues more weight.`) : '', hint: `Total = each clue × its weight, added up. Lights up at ${FIRE} or more.` }; }
    return { ok: false };
  }
  function check() { const r = judge(); if (r.none) { api.speak(r.none, { force: true }); return; } P.phase = 'anim'; P.anim = { t: 0, r }; Sfx.click(); }
  function after() {
    const r = P.anim.r, T = P.T; P.anim = null;
    if (r.ok) return solved();
    P.phase = 'work'; Sfx.wrong(); P.mood = -1;
    if (T.mode === 'sort') r.bad.forEach(c => { c.at = null; });
    if (T.mode === 'pattern') for (let i = r.bad; i < 3; i++) T.fill[i] = null;
    const n = P.teach.miss();
    if (n >= 3) { P.teach.done(false, T.mode); api.speak(`Let’s fix it together. ${r.why}`, { force: true }); solveTask(T); P.phase = 'auto'; if (!api.loseHeart('Robo’s helper fixed that one.')) setTimeout(() => { if (P && P.T === T) { P.phase = 'anim'; P.anim = { t: 0, r: judge(), win: true }; } }, 1600); return; }
    if (n === 2) { P.teach.help(); P.showSol = 1; }
    api.speak(n === 1 && r.hint ? `${r.why} ${r.hint}` : r.why, { force: true });
  }
  function solveTask(T) {
    if (T.mode === 'sort') T.cards.forEach(c => { c.at = c.truth; });
    if (T.mode === 'train') { T.cards.forEach(c => { if (c.at || !T.more) c.at = c.truth; }); if (T.more) { const need = T.test.filter(t => !race(T).find(r => r.t === t).ok); need.forEach(t => { const c = T.cards.find(c => c.n === t.n) || T.cards.find(c => c.truth === t.truth && JSON.stringify(c.f) === JSON.stringify(t.f)); if (c) c.at = c.truth; }); if (race(T).some(r => !r.ok)) T.cards.forEach(c => { c.at = c.truth; }); } }
    if (T.mode === 'pattern') T.fill = T.seq.slice(T.show, T.show + 3);
    if (T.mode === 'tree') T.slots = TNODES.map(n => n.want);
    if (T.mode === 'sure') T.th = T.hi;
    if (T.mode === 'prompt') SLOT.forEach(([k]) => { T.slots[k] = T.chips.find(c => c.t === T.R.want[k] && !c.wrong); });
    if (T.mode === 'neuron') { for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) for (let c = -3; c <= 3; c++) { T.w = [a, b, c]; if (judge().ok && a + b + c >= 0) return; } }
  }
  function solved() {
    const r = P.teach.done(true, P.T.mode); if (r.levelUp) api.chime('⭐ <b>Level up!</b> Robo’s brain is growing!', '🤖');
    Sfx.win(); P.mood = 1; fx.burst(api.W / 2, api.H * 0.4, 26, ['#3dc2ff', '#ffc93c', '#b28dff']);
    api.speak(pick(['Beep boop! Robo learned it!', 'Robo’s brain is getting smarter!', 'Great teaching!']) + (P.T.mode === 'prompt' ? ' Clear prompts get great answers.' : ''));
    P.done++; P.guidedDone = true; api.score(`🧠 ${P.done}`); api.progress(P.done / P.n, 'Lessons taught'); P.phase = 'cheer'; api.actions([]);
    setTimeout(() => { if (P) { P.mood = 0; nextTask(); } }, P.T.mode === 'prompt' ? 3200 : 2000);
  }

  // ------------------------------------------------ layout
  const L = () => { const b = playBox(api.W, api.H), short = api.H <= 500; return { b, short }; };
  function work() {
    const { b, short } = L(), T = P.T, tray = ['sort', 'train', 'tree'].includes(T.mode) && !T.fix;
    if (!tray) return { area: { x: b.x + 8, y: b.y + 8, w: b.w - 16, h: b.h - 16 }, tray: null, short };
    if (short) return { area: { x: b.x + 8, y: b.y + 8, w: b.w * 0.72 - 12, h: b.h - 16 }, tray: { x: b.x + b.w * 0.72, y: b.y + 8, w: b.w * 0.28 - 8, h: b.h - 16 }, short };
    const th = Math.min(120, b.h * 0.2); return { area: { x: b.x + 8, y: b.y + 8, w: b.w - 16, h: b.h - th - 24 }, tray: { x: b.x + 8, y: b.y + b.h - th - 8, w: b.w - 16, h: th }, short };
  }
  function trayList() { const T = P.T; if (T.mode === 'sort' || T.mode === 'train') return T.cards.filter(c => !c.at).map(c => ({ c, e: c.e, n: c.n })); if (T.mode === 'tree') return T.tray.filter(q => !T.slots.includes(q)).map(q => ({ q, e: '❓', n: q })); return []; }
  function trayItems() {
    const W = work(), R = W.tray; if (!R) return [];
    const list = trayList(), n = Math.max(list.length, 3);
    if (W.short) { const cols = n > 4 ? 2 : 1, rows = Math.ceil(n / cols), cw = (R.w - 8) / cols, rh = (R.h - 8) / rows; return list.map((k, i) => ({ ...k, x: R.x + 4 + (i % cols) * cw, y: R.y + 4 + Math.floor(i / cols) * rh, w: cw - 4, h: rh - 4 })); }
    const cols = n > 6 ? Math.ceil(n / 2) : n, rows = n > 6 ? 2 : 1; return list.map((k, i) => ({ ...k, x: R.x + 4 + (i % cols) * ((R.w - 8) / cols), y: R.y + 4 + Math.floor(i / cols) * ((R.h - 8) / rows), w: (R.w - 8) / cols - 4, h: (R.h - 8) / rows - 4 }));
  }
  function bins() { const A = work().area, rw = Math.min(110, A.w * 0.22), w = (A.w - rw - 24) / 2; return [0, 1].map(i => ({ i, x: A.x + (i ? w + rw + 24 : 0), y: A.y + 34, w, h: A.h - 40 })); }
  const roboAt = () => { const A = work().area, rw = Math.min(110, A.w * 0.22); return { x: A.x + A.w / 2, y: A.y + A.h * 0.5, s: Math.min(rw * 0.8, A.h * 0.35) }; };
  function binPos(b, k) { const cs = Math.min(64, b.w / 3 - 6), per = Math.max(1, Math.floor((b.w - 8) / (cs + 6))); return { x: b.x + 8 + (k % per) * (cs + 6) + cs / 2, y: b.y + 50 + Math.floor(k / per) * (cs + 6) + cs / 2, s: cs }; }
  function patCells() { const A = work().area, T = P.T, n = T.show + 3, per = Math.min(n, Math.max(5, Math.floor(A.w / 64))), cs = Math.min(64, (A.w - 20) / per - 6), rows = Math.ceil(n / per); return Array.from({ length: n }, (_, i) => ({ i, x: A.x + 10 + (i % per) * (cs + 6), y: A.y + A.h * 0.18 + Math.floor(i / per) * (cs + 8), w: cs, h: cs, rows })); }
  function palette() { const A = work().area, T = P.T, s = Math.min(76, A.h * 0.22); return T.sym.map((e, i) => ({ e, x: A.x + A.w / 2 + (i - (T.sym.length - 1) / 2) * (s + 14) - s / 2, y: A.y + A.h - s - 10, w: s, h: s })); }
  function treeNodes() {
    const A0 = work().area, A = { x: A0.x, y: A0.y + 34, w: A0.w, h: A0.h - 34 }, lw = A.w / 5, row = A.h / 4.2, nw = Math.min(lw * 1.6, 220), nh = Math.min(row * 0.62, 56);
    const pos = [{ x: A.x + lw * 2.5, y: A.y + 6 }, { x: A.x + lw * 1, y: A.y + row }, { x: A.x + lw * 3.4, y: A.y + row }, { x: A.x + lw * 3.9, y: A.y + row * 2 }];
    const nodes = pos.map((p, i) => ({ i, x: clamp(p.x - nw / 2, A.x, A.x + A.w - nw), y: p.y, w: nw, h: nh }));
    const leaves = [{ x: A.x + lw * 0.5, r: 2 }, { x: A.x + lw * 1.5, r: 2 }, { x: A.x + lw * 2.5, r: 2 }, { x: A.x + lw * 3.4, r: 3 }, { x: A.x + lw * 4.5, r: 3 }].map((p, i) => ({ i, name: LEAVES[i], x: p.x - lw / 2 + 3, y: A.y + row * p.r + (p.r === 3 ? row * 0.1 : row * 0.35), w: lw - 6, h: Math.min(row * 1.1, A.y + A.h - (A.y + row * p.r + row * 0.35)) }));
    return { nodes, leaves };
  }
  function sureLine() { const A = work().area; return { x: A.x + 60, w: A.w - 80, y0: A.y + 40, y1: A.y + A.h - 70 }; }
  function promptUI() { const A = work().area, short = work().short, sw = (A.w - 30) / 4, sy = A.y + (short ? 30 : 70), sh = Math.min(64, A.h * 0.2); const slots = SLOT.map(([k, lab], i) => ({ k, lab, x: A.x + 10 + i * (sw + 3.3), y: sy, w: sw, h: sh })); const chips = P.T.chips.filter(c => !Object.values(P.T.slots).includes(c)); const cols = short ? 4 : 3, cw = (A.w - 20) / cols, ch = Math.min(46, (A.y + A.h - (sy + sh + 20)) / Math.ceil(P.T.chips.length / cols) - 6); return { slots, chips: chips.map((c, i) => ({ c, x: A.x + 10 + (i % cols) * cw, y: sy + sh + 20 + Math.floor(i / cols) * (ch + 6), w: cw - 6, h: ch })) }; }
  function neuronUI() { const A = work().area, T = P.T, n = T.N.clues.length, nar = A.w < 600, s = Math.min(54, A.h * (nar ? 0.1 : 0.16)), x0 = A.x + A.w * 0.1, nx = nar ? A.x + A.w / 2 : A.x + A.w * 0.62, ny = nar ? A.y + A.h * 0.64 : A.y + A.h * 0.45; return { n, s, nx, ny, nar, ins: T.N.clues.map((c, i) => { const y = A.y + A.h * (nar ? 0.13 + i * 0.15 : 0.18 + i * 0.27); return { i, x: x0, y, minus: { x: x0 + A.w * 0.2, y: y - s / 2, w: s, h: s }, plus: { x: x0 + A.w * 0.2 + s * 2.2, y: y - s / 2, w: s, h: s } }; }) }; }

  function robo(ctx, x, y, s) {
    const bob = Math.sin(P.t * 3) * 3, m = P.mood;
    ctx.fillStyle = '#9fb3c8'; roundRect(ctx, x - s * 0.4, y - s * 0.35 + bob, s * 0.8, s * 0.6, s * 0.12); ctx.fill();
    ctx.fillStyle = '#26334d'; roundRect(ctx, x - s * 0.3, y - s * 0.25 + bob, s * 0.6, s * 0.32, s * 0.08); ctx.fill();
    ctx.fillStyle = m < 0 ? '#ff6b6b' : '#5ff0ff'; const ey = y - s * 0.1 + bob; if (m > 0) { ctx.strokeStyle = '#5ff0ff'; ctx.lineWidth = 3; [-1, 1].forEach(k => { ctx.beginPath(); ctx.arc(x + k * s * 0.13, ey + 3, s * 0.06, Math.PI, 0); ctx.stroke(); }); } else [-1, 1].forEach(k => { ctx.beginPath(); ctx.arc(x + k * s * 0.13, ey, s * 0.055, 0, 7); ctx.fill(); });
    ctx.strokeStyle = '#9fb3c8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - s * 0.35 + bob); ctx.lineTo(x, y - s * 0.5 + bob); ctx.stroke(); ctx.fillStyle = P.anim ? (Math.sin(P.t * 20) > 0 ? '#ffc93c' : '#ff6b4a') : '#ffc93c'; ctx.beginPath(); ctx.arc(x, y - s * 0.52 + bob, s * 0.05, 0, 7); ctx.fill();
    ctx.fillStyle = '#7f93a8'; roundRect(ctx, x - s * 0.22, y + s * 0.27 + bob, s * 0.44, s * 0.2, 6); ctx.fill();
  }

  return {
    start(o) { start(o); },
    checkpoint() { if (P && P.T && P.phase === 'anim') { P.phase = 'work'; P.anim = null; } },
    stop() { P = null; },
    update(dt) {
      if (!P) return; P.t += dt; pops.update(dt); fx.update(dt);
      if (P.phase === 'work') { if (api.input.pressed('check')) check(); if (api.input.pressed('help')) this.hint(); }
      if (P.phase === 'anim') { P.anim.t += dt; const T = P.T, dur = T.mode === 'train' ? 0.8 + T.test.length * 0.6 : T.mode === 'tree' ? 2.8 : T.mode === 'neuron' ? 0.6 + T.N.ex.length * 0.5 : 2; if (P.anim.t > dur) { if (P.anim.win) { P.anim = null; solved(); } else after(); } }
    },
    hint() { if (!P || !P.T || P.phase !== 'work') return false; P.teach.help(); P.showSol = 1; const r = judge(); api.speak(r.hint || (r.ok ? 'Looks ready. Press the big button!' : r.none || r.why), { force: true }); return true; },
    coach() { if (!P || !P.T) return ''; const T = P.T; return { sort: 'Sort each card by its truth.', train: T.fix ? `Wrong card: ${T.bad.n}` : 'Label every card right; use varied examples.', pattern: `Next: ${T.seq.slice(T.show, T.show + 3).join(' ')}`, tree: 'Feathers → fly; water → fur.', sure: `Line between ${T.lo + 5} and ${T.hi}`, prompt: T.R ? Object.values(T.R.want).join(' · ') : '', neuron: 'Good clue = positive weight; wrong-class clue = negative.' }[T.mode] || ''; },
    onHelp(id) { if (!P || !P.T || P.phase !== 'work') return ''; if (id === 'nudge') { P.showSol = 1; P.teach.help(); return 'showed Robo a hint!'; } return ''; },
    screen() { if (!P || !P.T) return ''; return `Robo: ${P.T.ask}`; },
    onTap(x, y) {
      if (!P || !P.T || P.phase !== 'work') return;
      const T = P.T;
      const it = trayItems().find(q => inBox(x, y, q)); if (it) { P.drag = { it, x, y }; return; }
      if (T.mode === 'sort' || T.mode === 'train') { for (const b of bins()) { const inb = T.cards.filter(c => c.at === (T.mode === 'sort' ? T.bins[b.i][2] : T.bins[b.i][2])); inb.forEach((c, k) => { const p = binPos(b, k); if (Math.abs(x - p.x) < p.s / 2 && Math.abs(y - p.y) < p.s / 2) { P.drag = { it: { c, e: c.e, n: c.n }, x, y, from: c.at }; c.at = null; } }); if (P.drag) return; } return; }
      if (T.mode === 'pattern') { const p = palette().find(q => inBox(x, y, q)); if (p) { const i = T.fill.indexOf(null); if (i >= 0) { T.fill[i] = p.e; Sfx.click(); } return; } const c = patCells().find(q => q.i >= T.show && inBox(x, y, q)); if (c && T.fill[c.i - T.show]) { T.fill[c.i - T.show] = null; Sfx.click(); } return; }
      if (T.mode === 'tree') { const nd = treeNodes().nodes.find(q => inBox(x, y, q)); if (nd && T.slots[nd.i]) { P.drag = { it: { q: T.slots[nd.i], e: '❓', n: T.slots[nd.i] }, x, y }; T.slots[nd.i] = null; } return; }
      if (T.mode === 'sure') { const S = sureLine(); if (x > S.x - 30 && x < S.x + S.w + 30) { P.slide = true; this.onMove(x, y); } return; }
      if (T.mode === 'prompt') { const U = promptUI(); const ch = U.chips.find(q => inBox(x, y, q)); if (ch) { P.drag = { it: { chip: ch.c, e: '', n: ch.c.t }, x, y }; return; } const s = U.slots.find(q => inBox(x, y, q)); if (s && T.slots[s.k]) { P.drag = { it: { chip: T.slots[s.k], e: '', n: T.slots[s.k].t }, x, y }; T.slots[s.k] = null; } return; }
      if (T.mode === 'neuron') { for (const r of neuronUI().ins) { const d = inBox(x, y, r.plus) ? 1 : inBox(x, y, r.minus) ? -1 : 0; if (d) { T.w[r.i] = clamp(T.w[r.i] + d, -3, 3); Sfx.click(); api.speak(`${T.N.clues[r.i][1]}: ${T.w[r.i]}`); } } }
    },
    onMove(x, y) {
      if (!P || !P.T) return; if (P.drag) { P.drag.x = x; P.drag.y = y; return; }
      if (P.slide && P.T.mode === 'sure') { const S = sureLine(), v = clamp((y - S.y1) / (S.y0 - S.y1), 0, 1); P.T.th = clamp(Math.round((30 + v * 70) / 5) * 5, 30, 100); }
    },
    onUp(x, y) {
      if (!P || !P.T) return; if (P.slide) { P.slide = false; Sfx.click(); api.speak(`${P.T.th} percent`); return; }
      if (!P.drag) return; const d = P.drag, T = P.T; P.drag = null;
      if (T.mode === 'sort' || T.mode === 'train') { const b = bins().find(q => inBox(x, y, q)); if (b) { d.it.c.at = T.bins[b.i][2]; Sfx.click(); api.speak(`${d.it.n}: ${T.bins[b.i][1]}`); } else if (d.from && !(work().tray && inBox(x, y, work().tray))) d.it.c.at = d.from; return; }
      if (T.mode === 'tree') { const nd = treeNodes().nodes.find(q => inBox(x, y, q)); if (nd) { T.slots[nd.i] = d.it.q; Sfx.click(); api.speak(d.it.q); } return; }
      if (T.mode === 'prompt') { const s = promptUI().slots.find(q => inBox(x, y, q)); if (s) { T.slots[s.k] = d.it.chip; Sfx.click(); api.speak(d.it.chip.t); } }
    },
    draw(ctx, W, H, onTitle) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1d2b4f'); g.addColorStop(1, '#2d1d4f'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(95,240,255,.07)'; ctx.lineWidth = 1; for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      if (onTitle || !P || !P.T) { if (P) robo(ctx, W / 2, H / 2, 140); else emoji(ctx, '🤖', W / 2, H / 2, 100); return; }
      const T = P.T, { b } = L(); panel(ctx, b, { fill: 'rgba(245,248,255,.97)', r: 16 });
      ({ sort: this.dBins, train: this.dBins, pattern: this.dPattern, tree: this.dTree, sure: this.dSure, prompt: this.dPrompt, neuron: this.dNeuron })[T.mode].call(this, ctx);
      const W2 = work();
      if (W2.tray) { panel(ctx, W2.tray, { fill: '#2b3a5c', r: 12, shadow: false }); for (const q of trayItems()) { panel(ctx, q, { fill: '#fff', r: 10, shadow: false }); if (T.mode === 'tree') text(ctx, q.n, q.x + q.w / 2, q.y + q.h / 2, { size: 12, max: q.w - 8 }); else { emoji(ctx, q.e, q.x + q.w / 2, q.y + q.h * 0.42, Math.min(36, q.h * 0.48, q.w * 0.5)); text(ctx, q.n, q.x + q.w / 2, q.y + q.h - 9, { size: 10, max: q.w - 4 }); } } if (!trayItems().length) text(ctx, T.more ? 'all cards used' : '✔', W2.tray.x + W2.tray.w / 2, W2.tray.y + W2.tray.h / 2, { size: 13, color: '#fff' }); }
      if (P.showSol && P.phase === 'work') this.dHint(ctx);
      if (P.drag) { if (P.drag.it.chip || T.mode === 'tree') { const w = 150; panel(ctx, { x: P.drag.x - w / 2, y: P.drag.y - 18, w, h: 36 }, { fill: '#fff3c4', r: 10 }); text(ctx, P.drag.it.n, P.drag.x, P.drag.y, { size: 12, max: w - 8 }); } else emoji(ctx, P.drag.it.e, P.drag.x, P.drag.y, 50); }
      if (P.anim && P.anim.t > 1.2 && T.mode !== 'train') text(ctx, P.anim.r.ok ? '✅ Robo learned it!' : '❌ Not yet…', b.x + b.w / 2, b.y + b.h - 18, { size: 18, color: P.anim.r.ok ? '#2fae66' : '#e5484d' });
      fx.draw(ctx); pops.draw(ctx);
    },
    dBins(ctx) {
      const T = P.T, B = bins(), R = roboAt(), A = P.anim;
      B.forEach(b => { const bin = T.bins[b.i]; panel(ctx, b, { fill: b.i ? '#e3f1ff' : '#fff3d6', r: 14, shadow: false, stroke: '#c9d1db' }); emoji(ctx, bin[0], b.x + 22, b.y + 22, 26); text(ctx, bin[1], b.x + b.w / 2 + 12, b.y + 22, { size: 14, max: b.w - 50 });
        T.cards.filter(c => c.at === bin[2]).forEach((c, k) => { const p = binPos(b, k), bad = A && A.t > 0.4 && T.mode === 'sort' && A.r.bad && A.r.bad.includes(c); ctx.fillStyle = bad ? '#ffd6d6' : '#fff'; roundRect(ctx, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s, 10); ctx.fill(); emoji(ctx, c.e, p.x, p.y - 4, p.s * 0.55); text(ctx, c.n, p.x, p.y + p.s / 2 - 8, { size: 9, max: p.s - 2 }); if (bad) text(ctx, '❌', p.x + p.s / 2 - 8, p.y - p.s / 2 + 8, { size: 12 }); }); });
      text(ctx, T.mode === 'train' ? (T.fix ? 'Robo’s training boxes' : 'Teach Robo: drag cards into its boxes') : 'Drag each card into a box', work().area.x + work().area.w / 2, work().area.y + 12, { size: 13, color: '#6b6380' });
      robo(ctx, R.x, R.y, R.s);
      if (T.mode === 'train' && A) {
        const res = A.r.res || [], i = Math.min(res.length - 1, Math.floor((A.t - 0.3) / 0.6)); if (i >= 0) { const r = res[i]; panel(ctx, { x: R.x - R.s * 0.55, y: R.y + R.s * 0.55, w: R.s * 1.1, h: R.s * 0.9 }, { fill: '#fff', r: 10 }); emoji(ctx, r.t.e, R.x, R.y + R.s * 0.85, R.s * 0.4); const bin = T.bins.find(x => x[2] === r.g); text(ctx, bin ? `${bin[0]} ${r.ok ? '✅' : '❌'}` : '?', R.x, R.y + R.s * 1.25, { size: 14 }); }
        res.slice(0, Math.max(0, i + 1)).forEach((r, k) => text(ctx, r.ok ? '✅' : '❌', R.x - (res.length - 1) * 11 + k * 22, R.y - R.s * 0.75, { size: 16 }));
        if (A.t > 0.4 + res.length * 0.6) text(ctx, A.r.ok ? 'Robo got them all! 🏁' : `Robo got ${res.filter(r => r.ok).length} of ${res.length}`, R.x, work().area.y + work().area.h - 10, { size: 15, color: A.r.ok ? '#2fae66' : '#e5484d' });
      } else if (T.mode === 'train') text(ctx, `🏁 Race: ${T.test.length} new cards`, R.x, R.y + R.s * 0.75, { size: 12, color: '#6b6380', max: R.s * 1.4 });
    },
    dPattern(ctx) {
      const T = P.T, C = patCells(), A = P.anim;
      text(ctx, 'Robo’s pattern', work().area.x + work().area.w / 2, work().area.y + 14, { size: 14, color: '#6b6380' });
      C.forEach(c => { const blank = c.i >= T.show, v = blank ? T.fill[c.i - T.show] : T.seq[c.i], bad = A && A.r.bad === c.i - T.show; ctx.fillStyle = bad ? '#ffd6d6' : blank ? '#fff3c4' : '#fff'; roundRect(ctx, c.x, c.y, c.w, c.h, 10); ctx.fill(); if (blank) { ctx.setLineDash([4, 3]); ctx.strokeStyle = '#d0a800'; ctx.lineWidth = 2; roundRect(ctx, c.x, c.y, c.w, c.h, 10); ctx.stroke(); ctx.setLineDash([]); } if (v) emoji(ctx, v, c.x + c.w / 2, c.y + c.h / 2, c.w * 0.6); else text(ctx, '?', c.x + c.w / 2, c.y + c.h / 2, { size: 20, color: '#d0a800' }); });
      palette().forEach(p => { button(ctx, p, '', { fill: '#fff' }); emoji(ctx, p.e, p.x + p.w / 2, p.y + p.h / 2, p.w * 0.55); });
      robo(ctx, work().area.x + work().area.w - 50, work().area.y + work().area.h - 60, 70);
    },
    dTree(ctx) {
      const T = P.T, { nodes, leaves } = treeNodes(), A = P.anim;
      const edge = (a, b2, lab) => { ctx.strokeStyle = '#9aa7bd'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.x + a.w / 2, a.y + a.h); ctx.lineTo(b2.x + b2.w / 2, b2.y); ctx.stroke(); text(ctx, lab, (a.x + a.w / 2 + b2.x + b2.w / 2) / 2 + (lab === 'yes' ? -12 : 12), (a.y + a.h + b2.y) / 2, { size: 12, color: lab === 'yes' ? '#2fae66' : '#e5484d' }); };
      TNODES.forEach((n, i) => { const a = nodes[i]; [['yes', n.yes], ['no', n.no]].forEach(([lab, to]) => edge(a, typeof to === 'string' ? leaves[LEAVES.indexOf(to)] : nodes[to], lab)); });
      leaves.forEach(l => { panel(ctx, l, { fill: '#eef3fb', r: 10, shadow: false, stroke: '#c9d1db' }); text(ctx, l.name, l.x + l.w / 2, l.y + 14, { size: 11, max: l.w - 6 }); });
      nodes.forEach(nd => { const q = T.slots[nd.i], bad = A && !A.r.ok && A.r.slotBad === nd.i && A.t > 1.2; panel(ctx, nd, { fill: bad ? '#ffd6d6' : q ? '#fff3c4' : '#fff', r: 12, shadow: false, stroke: q ? '#d0a800' : '#9aa7bd' }); text(ctx, q || `box ${nd.i + 1}: drop a question`, nd.x + nd.w / 2, nd.y + nd.h / 2, { size: q ? 12 : 11, max: nd.w - 8, color: q ? '#2b2350' : '#9aa7bd' }); });
      if (A && A.r.res) { const k = Math.min(1, A.t / 2); A.r.res.forEach((r, j) => { const li = LEAVES.indexOf(r.leaf), l = leaves[li >= 0 ? li : 0]; const sx = nodes[0].x + nodes[0].w / 2, sy = nodes[0].y, tx = l.x + l.w / 2 + (j % 2 ? 10 : -10), ty = l.y + l.h * 0.6; emoji(ctx, r.a.e, sx + (tx - sx) * k, sy + (ty - sy) * k, 28); if (k >= 1) text(ctx, r.leaf === r.want ? '✅' : '❌', tx + 14, ty - 14, { size: 12 }); }); }
      else { const A2 = work().area; T.animals.forEach((a, j) => emoji(ctx, a.e, A2.x + 20 + j * 34, A2.y + 16, 26)); }
    },
    dSure(ctx) {
      const T = P.T, S = sureLine(), A = P.anim, n = T.items.length, cw = S.w / n, yOf = c => S.y1 + (S.y0 - S.y1) * ((c - 30) / 70);
      text(ctx, 'How sure Robo is', S.x - 30, S.y0 - 22, { size: 12, color: '#6b6380', align: 'left' });
      [30, 50, 70, 90].forEach(v => { text(ctx, `${v}%`, S.x - 34, yOf(v), { size: 11, color: '#9aa7bd', align: 'left' }); });
      T.items.forEach((it, i) => { const x = S.x + i * cw + cw / 2, top = yOf(it.conf), on = it.conf >= T.th; ctx.fillStyle = on ? '#3dc2ff' : '#c9d1db'; roundRect(ctx, x - cw * 0.25, top, cw * 0.5, S.y1 - top, 8); ctx.fill(); text(ctx, `${it.conf}%`, x, top - 10, { size: 12 }); emoji(ctx, it.e, x, S.y1 + 20, 26); if (A && A.t > 0.6) text(ctx, on ? (it.right ? '✅' : '❌') : '🙋', x, S.y1 + 48, { size: 16 }); });
      const ly = yOf(T.th); ctx.strokeStyle = '#ff6b4a'; ctx.lineWidth = 4; ctx.setLineDash([10, 6]); ctx.beginPath(); ctx.moveTo(S.x - 10, ly); ctx.lineTo(S.x + S.w + 10, ly); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#ff6b4a'; ctx.beginPath(); ctx.arc(S.x + S.w + 10, ly, 12, 0, 7); ctx.fill(); text(ctx, `sure enough: ${T.th}%`, S.x, ly - 14, { size: 13, color: '#ff6b4a', align: 'left' });
      text(ctx, 'Drag the red line up or down', S.x + S.w / 2, S.y1 + 70 > work().area.y + work().area.h ? S.y0 - 22 : S.y1 + 66, { size: 12, color: '#6b6380' });
    },
    dPrompt(ctx) {
      const T = P.T, U = promptUI(), A = P.anim, Wk = work().area;
      if (!work().short) text(ctx, T.R.ask, Wk.x + Wk.w / 2, Wk.y + 28, { size: 14, max: Wk.w - 20 });
      else text(ctx, 'Build the prompt:', Wk.x + Wk.w / 2, Wk.y + 12, { size: 12, color: '#6b6380' });
      U.slots.forEach(s => { const c = T.slots[s.k], bad = A && A.t > 1 && A.r.bad === s.k; panel(ctx, s, { fill: bad ? '#ffd6d6' : c ? '#fff3c4' : '#fff', r: 10, shadow: false, stroke: '#9aa7bd' }); text(ctx, s.lab, s.x + s.w / 2, s.y + 12, { size: 10, color: '#6b6380' }); text(ctx, c ? c.t : '…', s.x + s.w / 2, s.y + s.h / 2 + 7, { size: 12, max: s.w - 6 }); });
      U.chips.forEach(q => { panel(ctx, q, { fill: '#e8eefc', r: 18, shadow: false }); text(ctx, q.c.t, q.x + q.w / 2, q.y + q.h / 2, { size: 12, max: q.w - 8 }); });
      if (P.phase === 'cheer' || (A && A.r.ok)) { const bx = { x: Wk.x + 20, y: Wk.y + Wk.h * 0.45, w: Wk.w - 40, h: Wk.h * 0.5 }; panel(ctx, bx, { fill: '#fff', r: 12 }); text(ctx, `🤖 ${T.R.out.split('\n')[0]}`, bx.x + 12, bx.y + 22, { size: 13, align: 'left', max: bx.w - 24 }); if (T.R.out.split('\n')[1]) text(ctx, T.R.out.split('\n')[1], bx.x + 12, bx.y + 48, { size: 13, align: 'left', max: bx.w - 24 }); }
    },
    dNeuron(ctx) {
      const T = P.T, U = neuronUI(), A = P.anim, Wk = work().area, ex = A ? T.N.ex[Math.min(T.N.ex.length - 1, Math.floor(A.t / 0.5))] : null;
      text(ctx, T.N.q, Wk.x + Wk.w / 2, Wk.y + 14, { size: 16 });
      U.ins.forEach(r => { const c = T.N.clues[r.i], v = ex ? ex[2][r.i] : null; ctx.strokeStyle = T.w[r.i] > 0 ? '#2fae66' : T.w[r.i] < 0 ? '#e5484d' : '#c9d1db'; ctx.lineWidth = 2 + Math.abs(T.w[r.i]) * 2; ctx.beginPath(); ctx.moveTo(r.plus.x + r.plus.w + 6, r.y); ctx.lineTo(U.nx - 40, U.ny); ctx.stroke(); emoji(ctx, c[0], r.x, r.y - 8, 30); text(ctx, c[1], r.x, r.y + 20, { size: 11, max: 90 }); if (v !== null) text(ctx, String(v), r.x - 30, r.y, { size: 16, color: v ? '#2fae66' : '#9aa7bd' }); button(ctx, r.minus, '−', { fill: '#fff' }); button(ctx, r.plus, '+'); text(ctx, `${T.w[r.i] > 0 ? '+' : ''}${T.w[r.i]}`, (r.minus.x + r.minus.w + r.plus.x) / 2, r.y, { size: 18, color: '#2b2350' }); });
      const sum = ex ? ex[2].reduce((s, v, i) => s + v * T.w[i], 0) : null, fire = sum !== null && sum >= FIRE;
      ctx.fillStyle = fire ? '#ffe680' : '#e1e7f0'; ctx.beginPath(); ctx.arc(U.nx, U.ny, 40, 0, 7); ctx.fill(); ctx.strokeStyle = '#26334d'; ctx.lineWidth = 3; ctx.stroke(); text(ctx, sum === null ? `≥ ${FIRE}?` : `= ${sum}`, U.nx, U.ny, { size: 16 });
      emoji(ctx, fire ? '💡' : '⚫', U.nx + 70, U.ny, 30);
      const ty = U.nar ? Wk.y + Wk.h - 46 : Math.min(U.ny + 66, Wk.y + Wk.h - 46); T.N.ex.forEach((e, i) => { const x = U.nar ? U.nx - 80 + i * 54 : U.nx - 30 + i * 54; text(ctx, T.N.clues.filter((c, k) => e[2][k]).map(c => c[0]).join('') || '–', x, ty + 36, { size: 11 }); const res2 = A && A.r.res && A.t > i * 0.5 + 0.4 ? A.r.res[i] : null, res = res2; emoji(ctx, e[0], x, ty, 30, { alpha: ex && ex === e ? 1 : 0.8 }); text(ctx, e[3] ? 'yes' : 'no', x, ty + 24, { size: 10, color: '#6b6380' }); if (res) text(ctx, res.fire === res.want ? '✅' : '❌', x + 16, ty - 16, { size: 12 }); });
    },
    dHint(ctx) {
      const T = P.T;
      if (T.mode === 'sort' || T.mode === 'train') {
        if (T.fix) { const c = T.bad; if (c.at !== c.truth) { const b = bins().find(q => T.bins[q.i][2] === c.at), k = T.cards.filter(x => x.at === c.at).indexOf(c), p = binPos(b, k); hand(ctx, p.x, p.y, P.t, 30); } return; }
        const q = trayItems().find(q => !T.more || T.test.some(t => t.n === q.n) || true); if (q) { const b = bins().find(b => T.bins[b.i][2] === q.c.truth); hand(ctx, q.x + q.w / 2, q.y + q.h / 2, P.t, 30); text(ctx, '⬇️', b.x + b.w / 2, b.y + b.h - 26, { size: 22 }); }
      }
      if (T.mode === 'pattern') { const i = T.fill.findIndex((f, k) => f !== T.seq[T.show + k]); if (i >= 0) { const p = palette().find(q => q.e === T.seq[T.show + i]); if (p) hand(ctx, p.x + p.w / 2, p.y + p.h / 2, P.t, 30); } }
      if (T.mode === 'tree') { const i = T.slots.findIndex((q, k) => q !== TNODES[k].want); if (i >= 0) { const q = trayItems().find(q => q.q === TNODES[i].want), nd = treeNodes().nodes[i]; if (q) hand(ctx, q.x + q.w / 2, q.y + q.h / 2, P.t, 28); text(ctx, '⬇️', nd.x + nd.w / 2, nd.y - 6, { size: 18 }); } }
      if (T.mode === 'sure' && !(T.th > T.lo && T.th <= T.hi)) { const S = sureLine(), y = S.y1 + (S.y0 - S.y1) * ((T.hi - 30) / 70); hand(ctx, S.x + S.w + 10, y, P.t, 28); }
      if (T.mode === 'prompt') { const s = promptUI().slots.find(q => !T.slots[q.k] || T.slots[q.k].t !== T.R.want[q.k]); if (s) { const ch = promptUI().chips.find(q => q.c.t === T.R.want[s.k] && !q.c.wrong); if (ch) hand(ctx, ch.x + ch.w / 2, ch.y + ch.h / 2, P.t, 28); } }
      if (T.mode === 'neuron') { const t2 = { ...T, w: T.w.slice() }; const save = P.T; P.T = t2; solveTask(t2); P.T = save; const i = T.w.findIndex((w, k) => w !== t2.w[k]); if (i >= 0) { const r = neuronUI().ins[i], q = t2.w[i] > T.w[i] ? r.plus : r.minus; hand(ctx, q.x + q.w / 2, q.y + q.h / 2, P.t, 26); } }
    },
    _test: {
      step() { if (!P || !P.T) return 'none'; if (P.phase === 'anim') { P.anim.t = 9; return 'anim'; } if (P.phase !== 'work') return P.phase; solveTask(P.T); check(); return P.T.mode; },
      go() { if (P && P.phase === 'work') check(); },
      get P() { return P; },
    },
  };
}

startGame({
  mascot: '🤖',
  story: (d, e) => (e >= 3 ? 'Robo’s brain is growing! Debug its data, build its decision tree, set how sure it must be, write clear prompts and tune a real neuron.' : 'Meet Robo, a robot pet that learns from YOU. Sort its training cards, then watch Robo sort new cards all by itself!'),
  howTo: ['🃏 Drag cards into Robo’s boxes to teach it.', '🏁 Press Race! Robo sorts new cards using only what you taught it.', '🛠️ If Robo gets one wrong, fix its training and try again.'],
  together: { helps: [{ id: 'nudge', icon: '🔋', label: 'Power-up hint', cool: 25 }] },
  lessons: level => LESSONS[level] || [],
  realLife: realFrom(REAL['robo-brain']),
  create: createGame,
});

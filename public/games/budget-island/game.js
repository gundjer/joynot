// Coco's Budget Island: you're shipwrecked! Every day you shake coconut trees to earn coconuts (island money 🥥)
// — but watch out for the crabs. Then Captain Kiki's trading boat arrives with what you need for your next build.
// Make smart money choices with her and your island grows on the map: raft → campfire → hut → garden → well →
// dock → boat → market → school → lighthouse → village hall… (your island is saved).
// Levels (must match app/Games/BudgetIsland.php):
// 1 Needs or Wants · 2 Can I Buy It? · 3 What Is Left? · 4 Saving Goals · 5 Save, Spend, Share · 6 Earning Money ·
// 7 Best Deal · 8 Budget Planner · 9 Growing Savings
// No answer buttons: you drag things into the canoe or the jars, fill a cart, set sliders, or type numbers.
import { startGame, rand, pick, shuffle, clamp, emoji, roundRect, realFrom, playBox, Sfx } from '../_play/play.js';
import { keypad } from '../_play/widgets.js';
import { REAL } from '../_joy/js/reallife.js';
import { LESSONS } from './lessons.js';
import { text, panel, button, bubble, hand, popups, particles, teach, taskLevel, inBox, INK } from '../_play/kit.js';

const CO = n => `${n} 🥥`;
const BUILDS = [
  { id: 'raft', name: 'Raft', e: null }, { id: 'fire', name: 'Campfire', e: '🔥' }, { id: 'hut', name: 'Hut', e: '🏠' }, { id: 'garden', name: 'Garden', e: '🌻' },
  { id: 'well', name: 'Water Well', e: null }, { id: 'dock', name: 'Dock', e: '⚓' }, { id: 'boat', name: 'Sailboat', e: '⛵' }, { id: 'market', name: 'Market', e: '🏪' },
  { id: 'school', name: 'School', e: '🏫' }, { id: 'light', name: 'Lighthouse', e: null }, { id: 'hall', name: 'Village Hall', e: '🏛️' }, { id: 'park', name: 'Playground', e: '🎠' },
];
const SPOTS = [[0.38, 0.72], [0.47, 0.6], [0.58, 0.55], [0.66, 0.68], [0.5, 0.45], [0.28, 0.58], [0.2, 0.75], [0.62, 0.42], [0.74, 0.52], [0.8, 0.35], [0.42, 0.36], [0.33, 0.45]];
const NEEDS = [['💧', 'water'], ['🍞', 'bread'], ['🍎', 'apples'], ['🌲', 'wood'], ['🧥', 'warm coat'], ['🧴', 'soap'], ['🐟', 'fish'], ['🥕', 'carrots'], ['🔨', 'hammer'], ['🍚', 'rice']];
const WANTS = [['🎮', 'video game'], ['🍭', 'lollipop'], ['🕶️', 'sunglasses'], ['🧸', 'teddy bear'], ['🎈', 'balloons'], ['🍦', 'ice cream'], ['🎧', 'headphones'], ['🎲', 'dice game'], ['🛹', 'skateboard'], ['🎀', 'bows']];
const GOODS = [['🧶', 'rope'], ['🔨', 'hammer'], ['🌲', 'logs'], ['🧱', 'bricks'], ['🔩', 'nails'], ['🧽', 'sponges'], ['🧵', 'sail cloth'], ['🧰', 'toolbox']];

/** One trade task for this level. */
function makeTask(lv, have) {
  if (lv === 1) { const n = shuffle(NEEDS).slice(0, 3), w = shuffle(WANTS).slice(0, 3); return { lv, mode: 'sort', items: shuffle([...n.map(x => ({ e: x[0], n: x[1], need: true })), ...w.map(x => ({ e: x[0], n: x[1], need: false }))]), q: 'Drag the NEEDS into your canoe. Leave the wants on the dock!', expected: n.map(x => x[1]).join(', ') }; }
  if (lv === 2) { const g = pick(GOODS), price = rand(4, 15), mine = Math.random() < 0.55 ? rand(price, price + 5) : rand(2, price - 1); return { lv, mode: 'can', g, price, mine, q: `Kiki sells ${g[1]} for ${CO(price)}. You have ${CO(mine)}. ${mine >= price ? '' : ''}Tap your coconuts to pay — then we'll see!`, expected: mine >= price ? 'buy it' : `${price - mine} more` }; }
  if (lv === 3) { const g = pick(GOODS), price = rand(3, 18), mine = rand(price + 2, 30); return { lv, mode: 'left', g, price, mine, ans: mine - price, q: `You have ${CO(mine)}. You buy ${g[1]} for ${CO(price)}. How many coconuts are LEFT?`, steps: `${mine} − ${price} = ${mine - price}.`, expected: String(mine - price) }; }
  if (lv === 4) { const b = rand(4, 9) * 5, per = pick([3, 4, 5, 6, 8]), days = Math.ceil(b / per); return { lv, mode: 'days', price: b, per, ans: days, q: `The next build costs ${CO(b)}. You can save ${CO(per)} every day. How many DAYS until you have enough?`, steps: `Count by ${per}s until you reach ${b}: ${Array.from({ length: days }, (_, i) => (i + 1) * per).join(', ')}. That's ${days} days.`, expected: String(days) }; }
  if (lv === 5) { const rules = [[2, 4, 4, 'Half in SAVE, a quarter in SPEND, a quarter in SHARE'], [2, 2, 0, 'Half in SAVE, half in SPEND'], [10, 0, 10, 'Ten in SAVE, the rest split equally']]; const total = pick([8, 12, 16, 20]), save = total / 2, share = total / 4, spend = total - save - share; return { lv, mode: 'jars', total, want: [save, spend, share], q: `You earned ${CO(total)}! Rule: HALF in Save, a QUARTER in Spend, a QUARTER in Share. Drag coconuts into the jars.`, steps: `Half of ${total} is ${save}. A quarter of ${total} is ${share}.`, expected: `${save} / ${spend} / ${share}`, rules }; }
  if (lv === 6) { const a = rand(2, 6), ra = pick([2, 3, 4, 5]), b = rand(2, 5), rb = pick([3, 5, 6, 10]); return { lv, mode: 'earn', ans: a * ra + b * rb, q: `You caught ${a} fish (${CO(ra)} each) and found ${b} shells (${CO(rb)} each). How many coconuts did you EARN?`, steps: `${a} × ${ra} = ${a * ra}. ${b} × ${rb} = ${b * rb}. ${a * ra} + ${b * rb} = ${a * ra + b * rb}.`, expected: String(a * ra + b * rb) }; }
  if (lv === 7) { const g = pick(GOODS), small = [3, rand(3, 5) * 3 + 3], big = [5, 0], need = 15; big[1] = Math.max(5, Math.round(small[1] / small[0] * 5) - rand(1, 4)); const best = Math.min(...[0, 1, 2, 3, 4, 5].map(nb => { const left = need - nb * 5; return left < 0 || left % 3 ? 1e9 : nb * big[1] + (left / 3) * small[1]; })); return { lv, mode: 'deal', g, packs: [small, big], need, best, nA: 0, nB: 0, q: `You need EXACTLY ${need} ${g[1]}. Packs: ${small[0]} for ${CO(small[1])} or ${big[0]} for ${CO(big[1])}. Fill your cart for the FEWEST coconuts!`, steps: `Price of one: ${small[1]} ÷ ${small[0]} = ${(small[1] / small[0]).toFixed(1)}, ${big[1]} ÷ ${big[0]} = ${(big[1] / big[0]).toFixed(1)}. Buy the cheaper-per-one pack.`, expected: `${best} coconuts` }; }
  if (lv === 8) { const total = pick([50, 100, 150, 200]), food = total * 0.4, save = total * 0.2; return { lv, mode: 'plan', total, cats: [['🍎', 'Food', 0], ['🔨', 'Tools', 0], ['🐷', 'Save', 0], ['💝', 'Share', 0]], rule: { food, save }, q: `Plan your week: ${CO(total)}. Food must be at least 40% (${food}). Save at least 20% (${save}). Use ALL of it!`, steps: `40% of ${total} is ${food}. 20% of ${total} is ${save}. That leaves ${total - food - save} for tools and share.`, expected: `food ≥ ${food}, save ≥ ${save}, total ${total}` }; }
  const start = pick([100, 200, 50]), rate = 10, weeks = rand(1, 3); let v = start; for (let i = 0; i < weeks; i++) v = Math.round(v * 1.1);
  return { lv, mode: 'grow', ans: v, q: `You put ${CO(start)} in Kiki's Shell Bank. It grows 10% every week (10 for every 100). How many after ${weeks} week${weeks > 1 ? 's' : ''}?`, steps: Array.from({ length: weeks }, (_, i) => { let a = start; for (let j = 0; j < i; j++) a = Math.round(a * 1.1); return `Week ${i + 1}: ${a} + ${Math.round(a * 0.1)} = ${Math.round(a * 1.1)}.`; }).join(' '), expected: String(v) };
}

function createGame(api) {
  let P = null, pad = null;
  const pops = popups(), fx = particles();
  const isl = () => { const x = api.state.extra; x.island = x.island && typeof x.island === 'object' ? x.island : { built: 0, bank: 0 }; return x.island; };

  function start(o) {
    P = { o, t: 0, phase: 'earn', coco: 0, earnT: o.edition <= 1 ? 14 : 12, trees: [0.2, 0.5, 0.8].map(x => ({ x, shake: 0, cool: 0 })), drops: [], crabs: [], crabT: 3, tasks: o.boss ? 4 : 3, done: 0, guidedDone: !!o.boss, build: BUILDS[isl().built % BUILDS.length] };
    api.score(`🥥 ${isl().bank || 0}`); api.progress(0, 'Trades');
    api.actions([]);
    api.goal(`🌴 Today's build: <b>${P.build.name}</b>! First, tap the palm trees to shake down coconuts. Don't touch the crabs! 🦀`);
  }
  function trader() {
    P.phase = 'trade'; P.drops = []; P.crabs = [];
    api.speak('Ahoy! Captain Kiki\'s trading boat is here!', { force: true });
    nextTask();
  }
  function nextTask() {
    if (P.done >= P.tasks) return build();
    const lv = taskLevel(api, P.o), T = makeTask(lv);
    const guided = !P.guidedDone;
    P.T = T; P.teach = teach(api, { level: lv, guided, prompt: T.q, expected: T.expected }); P.showSol = guided ? 1 : 0;
    pad = null;
    if (['left', 'days', 'earn', 'grow'].includes(T.mode)) { pad = keypad({ digits: 4 }); pad.api = api; }
    if (T.mode === 'can') { T.paid = 0; T.stage = 'pay'; }
    if (T.mode === 'jars') { T.jar = [0, 0, 0]; T.pile = T.total; }
    if (T.mode === 'sort') T.items.forEach((it, i) => { it.home = i; it.in = false; });
    if (T.mode === 'plan') T.cats.forEach(c => (c[2] = 0));
    api.actions([{ key: 'help', label: '💡 Help' }, { key: 'check', label: '✔ Done', big: true }]);
    api.goal(`⛵ ${T.q}`, { speak: false });
    api.speak((guided ? "Let's do this one together. " : '') + T.q.replace(/🥥/g, 'coconuts'));
  }
  function check() {
    const T = P.T;
    if (!T || P.wait) return;
    let ok = false, why = '';
    if (T.mode === 'sort') { const inC = T.items.filter(i => i.in); ok = inC.length === 3 && inC.every(i => i.need); why = inC.some(i => !i.need) ? `Is the ${inC.find(i => !i.need).n} something you NEED to live? It's a want. Take it out.` : `There are still needs on the dock. Food, water and tools help you live.`; }
    else if (T.mode === 'can') {
      if (T.stage === 'pay') { if (T.paid === Math.min(T.mine, T.price) && T.mine >= T.price) ok = true; else if (T.mine < T.price && T.paid === T.mine) { T.stage = 'more'; pad = keypad({ digits: 3 }); pad.api = api; api.speak(`Uh oh — all ${T.mine} coconuts and it still isn't ${T.price}! How many MORE coconuts do you need? Type it.`, { force: true }); api.goal(`You have ${CO(T.mine)}. It costs ${CO(T.price)}. How many MORE do you need?`, { speak: false }); return; } else why = T.paid < Math.min(T.mine, T.price) ? `Keep counting coconuts onto the price tag: you put ${T.paid}.` : `That's too many — the price is only ${T.price}.`; }
      else { const v = pad.value(); ok = v === T.price - T.mine; why = `Count up from ${T.mine} to ${T.price}: that's how many more.`; }
    }
    else if (pad) { const v = pad.value(); if (v == null) { api.speak('Type your answer on the number pad.', { force: true }); return; } ok = v === T.ans; why = v > T.ans ? 'Hmm, too high.' : 'Hmm, too low.'; }
    else if (T.mode === 'jars') { ok = T.jar.every((n, i) => n === T.want[i]); why = `Check each jar. ${T.steps}`; }
    else if (T.mode === 'deal') { const n = T.nA * T.packs[0][0] + T.nB * T.packs[1][0], cost = T.nA * T.packs[0][1] + T.nB * T.packs[1][1]; ok = n === T.need && cost === T.best; why = n !== T.need ? `Your cart has ${n} ${T.g[1]}. You need exactly ${T.need}.` : `That works, but it costs ${cost}. You can do it for less! Which pack is cheaper for ONE?`; }
    else if (T.mode === 'plan') { const [f, , s] = T.cats.map(c => c[2]), sum = T.cats.reduce((a, c) => a + c[2], 0); ok = sum === T.total && f >= T.rule.food && s >= T.rule.save; why = sum !== T.total ? `You planned ${sum}. Use exactly ${T.total}.` : f < T.rule.food ? `Food needs at least ${T.rule.food}.` : `Save needs at least ${T.rule.save}.`; }
    if (ok) return taskDone();
    const n = P.teach.miss(); Sfx.wrong();
    if (n >= 3) { P.teach.done(false, ''); api.speak(`Good try! ${T.steps || why} Let's keep going.`, { force: true }); P.wait = true; if (!api.loseHeart('Captain Kiki helped you with that trade.')) setTimeout(() => { if (P && P.phase === 'trade') { P.wait = false; taskDone(true); } }, 2400); else P.wait = false; return; }
    if (n === 2) { P.teach.help(); P.showSol = 1; why += ' ' + (T.steps || ''); }
    api.speak(why, { force: true });
  }
  function taskDone(already) {
    if (!already) { const r = P.teach.done(true, P.T.expected); if (r.levelUp) api.chime('⭐ <b>Level up!</b> Bigger builds are coming!', '🦜'); Sfx.correct(); fx.burst(api.W / 2, api.H * 0.4, 18); api.speak(pick(['Smart trade!', 'Great money thinking!', 'Aye aye, well done!']), { force: true }); }
    P.guidedDone = true; P.done++; pad = null; api.progress(P.done / P.tasks, 'Trades'); P.wait = true;
    setTimeout(() => { if (P && P.phase === 'trade') { P.wait = false; nextTask(); } }, 700);
  }
  function build() {
    P.phase = 'build'; P.buildT = 0; api.actions([]);
    const I = isl(); I.built++; I.bank = (I.bank || 0) + P.coco;
    api.score(`🥥 ${I.bank}`);
    api.goal(`🔨 You built the <b>${P.build.name}</b>! Your island is growing!`, { speak: true });
    Sfx.win(); fx.burst(api.W / 2, api.H / 2, 40);
    setTimeout(() => P && api.finish({ win: true, title: `🏝️ ${P.build.name} built!`, text: `You earned ${P.coco} coconuts and made ${P.tasks} smart trades. Island builds: ${I.built}.` }), 2200);
  }

  // ------------------------------------------------ layout
  const L = () => { const b = playBox(api.W, api.H), short = api.H <= 500; return { b, short, card: short ? { x: b.x + b.w * 0.36, y: b.y + 2, w: b.w * 0.64 - 4, h: b.h - 4 } : { x: b.x + 6, y: b.y + b.h * 0.38, w: b.w - 12, h: b.h * 0.62 - 4 }, map: short ? { x: b.x, y: b.y, w: b.w * 0.35, h: b.h } : { x: b.x, y: b.y, w: b.w, h: b.h * 0.37 } }; };
  function sortRects() { const C = L().card, T = P.T, n = T.items.length, cw = Math.min(90, (C.w - 20) / 6), canoe = { x: C.x + C.w * 0.15, y: C.y + C.h * 0.12, w: C.w * 0.7, h: C.h * 0.36 }; return { canoe, items: T.items.map(it => { if (it.in) { const k = T.items.filter(i => i.in).indexOf(it); return { it, x: canoe.x + canoe.w * 0.2 + k * cw, y: canoe.y + canoe.h * 0.25, w: cw - 6, h: cw - 6 }; } return { it, x: C.x + (C.w - n * cw) / 2 + it.home * cw, y: C.y + C.h * 0.62, w: cw - 6, h: cw - 6 }; }) }; }
  function jarRects() { const C = L().card, w = Math.min(130, C.w / 3.6); return ['🐷 Save', '🛍️ Spend', '💝 Share'].map((n, i) => ({ n, i, x: C.x + C.w / 2 + (i - 1) * (w + 14) - w / 2, y: C.y + C.h * 0.36, w, h: C.h * 0.44 })); }
  const pileBox = () => { const C = L().card; return { x: C.x + C.w * 0.3, y: C.y + 8, w: C.w * 0.4, h: C.h * 0.24 }; };
  function dealRects() { const C = L().card, T = P.T, s = Math.min(60, C.h * 0.18); return T.packs.map((p, i) => { const x = C.x + C.w * (i ? 0.62 : 0.12), y = C.y + C.h * 0.25; return { i, p, box: { x, y, w: C.w * 0.26, h: C.h * 0.36 }, minus: { x, y: y + C.h * 0.4, w: s, h: s }, plus: { x: x + C.w * 0.26 - s, y: y + C.h * 0.4, w: s, h: s } }; }); }
  function planRects() { const C = L().card, T = P.T, rowH = Math.min(56, (C.h - 60) / 4); return T.cats.map((c, i) => ({ c, i, y: C.y + 50 + i * rowH, line: { x1: C.x + 130, x2: C.x + C.w - 70, y: C.y + 50 + i * rowH + rowH / 2 } })); }
  function cocoRects() { const C = L().card, T = P.T, n = T.mine, per = Math.min(n, 10), s = Math.min(40, (C.w * 0.7) / per); return Array.from({ length: n }, (_, i) => ({ i, x: C.x + C.w * 0.15 + (i % per) * s, y: C.y + C.h * 0.6 + Math.floor(i / per) * s, w: s - 2, h: s - 2 })); }

  return {
    start(o) { start(o); },
    checkpoint() { if (!P) return; if (P.phase === 'trade' && P.T) { nextTask(); } },
    stop() { P = null; pad = null; },
    update(dt) {
      if (!P) return; P.t += dt; pops.update(dt); fx.update(dt);
      if (pad && pad.update) pad.update(dt, api.input);
      if (api.input.pressed('help')) this.hint();
      if (P.phase === 'earn') {
        P.earnT -= dt;
        for (const tr of P.trees) { tr.shake = Math.max(0, tr.shake - dt); tr.cool = Math.max(0, tr.cool - dt); }
        for (const d of P.drops) { d.vy += 900 * dt; d.y += d.vy * dt; if (d.y > d.floor) { d.y = d.floor; d.vy = 0; d.sit = (d.sit || 0) + dt; } }
        P.drops = P.drops.filter(d => !d.got && (d.sit || 0) < 4);
        P.crabT -= dt;
        if (P.crabT <= 0) { P.crabs.push({ x: Math.random() < 0.5 ? -0.05 : 1.05, dir: 0, y: 0 }); P.crabs[P.crabs.length - 1].dir = P.crabs[P.crabs.length - 1].x < 0 ? 1 : -1; P.crabT = 2.5 + Math.random() * 2.5; }
        for (const c of P.crabs) { c.x += c.dir * dt * 0.12; for (const d of P.drops) if (!d.got && d.sit && Math.abs(d.x / api.W - c.x) < 0.03) { d.got = true; pops.add('🦀 snip!', d.x, d.y - 20, '#e5484d', 16); } }
        P.crabs = P.crabs.filter(c => c.x > -0.1 && c.x < 1.1);
        if (P.earnT <= 0) { P.phase = 'wait'; api.speak(`You earned ${P.coco} coconuts!`); setTimeout(() => P && trader(), 900); }
      }
      if (P.phase === 'trade' && api.input.pressed('check')) check();
      if (P.phase === 'build') P.buildT += dt;
    },
    hint() {
      if (!P || P.phase !== 'trade') return false;
      P.teach.help(); P.showSol = 1;
      const T = P.T;
      api.speak(T.mode === 'sort' ? 'A need is something you must have to live: food, water, tools, a warm coat. A want is just for fun.' : T.mode === 'can' ? 'Tap your coconuts one at a time to count them onto the price tag.' : T.steps || 'Follow my hand.', { force: true });
      return true;
    },
    coach() { if (!P || P.phase !== 'trade') return P && P.phase === 'earn' ? 'Shake the palm trees and tap the coconuts — avoid the crabs!' : ''; const T = P.T; return T.mode === 'sort' ? 'Ask: could you live without it? Then it is a want.' : T.mode === 'jars' ? 'Half = split into 2 equal groups. Quarter = 4 equal groups.' : T.mode === 'deal' ? 'Find the price of ONE in each pack, then buy the cheaper kind.' : T.mode === 'plan' ? 'Do the "must" categories first, then share out the rest.' : `Let them work it out: ${T.steps || ''}`; },
    onHelp(id) { if (!P) return ''; if (id === 'gift') { P.coco += 3; isl().bank = (isl().bank || 0) + 3; api.score(`🥥 ${isl().bank}`); return 'sent you 3 coconuts!'; } return ''; },
    screen() { return P && P.T && P.phase === 'trade' ? `Trade: ${P.T.q.replace(/<[^>]+>/g, '')}` : P ? `Earning coconuts: ${P.coco}` : ''; },
    onTap(x, y) {
      if (!P) return;
      const W = api.W, lay = L();
      if (P.phase === 'earn') {
        for (const c of P.crabs) { if (Math.hypot(x - c.x * W, y - this.groundY()) < 34) { Sfx.wrong(); pops.add('Ouch!', x, y - 20, '#e5484d'); api.loseHeart('A crab pinched you! Tap coconuts, not crabs.'); c.x = c.dir > 0 ? -0.2 : 1.2; return; } }
        for (const d of P.drops) if (!d.got && Math.hypot(x - d.x, y - d.y) < 34) { d.got = true; P.coco++; Sfx.coin(); pops.add('+1 🥥', d.x, d.y - 20); api.score(`🥥 ${(isl().bank || 0) + P.coco}`); return; }
        for (const tr of P.trees) { const tx = tr.x * W; if (Math.abs(x - tx) < 60 && y < this.groundY() && !tr.cool) { tr.shake = 0.4; tr.cool = 0.6; Sfx.whoosh ? Sfx.whoosh() : Sfx.click(); const n = rand(1, 2); for (let i = 0; i < n; i++) P.drops.push({ x: tx + rand(-40, 40), y: this.groundY() - 150, vy: 0, floor: this.groundY() - 12 + rand(-6, 10) }); return; } }
        return;
      }
      if (P.phase !== 'trade') return;
      const T = P.T;
      if (pad && inBox(x, y, lay.card)) { pad.down(x, y); return; }
      if (T.mode === 'sort') { const R = sortRects(); const r = R.items.find(q => inBox(x, y, q)); if (r) { P.drag = { it: r.it, dx: r.x - x, dy: r.y - y, x: r.x, y: r.y }; } return; }
      if (T.mode === 'can' && T.stage === 'pay') { const r = cocoRects().find(q => inBox(x, y, q)); if (r) { if (r.i < T.paid) { T.paid = r.i; Sfx.click(); } else { T.paid = r.i + 1; Sfx.coin(); api.speak(String(T.paid)); } } return; }
      if (T.mode === 'jars') { const pb = pileBox(); if (inBox(x, y, pb) && T.pile > 0) { P.drag = { coco: true, x, y, dx: 0, dy: 0 }; return; } const j = jarRects().find(q => inBox(x, y, q)); if (j && T.jar[j.i] > 0) { T.jar[j.i]--; T.pile++; Sfx.click(); } return; }
      if (T.mode === 'deal') { for (const d of dealRects()) { if (inBox(x, y, d.plus)) { if (d.i) T.nB++; else T.nA++; Sfx.coin(); } if (inBox(x, y, d.minus)) { if (d.i && T.nB) T.nB--; else if (!d.i && T.nA) T.nA--; Sfx.click(); } } const n = T.nA * T.packs[0][0] + T.nB * T.packs[1][0]; api.speak(`${n} ${T.g[1]}. ${T.nA * T.packs[0][1] + T.nB * T.packs[1][1]} coconuts.`); return; }
      if (T.mode === 'plan') { const r = planRects().find(q => Math.abs(y - q.line.y) < 26 && x > q.line.x1 - 30); if (r) { P.drag = { plan: r }; this.onMove(x, y); } }
    },
    onMove(x, y) {
      if (!P || !P.drag) return;
      const D = P.drag;
      if (D.plan) { const L1 = D.plan.line, v = clamp(Math.round(((x - L1.x1) / (L1.x2 - L1.x1)) * P.T.total / 5) * 5, 0, P.T.total); D.plan.c[2] = v; return; }
      D.x = x + D.dx; D.y = y + D.dy;
    },
    onUp(x, y) {
      if (!P || !P.drag) return;
      const D = P.drag, T = P.T; P.drag = null;
      if (D.plan) { Sfx.click(); api.speak(`${D.plan.c[1]}: ${D.plan.c[2]}`); return; }
      if (D.coco) { const j = jarRects().find(q => inBox(x, y, q)); if (j && T.pile > 0) { T.pile--; T.jar[j.i]++; Sfx.coin(); api.speak(`${j.n.split(' ')[1]}: ${T.jar[j.i]}`); } return; }
      if (D.it) { const R = sortRects(); const inCanoe = inBox(x, y, R.canoe); if (inCanoe !== D.it.in) { if (inCanoe && T.items.filter(i => i.in).length >= 4) return; D.it.in = inCanoe; Sfx.click(); api.speak(D.it.n); } }
    },
    groundY() { const lay = L(); return lay.short ? lay.b.y + lay.b.h * 0.86 : lay.b.y + lay.b.h * 0.8; },
    draw(ctx, W, H, onTitle) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7fd4ff'); g.addColorStop(1, '#2f9bd6'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (onTitle || !P) { this.island(ctx, { x: 0, y: H * 0.25, w: W, h: H * 0.6 }, 4); return; }
      const lay = L();
      if (P.phase === 'earn' || P.phase === 'wait') {
        const gy = this.groundY();
        ctx.fillStyle = '#f3d899'; ctx.beginPath(); ctx.ellipse(W / 2, gy + 60, W * 0.62, 110, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(0, gy, W, H - gy);
        for (const tr of P.trees) { const tx = tr.x * W + (tr.shake ? Math.sin(P.t * 60) * 6 : 0); ctx.fillStyle = '#8a5a2b'; ctx.fillRect(tx - 8, gy - 170, 16, 170); emoji(ctx, '🌴', tx, gy - 190, 120); if (!tr.cool) hand(ctx, tx + 30, gy - 120, P.t, 30); }
        for (const d of P.drops) if (!d.got) emoji(ctx, '🥥', d.x, d.y, 34);
        for (const c of P.crabs) emoji(ctx, '🦀', c.x * W, gy - 10 + Math.sin(P.t * 12) * 2, 40, { flip: c.dir < 0 });
        text(ctx, `⏱️ ${Math.max(0, Math.ceil(P.earnT))}   🥥 ${P.coco}`, W / 2, lay.b.y + 20, { size: 22, color: '#fff', shadow: '#0008' });
      } else {
        this.island(ctx, lay.map, isl().built + (P.phase === 'build' ? 0 : 0), P.phase === 'build' ? Math.min(1, P.buildT) : 1);
        if (P.phase === 'trade') { emoji(ctx, '⛵', lay.map.x + lay.map.w * 0.85, lay.map.y + lay.map.h * 0.25 + Math.sin(P.t * 2) * 4, Math.min(60, lay.map.h * 0.3)); emoji(ctx, '🦜', lay.map.x + lay.map.w * 0.78, lay.map.y + lay.map.h * 0.15, 30); this.drawTrade(ctx, lay); }
      }
      fx.draw(ctx); pops.draw(ctx);
    },
    /** The island map with everything built so far (n builds). */
    island(ctx, b, n, grow = 1) {
      const cx = b.x + b.w / 2, cy = b.y + b.h * 0.6, rx = Math.min(b.w * 0.45, b.h * 1.1), ry = Math.min(b.h * 0.42, b.w * 0.25);
      ctx.fillStyle = '#e9cf8c'; ctx.beginPath(); ctx.ellipse(cx, cy, rx * 1.06, ry * 1.08, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#7cc96a'; ctx.beginPath(); ctx.ellipse(cx, cy - ry * 0.05, rx * 0.86, ry * 0.8, 0, 0, 7); ctx.fill();
      emoji(ctx, '🌴', cx - rx * 0.7, cy - ry * 0.3, Math.min(40, ry * 0.7));
      emoji(ctx, '🌴', cx + rx * 0.72, cy - ry * 0.2, Math.min(36, ry * 0.6));
      const s = Math.min(38, ry * 0.65);
      for (let i = 0; i < Math.min(n, BUILDS.length); i++) {
        const B = BUILDS[i], [sx, sy] = SPOTS[i], x = cx + (sx - 0.5) * rx * 1.9, y = cy + (sy - 0.55) * ry * 2.2, k = i === n - 1 ? grow : 1;
        ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
        if (B.e) emoji(ctx, B.e, 0, 0, s);
        else if (B.id === 'raft') { ctx.fillStyle = '#a0703c'; for (let j = 0; j < 4; j++) ctx.fillRect(-s * 0.5 + j * s * 0.26, -s * 0.15, s * 0.22, s * 0.4); }
        else if (B.id === 'well') { ctx.fillStyle = '#8a8f96'; ctx.fillRect(-s * 0.3, -s * 0.1, s * 0.6, s * 0.4); ctx.fillStyle = '#4fb6ff'; ctx.fillRect(-s * 0.22, -s * 0.06, s * 0.44, s * 0.12); ctx.fillStyle = '#a0703c'; ctx.fillRect(-s * 0.36, -s * 0.5, s * 0.72, s * 0.1); }
        else if (B.id === 'light') { ctx.fillStyle = '#fff'; ctx.fillRect(-s * 0.14, -s * 0.6, s * 0.28, s * 0.8); ctx.fillStyle = '#e5484d'; ctx.fillRect(-s * 0.14, -s * 0.35, s * 0.28, s * 0.12); ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(0, -s * 0.66, s * 0.12, 0, 7); ctx.fill(); }
        ctx.restore();
      }
      if (n === 0) emoji(ctx, '🧳', cx, cy, s);
    },
    drawTrade(ctx, lay) {
      const C = lay.card, T = P.T;
      panel(ctx, C, { fill: '#fffdf6' });
      if (pad && !(T.mode === 'can' && T.stage === 'pay')) {
        text(ctx, T.mode === 'can' ? `${T.price} − ${T.mine} = ?` : T.q.replace(/🥥/g, '🥥'), C.x + C.w / 2, C.y + 26, { size: 15, max: C.w - 24 });
        pad.draw(ctx, { x: C.x + 10, y: C.y + 60, w: C.w - 20, h: C.h - 70 });
        if (P.showSol && T.steps) text(ctx, T.steps.replace(/[^.]*\.\s*$/, ''), C.x + C.w / 2, C.y + C.h - 10, { size: 12, color: '#8a6d1f', max: C.w - 20, base: 'bottom' });
        return;
      }
      if (T.mode === 'sort') {
        const R = sortRects();
        ctx.fillStyle = '#a0703c'; roundRect(ctx, R.canoe.x, R.canoe.y + R.canoe.h * 0.3, R.canoe.w, R.canoe.h * 0.7, R.canoe.h * 0.35); ctx.fill();
        text(ctx, '🛶 NEEDS go in the canoe', R.canoe.x + R.canoe.w / 2, R.canoe.y + 6, { size: 15 });
        text(ctx, 'Dock', C.x + C.w / 2, C.y + C.h * 0.56, { size: 13, color: '#8a7a4a' });
        for (const r of R.items) { if (P.drag && P.drag.it === r.it) continue; panel(ctx, r, { fill: '#fff', r: 12, shadow: false, stroke: '#e2deef' }); emoji(ctx, r.it.e, r.x + r.w / 2, r.y + r.h * 0.45, r.w * 0.55); text(ctx, r.it.n, r.x + r.w / 2, r.y + r.h - 8, { size: 10 }); }
        if (P.drag && P.drag.it) emoji(ctx, P.drag.it.e, P.drag.x + 30, P.drag.y + 30, 56);
        if (P.showSol) { const nxt = T.items.find(i => i.need && !i.in) || T.items.find(i => !i.need && i.in); if (nxt) { const r = R.items.find(q => q.it === nxt); if (r) hand(ctx, r.x + r.w / 2, r.y + r.h / 2, P.t, 32); } }
        return;
      }
      if (T.mode === 'can') {
        text(ctx, `${T.g[0]} ${T.g[1]}`, C.x + C.w / 2, C.y + 24, { size: 20 });
        panel(ctx, { x: C.x + C.w / 2 - 70, y: C.y + 46, w: 140, h: 50 }, { fill: '#fff3c4', r: 10, shadow: false }); text(ctx, `🏷️ ${T.price} 🥥`, C.x + C.w / 2, C.y + 71, { size: 24 });
        text(ctx, `On the tag: ${T.paid} 🥥`, C.x + C.w / 2, C.y + C.h * 0.48, { size: 18, color: T.paid >= T.price ? '#2fae66' : INK });
        text(ctx, `Your coconuts (${T.mine}) — tap to count them onto the tag:`, C.x + C.w / 2, C.y + C.h * 0.55, { size: 13, color: '#6b6380', max: C.w - 20 });
        for (const r of cocoRects()) emoji(ctx, '🥥', r.x + r.w / 2, r.y + r.h / 2, r.w * 0.85, { alpha: r.i < T.paid ? 0.3 : 1 });
        if (P.showSol) { const r = cocoRects()[T.paid]; if (r && T.paid < Math.min(T.mine, T.price)) hand(ctx, r.x + r.w / 2, r.y + r.h / 2, P.t, 30); }
        return;
      }
      if (T.mode === 'jars') {
        const pb = pileBox(); text(ctx, `Your pile: ${T.pile} 🥥  (drag to a jar)`, pb.x + pb.w / 2, pb.y + 12, { size: 15 });
        for (let i = 0; i < Math.min(T.pile, 20); i++) emoji(ctx, '🥥', pb.x + 20 + (i % 10) * (pb.w - 40) / 9, pb.y + 38 + Math.floor(i / 10) * 26, 24);
        for (const j of jarRects()) { ctx.fillStyle = 'rgba(160,220,255,.35)'; ctx.strokeStyle = '#7aa8d6'; ctx.lineWidth = 3; roundRect(ctx, j.x, j.y, j.w, j.h, 16); ctx.fill(); ctx.stroke(); text(ctx, j.n, j.x + j.w / 2, j.y - 12, { size: 15 }); text(ctx, String(T.jar[j.i]), j.x + j.w / 2, j.y + j.h - 18, { size: 22 }); for (let k = 0; k < Math.min(T.jar[j.i], 12); k++) emoji(ctx, '🥥', j.x + 18 + (k % 4) * (j.w - 36) / 3, j.y + j.h - 46 - Math.floor(k / 4) * 22, 20); }
        if (P.drag && P.drag.coco) emoji(ctx, '🥥', P.drag.x, P.drag.y, 34);
        if (P.showSol) { const i = T.jar.findIndex((n, k) => n < T.want[k]); if (i >= 0) { const j = jarRects()[i]; hand(ctx, j.x + j.w / 2, j.y + j.h / 2, P.t, 32); } }
        return;
      }
      if (T.mode === 'deal') {
        text(ctx, `Need exactly ${T.need} ${T.g[0]}`, C.x + C.w / 2, C.y + 22, { size: 18 });
        for (const d of dealRects()) { panel(ctx, d.box, { fill: '#fff3c4', r: 12, shadow: false }); text(ctx, `${d.p[0]} ${T.g[0]} for ${d.p[1]} 🥥`, d.box.x + d.box.w / 2, d.box.y + 22, { size: 15, max: d.box.w - 6 }); text(ctx, `× ${d.i ? T.nB : T.nA}`, d.box.x + d.box.w / 2, d.box.y + d.box.h * 0.66, { size: 28 }); button(ctx, d.minus, '➖', { fill: '#fff' }); button(ctx, d.plus, '➕'); }
        const n = T.nA * T.packs[0][0] + T.nB * T.packs[1][0], cost = T.nA * T.packs[0][1] + T.nB * T.packs[1][1];
        text(ctx, `🛒 ${n} ${T.g[1]} · ${cost} 🥥`, C.x + C.w / 2, C.y + C.h - 20, { size: 18, color: n === T.need ? '#2fae66' : INK });
        return;
      }
      if (T.mode === 'plan') {
        const sum = T.cats.reduce((a, c) => a + c[2], 0);
        text(ctx, `Planned ${sum} of ${T.total} 🥥`, C.x + C.w / 2, C.y + 22, { size: 18, color: sum === T.total ? '#2fae66' : sum > T.total ? '#e5484d' : INK });
        for (const r of planRects()) { const Ln = r.line; text(ctx, `${r.c[0]} ${r.c[1]}`, C.x + 14, Ln.y, { size: 16, align: 'left' }); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(Ln.x1, Ln.y); ctx.lineTo(Ln.x2, Ln.y); ctx.stroke(); const kx = Ln.x1 + (r.c[2] / T.total) * (Ln.x2 - Ln.x1); ctx.fillStyle = '#ff9d3d'; ctx.beginPath(); ctx.arc(kx, Ln.y, 14, 0, 7); ctx.fill(); text(ctx, String(r.c[2]), Ln.x2 + 34, Ln.y, { size: 18 }); }
      }
    },
    _test: { step() {
      if (!P) return 'none';
      if (P.phase === 'earn') { P.coco += 6; P.earnT = 0; return 'earn'; }
      if (P.phase !== 'trade' || !P.T || P.wait) return P.phase;
      const T = P.T;
      if (T.mode === 'sort') T.items.forEach(i => (i.in = i.need));
      else if (T.mode === 'can') { if (T.stage === 'pay') T.paid = Math.min(T.mine, T.price); else pad.s = String(T.price - T.mine); }
      else if (T.mode === 'jars') { T.jar = T.want.slice(); T.pile = 0; }
      else if (T.mode === 'deal') { for (let nb = 0; nb <= 5; nb++) { const left = T.need - nb * 5; if (left >= 0 && left % 3 === 0 && nb * T.packs[1][1] + (left / 3) * T.packs[0][1] === T.best) { T.nB = nb; T.nA = left / 3; break; } } }
      else if (T.mode === 'plan') { T.cats[0][2] = T.rule.food; T.cats[2][2] = T.rule.save; T.cats[1][2] = T.total - T.rule.food - T.rule.save; T.cats[3][2] = 0; }
      else if (pad) pad.s = String(T.ans);
      check(); return T.mode;
    }, get P() { return P; } },
  };
}

startGame({
  mascot: '🦜',
  stick: false,
  story: (d, e) => (e >= 3 ? 'Shipwrecked! Earn coconuts, trade smart with Captain Kiki (budgets, best deals, savings that grow) and build your island into a village.' : 'Shipwrecked on a tiny island! Shake the palm trees for coconuts, trade with Captain Kiki, and build a raft, a hut, a garden… a whole village!'),
  howTo: ['🌴 Tap the palm trees to shake coconuts down, then tap the coconuts. Don’t touch the crabs!', '⛵ Trade with Captain Kiki: drag, count, fill your cart or type your answer.', '🔨 Every day you build something new on your island.'],
  together: { helps: [{ id: 'gift', icon: '🥥', label: 'Send coconuts', cool: 30 }] },
  lessons: level => LESSONS[level] || [],
  realLife: realFrom(REAL['budget-island']),
  create: createGame,
});

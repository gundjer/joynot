// Habitat Heroes: a storm scattered the animals! Fly Ranger Hoot's rescue drone 🚁, pick up each lost animal and set it
// free in the habitat where it lives, then build its home. A new biome joins the map with each grade.
// From level 5 every rescue ends at a ranger lab: fill a feeding bowl, build an animal's body parts and test it,
// link a food chain and send the sun's energy along it, run an ecosystem, and fix a habitat that changed.
// Levels (must match app/Games/HabitatHeroes.php):
// 1 Water or Land · 2 Ocean, Forest, Desert · 3 Add the Icy Poles · 4 Six Habitats · 5 What Animals Eat
// 6 Body Parts That Help · 7 Food Chains · 8 Food Web Jobs · 9 When Things Change
import { startGame, rand, pick, shuffle, clamp, emoji, roundRect, realFrom, playBox, Sfx } from '../_play/play.js';
import { REAL } from '../_joy/js/reallife.js';
import { HAB, A, DIET, CHAINS, JOBS } from './data.js';
import { LESSONS } from './lessons.js';
import { text, panel, button, hand, popups, particles, teach, taskLevel, inBox } from '../_play/kit.js';

const ZC = { ocean: '#3fa7d6', forest: '#4f9a44', desert: '#f2d58a', polar: '#eef6fb', grassland: '#c8d96a', rainforest: '#2f7d3a', water: '#3fa7d6', land: '#7cb85a' };
const DECO = { ocean: ['🌊', '🐚'], forest: ['🌲', '🍄'], desert: ['🌵', '☀️'], polar: ['❄️', '🏔️'], grassland: ['🌾', '🌳'], rainforest: ['🌴', '🌺'], water: ['🌊', '💧'], land: ['🌳', '🌼'] };
const KIT = { ocean: [['🐟', 'food'], ['🌊', 'water'], ['🐚', 'shelter']], forest: [['🌰', 'food'], ['💧', 'water'], ['🌳', 'shelter']], desert: [['🌵', 'food'], ['💧', 'water'], ['⛰️', 'shelter']], polar: [['🐟', 'food'], ['❄️', 'water'], ['🏔️', 'shelter']], grassland: [['🌾', 'food'], ['💧', 'water'], ['🌳', 'shelter']], rainforest: [['🍌', 'food'], ['💧', 'water'], ['🌴', 'shelter']] };
KIT.water = KIT.ocean; KIT.land = KIT.forest;
const DARK = new Set(['ocean', 'forest', 'rainforest', 'water']);
const zonesFor = lv => (lv <= 1 ? ['water', 'land'] : lv === 2 ? ['ocean', 'forest', 'desert'] : lv === 3 ? ['ocean', 'forest', 'desert', 'polar'] : ['ocean', 'forest', 'desert', 'polar', 'grassland', 'rainforest']);

const FOOD = { plant: [['🥕', 'carrots'], ['🍃', 'leaves'], ['🌾', 'grass'], ['🍎', 'apples'], ['🌰', 'nuts'], ['🍌', 'bananas']], meat: [['🐟', 'fish'], ['🍖', 'meat'], ['🐛', 'bugs'], ['🐭', 'a mouse'], ['🦐', 'shrimp']] };
const PARTS = {
  coat: [['fur', '🧥', 'thick fur'], ['skin', '💧', 'thin wet skin'], ['scales', '🛡️', 'hard scales']],
  feet: [['webbed', '🦆', 'webbed feet'], ['claws', '🦅', 'sharp claws'], ['pads', '🐾', 'wide padded feet']],
  special: [['eyes', '👀', 'big eyes'], ['neck', '🦒', 'long neck'], ['hump', '🐪', 'fat-storing hump'], ['blubber', '🐳', 'blubber (fat)'], ['tail', '🐒', 'grabbing tail']],
};
const CHALLENGE = [
  ['❄️', 'walk on snow and ice in the freezing cold', { coat: ['fur', 'Thick fur keeps it warm.'], feet: ['pads', 'Wide padded feet don’t sink in the snow.'] }, '🐻', 'polar bear', '#eef6fb'],
  ['🌊', 'swim in the icy ocean', { feet: ['webbed', 'Webbed feet push the water like paddles.'], special: ['blubber', 'A thick layer of blubber keeps it warm in cold water.'] }, '🐧', 'penguin', '#bfe3f5'],
  ['🏜️', 'cross the hot desert with little water', { special: ['hump', 'A hump stores fat, so it can go days without food.'], feet: ['pads', 'Wide padded feet walk on soft sand.'] }, '🐪', 'camel', '#f2d58a'],
  ['🌙', 'hunt mice in a dark forest at night', { special: ['eyes', 'Big eyes see in the dark.'], feet: ['claws', 'Sharp claws grab the mouse.'] }, '🦉', 'owl', '#4b4f7a'],
  ['🌳', 'eat leaves from the tallest grassland trees', { special: ['neck', 'A long neck reaches high leaves.'] }, '🦒', 'giraffe', '#c8d96a'],
  ['🌴', 'swing through the rainforest trees', { special: ['tail', 'A grabbing tail holds on to branches.'], feet: ['claws', 'Strong claws grip the bark.'] }, '🐒', 'monkey', '#2f7d3a'],
];
const TOOLS = [['wolf', '🐺', 'bring back wolves', 'wolves'], ['trees', '🌳', 'plant new trees', 'trees'], ['bees', '🐝', 'bring back bees', 'bees'], ['decomp', '🍄', 'add mushrooms & worms', 'decomposers'], ['clean', '🧽', 'clean up the oil', 'clean up'], ['invader', '🎣', 'take out the invader fish', 'remove fish'], ['limit', '⛔', 'limit fishing', 'fish less']];
// [scene color, scene emoji, problem, populations [emoji, name, now 0..1], fix, clue (hint 1), why]
const CHANGES = [
  ['#4f9a44', '🌲', 'The deer ate almost all the plants in this forest!', [['🌱', 'plants', 0.1], ['🦌', 'deer', 0.95], ['🐺', 'wolves', 0, 0.35]], 'wolf', 'Look at the meat-eaters. Who used to eat the deer?', 'Wolves eat some of the deer, so the plants can grow back. Predators keep an ecosystem in balance.'],
  ['#a58a5a', '🌲', 'People cut the trees down. The animals lost their homes!', [['🌳', 'trees', 0.05], ['🐿️', 'squirrels', 0.15], ['🦉', 'owls', 0.15]], 'trees', 'What do squirrels and owls live in?', 'New trees give the animals homes and food again as the forest grows back.'],
  ['#9bd17a', '🌸', 'Almost no fruit grew in the orchard this year!', [['🌸', 'flowers', 0.6], ['🍎', 'fruit', 0.05], ['🐝', 'bees', 0]], 'bees', 'Who carries pollen from flower to flower?', 'Bees carry pollen from flower to flower so plants can make fruit and seeds.'],
  ['#7a6a4a', '🍂', 'Dead leaves are piling up, and new plants won’t grow!', [['🍂', 'dead leaves', 0.95, 0.3], ['🌱', 'new plants', 0.1], ['🍄', 'decomposers', 0, 0.4]], 'decomp', 'Who breaks dead things down into soil?', 'Mushrooms and worms break dead things down into rich soil that feeds new plants.'],
  ['#2b5f7a', '🌊', 'Oil spilled into the bay! Fish and seabirds are sick.', [['⚫', 'oil', 0.9, 0.05], ['🐟', 'fish', 0.15], ['🐦', 'seabirds', 0.15]], 'clean', 'What is making the water dirty?', 'Cleaning up the oil lets the fish and birds live safely again.'],
  ['#3fa7d6', '🏞️', 'A new kind of fish was put in the lake. The small fish are gone and the ducks are hungry!', [['🐡', 'invader fish', 0.95, 0.05], ['🐠', 'small fish', 0.05], ['🦆', 'ducks', 0.2]], 'invader', 'Which fish doesn’t belong here?', 'Taking out the invader fish lets the small fish come back, so the ducks have food again.'],
  ['#1f6f9a', '🌊', 'Too many fish were caught. The penguins can’t find enough food!', [['🚢', 'fishing boats', 0.95, 0.35], ['🐟', 'fish', 0.1], ['🐧', 'penguins', 0.15]], 'limit', 'Why are there so few fish?', 'Catching fewer fish lets the fish grow back, so the penguins have food again.'],
];
const JOBK = ['producer', 'consumer', 'decomposer'];

function makeTask(lv, P) {
  const zones = zonesFor(Math.min(lv, 4));
  let animal, target;
  if (lv === 1) { const a = pick(A.filter(a => a[3] === 'water' || a[3] === 'land')); animal = a; target = a[3]; }
  else { const pool = A.filter(a => a[2] && zones.includes(a[2]) && (lv < 5 || a[4])), a = pick(pool.filter(a => a !== P.last) .length ? pool.filter(a => a !== P.last) : pool); animal = a; target = a[2]; }
  P.last = animal;
  const T = { lv, zones, animal, target, kind: lv <= 4 ? 'rescue' : ['feed', 'adapt', 'chain', 'jobs', 'change'][lv - 5] };
  if (T.kind === 'feed') { const a = pick(A.filter(a => a[4] && a[2] && a !== P.lastFeed)); P.lastFeed = a; T.animal = a; T.target = a[2]; T.diet = a[4]; T.tray = shuffle([...shuffle(FOOD.plant).slice(0, 3).map(f => ({ e: f[0], n: f[1], k: 'plant' })), ...shuffle(FOOD.meat).slice(0, 3).map(f => ({ e: f[0], n: f[1], k: 'meat' }))]); T.bowl = []; }
  if (T.kind === 'adapt') { const c = pick(CHALLENGE.filter(c => c !== P.lastC)); P.lastC = c; T.c = c; T.pick = { coat: rand(0, 2), feet: rand(0, 2), special: rand(0, 4) }; for (const s in c[2]) if (PARTS[s][T.pick[s]][0] === c[2][s][0]) T.pick[s] = (T.pick[s] + 1) % PARTS[s].length; }
  if (T.kind === 'chain') { const ch = pick(CHAINS.filter(c => c !== P.lastCh)); P.lastCh = ch; T.chain = ch; const dec = pick(JOBS.decomposer[3]); T.tray = shuffle([...ch.map((c, i) => ({ e: c[0], n: c[1], k: 'c' + i })), { e: dec[0], n: dec[1], k: 'decoy' }]); T.slots = ch.map(() => null); }
  if (T.kind === 'jobs') { const pickJ = j => ({ ...((x => ({ e: x[0], n: x[1] }))(pick(JOBS[j][3]))), k: j }); const list = [pickJ('producer'), pickJ('consumer'), pickJ('decomposer'), pickJ(pick(JOBK)), pickJ(pick(JOBK))]; const seen = new Set(); T.tray = shuffle(list.filter(x => !seen.has(x.e) && seen.add(x.e))); T.place = {}; }
  if (T.kind === 'change') { const c = pick(CHANGES.filter(c => c !== P.lastX)); P.lastX = c; T.c = c; T.tool = null; T.tray = TOOLS.map(t => ({ e: t[1], n: t[3], say: t[2], k: t[0] })); }
  return T;
}

function createGame(api) {
  let P = null;
  const pops = popups(), fx = particles();
  const name = a => a[1];
  const zoneName = z => HAB[z][1];

  function start(o) {
    P = { o, t: 0, n: o.boss ? 5 : o.edition <= 1 ? 3 : 4, done: 0, guidedDone: !!o.boss, phase: 'wait', homes: [], d: { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, carry: null }, wind: 0, beacon: 0 };
    const zs = zonesFor(Math.min(o.real, 4)), fresh = { 2: 'desert', 3: 'polar', 4: 'grassland' }[o.real];
    api.score('🐾 0'); api.progress(0, 'Rescues');
    api.goal(fresh ? `🆕 A new habitat on the map: <b>${HAB[fresh][0]} ${zoneName(fresh)}</b>${o.real === 4 ? ' and 🌴 Rainforest' : ''}!` : `🚁 Rescue map: ${zs.map(z => HAB[z][0]).join(' ')}`, { speak: true });
    setTimeout(() => P && nextTask(), 1300);
  }
  function nextTask() {
    if (P.done >= P.n) { P.phase = 'over'; api.finish({ win: true, title: '🦉 Rescue mission complete!', text: `You brought ${P.done} animals home.` }); return; }
    const lv = taskLevel(api, P.o), T = makeTask(lv, P);
    P.T = T; P.phase = 'fly'; P.drag = null; P.anim = null; P.showSol = 0; P.guided = !P.guidedDone;
    const B = L().board, sp = { x: rand(15, 85) / 100, y: rand(30, 75) / 100 };
    if (Math.hypot(sp.x - P.d.x, sp.y - P.d.y) < 0.25) sp.x = sp.x > 0.5 ? sp.x - 0.4 : sp.x + 0.4;
    T.spot = sp; void B;
    if (T.kind === 'rescue') P.teach = teach(api, { level: lv, guided: P.guided, prompt: `Where does the ${name(T.animal)} live?`, expected: T.target });
    api.actions([{ key: 'help', label: '💡 Help' }]);
    const say = `A lost ${name(T.animal)}! Fly the drone to pick it up.`;
    api.goal(`🚁 ${say}`, { speak: false }); api.speak((P.guided ? "Let's do the first one together. " : '') + say + (P.guided ? ' Tap where you want the drone to fly.' : ''));
  }

  // ------------------------------------------------ layout
  const L = () => { const b = playBox(api.W, api.H), short = api.H <= 500; return { b, short, board: b }; };
  const zoneRect = i => { const B = L().board, n = P.T.zones.length; return { x: B.x + (B.w * i) / n, y: B.y, w: B.w / n, h: B.h }; };
  const dronePx = () => { const B = L().board; return { x: B.x + P.d.x * B.w, y: B.y + P.d.y * B.h }; };
  const zoneIdxAt = fx => clamp(Math.floor(fx * P.T.zones.length), 0, P.T.zones.length - 1);
  function lab() { const B = L().board, short = L().short; if (P.T && P.T.kind === 'adapt' && P.phase !== 'kit') return { tray: null, work: { x: B.x + 8, y: B.y + 8, w: B.w - 16, h: B.h - 16 }, short }; const tray = short ? { x: B.x + B.w * 0.78, y: B.y + 8, w: B.w * 0.22 - 8, h: B.h - 16 } : { x: B.x + 8, y: B.y + B.h - Math.min(120, B.h * 0.2) - 8, w: B.w - 16, h: Math.min(120, B.h * 0.2) }; const work = short ? { x: B.x + 8, y: B.y + 8, w: B.w * 0.78 - 16, h: B.h - 16 } : { x: B.x + 8, y: B.y + 8, w: B.w - 16, h: B.h - tray.h - 24 }; return { tray, work, short }; }
  function trayItems() {
    const T = P.T; if (!T) return [];
    let list = P.phase === 'kit' ? T.kit.filter(k => !k.placed) : P.phase === 'station' ? (T.kind === 'feed' ? T.tray.filter(f => !T.bowl.includes(f)) : T.kind === 'chain' ? T.tray.filter(f => !T.slots.includes(f)) : T.kind === 'jobs' ? T.tray.filter(f => !T.place[f.e]) : T.kind === 'change' ? T.tray : []) : [];
    const { tray: R, short } = lab(), n = Math.max(list.length, 3);
    if (short) { const cols = n > 4 ? 2 : 1, rows = Math.ceil(n / cols), cw = (R.w - 8) / cols, rh = (R.h - 8) / rows; return list.map((k, i) => ({ it: k, x: R.x + 4 + (i % cols) * cw, y: R.y + 4 + Math.floor(i / cols) * rh, w: cw - 4, h: rh - 4 })); }
    return list.map((k, i) => ({ it: k, x: R.x + 4 + i * ((R.w - 8) / n), y: R.y + 4, w: (R.w - 8) / n - 4, h: R.h - 8 }));
  }

  // ------------------------------------------------ drone
  function dropHere() {
    const T = P.T, zi = zoneIdxAt(P.d.x), z = T.zones[zi];
    if (!P.d.carry) return;
    if (T.kind !== 'rescue') {
      if (z !== T.target) { api.speak(`Look for the sparkles. That's where the ${name(T.animal)} lives.`, { force: true }); return; }
      return released(zi);
    }
    if (z === T.target) return released(zi);
    const n = P.teach.miss(); Sfx.wrong(); pops.add('↩️', dronePx().x, dronePx().y - 40);
    if (n >= 3) { P.teach.done(false, z); P.phase = 'auto'; api.speak(`Hoot will show you. The ${name(T.animal)} lives in the ${zoneName(T.target)}.`, { force: true }); const zr = T.zones.indexOf(T.target); P.d.tx = (zr + 0.5) / T.zones.length; P.d.ty = 0.5; if (api.loseHeart('Hoot flew that one home for you.')) return; return; }
    if (n === 2) { P.teach.help(); P.showSol = 1; api.speak(`The ${name(T.animal)} lives in the ${zoneName(T.target)}. Follow the sparkles!`, { force: true }); return; }
    api.speak(T.lv === 1 ? `Hmm, can a ${name(T.animal)} live there? Does it swim in water, or walk on land?` : `Hmm, ${zoneName(z)} isn't its home. Think: does a ${name(T.animal)} need water, trees, sand, snow, grass or jungle?`, { force: true });
  }
  function released(zi) {
    const T = P.T, zr = zoneRect(zi), B = L().board;
    P.homes.push({ z: T.target, e: T.animal[0], fx: (zr.x - B.x + zr.w * (0.25 + Math.random() * 0.5)) / B.w, fy: 0.3 + Math.random() * 0.5 });
    P.d.carry = null; Sfx.correct(); fx.burst(dronePx().x, dronePx().y + 30, 18, ['#ffc93c', '#7be07b', '#fff']);
    if (T.kind === 'rescue') {
      const r = P.teach.done(true, T.target); if (r.levelUp) api.chime('⭐ <b>Level up!</b> A new habitat is coming!', '🦉');
      if (api.settings.explain !== 'off' && T.animal[5]) api.chime(`🌿 ${T.animal[5]}`, '🦉', { ms: 6000 });
      // build its home: food, water, shelter
      T.kit = KIT[T.target].map(k => ({ e: k[0], n: k[1], k: k[1] })); T.home = P.homes[P.homes.length - 1]; P.phase = 'kit'; api.actions([{ key: 'help', label: '💡 Help' }]);
      api.goal(`🏠 Build the ${name(T.animal)}'s home: drag in food, water and shelter.`, { speak: false }); api.speak(`Home sweet home! Now build the ${name(T.animal)}'s home. Drag in food, water and shelter.`, { force: true });
      return;
    }
    startStation();
  }

  // ------------------------------------------------ ranger labs (levels 5+)
  const GO = { feed: '🍽️ Feed', adapt: '🧪 Test', chain: '⚡ Send energy', jobs: '🌍 Run it', change: '▶️ Run 3 seasons' };
  function startStation() {
    const T = P.T; P.phase = 'station'; P.showSol = P.guided ? 1 : 0;
    const ask = {
      feed: `Fill the bowl for the ${name(T.animal)}. Put in 2 or 3 foods it really eats.`,
      adapt: `Build an animal that can ${T.c && T.c[1]}. Tap each body part to change it, then test it!`,
      chain: 'Build the food chain! Drag each living thing into place. The arrow means “is eaten by”.',
      jobs: 'Run the ecosystem! Drag each living thing to its job: producer, consumer or decomposer.',
      change: T.c && `${T.c[2]} Drag a fix into the habitat, then run it to see if the animals come back.`,
    }[T.kind];
    T.ask = ask;
    P.teach = teach(api, { level: T.lv, guided: P.guided, prompt: ask, expected: T.kind });
    api.actions([{ key: 'help', label: '💡 Help' }, { key: 'check', label: GO[T.kind], big: true }]);
    api.goal(`🔬 ${ask}`, { speak: false }); api.speak((P.guided ? "Let's do this one together. " : '') + ask);
  }
  function judge() {
    const T = P.T;
    if (T.kind === 'feed') {
      if (T.bowl.length < 2) return { none: 'Put at least 2 foods in the bowl.' };
      const p = T.bowl.some(f => f.k === 'plant'), m = T.bowl.some(f => f.k === 'meat'), nm = name(T.animal);
      if (T.diet === 'plant') return { ok: !m, why: `A ${nm} doesn't eat animals! It's a plant eater, an herbivore.`, hint: `Does a ${nm} eat plants, animals, or both?` };
      if (T.diet === 'meat') return { ok: !p, why: `A ${nm} doesn't eat plants! It's a meat eater, a carnivore.`, hint: `Does a ${nm} eat plants, animals, or both?` };
      return { ok: p && m, why: `A ${nm} eats BOTH plants and animals. It's an omnivore. Give it some of each!`, hint: `Does a ${nm} eat plants, animals, or both?` };
    }
    if (T.kind === 'adapt') { const bad = Object.entries(T.c[2]).filter(([s, r]) => PARTS[s][T.pick[s]][0] !== r[0]); return { ok: !bad.length, bad: bad.map(b => b[0]), why: bad.length ? `It can't ${T.c[1]} yet. ${bad.map(([s]) => `The ${PARTS[s][T.pick[s]][2]} doesn't help.`).join(' ')}` : '' }; }
    if (T.kind === 'chain') {
      if (T.slots.some(s => !s)) return { none: 'Fill every spot in the chain first.' };
      const i = T.slots.findIndex((s, k) => s.k !== 'c' + k); if (i < 0) return { ok: true };
      const s = T.slots[i];
      if (s.k === 'decoy') return { ok: false, at: i, why: `A ${s.n} is a decomposer. It breaks things down after they die, so it isn't in this chain.` };
      if (i === 0) return { ok: false, at: i, why: 'Every food chain starts with a plant, a producer that makes its own food from sunlight.' };
      return { ok: false, at: i, why: `Does a ${T.slots[i - 1].n} get eaten by ${s.n}? The arrow points to the one that does the eating.` };
    }
    if (T.kind === 'jobs') {
      if (T.tray.some(f => !T.place[f.e])) return { none: 'Give every living thing a job first.' };
      const bad = T.tray.filter(f => T.place[f.e] !== f.k); if (!bad.length) return { ok: true };
      const f = bad[0]; return { ok: false, bad: bad.map(b => b.e), why: `The ${f.n} isn't a ${T.place[f.e]}. A ${JOBS[f.k][1].toLowerCase()} ${JOBS[f.k][2]}.` };
    }
    if (T.kind === 'change') { if (!T.tool) return { none: 'Drag a fix into the habitat first.' }; return { ok: T.tool === T.c[4], why: `The animals didn't come back. ${T.c[5]}` }; }
    return { ok: false };
  }
  function check() {
    const r = judge();
    if (r.none) { api.speak(r.none, { force: true }); return; }
    P.phase = 'anim'; P.anim = { t: 0, r }; Sfx.click();
  }
  function after() {
    const r = P.anim.r, T = P.T; P.anim = null;
    if (r.ok) return labDone();
    P.phase = 'station'; Sfx.wrong();
    const n = P.teach.miss();
    if (n >= 3) { P.teach.done(false, T.kind); api.speak(`Let's fix it together. ${r.why}`, { force: true }); solveLab(T); P.phase = 'auto'; if (!api.loseHeart('Hoot fixed that one for you.')) setTimeout(() => { if (P && P.T === T) { P.phase = 'anim'; P.anim = { t: 0, r: judge(), win: true }; } }, 1800); return; }
    if (n === 2) { P.teach.help(); P.showSol = 1; }
    api.speak(n === 1 && r.hint ? r.hint : r.why, { force: true });
    if (T.kind === 'chain' && r.at != null) { for (let i = r.at; i < T.slots.length; i++) T.slots[i] = null; }
    if (T.kind === 'jobs' && r.bad) for (const e of r.bad) delete T.place[e];
  }
  function solveLab(T) {
    if (T.kind === 'feed') { const want = T.diet === 'both' ? [T.tray.find(f => f.k === 'plant'), T.tray.find(f => f.k === 'meat')] : T.tray.filter(f => f.k === T.diet).slice(0, 2); T.bowl = want; }
    if (T.kind === 'adapt') for (const s in T.c[2]) T.pick[s] = PARTS[s].findIndex(p => p[0] === T.c[2][s][0]);
    if (T.kind === 'chain') T.slots = T.chain.map((c, i) => T.tray.find(f => f.k === 'c' + i));
    if (T.kind === 'jobs') for (const f of T.tray) T.place[f.e] = f.k;
    if (T.kind === 'change') T.tool = T.c[4];
  }
  function labDone() {
    const T = P.T, r = P.teach.done(true, T.kind);
    if (r.levelUp) api.chime('⭐ <b>Level up!</b> A new ranger lab opens!', '🦉');
    const say = { feed: () => `Yum! A ${name(T.animal)} is ${T.diet === 'plant' ? 'an herbivore, a plant eater' : T.diet === 'meat' ? 'a carnivore, a meat eater' : 'an omnivore. It eats both'}.`, adapt: () => `It works! Just like a ${T.c[4]}. ${Object.values(T.c[2]).map(v => v[1]).join(' ')}`, chain: () => 'The sun’s energy flowed all the way up the chain!', jobs: () => 'The ecosystem is running! Producers make food, consumers eat, and decomposers recycle.', change: () => T.c[6] }[T.kind]();
    if (api.settings.explain !== 'off') api.chime(`🌿 ${say}`, '🦉', { ms: 7000 }); else api.speak(say);
    finishTask();
  }
  function finishTask() {
    Sfx.win(); fx.burst(api.W / 2, api.H * 0.4, 28, ['#7be07b', '#ffc93c', '#3dc2ff']);
    P.done++; P.guidedDone = true; api.score(`🐾 ${P.done}`); api.progress(P.done / P.n, 'Rescues'); P.phase = 'cheer'; api.actions([]);
    setTimeout(() => P && nextTask(), 2200);
  }

  // ------------------------------------------------ drag & drop
  function dropAt(it, x, y) {
    const T = P.T, W = lab().work;
    if (P.phase === 'kit') { const hp = homePx(); if (Math.hypot(x - hp.x, y - hp.y) < 80) { it.placed = true; Sfx.click(); api.speak(`${it.n}`); if (T.kit.every(k => k.placed)) { api.speak(`Food, water and shelter. The ${name(T.animal)} has a real home!`, { force: true }); T.home.built = true; finishTask(); } } return; }
    if (T.kind === 'feed') { const b = bowlRect(); if (inBox(x, y, b) && T.bowl.length < 3) { T.bowl.push(it); Sfx.click(); api.speak(it.n); } return; }
    if (T.kind === 'chain') { const s = chainSlots().find(q => inBox(x, y, q)); if (s) { const old = T.slots.indexOf(it); if (old >= 0) T.slots[old] = null; T.slots[s.i] = it; Sfx.click(); api.speak(it.n); } return; }
    if (T.kind === 'jobs') { const z = jobZones().find(q => inBox(x, y, q)); if (z) { T.place[it.e] = z.k; Sfx.click(); api.speak(`${it.n}: ${z.k}`); } return; }
    if (T.kind === 'change') { if (inBox(x, y, sceneRect())) { T.tool = it.k; Sfx.click(); api.speak(it.say); } }
    void W;
  }
  const homePx = () => { const B = L().board, h = P.T.home; return { x: B.x + h.fx * B.w, y: B.y + h.fy * B.h }; };
  const bowlRect = () => { const W = lab().work; return { x: W.x + W.w * 0.42, y: W.y + W.h * 0.35, w: W.w * 0.4, h: W.h * 0.45 }; };
  const chainSlots = () => { const W = lab().work, n = P.T.chain.length, sw = Math.min(110, (W.w - 20) / (n + 1) - 12), y = W.y + W.h * 0.4; return P.T.chain.map((c, i) => ({ i, x: W.x + 10 + (sw + 12) * (i + 1), y, w: sw, h: Math.min(sw * 1.1, W.h * 0.45) })); };
  const jobZones = () => { const W = lab().work, w = W.w / 3; return JOBK.map((k, i) => ({ k, x: W.x + i * w + 4, y: W.y + 4, w: w - 8, h: W.h - 8 })); };
  const sceneRect = () => { const W = lab().work; return { x: W.x, y: W.y, w: W.w, h: W.h }; };
  const adaptSlots = () => { const W = lab().work, narrow = W.w < 600, cx = W.x + W.w * (narrow ? 0.55 : 0.62), cy = W.y + W.h * (narrow ? 0.62 : 0.55), s = Math.min(W.h * (narrow ? 0.15 : 0.24), narrow ? W.w * 0.22 : 86, 86); return { cx, cy, s, coat: { x: cx - s * 1.9, y: cy - s / 2, w: s * 1.3, h: s }, special: { x: cx - s * 0.65, y: cy - s * 1.75, w: s * 1.3, h: s }, feet: { x: cx - s * 0.65, y: cy + s * 0.85, w: s * 1.3, h: s } }; };

  // ------------------------------------------------ scene
  return {
    start(o) { start(o); },
    checkpoint() { if (P && P.T && P.phase === 'anim') { P.phase = 'station'; P.anim = null; } },
    stop() { P = null; },
    update(dt) {
      if (!P) return; P.t += dt; pops.update(dt); fx.update(dt); P.wind = Math.max(0, P.wind - dt); P.beacon = Math.max(0, P.beacon - dt);
      const T = P.T;
      if (P.phase === 'fly' || P.phase === 'auto') {
        const k = 0.6 * (P.wind ? 1.8 : 1) * dt, I = api.input;
        if (P.phase === 'fly') { if (I.held('left')) P.d.tx = P.d.x - 0.1; if (I.held('right')) P.d.tx = P.d.x + 0.1; if (I.held('up')) P.d.ty = P.d.y - 0.1; if (I.held('down')) P.d.ty = P.d.y + 0.1; }
        P.d.tx = clamp(P.d.tx, 0.04, 0.96); P.d.ty = clamp(P.d.ty, 0.12, 0.9);
        const dx = P.d.tx - P.d.x, dy = P.d.ty - P.d.y, dist = Math.hypot(dx, dy);
        if (dist > 0.002) { const m = Math.min(dist, k); P.d.x += (dx / dist) * m; P.d.y += (dy / dist) * m; }
        if (!P.d.carry && Math.hypot(P.d.x - T.spot.x, P.d.y - T.spot.y) < 0.07) { P.d.carry = T.animal; Sfx.click(); api.speak(T.kind === 'rescue' ? `Got the ${name(T.animal)}! Now fly it to its home and press Drop.` : `Got the ${name(T.animal)}! Follow the sparkles to its home and press Drop.`, { force: true }); api.actions([{ key: 'help', label: '💡 Help' }, { key: 'drop', label: '⬇️ Drop here', big: true }]); }
        if (P.phase === 'auto' && dist < 0.01 && P.d.carry) released(T.zones.indexOf(T.target));
        if (P.phase === 'fly' && (api.input.pressed('drop') || api.input.pressed('action'))) dropHere();
      }
      if (P.phase === 'station' && api.input.pressed('check')) check();
      if (['fly', 'kit', 'station'].includes(P.phase) && api.input.pressed('help')) this.hint();
      if (P.phase === 'anim') { P.anim.t += dt; if (P.anim.t > 2.4) { if (P.anim.win) { P.anim = null; labDone(); } else after(); } }
    },
    hint() {
      if (!P || !P.T) return false;
      const T = P.T; P.showSol = 1;
      if (P.phase === 'fly') {
        if (!P.d.carry) { api.speak(`Tap the ${name(T.animal)} and the drone flies there.`, { force: true }); return true; }
        if (T.kind === 'rescue') { P.teach.help(); api.speak(T.lv === 1 ? `Does a ${name(T.animal)} swim, or walk on land?` : `Think about what a ${name(T.animal)} needs. Water? Trees? Sand? Snow?`, { force: true }); return true; }
        api.speak('Follow the sparkles!', { force: true }); return true;
      }
      if (P.phase === 'kit') { api.speak('Every animal needs food, water and shelter. Drag each one to the animal.', { force: true }); return true; }
      if (P.phase === 'station') {
        P.teach.help();
        api.speak({ feed: `Does a ${name(T.animal)} eat plants, animals, or both?`, adapt: T.c && `To ${T.c[1]}, it needs: ${Object.values(T.c[2]).map(v => v[1]).join(' ')}`, chain: 'Start with the plant. Then who eats the plant? Then who eats that?', jobs: 'Plants make food from sunlight. Animals eat. Mushrooms, worms and bacteria break down dead things.', change: T.c && T.c[5] }[T.kind], { force: true });
        return true;
      }
      return false;
    },
    coach() { if (!P || !P.T) return ''; const T = P.T; if (P.phase === 'fly') return T.kind === 'rescue' ? `${name(T.animal)} lives in the ${zoneName(T.target)}.` : 'Fly to the sparkles.'; return { rescue: 'Food, water, shelter.', feed: `${name(T.animal)}: ${DIET[T.diet] ? DIET[T.diet][2] : ''}`, adapt: T.c ? `Needs: ${Object.values(T.c[2]).map(v => v[1]).join(' ')}` : '', chain: T.chain ? T.chain.map(c => c[1]).join(' → ') : '', jobs: 'Plants = producers, animals = consumers, fungi/worms = decomposers.', change: T.c ? `Fix: ${TOOLS.find(t => t[0] === T.c[4])[2]}` : '' }[T.kind] || ''; },
    onHelp(id) { if (!P || !P.T) return ''; if (id === 'wind') { P.wind = 8; pops.add('🌬️', dronePx().x, dronePx().y - 40); return 'sent a tailwind!'; } if (id === 'beacon') { P.beacon = 8; if (P.teach) P.teach.help(); return 'lit the way home!'; } return ''; },
    screen() { if (!P || !P.T) return ''; const T = P.T; return P.phase === 'station' ? `Lab: ${T.ask}` : `Rescue: ${name(T.animal)}`; },
    onTap(x, y) {
      if (!P || !P.T) return;
      const T = P.T, B = L().board;
      if (P.phase === 'fly') { P.d.tx = (x - B.x) / B.w; P.d.ty = (y - B.y) / B.h; P.flyHeld = true; return; }
      if (P.phase !== 'kit' && P.phase !== 'station') return;
      const it = trayItems().find(q => inBox(x, y, q)); if (it) { P.drag = { it: it.it, x, y }; return; }
      if (P.phase !== 'station') return;
      if (T.kind === 'feed') { const b = bowlRect(); if (inBox(x, y, b) && T.bowl.length) { T.bowl.pop(); Sfx.click(); } return; }
      if (T.kind === 'chain') { const s = chainSlots().find(q => inBox(x, y, q)); if (s && T.slots[s.i]) { P.drag = { it: T.slots[s.i], x, y }; T.slots[s.i] = null; } return; }
      if (T.kind === 'jobs') { for (const z of jobZones()) { const items = T.tray.filter(f => T.place[f.e] === z.k); items.forEach((f, i) => { const p = this.jobPos(z, i); if (Math.hypot(x - p.x, y - p.y) < 28) { delete T.place[f.e]; P.drag = { it: f, x, y }; } }); } return; }
      if (T.kind === 'adapt') { const S = adaptSlots(); for (const s of ['coat', 'feet', 'special']) if (inBox(x, y, S[s])) { T.pick[s] = (T.pick[s] + 1) % PARTS[s].length; Sfx.click(); api.speak(PARTS[s][T.pick[s]][2]); } }
    },
    onMove(x, y) { if (!P || !P.T) return; if (P.drag) { P.drag.x = x; P.drag.y = y; return; } if (P.phase === 'fly' && P.flyHeld) { const B = L().board; P.d.tx = (x - B.x) / B.w; P.d.ty = (y - B.y) / B.h; } },
    onUp(x, y) { if (!P) return; P.flyHeld = false; if (!P.drag) return; const d = P.drag; P.drag = null; dropAt(d.it, x, y); },
    jobPos(z, i) { return { x: z.x + z.w / 2 + ((i % 2) - 0.5) * Math.min(64, z.w * 0.45), y: z.y + z.h * 0.42 + Math.floor(i / 2) * 58 }; },
    draw(ctx, W, H, onTitle) {
      ctx.fillStyle = '#2b6f3a'; ctx.fillRect(0, 0, W, H);
      if (onTitle || !P || !P.T) { ['🦉', '🐳', '🐪', '🐧', '🦁', '🐒'].forEach((e, i) => emoji(ctx, e, W * (0.15 + i * 0.14), H * 0.5 + Math.sin(i) * 30, 60)); return; }
      const T = P.T, B = L().board;
      // map
      T.zones.forEach((z, i) => {
        const r = zoneRect(i); ctx.fillStyle = ZC[z]; ctx.fillRect(r.x, r.y, r.w, r.h);
        for (let k = 0; k < 4; k++) emoji(ctx, DECO[z][k % 2], r.x + r.w * (0.2 + ((k * 37) % 60) / 100), r.y + r.h * (0.25 + k * 0.2), Math.min(30, r.w * 0.3), { alpha: 0.5 });
        const glow = (P.showSol || T.kind !== 'rescue' || P.beacon) && P.d.carry && z === T.target;
        if (glow) { ctx.save(); ctx.globalAlpha = 0.35 + 0.2 * Math.sin(P.t * 6); ctx.strokeStyle = '#fff6a0'; ctx.lineWidth = 8; ctx.strokeRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8); ctx.restore(); emoji(ctx, '✨', r.x + r.w / 2, r.y + r.h * 0.2 + Math.sin(P.t * 4) * 6, 30); }
        text(ctx, `${HAB[z][0]} ${zoneName(z)}`, r.x + r.w / 2, r.y + 18, { size: Math.min(15, r.w / 7), color: DARK.has(z) ? '#fff' : '#2b2350', max: r.w - 6 });
      });
      for (const h of P.homes) { const hx = B.x + h.fx * B.w, hy = B.y + h.fy * B.h; if (h.built) emoji(ctx, KIT[h.z][2][0], hx + 18, hy - 10, 26, { alpha: 0.8 }); emoji(ctx, h.e, hx, hy + Math.sin(P.t * 2 + hx) * 3, 34); }
      if (P.phase === 'fly' || P.phase === 'auto') {
        if (!P.d.carry) { const sx = B.x + T.spot.x * B.w, sy = B.y + T.spot.y * B.h; emoji(ctx, '🌪️', sx, sy - 34, 34, { alpha: 0.7 }); emoji(ctx, T.animal[0], sx, sy + Math.sin(P.t * 5) * 4, 40); text(ctx, '❓', sx + 22, sy - 22, { size: 18 }); if (P.guided || P.showSol) hand(ctx, sx, sy, P.t, 34); }
        if (P.guided && P.d.carry && T.kind === 'rescue') { const r = zoneRect(T.zones.indexOf(T.target)); hand(ctx, r.x + r.w / 2, r.y + r.h * 0.55, P.t, 34); }
      }
      if (P.phase !== 'station' && P.phase !== 'anim' && !(P.phase === 'cheer' && T.kind !== 'rescue')) {
        const dp = dronePx(); if (P.d.carry) { ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(dp.x, dp.y + 10); ctx.lineTo(dp.x, dp.y + 30); ctx.stroke(); emoji(ctx, P.d.carry[0], dp.x, dp.y + 46, 34); }
        emoji(ctx, '🚁', dp.x, dp.y + Math.sin(P.t * 8) * 2, 46); if (P.wind) emoji(ctx, '🌬️', dp.x - 40, dp.y, 26);
      }
      if (P.phase === 'kit') {
        const hp = homePx(); ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hp.x, hp.y, 60, 0, 7); ctx.stroke(); ctx.restore();
        T.kit.filter(k => k.placed).forEach((k, i) => emoji(ctx, k.e, hp.x + Math.cos(i * 2.1 - 1.6) * 44, hp.y + Math.sin(i * 2.1 - 1.6) * 44, 28));
        this.drawTray(ctx, 'Build its home: food, water, shelter');
        if (P.guided || P.showSol) { const it = trayItems()[0]; if (it) hand(ctx, it.x + it.w / 2, it.y + it.h / 2, P.t, 30); }
      }
      if (P.phase === 'station' || P.phase === 'anim' || (P.phase === 'auto' && T.kind !== 'rescue') || (P.phase === 'cheer' && T.kind !== 'rescue')) this.drawLab(ctx);
      if (P.drag) emoji(ctx, P.drag.it.e, P.drag.x, P.drag.y, 52);
      fx.draw(ctx); pops.draw(ctx);
    },
    drawTray(ctx, label) {
      const R = lab().tray; panel(ctx, R, { fill: 'rgba(30,50,40,.85)', r: 14 });
      for (const q of trayItems()) { panel(ctx, q, { fill: '#fff', r: 10, shadow: false }); emoji(ctx, q.it.e, q.x + q.w / 2, q.y + q.h * 0.42, Math.min(40, q.h * 0.5, q.w * 0.5)); text(ctx, q.it.n, q.x + q.w / 2, q.y + q.h - 10, { size: 11, max: q.w - 4 }); }
      if (label && !trayItems().length) text(ctx, label, R.x + R.w / 2, R.y + R.h / 2, { size: 14, color: '#fff', max: R.w - 10 });
    },
    drawLab(ctx) {
      const T = P.T, B = L().board, Wk = lab().work, A2 = P.anim, k = A2 ? Math.min(1, A2.t / 1.8) : 0;
      ctx.fillStyle = 'rgba(20,40,30,.55)'; ctx.fillRect(B.x, B.y, B.w, B.h);
      panel(ctx, { x: Wk.x - 4, y: Wk.y - 4, w: Wk.w + 8, h: Wk.h + 8 }, { fill: '#fffdf6', r: 16 });
      if (T.kind === 'feed') {
        const b = bowlRect(), s = Math.min(Wk.h * 0.5, 120); emoji(ctx, T.animal[0], Wk.x + Wk.w * 0.2, Wk.y + Wk.h * 0.5 + (A2 && A2.r.ok ? Math.sin(A2.t * 12) * 6 : 0), s); text(ctx, name(T.animal), Wk.x + Wk.w * 0.2, Wk.y + Wk.h * 0.5 + s * 0.65, { size: 16 });
        ctx.fillStyle = '#c47a3c'; ctx.beginPath(); ctx.ellipse(b.x + b.w / 2, b.y + b.h * 0.6, b.w / 2, b.h * 0.32, 0, 0, Math.PI); ctx.fill(); ctx.fillStyle = '#e09a5c'; ctx.beginPath(); ctx.ellipse(b.x + b.w / 2, b.y + b.h * 0.6, b.w / 2, b.h * 0.1, 0, 0, 7); ctx.fill();
        T.bowl.forEach((f, i) => emoji(ctx, f.e, b.x + b.w * (0.25 + i * 0.25), b.y + b.h * 0.5 - (A2 ? k * 0 : 0), Math.min(44, b.w * 0.22)));
        text(ctx, `${T.bowl.length} of 3 · tap the bowl to take one out`, b.x + b.w / 2, b.y + b.h + 4, { size: 12, color: '#6b6380' });
        if (A2 && A2.t > 1.2) text(ctx, A2.r.ok ? '😋 Yum!' : '🤢 Yuck!', Wk.x + Wk.w * 0.2, Wk.y + 24, { size: 22 });
        if (P.showSol && !A2) { const t = { ...T, bowl: [] }; solveLab(t); const want = t.bowl.find(f => !T.bowl.includes(f)); const q = want && trayItems().find(q => q.it === want); if (q) hand(ctx, q.x + q.w / 2, q.y + q.h / 2, P.t, 30); }
      }
      if (T.kind === 'adapt') {
        const S = adaptSlots(), c = T.c;
        const nar = Wk.w < 600, jb = nar ? { x: Wk.x + 8, y: Wk.y + 8, w: Wk.w - 16, h: Wk.h * 0.2 } : { x: Wk.x + 8, y: Wk.y + 8, w: Wk.w * 0.3, h: Wk.h - 16 }, jc = c[5] === '#4b4f7a' || c[5] === '#2f7d3a' ? '#fff' : '#2b2350';
        ctx.fillStyle = c[5]; roundRect(ctx, jb.x, jb.y, jb.w, jb.h, 14); ctx.fill();
        if (nar) { emoji(ctx, c[0], jb.x + 40, jb.y + jb.h / 2, Math.min(56, jb.h * 0.6)); text(ctx, `Job: ${c[1]}`, jb.x + jb.w / 2 + 30, jb.y + jb.h / 2, { size: 15, max: jb.w - 100, color: jc }); } else { emoji(ctx, c[0], jb.x + jb.w / 2, jb.y + jb.h * 0.35, Math.min(70, Wk.w * 0.12)); text(ctx, `Job: ${c[1]}`, jb.x + jb.w / 2, jb.y + jb.h * 0.65, { size: 14, max: jb.w - 16, color: jc }); }
        const walk = A2 ? (A2.r.ok ? k : Math.min(k, 0.4)) * -Wk.w * 0.25 : 0;
        ctx.save(); ctx.translate(walk, 0);
        ctx.fillStyle = '#c9a77c'; ctx.beginPath(); ctx.ellipse(S.cx, S.cy, S.s * 1.1, S.s * 0.75, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#2b2350'; ctx.beginPath(); ctx.arc(S.cx + S.s * 0.55, S.cy - S.s * 0.25, 6, 0, 7); ctx.fill();
        for (const s of ['coat', 'feet', 'special']) { const r = S[s], p = PARTS[s][T.pick[s]], bad = A2 && A2.t > 1.2 && A2.r.bad && A2.r.bad.includes(s); panel(ctx, r, { fill: bad ? '#ffd6d6' : '#fff', r: 12, shadow: false, stroke: bad ? '#e5484d' : '#c9d1db' }); emoji(ctx, p[1], r.x + r.w / 2, r.y + r.h * 0.4, Math.min(34, r.h * 0.45)); text(ctx, p[2], r.x + r.w / 2, r.y + r.h - 12, { size: 11, max: r.w - 6 }); text(ctx, s === 'special' ? 'special part 🔄' : s + ' 🔄', r.x + r.w / 2, r.y - 8, { size: 11, color: '#6b6380' }); }
        ctx.restore();
        if (P.showSol && !A2) { const s = Object.keys(c[2]).find(s => PARTS[s][T.pick[s]][0] !== c[2][s][0]); if (s) hand(ctx, S[s].x + S[s].w / 2, S[s].y + S[s].h / 2, P.t, 30); }
        if (A2 && A2.t > 1.2) text(ctx, A2.r.ok ? `✅ Just like a ${c[4]}!` : '❌ Not yet…', Wk.x + Wk.w * 0.65, Wk.y + 20, { size: 18, color: A2.r.ok ? '#2fae66' : '#e5484d' });
      }
      if (T.kind === 'chain') {
        const S = chainSlots(), sun = { x: Wk.x + 10, y: S[0].y, w: S[0].w, h: S[0].h };
        emoji(ctx, '☀️', sun.x + sun.w / 2, sun.y + sun.h / 2, Math.min(56, sun.w * 0.6)); text(ctx, 'sun', sun.x + sun.w / 2, sun.y + sun.h - 6, { size: 12 });
        const lit = A2 ? (A2.r.ok ? k * (S.length + 1) : Math.min(k * (S.length + 1), (A2.r.at ?? 0) + 0.99)) : -1;
        S.forEach(s => { const f = T.slots[s.i], on = lit >= s.i + 1, bad = A2 && A2.t > 1.2 && A2.r.at === s.i; panel(ctx, s, { fill: bad ? '#ffd6d6' : on ? '#fff3c4' : f ? '#fff' : '#f2f2f2', r: 12, shadow: false, stroke: '#c9d1db' }); if (f) { emoji(ctx, f.e, s.x + s.w / 2, s.y + s.h * 0.42, Math.min(48, s.w * 0.5)); text(ctx, f.n, s.x + s.w / 2, s.y + s.h - 10, { size: 11, max: s.w - 4 }); } text(ctx, '➜', s.x - 7, s.y + s.h / 2, { size: 18, color: lit >= s.i + 0.5 ? '#ffb300' : '#2b2350' }); });
        text(ctx, '➜ means “is eaten by”. Energy flows from the sun.', Wk.x + Wk.w / 2, Wk.y + 20, { size: 13, color: '#6b6380', max: Wk.w - 10 });
        if (P.showSol && !A2) { const i = T.slots.findIndex((s, j) => !s || s.k !== 'c' + j); if (i >= 0) { const q = trayItems().find(q => q.it.k === 'c' + i); if (q) hand(ctx, q.x + q.w / 2, q.y + q.h / 2, P.t, 30); else hand(ctx, S[i].x + S[i].w / 2, S[i].y + S[i].h / 2, P.t, 30); } }
      }
      if (T.kind === 'jobs') {
        const Z = jobZones(), cols = ['#fff6c8', '#e3f1ff', '#efe3d3'];
        Z.forEach((z, i) => { const J = JOBS[z.k]; panel(ctx, z, { fill: cols[i], r: 12, shadow: false, stroke: '#c9d1db' }); text(ctx, `${J[0]} ${J[1]}`, z.x + z.w / 2, z.y + 16, { size: 15, max: z.w - 6 }); text(ctx, J[2], z.x + z.w / 2, z.y + 38, { size: 11, max: z.w - 10, color: '#6b6380' }); T.tray.filter(f => T.place[f.e] === z.k).forEach((f, j) => { const p = this.jobPos(z, j), bad = A2 && A2.t > 1.2 && A2.r.bad && A2.r.bad.includes(f.e); emoji(ctx, f.e, p.x, p.y + (A2 && A2.r.ok ? Math.sin(A2.t * 8 + j) * 4 : 0), 40); if (bad) text(ctx, '❌', p.x + 18, p.y - 18, { size: 16 }); }); });
        if (P.showSol && !A2) { const q = trayItems()[0]; if (q) { const z = Z.find(z => z.k === q.it.k); hand(ctx, q.x + q.w / 2, q.y + q.h / 2, P.t, 30); text(ctx, '⬆️', z.x + z.w / 2, z.y + z.h - 20, { size: 22 }); } }
      }
      if (T.kind === 'change') {
        const c = T.c, R = sceneRect(); ctx.fillStyle = c[0]; roundRect(ctx, R.x, R.y, R.w, R.h, 14); ctx.fill();
        emoji(ctx, c[1], R.x + 34, R.y + 30, 34, { alpha: 0.8 });
        text(ctx, c[2], R.x + R.w / 2 + 20, R.y + 22, { size: 14, color: '#fff', max: R.w - 90 });
        const fixed = A2 && A2.r.ok, bh = Math.min(26, (R.h - 120) / 4), bw = R.w * 0.5;
        c[3].forEach((p, i) => {
          const hz = p[3] ?? 0.5, y = R.y + 70 + i * (bh + 16), target = fixed ? hz : clamp(p[2] + (p[2] > hz ? 0.05 : -0.05), 0, 1), v = A2 ? p[2] + (target - p[2]) * k : p[2], good = Math.abs(v - hz) < 0.15;
          emoji(ctx, p[0], R.x + 30, y + bh / 2, 26); text(ctx, p[1], R.x + 50, y + bh / 2, { size: 12, color: '#fff', align: 'left' });
          const bx = R.x + R.w * 0.3; ctx.fillStyle = 'rgba(255,255,255,.3)'; roundRect(ctx, bx, y, bw, bh, 8); ctx.fill(); ctx.fillStyle = good ? '#7be07b' : '#ff7a6b'; roundRect(ctx, bx, y, Math.max(8, bw * v), bh, 8); ctx.fill();
          ctx.strokeStyle = '#fff'; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(bx + bw * hz, y - 3); ctx.lineTo(bx + bw * hz, y + bh + 3); ctx.stroke(); ctx.setLineDash([]);
        });
        text(ctx, '┆ dashed line = healthy amount', R.x + R.w * 0.3 + bw / 2, R.y + 70 + 3 * (bh + 16), { size: 11, color: '#fff' });
        if (T.tool) { const t = TOOLS.find(t => t[0] === T.tool); emoji(ctx, t[1], R.x + R.w * 0.9, R.y + R.h * 0.55, 44); text(ctx, t[2], R.x + R.w * 0.9, R.y + R.h * 0.55 + 34, { size: 11, color: '#fff', max: R.w * 0.18 }); } else text(ctx, 'drop a fix here', R.x + R.w * 0.9, R.y + R.h * 0.55, { size: 12, color: '#fff', max: R.w * 0.18 });
        if (A2) text(ctx, `Season ${Math.min(3, 1 + Math.floor(k * 3))}`, R.x + R.w / 2, R.y + R.h - 18, { size: 16, color: '#fff' });
        if (P.showSol && !A2) { const q = trayItems().find(q => q.it.k === c[4]); if (q && T.tool !== c[4]) hand(ctx, q.x + q.w / 2, q.y + q.h / 2, P.t, 30); }
      }
      if (lab().tray) this.drawTray(ctx);
      if (A2 && A2.t > 1.8) text(ctx, A2.r.ok ? '✅ It works!' : '❌ Not yet…', Wk.x + Wk.w / 2, Wk.y + Wk.h - 18, { size: 20, color: A2.r.ok ? '#2fae66' : '#e5484d' });
    },
    _test: {
      step() {
        if (!P || !P.T) return 'none'; const T = P.T;
        if (P.phase === 'anim') { P.anim.t = 3; return 'anim'; }
        if (P.phase === 'fly') { if (!P.d.carry) { P.d.x = P.d.tx = T.spot.x; P.d.y = P.d.ty = T.spot.y; return 'pick'; } const zi = T.zones.indexOf(T.target); P.d.x = P.d.tx = (zi + 0.5) / T.zones.length; P.d.y = P.d.ty = 0.5; dropHere(); return 'drop'; }
        if (P.phase === 'kit') { T.kit.forEach(k => { k.placed = true; }); T.home.built = true; finishTask(); return 'kit'; }
        if (P.phase === 'station') { solveLab(T); check(); return T.kind; }
        return P.phase;
      },
      get P() { return P; },
      go() { if (P && P.phase === 'station') check(); },
    },
  };
}

startGame({
  mascot: '🦉',
  story: (d, e) => (e >= 3 ? 'Ranger labs are open! Rescue each animal, then feed it, build it, link food chains, run ecosystems and fix habitats that changed.' : 'A big storm mixed up the animals! Fly Ranger Hoot’s rescue drone, bring each animal home, and build it a new home.'),
  howTo: ['🚁 Tap or drag where the drone should fly (or use the arrow keys).', '❓ Fly over a lost animal to pick it up.', '⬇️ Fly to its habitat and press Drop.', '🏠 Drag food, water and shelter in to build its home.'],
  together: { helps: [{ id: 'wind', icon: '🌬️', label: 'Tailwind', cool: 15 }, { id: 'beacon', icon: '✨', label: 'Light the way', cool: 30 }] },
  lessons: level => LESSONS[level] || [],
  realLife: realFrom(REAL['habitat-heroes']),
  create: createGame,
});

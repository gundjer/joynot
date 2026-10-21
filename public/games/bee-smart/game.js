// Bee Smart: Hive Hero. Fly your bee around an open field (drag, tap where to go, or arrow keys).
// Land on a flower to open its puzzle: counting/adding/multiplying (math grade) or letters/sounds/spelling/word parts
// (reading grade), mixed together. Solve it to pollinate the flower and collect pollen. A full basket → fly home to the
// hive: drop off nectar, fan it into honey, cap it with wax, learn a hive fact, and build hive rooms.
// Dangers change by grade world. Hearts are only lost to dangers, never to wrong answers.
// Literacy levels (must match app/Games/BeeSmart.php LEVELS):
// 1 Letter Names · 2 ABC Order · 3 Letter Sounds · 4 Big & Little Letters · 5 Build Short Words · 6 Blends & Digraphs
// 7 Spelling Bee: Grade 2 · 8 ABC Order of Words · 9 Spelling Bee: Grade 3 · 10 Prefixes & Suffixes
// 11 Spelling Bee: Grade 4 · 12 More Word Parts · 13 Spelling Bee: Grade 5 · 14 Greek & Latin Roots
// Math levels: see skills.js MATH (must match BeeSmart::MATH_LEVELS).
import { startGame, rand, pick, clamp, emoji, label, roundRect, hudBottom, Sfx, Store } from '../_play/play.js';
import { LIT, MATH, MATH_MAX, mathStart, litItem, mathItem, realMath } from './skills.js';
import { makeChallenge, wrap } from './challenge.js';
import { WORLDS, WW, WH, HIVE, buildScenery, drawWorld, drawLeaves, drawHazards, drawHazardHud, makeHazards, updateHazards, newHornet, inTower, drawHornet, drawBee } from './worlds.js';
import { WHY, DANGERS, FLOWERS, CRITTERS, REAL_LIT } from './facts.js';
import { makeHive } from './hive.js';
import { makeGuide } from './guide.js';
import { coopHost } from './coop.js';
import { Meadow3D, flowerHeight } from './meadow3d.js';
import { createFlight, updateFlight, sipNectar } from './flight.js';
import { flightControls } from './flight-controls.js';

const INK = '#2b2350';
const font = (px, w = 700) => `${w} ${Math.round(px)}px Fredoka, Andika, system-ui, sans-serif`;
const strip = s => String(s || '').replace(/<[^>]+>/g, '');
const obj = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const arr = v => (Array.isArray(v) ? v : []);

function createGame(api) {
  let S = null, t = 0, fid = 1;
  const meadow = new Meadow3D();
  const brand=document.createElement('div');brand.className='buzz-title-brand';brand.innerHTML='<img src="/icons/logo.svg" width="38" height="38" alt=""><b>Joy<span>Not</span></b>';
  document.getElementById('pg-title')?.prepend(brand);
  const controls = flightControls(api, action => {
    if (!S || S.mode !== 'field' || api.paused) return;
    if (action === 'home') { S.returning = true; S.bee.tx = HIVE.x; S.bee.ty = HIVE.y; S.bee.targetAltitude = 1.2; api.toast('Follow the hive marker. Your flight timer pauses during puzzles.'); return; }
    const key = action === 'view' ? 'firstPerson' : action;
    S.vision[key] = !S.vision[key]; B().vision = { ...S.vision }; save();
  });
  const coop = coopHost(api, {
    state: () => S, shoo, plant, gold, hint: () => S && S.chal && S.chal.hint(), cheer,
    joined: g => { chime(`🐝 <b>${g.name}</b> joined your hive!`, '🐝', { ms: 5000 }); Sfx.levelUp(); refreshActions(); },
    left: g => { api.toast(`👋 ${g.name} flew home.`); refreshActions(); },
  });
  const playTogether = () => coop.features().talk && coop.count() > 0;
  function refreshActions() { if (S && S.mode === 'field' && !S.guide) fieldActions(); }

  // ------------------------------------------------ saved data
  const B = () => {
    const x = api.state.extra; x.bee = obj(x.bee); const b = x.bee;
    b.seen = obj(b.seen); b.rough = obj(b.rough); b.miss = arr(b.miss); b.rooms = arr(b.rooms); b.hats = arr(b.hats); b.intro = obj(b.intro);
    b.cards = obj(b.cards); b.cards.flowers = obj(b.cards.flowers); b.cards.critters = obj(b.cards.critters); b.cards.facts = obj(b.cards.facts);
    b.honey = b.honey | 0; b.trips = b.trips | 0;
    return b;
  };
  const kidMathGrade = () => { const k = api.kid || {}; return k.math != null && k.math !== '' ? String(k.math) : k.reads != null && k.reads !== '' ? String(k.reads) : String(api.levelInfo(api.state.level).grade || 'K').split('-')[0]; };
  const M = () => {
    const x = api.state.extra; x.math = obj(x.math); const m = x.math, g = kidMathGrade();
    if (!m.level || m.g !== g) { m.level = mathStart(g); m.g = g; m.m = {}; m.sup = 0; }
    m.m = obj(m.m); m.sup = Math.max(0, m.sup | 0); m.level = clamp(m.level | 0, 1, MATH_MAX);
    return m;
  };
  const mathWork = () => { const m = M(); return Math.max(1, m.level - m.sup); };
  function mathAdapt(lvl, clean, correct) {
    // same rules as the reading ladder: 5 of the last 6 clean = mastered; 2 rough in a row = quiet easier work; 3 clean = step back up
    const m = M(), rec = m.m[lvl] = obj(m.m[lvl]); rec.h = arr(rec.h).concat(clean ? 1 : correct ? 0.5 : 0).slice(-6);
    if (rec.h.length >= 5 && rec.h.filter(v => v === 1).length >= 5) rec.ok = rec.ok || Date.now();
    const l2 = rec.h.slice(-2), l3 = rec.h.slice(-3), struggling = l2.length === 2 && l2.every(v => v < 1) && l2.some(v => v === 0);
    const fresh = () => { const r = m.m[mathWork()]; if (r) r.h = []; };
    if (lvl < m.level) { if (l3.length === 3 && l3.every(v => v === 1)) { m.sup = Math.max(0, m.sup - 1); fresh(); } else if (struggling && lvl > 1) { m.sup++; fresh(); } return; }
    if (struggling && m.level > 1) { m.sup = 1; fresh(); return; }
    if (rec.ok && m.level < MATH_MAX) { m.level++; m.sup = 0; setTimeout(() => { chime(`⬆️ <b>Math level up!</b> ${MATH[m.level].name}`, '🏆'); Sfx.levelUp(); }, 900); }
  }
  const save = () => Store.save();
  // One time: saves from the old Bee Smart (v8, 11 levels) move to the matching new level. Kids who never played
  // keep the level the grown-up set (it already uses the new list).
  (() => {
    const d = api.state, x = d.extra, b = B();
    if (b.v) return;
    b.v = 2;
    if (!Object.keys(obj(x.m)).length) return;
    const OLD_TO_NEW = { 1: 1, 2: 1, 3: 1, 4: 3, 5: 3, 6: 4, 7: 5, 8: 6, 9: 7, 10: 9, 11: 11 };
    d.level = OLD_TO_NEW[d.level] || 1; x.m = {}; x.sup = 0; x.supLevel = d.level; x.gc = null;
    save();
  })();
  /** Narrator bubble that never covers a puzzle: queued while one is open, shown when the kid is back in the field. */
  const chime = (html, icon, o = {}) => { if (S && (S.mode === 'chal' || S.guide)) { S.queue = (S.queue || []).concat([[html, icon, o]]).slice(-2); return; } api.chime(html, icon, o); };
  const flushChimes = () => { if (!S || !S.queue || !S.queue.length) return; const q = S.queue; S.queue = []; q.forEach(([h, i, o], k) => setTimeout(() => S && S.mode !== 'chal' && api.chime(h, i, o), k * 3800)); };

  // ------------------------------------------------ trip setup
  function start(o) {
    t = 0;
    const w = WORLDS[clamp(o.edition | 0, 0, 5)], seed = 1000 + w.id * 77 + (B().trips % 3);
    S = {
      o, world: w, seed, trip: Date.now(), sc: buildScenery(w, seed), mode: 'intro', need: w.need + (o.boss ? 1 : 0),
      bee: { x: HIVE.x + 120, y: HIVE.y, vx: 0, vy: 0, tx: null, ty: null, inv: 0, stuck: 0, wet: 0, face: 1, shelter: false },
      flowers: [], done: 0, pollen: 0, nLit: 0, nMath: 0, chal: null, cam: { x: HIVE.x + 200, y: HIVE.y }, hz: makeHazards(w, o.boss), hiveMsgT: 0,
      friends: [{ k: 'ladybug', e: '🐞', x: rand(500, WW - 200), y: rand(150, WH - 150), vx: 20, vy: 10 }, { k: 'butterfly', e: '🦋', x: rand(500, WW - 200), y: rand(150, WH - 150), vx: -30, vy: 15 }],
      stolen: 0, firstFruit: !B().cards.flowers.fruit, guards: [],
      nectar: 0, flight: createFlight(w.need), vision: { uv: true, compound: false, firstPerson: false, ...B().vision }, returning: false,
    };
    S.bee.altitude = 1.55;
    while (S.flowers.filter(f => f.st === 'open').length < S.need + 3) addFlower();
    daily();
    if (S.o.boss || !B().intro[w.id]) { S.mode = 'intro'; S.introBtn = null; speakIntro(); }
    else enterField(true);
    coop.start(w);
  }
  function speakIntro() {
    const w = S.world;
    if (S.o.boss) { api.speak(`Grade Boss! Pollinate ${S.need} flowers all on your own. You need to get most of them right on the first try. You can do it!`); return; }
    api.speak(`${w.intro} ${pick(WHY)} Watch out for: ${w.dangers.map(d => DANGERS[d].name + '. ' + DANGERS[d].text).join(' ')}`);
  }
  function enterField(chimeWhy) {
    S.mode = 'field';
    const b = B(); b.intro[S.world.id] = b.intro[S.world.id] || Date.now();
    S.world.dangers.forEach(d => { const c = { hornet: 'hornet', raid: 'hornet', bird: S.world.id === 4 ? 'pigeon' : 'bird', web: 'web', spray: 'tractor' }[d]; if (c) b.cards.critters[c] = 1; });
    setGoal(); fieldActions();
    if (chimeWhy) chime(pick(WHY), '🐝', { ms: 7000 });
    if (S.daily && !S.daily.done && !S.daily.told) { S.daily.told = 1; setTimeout(() => S && chime(`👑 <b>Queen’s request:</b> ${S.daily.text} for a bonus!`, '👑', { ms: 6000 }), chimeWhy ? 7500 : 600); }
    save();
  }
  function fieldActions() {
    const list = [{ key: 'guide', label: '📖' }, { key: 'say', label: '🔊' }];
    api.actions(list);
  }
  function setGoal() {
    if (!S) return;
    if (S.done >= S.need) api.goal('🍯 Basket full! Fly home to the <b>hive</b>.', { speak: false });
    else api.goal(`🌼 Fly to a flower and solve its puzzle. Pollinated <b>${S.done}/${S.need}</b>`, { speak: false });
    api.progress(S.done / S.need, 'Pollen');
    api.score(`🍯 ${B().honey}`);
  }

  function addFlower(at, isGold) {
    const w = S.world;
    let p = at, tries = 0;
    while (!p && tries++ < 200) {
      const q = { x: rand(380, WW - 70), y: rand(90, WH - 90) };
      if (Math.hypot(q.x - HIVE.x, q.y - HIVE.y) < 300) continue;
      if (inTower(S.sc, q.x, q.y, 50)) continue;
      if (S.sc.webs.some(c => Math.hypot(c.x - q.x, c.y - q.y) < c.r + 70)) continue;
      if (S.flowers.some(f => Math.hypot(f.x - q.x, f.y - q.y) < 150)) continue;
      p = q;
    }
    if (!p) p = { x: rand(400, WW - 80), y: rand(100, WH - 100) };
    const wantGold = S.daily && S.daily.k === 'gold' && !S.daily.done && !S.flowers.some(f => f.gold && f.st === 'open');
    const f = { id: fid++, x: p.x, y: p.y, e: pick(w.flowers), st: 'open', gold: !!isGold || wantGold || Math.random() < 0.08, grow: 0, ph: Math.random() * 6 };
    S.flowers.push(f); return f;
  }

  function daily() {
    const b = B(), day = new Date().toISOString().slice(0, 10);
    if (!b.daily || b.daily.d !== day) {
      const e = pick(S.world.flowers), opts = [
        { k: 'flower', e, need: 2, text: `pollinate 2 ${e} flowers` }, { k: 'math', need: 3, text: 'solve 3 number flowers 🔢' },
        { k: 'lit', need: 3, text: 'solve 3 letter flowers 🔤' }, { k: 'gold', need: 1, text: 'find a golden flower ✨' },
      ];
      b.daily = { d: day, got: 0, done: false, paid: false, ...pick(opts) };
    }
    S.daily = b.daily;
    if (S.daily.k === 'flower' && !S.world.flowers.includes(S.daily.e)) { S.daily.e = pick(S.world.flowers); S.daily.text = `pollinate 2 ${S.daily.e} flowers`; }
  }
  function dailyHit(f, it) {
    const d = S.daily; if (!d || d.done) return;
    const hit = (d.k === 'flower' && f.e === d.e) || (d.k === 'math' && it.fam === 'math') || (d.k === 'lit' && it.fam === 'lit') || (d.k === 'gold' && f.gold);
    if (!hit) return;
    d.got++;
    if (d.got >= d.need) { d.done = true; setTimeout(() => S && chime('👑 You finished the <b>Queen’s request</b>! +10 bonus honey at the hive.', '👑', { ms: 5000 }), 2600); }
  }

  // ------------------------------------------------ picking a puzzle (interleaved + spaced review)
  const skillKey = it => (it.fam === 'lit' ? 'l' : 'm') + it.lvl;
  function pickItem() {
    const b = B();
    if (S.o.boss) { const lvl = pick(S.o.bossLevels || [api.state.level]); return { it: litItem(lvl), review: false }; }
    const pLit = clamp(0.5 + 0.18 * (S.nMath - S.nLit), 0.15, 0.85);
    const fam = Math.random() < pLit ? 'lit' : 'math';
    const work = fam === 'lit' ? api.learn.work() : mathWork();
    const again = b.miss.filter(m => m.fam === fam && m.lvl <= work);
    if (again.length && Math.random() < 0.3) { const it = pick(again); return { it: { ...it }, review: it.lvl < work, again: true }; }
    const lvl = work > 1 && Math.random() < 0.35 ? rand(Math.max(1, work - 3), work - 1) : work;
    return { it: fam === 'lit' ? litItem(lvl) : mathItem(lvl), review: lvl < work };
  }
  function stageFor(it, review) {
    if (S.o.boss) return 'you';
    const b = B(), k = skillKey(it), n = b.seen[k] | 0;
    if (n === 0 && !review) return 'demo';
    if (b.rough[k] || n < 3) return 'we';
    return 'you';
  }
  function openChallenge(f) {
    const { it, review, again } = pickItem();
    S.mode = 'chal'; S.bee.vx = S.bee.vy = 0; S.bee.tx = S.bee.ty = null;
    document.getElementById('pg-chime')?.classList.add('hidden'); // the puzzle needs the whole screen
    if (it.fam === 'lit') S.nLit++; else S.nMath++;
    api.actions([]);
    if (again) chime(`🌱 This puzzle is blooming again. You’ve got this!`, '🌱', { speak: false, ms: 3000 });
    const stage = stageFor(it, review);
    launch(f, it, stage, review, again);
  }
  function launch(f, it, stage, review, again) {
    api.goal(`${f.e} ${it.show}`, { speak: false });
    S.chal = makeChallenge(api, it, {
      stage, flower: f.e, boss: S.o.boss,
      extra: () => (playTogether() ? [
        { ic: '🎙️', hold: true, down: () => { S.micHeld = true; }, up: () => { S.micHeld = false; } },
        { ic: '🙋', fn: () => { coop.chat('🤔 Help me!'); api.toast('🙋 You asked for help!', 1800); } },
      ] : []),
      onDone: res => {
        if (res.demo) { const it2 = it.fam === 'lit' ? litItem(it.lvl) : mathItem(it.lvl); launch(f, it2, 'we', review, false); return; }
        result(f, it, stage, review, again, res);
      },
    });
    S.chalFlower = f;
    coop.event({ t: 'chal', coach: S.chal.coach() });
  }
  function result(f, it, stage, review, again, res) {
    const b = B(), k = skillKey(it), clean = res.firstTry && !res.helped;
    const expected = it.type === 'num' ? it.ans : it.type === 'order' ? it.ans.join(', ') : it.word || it.ans.join(' + ');
    const base = { correct: !res.helped, firstTry: res.firstTry, helped: res.helped, prompt: it.say || strip(it.show), expected, given: res.given, boss: S.o.boss, review };
    if (it.fam === 'lit') {
      const r = api.record({ ...base, level: it.lvl, adapt: stage === 'you' });
      if (r.levelUp) setTimeout(() => { chime(`⬆️ <b>Level up!</b> ${api.levelInfo(api.state.level).name}`, '🏆'); }, 1200);
      if (r.gradeBoss) setTimeout(() => chime('🎓 You mastered this grade! The <b>Grade Boss</b> is ready on the menu.', '🏆'), 1200);
    } else {
      api.record({ ...base, level: 100 + it.lvl, track: 'math', adapt: false });
      if (stage === 'you' && !review && !S.o.boss) mathAdapt(it.lvl, clean, !res.helped);
    }
    b.seen[k] = (b.seen[k] | 0) + 1;
    if (stage === 'you' && res.helped) b.rough[k] = 1; else if (stage === 'we' && clean) delete b.rough[k];
    // spaced review: puzzles that were hard come back on a later flower
    const strip2 = ({ ...x }) => x;
    b.miss = b.miss.filter(m => m.key !== it.key);
    if (!clean) b.miss = b.miss.concat(strip2(it)).slice(-12);
    S.chal = null; S.chalFlower = null;
    pollinate(f, it);
    coop.event({ t: 'chalDone' });
    save();
  }
  function pollinate(f, it) {
    const b = B(), p = f.gold ? 2 : 1;
    f.st = 'done'; f.fruit = f.e==='🌸' && S.world.id===1 ? pick(['🍎','🍒']) : '🌱'; f.grow = 0;
    S.done++; S.pollen += p; S.nectar += p + 1; sipNectar(S.flight);
    b.cards.flowers[f.e] = 1;
    dailyHit(f, it);
    Sfx.coin(); api.confetti();
    const name = (FLOWERS[f.e] || ['flower'])[0].toLowerCase();
    let line = `🌟 You pollinated the ${name}! +${p} pollen${f.gold ? ' ✨' : ''}.`;
    if (S.firstFruit) { S.firstFruit = false; b.cards.flowers.fruit = 1; line += ' Moving pollen between flowers helps plants make seeds. Fruit-tree blossoms can grow into fruit!'; }
    else if (Math.random() < 0.45) line += ' 🌍 ' + (it.fam === 'math' ? realMath(it.real) : (REAL_LIT[it.lvl] || ['', ''])[1]);
    S.mode = 'field'; fieldActions();
    api.chime(line, '🐝', { ms: 6500 });
    setTimeout(flushChimes, 6600);
    if (S.done >= S.need) setTimeout(() => S && chime('🧺 Your basket is full! Follow the arrow back to the 🍯 hive.', '🍯', { ms: 5000 }), 3500);
    while (S.flowers.filter(x => x.st === 'open').length < 4) addFlower();
    setGoal();
  }

  // ------------------------------------------------ dangers
  function hit(kind, why) {
    const b = S.bee;
    if (b.inv > 0 || S.mode !== 'field') return false;
    b.inv = 2;
    const c = { hornet: 'hornet', bird: S.world.id === 4 ? 'pigeon' : 'bird', web: 'web', spray: 'tractor' }[kind]; if (c) B().cards.critters[c] = 1;
    api.loseHeart(why);
    return true;
  }
  // grown-up helpers (co-op)
  function shoo(id, who) { if (!S) return; const h = S.hz.list.find(x => x.id === id && !x.gone); if (!h) return; h.flee = 8; Sfx.whoosh(); coop.flyTo(who, h.x, h.y); }
  function plant(x, y, who) { if (!S || S.mode === 'hive') return; const f = addFlower({ x: clamp(x, 360, WW - 60), y: clamp(y, 60, WH - 60) }); Sfx.pop(); coop.flyTo(who, f.x, f.y); api.toast(`🌱 ${who && who.name ? who.name : 'A helper'} planted a flower!`); }
  function gold(id, who) { if (!S) return; const f = S.flowers.find(x => x.id === id && x.st === 'open'); if (!f) return; f.gold = true; Sfx.coin(); coop.flyTo(who, f.x, f.y); }
  function cheer(who) { api.toast(`🎉 ${who && who.name ? who.name : 'Your grown-up'} says: Great job!`); Sfx.levelUp(); api.confetti(); }

  // ------------------------------------------------ hornet raid (5th grade): defend the hive before going in
  function startRaid() {
    S.mode = 'raid'; S.raidT = 0; api.actions([]);
    S.hz.list.forEach(h => { h.gone = true; });
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i / 4) * Math.PI + (Math.random() - 0.5) * 0.3; S.hz.list.push(newHornet(S.world, false, { x: HIVE.x + Math.cos(a) * (650 + i * 70), y: HIVE.y + Math.sin(a) * 520, raid: true })); }
    api.goal('🛡️ <b>Hornet raid!</b> Tap the hornets (or fly into them) to call the guard bees!', { speak: false });
    chime(DANGERS.raid.text, '🛡️', { ms: 7000 });
  }
  function ballHornet(h) { if (h.ball || h.gone) return; h.ball = 1.3; Sfx.zap(); }
  function updateRaid(dt) {
    S.raidT += dt;
    for (const h of S.hz.list) {
      if (h.gone || !h.raid) continue;
      if (h.ball) { h.ball -= dt; if (h.ball <= 0) { h.gone = true; Sfx.pop(); } continue; }
      const dx = HIVE.x - h.x, dy = HIVE.y - h.y, d = Math.hypot(dx, dy) || 1;
      h.x += dx / d * 75 * dt; h.y += dy / d * 75 * dt; h.face = dx > 0 ? 1 : -1;
      if (Math.hypot(h.x - S.bee.x, h.y - S.bee.y) < 50) ballHornet(h);
      if (d < HIVE.r) { h.gone = true; S.stolen += 1; Sfx.wrong(); api.toast('🐝 A hornet stole some honey! Stop the next one!'); }
    }
    if (S.hz.list.filter(h => h.raid && !h.gone).length === 0) { chime(S.stolen ? `The guards chased them off! You lost ${S.stolen} pollen to the hornets.` : 'Perfect defense! The guard bees made hot bee balls around every hornet!', '🛡️', { ms: 5000 }); goHive(); }
  }

  // ------------------------------------------------ hive
  function goHive() {
    if (!S || S.mode === 'hive') return;
    if (S.pollen <= S.stolen) { api.toast('Visit a flower first. Your hive’s saved honey is safe.'); return; }
    const b = B();
    S.mode = 'hive'; api.progress(null);
    api.goal('🍯 <b>Inside the hive</b>', { speak: false });
    const bonus = S.daily && S.daily.done && !S.daily.paid ? 10 : 0; if (bonus) S.daily.paid = true;
    S.hive = makeHive(api, {
      world: S.world, pollen: S.pollen - S.stolen, nectar: S.nectar, bonus, bee: b, save, renderer: meadow,
      guards: () => coop.count(), guardFanning: () => coop.fanning(),
      onCard: (kind, id) => { b.cards[kind === 'fact' ? 'facts' : kind][id] = 1; save(); },
      onDone: ({ earned }) => { b.trips++; api.score(`🍯 ${b.honey}`); save(); api.finish({ win: S.done>=S.need, title: S.done>=S.need?'🍯 Honey made!':'Safe return!', text: `You pollinated ${S.done} flowers and made ${earned} honey for the hive.` }); },
    });
    coop.event({ t: 'hive' });
    save();
  }

  // ------------------------------------------------ camera
  const view = () => { const W = api.W, H = api.H, sc = clamp(Math.min(W, H) / 560, 0.62, 1.25), top = hudBottom(); return { W, H, sc, cy: (top + H) / 2, top }; };
  const toScreen = (x, y) => { if (meadow.backend === 'webgl') return meadow.screenPoint(x,y,1.5) || {x:-100,y:-100}; const v = view(); return { x: (x - S.cam.x) * v.sc + v.W / 2, y: (y - S.cam.y) * v.sc + v.cy }; };
  const toWorld = (x, y) => { if (meadow.backend === 'webgl') return meadow.toWorld(x,y,S.bee.altitude) || {x:S.bee.x,y:S.bee.y}; const v = view(); return { x: (x - v.W / 2) / v.sc + S.cam.x, y: (y - v.cy) / v.sc + S.cam.y }; };

  // ------------------------------------------------ update
  function update(dt) {
    if (!S) return;
    t += dt;
    coop.tick(dt);
    if (api.input.pressed('say')) api.speak(strip(document.querySelector('.pg-goal')?.innerHTML || ''));
    // hold-to-talk (field button, or 🎙️ in a puzzle)
    if (api.input.held('talk') || S.micHeld) coop.talkDown(); else if (coop.talking) coop.talkUp();
    if (S.chatOpen) return;
    if (api.input.pressed('guide') && S.mode === 'field') { S.guide = makeGuide(api, { bee: B(), save, onClose: () => { S.guide = null; flushChimes(); refreshActions(); } }); }
    if (S.guide) return;
    if (S.mode === 'chal') { S.chal && S.chal.update(dt); return; }
    if (S.mode === 'hive') { S.hive.update(dt); return; }
    if (S.mode === 'intro') return;
    // flowers grow fruit, friends wander
    for (const f of S.flowers) { f.grow = Math.min(1, f.grow + dt * 0.6); }
    for (const fr of S.friends) { fr.x += fr.vx * dt; fr.y += fr.vy * dt; if (fr.x < 400 || fr.x > WW - 60) fr.vx *= -1; if (fr.y < 60 || fr.y > WH - 60) fr.vy *= -1; if (!B().cards.critters[fr.k] && Math.hypot(fr.x - S.bee.x, fr.y - S.bee.y) < 60) { B().cards.critters[fr.k] = 1; const c = CRITTERS[fr.k]; chime(`New friend! <b>${c[1]}</b>: ${c[2]} 📖`, c[0], { ms: 5000 }); save(); } }
    moveBee(dt);
    if (S.mode === 'raid') { updateRaid(dt); camera(dt); return; }
    updateHazards(S.hz, S.world, S.sc, dt, t, { bee: S.bee, safe: false, hit, stuckFor: s => { S.bee.stuck = s; }, toast: m => api.toast(m, 1600) });
    const flightEvent = updateFlight(S.flight, dt, { moving: Math.hypot(S.bee.vx,S.bee.vy)>20, boost: controls.held('boost'), wet: S.bee.inRain, wind: S.hz.wind.on>0, shelter: S.bee.shelter });
    if (flightEvent === 'warning') { api.toast('Time to head home! Tap Hive. Nectar powers your flight; pollen feeds the growing bees.',5000); }
    if (flightEvent === 'rescue') {
      S.bee.x=HIVE.x; S.bee.y=HIVE.y; S.bee.vx=S.bee.vy=0; S.bee.tx=S.bee.ty=null; S.bee.altitude=1.2;
      api.toast('The guard bees brought you home safely. Your learning progress is saved.',4500);
      if(S.pollen>S.stolen){goHive();return;} S.flight=createFlight(S.need); S.bee.x=HIVE.x+120; S.returning=false;
    }
    // landing on a flower
    for (const f of S.flowers) if (!S.returning && f.st === 'open' && Math.hypot(f.x - S.bee.x, f.y - S.bee.y) < 44 && (meadow.backend !== 'webgl' || Math.abs(S.bee.altitude-flowerHeight(f))<.55)) { openChallenge(f); break; }
    // home
    S.hiveMsgT = Math.max(0, S.hiveMsgT - dt);
    if (S.mode === 'field' && Math.hypot(S.bee.x - HIVE.x, S.bee.y - HIVE.y) < HIVE.r) {
      if (S.pollen > S.stolen && S.bee.altitude < 2.5) { if (S.world.haz.raid && S.done >= S.need) startRaid(); else goHive(); }
      else if (!S.hiveMsgT) { S.hiveMsgT = 4; api.toast(`🧺 Pollinate ${S.need - S.done} more flower${S.need - S.done > 1 ? 's' : ''} first!`, 2000); }
    }
    camera(dt);
  }
  function moveBee(dt) {
    const b = S.bee, boosting = controls.held('boost') && S.flight.stamina>5;
    const sp = 280 * (boosting?1.65:1) * (b.inRain && !b.shelter ? 0.55 : 1);
    const vertical = (controls.held('rise')?1:0)-(controls.held('fall')?1:0);
    if (vertical) { b.altitude = clamp(b.altitude+vertical*dt*1.7,.4,5.5); b.targetAltitude=null; }
    else if (b.targetAltitude!=null) b.altitude += clamp(b.targetAltitude-b.altitude,-dt*1.7,dt*1.7);
    b.inv = Math.max(0, b.inv - dt); b.stuck = Math.max(0, b.stuck - dt);
    let ix = api.input.x, iy = api.input.y;
    if (ix || iy) { b.tx = b.ty = null; b.targetAltitude=null; }
    else if (b.tx != null) { const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy); if (d < 8) { b.tx = b.ty = null; } else { ix = dx / d * Math.min(1, d / 60); iy = dy / d * Math.min(1, d / 60); } }
    const m = Math.hypot(ix, iy); if (m > 1) { ix /= m; iy /= m; }
    const k = Math.min(1, dt * 7);
    if (b.stuck > 0) { b.vx *= 0.5; b.vy *= 0.5; }
    else { b.vx += (ix * sp - b.vx) * k; b.vy += (iy * sp - b.vy) * k; }
    let nx = clamp(b.x + b.vx * dt, 24, WW - 24), ny = clamp(b.y + b.vy * dt, 24, WH - 24);
    if (S.sc.towers.length) { if (inTower(S.sc, nx, b.y, 18)) { nx = b.x; b.vx = 0; } if (inTower(S.sc, nx, ny, 18)) { ny = b.y; b.vy = 0; } }
    b.x = nx; b.y = ny;
    if (Math.abs(b.vx) > 10) b.face = b.vx > 0 ? 1 : -1;
    b.shelter = b.altitude<2.15 && S.sc.leaves.some(l => Math.hypot(l.x - b.x, l.y - b.y) < l.r);
  }
  function camera(dt) {
    const v = view(), hw = v.W / 2 / v.sc, hh = (v.H - v.top) / 2 / v.sc;
    const tx = clamp(S.bee.x, hw - 60, WW - hw + 60), ty = clamp(S.bee.y, hh - 60, WH - hh + 60);
    S.cam.x += (tx - S.cam.x) * Math.min(1, dt * 5); S.cam.y += (ty - S.cam.y) * Math.min(1, dt * 5);
  }

  // ------------------------------------------------ draw
  function draw(ctx, W, H, title) {
    t += 0;
    if (!S) { controls.hide(); if(meadow.title(ctx,W,H,performance.now()/1000))return; const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#bfe9ff'); g.addColorStop(1, '#eafbe0'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); emoji(ctx, '🌼', W * 0.2, H * 0.75, 70); emoji(ctx, '🌻', W * 0.8, H * 0.8, 80); emoji(ctx, '🐝', W / 2 + Math.sin(performance.now() / 400) * 40, H * 0.2, 70); return; }
    const v = view();
    controls.sync(S,v.top,meadow.backend);
    if (S.mode === 'hive') { S.hive.draw(ctx, W, H, v.top); drawGuards(ctx, true); return; }
    const rendered = meadow.draw(ctx,W,H,v.top,S,t,coop.guards());
    if (!rendered) {
    ctx.save();
    ctx.translate(W / 2, v.cy); ctx.scale(v.sc, v.sc); ctx.translate(-S.cam.x, -S.cam.y);
    const vw = { x: S.cam.x - W / 2 / v.sc, y: S.cam.y - (v.cy) / v.sc, w: W / v.sc, h: H / v.sc };
    drawWorld(ctx, S.world, S.sc, t, vw);
    // flowers
    for (const f of S.flowers) {
      if (f.x < vw.x - 80 || f.x > vw.x + vw.w + 80 || f.y < vw.y - 80 || f.y > vw.y + vw.h + 80) continue;
      if (f.st === 'open') {
        if (f.gold) { ctx.fillStyle = `rgba(255,215,0,${0.35 + 0.2 * Math.sin(t * 4 + f.ph)})`; ctx.beginPath(); ctx.arc(f.x, f.y, 46, 0, 7); ctx.fill(); }
        ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(f.x + 4, f.y + 26, 24, 8, 0, 0, 7); ctx.fill();
        emoji(ctx, f.e, f.x, f.y + Math.sin(t * 2 + f.ph) * 2, 64);
        emoji(ctx, '✨', f.x + 26, f.y - 26 + Math.sin(t * 3 + f.ph) * 3, 20, { alpha: 0.5 + 0.5 * Math.sin(t * 3 + f.ph) });
      } else {
        emoji(ctx, f.e, f.x, f.y, 44, { alpha: 0.55 });
        emoji(ctx, f.fruit, f.x + 14, f.y + 10, 16 + 22 * f.grow);
      }
    }
    drawLeaves(ctx, S.sc);
    for (const fr of S.friends) emoji(ctx, fr.e, fr.x, fr.y + Math.sin(t * 4) * 3, 30, { flip: fr.vx > 0 });
    drawHazards(ctx, S.hz, S.world, t, S.bee);
    // raid balls
    for (const h of S.hz.list) if (h.ball && !h.gone) for (let i = 0; i < 8; i++) { const a = t * 6 + i * Math.PI / 4; emoji(ctx, '🐝', h.x + Math.cos(a) * 34, h.y + Math.sin(a) * 34, 26); }
    const b = S.bee;
    if (!(b.inv > 0 && Math.floor(t * 12) % 2)) drawBee(ctx, b.x, b.y, 62, t, b.face, B().hat, 1);
    if (b.wet > 0.2) { ctx.fillStyle = 'rgba(60,120,220,.85)'; ctx.fillRect(b.x - 30, b.y + 36, 60 * (b.wet / 3.2), 6); emoji(ctx, '💧', b.x - 40, b.y + 39, 16); }
    if (b.shelter) emoji(ctx, '☂️', b.x + 26, b.y - 30, 22, { alpha: 0.8 });
    if (b.stuck > 0) emoji(ctx, '🕸️', b.x, b.y, 50, { alpha: 0.6 });
    label(ctx, `🧺 ${S.done}/${S.need}`, b.x, b.y - 52, { size: 15, bg: S.done >= S.need ? '#2fae66' : '#e08a00' });
    drawGuards(ctx, false);
    ctx.restore();
    }
    // screen overlays
    drawHazardHud(ctx, S.hz, W, H, t, toScreen, S.bee);
    if (S.mode === 'field' || S.mode === 'raid') drawPointer(ctx, W, H, v);
    if (S.daily && (S.mode === 'field')) {
      const d = S.daily, txt = d.done ? '👑 Queen’s request done! ✔' : `👑 ${d.text} (${d.got}/${d.need})`;
      ctx.font = font(12);const shown=W<550&&txt.length>45?txt.slice(0,43)+'…':txt; const w = Math.min(W-16,ctx.measureText(shown).width + 20); ctx.fillStyle = 'rgba(27,45,24,.8)'; roundRect(ctx, 8, v.top + 55, w, 24, 12); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(shown, 18, v.top + 67);
    }
    if (S.mode === 'intro') drawIntro(ctx, W, H, v.top);
    if (S.mode === 'chal' && S.chal) S.chal.draw(ctx, W, H, v.top);
    if (S.guide) S.guide.draw(ctx, W, H, v.top);
  }
  function drawGuards(ctx, screen) {
    const gs = coop.guards(); if (!gs.length) return;
    for (const g of gs) {
      if (screen) { emoji(ctx, '🐝', 40 + gs.indexOf(g) * 50, api.H - 40, 38); continue; }
      drawBee(ctx, g.x, g.y, 46, t + gs.indexOf(g), g.x < S.bee.x ? 1 : -1, '', 0.95, g.color);
      label(ctx, g.name, g.x, g.y - 36, { size: 12, bg: g.color || '#8b6cff' });
    }
  }
  function drawPointer(ctx, W, H, v) {
    // arrow to the hive when the basket is full; else to the nearest open flower if none is on screen
    let tgt = null, icon = '🍯';
    if (S.done >= S.need || S.returning || S.flight.warned) tgt = HIVE;
    else {
      const on = S.flowers.filter(f => f.st === 'open').map(f => ({ f, p: toScreen(f.x, f.y) }));
      if (!on.some(o => o.p.x > 0 && o.p.x < W && o.p.y > v.top && o.p.y < H)) { const n = on.sort((a, b2) => Math.hypot(a.f.x - S.bee.x, a.f.y - S.bee.y) - Math.hypot(b2.f.x - S.bee.x, b2.f.y - S.bee.y))[0]; if (n) { tgt = n.f; icon = n.f.e; } }
    }
    if (!tgt) return;
    const p = toScreen(tgt.x, tgt.y);
    if (p.x > 30 && p.x < W - 30 && p.y > v.top + 30 && p.y < H - 30) { if (tgt === HIVE) { emoji(ctx, '⬇️', p.x, p.y - 110 * v.sc + Math.sin(t * 6) * 6, 34); } return; }
    const cx = W / 2, cy = v.cy, a = Math.atan2(p.y - cy, p.x - cx);
    const ex = clamp(cx + Math.cos(a) * W, 40, W - 40), ey = clamp(cy + Math.sin(a) * H, v.top + 40, H - 40);
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); ctx.fillStyle = tgt === HIVE ? '#2fae66' : '#e08a00';
    ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(-8, -18); ctx.lineTo(-8, 18); ctx.closePath(); ctx.fill(); ctx.restore();
    emoji(ctx, icon, ex - Math.cos(a) * 34, ey - Math.sin(a) * 34, 30);
    if (S.world.id === 4 && tgt === HIVE) {
      const dirs = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'], d = dirs[(Math.round(Math.atan2(HIVE.y - S.bee.y, HIVE.x - S.bee.x) / (Math.PI / 4)) + 8) % 8];
      label(ctx, `🧭 Hive is ${d}`, W / 2, H - 30, { size: 16, bg: '#2b2350' });
    }
  }
  function drawIntro(ctx, W, H, top) {
    ctx.fillStyle = 'rgba(30,20,0,.5)'; ctx.fillRect(0, 0, W, H);
    const short = H < 520, fs = short ? 14 : 16;
    const w = S.world, pw = Math.min(W - 16, 640), px = (W - pw) / 2, avail = H - top - 14;
    const est = (short ? 42 : 52) + 4 * (fs + 6) + 14 + (S.o.boss ? 0 : fs + 8 + Math.ceil(w.dangers.length / (short && pw > 500 ? 2 : 1)) * (short ? 46 : 52)) + 84;
    const ph = Math.min(avail, est), py = top + 6 + (avail - ph) / 2;
    ctx.fillStyle = '#fffdf3'; roundRect(ctx, px, py, pw, ph, 18); ctx.fill(); ctx.strokeStyle = '#f5b301'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = font(short ? 20 : 26);
    ctx.fillText(S.o.boss ? `🎓 Grade Boss: ${w.name}` : `${w.icon} ${w.name}`, W / 2, py + 12);
    let y = py + (short ? 42 : 52);
    ctx.font = font(fs, 600);
    const text = S.o.boss ? `Pollinate ${S.need} flowers all on your own. Get most of them right on the first try to graduate!` : w.intro;
    wrap(ctx, text, pw - 40).slice(0, 4).forEach(l => { ctx.fillText(l, W / 2, y); y += fs + 6; });
    y += 6;
    if (!S.o.boss) {
      ctx.font = font(fs); ctx.fillStyle = '#c0392b'; ctx.fillText('Watch out for:', W / 2, y); y += fs + 8;
      const rowH = short ? 46 : 52, avail = py + ph - 80 - y, nrows = Math.max(1, Math.min(w.dangers.length, Math.floor(avail / rowH)));
      const cols = short && pw > 500 ? 2 : 1, cw = (pw - 30) / cols;
      w.dangers.slice(0, nrows * cols).forEach((d, i) => {
        const D = DANGERS[d], x = px + 15 + (i % cols) * cw, yy = y + Math.floor(i / cols) * rowH;
        ctx.fillStyle = '#fff3c4'; roundRect(ctx, x, yy, cw - 8, rowH - 6, 10); ctx.fill();
        if (D.icon === '#hornet') drawHornet(ctx, x + 28, yy + rowH / 2 - 3, rowH * 0.85, t); else emoji(ctx, D.icon, x + 28, yy + rowH / 2 - 3, rowH * 0.62);
        ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.font = font(short ? 11 : 14, 600);
        wrap(ctx, `${D.name}: ${D.text}`, cw - 66).slice(0, 3).forEach((l, j) => ctx.fillText(l, x + 54, yy + 3 + j * (short ? 13 : 18)));
        ctx.textAlign = 'center';
      });
    }
    const r = { x: W / 2 - 110, y: py + ph - 66, w: 220, h: 56 };
    ctx.fillStyle = '#2fae66'; roundRect(ctx, r.x, r.y, r.w, r.h, 16); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = font(22); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('▶ Let’s fly!', W / 2, r.y + r.h / 2 + 1);
    S.introBtn = r;
  }

  // ------------------------------------------------ input
  const inR = (r, x, y) => r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  function onTap(x, y) {
    if (!S) return;
    if (S.guide) { S.guide.tap(x, y); return; }
    if (S.mode === 'intro') { if (inR(S.introBtn, x, y)) { api.voice.stop(); Sfx.click(); enterField(false); } return; }
    if (S.mode === 'chal') { S.chal && S.chal.tap(x, y); return; }
    if (S.mode === 'hive') { S.hive.tap(x, y); return; }
    const screenFlower=meadow.backend==='webgl'?S.flowers.filter(f=>f.st==='open').map(f=>({f,p:meadow.screenPoint(f.x,f.y,flowerHeight(f))})).filter(o=>o.p&&Math.hypot(o.p.x-x,o.p.y-y)<45).sort((a,b)=>Math.hypot(a.p.x-x,a.p.y-y)-Math.hypot(b.p.x-x,b.p.y-y))[0]?.f:null;
    const w = screenFlower || toWorld(x, y);
    if (S.mode === 'raid') { const h = S.hz.list.find(q => q.raid && !q.gone && !q.ball && Math.hypot(q.x - w.x, q.y - w.y) < 80); if (h) { ballHornet(h); return; } }
    const f = S.flowers.find(q => q.st === 'open' && Math.hypot(q.x - w.x, q.y - w.y) < 60);
    const target=screenFlower||f;
    S.returning=false; S.bee.tx = target ? target.x : w.x; S.bee.ty = target ? target.y : w.y; if(target)S.bee.targetAltitude=flowerHeight(target); S.drag = true;
  }
  function onMove(x, y) { if (!S || S.mode !== 'field' && S.mode !== 'raid' || S.guide || !S.drag) return; const w = toWorld(x, y); S.bee.tx = w.x; S.bee.ty = w.y; }
  function onUp() { if (!S) return; S.drag = false; if (S.mode === 'hive') S.hive.up(); if (S.chal) S.chal.release(); S.micHeld = false; }
  document.addEventListener('keydown', e => { if (!S || S.mode !== 'chal' || !S.chal || api.paused) return; if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace') { S.chal.typeKey(e.key); if (e.key === 'Backspace') e.preventDefault(); } });

  return {
    start, update, draw, onTap, onMove, onUp,
    tapZone: (x,y) => !S || S.mode !== 'field' || !!S.guide || (meadow.backend==='webgl'&&S.flowers.some(f=>{if(f.st!=='open')return false;const p=meadow.screenPoint(f.x,f.y,flowerHeight(f));return p&&Math.hypot(p.x-x,p.y-y)<45;})),
    stop() { controls.hide(); coop.stop(); coop.talkUp(); coop.closeChat(); S = null; api.progress(null); },
    checkpoint() {
      // out of hearts: this field trip starts over (honey already in the hive is safe)
      if (!S) return;
      const o = S.o; start({ ...o }); if (S.mode === 'intro') enterField(false);
      api.toast('🌼 New field trip! Your hive’s honey is safe.', 2600);
    },
    _S: () => S, _B: B, _M: M, _hit: hit, _goHive: goHive, _renderer: meadow,
  };
}

startGame({
  mascot: '🐝',
  together: false, // Bee Smart runs its own Guard Bee play-together (coop.js)
  stick: true,
  story: (d, e) => `Pollen, Honey & Survival. Explore ${WORLDS[Math.min(5, e)].name} in 3D, discover flowers through bee eyes, solve learning missions, and bring your harvest home.`,
  howTo: [
    '👆 Drag on the left, tap a flower, or use arrow keys / WASD to fly. R rises, F lowers, and Shift boosts.',
    '👁️ Switch between follow view and bee eyes. UV guides reveal nectar patterns; compound eyes are optional.',
    '⏱️ Bring nectar and pollen home before your energy or flight time runs out. Puzzles pause the flight timer.',
    '🌼 Land on a flower to open its puzzle. Solve it to pollinate the flower and get pollen.',
    '❤️ Wrong answers are OK: Buzzy helps you. You only lose hearts to dangers like hornets and birds.',
    '🧺 Basket full? Follow the arrow to the 🍯 hive to make honey and build your hive.',
    '📖 Open the Field Guide to see what you found and pick a hat.',
  ],
  lessons: () => [],
  realLife: Object.fromEntries(Object.entries(REAL_LIT).map(([k, [e, tx]]) => [k, [`${e} ${tx}`]])),
  create: createGame,
});

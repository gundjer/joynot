// Time Tunnel: Dottie's time machine zooms through the eras! Steer up and down to grab the lost artifacts ✨
// and dodge the Time Bandits 🦹. Then pin what you found on the timeline rope: first → last, long ago ↔ today,
// oldest → newest, at the right YEAR on a number-line rope, or in the right century.
// Levels (must match app/Games/TimeTunnelSorters.php):
// 1 First, Next, Last · 2 Long Ago or Today? · 3 Growing & Changing · 4 Old to New Inventions · 5 Invention Timeline
// 6 Big Moments in History · 7 Which Came First? · 8 Centuries · 9 History Timeline Pro
import { startGame, rand, pick, shuffle, clamp, emoji, roundRect, realFrom, playBox, Sfx } from '../_play/play.js';
import { REAL } from '../_joy/js/reallife.js';
import { SEQ, THEN_NOW, GROW, INV, EVT, yearText, ORD } from './data.js';
import { LESSONS } from './lessons.js';
import { text, panel, hand, popups, particles, teach, taskLevel, inBox } from '../_play/kit.js';

const ERAS = [['#ffd9a0', '#c99a5b', ['🔺', '🐫', '🌵']], ['#9fc7ff', '#5c9e4a', ['🏰', '🛡️', '🌲']], ['#b8d8ff', '#6fbf4a', ['⛵', '🏠', '🌳']], ['#c8c8d8', '#7a6a5a', ['🚂', '🏭', '🎩']], ['#8fd3ff', '#5cbf4a', ['🏙️', '🚗', '📺']]];
const NICE = [10, 20, 25, 50, 100, 200, 250, 500, 1000];
const sample = (a, n) => shuffle(a).slice(0, n);
function spaced(pool, n, gap) { for (let t = 0; t < 300; t++) { const p = sample(pool, n).sort((a, b) => a[2] - b[2]); if (p.every((x, i) => !i || x[2] - p[i - 1][2] >= gap)) return p; } return sample(pool, n).sort((a, b) => a[2] - b[2]); }
const card = (x, i) => ({ e: x[0], n: x[1], y: x[2], i, at: null });
const cent = y => Math.floor((y - 1) / 100) + 1;

function makeTask(lv, P, settings) {
  const topic = settings.topics || 'all', both = Math.random() < 0.5 ? INV : EVT, pool = topic === 'inventions' ? INV : topic === 'events' ? EVT : both, T = { lv };
  const showYears = settings.years === 'always';
  if (lv === 1 || lv === 3) { const s = lv === 1 ? pick(SEQ.filter(x => x !== P.last)) : pick(GROW.filter(x => x.length >= 3 && x !== P.last)); P.last = s; T.mode = 'order'; T.cards = s.map((x, i) => ({ e: x[0], n: x[1], i, at: null })); T.labels = s.map((_, i) => (i === 0 ? 'First' : i === s.length - 1 ? 'Last' : s.length === 3 ? 'Next' : 'Then')); T.ask = lv === 1 ? 'Pin the pictures on the rope: what happens FIRST, NEXT and LAST?' : 'How does it grow and change? Pin the pictures in order on the rope.'; }
  if (lv === 2) { const pairs = sample(THEN_NOW, 2); T.mode = 'sides'; T.cards = shuffle(pairs.flatMap(([o, n]) => [{ e: o[0], n: o[1], side: 0, at: null }, { e: n[0], n: n[1], side: 1, at: null }])); T.ask = 'Pin each thing on the rope: LONG AGO on one end, TODAY on the other.'; }
  if (lv === 4 || lv === 7) { const src = lv === 4 ? (topic === 'events' ? EVT : INV) : pool, n = lv === 4 ? 3 : 4, items = spaced(src, n, lv === 4 ? 40 : 15); T.mode = 'order'; T.years = showYears; T.cards = items.map(card); T.labels = items.map((_, i) => (i === 0 ? 'Oldest' : i === n - 1 ? 'Newest' : String(i + 1))); T.ask = `Pin these ${src === INV ? 'inventions' : 'moments in history'} on the rope, from OLDEST to NEWEST.`; }
  if (lv === 5 || lv === 6 || lv === 9) {
    const src = lv === 5 ? (topic === 'events' ? EVT : INV) : lv === 6 ? (topic === 'inventions' ? INV : EVT) : [...INV, ...EVT], n = lv === 9 ? 5 : lv === 6 ? 3 : 4;
    const items = spaced(lv === 9 ? src : src.filter(x => x[2] >= 1000), n, lv === 9 ? 30 : 40), lo = items[0][2], hi = items[n - 1][2], span = hi - lo, step = NICE.find(s => span / s <= 9) || 1000;
    T.mode = 'line'; T.cards = items.map(card); T.step = step; T.min = Math.floor(lo / step) * step - (lo % step === 0 ? step : 0); T.max = Math.ceil(hi / step) * step + (hi % step === 0 ? step : 0); T.tol = step * 0.6;
    T.ask = `Pin each one at its YEAR on the number-line rope. The marks go up by ${step} years.`;
  }
  if (lv === 8) {
    const all = [...INV, ...EVT].filter(x => x[2] >= 1100 && x[2] % 100 !== 0), first = rand(15, 18), cs = [first, first + 1, first + 2, first + 3].filter(c => c <= 21);
    const items = shuffle(cs.flatMap(c => sample(all.filter(x => cent(x[2]) === c), 1))).slice(0, 4);
    T.mode = 'cent'; T.cs = cs; T.cards = items.map(card); T.ask = 'Pin each one in its CENTURY. The 1800s are the 19th century: add one to the first two digits!';
  }
  return T;
}

function createGame(api) {
  let P = null;
  const pops = popups(), fx = particles();

  function start(o) {
    P = { o, t: 0, n: o.boss ? 5 : o.edition <= 1 ? 3 : 4, done: 0, guidedDone: !!o.boss, phase: 'wait', era: 0 };
    api.score('⏳ 0'); api.progress(0, 'Timelines');
    api.goal('🕰️ Dottie’s time machine is ready! Grab the lost artifacts, then pin them on the timeline.', { speak: true });
    setTimeout(() => P && nextTask(), 1200);
  }
  function nextTask() {
    if (P.done >= P.n) { P.phase = 'over'; api.finish({ win: true, title: '🕰️ History is back in order!', text: `You fixed ${P.done} timelines.` }); return; }
    const lv = taskLevel(api, P.o), T = makeTask(lv, P, api.settings), guided = !P.guidedDone;
    P.T = T; P.guided = guided; P.drag = null; P.anim = null; P.showSol = 0; P.revealed = false;
    // the run: artifacts and bandits fly at you in 3 lanes
    P.run = { lane: 1, y: 1, todo: shuffle(T.cards.slice()), got: [], objs: [], spawn: 0.6, speed: guided ? 0.28 : 0.36 };
    P.phase = 'run'; P.era = (P.era + 1) % ERAS.length;
    api.actions([]);
    api.goal(`🚀 Grab the ${T.cards.length} lost artifacts ✨ and dodge the Time Bandits 🦹!`, { speak: false });
    api.speak(`${guided ? 'Here we go! ' : ''}Tap up or down to steer. Grab the artifacts and dodge the Time Bandits!`);
  }
  function startPin() {
    const T = P.T; P.phase = 'pin'; P.showSol = P.guided ? 1 : 0;
    P.teach = teach(api, { level: T.lv, guided: P.guided, prompt: T.ask, expected: T.mode });
    api.actions([{ key: 'help', label: '💡 Help' }, { key: 'check', label: '⚡ Power the time machine', big: true }]);
    api.goal(`🧵 ${T.ask}`, { speak: false }); api.speak((P.guided ? "Let's pin this one together. " : '') + T.ask);
  }

  // ------------------------------------------------ layout
  function work() {
    const b = playBox(api.W, api.H), short = api.H <= 500;
    if (short) return { area: { x: b.x + 8, y: b.y + 8, w: b.w * 0.76 - 12, h: b.h - 16 }, tray: { x: b.x + b.w * 0.76, y: b.y + 8, w: b.w * 0.24 - 8, h: b.h - 16 }, short, b };
    const th = Math.min(120, b.h * 0.2); return { area: { x: b.x + 8, y: b.y + 8, w: b.w - 16, h: b.h - th - 24 }, tray: { x: b.x + 8, y: b.y + b.h - th - 8, w: b.w - 16, h: th }, short, b };
  }
  const rope = () => { const A = work().area; return { x0: A.x + 24, x1: A.x + A.w - 24, y: A.y + A.h * 0.3 }; };
  function trayItems() {
    const W = work(), T = P.T, R = W.tray, list = T.cards.filter(c => c.at === null), n = Math.max(list.length, 3);
    if (W.short) { const cols = n > 3 ? 2 : 1, rows = Math.ceil(n / cols), cw = (R.w - 8) / cols, rh = (R.h - 8) / rows; return list.map((c, i) => ({ c, x: R.x + 4 + (i % cols) * cw, y: R.y + 4 + Math.floor(i / cols) * rh, w: cw - 4, h: rh - 4 })); }
    return list.map((c, i) => ({ c, x: R.x + 4 + i * ((R.w - 8) / n), y: R.y + 4, w: (R.w - 8) / n - 4, h: R.h - 8 }));
  }
  function slots() { const R = rope(), T = P.T, n = T.cards.length, w = (R.x1 - R.x0) / n; return T.cards.map((_, i) => ({ i, x: R.x0 + i * w + 6, y: R.y + 14, w: w - 12, h: Math.min(work().area.h * 0.6, 120) })); }
  function sides() { const R = rope(), A = work().area, w = (R.x1 - R.x0) / 2; return [0, 1].map(i => ({ i, x: R.x0 + i * w + 4, y: R.y + 14, w: w - 8, h: A.y + A.h - R.y - 20 })); }
  function centBins() { const R = rope(), A = work().area, n = P.T.cs.length, w = (R.x1 - R.x0) / n; return P.T.cs.map((c, i) => ({ c, i, x: R.x0 + i * w + 3, y: R.y + 14, w: w - 6, h: A.y + A.h - R.y - 20 })); }
  const xOfYear = y => { const R = rope(), T = P.T; return R.x0 + ((y - T.min) / (T.max - T.min)) * (R.x1 - R.x0); };
  const yearOfX = x => { const R = rope(), T = P.T; return T.min + ((x - R.x0) / (R.x1 - R.x0)) * (T.max - T.min); };
  /** where a pinned card hangs */
  function hangPos(c) {
    const T = P.T, R = rope(), A = work().area, cw = Math.min(86, (R.x1 - R.x0) / Math.max(4, T.cards.length + 0.5)), ch = Math.min(86, A.h * 0.42);
    if (T.mode === 'order') { const s = slots()[c.at]; return { x: s.x + s.w / 2 - cw / 2, y: s.y + 6, w: cw, h: ch }; }
    if (T.mode === 'sides') { const s = sides()[c.at], k = T.cards.filter(d => d.at === c.at).indexOf(c); return { x: s.x + 8 + k * (cw + 8), y: s.y + 6, w: cw, h: ch }; }
    if (T.mode === 'cent') { const s = centBins()[c.at], k = T.cards.filter(d => d.at === c.at).indexOf(c); return { x: s.x + s.w / 2 - cw / 2, y: s.y + 6 + k * (ch * 0.55), w: cw, h: ch * 0.9 }; }
    const k = T.cards.filter(d => d.at !== null).sort((a, b) => a.at - b.at).indexOf(c); return { x: xOfYear(c.at) - cw / 2, y: R.y + 26 + (k % 2) * (ch * 0.7), w: cw, h: ch * 0.95 };
  }

  // ------------------------------------------------ judging
  function judge() {
    const T = P.T;
    if (T.cards.some(c => c.at === null)) return { none: 'Pin every card on the rope first.' };
    if (T.mode === 'order') { const bad = T.cards.filter(c => c.at !== c.i), first = bad.slice().sort((a, b) => a.at - b.at)[0]; return { ok: !bad.length, bad, why: bad.length ? (T.lv <= 3 ? `Hmm, does “${first.n}” really come ${T.labels[first.at].toLowerCase()}? Think about what has to happen before it.` : `${cap(first.n)} isn’t in the right spot. ${T.years || P.revealed ? `It was ${yearText(first.y)}.` : 'Think: which was invented first?'}`) : '', hint: T.lv <= 3 ? 'Start with what happens at the very beginning.' : 'Find the oldest one first: what did people have a very long time ago?' }; }
    if (T.mode === 'sides') { const bad = T.cards.filter(c => c.at !== c.side); return { ok: !bad.length, bad, why: bad.length ? `The ${bad[0].n} is from ${bad[0].side ? 'TODAY' : 'LONG AGO'}.` : '', hint: 'Which ones did your great-great-grandparents use?' }; }
    if (T.mode === 'line') { const bad = T.cards.filter(c => Math.abs(c.at - c.y) > T.tol); return { ok: !bad.length, bad, why: bad.length ? `The ${bad[0].n} (${yearText(bad[0].y)}) is pinned near ${yearText(Math.round(bad[0].at))}. Count the marks: each one is ${T.step} years.` : '', hint: 'Find the two marks the year is between, then pin it between them.' }; }
    if (T.mode === 'cent') { const bad = T.cards.filter(c => T.cs[c.at] !== cent(c.y)); const b = bad[0]; return { ok: !bad.length, bad, why: b ? `${cap(b.n)} was in ${b.y}. The ${Math.floor(b.y / 100) * 100}s are the ${ORD(cent(b.y))} century.` : '', hint: 'Look at the first two digits of the year, then add one.' }; }
    return { ok: false };
  }
  const cap = s => s[0].toUpperCase() + s.slice(1);
  function check() { const r = judge(); if (r.none) { api.speak(r.none, { force: true }); return; } P.phase = 'anim'; P.anim = { t: 0, r }; P.revealed = true; Sfx.whoosh(); }
  function after() {
    const r = P.anim.r, T = P.T; P.anim = null;
    if (r.ok) return solved();
    P.phase = 'pin'; Sfx.wrong();
    r.bad.forEach(c => { c.at = null; });
    const n = P.teach.miss();
    if (n >= 3) { P.teach.done(false, T.mode); api.speak(`Dottie will show you. ${r.why}`, { force: true }); solveTask(T); P.phase = 'auto'; if (!api.loseHeart('Dottie fixed that timeline for you.')) setTimeout(() => { if (P && P.T === T) { P.phase = 'anim'; P.anim = { t: 0, r: judge(), win: true }; } }, 1600); return; }
    if (n === 2) { P.teach.help(); P.showSol = 1; }
    api.speak(n === 1 && r.hint ? `${r.why} ${r.hint}` : r.why, { force: true });
  }
  function solveTask(T) { T.cards.forEach(c => { c.at = T.mode === 'order' ? c.i : T.mode === 'sides' ? c.side : T.mode === 'cent' ? T.cs.indexOf(cent(c.y)) : c.y; }); }
  function solved() {
    const r = P.teach.done(true, P.T.mode); if (r.levelUp) api.chime('⭐ <b>Level up!</b> The time machine can go farther back!', '🕰️');
    Sfx.win(); fx.burst(api.W / 2, api.H * 0.35, 28, ['#ffc93c', '#b28dff', '#3dc2ff']);
    api.speak(pick(['Time machine powered up!', 'History is back in order!', 'Whoosh! The timeline is fixed!']));
    P.done++; P.guidedDone = true; api.score(`⏳ ${P.done}`); api.progress(P.done / P.n, 'Timelines'); P.phase = 'cheer'; api.actions([]);
    setTimeout(() => P && nextTask(), 2100);
  }

  // ------------------------------------------------ the run
  function laneY(l) { const b = playBox(api.W, api.H); return b.y + b.h * (0.25 + l * 0.25); }
  function updateRun(dt) {
    const R = P.run, b = playBox(api.W, api.H), I = api.input;
    if (I.pressed('up')) R.lane = Math.max(0, R.lane - 1); if (I.pressed('down')) R.lane = Math.min(2, R.lane + 1);
    R.y += (R.lane - R.y) * Math.min(1, dt * 10);
    R.spawn -= dt;
    if (R.spawn <= 0) {
      const want = R.todo.find(c => !R.objs.some(o => o.c === c));
      const art = want && Math.random() < 0.65;
      const lane = rand(0, 2);
      R.objs.push(art ? { c: want, lane, x: 1.08 } : { bandit: true, lane, x: 1.08 });
      R.spawn = art ? 1.1 : 0.9;
    }
    const px = 0.16;
    for (const o of R.objs) {
      o.x -= R.speed * dt;
      if (!o.hit && Math.abs(o.x - px) < 0.05 && Math.abs(o.lane - R.y) < 0.5) {
        o.hit = true;
        if (o.bandit) { Sfx.wrong(); const lost = R.got.pop(); if (lost) { R.todo.push(lost); pops.add(`🦹 took the ${lost.n}!`, b.x + b.w * px, laneY(R.y) - 40); } else pops.add('🦹 missed you!', b.x + b.w * px, laneY(R.y) - 40); }
        else { Sfx.coin(); R.got.push(o.c); R.todo = R.todo.filter(c => c !== o.c); fx.burst(b.x + b.w * px, laneY(R.y), 10, ['#ffc93c', '#fff']); pops.add(`✨ ${o.c.n}`, b.x + b.w * px + 40, laneY(R.y) - 30); }
      }
    }
    R.objs = R.objs.filter(o => o.x > -0.1 && !(o.hit && !o.bandit));
    if (!R.todo.length) { api.speak('You got them all! Now pin them on the timeline.', { force: true }); startPin(); }
  }

  return {
    start(o) { start(o); },
    checkpoint() { if (P && P.T && P.phase === 'anim') { P.phase = 'pin'; P.anim = null; } },
    stop() { P = null; },
    update(dt) {
      if (!P) return; P.t += dt; pops.update(dt); fx.update(dt);
      if (P.phase === 'run') updateRun(dt);
      if (P.phase === 'pin') { if (api.input.pressed('check')) check(); if (api.input.pressed('help')) this.hint(); }
      if (P.phase === 'anim') { P.anim.t += dt; if (P.anim.t > 1.8) { if (P.anim.win) { P.anim = null; solved(); } else after(); } }
    },
    hint() { if (!P || !P.T || P.phase !== 'pin') return false; P.teach.help(); P.showSol = 1; const r = judge(); api.speak(r.hint || r.none || 'Looks ready. Power the time machine!', { force: true }); return true; },
    coach() { if (!P || !P.T) return ''; const T = P.T; return T.cards.slice().sort((a, b) => (a.y ?? a.i) - (b.y ?? b.i)).map(c => c.n + (c.y ? ` (${yearText(c.y)})` : '')).join(' → '); },
    onHelp(id) { if (!P || !P.T) return ''; if (id === 'slow' && P.phase === 'run') { P.run.speed *= 0.6; return 'slowed down time!'; } if (id === 'slow' && P.phase === 'pin') { P.showSol = 1; P.teach.help(); return 'showed a clue!'; } return ''; },
    screen() { if (!P || !P.T) return ''; return P.phase === 'run' ? 'Flying through the time tunnel' : `Timeline: ${P.T.ask}`; },
    onTap(x, y) {
      if (!P || !P.T) return;
      if (P.phase === 'run') { const R = P.run, ly = laneY(R.lane); if (y < ly - 20) R.lane = Math.max(0, R.lane - 1); else if (y > ly + 20) R.lane = Math.min(2, R.lane + 1); return; }
      if (P.phase !== 'pin') return;
      const it = trayItems().find(q => inBox(x, y, q)); if (it) { P.drag = { c: it.c, x, y }; return; }
      const T = P.T, hit = T.cards.filter(c => c.at !== null).reverse().find(c => inBox(x, y, hangPos(c))); if (hit) { P.drag = { c: hit, x, y, from: hit.at }; hit.at = null; }
    },
    onMove(x, y) { if (P && P.drag) { P.drag.x = x; P.drag.y = y; } },
    onUp(x, y) {
      if (!P || !P.T || !P.drag) return; const d = P.drag, T = P.T, R = rope(), A = work().area; P.drag = null;
      const onRope = x > R.x0 - 20 && x < R.x1 + 20 && y > R.y - 50 && y < A.y + A.h;
      if (!onRope) return;
      if (T.mode === 'order') { const s = slots().reduce((b, s) => (Math.abs(s.x + s.w / 2 - x) < Math.abs(b.x + b.w / 2 - x) ? s : b)); const other = T.cards.find(c => c.at === s.i); if (other) other.at = d.from ?? null; d.c.at = s.i; }
      else if (T.mode === 'sides') d.c.at = x < (R.x0 + R.x1) / 2 ? 0 : 1;
      else if (T.mode === 'cent') { const s = centBins().find(q => x >= q.x - 3 && x <= q.x + q.w + 3) || centBins()[x < R.x0 ? 0 : P.T.cs.length - 1]; d.c.at = s.i; }
      else { d.c.at = clamp(yearOfX(clamp(x, R.x0, R.x1)), T.min, T.max); api.speak(`about ${yearText(Math.round(d.c.at / 5) * 5)}`); }
      Sfx.click();
    },
    draw(ctx, W, H, onTitle) {
      const era = ERAS[P ? P.era : 0], g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2b1d4f'); g.addColorStop(1, '#4a2d7a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 14; i++) { const r = ((i * 70 + (P ? P.t * 120 : 0)) % (Math.max(W, H))); ctx.strokeStyle = `rgba(178,141,255,${0.25 - r / Math.max(W, H) * 0.2})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(W / 2, H / 2, r * 1.2, r * 0.7, 0, 0, 7); ctx.stroke(); }
      if (onTitle || !P || !P.T) { emoji(ctx, '🕰️', W / 2, H / 2, 90); return; }
      const b = playBox(W, H);
      if (P.phase === 'run') return this.drawRun(ctx, b, era);
      panel(ctx, b, { fill: '#fff8ec', r: 16 });
      this.drawPin(ctx);
      fx.draw(ctx); pops.draw(ctx);
    },
    drawRun(ctx, b, era) {
      const R = P.run;
      ctx.save(); ctx.beginPath(); roundRect(ctx, b.x, b.y, b.w, b.h, 16); ctx.clip();
      ctx.fillStyle = era[0]; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.fillStyle = era[1]; ctx.fillRect(b.x, b.y + b.h * 0.9, b.w, b.h * 0.1);
      for (let i = 0; i < 6; i++) { const x = b.x + ((i * 0.22 - P.t * 0.12) % 1.3 + 1.3) % 1.3 * b.w; emoji(ctx, era[2][i % 3], x, b.y + b.h * 0.86, 34, { alpha: 0.45 }); }
      for (let l = 0; l < 3; l++) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.setLineDash([12, 10]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x, laneY(l)); ctx.lineTo(b.x + b.w, laneY(l)); ctx.stroke(); ctx.setLineDash([]); }
      for (const o of R.objs) { const x = b.x + o.x * b.w, y = laneY(o.lane); if (o.bandit) emoji(ctx, '🦹', x, y, 42); else { ctx.fillStyle = 'rgba(255,240,150,.6)'; ctx.beginPath(); ctx.arc(x, y, 30, 0, 7); ctx.fill(); emoji(ctx, o.c.e, x, y, 34); } }
      const px = b.x + b.w * 0.16, py = laneY(R.y); emoji(ctx, '🚀', px, py, 50, { rot: Math.PI / 4 }); emoji(ctx, '👧', px - 6, py - 26, 24);
      ctx.restore();
      panel(ctx, { x: b.x + 8, y: b.y + 8, w: Math.min(360, b.w - 16), h: 40 }, { fill: 'rgba(255,255,255,.85)', r: 10, shadow: false });
      text(ctx, `✨ ${R.got.length} / ${P.T.cards.length}  `, b.x + 20, b.y + 28, { size: 15, align: 'left' }); R.got.forEach((c, i) => emoji(ctx, c.e, b.x + 110 + i * 30, b.y + 28, 22));
      if (P.guided) { const want = R.objs.find(o => !o.bandit && o.x > 0.2); if (want) hand(ctx, b.x + b.w * 0.3, laneY(want.lane), P.t, 30); }
      fx.draw(ctx); pops.draw(ctx);
    },
    drawPin(ctx) {
      const T = P.T, R = rope(), A = work().area, An = P.anim, showY = T.mode === 'line' || T.mode === 'cent' || T.years || P.revealed;
      // rope
      ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(R.x0 - 10, R.y); ctx.quadraticCurveTo((R.x0 + R.x1) / 2, R.y + 10, R.x1 + 10, R.y); ctx.stroke();
      if (T.mode === 'order') slots().forEach(s => { ctx.setLineDash([5, 4]); ctx.strokeStyle = '#c9b48f'; ctx.lineWidth = 2; roundRect(ctx, s.x, s.y, s.w, s.h, 10); ctx.stroke(); ctx.setLineDash([]); text(ctx, T.labels[s.i], s.x + s.w / 2, R.y - 16, { size: 14, color: '#8b5a2b' }); });
      if (T.mode === 'sides') { const S = sides(); [['🕰️ LONG AGO', 0], ['TODAY 📱', 1]].forEach(([l, i]) => { ctx.fillStyle = i ? 'rgba(61,194,255,.12)' : 'rgba(201,154,91,.15)'; roundRect(ctx, S[i].x, S[i].y, S[i].w, S[i].h, 12); ctx.fill(); text(ctx, l, S[i].x + S[i].w / 2, R.y - 16, { size: 15, color: '#8b5a2b' }); }); text(ctx, '⟵ older · newer ⟶', (R.x0 + R.x1) / 2, R.y - 34 < A.y ? R.y + 2 : R.y - 34, { size: 11, color: '#9a8a70' }); }
      if (T.mode === 'cent') centBins().forEach(s => { ctx.fillStyle = s.i % 2 ? 'rgba(178,141,255,.12)' : 'rgba(255,201,60,.14)'; roundRect(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill(); text(ctx, `${(s.c - 1) * 100}s`, s.x + s.w / 2, R.y - 24, { size: 14, color: '#8b5a2b' }); text(ctx, `${ORD(s.c)} century`, s.x + s.w / 2, R.y - 8, { size: 11, color: '#9a8a70' }); });
      if (T.mode === 'line') { for (let y = T.min; y <= T.max; y += T.step) { const x = xOfYear(y); ctx.fillStyle = '#8b5a2b'; ctx.fillRect(x - 1.5, R.y - 10, 3, 20); text(ctx, y < 0 ? `${-y} BC` : String(y), x, R.y - 22, { size: 11, color: '#8b5a2b' }); } }
      // pinned cards
      T.cards.filter(c => c.at !== null).forEach(c => { const q = hangPos(c), bad = An && !An.r.ok && An.r.bad.includes(c) && An.t > 0.5, good = An && An.t > 0.5 && !bad; ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(q.x + q.w / 2, R.y); ctx.lineTo(q.x + q.w / 2, q.y); ctx.stroke(); this.dCard(ctx, c, q, { bad, good, showY }); emoji(ctx, '📌', q.x + q.w / 2, R.y + 2, 16); if (T.mode === 'line' && An && An.t > 0.5) { const tx = xOfYear(c.y); ctx.fillStyle = bad ? '#e5484d' : '#2fae66'; ctx.beginPath(); ctx.arc(tx, R.y, 6, 0, 7); ctx.fill(); } });
      // tray
      const Wk = work(); panel(ctx, Wk.tray, { fill: '#5a3e8a', r: 12, shadow: false });
      for (const q of trayItems()) this.dCard(ctx, q.c, q, { showY });
      if (!trayItems().length) text(ctx, '⚡ Ready!', Wk.tray.x + Wk.tray.w / 2, Wk.tray.y + Wk.tray.h / 2, { size: 15, color: '#fff' });
      if (P.drag) { const q = { x: P.drag.x - 40, y: P.drag.y - 40, w: 80, h: 80 }; this.dCard(ctx, P.drag.c, q, { showY }); if (T.mode === 'line' && P.drag.y > R.y - 50) { const yr = yearOfX(clamp(P.drag.x, R.x0, R.x1)); text(ctx, `≈ ${yearText(Math.round(yr / 5) * 5)}`, P.drag.x, P.drag.y - 52, { size: 14, color: '#5a3e8a' }); } }
      if (P.showSol && P.phase === 'pin') this.dHint(ctx);
      if (An && An.t > 0.8) text(ctx, An.r.ok ? '✅ The time machine is powered up!' : '❌ The timeline is tangled…', A.x + A.w / 2, A.y + A.h - 12, { size: 17, color: An.r.ok ? '#2fae66' : '#e5484d' });
    },
    dCard(ctx, c, q, { bad = false, good = false, showY = false } = {}) {
      panel(ctx, q, { fill: bad ? '#ffd6d6' : good ? '#dcffe4' : '#fff', r: 10, shadow: false, stroke: '#c9b48f' });
      const big = Math.min(36, q.h * 0.38, q.w * 0.45); emoji(ctx, c.e, q.x + q.w / 2, q.y + q.h * 0.32, big);
      text(ctx, c.n, q.x + q.w / 2, q.y + q.h * 0.66, { size: q.w < 70 ? 9 : 10, max: q.w - 6 });
      if (showY && c.y !== undefined) text(ctx, yearText(c.y), q.x + q.w / 2, q.y + q.h - 8, { size: 10, color: '#8b5a2b' });
    },
    dHint(ctx) {
      const T = P.T, q = trayItems()[0]; if (!q) return; const c = q.c, t = { ...c };
      hand(ctx, q.x + q.w / 2, q.y + q.h / 2, P.t, 28);
      const R = rope(); let tx = null;
      if (T.mode === 'order') { const s = slots()[c.i]; tx = s.x + s.w / 2; } else if (T.mode === 'sides') { const s = sides()[c.side]; tx = s.x + s.w / 2; } else if (T.mode === 'cent') { const s = centBins()[T.cs.indexOf(cent(c.y))]; tx = s.x + s.w / 2; } else tx = xOfYear(c.y);
      void t; text(ctx, '⬇️', tx, R.y + 30, { size: 22 });
    },
    _test: {
      step() { if (!P || !P.T) return 'none'; if (P.phase === 'run') { P.run.got = P.T.cards.slice(); P.run.todo = []; return 'run'; } if (P.phase === 'anim') { P.anim.t = 9; return 'anim'; } if (P.phase !== 'pin') return P.phase; solveTask(P.T); check(); return P.T.mode; },
      go() { if (P && P.phase === 'pin') check(); },
      get P() { return P; },
    },
  };
}

startGame({
  mascot: '🕰️',
  story: (d, e) => (e >= 3 ? 'History is tangled! Fly through the time tunnel, grab the artifacts, and pin them at the right year on the timeline.' : 'Dottie’s time machine lost its treasures! Fly through the time tunnel and put everything back in order.'),
  howTo: ['🚀 Tap above or below the time machine (or use ⬆ ⬇) to change lanes.', '✨ Grab the artifacts. Dodge the Time Bandits 🦹!', '🧵 Drag each artifact onto the timeline rope, then power up the machine.'],
  together: { helps: [{ id: 'slow', icon: '🐢', label: 'Slow time', cool: 20 }] },
  lessons: level => LESSONS[level] || [],
  realLife: realFrom(REAL['time-tunnel-sorters']),
  create: createGame,
});

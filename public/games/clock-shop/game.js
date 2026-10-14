// Tock's Clock Shop: real clock repair! A customer brings in a broken clock with a ticket.
//  🔩 Tap the screws to open the back.  ⚙️ Some clocks have a missing gear: drag the gear that fits so the teeth mesh.
//  🔄 Close it up, then turn the HANDS to the time on the ticket (short red = hour, long blue = minute; the hour hand
//  moves with the minute hand, just like a real clock). Big kids flip AM / PM.
//  🎉 When it's right, the clock comes alive: the cuckoo pops out and cuckoos the hour, the alarm clock rings,
//  the train station board flips to the departure time.
// The shop grows with you: 🐦 cuckoo clocks (levels 1–4) → ⏰ alarm clocks (5–7) → 🚆 24-hour station board (8).
// Each customer waits while a candle burns down. Too slow → they leave (lose a heart). Each repair is a checkpoint.
// Levels (must match app/Games/ClockShop.php):
// 1 O'Clock · 2 Half Past · 3 Quarter Past & To · 4 5-Minute Times · 5 Time Words · 6 To the Minute · 7 AM or PM? · 8 24-Hour Time
import { startGame, rand, pick, shuffle, clamp, emoji, roundRect, realFrom, playBox, clockFace, Sfx } from '../_play/play.js';
import { handClock } from '../_play/widgets.js';
import { TIME_LESSONS as LESSONS } from '../_joy/js/time-lessons.js';
import { REAL } from '../_joy/js/reallife.js';
import { clockText, timeWords } from '../_joy/js/util.js';
import { text, panel, button, bubble, hand, popups, particles, teach, taskLevel, inBox, INK } from '../_play/kit.js';

const EVENTS = [[6 * 60 + 30, 'wake up'], [7 * 60, 'eat breakfast'], [7 * 60 + 45, 'catch the school bus'], [8 * 60 + 15, 'start school'], [10 * 60, 'go out for recess'], [12 * 60, 'eat lunch'], [13 * 60 + 30, 'go to art class'], [15 * 60, 'get out of school'], [16 * 60, 'go to soccer practice'], [17 * 60 + 30, 'eat dinner'], [19 * 60, 'take a bath'], [20 * 60, 'go to bed'], [9 * 60 + 30, 'go to the library'], [14 * 60 + 15, 'have a snack'], [18 * 60 + 45, 'read a story'], [11 * 60, 'go to the park']];
const SNAP = [60, 30, 15, 5, 5, 1, 5, 5];
const TOWNS = ['Maple Falls', 'Pine Hill', 'Sunnyvale', 'Bear Creek', 'Oak Harbor', 'River Bend', 'Cedar Point', 'Lake View'];
const PEOPLE = ['👵', '👴', '👩', '👨', '🧑', '👧', '👦', '🧔'];
const hourOf = m => { const h = Math.floor((m % 720) / 60); return h === 0 ? 12 : h; };
const nextHour = m => (hourOf(m) % 12) + 1;
const minNum = m => (Math.round((m % 60) / 5) % 12) || 12;
const kindFor = lv => (lv <= 4 ? 'cuckoo' : lv <= 7 ? 'alarm' : 'station');

function makeTicket(level) {
  if (level <= 6) {
    const h = rand(1, 12) % 12; let m = 0;
    if (level === 2) m = Math.random() < 0.75 ? 30 : 0; else if (level === 3) m = pick([15, 45, 15, 45, 30]); else if (level === 4 || level === 5) m = rand(1, 11) * 5; else if (level === 6) { m = rand(1, 59); if (m % 5 === 0) m += 1; }
    const t = h * 60 + m, words = level === 5;
    return { level, t, ampm: false, ticket: words ? timeWords(t) : clockText(t), say: `Please set my clock to ${words ? timeWords(t) : clockText(t)}.` };
  }
  if (level === 7) { const [t, what] = pick(EVENTS); return { level, t, ampm: true, ticket: clockText(t, { ampm: true }), sub: `Time to ${what}`, say: `Wake me up at ${clockText(t, { ampm: true })} to ${what}. Don't forget AM or PM!` }; }
  let t = rand(0, 23) * 60 + rand(0, 11) * 5; if (Math.random() < 0.7 && t < 720) t += 720;
  const town = pick(TOWNS);
  return { level, t, ampm: true, ticket: clockText(t, { h24: true }), sub: `Train to ${town}`, town, say: `The train to ${town} leaves at ${clockText(t, { h24: true }).replace(':', ' ')} hours. Set the station clock and pick AM or PM.` };
}
function teachLine(q) {
  const t = q.t, m = t % 60, h = hourOf(t);
  const hour = m < 30 ? `The short red HOUR hand points at ${h}${m ? ' (or just past it)' : ''}.` : `The short red HOUR hand is past ${h}, on the way to ${nextHour(t)}. We still say ${h}.`;
  const min = m === 0 ? 'The long blue MINUTE hand points straight up at 12.' : m % 5 === 0 ? `Count by 5s to ${m}: the long blue hand points at ${minNum(t)}.` : `Count by 5s to ${Math.floor(m / 5) * 5}, then ${m % 5} more little ticks.`;
  const ap = q.ampm ? (t >= 720 ? ' After 12 noon, so it’s PM.' : ' Before 12 noon, so it’s AM.') : '';
  return `${q.level === 8 ? `${clockText(t, { h24: true })}: ${Math.floor(t / 60) > 12 ? `take away 12 from ${Math.floor(t / 60)} → ${h}. ` : ''}` : ''}${hour} ${min}${ap}`;
}

function createGame(api) {
  let P = null;
  const pops = popups(), fx = particles();

  function start(o) {
    const n = o.boss ? 5 : o.edition <= 1 ? 3 : 4;
    P = { o, t: 0, n, fixed: 0, tips: 0, phase: 'arrive', guidedDone: !!o.boss, cur: null, kind: kindFor(o.real) };
    api.score('⚙️ 0'); api.progress(0, 'Clocks'); api.actions([]);
    api.goal(`🐦 Tock's shop is open! ${P.kind === 'cuckoo' ? 'Cuckoo clocks' : P.kind === 'alarm' ? 'Alarm clocks' : 'The train station clock'} need fixing today.`);
  }
  function arrive() {
    const lv = taskLevel(api, P.o), q = makeTicket(lv), kind = kindFor(Math.max(lv, P.o.real >= 8 && lv < 8 ? 7 : lv));
    let startMin = (q.t + rand(2, 9) * 60 + (lv >= 2 ? rand(1, 5) * 10 : 0)) % 720; if (lv === 1) startMin = Math.floor(startMin / 60) * 60;
    const guided = !P.guidedDone, gear = P.fixed % 2 === 0;
    P.cur = { q, lv, kind, face: pick(PEOPLE), pat: 1, screws: [0, 0, 0, 0], gear: gear ? { need: pick([0, 1, 2]), placed: -1, drag: null, spin: 0 } : null, flip: 0, w: handClock({ minutes: startMin, snap: SNAP[lv - 1], ampm: q.ampm }), alive: 0 };
    P.cur.w.api = api;
    P.teach = teach(api, { level: lv, guided, prompt: q.say, expected: clockText(q.t, { ampm: q.ampm }) });
    P.phase = 'screws'; P.showSol = guided ? 1 : 0;
    api.actions([{ key: 'help', label: '💡 Help' }]);
    api.goal(`🔩 Tap the 4 screws to open the back of the ${kind === 'cuckoo' ? 'cuckoo clock' : kind === 'alarm' ? 'alarm clock' : 'station clock'}.`, { speak: false });
    api.speak(guided ? `A customer brought in a broken clock! First, let's open it. Tap the four screws on the back.` : `${pick(['Hello! My clock is broken.', 'Can you fix my clock, please?', 'My clock stopped!'])} Tap the screws to open it.`);
  }
  function opened() {
    if (P.cur.gear) { P.phase = 'gears'; api.goal('⚙️ A gear is missing! Drag the gear that FITS onto the empty peg.', { speak: true }); }
    else closeUp();
  }
  function closeUp() {
    P.phase = 'flip'; P.cur.flip = 0; Sfx.click();
    setTimeout(() => P && P.cur && hands(), 650);
  }
  function hands() {
    P.phase = 'hands';
    const q = P.cur.q;
    api.actions([{ key: 'help', label: '💡 Help' }, { key: 'check', label: '🔧 Fixed!', big: true }]);
    api.goal(`🎫 Set the clock to <b>${q.ticket}</b>${q.sub ? ` · ${q.sub}` : ''}${q.ampm ? ' (and AM or PM)' : ''}.`, { speak: false });
    api.speak(P.teach.guided ? `Now the hands. ${q.say} Drag the long blue minute hand first, then the short red hour hand.` : q.say);
  }
  function check() {
    const C = P.cur, q = C.q, v = C.w.value(), min = q.ampm ? v.min : v;
    const good = min % 720 === q.t % 720;
    if (good && q.ampm && !v.half) { api.speak('The hands are perfect! Now tap AM or PM.', { force: true }); return; }
    if (good && (!q.ampm || (v.half === 'PM') === (q.t >= 720))) return alive();
    const n = P.teach.miss(); Sfx.wrong();
    const hOk = Math.floor((min % 720) / 60) === Math.floor((q.t % 720) / 60), mOk = min % 60 === q.t % 60;
    let why = good ? `The hands are perfect, but is it AM or PM? ${q.t >= 720 ? 'After 12 noon.' : 'Before 12 noon.'}` : C.lv === 1 ? `The short red HOUR hand should point right at ${hourOf(q.t)}. The long hand stays on 12.` : mOk ? `The MINUTE hand is right! Now the short HOUR hand: it should be near ${hourOf(q.t)}.` : hOk ? `The HOUR hand is right! Now the long MINUTE hand: ${q.t % 60} minutes.` : 'Look at both hands again.';
    if (n >= 3) {
      P.teach.done(false, clockText(min, { ampm: q.ampm }) + (q.ampm ? ' ' + (v.half || '') : ''));
      api.speak(`Watch me. ${teachLine(q)}`, { force: true });
      C.w.min = q.t % 720; if (q.ampm) C.w.half = q.t >= 720 ? 'PM' : 'AM';
      if (!api.loseHeart('Tock fixed that one for you.')) setTimeout(() => P && P.cur === C && alive(true), 2500);
      return;
    }
    if (n === 2) { P.teach.help(); P.showSol = 1; why += ' ' + teachLine(q); }
    api.speak(why, { force: true });
  }
  function alive(already) {
    const C = P.cur;
    if (!already) { const r = P.teach.done(true, clockText(C.q.t, { ampm: C.q.ampm })); if (r.levelUp) api.chime('⭐ <b>Level up!</b> New kinds of clocks are coming!', '🐦'); }
    P.phase = 'alive'; C.alive = 0; P.guidedDone = true; api.actions([]);
    Sfx.correct(); fx.burst(api.W / 2, api.H * 0.45, 22);
    const tip = C.pat > 0.5 ? 3 : 1; P.tips += tip; api.score(`⚙️ ${P.tips}`); pops.add(`+${tip} ⚙️`, api.W / 2, api.H * 0.3);
    const h = hourOf(C.q.t);
    if (C.kind === 'cuckoo') { C.cuckoos = C.q.t % 60 === 0 ? h : 1; api.speak(C.q.t % 60 === 0 ? `Cuckoo! ${'Cuckoo! '.repeat(Math.min(h, 12) - 1)}It's ${h} o'clock!` : `Cuckoo! The clock works!`); }
    else if (C.kind === 'alarm') api.speak('Brrring! The alarm clock works!');
    else api.speak(`All aboard! The train to ${C.q.town} leaves at ${clockText(C.q.t, { ampm: true })}.`);
    setTimeout(() => P && next(), C.kind === 'cuckoo' ? 2600 + Math.min(12, C.cuckoos || 1) * 350 : 2400);
  }
  function next() {
    P.fixed++; P.cur = null; api.progress(P.fixed / P.n, 'Clocks');
    if (P.fixed >= P.n) { P.phase = 'done'; api.finish({ win: true, title: '🐦 Every clock is ticking!', text: `You fixed ${P.fixed} clocks and earned ${P.tips} gears in tips.` }); return; }
    P.phase = 'arrive';
  }
  function walkOut() {
    Sfx.wrong(); if (P.teach) P.teach.done(false, 'too slow');
    api.speak('Oh no! The customer had to leave. Let\'s be quicker with the next one.', { force: true });
    P.cur = null; P.fixed++; api.progress(P.fixed / P.n, 'Clocks'); P.phase = P.fixed >= P.n ? 'done' : 'arrive';
    api.loseHeart('A customer waited too long!');
    if (P.phase === 'done') api.finish({ win: false, title: 'Closing time', text: `You fixed ${P.tips ? 'some' : 'no'} clocks today.` });
  }

  // ------------------------------------------------ layout
  const L = () => {
    const b = playBox(api.W, api.H), short = api.H <= 500;
    const work = short ? { x: b.x + b.w * 0.24, y: b.y, w: b.w * 0.56, h: b.h } : { x: b.x + 6, y: b.y + 70, w: b.w - 12, h: b.h - 76 };
    const s = Math.min(work.w * 0.8, work.h * 0.86);
    return { b, short, work, case: { x: work.x + (work.w - s) / 2, y: work.y + (work.h - s) / 2, w: s, h: s }, cust: short ? { x: b.x + b.w * 0.1, y: b.y + b.h * 0.3 } : { x: b.x + 50, y: b.y + 30 } };
  };
  const screwPos = () => { const c = L().case, m = c.w * 0.1; return [[c.x + m, c.y + m], [c.x + c.w - m, c.y + m], [c.x + m, c.y + c.h - m], [c.x + c.w - m, c.y + c.h - m]]; };
  const SIZES = [0.11, 0.16, 0.21];
  function gearLayout() {
    const c = L().case, cy = c.y + c.h * 0.42, g = P.cur.gear, R = SIZES.map(s => s * c.w), rNeed = R[g.need], rL = c.w * 0.13, rR = c.w * 0.1;
    const x1 = c.x + c.w * 0.18, x2 = x1 + rL + rNeed, x3 = x2 + rNeed + rR;
    const tray = SIZES.map((s, i) => ({ i, r: R[i], x: c.x + c.w * (0.2 + i * 0.3), y: c.y + c.h * 0.82 }));
    return { fixed: [{ x: x1, y: cy, r: rL }, { x: x3, y: cy, r: rR }], peg: { x: x2, y: cy, r: rNeed }, tray, R };
  }
  function drawGear(ctx, x, y, r, a, col = '#c9a227') {
    const teeth = Math.max(8, Math.round(r / 5));
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = col; ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) { const rr = i % 2 ? r * 0.82 : r, aa = (i / (teeth * 2)) * Math.PI * 2; ctx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); }
    ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(0, 0, r * 0.25, 0, 7); ctx.fill(); ctx.restore();
  }

  return {
    start(o) { start(o); },
    checkpoint() { if (!P) return; P.cur = null; P.phase = 'arrive'; },
    stop() { P = null; },
    update(dt) {
      if (!P) return; P.t += dt; pops.update(dt); fx.update(dt);
      if (P.phase === 'arrive') return arrive();
      const C = P.cur; if (!C) return;
      if (!P.teach.guided && P.phase !== 'alive') { C.pat -= dt / ((P.o.edition <= 1 ? 110 : 80) + (C.lv >= 7 ? 20 : 0)); if (C.pat <= 0) return walkOut(); }
      if (C.gear && C.gear.placed >= 0) C.gear.spin += dt * 2;
      if (P.phase === 'flip') C.flip = Math.min(1, C.flip + dt * 2);
      if (P.phase === 'alive') C.alive += dt;
      if (P.phase === 'hands') { C.w.update(dt, api.input); if (api.input.pressed('check')) check(); }
      if (api.input.pressed('help')) this.hint();
    },
    hint() {
      if (!P || !P.cur) return false;
      P.showSol = 1; const q = P.cur.q;
      if (P.phase === 'hands') { P.teach.help(); api.speak(teachLine(q), { force: true }); return true; }
      if (P.phase === 'gears') { api.speak('Look at the dotted circle. Pick the gear that is the same size, so its teeth touch both gears.', { force: true }); return true; }
      if (P.phase === 'screws') { api.speak('Tap each shiny screw to take it out.', { force: true }); return true; }
      return false;
    },
    coach() { if (!P || !P.cur) return ''; const q = P.cur.q; return P.phase === 'hands' ? `Target ${clockText(q.t, { ampm: q.ampm })}. Ask: "Where does the long hand go for ${q.t % 60} minutes?"` : P.phase === 'gears' ? 'Help them compare the gear sizes to the dotted circle.' : 'Tap the screws!'; },
    onHelp(id) { if (!P || !P.cur) return ''; if (id === 'candle') { P.cur.pat = 1; return 'lit a new candle — more time!'; } return ''; },
    screen() { if (!P || !P.cur) return ''; const C = P.cur; return P.phase === 'hands' ? `Ticket: ${C.q.ticket}${C.q.sub ? ' · ' + C.q.sub : ''}. Clock shows ${clockText(C.q.ampm ? C.w.min : C.w.value())}${C.q.ampm ? ' ' + (C.w.half || '?') : ''}` : P.phase; },
    onTap(x, y) {
      if (!P || !P.cur) return;
      const C = P.cur;
      if (P.phase === 'screws') {
        screwPos().forEach((p, i) => { if (!C.screws[i] && Math.hypot(x - p[0], y - p[1]) < 30) { C.screws[i] = 0.01; Sfx.click(); } });
        if (C.screws.every(s => s)) setTimeout(() => P && P.cur === C && P.phase === 'screws' && opened(), 500);
        return;
      }
      if (P.phase === 'gears') { const G = gearLayout(), g = C.gear; const t = G.tray.find(q => Math.hypot(x - q.x, y - q.y) < q.r + 8); if (t) g.drag = { i: t.i, x, y }; return; }
      if (P.phase === 'hands') C.w.down(x, y);
    },
    onMove(x, y) { if (!P || !P.cur) return; if (P.phase === 'hands') P.cur.w.move(x, y); const g = P.cur.gear; if (P.phase === 'gears' && g && g.drag) { g.drag.x = x; g.drag.y = y; } },
    onUp(x, y) {
      if (!P || !P.cur) return;
      if (P.phase === 'hands') { P.cur.w.up(); if (P.o.real <= 2 && !P.teach.guided) api.speak(clockText(P.cur.q.ampm ? P.cur.w.min : P.cur.w.value())); return; }
      const g = P.cur.gear;
      if (P.phase === 'gears' && g && g.drag) {
        const G = gearLayout(), i = g.drag.i; g.drag = null;
        if (Math.hypot(x - G.peg.x, y - G.peg.y) < G.peg.r + 30) {
          if (i === g.need) { g.placed = i; Sfx.correct(); fx.burst(G.peg.x, G.peg.y, 14); api.speak('It fits! The gears turn!'); setTimeout(() => P && P.cur && closeUp(), 1300); }
          else { Sfx.wrong(); api.speak(i > g.need ? 'Too big! It bumps into the other gears.' : 'Too small! Its teeth don\'t reach.', { force: true }); }
        }
      }
    },
    draw(ctx, W, H, onTitle) {
      ctx.fillStyle = '#fff3dc'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,220,160,.35)'; for (let x = 0; x < W; x += 50) ctx.fillRect(x, 0, 25, H);
      ctx.fillStyle = '#b98a5c'; ctx.fillRect(0, H * 0.82, W, H * 0.18);
      ['🕰️', '⏰', '⌚', '🕰️', '⏲️', '⏰'].forEach((e, i) => emoji(ctx, e, (i + 0.5) * W / 6, H * 0.14, 28, { alpha: 0.35 }));
      if (onTitle || !P) { clockFace(ctx, W / 2, H * 0.5, Math.min(W, H) * 0.22, 600); emoji(ctx, '🐦', W / 2, H * 0.24, 60); return; }
      const C = P.cur; if (!C) { fx.draw(ctx); pops.draw(ctx); return; }
      const lay = L(), cs = lay.case;
      // customer + candle timer
      emoji(ctx, C.pat > 0.4 ? C.face : '😟', lay.cust.x, lay.cust.y, lay.short ? 44 : 52);
      const ch = 60 * C.pat; ctx.fillStyle = '#fff'; ctx.fillRect(lay.cust.x + 34, lay.cust.y + 30 - ch, 12, ch); emoji(ctx, '🔥', lay.cust.x + 40, lay.cust.y + 22 - ch, 18);
      // the bench
      ctx.fillStyle = '#6b4423'; ctx.fillRect(cs.x - 20, cs.y + cs.h - 6, cs.w + 40, 14);
      if (P.phase === 'screws' || P.phase === 'gears') {
        panel(ctx, cs, { fill: '#8a6a4a', r: 18 });
        ctx.fillStyle = '#5a4030'; roundRect(ctx, cs.x + cs.w * 0.08, cs.y + cs.h * 0.08, cs.w * 0.84, cs.h * 0.84, 12); ctx.fill();
        if (P.phase === 'screws') {
          screwPos().forEach((p, i) => { const s = C.screws[i]; if (s > 0) C.screws[i] = Math.min(1, s + 0.05); const k = C.screws[i]; ctx.save(); ctx.globalAlpha = 1 - k; ctx.translate(p[0], p[1] - k * 30); ctx.rotate(k * 12); ctx.fillStyle = '#d0d4da'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.fill(); ctx.strokeStyle = '#555'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.stroke(); ctx.restore(); });
          text(ctx, C.kind === 'cuckoo' ? '🐦 CUCKOO' : C.kind === 'alarm' ? '⏰ ALARM' : '🚆 STATION', cs.x + cs.w / 2, cs.y + cs.h / 2, { size: cs.w * 0.08, color: '#c9a227' });
          if (P.showSol) { const i = C.screws.findIndex(s => !s); if (i >= 0) { const p = screwPos()[i]; hand(ctx, p[0], p[1], P.t, 36); } }
        } else {
          const G = gearLayout(), g = C.gear;
          drawGear(ctx, G.fixed[0].x, G.fixed[0].y, G.fixed[0].r, g.placed >= 0 ? g.spin : 0);
          drawGear(ctx, G.fixed[1].x, G.fixed[1].y, G.fixed[1].r, g.placed >= 0 ? g.spin * G.fixed[0].r / G.fixed[1].r : 0);
          if (g.placed >= 0) drawGear(ctx, G.peg.x, G.peg.y, G.peg.r, -g.spin * G.fixed[0].r / G.peg.r, '#e0b23a');
          else { ctx.setLineDash([6, 5]); ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(G.peg.x, G.peg.y, G.peg.r, 0, 7); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#aaa'; ctx.beginPath(); ctx.arc(G.peg.x, G.peg.y, 5, 0, 7); ctx.fill(); }
          for (const t of G.tray) { if (g.placed === t.i || (g.drag && g.drag.i === t.i)) continue; drawGear(ctx, t.x, t.y, t.r, P.t * 0.3, '#b8bec4'); }
          if (g.drag) drawGear(ctx, g.drag.x, g.drag.y, G.R[g.drag.i], 0, '#e0b23a');
          if (P.showSol && g.placed < 0 && !g.drag) { const t = G.tray[g.need]; hand(ctx, t.x, t.y, P.t, 34); }
        }
      } else this.drawFront(ctx, lay, C);
      fx.draw(ctx); pops.draw(ctx);
    },
    drawFront(ctx, lay, C) {
      const cs = lay.case, k = P.phase === 'flip' ? Math.abs(Math.cos(C.flip * Math.PI)) : 1;
      ctx.save(); ctx.translate(cs.x + cs.w / 2, 0); ctx.scale(k || 0.02, 1); ctx.translate(-(cs.x + cs.w / 2), 0);
      const wb = { x: cs.x + cs.w * 0.08, y: cs.y + cs.h * 0.16, w: cs.w * 0.84, h: cs.h * 0.84 }, q = C.q;
      if (C.kind === 'cuckoo') {
        ctx.fillStyle = '#7a4a24'; ctx.beginPath(); ctx.moveTo(cs.x, cs.y + cs.h * 0.2); ctx.lineTo(cs.x + cs.w / 2, cs.y - cs.h * 0.02); ctx.lineTo(cs.x + cs.w, cs.y + cs.h * 0.2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#a0703c'; roundRect(ctx, cs.x + cs.w * 0.04, cs.y + cs.h * 0.16, cs.w * 0.92, cs.h * 0.84, 12); ctx.fill();
        const doorOpen = P.phase === 'alive' ? Math.min(1, C.alive * 3) : 0;
        ctx.fillStyle = '#3a2410'; ctx.fillRect(cs.x + cs.w / 2 - 22, cs.y + cs.h * 0.05, 44, 36);
        if (doorOpen) { const bob = Math.sin(C.alive * 9) * 6; emoji(ctx, '🐦', cs.x + cs.w / 2, cs.y + cs.h * 0.08 + 14 - doorOpen * 24 + bob, 40); }
      } else if (C.kind === 'alarm') {
        const shake = P.phase === 'alive' ? Math.sin(C.alive * 60) * 5 : 0;
        ctx.translate(shake, 0);
        ctx.fillStyle = '#e5484d'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(cs.x + cs.w / 2 + sx * cs.w * 0.3, cs.y + cs.h * 0.16, cs.w * 0.12, Math.PI, 0); ctx.fill(); }
        ctx.beginPath(); ctx.arc(cs.x + cs.w / 2, cs.y + cs.h * 0.58, cs.w * 0.46, 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = '#23324a'; roundRect(ctx, cs.x, cs.y + cs.h * 0.1, cs.w, cs.h * 0.9, 14); ctx.fill();
        panel(ctx, { x: cs.x + cs.w * 0.1, y: cs.y - cs.h * 0.06, w: cs.w * 0.8, h: cs.h * 0.14 }, { fill: '#111', r: 6, shadow: false });
        text(ctx, P.phase === 'alive' ? `${q.town} ${clockText(q.t, { h24: true })}` : `${q.town} --:--`, cs.x + cs.w / 2, cs.y + cs.h * 0.01, { size: cs.w * 0.06, color: '#ffd34d', font: 'monospace' });
      }
      ctx.restore();
      if (P.phase === 'flip') return;
      const box = { x: wb.x, y: wb.y + (C.kind === 'alarm' ? cs.h * 0.02 : 0), w: wb.w, h: wb.h - (C.q.ampm ? 0 : 0) };
      // ticket
      { const room = cs.x + cs.w + 150 < api.W, tx = lay.short ? lay.b.x + lay.b.w * 0.9 : room ? cs.x + cs.w + 76 : api.W / 2, ty = lay.short ? lay.b.y + 40 : room ? cs.y + 40 : Math.max(lay.b.y + 40, cs.y - 80); panel(ctx, { x: tx - 64, y: ty - 26, w: 128, h: q.sub ? 66 : 52 }, { fill: '#fff8e1', stroke: '#ffc93c', r: 12 }); text(ctx, `🎫 ${q.ticket}`, tx, ty, { size: q.ticket.length > 10 ? 13 : 20, max: 120 }); if (q.sub) text(ctx, q.sub, tx, ty + 24, { size: 11, color: '#8a6d1f', max: 120 }); }
      C.w.draw(ctx, box);
      if (P.phase === 'alive' && C.kind === 'cuckoo' && C.cuckoos) { const n = Math.min(12, Math.floor(C.alive / 0.35) + 1, C.cuckoos); text(ctx, 'Cuckoo! '.repeat(n).trim(), cs.x + cs.w / 2, cs.y - 20, { size: 18, color: '#c94a2d', max: api.W - 20 }); }
      if (P.phase === 'hands' && P.showSol) {
        // ghost hands show where to go (we do / help)
        const c = C.w.c; if (c) { const mA = ((q.t % 60) / 60) * Math.PI * 2, hA = ((q.t % 720) / 720) * Math.PI * 2; ctx.save(); ctx.globalAlpha = 0.3 + 0.2 * Math.sin(P.t * 5); ctx.lineCap = 'round'; ctx.strokeStyle = '#2f7de1'; ctx.lineWidth = c.r * 0.08; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + Math.sin(mA) * c.r * 0.72, c.y - Math.cos(mA) * c.r * 0.72); ctx.stroke(); ctx.strokeStyle = '#e5484d'; ctx.lineWidth = c.r * 0.12; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + Math.sin(hA) * c.r * 0.48, c.y - Math.cos(hA) * c.r * 0.48); ctx.stroke(); ctx.restore(); hand(ctx, c.x + Math.sin(mA) * c.r * 0.72, c.y - Math.cos(mA) * c.r * 0.72, P.t, 34); }
      }
    },
    _test: { step() {
      if (!P || !P.cur) return 'none';
      const C = P.cur;
      if (P.phase === 'screws') { C.screws = [1, 1, 1, 1]; opened(); return 'screws'; }
      if (P.phase === 'gears') { C.gear.placed = C.gear.need; closeUp(); return 'gears'; }
      if (P.phase === 'hands') { C.w.min = C.q.t % 720; if (C.q.ampm) C.w.half = C.q.t >= 720 ? 'PM' : 'AM'; check(); return 'hands'; }
      return P.phase;
    }, get P() { return P; } },
  };
}

startGame({
  mascot: '🐦',
  stick: false,
  story: (d, e) => (e >= 4 ? 'Clock repair pro: alarm clocks with AM and PM, and the 24-hour train station clock.' : 'Tock the cuckoo bird runs a clock repair shop! Open each clock, fix the gears, then set the hands so the cuckoo can sing.'),
  howTo: ['🔩 Tap the screws to open the clock.', '⚙️ Drag the gear that fits onto the empty peg.', '🕐 Drag the long BLUE minute hand and the short RED hour hand to the ticket time. Big kids: tap AM or PM.', '🕯️ Hurry before the customer’s candle burns down!'],
  together: { helps: [{ id: 'candle', icon: '🕯️', label: 'More time', cool: 30 }] },
  lessons: level => LESSONS[level] || [],
  realLife: realFrom(REAL['clock-shop']),
  create: createGame,
});

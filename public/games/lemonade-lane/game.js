// Lemonade Lane: run a real lemonade business for a day!
//  🌤️ Morning: check the weather (hot days bring more thirsty customers).
//  🛒 Buy supplies at the market (big kids: will your money cover it? how many bags can you buy?).
//  🏷️ Set your price on the chalkboard (too high and people walk past — watch them!).
//  🍋 Open the stand: HOLD to pour each cup to the line, then ring up the order on the register.
//  🌙 Close up and count your money (big kids: figure out the profit).
// A new spot and a new menu item open as you level up: 🌳 park → 🏖️ beach → 🎡 fair → 🏟️ stadium → 🏙️ downtown.
// Levels (must match app/Games/LemonadeLane.php):
// 1 Count the Cups · 2 Add Two Prices · 3 Whole Dollars · 4 Dollars and Cents · 5 Enough Money? · 6 How Many Can I Buy?
// 7 Profit · 8 Big Orders · 9 Sales & Discounts
import { startGame, rand, pick, shuffle, clamp, emoji, roundRect, realFrom, playBox, Sfx } from '../_play/play.js';
import { keypad } from '../_play/widgets.js';
import { sayMoney } from '../_joy/js/util.js';
import { REAL } from '../_joy/js/reallife.js';
import { LESSONS } from './lessons.js';
import { text, panel, button, bubble, hand, popups, particles, teach, taskLevel, inBox, INK } from '../_play/kit.js';

const money = c => (c < 100 && c % 1 === 0 && c >= 0 ? c + '¢' : '$' + (c / 100).toFixed(2));
const dollars = c => (c % 100 === 0 ? '$' + c / 100 : '$' + (c / 100).toFixed(2));
const SPOTS = [
  { id: 'park', at: 'at the Park', name: 'the Park', icon: '🌳', sky: ['#9fdcff', '#e8f8ff'], ground: '#7cc96a', decor: ['🌳', '🌷', '⛲', '🌳'] },
  { id: 'beach', at: 'at the Beach', name: 'the Beach', icon: '🏖️', sky: ['#7fd4ff', '#fff6d6'], ground: '#f3d899', decor: ['🌴', '⛱️', '🏄', '🦀'] },
  { id: 'fair', at: 'at the County Fair', name: 'the County Fair', icon: '🎡', sky: ['#ffb27a', '#ffe9c9'], ground: '#b5d982', decor: ['🎡', '🎪', '🐄', '🎠'] },
  { id: 'stadium', at: 'at the Ballpark', name: 'the Ballpark', icon: '🏟️', sky: ['#7aa8ff', '#e4efff'], ground: '#5fbf5f', decor: ['🏟️', '⚾', '🧢', '📣'] },
  { id: 'city', at: 'downtown', name: 'Downtown', icon: '🏙️', sky: ['#a0b4d6', '#f1f4fa'], ground: '#b7b7bd', decor: ['🏙️', '🚕', '🚲', '🏢'] },
];
const spotFor = lv => SPOTS[Math.min(SPOTS.length - 1, Math.floor((lv - 1) / 2))];
const MENU = [['🍋', 'lemonade', 1], ['🍪', 'cookie', 2], ['🍓', 'strawberry lemonade', 4], ['🥤', 'smoothie', 6], ['🍧', 'frozen lemonade', 8]];
const menuFor = lv => MENU.filter(m => m[2] <= lv);
const WEATHER = [['☀️', 'sunny', 78, 1], ['🥵', 'super hot', 95, 1.5], ['⛅', 'cloudy', 66, 0.7], ['🌧️', 'rainy', 58, 0.4]];
const PEOPLE = ['👧', '🧒', '👦', '👩', '🧑', '👨', '👵', '👴', '🧔', '👱'];
const SUPPLIES = [['🍋', 'lemons'], ['🥤', 'cups'], ['🍬', 'sugar']];

/** Price per cup for this level (cents) and what a customer orders. */
function basePrice(lv) { return lv === 1 ? pick([1, 2, 5]) : lv === 2 ? rand(3, 9) : lv === 3 ? 100 : lv <= 6 ? 75 : 125; }
function makeOrder(lv, price) {
  const menu = menuFor(Math.max(lv, 1));
  if (lv === 1) { const n = price === 1 ? rand(2, 9) : rand(2, 5); return { lines: [['🍋', 'lemonade', price, n]], ans: price * n, say: `${n} cups of lemonade, please! Each cup is ${price} ${price === 1 ? 'cent' : 'cents'}. How much is that?`, steps: price === 1 ? `Count the cups: ${n} cups is ${n} cents.` : `Skip count by ${price}: ${Array.from({ length: n }, (_, i) => (i + 1) * price).join(', ')}.` }; }
  if (lv === 2) { const pb = rand(2, 9); return { lines: [['🍋', 'lemonade', price, 1], ['🍪', 'cookie', pb, 1]], ans: price + pb, say: `A lemonade for ${price} cents and a cookie for ${pb} cents, please. What's the total?`, steps: `Start with the bigger number and count on: ${Math.max(price, pb)} … ${price + pb}.` }; }
  if (lv === 3) { const items = shuffle(menu).slice(0, 2).map(m => [m[0], m[1], rand(1, 5) * 100, 1]); const t = items.reduce((s, i) => s + i[2], 0); return { lines: items, ans: t, say: `${items.map(i => `a ${i[1]} for ${i[2] / 100} dollars`).join(' and ')}. What's the total?`, steps: `${items.map(i => dollars(i[2])).join(' + ')} = ${dollars(t)}.` }; }
  if (lv === 4 || lv === 5 || lv === 6 || lv === 7) { const items = shuffle(menu).slice(0, 2).map((m, i) => [m[0], m[1], i ? rand(3, 30) * 5 : price, 1]); const t = items.reduce((s, i) => s + i[2], 0); return { lines: items, ans: t, say: `${items.map(i => `a ${i[1]} for ${sayMoney(i[2])}`).join(' and ')}. How much for both?`, steps: `Add the cents, then the dollars: ${items.map(i => money(i[2])).join(' + ')} = ${money(t)}.` }; }
  // 8 big orders, 9 discounts
  const m = pick(menu), each = rand(3, 9) * 25, n = rand(2, 5);
  if (lv === 8) return { lines: [[m[0], m[1], each, n]], ans: each * n, say: `${n} ${m[1]}s at ${sayMoney(each)} each, please! What's the total?`, steps: `Multiply: ${n} × ${money(each)} = ${money(each * n)}.` };
  const full = rand(2, 8) * 100, off = pick([[50, 'half'], [25, 'a quarter'], [10, 'a tenth']]), sale = full - full * off[0] / 100;
  return { lines: [[m[0], `${m[1]} (${off[0]}% off ${dollars(full)})`, sale, 1]], ans: sale, sale: { full, off: off[0] }, say: `I'd like the ${m[1]}. It's ${dollars(full)}, but today it's ${off[0]} percent off! What do I pay?`, steps: `${off[0]}% is ${off[1]}. ${off[1]} of ${dollars(full)} is ${money(full * off[0] / 100)}. ${dollars(full)} − ${money(full * off[0] / 100)} = ${money(sale)}.` };
}

function createGame(api) {
  let P = null;
  const pops = popups(), fx = particles();
  let pad = null;

  function start(o) {
    const spot = spotFor(o.real), wx = pick(WEATHER), lv = taskLevel(api, o);
    P = { o, t: 0, spot, wx, phase: 'forecast', price: basePrice(o.real), want: o.boss ? 6 : o.edition <= 1 ? 4 : 5, served: 0, walked: 0, earned: 0, spent: 0, cups: 0, customers: [], cur: null, pour: 0, guidedDone: !!o.boss, lv, spawn: 1.2, bees: [] };
    api.score('💰 $0'); api.progress(0, 'Customers');
    api.goal(`${wx[0]} Today <b>${spot.at}</b>: ${wx[1]}, ${wx[2]}°F. ${wx[3] >= 1 ? 'Lots of thirsty people!' : 'Fewer people will want lemonade.'}`);
    api.actions([{ key: 'check', label: '▶ Go to the market', big: true }]);
  }
  // ------------------------------------------------ the market (supplies)
  function market() {
    const lv = P.o.boss ? taskLevel(api, P.o) : api.learn.work();
    P.phase = 'market'; P.basket = []; P.mk = { lv };
    if (lv === 5) {
      const items = shuffle(SUPPLIES).slice(0, 2).map(s => [s[0], s[1], rand(4, 40) * 5]), have = rand(Math.ceil((items[0][2] + items[1][2]) / 100), 7) * 100, t = items[0][2] + items[1][2];
      P.mk = { lv, items, have, ans: have - t, q: `You have ${dollars(have)}. You buy ${items.map(i => `${i[1]} (${money(i[2])})`).join(' and ')}. How much money will you have LEFT?`, steps: `${money(items[0][2])} + ${money(items[1][2])} = ${money(t)}. ${dollars(have)} − ${money(t)} = ${money(have - t)}.` };
      openPad(true, '$', P.mk.q);
    } else if (lv === 6) {
      const price = rand(2, 6) * 100, have = price * rand(2, 6) + rand(0, price / 100 - 1) * 100;
      P.mk = { lv, price, have, n: 0, ans: Math.floor(have / price), q: `You have ${dollars(have)}. A bag of lemons costs ${dollars(price)}. Tap ➕ to put bags in your cart — as MANY as you can buy!`, steps: `${dollars(have)} ÷ ${dollars(price)} = ${Math.floor(have / price)} bags${have % price ? `, with ${dollars(have % price)} left over` : ''}.` };
      api.actions([{ key: 'help', label: '💡 Help' }, { key: 'check', label: '🛒 Buy', big: true }]);
    } else {
      P.mk = { lv, n: 0, q: 'Tap each supply to load your cart: lemons, cups and sugar!' };
      api.actions([]);
    }
    P.teachMk = lv === 5 || lv === 6 ? teach(api, { level: lv, guided: !P.guidedDone, prompt: P.mk.q, expected: lv === 5 ? money(P.mk.ans) : `${P.mk.ans} bags` }) : null;
    api.goal(`🛒 ${P.mk.q}`, { speak: true });
  }
  function openPad(decimal, prefix, q) {
    pad = keypad({ prefix, decimal, digits: 5 });
    pad.api = api;
    api.actions([{ key: 'help', label: '💡 Help' }, { key: 'check', label: '✔ Check', big: true }]);
    void q;
  }
  function checkMarket() {
    const M = P.mk, T = P.teachMk;
    if (M.lv === 5) { const v = pad.value(); if (v == null) return; const c = Math.round(v * 100); if (c === M.ans) return marketDone(true); return marketMiss(c > M.ans ? `That's too much left over. Add up the two prices first.` : `Not quite. ${M.steps.split('.')[0]}.`); }
    if (M.lv === 6) { if (M.n === M.ans) return marketDone(true); return marketMiss(M.n > M.ans ? `${M.n} bags cost ${dollars(M.n * M.price)}. That's more than ${dollars(M.have)}! Take some out.` : `You can still buy more! ${M.n} bags is only ${dollars(M.n * M.price)}. Add another.`); }
    void T;
  }
  function marketMiss(why) {
    const n = P.teachMk.miss(); Sfx.wrong();
    if (n >= 3) { P.teachMk.done(false, ''); api.speak(`Here's how: ${P.mk.steps}`, { force: true }); if (!api.loseHeart('The market owner helped you.')) setTimeout(() => P && P.phase === 'market' && marketDone(false), 2500); return; }
    if (n === 2) { P.teachMk.help(); why += ' ' + P.mk.steps; }
    api.speak(why, { force: true });
  }
  function marketDone(ok) {
    if (ok && P.teachMk) { const r = P.teachMk.done(true, P.mk.lv === 6 ? `${P.mk.n} bags` : ''); if (r.levelUp) api.chime('⭐ <b>Level up!</b> A new spot opens next time!', '🍋'); }
    if (ok) { Sfx.correct(); fx.burst(api.W / 2, api.H / 2, 18); }
    P.spent = P.mk.lv === 5 ? P.mk.have - P.mk.ans : P.mk.lv === 6 ? P.mk.ans * P.mk.price : P.o.real >= 7 ? rand(4, 8) * 50 : 0;
    pad = null; P.guidedDone = P.guidedDone || !!P.teachMk;
    P.phase = 'price';
    api.actions([{ key: 'down', label: '➖' }, { key: 'up', label: '➕' }, { key: 'check', label: '🍋 Open!', big: true }]);
    api.goal(`🏷️ Set your price! ${P.wx[3] >= 1 ? 'Hot weather — people will pay a bit more.' : 'Cool weather — keep it low!'} Then open the stand.`, { speak: true });
  }
  // ------------------------------------------------ the day
  const fairPrice = () => (P.o.real <= 2 ? 10 : P.o.real === 3 ? 300 : 150) * P.wx[3];
  function spawn() {
    const p = { face: pick(PEOPLE), x: -0.1, dir: 1, stop: false, pat: 1, mood: 0 };
    const tooHigh = P.price > fairPrice() * 1.15;
    p.stop = !P.cur && P.customers.filter(c => c.stop).length < 2 && (!tooHigh ? Math.random() < 0.85 : Math.random() < 0.25);
    if (!p.stop && tooHigh) p.mood = -1;
    P.customers.push(p);
  }
  function startOrder(c) {
    const lv = P.o.boss ? taskLevel(api, P.o) : api.learn.work(), O = makeOrder(lv, lv === P.o.real ? P.price : basePrice(lv));
    const guided = !P.guidedDone;
    P.cur = { c, O, lv, poured: 0, need: O.lines.reduce((s, l) => s + (/lemonade|smoothie/.test(l[1]) ? Math.min(3, l[3]) : 0), 0) || 1 };
    P.teach = teach(api, { level: lv, guided, prompt: O.say, expected: money(O.ans) });
    P.phase = 'pour'; P.pour = 0;
    api.actions([{ key: 'pour', label: '🥤 HOLD to pour', big: true }]);
    api.goal('🍋 HOLD the pour button. Let go when the cup is filled to the line!', { speak: false });
    api.speak(guided ? `Your first customer! First pour the lemonade: hold the pour button and let go when it reaches the line. Then I'll help you ring it up.` : pick(['Hi! Lemonade please!', 'One lemonade!', 'I am so thirsty!']));
  }
  function poured() {
    P.phase = 'ring'; pad = keypad({ prefix: P.cur.O.ans >= 100 || P.o.real >= 3 ? '$' : '', suffix: P.cur.O.ans < 100 && P.o.real < 3 ? '¢' : '', decimal: P.o.real >= 3, digits: 5 }); pad.api = api;
    api.actions([{ key: 'help', label: '💡 Help' }, { key: 'check', label: '🧾 Ring it up', big: true }]);
    api.goal(`🧾 ${P.cur.O.lines.map(l => `${l[0]} ${l[3] > 1 ? l[3] + ' × ' : ''}${money(l[2])}`).join(' + ')} = ?`, { speak: false });
    api.speak(P.cur.O.say);
  }
  function ring() {
    const v = pad.value(); if (v == null) { api.speak('Type the total on the number pad first!', { force: true }); return; }
    const c = P.o.real >= 3 ? Math.round(v * 100) : Math.round(v), O = P.cur.O;
    if (c === O.ans) {
      const r = P.teach.done(true, money(c)); if (r.levelUp) api.chime('⭐ <b>Level up!</b> A new spot opens next time!', '🍋');
      Sfx.correct(); fx.burst(api.W * 0.5, api.H * 0.45, 18); pops.add(`+${money(O.ans)}`, api.W * 0.5, api.H * 0.35, '#2fae66', 26);
      P.earned += O.ans; P.cups += O.lines.reduce((s, l) => s + l[3], 0); P.served++;
      api.score(`💰 ${money(P.earned)}`); api.progress(P.served / P.want, 'Customers');
      api.speak(pick(['Yum! Thank you!', 'Delicious!', 'Best lemonade ever!', 'Thanks!']));
      return orderOver();
    }
    const n = P.teach.miss(); Sfx.wrong();
    if (n >= 3) { P.teach.done(false, money(c)); api.speak(`Let me show you: ${O.steps}`, { force: true }); if (!api.loseHeart('The customer helped you add it up.')) { P.earned += O.ans; P.served++; api.score(`💰 ${money(P.earned)}`); api.progress(P.served / P.want, 'Customers'); setTimeout(() => P && orderOver(), 1800); } return; }
    if (n === 2) P.teach.help();
    api.speak(n === 2 ? `Let's do it together: ${O.steps}` : c > O.ans ? `Hmm, that's too much. ${O.steps.split(':')[0]}.` : `Hmm, that's not enough. ${O.steps.split(':')[0]}.`, { force: true });
  }
  function orderOver() {
    P.guidedDone = true; pad = null;
    if (P.cur) { P.cur.c.done = true; P.cur.c.dir = 1; P.cur.c.stop = false; }
    P.cur = null; P.phase = 'day'; api.actions([]);
    if (P.served >= P.want) return closeUp();
    api.goal(`🍋 Open for business! ${P.want - P.served} more customer${P.want - P.served === 1 ? '' : 's'} to go.`, { speak: false });
  }
  function closeUp() {
    P.phase = 'close'; P.customers = [];
    api.state.extra.earned = (api.state.extra.earned || 0) + P.earned;
    if (P.o.real >= 7 && !P.o.boss) {
      const lv = 7, profit = P.earned - P.spent;
      P.pr = { profit }; P.teach = teach(api, { level: lv, guided: false, prompt: `Revenue ${money(P.earned)} − cost ${money(P.spent)}`, expected: money(profit) });
      pad = keypad({ prefix: '$', decimal: true, digits: 6 }); pad.api = api;
      api.actions([{ key: 'help', label: '💡 Help' }, { key: 'check', label: '✔ Profit', big: true }]);
      api.goal(`🌙 Closing time! You took in <b>${money(P.earned)}</b> and spent <b>${money(P.spent)}</b> on supplies. What is your PROFIT?`, { speak: true });
      return;
    }
    finish();
  }
  function checkProfit() {
    const v = pad.value(); if (v == null) return;
    const c = Math.round(v * 100);
    if (c === P.pr.profit) { const r = P.teach.done(true, money(c)); if (r.levelUp) api.chime('⭐ <b>Level up!</b>', '🍋'); Sfx.correct(); return finish(); }
    const n = P.teach.miss(); Sfx.wrong();
    if (n >= 3) { P.teach.done(false, money(c)); api.speak(`Profit is money in minus money spent: ${money(P.earned)} − ${money(P.spent)} = ${money(P.pr.profit)}.`, { force: true }); setTimeout(() => P && finish(), 2600); return; }
    if (n === 2) P.teach.help();
    api.speak(`Profit = money in − money spent. ${n === 2 ? `${money(P.earned)} − ${money(P.spent)}.` : 'Subtract what you spent.'}`, { force: true });
  }
  function finish() {
    pad = null; P.phase = 'done';
    api.finish({ win: true, title: `${P.spot.icon} Great day ${P.spot.at}!`, text: `You served ${P.served} customers and made ${money(P.earned)}${P.pr ? ` (profit ${money(P.pr.profit)})` : ''}.` });
  }

  // ------------------------------------------------ layout
  const L = () => {
    const b = playBox(api.W, api.H), short = api.H <= 500;
    const groundY = b.y + b.h * (short ? 0.62 : 0.5);
    return { b, short, groundY, stand: { x: b.x + b.w * 0.5 - Math.min(140, b.w * 0.22), y: groundY - (short ? 90 : 120), w: Math.min(280, b.w * 0.44), h: short ? 90 : 120 }, card: short ? { x: b.x + b.w * 0.52, y: b.y + 4, w: b.w * 0.46, h: b.h - 8 } : { x: b.x + 8, y: groundY + 10, w: b.w - 16, h: b.y + b.h - groundY - 14 } };
  };
  const cartRects = () => { const C = L().card, n = 3, w = Math.min(130, (C.w - 40) / n); return SUPPLIES.map((s, i) => ({ s, x: C.x + (C.w - n * (w + 10)) / 2 + i * (w + 10), y: C.y + C.h * 0.3, w, h: Math.min(120, C.h * 0.5) })); };
  const plusMinus = () => { const C = L().card, s = Math.min(70, C.h * 0.3); return { minus: { x: C.x + C.w / 2 - s * 1.8, y: C.y + C.h - s - 12, w: s, h: s }, plus: { x: C.x + C.w / 2 + s * 0.8, y: C.y + C.h - s - 12, w: s, h: s } }; };

  return {
    start(o) { start(o); },
    checkpoint() { if (!P) return; if (P.cur) { P.cur.c.done = true; P.cur = null; } pad = null; P.phase = 'day'; api.actions([]); },
    stop() { P = null; pad = null; },
    update(dt) {
      if (!P) return; P.t += dt; pops.update(dt); fx.update(dt);
      if (pad && pad.update) pad.update(dt, api.input);
      const pressed = k => api.input.pressed(k);
      if (pressed('help')) this.hint();
      if (P.phase === 'forecast' && pressed('check')) market();
      else if (P.phase === 'market') { if (pressed('check')) checkMarket(); }
      else if (P.phase === 'price') {
        const step = P.o.real <= 2 ? 1 : 25, min = P.o.real <= 2 ? 1 : 25, max = P.o.real <= 2 ? 20 : 400;
        if (pressed('up')) { P.price = Math.min(max, P.price + step); Sfx.click(); api.speak(money(P.price)); }
        if (pressed('down')) { P.price = Math.max(min, P.price - step); Sfx.click(); api.speak(money(P.price)); }
        if (pressed('check')) { P.phase = 'day'; api.actions([]); Sfx.coin(); api.goal(`🍋 Open for business at <b>${money(P.price)}</b> a cup! Customers are coming…`, { speak: true }); }
      } else if (P.phase === 'day') {
        P.spawn -= dt * (0.5 + P.wx[3] * 0.4);
        if (P.spawn <= 0) { spawn(); P.spawn = 2.2 + Math.random() * 1.5; }
        for (const c of P.customers) {
          const sp = dt * 0.12;
          if (c.stop && !c.done) {
            const tgt = P.cur && P.cur.c !== c ? 0.38 : 0.5;
            if (c.x < tgt) c.x = Math.min(tgt, c.x + sp);
            else if (!P.cur && tgt === 0.5) startOrder(c);
          } else c.x += sp * c.dir;
          if (c.mood < 0 && Math.abs(c.x - 0.45) < 0.01 && !c.said) { c.said = true; P.walked++; pops.add('Too pricey!', api.W * 0.45, L().groundY - 120, '#e5484d', 18); if (P.walked % 2 === 1) api.speak('Too expensive! Try a lower price.'); }
        }
        P.customers = P.customers.filter(c => c.x < 1.15);
        if (P.walked >= 4 && P.price > fairPrice()) { P.walked = 0; P.phase = 'price'; api.actions([{ key: 'down', label: '➖' }, { key: 'up', label: '➕' }, { key: 'check', label: '🍋 Open!', big: true }]); api.goal('🏷️ Nobody is buying! Try a lower price.', { speak: true }); }
      } else if (P.phase === 'pour') {
        if (api.input.held('pour')) { P.pour = Math.min(1.25, P.pour + dt * 0.45); if (P.pour > 1.08) { P.pour = 0; Sfx.wrong(); api.speak('Oops, it spilled! Let go at the line.', { force: true }); P.spills = (P.spills || 0) + 1; } }
        else if (P.pour > 0.15) { if (P.pour >= 0.82) { Sfx.coin(); P.pour = 0; poured(); } else { api.speak('Keep pouring — fill it up to the line!', { force: true }); P.pourHint = 1; } }
      } else if (P.phase === 'ring') { if (pressed('check')) ring(); }
      else if (P.phase === 'close') { if (pressed('check')) checkProfit(); }
    },
    hint() {
      if (!P) return false;
      if (P.phase === 'ring' && P.cur) { P.teach.help(); api.speak(P.cur.O.steps, { force: true }); return true; }
      if (P.phase === 'market' && P.teachMk) { P.teachMk.help(); api.speak(P.mk.steps, { force: true }); return true; }
      if (P.phase === 'close' && P.teach) { P.teach.help(); api.speak(`Profit is the money you made minus what you spent: ${money(P.earned)} take away ${money(P.spent)}.`, { force: true }); return true; }
      if (P.phase === 'pour') { api.speak('Hold the pour button and watch the cup. Let go when it reaches the dotted line!', { force: true }); P.pourHint = 1; return true; }
      return false;
    },
    coach() { if (!P) return ''; if (P.phase === 'ring' && P.cur) return `Order: ${P.cur.O.lines.map(l => `${l[3] > 1 ? l[3] + '×' : ''}${money(l[2])}`).join(' + ')}. Let them add it — ask "what's the biggest part?"`; if (P.phase === 'market') return P.mk.lv === 6 ? 'Count by the price until you reach the money they have.' : P.mk.lv === 5 ? 'Add the two prices, then subtract from the money they have.' : 'Load the cart!'; if (P.phase === 'price') return 'Talk about it: hot day = higher price is OK. Cold day = lower.'; return ''; },
    onHelp(id) { if (!P) return ''; if (id === 'ad') { P.spawn = 0; P.wx = [P.wx[0], P.wx[1], P.wx[2], Math.max(1, P.wx[3])]; return 'made a big sign — more customers are coming!'; } return ''; },
    screen() { if (!P) return ''; return `${P.spot.name} · ${P.wx[1]} · price ${money(P.price)} · served ${P.served}/${P.want} · ${pad ? `typed: ${pad.s || '?'}` : ''}`; },
    onTap(x, y) {
      if (!P) return;
      if (pad && pad.down && inBox(x, y, L().card)) { pad.down(x, y); return; }
      if (P.phase === 'market') {
        const M = P.mk;
        if (M.lv === 6) { const pm = plusMinus(); if (inBox(x, y, pm.plus)) { M.n++; Sfx.coin(); api.speak(`${M.n} bags. ${dollars(M.n * M.price)}`); } if (inBox(x, y, pm.minus) && M.n) { M.n--; Sfx.click(); api.speak(`${M.n} bags. ${dollars(M.n * M.price)}`); } return; }
        if (M.lv !== 5) { const r = cartRects().find(q => inBox(x, y, q)); if (r && !r.s.got) { P.basket.push(r.s); r.s.got = true; Sfx.coin(); api.speak(r.s[1]); if (P.basket.length >= 3) { SUPPLIES.forEach(s => delete s.got); setTimeout(() => P && P.phase === 'market' && marketDone(false), 600); } } }
      }
    },
    draw(ctx, W, H, onTitle) {
      const spot = P ? P.spot : SPOTS[0];
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, spot.sky[0]); g.addColorStop(1, spot.sky[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const lay = P ? L() : { groundY: H * 0.65, b: { x: 0, w: W }, stand: { x: W * 0.35, y: H * 0.45, w: W * 0.3, h: H * 0.2 } };
      ctx.fillStyle = spot.ground; ctx.fillRect(0, lay.groundY, W, H - lay.groundY);
      spot.decor.forEach((e, i) => emoji(ctx, e, (i + 0.5) * W / 4 + (i % 2 ? 40 : -40), lay.groundY - 30, 52, { alpha: 0.85 }));
      if (P) emoji(ctx, P.wx[0], W - 50, lay.b.y + 30, 44);
      // the stand
      const S = lay.stand;
      ctx.fillStyle = '#ffe680'; roundRect(ctx, S.x, S.y, S.w, S.h, 10); ctx.fill();
      for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#ffd23d' : '#fff'; ctx.fillRect(S.x + i * S.w / 6, S.y - 24, S.w / 6, 24); }
      text(ctx, 'LEMONADE', S.x + S.w / 2, S.y + 20, { size: Math.min(24, S.w / 10), color: '#c94a2d' });
      if (P && P.phase !== 'forecast' && P.phase !== 'market') { panel(ctx, { x: S.x + S.w - 70, y: S.y - 70, w: 76, h: 40 }, { fill: '#2b3a2b', r: 8 }); text(ctx, money(P.price), S.x + S.w - 32, S.y - 50, { size: 18, color: '#fff' }); }
      emoji(ctx, '🍋', S.x + 30, S.y + S.h * 0.6, 34); emoji(ctx, '🍹', S.x + S.w * 0.5, S.y + S.h * 0.62, Math.min(44, S.h * 0.5));
      if (onTitle || !P) { emoji(ctx, '🧒', S.x + S.w / 2, S.y - 50, 50); return; }
      emoji(ctx, api.kid.avatar || '🙂', S.x + S.w / 2, S.y - 46, 44);
      // customers
      for (const c of P.customers) emoji(ctx, c.face, c.x * W + (P.cur && P.cur.c === c ? (lay.short ? 70 : 90) : 0), lay.groundY - 26 + Math.sin((P.t + c.x * 10) * 9) * 2, lay.short ? 40 : 52);
      if (P.cur) { const cx = 0.5 * W + (lay.short ? 70 : 90); bubble(ctx, P.cur.O.lines.map(l => `${l[0]}${l[3] > 1 ? '×' + l[3] : ''}`).join(' '), cx, lay.groundY - (lay.short ? 46 : 60), { size: 18, max: 200 }); }
      this.drawCard(ctx, lay);
      fx.draw(ctx); pops.draw(ctx);
    },
    drawCard(ctx, lay) {
      const C = lay.card;
      if (P.phase === 'forecast') {
        panel(ctx, C, { fill: '#fffdf6' });
        emoji(ctx, P.wx[0], C.x + C.w / 2, C.y + C.h * 0.35, Math.min(90, C.h * 0.4));
        text(ctx, `${P.wx[1]} · ${P.wx[2]}°F`, C.x + C.w / 2, C.y + C.h * 0.68, { size: 24 });
        text(ctx, P.wx[3] >= 1 ? 'Thirsty weather! 🥵' : 'Not many thirsty people today.', C.x + C.w / 2, C.y + C.h * 0.86, { size: 15, color: '#6b6380', max: C.w - 20 });
        return;
      }
      if (P.phase === 'market') {
        panel(ctx, C, { fill: '#fffdf6' });
        const M = P.mk;
        if (M.lv === 6) {
          text(ctx, `💵 ${dollars(M.have)}   ·   🍋 ${dollars(M.price)} a bag`, C.x + C.w / 2, C.y + 26, { size: 18 });
          for (let i = 0; i < M.n; i++) emoji(ctx, '🍋', C.x + C.w / 2 - (M.n - 1) * 22 + i * 44, C.y + C.h * 0.4, 36);
          text(ctx, `${M.n} bags = ${dollars(M.n * M.price)}`, C.x + C.w / 2, C.y + C.h * 0.62, { size: 20, color: M.n * M.price > M.have ? '#e5484d' : INK });
          const pm = plusMinus(); button(ctx, pm.minus, '➖', { fill: '#fff' }); button(ctx, pm.plus, '➕', { fill: '#ffc93c' });
        } else if (M.lv === 5) {
          text(ctx, M.q, C.x + C.w / 2, C.y + 30, { size: 15, max: C.w - 20 });
          pad.draw(ctx, { x: C.x + 10, y: C.y + 70, w: C.w - 20, h: C.h - 80 });
        } else {
          text(ctx, '🛒 Tap each supply:', C.x + C.w / 2, C.y + 22, { size: 18 });
          for (const r of cartRects()) { panel(ctx, r, { fill: r.s.got ? '#d9f5e2' : '#fff', r: 14, shadow: false, stroke: '#e2deef' }); emoji(ctx, r.s[0], r.x + r.w / 2, r.y + r.h * 0.42, Math.min(56, r.h * 0.5)); text(ctx, r.s[1], r.x + r.w / 2, r.y + r.h * 0.85, { size: 14 }); if (!r.s.got && !P.basket.length) hand(ctx, r.x + r.w * 0.7, r.y + r.h * 0.5, P.t, 34); }
        }
        return;
      }
      if (P.phase === 'pour' && P.cur) {
        panel(ctx, C, { fill: '#fffdf6' });
        const cw = Math.min(110, C.w * 0.3), ch = Math.min(150, C.h * 0.7), cx = C.x + C.w / 2 - cw / 2, cy = C.y + (C.h - ch) / 2;
        ctx.fillStyle = '#e8f4ff'; ctx.strokeStyle = '#7aa8d6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + cw, cy); ctx.lineTo(cx + cw * 0.85, cy + ch); ctx.lineTo(cx + cw * 0.15, cy + ch); ctx.closePath(); ctx.fill(); ctx.stroke();
        const lvl = Math.min(1, P.pour); ctx.save(); ctx.clip(); ctx.fillStyle = '#ffe14f'; ctx.fillRect(cx, cy + ch * (1 - lvl), cw, ch * lvl); ctx.restore();
        ctx.setLineDash([6, 5]); ctx.strokeStyle = '#e5484d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 10, cy + ch * 0.12); ctx.lineTo(cx + cw + 10, cy + ch * 0.12); ctx.stroke(); ctx.setLineDash([]);
        text(ctx, 'fill line', cx + cw + 16, cy + ch * 0.12, { size: 13, align: 'left', color: '#e5484d' });
        if (P.teach.guided || P.pourHint) { const btn = document.querySelector('#pg-actions .pg-act.big'); if (btn) { const bb = btn.getBoundingClientRect(); hand(ctx, bb.left + bb.width / 2, bb.top - 54, P.t, 38); } }
        return;
      }
      if ((P.phase === 'ring' || P.phase === 'close') && pad) {
        panel(ctx, C, { fill: '#fffdf6' });
        const head = P.phase === 'close' ? `${money(P.earned)} − ${money(P.spent)} = ?` : P.cur.O.lines.map(l => `${l[0]} ${l[3] > 1 ? l[3] + ' × ' : ''}${money(l[2])}`).join('  +  ');
        text(ctx, head, C.x + C.w / 2, C.y + 22, { size: 18, max: C.w - 20 });
        pad.draw(ctx, { x: C.x + 10, y: C.y + 44, w: C.w - 20, h: C.h - 52 });
        if (P.phase === 'ring' && P.teach && (P.teach.guided || P.teach.misses >= 2)) text(ctx, P.teach.misses >= 2 ? P.cur.O.steps : P.cur.O.steps.replace(/=\s*[^=]*$/, '= ?'), C.x + C.w / 2, C.y + C.h - 8, { size: 13, color: '#8a6d1f', max: C.w - 20, base: 'bottom' });
      }
      if (P.phase === 'price') {
        panel(ctx, C, { fill: '#2b3a2b' });
        text(ctx, '🏷️ Price for one cup', C.x + C.w / 2, C.y + 28, { size: 18, color: '#fff' });
        text(ctx, money(P.price), C.x + C.w / 2, C.y + C.h * 0.55, { size: Math.min(60, C.h * 0.35), color: '#fff' });
        text(ctx, `Tip: about ${money(Math.round(fairPrice() / 5) * 5 || 1)} works today`, C.x + C.w / 2, C.y + C.h - 18, { size: 13, color: '#b9d6b9', max: C.w - 20 });
      }
    },
    _test: {
      step() {
        if (!P) return 'none';
        if (P.phase === 'forecast') { market(); return 'market'; }
        if (P.phase === 'market') { const M = P.mk; if (M.lv === 5) { pad.s = (M.ans / 100).toFixed(2); checkMarket(); } else if (M.lv === 6) { M.n = M.ans; checkMarket(); } else marketDone(false); return 'mk'; }
        if (P.phase === 'price') { P.price = Math.max(1, Math.round(fairPrice() / 25) * 25 || 5); if (P.o.real <= 2) P.price = 5; P.phase = 'day'; return 'price'; }
        if (P.phase === 'day') { if (!P.cur) { const c = { face: '🧒', x: 0.5, dir: 1, stop: true, pat: 1, mood: 0 }; P.customers.push(c); startOrder(c); } return 'day'; }
        if (P.phase === 'pour') { P.pour = 0; poured(); return 'pour'; }
        if (P.phase === 'ring') { const a = P.cur.O.ans; pad.s = P.o.real >= 3 ? (a / 100).toFixed(2) : String(a); ring(); return 'ring'; }
        if (P.phase === 'close') { pad.s = (P.pr.profit / 100).toFixed(2); checkProfit(); return 'close'; }
        return P.phase;
      }, get P() { return P; },
    },
  };
}

startGame({
  mascot: '🍋',
  stick: false,
  story: (d, e) => (e >= 3 ? 'Run your lemonade business like a pro: check the weather, buy supplies on a budget, set a smart price, take big orders and count your profit.' : 'Open a lemonade stand! Check the weather, buy supplies, pour each cup to the line and ring up the orders.'),
  howTo: ['🌤️ Check the weather: hot days bring more customers.', '🛒 Buy supplies at the market.', '🏷️ Set your price with ➖ ➕.', '🥤 HOLD to pour each cup to the line, then type the total on the register.'],
  together: { helps: [{ id: 'ad', icon: '📣', label: 'Big sign', cool: 25 }] },
  lessons: level => LESSONS[level] || [],
  realLife: realFrom(REAL['lemonade-lane']),
  create: createGame,
});

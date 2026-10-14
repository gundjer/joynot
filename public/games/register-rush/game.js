// Register Rush: you're the cashier! Items ride the conveyor belt — tap each one as it passes the red scanner (beep!).
// Then take the customer's money and give the right change from your cash drawer. Customers wait in line with a
// patience meter: too slow and they walk out (you lose a heart). Each served customer is a checkpoint.
// The store changes as you grow: 🧸 toy shop → 🛒 grocery store → 📺 electronics store (with sales tax and sales).
// Levels (must match app/Games/RegisterRush.php):
// 1 Pay with Dollar Bills · 2 Pay with $1 and $5 · 3 Pay Exact Coins · 4 Change from $1 · 5 Change from $5 ·
// 6 Change from $10 & $20 · 7 Two Items · 8 Tax & Discounts
// I do: lesson slides. We do: the first customer (the hand shows each step and Sam counts up out loud). You do: the rest.
import { startGame, rand, pick, shuffle, clamp, emoji, roundRect, realFrom, playBox, Sfx } from '../_play/play.js';
import { drawMoney, cents } from '../_play/widgets.js';
import { MONEY, fewest } from '../_joy/js/money.js';
import { sayMoney } from '../_joy/js/util.js';
import { REAL } from '../_joy/js/reallife.js';
import { LESSONS } from './lessons.js';
import { text, panel, button, bubble, hand, popups, particles, teach, taskLevel, inBox, INK } from '../_play/kit.js';

const amt = c => '$' + (c / 100).toFixed(2);
const amtShort = c => (c % 100 === 0 ? '$' + c / 100 : amt(c));
const STORES = [
  { id: 'toys', name: 'Toy Shop', icon: '🧸', wall: '#ffe3f1', items: [['🧸', 'teddy bear'], ['🎯', 'dart game'], ['🎈', 'balloon'], ['🚂', 'toy train'], ['🧩', 'puzzle'], ['🎨', 'paint set'], ['⚽', 'ball'], ['🛴', 'scooter'], ['🎲', 'dice game'], ['🖍️', 'crayons']] },
  { id: 'grocery', name: 'Grocery Store', icon: '🛒', wall: '#e5f7e1', items: [['🍎', 'apples'], ['🥛', 'milk'], ['🍞', 'bread'], ['🧀', 'cheese'], ['🍌', 'bananas'], ['🥚', 'eggs'], ['🥕', 'carrots'], ['🍪', 'cookies'], ['🥤', 'juice'], ['🍉', 'watermelon'], ['🥣', 'cereal']] },
  { id: 'tech', name: 'Electronics Store', icon: '📺', wall: '#e1ecff', items: [['🎧', 'headphones'], ['🖱️', 'mouse'], ['⌨️', 'keyboard'], ['🔋', 'batteries'], ['💡', 'smart bulb'], ['📷', 'camera'], ['🔌', 'charger'], ['🎮', 'game controller'], ['📻', 'radio']] },
];
const storeFor = lv => (lv <= 2 ? STORES[0] : lv <= 6 ? STORES[1] : STORES[2]);
const PEOPLE = ['👩', '👨', '👵', '👴', '👧', '👦', '🧑', '👩‍🦰', '👨‍🦱', '🧔'];
const DRAWER = ['twenty', 'ten', 'five', 'one', 'quarter', 'dime', 'nickel', 'penny'];

/** One customer's order for this level. mode 'collect' = take exact money from their wallet; 'change' = give change. */
function makeOrder(level, store) {
  const items = shuffle(store.items);
  if (level === 1) { const p = rand(2, 6) * 100; return { mode: 'collect', items: [{ e: items[0][0], n: items[0][1], p }], total: p, wallet: Array(rand(6, 8)).fill('one') }; }
  if (level === 2) { const p = rand(6, 15) * 100; return { mode: 'collect', items: [{ e: items[0][0], n: items[0][1], p }], total: p, wallet: ['five', 'five', 'one', 'one', 'one', 'one', 'one', 'one'].slice(0, p >= 1000 ? 8 : 7) }; }
  if (level === 3) { const p = rand(1, 3) * 100 + rand(1, 19) * 5 - (Math.random() < 0.3 ? rand(1, 4) : 0); return { mode: 'collect', items: [{ e: items[0][0], n: items[0][1], p }], total: p, wallet: ['one', 'one', 'one', 'quarter', 'quarter', 'quarter', 'dime', 'dime', 'nickel', 'penny', 'penny', 'penny', 'penny'] }; }
  if (level === 4) { const p = rand(5, 19) * 5; return { mode: 'change', items: [{ e: items[0][0], n: items[0][1], p }], total: p, paid: ['one'] }; }
  if (level === 5) { const p = rand(1, 4) * 100 + rand(0, 19) * 5; return { mode: 'change', items: [{ e: items[0][0], n: items[0][1], p }], total: p, paid: ['five'] }; }
  if (level === 6) { const big = Math.random() < 0.5 ? 'ten' : 'twenty', p = rand(3, MONEY[big].cents / 100 - 1) * 100 + rand(0, 19) * 5; return { mode: 'change', items: [{ e: items[0][0], n: items[0][1], p }], total: p, paid: [big] }; }
  if (level === 7) { const a = rand(1, 6) * 100 + rand(0, 19) * 5, b = rand(1, 6) * 100 + rand(0, 19) * 5, t = a + b, paid = t < 1000 ? ['ten'] : ['twenty']; return { mode: 'change', items: [{ e: items[0][0], n: items[0][1], p: a }, { e: items[1][0], n: items[1][1], p: b }], total: t, paid }; }
  // level 8: tax or discount, then change
  if (Math.random() < 0.5) { const p = rand(2, 9) * 100, tax = p / 10, t = p + tax; return { mode: 'change', extra: 'tax', items: [{ e: items[0][0], n: items[0][1], p }], sub: p, total: t, paid: [t < 1000 ? 'ten' : 'twenty'], note: '10% sales tax' }; }
  const p = rand(2, 6) * 400, off = p / 4, t = p - off; return { mode: 'change', extra: 'off', items: [{ e: items[0][0], n: items[0][1], p }], sub: p, total: t, paid: [t < 1000 ? 'ten' : 'twenty'], note: '25% OFF sale' };
}
/** Cashier count-up steps from the price to what they paid (the way real cashiers make change). */
function countUp(from, to) {
  const steps = []; let at = from;
  const add = k => { at += MONEY[k].cents; steps.push([k, at]); };
  while (at % 5 && at < to) add('penny');                              // pennies up to a 5
  let r = (25 - (at % 25)) % 25;                                       // dimes + a nickel up to a quarter mark
  while (r >= 10 && at < to) { add('dime'); r -= 10; }
  if (r === 5 && at < to) add('nickel');
  while (at % 100 && at < to) add('quarter');                          // quarters up to the dollar
  let d = (to - at) / 100;                                             // then bills (fewest)
  for (const [k, v] of [['twenty', 20], ['ten', 10], ['five', 5], ['one', 1]]) while (d >= v && (k !== 'one' || true)) { add(k); d -= v; }
  return steps.reverse().reverse();
}
function solutionPieces(O) {
  if (O.mode === 'collect') { const out = [], left = O.wallet.slice(); let need = O.total; for (const k of ['twenty', 'ten', 'five', 'one', 'quarter', 'dime', 'nickel', 'penny']) while (need >= MONEY[k].cents && left.includes(k)) { left.splice(left.indexOf(k), 1); out.push(k); need -= MONEY[k].cents; } return need === 0 ? out : null; }
  return countUp(O.total, cents(O.paid)).map(s => s[0]);
}

function createGame(api) {
  let P = null;
  const pops = popups(), fx = particles();

  function start(o) {
    const store = storeFor(o.real), n = o.boss ? 5 : o.edition <= 1 ? 4 : 5;
    P = { o, t: 0, store, served: 0, n, line: Array.from({ length: n }, (_, i) => ({ face: pick(PEOPLE), pat: 1, wait: i })), cur: null, phase: 'next', guidedDone: !!o.boss, belt: [], given: [], pad: '', happy: 0 };
    api.goal(`${store.icon} The <b>${store.name}</b> is open! Scan the items, then take the money and give change.`);
    api.score('😊 0'); api.actions([]); api.progress(0, 'Customers');
  }
  function nextCustomer() {
    if (P.served >= P.n) { P.phase = 'done'; api.finish({ win: true, title: `${P.store.icon} Closing time!`, text: `You served ${P.served} customers and made ${P.happy} of them extra happy.` }); return; }
    const lv = taskLevel(api, P.o), O = makeOrder(lv, storeFor(Math.max(lv, P.o.real >= 7 ? 7 : lv)));
    const guided = !P.guidedDone;
    P.cur = { ...P.line[0], O, lv, scanned: 0, scanTotal: 0 };
    P.teach = teach(api, { level: lv, guided, prompt: `Total ${amt(O.total)}${O.paid ? `, paid ${amtShort(cents(O.paid))}` : ''}`, expected: O.mode === 'collect' ? amt(O.total) : `${amt(cents(O.paid) - O.total)} change` });
    P.given = []; P.pad = ''; P.showSol = guided ? 1 : 0;
    P.belt = O.items.map((it, i) => ({ ...it, x: -0.15 - i * 0.22, done: false }));
    P.phase = 'scan';
    api.actions([{ key: 'help', label: '💡 Help' }]);
    api.goal(`🔴 Tap each item when it's on the <b>red scanner</b>!`, { speak: false });
    api.speak(guided ? 'Here comes your first customer! Watch the items on the belt. Tap each one when it reaches the red scanner light. Beep!' : 'Next customer! Scan the items.');
  }
  function scanned() {
    const O = P.cur.O;
    if (O.extra) { P.phase = 'total'; api.actions([{ key: 'help', label: '💡 Help' }, { key: 'check', label: '✔ Total', big: true }]); api.goal(`🏷️ ${O.note}! What is the new total for ${amt(O.sub)}?`, { speak: true }); return; }
    if (O.mode === 'collect') {
      P.phase = 'collect';
      api.goal(`Total: <b>${amtShort(O.total)}</b>. Tap money in the customer's wallet to take exactly ${amtShort(O.total)}.`, { speak: false });
      api.speak(P.teach.guided ? `The total is ${sayMoney(O.total)}. Now take the money from the customer's wallet. Tap the bills and coins to put them in your register, until it's exactly ${sayMoney(O.total)}.` : `That's ${sayMoney(O.total)}. Take exactly ${sayMoney(O.total)} from the wallet.`);
    } else {
      P.phase = 'change';
      const paid = cents(O.paid);
      api.goal(`Total <b>${amt(O.total)}</b>. They paid <b>${amtShort(paid)}</b>. Count up the change from your drawer!`, { speak: false });
      api.speak(P.teach.guided ? `The total is ${sayMoney(O.total)}. The customer gave you ${sayMoney(paid)}. Let's count up from ${sayMoney(O.total)} to ${sayMoney(paid)}. Tap money in the drawer to give change.` : `Total ${sayMoney(O.total)}. They paid ${sayMoney(paid)}. Count up the change!`);
    }
    api.actions([{ key: 'help', label: '💡 Help' }, { key: 'check', label: O.mode === 'collect' ? '✔ Done' : '🤝 Give change', big: true }]);
  }
  function check() {
    const O = P.cur.O;
    if (P.phase === 'total') {
      const v = Math.round(Number(P.pad) * 100);
      if (v === O.total) { Sfx.correct(); api.speak(`Yes! ${O.extra === 'tax' ? `${sayMoney(O.sub)} plus ${sayMoney(O.total - O.sub)} tax` : `${sayMoney(O.sub)} minus ${sayMoney(O.sub - O.total)} off`} is ${sayMoney(O.total)}.`, { force: true }); O.extra = null; P.pad = ''; scanned(); return; }
      return miss(O.extra === 'tax' ? `10 percent tax is 10 cents for every dollar. ${sayMoney(O.sub)} has ${O.sub / 100} dollars, so the tax is ${sayMoney(O.sub / 10)}. Add it on.` : `25 percent off is one fourth off. One fourth of ${sayMoney(O.sub)} is ${sayMoney(O.sub / 4)}. Take it away.`, true);
    }
    const got = cents(P.given), want = O.mode === 'collect' ? O.total : cents(O.paid) - O.total;
    if (!P.given.length) { api.speak('Tap money to put it in first!', { force: true }); return; }
    if (got === want) return served();
    miss(got > want ? `That's ${sayMoney(got)}. Too much! Take some back — it should be ${sayMoney(want)}.` : `That's ${sayMoney(got)} so far. You need ${sayMoney(want - got)} more.`);
  }
  function miss(why, totalStep = false) {
    const n = P.teach.miss(); Sfx.wrong();
    if (n >= 3) {
      P.teach.done(false, totalStep ? P.pad : amt(cents(P.given)));
      api.speak('Good try! Watch how I do it.', { force: true });
      if (!api.loseHeart('Sam the manager helped with that one.')) {
        if (totalStep) { P.cur.O.extra = null; P.pad = ''; scanned(); P.teach = teach(api, { level: P.cur.lv, guided: true, prompt: '', expected: '' }); }
        else { P.given = solutionPieces(P.cur.O) || []; setTimeout(() => P && P.cur && served(true), 1500); }
      }
      return;
    }
    if (n === 2) { P.showSol = 1; P.teach.help(); why += ' Follow my hand!'; }
    api.speak(why, { force: true });
  }
  function served(already) {
    const r = already ? null : P.teach.done(true, amt(cents(P.given)));
    if (r && r.levelUp) api.chime('⭐ <b>Level up!</b> Bigger orders are coming!', '🧾');
    const fast = P.cur.pat > 0.5;
    Sfx.correct(); fx.burst(api.W * 0.7, api.H * 0.4, 18);
    if (fast) { P.happy++; pops.add('😄 +tip!', api.W * 0.72, api.H * 0.3, '#2fae66', 26); }
    api.speak(fast ? pick(['Thank you! Super fast!', 'Wow, great cashier!', 'Thanks! Have a nice day!']) : 'Thank you!');
    finishCustomer(true);
  }
  function finishCustomer(ok) {
    P.guidedDone = true; P.served++; P.line.shift(); P.cur = null; P.phase = 'leave'; P.leaveT = 0.9; P.ok = ok;
    api.score(`😊 ${P.happy}`); api.progress(P.served / P.n, 'Customers'); api.actions([]);
  }
  function walkOut() {
    Sfx.wrong(); api.speak('Oh no, the customer got tired of waiting and left.', { force: true });
    if (P.teach) P.teach.done(false, 'too slow');
    finishCustomer(false);
    api.loseHeart('A customer waited too long and left!');
  }

  // ------------------------------------------------ layout
  const L = () => {
    const b = playBox(api.W, api.H), short = api.H <= 500;
    const counterY = b.y + b.h * (short ? 0.36 : 0.42);
    return { b, short, counterY, belt: { x: b.x, y: counterY - 16, w: b.w * 0.62, h: 40 }, scan: { x: b.x + b.w * 0.42, w: b.w * 0.09 }, cust: { x: b.x + b.w * 0.82, y: counterY - (short ? 60 : 90) }, area: { x: b.x + 6, y: counterY + 34, w: b.w - 12, h: b.y + b.h - counterY - 40 } };
  };
  function walletRects(list) {
    const A = L().area, n = list.length, per = Math.min(n, Math.max(4, Math.floor(A.w / 92))), cw = Math.min(100, (A.w - 10) / per), rows = Math.ceil(n / per), ch = Math.min(90, (A.h * 0.48) / rows);
    return list.map((k, i) => ({ k, i, x: A.x + (A.w - per * cw) / 2 + (i % per) * cw, y: A.y + A.h * 0.5 + Math.floor(i / per) * ch, w: cw - 4, h: ch - 4 }));
  }
  function drawerRects() {
    const A = L().area, ks = DRAWER, cw = (A.w - 8) / ks.length, h = Math.min(96, A.h * 0.42);
    return ks.map((k, i) => ({ k, x: A.x + 4 + i * cw, y: A.y + A.h - h, w: cw - 4, h }));
  }
  function trayRects() {
    const A = L().area, r = Math.min(26, A.h * 0.12), per = Math.max(1, Math.floor((A.w * 0.7) / (r * 2.6)));
    const sorted = P.given.map((k, i) => [k, i]).sort((a, c) => MONEY[c[0]].cents - MONEY[a[0]].cents);
    return sorted.map(([k, i], j) => ({ k, i, x: A.x + A.w * 0.15 + r * 1.4 + (j % per) * r * 2.6, y: A.y + r * 1.4 + Math.floor(j / per) * r * 2.4, r }));
  }
  const padKeys = () => { const A = L().area, kw = Math.min(64, (A.w - 40) / 7), kh = Math.min(54, A.h / 3.2); const ks = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', '⌫']; const per = 6; return ks.map((t, i) => ({ t, x: A.x + (A.w - (kw + 8) * per) / 2 + (i % per) * (kw + 8), y: A.y + A.h - (kh + 8) * 2 + Math.floor(i / per) * (kh + 8), w: kw, h: kh })); };

  return {
    start(o) { start(o); },
    checkpoint() { if (!P) return; if (P.cur) { P.line[0].pat = 1; P.cur = null; } P.phase = 'next'; },
    stop() { P = null; },
    update(dt) {
      if (!P) return; P.t += dt; pops.update(dt); fx.update(dt);
      const slow = P.o.edition <= 1 ? 0.6 : 1;
      P.line.forEach((c, i) => { c.pat = Math.max(0, c.pat - dt * (i === 0 && P.cur ? 0.012 : 0.004) * slow * (P.teach && P.teach.guided && P.cur ? 0 : 1)); });
      if (P.phase === 'next') nextCustomer();
      else if (P.phase === 'leave') { P.leaveT -= dt; if (P.leaveT <= 0) P.phase = 'next'; }
      else if (P.phase === 'scan') {
        for (const it of P.belt) { if (it.done) continue; it.x += dt * 0.16; if (it.x > 1.08) it.x = -0.2; }
        if (P.belt.every(i => i.done)) { P.phase = 'scanWait'; setTimeout(() => P && P.phase === 'scanWait' && scanned(), 350); }
      }
      if (P.cur && P.line[0] && P.line[0].pat <= 0 && P.phase !== 'leave') walkOut();
      if (api.input.pressed('check')) check();
      if (api.input.pressed('help')) this.hint();
      if (P.phase === 'total') { for (let d = 0; d <= 9; d++) if (api.input.pressed('n' + d)) P.pad += d; if (api.input.pressed('back')) P.pad = P.pad.slice(0, -1); }
    },
    hint() {
      if (!P || !P.cur) return false;
      P.teach.help(); P.showSol = 1;
      const O = P.cur.O;
      if (P.phase === 'scan') api.speak('Wait until the item is on the red light, then tap it!', { force: true });
      else if (P.phase === 'total') api.speak(O.extra === 'tax' ? 'Ten percent tax: ten cents for every dollar. Add it to the price.' : 'Twenty five percent off: split the price into four equal parts and take one part away.', { force: true });
      else if (O.mode === 'collect') api.speak(`Use the biggest money first. Follow my hand until it's ${sayMoney(O.total)}.`, { force: true });
      else api.speak(`Count up from ${sayMoney(O.total)}. ${countUp(O.total, cents(O.paid)).slice(0, 3).map(s => sayMoney(s[1])).join(', ')}… Follow my hand!`, { force: true });
      return true;
    },
    coach() { if (!P || !P.cur) return ''; const O = P.cur.O; return P.phase === 'change' ? `Count up together from ${amt(O.total)} to ${amtShort(cents(O.paid))}: coins first, then bills.` : P.phase === 'collect' ? `Biggest money first, then count on to ${amtShort(O.total)}.` : P.phase === 'total' ? (O.extra === 'tax' ? '10% tax = 10¢ for every $1.' : '25% off = take away one quarter of the price.') : 'Tap items on the red scanner.'; },
    onHelp(id) { if (!P) return ''; if (id === 'calm') { P.line.forEach(c => (c.pat = Math.min(1, c.pat + 0.35))); return 'told a joke — the line is happier and more patient!'; } return ''; },
    screen() { if (!P || !P.cur) return ''; const O = P.cur.O; return `Items: ${O.items.map(i => `${i.n} ${amt(i.p)}`).join(' + ')} · ${O.mode === 'change' ? `paid ${amtShort(cents(O.paid))}, giving ${amt(cents(P.given))}` : `taken ${amt(cents(P.given))}`}`; },
    onTap(x, y) {
      if (!P || !P.cur) return;
      const lay = L();
      if (P.phase === 'scan') {
        for (const it of P.belt) { if (it.done) continue; const ix = lay.belt.x + it.x * lay.belt.w; if (Math.abs(x - ix) < 40 && Math.abs(y - lay.belt.y) < 60) { if (Math.abs(ix - (lay.scan.x + lay.scan.w / 2)) < lay.scan.w * 0.75 + 12) { it.done = true; P.cur.scanned++; Sfx.coin(); pops.add(`BEEP! ${amt(it.p)}`, ix, lay.belt.y - 40, '#e5484d', 20); api.speak(`${it.n}, ${sayMoney(it.p)}`); } else { Sfx.click(); api.speak('Wait for the red light!', { force: true }); } return; } }
        return;
      }
      if (P.phase === 'total') { const k = padKeys().find(q => inBox(x, y, q)); if (k) { if (k.t === '⌫') P.pad = P.pad.slice(0, -1); else if (P.pad.length < 6 && !(k.t === '.' && P.pad.includes('.'))) P.pad += k.t; Sfx.click(); } return; }
      const t = trayRects().find(q => Math.hypot(q.x - x, q.y - y) < q.r + 8);
      if (t) { const k = P.given.splice(t.i, 1)[0]; if (P.phase === 'collect') P.cur.O.wallet.push(k); Sfx.click(); return; }
      if (P.phase === 'collect') { const w = walletRects(P.cur.O.wallet).find(q => inBox(x, y, q)); if (w) { P.given.push(P.cur.O.wallet.splice(w.i, 1)[0]); Sfx.coin(); api.speak(amtShort(cents(P.given)).replace('$', '') + (cents(P.given) >= 100 ? ' dollars' : '')); } return; }
      if (P.phase === 'change') { const d = drawerRects().find(q => inBox(x, y, q)); if (d && P.given.length < 14) { P.given.push(d.k); Sfx.coin(); api.speak(`${sayMoney(P.cur.O.total + cents(P.given))}`); } }
    },
    draw(ctx, W, H, onTitle) {
      const store = P ? P.store : STORES[1];
      ctx.fillStyle = store.wall; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(0,0,0,.04)'; for (let x = 0; x < W; x += 40) ctx.fillRect(x, 0, 20, H);
      if (onTitle || !P) { emoji(ctx, '🛒', W * 0.3, H * 0.5, Math.min(140, H * 0.28)); emoji(ctx, '🧾', W * 0.7, H * 0.45, Math.min(120, H * 0.24)); return; }
      const lay = L(), b = lay.b;
      // shelves with the store's goods
      for (let i = 0; i < 7; i++) emoji(ctx, store.items[i % store.items.length][0], b.x + (i + 0.5) * b.w / 7, b.y + 22, 26, { alpha: 0.5 });
      // line of customers (right)
      P.line.forEach((c, i) => {
        if (i === 0 && P.cur) return;
        const x = lay.cust.x + (i + (P.cur ? 0 : 1)) * 46 - (P.cur ? 46 : 0) + 60, y = lay.cust.y - 20;
        if (x > W - 10) return;
        emoji(ctx, c.face, x, y, 34, { alpha: 0.85 });
        ctx.fillStyle = '#ddd'; ctx.fillRect(x - 16, y + 22, 32, 5); ctx.fillStyle = c.pat > 0.5 ? '#2fae66' : c.pat > 0.25 ? '#ffb000' : '#e5484d'; ctx.fillRect(x - 16, y + 22, 32 * c.pat, 5);
      });
      // counter + belt + scanner
      ctx.fillStyle = '#6b4423'; ctx.fillRect(b.x - 10, lay.counterY + 10, b.w + 20, 18);
      ctx.fillStyle = '#3a3f46'; roundRect(ctx, lay.belt.x, lay.belt.y - 4, lay.belt.w, 34, 10); ctx.fill();
      ctx.strokeStyle = '#555c66'; ctx.lineWidth = 2; for (let x = lay.belt.x + ((P.t * 60) % 30); x < lay.belt.x + lay.belt.w; x += 30) { ctx.beginPath(); ctx.moveTo(x, lay.belt.y - 2); ctx.lineTo(x, lay.belt.y + 28); ctx.stroke(); }
      ctx.save(); ctx.globalAlpha = 0.5 + 0.3 * Math.sin(P.t * 8); ctx.fillStyle = '#ff2a2a'; ctx.fillRect(lay.scan.x, lay.belt.y - 8, lay.scan.w, 42); ctx.restore();
      emoji(ctx, '🖥️', lay.scan.x + lay.scan.w / 2, lay.belt.y - 46, 34);
      // register display
      const sc = P.cur ? P.cur.O.items.filter((it, i) => P.belt[i] && P.belt[i].done).reduce((s, it) => s + it.p, 0) : 0;
      panel(ctx, { x: b.x + 4, y: lay.belt.y - 70, w: 150, h: 42 }, { fill: '#123', r: 10 });
      text(ctx, P.cur && P.phase !== 'scan' && P.phase !== 'scanWait' ? amt(P.cur.O.extra ? P.cur.O.sub : P.cur.O.total) : amt(sc), b.x + 79, lay.belt.y - 49, { size: 22, color: '#6f6' });
      if (P.cur) {
        for (const it of P.belt) if (!it.done) { const ix = lay.belt.x + it.x * lay.belt.w; if (ix > lay.belt.x - 30 && ix < lay.belt.x + lay.belt.w + 20) { emoji(ctx, it.e, ix, lay.belt.y + 4, 40); text(ctx, amt(it.p), ix, lay.belt.y - 30, { size: 13, color: '#fff', shadow: '#000' }); } }
        // the customer at the counter
        const c = P.cur, cx = lay.cust.x, cy = lay.cust.y;
        emoji(ctx, c.pat > 0.5 ? c.face : c.pat > 0.25 ? '😐' : '😠', cx, cy, lay.short ? 54 : 74);
        ctx.fillStyle = '#ddd'; ctx.fillRect(cx - 34, cy + 44, 68, 7); ctx.fillStyle = c.pat > 0.5 ? '#2fae66' : c.pat > 0.25 ? '#ffb000' : '#e5484d'; ctx.fillRect(cx - 34, cy + 44, 68 * c.pat, 7);
        if (P.cur.O.paid && (P.phase === 'change' || P.phase === 'total')) { drawMoney(ctx, P.cur.O.paid[0], cx - 70, cy + 10, 26); text(ctx, 'paid', cx - 70, cy + 40, { size: 12 }); }
        if (P.phase === 'scan' && P.showSol) { const it = P.belt.find(i => !i.done); if (it) hand(ctx, lay.scan.x + lay.scan.w / 2, lay.belt.y + 20, P.t, 38); }
        this.drawWork(ctx, lay);
      } else if (P.phase === 'leave') emoji(ctx, P.ok ? '😄' : '😤', lay.cust.x + (0.9 - P.leaveT) * 200, lay.cust.y, 60);
      fx.draw(ctx); pops.draw(ctx);
    },
    drawWork(ctx, lay) {
      const A = lay.area, O = P.cur.O;
      if (P.phase === 'scan' || P.phase === 'scanWait') return;
      panel(ctx, A, { fill: 'rgba(255,253,246,.96)', r: 16 });
      if (P.phase === 'total') {
        text(ctx, `${amt(O.sub)} · ${O.note}`, A.x + A.w / 2, A.y + 24, { size: 20 });
        text(ctx, `New total: $${P.pad || '?'}`, A.x + A.w / 2, A.y + 60, { size: 26, color: '#c94a2d' });
        for (const k of padKeys()) { panel(ctx, k, { fill: '#fff', stroke: '#e2deef', r: 12, shadow: false }); text(ctx, k.t, k.x + k.w / 2, k.y + k.h / 2, { size: 24 }); }
        return;
      }
      const want = O.mode === 'collect' ? O.total : cents(O.paid) - O.total;
      text(ctx, O.mode === 'collect' ? `🧾 Register: ${amt(cents(P.given))} of ${amtShort(O.total)}` : `🤝 Change: ${amt(cents(P.given))}`, A.x + 12, A.y + 16, { size: 16, align: 'left' });
      if (O.mode === 'change') { const cu = `Count up: ${amt(O.total)}${P.given.slice().sort((a, b) => MONEY[a].cents - MONEY[b].cents).reduce((acc, k) => { acc.at += MONEY[k].cents; acc.s += ' → ' + amt(acc.at); return acc; }, { at: O.total, s: '' }).s}`; text(ctx, cu, A.x + A.w - 12, A.y + 16, { size: 14, align: 'right', color: cents(P.given) === want ? '#2fae66' : '#6b6380', max: A.w * 0.55 }); }
      for (const t of trayRects()) drawMoney(ctx, t.k, t.x, t.y, MONEY[t.k].kind === 'bill' ? t.r * 0.9 : t.r);
      const rects = O.mode === 'collect' ? walletRects(O.wallet) : drawerRects();
      if (O.mode === 'collect') text(ctx, '👛 Customer\'s wallet — tap to take', A.x + A.w / 2, rects.length ? rects[0].y - 14 : A.y + A.h / 2, { size: 14, color: '#6b6380' });
      for (const r of rects) { panel(ctx, r, { fill: O.mode === 'collect' ? '#fff8e6' : '#eef3f8', r: 10, shadow: false }); drawMoney(ctx, r.k, r.x + r.w / 2, r.y + r.h * (O.mode === 'collect' ? 0.5 : 0.42), Math.min(r.h * 0.32, r.w * 0.36) * (MONEY[r.k].kind === 'bill' ? 0.85 : 1)); if (O.mode !== 'collect') text(ctx, MONEY[r.k].kind === 'bill' ? `$${MONEY[r.k].label}` : MONEY[r.k].cents + '¢', r.x + r.w / 2, r.y + r.h - 11, { size: 12, color: '#6b6380' }); }
      if (P.showSol) {
        const need = solutionPieces(O) || [], have = P.given.slice();
        const next = need.find(k => { const i = have.indexOf(k); if (i >= 0) { have.splice(i, 1); return false; } return true; });
        if (have.length) { const t = trayRects().find(q => have.includes(q.k)); if (t) emoji(ctx, '❌', t.x, t.y - 28, 22); }
        else if (next) { const r = rects.find(q => q.k === next); if (r) hand(ctx, r.x + r.w * 0.7, r.y + r.h * 0.4, P.t, 34); }
      }
    },
    _test: { solve() { if (!P || !P.cur) return false; if (P.phase === 'scan') { P.belt.forEach(i => (i.done = true)); return true; } if (P.phase === 'total') { const O = P.cur.O; P.pad = (O.total / 100).toFixed(2); check(); return true; } if (P.phase === 'collect' || P.phase === 'change') { const s = solutionPieces(P.cur.O); if (P.phase === 'collect') { for (const k of s) P.cur.O.wallet.splice(P.cur.O.wallet.indexOf(k), 1); } P.given = s; check(); return true; } return false; }, get P() { return P; } },
  };
}

startGame({
  mascot: '🧾',
  stick: false,
  story: (d, e) => (e >= 4 ? 'Electronics store cashier: two-item orders, sales tax and big sales. Count up the change like a pro!' : e >= 2 ? 'Grocery store cashier: scan the food, then count up the change from your drawer.' : 'Toy shop cashier: scan the toys and take the right dollar bills from each customer.'),
  howTo: ['🔴 Tap each item when it rides onto the red scanner.', '💵 Take the money (or give change) by tapping bills and coins. Tap money in the tray to take it back.', '🤝 Press the big button when it’s right.', '⏳ Watch the patience bars — don’t keep customers waiting!'],
  together: { helps: [{ id: 'calm', icon: '😄', label: 'Tell a joke', cool: 25 }] },
  lessons: level => LESSONS[level] || [],
  realLife: realFrom(REAL['register-rush']),
  create: createGame,
});

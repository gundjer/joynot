// Penny's Coin Carnival: walk the carnival midway. Every ride has a gate with a price sign. Pay the EXACT coins
// (tap coins from your purse into the gate's slot), the gate swings open and you get to PLAY the ride:
// ring toss, duck pond, bumper cars, Ferris wheel, roller coaster, balloon darts, carousel brass ring, strongman bell.
// A new ride opens at every level. Levels (must match app/Games/CoinCarnival.php):
// 1 Know Your Coins · 2 Coin Values · 3 Pennies & Nickels · 4 Add Dimes · 5 Add Quarters · 6 Count the Pile · 7 Fewest Coins · 8 Bills and Coins
// I do: the lesson slides. We do: the first gate of every visit (Penny's hoof shows each coin, step by step).
// You do: the next gates. Two misses → Penny shows the next coin; three → she pays with you and you lose a heart.
import { startGame, rand, pick, shuffle, clamp, emoji, roundRect, realFrom, playBox, Sfx } from '../_play/play.js';
import { drawMoney, moneyText, cents } from '../_play/widgets.js';
import { MONEY, COIN_KINDS, fewest, countSteps, makeSteps } from '../_joy/js/money.js';
import { sayMoney } from '../_joy/js/util.js';
import { REAL } from '../_joy/js/reallife.js';
import { LESSONS } from './lessons.js';
import { text, panel, button, bubble, hand, popups, particles, teach, taskLevel, inBox, INK } from '../_play/kit.js';

// ---------------------------------------------------------------- the rides (a new one every level)
const RIDES = [
  { id: 'ring', name: 'Ring Toss', icon: '⭕', color: '#ff6b4a' },
  { id: 'duck', name: 'Duck Pond', icon: '🦆', color: '#3dc2ff' },
  { id: 'bump', name: 'Bumper Cars', icon: '🚗', color: '#8b6cff' },
  { id: 'wheel', name: 'Ferris Wheel', icon: '🎡', color: '#ffb000' },
  { id: 'coaster', name: 'Roller Coaster', icon: '🎢', color: '#e5484d' },
  { id: 'darts', name: 'Balloon Darts', icon: '🎈', color: '#ff6b9d' },
  { id: 'carousel', name: 'Carousel', icon: '🎠', color: '#3dd6a3' },
  { id: 'hammer', name: 'Strongman Bell', icon: '🔨', color: '#c47a3c' },
];
const rideFor = lv => RIDES[(lv - 1) % RIDES.length];

// ---------------------------------------------------------------- the coin task for each level
const KINDS = { 1: COIN_KINDS, 2: COIN_KINDS, 3: ['penny', 'nickel'], 4: ['penny', 'nickel', 'dime'], 5: COIN_KINDS, 6: COIN_KINDS, 7: COIN_KINDS, 8: ['five', 'one', 'quarter', 'dime', 'nickel', 'penny'] };
const amt = c => (c >= 100 ? '$' + (c / 100).toFixed(2) : c + '¢');
const LOOKS = { penny: 'copper-brown and small', nickel: 'silver, thick and smooth', dime: 'the SMALLEST silver coin', quarter: 'the BIGGEST silver coin' };
function makeTask(level) {
  const kinds = KINDS[level];
  if (level === 1) { const k = pick(COIN_KINDS); return { level, mode: 'name', kind: k, kinds: shuffle(COIN_KINDS), price: MONEY[k].cents, values: false, sign: `1 ${MONEY[k].name}`, say: `This ride costs one ${MONEY[k].name}. Find the ${MONEY[k].name} in your purse and put it in the slot.`, expected: MONEY[k].name }; }
  if (level === 2) { const k = pick(COIN_KINDS); return { level, mode: 'one', kind: k, kinds: shuffle(COIN_KINDS), price: MONEY[k].cents, values: false, sign: `${MONEY[k].cents}¢ · 1 coin`, say: `This ride costs ${MONEY[k].cents} cents. Pay with just ONE coin that is worth ${MONEY[k].cents} cents.`, expected: MONEY[k].name }; }
  if (level === 6) {
    let pile; do { pile = Array.from({ length: rand(3, 7) }, () => pick(COIN_KINDS)); } while (cents(pile) > 99);
    pile.sort((a, b) => MONEY[b].cents - MONEY[a].cents);
    const total = cents(pile);
    return { level, mode: 'pile', pile: shuffle(pile), price: total, kinds: COIN_KINDS, values: true, sign: '? ¢', say: 'Someone dropped a pile of coins at this gate! Count the pile, then type how much it is to open the gate.', expected: total + '¢' };
  }
  const min = { 3: 3, 4: 11, 5: 26, 7: 30, 8: 105 }[level], max = { 3: 20, 4: 50, 5: 99, 7: 99, 8: 495 }[level];
  let price = rand(min, max); if (level === 8) price = rand(1, 4) * 100 + rand(1, 19) * 5;
  const few = level === 7 ? fewest(price, COIN_KINDS) : null;
  return { level, mode: level === 7 ? 'fewest' : 'make', price, kinds, values: level <= 5, few: few ? Object.values(few).reduce((a, b) => a + b, 0) : 0, sign: amt(price),
    say: level === 7 ? `This ride costs ${sayMoney(price)}. Pay it with the FEWEST coins you can.` : `This ride costs ${sayMoney(price)}. Put exactly ${sayMoney(price)} in the slot.`,
    expected: amt(price) };
}
/** The coins Penny would use (biggest first). */
function solution(T) {
  if (T.mode === 'name' || T.mode === 'one') return [T.kind];
  if (T.mode === 'pile') return [];
  const map = fewest(T.price, T.kinds), out = [];
  for (const k of T.kinds.slice().sort((a, b) => MONEY[b].cents - MONEY[a].cents)) for (let i = 0; i < (map[k] || 0); i++) out.push(k);
  return out;
}
function coach(T) {
  if (T.mode === 'name') return `Help them find the ${MONEY[T.kind].name}: it's ${LOOKS[T.kind]}.`;
  if (T.mode === 'one') return `Which coin is worth ${T.price}¢? Let them think — don't name it.`;
  if (T.mode === 'pile') return 'Sort the pile biggest to smallest, then count on together.';
  return `Start with the biggest coin that fits, then count on to ${amt(T.price)}.`;
}

// ---------------------------------------------------------------- the ride mini-games (each ~15 seconds, all fun, no hearts)
function makeRide(id, api, P) {
  const R = { t: 0, score: 0, done: false, msg: '' };
  const W = () => api.W, H = () => api.H, top = () => Math.max(90, playBox(api.W, api.H).y);
  const win = n => { R.score += n; P.pops.add(`+${n} 🎟️`, api.W / 2, top() + 60, '#ff6b4a', 26); Sfx.coin ? Sfx.coin() : Sfx.correct(); P.fx.burst(api.W / 2, top() + 80, 10); };
  if (id === 'ring') {
    Object.assign(R, { goal: 'Tap to toss the ring onto a bottle!', tries: 3, ring: null, sw: 0, bottles: [0.3, 0.5, 0.7].map(x => ({ x, hit: false })) });
    R.tap = () => { if (R.ring || !R.tries) return; R.tries--; R.ring = { x: 0.5 + Math.sin(R.sw) * 0.32, y: 1, t: 0 }; Sfx.click(); };
    R.update = dt => { R.sw += dt * 2.2; if (R.ring) { R.ring.t += dt; R.ring.y = 1 - R.ring.t * 1.6; if (R.ring.y <= 0.38) { const b = R.bottles.find(b => !b.hit && Math.abs(b.x - R.ring.x) < 0.06); if (b) { b.hit = true; win(3); } else P.pops.add('miss', R.ring.x * W(), top() + 80, '#888'); R.ring = null; if (!R.tries) R.done = true; } } };
    R.draw = ctx => { const y0 = top(), h = H() - y0; ctx.fillStyle = '#8a5a2b'; ctx.fillRect(0, y0 + h * 0.4, W(), 14); for (const b of R.bottles) { emoji(ctx, b.hit ? '🏆' : '🍾', b.x * W(), y0 + h * 0.32, Math.min(70, h * 0.18)); } const rx = R.ring ? R.ring.x : 0.5 + Math.sin(R.sw) * 0.32, ry = R.ring ? R.ring.y : 0.92; ctx.strokeStyle = '#ffc93c'; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(rx * W(), y0 + ry * h, 30, 12, 0, 0, 7); ctx.stroke(); text(ctx, `⭕ × ${R.tries}`, 60, y0 + 30, { size: 22, color: '#fff' }); };
  } else if (id === 'duck') {
    Object.assign(R, { goal: 'Tap the ducks to find the prizes!', picks: 3, ducks: Array.from({ length: 8 }, (_, i) => ({ a: i / 8 * Math.PI * 2, prize: [5, 1, 2, 1, 3, 1, 2, 1][i], open: 0 })) });
    R.tap = (x, y) => { if (!R.picks) return; const c = R.c; for (const d of R.ducks) { const dx = c.x + Math.cos(d.a) * c.r, dy = c.y + Math.sin(d.a) * c.r * 0.45; if (!d.open && Math.hypot(x - dx, y - dy) < 40) { d.open = 1; R.picks--; win(d.prize); if (!R.picks) setTimeout(() => (R.done = true), 900); return; } } };
    R.update = dt => { for (const d of R.ducks) d.a += dt * 0.5; };
    R.draw = ctx => { const y0 = top(), h = H() - y0; R.c = { x: W() / 2, y: y0 + h * 0.5, r: Math.min(W() * 0.38, h * 0.7) }; ctx.fillStyle = '#3dc2ff'; ctx.beginPath(); ctx.ellipse(R.c.x, R.c.y, R.c.r + 30, R.c.r * 0.45 + 24, 0, 0, 7); ctx.fill(); for (const d of R.ducks) { const dx = R.c.x + Math.cos(d.a) * R.c.r, dy = R.c.y + Math.sin(d.a) * R.c.r * 0.45; emoji(ctx, '🦆', dx, dy, 52, { flip: Math.cos(d.a) < 0 }); if (d.open) text(ctx, `${d.prize}🎟️`, dx, dy - 40, { size: 18, color: '#fff' }); } text(ctx, `🦆 × ${R.picks}`, 60, y0 + 30, { size: 22, color: '#fff' }); };
  } else if (id === 'bump') {
    Object.assign(R, { goal: 'Drive into the other cars! Bump them all!', me: { x: 0.5, y: 0.6 }, cars: Array.from({ length: 5 }, () => ({ x: Math.random(), y: 0.2 + Math.random() * 0.6, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, hit: 0 })), left: 15 });
    R.tap = (x, y) => { R.tx = x / W(); R.ty = (y - top()) / (H() - top()); };
    R.move = R.tap;
    R.update = dt => { R.left -= dt; if (R.left <= 0) R.done = true; const ix = api.input.x, iy = api.input.y; if (ix || iy) { R.tx = null; R.me.x += ix * dt * 0.45; R.me.y += iy * dt * 0.45; } else if (R.tx != null) { R.me.x += clamp(R.tx - R.me.x, -dt * 0.5, dt * 0.5); R.me.y += clamp(R.ty - R.me.y, -dt * 0.5, dt * 0.5); } R.me.x = clamp(R.me.x, 0.05, 0.95); R.me.y = clamp(R.me.y, 0.08, 0.92); for (const c of R.cars) { c.x += c.vx * dt; c.y += c.vy * dt; if (c.x < 0.05 || c.x > 0.95) c.vx *= -1; if (c.y < 0.08 || c.y > 0.92) c.vy *= -1; c.hit = Math.max(0, c.hit - dt); if (!c.hit && Math.hypot((c.x - R.me.x) * W(), (c.y - R.me.y) * (H() - top())) < 56) { c.hit = 1.2; c.vx = (c.x - R.me.x) * 2; c.vy = (c.y - R.me.y) * 2; win(1); Sfx.wrong ? Sfx.click() : 0; } } if (R.score >= 8) R.done = true; };
    R.draw = ctx => { const y0 = top(), h = H() - y0; ctx.fillStyle = '#5a4a8a'; ctx.fillRect(10, y0, W() - 20, h - 10); for (const c of R.cars) emoji(ctx, c.hit ? '💥' : '🚙', c.x * W(), y0 + c.y * h, 54); emoji(ctx, '🚗', R.me.x * W(), y0 + R.me.y * h, 62); text(ctx, `⏱️ ${Math.ceil(R.left)}`, W() - 60, y0 + 30, { size: 22, color: '#fff' }); };
  } else if (id === 'wheel') {
    Object.assign(R, { goal: 'Tap STOP when your seat is at the very TOP!', a: 0, tries: 3, stopped: 0 });
    R.tap = () => { if (R.stopped > 0 || !R.tries) return; R.tries--; const top = Math.abs(Math.atan2(Math.sin(R.a + Math.PI / 2), Math.cos(R.a + Math.PI / 2))); const pts = top < 0.15 ? 5 : top < 0.4 ? 3 : top < 0.8 ? 1 : 0; if (pts) { win(pts); if (pts === 5) P.fx.burst(W() / 2, R.cy - R.r, 30); } else P.pops.add('so close!', W() / 2, R.cy - R.r, '#fff'); R.stopped = 1.2; };
    R.update = dt => { if (R.stopped > 0) { R.stopped -= dt; if (R.stopped <= 0 && !R.tries) R.done = true; } else R.a += dt * 1.6; };
    R.draw = ctx => { const y0 = top(), h = H() - y0; R.r = Math.min(W() * 0.3, h * 0.38); R.cy = y0 + h * 0.52; const cx = W() / 2; ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, R.cy, R.r, 0, 7); ctx.stroke(); emoji(ctx, '⭐', cx, R.cy - R.r - 30, 36); for (let i = 0; i < 8; i++) { const a = R.a + i / 8 * Math.PI * 2, x = cx + Math.cos(a) * R.r, y = R.cy + Math.sin(a) * R.r; ctx.strokeStyle = 'rgba(255,211,77,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, R.cy); ctx.lineTo(x, y); ctx.stroke(); ctx.fillStyle = i ? '#3dc2ff' : '#ff6b4a'; roundRect(ctx, x - 16, y - 4, 32, 24, 6); ctx.fill(); if (!i) emoji(ctx, api.kid.avatar || '🙂', x, y + 6, 20); } text(ctx, `🛑 × ${R.tries}`, 60, y0 + 30, { size: 22, color: '#fff' }); };
  } else if (id === 'coaster') {
    Object.assign(R, { goal: 'HOLD to go fast. Let go on the red curves!', x: 0, v: 0.12, tickets: Array.from({ length: 6 }, (_, i) => ({ x: 0.15 + i * 0.15, got: false })), wob: 0 });
    R.update = dt => { const hold = api.input.held('go') || R.hold; const curve = Math.sin(R.x * 14) > 0.7; R.v = clamp(R.v + (hold ? 0.25 : -0.18) * dt, 0.06, 0.34); if (curve && R.v > 0.24) { R.wob = 0.5; R.v = 0.08; P.pops.add('Whoa! Too fast!', W() / 2, top() + 40, '#fff'); } R.wob = Math.max(0, R.wob - dt); R.x += R.v * dt; for (const tk of R.tickets) if (!tk.got && Math.abs(tk.x - R.x) < 0.02) { tk.got = true; win(1); } if (R.x >= 1) R.done = true; };
    R.tap = () => { R.hold = true; }; R.up = () => { R.hold = false; };
    R.draw = ctx => { const y0 = top(), h = H() - y0, yy = x => y0 + h * 0.55 - Math.sin(x * 9) * h * 0.22; ctx.lineWidth = 8; for (let i = 0; i < 100; i++) { const a = i / 100, b = (i + 1) / 100; ctx.strokeStyle = Math.sin(a * 14) > 0.7 ? '#e5484d' : '#ffd34d'; ctx.beginPath(); ctx.moveTo(a * W(), yy(a)); ctx.lineTo(b * W(), yy(b)); ctx.stroke(); } for (const tk of R.tickets) if (!tk.got) emoji(ctx, '🎟️', tk.x * W(), yy(tk.x) - 40, 30); emoji(ctx, '🎢', R.x * W(), yy(R.x) - 18 + (R.wob ? Math.sin(R.t * 50) * 4 : 0), 44); text(ctx, `Speed ${'▮'.repeat(Math.round(R.v * 20))}`, 90, y0 + 30, { size: 18, color: '#fff' }); };
  } else if (id === 'darts') {
    Object.assign(R, { goal: 'Tap the balloons to pop them!', left: 15, balloons: [] });
    R.tap = (x, y) => { for (const b of R.balloons) if (!b.pop && Math.hypot(x - b.x * W(), y - b.y) < 36) { b.pop = 0.3; win(1); P.fx.burst(x, y, 8, [b.c]); return; } };
    R.update = dt => { R.left -= dt; if (R.left <= 0) R.done = true; if (Math.random() < dt * 2.2) R.balloons.push({ x: 0.08 + Math.random() * 0.84, y: api.H + 40, v: 60 + Math.random() * 60, c: pick(['#e5484d', '#3dc2ff', '#ffd34d', '#3dd6a3']) }); for (const b of R.balloons) { b.y -= b.v * dt; if (b.pop) b.pop -= dt; } R.balloons = R.balloons.filter(b => b.y > top() - 40 && !(b.pop < 0)); };
    R.draw = ctx => { for (const b of R.balloons) { if (b.pop) continue; ctx.fillStyle = b.c; ctx.beginPath(); ctx.ellipse(b.x * W(), b.y, 26, 32, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(b.x * W(), b.y + 32); ctx.lineTo(b.x * W(), b.y + 70); ctx.stroke(); } text(ctx, `⏱️ ${Math.ceil(R.left)}`, W() - 60, top() + 30, { size: 22, color: '#fff' }); };
  } else if (id === 'carousel') {
    Object.assign(R, { goal: 'Tap GRAB when your horse is right under the gold ring!', a: 0, tries: 4, flash: 0 });
    R.tap = () => { if (!R.tries || R.flash > 0) return; R.tries--; const d = Math.abs(Math.atan2(Math.sin(R.a), Math.cos(R.a))); if (d < 0.22) win(3); else P.pops.add('missed it!', W() / 2, top() + 60, '#fff'); R.flash = 0.6; if (!R.tries) setTimeout(() => (R.done = true), 700); };
    R.update = dt => { R.a += dt * 1.8; R.flash = Math.max(0, R.flash - dt); };
    R.draw = ctx => { const y0 = top(), h = H() - y0, cx = W() / 2, cy = y0 + h * 0.6, r = Math.min(W() * 0.35, h * 0.5); ctx.fillStyle = '#3dd6a3'; ctx.beginPath(); ctx.ellipse(cx, cy, r + 20, r * 0.35 + 14, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#ffc93c'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(cx + r, cy - 90, 16, 0, 7); ctx.stroke(); for (let i = 0; i < 6; i++) { const a = R.a + i / 6 * Math.PI * 2, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.35; emoji(ctx, '🐴', x, y - 20 + Math.sin(R.t * 4 + i) * 6, 44); if (!i) emoji(ctx, api.kid.avatar || '🙂', x, y - 52, 24); } text(ctx, `💍 × ${R.tries}`, 60, y0 + 30, { size: 22, color: '#fff' }); };
  } else {
    Object.assign(R, { goal: 'Tap SWING when the power bar is full!', p: 0, dir: 1, tries: 3, puck: 0, show: 0 });
    R.tap = () => { if (!R.tries || R.show > 0) return; R.tries--; R.puck = R.p; R.show = 1.4; const pts = R.p > 0.92 ? 5 : R.p > 0.7 ? 2 : R.p > 0.4 ? 1 : 0; if (pts) win(pts); if (pts === 5) Sfx.win(); };
    R.update = dt => { R.p += R.dir * dt * 1.4; if (R.p > 1) { R.p = 1; R.dir = -1; } if (R.p < 0) { R.p = 0; R.dir = 1; } if (R.show > 0) { R.show -= dt; if (R.show <= 0 && !R.tries) R.done = true; } };
    R.draw = ctx => { const y0 = top(), h = H() - y0, x = W() / 2, tower = h * 0.75; ctx.fillStyle = '#c47a3c'; ctx.fillRect(x - 12, y0 + h * 0.12, 24, tower); emoji(ctx, '🔔', x, y0 + h * 0.08, 44); const py = y0 + h * 0.12 + tower * (1 - (R.show > 0 ? R.puck * Math.min(1, (1.4 - R.show) * 3) : 0)); ctx.fillStyle = '#e5484d'; ctx.fillRect(x - 22, py - 10, 44, 20); ctx.fillStyle = '#2b2350'; ctx.fillRect(40, y0 + 20, 26, h * 0.7); ctx.fillStyle = R.p > 0.92 ? '#2fae66' : '#ffc93c'; ctx.fillRect(40, y0 + 20 + h * 0.7 * (1 - R.p), 26, h * 0.7 * R.p); text(ctx, `🔨 × ${R.tries}`, W() - 70, y0 + 30, { size: 22, color: '#fff' }); };
  }
  return R;
}
const RIDE_BTN = { ring: '⭕ Toss', duck: '', bump: '', wheel: '🛑 STOP', coaster: '⏩ Go', darts: '', carousel: '💍 GRAB', hammer: '🔨 SWING' };

// ---------------------------------------------------------------- the game
function createGame(api) {
  let P = null;
  const pops = popups(), fx = particles();
  const purseKinds = T => T.kinds.slice().sort((a, b) => MONEY[b].cents - MONEY[a].cents);

  function startStage(o) {
    const real = o.real, unlocked = RIDES.slice(0, Math.min(RIDES.length, real));
    const main = rideFor(real), other = unlocked.length > 1 ? pick(unlocked.filter(r => r !== main)) : main;
    P = { o, t: 0, pops, fx, phase: 'walk', walkX: 0.05, gate: 0, gates: [main, other, main].slice(0, o.boss ? 3 : 3).map((r, i) => ({ ride: r, x: 0.25 + i * 0.27, open: false })), tickets: 0, T: null, slot: [], pad: '', ride: null, guidedDone: false, check: { gate: 0 } };
    api.goal(`🎪 Welcome to the carnival! Today's new ride: <b>${main.icon} ${main.name}</b>!`);
    api.score('🎟️ 0');
    api.actions([]);
    api.progress(0, 'Rides');
  }
  function openGate() {
    const lv = taskLevel(api, P.o), T = makeTask(lv);
    const guided = !P.guidedDone && !P.o.boss;
    P.T = T; P.slot = []; P.pad = ''; P.phase = 'pay'; P.showSol = 0;
    P.teach = teach(api, { level: lv, guided, prompt: T.say, expected: T.expected });
    api.goal(`${P.gates[P.gate].ride.icon} <b>${T.sign}</b> — ${T.mode === 'pile' ? 'count the pile!' : T.mode === 'name' ? `find the ${MONEY[T.kind].name}!` : 'pay the exact amount!'}`, { speak: false });
    api.speak(guided ? `Let's do this one together. ${T.say}` : T.say);
    if (guided) P.showSol = 1; // "we do": Penny's hoof points at each coin in order
    api.actions([{ key: 'help', label: '💡 Help' }, { key: 'check', label: T.mode === 'pile' ? '✔ Check' : '🎟️ Pay', big: true }]);
  }
  function pay() {
    const T = P.T, given = T.mode === 'pile' ? Number(P.pad || -1) : cents(P.slot);
    let ok;
    if (T.mode === 'name' || T.mode === 'one') ok = P.slot.length === 1 && P.slot[0] === T.kind;
    else if (T.mode === 'pile') ok = given === T.price;
    else if (T.mode === 'fewest') ok = given === T.price && P.slot.length <= T.few;
    else ok = given === T.price;
    if (T.mode !== 'pile' && !P.slot.length) { api.speak('Tap coins in your purse to put them in the slot first!', { force: true }); return; }
    if (ok) { gateOpens(); return; }
    const n = P.teach.miss(); Sfx.wrong();
    let why;
    if (T.mode === 'name') why = `That's a ${MONEY[P.slot[0]].name}. The ${MONEY[T.kind].name} is ${LOOKS[T.kind]}.`;
    else if (T.mode === 'one') why = P.slot.length > 1 ? 'Just ONE coin! Which single coin is worth ' + T.price + ' cents?' : `A ${MONEY[P.slot[0]].name} is worth ${MONEY[P.slot[0]].cents} cents. We need ${T.price} cents.`;
    else if (T.mode === 'pile') why = `Let's count it together. ${countSteps(T.pile).join(' ')}`;
    else if (T.mode === 'fewest' && given === T.price) why = `That's the right amount, but you can do it with fewer coins! Try bigger coins. ${T.few} coins is the fewest.`;
    else why = given > T.price ? `You put in ${sayMoney(given)}. That's too much — take some out to make ${sayMoney(T.price)}.` : `You put in ${sayMoney(given)}. You need ${sayMoney(T.price - given)} more.`;
    if (n >= 3) {
      api.speak(`Good trying! Here's how: ${(T.mode === 'pile' ? countSteps(T.pile) : makeSteps(T.price, T.kinds, { fewestWords: T.mode === 'fewest' })).join(' ')}`, { force: true });
      P.teach.done(false, T.mode === 'pile' ? given + '¢' : amt(given));
      const out = api.loseHeart('The gate keeper helped you pay.');
      if (!out) { P.slot = solution(T); P.pad = String(T.price); setTimeout(() => P && P.phase === 'pay' && gateOpens(true), 1600); }
      return;
    }
    if (n === 2) { P.showSol = 1; P.teach.help(); why += ' Watch my hoof — follow it!'; }
    api.speak(why, { force: true });
  }
  function gateOpens(already) {
    const T = P.T;
    if (!already) { const r = P.teach.done(true, T.mode === 'pile' ? P.pad + '¢' : amt(cents(P.slot))); if (r.levelUp) api.chime('⭐ <b>Level up!</b> A brand-new ride opens next time!', '🐷'); }
    if (!P.guidedDone) P.guidedDone = true;
    Sfx.correct(); fx.burst(api.W / 2, api.H * 0.4, 24);
    const g = P.gates[P.gate]; g.open = true;
    P.phase = 'ride'; P.ride = makeRide(g.ride.id, api, P);
    const lbl = RIDE_BTN[g.ride.id];
    api.actions(lbl ? [{ key: g.ride.id === 'coaster' ? 'go' : 'action', label: lbl, big: true }] : []);
    api.goal(`${g.ride.icon} <b>${g.ride.name}!</b> ${P.ride.goal}`);
  }
  function rideOver() {
    P.tickets += P.ride.score; api.state.extra.tickets = (api.state.extra.tickets || 0) + P.ride.score;
    api.score(`🎟️ ${P.tickets}`);
    api.speak(`You won ${P.ride.score} tickets!`);
    P.ride = null; P.gate++; P.check.gate = P.gate;
    api.progress(P.gate / P.gates.length, 'Rides');
    if (P.gate >= P.gates.length) { P.phase = 'done'; api.finish({ win: true, title: '🎪 What a carnival day!', text: `You paid for ${P.gates.length} rides and won ${P.tickets} tickets.` }); return; }
    P.phase = 'walk'; api.actions([]);
    api.goal(`Walk to the next ride: <b>${P.gates[P.gate].ride.icon} ${P.gates[P.gate].ride.name}</b>!`, { speak: true });
  }

  // ------------------------------------------------ layout helpers
  function payLayout() {
    const b = playBox(api.W, api.H), short = api.H <= 500;
    const signH = short ? 64 : 96, purseH = short ? 82 : 110;
    return { sign: { x: b.x + b.w * 0.18, y: b.y + 4, w: b.w * 0.64, h: signH }, slot: { x: b.x + 10, y: b.y + signH + 12, w: b.w - 20, h: Math.max(80, b.h - signH - purseH - 26) }, purse: { x: b.x + 4, y: b.y + b.h - purseH, w: b.w - 8, h: purseH } };
  }
  function purseRects() {
    const L = payLayout(), ks = purseKinds(P.T), gw = L.purse.w / ks.length;
    return ks.map((k, i) => ({ k, x: L.purse.x + i * gw + 3, y: L.purse.y, w: gw - 6, h: L.purse.h }));
  }
  function slotSpots() {
    const L = payLayout(), r = Math.min(30, L.slot.h / 4), per = Math.max(1, Math.floor((L.slot.w - 20) / (r * 2.6)));
    const sorted = P.slot.map((k, i) => [k, i]).sort((a, c) => MONEY[c[0]].cents - MONEY[a[0]].cents);
    return sorted.map(([k, i], j) => ({ k, i, x: L.slot.x + 14 + r * 1.3 + (j % per) * r * 2.6, y: L.slot.y + r * 1.4 + Math.floor(j / per) * r * 2.4, r }));
  }
  const padKeys = () => { const L = payLayout(), s = L.slot, kw = Math.min(70, (s.w - 60) / 6), kh = Math.min(56, (s.h - 70) / 2); const keys = ['1', '2', '3', '4', '5', '⌫', '6', '7', '8', '9', '0', '¢']; return keys.map((t, i) => ({ t, x: s.x + (s.w - (kw + 8) * 6) / 2 + (i % 6) * (kw + 8), y: s.y + s.h - (kh + 8) * 2 + Math.floor(i / 6) * (kh + 8), w: kw, h: kh })); };

  return {
    start(o) { startStage(o); },
    checkpoint() { if (!P) return; P.gate = P.check.gate; P.phase = 'walk'; P.ride = null; api.actions([]); },
    stop() { P = null; },
    update(dt) {
      if (!P) return; P.t += dt; pops.update(dt); fx.update(dt);
      if (P.phase === 'walk') {
        const tx = P.gates[P.gate].x - 0.08; P.walkX = Math.min(tx, P.walkX + dt * 0.18);
        if (P.walkX >= tx - 0.001) openGate();
      } else if (P.phase === 'pay') {
        if (api.input.pressed('check')) pay();
        if (api.input.pressed('help')) this.hint();
        for (let d = 0; d <= 9; d++) if (api.input.pressed('n' + d) && P.T.mode === 'pile' && P.pad.length < 3) P.pad += d;
        if (api.input.pressed('back') && P.T.mode === 'pile') P.pad = P.pad.slice(0, -1);
      } else if (P.phase === 'ride' && P.ride) {
        P.ride.t += dt;
        if (api.input.pressed('action') || api.input.pressed('go')) P.ride.tap && P.ride.tap(api.W / 2, api.H / 2);
        P.ride.update(dt);
        if (P.ride.done) rideOver();
      }
    },
    hint() {
      if (!P || P.phase !== 'pay') return false;
      P.teach.help(); P.showSol = 1;
      const T = P.T;
      api.speak(T.mode === 'pile' ? `Sort the coins, biggest first, and count on. ${countSteps(T.pile)[0] || ''}` : T.mode === 'name' ? `The ${MONEY[T.kind].name} is ${LOOKS[T.kind]}. Follow my hoof!` : `${makeSteps(T.price, T.kinds, { fewestWords: T.mode === 'fewest' })[0] || ''} Follow my hoof!`, { force: true });
      return true;
    },
    coach() { return P && P.phase === 'pay' ? coach(P.T) : P && P.phase === 'ride' ? 'Ride time! Cheer them on.' : ''; },
    onHelp(id) { if (!P) return ''; if (id === 'tickets') { P.tickets += 2; api.score(`🎟️ ${P.tickets}`); return 'gave you 2 bonus tickets!'; } return ''; },
    onTap(x, y) {
      if (!P) return;
      if (P.phase === 'ride') { P.ride && P.ride.tap && P.ride.tap(x, y); return; }
      if (P.phase !== 'pay') return;
      const T = P.T;
      if (T.mode === 'pile') { const k = padKeys().find(q => inBox(x, y, q)); if (k) { if (k.t === '⌫') P.pad = P.pad.slice(0, -1); else if (/\d/.test(k.t) && P.pad.length < 3) P.pad += k.t; Sfx.click(); } return; }
      const s = slotSpots().find(q => Math.hypot(q.x - x, q.y - y) < q.r + 6);
      if (s) { P.slot.splice(s.i, 1); Sfx.click(); return; }
      const pr = purseRects().find(q => inBox(x, y, q));
      if (pr && P.slot.length < 16) { P.slot.push(pr.k); Sfx.coin ? Sfx.coin() : Sfx.click(); if (T.values || T.level >= 3) api.speak(`${MONEY[pr.k].name}. ${amt(cents(P.slot))}.`); }
    },
    onMove(x, y) { if (P && P.ride && P.ride.move) P.ride.move(x, y); },
    onUp() { if (P && P.ride && P.ride.up) P.ride.up(); },
    draw(ctx, W, H, onTitle) {
      // carnival sky + tents
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3a2d7a'); g.addColorStop(1, '#ff9d6b'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 9; i++) { const x = (i + 0.5) * W / 9; ctx.fillStyle = i % 2 ? '#ff6b4a' : '#fff'; ctx.beginPath(); ctx.moveTo(x - W / 18, H * 0.7); ctx.lineTo(x, H * 0.5); ctx.lineTo(x + W / 18, H * 0.7); ctx.fill(); }
      ctx.fillStyle = '#7a5a3a'; ctx.fillRect(0, H * 0.7, W, H * 0.3);
      for (let i = 0; i < 20; i++) { ctx.fillStyle = ['#ffd34d', '#3dc2ff', '#ff6b9d'][i % 3]; ctx.beginPath(); ctx.arc((i + 0.5) * W / 20, H * 0.12 + Math.sin(i) * 8, 4, 0, 7); ctx.fill(); }
      if (onTitle || !P) { emoji(ctx, '🎡', W * 0.25, H * 0.45, Math.min(160, H * 0.3)); emoji(ctx, '🎠', W * 0.75, H * 0.5, Math.min(130, H * 0.25)); return; }
      if (P.phase === 'walk' || P.phase === 'done') {
        for (const [i, gt] of P.gates.entries()) { const x = gt.x * W, y = H * 0.62; panel(ctx, { x: x - 54, y: y - 110, w: 108, h: 120 }, { fill: gt.ride.color, r: 14 }); emoji(ctx, gt.ride.icon, x, y - 60, 54); text(ctx, gt.open ? '✔' : gt.ride.name, x, y - 12, { size: 13, color: '#fff', max: 100 }); if (i === P.gate) hand(ctx, x, y + 6, P.t, 34); }
        emoji(ctx, api.kid.avatar || '🙂', P.walkX * W, H * 0.66 + Math.sin(P.t * 10) * 3, 48);
        emoji(ctx, '🐷', P.walkX * W - 50, H * 0.68, 36);
      }
      if (P.phase === 'pay') this.drawPay(ctx, W, H);
      if (P.phase === 'ride' && P.ride) { ctx.fillStyle = 'rgba(20,10,40,.55)'; ctx.fillRect(0, 0, W, H); P.ride.draw(ctx); }
      fx.draw(ctx); pops.draw(ctx);
    },
    drawPay(ctx, W, H) {
      const T = P.T, L = payLayout(), ride = P.gates[P.gate].ride;
      ctx.fillStyle = 'rgba(20,10,40,.35)'; ctx.fillRect(0, 0, W, H);
      panel(ctx, L.sign, { fill: ride.color, r: 16 });
      emoji(ctx, ride.icon, L.sign.x + L.sign.h * 0.55, L.sign.y + L.sign.h / 2, L.sign.h * 0.6);
      text(ctx, T.sign, L.sign.x + L.sign.w / 2 + L.sign.h * 0.3, L.sign.y + L.sign.h / 2, { size: Math.min(40, L.sign.h * 0.45), color: '#fff' });
      panel(ctx, L.slot, { fill: '#f3efe2', stroke: '#d8cfb4' });
      if (T.mode === 'pile') {
        const r = Math.min(38, L.slot.h / 6, L.slot.w / 14), cx = L.slot.x + L.slot.w * 0.3, cy = L.slot.y + Math.min(L.slot.h * 0.32, r * 3.2);
        if (!T.spots) T.spots = T.pile.map((k, i) => { const a = i * 2.4, d = (i ? 1 : 0) * (0.9 + (i % 3) * 0.55); return [Math.cos(a) * d, Math.sin(a) * d * 0.8]; });
        T.pile.forEach((k, i) => drawMoney(ctx, k, cx + T.spots[i][0] * r * 1.6, cy + T.spots[i][1] * r * 1.6, r, { value: true }));
        text(ctx, `= ${P.pad || '?'}¢`, L.slot.x + L.slot.w * 0.75, cy, { size: 34 });
        for (const k of padKeys()) { if (k.t === '¢') continue; panel(ctx, k, { fill: '#fff', r: 12, shadow: false, stroke: '#e2deef' }); text(ctx, k.t, k.x + k.w / 2, k.y + k.h / 2, { size: 24 }); }
      } else {
        if (!P.slot.length) text(ctx, '👇 Tap coins in your purse to put them here', L.slot.x + L.slot.w / 2, L.slot.y + L.slot.h / 2, { size: 16, color: '#8a7f63', max: L.slot.w - 20 });
        for (const s of slotSpots()) drawMoney(ctx, s.k, s.x, s.y, MONEY[s.k].kind === 'bill' ? s.r * 0.85 : s.r, { value: T.values || MONEY[s.k].kind === 'bill' });
        if (T.level >= 3) text(ctx, `In the slot: ${amt(cents(P.slot))}`, L.slot.x + L.slot.w - 12, L.slot.y + L.slot.h - 18, { size: 16, align: 'right', color: '#6b6380' });
        // the purse
        for (const r of purseRects()) { panel(ctx, r, { fill: '#fff', r: 14, shadow: false }); drawMoney(ctx, r.k, r.x + r.w / 2, r.y + r.h * 0.42, Math.min(r.h * 0.3, r.w * 0.32) * (MONEY[r.k].kind === 'bill' ? 0.85 : 1), { value: T.values || MONEY[r.k].kind === 'bill' }); if (T.level >= 3) text(ctx, MONEY[r.k].kind === 'bill' ? `$${MONEY[r.k].label} bill` : MONEY[r.k].name, r.x + r.w / 2, r.y + r.h - 12, { size: 11, color: '#6b6380' }); }
        // Penny's hoof shows the next coin (we do / help)
        if (P.showSol) { const need = solution(T), have = P.slot.slice(); const next = need.find(k => { const i = have.indexOf(k); if (i >= 0) { have.splice(i, 1); return false; } return true; }); const wrong = have.length > 0; if (wrong) { const s = slotSpots().find(q => have.includes(q.k)); if (s) { emoji(ctx, '🐷', s.x, s.y - 40, 30); } } else if (next) { const r = purseRects().find(q => q.k === next); if (r) hand(ctx, r.x + r.w * 0.72, r.y + r.h * 0.45, P.t, 38); } else { const btn = document.querySelector('#pg-actions .pg-act.big'); if (btn) { const bb = btn.getBoundingClientRect(); hand(ctx, bb.left + bb.width / 2, bb.top - 50, P.t, 38); } } }
      }
    },
    screen() { return P && P.phase === 'pay' ? `Gate price: ${P.T.sign}. In the slot: ${P.T.mode === 'pile' ? (P.pad || '?') + '¢' : amt(cents(P.slot))}` : P && P.ride ? `Playing ${P.gates[P.gate].ride.name}` : ''; },
    _test: { solve() { if (!P || P.phase !== 'pay') return false; const T = P.T; if (T.mode === 'pile') P.pad = String(T.price); else P.slot = solution(T); pay(); return true; }, finishRide() { if (P && P.ride) P.ride.done = true; }, get P() { return P; } },
  };
}

startGame({
  mascot: '🐷',
  stick: false,
  story: (d, e) => `Penny the pig runs the carnival! Pay the exact coins at each ride's gate, then play the ride. ${e >= 2 ? 'Big kids: count piles, use the fewest coins, and mix bills with coins.' : 'A new ride opens every level!'}`,
  howTo: ['🚶 You walk to each ride by yourself.', '👛 Tap coins in your purse to drop them in the slot. Tap a coin in the slot to take it back.', '🎟️ Press Pay. The exact amount opens the gate!', '🎢 Then play the ride and win tickets.'],
  together: { helps: [{ id: 'tickets', icon: '🎟️', label: 'Bonus tickets', cool: 30 }] },
  lessons: level => LESSONS[level] || [],
  realLife: realFrom(REAL['coin-carnival']),
  create: createGame,
});

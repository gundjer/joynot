// Signal Squad: you run the network! Flip the track switches so every packet zooms to the right place,
// send viruses and scams to the firewall, flip bit switches to dial binary addresses, place Wi-Fi routers,
// cell towers and satellites so the signal can hop home, rebuild messages from mixed-up packets,
// look up addresses in the DNS phone book, and decode a camera's pixels.
// Levels (must match app/Games/SignalSquad.php):
// 1 What Is a Computer? · 2 Parts of a Phone · 3 Input & Output · 4 Staying Safe Online · 5 Bits & Binary
// 6 Wi-Fi & Cell Towers · 7 Packets · 8 How a Message Travels · 9 Addresses & the Cloud · 10 Phone Science
import { startGame, rand, pick, shuffle, clamp, emoji, roundRect, realFrom, playBox, Sfx } from '../_play/play.js';
import { REAL } from '../_joy/js/reallife.js';
import { COMPUTERS, PHONE_PARTS, IO, TRAVEL, LESSONS, PACKET_WORDS } from './data.js';
import { text, panel, button, hand, popups, particles, teach, taskLevel, inBox } from '../_play/kit.js';

const PART_ICON = { screen: '📱', camera: '📷', microphone: '🎤', speaker: '🔊', battery: '🔋', antenna: '📶', 'chip (processor)': '🧠' };
const MSGS = [['💬', 'Grandma: “Happy birthday!”', 1], ['📚', 'Teacher: “Homework is on page 12.”', 1], ['🎮', 'Your friend: “Want to play after school?”', 1], ['⚽', 'Coach: “Practice is at 4.”', 1], ['🐶', 'Mom: “Don’t forget to feed the dog!”', 1],
  ['🎁', 'FREE PRIZE! Click and type your password!', 0], ['💎', 'FREE GEMS! Tell us your home address!', 0], ['🕵️', 'Stranger: “Let’s meet. Keep it a secret.”', 0], ['😠', 'A mean comment about a classmate', 0], ['🦠', 'VIRUS: download this file now!', 0]];
const SITES = [['joynot.com', '🎮'], ['mathfun.org', '🧮'], ['zoo.net', '🦁'], ['weather.io', '🌦️'], ['maps.app', '🗺️'], ['books.lib', '📚']];
const SPRITES = [['heart', ['01010', '11111', '11111', '01110', '00100']], ['smile', ['01010', '01010', '00000', '10001', '01110']], ['arrow', ['00100', '01110', '11111', '00100', '00100']], ['house', ['00100', '01110', '11111', '01010', '01110']], ['cross', ['10001', '01010', '00100', '01010', '10001']], ['letter T', ['11111', '00100', '00100', '00100', '00100']], ['box', ['11111', '10001', '10001', '10001', '11111']], ['tree', ['00100', '01110', '11111', '00100', '00100']]];

function makeTask(lv, P) {
  const ed = P.o.edition, T = { lv };
  if ([1, 2, 3, 4, 9].includes(lv)) {
    T.mode = 'route';
    if (lv === 1) { T.outs = [['🌐', 'Computer network', 1], ['🗑️', 'Not a computer', 0]]; T.queue = shuffle(COMPUTERS).slice(0, 4).map(c => ({ e: c[0], n: c[1], to: c[2] ? 0 : 1 })); T.ask = 'Flip the switch so each thing goes the right way: computers into the network, everything else to the bin. Then press Send!'; T.why = p => (p.to === 0 ? `A ${p.n} follows instructions to work with information, so it IS a computer.` : `A ${p.n} can’t follow instructions or change information. It’s not a computer.`); }
    if (lv === 2) { const parts = shuffle(PHONE_PARTS).slice(0, ed <= 1 ? 3 : 4); T.outs = parts.map(p => [PART_ICON[p[0]] || '📱', p[0], p[0]]); T.queue = shuffle(parts.map((p, i) => ({ e: '📨', n: `Who ${p[1]}?`, to: i }))); T.ask = 'Each packet is a job inside a phone. Flip the switches to send it to the part that does that job!'; T.why = p => `The ${T.outs[p.to][1]} ${parts[p.to][1]}.`; }
    if (lv === 3) { T.outs = [['⬅️', 'INPUT (into the computer)', 'input'], ['➡️', 'OUTPUT (out of the computer)', 'output']]; T.queue = shuffle(IO).slice(0, 4).map(c => ({ e: c[0], n: c[1], to: c[2] === 'input' ? 0 : 1 })); T.ask = 'Route each device: INPUT puts information INTO the computer. OUTPUT shows or plays it OUT.'; T.why = p => (p.to === 0 ? `A ${p.n} puts information IN, so it’s input.` : `A ${p.n} gives information OUT to you, so it’s output.`); }
    if (lv === 4) { const ok = shuffle(MSGS.filter(m => m[2])), bad = shuffle(MSGS.filter(m => !m[2])), k = rand(2, 3); T.outs = [['📥', 'Inbox (safe)', 1], ['🛡️', 'Block & tell a grown-up', 0]]; T.queue = shuffle([...ok.slice(0, k), ...bad.slice(0, 5 - k)]).map(m => ({ e: m[0], n: m[1], to: m[2] ? 0 : 1 })); T.ask = 'You’re the firewall! Safe messages go to the inbox. Scams, viruses, strangers and mean messages get BLOCKED.'; T.why = p => (p.to === 0 ? 'That message is from someone you know and it’s safe.' : 'Never share private info, never click scary prizes, and always tell a grown-up!'); }
    if (lv === 9) { const sites = shuffle(SITES).slice(0, ed <= 3 ? 3 : 4); T.dns = sites.map((s, i) => ({ name: s[0], e: s[1], ip: `${rand(10, 99)}.${rand(1, 9)}.${rand(10, 99)}.${rand(1, 99)}` })); const ord = shuffle(T.dns.map((_, i) => i)); T.outs = ord.map(i => ['🗄️', `server ${T.dns[i].ip}`, i]); T.queue = shuffle(T.dns).slice(0, 3).map(d => ({ e: d.e, n: d.name, to: T.outs.findIndex(o => o[2] === T.dns.indexOf(d)) })); T.ask = 'Packets only know the website NAME. Look it up in the DNS phone book, then route each packet to the server with that IP address.'; T.why = p => { const d = T.dns[T.outs[p.to][2]]; return `The DNS book says ${d.name} lives at ${d.ip}.`; }; }
    T.sw = T.outs.length === 2 ? [0] : [0, 0, 0]; T.done = []; T.cur = 0;
  }
  if (lv === 5) { const max = ed <= 2 ? 7 : 15, nums = shuffle(Array.from({ length: max }, (_, i) => i + 1)).slice(0, 6).sort((a, b) => a - b); T.mode = 'bits'; T.bitsN = max > 7 ? 4 : 3; T.devs = nums.map(n => ({ n, e: pick(['💻', '📱', '🖥️', '⌚', '🎮', '📺']) })); T.queue = shuffle(T.devs).slice(0, 3).map(d => ({ to: d.n })); T.bits = Array(T.bitsN).fill(0); T.cur = 0; T.done = []; T.ask = 'Each packet has an address number. Flip the bit switches to make that number in binary, then Send!'; }
  if (lv === 6) {
    const kind = ed <= 2 ? pick(['wifi', 'towers']) : pick(['wifi', 'towers', 'sat']); T.mode = 'radio'; T.kind = kind;
    if (kind === 'wifi') { T.devs = Array.from({ length: 3 }, () => ({ x: rand(15, 85) / 100, y: rand(25, 80) / 100 })); T.R = 0.33; T.items = [{ k: 'router', e: '📶', x: null, y: null }]; T.ask = 'Put the Wi-Fi router where its signal reaches ALL the devices in the house.'; }
    else { const water = kind === 'sat'; T.phone = { x: 0.06, y: rand(30, 70) / 100 }; T.hub = { x: 0.94, y: rand(30, 70) / 100 }; T.R = 0.3; T.water = water ? { x0: 0.3, x1: 0.7 } : null; T.items = water ? [{ k: 'tower', e: '📡', x: null, y: null }, { k: 'sat', e: '🛰️', x: null, y: null }] : Array.from({ length: 3 }, () => ({ k: 'tower', e: '📡', x: null, y: null })); T.ask = water ? 'The farm is across the ocean! Towers can’t stand in water. Use towers and the satellite to get the signal to the city.' : 'The farm phone is far from the city. Place cell towers so the signal can hop, tower to tower, all the way to the city!'; }
  }
  if (lv === 7) { const w = pick(PACKET_WORDS.filter(x => x.length <= (ed <= 3 ? 5 : 6))); T.mode = 'packets'; T.word = w; T.bin = ed >= 4; T.pk = shuffle(w.split('').map((ch, i) => ({ ch, i }))); T.slots = w.split('').map(() => null); T.lost = ed >= 3 ? rand(0, w.length - 1) : -1; T.ask = `Your message was chopped into packets and they arrived all mixed up!${T.lost >= 0 ? ' One got lost: tap its empty spot to ask for it again.' : ''} Drag each packet to its number.`; }
  if (lv === 8) { T.mode = 'travel'; T.steps = TRAVEL.map((s, i) => ({ i, e: s.split(' ')[0], n: s.slice(s.indexOf(' ') + 1) })); T.tray = shuffle(T.steps); T.slots = T.steps.map(() => null); T.ask = 'Build the path of a text message! Drag each step into order, from your phone to your friend’s phone.'; }
  if (lv === 10) {
    if (Math.random() < 0.55) { const [nm, rows] = pick(SPRITES); T.mode = 'pixels'; T.nm = nm; T.rows = rows; T.dec = ed >= 4; T.grid = rows.map(r => r.split('').map(() => 0)); T.ask = T.dec ? 'A camera stores each row of pixels as a number. Turn on the pixels so each row adds up to its number (columns are worth 16, 8, 4, 2, 1).' : 'A camera stores pixels as 1s (on) and 0s (off). Tap the pixels to match the code and see the picture!'; }
    else { const photo = pick([2, 3, 4, 5]), n = rand(4, 12); T.mode = 'storage'; T.photo = photo; T.space = photo * n; T.n = n; T.count = 0; T.ask = `Each photo uses ${photo} MB. Your phone has ${T.space} MB free. Add photos until the storage is exactly full!`; }
  }
  return T;
}

function createGame(api) {
  let P = null;
  const pops = popups(), fx = particles();

  function start(o) {
    P = { o, t: 0, n: o.boss ? 5 : o.edition <= 1 ? 3 : 4, done: 0, guidedDone: !!o.boss, phase: 'wait' };
    api.score('📶 0'); api.progress(0, 'Jobs');
    api.goal('📡 Signal Squad: you run the network today!', { speak: true });
    setTimeout(() => P && nextTask(), 1100);
  }
  function nextTask() {
    if (P.done >= P.n) { P.phase = 'over'; api.finish({ win: true, title: '📡 Network running perfectly!', text: `You finished ${P.done} network jobs.` }); return; }
    const lv = taskLevel(api, P.o), T = makeTask(lv, P), guided = !P.guidedDone;
    P.T = T; P.phase = 'work'; P.anim = null; P.showSol = guided ? 1 : 0; P.drag = null;
    P.teach = teach(api, { level: lv, guided, prompt: T.ask, expected: T.mode });
    const go = { route: '📤 Send', bits: '📤 Send', radio: '📶 Test signal', packets: '✅ Check', travel: '📤 Send text', pixels: '📸 Show photo', storage: '💾 Save' }[T.mode];
    api.actions([{ key: 'help', label: '💡 Help' }, { key: 'check', label: go, big: true }]);
    api.goal(`📡 ${T.ask}`, { speak: false }); api.speak((guided ? "Let's do this one together. " : '') + T.ask.replace(/[“”]/g, ''));
  }
  const cur = () => P.T.queue && P.T.queue[P.T.cur];

  // ------------------------------------------------ routing board geometry
  function work() {
    const b = playBox(api.W, api.H), short = api.H <= 500, T = P.T, tray = ['packets', 'travel', 'radio'].includes(T.mode);
    if (!tray) return { area: { x: b.x + 8, y: b.y + 8, w: b.w - 16, h: b.h - 16 }, tray: null, short };
    if (short) return { area: { x: b.x + 8, y: b.y + 8, w: b.w * 0.74 - 12, h: b.h - 16 }, tray: { x: b.x + b.w * 0.74, y: b.y + 8, w: b.w * 0.26 - 8, h: b.h - 16 }, short };
    const th = Math.min(110, b.h * 0.18); return { area: { x: b.x + 8, y: b.y + 8, w: b.w - 16, h: b.h - th - 24 }, tray: { x: b.x + 8, y: b.y + b.h - th - 8, w: b.w - 16, h: th }, short };
  }
  function net() {
    const A0 = work().area, T = P.T, n = T.outs ? T.outs.length : 2, strip = T.dns && A0.w < 600, dnsW = T.dns && !strip ? Math.min(200, A0.w * 0.3) : 0, dnsH = strip ? A0.h * 0.22 : 0, A = { x: A0.x, y: A0.y + dnsH, w: A0.w, h: A0.h - dnsH }, X = A.x + dnsW, W = A.w - dnsW;
    const src = { x: X + Math.max(36, W * 0.08), y: A.y + A.h * 0.5 }, outsY = n === 2 ? [0.25, 0.75] : n === 3 ? [0.18, 0.55, 0.85] : [0.13, 0.38, 0.62, 0.87];
    const ox = X + W * (W < 600 ? 0.6 : 0.7), outs = outsY.map((f, i) => ({ i, x: ox, y: A.y + A.h * f }));
    const k = (ox - X) / W, J = n === 2 ? [{ x: X + W * k * 0.5, y: src.y }] : n === 3 ? [{ x: X + W * k * 0.42, y: src.y }, null, { x: X + W * k * 0.72, y: A.y + A.h * 0.7 }] : [{ x: X + W * k * 0.36, y: src.y }, { x: X + W * k * 0.72, y: A.y + A.h * 0.255 }, { x: X + W * k * 0.72, y: A.y + A.h * 0.745 }];
    J[0].x = Math.max(J[0].x, src.x + 72); if (J[2] && n === 3) J[2].x = Math.max(J[2].x, J[0].x + 60); if (n === 4) { J[1].x = J[2].x = Math.max(J[1].x, J[0].x + 60); }
    return { A, src, outs, J, n, strip, dns: T.dns ? (strip ? { x: A0.x, y: A0.y, w: A0.w, h: dnsH - 8 } : { x: A.x, y: A.y, w: dnsW - 10, h: A.h }) : null };
  }
  /** Points the packet follows with the current switches, and where it ends up. */
  function routeOf() {
    const N = net(), T = P.T, s = T.sw, pts = [N.src];
    if (N.n === 2) { const j = N.J[0]; pts.push(j); const o = N.outs[s[0]]; pts.push(o); return { pts, out: s[0] }; }
    if (N.n === 3) { const j = N.J[0]; pts.push(j); if (s[0] === 0) { pts.push(N.outs[0]); return { pts, out: 0 }; } const j2 = N.J[2]; pts.push({ x: j.x, y: j2.y }, j2); const o = N.outs[1 + s[2]]; pts.push(o); return { pts, out: 1 + s[2] }; }
    const j0 = N.J[0]; pts.push(j0); const j = N.J[1 + s[0]]; pts.push({ x: j0.x, y: j.y }, j); const out = (s[0] ? 2 : 0) + s[1 + s[0]]; pts.push(N.outs[out]); return { pts, out };
  }
  function wantSw(to) { const n = net().n; if (n === 2) return { 0: to }; if (n === 3) return to === 0 ? { 0: 0 } : { 0: 1, 2: to - 1 }; return to < 2 ? { 0: 0, 1: to } : { 0: 1, 2: to - 2 }; }
  const swRects = () => { const N = net(), s = Math.min(54, N.A.h * 0.16); return N.J.map((j, i) => (j ? { i, x: j.x - s / 2, y: j.y - s / 2, w: s, h: s } : null)).filter(Boolean); };
  function bitUI() { const A = work().area, T = P.T, nar = A.w < 600, s = Math.min(70, (nar ? A.w : A.w * 0.66) / (T.bitsN + 2), A.h * (nar ? 0.14 : 0.22)); return T.bits.map((b, i) => ({ i, v: 2 ** (T.bitsN - 1 - i), x: A.x + (nar ? 20 : A.w * 0.06) + i * (s + 12), y: A.y + A.h * (nar ? 0.32 : 0.5), w: s, h: s * 1.2 })); }
  function devRects() { const A = work().area, T = P.T, n = T.devs.length; if (A.w < 600) { const cw = (A.w - 20) / 2, h = Math.min(54, (A.h * 0.36) / 3 - 6); return T.devs.map((d, i) => ({ d, x: A.x + 10 + (i % 2) * cw, y: A.y + A.h * 0.6 + Math.floor(i / 2) * (h + 6), w: cw - 6, h })); } const h = Math.min(54, (A.h - 20) / n - 6); return T.devs.map((d, i) => ({ d, x: A.x + A.w * 0.72, y: A.y + 10 + i * (h + 6), w: A.w * 0.26, h })); }
  function trayItems() {
    const W = work(), T = P.T, R = W.tray; if (!R) return [];
    const list = T.mode === 'packets' ? T.pk.filter(p => !T.slots.includes(p) && !(p.i === T.lost && !T.got)) : T.mode === 'travel' ? T.tray.filter(s => !T.slots.includes(s)) : T.mode === 'radio' ? T.items.filter(it => it.x === null) : [];
    const n = Math.max(list.length, T.mode === 'travel' ? 5 : 3);
    if (W.short) { const cols = n > 4 && T.mode !== 'travel' ? 2 : 1, rows = Math.ceil(n / cols), cw = (R.w - 8) / cols, rh = (R.h - 8) / rows; return list.map((k, i) => ({ k, x: R.x + 4 + (i % cols) * cw, y: R.y + 4 + Math.floor(i / cols) * rh, w: cw - 4, h: rh - 4 })); }
    return list.map((k, i) => ({ k, x: R.x + 4 + i * ((R.w - 8) / n), y: R.y + 4, w: (R.w - 8) / n - 4, h: R.h - 8 }));
  }
  function pktSlots() { const A = work().area, T = P.T, n = T.word.length, s = Math.min(72, (A.w - 20) / n - 8); return T.slots.map((_, i) => ({ i, x: A.x + (A.w - n * (s + 8)) / 2 + i * (s + 8), y: A.y + A.h * 0.45 - s / 2, w: s, h: s })); }
  function travelSlots() { const A = work().area, n = 5, short = work().short || A.w < 600; if (short) { const h = (A.h - 60) / n - 4; return Array.from({ length: n }, (_, i) => ({ i, x: A.x + 60, y: A.y + 30 + i * (h + 4), w: A.w - 120, h })); } const w = (A.w - 20) / n - 8; return Array.from({ length: n }, (_, i) => ({ i, x: A.x + 10 + i * (w + 8), y: A.y + A.h * 0.3, w, h: A.h * 0.5 })); }
  function pixUI() { const A = work().area, T = P.T, n = 5, s = Math.min((A.h - 50) / n, (A.w * 0.55) / n, 64), gx = A.x + A.w * 0.32, gy = A.y + 34; return { s, gx, gy, cell: (r, c) => ({ r, c, x: gx + c * s, y: gy + r * s, w: s - 3, h: s - 3 }), T }; }
  function radioArea() { return work().area; }
  const at = (A, p) => ({ x: A.x + p.x * A.w, y: A.y + p.y * A.h });

  // ------------------------------------------------ judging
  function judge() {
    const T = P.T;
    if (T.mode === 'route') { const p = cur(), r = routeOf(); return { ok: r.out === p.to, out: r.out, route: r, why: `Oops! That went to “${T.outs[r.out][1]}”. ${T.why(p)}`, hint: T.dns ? 'Find the name in the DNS phone book, then find that IP.' : 'Read the packet, then follow the tracks to the right place.' }; }
    if (T.mode === 'bits') { const p = cur(), v = T.bits.reduce((s, b, i) => s + b * 2 ** (T.bitsN - 1 - i), 0), dev = T.devs.find(d => d.n === v); return { ok: v === p.to, v, why: v === 0 ? 'All the switches are off. That’s 0!' : `You made ${v}${dev ? `, so the packet went to device ${v}` : ', but there is no device with that number'}. The packet needs ${p.to}.`, hint: `Which switches add up to ${p.to}? Start with the biggest one that fits.` }; }
    if (T.mode === 'radio') {
      const A = radioArea(), dist = (a, b) => Math.hypot((a.x - b.x) * A.w, (a.y - b.y) * A.h) / Math.max(A.w, A.h);
      if (T.items.some(it => it.x === null) && T.kind === 'wifi') return { none: 'Drag the router into the house first.' };
      if (T.kind === 'wifi') { const r = T.items[0], miss = T.devs.filter(d => dist(r, d) > T.R); return { ok: !miss.length, miss, why: `${miss.length} device${miss.length > 1 ? 's are' : ' is'} out of range. Radio waves get weaker far away. Move the router closer to the middle.`, hint: 'Put the router in the middle of all the devices.' }; }
      const nodes = [T.phone, ...T.items.filter(it => it.x !== null && it.k === 'tower'), T.hub], sat = T.items.find(it => it.k === 'sat' && it.x !== null);
      const seen = new Set([0]), st = [0]; while (st.length) { const i = st.pop(); nodes.forEach((n, j) => { if (!seen.has(j) && dist(nodes[i], n) <= T.R) { seen.add(j); st.push(j); } }); }
      const reach = new Set(seen); if (sat && [...seen].some(i => i > 0 && i < nodes.length - 1)) reach.add(nodes.length - 1);
      const ok = reach.has(nodes.length - 1); return { ok, nodes, reach, sat, why: T.water ? 'The signal can’t jump the ocean with towers. A tower must reach the farm, and the satellite carries the signal across to the city.' : 'The signal got stuck! Each tower only reaches so far. Space them out so each one reaches the next.', hint: T.water ? 'Put a tower near the farm, then add the satellite in the sky.' : 'Put the towers in a line between the farm and the city.' };
    }
    if (T.mode === 'packets') { if (T.lost >= 0 && !T.got) return { none: `Packet ${T.lost + 1} never arrived! Tap its empty spot to ask for it again.` }; if (T.slots.some(s => !s)) return { none: 'Put every packet in a spot first.' }; const bad = T.slots.findIndex((s, i) => s.i !== i); return { ok: bad < 0, bad, why: bad >= 0 ? `Spot ${bad + 1} has packet ${T.bin ? T.slots[bad].i.toString(2).padStart(3, '0') + ' (' + (T.slots[bad].i + 1) + ')' : T.slots[bad].i + 1}. Match each packet’s number to its spot.` : '', hint: T.bin ? 'The packet numbers are in binary: 001 is 1, 010 is 2, 011 is 3…' : 'Look at the number on each packet.' }; }
    if (T.mode === 'travel') { if (T.slots.some(s => !s)) return { none: 'Fill every step first.' }; const bad = T.slots.findIndex((s, i) => s.i !== i); return { ok: bad < 0, bad, why: bad >= 0 ? `The message got stuck at step ${bad + 1}. ${['First, your phone turns the words into 1s and 0s.', 'Next, the 1s and 0s fly as radio waves to a nearby tower.', 'Then cables and routers carry them across the internet.', 'A tower near your friend sends them through the air.', 'Last, your friend’s phone turns them back into words.'][bad]}` : '', hint: 'Start at YOUR phone. What does it need to do before anything can travel?' }; }
    if (T.mode === 'pixels') { const bad = T.rows.findIndex((r, i) => r.split('').some((ch, c) => +ch !== T.grid[i][c])); return { ok: bad < 0, bad, why: bad >= 0 ? `Row ${bad + 1} doesn’t match. ${T.dec ? `It should add up to ${parseInt(T.rows[bad], 2)}.` : `Its code is ${T.rows[bad]}.`}` : '', hint: T.dec ? 'Start with the biggest column that fits, like making change.' : '1 means ON, 0 means OFF.' }; }
    if (T.mode === 'storage') { if (!T.count) return { none: 'Tap ➕ to add photos.' }; const used = T.count * T.photo; return { ok: used === T.space, why: used > T.space ? `${T.count} photos × ${T.photo} MB = ${used} MB. That’s more than ${T.space} MB, so it won’t fit!` : `${T.count} × ${T.photo} = ${used} MB. There’s still ${T.space - used} MB free.`, hint: `${T.space} ÷ ${T.photo} = ?` }; }
    return { ok: false };
  }
  function check() { const r = judge(); if (r.none) { api.speak(r.none, { force: true }); return; } P.phase = 'anim'; P.anim = { t: 0, r }; Sfx.whoosh(); }
  function after() {
    const r = P.anim.r, T = P.T; P.anim = null;
    if (T.mode === 'route' || T.mode === 'bits') {
      const p = cur();
      if (r.ok) { T.done.push({ p, ok: true }); T.cur++; Sfx.correct(); pops.add('✅', api.W / 2, api.H * 0.3); if (T.cur >= T.queue.length) return solved(); P.phase = 'work'; if (T.mode === 'bits') T.bits = T.bits.map(() => 0); api.speak(T.mode === 'route' ? `Next packet: ${cur().n}` : `Next packet: address ${cur().to}`); return; }
    } else if (r.ok) return solved();
    P.phase = 'work'; Sfx.wrong();
    if (T.mode === 'packets') { T.slots = T.slots.map((s, i) => (s && s.i === i ? s : null)); }
    if (T.mode === 'travel') { T.slots = T.slots.map((s, i) => (s && s.i === i ? s : null)); }
    const n = P.teach.miss();
    if (n >= 3) { P.teach.done(false, T.mode); api.speak(`Watch how it works. ${r.why}`, { force: true }); P.phase = 'auto'; const dead = api.loseHeart('Your squad buddy finished that job.'); if (!dead) autoFinish(T); return; }
    if (n === 2) { P.teach.help(); P.showSol = 1; }
    api.speak(n === 1 && r.hint ? `${r.why} ${r.hint}` : r.why, { force: true });
  }
  function solveNow(T) {
    if (T.mode === 'route') { const w = wantSw(cur().to); for (const k in w) T.sw[k] = w[k]; }
    if (T.mode === 'bits') { const v = cur().to; T.bits = T.bits.map((_, i) => (v >> (T.bitsN - 1 - i)) & 1); }
    if (T.mode === 'radio') { if (T.kind === 'wifi') { const d = T.devs; T.items[0].x = d.reduce((s, q) => s + q.x, 0) / d.length; T.items[0].y = d.reduce((s, q) => s + q.y, 0) / d.length; } else if (T.water) { T.items[0].x = 0.2; T.items[0].y = T.phone.y; T.items[1].x = 0.5; T.items[1].y = 0.12; T.hubTower = true; } else { const k = T.items.length; T.items.forEach((it, i) => { it.x = T.phone.x + (T.hub.x - T.phone.x) * (i + 1) / (k + 1); it.y = T.phone.y + (T.hub.y - T.phone.y) * (i + 1) / (k + 1); }); } }
    if (T.mode === 'packets') { T.got = true; T.slots = T.word.split('').map((_, i) => T.pk.find(p => p.i === i)); }
    if (T.mode === 'travel') T.slots = T.steps.slice();
    if (T.mode === 'pixels') T.grid = T.rows.map(r => r.split('').map(Number));
    if (T.mode === 'storage') T.count = T.n;
  }
  function autoFinish(T) {
    const step = () => { if (!P || P.T !== T) return; solveNow(T); P.phase = 'anim'; P.anim = { t: 0, r: judge(), auto: true }; };
    setTimeout(step, 1500);
  }
  function solved() {
    const r = P.teach.done(true, P.T.mode); if (r.levelUp) api.chime('⭐ <b>Level up!</b> Your network just got bigger!', '📡');
    Sfx.win(); fx.burst(api.W / 2, api.H * 0.4, 26, ['#3dc2ff', '#7be07b', '#ffc93c']);
    api.speak(pick(['Signal delivered!', 'The network is humming!', 'Packets on time. Nice work, Squad!']));
    P.done++; P.guidedDone = true; api.score(`📶 ${P.done}`); api.progress(P.done / P.n, 'Jobs'); P.phase = 'cheer'; api.actions([]);
    setTimeout(() => P && nextTask(), 2000);
  }

  return {
    start(o) { start(o); },
    checkpoint() { if (P && P.T && P.phase === 'anim') { P.phase = 'work'; P.anim = null; } },
    stop() { P = null; },
    update(dt) {
      if (!P) return; P.t += dt; pops.update(dt); fx.update(dt);
      if (P.phase === 'work') { if (api.input.pressed('check')) check(); if (api.input.pressed('help')) this.hint(); }
      if (P.phase === 'anim') {
        P.anim.t += dt; const dur = ['route', 'bits'].includes(P.T.mode) ? 1.6 : 2;
        if (P.anim.t > dur) { if (P.anim.auto) { const T = P.T; P.anim = null; if ((T.mode === 'route' || T.mode === 'bits')) { T.cur++; if (T.cur >= T.queue.length) { solvedAfterLoss(); return; } P.phase = 'auto'; autoFinish(T); return; } solvedAfterLoss(); } else after(); }
      }
    },
    hint() { if (!P || !P.T || P.phase !== 'work') return false; P.teach.help(); P.showSol = 1; const r = judge(); api.speak(r.hint || r.none || 'Press the big button to test it!', { force: true }); return true; },
    coach() { if (!P || !P.T) return ''; const T = P.T, p = cur(); return { route: p ? `→ ${T.outs[p.to][1]}` : '', bits: p ? `${p.to} = ${p.to.toString(2)}` : '', radio: 'Space the towers evenly.', packets: T.word, travel: 'phone → tower → internet → tower → phone', pixels: T.nm, storage: `${T.n} photos` }[T.mode] || ''; },
    onHelp(id) { if (!P || !P.T || P.phase !== 'work') return ''; if (id === 'boost') { P.showSol = 1; P.teach.help(); return 'boosted the signal!'; } return ''; },
    screen() { if (!P || !P.T) return ''; const p = cur(); return `Network: ${P.T.ask}${p && p.n ? ` · Packet: ${p.n}` : ''}`; },
    onTap(x, y) {
      if (!P || !P.T || P.phase !== 'work') return;
      const T = P.T;
      if (T.mode === 'route') { const s = swRects().find(q => inBox(x, y, { x: q.x - 10, y: q.y - 10, w: q.w + 20, h: q.h + 20 })); if (s) { T.sw[s.i] ^= 1; Sfx.click(); } return; }
      if (T.mode === 'bits') { const b = bitUI().find(q => inBox(x, y, q)); if (b) { T.bits[b.i] ^= 1; Sfx.click(); const v = T.bits.reduce((s2, bb, i) => s2 + bb * 2 ** (T.bitsN - 1 - i), 0); api.speak(String(v)); } return; }
      const it = trayItems().find(q => inBox(x, y, q)); if (it) { P.drag = { k: it.k, x, y }; return; }
      if (T.mode === 'radio') { const A = radioArea(); const placed = T.items.find(q => q.x !== null && Math.hypot(A.x + q.x * A.w - x, A.y + q.y * A.h - y) < 30); if (placed) { P.drag = { k: placed, x, y, moving: true }; } return; }
      if (T.mode === 'packets') { const s = pktSlots().find(q => inBox(x, y, q)); if (!s) return; if (s.i === T.lost && !T.got) { T.got = true; Sfx.coin(); api.speak(`Resend packet ${s.i + 1}, please!`); pops.add('📨 resent!', s.x + s.w / 2, s.y - 10); T.slots[s.i] = null; T.lostArrived = true; return; } if (T.slots[s.i]) { P.drag = { k: T.slots[s.i], x, y }; T.slots[s.i] = null; } return; }
      if (T.mode === 'travel') { const s = travelSlots().find(q => inBox(x, y, q)); if (s && T.slots[s.i]) { P.drag = { k: T.slots[s.i], x, y }; T.slots[s.i] = null; } return; }
      if (T.mode === 'pixels') { const U = pixUI(); for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (inBox(x, y, U.cell(r, c))) { T.grid[r][c] ^= 1; Sfx.click(); } return; }
      if (T.mode === 'storage') { const B = this.storageBtns(); if (inBox(x, y, B.plus)) { T.count = Math.min(40, T.count + 1); Sfx.click(); api.speak(`${T.count} photos, ${T.count * T.photo} megabytes`); } else if (inBox(x, y, B.minus)) { T.count = Math.max(0, T.count - 1); Sfx.click(); api.speak(`${T.count} photos`); } }
    },
    onMove(x, y) { if (P && P.drag) { P.drag.x = x; P.drag.y = y; } },
    onUp(x, y) {
      if (!P || !P.T || !P.drag) return; const d = P.drag, T = P.T; P.drag = null;
      if (T.mode === 'packets') { const s = pktSlots().find(q => inBox(x, y, q)); if (s && !(s.i === T.lost && !T.got)) { T.slots[s.i] = d.k; Sfx.click(); } return; }
      if (T.mode === 'travel') { const s = travelSlots().find(q => inBox(x, y, q)); if (s) { T.slots[s.i] = d.k; Sfx.click(); api.speak(d.k.n); } return; }
      if (T.mode === 'radio') { const A = radioArea(); if (!inBox(x, y, A)) { if (d.moving) { d.k.x = null; d.k.y = null; } return; } const fx2 = (x - A.x) / A.w, fy = (y - A.y) / A.h, it = d.moving ? d.k : d.k; if (it.k === 'tower' && T.water && fx2 > T.water.x0 && fx2 < T.water.x1) { api.speak('Towers can’t stand in the ocean!', { force: true }); if (d.moving) { it.x = null; it.y = null; } return; } if (it.k === 'sat' && fy > 0.25) { api.speak('Satellites go up in space! Drag it to the top.', { force: true }); return; } it.x = clamp(fx2, 0.03, 0.97); it.y = clamp(fy, 0.05, 0.95); Sfx.click(); }
    },
    storageBtns() { const A = work().area, s = Math.min(70, A.h * 0.2); return { minus: { x: A.x + A.w * 0.3 - s, y: A.y + A.h * 0.7, w: s, h: s }, plus: { x: A.x + A.w * 0.3 + s * 0.4, y: A.y + A.h * 0.7, w: s, h: s } }; },
    draw(ctx, W, H, onTitle) {
      ctx.fillStyle = '#0f1d33'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(61,194,255,.08)'; for (let i = 0; i < 30; i++) { ctx.fillRect((i * 131) % W, (i * 71 + (P ? P.t : 0) * 20) % H, 2, 30); }
      if (onTitle || !P || !P.T) { emoji(ctx, '📡', W / 2, H / 2, 90); return; }
      const T = P.T, b = playBox(W, H); panel(ctx, b, { fill: '#f4f8ff', r: 16 });
      ({ route: this.dRoute, bits: this.dBits, radio: this.dRadio, packets: this.dPackets, travel: this.dTravel, pixels: this.dPixels, storage: this.dStorage })[T.mode].call(this, ctx);
      const Wk = work();
      if (Wk.tray) { panel(ctx, Wk.tray, { fill: '#203453', r: 12, shadow: false }); for (const q of trayItems()) this.dItem(ctx, q.k, q); if (!trayItems().length) text(ctx, '✔', Wk.tray.x + Wk.tray.w / 2, Wk.tray.y + Wk.tray.h / 2, { size: 16, color: '#fff' }); }
      if (P.drag) this.dItem(ctx, P.drag.k.k ? P.drag.k : P.drag.k, { x: P.drag.x - 40, y: P.drag.y - 30, w: 80, h: 60 }, true);
      if (P.showSol && P.phase === 'work') this.dHint(ctx);
      if (P.anim && P.anim.t > 1.2 && !['route', 'bits'].includes(T.mode)) text(ctx, P.anim.r.ok ? '✅ Signal delivered!' : '❌ Signal lost…', b.x + b.w / 2, b.y + 22, { size: 20, color: P.anim.r.ok ? '#2fae66' : '#e5484d' });
      fx.draw(ctx); pops.draw(ctx);
    },
    dItem(ctx, k, q, floating) {
      const T = P.T;
      if (T.mode === 'radio') { if (!floating) panel(ctx, q, { fill: '#fff', r: 10, shadow: false }); emoji(ctx, k.e, q.x + q.w / 2, q.y + q.h * 0.42, Math.min(36, q.h * 0.5)); if (!floating) text(ctx, k.k === 'sat' ? 'satellite' : k.k, q.x + q.w / 2, q.y + q.h - 9, { size: 10 }); return; }
      if (T.mode === 'packets') { panel(ctx, q, { fill: '#ffe9a8', r: 10, shadow: !!floating }); text(ctx, k.ch, q.x + q.w / 2, q.y + q.h * 0.45, { size: Math.min(26, q.h * 0.4) }); text(ctx, `#${T.bin ? (k.i + 1).toString(2).padStart(3, '0') : k.i + 1}`, q.x + q.w / 2, q.y + q.h - 10, { size: 11, color: '#8a5a00' }); return; }
      if (T.mode === 'travel') { panel(ctx, q, { fill: '#fff', r: 10, shadow: !!floating }); const short = q.h < 60 || q.w > 2.2 * q.h; emoji(ctx, k.e, short ? q.x + 18 : q.x + q.w / 2, short ? q.y + q.h / 2 : q.y + 22, short ? Math.min(22, q.h * 0.6) : 26); text(ctx, k.n, short ? q.x + 34 : q.x + q.w / 2, short ? q.y + q.h / 2 : q.y + q.h * 0.62, { size: 10, max: short ? q.w - 40 : q.w - 8, align: short ? 'left' : 'center' }); }
    },
    dRoute(ctx) {
      const T = P.T, N = net(), A = P.anim, R = routeOf(), p = cur();
      if (N.dns) { panel(ctx, N.dns, { fill: '#fff8e1', r: 12, shadow: false, stroke: '#e0c060' }); text(ctx, '📖 DNS phone book', N.dns.x + N.dns.w / 2, N.dns.y + 16, { size: 13 }); T.dns.forEach((d, i) => { if (N.strip) { const cw = N.dns.w / 2, x = N.dns.x + 8 + (i % 2) * cw, y = N.dns.y + 38 + Math.floor(i / 2) * Math.min(36, (N.dns.h - 40) / 2); text(ctx, `${d.e} ${d.name}`, x, y - 7, { size: 11, align: 'left' }); text(ctx, d.ip, x + 18, y + 8, { size: 11, align: 'left', color: '#3a6ea5' }); return; } const y = N.dns.y + 42 + i * Math.min(40, (N.dns.h - 50) / T.dns.length); text(ctx, `${d.e} ${d.name}`, N.dns.x + 8, y, { size: 12, align: 'left' }); text(ctx, d.ip, N.dns.x + N.dns.w - 8, y + 14, { size: 12, align: 'right', color: '#3a6ea5' }); }); }
      const track = (a, b2, on) => { ctx.strokeStyle = on ? '#3dc2ff' : '#c9d4e6'; ctx.lineWidth = on ? 8 : 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b2.x, b2.y); ctx.stroke(); };
      // all tracks (dim), then the live route (bright)
      const all = []; if (N.n === 2) { all.push([N.src, N.J[0]], [N.J[0], N.outs[0]], [N.J[0], N.outs[1]]); } else if (N.n === 3) { const j = N.J[0], j2 = N.J[2]; all.push([N.src, j], [j, N.outs[0]], [j, { x: j.x, y: j2.y }], [{ x: j.x, y: j2.y }, j2], [j2, N.outs[1]], [j2, N.outs[2]]); } else { const j0 = N.J[0]; all.push([N.src, j0]); [1, 2].forEach(k => { const j = N.J[k]; all.push([j0, { x: j0.x, y: j.y }], [{ x: j0.x, y: j.y }, j], [j, N.outs[k === 1 ? 0 : 2]], [j, N.outs[k === 1 ? 1 : 3]]); }); }
      all.forEach(([a, b2]) => track(a, b2, false)); for (let i = 0; i < R.pts.length - 1; i++) track(R.pts[i], R.pts[i + 1], true);
      N.outs.forEach((o, i) => { const done = T.done.filter(d => d.p.to === i).length, hot = A && A.t > 1.3 && A.r.out === i; panel(ctx, { x: o.x - 10, y: o.y - 26, w: N.A.x + N.A.w - o.x + 6, h: 52 }, { fill: hot ? (A.r.ok ? '#d6ffe0' : '#ffd6d6') : '#fff', r: 12, shadow: false, stroke: '#c9d4e6' }); emoji(ctx, T.outs[i][0], o.x + 14, o.y, 28); text(ctx, T.outs[i][1], o.x + 32, o.y - (done ? 6 : 0), { size: 11, align: 'left', max: N.A.x + N.A.w - o.x - 40 }); if (done) text(ctx, '📦'.repeat(Math.min(done, 4)), o.x + 32, o.y + 13, { size: 11, align: 'left' }); });
      swRects().forEach(s => { const j = N.J[s.i]; ctx.fillStyle = '#26334d'; roundRect(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill(); text(ctx, T.sw[s.i] ? '⬇' : '⬆', j.x, j.y, { size: s.w * 0.5, color: '#ffc93c' }); });
      // the packet
      if (p) { let pos = N.src; if (A) { const pts = A.r.route.pts, segs = pts.length - 1, k = Math.min(1, A.t / 1.3) * segs, si = Math.min(segs - 1, Math.floor(k)), f = k - si; pos = { x: pts[si].x + (pts[si + 1].x - pts[si].x) * f, y: pts[si].y + (pts[si + 1].y - pts[si].y) * f }; } panel(ctx, { x: pos.x - 30, y: pos.y - 24, w: 60, h: 48 }, { fill: '#ffe9a8', r: 10 }); emoji(ctx, p.e, pos.x, pos.y, 28); }
      if (p && !A) { const bx = { x: N.src.x - 30, y: N.A.y + 4, w: Math.min(260, N.A.w * 0.45), h: 40 }; bx.x = clamp(bx.x, N.A.x + (N.dns && !N.strip ? N.dns.w + 14 : 0), N.A.x + N.A.w - bx.w); panel(ctx, bx, { fill: '#26334d', r: 10, shadow: false }); text(ctx, `📦 ${p.n}`, bx.x + bx.w / 2, bx.y + bx.h / 2, { size: 12, color: '#fff', max: bx.w - 10 }); }
      text(ctx, `${T.cur + (A && A.r.ok ? 1 : 0)} / ${T.queue.length} delivered`, N.src.x, N.A.y + N.A.h - 10, { size: 12, color: '#6b6380' });
      if (A && A.t > 1.3 && !A.r.ok) text(ctx, '❌', N.outs[A.r.out].x - 22, N.outs[A.r.out].y - 22, { size: 18 });
    },
    dBits(ctx) {
      const T = P.T, U = bitUI(), A2 = work().area, An = P.anim, p = cur(), v = T.bits.reduce((s, b, i) => s + b * 2 ** (T.bitsN - 1 - i), 0);
      devRects().forEach(r => { const hit = An && An.t > 1 && An.r.v === r.d.n, delivered = T.done.some(d => d.p.to === r.d.n); panel(ctx, r, { fill: hit ? (An.r.ok ? '#d6ffe0' : '#ffd6d6') : delivered ? '#eaf7ea' : '#fff', r: 10, shadow: false, stroke: '#c9d4e6' }); emoji(ctx, r.d.e, r.x + 20, r.y + r.h / 2, Math.min(26, r.h * 0.6)); text(ctx, `device ${r.d.n}`, r.x + 40, r.y + r.h / 2, { size: 13, align: 'left' }); if (delivered) text(ctx, '✅', r.x + r.w - 14, r.y + r.h / 2, { size: 13 }); });
      if (p) { panel(ctx, { x: A2.x + 10, y: A2.y + 10, w: Math.min(280, A2.w * 0.6), h: 54 }, { fill: '#ffe9a8', r: 12, shadow: false }); text(ctx, `📦 Packet to: ${p.to}`, A2.x + 10 + Math.min(280, A2.w * 0.6) / 2, A2.y + 37, { size: 20 }); }
      U.forEach(u => { const on = T.bits[u.i]; text(ctx, String(u.v), u.x + u.w / 2, u.y - 14, { size: 15, color: '#6b6380' }); ctx.fillStyle = on ? '#ffc93c' : '#26334d'; roundRect(ctx, u.x, u.y, u.w, u.h, 12); ctx.fill(); text(ctx, on ? '1' : '0', u.x + u.w / 2, u.y + u.h / 2, { size: u.w * 0.5, color: on ? '#26334d' : '#9fb3c8' }); text(ctx, on ? 'ON' : 'off', u.x + u.w / 2, u.y + u.h + 12, { size: 11, color: '#6b6380' }); });
      const last = U[U.length - 1]; text(ctx, `= ${v}`, last.x + last.w + 40, last.y + last.h / 2, { size: 26, color: '#3a6ea5' });
      text(ctx, `${T.cur} / ${T.queue.length} delivered`, A2.x + A2.w * 0.3, A2.y + A2.h - 10, { size: 12, color: '#6b6380' });
      if (An) { const t = Math.min(1, An.t / 1), r = devRects().find(q => q.d.n === An.r.v), tx = r ? r.x : A2.x + A2.w * 0.7, ty = r ? r.y + r.h / 2 : A2.y + A2.h + 20; emoji(ctx, '📦', A2.x + 100 + (tx - A2.x - 100) * t, A2.y + 40 + (ty - A2.y - 40) * t, 26); }
    },
    dRadio(ctx) {
      const T = P.T, A = radioArea(), An = P.anim, res = An ? An.r : null, R = T.R * Math.max(A.w, A.h);
      if (T.kind === 'wifi') {
        ctx.fillStyle = '#fdf1dc'; roundRect(ctx, A.x, A.y, A.w, A.h, 12); ctx.fill(); ctx.strokeStyle = '#c47a3c'; ctx.lineWidth = 4; ctx.strokeRect(A.x + 10, A.y + 10, A.w - 20, A.h - 20); text(ctx, '🏠 The house', A.x + 70, A.y + 24, { size: 13 });
        const r = T.items[0]; if (r.x !== null) { const p = at(A, r); ctx.fillStyle = 'rgba(61,194,255,.15)'; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(61,194,255,.6)'; ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); emoji(ctx, '📶', p.x, p.y, 34); }
        T.devs.forEach((d, i) => { const p = at(A, d), bad = res && res.miss && res.miss.includes(d); emoji(ctx, ['💻', '📱', '📺'][i], p.x, p.y, 32); if (An && An.t > 0.8) text(ctx, bad ? '❌' : '✅', p.x + 18, p.y - 18, { size: 14 }); });
        return;
      }
      ctx.fillStyle = '#bfe3a6'; roundRect(ctx, A.x, A.y, A.w, A.h, 12); ctx.fill();
      if (T.water) { ctx.fillStyle = '#5fb6ff'; ctx.fillRect(A.x + A.w * T.water.x0, A.y + A.h * 0.3, A.w * (T.water.x1 - T.water.x0), A.h * 0.7); text(ctx, '🌊 ocean', A.x + A.w * 0.5, A.y + A.h * 0.6, { size: 14, color: '#fff' }); ctx.fillStyle = '#0f1d33'; ctx.fillRect(A.x, A.y, A.w, A.h * 0.22); text(ctx, '✨ space', A.x + A.w * 0.5, A.y + 14, { size: 12, color: '#fff' }); }
      const ph = at(A, T.phone), hb = at(A, T.hub); emoji(ctx, '🚜', ph.x + 10, ph.y + 28, 26); emoji(ctx, '📱', ph.x, ph.y, 30); emoji(ctx, '🏙️', hb.x, hb.y, 40);
      T.items.forEach(it => { if (it.x === null) return; const p = at(A, it); if (it.k === 'tower') { ctx.fillStyle = 'rgba(61,194,255,.12)'; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(61,194,255,.5)'; ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); } emoji(ctx, it.e, p.x, p.y, 34); });
      if (res && res.nodes) { const ns = res.nodes.map(n => at(A, n)); ctx.strokeStyle = '#ffc93c'; ctx.lineWidth = 4; for (let i = 0; i < ns.length; i++) for (let j = i + 1; j < ns.length; j++) { const d = Math.hypot((res.nodes[i].x - res.nodes[j].x) * A.w, (res.nodes[i].y - res.nodes[j].y) * A.h) / Math.max(A.w, A.h); if (d <= T.R && res.reach.has(i) && res.reach.has(j)) { ctx.beginPath(); ctx.moveTo(ns[i].x, ns[i].y); ctx.lineTo(ns[j].x, ns[j].y); ctx.stroke(); } } if (res.sat && res.ok) { const s = at(A, res.sat); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(hb.x, hb.y); ctx.stroke(); const tw = T.items.find(it => it.k === 'tower' && it.x !== null); if (tw) { const tp = at(A, tw); ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tp.x, tp.y); ctx.stroke(); } ctx.setLineDash([]); } }
    },
    dPackets(ctx) {
      const T = P.T, S = pktSlots(), An = P.anim, A = work().area;
      text(ctx, 'Rebuild the message:', A.x + A.w / 2, A.y + 18, { size: 14, color: '#6b6380' });
      S.forEach(s => { const k = T.slots[s.i], lost = s.i === T.lost && !T.got, bad = An && An.r.bad === s.i; panel(ctx, s, { fill: bad ? '#ffd6d6' : lost ? '#ffe3e3' : k ? '#ffe9a8' : '#fff', r: 10, shadow: false, stroke: lost ? '#e5484d' : '#c9d4e6' }); text(ctx, `#${T.bin ? (s.i + 1).toString(2).padStart(3, '0') : s.i + 1}`, s.x + s.w / 2, s.y - 12, { size: 12, color: '#6b6380' }); if (k) text(ctx, k.ch, s.x + s.w / 2, s.y + s.h / 2, { size: s.w * 0.45 }); else if (lost) { text(ctx, '❓', s.x + s.w / 2, s.y + s.h / 2 - 6, { size: s.w * 0.3 }); text(ctx, 'lost! tap', s.x + s.w / 2, s.y + s.h - 10, { size: 9, color: '#e5484d' }); } });
      if (T.lostArrived && !T.slots[T.lost]) { /* the resent packet waits in the tray */ }
      if (An && An.r.ok) text(ctx, `💬 “${T.word}”`, A.x + A.w / 2, A.y + A.h * 0.8, { size: 26, color: '#2fae66' });
    },
    dTravel(ctx) {
      const T = P.T, S = travelSlots(), An = P.anim, A = work().area, short = work().short || A.w < 600;
      if (!short) { emoji(ctx, '📱', A.x + 20, A.y + A.h * 0.18, 28); text(ctx, 'you', A.x + 50, A.y + A.h * 0.18, { size: 12, align: 'left' }); emoji(ctx, '📲', A.x + A.w - 20, A.y + A.h * 0.18, 28); text(ctx, 'friend', A.x + A.w - 50, A.y + A.h * 0.18, { size: 12, align: 'right' }); }
      else { emoji(ctx, '📱', A.x + 24, A.y + 30, 26); emoji(ctx, '📲', A.x + 24, A.y + A.h - 30, 26); }
      const lit = An ? Math.min(5, An.t * 3) : -1;
      S.forEach(s => { const k = T.slots[s.i], bad = An && !An.r.ok && An.r.bad === s.i && An.t > 1; if (k) { const fake = { ...s }; this.dItem(ctx, k, fake); if (lit > s.i) { ctx.strokeStyle = '#3dc2ff'; ctx.lineWidth = 4; roundRect(ctx, s.x, s.y, s.w, s.h, 10); ctx.stroke(); } if (bad) { ctx.strokeStyle = '#e5484d'; ctx.lineWidth = 4; roundRect(ctx, s.x, s.y, s.w, s.h, 10); ctx.stroke(); } } else { ctx.setLineDash([5, 4]); ctx.strokeStyle = '#9aa7bd'; ctx.lineWidth = 2; roundRect(ctx, s.x, s.y, s.w, s.h, 10); ctx.stroke(); ctx.setLineDash([]); text(ctx, `step ${s.i + 1}`, s.x + s.w / 2, s.y + s.h / 2, { size: 12, color: '#9aa7bd' }); } });
    },
    dPixels(ctx) {
      const T = P.T, U = pixUI(), An = P.anim, A = work().area;
      text(ctx, T.dec ? 'columns:' : '', U.gx - 10, U.gy - 14, { size: 11, align: 'right', color: '#6b6380' });
      if (T.dec) [16, 8, 4, 2, 1].forEach((v, c) => text(ctx, String(v), U.gx + c * U.s + U.s / 2, U.gy - 14, { size: 12, color: '#6b6380' }));
      T.rows.forEach((r, i) => { const code = T.dec ? String(parseInt(r, 2)) : r, bad = An && !An.r.ok && An.r.bad === i; text(ctx, code, U.gx - 12, U.gy + i * U.s + U.s / 2, { size: T.dec ? 18 : 14, align: 'right', color: bad ? '#e5484d' : '#26334d', font: 'monospace' }); const sum = T.grid[i].reduce((s, b, c) => s + b * 2 ** (4 - c), 0); if (T.dec) text(ctx, `= ${sum}`, U.gx + 5 * U.s + 10, U.gy + i * U.s + U.s / 2, { size: 13, align: 'left', color: sum === parseInt(r, 2) ? '#2fae66' : '#9aa7bd' }); });
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) { const q = U.cell(r, c), on = T.grid[r][c]; ctx.fillStyle = on ? (An && An.r.ok ? '#ff6b9d' : '#26334d') : '#e3e9f3'; roundRect(ctx, q.x, q.y, q.w, q.h, 6); ctx.fill(); }
      if (An && An.r.ok) text(ctx, `📸 a ${T.nm}!`, A.x + A.w * 0.15, A.y + A.h * 0.5, { size: 18, color: '#2fae66' });
    },
    dStorage(ctx) {
      const T = P.T, A = work().area, B = this.storageBtns(), An = P.anim, used = T.count * T.photo, bw = A.w * 0.5, bx = A.x + A.w * 0.45, by = A.y + A.h * 0.25, bh = 44;
      emoji(ctx, '📱', A.x + A.w * 0.2, A.y + A.h * 0.3, 70);
      text(ctx, `💾 ${T.space} MB free`, bx + bw / 2, by - 16, { size: 15 });
      ctx.fillStyle = '#e3e9f3'; roundRect(ctx, bx, by, bw, bh, 10); ctx.fill();
      const f = Math.min(1, used / T.space); ctx.fillStyle = used > T.space ? '#e5484d' : used === T.space ? '#2fae66' : '#3dc2ff'; roundRect(ctx, bx, by, Math.max(10, bw * f), bh, 10); ctx.fill();
      for (let i = 1; i < T.count && i * T.photo < T.space; i++) { const x = bx + bw * (i * T.photo / T.space); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x - 1, by, 2, bh); }
      text(ctx, `${T.count} photos × ${T.photo} MB = ${used} MB`, bx + bw / 2, by + bh + 22, { size: 15, color: used > T.space ? '#e5484d' : '#26334d' });
      const row = Math.min(T.count, 20); for (let i = 0; i < row; i++) emoji(ctx, '🖼️', bx + (i % 10) * 26 + 13, by + bh + 48 + Math.floor(i / 10) * 26, 20);
      button(ctx, B.minus, '−', { fill: '#fff' }); button(ctx, B.plus, '+'); text(ctx, 'photos', (B.minus.x + B.plus.x + B.plus.w) / 2, B.minus.y - 14, { size: 13 });
      void An;
    },
    dHint(ctx) {
      const T = P.T;
      if (T.mode === 'route') { const w = wantSw(cur().to), k = Object.keys(w).find(k => T.sw[k] !== w[k]); if (k !== undefined) { const s = swRects().find(q => q.i === +k); if (s) hand(ctx, s.x + s.w / 2, s.y + s.h / 2, P.t, 30); } }
      if (T.mode === 'bits') { const v = cur().to, i = T.bits.findIndex((b, k) => b !== ((v >> (T.bitsN - 1 - k)) & 1)); if (i >= 0) { const u = bitUI()[i]; hand(ctx, u.x + u.w / 2, u.y + u.h / 2, P.t, 30); } }
      if (T.mode === 'radio') { const it = trayItems()[0]; if (it) hand(ctx, it.x + it.w / 2, it.y + it.h / 2, P.t, 28); }
      if (T.mode === 'packets') { if (T.lost >= 0 && !T.got) { const s = pktSlots()[T.lost]; hand(ctx, s.x + s.w / 2, s.y + s.h / 2, P.t, 28); return; } const i = T.slots.findIndex((s, k) => !s || s.i !== k); if (i >= 0) { const q = trayItems().find(q => q.k.i === i); if (q) hand(ctx, q.x + q.w / 2, q.y + q.h / 2, P.t, 28); } }
      if (T.mode === 'travel') { const i = T.slots.findIndex((s, k) => !s || s.i !== k); if (i >= 0) { const q = trayItems().find(q => q.k.i === i); if (q) hand(ctx, q.x + q.w / 2, q.y + q.h / 2, P.t, 28); } }
      if (T.mode === 'pixels') { for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (T.grid[r][c] !== +T.rows[r][c]) { const q = pixUI().cell(r, c); hand(ctx, q.x + q.w / 2, q.y + q.h / 2, P.t, 26); return; } }
      if (T.mode === 'storage' && T.count !== T.n) { const B = this.storageBtns(), q = T.count < T.n ? B.plus : B.minus; hand(ctx, q.x + q.w / 2, q.y + q.h / 2, P.t, 28); }
    },
    _test: {
      step() { if (!P || !P.T) return 'none'; if (P.phase === 'anim') { P.anim.t = 9; return 'anim'; } if (P.phase !== 'work') return P.phase; solveNow(P.T); check(); return P.T.mode; },
      go() { if (P && P.phase === 'work') check(); },
      get P() { return P; },
    },
  };

  function solvedAfterLoss() { const T = P.T; P.done++; P.guidedDone = true; api.score(`📶 ${P.done}`); api.progress(P.done / P.n, 'Jobs'); P.phase = 'cheer'; api.actions([]); void T; setTimeout(() => P && nextTask(), 1600); }
}

startGame({
  mascot: '📡',
  story: (d, e) => (e >= 3 ? 'The network needs an engineer! Binary addresses, towers and satellites, packets, DNS and pixels.' : 'Packets need your help! Flip the track switches so every message zooms to the right place.'),
  howTo: ['🔀 Tap a switch to flip which way the track goes.', '📤 Press Send and watch the packet zoom!', '🛡️ Viruses and scams go to the firewall.'],
  together: { helps: [{ id: 'boost', icon: '📶', label: 'Signal boost', cool: 25 }] },
  lessons: level => LESSONS[level] || [],
  realLife: realFrom(REAL['signal-squad']),
  create: createGame,
});

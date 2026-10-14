// Hands-on puzzle pieces drawn on the game canvas: set clock hands, drop coins, drag cards into order,
// sort things into bins, tap picture tiles (read aloud), type a number, slide along a number line.
// A game opens one with puzzles(api).open(widget, {...}) at a gate, door, customer or obstacle.
import { clamp, roundRect, label, emoji, clockFace, playBox, Sfx } from './play.js';
import { MONEY } from '../_joy/js/money.js';

const INK = '#2b2350';
const say = (api, t) => t && api && api.speak && api.speak(String(t).replace(/<[^>]+>/g, ' '), { force: true });
const inBox = (x, y, b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
const text = (ctx, t, x, y, { size = 16, color = INK, weight = 700, align = 'center', max = 0 } = {}) => {
  ctx.save(); ctx.font = `${weight} ${size}px Fredoka, system-ui, sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (max && ctx.measureText(t).width > max) { // wrap to 2 lines
    const words = String(t).split(' '); let a = '', i = 0;
    for (; i < words.length; i++) { if (ctx.measureText(a + words[i]).width > max && a) break; a += words[i] + ' '; }
    ctx.fillText(a.trim(), x, y - size * 0.55); ctx.fillText(words.slice(i).join(' '), x, y + size * 0.55);
  } else ctx.fillText(t, x, y);
  ctx.restore();
};

// ---------------------------------------------------------------- money pictures
const COIN_R = { quarter: 1, nickel: 0.874, penny: 0.785, dime: 0.738 };
export function drawMoney(ctx, kind, x, y, r, { value = true, alpha = 1 } = {}) {
  const m = MONEY[kind]; ctx.save(); ctx.globalAlpha = alpha;
  if (m.kind === 'coin') {
    const rr = r * COIN_R[kind], cu = kind === 'penny';
    ctx.fillStyle = cu ? '#c47a3c' : '#cfd6de'; ctx.strokeStyle = cu ? '#8a4f1e' : '#8b96a3'; ctx.lineWidth = Math.max(2, rr * 0.1);
    ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = cu ? 'rgba(90,40,10,.35)' : 'rgba(80,90,100,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, rr * 0.78, 0, 7); ctx.stroke();
    if (value) text(ctx, m.cents + '¢', x, y + 1, { size: Math.max(10, rr * 0.62), color: cu ? '#4a2208' : '#2f3a46' });
  } else {
    const w = r * 2.5, h = r * 1.15;
    ctx.fillStyle = '#c5e3b8'; ctx.strokeStyle = '#4f8a45'; ctx.lineWidth = 2; roundRect(ctx, x - w / 2, y - h / 2, w, h, 5); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(79,138,69,.5)'; ctx.strokeRect(x - w / 2 + 4, y - h / 2 + 4, w - 8, h - 8);
    ctx.fillStyle = '#9ccc8b'; ctx.beginPath(); ctx.ellipse(x, y, h * 0.32, h * 0.36, 0, 0, 7); ctx.fill();
    if (value) { text(ctx, '$' + m.label, x - w * 0.32, y, { size: h * 0.42, color: '#24561d' }); text(ctx, '$' + m.label, x + w * 0.32, y, { size: h * 0.42, color: '#24561d' }); }
  }
  ctx.restore();
}
export const cents = list => list.reduce((s, k) => s + MONEY[k].cents, 0);
export const moneyText = c => (c >= 100 ? '$' + (c / 100).toFixed(c % 100 ? 2 : 0) : c + '¢');

// ---------------------------------------------------------------- the host: one puzzle at a time, on a card
export function puzzles(api) {
  let cur = null;
  const short = () => api.H <= 500;
  const box = () => {
    if (short()) { const pb = playBox(api.W, api.H); return { x: 10, y: 58, w: Math.min(pb.w, 760), h: api.H - 66 }; }
    const pb = playBox(api.W, api.H), w = Math.min(pb.w, 720), h = Math.min(pb.h, cur && cur.w.maxH ? cur.w.maxH : 560);
    return { x: pb.x + (pb.w - w) / 2, y: pb.y + Math.max(0, (pb.h - h) / 2), w, h };
  };
  const setShort = on => { document.body.classList.toggle('pz-short', !!on); };
  const setOpen = on => { document.body.classList.toggle('pz-open', !!on); if (on) { const c = document.getElementById('pg-chime'); if (c) c.classList.add('hidden'); } };
  return {
    get on() { return !!cur; },
    get widget() { return cur && cur.w; },
    /** w = a widget below. onCheck(value, widget) → true closes it. */
    open(w, { prompt = '', speak = true, check = '✔ Check', onCheck, more = [], dim = true } = {}) {
      cur = { w, onCheck, dim, prompt };
      w.api = api; w.compact = short(); setShort(w.compact); setOpen(true);
      if (prompt) api.goal(prompt, { speak });
      api.actions([...more, { key: 'check', label: check, big: true }]);
    },
    close() { cur = null; setShort(false); setOpen(false); },
    update(dt) {
      if (!cur) return;
      cur.w.update && cur.w.update(dt, api.input);
      if (api.input.pressed('check') || api.input.pressed('action')) { const c = cur; const done = c.onCheck && c.onCheck(c.w.value(), c.w); if (done && cur === c) { cur = null; setShort(false); setOpen(false); } }
    },
    draw(ctx, W, H) {
      if (!cur) return;
      const b = box();
      if (cur.dim) { ctx.fillStyle = 'rgba(10,14,28,.45)'; ctx.fillRect(0, 0, W, H); }
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 24; ctx.fillStyle = '#fffdf6'; roundRect(ctx, b.x, b.y, b.w, b.h, 22); ctx.fill(); ctx.restore();
      let iy = b.y + 12;
      if (cur.w.compact && cur.prompt) { text(ctx, cur.prompt.replace(/<[^>]+>/g, ''), b.x + b.w / 2, iy + 18, { size: 15, max: b.w - 30 }); iy += 42; }
      cur.w.compact = short();
      cur.w.draw(ctx, { x: b.x + 12, y: iy, w: b.w - 24, h: b.y + b.h - 12 - iy });
    },
    down(x, y) { if (cur && cur.w.down) { cur.w.down(x, y); return true; } return false; },
    move(x, y) { cur && cur.w.move && cur.w.move(x, y); },
    up(x, y) { cur && cur.w.up && cur.w.up(x, y); },
  };
}

// ---------------------------------------------------------------- picture tiles (tap = hear it + pick it)
export function tiles(items, { cols = 0, header = '', art = null } = {}) {
  const w = { sel: -1, items, rects: [], maxH: 520 };
  w.value = () => w.sel;
  w.draw = (ctx, b) => {
    let y0 = b.y;
    if (header && !w.compact) { text(ctx, header, b.x + b.w / 2, y0 + 16, { size: 20, max: b.w - 20 }); y0 += 40; }
    if (art) { const ah = Math.min(170, (b.h - (y0 - b.y)) * 0.42); art(ctx, { x: b.x, y: y0, w: b.w, h: ah }); y0 += ah + 8; }
    const n = items.length, c = cols || (n <= 3 ? n : n === 4 ? (b.w > 520 ? 4 : 2) : b.w > 520 ? Math.min(n, 4) : 2), rows = Math.ceil(n / c);
    const gap = 10, tw = (b.w - gap * (c - 1)) / c, th = Math.min(150, (b.y + b.h - y0 - gap * (rows - 1)) / rows);
    w.rects = items.map((it, i) => ({ x: b.x + (i % c) * (tw + gap), y: y0 + Math.floor(i / c) * (th + gap), w: tw, h: th }));
    items.forEach((it, i) => {
      const r = w.rects[i], on = i === w.sel;
      ctx.fillStyle = on ? '#fff1c2' : '#fff'; ctx.strokeStyle = on ? '#ffb000' : '#e2deef'; ctx.lineWidth = on ? 5 : 3;
      roundRect(ctx, r.x, r.y, r.w, r.h, 16); ctx.fill(); ctx.stroke();
      const hasT = it.text, es = Math.min(r.h * (hasT ? 0.5 : 0.7), r.w * 0.5);
      if (it.draw) it.draw(ctx, r.x + r.w / 2, r.y + r.h * (hasT ? 0.4 : 0.5), es);
      else if (it.e) emoji(ctx, it.e, r.x + r.w / 2, r.y + r.h * (hasT ? 0.4 : 0.5), es);
      if (hasT) text(ctx, it.text, r.x + r.w / 2, r.y + r.h * (it.e || it.draw ? 0.82 : 0.5), { size: it.e || it.draw ? Math.min(18, r.h * 0.15) : Math.min(28, r.h * 0.28), max: r.w - 12 });
      if (it.say && w.speakIcon !== false) text(ctx, '🔊', r.x + r.w - 16, r.y + 16, { size: 14 });
    });
  };
  w.down = (x, y) => { const i = w.rects.findIndex(r => inBox(x, y, r)); if (i >= 0) { w.sel = i; Sfx.click(); say(w.api, items[i].say || items[i].text); } };
  return w;
}

// ---------------------------------------------------------------- coins and bills: tap to drop in, tap to take out
export function coinTray(kinds, { showValues = true, showTotal = true, header = '', start = [], cap = 16, art = null } = {}) {
  const w = { pieces: start.slice(), kinds, maxH: 560 }; let pal = [], placed = [];
  w.value = () => ({ pieces: w.pieces.slice(), cents: cents(w.pieces) });
  w.draw = (ctx, b) => {
    let y0 = b.y;
    if (header && !w.compact) { text(ctx, header, b.x + b.w / 2, y0 + 16, { size: 20, max: b.w - 20 }); y0 += 40; }
    if (art) { const ah = 90; art(ctx, { x: b.x, y: y0, w: b.w, h: ah }); y0 += ah + 6; }
    const palH = Math.min(110, b.h * 0.3), slotH = b.y + b.h - y0 - palH - 10;
    // the slot (piggy bank / counter / ride slot)
    ctx.fillStyle = '#f3efe2'; ctx.strokeStyle = '#d8cfb4'; ctx.lineWidth = 3; roundRect(ctx, b.x, y0, b.w, slotH, 16); ctx.fill(); ctx.stroke();
    if (!w.pieces.length) text(ctx, '👇 Tap money below to put it here', b.x + b.w / 2, y0 + slotH / 2, { size: 16, color: '#8a7f63' });
    const r = Math.min(30, slotH / 4.2), per = Math.max(1, Math.floor((b.w - 20) / (r * 2.7)));
    const sorted = w.pieces.map((k, i) => [k, i]).sort((a, c) => MONEY[c[0]].cents - MONEY[a[0]].cents);
    placed = sorted.map(([k, i], j) => { const isBill = MONEY[k].kind === 'bill', cx = b.x + 14 + r * 1.35 + (j % per) * r * 2.7, cy = y0 + r * 1.3 + Math.floor(j / per) * r * 2.3; drawMoney(ctx, k, cx, cy, isBill ? r * 0.9 : r, { value: showValues }); return { i, x: cx, y: cy, r: isBill ? r * 1.2 : r }; });
    if (showTotal) label(ctx, `Total: ${moneyText(cents(w.pieces))}`, b.x + b.w - 70, y0 + slotH - 18, { size: 16, bg: 'rgba(43,35,80,.85)' });
    // the palette
    const py = y0 + slotH + 10 + palH / 2, gap = b.w / kinds.length, pr = Math.min(palH * 0.36, gap * 0.3);
    pal = kinds.map((k, i) => { const cx = b.x + gap * (i + 0.5); ctx.fillStyle = '#fff'; roundRect(ctx, cx - gap / 2 + 4, py - palH / 2, gap - 8, palH, 14); ctx.fill(); drawMoney(ctx, k, cx, py - 8, MONEY[k].kind === 'bill' ? pr * 0.85 : pr, { value: showValues }); text(ctx, MONEY[k].kind === 'bill' ? '$' + MONEY[k].label : MONEY[k].name, cx, py + palH / 2 - 14, { size: 12, color: '#6b6380' }); return { k, x: cx - gap / 2, y: py - palH / 2, w: gap, h: palH }; });
  };
  w.down = (x, y) => {
    const p = pal.find(q => inBox(x, y, q));
    if (p) { if (w.pieces.length >= cap) return; w.pieces.push(p.k); Sfx.coin ? Sfx.coin() : Sfx.click(); say(w.api, MONEY[p.k].name); return; }
    const q = placed.find(z => Math.hypot(z.x - x, z.y - y) < z.r + 4);
    if (q) { w.pieces.splice(q.i, 1); Sfx.click(); }
  };
  return w;
}

// ---------------------------------------------------------------- a clock with hands you drag (geared like a real clock)
export function handClock({ minutes = 0, snap = 5, header = '', digital = false, hint = null, ampm = false, ticket = null } = {}) {
  const w = { min: ((minutes % 720) + 720) % 720, drag: null, c: null, maxH: 600, half: null, apR: [] };
  w.value = () => (ampm ? { min: w.min, half: w.half } : w.min);
  w.draw = (ctx, b) => {
    let y0 = b.y;
    if (header && !w.compact) { text(ctx, header, b.x + b.w / 2, y0 + 16, { size: 20, max: b.w - 20 }); y0 += 40; }
    if (ticket) { ticket(ctx, { x: b.x, y: y0, w: b.w, h: 56 }); y0 += 62; }
    const apH = ampm ? 62 : 0;
    const r = Math.min(b.w * 0.4, (b.y + b.h - y0 - apH) / 2 - (digital ? 22 : 8));
    w.c = { x: b.x + b.w / 2, y: y0 + r + 6, r };
    if (ampm) {
      const by = w.c.y + r + (digital ? 34 : 14), bw = Math.min(150, b.w * 0.4);
      w.apR = [['AM', '🌅'], ['PM', '🌙']].map(([t, e], i) => ({ t, e, x: b.x + b.w / 2 + (i ? 8 : -bw - 8), y: by, w: bw, h: 46 }));
      w.apR.forEach(q => { const on = w.half === q.t; ctx.fillStyle = on ? '#fff1c2' : '#fff'; ctx.strokeStyle = on ? '#ffb000' : '#e2deef'; ctx.lineWidth = 3; roundRect(ctx, q.x, q.y, q.w, q.h, 14); ctx.fill(); ctx.stroke(); text(ctx, `${q.e} ${q.t}`, q.x + q.w / 2, q.y + q.h / 2, { size: 18 }); });
    }
    if (hint) hint(ctx, w.c);
    clockFace(ctx, w.c.x, w.c.y, r, w.min);
    // handle dots on the tips so kids know what to grab
    const hA = (w.min / 720) * Math.PI * 2, mA = ((w.min % 60) / 60) * Math.PI * 2;
    [[mA, r * 0.72, '#2f7de1'], [hA, r * 0.48, '#e5484d']].forEach(([a, l, c]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(w.c.x + Math.sin(a) * l, w.c.y - Math.cos(a) * l, Math.max(9, r * 0.07), 0, 7); ctx.fill(); });
    if (digital) { const h = Math.floor(w.min / 60) || 12, m = w.min % 60; label(ctx, `${h}:${String(m).padStart(2, '0')}`, w.c.x, w.c.y + r + 22, { size: 18, bg: INK }); }
  };
  const ang = (x, y) => { let a = Math.atan2(x - w.c.x, -(y - w.c.y)); if (a < 0) a += Math.PI * 2; return a; };
  w.down = (x, y) => {
    const ap = w.apR.find(q => inBox(x, y, q)); if (ap) { w.half = ap.t; Sfx.click(); return; }
    if (!w.c || Math.hypot(x - w.c.x, y - w.c.y) > w.c.r * 1.25) return;
    const hA = (w.min / 720) * Math.PI * 2, mA = ((w.min % 60) / 60) * Math.PI * 2, a = ang(x, y), d = Math.hypot(x - w.c.x, y - w.c.y);
    const diff = (p, q) => Math.abs(Math.atan2(Math.sin(p - q), Math.cos(p - q)));
    w.drag = d < w.c.r * 0.55 && diff(a, hA) < diff(a, mA) + 0.4 ? 'h' : 'm';
    w.move(x, y);
  };
  w.move = (x, y) => {
    if (!w.drag || !w.c) return;
    const a = ang(x, y);
    if (w.drag === 'm') {
      let m = Math.round((a / (Math.PI * 2)) * 60 / snap) * snap % 60;
      const old = w.min % 60; let h = Math.floor(w.min / 60);
      if (old >= 45 && m < 15) h++; else if (old < 15 && m >= 45) h--;
      w.min = (((h * 60 + m) % 720) + 720) % 720;
    } else {
      const h = Math.floor((a / (Math.PI * 2)) * 12) % 12;
      w.min = h * 60 + (w.min % 60);
    }
  };
  w.up = () => { if (w.drag) Sfx.click(); w.drag = null; };
  // arrow keys nudge the minute hand
  w.update = (dt, input) => { if (input.pressed('right') || input.pressed('up')) w.min = (w.min + snap) % 720; if (input.pressed('left') || input.pressed('down')) w.min = (w.min + 720 - snap) % 720; };
  return w;
}

// ---------------------------------------------------------------- put cards in order (drag, or tap two to swap)
export function orderCards(cards, { header = '', leftLabel = 'First', rightLabel = 'Last' } = {}) {
  const w = { order: cards.map((_, i) => i), rects: [], drag: null, sel: -1, maxH: 420 };
  w.value = () => w.order.slice();
  w.draw = (ctx, b) => {
    let y0 = b.y;
    if (header && !w.compact) { text(ctx, header, b.x + b.w / 2, y0 + 16, { size: 20, max: b.w - 20 }); y0 += 40; }
    const n = cards.length, two = b.w / n < 90, per = two ? Math.ceil(n / 2) : n, gap = 8, cw = (b.w - gap * (per - 1)) / per, ch = Math.min(150, (b.y + b.h - y0 - 30) / (two ? 2 : 1) - gap);
    w.rects = w.order.map((_, j) => ({ x: b.x + (j % per) * (cw + gap), y: y0 + Math.floor(j / per) * (ch + gap), w: cw, h: ch }));
    w.order.forEach((ci, j) => {
      const r = w.rects[j]; if (w.drag && w.drag.ci === ci) return;
      drawCard(ctx, cards[ci], r, j === w.sel); text(ctx, String(j + 1), r.x + 14, r.y + 14, { size: 13, color: '#9a90b5' });
    });
    if (w.drag) drawCard(ctx, cards[w.drag.ci], { x: w.drag.x - w.drag.w / 2, y: w.drag.y - w.drag.h / 2, w: w.drag.w, h: w.drag.h }, true);
    text(ctx, `⬅ ${leftLabel}`, b.x + 40, b.y + b.h - 10, { size: 13, color: '#8a7f9f' }); text(ctx, `${rightLabel} ➡`, b.x + b.w - 40, b.y + b.h - 10, { size: 13, color: '#8a7f9f' });
  };
  const drawCard = (ctx, c, r, on) => {
    ctx.fillStyle = on ? '#fff1c2' : '#fff'; ctx.strokeStyle = on ? '#ffb000' : '#e2deef'; ctx.lineWidth = 3; roundRect(ctx, r.x, r.y, r.w, r.h, 14); ctx.fill(); ctx.stroke();
    if (c.e) emoji(ctx, c.e, r.x + r.w / 2, r.y + r.h * (c.text ? 0.4 : 0.5), Math.min(r.w * 0.55, r.h * 0.45));
    if (c.text) text(ctx, c.text, r.x + r.w / 2, r.y + r.h * (c.e ? 0.82 : 0.5), { size: Math.min(15, r.w / 6), max: r.w - 8 });
  };
  const at = (x, y) => w.rects.findIndex(r => inBox(x, y, r));
  w.down = (x, y) => { const j = at(x, y); if (j < 0) return; const r = w.rects[j]; w.drag = { ci: w.order[j], from: j, x, y, w: r.w, h: r.h, moved: false }; say(w.api, cards[w.order[j]].say || cards[w.order[j]].text); };
  w.move = (x, y) => { if (w.drag) { if (Math.hypot(x - w.drag.x, y - w.drag.y) > 6) w.drag.moved = true; w.drag.x = x; w.drag.y = y; } };
  w.up = (x, y) => {
    if (!w.drag) return; const d = w.drag; w.drag = null;
    if (!d.moved) { if (w.sel < 0) w.sel = d.from; else { const a = w.sel; [w.order[a], w.order[d.from]] = [w.order[d.from], w.order[a]]; w.sel = -1; Sfx.click(); } return; }
    let j = at(x, y); if (j < 0) j = w.rects.reduce((best, r, k) => { const dd = Math.hypot(r.x + r.w / 2 - x, r.y + r.h / 2 - y); return dd < best[0] ? [dd, k] : best; }, [1e9, d.from])[1];
    w.order.splice(d.from, 1); w.order.splice(j, 0, d.ci); w.sel = -1; Sfx.click();
  };
  return w;
}

// ---------------------------------------------------------------- sort things into bins (drag, or tap the thing then the bin)
export function sortBins(items, bins, { header = '' } = {}) {
  const w = { where: items.map(() => -1), sel: -1, ir: [], br: [], drag: null, maxH: 560 };
  w.value = () => w.where.slice();
  w.draw = (ctx, b) => {
    let y0 = b.y;
    if (header && !w.compact) { text(ctx, header, b.x + b.w / 2, y0 + 16, { size: 20, max: b.w - 20 }); y0 += 40; }
    const binH = Math.min(190, (b.y + b.h - y0) * 0.52), poolH = b.y + b.h - y0 - binH - 10;
    const loose = items.map((_, i) => i).filter(i => w.where[i] < 0), n = Math.max(1, loose.length), s = Math.min(70, poolH * 0.8, (b.w - 10) / n - 6);
    w.ir = [];
    loose.forEach((i, j) => { const x = b.x + b.w / 2 + (j - (n - 1) / 2) * (s + 6), y = y0 + poolH / 2; w.ir.push({ i, x, y, s }); });
    const bw = (b.w - 10 * (bins.length - 1)) / bins.length;
    w.br = bins.map((bn, k) => ({ x: b.x + k * (bw + 10), y: y0 + poolH + 10, w: bw, h: binH }));
    w.br.forEach((r, k) => {
      ctx.fillStyle = bins[k].color || '#eef6ff'; ctx.strokeStyle = '#c9d6ea'; ctx.lineWidth = 3; roundRect(ctx, r.x, r.y, r.w, r.h, 16); ctx.fill(); ctx.stroke();
      if (bins[k].e) emoji(ctx, bins[k].e, r.x + 26, r.y + 24, 26);
      text(ctx, bins[k].text || '', r.x + r.w / 2 + (bins[k].e ? 12 : 0), r.y + 24, { size: 15, max: r.w - 60 });
      const inside = items.map((_, i) => i).filter(i => w.where[i] === k), per = Math.max(1, Math.floor((r.w - 10) / 44));
      inside.forEach((i, j) => { const x = r.x + 26 + (j % per) * 44, y = r.y + 64 + Math.floor(j / per) * 44; drawItem(ctx, items[i], x, y, 38); w.ir.push({ i, x, y, s: 38 }); });
    });
    w.ir.forEach(o => { if (w.where[o.i] < 0 && (!w.drag || w.drag.i !== o.i)) { if (o.i === w.sel) { ctx.fillStyle = '#fff1c2'; ctx.beginPath(); ctx.arc(o.x, o.y, o.s * 0.62, 0, 7); ctx.fill(); } drawItem(ctx, items[o.i], o.x, o.y, o.s); } });
    if (w.drag && w.drag.moved) drawItem(ctx, items[w.drag.i], w.drag.x, w.drag.y, 64);
  };
  const drawItem = (ctx, it, x, y, s) => { if (it.draw) it.draw(ctx, x, y, s); else if (it.e) emoji(ctx, it.e, x, y, s * 0.85); if (it.text && s > 50) text(ctx, it.text, x, y + s * 0.62, { size: 12 }); };
  const binAt = (x, y) => w.br.findIndex(r => inBox(x, y, r));
  w.down = (x, y) => {
    const o = w.ir.find(q => Math.hypot(q.x - x, q.y - y) < q.s * 0.6);
    if (o) { w.drag = { i: o.i, x, y, sx: x, sy: y, moved: false }; say(w.api, items[o.i].say || items[o.i].text); return; }
    const k = binAt(x, y); if (k >= 0 && w.sel >= 0) { w.where[w.sel] = k; w.sel = -1; Sfx.click(); }
  };
  w.move = (x, y) => { if (w.drag) { if (Math.hypot(x - w.drag.sx, y - w.drag.sy) > 8) w.drag.moved = true; w.drag.x = x; w.drag.y = y; } };
  w.up = (x, y) => {
    if (!w.drag) return; const d = w.drag; w.drag = null;
    if (!d.moved) { if (w.where[d.i] >= 0) { w.where[d.i] = -1; } else w.sel = d.i; return; }
    const k = binAt(x, y); if (k >= 0) { w.where[d.i] = k; w.sel = -1; Sfx.click(); } else w.where[d.i] = -1;
  };
  return w;
}

// ---------------------------------------------------------------- big number pad
export function keypad({ header = '', prefix = '', suffix = '', digits = 4, art = null, decimal = false } = {}) {
  const w = { s: '', keys: [], maxH: 560 };
  w.value = () => (w.s === '' || w.s === '.' ? null : Number(w.s));
  w.draw = (ctx, b) => {
    let y0 = b.y;
    if (header && !w.compact) { text(ctx, header, b.x + b.w / 2, y0 + 16, { size: 20, max: b.w - 20 }); y0 += 40; }
    const sh = b.h < 330;
    if (art) { const ah = Math.min(150, b.h * (sh ? 0.24 : 0.3)); art(ctx, { x: b.x, y: y0, w: b.w, h: ah }); y0 += ah + 6; }
    const dh = sh ? 40 : 54;
    ctx.fillStyle = '#f3efe2'; roundRect(ctx, b.x + b.w * 0.2, y0, b.w * 0.6, dh, 14); ctx.fill();
    text(ctx, `${prefix}${w.s || '?'}${suffix}`, b.x + b.w / 2, y0 + dh / 2, { size: sh ? 24 : 30, color: w.s ? INK : '#b9b2a0' });
    y0 += dh + 10;
    const room = b.y + b.h - y0, wide = room < 230;
    const labels = wide ? ['1', '2', '3', '4', '5', '⌫', '6', '7', '8', '9', '0', decimal ? '.' : ''] : ['1', '2', '3', '4', '5', '6', '7', '8', '9', decimal ? '.' : '', '0', '⌫'];
    const c = wide ? 6 : 3, rows = wide ? 2 : 4, kw = Math.min(110, (b.w - 10 * (c - 1)) / c), kh = Math.min(64, (room - 8 * rows) / rows), x0 = b.x + (b.w - kw * c - 10 * (c - 1)) / 2;
    w.keys = labels.map((t, i) => ({ t, x: x0 + (i % c) * (kw + 10), y: y0 + Math.floor(i / c) * (kh + 8), w: kw, h: kh }));
    w.keys.forEach(k => { if (!k.t) return; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#e2deef'; ctx.lineWidth = 3; roundRect(ctx, k.x, k.y, k.w, k.h, 14); ctx.fill(); ctx.stroke(); text(ctx, k.t, k.x + k.w / 2, k.y + k.h / 2, { size: 26 }); });
  };
  const press = t => { if (t === '⌫') w.s = w.s.slice(0, -1); else if (t && w.s.replace('.', '').length < digits && !(t === '.' && w.s.includes('.'))) w.s += t; Sfx.click(); };
  w.down = (x, y) => { const k = w.keys.find(q => q.t && inBox(x, y, q)); if (k) press(k.t); };
  w.update = (dt, input) => { for (let d = 0; d <= 9; d++) if (input.pressed('n' + d)) press(String(d)); if (input.pressed('back')) press('⌫'); };
  return w;
}

// ---------------------------------------------------------------- slide along a number line / time line
export function slider({ min = 0, max = 10, step = 1, value = null, header = '', fmt = v => String(v), tickFmt = null, ticks = 1, art = null, artH = 120, arcFrom = null, arcText = null } = {}) {
  const w = { v: value ?? min, line: null, drag: false, maxH: art ? Math.min(600, 270 + artH) : 330, arc: !!arcText };
  w.value = () => w.v;
  w.draw = (ctx, b) => {
    let y0 = b.y;
    if (header && !w.compact) { text(ctx, header, b.x + b.w / 2, y0 + 16, { size: 20, max: b.w - 20 }); y0 += 40; }
    if (art) { const ah = Math.max(60, Math.min(artH, b.y + b.h - y0 - 130)); art(ctx, { x: b.x, y: y0, w: b.w, h: ah }, w.v); y0 += ah + 6; }
    const x1 = b.x + 30, x2 = b.x + b.w - 30, y = y0 + 70; w.line = { x1, x2, y };
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    for (let v = Math.ceil(min / ticks - 1e-9) * ticks; v <= max + 1e-9; v += ticks) { const x = x1 + (v - min) / (max - min) * (x2 - x1), t = (tickFmt || fmt)(v); ctx.lineWidth = t ? 3 : 2; ctx.beginPath(); ctx.moveTo(x, y - (t ? 10 : 6)); ctx.lineTo(x, y + (t ? 10 : 6)); ctx.stroke(); if (t) text(ctx, t, x, y + 28, { size: 13 }); }
    const kx = x1 + (w.v - min) / (max - min) * (x2 - x1);
    if (w.arc && arcFrom != null && w.v !== arcFrom) { const ax = x1 + (arcFrom - min) / (max - min) * (x2 - x1), hgt = Math.min(46, 14 + Math.abs(kx - ax) / 5); ctx.strokeStyle = '#f2a20c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ax, y - 6); ctx.quadraticCurveTo((ax + kx) / 2, y - 6 - hgt * 1.6, kx, y - 6); ctx.stroke(); label(ctx, arcText(w.v), (ax + kx) / 2, y - 6 - hgt * 0.9, { size: 13, bg: '#a86e00' }); }
    ctx.fillStyle = '#ff9d3d'; ctx.beginPath(); ctx.arc(kx, y, 18, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
    label(ctx, fmt(w.v), kx, y + 52, { size: 18, bg: INK });
  };
  const set = x => { const L = w.line; if (!L) return; const v = min + clamp((x - L.x1) / (L.x2 - L.x1), 0, 1) * (max - min); w.v = clamp(Math.round(v / step) * step, min, max); };
  w.down = (x, y) => { if (w.line && Math.abs(y - w.line.y) < 60) { w.drag = true; set(x); } };
  w.move = x => { if (w.drag) set(x); };
  w.up = () => { if (w.drag) Sfx.click(); w.drag = false; };
  w.update = (dt, input) => { if (input.pressed('right')) w.v = Math.min(max, w.v + step); if (input.pressed('left')) w.v = Math.max(min, w.v - step); };
  return w;
}
export { text as drawText, inBox };

/** Pick the best hands-on answer for a fact question: numbers get the number pad, words get picture/word tiles.
 *  q = { ans, opts }. Returns { w, check(v) → true/false/null, given(v) }. */
export function answerFor(q, { art = null, cols = 1 } = {}) {
  const num = s => String(s).match(/^(\$)?(\d[\d,]*(?:\.\d+)?)(%|¢)?(?: ([A-Za-z][A-Za-z ]*))?$/);
  const m = num(q.ans);
  if (m && (q.opts || []).every(o => num(o))) {
    const n = Number(m[2].replace(/,/g, '')), w = keypad({ prefix: m[1] || '', suffix: (m[3] || '') + (m[4] ? ' ' + m[4] : ''), decimal: m[2].includes('.'), digits: 6, art });
    return { w, check: v => (v == null ? null : Math.abs(v - n) < 1e-9), given: v => `${m[1] || ''}${v}${m[3] || ''}${m[4] ? ' ' + m[4] : ''}` };
  }
  const opts = q.opts || [q.ans];
  const w = tiles(opts.map(o => (typeof o === 'object' ? o : { text: o, say: o })), { cols: opts.some(o => String(o.text || o).length > 14) ? cols : 0, art });
  return { w, check: v => (v < 0 ? null : (opts[v].text || opts[v]) === (q.ans.text || q.ans)), given: v => (v < 0 ? '' : String(opts[v].text || opts[v])) };
}

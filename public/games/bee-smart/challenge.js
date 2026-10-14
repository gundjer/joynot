// Bee Smart flower challenges. Kids RECALL answers (type the number, find the letter on the full A–Z board,
// spell with sound boxes, build words from parts, put words in order). No 3-choice picking.
// Teaching stages: 'demo' (I do: the ghost bee shows one), 'we' (We do: hints, smaller board, models, counting out loud),
// 'you' (You do: on your own). Wrong answers never cost hearts: instant coaching, a glow after 2 misses on a step,
// and "let's do it together" after 3.
import { clamp, rand, shuffle, emoji, roundRect, Sfx } from '../_play/play.js';
import { SOUNDS } from './skills.js';

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const INK = '#2b2350', PAPER = '#fffdf3', HONEY = '#f5b301', HONEY_D = '#b37d00', GOOD = '#2fae66', BAD = '#e5484d';
const strip = s => String(s || '').replace(/<[^>]+>/g, '');
const font = (px, w = 700) => `${w} ${Math.round(px)}px Fredoka, Andika, system-ui, sans-serif`;

export function wrap(ctx, text, maxW) {
  const words = strip(text).split(/\s+/), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}

/**
 * Open a challenge.
 * item: from skills.js. o: { stage: 'demo'|'we'|'you', flower: '🌸', boss, onDone(result) }
 * result: { demo, correct, firstTry, helped, given }
 */
export function makeChallenge(api, item, o) {
  const C = {
    item, stage: o.stage, t: 0, hits: [], mistakes: 0, stepMiss: 0, helped: false, given: '', done: false, doneT: 0,
    shake: null, glow: null, msg: '', msgT: 0, typed: '', fill: [], ghost: null, demoT: 0.9, flyers: [],
  };
  const we = () => C.stage !== 'you';
  const K = item.type;

  // ------------------------------------------------ setup per type
  if (K === 'board') {
    C.ansIdx = 0;
    C.slotIdx = item.slots.map((s, i) => (s.fixed ? -1 : i)).filter(i => i >= 0);
    C.filled = item.slots.map(s => s.fixed || '');
    const all = item.board === 'chunks' ? item.chunks : item.board === 'lower' ? ABC.map(c => c.toLowerCase()) : ABC;
    C.tiles = all.map(v => ({ v, on: true }));
    if (we() && item.board !== 'chunks') {
      // We do: a smaller board (the answer letters plus a few others); the rest rest quietly
      const keep = new Set(item.ans.concat(shuffle(all.filter(v => !item.ans.includes(v))).slice(0, Math.max(3, 6 - new Set(item.ans).size))));
      C.tiles.forEach(t => { t.on = keep.has(t.v); });
    }
  } else if (K === 'order') {
    C.cards = item.words.map(w => ({ w, used: false }));
    C.picked = [];
  } else {
    // number
    C.model = item.model || {};
    C.showModel = item.tap || C.model.kind === 'deal' || we() || item.lvl <= 4;
    if (item.tap) { const n = C.model.n; C.grains = Array.from({ length: n }, (_, i) => ({ i, rx: 0, ry: 0, got: false })); C.got = 0; seedGrains(C.grains); }
    if (C.model.kind === 'deal') { C.pile = C.model.n; C.dealt = Array(C.model.g).fill(0); }
  }

  function seedGrains(gs) {
    // spread grains over a 0..1 box without overlaps
    const pts = [];
    for (const g of gs) {
      let best = null;
      for (let k = 0; k < 40; k++) { const p = [0.06 + Math.random() * 0.88, 0.1 + Math.random() * 0.8]; const d = Math.min(9, ...pts.map(q => Math.hypot(q[0] - p[0], (q[1] - p[1]) * 0.7))); if (!best || d > best.d) best = { p, d }; }
      pts.push(best.p); g.rx = best.p[0]; g.ry = best.p[1];
    }
  }

  // ------------------------------------------------ talking
  const sayItem = () => api.speak(item.say || strip(item.show));
  const toast = (m, ms = 2.6) => { C.msg = m; C.msgT = ms; };
  const ready = () => !item.tap || C.got >= C.grains.length;

  // ------------------------------------------------ answers
  function expected() {
    if (K === 'board') return item.ans[C.ansIdx];
    if (K === 'order') return item.ans[C.picked.length];
    return item.ans;
  }
  function miss(given, hint) {
    if (!C.given) C.given = String(given);
    C.mistakes++; C.stepMiss++;
    Sfx.drop();
    if (navigator.vibrate) try { navigator.vibrate(40); } catch (e) {}
    if (C.stepMiss >= 3) { C.helped = true; toast('🤝 Let’s do it together!'); api.speak('Let’s do it together.'); doNext(true); return; }
    if (C.stepMiss >= 2) { C.helped = true; C.glow = nextAction(); }
    toast(hint, 3.2); api.speak(hint);
  }
  function stepOk() { C.stepMiss = 0; C.glow = null; }

  function tapTile(t, auto) {
    if (C.done || !t.on) return;
    const want = expected();
    if (t.v === want) {
      Sfx.pop(); stepOk();
      const si = C.slotIdx[C.ansIdx]; C.filled[si] = t.v; C.ansIdx++;
      if (item.spell && item.sounds && we()) api.speak(SOUNDS[t.v.toUpperCase()] || t.v); else api.speak(t.v.length > 1 ? t.v : t.v.toUpperCase());
      if (item.spell && item.sounds && we() && C.ansIdx < item.ans.length && !auto) setTimeout(() => !C.done && api.speak(`Next sound: ${SOUNDS[item.ans[C.ansIdx].toUpperCase()]}`), 700);
      if (C.ansIdx >= item.ans.length) win(item.word || item.ans.join(''));
      return;
    }
    C.shake = { v: t.v, t: 0.45 };
    let hint;
    if (item.board === 'chunks') hint = item.hintText ? `Not that part. ${item.hintText}.` : `Not “${t.v}”. Think about what the word ${strip(item.show).replace(/^Build a word that /i, '')}.`;
    else if (item.spell) hint = `That’s ${t.v}. ${we() && item.sounds ? `Listen: ${SOUNDS[want.toUpperCase()]}.` : `Say the word slowly: ${item.word}.`}`;
    else if (item.lvl === 3) hint = `${t.v.toUpperCase()} says ${SOUNDS[t.v.toUpperCase()]}. We need ${SOUNDS[want.toUpperCase()]}.`;
    else if (item.lvl === 2) { const i = ABC.indexOf(want); hint = `That’s ${t.v}. What comes after ${ABC[i - 1] || 'the start'}?`; }
    else hint = `That’s ${t.v}. Find ${want}.`;
    miss(t.v, hint);
  }
  function tapCard(c) {
    if (C.done || c.used) return;
    const want = expected();
    if (c.w === want) { Sfx.pop(); stepOk(); c.used = true; C.picked.push(c.w); api.speak(c.w); if (C.picked.length >= item.ans.length) win(item.ans.join(', ')); return; }
    C.shake = { v: c.w, t: 0.45 };
    const rest = C.cards.filter(x => !x.used).map(x => x.w);
    const same = want[0] === c.w[0];
    miss(c.w, same ? `${c.w} and ${want} both start with ${want[0]}. Look at the next letter.` : `Look at the first letters. Which comes first in the ABC: ${rest.map(w => w[0]).join(', ')}?`);
  }
  function key(k) {
    if (C.done || K !== 'num') return;
    if (!ready()) { toast('🌼 Collect all the pollen first!'); return; }
    if (k === 'back') { C.typed = C.typed.slice(0, -1); Sfx.click(); return; }
    if (k === 'ok') { check(); return; }
    if (k === 'R') { if (item.rem && !/R/.test(C.typed) && C.typed) C.typed += 'R'; return; }
    if (/^\d$/.test(k) && C.typed.replace('R', '').length < 6) { C.typed += k; Sfx.click(); }
  }
  function check() {
    if (!C.typed) { toast('Type your answer with the number pad.'); return; }
    const norm = s => String(s).replace(/\s+/g, '').toUpperCase();
    if (norm(C.typed) === norm(item.ans)) { win(C.typed); return; }
    const g = C.typed; C.typed = '';
    const wasHidden = !C.showModel; C.showModel = true;
    let hint = 'Not quite. Try again!';
    if (C.stepMiss === 0 && wasHidden) hint = 'Not quite. Here is a picture to help.';
    else if (C.stepMiss >= 1) hint = `Not quite. ${item.why.split('.').slice(0, 1).join('.').replace(/\d+$/, '').replace(/= \d+$/, '= ?')}`;
    if (item.tap && C.stepMiss === 0) hint = `Not quite. Count them again: point to each one and say a number.`;
    if (Number(g) > 0 && !item.rem && Number(item.ans) > 0) hint += Number(g) > Number(item.ans) ? ' Your answer is too big.' : ' Your answer is too small.';
    miss(g, hint);
  }
  function grainTap(g) {
    if (C.done || g.got) return;
    g.got = true; C.got++; Sfx.pop();
    if (we()) api.speak(String(C.got));
    if (C.got === C.grains.length) { setTimeout(() => !C.done && api.speak('How many pollen did you collect? Type the number.'), 600); }
  }
  function deal() {
    if (C.done || C.pile < C.model.g) { toast(C.pile ? `Only ${C.pile} left: not enough for everyone. That's the leftover!` : 'All shared!'); return; }
    C.pile -= C.model.g; C.dealt = C.dealt.map(v => v + 1); Sfx.pop();
    if (we()) api.speak(`${C.dealt[0]} each`);
  }

  function win(given) {
    if (C.done) return;
    C.done = true; C.doneT = 0; if (!C.given) C.given = String(given);
    Sfx.correct();
    if (C.stage !== 'demo') api.speak(`Yes! ${item.why}`);
  }

  // ------------------------------------------------ the "do it for me" step (demo, together, coach glow, tests)
  function nextAction() {
    if (C.done) return null;
    if (K === 'board') { const w = expected(), t = C.tiles.find(x => x.v === w); return t && t.r ? { r: t.r, run: () => tapTile(t, true) } : null; }
    if (K === 'order') { const w = expected(), c = C.cards.find(x => x.w === w && !x.used); return c && c.r ? { r: c.r, run: () => tapCard(c) } : null; }
    if (item.tap && C.got < C.grains.length) { const g = C.grains.find(x => !x.got); return g && g.r ? { r: g.r, run: () => grainTap(g) } : null; }
    if (C.model.kind === 'deal' && C.showModel && C.pile >= C.model.g && C.dealBtn) return { r: C.dealBtn, run: deal };
    const want = String(item.ans).replace(/\s+/g, '');
    if (C.typed && !want.startsWith(C.typed)) return C.keys && C.keys.back ? { r: C.keys.back, run: () => key('back') } : null;
    if (C.typed === want) return C.keys && C.keys.ok ? { r: C.keys.ok, run: () => key('ok') } : null;
    const ch = want[C.typed.length];
    return C.keys && C.keys[ch] ? { r: C.keys[ch], run: () => key(ch) } : null;
  }
  function doNext(slow) {
    const a = nextAction(); if (!a) return;
    if (slow) { C.ghost = { x: a.r.x + a.r.w / 2, y: a.r.y + a.r.h / 2, t: 0.6, run: a.run, auto: true }; return; }
    a.run();
  }

  // ------------------------------------------------ update
  function update(dt) {
    C.t += dt;
    if (C.shake) { C.shake.t -= dt; if (C.shake.t <= 0) C.shake = null; }
    if (C.msgT > 0) C.msgT -= dt;
    if (C.ghost) {
      C.ghost.t -= dt;
      if (C.ghost.t <= 0) { const g = C.ghost; C.ghost = null; g.run(); if (g.auto && C.stage !== 'demo' && !C.done && C.stepMiss >= 3) doNext(true); }
    }
    if (C.stage === 'demo' && !C.done && !C.ghost) {
      C.demoT -= dt;
      if (C.demoT <= 0) { C.demoT = item.tap ? 0.55 : 1.15; const a = nextAction(); if (a) C.ghost = { x: a.r.x + a.r.w / 2, y: a.r.y + a.r.h / 2, t: 0.5, run: a.run }; }
    }
    // after "together" finishes a step, keep going until the step resolves
    if (C.done) { C.doneT += dt; if (C.doneT > (C.stage === 'demo' ? 1.4 : 1.9) && !C.closed) { C.closed = true; o.onDone({ demo: C.stage === 'demo', correct: true, firstTry: C.mistakes === 0, helped: C.helped, given: C.given }); } }
  }

  // ------------------------------------------------ draw
  function draw(ctx, W, H, top) {
    C.hits = [];
    const short = H < 520, pw = Math.min(W - 12, 820), px = (W - pw) / 2, avail = H - top - 10, ph = Math.min(avail, 660), py = top + 4 + (avail - ph) / 2;
    // dim the field behind
    ctx.fillStyle = 'rgba(30,20,0,.45)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = PAPER; roundRect(ctx, px, py, pw, ph, 18); ctx.fill();
    ctx.strokeStyle = HONEY; ctx.lineWidth = 4; ctx.stroke();
    // header
    const hs = short ? 17 : W < 500 ? 18 : 22;
    let y = py + 10;
    emoji(ctx, o.flower || '🌼', px + 26, y + 18, 34);
    const stageTag = C.stage === 'demo' ? '👀 Watch me first!' : C.stage === 'we' ? '🤝 Let’s do it together' : o.boss ? '🎓 Grade Boss' : '⭐ Your turn';
    ctx.font = font(13); ctx.fillStyle = HONEY_D; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(stageTag, px + 50, y);
    ctx.font = font(hs); ctx.fillStyle = INK;
    const btnW = 44, nb = item.sentence ? 3 : 1, textW = pw - 60 - nb * (btnW + 6) - 10;
    const lines = wrap(ctx, item.show, textW).slice(0, 3);
    lines.forEach((l, i) => ctx.fillText(l, px + 50, y + 16 + i * (hs + 4)));
    // buttons: 🔊 (+ 📖 sentence, ❓ meaning for spelling bee words)
    const btns = [['🔊', sayItem]];
    if (item.sentence) btns.push(['📖', () => api.speak(item.sentence)], ['❓', () => api.speak(`${item.word} means ${item.meaning}.`)]);
    btns.forEach(([ic, fn], i) => { const r = { x: px + pw - (btns.length - i) * (btnW + 6) - 4, y: y, w: btnW, h: btnW }; button(ctx, r, ic, '#fff3c4'); C.hits.push({ r, fn }); });
    y += Math.max(btnW, 16 + lines.length * (hs + 4)) + 8;
    const body = { x: px + 12, y, w: pw - 24, h: py + ph - y - 10 };
    if (K === 'board') drawBoard(ctx, body, short);
    else if (K === 'order') drawOrder(ctx, body, short);
    else drawNum(ctx, body, short, W);
    // message line
    if (C.msgT > 0 && C.msg) {
      ctx.font = font(short ? 14 : 16); const ls = wrap(ctx, C.msg, pw - 60).slice(0, 2), mh = ls.length * 20 + 14, my = py + ph - mh - 8;
      ctx.fillStyle = 'rgba(43,35,80,.92)'; roundRect(ctx, px + 20, my, pw - 40, mh, 12); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ls.forEach((l, i) => ctx.fillText(l, px + pw / 2, my + 8 + i * 20));
    }
    // ghost pointer (I do / together / coach)
    if (C.ghost) { const g = C.ghost; emoji(ctx, '👆', g.x + 8, g.y + 18 + Math.sin(C.t * 10) * 3, 40); }
    if (C.glow && !C.ghost && C.glow.r) { const r = C.glow.r; ctx.strokeStyle = `rgba(47,174,102,${0.5 + 0.5 * Math.sin(C.t * 8)})`; ctx.lineWidth = 5; roundRect(ctx, r.x - 4, r.y - 4, r.w + 8, r.h + 8, 12); ctx.stroke(); }
    if (C.done) {
      const a = clamp(C.doneT * 3, 0, 1);
      ctx.fillStyle = `rgba(47,174,102,${0.88 * a})`; const bw = Math.min(pw - 40, 520), bh = 96, bx = W / 2 - bw / 2, by = py + ph / 2 - bh / 2;
      roundRect(ctx, bx, by, bw, bh, 18); ctx.fill();
      ctx.globalAlpha = a; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = font(26); ctx.fillText(C.stage === 'demo' ? '👀 Now you try!' : C.mistakes ? '✔ You got it!' : '🌟 Pollinated!', W / 2, by + 30);
      ctx.font = font(15, 600); wrap(ctx, item.why, bw - 30).slice(0, 2).forEach((l, i) => ctx.fillText(l, W / 2, by + 60 + i * 18));
      ctx.globalAlpha = 1;
    }
  }

  function button(ctx, r, text, bg = '#fff', fg = INK, size = 22, on = true) {
    ctx.fillStyle = on ? bg : '#eee'; roundRect(ctx, r.x, r.y, r.w, r.h, Math.min(12, r.h / 3)); ctx.fill();
    ctx.strokeStyle = on ? 'rgba(43,35,80,.25)' : 'rgba(0,0,0,.08)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = on ? fg : '#bbb'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (/\p{Extended_Pictographic}/u.test(text)) emoji(ctx, text, r.x + r.w / 2, r.y + r.h / 2, size * 1.05);
    else { ctx.font = font(size); ctx.fillText(text, r.x + r.w / 2, r.y + r.h / 2 + 1); }
  }

  // ---------- board (letters / chunks)
  function drawBoard(ctx, b, short) {
    const chunks = item.board === 'chunks';
    const n = C.tiles.length, wide = b.w >= 560;
    const cols = chunks ? (wide ? Math.min(n, 7) : 4) : wide ? 13 : 7, rows = Math.ceil(n / cols);
    const gap = 6;
    let tw = (b.w - gap * (cols - 1)) / cols;
    const maxBoardH = b.h * (short ? 0.55 : 0.52);
    let th = Math.min(chunks ? 54 : tw, b.h > 420 ? 72 : 62, (maxBoardH - gap * (rows - 1)) / rows);
    if (!chunks) tw = Math.min(tw, th * 1.15);
    const bw = cols * tw + (cols - 1) * gap, bx = b.x + (b.w - bw) / 2, by = b.y + b.h - rows * th - (rows - 1) * gap;
    // top area: picture / big letter / slots
    const area = { x: b.x, y: b.y, w: b.w, h: by - b.y - 8 };
    drawSlots(ctx, area, short);
    C.tiles.forEach((t, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const lastRow = r === rows - 1, inRow = lastRow ? n - r * cols : cols, off = lastRow ? (cols - inRow) * (tw + gap) / 2 : 0;
      const rr = { x: bx + off + c * (tw + gap), y: by + r * (th + gap), w: tw, h: th };
      if (C.shake && C.shake.v === t.v) rr.x += Math.sin(C.shake.t * 60) * 5;
      t.r = rr;
      button(ctx, rr, t.v, t.on ? '#fff' : '#f3f1ea', INK, Math.min(th * 0.55, chunks ? 20 : 30), t.on);
      if (t.on) C.hits.push({ r: rr, fn: () => tapTile(t) });
    });
  }
  function drawSlots(ctx, a, short) {
    const s = item.slots, n = s.length;
    let cy = a.y + a.h / 2;
    // picture or big letter on the left/top
    const vis = item.big || (item.pic && (we() || item.lvl >= 5)) ? (item.big || item.pic) : '';
    const cue = item.lvl === 1 && we() ? item.cue : item.lvl === 3 && we() ? item.cue : '';
    const chunk = item.board === 'chunks';
    const sw = Math.min(chunk ? 130 : 60, (a.w - 20) / n - 6, a.h * 0.8), sh = Math.min(chunk ? 54 : sw * 1.15, a.h * 0.8);
    const total = n * (sw + 6) - 6;
    if (vis && a.h > 60) {
      const big = Math.min(a.h * 0.7, 90);
      if (/\p{Extended_Pictographic}/u.test(vis)) emoji(ctx, vis, a.x + a.w / 2 - total / 2 - big * 0.7 - 10, cy, big);
      else { ctx.font = font(big); ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(vis, a.x + a.w / 2 - total / 2 - big * 0.6 - 10, cy); }
    }
    let x = a.x + a.w / 2 - total / 2 + (vis && a.h > 60 ? Math.min(a.h * 0.35, 45) : 0);
    if (cue) { ctx.font = font(15, 600); ctx.fillStyle = HONEY_D; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(strip(cue), a.x + a.w / 2, a.y); }
    if (item.hintText && we()) { ctx.font = font(14, 600); ctx.fillStyle = HONEY_D; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; wrap(ctx, item.hintText, a.w - 20).slice(0, 2).forEach((l, i) => ctx.fillText(l, a.x + a.w / 2, a.y + i * 17)); cy += 14; }
    const curSlot = C.slotIdx[C.ansIdx];
    s.forEach((sl, i) => {
      const r = { x, y: cy - sh / 2, w: sw, h: sh };
      const fixed = !!sl.fixed, val = C.filled[i];
      ctx.fillStyle = fixed ? '#fff3c4' : val ? '#e6f8ee' : '#fff';
      roundRect(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
      ctx.lineWidth = i === curSlot && !C.done ? 4 : 2; ctx.strokeStyle = i === curSlot && !C.done ? HONEY : 'rgba(43,35,80,.3)'; ctx.stroke();
      // sound boxes: digraph letters share one box (bracket under them)
      if (sl.group === 'start' || sl.group === 'mid') { ctx.strokeStyle = HONEY_D; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(r.x + 6, r.y + r.h + 5); ctx.lineTo(r.x + r.w + 12, r.y + r.h + 5); ctx.stroke(); }
      if (sl.group === 'end') { ctx.strokeStyle = HONEY_D; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(r.x - 6, r.y + r.h + 5); ctx.lineTo(r.x + r.w - 6, r.y + r.h + 5); ctx.stroke(); }
      ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = font(Math.min(sh * 0.55, chunk ? 22 : 34));
      ctx.fillText(val || (item.lvl === 2 || item.board === 'chunks' ? '?' : ''), r.x + r.w / 2, r.y + r.h / 2 + 1);
      if (i < n - 1 && chunk) { ctx.font = font(22); ctx.fillText('+', r.x + r.w + 3, r.y + r.h / 2); }
      x += sw + 6;
    });
  }

  // ---------- order words
  function drawOrder(ctx, b, short) {
    const n = C.cards.length, gap = 8, wide = b.w > 560;
    const cw = wide ? (b.w - gap * (n - 1)) / n : (b.w - gap) / 2, ch = short ? 46 : 58;
    // answer row
    const sy = b.y + (we() ? 26 : 6);
    if (we()) { ctx.font = font(14, 600); ctx.fillStyle = HONEY_D; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(ABC.join(' '), b.x + b.w / 2, b.y); }
    const slotW = (b.w - gap * (n - 1)) / n;
    for (let i = 0; i < n; i++) {
      const r = { x: b.x + i * (slotW + gap), y: sy, w: slotW, h: ch };
      ctx.fillStyle = C.picked[i] ? '#e6f8ee' : '#fff'; roundRect(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill(); ctx.strokeStyle = 'rgba(43,35,80,.25)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = INK; ctx.font = font(Math.min(22, slotW / 5)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(C.picked[i] || `${i + 1}`, r.x + r.w / 2, r.y + r.h / 2);
    }
    const top = sy + ch + 18;
    C.cards.forEach((c, i) => {
      const col = wide ? i : i % 2, row = wide ? 0 : Math.floor(i / 2);
      const r = { x: b.x + col * (cw + gap), y: top + row * (ch + gap), w: cw, h: ch };
      if (C.shake && C.shake.v === c.w) r.x += Math.sin(C.shake.t * 60) * 5;
      c.r = r;
      if (c.used) return;
      button(ctx, r, c.w, '#fff', INK, Math.min(24, cw / 5));
      if (we()) { ctx.fillStyle = BAD; ctx.font = font(Math.min(24, cw / 5)); const w = ctx.measureText(c.w).width; ctx.fillRect(r.x + r.w / 2 - w / 2, r.y + r.h - 12, ctx.measureText(c.w[0]).width, 3); }
      C.hits.push({ r, fn: () => tapCard(c) });
    });
  }

  // ---------- numbers: model + number pad
  function drawNum(ctx, b, short, W) {
    const rem = !!item.rem;
    const keysList = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].concat(rem ? ['R'] : [], ['back', 'ok']);
    const oneRow = short && b.w > 560;
    const cols = oneRow ? keysList.length : 4, rows = Math.ceil(keysList.length / cols);
    const kgap = 6, kw = Math.min(oneRow ? (b.w - kgap * (cols - 1)) / cols : 72, (b.w - kgap * (cols - 1)) / cols), kh = Math.min(oneRow ? 46 : 52, b.h * 0.14);
    const padW = cols * kw + (cols - 1) * kgap, padX = b.x + (b.w - padW) / 2, padY = b.y + b.h - rows * kh - (rows - 1) * kgap;
    // the answer box
    const disp = { x: b.x + b.w / 2 - 90, y: padY - (short ? 44 : 56), w: 180, h: short ? 38 : 48 };
    const active = ready();
    ctx.fillStyle = active ? '#fff' : '#f3f1ea'; roundRect(ctx, disp.x, disp.y, disp.w, disp.h, 10); ctx.fill(); ctx.strokeStyle = active ? HONEY : '#ddd'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = INK; ctx.font = font(disp.h * 0.6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(C.typed ? C.typed.replace('R', ' R ') : active ? '?' : '…', disp.x + disp.w / 2, disp.y + disp.h / 2 + 1);
    C.keys = {};
    keysList.forEach((k, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const rr = { x: padX + c * (kw + kgap), y: padY + r * (kh + kgap), w: kw, h: kh };
      C.keys[k] = rr;
      const lab = k === 'back' ? '⌫' : k === 'ok' ? '✓' : k;
      button(ctx, rr, lab, k === 'ok' ? '#d9f5e4' : '#fff', k === 'ok' ? GOOD : INK, Math.min(kh * 0.5, 24), active);
      C.hits.push({ r: rr, fn: () => key(k) });
    });
    // the model (picture help)
    const m = { x: b.x, y: b.y, w: b.w, h: disp.y - b.y - 8 };
    if (m.h > 40) drawModel(ctx, m, short);
  }

  function grain(ctx, x, y, r, col = HONEY) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, 7); ctx.fill(); }
  function textC(ctx, t, x, y, px, col = INK) { ctx.fillStyle = col; ctx.font = font(px); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y); }

  function drawModel(ctx, m, short) {
    const k = C.model.kind, cx = m.x + m.w / 2, cy = m.y + m.h / 2;
    if (item.tap) {
      // flower with pollen to tap, basket on the right
      const fw = m.w * 0.72, fh = m.h, fx = m.x, fy = m.y;
      ctx.fillStyle = '#fff6d6'; roundRect(ctx, fx, fy, fw, fh, 14); ctx.fill();
      const r = clamp(Math.min(fw, fh) / (C.grains.length > 12 ? 14 : 10), 9, 24);
      C.grains.forEach(g => {
        if (g.got) return;
        const x = fx + g.rx * fw, y = fy + g.ry * fh;
        g.r = { x: x - r * 1.4, y: y - r * 1.4, w: r * 2.8, h: r * 2.8 };
        grain(ctx, x, y, r);
        C.hits.push({ r: g.r, fn: () => grainTap(g) });
      });
      const bx = m.x + fw + 10, bw = m.w - fw - 10;
      emoji(ctx, '🧺', bx + bw / 2, fy + fh * 0.62, Math.min(bw, fh) * 0.7);
      if (we()) textC(ctx, String(C.got), bx + bw / 2, fy + fh * 0.2, 30, HONEY_D);
      else { const piles = Math.min(C.got, 30); for (let i = 0; i < piles; i++) grain(ctx, bx + bw / 2 - 20 + (i % 6) * 8, fy + fh * 0.48 - Math.floor(i / 6) * 7, 4); }
      return;
    }
    if (k === 'deal') { drawDeal(ctx, m); return; }
    if (!C.showModel) { textC(ctx, strip(item.show), cx, cy, Math.min(42, m.h * 0.5)); return; }
    if (k === 'add' || k === 'sub') {
      const n = k === 'add' ? C.model.a + C.model.b : C.model.a, r = clamp(Math.min(m.w / (n * 2.6 + 4), m.h / 3), 6, 18);
      let x = cx - (n * r * 2.6 + (k === 'add' ? r * 3 : 0)) / 2 + r;
      for (let i = 0; i < n; i++) {
        if (k === 'add' && i === C.model.a) { textC(ctx, '+', x + r * 0.2, cy, r * 2.2); x += r * 3; }
        grain(ctx, x, cy, r, k === 'add' && i >= C.model.a ? '#ff9d3d' : HONEY);
        if (k === 'sub' && i >= C.model.a - C.model.b) { ctx.strokeStyle = BAD; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - r, cy - r); ctx.lineTo(x + r, cy + r); ctx.stroke(); }
        if (we() && item.lvl >= 5) textC(ctx, String(i + 1), x, cy + r * 1.8, 11, HONEY_D);
        x += r * 2.6;
      }
      textC(ctx, strip(item.show), cx, m.y + 14, 18);
      return;
    }
    if (k === 'tens' || k === 'tens2') {
      const nums = k === 'tens' ? [C.model.t * 10 + C.model.o] : [C.model.a, C.model.b];
      const s = clamp(Math.min(m.h / 12, m.w / (nums.length * 16)), 4, 9);
      let x = m.x + 10;
      nums.forEach((v, j) => {
        const t = Math.floor(v / 10), o = v % 10;
        for (let i = 0; i < t; i++) { for (let q = 0; q < 10; q++) { ctx.fillStyle = HONEY; ctx.fillRect(x, m.y + 24 + q * s, s - 1, s - 1); } x += s + 3; }
        x += 6; for (let i = 0; i < o; i++) { ctx.fillStyle = '#ff9d3d'; ctx.fillRect(x + (i % 3) * s, m.y + 24 + Math.floor(i / 3) * s, s - 1, s - 1); }
        x += s * 3 + 14;
        if (k === 'tens2' && j === 0) { textC(ctx, C.model.op, x, m.y + 24 + 5 * s, 26); x += 26; }
      });
      textC(ctx, k === 'tens' ? `${C.model.t} tens, ${C.model.o} ones` : strip(item.show), cx, m.y + 10, 16);
      return;
    }
    if (k === 'line') {
      const seq = C.model.seq.concat(['?']), x0 = m.x + 20, x1 = m.x + m.w - 20, step = (x1 - x0) / (seq.length - 1);
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, cy + 10); ctx.lineTo(x1, cy + 10); ctx.stroke();
      seq.forEach((v, i) => {
        const x = x0 + i * step; ctx.fillStyle = INK; ctx.fillRect(x - 1.5, cy + 2, 3, 16); textC(ctx, String(v), x, cy + 32, 18, v === '?' ? BAD : INK);
        if (i) { ctx.strokeStyle = HONEY; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x - step / 2, cy + 6, step / 2, Math.PI, 0); ctx.stroke(); textC(ctx, '+' + C.model.by, x - step / 2, cy - step / 2 - 4, 14, HONEY_D); }
      });
      return;
    }
    if (k === 'groups') {
      const g = C.model.g, kk = C.model.k, gw = Math.min(110, (m.w - 10) / g), r = clamp(gw / 9, 3, 7);
      for (let i = 0; i < g; i++) {
        const x = m.x + (m.w - g * gw) / 2 + i * gw + gw / 2;
        emoji(ctx, '🌼', x, cy - 6, Math.min(gw * 0.7, m.h * 0.55));
        for (let q = 0; q < kk; q++) grain(ctx, x - (Math.min(kk, 5) - 1) * r * 1.2 + (q % 5) * r * 2.4, cy + m.h * 0.28 + Math.floor(q / 5) * r * 2.4, r);
      }
      textC(ctx, `${g} groups of ${kk}`, cx, m.y + 10, 16);
      return;
    }
    if (k === 'array') {
      const R = C.model.r, Cc = C.model.c, s = Math.min((m.h - 26) / R, (m.w - 20) / Cc, 26);
      const x0 = cx - Cc * s / 2, y0 = m.y + 22;
      for (let i = 0; i < R; i++) for (let j = 0; j < Cc; j++) { hex(ctx, x0 + j * s + s / 2 + (i % 2) * s * 0.0, y0 + i * s + s / 2, s * 0.48); }
      textC(ctx, `${R} rows of ${Cc}`, cx, m.y + 10, 16);
      return;
    }
    if (k === 'column') {
      const a = String(C.model.a), bb = String(C.model.b), w = Math.max(a.length, bb.length) + 1, fs = Math.min(34, m.h / 4);
      ctx.font = `700 ${fs}px ui-monospace, Menlo, monospace`; ctx.fillStyle = INK; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      const rx = cx + w * fs * 0.32;
      ctx.fillText(a, rx, cy - fs * 0.9); ctx.fillText(C.model.op + ' ' + bb, rx, cy + fs * 0.1);
      ctx.fillRect(rx - w * fs * 0.62, cy + fs * 0.7, w * fs * 0.64, 3); ctx.fillText('?', rx, cy + fs * 1.3);
      return;
    }
    if (k === 'area' || k === 'area2') {
      const a = C.model.a, bb = C.model.b, at = Math.floor(a / 10) * 10, ao = a % 10;
      const parts = k === 'area' ? [[at, bb], [ao, bb]] : [[at, Math.floor(bb / 10) * 10], [ao, Math.floor(bb / 10) * 10], [at, bb % 10], [ao, bb % 10]];
      const cols = 2, rows = k === 'area' ? 1 : 2, bw = Math.min(170, (m.w - 20) / cols), bh = Math.min(44, (m.h - 10) / rows);
      parts.forEach(([x, y], i) => {
        const c = i % 2, r = Math.floor(i / 2), rr = { x: cx - bw + c * bw, y: cy - rows * bh / 2 + r * bh, w: bw - 4, h: bh - 4 };
        ctx.fillStyle = c ? '#ffe0b8' : '#fff0b3'; roundRect(ctx, rr.x, rr.y, rr.w, rr.h, 8); ctx.fill();
        textC(ctx, `${x} × ${y} = ${we() && C.stepMiss >= 1 ? x * y : '?'}`, rr.x + rr.w / 2, rr.y + rr.h / 2, Math.min(18, bh * 0.45));
      });
      return;
    }
    if (k === 'longdiv') {
      const fs = Math.min(34, m.h / 3); ctx.font = `700 ${fs}px ui-monospace, Menlo, monospace`; ctx.fillStyle = INK; ctx.textBaseline = 'middle';
      const s = String(C.model.n), w = s.length * fs * 0.62; ctx.textAlign = 'left';
      ctx.fillText(s, cx - w / 2 + 10, cy + 6); ctx.textAlign = 'right'; ctx.fillText(String(C.model.d), cx - w / 2 - 4, cy + 6);
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - w / 2, cy + fs * 0.7); ctx.quadraticCurveTo(cx - w / 2 + 8, cy, cx - w / 2, cy - fs * 0.6); ctx.lineTo(cx + w / 2 + 16, cy - fs * 0.6); ctx.stroke();
      textC(ctx, '?', cx + 10, cy - fs * 1.2, fs * 0.8, BAD);
      return;
    }
    if (k === 'steps') { (C.model.steps || []).forEach((s, i) => textC(ctx, `Step ${i + 1}: ${i === 0 && C.stepMiss < 1 ? s.replace(/= .*$/, '= ?') : s}`, cx, m.y + 22 + i * 30, 18)); return; }
    textC(ctx, strip(item.show), cx, cy, 30);
  }
  function hex(ctx, x, y, r) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fillStyle = '#ffd34d'; ctx.fill(); ctx.strokeStyle = HONEY_D; ctx.lineWidth = 1.5; ctx.stroke(); }
  function drawDeal(ctx, m) {
    const g = C.model.g, gw = Math.min(100, (m.w - 120) / g), r = clamp(gw / 10, 3, 6);
    // pile
    const px = m.x + 50, py = m.y + m.h / 2;
    for (let i = 0; i < Math.min(C.pile, 60); i++) grain(ctx, px - 30 + (i % 8) * 8, py + 20 - Math.floor(i / 8) * 7, 4);
    textC(ctx, `${C.pile} left`, px, m.y + 12, 14, HONEY_D);
    for (let i = 0; i < g; i++) {
      const x = m.x + 110 + i * gw + gw / 2;
      emoji(ctx, '🐝', x, m.y + m.h * 0.35, Math.min(gw * 0.6, 40));
      for (let q = 0; q < C.dealt[i]; q++) grain(ctx, x - 10 + (q % 4) * r * 2.2, m.y + m.h * 0.65 + Math.floor(q / 4) * r * 2.2, r);
    }
    if (C.showModel) {
      const rr = { x: m.x + m.w - 130, y: m.y + 4, w: 124, h: 36 };
      C.dealBtn = rr; button(ctx, rr, 'Deal 1 each', '#fff3c4', INK, 15, C.pile >= g);
      C.hits.push({ r: rr, fn: deal });
    }
  }

  // ------------------------------------------------ input
  function tap(x, y) {
    if (C.stage === 'demo' || C.done || C.ghost) return true;
    for (let i = C.hits.length - 1; i >= 0; i--) { const h = C.hits[i], r = h.r; if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { h.fn(); return true; } }
    return true;
  }
  function typeKey(k) {
    if (C.stage === 'demo' || C.done) return;
    if (K === 'num') { if (k === 'Enter') key('ok'); else if (k === 'Backspace') key('back'); else if (/^\d$/.test(k)) key(k); else if (/^r$/i.test(k)) key('R'); return; }
    if (K === 'board' && item.board !== 'chunks' && /^[a-z]$/i.test(k)) { const v = item.board === 'lower' ? k.toLowerCase() : k.toUpperCase(); const t = C.tiles.find(x => x.v === v); if (t) tapTile(t); }
  }

  if (C.stage === 'demo') setTimeout(() => api.speak(`Watch me first. ${item.say || strip(item.show)}`), 150);
  else setTimeout(sayItem, 150);

  return {
    C, update, draw, tap, typeKey,
    /** a grown-up (or the kid's helper) asks for a hint: glow the next step */
    hint() { if (C.done || C.stage === 'demo') return; C.helped = true; C.glow = nextAction(); toast('💡 A grown-up lit up a hint for you!'); },
    /** tests + "together": finish it the right way */
    reveal() { let n = 0; while (!C.done && n++ < 80) { const a = nextAction(); if (!a) break; a.run(); } },
    say: sayItem,
    get done() { return C.done; },
    coach() {
      // what a grown-up's phone shows (never the answer)
      const tips = {
        board: item.spell ? 'Ask: “What sound do you hear first? Then next?” Say the word slowly together.' : item.board === 'chunks' ? 'Ask: “What does each part mean?”' : item.lvl === 3 ? 'Make the sound together and think of a word that starts with it.' : 'Sing the ABC song together and stop at the letter.',
        order: 'Ask: “Which word starts with the letter closest to A?”',
        num: item.tap ? 'Point to each grain together and count out loud.' : 'Ask: “Can you draw it or use your fingers?” Don’t say the answer!',
      };
      return { show: strip(item.show), tip: tips[K] || tips.num, fam: item.fam, stage: C.stage };
    },
  };
}

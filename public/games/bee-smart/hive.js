// Bee Smart hive visit: put nectar in the comb, fan your wings to turn it into honey, cap it with wax,
// learn one new hive fact, then spend honey to build new hive rooms (each room unlocks a hat).
import { clamp, emoji, roundRect, Sfx } from '../_play/play.js';
import { HIVE_FACTS, ROOMS } from './facts.js';
import { wrap } from './challenge.js';

const INK = '#2b2350';
const font = (px, w = 700) => `${w} ${Math.round(px)}px Fredoka, Andika, system-ui, sans-serif`;

/** o: { world, pollen, bonus, bee (extra.bee save), guards: () => n, onDone(summary), onCard(kind, id) } */
export function makeHive(api, o) {
  const B = o.bee;
  const n = clamp(o.pollen, 1, 14);
  const H = { step: 'deposit', t: 0, cells: Array.from({ length: n }, () => ({ s: 0 })), fan: 0, hits: [], msg: '', built: null, earned: 0 };
  const honeyPer = 3;
  H.earned = o.pollen * honeyPer + (o.bonus || 0);

  // which fact this visit (rotates through this world's facts, then any fact)
  const per = Math.ceil(HIVE_FACTS.length / 6), start = o.world.id * per;
  B.factI = B.factI || {};
  const fi = (B.factI[o.world.id] || 0);
  const facts = HIVE_FACTS.slice(start, start + per);
  const fact = facts[fi % facts.length] || HIVE_FACTS[0];
  const factId = HIVE_FACTS.indexOf(fact);

  const say = (t, icon = '🐝') => { api.chime(t, icon, { ms: 6000 }); };
  const go = step => {
    H.step = step; H.t = 0;
    if (step === 'deposit') { say(`Welcome home! Tap each empty cell to drop off your nectar. You brought <b>${o.pollen}</b> loads.`, '🍯'); api.actions([]); }
    if (step === 'fan') { say('Nectar is watery. Bees fan their wings to dry it into thick honey. <b>Hold</b> the fan button!', '🌀'); api.actions([]); }
    if (step === 'cap') { api.actions([]); say('It’s honey now! Bees seal each cell with wax so the honey keeps. Tap each cell to cap it.', '🕯️'); }
    if (step === 'fact') { say(`<b>${fact[0]}</b>: ${fact[1]}`, '📖'); B.factI[o.world.id] = fi + 1; o.onCard('fact', factId); }
    if (step === 'build') {
      B.honey = (B.honey || 0) + H.earned; B.honeyAll = (B.honeyAll || 0) + H.earned;
      const next = ROOMS.find(r => !(B.rooms || []).includes(r.id));
      say(next ? (B.honey >= next.cost ? `You have <b>${B.honey}</b> honey. You can build the <b>${next.name}</b>!` : `You have <b>${B.honey}</b> honey. The <b>${next.name}</b> needs ${next.cost}. Keep collecting!`) : `You have <b>${B.honey}</b> honey. Your hive is complete. Amazing!`, '🍯');
    }
  };
  go('deposit');

  function update(dt) {
    H.t += dt;
    if (H.step === 'fan') {
      const holding = api.input.held('action') || H.hold;
      const helpers = o.guards ? o.guards() : 0;
      if (holding) H.fan = Math.min(1, H.fan + dt * (0.33 + 0.12 * helpers));
      else if (helpers && o.guardFanning && o.guardFanning()) H.fan = Math.min(1, H.fan + dt * 0.12 * helpers);
      if (H.fan >= 1) { Sfx.correct(); H.cells.forEach(c => { c.s = 2; }); go('cap'); }
    }
  }

  function comb(W, Hh, top) {
    const area = { x: 20, y: top + 70, w: W - 40, h: Hh - top - 180 };
    const cols = Math.min(7, n), rows = Math.ceil(n / cols);
    const r = clamp(Math.min(area.w / (cols * 1.9), area.h / (rows * 1.8)), 18, 64);
    const gw = cols * r * 1.75, gh = rows * r * 1.55;
    return H.cells.map((c, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      return { c, x: W / 2 - gw / 2 + r + col * r * 1.75 + (row % 2) * r * 0.87, y: area.y + area.h / 2 - gh / 2 + r + row * r * 1.55, r };
    });
  }
  function hex(ctx, x, y, r, fill, stroke = '#a66f00') { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke(); }
  function btn(ctx, r, text, bg = '#fff', size = 20) { ctx.fillStyle = bg; roundRect(ctx, r.x, r.y, r.w, r.h, 14); ctx.fill(); ctx.strokeStyle = 'rgba(43,35,80,.25)'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = INK; ctx.font = font(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, r.x + r.w / 2, r.y + r.h / 2 + 1); }

  function draw(ctx, W, Hh, top) {
    H.hits = [];
    const g = ctx.createRadialGradient(W / 2, Hh / 2, 50, W / 2, Hh / 2, Math.max(W, Hh));
    g.addColorStop(0, '#ffd77a'); g.addColorStop(1, '#c98a00'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
    // background comb pattern
    ctx.globalAlpha = 0.18; for (let y = 0; y < Hh + 60; y += 52) for (let x = 0; x < W + 60; x += 60) hex(ctx, x + (Math.floor(y / 52) % 2) * 30, y, 30, '#ffe9a8', '#b98000'); ctx.globalAlpha = 1;
    // busy bees
    for (let i = 0; i < 5; i++) emoji(ctx, '🐝', (W * (0.15 + i * 0.18) + Math.sin(H.t * 1.3 + i) * 30) % W, top + 40 + (i % 2) * 20 + Math.cos(H.t * 2 + i) * 10, 26);
    // title
    const titles = { deposit: '🍯 Drop off the nectar', fan: '🌀 Fan your wings', cap: '🕯️ Cap the honey with wax', fact: '📖 Hive fact', build: '🔨 Build your hive' };
    ctx.fillStyle = INK; ctx.font = font(W < 500 ? 20 : 26); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(titles[H.step], W / 2, top + 8);
    const cells = comb(W, Hh, top);
    if (H.step === 'deposit' || H.step === 'fan' || H.step === 'cap') {
      for (const k of cells) {
        const s = k.c.s;
        const col = s === 0 ? (Math.sin(H.t * 5) > 0 ? '#fff6d0' : '#fff') : s === 1 ? `rgba(255,${230 - H.fan * 60},${150 - H.fan * 120},1)` : s === 2 ? '#e99a00' : '#f6efe0';
        hex(ctx, k.x, k.y, k.r, col);
        if (s === 3) { ctx.strokeStyle = '#d8c7a0'; ctx.lineWidth = 2; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(k.x - k.r * 0.6, k.y + i * k.r * 0.22); ctx.lineTo(k.x + k.r * 0.6, k.y + i * k.r * 0.22); ctx.stroke(); } }
        if (s === 0 && H.step === 'deposit') { emoji(ctx, '👆', k.x + 6, k.y + 10, k.r * 0.7, { alpha: 0.35 + 0.3 * Math.sin(H.t * 6) }); }
        const hit = { x: k.x - k.r, y: k.y - k.r, w: k.r * 2, h: k.r * 2 };
        H.hits.push({ r: hit, fn: () => tapCell(k.c) });
        k.c.r = hit;
      }
    }
    if (H.step === 'fan') {
      const bw = Math.min(W - 60, 420), r = { x: W / 2 - bw / 2, y: Hh - 120, w: bw, h: 22 };
      ctx.fillStyle = 'rgba(255,255,255,.6)'; roundRect(ctx, r.x, r.y, r.w, r.h, 11); ctx.fill();
      ctx.fillStyle = '#e99a00'; roundRect(ctx, r.x, r.y, r.w * H.fan, r.h, 11); ctx.fill();
      ctx.fillStyle = INK; ctx.font = font(15); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(H.fan < 1 ? 'Nectar → Honey' : 'Honey!', W / 2, r.y + 11);
      const big = { x: W / 2 - 100, y: Hh - 88, w: 200, h: 60 };
      H.fanBtn = big; const on = H.hold || api.input.held('action'); btn(ctx, big, on ? '🌀 Fanning…' : '🌀 Hold to fan', on ? '#ffd34d' : '#fff3c4', 20);
      const wob = Math.sin(H.t * 50) * (on ? 1 : 0);
      emoji(ctx, '🐝', W / 2 + 140, Hh - 58 + wob * 3, 46);
    }
    if (H.step === 'fact') {
      const cw = Math.min(W - 40, 560), cx = W / 2 - cw / 2, cy = Hh < 520 ? top + 44 : top + 70;
      const chh = Hh < 520 ? 170 : 230;
      ctx.fillStyle = '#fffdf3'; roundRect(ctx, cx, cy, cw, chh, 18); ctx.fill();
      ctx.fillStyle = INK; ctx.font = font(22); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(fact[0], W / 2, cy + 18);
      ctx.font = font(18, 600); wrap(ctx, fact[1], cw - 40).slice(0, Hh < 520 ? 3 : 5).forEach((l, i) => ctx.fillText(l, W / 2, cy + 60 + i * 26));
      ctx.font = font(14, 600); ctx.fillStyle = '#9a6d00'; ctx.fillText('📖 Added to your Field Guide', W / 2, cy + chh - 30);
      const r = Hh < 520 ? { x: W - 200, y: Hh - 70, w: 180, h: 54 } : { x: W / 2 - 90, y: cy + 250, w: 180, h: 54 }; btn(ctx, r, 'Next ▶', '#d9f5e4'); H.hits.push({ r, fn: () => go('build') }); H.nextBtn = r;
    }
    if (H.step === 'build') {
      const cw = Math.min(W - 30, 760), cx = W / 2 - cw / 2, cy = top + 50, colsN = cw >= 700 ? 6 : 3, rowsN = Math.ceil(ROOMS.length / colsN);
      const ph = Math.min(Hh - cy - 90, 52 + rowsN * 96);
      ctx.fillStyle = '#fffdf3'; roundRect(ctx, cx, cy, cw, ph, 18); ctx.fill();
      ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.font = font(18); ctx.fillText(`+${H.earned} honey${o.bonus ? ` (includes ${o.bonus} Queen’s bonus)` : ''} · You have 🍯 ${B.honey}`, W / 2, cy + 12);
      const cols = colsN, tw = (cw - 20) / cols, th = Math.min(86, (ph - 52) / rowsN - 6);
      ROOMS.forEach((rm, i) => {
        const have = (B.rooms || []).includes(rm.id), x = cx + 10 + (i % cols) * tw, y = cy + 44 + Math.floor(i / cols) * (th + 6);
        ctx.fillStyle = have ? '#ffe9a8' : '#f1ede4'; roundRect(ctx, x + 3, y, tw - 6, th, 12); ctx.fill();
        emoji(ctx, have ? rm.e : '🔒', x + tw / 2, y + th * 0.35, Math.min(34, th * 0.42));
        ctx.fillStyle = INK; ctx.font = font(Math.min(13, tw / 9)); ctx.textBaseline = 'middle'; ctx.fillText(rm.name, x + tw / 2, y + th * 0.7); if (!have) { ctx.fillStyle = '#9a6d00'; ctx.fillText(`🍯 ${rm.cost}`, x + tw / 2, y + th * 0.88); }
      });
      const next = ROOMS.find(r => !(B.rooms || []).includes(r.id));
      const by = Hh - 82, ax = Hh < 520 ? W * 0.72 : W / 2; // short screens: clear of the narrator bubble (bottom-left)
      if (next && B.honey >= next.cost && !H.built) { const r = { x: ax - 170, y: by, w: 160, h: 56 }; btn(ctx, r, `🔨 Build ${next.e}`, '#fff3c4', 18); H.hits.push({ r, fn: () => build(next) }); H.buildBtn = r; }
      const r2 = { x: next && B.honey >= next.cost && !H.built ? ax + 10 : ax - 90, y: by, w: 180, h: 56 }; btn(ctx, r2, '🏁 Finish trip', '#d9f5e4', 18); H.hits.push({ r: r2, fn: finish }); H.finishBtn = r2;
    }
  }
  function tapCell(c) {
    if (H.step === 'deposit' && c.s === 0) { c.s = 1; Sfx.drop(); if (H.cells.every(x => x.s >= 1)) setTimeout(() => go('fan'), 500); }
    else if (H.step === 'cap' && c.s === 2) { c.s = 3; Sfx.pop(); if (H.cells.every(x => x.s === 3)) { Sfx.correct(); setTimeout(() => go('fact'), 600); } }
  }
  function build(rm) {
    B.honey -= rm.cost; B.rooms = (B.rooms || []).concat(rm.id); B.hats = (B.hats || []).concat(rm.hat); B.hat = rm.hat;
    H.built = rm; Sfx.levelUp(); api.confetti();
    api.chime(`You built the <b>${rm.name}</b>! ${rm.fact} Your bee got a new hat: ${rm.hat}`, rm.e, { ms: 7000 });
    o.save();
  }
  function finish() { if (H.finished) return; H.finished = true; o.onDone({ earned: H.earned, built: H.built }); }

  return {
    H, update, draw,
    tap(x, y) {
      if (H.step === 'fan' && H.fanBtn) { const r = H.fanBtn; if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { H.hold = true; return; } }
      for (let i = H.hits.length - 1; i >= 0; i--) { const r = H.hits[i].r; if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { H.hits[i].fn(); return; } }
    },
    up() { H.hold = false; },
    /** tests: do the whole visit */
    auto() { H.cells.forEach(c => { c.s = 1; }); H.fan = 1; H.cells.forEach(c => { c.s = 3; }); go('fact'); go('build'); finish(); },
  };
}

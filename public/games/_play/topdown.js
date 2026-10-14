// Top-down explore kit (like Zelda / Pokémon): walk around a little world with the joystick, arrow keys,
// or tap where to go. Walk up to people, booths and places (SPOTS) and press the action button to play
// their hands-on challenge. Roaming critters can bump you (lose a heart). Collect things along the way.
import { clamp, rand, pick, emoji, label, roundRect, Sfx, hudBottom } from './play.js';
import { puzzles } from './widgets.js';

export function topScene(api, game) {
  const P = { api, game, puz: puzzles(api), t: 0, me: null, map: null, cam: { x: 0, y: 0 }, T: 56, near: null, target: null, stopped: false };

  function start(o) {
    P.o = o; P.t = 0; P.stopped = false; P.target = null;
    P.map = game.build(o, P);
    P.me = { x: P.map.start.x + 0.5, y: P.map.start.y + 0.5, inv: 0, face: 1, cp: { ...P.map.start } };
    P.map.foes = (P.map.foes || []).map(f => ({ vx: 0, vy: 0, t: 0, ...f, x0: f.x, y0: f.y }));
    P.map.items = P.map.items || [];
    resize(); setActs();
    game.start && game.start(o, P);
  }
  function resize() { P.T = clamp(Math.min(api.W, api.H) / (api.W < 600 ? 7.5 : 9), 40, 72); }
  const solid = (x, y) => { const m = P.map; if (x < 0 || y < 0 || x >= m.W || y >= m.H) return true; return m.solid.has(m.tiles[Math.floor(y)][Math.floor(x)]) || (m.spots || []).some(s => s.block && !s.open && Math.floor(x) === s.x && Math.floor(y) === s.y); };
  P.solid = solid;
  const R = 0.3;
  const hits = (x, y) => solid(x - R, y - R) || solid(x + R, y - R) || solid(x - R, y + R) || solid(x + R, y + R);
  function setActs() {
    if (P.puz.on) return;
    const s = P.near, def = s ? [{ key: 'action', label: s.action || game.actionLabel || '💬 Talk', big: true }] : [];
    api.actions(game.actions ? game.actions(P, def) : def);
  }
  P.setActs = setActs;

  function update(dt) {
    P.t += dt;
    if (P.puz.on) { P.puz.update(dt); if (!P.puz.on) setActs(); game.update && game.update(dt, P, true); return; }
    if (P.stopped) return;
    const m = P.me; m.inv = Math.max(0, m.inv - dt);
    let ix = api.input.x, iy = api.input.y;
    if (ix || iy) P.target = null;
    else if (P.target) { const dx = P.target.x - m.x, dy = P.target.y - m.y, d = Math.hypot(dx, dy); if (d < 0.15) P.target = null; else { ix = dx / d; iy = dy / d; } }
    const mag = Math.hypot(ix, iy); if (mag > 1) { ix /= mag; iy /= mag; }
    const sp = (game.speed || 4.2) * dt;
    if (ix) { const nx = m.x + ix * sp; if (!hits(nx, m.y)) m.x = nx; else if (P.target) P.target = null; m.face = Math.sign(ix); }
    if (iy) { const ny = m.y + iy * sp; if (!hits(m.x, ny)) m.y = ny; else if (P.target && !ix) P.target = null; }
    // spots near you
    const was = P.near;
    P.near = (P.map.spots || []).filter(s => !s.done && !s.hidden).find(s => Math.hypot(s.x + 0.5 - m.x, s.y + 0.5 - m.y) < (s.r || 1.25)) || null;
    if (P.near !== was) { setActs(); if (P.near && P.near.hello) api.toast(P.near.hello, 1500); }
    if (P.near && api.input.pressed('action')) { P.target = null; game.onSpot(P.near, P); }
    // items
    for (const it of P.map.items) if (!it.got && Math.hypot(it.x + 0.5 - m.x, it.y + 0.5 - m.y) < 0.6) { it.got = true; game.onItem ? game.onItem(it, P) : Sfx.coin(); }
    // critters
    for (const f of P.map.foes) {
      if (f.gone) continue;
      f.t -= dt;
      if (f.kind === 'chase' && Math.hypot(f.x - m.x, f.y - m.y) < (f.see || 4)) { const d = Math.hypot(m.x - f.x, m.y - f.y) || 1; f.vx = (m.x - f.x) / d; f.vy = (m.y - f.y) / d; }
      else if (f.t <= 0) { f.t = rand(1, 3); const a = Math.random() * 6.28; f.vx = Math.cos(a); f.vy = Math.sin(a); if (Math.hypot(f.x - f.x0, f.y - f.y0) > (f.range || 3)) { const d = Math.hypot(f.x0 - f.x, f.y0 - f.y); f.vx = (f.x0 - f.x) / d; f.vy = (f.y0 - f.y) / d; } }
      const s2 = (f.speed || 1.4) * dt, nx = f.x + f.vx * s2, ny = f.y + f.vy * s2;
      if (!solid(nx, f.y)) f.x = nx; else f.vx *= -1;
      if (!solid(f.x, ny)) f.y = ny; else f.vy *= -1;
      if (m.inv <= 0 && Math.hypot(f.x - m.x, f.y - m.y) < 0.65) { m.inv = 1.8; const d = Math.hypot(m.x - f.x, m.y - f.y) || 1; for (let k = 0; k < 8; k++) { const nx2 = m.x + (m.x - f.x) / d * 0.12, ny2 = m.y + (m.y - f.y) / d * 0.12; if (!hits(nx2, ny2)) { m.x = nx2; m.y = ny2; } } (game.onFoe ? game.onFoe(f, P) : api.loseHeart('Ouch!')); }
    }
    game.update && game.update(dt, P, false);
  }

  function draw(ctx, W, H, title) {
    const th = game.theme || {};
    ctx.fillStyle = th.bg || '#7cc464'; ctx.fillRect(0, 0, W, H);
    if (!P.map) { (th.titleDeco || ['🌳', '🎪', '🏠']).forEach((e, i) => emoji(ctx, e, (i * 173 + 60) % W, (i * 97 + 120) % H, 48, { alpha: 0.6 })); return; }
    if (P.t < 0.1) resize();
    const T = P.T, m = P.me, top = hudBottom(), bot = H - (W < 900 && H > 500 ? 110 : 10);
    const cxT = clamp(m.x * T - W / 2, -T, P.map.W * T - W + T), cyT = clamp(m.y * T - (top + bot) / 2, -top, P.map.H * T - bot + T);
    P.cam.x += (cxT - P.cam.x) * 0.15; P.cam.y += (cyT - P.cam.y) * 0.15;
    if (P.t < 0.15) { P.cam.x = cxT; P.cam.y = cyT; }
    const ox = -P.cam.x, oy = -P.cam.y;
    const x0 = Math.max(0, Math.floor(-ox / T)), x1 = Math.min(P.map.W - 1, Math.ceil((W - ox) / T)), y0 = Math.max(0, Math.floor(-oy / T)), y1 = Math.min(P.map.H - 1, Math.ceil((H - oy) / T));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const k = P.map.tiles[y][x], sx = ox + x * T, sy = oy + y * T, tt = (th.tiles || {})[k] || ['#7cc464'];
      ctx.fillStyle = tt[0]; ctx.fillRect(sx, sy, T + 1, T + 1);
      if (tt[2]) { ctx.fillStyle = tt[2]; if ((x + y) % 2) ctx.fillRect(sx, sy, T + 1, T + 1); }
      if (tt[1]) emoji(ctx, tt[1], sx + T / 2, sy + T / 2, T * (tt[3] || 0.8));
    }
    game.drawUnder && game.drawUnder(ctx, ox, oy, T, P);
    for (const it of P.map.items) if (!it.got) emoji(ctx, it.e, ox + (it.x + 0.5) * T, oy + (it.y + 0.5) * T + Math.sin(P.t * 4 + it.x) * 3, T * 0.55);
    for (const s of P.map.spots || []) {
      if (s.hidden) continue;
      const sx = ox + (s.x + 0.5) * T, sy = oy + (s.y + 0.5) * T;
      if (game.drawSpot) { if (game.drawSpot(ctx, s, sx, sy, T, P)) continue; }
      emoji(ctx, s.e, sx, sy, T * (s.size || 0.85));
      if (!s.done && s.tag) label(ctx, s.tag, sx, sy - T * 0.62, { size: Math.max(11, T * 0.22), bg: s.tagBg || 'rgba(43,35,80,.85)' });
      if (!s.done && s === P.near) { ctx.strokeStyle = '#ffd34a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx, sy, T * 0.6 + Math.sin(P.t * 6) * 3, 0, 7); ctx.stroke(); }
      if (s.done) emoji(ctx, '✅', sx + T * 0.32, sy - T * 0.32, T * 0.32);
    }
    for (const f of P.map.foes) if (!f.gone) emoji(ctx, f.e, ox + f.x * T, oy + f.y * T, T * (f.size || 0.7), { flip: f.vx > 0 });
    if (P.target) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ox + P.target.x * T, oy + P.target.y * T, 10, 0, 7); ctx.stroke(); }
    const mx = ox + m.x * T, my = oy + m.y * T;
    if (!(m.inv > 0 && Math.floor(P.t * 10) % 2)) {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(mx, my + T * 0.32, T * 0.28, T * 0.09, 0, 0, 7); ctx.fill();
      ctx.fillStyle = api.kid.color || '#ff9d3d'; ctx.beginPath(); ctx.arc(mx, my, T * 0.34, 0, 7); ctx.fill();
      emoji(ctx, api.kid.avatar || '🙂', mx, my, T * 0.5, { flip: m.face < 0 });
    }
    game.drawOver && game.drawOver(ctx, W, H, P, { ox, oy, T });
    P.puz.draw(ctx, W, H);
  }

  return {
    start, update, draw, resize,
    onTap(x, y) {
      if (P.puz.on) { P.puz.down(x, y); return; }
      if (!P.map || P.stopped) return;
      if (game.onTap && game.onTap(x, y, P)) return;
      const wx = (x + P.cam.x) / P.T, wy = (y + P.cam.y) / P.T;
      const s = (P.map.spots || []).find(q => !q.done && !q.hidden && Math.hypot(q.x + 0.5 - wx, q.y + 0.5 - wy) < 0.7);
      if (s && s === P.near) { game.onSpot(s, P); return; }
      P.target = { x: wx, y: wy };
    },
    onMove(x, y) { P.puz.move(x, y); }, onUp(x, y) { P.puz.up(x, y); },
    tapZone: () => P.puz.on,
    stop() { P.puz.close(); P.map = null; api.progress(null); },
    checkpoint() { if (P.me) { P.me.x = P.me.cp.x + 0.5; P.me.y = P.me.cp.y + 0.5; P.me.inv = 2; } api.toast('🚩 Back to your checkpoint!'); },
    P, _P: P,
  };
}

/** A simple map maker: a grass field with paths, a border of trees, and room for spots. */
export function fieldMap(Wt, Ht, { border = 'T', fill = 'g', path = 'p', paths = true } = {}) {
  const tiles = Array.from({ length: Ht }, (_, y) => Array.from({ length: Wt }, (_, x) => (x === 0 || y === 0 || x === Wt - 1 || y === Ht - 1 ? border : fill)));
  if (paths) { const my = Math.floor(Ht / 2), mx = Math.floor(Wt / 2); for (let x = 1; x < Wt - 1; x++) tiles[my][x] = path; for (let y = 1; y < Ht - 1; y++) tiles[y][mx] = path; }
  return tiles;
}
/** Find free tiles (not solid, not used) for placing spots. */
export function freeSpots(tiles, solidSet, n, { avoid = [], minGap = 2, margin = 2 } = {}) {
  const H = tiles.length, W = tiles[0].length, out = [];
  for (let k = 0; k < 2000 && out.length < n; k++) {
    const x = rand(margin, W - 1 - margin), y = rand(margin, H - 1 - margin);
    if (solidSet.has(tiles[y][x])) continue;
    if ([...out, ...avoid].some(p => Math.abs(p.x - x) + Math.abs(p.y - y) < minGap)) continue;
    out.push({ x, y });
  }
  return out;
}

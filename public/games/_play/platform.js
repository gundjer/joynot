// Side-scrolling run-and-jump kit (like Mario): run, jump, stomp enemies, collect, reach checkpoints 🚩.
// Learning happens at STATIONS in the world: a gap that needs a bridge, a locked door, a wall, a machine.
// The game opens a hands-on puzzle (widgets.js) at the station; solving it changes the world
// (the bridge appears, the door opens). The world freezes while a puzzle is open, but an optional rival
// keeps moving slowly, so quicker solving keeps you ahead.
import { clamp, rand, pick, emoji, label, roundRect, Sfx, hudBottom } from './play.js';
import { puzzles } from './widgets.js';

export const ROWS = 9;

/**
 * Build a level: flat-ish ground with bumps, little gaps, platforms, enemies, coins, checkpoints,
 * and `stations` spread evenly (each followed by its obstacle).
 * stations: [{ kind: 'gap'|'wall'|'door'|'spot', w?: tiles, ...data }]
 */
export function makeLevel({ stations = [], gapEvery = 0.35, enemy = 0.5, flyer = 0.25, coins = 0.6, edition = 1, seg = 18 } = {}) {
  const cols = [], objs = [];
  let g = 2;
  const push = (n, opts = {}) => { for (let i = 0; i < n; i++) cols.push({ g: opts.g ?? g, plat: opts.plat ? [...opts.plat] : null, wall: opts.wall || 0 }); };
  push(8);
  const spots = [];
  stations.forEach((st, si) => {
    // a stretch of play before each station
    let left = seg;
    while (left > 0) {
      const r = Math.random();
      if (r < gapEvery && left > 6 && cols[cols.length - 1].g > 0) { const w = edition <= 0 ? 1 : rand(1, 2); push(w, { g: 0 }); left -= w; }
      else if (r < gapEvery + 0.2 && left > 6) { g = clamp(g + pick([-1, 1]), 1, 3); push(rand(3, 5)); left -= 4; }
      else if (r < gapEvery + 0.35 && left > 7) { const n = rand(3, 4); push(n, { plat: [g + 3] }); for (let i = 0; i < n; i++) if (Math.random() < coins) objs.push({ t: 'coin', x: cols.length - n + i + 0.5, row: ROWS - g - 4 }); left -= n; }
      else { const n = rand(3, 5); push(n); left -= n; }
      if (cols.length > 14 && Math.random() < enemy * 0.35 && cols[cols.length - 1].g > 0) objs.push({ t: 'walk', x: cols.length - 2 + 0.5 });
      if (cols.length > 14 && Math.random() < flyer * 0.25) objs.push({ t: 'fly', x: cols.length - 1 + 0.5, row: ROWS - g - rand(3, 4) });
      if (Math.random() < coins * 0.4) objs.push({ t: 'coin', x: cols.length - 1 + 0.5, row: ROWS - g - 2 });
    }
    // the station + its obstacle
    g = 2; push(4);
    const at = cols.length - 2;
    const s = { ...st, x: at, i: si, done: false, active: false };
    if (st.kind === 'gap') { s.from = cols.length; push(st.w || 5, { g: 0 }); s.to = cols.length; push(4); }
    else if (st.kind === 'wall') { s.from = cols.length; push(1, { wall: 5 }); s.to = cols.length; push(4); }
    else if (st.kind === 'door') { s.from = cols.length; push(1, { wall: 6 }); s.to = cols.length; push(4); }
    else push(3);
    spots.push(s);
    objs.push({ t: 'flag', x: cols.length - 2 + 0.5 });
  });
  push(seg >> 1); push(10);
  objs.push({ t: 'goal', x: cols.length - 6 });
  return { cols, objs, stations: spots };
}

export function platformScene(api, game) {
  const P = { api, game, puz: puzzles(api), me: null, lv: null, cam: 0, t: 0, T: 48, score: 0, rival: null, stopped: false };
  const hero = () => api.kid.avatar || '🙂';
  let foes = [], items = [], respawn = 0, base = 0;

  P.solid = (tx, ty) => {
    const c = P.lv.cols[tx];
    if (!c) return tx < 0; // left edge is a wall, the end is open
    if (ty >= ROWS - c.g && c.g > 0) return true;
    if (c.wall && ty >= ROWS - c.g - c.wall && ty < ROWS - c.g) return true;
    return false;
  };
  P.groundY = tx => { const c = P.lv.cols[Math.floor(tx)]; return c && c.g ? (ROWS - c.g) * P.T : null; };

  function start(o) {
    P.o = o; P.t = 0; P.score = 0; P.stopped = false; P.cam = 0;
    P.lv = game.build(o, P);
    foes = P.lv.objs.filter(q => q.t === 'walk' || q.t === 'fly').map(q => ({ ...q, y0: q.row, dir: -1, alive: true, ph: Math.random() * 6 }));
    items = P.lv.objs.filter(q => q.t !== 'walk' && q.t !== 'fly').map(q => ({ ...q, got: false }));
    P.foes = foes; P.items = items;
    resize();
    P.me = { x: 2.5, y: 0, vx: 0, vy: 0, on: false, inv: 0, face: 1, fall: 0 };
    respawn = 2.5; placeOnGround(P.me);
    P.rival = game.rival ? { x: 1, ...game.rival(o, P) } : null;
    document.body.classList.add('chime-top');
    setActs();
    game.start && game.start(o, P);
  }
  function placeOnGround(m) { let tx = Math.floor(m.x); while (P.lv.cols[tx] && !P.lv.cols[tx].g) tx++; m.x = tx + 0.5; m.y = ROWS - P.lv.cols[tx].g; m.vx = m.vy = 0; }
  function resize() {
    if (!P.lv) return;
    const top = hudBottom() + 10, phonePortrait = api.W < 900 && api.H > 500;
    base = api.H - (phonePortrait ? 96 : 8);
    P.T = clamp((base - top) / ROWS, 24, 64);
    document.documentElement.style.setProperty('--hudb', hudBottom() + 'px');
  }
  P.setActs = setActs;
  function setActs() { if (P.puz.on) return; api.actions(game.actions ? game.actions(P) : [{ key: 'action', label: '⤴ Jump', big: true }]); }

  // ------------------------------------------------ physics (units: tiles; y = feet, rows from the top)
  const W2 = 0.3, HT = 0.9, G = 42, JUMP = 15.2, RUN = 5.6;
  function hitsAt(x, y) { // body box: x±W2, y-HT..y
    for (let tx = Math.floor(x - W2); tx <= Math.floor(x + W2 - 1e-6); tx++) for (let ty = Math.floor(y - HT); ty <= Math.floor(y - 1e-6); ty++) if (P.solid(tx, ty)) return true;
    return false;
  }
  function physics(m, dt, wantX, jump) {
    m.vx += (wantX * RUN - m.vx) * Math.min(1, dt * (m.on ? 14 : 6));
    if (jump && (m.on || m.coyote > 0)) { m.vy = -JUMP; m.on = false; m.coyote = 0; Sfx.pop(); }
    if (!api.input.held('action') && !api.input.held('up') && m.vy < -6) m.vy += G * dt * 1.2; // short hop when you let go
    m.vy = Math.min(m.vy + G * dt, 22);
    let nx = m.x + m.vx * dt;
    if (hitsAt(nx, m.y)) { nx = m.vx > 0 ? Math.floor(nx + W2) - W2 - 0.001 : Math.floor(nx - W2) + 1 + W2 + 0.001; m.vx = 0; if (hitsAt(nx, m.y)) nx = m.x; }
    m.x = Math.max(0.4, nx);
    let ny = m.y + m.vy * dt; const wasOn = m.on; m.on = false;
    if (m.vy > 0) {
      if (hitsAt(m.x, ny)) { ny = Math.floor(ny); m.vy = 0; m.on = true; }
      else { // one-way platforms
        const c = P.lv.cols[Math.floor(m.x)];
        if (c && c.plat) for (const r of c.plat) { const top = ROWS - r; if (m.y <= top + 0.01 && ny >= top) { ny = top; m.vy = 0; m.on = true; } }
      }
    } else if (m.vy < 0 && hitsAt(m.x, ny)) { ny = Math.floor(ny - HT) + 1 + HT; m.vy = 0; }
    m.y = ny;
    m.coyote = m.on ? 0.1 : wasOn ? 0.1 : Math.max(0, (m.coyote || 0) - dt);
  }

  function update(dt) {
    P.t += dt;
    if (P.puz.on) { P.puz.update(dt); if (P.rival && !P.stopped) P.rival.x += P.rival.speed * dt * 0.3; if (!P.puz.on) setActs(); game.update && game.update(dt, P, true); return; }
    if (P.stopped) { game.update && game.update(dt, P, true); return; }
    const m = P.me;
    m.inv = Math.max(0, m.inv - dt);
    document.documentElement.style.setProperty('--hudb', hudBottom() + 'px');
    const wx = Math.abs(api.input.x) > 0.25 ? Math.sign(api.input.x) * Math.min(1, Math.abs(api.input.x) * 1.4) : 0;
    if (wx) m.face = Math.sign(wx);
    physics(m, dt, wx, api.input.pressed('action') || api.input.pressed('up') || api.input.pressed('jump'));
    // stations stop you and open the puzzle
    for (const st of P.lv.stations) {
      if (st.done || st.active) continue;
      if (m.x > st.x + 0.2 && m.x < st.x + 2.5) { st.active = true; m.vx = 0; m.x = st.x + 0.2; game.onStation(st, P); break; }
    }
    // things to collect
    for (const it of items) {
      if (it.got) continue;
      const iy = it.row != null ? it.row + 0.5 : (P.groundY(it.x) ?? ROWS * P.T) / P.T - 0.6;
      if (Math.abs(it.x - m.x) < 0.6 && Math.abs(iy - (m.y - 0.45)) < 0.9) {
        if (it.t === 'coin') { it.got = true; P.score++; Sfx.coin(); game.onCoin && game.onCoin(P); }
        else if (it.t === 'heart') { it.got = true; api.heal(); Sfx.pop(); }
        else if (it.t === 'flag') { it.got = true; respawn = it.x; Sfx.pop(); api.toast('🚩 Checkpoint!', 1100); }
        else if (it.t === 'goal') { it.got = true; P.stopped = true; game.onGoal(P); }
        else if (game.onItem) { it.got = true; game.onItem(it, P); }
      }
    }
    // enemies
    for (const f of foes) {
      if (!f.alive) { f.dead = (f.dead || 0) + dt; continue; }
      if (Math.abs(f.x - m.x) > 18) continue;
      if (f.t === 'walk') {
        const nx = f.x + f.dir * dt * 1.6, ahead = P.lv.cols[Math.floor(nx + f.dir * 0.4)];
        const here = P.lv.cols[Math.floor(f.x)];
        if (!ahead || !here || ahead.g !== here.g || ahead.wall) f.dir *= -1; else f.x = nx;
        f.y = ROWS - (here ? here.g : 2);
      } else { f.ph += dt * 2; f.x += Math.sin(f.ph * 0.5) * dt * 1.5; f.y = f.y0 + Math.sin(f.ph) * 0.8 + 0.9; }
      const dx = f.x - m.x, dy = (f.y - 0.45) - (m.y - 0.45);
      if (Math.abs(dx) < 0.7 && Math.abs(dy) < 0.8) {
        if (m.vy > 0.5 && m.y < f.y - 0.25) { f.alive = false; m.vy = -JUMP * 0.65; P.score += 2; Sfx.pop(); game.onStomp && game.onStomp(f, P); }
        else if (m.inv <= 0) { m.inv = 1.6; m.vx = -Math.sign(dx || 1) * 7; m.vy = -7; hurt(game.hurtText ? game.hurtText(f, P) : 'Ouch!'); }
      }
    }
    // fell in a hole
    if (m.y > ROWS + 2) { hurt(game.fallText ? game.fallText(P) : 'Oops, you fell!'); m.x = respawn; placeOnGround(m); m.inv = 1.5; }
    if (P.rival && !P.stopped) P.rival.x += P.rival.speed * dt;
    game.update && game.update(dt, P, false);
    const camT = m.x * P.T - api.W * 0.35, maxC = P.lv.cols.length * P.T - api.W;
    P.cam += (clamp(camT, 0, Math.max(0, maxC)) - P.cam) * Math.min(1, dt * 8);
  }
  function hurt(why) { if (api.loseHeart(why)) return; }
  P.hurt = hurt;

  // ------------------------------------------------ drawing
  function draw(ctx, W, H, title) {
    const th = game.theme || {};
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, th.sky1 || '#8fd3ff'); g.addColorStop(1, th.sky2 || '#e6f7ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (!P.lv) { // title screen: a calm scene
      ctx.fillStyle = th.ground || '#7cc464'; ctx.fillRect(0, H * 0.78, W, H); (th.deco || ['☁️']).forEach((e, i) => emoji(ctx, e, (i * 211 + 80) % W, H * 0.25 + (i % 3) * 50, 46));
      return;
    }
    if (base === 0 || P.t < 0.2) resize();
    const T = P.T, top = base - ROWS * T, cam = P.cam;
    // parallax background
    (th.deco || ['☁️', '🌳']).forEach((e, i) => { const k = i % 2 ? 0.25 : 0.12, x = ((i * 260 - cam * k) % (W + 300) + W + 300) % (W + 300) - 150; emoji(ctx, e, x, top + (i % 2 ? T * 3.5 : T * 1.2) + (i % 3) * 10, i % 2 ? T * 1.5 : T * 1.1, { alpha: 0.5 }); });
    th.backdrop && th.backdrop(ctx, W, H, cam, P);
    if (P.rival) { const rx = P.rival.x * T - cam; emoji(ctx, P.rival.e, rx, top + T * (P.rival.row ?? 5.2), T * 1.4, { flip: true }); }
    const c0 = Math.max(0, Math.floor(cam / T) - 1), c1 = Math.min(P.lv.cols.length - 1, Math.ceil((cam + W) / T) + 1);
    for (let i = c0; i <= c1; i++) {
      const c = P.lv.cols[i], x = i * T - cam;
      if (c.g === 0) { const y = top + (ROWS - 1.6) * T; ctx.fillStyle = th.pit || 'rgba(40,28,18,.85)'; ctx.fillRect(x, y, T + 1, H - y); }
      if (c.g > 0) {
        const y = top + (ROWS - c.g) * T;
        ctx.fillStyle = th.ground || '#8b5a2b'; ctx.fillRect(x, y, T + 1, H - y);
        ctx.fillStyle = th.grass || '#5cbf4a'; ctx.fillRect(x, y, T + 1, T * 0.28);
        if (th.bridge && c.bridged) { ctx.fillStyle = th.bridge; ctx.fillRect(x, y, T + 1, T * 0.45); }
      }
      if (c.wall) { const y = top + (ROWS - c.g - c.wall) * T; ctx.fillStyle = th.wall || '#b5651d'; ctx.fillRect(x + 2, y, T - 4, c.wall * T); ctx.strokeStyle = 'rgba(0,0,0,.18)'; for (let k = 0; k < c.wall; k++) ctx.strokeRect(x + 2, y + k * T, T - 4, T); }
      if (c.plat) c.plat.forEach(r => { const y = top + (ROWS - r) * T; ctx.fillStyle = th.plat || '#c98b4f'; roundRect(ctx, x, y, T + 1, T * 0.32, 4); ctx.fill(); });
    }
    // stations (the game draws its signs, panels and machines)
    for (const st of P.lv.stations) { const x = (st.x + 0.5) * T - cam; if (x > -T * 8 && x < W + T * 8) game.drawStation && game.drawStation(ctx, st, x, top + (ROWS - (P.lv.cols[st.x].g || 2)) * T, T, P); }
    // items
    for (const it of items) {
      if (it.got && it.t === 'coin') continue;
      const x = it.x * T - cam; if (x < -T || x > W + T) continue;
      const gy = P.groundY(it.x), y = it.row != null ? top + (it.row + 0.5) * T : top + (gy != null ? gy : ROWS * T) - T * 0.6;
      if (it.t === 'coin') emoji(ctx, th.coin || '⭐', x, y + Math.sin(P.t * 4 + it.x) * 3, T * 0.62);
      else if (it.t === 'heart') emoji(ctx, '❤️', x, y, T * 0.6);
      else if (it.t === 'flag') emoji(ctx, it.got ? '🚩' : '🏳️', x, y - T * 0.3, T * 1.1);
      else if (it.t === 'goal') emoji(ctx, th.goal || '🏁', x, y - T * 0.5, T * 1.8);
      else if (!it.got && game.drawItem) game.drawItem(ctx, it, x, y, T, P);
    }
    for (const f of foes) {
      if (!f.alive && f.dead > 0.5) continue;
      const x = f.x * T - cam, y = top + f.y * T - T * 0.45; if (x < -T || x > W + T) continue;
      emoji(ctx, f.t === 'walk' ? (th.walker || '🐌') : (th.flyer || '🐝'), x, y + (f.alive ? 0 : f.dead * T), T * 0.9, { flip: f.dir > 0, alpha: f.alive ? 1 : 1 - f.dead * 2 });
    }
    // you
    const m = P.me, mx = m.x * T - cam, my = top + m.y * T;
    if (!(m.inv > 0 && Math.floor(P.t * 12) % 2)) {
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(mx, my, T * 0.3, T * 0.08, 0, 0, 7); ctx.fill();
      if (game.drawHero) game.drawHero(ctx, mx, my, T, P);
      else { ctx.fillStyle = api.kid.color || '#ff9d3d'; ctx.beginPath(); ctx.arc(mx, my - T * 0.45, T * 0.42, 0, 7); ctx.fill(); emoji(ctx, hero(), mx, my - T * 0.45, T * 0.6, { flip: m.face < 0 }); }
    }
    game.drawOver && game.drawOver(ctx, W, H, P, { top, T, cam });
    P.puz.draw(ctx, W, H);
  }
  P.toScreen = (x, row) => ({ x: x * P.T - P.cam, y: base - ROWS * P.T + row * P.T });

  return {
    start, update, draw, resize,
    onTap(x, y) { if (P.puz.on) { P.puz.down(x, y); return; } if (game.onTap && game.onTap(x, y, P)) return; if (P.me && !P.stopped && (P.me.on || P.me.coyote > 0)) physicsJump(); },
    onMove(x, y) { P.puz.move(x, y); },
    onUp(x, y) { P.puz.up(x, y); },
    tapZone: () => P.puz.on,
    stop() { P.lv = null; P.puz.close(); document.body.classList.remove('chime-top'); api.progress(null); },
    checkpoint() { if (P.me) { P.me.x = respawn; placeOnGround(P.me); P.me.inv = 2; } api.toast('🚩 Back to your checkpoint!'); },
    P, _P: P,
  };
  function physicsJump() { const m = P.me; m.vy = -JUMP; m.on = false; m.coyote = 0; Sfx.pop(); }
}

/** Helpers for games: fill a gap with a bridge, open a wall or door. */
export function openStation(P, st) {
  st.done = true; st.active = false;
  for (let i = st.from; i < st.to; i++) { const c = P.lv.cols[i]; if (st.kind === 'gap') { c.g = 2; c.bridged = true; } else c.wall = 0; }
  P.puz.close(); P.setActs();
}

/**
 * The usual station flow: open the puzzle, record the first try, open the way on success,
 * lose a heart and explain on a miss (after 3 misses, show how).
 * o = { w, prompt, check: v => true|false|null, why, fail: v => text, reveal: () => void, given: v => text, expected, label, icon, S: { solved, n, o }, progress: 'Gates', after: () => void }
 */
export function runStation(api, P, st, o) {
  st.tries = 0; st.recorded = false; st.reveal = o.reveal; // (tests use st.reveal)
  const record = (ok, v) => {
    if (st.recorded) return; st.recorded = true;
    const r = api.record({ level: st.lvl, correct: ok, prompt: String(o.prompt).replace(/<[^>]+>/g, ''), expected: o.expected || '', given: o.given ? o.given(v) : String(v ?? ''), boss: o.S.o.boss });
    if (r.levelUp) setTimeout(() => api.chime(`⬆️ <b>Level up!</b> ${api.levelInfo(api.state.level).name}`, '🏆'), 900);
    if (r.gradeBoss) setTimeout(() => api.chime('🎓 You mastered this grade! The <b>Grade Boss</b> is ready on the menu.', '🏆'), 900);
  };
  P.puz.open(o.w, { prompt: o.prompt, check: o.label || '✔ Check', onCheck: v => {
    const ok = o.check(v);
    if (ok === null) { api.toast('Choose first!', 1200); return false; }
    record(ok, v);
    if (ok) {
      openStation(P, st); o.S.solved++; api.sfx.correct(); api.confetti();
      if (o.why) api.chime(`✅ ${o.why}`, o.icon, { ms: 6500 });
      api.progress(o.S.solved / o.S.n, o.progress || '');
      o.after && o.after(true);
      return true;
    }
    st.tries++;
    const msg = o.fail ? o.fail(v) : 'Not quite!';
    if (st.tries >= 3 && o.reveal) { o.reveal(); api.chime(`🤝 Let's do it together. ${o.why || ''}`, o.icon, { ms: 9000 }); }
    else api.chime(`${msg}${st.tries >= 2 && o.why ? ' ' + o.why : ''}`, o.icon, { ms: 8000 });
    api.loseHeart();
    return false;
  } });
}

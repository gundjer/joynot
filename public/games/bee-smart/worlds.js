// Bee Smart worlds: one per grade. Each world adds a new kind of danger.
// K Sunny Meadow · 1 Windy Orchard · 2 Rainy Garden · 3 Farm Fields · 4 City Rooftops · 5 Hornet Raid
// Everything here is in WORLD pixels (the field is bigger than the screen; the camera follows the bee).
import { rand, pick, clamp, emoji, roundRect } from '../_play/play.js';

export const WW = 1800, WH = 1300;
export const HIVE = { x: 190, y: WH / 2, r: 70 };

export const WORLDS = [
  { id: 0, name: 'Sunny Meadow', icon: '🌼', ground: ['#a8e07a', '#8fd06a'], flowers: ['🌼', '🌸', '🌷', '🌻', '🍀'], fruit: ['🍓'], need: 4,
    haz: { hornets: 1, wander: 55, chase: 115, chaseR: 230, birdEvery: 17 }, dangers: ['hornet', 'bird'],
    intro: 'Welcome to the Sunny Meadow! Fly Buzzy to the flowers. Each flower has a puzzle inside. Solve it to pollinate the flower and collect pollen for the hive.' },
  { id: 1, name: 'Windy Orchard', icon: '🍎', ground: ['#b6e38a', '#9bd277'], flowers: ['🌸', '💮', '🌼', '🍀'], fruit: ['🍎', '🍒', '🍐'], need: 5,
    haz: { hornets: 1, wander: 65, chase: 135, chaseR: 240, birdEvery: 20, webs: 4, wind: { every: 11, dur: 3.2, force: 150 } }, dangers: ['hornet', 'web', 'wind', 'bird'],
    intro: 'This is the Windy Orchard. Fruit trees bloom here, and every blossom you pollinate can grow into a fruit! Watch out for wind and spider webs.' },
  { id: 2, name: 'Rainy Garden', icon: '🌧️', ground: ['#94cf7c', '#7dbd69'], flowers: ['🌷', '🌺', '🌹', '🌼'], fruit: ['🥒', '🍅'], need: 5,
    haz: { hornets: 1, wander: 70, chase: 145, chaseR: 250, birdEvery: 19, rain: 2, leaves: 5 }, dangers: ['hornet', 'rain', 'bird'],
    intro: 'Welcome to the Rainy Garden. Rain clouds drift across. Hide under a big leaf until they pass, or your wings get too wet!' },
  { id: 3, name: 'Farm Fields', icon: '🌻', ground: ['#c9de86', '#b3cf6e'], flowers: ['🌻', '🍀', '🌼'], fruit: ['🎃', '🍉'], need: 6,
    haz: { hornets: 2, wander: 75, chase: 155, chaseR: 250, birdEvery: 19, spray: 13 }, dangers: ['hornet', 'spray', 'bird'],
    intro: 'These are the Farm Fields. Farmers need bees to grow pumpkins and melons. Watch out for the tractor’s spray!' },
  { id: 4, name: 'City Rooftops', icon: '🏙️', ground: ['#b9bec7', '#a9afb9'], flowers: ['🌺', '🌹', '🌷', '🌸'], fruit: ['🍅', '🍓'], need: 6,
    haz: { hornets: 1, wander: 80, chase: 160, chaseR: 250, birdEvery: 14, towers: true, wind: { every: 13, dur: 3, force: 160 } }, dangers: ['tower', 'bird', 'wind', 'hornet'],
    intro: 'Welcome to the City! Bees live in cities too. Find flowers in the parks and window boxes, and use the compass to find your way home.' },
  { id: 5, name: 'Hornet Raid', icon: '🛡️', ground: ['#d6c27a', '#c7af62'], flowers: ['🌻', '🌼', '🌺', '🍀'], fruit: ['🎃', '🍎'], need: 6,
    haz: { hornets: 3, wander: 90, chase: 170, chaseR: 260, birdEvery: 18, raid: true }, dangers: ['hornet', 'bird', 'raid'],
    intro: 'Hornet season! Hornets are scouting for hives to attack. Collect pollen fast, then help the guard bees defend the hive.' },
];

// ---------------------------------------------------------------- seeded randomness so a world looks the same while you play it
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/** Build the static scenery for a world (trees, puddles, crop rows, towers, leaves, webs). */
export function buildScenery(world, seed) {
  const R = rng(seed), sc = { decor: [], towers: [], leaves: [], webs: [], rows: [] };
  const free = (x, y, d) => Math.hypot(x - HIVE.x, y - HIVE.y) > d;
  if (world.id === 0) for (let i = 0; i < 70; i++) sc.decor.push({ e: R() < 0.7 ? '🌱' : '🍄', x: R() * WW, y: R() * WH, s: 18 + R() * 10, a: 0.55 });
  if (world.id === 1) for (let x = 360; x < WW - 80; x += 260) for (let y = 140; y < WH - 80; y += 300) sc.decor.push({ e: '🌳', x: x + (R() - 0.5) * 60, y: y + (R() - 0.5) * 60, s: 90, a: 1, tree: true });
  if (world.id === 2) { for (let i = 0; i < 14; i++) sc.decor.push({ puddle: true, x: R() * WW, y: R() * WH, s: 40 + R() * 40 }); }
  if (world.id === 3) { for (let y = 60; y < WH; y += 110) sc.rows.push(y); sc.decor.push({ e: '🏚️', x: WW - 140, y: 140, s: 110, a: 1 }); }
  if (world.id === 4) {
    for (let gx = 0; gx < 5; gx++) for (let gy = 0; gy < 4; gy++) {
      const x = 420 + gx * 280, y = 110 + gy * 300;
      if (R() < 0.55) sc.towers.push({ x: x + R() * 40, y: y + R() * 40, w: 120 + R() * 50, h: 120 + R() * 60 });
      else sc.decor.push({ park: true, x: x + 20, y: y + 20, w: 170, h: 160 });
    }
  }
  if (world.id === 5) for (let i = 0; i < 40; i++) sc.decor.push({ e: '🍂', x: R() * WW, y: R() * WH, s: 20 + R() * 10, a: 0.6 });
  const leaves = world.haz.leaves || 0;
  for (let i = 0; i < leaves; i++) { let p; do { p = { x: 420 + R() * (WW - 520), y: 120 + R() * (WH - 240) }; } while (!free(p.x, p.y, 260)); sc.leaves.push({ ...p, r: 70 }); }
  const webs = world.haz.webs || 0;
  for (let i = 0; i < webs; i++) { let p; do { p = { x: 500 + R() * (WW - 600), y: 140 + R() * (WH - 280) }; } while (!free(p.x, p.y, 320)); sc.webs.push({ ...p, r: 44 }); }
  return sc;
}

export function inTower(sc, x, y, pad = 0) { return sc.towers.some(t => x > t.x - pad && x < t.x + t.w + pad && y > t.y - pad && y < t.y + t.h + pad); }

/** Ground, scenery and the hive (draw in world coordinates; the camera transform is already applied). */
export function drawWorld(ctx, world, sc, t, view) {
  const g = ctx.createLinearGradient(0, 0, 0, WH); g.addColorStop(0, world.ground[0]); g.addColorStop(1, world.ground[1]);
  ctx.fillStyle = g; ctx.fillRect(-400, -400, WW + 800, WH + 800);
  // edge of the field
  ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 8; ctx.strokeRect(0, 0, WW, WH);
  if (world.id === 3) { sc.rows.forEach((y, i) => { ctx.fillStyle = i % 2 ? 'rgba(140,100,40,.22)' : 'rgba(80,140,40,.18)'; ctx.fillRect(320, y, WW - 320, 46); }); }
  if (world.id === 4) {
    ctx.fillStyle = '#8f96a1'; for (let x = 380; x < WW; x += 280) ctx.fillRect(x, 0, 30, WH); for (let y = 70; y < WH; y += 300) ctx.fillRect(0, y, WW, 30);
    ctx.fillStyle = '#fff'; for (let x = 380; x < WW; x += 280) for (let y = 0; y < WH; y += 60) ctx.fillRect(x + 13, y, 4, 26);
  }
  const inView = (x, y, m = 120) => x > view.x - m && x < view.x + view.w + m && y > view.y - m && y < view.y + view.h + m;
  for (const d of sc.decor) {
    if (d.puddle) { if (!inView(d.x, d.y)) continue; ctx.fillStyle = 'rgba(90,150,200,.35)'; ctx.beginPath(); ctx.ellipse(d.x, d.y, d.s, d.s * 0.6, 0, 0, 7); ctx.fill(); continue; }
    if (d.park) { ctx.fillStyle = '#86cf6d'; roundRect(ctx, d.x, d.y, d.w, d.h, 20); ctx.fill(); continue; }
    if (!inView(d.x, d.y)) continue;
    emoji(ctx, d.e, d.x, d.y, d.s, { alpha: d.a });
  }
  for (const w of sc.towers) {
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(w.x + 12, w.y + 12, w.w, w.h);
    ctx.fillStyle = '#6c7380'; ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#7d8592'; ctx.fillRect(w.x + 10, w.y + 10, w.w - 20, w.h - 20);
    ctx.fillStyle = '#5b616c'; ctx.fillRect(w.x + w.w * 0.2, w.y + w.h * 0.25, 26, 18); ctx.fillRect(w.x + w.w * 0.6, w.y + w.h * 0.6, 22, 22);
  }
  for (const w of sc.webs) drawWeb(ctx, w.x, w.y, w.r);
  drawHive(ctx, HIVE.x, HIVE.y, 120, t);
}

export function drawLeaves(ctx, sc) { for (const l of sc.leaves) { ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(l.x + 8, l.y + 10, l.r, l.r * 0.75, 0, 0, 7); ctx.fill(); emoji(ctx, '🍃', l.x, l.y, l.r * 2, { alpha: 0.92 }); } }

export function drawHive(ctx, x, y, size, t = 0) {
  // a tree stump with a hanging hive (drawn, so it looks the same on every phone)
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(6, size * 0.48, size * 0.5, size * 0.14, 0, 0, 7); ctx.fill();
  const layers = 5;
  for (let i = 0; i < layers; i++) {
    const w = size * (0.42 + 0.12 * Math.sin((i + 0.5) / layers * Math.PI)), hy = -size * 0.42 + i * size * 0.18;
    ctx.fillStyle = i % 2 ? '#f0a800' : '#ffc21a'; ctx.beginPath(); ctx.ellipse(0, hy, w, size * 0.12, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#a66f00'; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.fillStyle = '#4a2c00'; ctx.beginPath(); ctx.ellipse(0, size * 0.18, size * 0.1, size * 0.07, 0, 0, 7); ctx.fill();
  for (let i = 0; i < 3; i++) emoji(ctx, '🐝', Math.cos(t * 2 + i * 2.1) * size * 0.6, Math.sin(t * 3 + i * 2.1) * size * 0.35 - size * 0.1, size * 0.18);
  ctx.restore();
}

export function drawWeb(ctx, x, y, r) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.6;
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke(); }
  for (let k = 1; k <= 4; k++) { ctx.beginPath(); for (let i = 0; i <= 8; i++) { const a = i * Math.PI / 4, rr = r * k / 4; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.stroke(); }
  emoji(ctx, '🕷️', r * 0.25, -r * 0.2, r * 0.6); ctx.restore();
}

/** A hornet (no hornet emoji in the older emoji sets, so we draw one). face: 1 = right, -1 = left. */
export function drawHornet(ctx, x, y, size, t = 0, face = 1, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(face, 1);
  const s = size / 60;
  ctx.scale(s, s);
  // wings
  ctx.fillStyle = 'rgba(220,235,255,.75)'; const fl = Math.sin(t * 40) * 6;
  ctx.beginPath(); ctx.ellipse(-2, -16 - fl * 0.3, 14, 8, -0.5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(8, -15 + fl * 0.3, 12, 7, 0.4, 0, 7); ctx.fill();
  // abdomen with stripes
  ctx.fillStyle = '#e8a10c'; ctx.beginPath(); ctx.ellipse(-12, 2, 18, 11, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#3b1f0b'; for (let i = 0; i < 3; i++) ctx.fillRect(-24 + i * 9, -8, 4, 20);
  ctx.beginPath(); ctx.moveTo(-30, 2); ctx.lineTo(-38, 4); ctx.lineTo(-30, 6); ctx.fill();
  // thorax + head
  ctx.fillStyle = '#5a2d0c'; ctx.beginPath(); ctx.ellipse(8, 0, 10, 9, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#f2b51f'; ctx.beginPath(); ctx.ellipse(22, -1, 9, 9, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#2a1405'; ctx.beginPath(); ctx.ellipse(25, -3, 3.5, 4.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(26, -4.5, 1.3, 0, 7); ctx.fill();
  // angry brow + legs
  ctx.strokeStyle = '#2a1405'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(20, -9); ctx.lineTo(28, -7); ctx.stroke();
  ctx.beginPath(); for (let i = 0; i < 3; i++) { ctx.moveTo(4 + i * 5, 7); ctx.lineTo(1 + i * 6, 16); } ctx.stroke();
  ctx.restore();
}

/** Our bee (emoji) with an optional hat. */
export function drawBee(ctx, x, y, size, t, face, hat, alpha = 1, tint = null) {
  if (tint) { ctx.save(); ctx.globalAlpha = 0.35 * alpha; ctx.fillStyle = tint; ctx.beginPath(); ctx.arc(x, y, size * 0.55, 0, 7); ctx.fill(); ctx.restore(); }
  emoji(ctx, '🐝', x, y + Math.sin(t * 10) * 2, size, { flip: face > 0, alpha });
  if (hat) emoji(ctx, hat, x + face * size * 0.05, y - size * 0.48, size * 0.42, { alpha });
}

// ---------------------------------------------------------------- hazards
/** Make the moving dangers for a trip. */
export function makeHazards(world, boss) {
  const H = { list: [], bird: { next: world.haz.birdEvery * 0.7, warn: 0 }, wind: { next: world.haz.wind ? world.haz.wind.every * 0.6 : 99, on: 0, dx: 0, dy: 0, warn: 0 }, spray: { next: world.haz.spray ? 6 : 99, puffs: [] }, clouds: [] };
  const n = (world.haz.hornets || 0) + (boss ? 1 : 0);
  for (let i = 0; i < n; i++) H.list.push(newHornet(world, boss));
  for (let i = 0; i < (world.haz.rain || 0); i++) H.clouds.push({ x: 600 + i * 600, y: rand(250, WH - 250), r: 150, vx: (i % 2 ? -1 : 1) * rand(40, 60), vy: rand(-20, 20) });
  H.speedK = boss ? 1.15 : 1;
  return H;
}
let _hid = 1;
export function newHornet(world, boss, at) {
  const p = at || { x: rand(700, WW - 100), y: rand(100, WH - 100) };
  return { id: _hid++, k: 'hornet', x: p.x, y: p.y, vx: 0, vy: 0, turn: 0, mode: 'wander', flee: 0, face: 1, raid: !!(at && at.raid) };
}

/**
 * Move the dangers. hooks: { bee: {x,y}, safe: bool (under a leaf / in a challenge), hit(kind, why), stuckFor(s), toast(t) }
 */
export function updateHazards(H, world, sc, dt, t, hooks) {
  const b = hooks.bee, k = H.speedK;
  // hornets
  for (const h of H.list) {
    if (h.gone) continue;
    h.flee = Math.max(0, h.flee - dt);
    const dx = b.x - h.x, dy = b.y - h.y, d = Math.hypot(dx, dy) || 1;
    const nearHive = Math.hypot(h.x - HIVE.x, h.y - HIVE.y) < HIVE.r + 160;
    if (h.raid) {
      const hx = HIVE.x - h.x, hy = HIVE.y - h.y, hd = Math.hypot(hx, hy) || 1;
      h.vx = hx / hd * 70; h.vy = hy / hd * 70;
    } else if (h.flee > 0) {
      h.vx = -dx / d * 220; h.vy = -dy / d * 220;
    } else if (!hooks.safe && d < world.haz.chaseR && !nearHive && !b.shelter) {
      h.mode = 'chase'; h.vx = dx / d * world.haz.chase * k; h.vy = dy / d * world.haz.chase * k;
    } else {
      h.mode = 'wander'; h.turn -= dt;
      if (h.turn <= 0) { const a = Math.random() * Math.PI * 2, s = world.haz.wander * k; h.vx = Math.cos(a) * s; h.vy = Math.sin(a) * s; h.turn = 1.6 + Math.random() * 1.8; }
      if (nearHive) { const ax = h.x - HIVE.x, ay = h.y - HIVE.y, ad = Math.hypot(ax, ay) || 1; h.vx = ax / ad * 90; h.vy = ay / ad * 90; }
    }
    h.x += h.vx * dt; h.y += h.vy * dt;
    if (!h.raid) { h.x = clamp(h.x, 30, WW - 30); h.y = clamp(h.y, 30, WH - 30); }
    if (sc.towers.length && inTower(sc, h.x, h.y)) { h.x -= h.vx * dt * 2; h.y -= h.vy * dt * 2; h.turn = 0; }
    if (h.vx) h.face = h.vx > 0 ? 1 : -1;
    if (!hooks.safe && d < 42 && h.flee <= 0 && !h.raid) { if (hooks.hit('hornet', 'A hornet got you! Fly away from hornets.')) h.flee = 3; }
  }
  // birds swoop: a shadow warns first
  const bd = H.bird;
  if (world.haz.birdEvery) {
    if (!bd.active && !bd.warn) { bd.next -= dt; if (bd.next <= 0) { const fromLeft = Math.random() < 0.5, y = clamp(b.y + rand(-80, 80), 60, WH - 60); bd.warn = 1.7; bd.y0 = y; bd.dir = fromLeft ? 1 : -1; bd.x = fromLeft ? b.x - 900 : b.x + 900; bd.y = y; bd.vy = rand(-40, 40); } }
    else if (bd.warn) { bd.warn -= dt; if (bd.warn <= 0) { bd.warn = 0; bd.active = true; } }
    else if (bd.active) {
      bd.x += bd.dir * 560 * dt; bd.y += bd.vy * dt;
      if (!hooks.safe && Math.hypot(bd.x - b.x, bd.y - b.y) < 40) hooks.hit('bird', world.id === 4 ? 'A pigeon bumped you!' : 'A bird swooped at you! Watch for the shadow.');
      if ((bd.dir > 0 && bd.x > b.x + 1000) || (bd.dir < 0 && bd.x < b.x - 1000)) { bd.active = false; bd.next = world.haz.birdEvery * (0.7 + Math.random() * 0.6); }
    }
  }
  // wind gusts
  const wd = H.wind, wcfg = world.haz.wind;
  if (wcfg) {
    if (wd.on > 0) { wd.on -= dt; if (!hooks.safe) { b.vx += wd.dx * wcfg.force * dt; b.vy += wd.dy * wcfg.force * dt; } }
    else if (wd.warn > 0) { wd.warn -= dt; if (wd.warn <= 0) wd.on = wcfg.dur; }
    else { wd.next -= dt; if (wd.next <= 0) { const a = pick([0, Math.PI, Math.PI / 2, -Math.PI / 2, Math.PI / 4, Math.PI * 1.25]); wd.dx = Math.cos(a); wd.dy = Math.sin(a); wd.warn = 1.4; wd.next = wcfg.every * (0.8 + Math.random() * 0.5); hooks.toast && hooks.toast('🌀 Wind is coming!'); } }
  }
  // webs
  for (const w of sc.webs) if (!hooks.safe && Math.hypot(w.x - b.x, w.y - b.y) < w.r) { if (hooks.hit('web', 'Stuck in a spider web! Fly around the webs.')) hooks.stuckFor(1.2); }
  // rain clouds
  b.inRain = false;
  for (const c of H.clouds) {
    c.x += c.vx * dt; c.y += c.vy * dt;
    if (c.x < 350 || c.x > WW - 100) c.vx *= -1; if (c.y < 150 || c.y > WH - 150) c.vy *= -1;
    if (Math.hypot(c.x - b.x, c.y - b.y) < c.r) b.inRain = true;
  }
  if (b.inRain && !b.shelter && !hooks.safe) { b.wet += dt; if (b.wet >= 3.2) { b.wet = 0; hooks.hit('rain', 'Your wings got soaked! Hide under a leaf 🍃 when it rains.'); } }
  else b.wet = Math.max(0, b.wet - dt * 0.8);
  // crop sprayer tractor
  const sp = H.spray;
  if (world.haz.spray) {
    if (!sp.tr) { sp.next -= dt; if (sp.next <= 0) { const y = clamp(b.y + rand(-160, 160), 120, WH - 120), dir = Math.random() < 0.5 ? 1 : -1; sp.tr = { x: dir > 0 ? 300 : WW + 60, y, dir, warn: 2 }; hooks.toast && hooks.toast('🚜 Tractor coming! Stay out of the spray.'); } }
    else {
      const tr = sp.tr;
      if (tr.warn > 0) tr.warn -= dt;
      else { tr.x += tr.dir * 210 * dt; tr.puffT = (tr.puffT || 0) - dt; if (tr.puffT <= 0) { tr.puffT = 0.12; sp.puffs.push({ x: tr.x - tr.dir * 50, y: tr.y + rand(-20, 20), r: 34 + Math.random() * 14, life: 4 }); } if (tr.x < 260 || tr.x > WW + 80) { sp.tr = null; sp.next = world.haz.spray * (0.8 + Math.random() * 0.5); } }
    }
    for (const p of sp.puffs) { p.life -= dt; if (!hooks.safe && p.life > 0.6 && Math.hypot(p.x - b.x, p.y - b.y) < p.r) hooks.hit('spray', 'The spray made Buzzy sick! Stay out of the spray cloud.'); }
    sp.puffs = sp.puffs.filter(p => p.life > 0);
  }
}

export function drawHazards(ctx, H, world, t, bee) {
  // rain clouds (shadow + rain)
  for (const c of H.clouds) {
    ctx.fillStyle = 'rgba(40,70,120,.22)'; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(70,120,200,.55)'; ctx.lineWidth = 2;
    for (let i = 0; i < 26; i++) { const a = i * 2.39, rr = (i * 37 % 100) / 100 * c.r * 0.9, x = c.x + Math.cos(a) * rr, y = c.y + Math.sin(a) * rr + ((t * 300 + i * 23) % 40) - 20; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 12); ctx.stroke(); }
    emoji(ctx, '☁️', c.x, c.y - c.r * 0.55, c.r * 1.2, { alpha: 0.9 });
  }
  // spray
  const sp = H.spray;
  for (const p of sp.puffs) { ctx.fillStyle = `rgba(150,200,120,${clamp(p.life / 4, 0, 1) * 0.5})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
  if (sp.tr) {
    const tr = sp.tr;
    if (tr.warn > 0) { ctx.fillStyle = `rgba(255,80,60,${0.15 + 0.15 * Math.sin(t * 12)})`; ctx.fillRect(0, tr.y - 50, WW, 100); }
    emoji(ctx, '🚜', tr.x, tr.y, 80, { flip: tr.dir > 0 });
  }
  for (const h of H.list) if (!h.gone) drawHornet(ctx, h.x, h.y, 64, t, h.face, h.flee > 0 ? 0.6 : 1);
  // bird: warning shadow, then the bird
  const bd = H.bird;
  if (bd.warn > 0) { const x = bee.x + bd.dir * -10; ctx.fillStyle = `rgba(0,0,0,${0.25 + 0.15 * Math.sin(t * 14)})`; ctx.beginPath(); ctx.ellipse(x, bd.y0, 60, 22, 0, 0, 7); ctx.fill(); }
  if (bd.active) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(bd.x, bd.y + 30, 34, 12, 0, 0, 7); ctx.fill(); emoji(ctx, '🐦', bd.x, bd.y, 62, { flip: bd.dir > 0 }); }
}

/** Screen-space overlays for dangers (wind arrows, bird warning arrow). */
export function drawHazardHud(ctx, H, W, H2, t, toScreen, bee) {
  const wd = H.wind;
  if (wd.warn > 0 || wd.on > 0) {
    ctx.save(); ctx.globalAlpha = wd.on > 0 ? 0.55 : 0.35 + 0.3 * Math.sin(t * 10); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    for (let i = 0; i < 14; i++) { const x = ((i * 97 + t * 400 * wd.dx) % W + W) % W, y = ((i * 61 + t * 400 * wd.dy) % H2 + H2) % H2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - wd.dx * 40, y - wd.dy * 40); ctx.stroke(); }
    ctx.restore();
    const cx = W / 2, cy = H2 * 0.32; ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.atan2(wd.dy, wd.dx));
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(0, -22); ctx.lineTo(0, -9); ctx.lineTo(-40, -9); ctx.lineTo(-40, 9); ctx.lineTo(0, 9); ctx.lineTo(0, 22); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  const bd = H.bird;
  if (bd.warn > 0) { const p = toScreen(bee.x, bd.y0), x = bd.dir > 0 ? 34 : W - 34; ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(x, p.y, 22, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '800 26px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', x, p.y + 1); }
}

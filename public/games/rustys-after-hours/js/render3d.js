// The 3D view for Flashlight Nights: real walls, floor and ceiling in perspective (ray casting on the night's map,
// like classic 3D games), so the kid walks through the rooms instead of looking down on them.
// The camera is the kid's eyes; the kid's back and flashlight show at the bottom of the screen.
// Animatronics, furniture, hiding spots and items stand in the rooms as pictures that always face you.
// Lighting by scare tier: Gentle = lights on; Spooky-lite = dim + big flashlight; Spooky = dark + small flashlight.
// Draws into a small offscreen picture (fast on phones), then scales it up to fill the screen.
import { T, CW, CH, roomAt } from './world.js';
import { buildTextures, TS, THEME_LIST } from './textures.js';
import { Art, CAST, ART_W, ART_H, eyePoints } from './animatronics.js';
import { getTier } from './characters.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const LIGHT = [ // per tier: ambient, flashlight range, cone width, cone height, aura
  { amb: 0.92, range: 10, cw: 0.62, ch: 0.75, aura: 0.1, fog: 26 },
  { amb: 0.13, range: 8.5, cw: 0.44, ch: 0.58, aura: 0.38, fog: 99 },
  { amb: 0.045, range: 6.6, cw: 0.34, ch: 0.46, aura: 0.3, fog: 99 },
];

export class Renderer3D {
  constructor(canvas) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.buf = document.createElement('canvas'); this.bctx = this.buf.getContext('2d');
    this.tier = -1; this.tex = null; this.world = null; this.props = new Map(); this.shaded = new WeakMap();
    this.resize();
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = dpr; this.w = window.innerWidth; this.h = window.innerHeight;
    this.c.width = Math.round(this.w * dpr); this.c.height = Math.round(this.h * dpr);
    this.c.style.width = this.w + 'px'; this.c.style.height = this.h + 'px';
    // internal picture: about 1 pixel per 2–3 screen pixels, capped so phones stay smooth
    let RW = clamp(Math.round(this.w / 2.3), 240, 460), RH = Math.round(RW * this.h / this.w);
    const max = 105000;
    if (RW * RH > max) { const k = Math.sqrt(max / (RW * RH)); RW = Math.round(RW * k); RH = Math.round(RH * k); }
    this.RW = RW; this.RH = RH;
    this.buf.width = RW; this.buf.height = RH;
    this.img = this.bctx.createImageData(RW, RH);
    this.px = new Uint32Array(this.img.data.buffer);
    this.zbuf = new Float32Array(RW);
    this.spotX = new Float32Array(RW); this.spotY = new Float32Array(RH);
    // field of view: wider on wide screens, a bit narrower on tall phones
    this.plane = clamp(0.5 * (RW / RH) * 0.75, 0.46, 0.85);
    this.focal = (RW / 2) / this.plane;
    this.TS = Math.max(30, Math.min(this.w, this.h) / 12); // kept for old code that reads renderer.TS
  }

  /** New night: textures for the tier + lookup maps. */
  setWorld(w, tier) {
    if (tier !== this.tier || !this.tex) { this.tex = buildTextures(tier); this.tier = tier; this.props.clear(); }
    this.world = w;
    const theme = new Uint8Array(w.W * w.H);
    for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) {
      let r = roomAt(w, x, y);
      if (!r) r = roomAt(w, x, y + 1) || roomAt(w, x + 1, y) || roomAt(w, x, y - 1) || roomAt(w, x - 1, y);
      theme[y * w.W + x] = r ? Math.max(0, THEME_LIST.indexOf(r.theme)) : 0;
    }
    this.themeMap = theme;
    this.posterAt = new Map();
    for (const d of w.decor) if (d.type === 'poster') this.posterAt.set(d.y * w.W + d.x, d.v);
    this.floorTex = THEME_LIST.map(t => this.tex.floors[t]);
    this.wallTex = THEME_LIST.map(t => this.tex.walls[t]);
  }

  // ------------------------------------------------------------------ one frame
  draw(g) {
    const w = g.world; if (w !== this.world) this.setWorld(w, getTier());
    const { RW, RH, px, zbuf, focal } = this;
    const tier = this.tier, Lt = LIGHT[tier];
    const p = g.player;
    const dirX = Math.cos(g.lightAngle), dirY = Math.sin(g.lightAngle);
    const planeX = -dirY * this.plane, planeY = dirX * this.plane;
    const posX = p.x, posY = p.y;
    const bob = g.moving && !p.hidden ? Math.sin(g.time * 11) * RH * 0.008 : 0;
    const horizon = RH / 2 + bob;
    const W = w.W, H = w.H, tiles = w.tiles;

    // lighting
    const hidden = !!p.hidden;
    const amb = Lt.amb * (hidden ? 0.6 : 1);
    let flash = g.lightOn && !hidden ? 1.25 : 0;
    if (flash && g.battery < 20 && Math.random() < 0.12) flash *= 0.4;
    if (tier === 0) flash *= 0.25; // lights are on in Gentle mode
    const aura = Lt.aura, range = Lt.range, fog = Lt.fog;
    const cx = RW / 2, cyS = horizon + RH * 0.05;
    for (let x = 0; x < RW; x++) { const d = (x - cx) / (RW * Lt.cw); this.spotX[x] = d * d < 1 ? 1 - d * d : 0; }
    for (let y = 0; y < RH; y++) { const d = (y - cyS) / (RH * Lt.ch); this.spotY[y] = d * d < 1 ? 1 - d * d : 0; }
    const fall = d => { const k = 1 - d / range; return k > 0 ? k * k * 0.6 + k * 0.4 : 0; };
    const auraAt = d => (d < 2.4 ? aura * (1 - d / 2.4) : 0);
    const fogAt = d => (d < fog ? 1 - d / fog * 0.55 : 0.45);
    const shade = (c, L) => {
      const k = L >= 1.2 ? 307 : (L * 256) | 0;
      let r = ((c & 255) * k) >> 8, gg = (((c >> 8) & 255) * k) >> 8, b = (((c >> 16) & 255) * k) >> 8;
      if (r > 255) r = 255; if (gg > 255) gg = 255; if (b > 255) b = 255;
      return 0xff000000 | (b << 16) | (gg << 8) | r;
    };

    // ---- floor + ceiling (row by row)
    const rdx0 = dirX - planeX, rdy0 = dirY - planeY, rdx1 = dirX + planeX, rdy1 = dirY + planeY;
    const ceil = this.tex.ceiling.px, ftex = this.floorTex, theme = this.themeMap;
    for (let y = Math.ceil(horizon); y < RH; y++) {
      const pz = y - horizon + 0.5;
      const rowDist = (focal * 0.5) / pz;
      const stepX = rowDist * (rdx1 - rdx0) / RW, stepY = rowDist * (rdy1 - rdy0) / RW;
      let fx = posX + rowDist * rdx0, fy = posY + rowDist * rdy0;
      const rowL = fall(rowDist) * flash, base = (amb + auraAt(rowDist)) * fogAt(rowDist), sy = this.spotY[y];
      const yc = Math.floor(horizon - pz); // mirrored ceiling row
      const sYc = yc >= 0 ? this.spotY[yc] : 0;
      for (let x = 0; x < RW; x++) {
        const cxi = fx | 0, cyi = fy | 0;
        const tx = ((fx - cxi) * TS) & 63, ty = ((fy - cyi) * TS) & 63;
        const th = cxi >= 0 && cyi >= 0 && cxi < W && cyi < H ? theme[cyi * W + cxi] : 0;
        const sx = this.spotX[x];
        px[y * RW + x] = shade(ftex[th].px[ty * TS + tx], base + rowL * sx * sy);
        if (yc >= 0) px[yc * RW + x] = shade(ceil[ty * TS + tx], (base + rowL * sx * sYc * 0.7) * 0.9);
        fx += stepX; fy += stepY;
      }
    }

    // ---- walls (one ray per column)
    const doorAt = w.doorAt, wallTex = this.wallTex, posters = this.tex.posters, posterAt = this.posterAt;
    for (let x = 0; x < RW; x++) {
      const camX = 2 * x / RW - 1;
      const rdx = dirX + planeX * camX, rdy = dirY + planeY * camX;
      let mx = posX | 0, my = posY | 0;
      const ddx = Math.abs(1 / (rdx || 1e-9)), ddy = Math.abs(1 / (rdy || 1e-9));
      let sx, sy, stx, sty;
      if (rdx < 0) { stx = -1; sx = (posX - mx) * ddx; } else { stx = 1; sx = (mx + 1 - posX) * ddx; }
      if (rdy < 0) { sty = -1; sy = (posY - my) * ddy; } else { sty = 1; sy = (my + 1 - posY) * ddy; }
      let side = 0, hit = 0, door = null, n = 0;
      while (n++ < 80) {
        if (sx < sy) { sx += ddx; mx += stx; side = 0; } else { sy += ddy; my += sty; side = 1; }
        if (mx < 0 || my < 0 || mx >= W || my >= H) { hit = 1; break; }
        const t = tiles[my * W + mx];
        if (t === T.WALL) { hit = 1; break; }
        if (t === T.DOOR) { const d = doorAt.get(my * W + mx); if (d && !d.open) { door = d; hit = 2; break; } }
      }
      const perp = Math.max(0.05, side === 0 ? sx - ddx : sy - ddy);
      zbuf[x] = perp;
      let wx = side === 0 ? posY + perp * rdy : posX + perp * rdx; wx -= Math.floor(wx);
      const flip = (side === 0 && rdx < 0) || (side === 1 && rdy > 0);
      let tex, texX;
      if (hit === 2) {
        tex = this.tex.doors[door.kind === 'exit' ? 'exit' : door.kind === 'math' ? 'math' : 'read'];
        let i = 0; for (let k = 0; k < door.tiles.length; k++) if (door.tiles[k][0] === mx && door.tiles[k][1] === my) i = k;
        const u = flip ? 1 - wx : wx; const half = flip ? 1 - i : i, th = tex.h;
        texX = clamp((u * th) | 0, 0, th - 1) + half * th;
      } else {
        const pxm = side === 0 ? mx - stx : mx, pym = side === 1 ? my - sty : my;
        const th = pxm >= 0 && pym >= 0 && pxm < W && pym < H ? theme[pym * W + pxm] : 0;
        const pv = side === 1 && sty < 0 ? posterAt.get(my * W + mx) : undefined;
        tex = pv !== undefined ? posters[THEME_LIST[th]][pv] : wallTex[th];
        texX = clamp(((flip ? 1 - wx : wx) * TS) | 0, 0, 63);
      }
      const lineH = focal / perp;
      const top = horizon - lineH / 2;
      const y0 = Math.max(0, Math.ceil(top)), y1 = Math.min(RH - 1, Math.floor(horizon + lineH / 2));
      const colL = fall(perp) * flash * this.spotX[x], base = (amb + auraAt(perp)) * fogAt(perp) * (side ? 0.84 : 1);
      const tw = tex.w, tp = tex.px, tg = tex.glow, tm = tex.h - 1, step = tex.h / lineH;
      let ty = (y0 - top) * step;
      for (let y = y0; y <= y1; y++) {
        const ti = (ty | 0) & tm; ty += step;
        const k = ti * tw + texX;
        px[y * RW + x] = tg[k] ? (tp[k] | 0xff000000) : shade(tp[k], base + colL * this.spotY[y] * (side ? 0.9 : 1));
      }
    }
    this.bctx.putImageData(this.img, 0, 0);

    // ---- things standing in the rooms (sprites)
    const list = this.spriteList(g);
    const invDet = 1 / (planeX * dirY - dirX * planeY);
    const placed = [];
    for (const s of list) {
      const rx = s.x - posX, ry = s.y - posY;
      const tX = invDet * (dirY * rx - dirX * ry), tY = invDet * (-planeY * rx + planeX * ry);
      s.tY = tY; s.tX = tX;
    }
    list.sort((a, b) => b.tY - a.tY);
    for (const s of list) {
      if (s.tY < 0.15 || !s.img) continue;
      const scrX = (RW / 2) * (1 + s.tX / s.tY);
      const hpx = focal * s.h / s.tY, wpx = focal * s.w / s.tY;
      const floorY = horizon + focal * 0.5 / s.tY;
      const top = floorY - hpx - (s.lift || 0) * focal / s.tY;
      const x0 = Math.round(scrX - wpx / 2), x1 = Math.round(scrX + wpx / 2);
      if (x1 < 0 || x0 >= RW) continue;
      // how lit it is
      const sxI = clamp(scrX | 0, 0, RW - 1), syI = clamp((top + hpx * 0.4) | 0, 0, RH - 1);
      let L = s.glow ? 1 : (amb + auraAt(s.tY)) * fogAt(s.tY) + fall(s.tY) * flash * this.spotX[sxI] * this.spotY[syI];
      if (s.lit) L = Math.max(L, s.lit);
      const img = this.darkened(s.img, L);
      const iw = img.width, ih = img.height;
      let vis = 0;
      const a = s.alpha ?? 1;
      if (a < 1) this.bctx.globalAlpha = a;
      // fully in front of the walls? one draw. Otherwise column by column.
      let allFront = true;
      for (let x = Math.max(0, x0); x <= Math.min(RW - 1, x1); x++) if (s.tY >= zbuf[x]) { allFront = false; break; }
      const sy = s.squash ? hpx * (1 - s.squash) : 0;
      if (allFront) { this.bctx.drawImage(img, x0, top + sy, x1 - x0, hpx - sy); vis = x1 - x0; }
      else for (let x = Math.max(0, x0); x <= Math.min(RW - 1, x1); x++) {
        if (s.tY >= zbuf[x]) continue;
        const u = ((x - x0) / Math.max(1, x1 - x0) * iw) | 0;
        this.bctx.drawImage(img, clamp(u, 0, iw - 1), 0, 1, ih, x, top + sy, 1, hpx - sy); vis++;
      }
      if (a < 1) this.bctx.globalAlpha = 1;
      if (vis) placed.push({ s, x0, x1, top, hpx, scrX, tY: s.tY, L });
    }

    // ---- to the screen
    const ctx = this.ctx, k = this.w / RW, kh = this.h / RH;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.buf, 0, 0, this.w, this.h);

    // glowing eyes in the dark (tiers 1–2): the scary clue that something is there
    if (tier > 0) for (const pl of placed) {
      const m = pl.s.monster; if (!m || !m.active || pl.tY > 11) continue;
      const kind = m.bot ? (m.bot.kind || 'bunny') : CAST[m.id] ? CAST[m.id].kind : 'raccoon';
      const col = tier === 2 ? '#ff3b30' : '#ffe680';
      const a = clamp((11 - pl.tY) / 6, 0.25, 1) * (m.alpha ?? 1) * (pl.L < 0.5 ? 1 : 0.6);
      const sc = pl.hpx / (ART_H + 20);
      ctx.save(); ctx.globalAlpha = a; ctx.shadowColor = col; ctx.shadowBlur = Math.max(6, pl.hpx * kh * 0.05); ctx.fillStyle = col;
      eyePoints(kind).forEach(([ex, ey], i) => {
        const X = (pl.x0 + (ex + 10) / (ART_W + 20) * (pl.x1 - pl.x0)) * k, Y = (pl.top + (ey + 13) * sc) * kh;
        const r = Math.max(1.6, pl.hpx * kh * (tier === 2 && i === 1 ? 0.006 : 0.012));
        ctx.beginPath(); ctx.arc(X, Y, r, 0, 7); ctx.fill();
      });
      ctx.restore();
    }
    // hiding spot outline
    for (const pl of placed) if (pl.s.hide && (pl.s.hide === g.nearHide)) {
      ctx.save(); ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 4; ctx.setLineDash([12, 8]); ctx.shadowColor = '#ffd84a'; ctx.shadowBlur = 10;
      ctx.strokeRect(pl.x0 * k - 4, pl.top * kh - 4, (pl.x1 - pl.x0) * k + 8, pl.hpx * kh + 8); ctx.restore();
    }
    this.lastPlaced = placed;

    // flashlight warm glow
    if (g.lightOn && !hidden && tier > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const R = Math.min(this.w, this.h) * 0.55;
      const gr = ctx.createRadialGradient(this.w / 2, this.h * 0.52, 0, this.w / 2, this.h * 0.52, R);
      gr.addColorStop(0, `rgba(255,225,150,${0.1 + (g.battery < 20 ? Math.random() * 0.04 : 0)})`); gr.addColorStop(1, 'rgba(255,225,150,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, this.w, this.h); ctx.restore();
    }
    if (!hidden) this.kid(g);
    if (hidden) {
      ctx.fillStyle = 'rgba(14,12,18,0.92)';
      for (let y = 0; y < this.h; y += 46) ctx.fillRect(0, y, this.w, 26);
    }
    if (g.danger > 0 && tier > 0) {
      const a = g.danger * (0.25 + 0.15 * Math.sin(g.time * 8));
      const vg = ctx.createRadialGradient(this.w / 2, this.h / 2, Math.min(this.w, this.h) * 0.35, this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.7);
      vg.addColorStop(0, 'rgba(120,0,0,0)'); vg.addColorStop(1, `rgba(160,0,0,${a})`);
      ctx.fillStyle = vg; ctx.fillRect(0, 0, this.w, this.h);
    }
  }

  /** A picture made darker for a light level (cached in 8 steps). */
  darkened(img, L) {
    if (L >= 0.98) return img;
    const lv = clamp(Math.round(L * 8), 0, 7);
    let m = this.shaded.get(img); if (!m) { m = []; this.shaded.set(img, m); }
    if (m[lv]) return m[lv];
    const c = document.createElement('canvas');
    const sc = Math.min(1, 360 / img.height); // small copies are enough for the low-res view
    c.width = Math.max(2, Math.round(img.width * sc)); c.height = Math.max(2, Math.round(img.height * sc));
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = `rgba(4,3,8,${1 - lv / 8})`; x.fillRect(0, 0, c.width, c.height);
    m[lv] = c; return c;
  }

  spriteList(g) {
    const w = g.world, out = [], tier = this.tier;
    for (const pr of w.props) {
      const cx = pr.x + pr.w / 2, cy = pr.y + 0.5;
      const P = this.prop(pr.type);
      out.push({ x: cx, y: cy, w: P.w * pr.w, h: P.h, img: P.c, glow: false, lit: P.lit });
    }
    for (const h of w.hides) {
      const P = this.prop('hide_' + h.type);
      out.push({ x: h.x + 0.5, y: h.y + 0.5, w: P.w, h: P.h, img: P.c, hide: h });
    }
    for (const it of w.items) {
      if (it.taken) continue;
      const P = this.prop('item_' + it.type);
      out.push({ x: it.x, y: it.y, w: P.w, h: P.h, img: P.c, lift: 0.22 + Math.sin(g.time * 3 + it.x) * 0.04, glow: it.type === 'cell', lit: 0.7 });
    }
    for (const m of g.monsters) {
      if (m.state === 'gone') continue;
      const frame = m.moving ? (Math.floor(m.t * 4) % 2) : 0;
      const img = m.bot ? (Art.bot(m.bot, tier, { mood: 'chase', frame }) || Art.bot(m.bot, tier, { mood: 'chase' }))
        : (Art.char(m.id, tier, frame) || Art.char(m.id, tier, 0));
      let alpha = m.alpha, squash = 0;
      if (m.state === 'vanish') { alpha = Math.max(0, m.vanishT / 0.7); squash = 1 - alpha; }
      const hgt = m.bot ? 0.82 : 0.95;
      out.push({ x: m.x, y: m.y, w: hgt * (ART_W + 20) / (ART_H + 20), h: hgt, img, alpha, squash, monster: m, lit: m.glare > 0 ? 0.6 + m.glare : 0 });
    }
    for (const h of g.helpers || []) {
      const img = Art.bot(h, 0, { mood: 'friendly' });
      out.push({ x: h.x, y: h.y, w: 0.42, h: 0.7, img, lit: h.saved ? 0.45 : 0.85 });
    }
    return out;
  }

  // ------------------------------------------------------------------ furniture pictures (drawn once)
  prop(type) {
    let P = this.props.get(type); if (P) return P;
    const S = 128, c = document.createElement('canvas'); c.width = S; c.height = S; const x = c.getContext('2d');
    const box = (col, X, Y, w, h, r = 6) => { x.fillStyle = col; x.beginPath(); x.roundRect ? x.roundRect(X, Y, w, h, r) : x.rect(X, Y, w, h); x.fill(); };
    const tier = this.tier;
    let w = 0.8, h = 0.8, lit = 0;
    switch (type) {
      case 'table': case 'hide_table':
        if (type === 'hide_table') { w = 0.95; h = 0.55; } else { w = 0.85; h = 0.45; }
        x.fillStyle = tier === 0 ? '#d13d2e' : '#8e2533'; x.beginPath(); x.moveTo(10, 40); x.lineTo(118, 40); x.lineTo(124, 128); x.lineTo(4, 128); x.fill();
        for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#fff' : (tier === 0 ? '#d13d2e' : '#8e2533'); x.fillRect(8 + i * 14, 100, 14, 10); }
        x.fillStyle = tier === 0 ? '#e85a4a' : '#b0313f'; x.beginPath(); x.ellipse(64, 40, 58, 18, 0, 0, 7); x.fill();
        if (type === 'table') { x.fillStyle = '#e9b949'; x.beginPath(); x.ellipse(64, 36, 22, 8, 0, 0, 7); x.fill(); x.fillStyle = '#d9592b'; x.beginPath(); x.ellipse(64, 35, 17, 6, 0, 0, 7); x.fill(); x.fillStyle = '#ffb84a'; x.beginPath(); x.moveTo(30, 34); x.lineTo(38, 10); x.lineTo(46, 34); x.fill(); }
        break;
      case 'arcade': case 'hide_cabinet':
        w = 0.55; h = 0.9; box('#22183a', 22, 4, 84, 124, 8); box(tier === 0 ? '#4fd1ff' : '#3a9fc4', 32, 16, 64, 44, 4); box('#d33', 44, 74, 40, 10, 5); box('#ffd84a', 30, 92, 68, 6, 3); lit = 0.3;
        x.fillStyle = '#fff'; x.font = 'bold 12px sans-serif'; x.textAlign = 'center'; x.fillText('PLAY', 64, 42);
        break;
      case 'prize': w = 0.8; h = 0.55; box('#c9302c', 6, 30, 116, 98, 6); x.fillStyle = '#ffe14f'; x.font = '48px sans-serif'; x.textAlign = 'center'; x.fillText('★', 64, 96); break;
      case 'counter': w = 0.9; h = 0.5; box('#9ba7ad', 4, 30, 120, 98, 4); box('#c7d0d4', 0, 24, 128, 14, 4); break;
      case 'stove': w = 0.7; h = 0.5; box('#444', 10, 30, 108, 98, 6); x.strokeStyle = '#999'; x.lineWidth = 4; [[40, 50], [88, 50]].forEach(([a, b]) => { x.beginPath(); x.ellipse(a, b, 14, 5, 0, 0, 7); x.stroke(); }); box('#222', 24, 70, 80, 44, 4); break;
      case 'fridge': w = 0.55; h = 0.95; box('#dde3e6', 18, 2, 92, 126, 8); x.fillStyle = '#888'; x.fillRect(92, 30, 5, 30); x.fillRect(92, 74, 5, 26); x.fillStyle = 'rgba(0,0,0,.15)'; x.fillRect(18, 62, 92, 3); break;
      case 'shelf': case 'heads': {
        w = 0.85; h = 0.85; box('#5a3c22', 6, 4, 116, 124, 4);
        for (let r = 0; r < 3; r++) { x.fillStyle = '#3a2614'; x.fillRect(10, 40 + r * 40, 108, 5); }
        if (type === 'heads') { // spare animatronic heads on the shelf (creepy but not gory)
          const ids = ['rusty', 'hoot', 'chomps', 'major'];
          ids.forEach((id, i) => { const im = Art.char(id, tier, 0); if (im) x.drawImage(im, im.width * 0.08, 0, im.width * 0.84, im.height * 0.42, 12 + (i % 2) * 54, 4 + Math.floor(i / 2) * 42, 48, 40); });
        } else for (let i = 0; i < 9; i++) box(['#c94', '#58a', '#a55'][i % 3], 14 + (i % 3) * 34, 12 + Math.floor(i / 3) * 40, 28, 26, 3);
        break;
      }
      case 'crate': case 'hide_box':
        w = type === 'hide_box' ? 0.8 : 0.6; h = type === 'hide_box' ? 0.75 : 0.55;
        box(type === 'hide_box' ? '#b08850' : '#8a6a3c', 6, 10, 116, 118, 3); x.strokeStyle = type === 'hide_box' ? '#7a5a30' : '#5a4424'; x.lineWidth = 6; x.beginPath(); x.moveTo(10, 14); x.lineTo(118, 124); x.moveTo(118, 14); x.lineTo(10, 124); x.stroke();
        if (type === 'hide_box') { x.fillStyle = '#8a6a3c'; x.fillRect(58, 10, 12, 118); }
        break;
      case 'desk': w = 0.9; h = 0.55; box('#6b4a2e', 4, 50, 120, 78, 4); box('#111', 30, 6, 60, 44, 4); box(tier === 0 ? '#9ff' : '#3fa', 35, 11, 50, 34, 2); lit = 0.25; break;
      case 'cabinet': w = 0.55; h = 0.8; box('#5f6b73', 18, 6, 92, 122, 6); x.fillStyle = '#333'; [40, 80].forEach(y => x.fillRect(26, y, 76, 3)); break;
      case 'presents': w = 0.7; h = 0.45; box('#3a7', 6, 50, 60, 78, 4); box('#d3a', 58, 30, 64, 98, 4); x.fillStyle = '#ffd84a'; x.fillRect(32, 50, 8, 78); x.fillRect(86, 30, 8, 98); break;
      case 'stage': w = 1; h = 0.4; box('#7a2b2b', 0, 50, 128, 78, 2); x.fillStyle = '#e3c04a'; x.fillRect(0, 50, 128, 8); break;
      case 'speaker': w = 0.5; h = 0.8; box('#111', 22, 4, 84, 124, 6); x.fillStyle = '#444'; x.beginPath(); x.arc(64, 84, 26, 0, 7); x.fill(); x.beginPath(); x.arc(64, 30, 14, 0, 7); x.fill(); break;
      case 'hide_locker': w = 0.55; h = 0.95; box('#6d7a86', 18, 2, 92, 126, 4); x.fillStyle = '#3c454e'; for (let i = 0; i < 4; i++) x.fillRect(32, 14 + i * 9, 64, 4); x.fillRect(88, 64, 6, 14); break;
      case 'hide_curtain': w = 0.9; h = 0.95; for (let i = 0; i < 8; i++) box(i % 2 ? '#8e1b1b' : '#a52525', i * 16, 0, 17, 128, 2); x.fillStyle = '#e3c04a'; x.fillRect(0, 0, 128, 6); break;
      case 'item_cell': w = 0.2; h = 0.26; box('#2b5', 34, 20, 60, 104, 10); box('#ccc', 50, 6, 28, 16, 4); x.fillStyle = '#ff0'; x.beginPath(); x.moveTo(70, 34); x.lineTo(48, 74); x.lineTo(64, 74); x.lineTo(56, 112); x.lineTo(82, 64); x.lineTo(66, 64); x.closePath(); x.fill(); break;
      case 'item_battery': w = 0.14; h = 0.22; box('#e8c33a', 40, 20, 48, 104, 6); box('#222', 40, 86, 48, 38, 4); box('#aaa', 54, 8, 20, 14, 3); break;
      default: w = 0.16; h = 0.16; x.fillStyle = '#f2c230'; x.beginPath(); x.arc(64, 64, 56, 0, 7); x.fill(); x.fillStyle = '#b8860b'; x.font = 'bold 70px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('★', 64, 68);
    }
    P = { c, w, h, lit };
    this.props.set(type, P);
    return P;
  }

  // ------------------------------------------------------------------ the kid (seen from behind, holding the flashlight)
  kid(g) {
    const ctx = this.ctx, W = this.w, H = this.h, s = Math.min(W * 0.22, H * 0.3);
    const col = (window.JOYNOT && window.JOYNOT.kid && window.JOYNOT.kid.color) || '#3a6ea5';
    const bob = g.moving ? Math.abs(Math.sin(g.time * 11)) * s * 0.03 : 0;
    const x = W * 0.66, y = H + s * 0.2 - bob; // over the shoulder, so the middle of the view stays clear
    ctx.save();
    // arm + flashlight reaching forward
    ctx.strokeStyle = col; ctx.lineWidth = s * 0.13; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + s * 0.2, y - s * 0.55); ctx.lineTo(x + s * 0.42, y - s * 0.82); ctx.stroke();
    ctx.fillStyle = '#c9c2b6'; ctx.save(); ctx.translate(x + s * 0.45, y - s * 0.86); ctx.rotate(-0.9); ctx.fillRect(-s * 0.04, -s * 0.11, s * 0.08, s * 0.2); ctx.restore();
    if (g.lightOn) { ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(x + s * 0.5, y - s * 0.95, s * 0.035, 0, 7); ctx.fill(); }
    // body (hoodie)
    const gr = ctx.createLinearGradient(x - s * 0.3, 0, x + s * 0.3, 0); gr.addColorStop(0, col); gr.addColorStop(1, shadeHex(col, 0.7));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - s * 0.28, y - s * 0.62, s * 0.56, s * 0.7, s * 0.2) : ctx.rect(x - s * 0.28, y - s * 0.62, s * 0.56, s * 0.7); ctx.fill();
    ctx.strokeStyle = shadeHex(col, 0.6); ctx.lineWidth = s * 0.025; ctx.beginPath(); ctx.arc(x, y - s * 0.6, s * 0.2, 0.15, Math.PI - 0.15); ctx.stroke();
    // head (hair)
    ctx.fillStyle = '#4a2f1d'; ctx.beginPath(); ctx.arc(x, y - s * 0.74, s * 0.19, 0, 7); ctx.fill();
    ctx.strokeStyle = '#5e3d26'; ctx.lineWidth = s * 0.03; ctx.beginPath(); ctx.arc(x, y - s * 0.78, s * 0.15, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.restore();
  }

  // ------------------------------------------------------------------ mini map (with which way you face)
  minimap(mc, g) {
    const w = g.world; const ctx = mc.getContext('2d');
    const s = Math.floor(Math.min(mc.width / w.W, mc.height / w.H));
    ctx.clearRect(0, 0, mc.width, mc.height);
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, mc.width, mc.height);
    const ox = (mc.width - s * w.W) / 2, oy = (mc.height - s * w.H) / 2;
    for (const r of w.rooms) {
      const known = r.visited || r.adj.some(a => w.rooms[a].visited);
      if (!known) continue;
      ctx.fillStyle = r.visited ? '#4b4660' : '#26232f';
      ctx.fillRect(ox + r.x0 * s, oy + r.y0 * s, (r.x1 - r.x0 + 1) * s, (r.y1 - r.y0 + 1) * s);
    }
    for (const d of w.doors) {
      const vis = d.rooms.some(id => w.rooms[id].visited); if (!vis) continue;
      ctx.fillStyle = d.open ? '#8c8' : d.kind === 'exit' ? '#f33' : d.kind === 'math' ? '#ffb347' : '#7fc8ff';
      const [tx, ty] = d.tiles[0];
      ctx.fillRect(ox + tx * s, oy + ty * s, (d.orient === 'h' ? 2 : 1) * s, (d.orient === 'v' ? 2 : 1) * s);
    }
    for (const it of w.items) if (!it.taken && it.type === 'cell') { const r = roomAt(w, Math.floor(it.x), Math.floor(it.y)); if (r && r.visited) { ctx.fillStyle = '#5f5'; ctx.fillRect(ox + it.x * s - s, oy + it.y * s - s, s * 2, s * 2); } }
    const X = ox + g.player.x * s, Y = oy + g.player.y * s, a = g.lightAngle, R = Math.max(5, s * 2.2);
    ctx.fillStyle = 'rgba(255,240,160,.35)'; ctx.beginPath(); ctx.moveTo(X, Y); ctx.arc(X, Y, R * 2.2, a - 0.5, a + 0.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(X + Math.cos(a) * R, Y + Math.sin(a) * R); ctx.lineTo(X + Math.cos(a + 2.5) * R * 0.7, Y + Math.sin(a + 2.5) * R * 0.7); ctx.lineTo(X + Math.cos(a - 2.5) * R * 0.7, Y + Math.sin(a - 2.5) * R * 0.7); ctx.closePath(); ctx.fill();
  }
}

function shadeHex(h, k) {
  if (!/^#[0-9a-f]{6}$/i.test(h)) return h;
  const n = parseInt(h.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
void CW; void CH;

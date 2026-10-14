// Draws the dark building, the flashlight beam, and everything in it.
import { T, CW, CH, tileAt, doorAtTile, blocksLight, roomAt } from './world.js';
import { drawCharacter, drawEyes } from './characters.js';
import { drawBot } from './bots.js';

const FLOORS = {
  dining: (x, y) => ((x + y) % 2 ? '#e4ded2' : '#1d1b22'),
  party: (x, y) => ((x + y) % 2 ? '#d6c0e4' : '#2a1f33'),
  arcade: (x, y) => '#2a1840',
  kitchen: (x, y) => ((x + y) % 2 ? '#8fa3ad' : '#7a8e98'),
  parts: (x, y) => '#5b5a57',
  storage: (x, y) => '#6a5e50',
  office: (x, y) => '#2f4a3c',
  stage: (x, y) => (x % 2 ? '#8a5a32' : '#7d5029'),
};

function hash(x, y) { const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return v - Math.floor(v); }

export class Renderer {
  constructor(canvas) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.dark = document.createElement('canvas'); this.dctx = this.dark.getContext('2d');
    this.resize();
  }
  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = dpr; this.w = window.innerWidth; this.h = window.innerHeight;
    this.c.width = this.w * dpr; this.c.height = this.h * dpr;
    this.c.style.width = this.w + 'px'; this.c.style.height = this.h + 'px';
    this.dark.width = this.c.width; this.dark.height = this.c.height;
    // tile size: ~15 tiles across the short way on any screen (phone, tablet, computer)
    const portrait = this.h > this.w;
    this.TS = Math.max(30, Math.round(portrait ? Math.min(this.w / 10.5, this.h / 16) : Math.min(this.w, this.h * 1.6) / 15));
  }

  // world -> screen
  sx(x) { return (x - this.camX) * this.TS + this.w / 2; }
  sy(y) { return (y - this.camY) * this.TS + this.h / 2; }

  draw(g) {
    const { ctx, TS } = this; const w = g.world, p = g.player;
    this.camX = p.x; this.camY = p.y;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, this.w, this.h);

    const x0 = Math.max(0, Math.floor(this.camX - this.w / 2 / TS) - 1), x1 = Math.min(w.W - 1, Math.ceil(this.camX + this.w / 2 / TS) + 1);
    const y0 = Math.max(0, Math.floor(this.camY - this.h / 2 / TS) - 1), y1 = Math.min(w.H - 1, Math.ceil(this.camY + this.h / 2 / TS) + 1);

    // floors & walls
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const t = tileAt(w, x, y), X = this.sx(x), Y = this.sy(y);
      if (t === T.WALL) { this.wall(X, Y, x, y, w); continue; }
      const r = roomAt(w, x, y);
      ctx.fillStyle = r ? FLOORS[r.theme](x, y) : '#333';
      ctx.fillRect(X, Y, TS + 1, TS + 1);
      if (r && r.theme === 'arcade' && hash(x, y) < 0.6) { ctx.fillStyle = ['#ff4fd8', '#4fd1ff', '#ffe14f'][Math.floor(hash(y, x) * 3)]; ctx.fillRect(X + hash(x, y) * TS * 0.8, Y + hash(y, x) * TS * 0.8, TS * 0.12, TS * 0.12); }
      if (r && (r.theme === 'parts' || r.theme === 'storage') && hash(x, y) < 0.08) { ctx.fillStyle = 'rgba(30,20,10,0.35)'; ctx.beginPath(); ctx.ellipse(X + TS / 2, Y + TS / 2, TS * 0.35, TS * 0.2, 0, 0, 7); ctx.fill(); }
    }
    // decor
    for (const d of w.decor) if (d.type === 'poster') this.poster(this.sx(d.x), this.sy(d.y), d.v);
    // doors
    for (const d of w.doors) this.door(d, g);
    // props & hides
    for (const pr of w.props) this.prop(pr);
    for (const h of w.hides) this.hide(h, g);
    // items
    for (const it of w.items) if (!it.taken) this.item(it, g.time);

    // monsters & player sorted by y
    const actors = g.monsters.filter(m => m.state !== 'gone').map(m => ({ y: m.y, m }));
    actors.push({ y: p.y, p: true });
    for (const h of g.helpers || []) actors.push({ y: h.y - 0.01, h });
    actors.sort((a, b) => a.y - b.y);
    for (const a of actors) {
      if (a.p) this.player(p, g);
      else if (a.h) drawBot(ctx, a.h, this.sx(a.h.x), this.sy(a.h.y) - TS * 0.4, TS * 1.15, g.time, { walking: a.h.moving, glow: a.h.saved ? 0.15 : 0.45 });
      else {
        const m = a.m; const s = TS * 1.55;
        ctx.save();
        let alpha = m.alpha;
        if (m.state === 'vanish') { alpha = Math.max(0, m.vanishT / 0.7); ctx.translate(this.sx(m.x), this.sy(m.y)); ctx.scale(1 + (1 - alpha) * 0.4, alpha); ctx.translate(-this.sx(m.x), -this.sy(m.y)); }
        ctx.globalAlpha = alpha;
        drawCharacter(ctx, m.id, this.sx(m.x), this.sy(m.y) - TS * 0.45, s, m.t, { walking: m.moving });
        if (m.glare > 0) { ctx.globalAlpha = Math.min(0.7, m.glare); ctx.fillStyle = '#fff8c0'; ctx.beginPath(); ctx.arc(this.sx(m.x), this.sy(m.y) - TS * 0.6, TS * 0.7, 0, 7); ctx.fill(); }
        ctx.restore();
      }
    }

    // ---- darkness ----
    const d = this.dctx; d.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    d.globalCompositeOperation = 'source-over';
    d.clearRect(0, 0, this.w, this.h);
    d.fillStyle = p.hidden ? 'rgba(0,0,0,0.97)' : 'rgba(2,2,8,0.93)'; d.fillRect(0, 0, this.w, this.h);
    d.globalCompositeOperation = 'destination-out';
    const px = this.sx(p.x), py = this.sy(p.y);
    const amb = TS * (p.hidden ? 1.1 : 2.0);
    let gr = d.createRadialGradient(px, py, 0, px, py, amb);
    gr.addColorStop(0, 'rgba(0,0,0,0.8)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = gr; d.beginPath(); d.arc(px, py, amb, 0, 7); d.fill();
    // faint glows so he can find important stuff
    const glow = (x, y, r, a) => { const X = this.sx(x), Y = this.sy(y); const gg = d.createRadialGradient(X, Y, 0, X, Y, r * TS); gg.addColorStop(0, `rgba(0,0,0,${a})`); gg.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = gg; d.beginPath(); d.arc(X, Y, r * TS, 0, 7); d.fill(); };
    for (const dr of w.doors) if (!dr.open) { const [tx, ty] = dr.tiles[0]; glow(tx + (dr.orient === 'h' ? 1 : 0.5), ty + (dr.orient === 'v' ? 1 : 0.5), 1.4, dr.exit ? 0.6 : 0.35); }
    for (const it of w.items) if (!it.taken && it.type === 'cell') glow(it.x, it.y, 1.1, 0.45 + 0.15 * Math.sin(g.time * 3));
    // robot helpers glow and light up the room around them
    for (const h of g.helpers || []) glow(h.x, h.y, h.saved ? 1.6 : 2.6, h.saved ? 0.5 : 0.85);
    // flashlight
    let poly = null;
    if (g.lightOn && !p.hidden) {
      poly = this.lightPoly(w, p, g.lightAngle, g.lightHalf, g.lightRange);
      const R = g.lightRange * TS;
      gr = d.createRadialGradient(px, py, TS * 0.2, px, py, R);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.65, 'rgba(0,0,0,0.92)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      d.fillStyle = gr; d.beginPath(); poly.forEach(([x, y], i) => i ? d.lineTo(x, y) : d.moveTo(x, y)); d.closePath(); d.fill();
    }
    d.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(this.dark, 0, 0); ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (poly) { // warm beam tint
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.07 + (g.battery < 20 ? Math.random() * 0.05 : 0);
      ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); poly.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); ctx.restore();
    }

    // glowing eyes in the dark (spooky + a clue!)
    for (const m of g.monsters) {
      if (!m.active) continue;
      const dd = Math.hypot(m.x - p.x, m.y - p.y);
      if (dd < 11) drawEyes(ctx, m.id, this.sx(m.x), this.sy(m.y) - TS * 0.45, TS * 1.55, Math.min(1, (11 - dd) / 6) * m.alpha);
    }
    // exit sign glow
    const ex = w.exit; const [ext, eyt] = ex.tiles[0];
    const EX = this.sx(ext + (ex.orient === 'h' ? 1 : 0.5)), EY = this.sy(eyt + (ex.orient === 'v' ? 1 : 0.5));
    ctx.save(); ctx.font = `bold ${TS * 0.38}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = ex.open ? '#3f3' : '#f22'; ctx.shadowBlur = 14; ctx.fillStyle = ex.open ? '#7f7' : '#f55';
    ctx.fillText('EXIT', EX, EY + (ex.side === 'top' ? TS * 0.75 : ex.side === 'bottom' ? -TS * 0.75 : 0) + (ex.orient === 'v' ? -TS * 1.3 : 0));
    ctx.restore();

    // hiding view: slats
    if (p.hidden) {
      ctx.fillStyle = 'rgba(20,20,24,0.9)';
      for (let y = 0; y < this.h; y += 46) ctx.fillRect(0, y, this.w, 26);
    }
    // danger vignette
    if (g.danger > 0) {
      const a = g.danger * (0.25 + 0.15 * Math.sin(g.time * 8));
      const vg = ctx.createRadialGradient(this.w / 2, this.h / 2, Math.min(this.w, this.h) * 0.35, this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.7);
      vg.addColorStop(0, 'rgba(120,0,0,0)'); vg.addColorStop(1, `rgba(160,0,0,${a})`);
      ctx.fillStyle = vg; ctx.fillRect(0, 0, this.w, this.h);
    }
  }

  lightPoly(w, p, ang, half, range) {
    const pts = [[this.sx(p.x), this.sy(p.y)]]; const rays = 44;
    for (let i = 0; i <= rays; i++) {
      const a = ang - half + (2 * half * i) / rays, dx = Math.cos(a), dy = Math.sin(a);
      let dist = 0;
      while (dist < range) { dist += 0.12; if (blocksLight(w, Math.floor(p.x + dx * dist), Math.floor(p.y + dy * dist))) { dist += 0.15; break; } }
      dist = Math.min(dist, range);
      pts.push([this.sx(p.x + dx * dist), this.sy(p.y + dy * dist)]);
    }
    return pts;
  }

  wall(X, Y, x, y, w) {
    const { ctx, TS } = this;
    ctx.fillStyle = '#2e2933'; ctx.fillRect(X, Y, TS + 1, TS + 1);
    ctx.fillStyle = '#3d3644';
    const bh = TS / 3;
    for (let r = 0; r < 3; r++) { const off = (r + y) % 2 ? TS / 2 : 0; for (let c = -1; c < 2; c++) ctx.fillRect(X + off + c * TS / 2 + 1, Y + r * bh + 1, TS / 2 - 2, bh - 2); }
    if (tileAt(w, x, y + 1) !== T.WALL) { ctx.fillStyle = '#1a171d'; ctx.fillRect(X, Y + TS - TS * 0.12, TS, TS * 0.12); }
  }

  poster(X, Y, v) {
    const { ctx, TS } = this;
    const cols = ['#d94848', '#4878d9', '#e6b43a', '#48b06a'][v];
    ctx.fillStyle = cols; ctx.fillRect(X + TS * 0.15, Y + TS * 0.12, TS * 0.7, TS * 0.7);
    ctx.fillStyle = '#fff'; ctx.font = `bold ${TS * 0.16}px system-ui`; ctx.textAlign = 'center';
    ctx.fillText(['PARTY!', 'PLAY!', 'PIZZA', 'FUN!'][v], X + TS / 2, Y + TS * 0.38);
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(X + TS / 2, Y + TS * 0.6, TS * 0.13, 0, 7); ctx.fill();
    ctx.fillStyle = '#f33'; ctx.beginPath(); ctx.arc(X + TS * 0.45, Y + TS * 0.57, TS * 0.03, 0, 7); ctx.arc(X + TS * 0.55, Y + TS * 0.57, TS * 0.03, 0, 7); ctx.fill();
  }

  door(d, g) {
    const { ctx, TS } = this;
    const [tx, ty] = d.tiles[0];
    const X = this.sx(tx), Y = this.sy(ty);
    const Wd = d.orient === 'h' ? TS * 2 : TS, Hd = d.orient === 'h' ? TS : TS * 2;
    if (d.open) {
      ctx.fillStyle = '#4a4450'; ctx.fillRect(X, Y, Wd, Hd);
      ctx.fillStyle = '#6d6575';
      if (d.orient === 'h') { ctx.fillRect(X, Y, TS * 0.12, Hd); ctx.fillRect(X + Wd - TS * 0.12, Y, TS * 0.12, Hd); }
      else { ctx.fillRect(X, Y, Wd, TS * 0.12); ctx.fillRect(X, Y + Hd - TS * 0.12, Wd, TS * 0.12); }
      return;
    }
    if (d.kind === 'exit') { ctx.fillStyle = '#7a1414'; ctx.fillRect(X, Y, Wd, Hd); ctx.strokeStyle = '#e33'; ctx.lineWidth = 3; ctx.strokeRect(X + 2, Y + 2, Wd - 4, Hd - 4); }
    else if (d.kind === 'math') { // metal gate with bars
      ctx.fillStyle = '#3a3f46'; ctx.fillRect(X, Y, Wd, Hd);
      ctx.fillStyle = '#9aa3ad';
      if (d.orient === 'h') for (let i = 0; i < 8; i++) ctx.fillRect(X + i * Wd / 8 + 2, Y + 2, TS * 0.07, Hd - 4);
      else for (let i = 0; i < 8; i++) ctx.fillRect(X + 2, Y + i * Hd / 8 + 2, Wd - 4, TS * 0.07);
    } else { // wooden door
      ctx.fillStyle = '#6b4423'; ctx.fillRect(X, Y, Wd, Hd);
      ctx.strokeStyle = '#3e2512'; ctx.lineWidth = 2;
      if (d.orient === 'h') { ctx.beginPath(); ctx.moveTo(X + Wd / 2, Y); ctx.lineTo(X + Wd / 2, Y + Hd); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(X, Y + Hd / 2); ctx.lineTo(X + Wd, Y + Hd / 2); ctx.stroke(); }
    }
    // sign
    const cx = X + Wd / 2, cy = Y + Hd / 2, s = TS * 0.62;
    ctx.fillStyle = d.kind === 'exit' ? '#ffdddd' : d.kind === 'math' ? '#ffb347' : '#7fc8ff';
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx - s / 2, cy - s / 2, s, s, 6) : ctx.rect(cx - s / 2, cy - s / 2, s, s); ctx.fill();
    ctx.fillStyle = '#111'; ctx.font = `bold ${s * 0.36}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(d.kind === 'exit' ? `${g.cells}/${g.world.cellsNeeded}` : d.kind === 'math' ? '123' : 'ABC', cx, cy);
  }

  prop(pr) {
    const { ctx, TS } = this; const X = this.sx(pr.x), Y = this.sy(pr.y), W = TS * pr.w;
    const box = (c, x, y, w, h, r = 4) => { ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); ctx.fill(); };
    switch (pr.type) {
      case 'table': for (let i = 0; i < pr.w; i++) { ctx.fillStyle = '#eee'; ctx.beginPath(); ctx.arc(X + TS * (i + 0.5), Y + TS / 2, TS * 0.42, 0, 7); ctx.fill(); ctx.fillStyle = '#d33'; ctx.beginPath(); ctx.arc(X + TS * (i + 0.5), Y + TS / 2, TS * 0.42, 0, 7); ctx.globalAlpha = 0.25; ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = '#e8a33d'; ctx.beginPath(); ctx.moveTo(X + TS * (i + 0.5), Y + TS / 2); ctx.arc(X + TS * (i + 0.5), Y + TS / 2, TS * 0.18, 0, 4.5); ctx.fill(); } break;
      case 'arcade': for (let i = 0; i < pr.w; i++) { box('#22183a', X + TS * i + 4, Y + 2, TS - 8, TS - 4); box(['#4fd1ff', '#ff4fd8', '#7dff6a'][i % 3], X + TS * i + 9, Y + 8, TS - 18, TS * 0.4); box('#d33', X + TS * i + TS * 0.4, Y + TS * 0.68, TS * 0.18, TS * 0.12, 6); } break;
      case 'prize': box('#c9302c', X + 4, Y + 4, W - 8, TS - 8); ctx.fillStyle = '#ffe14f'; ctx.font = `${TS * 0.4}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', X + W / 2, Y + TS / 2); break;
      case 'counter': box('#9ba7ad', X + 2, Y + 4, W - 4, TS - 8); box('#c7d0d4', X + 6, Y + 8, W - 12, TS * 0.3); break;
      case 'stove': box('#444', X + 4, Y + 4, W - 8, TS - 8); ctx.strokeStyle = '#999'; for (const [a, b] of [[0.32, 0.32], [0.68, 0.32], [0.32, 0.68], [0.68, 0.68]]) { ctx.beginPath(); ctx.arc(X + TS * a, Y + TS * b, TS * 0.1, 0, 7); ctx.stroke(); } break;
      case 'fridge': box('#dde3e6', X + 6, Y + 2, W - 12, TS - 4); ctx.fillStyle = '#888'; ctx.fillRect(X + W - 14, Y + TS * 0.3, 3, TS * 0.3); break;
      case 'shelf': box('#5a3c22', X + 2, Y + 4, W - 4, TS - 8); for (let i = 0; i < pr.w * 3; i++) box(['#c94', '#58a', '#a55'][i % 3], X + 6 + i * (W - 12) / (pr.w * 3), Y + 8, (W - 12) / (pr.w * 3) - 3, TS * 0.3, 2); break;
      case 'heads': box('#5a3c22', X + 2, Y + 4, W - 4, TS - 8); for (let i = 0; i < 2; i++) { ctx.fillStyle = ['#7d7368', '#3f5f8f'][i]; ctx.beginPath(); ctx.arc(X + TS * (0.3 + i * 0.4), Y + TS * 0.45, TS * 0.17, 0, 7); ctx.fill(); ctx.fillStyle = '#f33'; ctx.fillRect(X + TS * (0.24 + i * 0.4), Y + TS * 0.4, 3, 3); ctx.fillRect(X + TS * (0.33 + i * 0.4), Y + TS * 0.4, 3, 3); } break;
      case 'crate': box('#8a6a3c', X + 4, Y + 4, W - 8, TS - 8, 2); ctx.strokeStyle = '#5a4424'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X + 6, Y + 6); ctx.lineTo(X + W - 6, Y + TS - 6); ctx.moveTo(X + W - 6, Y + 6); ctx.lineTo(X + 6, Y + TS - 6); ctx.stroke(); break;
      case 'desk': box('#6b4a2e', X + 2, Y + 6, W - 4, TS - 12); box('#111', X + 10, Y + 10, TS * 0.45, TS * 0.32, 2); box('#3fa', X + 13, Y + 13, TS * 0.45 - 6, TS * 0.32 - 6, 1); break;
      case 'cabinet': box('#5f6b73', X + 6, Y + 4, W - 12, TS - 8); ctx.fillStyle = '#333'; ctx.fillRect(X + 10, Y + TS * 0.33, W - 20, 2); ctx.fillRect(X + 10, Y + TS * 0.62, W - 20, 2); break;
      case 'presents': box('#3a7', X + 6, Y + 8, TS * 0.4, TS * 0.4); box('#d3a', X + TS * 0.45, Y + TS * 0.4, TS * 0.4, TS * 0.4); break;
      case 'stage': box('#7a2b2b', X, Y + 2, W, TS - 4, 2); ctx.fillStyle = '#e3c04a'; ctx.fillRect(X, Y + TS - 8, W, 4); break;
      case 'speaker': box('#111', X + 8, Y + 4, W - 16, TS - 8); ctx.fillStyle = '#444'; ctx.beginPath(); ctx.arc(X + W / 2, Y + TS * 0.55, TS * 0.18, 0, 7); ctx.fill(); break;
    }
  }

  hide(h, g) {
    const { ctx, TS } = this; const X = this.sx(h.x), Y = this.sy(h.y);
    const near = g.nearHide === h;
    const box = (c, x, y, w, hh, r = 4) => { ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, hh, r) : ctx.rect(x, y, w, hh); ctx.fill(); };
    if (h.type === 'locker') { box('#6d7a86', X + 6, Y + 2, TS - 12, TS - 4); ctx.fillStyle = '#3c454e'; for (let i = 0; i < 3; i++) ctx.fillRect(X + 12, Y + 8 + i * 6, TS - 24, 2); }
    else if (h.type === 'table') { ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.arc(X + TS / 2, Y + TS / 2, TS * 0.46, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X + TS / 2, Y + TS / 2, TS * 0.3, 0, 7); ctx.fill(); }
    else if (h.type === 'box') { box('#b08850', X + 3, Y + 3, TS - 6, TS - 6, 2); ctx.fillStyle = '#8a6a3c'; ctx.fillRect(X + TS / 2 - 2, Y + 3, 4, TS - 6); }
    else if (h.type === 'curtain') { for (let i = 0; i < 5; i++) box(i % 2 ? '#8e1b1b' : '#a52525', X + i * TS / 5, Y + 2, TS / 5 + 1, TS - 4, 1); }
    else { box('#22183a', X + 4, Y + 2, TS - 8, TS - 4); box('#4fd1ff', X + 9, Y + 8, TS - 18, TS * 0.35); }
    if (near || (g.player.hidden === h)) { ctx.strokeStyle = g.player.hidden === h ? '#7f7' : '#ffd84a'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); ctx.strokeRect(X + 2, Y + 2, TS - 4, TS - 4); ctx.setLineDash([]); }
  }

  item(it, t) {
    const { ctx, TS } = this; const X = this.sx(it.x), Y = this.sy(it.y) + Math.sin(t * 3 + it.x) * 3;
    if (it.type === 'cell') {
      ctx.save(); ctx.shadowColor = '#5f5'; ctx.shadowBlur = 18;
      ctx.fillStyle = '#2b5'; ctx.fillRect(X - TS * 0.16, Y - TS * 0.26, TS * 0.32, TS * 0.52);
      ctx.fillStyle = '#ccc'; ctx.fillRect(X - TS * 0.07, Y - TS * 0.33, TS * 0.14, TS * 0.07);
      ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.moveTo(X + 2, Y - TS * 0.18); ctx.lineTo(X - TS * 0.08, Y + 2); ctx.lineTo(X + 2, Y + 2); ctx.lineTo(X - 2, Y + TS * 0.18); ctx.lineTo(X + TS * 0.08, Y - 2); ctx.lineTo(X - 2, Y - 2); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else if (it.type === 'battery') {
      ctx.fillStyle = '#e8c33a'; ctx.fillRect(X - TS * 0.1, Y - TS * 0.18, TS * 0.2, TS * 0.36); ctx.fillStyle = '#222'; ctx.fillRect(X - TS * 0.1, Y + TS * 0.06, TS * 0.2, TS * 0.12); ctx.fillStyle = '#aaa'; ctx.fillRect(X - TS * 0.04, Y - TS * 0.23, TS * 0.08, TS * 0.05);
    } else {
      ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.arc(X, Y, TS * 0.14, 0, 7); ctx.fill(); ctx.fillStyle = '#b8860b'; ctx.font = `bold ${TS * 0.16}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', X, Y + 1);
    }
  }

  player(p, g) {
    if (p.hidden) return;
    const { ctx, TS } = this; const X = this.sx(p.x), Y = this.sy(p.y); const a = g.lightAngle;
    const bob = g.moving ? Math.sin(g.time * 12) * 2 : 0;
    ctx.save(); ctx.translate(X, Y + bob);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, TS * 0.3, TS * 0.3, TS * 0.1, 0, 0, 7); ctx.fill();
    // flashlight
    ctx.save(); ctx.rotate(a); ctx.fillStyle = '#333'; ctx.fillRect(TS * 0.15, -TS * 0.05, TS * 0.32, TS * 0.1); ctx.fillStyle = g.lightOn ? '#ffe98a' : '#777'; ctx.fillRect(TS * 0.44, -TS * 0.07, TS * 0.06, TS * 0.14); ctx.restore();
    ctx.fillStyle = '#2b6cd4'; ctx.beginPath(); ctx.arc(0, 0, TS * 0.27, 0, 7); ctx.fill();          // hoodie
    ctx.fillStyle = '#f0c8a0'; ctx.beginPath(); ctx.arc(0, -TS * 0.08, TS * 0.17, 0, 7); ctx.fill();   // face
    ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.arc(0, -TS * 0.14, TS * 0.17, Math.PI, 0); ctx.fill(); // hair
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(-TS * 0.06, -TS * 0.07, 2, 0, 7); ctx.arc(TS * 0.06, -TS * 0.07, 2, 0, 7); ctx.fill();
    ctx.restore();
  }

  // ---------- minimap ----------
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
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ox + g.player.x * s, oy + g.player.y * s, Math.max(2.5, s * 1.1), 0, 7); ctx.fill();
  }
}

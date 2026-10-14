// Draws the bright candy-land world, Sparkle, her family following her, and the mini map.
import { T, AREAS, tileAt, gateAtTile, roomAt } from './world.js';
import { drawUnicorn, rainbowArc, jellyBean, star, heart, roundRect } from './characters.js';

function hash(x, y) { const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return v - Math.floor(v); }

export class Renderer {
  constructor(canvas) { this.c = canvas; this.ctx = canvas.getContext('2d'); this.resize(); }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = dpr; this.w = window.innerWidth; this.h = window.innerHeight;
    this.c.width = Math.round(this.w * dpr); this.c.height = Math.round(this.h * dpr);
    this.c.style.width = this.w + 'px'; this.c.style.height = this.h + 'px';
    // tile size: phones show ~10 tiles across the short side, big computer screens cap at 72px tiles
    const portrait = this.h > this.w;
    const ts = portrait ? Math.min(this.w / 9.5, this.h / 15) : Math.min(this.w / 16, this.h / 9.5);
    this.TS = Math.max(30, Math.min(72, Math.round(ts)));
  }
  sx(x) { return (x - this.camX) * this.TS + this.w / 2; }
  sy(y) { return (y - this.camY) * this.TS + this.h / 2; }

  draw(g, time) {
    const { ctx, TS } = this; const w = g.world, p = g.player;
    // camera eases after Sparkle
    if (this.camX === undefined || g.snapCam) { this.camX = p.x; this.camY = p.y; g.snapCam = false; }
    this.camX += (p.x - this.camX) * 0.15; this.camY += (p.y - this.camY) * 0.15;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // sky behind everything
    const sky = ctx.createLinearGradient(0, 0, 0, this.h); sky.addColorStop(0, '#bfe6ff'); sky.addColorStop(1, '#ffe3f3');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, this.w, this.h);

    const x0 = Math.max(0, Math.floor(this.camX - this.w / 2 / TS) - 1), x1 = Math.min(w.W - 1, Math.ceil(this.camX + this.w / 2 / TS) + 1);
    const y0 = Math.max(0, Math.floor(this.camY - this.h / 2 / TS) - 1), y1 = Math.min(w.H - 1, Math.ceil(this.camY + this.h / 2 / TS) + 1);

    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const t = tileAt(w, x, y), X = this.sx(x), Y = this.sy(y);
      if (t === T.WALL) continue;
      const r = roomAt(w, x, y) || this.nearRoom(w, x, y);
      const A = AREAS[r ? r.theme : 'meadow'];
      ctx.fillStyle = A.floor[(x + y) % 2]; ctx.fillRect(X, Y, TS + 1, TS + 1);
      if (hash(x, y) < 0.35) { ctx.fillStyle = A.dots[Math.floor(hash(y, x) * A.dots.length)]; ctx.beginPath(); ctx.arc(X + hash(x, y) * TS * 2.4 % TS, Y + hash(y, x) * TS, TS * 0.05, 0, 7); ctx.fill(); }
    }
    // walls: rounded candy hedges with sprinkles
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (tileAt(w, x, y) === T.WALL) this.wall(w, x, y);
    // gates
    for (const gt of w.gates) this.gate(gt, time);
    // props + items (sorted by y so things overlap nicely)
    const things = [];
    for (const pr of w.props) if (pr.x >= x0 && pr.x <= x1 && pr.y >= y0 && pr.y <= y1) things.push({ y: pr.y + 0.9, d: () => this.prop(pr, time) });
    for (const it of w.items) if (!it.taken) things.push({ y: it.y, d: () => this.item(it, time) });
    g.followers.forEach((f, i) => things.push({ y: f.y, d: () => drawUnicorn(ctx, f.c, this.sx(f.x), this.sy(f.y) + TS * 0.35, TS * 1.25 * f.c.size, { facing: f.facing, t: time + i, walking: f.moving }) }));
    things.push({ y: p.y, d: () => drawUnicorn(ctx, g.sparkle, this.sx(p.x), this.sy(p.y) + TS * 0.35, TS * 1.35, { facing: p.facing, t: time, walking: g.moving }) });
    things.sort((a, b) => a.y - b.y).forEach(t => t.d());
    // sparkle bursts
    for (const s of g.bursts) {
      const k = s.t / s.life;
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + s.t * 2; star(ctx, this.sx(s.x) + Math.cos(a) * TS * k * 1.2, this.sy(s.y) + Math.sin(a) * TS * k * 1.2, TS * 0.14 * (1 - k), s.c || '#ffd84a'); }
    }
  }

  nearRoom(w, x, y) { for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const r = roomAt(w, x + dx, y + dy); if (r) return r; } return null; }

  wall(w, x, y) {
    const { ctx, TS } = this, X = this.sx(x), Y = this.sy(y);
    const r = this.nearRoom(w, x, y) || this.nearRoom(w, x + 1, y + 1) || this.nearRoom(w, x - 1, y - 1);
    const A = AREAS[r ? r.theme : 'meadow'];
    ctx.fillStyle = A.wall; roundRect(ctx, X + 1, Y + 1, TS - 2, TS - 2, TS * 0.32); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; roundRect(ctx, X + TS * 0.14, Y + TS * 0.1, TS * 0.72, TS * 0.28, TS * 0.14); ctx.fill();
    const cols = ['#fff', '#ff6b9d', '#ffe066', '#6ec6ff'];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = cols[Math.floor(hash(x + i, y) * 4)];
      ctx.save(); ctx.translate(X + TS * (0.2 + hash(x, y + i) * 0.6), Y + TS * (0.45 + hash(y, x + i) * 0.4)); ctx.rotate(hash(x * i, y) * 3);
      ctx.fillRect(-TS * 0.07, -TS * 0.02, TS * 0.14, TS * 0.045); ctx.restore();
    }
  }

  gate(gt, time) {
    const { ctx, TS } = this;
    const [a, b] = gt.tiles; const X = this.sx(Math.min(a[0], b[0])), Y = this.sy(Math.min(a[1], b[1]));
    const wd = gt.orient === 'h' ? TS * 2 : TS, ht = gt.orient === 'h' ? TS : TS * 2;
    if (gt.open) { // open gate: sparkly path
      ctx.fillStyle = 'rgba(255,255,255,.55)'; roundRect(ctx, X + 4, Y + 4, wd - 8, ht - 8, TS * 0.3); ctx.fill();
      star(ctx, X + wd / 2, Y + ht / 2, TS * 0.18 * (1 + 0.15 * Math.sin(time * 4)), '#ffd84a');
      return;
    }
    const exit = gt.exit, read = gt.kind === 'read';
    const col = exit ? null : read ? '#b388ff' : '#ff9f1c';
    if (exit) {
      const gr = gt.orient === 'h' ? ctx.createLinearGradient(X, 0, X + wd, 0) : ctx.createLinearGradient(0, Y, 0, Y + ht);
      ['#ff6b6b', '#ffb347', '#ffe066', '#6be675', '#6ec6ff', '#b388ff'].forEach((c, i) => gr.addColorStop(i / 5, c));
      ctx.fillStyle = gr;
    } else ctx.fillStyle = col;
    roundRect(ctx, X + 2, Y + 2, wd - 4, ht - 4, TS * 0.3); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2, TS * 0.07); ctx.stroke();
    // bars
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = Math.max(2, TS * 0.06);
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      if (gt.orient === 'h') { ctx.moveTo(X + wd * i / 4, Y + 6); ctx.lineTo(X + wd * i / 4, Y + ht - 6); }
      else { ctx.moveTo(X + 6, Y + ht * i / 4); ctx.lineTo(X + wd - 6, Y + ht * i / 4); }
      ctx.stroke();
    }
    // sign
    const cx = X + wd / 2, cy = Y + ht / 2, pulse = 1 + 0.06 * Math.sin(time * 5);
    ctx.fillStyle = '#fff'; roundRect(ctx, cx - TS * 0.55 * pulse, cy - TS * 0.3 * pulse, TS * 1.1 * pulse, TS * 0.6 * pulse, TS * 0.18); ctx.fill();
    ctx.fillStyle = exit ? '#ff4f9a' : col; ctx.font = `bold ${Math.round(TS * 0.36)}px Fredoka, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(exit ? '🌈' : read ? 'ABC' : '123', cx, cy + 1);
  }

  item(it, time) {
    const { ctx, TS } = this, X = this.sx(it.x), Y = this.sy(it.y);
    if (it.type === 'rainbow') {
      const bob = Math.sin(time * 3 + it.x) * TS * 0.08;
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(X, Y + bob - TS * 0.05, TS * 0.55, 0, 7); ctx.fill();
      rainbowArc(ctx, X, Y + bob + TS * 0.15, TS * 0.5, TS * 0.07);
      star(ctx, X + TS * 0.4, Y + bob - TS * 0.45, TS * 0.1 * (1 + Math.sin(time * 6)), '#fff');
    } else {
      const bob = Math.sin(time * 4 + it.y * 3) * TS * 0.04;
      jellyBean(ctx, X, Y + bob, TS * 0.16, it.c, it.rot);
    }
  }

  prop(pr, time) {
    const { ctx, TS } = this, X = this.sx(pr.x) + TS / 2, Y = this.sy(pr.y) + TS / 2, s = TS;
    const cols = ['#ff6b9d', '#ffb347', '#b388ff', '#6ec6ff'], c = cols[pr.v % 4];
    ctx.save();
    switch (pr.type) {
      case 'flower':
        for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(X + Math.cos(a) * s * 0.2, Y + Math.sin(a) * s * 0.2, s * 0.16, 0, 7); ctx.fill(); }
        ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(X, Y, s * 0.13, 0, 7); ctx.fill(); break;
      case 'bush':
        ctx.fillStyle = '#5bc46a'; [[-.2, .05, .28], [.18, .05, .26], [0, -.15, .3]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(X + dx * s, Y + dy * s, r * s, 0, 7); ctx.fill(); });
        ctx.fillStyle = c; [[-.15, -.1], [.15, -.05], [0, .12]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(X + dx * s, Y + dy * s, s * 0.06, 0, 7); ctx.fill(); }); break;
      case 'cloud': case 'cottoncandy':
        if (pr.type === 'cottoncandy') { ctx.fillStyle = '#e0c39a'; ctx.fillRect(X - s * 0.04, Y, s * 0.08, s * 0.42); }
        ctx.fillStyle = pr.type === 'cloud' ? '#ffffff' : '#ffb3d9';
        [[-.2, 0, .22], [.15, -.02, .25], [0, -.18, .22]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(X + dx * s, Y + dy * s, r * s, 0, 7); ctx.fill(); }); break;
      case 'gumdrop':
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(X - s * 0.35, Y + s * 0.3); ctx.quadraticCurveTo(X - s * 0.32, Y - s * 0.4, X, Y - s * 0.38); ctx.quadraticCurveTo(X + s * 0.32, Y - s * 0.4, X + s * 0.35, Y + s * 0.3); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(X + (hash(pr.x, i) - .5) * s * .5, Y + (hash(i, pr.y) - .5) * s * .5, s * 0.03, 0, 7); ctx.fill(); } break;
      case 'lollipop':
        ctx.fillStyle = '#fff'; ctx.fillRect(X - s * 0.04, Y - s * 0.05, s * 0.08, s * 0.5);
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(X, Y - s * 0.15, s * 0.3, 0, 7); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = s * 0.05; ctx.beginPath(); for (let a = 0; a < 12; a += 0.3) ctx.lineTo(X + Math.cos(a) * a * s * 0.022, Y - s * 0.15 + Math.sin(a) * a * s * 0.022); ctx.stroke(); break;
      case 'shell':
        ctx.fillStyle = '#ffd1dc'; ctx.beginPath(); ctx.moveTo(X, Y + s * 0.25); ctx.arc(X, Y + s * 0.05, s * 0.3, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#ff8fb0'; ctx.lineWidth = s * 0.03; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(X, Y + s * 0.25); ctx.lineTo(X + i * s * 0.12, Y - s * 0.2); ctx.stroke(); } break;
      case 'umbrella':
        ctx.fillStyle = '#c58a5c'; ctx.fillRect(X - s * 0.03, Y - s * 0.2, s * 0.06, s * 0.6);
        for (let i = 0; i < 4; i++) { ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.moveTo(X, Y - s * 0.2); ctx.arc(X, Y - s * 0.2, s * 0.42, Math.PI + i * Math.PI / 4, Math.PI + (i + 1) * Math.PI / 4); ctx.closePath(); ctx.fill(); } break;
      case 'cupcake':
        ctx.fillStyle = '#c58a5c'; ctx.beginPath(); ctx.moveTo(X - s * 0.28, Y); ctx.lineTo(X + s * 0.28, Y); ctx.lineTo(X + s * 0.2, Y + s * 0.35); ctx.lineTo(X - s * 0.2, Y + s * 0.35); ctx.closePath(); ctx.fill();
        ctx.fillStyle = c; [[-.15, -.02, .18], [.15, -.02, .18], [0, -.18, .2]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(X + dx * s, Y + dy * s, r * s, 0, 7); ctx.fill(); });
        ctx.fillStyle = '#ff4f6d'; ctx.beginPath(); ctx.arc(X, Y - s * 0.38, s * 0.07, 0, 7); ctx.fill(); break;
      case 'table':
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X, Y, s * 0.38, 0, 7); ctx.fill(); ctx.strokeStyle = '#ff9ad5'; ctx.lineWidth = s * 0.06; ctx.setLineDash([s * 0.08, s * 0.08]); ctx.stroke(); ctx.setLineDash([]);
        heart(ctx, X, Y, s * 0.12, '#ff6b9d'); break;
      case 'lily':
        ctx.fillStyle = '#7fd6a0'; ctx.beginPath(); ctx.arc(X, Y, s * 0.36, 0.3, Math.PI * 2 - 0.3); ctx.lineTo(X, Y); ctx.fill();
        ctx.fillStyle = '#ffb3d9'; ctx.beginPath(); ctx.arc(X + s * 0.05, Y - s * 0.05, s * 0.12, 0, 7); ctx.fill(); break;
      case 'bubble':
        ctx.strokeStyle = 'rgba(179,136,255,.8)'; ctx.lineWidth = s * 0.04; const r0 = s * (0.3 + 0.03 * Math.sin(time * 3 + pr.x));
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(X, Y, r0, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X - r0 * .4, Y - r0 * .4, r0 * .18, 0, 7); ctx.fill(); break;
      case 'tower':
        ctx.fillStyle = '#e6d8ff'; ctx.fillRect(X - s * 0.25, Y - s * 0.15, s * 0.5, s * 0.55);
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(X - s * 0.32, Y - s * 0.15); ctx.lineTo(X, Y - s * 0.5); ctx.lineTo(X + s * 0.32, Y - s * 0.15); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#7a5aa6'; roundRect(ctx, X - s * 0.08, Y + s * 0.12, s * 0.16, s * 0.28, s * 0.08); ctx.fill(); break;
    }
    ctx.restore();
  }

  minimap(cv, g) {
    const w = g.world, mctx = cv.getContext('2d'), s = Math.min(cv.width / w.RW, cv.height / w.RH);
    mctx.clearRect(0, 0, cv.width, cv.height);
    const ox = (cv.width - s * w.RW) / 2, oy = (cv.height - s * w.RH) / 2;
    for (const r of w.rooms) {
      if (!r.visited) continue;
      mctx.fillStyle = AREAS[r.theme].wall; mctx.globalAlpha = 0.75;
      mctx.fillRect(ox + r.rx * s + 2, oy + r.ry * s + 2, s - 4, s - 4); mctx.globalAlpha = 1;
    }
    for (const it of w.items) if (it.type === 'rainbow' && !it.taken && w.rooms[0] && roomVisited(w, it)) { mctx.fillStyle = '#ff4f9a'; mctx.beginPath(); mctx.arc(ox + it.x / 9 * s, oy + it.y / 7 * s, 4, 0, 7); mctx.fill(); }
    if (w.exitRoom.visited) { mctx.fillStyle = '#fff'; mctx.font = `${Math.round(s * 0.5)}px system-ui`; mctx.textAlign = 'center'; mctx.textBaseline = 'middle'; mctx.fillText('🌈', ox + (w.exitRoom.rx + 0.5) * s, oy + (w.exitRoom.ry + 0.5) * s); }
    mctx.fillStyle = '#fff'; mctx.strokeStyle = '#7a5aa6'; mctx.lineWidth = 2;
    mctx.beginPath(); mctx.arc(ox + g.player.x / 9 * s, oy + g.player.y / 7 * s, 5, 0, 7); mctx.fill(); mctx.stroke();
  }
}

function roomVisited(w, it) { const r = roomAt(w, Math.floor(it.x), Math.floor(it.y)); return r && r.visited; }

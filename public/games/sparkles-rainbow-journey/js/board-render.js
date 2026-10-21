import { cameraMatrix } from '../../rustys-after-hours/js/scene3d.js';
import { BoardScene, ToyMesh } from './board-scene.js';
import { COLORS, LINKS, CANDY, CHARACTERS, tilePoint, portrait } from './board.js';
const normalizeRoute = v => { const length = Math.hypot(...v) || 1; return v.map(n => n / length); };

export class BoardRenderer {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.angle = 0; this.zoom = 1; this.visual = null; this.dirty = true;
    try { this.scene = new BoardScene(); this.backend = 'webgl'; this.build(); }
    catch { this.scene = null; this.backend = 'canvas'; }
    this.portraits = new Map();
    let drag = null;
    canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, angle: this.angle }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => { if (drag) { this.angle = Math.max(-.65, Math.min(.65, drag.angle + (e.clientX - drag.x) * .003)); this.dirty = true; } });
    canvas.addEventListener('pointerup', () => { drag = null; });
    canvas.addEventListener('pointercancel', () => { drag = null; });
    window.addEventListener('resize', () => { this.dirty = true; });
    this.scene?.canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); this.scene = null; this.backend = 'canvas'; this.dirty = true; });
  }
  build() {
    const m = new ToyMesh();
    m.roundedBox(0, -1.08, 0, 65, .2, 65, .4, '#d4b899', 2);
    // The tabletop receives shadows but never casts onto itself.
    m.shadowSkip = m.data.length / 10;
    m.roundedBox(0, -.65, 0, 13.3, .55, 8.8, .45, '#704d38', 2);
    m.roundedBox(0, -.33, 0, 13.45, .16, 8.95, .45, '#cfac77', 2);
    m.roundedBox(0, -.18, 0, 13.25, .22, 8.75, .4, '#a77a50', 2);
    m.roundedBox(0, -.035, 0, 10.75, .12, 6.7, .22, '#f2e8cc', 0);
    for (let n = 1; n <= 60; n++) {
      const { x, z } = tilePoint(n);
      m.roundedBox(x, .1, z, .94, .2, .94, .11, COLORS[(n - 1) % 6]);
      m.roundedBox(x, .245, z, .83, .12, .83, .085, '#fff4df');
      m.roundedBox(x, .31, z + .33, .59, .018, .045, .02, COLORS[(n - 1) % 6]);
    }
    // Candy trees and soft cloud clusters surround the board.
    for (let i = 0; i < 12; i++) {
      const x = i < 6 ? -5.95 : 5.95, z = (i % 6) * 1.22 - 3.05;
      m.cylinder(x, .21, z, .045, .7, '#ead8b2', 1);
      m.ellipsoid(x, .7, z, .25, .28, .14, '#fff0d7', 1);
      const spiral = Array.from({ length: 43 }, (_, j) => { const a = j / 42 * Math.PI * 5, r = .015 + j / 42 * .22; return [x + Math.cos(a) * r, .7 + Math.sin(a) * r, z + .13]; });
      m.tube(spiral, .025, COLORS[i % 6], 1, 6);
      m.roundedBox(x, -.02, z, .52, .12, .5, .14, '#f1d6b2');
    }
    // Castle at the finish, behind the last row.
    const castle = tilePoint(60);
    m.roundedBox(castle.x, .48, -3.91, 1.35, 1.15, .7, .13, '#b4a3d4');
    for (const side of [-1, 1]) {
      m.cylinder(castle.x + side * .65, .65, -3.91, .23, 1.5, '#f1c8a2', 1);
      m.cone(castle.x + side * .65, 1.62, -3.91, .34, .65, '#b46e95');
      m.roundedBox(castle.x + side * .65, .72, -3.67, .13, .25, .035, .04, '#725b80');
      m.cylinder(castle.x + side * .65, 2.03, -3.91, .018, .25, '#d2aa58', 1);
      m.ellipsoid(castle.x + side * .65, 2.17, -3.91, .045, .045, .045, '#ddbc67', 1);
    }
    m.roundedBox(castle.x, .34, -3.54, .38, .68, .045, .13, '#6c5172');
    for (let i = 0; i < 4; i++) m.roundedBox(castle.x - .48 + i * .32, 1.12, -3.91, .19, .25, .7, .035, '#cabce1');
    for (const link of LINKS) this.buildRoute(m, link);
    // Molded dice sit in a recessed tray beside the track.
    m.roundedBox(5.92, .02, 3.55, .95, .13, .85, .13, '#694937', 2);
    this.scene.setStatic(m);
  }
  buildRoute(m, link) {
    const a = tilePoint(link.from), b = tilePoint(link.to), dx = b.x - a.x, dz = b.z - a.z, length = Math.hypot(dx, dz), nx = -dz / length, nz = dx / length;
    const point = (t, side = 0) => {
      const bend = link.kind === 'slide' ? Math.sin(t * Math.PI * 2) * .32 : 0;
      return [a.x + .23 + dx * t + nx * (side + bend), link.kind === 'slide' ? .39 + .6 * (1 - t) + Math.sin(t * Math.PI) * .12 : .39 + Math.sin(t * Math.PI) * .24, a.z - .19 + dz * t + nz * (side + bend)];
    };
    if (link.kind === 'ladder') {
      for (const s of [-1, 1]) m.tube(Array.from({ length: 20 }, (_, i) => point(i / 19, s * .17)), .038, '#558f84');
      const steps = Math.max(5, Math.ceil(length * 3));
      for (let i = 0; i <= steps; i++) { m.tube([point(i / steps, -.17), point(i / steps, .17)], .032, COLORS[i % 6]); }
    } else {
      // A solid, concave slide bed with raised glossy safety rails.
      const col = [231 / 255, 137 / 255, 165 / 255];
      for (let i = 0; i < 35; i++) for (let j = 0; j < 6; j++) {
        const vertices = [[i,j],[i+1,j],[i+1,j+1],[i,j],[i+1,j+1],[i,j+1]];
        for (const [step, side] of vertices) { const u = (side / 6 - .5) * .34, p = point(step / 35, u); p[1] += .09 * Math.pow(u / .17, 2); m.vertex(p, normalizeRoute([nx * -u, 1, nz * -u]), col, 1); }
      }
      for (const side of [-1, 1]) m.tube(Array.from({ length: 36 }, (_, i) => { const p = point(i / 35, side * .19); p[1] += .11; return p; }), .025, '#f3bec7');
      for (const t of [0, .45]) { const p = point(t); m.cylinder(p[0], (.3 + p[1]) / 2, p[2], .045, p[1] - .3, '#ddbd8b', 1); }
    }
  }
  character(m, player, index, active, time) {
    const c = CHARACTERS[player.character], point = this.position(player, index);
    m.transform(point.x, .3, point.z, this.viewAngle || 0, .68);
    m.cylinder(0, .02, 0, .35, .06, player.shirt, .15);
    const bounce = active ? Math.sin(time * 2) * .025 : 0;
    const y = c.wheelchair ? -.15 : 0;
    if (!c.wheelchair) for (const s of [-1, 1]) {
      m.roundedBox(s * .13, .27, 0, .16, .43, .18, .045, '#40536c');
      m.roundedBox(s * .13, .08, .07, .2, .12, .3, .05, '#f7efe2');
    }
    m.ellipsoid(0, .66 + y + bounce, 0, .29, .36, .19, player.shirt);
    for (const s of [-1, 1]) { m.ellipsoid(s * .32, .64 + y, 0, .1, .27, .1, player.shirt); m.ellipsoid(s * .33, .41 + y, .03, .09, .09, .09, c.skin); }
    m.ellipsoid(0, 1.19 + y + bounce, 0, .28, .31, .25, c.skin);
    m.ellipsoid(0, 1.36 + y + bounce, -.04, .3, .2, .25, c.hair);
    if (['puffs', 'curls'].includes(c.style)) for (const s of [-1, 1]) m.ellipsoid(s * .25, 1.42 + y, -.04, .18, .19, .17, c.hair);
    if (c.style === 'hijab') { m.ellipsoid(0, 1.13 + y, -.12, .34, .4, .2, c.hair); m.box(0, .91 + y, 0, .5, .16, .35, c.hair); }
    if (c.style === 'braids') for (const s of [-1, 1]) m.ellipsoid(s * .27, 1.04 + y, 0, .07, .32, .08, c.hair);
    for (const s of [-1, 1]) {
      m.ellipsoid(s * .1, 1.2 + y + bounce, .23, .046, .052, .02, '#fff8e9', 1);
      m.ellipsoid(s * .1, 1.2 + y + bounce, .25, .025, .034, .012, '#282538', 1);
      m.ellipsoid(s * .1 - .008, 1.214 + y + bounce, .26, .008, .009, .004, '#ffffff', 1);
      if (c.glasses) {
        for (const top of [-1, 1]) m.box(s * .11, 1.2 + y + bounce + top * .055, .26, .17, .018, .015, '#4f5e70');
        for (const edge of [-1, 1]) m.box(s * .11 + edge * .077, 1.2 + y + bounce, .26, .018, .11, .015, '#4f5e70');
      }
    }
    m.tube([[-.07,1.096+y+bounce,.24],[0,1.075+y+bounce,.25],[.07,1.096+y+bounce,.24]], .012, '#8d4949', 0);
    m.ellipsoid(0,1.145+y+bounce,.255,.035,.04,.042,c.skin,1);
    m.box(0, .77 + y, .19, .09, .09, .03, '#fff1bb');
    if (c.wheelchair) {
      m.box(0, .3, -.05, .65, .12, .5, '#535b80');
      m.box(0, .5, -.22, .62, .5, .08, '#535b80');
      for (const s of [-1, 1]) { m.ellipsoid(s * .4, .27, 0, .07, .3, .3, '#353e59'); m.ellipsoid(s * .46, .27, 0, .015, .22, .22, '#bed7dd'); }
      m.box(0, .16, .3, .5, .08, .3, '#535b80');
    }
    m.transform();
    if (active) m.ellipsoid(point.x, 1.22, point.z, .055, .06, .055, '#ffce55', .4);
  }
  position(player, i) {
    if (this.visual && this.visual.index === i) return this.visual;
    const p = tilePoint(player.pos);
    return { x: p.x + (i % 3 - 1) * .21, z: p.z + (Math.floor(i / 3) - .5) * .27 };
  }
  project(x, y, z) {
    if (this.scene) return this.scene.project(x, y, z, this.w, this.h);
    const scale = Math.min(this.w / 13.5, this.h / 7.5) * this.zoom;
    return { x: this.w / 2 + (x - z * .35) * scale, y: this.h * .53 + (z * .68 - y) * scale };
  }
  draw(match, time = 0) {
    const r = this.canvas.getBoundingClientRect(), dpr = Math.min(1.5, devicePixelRatio || 1);
    this.w = r.width; this.h = r.height;
    if (!r.width || !r.height) return;
    if (this.canvas.width !== Math.round(r.width * dpr) || this.canvas.height !== Math.round(r.height * dpr)) { this.canvas.width = Math.round(r.width * dpr); this.canvas.height = Math.round(r.height * dpr); }
    const ctx = this.ctx, w = this.w, h = this.h;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    if (this.scene) {
      this.scene.resize(w, h);
      // Turn the tabletop lengthwise on portrait screens so its sixty spaces
      // can fill the taller area instead of becoming a thin horizontal strip.
      const portraitView = w / h < .9;
      const viewAngle = this.viewAngle = this.angle + (portraitView ? Math.PI / 2 : 0);
      const elevation = portraitView ? 1.35 : .96;
      const mesh = new ToyMesh();
      match?.players.forEach((p, i) => this.character(mesh, p, i, i === match.turn, time));
      mesh.transform(5.92, .34 + (this.dieRolling ? Math.abs(Math.sin(time * 18)) * .12 : 0), 3.55, this.dieRolling ? time * 12 : .15);
      mesh.roundedBox(0, 0, 0, .62, .55, .62, .11, '#fff4df');
      const face = this.dieRolling ? Math.floor(time * 13) % 6 + 1 : match?.die || 5;
      const pips = [[], [[0,0]], [[-.14,-.14],[.14,.14]], [[-.14,-.14],[0,0],[.14,.14]], [[-.14,-.14],[.14,-.14],[-.14,.14],[.14,.14]], [[-.14,-.14],[.14,-.14],[0,0],[-.14,.14],[.14,.14]], [[-.14,-.16],[.14,-.16],[-.14,0],[.14,0],[-.14,.16],[.14,.16]]];
      for (const [x,z] of pips[face]) mesh.ellipsoid(x,.281,z,.04,.008,.04,'#473e56',0);
      for (const [x,y] of pips[3]) mesh.ellipsoid(x,y,.313,.04,.04,.008,'#473e56',0);
      mesh.transform();
      // Fit the actual board and decorations to the available viewport instead
      // of keeping a distant camera that leaves most of the canvas empty.
      const bounds = [];
      for (const x of [-5.7, 5.7]) for (const z of [-3.7, 3.7]) bounds.push([x, .3, z]);
      for (const x of [-6.75, 6.75]) for (const z of [-4.5, 4.5]) bounds.push([x, -.95, z]);
      for (const x of [-6.5, 6.5]) for (const z of [-3.3, 3.3]) bounds.push([x, 1.4, z]);
      bounds.push([-5.5, 2.3, -4.3], [-3.5, 2.3, -4.3]);
      let low = 3, high = 35;
      for (let step = 0; step < 12; step++) {
        const d = (low + high) / 2, matrix = cameraMatrix([Math.sin(viewAngle) * d, d * elevation, Math.cos(viewAngle) * d * .76], [0, 0, -.1], w / h, .9);
        const fits = bounds.every(([x, y, z]) => {
          const X = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
          const Y = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
          const W = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
          return W > 0 && Math.abs(X / W) < .96 && Math.abs(Y / W) < .95;
        });
        if (fits) high = d; else low = d;
      }
      const distance = high / this.zoom;
      const eye = [Math.sin(viewAngle) * distance, distance * elevation, Math.cos(viewAngle) * distance * .76];
      ctx.drawImage(this.scene.render({ eye, target: [0, 0, -.1], mesh, fov: .9, labelAngle: portraitView ? Math.PI / 2 : 0 }), 0, 0, w, h);
    } else this.fallbackBoard(ctx);
    // Project the board's labels and routes into the same 3D camera.
    if (!this.scene) for (const link of LINKS) this.route(ctx, link);
    const size = Math.max(10, Math.min(18, w / 55));
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `800 ${size}px Andika, sans-serif`;
    if (!this.scene) for (let n = 1; n <= 60; n++) {
      const p = tilePoint(n), pt = this.project(p.x, .29, p.z + .12); if (!pt) continue;
      ctx.fillStyle = '#4a405b'; ctx.fillText(CANDY.includes(n) ? `${n} 🍬` : n === 60 ? '60 ★' : String(n), pt.x, pt.y);
    }
    if (match) match.players.forEach((p, i) => {
      const point = this.position(p, i), pt = this.project(point.x, 1.45, point.z); if (!pt) return;
      if (!this.scene) this.fallbackPawn(ctx, p, pt);
      if (i !== match.turn) return;
      ctx.font = '700 11px Andika, sans-serif'; const label = p.name, tw = ctx.measureText(label).width + 18;
      ctx.fillStyle = '#fffdf5'; ctx.beginPath(); ctx.roundRect(pt.x - tw / 2, pt.y - 23, tw, 21, 10); ctx.fill();
      ctx.fillStyle = '#443652'; ctx.fillText(label, pt.x, pt.y - 12);
    });
    this.dirty = false;
  }
  route(ctx, link) {
    const a = tilePoint(link.from), b = tilePoint(link.to);
    const A = this.project(a.x + .22, .33, a.z - .15), B = this.project(b.x + .22, .33, b.z - .15);
    if (!A || !B) return;
    ctx.save(); ctx.lineCap = 'round';
    if (link.kind === 'slide') {
      const mx = (A.x + B.x) / 2 + 14;
      ctx.strokeStyle = '#fff6df'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.bezierCurveTo(mx, A.y, mx, B.y, B.x, B.y); ctx.stroke();
      ctx.strokeStyle = '#e989a4'; ctx.lineWidth = 7; ctx.stroke();
    } else {
      const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy), nx = -dy / len * 4, ny = dx / len * 4;
      ctx.strokeStyle = '#5a8d87'; ctx.lineWidth = 3;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(A.x + nx * s, A.y + ny * s); ctx.lineTo(B.x + nx * s, B.y + ny * s); ctx.stroke(); }
      for (let t = 0; t <= 1; t += .1) { ctx.strokeStyle = COLORS[Math.round(t * 10) % 6]; ctx.beginPath(); ctx.moveTo(A.x + dx * t - nx, A.y + dy * t - ny); ctx.lineTo(A.x + dx * t + nx, A.y + dy * t + ny); ctx.stroke(); }
    }
    ctx.fillStyle = link.kind === 'slide' ? '#c45b84' : '#438d7d'; ctx.beginPath(); ctx.arc(A.x, A.y, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  fallbackBoard(ctx) {
    for (let n = 60; n > 0; n--) {
      const p = tilePoint(n), points = [[-.46, -.46], [.46, -.46], [.46, .46], [-.46, .46]].map(([x, z]) => this.project(p.x + x, .1, p.z + z));
      ctx.beginPath(); points.forEach((pt, i) => i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)); ctx.closePath(); ctx.fillStyle = COLORS[(n - 1) % 6]; ctx.fill(); ctx.strokeStyle = '#fffcf3'; ctx.lineWidth = 3; ctx.stroke();
    }
  }
  fallbackPawn(ctx, p, pt) {
    const key = p.character + p.shirt; let img = this.portraits.get(key);
    if (!img) { img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(portrait(p.character, p.shirt)); this.portraits.set(key, img); img.onload = () => { this.dirty = true; }; }
    if (img.complete) ctx.drawImage(img, pt.x - 16, pt.y + 7, 32, 35);
  }
}

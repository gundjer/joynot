import { Renderer3D as RayRenderer } from './render3d.js';
import { Scene3D, Mesh, robotMesh } from './scene3d.js';
import { T, lineOfSight } from './world.js';
import { CAST } from './animatronics.js';

const CAST_ORDER = ['rusty', 'hoot', 'chomps', 'major'];
const COLORS = { dining: '#b85543', arcade: '#5568aa', stage: '#9e485f', kitchen: '#739a98', parts: '#65828b', office: '#807158', storage: '#77645a', party: '#ab6594' };

export class Pizzeria3D extends RayRenderer {
  constructor(canvas) {
    super(canvas);
    try { this.scene = new Scene3D(); this.backend = 'webgl'; } catch (e) { this.backend = 'raycast'; console.warn('Using the compatible 3D renderer', e.message); }
  }
  setWorld(world, tier) {
    super.setWorld(world, tier);
    if (!this.scene) return;
    const m = new Mesh(); this.signs = [];
    // Solid walls with timber skirting, colored stripes, checkerboard floors and ceiling fixtures.
    for (const r of world.rooms) {
      for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) {
        m.box(x + .5, -.055, y + .5, 1, .1, 1, (x + y) % 2 ? '#d5c5ac' : '#48576a');
      }
      m.box((r.x0 + r.x1 + 1) / 2, 1.93, (r.y0 + r.y1 + 1) / 2, r.x1 - r.x0 + 1, .09, r.y1 - r.y0 + 1, '#333f51');
      for (const x of [r.x0 + 2, r.x1 - 1]) {
        m.box(x, 1.85, r.y0 + 3.5, 1.2, .06, .45, '#d8d5bf');
        m.box(x, 1.805, r.y0 + 3.5, 1.05, .02, .3, '#fff3bf', .8);
      }
      this.signs.push({ x: r.x0 + 4.5, y: 1.65, z: r.y0 + .08, text: r.theme === 'stage' ? "RUSTY'S PIZZA • LIVE BAND" : r.theme === 'dining' ? "RUSTY'S PIZZA • DINING" : r.name.toUpperCase() });
    }
    for (let y = 0; y < world.H; y++) for (let x = 0; x < world.W; x++) if (world.tiles[y * world.W + x] === T.WALL) {
      const r = world.rooms.find(r => x >= r.x0 - 1 && x <= r.x1 + 1 && y >= r.y0 - 1 && y <= r.y1 + 1);
      m.box(x + .5, .9, y + .5, 1, 1.8, 1, '#c6b39b');
      m.box(x + .5, .64, y + .5, 1.012, .18, 1.012, COLORS[r?.theme] || '#b85543');
      m.box(x + .5, .1, y + .5, 1.015, .19, 1.015, '#493c3c');
      m.box(x + .5, 1.64, y + .5, 1.015, .08, 1.015, '#e7c879');
      for (let i = 0; i < 4; i++) { const color = (x + y + i) % 2 ? '#ede0c4' : '#374554'; m.box(x + .125 + i * .25, .8, y + .5, .25, .12, 1.02, color); m.box(x + .5, .8, y + .125 + i * .25, 1.02, .12, .25, color); }
    }
    for (const p of world.props) this.furniture(m, p);
    for (const h of world.hides) this.furniture(m, { ...h, w: 1, type: h.type === 'table' ? 'table' : h.type === 'curtain' ? 'curtain' : 'locker', hiding: true });
    // One coherent show stage, with a labeled empty pedestal for the roaming performer.
    const stage = world.rooms.find(r => r.theme === 'stage');
    this.stageRoom = stage;
    if (stage) {
      const z = stage.y0 + 1.1;
      m.box(stage.x0 + 4, .13, z, 7.3, .26, 1.8, '#6c3b40');
      m.box(stage.x0 + 4, .27, z, 7.3, .03, 1.8, '#bb9464');
      for (const x of [stage.x0 + .4, stage.x1 + .5]) { m.box(x, 1.15, z + .7, .32, 1.55, .3, '#8d294c'); m.box(x, .58, z + 1.1, .5, 1.15, .38, '#242d3b'); for (const y of [.3, .8]) m.ellipsoid(x, y, z + .88, .16, .16, .025, '#0d141f'); }
      for (let i = 0; i < 4; i++) { const x = stage.x0 + 1.3 + i * 1.6; m.cylinder(x, .3, z, .5, .07, '#ddad4e'); this.signs.push({ x, y: .4, z: z + .68, text: CAST_ORDER[i].toUpperCase(), stage: CAST_ORDER[i] }); }
    }
    this.scene.setStatic(m);
  }
  furniture(m, p) {
    const x = p.x + p.w / 2, z = p.y + .5, w = p.w;
    if (p.type === 'table' || p.type === 'desk' || p.type === 'counter') {
      m.box(x, .51, z, w * .85, .1, .78, p.type === 'counter' ? '#aeb9ba' : '#bf6c4e');
      for (const dx of [-.3, .3]) for (const dz of [-.27, .27]) m.box(x + dx * w, .24, z + dz, .055, .48, .055, '#535e69');
      // Plates, a pizza, and cups make these dining tables, rather than empty blocks.
      m.cylinder(x, .58, z, .23, .025, '#e9e0c4'); m.cylinder(x, .604, z, .19, .025, '#e7b45b');
      for (let i = 0; i < 5; i++) m.cylinder(x + Math.cos(i * 1.26) * .11, .621, z + Math.sin(i * 1.26) * .11, .033, .008, '#ad4339');
      if (p.type === 'table') for (const s of [-1, 1]) {
        const cx = x + s * (w * .34);
        m.box(cx, .3, z + .42, .33, .07, .3, '#874d4e'); m.box(cx, .53, z + .54, .33, .4, .055, '#ad5656');
        for (const dx of [-.12, .12]) m.box(cx + dx, .14, z + .43, .04, .28, .04, '#566274');
      }
    } else if (p.type === 'arcade') {
      for (let i = 0; i < w; i++) {
        const cx = p.x + i + .5, accent = ['#b65cc5', '#399fac', '#df9b40'][i % 3];
        m.box(cx, .53, z, .69, 1.06, .7, '#1d293e'); m.box(cx, 1.13, z + .15, .69, .2, .6, accent);
        m.box(cx, .88, z - .31, .58, .42, .05, '#0b1426'); m.box(cx, .89, z - .345, .47, .29, .012, '#326b8b', .7);
        for (let j = 0; j < 4; j++) m.box(cx - .16 + j * .1, .85 + Math.sin(j) * .07, z - .358, .055, .04, .006, '#f6cf5e', .8);
        m.box(cx, .59, z - .42, .66, .1, .28, accent);
        m.cylinder(cx - .16, .7, z - .43, .018, .13, '#bacbdb'); m.ellipsoid(cx - .16, .77, z - .43, .035, .035, .035, '#f15a5f');
        for (let j = 0; j < 3; j++) m.cylinder(cx + .02 + j * .09, .65, z - .44, .027, .025, '#f5ca61');
        m.box(cx, 1.14, z - .16, .51, .1, .025, '#f6d77e', .55);
      }
    } else if (p.type === 'stage') {
      m.box(x, .16, z, w * .95, .32, .9, '#743b48');
    } else if (p.type === 'stove' || p.type === 'fridge') {
      m.box(x, .55, z, .85, 1.1, .8, '#aeb9ba'); m.box(x, .55, z - .41, .7, .42, .04, '#29323f');
      m.box(x, .56, z - .44, .54, .27, .02, '#bd6f37', .15); m.box(x, .84, z - .47, .44, .035, .04, '#e0d6ba');
    } else if (p.type === 'curtain') {
      for (let i = 0; i < 6; i++) m.cylinder(x - .4 + i * .16, .7, z, .1, 1.4, i % 2 ? '#9b3953' : '#722840');
    } else {
      const tall = ['locker', 'cabinet', 'shelf', 'heads'].includes(p.type);
      m.box(x, tall ? .6 : .28, z, w * .83, tall ? 1.2 : .56, .73, tall ? '#526b7b' : '#9b744e');
      if (tall) for (let i = 0; i < 4; i++) m.box(x, .35 + i * .19, z - .375, w * .62, .025, .018, '#253b4a');
      if (p.hiding) m.box(x + .25, .55, z - .39, .04, .17, .04, '#edce76');
    }
  }
  draw(g) {
    if (!this.scene || this.scene.gl.isContextLost()) return super.draw(g);
    if (g.world !== this.world) this.setWorld(g.world, this.tier);
    const s = this.scene, mesh = new Mesh(), p = g.player, time = g.time;
    s.resize(this.w, this.h);
    for (const d of g.world.doors) if (!d.open) {
      for (const [x, y] of d.tiles) {
        mesh.box(x + .5, .72, y + .5, d.orient === 'h' ? 1 : .14, 1.44, d.orient === 'v' ? 1 : .14, d.exit ? '#36786e' : d.kind === 'math' ? '#b57943' : '#527f99');
        mesh.box(x + .5, 1.5, y + .5, d.orient === 'h' ? 1 : .16, .12, d.orient === 'v' ? 1 : .16, d.exit ? '#78e4ac' : '#e1bd72', .4);
      }
    }
    for (const item of g.world.items) if (!item.taken) {
      const bob = .18 + Math.sin(time * 2.5 + item.x) * .025;
      mesh.transform(item.x, bob, item.y, time * .7);
      if (item.type === 'coin' || item.type === 'token') { mesh.cylinder(0, 0, 0, .115, .04, '#f2c653', .4); mesh.cylinder(0, .026, 0, .08, .008, '#ffe2a0', .45); }
      else if (item.type === 'battery') { mesh.box(0, .08, 0, .12, .26, .12, '#56697c'); mesh.box(0, .14, 0, .125, .1, .125, '#5ce29b', .4); mesh.box(0, .225, 0, .065, .035, .065, '#d4dce0'); }
      else { mesh.box(0, .12, 0, .19, .3, .19, '#496577'); for (let i = 0; i < 3; i++) mesh.box(0, .03 + i * .085, -.1, .14, .04, .018, '#65f3bd', .9); }
    }
    if (this.stageRoom) {
      const r = this.stageRoom, roaming = g.monsters.map(m => m.id);
      CAST_ORDER.forEach((id, i) => {
        const x = r.x0 + 1.3 + i * 1.6, z = r.y0 + 1.1;
        mesh.transform(x, .33, z, Math.PI, .85);
        if (!roaming.includes(id)) robotMesh(mesh, { ...CAST[id], color: CAST[id].fur }, time);
        else { mesh.box(0, .05, 0, .45, .02, .35, '#bf623f', .5); mesh.box(0, .4, .1, .025, .65, .025, '#cdbba2'); mesh.box(0, .67, .1, .6, .2, .04, '#e2bb6a'); }
      });
    }
    for (const m of g.monsters) if (m.state !== 'gone' && (m.alpha ?? 1) > .1) {
      const c = CAST[m.id], bot = m.bot || { ...c, color: c?.fur || '#958a7d' };
      mesh.transform(m.x, 0, m.y, Math.atan2(-(p.x - m.x), -(p.y - m.y)), 1);
      robotMesh(mesh, { ...bot, chase: this.tier > 0 }, time, null, m.moving);
    }
    for (const h of g.helpers || []) { mesh.transform(h.x, 0, h.y, g.lightAngle - Math.PI / 2, .66); robotMesh(mesh, h, time, null, h.moving); }
    mesh.transform();
    const bob = g.moving && !p.hidden ? Math.sin(time * 10) * .016 : 0;
    const eye = [p.x, p.hidden ? .3 : .76 + bob, p.y], target = [p.x + Math.cos(g.lightAngle), eye[1] -.025, p.y + Math.sin(g.lightAngle)];
    const image = s.render({ eye, target, tier: this.tier, flash: g.lightOn && !p.hidden ? 1.3 : 0, mesh });
    const ctx = this.ctx; ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); ctx.drawImage(image, 0, 0, this.w, this.h);
    for (const sign of this.signs) {
      if (Math.hypot(sign.x - p.x, sign.z - p.y) > 10 || !lineOfSight(g.world, p.x, p.y, sign.x, sign.z)) continue;
      const pt = s.project(sign.x, sign.y, sign.z, this.w, this.h); if (!pt) continue;
      const size = Math.max(9, Math.min(25, 70 / pt.depth));
      ctx.font = `800 ${size}px Andika, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const text = sign.stage && g.monsters.some(m => m.id === sign.stage) ? `MISSING: ${sign.text}` : sign.text;
      const width = ctx.measureText(text).width + 18; ctx.fillStyle = '#172b3c'; ctx.fillRect(pt.x - width / 2, pt.y - size, width, size * 2); ctx.fillStyle = '#f6db97'; ctx.fillText(text, pt.x, pt.y);
    }
    if (this.stageRoom && g.room === this.stageRoom && !g.chaseBot) {
      const missing = g.monsters.map(m => m.c.name).join(', ');
      ctx.font = '700 16px Andika, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe1a0';
      ctx.fillText(`Empty stage spot: ${missing} is roaming the pizza shop!`, this.w / 2, this.h * .79, this.w * .88);
    }
    if (g.nearHide || g.nearDoor) {
      const object = g.nearHide || g.nearDoor, tile = object.tiles ? object.tiles[0] : [object.x, object.y];
      const pt = s.project(tile[0] + .5, .9, tile[1] + .5, this.w, this.h);
      if (pt) {
        ctx.font = '800 16px Andika, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe09b';
        ctx.shadowColor = '#132638'; ctx.shadowBlur = 5;
        ctx.fillText(g.nearHide ? 'HIDE HERE' : object.exit ? 'POWERED EXIT' : object.kind === 'math' ? 'SOLVE TO OPEN' : 'READ TO OPEN', pt.x, pt.y);
        ctx.shadowBlur = 0;
      }
    }
    if (p.hidden) { ctx.fillStyle = 'rgba(5,12,20,.8)'; for (let y = 0; y < this.h; y += 44) ctx.fillRect(0, y, this.w, 23); }
    else this.flashlight(g);
  }
  flashlight(g) {
    const ctx = this.ctx, W = this.w, H = this.h, x = W * .76, y = H * .94, r = Math.min(W, H) * .06;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-.28);
    const body = ctx.createLinearGradient(-r, 0, r, 0); body.addColorStop(0, '#1d293a'); body.addColorStop(.5, '#637487'); body.addColorStop(1, '#152033');
    ctx.fillStyle = body; ctx.fillRect(-r * .52, -r, r * 1.04, r * 3);
    ctx.fillStyle = '#b8c5ca'; ctx.beginPath(); ctx.ellipse(0, -r, r * .85, r * .42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = g.lightOn ? '#fff0b4' : '#273b4a'; ctx.beginPath(); ctx.ellipse(0, -r * 1.02, r * .62, r * .28, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}

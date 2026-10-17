// Level 3 of the loop: HALLWAY RUN, in 3D. The camera is behind you as you run down a long, flickering hallway.
// The animatronic YOU BUILT in the Workshop is chasing you (its powers decide how fast it runs, how long it listens
// at your locker, and how often it rushes). Doors ahead only open when you read the word or solve the problem.
// Jump over toys. When it RUSHES (red glow), hide in a locker. Lockers are checkpoints. 3 hearts.
// Your other robots run with you: tap 🤖 and one of them pushes the chaser far back (once each per run).
// No robot built yet (old saves)? A cast animatronic chases instead.
import { CHARACTERS, getTier } from './characters.js';
import { Art, ART_W, ART_H, eyePoints, CAST } from './animatronics.js';
import { powersOf } from './bots.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = a => a[Math.floor(Math.random() * a.length)];
const RUN = 3.8, CHASE = 3.25, RUSH = 6.2, CATCH = 0.9;
const HALF = 1.25, CEIL = 2.3, CAMH = 1.35; // corridor half width, ceiling height, camera height (world units)

export class Hallway {
  /** env: { store, tutor, challenge, say, toast, sfx, chaser, chaserBot, bots, kid, voice(text, who), onLevelUp(), onCaught(who, last) → Promise, onDone(stats), onHearts(n) } */
  constructor(env) {
    this.env = env; this.t = 0; this.hearts = 3; this.done = false; this.busy = false;
    const doors = env.doors || 5, focus = env.store.data.settings.focus || 'both';
    const kindFor = i => focus === 'reading' ? (i === 2 ? 'math' : 'read') : focus === 'math' ? (i === 2 ? 'read' : 'math') : (i % 2 ? 'math' : 'read');
    this.things = []; let x = 10, side = 1;
    for (let i = 0; i < doors; i++) {
      this.things.push({ type: 'locker', x, side }); side = -side; x += 3.5;
      if (i > 0 || doors > 3) { this.things.push({ type: 'toy', x, v: i % 3 }); x += 4.5; }
      this.things.push({ type: 'door', x, kind: kindFor(i), open: false, item: null, lift: 0 }); x += 6;
    }
    this.things.push({ type: 'locker', x, side }); x += 5;
    this.endX = x; this.length = x + 4;
    this.p = { x: 2, y: 0, vy: 0, hidden: null, stumble: 0, stop: false };
    this.bot = env.chaserBot || null;
    const pw = powersOf(this.bot);
    this.pw = this.bot ? pw : { speed: 3, ears: 3, eyes: 3 };
    this.c = { id: this.bot ? 'bot' : (env.chaser || 'rusty'), x: -7, state: 'chase', rushT: 7 + Math.random() * 4, rush: 0, search: 0, t: 0, back: 0 };
    this.check = { px: 2, cx: -7 };
    this.helpers = (env.bots || []).slice(-3).map((b, i) => ({ ...b, x: this.p.x - 1.2 - i * 0.9, used: false }));
    this.stats = { doors: 0, read: 0, math: 0, jumps: 0, hides: 0, caught: 0 };
    this.flash = 0; this.shake = 0; this.cam = 4;
    const tier = getTier();
    // Grown-ups → Animatronic speed, the tier, and the robot's Speed power (1–5)
    this.sp = ({ slow: 0.8, normal: 1, fast: 1.12 }[env.store.data.settings.monsterSpeed] || 1) * [0.8, 1, 1.08][tier] * (0.82 + 0.07 * this.pw.speed);
  }

  get name() { return this.bot ? this.bot.name : CHARACTERS[this.c.id].name.split(' ')[0]; }
  get near() {
    const p = this.p;
    if (p.hidden) return 'hidden';
    const d = this.doorAhead(); if (d && d.x - p.x < 1.1) return 'door';
    if (this.lockerHere()) return 'locker';
    return null;
  }
  get goal() {
    const n = this.near, gap = this.gap();
    if (n === 'hidden') return this.c.state === 'search' ? '🤫 Shhh! Stay hidden…' : 'Tap COME OUT when it is safe!';
    if (n === 'door') return 'Tap OPEN and read or solve the door!';
    if (this.c.rush > 0) return `🏃 ${this.name} is RUSHING! Hide in a locker!`;
    if (gap < 3) return 'Run! Jump over toys!';
    return `Run to the door! ${this.doorsLeft()} door${this.doorsLeft() === 1 ? '' : 's'} to go.`;
  }
  doorsLeft() { return this.things.filter(t => t.type === 'door' && !t.open).length; }
  doorAhead() { return this.things.find(t => t.type === 'door' && !t.open && t.x >= this.p.x - 0.2); }
  lockerHere() { return this.things.find(t => t.type === 'locker' && Math.abs(t.x - this.p.x) < 0.9); }
  gap() { return this.p.x - this.c.x; }
  voice(text) { this.env.voice(text, this.bot ? 'bot' : this.c.id); }

  start() {
    const n = this.name, tier = getTier();
    this.env.say(tier === 0
      ? `Tag time! ${n} is chasing you! Run to the doors and read or solve them to open them. Tap JUMP to hop over toys. If ${n} runs super fast, hide in a locker!`
      : `Hallway run! ${n} came to life and is chasing you! Read or solve the doors to open them. Tap JUMP to hop over toys. If ${n} rushes, hide in a locker!`);
  }

  // ------------------------------------------------ actions (buttons)
  jump() { const p = this.p; if (this.done || this.busy || p.hidden || p.y > 0.01) return; p.vy = 7.2; this.env.sfx.click(); }
  async action() {
    if (this.done || this.busy) return;
    const n = this.near, p = this.p;
    if (n === 'hidden') { p.hidden = null; this.env.sfx.close(); return; }
    if (n === 'locker') { const l = this.lockerHere(); p.hidden = l; p.x = l.x; this.stats.hides++; this.env.sfx.door(); if (this.gap() < 6 && this.c.state !== 'search') { this.c.state = 'search'; this.c.search = 1.6 + 0.5 * this.pw.ears; } return; }
    if (n === 'door') return this.openDoor(this.doorAhead());
  }
  help() {
    const h = this.helpers.find(h => !h.used); if (!h || this.done || this.busy) return false;
    h.used = true; h.zip = 1; this.c.x = Math.min(this.c.x, this.p.x - 11); this.c.rush = 0; this.c.state = 'chase'; this.c.rushT = 8;
    this.flash = 0.6; this.env.sfx.vanish(0); this.env.say(`${h.name} to the rescue! ${h.name} pushed ${this.name} way back!`);
    return true;
  }
  helpersLeft() { return this.helpers.filter(h => !h.used).length; }

  async openDoor(d) {
    this.busy = true;
    const E = this.env;
    if (!d.item) d.item = E.tutor.pick(d.kind === 'read' ? 'reading' : 'math');
    const res = await E.challenge.open(d.item, {});
    this.busy = false;
    if (res.levelUp) E.onLevelUp();
    if (this.done) return;
    if (res.solved) {
      d.open = true; d.item = null; this.stats.doors++; if (d.kind === 'read') this.stats.read++; else this.stats.math++;
      E.sfx.door(); this.c.x = Math.min(this.c.x, this.p.x - 4); // a head start after every door
    } else {
      d.item = null; this.c.x = Math.min(this.p.x - 1.6, this.c.x + 2.5); E.say('That door is still locked. Tap OPEN to try a new one. Hurry!');
    }
  }

  // ------------------------------------------------ the run
  update(dt) {
    if (this.done || this.busy) return;
    this.t += dt; this.flash = Math.max(0, this.flash - dt); this.shake = Math.max(0, this.shake - dt);
    const p = this.p, c = this.c, E = this.env;
    if (!p.hidden) {
      p.stumble = Math.max(0, p.stumble - dt);
      const d = this.doorAhead();
      const v = p.stumble > 0 ? 0.6 : RUN;
      const wall = d ? d.x - 0.9 : this.length;
      p.x = Math.min(wall, p.x + v * dt);
      p.stop = d && p.x >= wall - 0.01;
      if (p.y > 0 || p.vy) { p.vy -= 22 * dt; p.y = Math.max(0, p.y + p.vy * dt); if (p.y === 0) p.vy = 0; }
      for (const t of this.things) {
        if (t.type !== 'toy' || t.hit) continue;
        if (Math.abs(t.x - p.x) < 0.45) { if (p.y < 0.55) { t.hit = true; p.stumble = 0.8; E.sfx.wrong(); this.shake = 0.3; E.toast('💥 Oops! Jump over the toys!'); } else if (!t.jumped) { t.jumped = true; this.stats.jumps++; E.sfx.pickup(); } }
      }
      const l = this.lockerHere(); if (l && !l.saved) { l.saved = true; this.check = { px: l.x, cx: Math.min(c.x, l.x - 7) }; E.toast('🚩 Checkpoint!', 1200); }
      if (p.x >= this.endX) { this.win(); return; }
    }
    c.t += dt;
    const quiet = getTier() === 0;
    if (c.state === 'search') {
      c.search -= dt;
      if (c.x < p.x + 1.5) c.x += 1.4 * dt; // walks up to your locker, listening…
      if (c.search <= 0) { c.state = 'back'; c.back = 1.6; if (E.store.data.settings.voices) this.voice(quiet ? pick(['Where did you go? You are a good hider!', 'Hmm... I lost you!']) : pick(['Where did you go?', 'Hmm... I lost them.', 'You are a good hider...'])); }
    } else if (c.state === 'back') {
      c.back -= dt; c.x -= 6 * dt;
      if (c.back <= 0) { c.state = 'chase'; c.x = Math.min(c.x, p.x - 8); c.rushT = 10.5 - this.pw.eyes + Math.random() * 4; }
    } else {
      c.rushT -= dt;
      if (c.rushT <= 0 && c.rush <= 0 && this.gap() < 13) {
        c.rush = 2.4; c.rushT = 10.5 - this.pw.eyes + Math.random() * 5; E.sfx.heartbeat(0.7);
        if (E.store.data.settings.voices) this.voice(quiet ? pick(['Here I come! Hee hee!', 'Ready or not!', 'Tag time!']) : pick(['Here I come!', 'Ready or not!', 'You cannot hide from me!']));
      }
      const sp = (c.rush > 0 ? RUSH : this.gap() > 11 ? CHASE * 1.6 : CHASE) * this.sp;
      c.rush = Math.max(0, c.rush - dt);
      if (p.hidden) { c.x += sp * 0.6 * dt; if (Math.abs(c.x - p.x) < 2) { c.state = 'search'; c.search = 1.2 + 0.4 * this.pw.ears; c.rush = 0; } }
      else c.x += sp * dt;
      if (!p.hidden && this.gap() < CATCH) { this.caught(); return; }
    }
    this.helpers.forEach((h, i) => { const tx = p.x - 1.2 - i * 0.9; if (h.zip) h.zip = Math.max(0, h.zip - dt); h.x += (tx - h.x) * Math.min(1, dt * 5); });
  }

  async caught() {
    const E = this.env; this.busy = true; this.stats.caught++;
    this.hearts--; E.onHearts(this.hearts);
    await E.onCaught(this.bot ? { bot: this.bot } : this.c.id, this.hearts <= 0);
    if (this.hearts <= 0) { this.hearts = 3; E.onHearts(3); }
    this.p.x = this.check.px; this.p.y = 0; this.p.vy = 0; this.p.hidden = null; this.p.stumble = 0;
    this.c.x = this.check.px - 8; this.c.state = 'chase'; this.c.rush = 0; this.c.rushT = 8;
    for (const t of this.things) if (t.type === 'toy' && t.x > this.p.x) { t.hit = false; t.jumped = false; }
    this.busy = false;
  }

  win() { this.done = true; this.env.sfx.win(); this.env.onDone(this.stats); }

  // ------------------------------------------------ drawing (3D corridor, painter's order: far to near)
  draw(ctx, W, H, kid) {
    const t = this.t, p = this.p, c = this.c, tier = getTier();
    const want = clamp(this.gap() + 1.1, 3.0, 6.0);
    this.cam += (want - this.cam) * 0.04;
    const camZ = p.x - this.cam + (this.shake ? Math.sin(t * 80) * 0.03 : 0);
    const F = Math.min(H * 0.95, W * 0.78);
    const cx = W / 2, cy = H * 0.47;
    const P = (X, Y, z) => { const dz = Math.max(0.05, z - camZ); return [cx + X / dz * F, cy - (Y - CAMH) / dz * F]; };
    const poly = (pts, fill) => { ctx.fillStyle = fill; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); };
    const fogK = z => clamp((z - camZ) / (tier === 0 ? 40 : tier === 1 ? 20 : 14), 0, 1);
    const shadeC = (rgb, z, k = 1) => { const f = 1 - fogK(z) * (tier === 0 ? 0.45 : 0.95); return `rgb(${rgb[0] * f * k | 0},${rgb[1] * f * k | 0},${rgb[2] * f * k | 0})`; };
    const COL = [
      { wallA: [255, 214, 160], wallB: [255, 228, 190], floorA: [255, 244, 220], floorB: [255, 154, 194], ceil: [255, 248, 234], band: [255, 122, 184] },
      { wallA: [70, 56, 92], wallB: [60, 48, 80], floorA: [228, 222, 210], floorB: [40, 36, 48], ceil: [24, 20, 32], band: [233, 226, 212] },
      { wallA: [52, 40, 56], wallB: [44, 34, 48], floorA: [150, 145, 135], floorB: [26, 22, 30], ceil: [14, 12, 18], band: [140, 132, 120] },
    ][tier];

    ctx.fillStyle = tier === 0 ? '#e8d8c0' : '#05040a'; ctx.fillRect(0, 0, W, H);
    // how far we can see: up to the first closed door
    const block = this.things.find(th => th.type === 'door' && th.lift < 0.95 && th.x > camZ + 0.3);
    const zFar = Math.min(camZ + 36, block ? block.x : this.endX + 2.4);
    const zNear = camZ + 0.25;
    for (let z = Math.floor(zFar); z >= Math.floor(zNear); z--) {
      const z0 = Math.max(z, zNear), z1 = Math.min(z + 1, zFar); if (z1 <= z0) continue;
      const k = (z % 2 + 2) % 2;
      // floor (checker in 2 columns per side)
      for (let i = -2; i < 2; i++) {
        const xa = i * HALF / 2, xb = (i + 1) * HALF / 2, on = (i + 2 + k) % 2;
        poly([P(xa, 0, z0), P(xb, 0, z0), P(xb, 0, z1), P(xa, 0, z1)], shadeC(on ? COL.floorA : COL.floorB, z0));
      }
      poly([P(-HALF, CEIL, z0), P(HALF, CEIL, z0), P(HALF, CEIL, z1), P(-HALF, CEIL, z1)], shadeC(COL.ceil, z0));
      const wc = k ? COL.wallA : COL.wallB;
      poly([P(-HALF, 0, z0), P(-HALF, CEIL, z0), P(-HALF, CEIL, z1), P(-HALF, 0, z1)], shadeC(wc, z0, 0.88));
      poly([P(HALF, 0, z0), P(HALF, CEIL, z0), P(HALF, CEIL, z1), P(HALF, 0, z1)], shadeC(wc, z0, 0.8));
      // checker band + baseboard on both walls
      for (const s of [-1, 1]) {
        poly([P(s * HALF, 0.78, z0), P(s * HALF, 0.9, z0), P(s * HALF, 0.9, z1), P(s * HALF, 0.78, z1)], shadeC(k ? COL.band : [20, 16, 24], z0));
        poly([P(s * HALF, 0, z0), P(s * HALF, 0.14, z0), P(s * HALF, 0.14, z1), P(s * HALF, 0, z1)], shadeC([30, 22, 26], z0));
      }
      // ceiling lights every 4 units (flicker in spooky tiers)
      if (z % 4 === 0) {
        const on = tier === 0 || Math.sin(z * 7.3 + t * (z % 3 ? 2 : 13)) > (tier === 2 ? -0.2 : -0.6);
        const L = [P(-0.35, CEIL - 0.01, z + 0.2), P(0.35, CEIL - 0.01, z + 0.2), P(0.35, CEIL - 0.01, z + 0.7), P(-0.35, CEIL - 0.01, z + 0.7)];
        poly(L, on ? `rgba(255,243,196,${1 - fogK(z) * 0.7})` : '#333');
        if (on && tier > 0) { const [lx, ly] = P(0, CEIL, z + 0.45), [, fy] = P(0, 0, z + 0.45); const g = ctx.createRadialGradient(lx, ly, 2, lx, fy, (fy - ly) * 0.9); g.addColorStop(0, `rgba(255,240,190,${0.18 * (1 - fogK(z))})`); g.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = g; ctx.fillRect(lx - (fy - ly), ly, (fy - ly) * 2, fy - ly); }
      }
      // posters
      if (z % 6 === 2) { const s = z % 12 === 2 ? -1 : 1; const col = ['#d94848', '#4878d9', '#e6b43a'][Math.abs(z) % 3]; poly([P(s * HALF * 0.99, 1.2, z + 0.2), P(s * HALF * 0.99, 1.8, z + 0.2), P(s * HALF * 0.99, 1.8, z + 0.8), P(s * HALF * 0.99, 1.2, z + 0.8)], shadeC(hexRgb(col), z)); }
    }
    // the end: exit or the closed door's back wall
    if (!block) {
      const ez = this.endX + 2.4;
      poly([P(-HALF, 0, ez), P(-HALF, CEIL, ez), P(HALF, CEIL, ez), P(HALF, 0, ez)], shadeC(COL.wallB, ez));
      poly([P(-0.6, 0, ez - 0.01), P(-0.6, 1.8, ez - 0.01), P(0.6, 1.8, ez - 0.01), P(0.6, 0, ez - 0.01)], '#2f9e5a');
      const [sx, sy] = P(0, 2.0, ez - 0.02), sz = F / Math.max(0.5, ez - camZ) * 0.22;
      ctx.save(); ctx.shadowColor = '#3f3'; ctx.shadowBlur = 16; ctx.fillStyle = '#7f7'; ctx.font = `bold ${Math.max(10, sz)}px system-ui`; ctx.textAlign = 'center'; ctx.fillText('EXIT', sx, sy); ctx.restore();
    }

    // things, far to near
    const items = [];
    for (const th of this.things) if (th.x > zNear && th.x <= zFar + 0.01) items.push({ z: th.x, th });
    if (c.x > zNear + 0.15 && c.x < zFar) items.push({ z: c.x, chaser: true });
    for (const h of this.helpers) { if (h.used && !h.zip) continue; const hx = h.used ? h.x - (1 - h.zip) * 4 : h.x; if (hx > zNear + 0.2 && hx < zFar) items.push({ z: hx, helper: h }); }
    if (!p.hidden) items.push({ z: p.x, kidP: true });
    items.sort((a, b) => b.z - a.z);
    for (const it of items) {
      const z = it.z, th = it.th;
      if (th && th.type === 'locker') {
        const s = th.side, x = s * HALF * 0.985, near = this.lockerHere() === th && this.near === 'locker';
        const col = th === p.hidden ? [31, 79, 122] : tier === 0 ? [79, 182, 255] : [47, 111, 168];
        poly([P(x, 0, z - 0.42), P(x, 1.95, z - 0.42), P(x, 1.95, z + 0.42), P(x, 0, z + 0.42)], shadeC(col, z));
        for (let v = 0; v < 4; v++) poly([P(x, 1.6 - v * 0.12, z - 0.25), P(x, 1.65 - v * 0.12, z - 0.25), P(x, 1.65 - v * 0.12, z + 0.25), P(x, 1.6 - v * 0.12, z + 0.25)], shadeC([23, 58, 92], z));
        if (near || th === p.hidden) { ctx.save(); ctx.strokeStyle = th === p.hidden ? '#7f7' : '#ffd84a'; ctx.lineWidth = 4; ctx.setLineDash([10, 7]); const q = [P(x, 0, z - 0.46), P(x, 2.0, z - 0.46), P(x, 2.0, z + 0.46), P(x, 0, z + 0.46)]; ctx.beginPath(); q.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); ctx.stroke(); ctx.restore(); }
        if (th.saved) { const [fx, fy] = P(x - s * 0.02, 2.15, z); ctx.fillStyle = '#6be675'; ctx.font = `${Math.max(10, F / (z - camZ) * 0.2)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('🚩', fx, fy); }
      } else if (th && th.type === 'toy') {
        const [bx, by] = P(0.3, 0, z), sz = F / Math.max(0.3, z - camZ) * 0.4;
        ctx.save(); ctx.translate(bx, by);
        if (th.v === 0) { ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.moveTo(-sz * 0.4, 0); ctx.lineTo(0, -sz); ctx.lineTo(sz * 0.4, 0); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(-sz * 0.22, -sz * 0.5, sz * 0.44, sz * 0.1); }
        else if (th.v === 1) { ctx.fillStyle = '#4fb6ff'; ctx.fillRect(-sz * 0.45, -sz * 0.8, sz * 0.9, sz * 0.8); ctx.fillStyle = '#ffd84a'; ctx.font = `700 ${sz * 0.55}px Andika`; ctx.textAlign = 'center'; ctx.fillText('A', 0, -sz * 0.2); }
        else { ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(0, -sz * 0.42, sz * 0.42, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-sz * 0.12, -sz * 0.55, sz * 0.1, 0, 7); ctx.fill(); }
        ctx.restore();
      } else if (th && th.type === 'door') {
        th.lift += ((th.open ? 1 : 0) - th.lift) * 0.12;
        const dy = th.lift * 2.0;
        // frame
        poly([P(-HALF, 0, z), P(-HALF, CEIL, z), P(-0.65, CEIL, z), P(-0.65, 0, z)], shadeC(COL.wallA, z, 0.9));
        poly([P(0.65, 0, z), P(0.65, CEIL, z), P(HALF, CEIL, z), P(HALF, 0, z)], shadeC(COL.wallA, z, 0.9));
        poly([P(-0.65, 2.0, z), P(-0.65, CEIL, z), P(0.65, CEIL, z), P(0.65, 2.0, z)], shadeC(COL.wallA, z, 0.9));
        if (th.lift < 0.98) {
          ctx.save(); const clip = [P(-0.65, 0, z), P(-0.65, 2.0, z), P(0.65, 2.0, z), P(0.65, 0, z)]; ctx.beginPath(); clip.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.clip();
          poly([P(-0.62, dy, z), P(-0.62, 2.0 + dy, z), P(0.62, 2.0 + dy, z), P(0.62, dy, z)], shadeC(th.kind === 'read' ? (tier === 0 ? [176, 122, 68] : [107, 68, 35]) : [74, 80, 88], z));
          if (th.kind === 'math') for (let b = 0; b < 7; b++) { const xb = -0.55 + b * 0.18; poly([P(xb, dy, z), P(xb, 2 + dy, z), P(xb + 0.04, 2 + dy, z), P(xb + 0.04, dy, z)], shadeC([154, 163, 173], z)); }
          if (!th.open) {
            const [sx, sy] = P(0, 1.15 + dy, z), r = F / Math.max(0.3, z - camZ) * 0.2;
            ctx.save(); ctx.shadowColor = th.kind === 'read' ? '#7fc8ff' : '#ffb347'; ctx.shadowBlur = 14;
            ctx.fillStyle = th.kind === 'read' ? '#7fc8ff' : '#ffb347'; ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.fill(); ctx.restore();
            ctx.fillStyle = '#111'; ctx.font = `bold ${Math.max(9, r * 0.75)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(th.kind === 'read' ? 'ABC' : '123', sx, sy + 1); ctx.textBaseline = 'alphabetic';
          }
          ctx.restore();
        }
      } else if (it.chaser) {
        this.drawChaser(ctx, P, F, z, camZ, tier);
      } else if (it.helper) {
        const img = Art.bot(it.helper, 0, { mood: 'friendly', frame: Math.floor(t * 6) % 2 });
        if (img) { const [bx, by] = P(0.7, 0, z), hh = F / (z - camZ) * 0.85, ww = hh * img.width / img.height; ctx.drawImage(img, bx - ww / 2, by - hh, ww, hh); }
      } else if (it.kidP) {
        this.drawKid(ctx, P, F, z, camZ, kid);
      }
    }

    // chaser off-screen behind you: eyes at the bottom edge + how many steps behind
    if (c.x <= zNear + 0.15) {
      const col = c.rush > 0 ? '#ff3030' : tier === 2 ? '#ff3b30' : tier === 1 ? '#ffe680' : '#7ff', ey = H - 34;
      if (tier > 0) { ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 14; ctx.fillStyle = col; for (const dx of [-14, 14]) { ctx.beginPath(); ctx.arc(W / 2 + dx, ey, 6, 0, 7); ctx.fill(); } ctx.restore(); }
      const ty = Math.min(H - 70, H * 0.88) - 16; // just above the progress bar
      ctx.fillStyle = c.rush > 0 ? '#ff4040' : tier === 0 ? '#7a3a9a' : '#ffd84a'; ctx.font = `700 ${Math.max(16, H * 0.03)}px Andika`; ctx.textAlign = 'center'; ctx.fillText(`👣 ${this.name}: ${Math.round(this.gap())} steps behind`, W / 2, ty);
    }
    // vignette + rush tint + helper flash
    if (tier > 0) { const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${tier === 2 ? 0.75 : 0.5})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); }
    if (c.rush > 0 && tier > 0) { ctx.fillStyle = `rgba(160,0,0,${0.15 + 0.1 * Math.sin(t * 12)})`; ctx.fillRect(0, 0, W, H); }
    if (this.flash) { ctx.fillStyle = `rgba(160,255,230,${this.flash})`; ctx.fillRect(0, 0, W, H); }
    if (p.hidden) { ctx.fillStyle = 'rgba(14,12,18,0.9)'; for (let y = 0; y < H; y += 46) ctx.fillRect(0, y, W, 26); ctx.fillStyle = '#ffd84a'; ctx.font = '700 22px Andika'; ctx.textAlign = 'center'; ctx.fillText('🤫 Shhh… hiding', W / 2, H * 0.5); }
    // progress bar: you (blue) vs chaser (red) vs exit
    const bw = Math.min(W * 0.6, 420), bx = (W - bw) / 2, by = Math.min(H - 70, H * 0.88);
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(bx, by, bw, 10);
    ctx.fillStyle = '#6be675'; ctx.fillRect(bx, by, bw * clamp(p.x / this.endX, 0, 1), 10);
    ctx.fillStyle = '#ff6b6b'; ctx.beginPath(); ctx.arc(bx + bw * clamp(c.x / this.endX, 0, 1), by + 5, 7, 0, 7); ctx.fill();
    ctx.fillStyle = '#4fb6ff'; ctx.beginPath(); ctx.arc(bx + bw * clamp(p.x / this.endX, 0, 1), by + 5, 7, 0, 7); ctx.fill();
  }

  drawChaser(ctx, P, F, z, camZ, tier) {
    const c = this.c, frame = Math.floor(c.t * 5) % 2;
    const img = this.bot ? Art.bot(this.bot, tier, { mood: 'chase', frame }) || Art.bot(this.bot, tier, { mood: 'chase' }) : Art.char(c.id, tier, frame) || Art.char(c.id, tier, 0);
    if (!img) return;
    const dz = z - camZ, hh = F / dz * (this.bot ? 1.25 : 1.6), ww = hh * img.width / img.height;
    const [bx, by] = P(-0.35, 0, z);
    const bob = Math.abs(Math.sin(c.t * 8)) * hh * 0.02;
    ctx.save();
    if (c.rush > 0 && tier > 0) { ctx.shadowColor = '#f00'; ctx.shadowBlur = 30; }
    ctx.drawImage(img, bx - ww / 2, by - hh - bob, ww, hh);
    ctx.restore();
    if (tier > 0) { // glowing eyes
      const kind = this.bot ? this.bot.kind : (CAST[c.id] || CAST.rusty).kind, col = tier === 2 ? '#ff3b30' : '#ffe680';
      ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.fillStyle = col; ctx.globalAlpha = 0.85;
      eyePoints(kind).forEach(([ex, ey]) => { ctx.beginPath(); ctx.arc(bx - ww / 2 + (ex + 10) / (ART_W + 20) * ww, by - hh - bob + (ey + 13) / (ART_H + 20) * hh, Math.max(2, hh * 0.01), 0, 7); ctx.fill(); });
      ctx.restore();
    }
  }

  drawKid(ctx, P, F, z, camZ, kid) {
    const p = this.p, t = this.t, dz = z - camZ, s = F / dz;
    const [bx, by] = P(0.1, p.y, z);
    const run = !p.stop && p.stumble <= 0 && !this.busy, leg = run ? Math.sin(t * 16) * s * 0.08 : 0;
    const col = (kid && kid.color) || '#3a6ea5';
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.3)'; const [shx, shy] = P(0.1, 0, z); ctx.beginPath(); ctx.ellipse(shx, shy, s * 0.22, s * 0.05, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#2b2350'; ctx.fillRect(bx - s * 0.13 + leg, by - s * 0.42, s * 0.1, s * 0.42); ctx.fillRect(bx + s * 0.03 - leg, by - s * 0.42, s * 0.1, s * 0.42);
    ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx - s * 0.2, by - s * 0.95, s * 0.4, s * 0.58, s * 0.12) : ctx.rect(bx - s * 0.2, by - s * 0.95, s * 0.4, s * 0.58); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = s * 0.08; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx - s * 0.18, by - s * 0.85); ctx.lineTo(bx - s * 0.26 - leg * 0.5, by - s * 0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + s * 0.18, by - s * 0.85); ctx.lineTo(bx + s * 0.27 + leg * 0.5, by - s * 0.6); ctx.stroke();
    ctx.fillStyle = '#4a2f1d'; ctx.beginPath(); ctx.arc(bx, by - s * 1.08, s * 0.15, 0, 7); ctx.fill();
    if (p.stumble > 0) { ctx.fillStyle = '#ffd84a'; ctx.font = `700 ${s * 0.25}px Andika`; ctx.textAlign = 'center'; ctx.fillText('★ ★', bx, by - s * 1.3); }
    ctx.restore();
  }
  coach() { const n = this.near; if (n === 'door') return 'They need to tap OPEN, then read the word / solve the problem out loud. Let them try first.'; if (this.c.rush > 0) return `${this.name} is rushing — remind them to HIDE in a locker!`; return 'Watch for toys on the floor (JUMP) and lockers (HIDE).'; }
}

function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }

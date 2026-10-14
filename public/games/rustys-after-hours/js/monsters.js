// Animatronic brains: wander, hear/see you, hunt, search, get zapped by the flashlight.
import { CHARACTERS } from './characters.js';
import { findPath, lineOfSight, passableForMonster } from './world.js';

export class Monster {
  constructor(id, x, y) {
    this.id = id; this.c = CHARACTERS[id];
    this.x = x; this.y = y; this.state = 'wander'; this.path = []; this.repath = 0;
    this.glare = 0; this.goneUntil = 0; this.vanishT = 0; this.stepT = 0; this.talkT = 6 + Math.random() * 8;
    this.moving = false; this.lastSeen = null; this.lostT = 0; this.alpha = 1; this.t = Math.random() * 10;
  }

  get active() { return this.state === 'wander' || this.state === 'hunt' || this.state === 'search'; }

  vanish(time) { this.state = 'vanish'; this.vanishT = 0.7; this.goneUntil = time + 14 + Math.random() * 10; this.path = []; this.glare = 0; }

  respawn(g) {
    const p = g.player; const w = g.world;
    const rooms = [...w.rooms].sort((a, b) => Math.hypot(b.x0 + 4 - p.x, b.y0 + 3 - p.y) - Math.hypot(a.x0 + 4 - p.x, a.y0 + 3 - p.y));
    const r = rooms[Math.floor(Math.random() * Math.min(2, rooms.length))];
    this.x = r.x0 + 4.5; this.y = r.y0 + 3.5; this.state = 'wander'; this.path = []; this.alpha = 0;
  }

  update(dt, g) {
    this.t += dt;
    if (this.alpha < 1) this.alpha = Math.min(1, this.alpha + dt);
    if (this.state === 'vanish') { this.vanishT -= dt; if (this.vanishT <= 0) this.state = 'gone'; return; }
    if (this.state === 'gone') { if (g.time >= this.goneUntil) this.respawn(g); return; }

    const p = g.player, w = g.world;
    const d = Math.hypot(p.x - this.x, p.y - this.y);
    const graceOver = g.time > g.graceUntil;
    let sees = false;
    if (graceOver && !p.hidden) {
      const visionR = g.lightOn ? 8 : 5;
      if ((d < visionR && lineOfSight(w, this.x, this.y, p.x, p.y)) || d < 2.2) sees = true;
    }

    if (sees) {
      if (this.state !== 'hunt') { this.state = 'hunt'; this.repath = 0; g.onMonsterSpots && g.onMonsterSpots(this); }
      this.lastSeen = { x: p.x, y: p.y }; this.lostT = 0;
    } else if (this.state === 'hunt') {
      this.lostT += dt;
      if (p.hidden || this.lostT > 2.5) { this.state = 'search'; this.path = this.lastSeen ? (findPath(w, this.x, this.y, this.lastSeen.x, this.lastSeen.y) || []) : []; g.onMonsterLost && g.onMonsterLost(this); }
    }

    // choose where to go
    this.repath -= dt;
    if (this.state === 'hunt' && this.repath <= 0) {
      this.repath = 0.4;
      const path = findPath(w, this.x, this.y, p.x, p.y);
      this.path = path ? [...path, [p.x, p.y]] : [];   // last step: walk right up to him
    } else if (this.state === 'search' && !this.path.length) {
      this.state = 'wander';
    } else if (this.state === 'wander' && !this.path.length) {
      const r = w.rooms[Math.floor(Math.random() * w.rooms.length)];
      const tx = r.x0 + 1 + Math.floor(Math.random() * 6), ty = r.y0 + 2 + Math.floor(Math.random() * 2);
      if (passableForMonster(w, tx, ty)) this.path = findPath(w, this.x, this.y, tx + 0.5, ty + 0.5) || [];
    }

    // move
    const base = this.state === 'hunt' ? g.huntSpeed : this.state === 'search' ? g.huntSpeed * 0.8 : g.wanderSpeed;
    let step = base * dt; this.moving = false;
    while (step > 0 && this.path.length) {
      const [tx, ty] = this.path[0];
      const dx = tx - this.x, dy = ty - this.y, dd = Math.hypot(dx, dy);
      if (dd <= step) { this.x = tx; this.y = ty; step -= dd; this.path.shift(); }
      else { this.x += dx / dd * step; this.y += dy / dd * step; step = 0; }
      this.moving = true;
    }
  }
}

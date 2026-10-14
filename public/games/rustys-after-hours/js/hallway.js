// Stage 3 of the level-up cycle: HALLWAY RUN. Side view. You run down a long, flickering hallway while an animatronic
// chases from behind. Doors ahead only open when you read the word or solve the problem (the same TALK pop-up as the
// night doors). Jump over toys on the floor. When the animatronic RUSHES (red eyes, it speeds up), hide in a locker.
// Lockers are checkpoints. 3 hearts: get caught and you lose one and go back to the last locker.
// Your built robots run behind you: tap 🤖 and one of them pushes the chaser far back (once each per run).
import { drawCharacter, CHARACTERS } from './characters.js';
import { drawBot } from './bots.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = a => a[Math.floor(Math.random() * a.length)];
const RUN = 3.8, CHASE = 3.25, RUSH = 6.2, CATCH = 0.9;

export class Hallway {
  /** env: { store, tutor, challenge, say, toast, sfx, chaser, bots, kid, onLevelUp(), onCaught(m, last) → Promise, onDone(stats), onHearts(n) } */
  constructor(env) {
    this.env = env; this.t = 0; this.hearts = 3; this.done = false; this.busy = false;
    const doors = env.doors || 5, focus = env.store.data.settings.focus || 'both';
    const kindFor = i => focus === 'reading' ? (i === 2 ? 'math' : 'read') : focus === 'math' ? (i === 2 ? 'read' : 'math') : (i % 2 ? 'math' : 'read');
    this.things = []; let x = 10;
    for (let i = 0; i < doors; i++) {
      this.things.push({ type: 'locker', x: x }); x += 3.5;
      if (i > 0 || doors > 3) { this.things.push({ type: 'toy', x: x, v: i % 3 }); x += 4.5; }
      this.things.push({ type: 'door', x: x, kind: kindFor(i), open: false, item: null, lift: 0 }); x += 6;
    }
    this.things.push({ type: 'locker', x: x }); x += 5;
    this.endX = x; this.length = x + 4;
    this.p = { x: 2, y: 0, vy: 0, hidden: null, stumble: 0, stop: false };
    this.c = { id: env.chaser || 'rusty', x: -7, state: 'chase', rushT: 7 + Math.random() * 4, rush: 0, search: 0, t: 0, back: 0 };
    this.check = { px: 2, cx: -7 };
    this.helpers = (env.bots || []).slice(-3).map((b, i) => ({ ...b, x: this.p.x - 1.2 - i * 0.9, used: false }));
    this.stats = { doors: 0, read: 0, math: 0, jumps: 0, hides: 0, caught: 0 };
    this.flash = 0; this.shake = 0;
    this.sp = { slow: 0.8, normal: 1, fast: 1.12 }[env.store.data.settings.monsterSpeed] || 1; // Grown-ups → Animatronic speed
  }

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
    if (this.c.rush > 0) return `🏃 ${CHARACTERS[this.c.id].name.split(' ')[0]} is RUSHING! Hide in a locker!`;
    if (gap < 3) return 'Run! Jump over toys!';
    return `Run to the door! ${this.doorsLeft()} door${this.doorsLeft() === 1 ? '' : 's'} to go.`;
  }
  doorsLeft() { return this.things.filter(t => t.type === 'door' && !t.open).length; }
  doorAhead() { return this.things.find(t => t.type === 'door' && !t.open && t.x >= this.p.x - 0.2); }
  lockerHere() { return this.things.find(t => t.type === 'locker' && Math.abs(t.x - this.p.x) < 0.9); }
  gap() { return this.p.x - this.c.x; }

  start() {
    const name = CHARACTERS[this.c.id].name;
    this.env.say(`Hallway run! ${name} is chasing you! Run to the doors and read or solve them to open them. Tap JUMP to hop over toys. If ${name.split(' ')[0]} rushes, hide in a locker!`);
  }

  // ------------------------------------------------ actions (buttons)
  jump() { const p = this.p; if (this.done || this.busy || p.hidden || p.y > 0.01) return; p.vy = 7.2; this.env.sfx.click(); }
  async action() {
    if (this.done || this.busy) return;
    const n = this.near, p = this.p;
    if (n === 'hidden') { p.hidden = null; this.env.sfx.click(); return; }
    if (n === 'locker') { const l = this.lockerHere(); p.hidden = l; p.x = l.x; this.stats.hides++; this.env.sfx.door(); if (this.gap() < 6 && this.c.state !== 'search') { this.c.state = 'search'; this.c.search = 3; } return; }
    if (n === 'door') return this.openDoor(this.doorAhead());
  }
  help() {
    const h = this.helpers.find(h => !h.used); if (!h || this.done || this.busy) return false;
    h.used = true; h.zip = 1; this.c.x = Math.min(this.c.x, this.p.x - 11); this.c.rush = 0; this.c.state = 'chase'; this.c.rushT = 8;
    this.flash = 0.6; this.env.sfx.vanish(0); this.env.say(`${h.name} to the rescue! ${h.name} pushed the animatronic way back!`);
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
    // player: runs by itself; stops at a closed door; stumbles when hitting a toy
    if (!p.hidden) {
      p.stumble = Math.max(0, p.stumble - dt);
      const d = this.doorAhead();
      let v = p.stumble > 0 ? 0.6 : RUN;
      const wall = d ? d.x - 0.9 : this.length;
      p.x = Math.min(wall, p.x + v * dt);
      p.stop = d && p.x >= wall - 0.01;
      // jump physics
      if (p.y > 0 || p.vy) { p.vy -= 22 * dt; p.y = Math.max(0, p.y + p.vy * dt); if (p.y === 0) p.vy = 0; }
      // toys
      for (const t of this.things) {
        if (t.type !== 'toy' || t.hit) continue;
        if (Math.abs(t.x - p.x) < 0.45) { if (p.y < 0.55) { t.hit = true; p.stumble = 0.8; E.sfx.wrong(); this.shake = 0.3; E.toast('💥 Oops! Jump over the toys!'); } else if (!t.jumped) { t.jumped = true; this.stats.jumps++; E.sfx.pickup(); } }
      }
      // checkpoints
      const l = this.lockerHere(); if (l && !l.saved) { l.saved = true; this.check = { px: l.x, cx: Math.min(c.x, l.x - 7) }; E.toast('🚩 Checkpoint!', 1200); }
      if (p.x >= this.endX) { this.win(); return; }
    }
    // chaser
    c.t += dt;
    if (c.state === 'search') {
      c.search -= dt;
      if (c.x < p.x + 1.5) c.x += 1.4 * dt; // walks past the locker, looking around
      if (c.search <= 0) { c.state = 'back'; c.back = 1.6; if (E.store.data.settings.voices) E.voice(pick(['Where did you go?', 'Hmm... I lost them.', 'You are a good hider...']), c.id); }
    } else if (c.state === 'back') {
      c.back -= dt; c.x -= 6 * dt;
      if (c.back <= 0) { c.state = 'chase'; c.x = Math.min(c.x, p.x - 8); c.rushT = 8 + Math.random() * 5; }
    } else {
      c.rushT -= dt;
      if (c.rushT <= 0 && c.rush <= 0 && this.gap() < 13) { c.rush = 2.4; c.rushT = 9 + Math.random() * 6; E.sfx.heartbeat(0.7); if (E.store.data.settings.voices) E.voice(pick(['Here I come!', 'Ready or not!', 'You cannot hide from me!']), c.id); }
      const sp = (c.rush > 0 ? RUSH : this.gap() > 11 ? CHASE * 1.6 : CHASE) * this.sp; // catches up a little if far behind
      c.rush = Math.max(0, c.rush - dt);
      if (p.hidden) { c.x += sp * 0.6 * dt; if (Math.abs(c.x - p.x) < 2) { c.state = 'search'; c.search = 2.5; c.rush = 0; } }
      else c.x += sp * dt;
      if (!p.hidden && this.gap() < CATCH) { this.caught(); return; }
    }
    // helpers trot behind you
    this.helpers.forEach((h, i) => { const tx = p.x - 1.2 - i * 0.9; if (h.zip) { h.zip = Math.max(0, h.zip - dt); } h.x += (tx - h.x) * Math.min(1, dt * 5); });
  }

  async caught() {
    const E = this.env; this.busy = true; this.stats.caught++;
    this.hearts--; E.onHearts(this.hearts);
    await E.onCaught(this.c.id, this.hearts <= 0);
    // back to the last checkpoint (out of hearts: full hearts again there)
    if (this.hearts <= 0) { this.hearts = 3; E.onHearts(3); }
    this.p.x = this.check.px; this.p.y = 0; this.p.vy = 0; this.p.hidden = null; this.p.stumble = 0;
    this.c.x = this.check.px - 8; this.c.state = 'chase'; this.c.rush = 0; this.c.rushT = 8;
    for (const t of this.things) if (t.type === 'toy' && t.x > this.p.x) { t.hit = false; t.jumped = false; }
    this.busy = false;
  }

  win() {
    this.done = true; this.env.sfx.win();
    this.env.onDone(this.stats);
  }

  // ------------------------------------------------ drawing
  draw(ctx, W, H, kid) {
    const t = this.t, p = this.p, c = this.c;
    const portrait = H > W;
    const U = portrait ? Math.max(30, W / 11) : Math.max(34, Math.min(W / 13, H / 6.2)); // one hallway unit in px
    const floorY = portrait ? H * 0.6 : H * 0.8;
    // keep the chaser on screen when it's close: you run on the right, it comes from the left
    const pScreen = clamp((this.gap() + 1.3) * U, W * 0.4, W * 0.72);
    this.camPS = (this.camPS || pScreen) + (pScreen - (this.camPS || pScreen)) * 0.05;
    const camX = p.x - this.camPS / U;
    const X = x => (x - camX) * U + (this.shake ? Math.sin(t * 80) * 4 : 0);
    // wall + ceiling
    ctx.fillStyle = '#16111f'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2a2236'; ctx.fillRect(0, 0, W, floorY);
    const top = ctx.createLinearGradient(0, 0, 0, floorY - U * 4.2); top.addColorStop(0, '#0d0914'); top.addColorStop(1, '#221b2d');
    ctx.fillStyle = top; ctx.fillRect(0, 0, W, Math.max(0, floorY - U * 4.2));
    ctx.fillStyle = '#3a2d4c'; ctx.fillRect(0, floorY - U * 1.1, W, U * 0.18); // chair rail
    // checker floor
    for (let i = Math.floor(camX) - 1; i < camX + W / U + 2; i++) { ctx.fillStyle = i % 2 ? '#e4ded2' : '#1d1b22'; ctx.fillRect(X(i), floorY, U + 1, H - floorY); }
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, floorY, W, 8);
    // ceiling lights (flicker)
    for (let i = Math.floor(camX / 4) * 4; i < camX + W / U + 4; i += 4) {
      const on = Math.sin(i * 7.3 + t * (i % 3 ? 2 : 13)) > -0.6;
      const lx = X(i), ly = floorY - U * 4.1;
      ctx.fillStyle = on ? '#fff3c4' : '#444'; ctx.fillRect(lx - U * 0.4, ly, U * 0.8, U * 0.12);
      if (on) { const g = ctx.createRadialGradient(lx, ly, 2, lx, floorY, U * 3); g.addColorStop(0, 'rgba(255,240,190,.22)'); g.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = g; ctx.fillRect(lx - U * 3, ly, U * 6, floorY - ly + U); }
    }
    // posters
    for (let i = Math.floor(camX / 6) * 6 + 2; i < camX + W / U + 6; i += 6) { ctx.fillStyle = ['#d94848', '#4878d9', '#e6b43a'][Math.abs(i) % 3]; ctx.fillRect(X(i), floorY - U * 3.2, U * 0.9, U * 1.2); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(X(i) + U * 0.45, floorY - U * 2.5, U * 0.2, 0, 7); ctx.fill(); }
    // things
    for (const th of this.things) {
      const x = X(th.x); if (x < -U * 3 || x > W + U * 3) continue;
      if (th.type === 'locker') {
        ctx.fillStyle = th === p.hidden ? '#1f4f7a' : '#2f6fa8'; ctx.fillRect(x - U * 0.5, floorY - U * 2.6, U, U * 2.6);
        ctx.strokeStyle = '#173a5c'; ctx.lineWidth = 2; ctx.strokeRect(x - U * 0.5, floorY - U * 2.6, U, U * 2.6);
        ctx.fillStyle = '#173a5c'; for (let k = 0; k < 4; k++) ctx.fillRect(x - U * 0.3, floorY - U * 2.4 + k * U * 0.16, U * 0.6, U * 0.06);
        if (th.saved) { ctx.fillStyle = '#6be675'; ctx.fillRect(x + U * 0.5, floorY - U * 2.9, U * 0.06, U * 0.5); ctx.beginPath(); ctx.moveTo(x + U * 0.56, floorY - U * 2.9); ctx.lineTo(x + U * 0.9, floorY - U * 2.78); ctx.lineTo(x + U * 0.56, floorY - U * 2.66); ctx.fill(); }
        if (this.near === 'locker' && this.lockerHere() === th) { ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 4; ctx.strokeRect(x - U * 0.55, floorY - U * 2.65, U * 1.1, U * 2.7); }
      } else if (th.type === 'toy') {
        if (th.v === 0) { ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.moveTo(x - U * 0.3, floorY); ctx.lineTo(x, floorY - U * 0.8); ctx.lineTo(x + U * 0.3, floorY); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x - U * 0.18, floorY - U * 0.4, U * 0.36, U * 0.08); }
        else if (th.v === 1) { ctx.fillStyle = '#4fb6ff'; ctx.fillRect(x - U * 0.35, floorY - U * 0.6, U * 0.7, U * 0.6); ctx.fillStyle = '#ffd84a'; ctx.font = `700 ${U * 0.4}px Andika`; ctx.textAlign = 'center'; ctx.fillText('A', x, floorY - U * 0.15); }
        else { ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(x, floorY - U * 0.32, U * 0.32, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - U * 0.1, floorY - U * 0.42, U * 0.08, 0, 7); ctx.fill(); }
      } else if (th.type === 'door') {
        const lift = th.open ? 1 : 0; th.lift += (lift - th.lift) * 0.15;
        ctx.fillStyle = '#0d0a14'; ctx.fillRect(x - U * 0.6, floorY - U * 3.2, U * 1.2, U * 3.2);
        const dy = th.lift * U * 3;
        ctx.fillStyle = th.kind === 'read' ? '#6b4423' : '#3a3f46'; ctx.fillRect(x - U * 0.55, floorY - U * 3.1 - dy, U * 1.1, U * 3.1);
        if (th.kind === 'math') { ctx.fillStyle = '#9aa3ad'; for (let k = 0; k < 5; k++) ctx.fillRect(x - U * 0.5 + k * U * 0.24, floorY - U * 3.05 - dy, U * 0.06, U * 3); }
        if (!th.open) {
          ctx.fillStyle = th.kind === 'read' ? '#7fc8ff' : '#ffb347'; ctx.beginPath(); ctx.arc(x, floorY - U * 1.9, U * 0.42, 0, 7); ctx.fill();
          ctx.fillStyle = '#000'; ctx.font = `${Math.round(U * 0.46)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(th.kind === 'read' ? '📖' : '🔢', x, floorY - U * 1.88); ctx.textBaseline = 'alphabetic';
        }
      }
    }
    // exit
    const ex = X(this.endX + 1.2);
    ctx.fillStyle = '#123a1a'; ctx.fillRect(ex - U * 0.8, floorY - U * 3.2, U * 1.6, U * 3.2);
    ctx.save(); ctx.shadowColor = '#3f3'; ctx.shadowBlur = 14; ctx.fillStyle = '#7f7'; ctx.font = `bold ${U * 0.45}px system-ui`; ctx.textAlign = 'center'; ctx.fillText('EXIT', ex, floorY - U * 3.45); ctx.restore();
    // helpers
    for (const h of this.helpers) { if (h.used && !h.zip) continue; drawBot(ctx, h, X(h.used ? h.x - (1 - h.zip) * 4 : h.x), floorY - U * 0.62, U * 1.25, t, { walking: !p.stop && !p.hidden, glow: 0.35 }); }
    // chaser
    const cx = X(c.x);
    if (cx > -U * 2) {
      ctx.save();
      if (c.rush > 0) { ctx.shadowColor = '#f00'; ctx.shadowBlur = 25; }
      drawCharacter(ctx, c.id, cx, floorY - U * 1.05, U * 2.1, c.t, { walking: true });
      ctx.restore();
    } else { // off screen: glowing eyes peeking in from the left + how many steps behind
      const col = CHARACTERS[c.id].eye, ey = floorY - U * 2.6;
      ctx.save(); ctx.shadowColor = c.rush > 0 ? '#f00' : col; ctx.shadowBlur = 14; ctx.fillStyle = c.rush > 0 ? '#ff3030' : col;
      for (const dx of [14, 34]) { ctx.beginPath(); ctx.arc(dx, ey, U * 0.12, 0, 7); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = c.rush > 0 ? '#ff4040' : '#ffd84a'; ctx.font = `700 ${Math.max(16, U * 0.45)}px Andika`; ctx.textAlign = 'left'; ctx.fillText(`👣 ${Math.round(this.gap())}`, 8, ey + U * 0.75);
    }
    // player
    if (!p.hidden) {
      const px = X(p.x), py = floorY - p.y * U;
      const run = !p.stop && p.stumble <= 0, leg = run ? Math.sin(t * 16) * U * 0.18 : 0;
      ctx.fillStyle = '#2b2350'; ctx.fillRect(px - U * 0.2 + leg, py - U * 0.55, U * 0.14, U * 0.55); ctx.fillRect(px + 0.06 * U - leg, py - U * 0.55, U * 0.14, U * 0.55);
      ctx.fillStyle = '#3d6fd1'; ctx.beginPath(); ctx.roundRect(px - U * 0.3, py - U * 1.25, U * 0.6, U * 0.75, U * 0.15); ctx.fill();
      // flashlight beam forward
      ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#fff3a8'; ctx.beginPath(); ctx.moveTo(px + U * 0.35, py - U * 0.95); ctx.lineTo(px + U * 4, py - U * 1.9); ctx.lineTo(px + U * 4, py - U * 0.1); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(px + U * 0.2, py - U * 1.0, U * 0.25, U * 0.12);
      ctx.save(); ctx.font = `${Math.round(U * 0.75)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText(kid.avatar || '🙂', px, py - U * 1.55); ctx.restore();
      if (p.stumble > 0) { ctx.fillStyle = '#ffd84a'; ctx.font = `700 ${U * 0.4}px Andika`; ctx.textAlign = 'center'; ctx.fillText('★ ★', px, py - U * 2.1); }
    } else { ctx.fillStyle = '#ffd84a'; ctx.font = `700 ${U * 0.36}px Andika`; ctx.textAlign = 'center'; ctx.fillText('🤫', X(p.x), floorY - U * 2.9); }
    // darkness at the edges + rush tint
    const vg = ctx.createLinearGradient(0, 0, W, 0); vg.addColorStop(0, 'rgba(0,0,0,.75)'); vg.addColorStop(0.25, 'rgba(0,0,0,0)'); vg.addColorStop(0.85, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (c.rush > 0) { ctx.fillStyle = `rgba(160,0,0,${0.15 + 0.1 * Math.sin(t * 12)})`; ctx.fillRect(0, 0, W, H); }
    if (this.flash) { ctx.fillStyle = `rgba(160,255,230,${this.flash})`; ctx.fillRect(0, 0, W, H); }
    // progress bar (where you are in the hallway) + how close the chaser is
    const bw = Math.min(W * 0.6, 420), bx = (W - bw) / 2, by = H > W ? floorY + U * 1.4 : Math.min(H - 16, floorY + U * 0.9);
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(bx, by, bw, 10);
    ctx.fillStyle = '#6be675'; ctx.fillRect(bx, by, bw * clamp(p.x / this.endX, 0, 1), 10);
    ctx.fillStyle = '#ff6b6b'; ctx.beginPath(); ctx.arc(bx + bw * clamp(c.x / this.endX, 0, 1), by + 5, 7, 0, 7); ctx.fill();
  }
  coach() { const n = this.near; if (n === 'door') return 'They need to tap OPEN, then read the word / solve the problem out loud. Let them try first.'; if (this.c.rush > 0) return 'The animatronic is rushing — remind them to HIDE in a locker!'; return 'Watch for toys on the floor (JUMP) and lockers (HIDE).'; }
}

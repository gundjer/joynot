// Stage 2 + 4 of the level-up cycle: the WORKSHOP. Build your own friendly animatronic.
//  1. Pick a robot kit (bunny, bear, pup, penguin) and a paint color — every choice is read aloud.
//  2. Each part is locked in a crate. Tap the glowing crate, read the word or solve the problem (same TALK pop-up as
//     the doors), and the part pops out. Drag it onto the robot.
//  3. Hold the big lever to power it up. Pick a name. Your robot becomes a helper on later nights.
// I do / We do / You do: the first time, Sparky's hand shows how (tap the crate, drag the part); the next part shows a
// hint hand only if needed; after that the kid does it alone.
import { drawBot, drawPart, KINDS, KIND_LIST, COLORS, NAMES, PARTS, SLOTS } from './bots.js';
import { drawCharacter } from './characters.js';

const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

export class Workshop {
  /** env: { store, tutor, challenge, say(text), toast(text), sfx, onLevelUp(), onDone(bot), firstTime } */
  constructor(env) {
    this.env = env; this.t = 0; this.phase = 'kit'; this.bot = { kind: null, color: null, name: null };
    this.has = new Set(); this.crates = []; this.loose = null; this.drag = null; this.lever = 0; this.leverHeld = false;
    this.names = shuffle(NAMES).slice(0, 3); this.sparks = []; this.hand = null; this.idle = 0; this.peek = 6 + Math.random() * 8;
    this.demo = env.firstTime ? 2 : 0; // parts that get the hand: 2 = "I do" on the first, "we do" hint on the second
    this.busy = false;
    const focus = env.store.data.settings.focus || 'both';
    const kindFor = i => focus === 'reading' ? (i === 3 ? 'math' : 'read') : focus === 'math' ? (i === 3 ? 'read' : 'math') : (i % 2 ? 'math' : 'read');
    this.crates = PARTS.map((p, i) => ({ part: p.id, label: p.label, kind: kindFor(i), open: false, shake: 0, item: null }));
    this.layout(innerWidth, innerHeight);
  }

  get goal() {
    if (this.phase === 'kit') return 'Pick a robot kit!';
    if (this.phase === 'paint') return 'Pick a paint color!';
    if (this.phase === 'build') return this.loose ? `Drag the ${this.loose.label} onto your robot!` : `Open the glowing crate to get the ${this.next().label}!`;
    if (this.phase === 'power') return 'Hold the lever to power up your robot!';
    if (this.phase === 'name') return 'Pick a name for your robot!';
    return 'Your robot is ready!';
  }
  next() { return this.crates.find(c => !this.has.has(c.part)); }

  start() {
    this.env.say('Welcome to the workshop! Let\'s build a robot friend. First, pick a robot kit. Tap one!');
  }

  layout(W, H) {
    this.W = W; this.H = H;
    const portrait = H > W;
    this.portrait = portrait;
    this.top = Math.max(64, H * 0.12);
    if (portrait) {
      this.botS = Math.min(W * 0.7, H * 0.4); this.botX = W / 2; this.botY = this.top + this.botS * 0.75;
      const cw = Math.min(64, (W - 30) / 6 - 6), y = Math.min(H - cw - 34, Math.max(this.botY + this.botS * 0.75 + cw, H * 0.78));
      this.crates.forEach((c, i) => { c.x = 15 + (cw + 6) * i + cw / 2 + (W - 30 - (cw + 6) * 6 + 6) / 2; c.y = y; c.w = cw; });
    } else {
      this.botS = Math.min(H * 0.55, W * 0.32); this.botX = W / 2; this.botY = this.top + (H - this.top) * 0.5;
      const cw = Math.min(84, (H - this.top - 30) / 3 - 14);
      this.crates.forEach((c, i) => { const col = i < 3 ? 0 : 1, row = i % 3; c.x = col ? W - Math.max(70, W * 0.13) : Math.max(70, W * 0.13); c.y = this.top + 20 + row * (cw + 18) + cw / 2 + ((H - this.top - 40) - 3 * (cw + 18)) / 2; c.w = cw; });
    }
    // kit cards / paint cans / names
    const n = 4, cw2 = Math.min(portrait ? (W - 40) / 2 - 10 : (W - 60) / 4 - 12, 170);
    this.cards = KIND_LIST.map((k, i) => {
      const col = portrait ? i % 2 : i, row = portrait ? Math.floor(i / 2) : 0;
      const cols = portrait ? 2 : n, x0 = (W - (cols * (cw2 + 12) - 12)) / 2;
      return { kind: k, x: x0 + col * (cw2 + 12) + cw2 / 2, y: this.top + 30 + cw2 * 0.6 + row * (cw2 * 1.25 + 12), w: cw2, h: cw2 * 1.2 };
    });
    const pw = Math.min(70, (W - 40) / 6 - 8);
    this.cans = COLORS.map((c, i) => ({ color: c, x: (W - (6 * (pw + 8) - 8)) / 2 + i * (pw + 8) + pw / 2, y: H - pw - Math.max(18, H * 0.04), w: pw }));
    const nw = Math.min(200, (W - 40) / 3 - 10);
    this.nameBtns = this.names.map((nm, i) => ({ name: nm, x: (W - (3 * (nw + 10) - 10)) / 2 + i * (nw + 10) + nw / 2, y: H - 60, w: nw, h: 64 }));
    this.leverBox = { x: portrait ? W / 2 : Math.min(W - 80, this.botX + this.botS * 0.95), y: portrait ? H - 90 : this.botY + this.botS * 0.2, w: 90, h: 130 };
    if (portrait) { this.leverBox.h = 100; this.leverBox.y = Math.min(H - 70, this.botY + this.botS * 0.85 + 60); }
  }

  /** Where a part snaps onto the bot (screen px). */
  slot(id) { const [x, y] = SLOTS[id], u = this.botS / 100; return [this.botX + x * u, this.botY + y * u]; }

  update(dt) {
    this.t += dt; this.idle += dt; this.peek -= dt;
    if (this.peek < -2.5) this.peek = 9 + Math.random() * 10;
    for (const c of this.crates) c.shake = Math.max(0, c.shake - dt);
    this.sparks = this.sparks.filter(s => (s.t -= dt) > 0);
    for (const s of this.sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 400 * dt; }
    if (this.loose && !this.drag) { // part floats gently, or flies back to its float spot
      const L = this.loose; L.x += (L.hx - L.x) * Math.min(1, dt * 6); L.y += (L.hy + Math.sin(this.t * 3) * 5 - L.y) * Math.min(1, dt * 6);
    }
    if (this.phase === 'power') {
      if (this.leverHeld) { this.lever = Math.min(1, this.lever + dt / 1.4); if (Math.random() < 0.4) this.spark(this.botX, this.botY, 2); }
      else this.lever = Math.max(0, this.lever - dt * 1.5);
      if (this.lever >= 1) this.powerUp();
    }
    // hint hand
    this.hand = null;
    if (this.phase === 'build' && !this.busy) {
      const showHelp = this.demo > 0 || this.idle > 7;
      if (showHelp) {
        if (this.loose && !this.drag) { const [sx, sy] = this.slot(this.loose.part); const k = (this.t % 1.8) / 1.8; this.hand = { x: this.loose.x + (sx - this.loose.x) * k, y: this.loose.y + (sy - this.loose.y) * k }; }
        else if (!this.loose) { const c = this.next(); if (c) this.hand = { x: c.x + 8, y: c.y + 10 + Math.sin(this.t * 6) * 6 }; }
      }
    }
    if (this.phase === 'kit' || this.phase === 'paint' || this.phase === 'name') { if (this.idle > 9) { this.idle = 0; this.env.say(this.goal); } }
  }

  spark(x, y, n = 10, col = '#ffe066') { for (let i = 0; i < n; i++) this.sparks.push({ x, y, vx: (Math.random() - 0.5) * 360, vy: -Math.random() * 300, t: 0.6 + Math.random() * 0.4, col }); }

  // ------------------------------------------------ input
  hit(x, y, o, w = o.w, h = o.h || o.w) { return Math.abs(x - o.x) < w / 2 && Math.abs(y - o.y) < h / 2; }
  onDown(x, y) {
    if (this.busy) return;
    this.idle = 0;
    if (this.phase === 'kit') {
      const c = this.cards.find(c => this.hit(x, y, c)); if (!c) return;
      this.bot.kind = c.kind; this.env.sfx.pickup(); this.phase = 'paint';
      this.env.say(`${KINDS[c.kind].name}! Great choice. Now pick a paint color.`);
      return;
    }
    if (this.phase === 'paint') {
      const c = this.cans.find(c => this.hit(x, y, c, c.w, c.w * 1.2)); if (!c) return;
      this.bot.color = c.color; this.env.sfx.pickup(); this.phase = 'build'; this.spark(this.botX, this.botY, 14, c.color);
      this.env.say(this.demo ? 'Beautiful! Now we need parts. The parts are locked in crates. Watch me: tap the glowing crate, then read the word or solve the problem to open it.' : 'Beautiful! Tap the glowing crate to get the first part.');
      return;
    }
    if (this.phase === 'build') {
      if (this.loose) {
        const L = this.loose; if (Math.hypot(x - L.x, y - L.y) < this.botS * 0.45) { this.drag = { dx: L.x - x, dy: L.y - y }; this.env.sfx.click(); }
        return;
      }
      const c = this.crates.find(c => !this.has.has(c.part) && this.hit(x, y, c, c.w * 1.15, c.w * 1.15)); if (!c) return;
      if (c !== this.next()) { c.shake = 0.4; this.env.sfx.wrong(); this.env.say(`First we need the ${this.next().label}. Tap the glowing crate!`); return; }
      this.openCrate(c);
      return;
    }
    if (this.phase === 'power') { if (this.hit(x, y, this.leverBox, this.leverBox.w * 1.4, this.leverBox.h * 1.3)) { this.leverHeld = true; this.env.sfx.click(); } return; }
    if (this.phase === 'name') {
      const b = this.nameBtns.find(b => this.hit(x, y, b)); if (!b) return;
      if (this.nameSel !== b.name) { this.nameSel = b.name; this.env.sfx.click(); this.env.say(`${b.name}. Tap ${b.name} again to pick it!`); return; }
      this.bot.name = b.name; this.phase = 'done'; this.env.sfx.win();
      this.spark(this.botX, this.botY - this.botS * 0.3, 30, this.bot.color);
      this.env.say(`Hi! My name is ${b.name}! I will follow you and help you on the next nights. Thank you for building me!`);
      setTimeout(() => this.env.onDone({ kind: this.bot.kind, color: this.bot.color, name: this.bot.name, at: Date.now() }), 2600);
    }
  }
  onMove(x, y) {
    if (!this.drag || !this.loose) return;
    this.loose.x = x + this.drag.dx; this.loose.y = y + this.drag.dy;
  }
  onUp() {
    if (this.phase === 'power') { this.leverHeld = false; return; }
    if (!this.drag || !this.loose) return;
    this.drag = null;
    const L = this.loose, [sx, sy] = this.slot(L.part);
    if (Math.hypot(L.x - sx, L.y - sy) < this.botS * 0.32) {
      this.has.add(L.part); this.loose = null; this.env.sfx.power(); this.spark(sx, sy, 16);
      if (this.demo) this.demo--;
      const left = PARTS.length - this.has.size;
      if (!left) { this.phase = 'power'; this.env.say('All the parts are on! Now hold the big lever to power up your robot!'); }
      else this.env.say(pick(['It fits!', 'Click! It snapped on!', 'Perfect!', 'Great building!']) + (left === 1 ? ' One more part!' : ` ${left} more parts.`));
    } else { this.env.sfx.wrong(); this.env.say(`Put the ${L.label} on the robot. Look for the dotted line!`); }
  }

  async openCrate(c) {
    this.busy = true;
    const E = this.env;
    if (!c.item) c.item = E.tutor.pick(c.kind === 'read' ? 'reading' : 'math');
    const res = await E.challenge.open(c.item, {});
    this.busy = false; this.idle = 0;
    if (res.levelUp) E.onLevelUp();
    if (!res.solved) { c.item = null; E.say('That lock is tricky. Tap the crate to try a new one!'); return; }
    c.item = null; c.open = true; E.sfx.door(); this.spark(c.x, c.y, 18);
    const hx = this.portrait ? this.W / 2 + (this.W * 0.3) * (c.x < this.W / 2 ? -1 : 1) * 0.0 : (c.x < this.W / 2 ? c.x + c.w * 1.3 : c.x - c.w * 1.3);
    const hy = this.portrait ? c.y - c.w * 1.6 : c.y;
    this.loose = { part: c.part, label: c.label, x: c.x, y: c.y, hx: this.portrait ? Math.max(40, Math.min(this.W - 40, c.x)) : hx, hy };
    E.say(this.demo ? `The ${c.label}! Now drag the ${c.label} onto the robot, like my hand shows.` : `You got the ${c.label}! Drag it onto your robot.`);
  }

  powerUp() {
    this.phase = 'awake'; this.leverHeld = false; this.lever = 1;
    this.env.sfx.power(); this.spark(this.botX, this.botY, 40, '#7ff');
    setTimeout(() => { this.env.sfx.win(); this.phase = 'name'; this.env.say('It\'s alive! Your robot woke up! Now pick a name for your robot. Tap a name to hear it. Tap it again to pick it!'); }, 1200);
  }

  // ------------------------------------------------ drawing
  draw(ctx, W, H) {
    if (W !== this.W || H !== this.H) this.layout(W, H);
    const t = this.t;
    // room: warm lamp over a workbench in the dark
    ctx.fillStyle = '#120d1a'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1c1526'; for (let x = 0; x < W; x += 60) ctx.fillRect(x, 0, 30, H * 0.7);
    ctx.fillStyle = '#2a2018'; ctx.fillRect(0, H * 0.72, W, H * 0.28);
    // window with something peeking
    const wx = this.portrait ? W * 0.82 : W * 0.5 - this.botS * 0.95, wy = this.top + 10, ww = Math.min(90, W * 0.14), wh = ww * 0.8;
    ctx.fillStyle = '#05040a'; ctx.fillRect(wx, wy, ww, wh); ctx.strokeStyle = '#3b2d52'; ctx.lineWidth = 4; ctx.strokeRect(wx, wy, ww, wh);
    ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
    if (this.peek < 0) { ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip(); drawCharacter(ctx, 'rusty', wx + ww / 2, wy + wh * 0.95, ww * 1.4, t); ctx.restore(); }
    // lamp light
    const g = ctx.createRadialGradient(this.botX, this.botY - this.botS * 0.4, 10, this.botX, this.botY, Math.max(W, H) * 0.6);
    g.addColorStop(0, 'rgba(255,214,140,.35)'); g.addColorStop(1, 'rgba(255,214,140,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // bench
    const by = this.botY + this.botS * 0.52;
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(this.botX - this.botS * 0.9, by, this.botS * 1.8, this.botS * 0.12);
    ctx.fillStyle = '#4a3220'; ctx.fillRect(this.botX - this.botS * 0.82, by + this.botS * 0.12, this.botS * 0.1, this.botS * 0.3); ctx.fillRect(this.botX + this.botS * 0.72, by + this.botS * 0.12, this.botS * 0.1, this.botS * 0.3);

    if (this.phase === 'kit') return this.drawKits(ctx, W, H);
    const bot = { kind: this.bot.kind, color: this.bot.color || '#9aa3ad' };
    const awake = this.phase === 'awake' || this.phase === 'name' || this.phase === 'done';
    drawBot(ctx, bot, this.botX, this.botY, this.botS, t, { has: awake ? null : this.has, ghost: !awake, wave: this.phase === 'done' || this.phase === 'name' ? 1 : 0, glow: awake ? 0.6 + 0.2 * Math.sin(t * 4) : 0 });
    if (this.phase === 'build' && this.loose) { // glow the slot
      const [sx, sy] = this.slot(this.loose.part); ctx.save(); ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 6); ctx.strokeStyle = '#7ff'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.arc(sx, sy, this.botS * 0.2, 0, 7); ctx.stroke(); ctx.restore();
    }
    if (this.phase === 'paint') this.drawCans(ctx);
    if (this.phase === 'build' || this.phase === 'power') this.drawCrates(ctx);
    if (this.loose) drawPart(ctx, bot, this.loose.part, this.loose.x, this.loose.y, this.botS * 0.9, t);
    if (this.phase === 'power' || this.phase === 'awake') this.drawLever(ctx);
    if (this.phase === 'name') this.drawNames(ctx);
    for (const s of this.sparks) { ctx.globalAlpha = Math.min(1, s.t * 2); ctx.fillStyle = s.col; ctx.fillRect(s.x - 3, s.y - 3, 6, 6); }
    ctx.globalAlpha = 1;
    if (this.hand) { ctx.save(); ctx.font = `${Math.round(Math.min(56, W * 0.1))}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = '#000'; ctx.fillText('👆', this.hand.x, this.hand.y); ctx.restore(); }
  }
  drawKits(ctx) {
    for (const c of this.cards) {
      ctx.save();
      ctx.fillStyle = '#16304e'; ctx.strokeStyle = '#7fc8ff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(c.x - c.w / 2, c.y - c.h / 2, c.w, c.h, 16); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(127,200,255,.18)'; ctx.lineWidth = 1; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(c.x - c.w / 2, c.y - c.h / 2 + i * c.h / 6); ctx.lineTo(c.x + c.w / 2, c.y - c.h / 2 + i * c.h / 6); ctx.stroke(); }
      drawBot(ctx, { kind: c.kind, color: '#7fc8ff' }, c.x, c.y - c.h * 0.02, c.h * 0.62, this.t, {});
      ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(c.w * 0.14)}px Andika, sans-serif`; ctx.textAlign = 'center'; ctx.fillText(KINDS[c.kind].name, c.x, c.y + c.h * 0.44);
      ctx.restore();
    }
  }
  drawCans(ctx) {
    for (const c of this.cans) {
      const x = c.x - c.w / 2, y = c.y - c.w / 2;
      ctx.fillStyle = '#c9c9d1'; ctx.beginPath(); ctx.roundRect(x, y, c.w, c.w * 1.1, 8); ctx.fill();
      ctx.fillStyle = c.color; ctx.beginPath(); ctx.roundRect(x + 4, y + c.w * 0.25, c.w - 8, c.w * 0.6, 6); ctx.fill();
      ctx.fillStyle = c.color; ctx.beginPath(); ctx.ellipse(c.x, y + 6, c.w / 2 - 4, 6, 0, 0, 7); ctx.fill();
    }
  }
  drawCrates(ctx) {
    const nx = this.next();
    for (const c of this.crates) {
      const done = this.has.has(c.part), sh = c.shake ? Math.sin(c.shake * 60) * 5 : 0, x = c.x - c.w / 2 + sh, y = c.y - c.w / 2;
      ctx.save();
      if (c === nx && !this.loose && this.phase === 'build') { ctx.shadowColor = c.kind === 'read' ? '#7fc8ff' : '#ffb347'; ctx.shadowBlur = 18 + 8 * Math.sin(this.t * 5); }
      ctx.fillStyle = done ? '#3a2c1f' : '#8a5a2b'; ctx.fillRect(x, y, c.w, c.w);
      ctx.shadowBlur = 0; ctx.strokeStyle = '#4a2f14'; ctx.lineWidth = 3; ctx.strokeRect(x, y, c.w, c.w);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + c.w, y + c.w); ctx.moveTo(x + c.w, y); ctx.lineTo(x, y + c.w); ctx.stroke();
      if (!done) {
        ctx.fillStyle = c.kind === 'read' ? '#7fc8ff' : '#ffb347'; ctx.beginPath(); ctx.arc(x + c.w / 2, y + c.w / 2, c.w * 0.26, 0, 7); ctx.fill();
        ctx.fillStyle = '#000'; ctx.font = `${Math.round(c.w * 0.28)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.kind === 'read' ? '📖' : '🔢', x + c.w / 2, y + c.w / 2 + 2);
      } else { ctx.fillStyle = '#6be675'; ctx.font = `700 ${Math.round(c.w * 0.4)}px Andika, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✓', x + c.w / 2, y + c.w / 2); }
      ctx.fillStyle = '#f4efe6'; ctx.font = `700 ${Math.round(Math.max(11, c.w * 0.2))}px Andika, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(c.label, x + c.w / 2, y + c.w + 3);
      ctx.restore();
    }
  }
  drawLever(ctx) {
    const b = this.leverBox, x = b.x, y = b.y;
    ctx.save();
    ctx.fillStyle = '#3a3f46'; ctx.beginPath(); ctx.roundRect(x - 28, y - b.h / 2, 56, b.h, 12); ctx.fill();
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(x - 20, y + b.h / 2 - 14 - (b.h - 28) * this.lever, 40, 8);
    const a = -0.9 + this.lever * 1.8;
    ctx.translate(x, y + b.h * 0.25); ctx.rotate(a);
    ctx.strokeStyle = '#c9ced6'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -b.h * 0.55); ctx.stroke();
    ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(0, -b.h * 0.55, 16, 0, 7); ctx.fill();
    ctx.restore();
    if (this.phase === 'power') { ctx.fillStyle = '#ffd84a'; ctx.font = '700 18px Andika, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('HOLD', x, y + b.h / 2 + 22); }
  }
  drawNames(ctx) {
    for (const b of this.nameBtns) {
      if (this.nameSel === b.name) { ctx.fillStyle = '#6be675'; ctx.beginPath(); ctx.roundRect(b.x - b.w / 2 - 6, b.y - b.h / 2 - 6, b.w + 12, b.h + 12, 22); ctx.fill(); }
      ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.roundRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 18); ctx.fill();
      ctx.fillStyle = '#2a1600'; ctx.font = `700 ${Math.round(Math.min(28, b.w * 0.18))}px Andika, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.name, b.x, b.y);
    }
  }
  /** For grown-ups watching: what's happening right now. */
  coach() {
    if (this.phase === 'build' && !this.loose) return `Let ${this.env.store.data.name || 'them'} tap the glowing crate and read/solve it out loud. Encourage sounding out — don't give the answer.`;
    if (this.loose) return 'Point at the dotted outline on the robot so they know where the part goes.';
    return '';
  }
}

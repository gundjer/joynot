// Level 2 of the loop: the WORKSHOP. Build your own animatronic — and then it comes to life and chases you!
//  1. Pick a kit (bunny, bear, pup, penguin) and read the color words on the paint cans to paint it.
//  2. Each part is locked in a crate. Tap the glowing crate, read the word or solve the problem (same TALK pop-up as
//     the doors), and the part pops out. Drag it onto the robot.
//  3. Pick a name (read the name tags).
//  4. POWERS: pick how fast it runs, how well it hears, how well it sees (1–5), then solve a math problem to lock each
//     one in. Stronger powers = a harder chase in the next level (and more stars for escaping).
//  5. Hold the lever: it comes to life. Gentle: "Let's play tag!" Older grades: its eyes light up... and it wants YOU.
// I do / We do / You do: the first time, Sparky's hand shows how; after that only if needed.
import { drawBot, drawPart, KINDS, KIND_LIST, COLORS, COLOR_WORDS, NAMES, PARTS, SLOTS, POWERS } from './bots.js';
import { drawCharacter, getTier } from './characters.js';
import { ComponentGuide } from './component-guide.js';
import { drawWorkshopRoom } from './scene3d.js';

const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };

export class Workshop {
  /** env: { store, tutor, challenge, say(text), toast(text), sfx, onLevelUp(), onDone(bot), firstTime } */
  constructor(env) {
    this.env = env; this.t = 0; this.phase = 'kit'; this.bot = { kind: null, color: null, name: null, powers: { speed: 0, ears: 0, eyes: 0 } };
    this.has = new Set(); this.crates = []; this.loose = null; this.drag = null; this.lever = 0; this.leverHeld = false;
    this.names = shuffle(NAMES).slice(0, 3); this.sparks = []; this.hand = null; this.idle = 0; this.peek = 6 + Math.random() * 8;
    this.demo = env.firstTime ? 2 : 0; // parts that get the hand: 2 = "I do" on the first, "we do" hint on the second
    this.busy = false; this.powerI = 0; this.powerSel = 0; this.aliveT = 0;
    this.bot.finish = env.store.data.supplies?.chrome ? 'chrome' : 'brushed';
    this.guide = new ComponentGuide(this.bot, text => env.say(text)); this.disposed = false;
    const focus = env.store.data.settings.focus || 'both';
    const kindFor = i => focus === 'reading' ? (i === 3 ? 'math' : 'read') : focus === 'math' ? (i === 3 ? 'read' : 'math') : (i % 2 ? 'math' : 'read');
    this.crates = PARTS.map((p, i) => ({ part: p.id, label: p.label, kind: kindFor(i), open: false, shake: 0, item: null }));
    this.layout(innerWidth, innerHeight);
  }

  get goal() {
    if (this.phase === 'kit') return 'Pick a robot kit!';
    if (this.phase === 'paint') return 'Read the color words. Pick a paint can!';
    if (this.phase === 'build') return this.loose ? `Drag the ${this.loose.label} onto your robot!` : `Open the glowing crate to get the ${this.next().label}!`;
    if (this.phase === 'name') return 'Read the name tags. Pick a name!';
    if (this.phase === 'powers') { const P = POWERS[this.powerI]; return P ? `${P.label}: pick 1 to 5, then solve to lock it in!` : 'Powers are ready!'; }
    if (this.phase === 'power') return 'Hold the lever to bring it to life!';
    if (this.phase === 'alive') return getTier() === 0 ? 'It\'s alive! Get ready for tag!' : 'It\'s alive... RUN!';
    return 'Your animatronic is ready!';
  }
  next() { return this.crates.find(c => !this.has.has(c.part)); }

  start() {
    this.env.say('Welcome to the workshop! Let\'s build your own animatronic. First, pick a robot kit. Tap one!');
  }

  layout(W, H) {
    this.W = W; this.H = H;
    const portrait = H > W;
    this.portrait = portrait;
    this.top = Math.max(64, H * 0.12);
    if (portrait) {
      this.botS = Math.min(W * 0.55, H * 0.32); this.botX = W / 2; this.botY = this.top + this.botS * 0.85;
      const cw = Math.min(64, (W - 30) / 6 - 6), y = Math.min(H - cw - 34, Math.max(this.botY + this.botS * 0.8 + cw, H * 0.78));
      this.crates.forEach((c, i) => { c.x = 15 + (cw + 6) * i + cw / 2 + (W - 30 - (cw + 6) * 6 + 6) / 2; c.y = y; c.w = cw; });
    } else {
      this.botS = Math.min(H * 0.46, W * 0.27); this.botX = W / 2; this.botY = this.top + (H - this.top) * 0.52;
      const cw = Math.min(84, (H - this.top - 30) / 3 - 14);
      this.crates.forEach((c, i) => { const col = i < 3 ? 0 : 1, row = i % 3; c.x = col ? W - Math.max(70, W * 0.13) : Math.max(70, W * 0.13); c.y = this.top + 20 + row * (cw + 18) + cw / 2 + ((H - this.top - 40) - 3 * (cw + 18)) / 2; c.w = cw; });
    }
    // kit cards / paint cans / names / power buttons
    const n = 4, cw2 = Math.min(portrait ? (W - 40) / 2 - 10 : (W - 60) / 4 - 12, 170);
    this.cards = KIND_LIST.map((k, i) => {
      const col = portrait ? i % 2 : i, row = portrait ? Math.floor(i / 2) : 0;
      const cols = portrait ? 2 : n, x0 = (W - (cols * (cw2 + 12) - 12)) / 2;
      return { kind: k, x: x0 + col * (cw2 + 12) + cw2 / 2, y: this.top + 30 + cw2 * 0.6 + row * (cw2 * 1.25 + 12), w: cw2, h: cw2 * 1.2 };
    });
    const pw = Math.min(78, (W - 40) / 6 - 8);
    this.cans = COLORS.map((c, i) => ({ color: c, word: COLOR_WORDS[c] || 'paint', x: (W - (6 * (pw + 8) - 8)) / 2 + i * (pw + 8) + pw / 2, y: H - pw - Math.max(26, H * 0.05), w: pw }));
    const nw = Math.min(200, (W - 40) / 3 - 10);
    this.nameBtns = this.names.map((nm, i) => ({ name: nm, x: (W - (3 * (nw + 10) - 10)) / 2 + i * (nw + 10) + nw / 2, y: H - 60, w: nw, h: 64 }));
    const bw = Math.min(70, (W - 60) / 5 - 10);
    this.levelBtns = [1, 2, 3, 4, 5].map((v, i) => ({ v, x: (W - (5 * (bw + 10) - 10)) / 2 + i * (bw + 10) + bw / 2, y: H - bw / 2 - Math.max(20, H * 0.04), w: bw, h: bw }));
    this.leverBox = { x: portrait ? W / 2 : Math.min(W - 80, this.botX + this.botS * 0.95), y: portrait ? H - 90 : this.botY + this.botS * 0.2, w: 90, h: 130 };
    if (portrait) { this.leverBox.h = 100; this.leverBox.y = Math.min(H - 70, this.botY + this.botS * 0.85 + 60); }
  }

  /** Where a part snaps onto the bot (screen px). */
  slot(id) { const [x, y] = SLOTS[id], u = this.botS / 100; return [this.botX + x * u, this.botY + y * u]; }

  update(dt) {
    if (this.disposed || this.guide.dialog.open) return;
    this.t += dt; this.idle += dt; this.peek -= dt;
    if (this.peek < -2.5) this.peek = 9 + Math.random() * 10;
    for (const c of this.crates) c.shake = Math.max(0, c.shake - dt);
    this.sparks = this.sparks.filter(s => (s.t -= dt) > 0);
    for (const s of this.sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 400 * dt; }
    if (this.loose && !this.drag) { const L = this.loose; L.x += (L.hx - L.x) * Math.min(1, dt * 6); L.y += (L.hy + Math.sin(this.t * 3) * 5 - L.y) * Math.min(1, dt * 6); }
    if (this.phase === 'power') {
      if (this.leverHeld) { this.lever = Math.min(1, this.lever + dt / 1.4); if (Math.random() < 0.4) this.spark(this.botX, this.botY, 2); }
      else this.lever = Math.max(0, this.lever - dt * 1.5);
      if (this.lever >= 1) this.powerUp();
    }
    if (this.phase === 'alive') this.aliveT += dt;
    // hint hand
    this.hand = null;
    if (this.phase === 'build' && !this.busy) {
      const showHelp = this.demo > 0 || this.idle > 7;
      if (showHelp) {
        if (this.loose && !this.drag) { const [sx, sy] = this.slot(this.loose.part); const k = (this.t % 1.8) / 1.8; this.hand = { x: this.loose.x + (sx - this.loose.x) * k, y: this.loose.y + (sy - this.loose.y) * k }; }
        else if (!this.loose) { const c = this.next(); if (c) this.hand = { x: c.x + 8, y: c.y + 10 + Math.sin(this.t * 6) * 6 }; }
      }
    }
    if (['kit', 'paint', 'name', 'powers'].includes(this.phase) && !this.busy) { if (this.idle > 10) { this.idle = 0; this.env.say(this.goal); } }
  }

  spark(x, y, n = 10, col = '#ffe066') { for (let i = 0; i < n; i++) this.sparks.push({ x, y, vx: (Math.random() - 0.5) * 360, vy: -Math.random() * 300, t: 0.6 + Math.random() * 0.4, col }); }

  // ------------------------------------------------ input
  hit(x, y, o, w = o.w, h = o.h || o.w) { return Math.abs(x - o.x) < w / 2 && Math.abs(y - o.y) < h / 2; }
  onDown(x, y) {
    if (this.busy) return;
    this.idle = 0;
    const E = this.env;
    if (this.phase === 'kit') {
      const c = this.cards.find(c => this.hit(x, y, c)); if (!c) return;
      this.bot.kind = c.kind; E.sfx.pickup(); this.phase = 'paint';
      E.say(`${KINDS[c.kind].name}! Great choice. Now let's paint it. Read the words on the paint cans. Tap a can to hear it, and tap it again to pick it.`);
      return;
    }
    if (this.phase === 'paint') {
      const c = this.cans.find(c => this.hit(x, y, c, c.w, c.w * 1.4)); if (!c) return;
      if (this.canSel !== c.color) { this.canSel = c.color; E.sfx.click(); E.say(`${c.word}. Tap ${c.word} again to pick it!`); return; }
      this.bot.color = c.color; E.sfx.snap(); this.phase = 'build'; this.spark(this.botX, this.botY, 14, c.color);
      E.say(this.demo ? `${c.word}! Beautiful! Now we need parts. The parts are locked in crates. Watch me: tap the glowing crate, then read the word or solve the problem to open it.` : `${c.word}! Beautiful! Tap the glowing crate to get the first part.`);
      return;
    }
    if (this.phase === 'build') {
      if (this.loose) {
        const L = this.loose; if (Math.hypot(x - L.x, y - L.y) < this.botS * 0.45) { this.drag = { dx: L.x - x, dy: L.y - y }; E.sfx.click(); }
        return;
      }
      const c = this.crates.find(c => !this.has.has(c.part) && this.hit(x, y, c, c.w * 1.15, c.w * 1.15)); if (!c) return;
      if (c !== this.next()) { c.shake = 0.4; E.sfx.wrong(); E.say(`First we need the ${this.next().label}. Tap the glowing crate!`); return; }
      this.openCrate(c);
      return;
    }
    if (this.phase === 'name') {
      const b = this.nameBtns.find(b => this.hit(x, y, b)); if (!b) return;
      if (this.nameSel !== b.name) { this.nameSel = b.name; E.sfx.click(); E.say(`${b.name}. Tap ${b.name} again to pick it!`); return; }
      this.bot.name = b.name; E.sfx.snap(); this.phase = 'powers'; this.powerI = 0;
      E.say(`${b.name}! Now give ${b.name} powers. First: speed. How fast should ${b.name} run? Pick 1 for slow, or 5 for super fast. Then solve a problem to lock it in.`);
      return;
    }
    if (this.phase === 'powers') {
      const b = this.levelBtns.find(b => this.hit(x, y, b)); if (!b) return;
      this.powerSel = b.v; E.sfx.click();
      this.lockPower(b.v);
      return;
    }
    if (this.phase === 'power') { if (this.hit(x, y, this.leverBox, this.leverBox.w * 1.4, this.leverBox.h * 1.3)) { this.leverHeld = true; E.sfx.click(); } }
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
      this.has.add(L.part); this.loose = null; this.env.sfx.snap(); this.spark(sx, sy, 16);
      if (this.demo) this.demo--;
      const left = PARTS.length - this.has.size;
      if (!left) { this.phase = 'name'; this.env.say('All the parts are on! Now your animatronic needs a name. Read the name tags. Tap a name to hear it, and tap it again to pick it!'); }
      else this.env.say(pick(['It fits!', 'Click! It snapped on!', 'Perfect!', 'Great building!']) + (left === 1 ? ' One more part!' : ` ${left} more parts.`));
    } else { this.env.sfx.wrong(); this.env.say(`Put the ${L.label} on the robot. Look for the dotted line!`); }
  }

  async openCrate(c) {
    this.busy = true;
    const E = this.env;
    if (!c.item) c.item = E.tutor.pick(c.kind === 'read' ? 'reading' : 'math');
    const res = await E.challenge.open(c.item, {});
    if (this.disposed) return;
    this.busy = false; this.idle = 0;
    if (res.levelUp) E.onLevelUp();
    if (!res.solved) { c.item = null; E.say('That lock is tricky. Tap the crate to try a new one!'); return; }
    c.item = null; c.open = true; E.sfx.door(); this.spark(c.x, c.y, 18);
    const hx = this.portrait ? Math.max(40, Math.min(this.W - 40, c.x)) : (c.x < this.W / 2 ? c.x + c.w * 1.3 : c.x - c.w * 1.3);
    const hy = this.portrait ? c.y - c.w * 1.6 : c.y;
    this.loose = { part: c.part, label: c.label, x: c.x, y: c.y, hx, hy };
    this.guide.show(c.part);
  }

  /** Math locks in a power. */
  async lockPower(v) {
    const E = this.env, P = POWERS[this.powerI]; if (!P) return;
    this.busy = true;
    const res = await E.challenge.open(E.tutor.pick('math'), {});
    if (this.disposed) return;
    this.busy = false; this.idle = 0;
    if (res.levelUp) E.onLevelUp();
    if (!res.solved) { E.say(`Let's try another problem to lock in ${P.label.toLowerCase()}. Pick a number again!`); return; }
    this.bot.powers[P.id] = v; E.sfx.power(); this.spark(this.botX, this.botY - this.botS * 0.2, 18, '#ffd84a');
    this.powerI++;
    const nm = this.bot.name;
    if (this.powerI === 1) E.say(`${P.label} ${v}! Locked in. Next: big ears. How well should ${nm} hear you? 1 to 5.`);
    else if (this.powerI === 2) E.say(`${P.label} ${v}! Locked in. Last one: glow eyes. How well should ${nm} see you? 1 to 5.`);
    else { this.phase = 'power'; E.say(`All the powers are locked in! Now hold the big lever to bring ${nm} to life!`); }
  }

  powerUp() {
    this.phase = 'alive'; this.leverHeld = false; this.lever = 1; this.aliveT = 0;
    const E = this.env, nm = this.bot.name, tier = getTier();
    E.sfx.alive(); this.spark(this.botX, this.botY, 40, tier === 0 ? '#7ff' : '#ff5a3c');
    const line = tier === 0 ? `It's alive! Hi! I am ${nm}! Thank you for building me! Let's play tag! I will count to ten. Run!`
      : tier === 1 ? `It's alive! ... ${nm}'s eyes are glowing. Thank you for building me... Now I will find YOU. Ready or not!`
        : `It's alive... ${nm} is awake. Thank you for building me... Now... it's MY turn. Run!`;
    E.say(line);
    this.doneTimer = setTimeout(() => { if (!this.disposed) this.env.onDone({ kind: this.bot.kind, color: this.bot.color, finish: this.bot.finish, name: nm, powers: { ...this.bot.powers }, at: Date.now() }); }, 5200);
  }
  dispose() { this.disposed = true; clearTimeout(this.doneTimer); this.guide.dispose(); }

  // ------------------------------------------------ drawing
  draw(ctx, W, H) {
    if (this.guide.dialog.open) return;
    if (W !== this.W || H !== this.H) this.layout(W, H);
    const t = this.t, tier = getTier();
    if (!drawWorkshopRoom(ctx, W, H)) {
    // room: warm lamp over a workbench, pegboard on the wall
    ctx.fillStyle = tier === 0 ? '#2c3a52' : '#141b28'; ctx.fillRect(0, 0, W, H);
    const pegW = Math.min(W * 0.62, 700), pegX = (W - pegW) / 2, pegY = this.top * 0.6, pegH = H * 0.5;
    ctx.fillStyle = tier === 0 ? '#9a7a52' : '#5a4430'; ctx.fillRect(pegX, pegY, pegW, pegH);
    ctx.fillStyle = 'rgba(0,0,0,.28)'; for (let y = pegY + 12; y < pegY + pegH; y += 24) for (let x = pegX + 12; x < pegX + pegW; x += 24) { ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); }
    ctx.fillStyle = tier === 0 ? '#4a5a74' : '#2a3242'; ctx.fillRect(0, H * 0.7, W, H * 0.3);
    // window with something peeking in
    const wx = this.portrait ? W * 0.82 : W * 0.5 - this.botS * 1.25, wy = this.top + 10, ww = Math.min(90, W * 0.14), wh = ww * 0.8;
    ctx.fillStyle = '#05040a'; ctx.fillRect(wx, wy, ww, wh); ctx.strokeStyle = '#3b2d52'; ctx.lineWidth = 4; ctx.strokeRect(wx, wy, ww, wh);
    if (this.peek < 0 && tier > 0) { ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip(); drawCharacter(ctx, 'rusty', wx + ww / 2, wy + wh * 1.05, ww * 1.6, t); ctx.restore(); }
    ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
    // lamp light
    const g = ctx.createRadialGradient(this.botX, this.botY - this.botS * 0.6, 10, this.botX, this.botY, Math.max(W, H) * 0.6);
    g.addColorStop(0, 'rgba(255,214,140,.38)'); g.addColorStop(1, 'rgba(255,214,140,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // assembly stand
    }
    const sy = this.botY + this.botS * 0.66;
    ctx.fillStyle = '#2a3242'; ctx.beginPath(); ctx.ellipse(this.botX, sy + 6, this.botS * 0.62, this.botS * 0.12, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffcf4a'; ctx.beginPath(); ctx.ellipse(this.botX, sy, this.botS * 0.58, this.botS * 0.11, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a4558'; ctx.beginPath(); ctx.ellipse(this.botX, sy - 2, this.botS * 0.48, this.botS * 0.08, 0, 0, 7); ctx.fill();

    if (this.phase === 'kit') return this.drawKits(ctx, W, H);
    // while picking paint, the robot shows the color you tapped
    const bot = { kind: this.bot.kind, finish: this.bot.finish, color: this.bot.color || (this.phase === 'paint' && this.canSel) || '#9aa3ad' };
    const built = !['kit', 'paint', 'build'].includes(this.phase) || this.phase === 'paint';
    const alive = this.phase === 'alive';
    if (alive && tier > 0) { // lights flicker as it wakes up
      const f = Math.sin(this.aliveT * 31) > 0.3 && this.aliveT < 2.2;
      if (f) { ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(0, 0, W, H); }
    }
    drawBot(ctx, bot, this.botX, this.botY, this.botS, t, { has: built ? null : this.has, ghost: !built, mood: alive && this.aliveT > 1.2 ? 'chase' : 'friendly', walking: alive && this.aliveT > 3, glow: alive ? 0.4 + 0.2 * Math.sin(t * 6) : 0 });
    if (this.phase === 'build' && this.loose) {
      const [sx, sy2] = this.slot(this.loose.part); ctx.save(); ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 6); ctx.strokeStyle = '#7ff'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.arc(sx, sy2, this.botS * 0.2, 0, 7); ctx.stroke(); ctx.restore();
    }
    if (this.phase === 'paint') this.drawCans(ctx);
    if (this.phase === 'build') this.drawCrates(ctx);
    if (this.loose) drawPart(ctx, bot, this.loose.part, this.loose.x, this.loose.y, this.botS, t);
    if (this.phase === 'power') this.drawLever(ctx);
    if (this.phase === 'name') this.drawNames(ctx);
    if (this.phase === 'powers' || this.phase === 'power' || alive) this.drawPowers(ctx, W, H);
    if (this.bot.name && built && this.phase !== 'powers') { // name plate
      ctx.save(); ctx.font = `700 ${Math.round(Math.max(16, this.botS * 0.11))}px Andika, sans-serif`; ctx.textAlign = 'center';
      const tw = ctx.measureText(this.bot.name).width + 28, ny = this.botY + this.botS * 0.86;
      ctx.fillStyle = this.bot.color; rr(ctx, this.botX - tw / 2, ny - 18, tw, 32, 10); ctx.fill();
      ctx.fillStyle = '#1a1020'; ctx.textBaseline = 'middle'; ctx.fillText(this.bot.name, this.botX, ny - 1); ctx.restore();
    }
    for (const s of this.sparks) { ctx.globalAlpha = Math.min(1, s.t * 2); ctx.fillStyle = s.col; ctx.fillRect(s.x - 3, s.y - 3, 6, 6); }
    ctx.globalAlpha = 1;
    if (this.hand) { ctx.save(); ctx.font = `${Math.round(Math.min(56, W * 0.1))}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = '#000'; ctx.fillText('👆', this.hand.x, this.hand.y); ctx.restore(); }
  }
  drawKits(ctx) {
    for (const c of this.cards) {
      ctx.save();
      ctx.fillStyle = '#16304e'; ctx.strokeStyle = '#7fc8ff'; ctx.lineWidth = 3;
      rr(ctx, c.x - c.w / 2, c.y - c.h / 2, c.w, c.h, 16); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(127,200,255,.18)'; ctx.lineWidth = 1; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(c.x - c.w / 2, c.y - c.h / 2 + i * c.h / 6); ctx.lineTo(c.x + c.w / 2, c.y - c.h / 2 + i * c.h / 6); ctx.stroke(); }
      drawBot(ctx, { kind: c.kind, color: '#7fc8ff' }, c.x, c.y - c.h * 0.02, c.h * 0.55, this.t, {});
      ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(c.w * 0.14)}px Andika, sans-serif`; ctx.textAlign = 'center'; ctx.fillText(KINDS[c.kind].name, c.x, c.y + c.h * 0.44);
      ctx.restore();
    }
  }
  drawCans(ctx) {
    for (const c of this.cans) {
      const x = c.x - c.w / 2, y = c.y - c.w / 2;
      if (this.canSel === c.color) { ctx.fillStyle = '#6be675'; rr(ctx, x - 6, y - 10, c.w + 12, c.w * 1.4 + 16, 12); ctx.fill(); }
      ctx.fillStyle = '#c9c9d1'; rr(ctx, x, y, c.w, c.w * 1.1, 8); ctx.fill();
      ctx.fillStyle = c.color; rr(ctx, x + 4, y + c.w * 0.18, c.w - 8, c.w * 0.5, 6); ctx.fill();
      ctx.fillStyle = c.color; ctx.beginPath(); ctx.ellipse(c.x, y + 6, c.w / 2 - 4, 6, 0, 0, 7); ctx.fill();
      // the color word (reading!)
      ctx.fillStyle = '#fff8ea'; rr(ctx, x + 2, y + c.w * 0.74, c.w - 4, c.w * 0.32, 6); ctx.fill();
      ctx.fillStyle = '#1a1020'; ctx.font = `700 ${Math.round(Math.min(20, c.w * 0.26))}px Andika, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(c.word, c.x, y + c.w * 0.9);
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
      ctx.fillStyle = '#f4efe6'; ctx.font = `700 ${Math.round(Math.max(11, c.w * 0.18))}px Andika, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const labels = { legs: ['servo', 'legs'], body: ['control', 'frame'], arms: ['arm', 'linkages'], head: ['hinged', 'head'], eyes: ['light', 'sensors'], bow: ['power', 'module'] };
      labels[c.part].forEach((line, row) => ctx.fillText(line, x + c.w / 2, y + c.w + 3 + row * 15, c.w + 5));
      ctx.restore();
    }
  }
  drawLever(ctx) {
    const b = this.leverBox, x = b.x, y = b.y;
    ctx.save();
    ctx.fillStyle = '#3a3f46'; rr(ctx, x - 28, y - b.h / 2, 56, b.h, 12); ctx.fill();
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(x - 20, y + b.h / 2 - 14 - (b.h - 28) * this.lever, 40, 8);
    const a = -0.9 + this.lever * 1.8;
    ctx.translate(x, y + b.h * 0.25); ctx.rotate(a);
    ctx.strokeStyle = '#c9ced6'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -b.h * 0.55); ctx.stroke();
    ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(0, -b.h * 0.55, 16, 0, 7); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ffd84a'; ctx.font = '700 18px Andika, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('HOLD', x, y + b.h / 2 + 22);
  }
  drawNames(ctx) {
    for (const b of this.nameBtns) {
      if (this.nameSel === b.name) { ctx.fillStyle = '#6be675'; rr(ctx, b.x - b.w / 2 - 6, b.y - b.h / 2 - 6, b.w + 12, b.h + 12, 22); ctx.fill(); }
      ctx.fillStyle = '#ffd84a'; rr(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 18); ctx.fill();
      ctx.fillStyle = '#2a1600'; ctx.font = `700 ${Math.round(Math.min(28, b.w * 0.18))}px Andika, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.name, b.x, b.y);
    }
  }
  drawPowers(ctx, W, H) {
    // panel: three powers with bars
    const pw = Math.min(300, W * 0.34), px = this.portrait ? (W - pw) / 2 : W - pw - 16, py = this.portrait ? this.top : this.top + 4;
    const rowH = 46, ph = 44 + POWERS.length * rowH;
    if (!this.portrait || this.phase !== 'powers') {
      ctx.save(); ctx.fillStyle = 'rgba(15,20,30,.88)'; rr(ctx, px, py, pw, ph, 18); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 18px Fredoka, Andika, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(`${this.bot.name || 'Your robot'}'s powers`, px + 14, py + 22);
      POWERS.forEach((P, i) => {
        const y = py + 44 + i * rowH, v = this.bot.powers[P.id] || 0, active = this.phase === 'powers' && i === this.powerI;
        ctx.fillStyle = active ? '#ffd84a' : '#e6eaf2'; ctx.font = '600 15px Fredoka, Andika, sans-serif'; ctx.fillText(`${P.icon} ${P.label}`, px + 14, y + 8);
        for (let k = 0; k < 5; k++) { ctx.fillStyle = k < v ? ['#ffcf4a', '#4fb6ff', '#7ed957'][i] : '#3a4558'; rr(ctx, px + pw * 0.5 + k * (pw * 0.46 / 5), y, pw * 0.46 / 5 - 4, 16, 3); ctx.fill(); }
        if (active) { ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2; rr(ctx, px + 6, y - 8, pw - 12, rowH - 6, 10); ctx.stroke(); }
      });
      ctx.restore();
    }
    if (this.phase !== 'powers') return;
    const P = POWERS[this.powerI]; if (!P) return;
    ctx.save();
    ctx.fillStyle = '#fff8ea'; ctx.font = '700 17px Andika, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`${P.icon} ${P.label}: ${P.help}. Pick a number, then solve to lock it!`, W / 2, this.levelBtns[0].y - this.levelBtns[0].h / 2 - 14);
    for (const b of this.levelBtns) {
      ctx.fillStyle = this.powerSel === b.v ? '#6be675' : '#ffd84a'; rr(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 14); ctx.fill();
      ctx.fillStyle = '#2a1600'; ctx.font = `700 ${Math.round(b.w * 0.5)}px Fredoka, Andika, sans-serif`; ctx.textBaseline = 'middle'; ctx.fillText(String(b.v), b.x, b.y + 2);
    }
    ctx.restore();
  }
  /** For grown-ups watching: what's happening right now. */
  coach() {
    if (this.phase === 'build' && !this.loose) return `Let ${this.env.store.data.name || 'them'} tap the glowing crate and read/solve it out loud. Encourage sounding out — don't give the answer.`;
    if (this.loose) return 'Point at the dotted outline on the robot so they know where the part goes.';
    if (this.phase === 'paint') return 'Each paint can has a color word. Let them read it (tap once to hear it, twice to pick).';
    if (this.phase === 'powers') return 'They pick a power level (1–5) and solve a math problem to lock it in. Bigger = harder chase next level.';
    return '';
  }
}

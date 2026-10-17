// Sounds for Rusty's After Hours.
// Short effects are real recordings from Kenney's free "Interface Sounds" pack (CC0, public domain — see
// /games/rustys-after-hours/audio/KENNEY-LICENSE.txt). Footsteps, servo whirs, ambience and music are made live
// with the Web Audio API, and change with the scare tier:
//   Gentle: a bouncy music-box party tune. Spooky-lite: a low hum + creaks. Spooky: a deep drone, clanks, stingers.
// If a recording is missing or the device can't play it, the generated sound plays instead.
const BASE = '/games/rustys-after-hours/audio/';
const FILES = ['click', 'correct', 'wrong', 'door', 'close', 'pickup', 'power', 'glitch', 'glitch2', 'snap', 'bong', 'scratch', 'win', 'switch'];

export const Sfx = {
  ctx: null, master: null, noiseBuf: null, ambient: null, buf: {}, tier: 1,

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 1.0;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.loadFiles();
  },
  setTier(t) { this.tier = t; if (this.ambient) { this.stopAmbient(); this.startAmbient(); } },
  /** Grown-up's talking: game sounds get quieter. */
  duck(on) { if (this.master) this.master.gain.setTargetAtTime(on ? 0.25 : 0.9, this.ctx.currentTime, 0.1); },

  loadFiles() {
    for (const n of FILES) {
      fetch(BASE + n + '.mp3').then(r => (r.ok ? r.arrayBuffer() : null)).then(a => {
        if (!a) return;
        // Safari still wants the old callback form
        const p = this.ctx.decodeAudioData(a, b => { this.buf[n] = b; }, () => {});
        if (p && p.then) p.then(b => { this.buf[n] = b; }).catch(() => {});
      }).catch(() => {});
    }
  },
  /** Play a recording. Returns false when it isn't loaded (so the caller can make a sound instead). */
  play(name, vol = 0.7, rate = 1, pan = 0) {
    const b = this.ctx && this.buf[name]; if (!b) return false;
    const s = this.ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = rate;
    s.connect(this._out(pan, vol)); s.start();
    return true;
  },

  _out(pan = 0, vol = 1) {
    const g = this.ctx.createGain(); g.gain.value = vol;
    if (this.ctx.createStereoPanner) { const p = this.ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); p.connect(this.master); }
    else g.connect(this.master);
    return g;
  },
  _noise(dest, t, dur, freq, type = 'lowpass', q = 1, vol = 1, endFreq = null) {
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (endFreq) f.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  },
  _tone(dest, t, dur, freq, type = 'sine', vol = 0.5, endFreq = null) {
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  },

  /** Animatronic footstep: heavy thump + metal clank + a little servo whir. Gentle tier: a soft boing-boop step. */
  footstep(pan, vol, heavy = 1) {
    if (!this.ctx || vol <= 0.01) return;
    const t = this.ctx.currentTime, out = this._out(pan, vol);
    if (this.tier === 0) { this._tone(out, t, 0.12, 260 * heavy, 'triangle', 0.35, 380); return; }
    this._tone(out, t, 0.18, 70 * heavy, 'sine', 0.9, 40);
    this._noise(out, t, 0.12, 400, 'lowpass', 1, 0.7);
    this._noise(out, t + 0.02, 0.07, 2600 + Math.random() * 800, 'bandpass', 8, 0.35);
    if (Math.random() < 0.45) this._noise(out, t + 0.05, 0.22, 900, 'bandpass', 12, 0.18, 2200); // servo whir
  },
  door() { if (this.play('door', 0.8)) return; if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(0, 0.6); this._noise(o, t, 0.5, 900, 'bandpass', 3, 0.6); this._tone(o, t, 0.4, 180, 'sawtooth', 0.15, 90); },
  close() { if (this.play('close', 0.7)) return; this.door(); },
  correct() { if (this.play('correct', 0.7)) return; if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(0, 0.5); [523, 659, 784, 1047].forEach((f, i) => this._tone(o, t + i * 0.09, 0.25, f, 'triangle', 0.5)); },
  wrong() { if (this.play('wrong', 0.5)) return; if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(0, 0.35); this._tone(o, t, 0.25, 300, 'triangle', 0.4, 220); this._tone(o, t + 0.2, 0.3, 220, 'triangle', 0.4, 180); },
  pickup() { if (this.play('pickup', 0.6, 1.1)) return; if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(0, 0.4); this._tone(o, t, 0.12, 880, 'square', 0.25); this._tone(o, t + 0.08, 0.2, 1320, 'square', 0.25); },
  power() { if (!this.ctx) return; this.play('power', 0.7); const t = this.ctx.currentTime, o = this._out(0, 0.35); this._tone(o, t, 0.6, 200, 'sawtooth', 0.3, 900); this._tone(o, t + 0.1, 0.5, 400, 'triangle', 0.3, 1600); },
  snap() { if (this.play('snap', 0.8)) return; this.pickup(); },
  light() { if (this.play('switch', 0.6)) return; this.click(); },
  vanish(pan = 0) {
    if (!this.ctx) return;
    if (this.tier === 0) { const t = this.ctx.currentTime, o = this._out(pan, 0.45); [880, 660, 990, 1320].forEach((f, i) => this._tone(o, t + i * 0.07, 0.15, f, 'triangle', 0.4)); return; } // giggle
    this.play(Math.random() < 0.5 ? 'glitch' : 'glitch2', 0.8, 1, pan);
    const t = this.ctx.currentTime, o = this._out(pan, 0.5); this._tone(o, t, 0.6, 900, 'sawtooth', 0.25, 60); this._noise(o, t, 0.6, 3000, 'highpass', 1, 0.3);
  },
  click() { if (this.play('click', 0.5)) return; if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(0, 0.3); this._noise(o, t, 0.04, 3000, 'bandpass', 4, 0.6); },
  /** Caught. Gentle: a silly "tag!" jingle. Spooky-lite: a short "gotcha" sting. Spooky: the full jump-scare screech. */
  scream(full = true) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (this.tier === 0) { const o = this._out(0, 0.5); [523, 784, 659, 1047].forEach((f, i) => this._tone(o, t + i * 0.1, 0.18, f, 'square', 0.25)); this._tone(o, t + 0.45, 0.4, 300, 'triangle', 0.3, 900); return; }
    const o = this._out(0, full ? 0.85 : 0.4);
    this.play('glitch', full ? 1 : 0.6, 0.7);
    this._noise(o, t, full ? 1.2 : 0.5, 1800, 'bandpass', 0.7, 1);
    this._tone(o, t, full ? 1.1 : 0.5, 600, 'sawtooth', 0.4, 300);
    if (full) this._tone(o, t, 1.1, 640, 'square', 0.25, 280);
  },
  heartbeat(vol) { if (!this.ctx || this.tier === 0) return; const t = this.ctx.currentTime, o = this._out(0, vol); this._tone(o, t, 0.15, 55, 'sine', 0.9, 40); this._tone(o, t + 0.22, 0.15, 50, 'sine', 0.7, 38); },
  win() { if (!this.ctx) return; this.play('win', 0.6); const t = this.ctx.currentTime, o = this._out(0, 0.4); [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => this._tone(o, t + i * 0.13, 0.3, f, 'triangle', 0.5)); },
  /** "It's alive!" — the built animatronic wakes up. */
  alive() { if (!this.ctx) return; this.play('power', 0.9, 0.8); const t = this.ctx.currentTime, o = this._out(0, 0.5); this._noise(o, t, 0.9, 300, 'bandpass', 6, 0.4, 3000); if (this.tier > 0) { this.play('glitch2', 0.8, 0.8); this._tone(o, t + 0.5, 0.8, 110, 'sawtooth', 0.3, 55); } },

  // ------------------------------------------------ background
  startAmbient() {
    if (!this.ctx || this.ambient) return;
    const ctx = this.ctx, g = ctx.createGain(); g.connect(this.master);
    const A = { g, nodes: [], timers: [] };
    if (this.tier === 0) {
      // music box party tune
      g.gain.value = 0.08;
      const notes = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1047, 988, 784, 659, 587];
      let i = 0;
      const tick = () => { if (!this.ambient) return; const t = ctx.currentTime; this._tone(g, t, 0.35, notes[i % notes.length], 'triangle', 0.5); if (i % 4 === 0) this._tone(g, t, 0.5, notes[i % notes.length] / 4, 'sine', 0.4); i++; };
      A.timers.push(setInterval(tick, 300));
    } else {
      g.gain.value = this.tier === 2 ? 0.07 : 0.05;
      const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = this.tier === 2 ? 41 : 55;
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = this.tier === 2 ? 82.7 : 110.6;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 180;
      o1.connect(f); o2.connect(f); f.connect(g); o1.start(); o2.start();
      A.nodes.push(o1, o2);
      // creaks, distant clanks, a far-off music box that is out of tune
      const extra = () => {
        if (!this.ambient) return;
        const t = ctx.currentTime, o = this._out((Math.random() - 0.5) * 1.6, 0.18 + Math.random() * 0.12);
        const r = Math.random();
        if (r < 0.4) this._noise(o, t, 0.8, 500, 'bandpass', 18, 0.4, 900);        // creak
        else if (r < 0.7) { this._tone(o, t, 0.25, 220, 'square', 0.15, 180); this._noise(o, t, 0.1, 2500, 'bandpass', 10, 0.3); } // clank
        else if (this.tier === 2) this.play('scratch', 0.25, 0.6, (Math.random() - 0.5) * 1.6);
        else [659, 622, 587].forEach((n, k) => this._tone(o, t + k * 0.4, 0.35, n, 'triangle', 0.12)); // sad music box
      };
      A.timers.push(setInterval(extra, this.tier === 2 ? 5200 : 7800));
    }
    this.ambient = A;
  },
  stopAmbient() {
    const A = this.ambient; if (!A) return;
    A.timers.forEach(clearInterval);
    A.nodes.forEach(n => { try { n.stop(); } catch (e) {} });
    try { A.g.disconnect(); } catch (e) {}
    this.ambient = null;
  },
};

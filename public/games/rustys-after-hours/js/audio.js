// All sound effects are generated live with the Web Audio API (no audio files needed).

export const Sfx = {
  ctx: null, master: null, noiseBuf: null, ambient: null,

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 1.0;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  },

  _out(pan = 0, vol = 1) {
    const g = this.ctx.createGain(); g.gain.value = vol;
    if (this.ctx.createStereoPanner) { const p = this.ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); p.connect(this.master); }
    else g.connect(this.master);
    return g;
  },
  _noise(dest, t, dur, freq, type = 'lowpass', q = 1, vol = 1) {
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  },
  _tone(dest, t, dur, freq, type = 'sine', vol = 0.5, endFreq = null) {
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  },

  // Heavy robot footstep: thump + metal clank. pan -1..1, vol 0..1
  footstep(pan, vol, heavy = 1) {
    if (!this.ctx || vol <= 0.01) return;
    const t = this.ctx.currentTime, out = this._out(pan, vol);
    this._tone(out, t, 0.18, 70 * heavy, 'sine', 0.9, 40);
    this._noise(out, t, 0.12, 400, 'lowpass', 1, 0.7);
    this._noise(out, t + 0.02, 0.07, 2600 + Math.random() * 800, 'bandpass', 8, 0.35);
  },
  door() { if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(0, 0.6); this._noise(o, t, 0.5, 900, 'bandpass', 3, 0.6); this._tone(o, t, 0.4, 180, 'sawtooth', 0.15, 90); },
  correct() { if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(0, 0.5); [523, 659, 784, 1047].forEach((f, i) => this._tone(o, t + i * 0.09, 0.25, f, 'triangle', 0.5)); },
  wrong() { if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(0, 0.35); this._tone(o, t, 0.25, 300, 'triangle', 0.4, 220); this._tone(o, t + 0.2, 0.3, 220, 'triangle', 0.4, 180); },
  pickup() { if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(0, 0.4); this._tone(o, t, 0.12, 880, 'square', 0.25); this._tone(o, t + 0.08, 0.2, 1320, 'square', 0.25); },
  power() { if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(0, 0.5); this._tone(o, t, 0.6, 200, 'sawtooth', 0.3, 900); this._tone(o, t + 0.1, 0.5, 400, 'triangle', 0.3, 1600); },
  vanish(pan = 0) { if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(pan, 0.6); this._tone(o, t, 0.6, 900, 'sawtooth', 0.25, 60); this._noise(o, t, 0.6, 3000, 'highpass', 1, 0.3); },
  click() { if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(0, 0.3); this._noise(o, t, 0.04, 3000, 'bandpass', 4, 0.6); },
  scream(full = true) {
    if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(0, full ? 0.8 : 0.35);
    this._noise(o, t, full ? 1.2 : 0.5, 1800, 'bandpass', 0.7, 1);
    this._tone(o, t, full ? 1.1 : 0.5, 600, 'sawtooth', 0.4, 300);
    if (full) this._tone(o, t, 1.1, 640, 'square', 0.25, 280);
  },
  heartbeat(vol) { if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(0, vol); this._tone(o, t, 0.15, 55, 'sine', 0.9, 40); this._tone(o, t + 0.22, 0.15, 50, 'sine', 0.7, 38); },
  win() { if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(0, 0.5); [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => this._tone(o, t + i * 0.13, 0.3, f, 'triangle', 0.5)); },

  startAmbient() {
    if (!this.ctx || this.ambient) return;
    const g = this.ctx.createGain(); g.gain.value = 0.05; g.connect(this.master);
    const o1 = this.ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 55;
    const o2 = this.ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 110.6;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 180;
    o1.connect(f); o2.connect(f); f.connect(g); o1.start(); o2.start();
    this.ambient = { g, o1, o2 };
  },
  stopAmbient() { if (!this.ambient) return; try { this.ambient.o1.stop(); this.ambient.o2.stop(); } catch (e) {} this.ambient = null; },
};

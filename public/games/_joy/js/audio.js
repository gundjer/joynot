// Sound effects + a soft background tune, made live with Web Audio (no sound files to download).
// iPhone/iPad only allow sound after a tap, so init() is called from the PLAY button.

export const Sfx = {
  ctx: null, master: null, music: null, enabled: true,

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { return; }
    this.master = this.ctx.createGain(); this.master.gain.value = 0.8; this.master.connect(this.ctx.destination);
    try { const b = this.ctx.createBuffer(1, 1, 22050), s = this.ctx.createBufferSource(); s.buffer = b; s.connect(this.master); s.start(0); } catch (e) {}
  },

  _tone(t, dur, freq, type = 'sine', vol = 0.4, endFreq = null, dest = null) {
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  _noise(t, dur, vol = 0.2) {
    const n = Math.floor(this.ctx.sampleRate * dur), b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = this.ctx.createBufferSource(); s.buffer = b;
    const g = this.ctx.createGain(); g.gain.value = vol; s.connect(g); g.connect(this.master); s.start(t);
  },
  _run(fn) { if (!this.ctx || !this.enabled) return; try { fn(this.ctx.currentTime); } catch (e) {} },

  click() { this._run(t => this._tone(t, 0.07, 1100, 'sine', 0.14)); },
  pop() { this._run(t => this._tone(t, 0.09, 500, 'sine', 0.25, 1200)); },
  drop() { this._run(t => this._tone(t, 0.1, 700, 'triangle', 0.22, 350)); },
  coin() { this._run(t => { this._tone(t, 0.08, 1320, 'square', 0.08); this._tone(t + 0.07, 0.25, 1760, 'square', 0.08); }); },
  tick() { this._run(t => this._tone(t, 0.03, 2200, 'square', 0.05)); },
  whoosh() { this._run(t => this._noise(t, 0.25, 0.12)); },
  zap() { this._run(t => { this._tone(t, 0.25, 180, 'sawtooth', 0.12, 900); this._noise(t, 0.15, 0.06); }); },
  correct() { this._run(t => [523, 659, 784, 1047].forEach((f, i) => this._tone(t + i * 0.08, 0.26, f, 'triangle', 0.35))); },
  wrong() { this._run(t => { this._tone(t, 0.18, 392, 'sine', 0.22, 370); this._tone(t + 0.16, 0.28, 349, 'sine', 0.22, 330); }); },
  levelUp() { this._run(t => [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this._tone(t + i * 0.07, 0.4, f, 'triangle', 0.25))); },
  win() { this._run(t => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this._tone(t + i * 0.13, 0.34, f, 'triangle', 0.35))); },
  register() { this._run(t => { this._tone(t, 0.06, 1800, 'square', 0.06); this._tone(t + 0.1, 0.5, 2400, 'sine', 0.2); this._noise(t + 0.05, 0.12, 0.08); }); },

  startMusic() {
    if (!this.ctx || this.music) return;
    const g = this.ctx.createGain(); g.gain.value = 0.07; g.connect(this.master);
    const notes = [523, 587, 659, 784, 880, 1047], bass = [131, 175, 196, 165];
    let step = 0;
    const tick = () => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const t = this.ctx.currentTime + 0.05;
      if (step % 2 === 0 || Math.random() < 0.3) this._tone(t, 0.8, notes[(step * 5 + (step >> 3)) % notes.length], 'sine', 0.45, null, g);
      if (step % 8 === 0) this._tone(t, 2.4, bass[(step / 8) % bass.length], 'triangle', 0.35, null, g);
      step++;
    };
    this.music = { g, id: setInterval(tick, 360) };
  },
  stopMusic() { if (!this.music) return; clearInterval(this.music.id); try { this.music.g.disconnect(); } catch (e) {} this.music = null; },
};

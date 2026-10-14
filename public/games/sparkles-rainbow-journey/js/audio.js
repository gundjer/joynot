// Happy sound effects + a soft music-box tune, made live with Web Audio (no sound files).
// iPhone/iPad: sound only starts after a tap, so init() is called from the PLAY button.

export const Sfx = {
  ctx: null, master: null, music: null,

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.8; this.master.connect(this.ctx.destination);
    // iOS: play one silent sound inside the tap so later sounds are allowed
    try { const b = this.ctx.createBuffer(1, 1, 22050), s = this.ctx.createBufferSource(); s.buffer = b; s.connect(this.master); s.start(0); } catch (e) {}
  },

  _tone(t, dur, freq, type = 'sine', vol = 0.4, endFreq = null, dest = null) {
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  _run(fn) { if (!this.ctx) return; try { fn(this.ctx.currentTime); } catch (e) {} },

  click() { this._run(t => this._tone(t, 0.08, 1200, 'sine', 0.15)); },
  bean() { this._run(t => { this._tone(t, 0.09, 700, 'sine', 0.3, 1400); this._tone(t + 0.06, 0.1, 1400, 'sine', 0.2, 2000); }); },
  rainbow() { this._run(t => [523, 659, 784, 988, 1175, 1568].forEach((f, i) => this._tone(t + i * 0.06, 0.4, f, 'triangle', 0.25))); },
  gate() { this._run(t => [392, 494, 587, 784].forEach((f, i) => this._tone(t + i * 0.05, 0.5, f, 'sine', 0.25))); },
  correct() { this._run(t => [523, 659, 784, 1047].forEach((f, i) => this._tone(t + i * 0.09, 0.28, f, 'triangle', 0.4))); },
  wrong() { this._run(t => { this._tone(t, 0.2, 440, 'sine', 0.25, 392); this._tone(t + 0.18, 0.3, 392, 'sine', 0.25, 349); }); },
  bump() { this._run(t => this._tone(t, 0.12, 220, 'sine', 0.2, 160)); },
  win() { this._run(t => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this._tone(t + i * 0.14, 0.35, f, 'triangle', 0.4))); },
  hug() { this._run(t => [659, 784, 880, 1047, 1319, 1568].forEach((f, i) => { this._tone(t + i * 0.12, 0.6, f, 'sine', 0.25); this._tone(t + i * 0.12, 0.6, f / 2, 'triangle', 0.12); })); },

  // gentle music-box loop (C major pentatonic)
  startMusic() {
    if (!this.ctx || this.music) return;
    const g = this.ctx.createGain(); g.gain.value = 0.09; g.connect(this.master);
    const notes = [523, 587, 659, 784, 880, 1047], bass = [131, 196, 175, 196];
    let step = 0;
    const tick = () => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const t = this.ctx.currentTime + 0.05;
      if (step % 2 === 0 || Math.random() < 0.35) this._tone(t, 0.9, notes[(step * 3 + (step >> 2)) % notes.length], 'sine', 0.5, null, g);
      if (step % 8 === 0) this._tone(t, 2.2, bass[(step / 8) % bass.length], 'triangle', 0.35, null, g);
      step++;
    };
    this.music = { g, id: setInterval(tick, 330) };
  },
  stopMusic() { if (!this.music) return; clearInterval(this.music.id); try { this.music.g.disconnect(); } catch (e) {} this.music = null; },
};

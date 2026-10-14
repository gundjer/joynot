// Text-to-speech (voices) + speech recognition (the TALK button)

// Voice choice lives in /js/joynot-voice.js (warm natural female voice, or the one picked in Grown-ups → Account).
import { tune, clean } from '/js/joynot-voice.js';

export const Voice = {
  speaking: false,
  speak(text, opts = {}) {
    return new Promise(resolve => {
      if (!('speechSynthesis' in window) || !text) { resolve(); return; }
      try { speechSynthesis.resume(); } catch (e) {}
      const u = tune(new SpeechSynthesisUtterance(clean(text)), opts);
      let done = false;
      const est = 1200 + text.length * 95 / (u.rate || 1);
      const timer = setTimeout(() => finish(), est + 2500);
      const finish = () => { if (done) return; done = true; clearTimeout(timer); this.speaking = false; resolve(); };
      u.onend = finish; u.onerror = finish;
      this.speaking = true;
      speechSynthesis.speak(u);
    });
  },
  stop() { try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) {} this.speaking = false; },
  // iPhone/iPad only allow speech after a tap. Call this inside the first button tap.
  unlock() {
    if (this._unlocked || !('speechSynthesis' in window)) return;
    this._unlocked = true;
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) {}
  },
};

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

export const Ears = {
  supported: !!SR,
  active: null,
  // test hook: window.__fakeHear = ['cat'] makes the next listen() return that
  listen(maxMs = 7000) {
    return new Promise(resolve => {
      if (window.__fakeHear) { const a = window.__fakeHear; window.__fakeHear = null; setTimeout(() => resolve({ ok: true, error: null, alts: a }), 300); return; }
      if (!SR) { resolve({ ok: false, error: 'unsupported', alts: [] }); return; }
      Voice.stop();
      const r = new SR();
      r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 5; r.continuous = false;
      const alts = []; let err = null; let settled = false;
      const finish = () => { if (settled) return; settled = true; clearTimeout(t); this.active = null; resolve({ ok: alts.length > 0, error: err, alts }); };
      r.onresult = e => {
        for (const res of e.results) for (let i = 0; i < res.length; i++) alts.push(String(res[i].transcript).toLowerCase().trim());
      };
      r.onerror = e => { err = e.error; };
      r.onend = finish;
      const t = setTimeout(() => { try { r.stop(); } catch (e) {} setTimeout(finish, 900); }, maxMs);
      try { r.start(); this.active = r; } catch (e) { err = 'start'; finish(); }
    });
  },
  stop() { try { this.active && this.active.stop(); } catch (e) {} },
};

// Read-aloud voice (text-to-speech). Built into iPhone, iPad, Android, Chrome, Edge and Safari — nothing to install.
// The voice is chosen by /js/joynot-voice.js: the warmest natural female voice on the device,
// or the one a grown-up picked in Grown-ups → Account.
import { tune, clean } from '/js/joynot-voice.js';

export const Voice = {
  speaking: false,
  enabled: true,
  _id: 0,
  speak(text, opts = {}) {
    return new Promise(resolve => {
      if (!this.enabled && !opts.force) { resolve(); return; }
      if (!('speechSynthesis' in window) || !text) { resolve(); return; }
      const id = ++this._id;
      try { speechSynthesis.cancel(); speechSynthesis.resume(); } catch (e) {}
      const said = clean(text);
      const u = tune(new SpeechSynthesisUtterance(said), opts);
      let done = false;
      const timer = setTimeout(() => finish(), 2500 + said.length * 120 / (u.rate || 1));
      const finish = () => { if (done) return; done = true; clearTimeout(timer); if (id === this._id) this.speaking = false; resolve(); };
      u.onend = finish; u.onerror = finish;
      this.speaking = true;
      // Chrome on Android sometimes drops an utterance spoken right after cancel()
      setTimeout(() => { try { speechSynthesis.speak(u); } catch (e) { finish(); } }, 60);
    });
  },
  stop() { this._id++; try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) {} this.speaking = false; },
  unlock() {
    if (this._unlocked || !('speechSynthesis' in window)) return;
    this._unlocked = true;
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) {}
  },
};

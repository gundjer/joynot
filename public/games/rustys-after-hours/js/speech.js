// Text-to-speech (voices) + speech recognition (the TALK button)

// Voice choice lives in /js/joynot-voice.js (warm natural female voice, or the one picked in Grown-ups → Account).
// Animatronics can ask for a different natural voice (opts.voice: 'deep' | 'bright' | 'warm') so they sound like
// costumed performers instead of a robot. If the device has no such voice, the normal JoyNot voice is used.
import { tune, clean, isAuto } from '/js/joynot-voice.js';

const NATURAL = /(natural|premium|enhanced|neural|online)/i;
const DEEP = /\b(guy|andrew|brian|christopher|eric|roger|steffan|davis|tony|aaron|arthur|daniel|evan|nathan|tom)\b|en-us-x-(iom|tpd|iol)/i;
const BRIGHT = /\b(ana|emma|jenny|aria|ava|zoe|nicky|samantha)\b|en-us-x-(tpc|sfg)/i;
function voiceFor(kind) {
  // a grown-up or kid picked a voice (or the device's own voice): use that one for everybody
  if (!kind || !isAuto() || !('speechSynthesis' in window)) return null;
  let list = []; try { list = speechSynthesis.getVoices().filter(v => /^en([-_]|$)/i.test(v.lang || '')); } catch (e) { return null; }
  const re = kind === 'deep' ? DEEP : kind === 'bright' ? BRIGHT : null; if (!re) return null;
  const ok = v => re.test(v.name) || re.test(v.voiceURI || '');
  // no Google online voices (the text would go to Google)
  const local = list.filter(v => !(/google/i.test(v.name) && v.localService === false));
  return local.find(v => ok(v) && NATURAL.test(v.name)) || local.find(ok) || null;
}

export const Voice = {
  speaking: false,
  /** Called with (text, opts) every time something is said — grown-ups playing along hear the same lines. */
  onSpeak: null,
  speak(text, opts = {}) {
    try { this.onSpeak && text && this.onSpeak(String(text), opts); } catch (e) {}
    return new Promise(resolve => {
      if (!('speechSynthesis' in window) || !text) { resolve(); return; }
      try { speechSynthesis.resume(); } catch (e) {}
      const u = tune(new SpeechSynthesisUtterance(clean(text)), opts);
      const v = voiceFor(opts.voice); if (v) { u.voice = v; u.lang = v.lang; }
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

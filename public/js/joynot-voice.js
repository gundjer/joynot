// JoyNot read-aloud voice: picks the warmest, most natural female English voice on this device.
// Used by every game, by the voice picker in Grown-ups → Account, and by the 🗣️ Voice button inside games.
// Any voice installed on the phone, tablet or computer can be picked, or "This device's own voice" (the one set in the
// device's settings). The choice is saved on this device (voices differ per phone/tablet/computer).
export const DEVICE = '__device__';

const PREF_KEY = 'joynot_voice_v1';

let voices = [];
const listeners = [];
function loadVoices() {
  try { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; } catch (e) { voices = []; }
  listeners.forEach(fn => { try { fn(voices); } catch (e) {} });
}
if ('speechSynthesis' in window) {
  loadVoices();
  try { speechSynthesis.addEventListener('voiceschanged', loadVoices); } catch (e) { try { speechSynthesis.onvoiceschanged = loadVoices; } catch (e2) {} }
}

// Best first. Natural/neural voices sound like a real person; the rest are the best female fallbacks per platform.
const RANK = [
  // Edge (Windows, Mac, Android) — neural voices, very human
  /microsoft (ava|jenny|aria|emma|michelle|sonia|libby|natasha|clara)\b.*(natural|online)/i,
  // iPhone / iPad / Mac — premium & enhanced voices (Settings → Accessibility → Spoken Content → Voices)
  /^(ava|zoe|samantha|allison|susan|nicky|serena|karen|moira|tessa|kate|stephanie)\b.*\(premium\)/i,
  /^(ava|zoe|samantha|allison|susan|nicky|serena|karen|moira|tessa|kate|stephanie)\b.*\(enhanced\)/i,
  // Android Google voices (female ids)
  /en-us-x-(tpc|sfg|iob|iog|tpf)/i,
  // Apple standard female voices
  /^samantha\b/i,
  /^(ava|allison|susan|zoe|nicky|karen|moira|tessa|serena|kate|victoria)\b/i,
  // Windows offline
  /microsoft (zira|hazel|susan|catherine|linda|heera)/i,
];
// Joke / robotic voices that come with Apple & ChromeOS — never pick these automatically
const AVOID = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|junior|ralph|fred|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley|novelty|david|mark|guy|daniel|alex|aaron|arthur|gordon|rishi|tom|male)\b/i;

const english = () => voices.filter(v => /^en([-_]|$)/i.test(v.lang || ''));

function score(v) {
  if (AVOID.test(v.name)) return 999;
  // No Google servers: Chrome's "Google …" desktop voices run online (the text goes to Google), so never pick them on our own.
  if (/google/i.test(v.name) && v.localService === false) return 998;
  for (let i = 0; i < RANK.length; i++) if (RANK[i].test(v.name) || RANK[i].test(v.voiceURI || '')) return i * 2 + (/en[-_]US/i.test(v.lang) ? 0 : 1);
  if (/female|woman/i.test(v.name)) return 40;
  return /en[-_]US/i.test(v.lang) ? 60 : 70;
}

export function sortedVoices() {
  return english().slice().sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name));
}

export function getPref() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch (e) { return {}; }
}
export function setPref(p) {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch (e) {}
}

/** Every voice installed on this device: English first (best first), then the other languages. */
export function allVoices() {
  const en = sortedVoices(), rest = voices.filter(v => !en.includes(v)).sort((a, b) => (a.lang || '').localeCompare(b.lang || '') || a.name.localeCompare(b.name));
  return [...en, ...rest];
}
/** No voice picked: JoyNot chooses (and games may give animatronics their own voices). */
export const isAuto = () => !getPref().name;

export function bestVoice() {
  const pref = getPref();
  if (pref.name === DEVICE) return voices.find(v => v.default) || null; // null → the device's own default voice
  if (pref.name) {
    const hit = voices.find(v => v.name === pref.name);
    if (hit) return hit;
  }
  return sortedVoices()[0] || null;
}

export function onVoices(fn) { listeners.push(fn); if (voices.length) fn(voices); }

// Natural voices sound best at their own pitch. Small, friendly tweaks only.
export function tune(u, opts = {}) {
  const v = bestVoice();
  const pref = getPref();
  if (v) { u.voice = v; u.lang = v.lang; } else if (pref.name !== DEVICE) { u.lang = 'en-US'; }
  const natural = v && /(natural|premium|enhanced|google)/i.test(v.name);
  const speed = Number(pref.rate) || 1; // grown-up's speed setting (0.8 – 1.2)
  u.rate = (opts.rate ?? 0.95) * speed;
  u.pitch = opts.pitch ?? (natural ? 1 : 1.05);
  u.volume = opts.volume ?? 1;
  return u;
}

// Clean text so the voice doesn't read emoji names or symbols out loud.
export function clean(text) {
  return String(text)
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, ' ')
    .replace(/\s+/g, ' ').trim();
}

/**
 * Fill a <select> with: Automatic · This device's own voice · every installed voice (English, then other languages).
 * Keeps the saved choice selected. Used by Grown-ups → Account and the in-game 🗣️ Voice picker.
 */
export function fillVoiceSelect(sel) {
  const keep = getPref().name || '';
  const nice = v => v.name.replace(/^Microsoft /, '').replace(/ Online \(Natural\)/, ' (natural)') + ' · ' + v.lang + (v.default ? ' · device default' : '') + (v.localService === false ? ' · online' : '');
  sel.innerHTML = '';
  const add = (parent, value, text) => { const o = document.createElement('option'); o.value = value; o.textContent = text; parent.appendChild(o); };
  add(sel, '', 'Automatic (JoyNot picks a natural voice)');
  add(sel, DEVICE, "This device's own voice (from its settings)");
  const list = allVoices(), en = sortedVoices();
  const g1 = document.createElement('optgroup'); g1.label = 'English voices on this device';
  en.forEach((v, i) => add(g1, v.name, nice(v) + (i === 0 ? '  ★ best' : '')));
  if (en.length) sel.appendChild(g1);
  const others = list.filter(v => !en.includes(v));
  if (others.length) { const g2 = document.createElement('optgroup'); g2.label = 'Other languages'; others.forEach(v => add(g2, v.name, nice(v))); sel.appendChild(g2); }
  sel.value = keep === DEVICE || list.some(v => v.name === keep) ? keep : '';
  return list.length;
}

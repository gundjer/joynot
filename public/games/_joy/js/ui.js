// Reusable answer pieces: big choice buttons, a number pad, and a time picker.
// All are finger-sized and also work with a keyboard (1–9 for choices, digits + Enter for the pad).
import { el, clockText } from './util.js';
import { Sfx } from './audio.js';

// Key handlers for the current question (cleared each question by the engine)
export const Keys = {
  list: [],
  on(fn) { this.list.push(fn); return fn; },
  clear() { this.list = []; },
  handle(e) { for (const fn of this.list.slice().reverse()) if (fn(e) === true) return true; return false; },
};

/**
 * Big answer buttons.
 * options: [{ value, label, html, cls }]
 * returns { el, buttons, mark(value, 'right'|'wrong'), disable(value), lock() }
 */
export function choices(options, onPick, { cols = 0, size = '', cls = '' } = {}) {
  const box = el('div', { class: `choices ${size} ${cls}`.trim() });
  const n = options.length;
  box.style.setProperty('--cols', cols || (n === 4 ? 2 : n === 2 ? 2 : n >= 5 ? 3 : n));
  if (n === 4 && !cols) box.classList.add('two-by-two');
  const buttons = options.map((opt, i) => {
    const b = el('button', { class: 'choice ' + (opt.cls || ''), type: 'button', 'data-value': String(opt.value) });
    if (opt.html) b.innerHTML = opt.html; else b.textContent = opt.label;
    if (n <= 9) b.appendChild(el('span', { class: 'kbd', 'aria-hidden': 'true' }, String(i + 1)));
    b.addEventListener('click', () => { if (b.disabled || box.classList.contains('locked')) return; Sfx.click(); onPick(opt.value, b, opt); });
    box.appendChild(b);
    return b;
  });
  Keys.on(e => {
    const k = parseInt(e.key, 10);
    if (k >= 1 && k <= buttons.length && !e.ctrlKey && !e.metaKey) { buttons[k - 1].click(); return true; }
    return false;
  });
  const find = v => buttons.find(b => b.dataset.value === String(v));
  return {
    el: box, buttons,
    mark(v, kind) { const b = find(v); if (b) b.classList.add(kind); },
    disable(v) { const b = find(v); if (b) b.disabled = true; },
    lock() { box.classList.add('locked'); },
    unlock() { box.classList.remove('locked'); },
  };
}

/**
 * Number pad. money: digits fill in as cents ("325" = $3.25). unit: word shown after the number.
 * onEnter(value) is called by the ✔ key or the Enter key.
 */
export function numpad({ money = false, maxDigits = 5, unit = '', prefix = '', onEnter = null, onChange = null } = {}) {
  let digits = '';
  const disp = el('div', { class: 'np-display', 'aria-live': 'polite' });
  const show = () => {
    if (money) {
      const c = parseInt(digits || '0', 10);
      disp.innerHTML = digits ? `<b>$${(c / 100).toFixed(2)}</b>` : '<span class="ph">$0.00</span>';
    } else {
      disp.innerHTML = digits ? `${prefix}<b>${digits}</b>${unit ? ` <small>${unit}</small>` : ''}` : `<span class="ph">${prefix}?${unit ? ' ' + unit : ''}</span>`;
    }
    onChange && onChange(value());
  };
  const value = () => (digits === '' ? null : parseInt(digits, 10));
  const press = k => {
    if (k === 'back') digits = digits.slice(0, -1);
    else if (k === 'ok') { onEnter && onEnter(value()); return; }
    else if (digits.length < maxDigits) digits = (digits === '0' ? '' : digits) + k;
    Sfx.click(); show();
  };
  const keys = el('div', { class: 'np-keys' });
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'ok'].forEach(k => {
    keys.appendChild(el('button', { type: 'button', class: 'np-key ' + k, 'aria-label': k === 'back' ? 'Erase' : k === 'ok' ? 'Done' : k, onclick: () => press(k) }, k === 'back' ? '⌫' : k === 'ok' ? '✔' : k));
  });
  const box = el('div', { class: 'numpad' }, [disp, keys]);
  Keys.on(e => {
    if (/^[0-9]$/.test(e.key)) { press(e.key); return true; }
    if (e.key === 'Backspace') { press('back'); return true; }
    if (e.key === 'Enter') { press('ok'); return true; }
    return false;
  });
  show();
  return { el: box, value, clear() { digits = ''; show(); }, set(v) { digits = v === null ? '' : String(v); show(); } };
}

/** Hour : minute steppers (+ optional AM/PM). Value is minutes since midnight. */
export function timeEntry({ start = 12 * 60, step = 5, ampm = false, onChange = null } = {}) {
  let v = start;
  const hEl = el('div', { class: 'te-val' }), mEl = el('div', { class: 'te-val' });
  const apBtn = el('button', { type: 'button', class: 'te-ap' });
  const draw = () => {
    const t = clockText(v); const [h, m] = t.split(':');
    hEl.textContent = h; mEl.textContent = m;
    apBtn.textContent = v >= 720 ? 'PM' : 'AM';
    onChange && onChange(v);
  };
  const add = d => { v = ((v + d) % 1440 + 1440) % 1440; Sfx.tick(); draw(); };
  const addHour = d => { if (!ampm) { const h = Math.floor(v / 60), m = v % 60; const nh = ((h % 12) + d + 12) % 12 + (h >= 12 ? 12 : 0); v = nh * 60 + m; Sfx.tick(); draw(); } else add(d * 60); };
  const addMin = d => { const h = Math.floor(v / 60), m = v % 60; const nm = (m + d * step + 60) % 60; v = h * 60 + nm; Sfx.tick(); draw(); };
  const col = (val, up, down, label) => el('div', { class: 'te-col' }, [
    el('button', { type: 'button', class: 'te-btn', 'aria-label': label + ' up', onclick: up }, '▲'), val,
    el('button', { type: 'button', class: 'te-btn', 'aria-label': label + ' down', onclick: down }, '▼'),
  ]);
  apBtn.addEventListener('click', () => add(v >= 720 ? -720 : 720));
  const box = el('div', { class: 'time-entry' }, [
    col(hEl, () => addHour(1), () => addHour(-1), 'Hour'), el('div', { class: 'te-colon' }, ':'),
    col(mEl, () => addMin(1), () => addMin(-1), 'Minutes'),
    ampm ? el('div', { class: 'te-col ap' }, [apBtn]) : null,
  ]);
  draw();
  return { el: box, get: () => v, set(x) { v = x; draw(); } };
}

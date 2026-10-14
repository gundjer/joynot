// Small helpers shared by every JoyNot learning game.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** el('div', { class: 'x', onclick: fn, text: 'hi' }, [children]) */
export function el(tag, attrs = {}, kids = []) {
  const svgTags = el.SVG;
  const e = svgTags.has(tag) ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') { for (const [sk, sv] of Object.entries(v)) { if (sk.startsWith('--')) e.style.setProperty(sk, sv); else e.style[sk] = sv; } }
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(e.dataset, v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(kids)) {
    if (c === null || c === undefined || c === false) continue;
    e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  return e;
}
el.SVG = new Set(['svg', 'g', 'circle', 'ellipse', 'rect', 'line', 'path', 'polygon', 'polyline', 'text', 'tspan', 'defs', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'use', 'pattern', 'title']);

export const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const chance = p => Math.random() < p;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/** n different items from arr */
export const sample = (arr, n) => shuffle(arr).slice(0, n);
export const sleep = ms => new Promise(r => setTimeout(r, ms));

/** 4 answer choices: the right one + close wrong ones, shuffled. make(i) builds a candidate. */
export function choicesAround(answer, makeWrong, n = 4, keyOf = x => String(x)) {
  const out = [answer], seen = new Set([keyOf(answer)]);
  for (let tries = 0; out.length < n && tries < 200; tries++) {
    const w = makeWrong(tries);
    if (w === null || w === undefined) continue;
    const k = keyOf(w);
    if (!seen.has(k)) { seen.add(k); out.push(w); }
  }
  return shuffle(out);
}

/** Wrong numbers near a right number (never negative). */
export function nearNumbers(n, spread = 3, step = 1) {
  return () => { const d = rand(1, spread) * step * (chance(0.5) ? 1 : -1); const v = n + d; return v < 0 ? null : v; };
}

// ---------------------------------------------------------------- money + time text
/** 325 -> "$3.25" */
export const money = cents => {
  cents = Math.round(cents);
  return (cents < 0 ? '-$' : '$') + (Math.abs(cents) / 100).toFixed(2);
};
export const centsText = c => (c < 100 ? c + '¢' : money(c));
/** "$3" for whole dollars, "$3.25" otherwise */
export const dollars = c => (c % 100 === 0 ? '$' + (c / 100) : '$' + (c / 100).toFixed(2));
/** How a person would say an amount: "3 dollars and 25 cents" */
export function sayMoney(c) {
  const d = Math.floor(c / 100), r = c % 100;
  if (!d) return `${r} ${r === 1 ? 'cent' : 'cents'}`;
  const ds = `${d} ${d === 1 ? 'dollar' : 'dollars'}`;
  return r ? `${ds} and ${r} ${r === 1 ? 'cent' : 'cents'}` : ds;
}

/** minutes since midnight -> "3:05" (12-hour, no AM/PM) */
export function clockText(min, { ampm = false, h24 = false } = {}) {
  min = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(min / 60), m = min % 60;
  if (h24) return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')}${ampm ? (h < 12 ? ' AM' : ' PM') : ''}`;
}
/** "3 o'clock", "half past 4", "quarter to 8", "10 minutes past 2" */
export function timeWords(min) {
  min = ((min % 720) + 720) % 720;
  const h = Math.floor(min / 60), m = min % 60;
  const hn = x => (x % 12 === 0 ? 12 : x % 12);
  if (m === 0) return `${hn(h)} o'clock`;
  if (m === 15) return `quarter past ${hn(h)}`;
  if (m === 30) return `half past ${hn(h)}`;
  if (m === 45) return `quarter to ${hn(h + 1)}`;
  if (m < 30) return `${m} ${m === 1 ? 'minute' : 'minutes'} past ${hn(h)}`;
  return `${60 - m} ${60 - m === 1 ? 'minute' : 'minutes'} to ${hn(h + 1)}`;
}
/** 95 -> "1 hour 35 minutes" */
export function durationText(min) {
  const h = Math.floor(min / 60), m = min % 60;
  const p = [];
  if (h) p.push(`${h} ${h === 1 ? 'hour' : 'hours'}`);
  if (m || !h) p.push(`${m} ${m === 1 ? 'minute' : 'minutes'}`);
  return p.join(' ');
}

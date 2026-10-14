// US coins and bills drawn as pictures (SVG), real relative sizes: dime < penny < nickel < quarter.
import { el } from './util.js';

export const MONEY = {
  penny:   { cents: 1,    name: 'penny',   plural: 'pennies',  kind: 'coin', ratio: 0.785, metal: 'copper' },
  nickel:  { cents: 5,    name: 'nickel',  plural: 'nickels',  kind: 'coin', ratio: 0.874, metal: 'silver' },
  dime:    { cents: 10,   name: 'dime',    plural: 'dimes',    kind: 'coin', ratio: 0.738, metal: 'silver' },
  quarter: { cents: 25,   name: 'quarter', plural: 'quarters', kind: 'coin', ratio: 1,     metal: 'silver' },
  one:     { cents: 100,  name: 'one-dollar bill',    plural: 'one-dollar bills',    kind: 'bill', label: '1' },
  five:    { cents: 500,  name: 'five-dollar bill',   plural: 'five-dollar bills',   kind: 'bill', label: '5' },
  ten:     { cents: 1000, name: 'ten-dollar bill',    plural: 'ten-dollar bills',    kind: 'bill', label: '10' },
  twenty:  { cents: 2000, name: 'twenty-dollar bill', plural: 'twenty-dollar bills', kind: 'bill', label: '20' },
};
export const COIN_KINDS = ['penny', 'nickel', 'dime', 'quarter'];
export const BILL_KINDS = ['one', 'five', 'ten', 'twenty'];
export const ALL_KINDS = [...BILL_KINDS.slice().reverse(), ...COIN_KINDS.slice().reverse()];

const coinArt = {
  // little pictures in the middle of each coin (tails side) — simple shapes, not real engravings
  penny: '<path d="M38 30 h24 v14 q0 16 -12 22 q-12 -6 -12 -22z" class="art"/>',
  nickel: '<path d="M30 60 h40 M33 60 v-14 M41 60 v-14 M50 60 v-14 M59 60 v-14 M67 60 v-14 M30 46 h40 M36 46 q14 -16 28 0" class="art line"/>',
  dime: '<path d="M50 26 q-6 8 0 14 q6 -6 0 -14z M46 40 h8 l-2 28 h-4z M38 50 q12 4 24 0" class="art"/>',
  quarter: '<path d="M50 34 q-4 0 -4 6 q4 2 8 0 q0 -6 -4 -6z M48 40 l-20 -8 q6 14 20 18 q14 -4 20 -18 l-20 8z M44 56 h12 l-6 12z" class="art"/>',
};
const headArt = '<path d="M56 28 q-14 -2 -18 12 q-2 6 -6 10 q4 2 4 6 q0 4 4 6 q-2 4 2 6 q6 2 10 -2 q0 6 -4 10 h20 q-4 -10 0 -18 q6 -12 -2 -24 q-4 -6 -10 -6z" class="art"/>';

/** A coin or bill element. kind = 'penny' | 'nickel' | 'dime' | 'quarter' | 'one' | 'five' | 'ten' | 'twenty' */
export function moneyPiece(kind, { showValue = true, side = 'tails', label = true } = {}) {
  const m = MONEY[kind];
  const wrap = el('div', { class: `money ${m.kind} ${kind}`, 'data-kind': kind, 'data-cents': m.cents, 'aria-label': m.name, title: m.name });
  if (m.kind === 'coin') {
    wrap.style.setProperty('--r', m.ratio);
    wrap.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="48" class="edge"/>
      <circle cx="50" cy="50" r="41" class="inner"/>
      ${side === 'heads' ? headArt : coinArt[kind]}
      ${showValue ? `<text x="50" y="${side === 'heads' ? 88 : 86}" text-anchor="middle" class="val">${m.cents}¢</text>` : ''}
    </svg>`;
  } else {
    wrap.innerHTML = `<svg viewBox="0 0 220 96" aria-hidden="true">
      <rect x="2" y="2" width="216" height="92" rx="8" class="paper"/>
      <rect x="9" y="9" width="202" height="78" rx="5" class="frame"/>
      <ellipse cx="110" cy="48" rx="30" ry="34" class="oval"/>
      <path d="M116 26 q-12 -2 -16 10 q-2 6 -6 8 q4 2 3 6 q0 4 3 5 q-2 4 2 5 q6 2 9 -2 q0 6 -4 10 h20 q-4 -9 0 -16 q6 -11 -1 -21 q-4 -5 -10 -5z" class="art"/>
      ${showValue ? `<text x="30" y="36" text-anchor="middle" class="val">${m.label}</text><text x="190" y="80" text-anchor="middle" class="val">${m.label}</text><text x="190" y="36" text-anchor="middle" class="val sm">$${m.label}</text><text x="30" y="80" text-anchor="middle" class="val sm">$${m.label}</text>` : ''}
    </svg>`;
  }
  if (label && showValue) wrap.appendChild(el('span', { class: 'mlabel' }, m.kind === 'coin' ? m.name : `$${m.label}`));
  return wrap;
}

/** Fewest pieces to make an amount from the kinds given (greedy works for US money). */
export function fewest(cents, kinds = ALL_KINDS) {
  const ks = kinds.slice().sort((a, b) => MONEY[b].cents - MONEY[a].cents);
  const out = {}; let left = cents;
  for (const k of ks) { const n = Math.floor(left / MONEY[k].cents); if (n) { out[k] = n; left -= n * MONEY[k].cents; } }
  return left === 0 ? out : null;
}
export const countPieces = map => Object.values(map).reduce((a, b) => a + b, 0);
export const totalOf = kinds => kinds.reduce((s, k) => s + MONEY[k].cents, 0);
/** "2 quarters, 1 dime" */
export function piecesText(map) {
  return ALL_KINDS.filter(k => map[k]).map(k => `${map[k]} ${map[k] === 1 ? MONEY[k].name : MONEY[k].plural}`).join(', ');
}

// ---------------------------------------------------------------- worked steps (teaching)
const fmt = c => (c >= 100 ? '$' + (c / 100).toFixed(2) : c + '¢');
const nm = (k, n) => (n === 1 ? MONEY[k].name : MONEY[k].plural);
/** Count a pile: biggest first, keep a running total. pile = ['dime', 'penny', …] or { dime: 2 } */
export function countSteps(pile) {
  const map = Array.isArray(pile) ? pile.reduce((m, k) => ((m[k] = (m[k] || 0) + 1), m), {}) : pile;
  const ks = Object.keys(map).filter(k => map[k]).sort((a, b) => MONEY[b].cents - MONEY[a].cents);
  const out = ['Sort the money: biggest value first.'];
  let t = 0;
  ks.forEach(k => {
    const run = [];
    for (let i = 0; i < map[k]; i++) { t += MONEY[k].cents; run.push(fmt(t)); }
    out.push(`${map[k]} ${nm(k, map[k])} (${MONEY[k].cents >= 100 ? fmt(MONEY[k].cents) : MONEY[k].cents + '¢'} each): count ${run.join(', ')}.`);
  });
  out.push(`Total: ${fmt(t)}.`);
  return out;
}
/** Make an amount: biggest piece that fits, then the next, keeping a running total. */
export function makeSteps(target, kinds, { fewestWords = false } = {}) {
  const map = fewest(target, kinds) || {};
  const ks = Object.keys(map).sort((a, b) => MONEY[b].cents - MONEY[a].cents);
  const out = [fewestWords ? 'For the fewest coins, always use the biggest coin that still fits.' : 'Start with the biggest coin (or bill) that fits.'];
  let t = 0;
  ks.forEach(k => {
    t += map[k] * MONEY[k].cents;
    out.push(`Add ${map[k]} ${nm(k, map[k])}: now ${fmt(t)}${t < target ? `, still need ${fmt(target - t)}` : ''}.`);
  });
  out.push(`${fmt(target)} = ${piecesText(map)}.`);
  return out;
}
/** Making change by counting UP from the price to the money paid (how cashiers do it). */
export function changeSteps(price, paid) {
  const out = [`Start at the price, ${fmt(price)}, and count up to ${fmt(paid)}.`];
  let t = price; const got = {};
  const step = (to, k) => { const n = (to - t) / MONEY[k].cents; if (n > 0) { got[k] = (got[k] || 0) + n; out.push(`Add ${n} ${nm(k, n)} → ${fmt(to)}.`); t = to; } };
  const up = m => Math.min(paid, Math.ceil(t / m) * m);
  // small coins up to the next quarter mark, fewest coins, smallest first (pennies, nickel, dimes)
  const gap = up(25) - t;
  if (gap > 0) { const f = fewest(gap, ['dime', 'nickel', 'penny']) || {}; ['penny', 'nickel', 'dime'].forEach(k => { if (f[k]) step(t + f[k] * MONEY[k].cents, k); }); }
  step(up(100), 'quarter');
  if (paid - t >= 500 && t % 500) step(Math.min(paid, Math.ceil(t / 500) * 500), 'one');
  while (paid - t >= 500) step(t + 500 * Math.floor((paid - t) / 500), 'five');
  if (paid > t) step(paid, 'one');
  out.push(`Change: ${fmt(paid - price)} (${piecesText(got)}).`);
  return out;
}

// Little building blocks for lesson slides (the "I do" part: show and explain before kids try).
import { el } from './util.js';
import { makeClock } from './clock.js';

/** A row of labeled pictures: [['🍎', 'apple'], ...] */
export const pics = items => `<div class="row-items">${items.map(([ic, t]) => `<span class="lab"><span>${ic}</span>${t ? `<span>${t}</span>` : ''}</span>`).join('')}</div>`;
export const big = (t, extra = '') => `<div class="big" ${extra}>${t}</div>`;
export const eq = t => `<div class="eq">${t}</div>`;
export const note = t => `<div class="note">${t}</div>`;
export const stack = (...parts) => `<div style="display:flex;flex-direction:column;align-items:center;gap:8px;width:100%">${parts.join('')}</div>`;

/** Flip through frames (html strings or functions) every ms — for step-by-step demos. */
export function frames(list, ms = 1600) {
  return el0 => {
    let i = 0;
    const draw = () => { const f = list[i % list.length]; el0.innerHTML = typeof f === 'function' ? '' : f; if (typeof f === 'function') f(el0); i++; };
    draw();
    const id = setInterval(draw, ms);
    return () => clearInterval(id);
  };
}

/**
 * A clock demo for lessons. steps: [{ min, glow: 'hour'|'minute', nums: [..], caption }]
 * Each step shows for ms milliseconds, looping.
 */
export function clockDemo(steps, { ms = 2200, colorHands = true, minuteLabels = false, roman = false } = {}) {
  return box => {
    const c = makeClock({ minutes: steps[0].min, colorHands, minuteLabels, roman });
    const cap = el('div', { class: 'note' });
    box.appendChild(el('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' } }, [c.el, cap]));
    let i = 0;
    const go = () => {
      const s = steps[i % steps.length];
      c.set(s.min); c.glowHand(s.glow || null); c.highlight(s.nums || []); c.highlight(s.nums2 || [], 'hl2');
      cap.innerHTML = s.caption || '';
      i++;
    };
    go();
    const id = steps.length > 1 ? setInterval(go, ms) : null;
    return () => id && clearInterval(id);
  };
}

/** Smoothly sweep a clock from a to b minutes (shows the minute hand pulling the hour hand along). */
export function clockSweep(a, b, { colorHands = true, caption = '' } = {}) {
  return box => {
    const c = makeClock({ minutes: a, colorHands });
    box.appendChild(el('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' } }, [c.el, el('div', { class: 'note', html: caption })]));
    let m = a;
    const id = setInterval(() => { m += 1; if (m > b) m = a; c.set(m); }, 45);
    return () => clearInterval(id);
  };
}

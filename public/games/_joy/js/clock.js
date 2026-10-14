// An analog clock (SVG). Can be just a picture, or have hands kids drag with a finger or mouse.
//
//   const c = makeClock({ minutes: 195, interactive: true, snap: 5, linked: true, onChange(min) {} });
//   stage.append(c.el); c.get(); c.set(600);
//
// minutes = minutes since midnight (0–1439). linked = moving the minute hand also moves the hour hand,
// like a real clock. snap = how many minutes each "click" of the minute hand is.
import { el } from './util.js';

const C = 100, R = 92;
const ROMAN = [, 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const polar = (deg, r) => { const a = (deg - 90) * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };

export function makeClock(opts = {}) {
  const o = {
    minutes: 0, interactive: false, snap: 5, linked: true, colorHands: true, numbers: true,
    minuteLabels: false, sky: false, hourOnly: false, size: null, onChange: null, label: 'Clock', ...opts,
  };
  let value = ((o.minutes % 1440) + 1440) % 1440;
  let hourPart = Math.floor(value / 60) % 12, minPart = value % 60; // used when hands are NOT linked

  const svg = el('svg', { viewBox: '0 0 200 200', class: 'joy-clock' + (o.interactive ? ' live' : '') + (o.real ? ' real' : ''), role: o.interactive ? 'slider' : 'img', 'aria-label': o.label, tabindex: o.interactive ? '0' : null });
  if (o.size) svg.style.width = svg.style.height = o.size;
  const sky = el('g', { class: 'sky' });
  if (o.sky) svg.appendChild(sky);
  svg.appendChild(el('circle', { cx: C, cy: C, r: R, class: 'rim' }));
  svg.appendChild(el('circle', { cx: C, cy: C, r: R - 6, class: 'face' + (o.sky ? ' see-through' : '') }));
  for (let i = 0; i < 60; i++) {
    const big = i % 5 === 0;
    const [x1, y1] = polar(i * 6, R - 9), [x2, y2] = polar(i * 6, big ? R - 18 : R - 13);
    svg.appendChild(el('line', { x1, y1, x2, y2, class: big ? 'tick big' : 'tick' }));
  }
  if (o.numbers) for (let n = 1; n <= 12; n++) {
    const [x, y] = polar(n * 30, R - 31);
    svg.appendChild(el('text', { x, y, class: 'num', 'data-n': n, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, o.roman ? ROMAN[n] : String(n)));
  }
  if (o.minuteLabels) for (let n = 0; n < 12; n++) {
    const [x, y] = polar(n * 30, R + 1);
    svg.appendChild(el('text', { x, y, class: 'mlabel', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, String(n * 5).padStart(2, '0')));
  }
  const hourHand = el('g', { class: 'hand hour' + (o.colorHands ? ' color' : '') }, [
    el('line', { x1: C, y1: C + 8, x2: C, y2: C - 46 }), el('circle', { cx: C, cy: C - 46, r: 0.1, class: 'tip' }),
  ]);
  const minHand = el('g', { class: 'hand minute' + (o.colorHands ? ' color' : '') }, [
    el('line', { x1: C, y1: C + 10, x2: C, y2: C - 72 }), el('circle', { cx: C, cy: C - 72, r: 0.1, class: 'tip' }),
  ]);
  if (o.interactive) {
    hourHand.appendChild(el('circle', { cx: C, cy: C - 40, r: 9, class: 'knob' }));
    minHand.appendChild(el('circle', { cx: C, cy: C - 66, r: 9, class: 'knob' }));
  }
  svg.appendChild(hourHand); svg.appendChild(minHand);
  svg.appendChild(el('circle', { cx: C, cy: C, r: 6, class: 'pin' }));

  function draw() {
    let hA, mA;
    if (o.linked) { const v = value % 720; hA = v / 2; mA = (value % 60) * 6; }
    else { hA = hourPart * 30; mA = minPart * 6; }
    hourHand.setAttribute('transform', `rotate(${hA} ${C} ${C})`);
    minHand.setAttribute('transform', `rotate(${mA} ${C} ${C})`);
    if (o.sky) drawSky();
  }
  function drawSky() {
    const h = Math.floor(get() / 60);
    const mode = h >= 7 && h < 18 ? 'day' : (h >= 18 && h < 20) || (h >= 5 && h < 7) ? 'dusk' : 'night';
    if (sky.dataset.mode === mode) return;
    sky.dataset.mode = mode;
    sky.innerHTML = '';
    sky.appendChild(el('circle', { cx: C, cy: C, r: R - 6, class: 'sky-' + mode }));
    if (mode === 'night') {
      [[60, 52], [140, 48], [150, 140], [52, 132], [100, 160], [120, 70], [74, 92]].forEach(([x, y]) => sky.appendChild(el('circle', { cx: x, cy: y, r: 1.6, class: 'star' })));
      sky.appendChild(el('text', { x: 100, y: 64, class: 'skyicon', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, '🌙'));
    } else {
      sky.appendChild(el('text', { x: 100, y: 64, class: 'skyicon', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, mode === 'day' ? '☀️' : '🌅'));
    }
  }

  function get() {
    if (o.linked) return ((value % 1440) + 1440) % 1440;
    const pm = Math.floor(value / 720) % 2;
    return pm * 720 + hourPart * 60 + minPart;
  }
  function set(min) {
    value = ((Math.round(min) % 1440) + 1440) % 1440;
    hourPart = Math.floor(value / 60) % 12; minPart = value % 60;
    draw();
  }
  /** Flip AM <-> PM (keeps the hands where they are). */
  function setHalf(pm) {
    const cur = get(); const isPm = cur >= 720;
    if (pm !== isPm) set(cur + (pm ? 720 : -720));
  }

  // ---------- dragging ----------
  let dragging = null;
  const snapTo = (v, s) => Math.round(v / s) * s;
  function angleAt(e) {
    const r = svg.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * 200 - C, y = (e.clientY - r.top) / r.height * 200 - C;
    let a = Math.atan2(y, x) * 180 / Math.PI + 90; if (a < 0) a += 360;
    return { a, dist: Math.sqrt(x * x + y * y) };
  }
  const angDiff = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  function moveTo(which, a) {
    const before = get();
    if (which === 'minute') {
      const step = o.hourOnly ? 60 : o.snap;
      let m = snapTo(a / 6, step) % 60;
      if (o.linked) {
        let delta = m - (((value % 60) + 60) % 60);
        if (delta > 30) delta -= 60; if (delta < -30) delta += 60;
        value = ((value + delta) % 1440 + 1440) % 1440;
      } else minPart = m;
    } else {
      if (o.linked) {
        const step = o.hourOnly ? 60 : o.snap;
        const t12 = snapTo(a * 2, step) % 720; // a / 30 hours * 60
        const base = value - (value % 720);
        let nv = base + t12;
        if (nv - value > 360) nv -= 720; if (value - nv > 360) nv += 720;
        value = ((nv % 1440) + 1440) % 1440;
      } else {
        hourPart = Math.round(a / 30) % 12;
      }
    }
    draw();
    if (get() !== before) { o.onTick && o.onTick(); o.onChange && o.onChange(get()); }
  }
  if (o.interactive) {
    svg.addEventListener('pointerdown', e => {
      e.preventDefault();
      const { a, dist } = angleAt(e);
      let which = 'minute';
      if (o.hourOnly) which = 'hour';
      else {
        const hA = o.linked ? (value % 720) / 2 : hourPart * 30, mA = (value % 60) * 6;
        const dh = angDiff(a, hA), dm = angDiff(o.linked ? a : a, o.linked ? mA : minPart * 6);
        which = Math.abs(dh - dm) < 18 ? (dist < 58 ? 'hour' : 'minute') : (dh < dm ? 'hour' : 'minute');
      }
      dragging = { which, id: e.pointerId };
      try { svg.setPointerCapture(e.pointerId); } catch (_) {}
      svg.classList.add('dragging-' + which);
      moveTo(which, a);
    });
    svg.addEventListener('pointermove', e => { if (dragging && dragging.id === e.pointerId) { e.preventDefault(); moveTo(dragging.which, angleAt(e).a); } });
    const end = () => { if (dragging) svg.classList.remove('dragging-' + dragging.which); dragging = null; };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    svg.addEventListener('keydown', e => {
      const step = o.hourOnly ? 60 : o.snap;
      const dir = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      if (e.shiftKey || o.hourOnly) {
        if (o.linked) set(get() + dir * 60); else { hourPart = (hourPart + dir + 12) % 12; draw(); }
      } else if (o.linked) set(get() + dir * step);
      else { minPart = (minPart + dir * step + 60) % 60; draw(); }
      o.onTick && o.onTick(); o.onChange && o.onChange(get());
    });
  }

  /** Make some numbers glow (lessons + hints). nums = [3, 6] or [] to clear. */
  function highlight(nums = [], cls = 'hl') {
    svg.querySelectorAll('.num').forEach(t => t.classList.toggle(cls, nums.includes(+t.dataset.n)));
  }
  /** Glow a hand: 'hour' | 'minute' | null */
  function glowHand(which) { hourHand.classList.toggle('glow', which === 'hour'); minHand.classList.toggle('glow', which === 'minute'); }

  draw();
  return { el: svg, get, set, setHalf, redraw: draw, highlight, glowHand };
}

// Game scenes: answers become things in the game world instead of a grid of test buttons.
//   race    → gates on the track; your kart drives through the one you pick
//   dungeon → monsters holding answer shields; your hero charges one (wrong ones block)
//   hatch   → answer bubbles float in a meadow; pop the right one to feed your chick
//   build   → answer crates; drag (or tap) the right crate onto your build
// Tap, drag, keyboard (1–9) and read-aloud all work. Returns the same shape as ui.choices().
import { el } from './util.js';
import { Keys } from './ui.js';
import { Sfx } from './audio.js';
import { kartSvg, HEROES } from './modes.js';

const MONS = ['👾', '👻', '🦇', '🕷️', '💀', '🧟', '👺', '🐍', '🦂', '👹', '🐲'];
const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const shortish = opts => opts.every(o => String(o.label ?? o.value).length <= 14 && !o.html);

/** Can this set of answers be shown as a scene? (Long sentences and big pictures stay as readable cards.) */
export function sceneFits(options, cls = '') {
  if (options.length < 2 || options.length > 6) return false;
  if (/cd-clocks|coin-choices|bi-deals/.test(cls)) return false; // big pictures need the full card
  return options.every(o => !o.html || /class="(emo|fd-opt)"/.test(o.html));
}

export function scene(options, onPick, { theme = 'race', kid = {}, hero = 'knight', edition = 2, cls = '' } = {}) {
  const n = options.length;
  const float = theme === 'hatch' && shortish(options) && !reduced();
  const long = options.some(o => String(o.label ?? '').length > 26);
  const wrap = el('div', { class: `scene sc-${theme}${float ? ' sc-float' : ''}${long ? ' sc-long' : ''} ${cls}`.trim(), style: { '--n': n } });
  const field = el('div', { class: 'sc-field', style: { '--cols': long ? 1 : n === 4 ? 2 : Math.min(n, 3) } });
  const actor = el('div', { class: 'sc-actor', 'aria-hidden': 'true' });
  if (theme === 'race') actor.innerHTML = kartSvg(kid.color || '#ff6b4a', 'your kart');
  else if (theme === 'dungeon') actor.innerHTML = `<span class="a-av">${kid.avatar || '🙂'}</span><span class="a-cls">${(HEROES[hero] || HEROES.knight)[0]}</span>`;
  else if (theme === 'hatch') actor.innerHTML = '<span class="a-av">🐣</span>';
  else actor.innerHTML = '<span class="a-av">🏗️</span><span class="a-pile"></span>';
  const drop = el('div', { class: 'sc-drop', 'aria-hidden': 'true' }, theme === 'build' ? 'Drop crates here' : theme === 'race' ? '' : '');
  wrap.append(field, el('div', { class: 'sc-ground' }, [actor, drop]));

  let locked = false, busy = false;
  const buttons = options.map((opt, i) => {
    const b = el('button', { class: 'choice sc-obj', type: 'button', 'data-value': String(opt.value) });
    const face = el('span', { class: 'sc-face' });
    if (opt.html) face.innerHTML = opt.html; else face.textContent = opt.label;
    if (theme === 'dungeon') b.appendChild(el('span', { class: 'sc-mon', 'aria-hidden': 'true' }, MONS[(i * 3 + n) % MONS.length]));
    if (theme === 'race') b.appendChild(el('span', { class: 'sc-gatetop', 'aria-hidden': 'true' }));
    b.appendChild(face);
    if (n <= 9) b.appendChild(el('span', { class: 'kbd', 'aria-hidden': 'true' }, String(i + 1)));
    if (float) { b.style.setProperty('--x', ((i + 0.5) / n * 100).toFixed(1) + '%'); b.style.setProperty('--y', (12 + ((i * 37) % 46)) + '%'); b.style.setProperty('--d', (3.2 + (i % 3) * 0.7) + 's'); b.style.setProperty('--dl', (-i * 0.9) + 's'); }
    wireDrag(b, opt);
    field.appendChild(b);
    return b;
  });

  // the actor moves to the answer, then the engine checks it
  function go(opt, b) {
    if (locked || busy || b.disabled) return;
    busy = true; Sfx.click();
    const ar = actor.getBoundingClientRect(), br = b.getBoundingClientRect();
    const dx = br.left + br.width / 2 - (ar.left + ar.width / 2), dy = br.top + br.height / 2 - (ar.top + ar.height / 2);
    const quick = reduced();
    actor.style.setProperty('--dx', dx + 'px'); actor.style.setProperty('--dy', dy + 'px');
    actor.classList.add('go');
    b.classList.add('hit');
    setTimeout(() => { busy = false; onPick(opt.value, b, opt); }, quick ? 0 : 420);
  }
  // drag an answer onto the actor (or the drop zone) — or just tap it
  function wireDrag(b, opt) {
    let sx = 0, sy = 0, drag = false, id = null;
    b.addEventListener('pointerdown', e => { if (locked || b.disabled) return; id = e.pointerId; sx = e.clientX; sy = e.clientY; drag = false; });
    b.addEventListener('pointermove', e => {
      if (id !== e.pointerId) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!drag && Math.hypot(dx, dy) > 10) { drag = true; b.classList.add('dragging'); try { b.setPointerCapture(id); } catch (x) {} }
      if (drag) b.style.translate = `${dx}px ${dy}px`;
    });
    const end = e => {
      if (id !== e.pointerId) return; id = null;
      if (!drag) return;
      b.classList.remove('dragging'); b.style.translate = '';
      const r = actor.getBoundingClientRect(), d = drop.getBoundingClientRect(), x = e.clientX, y = e.clientY;
      const near = (x > r.left - 40 && x < r.right + 40 && y > r.top - 40 && y < r.bottom + 40) || (x > d.left && x < d.right && y > d.top && y < d.bottom);
      b.dataset.dragged = '1';
      setTimeout(() => { delete b.dataset.dragged; }, 50);
      if (near) go(opt, b);
    };
    b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end);
    b.addEventListener('click', () => { if (b.dataset.dragged) return; go(opt, b); });
  }
  Keys.on(e => {
    const k = parseInt(e.key, 10);
    if (k >= 1 && k <= buttons.length && !e.ctrlKey && !e.metaKey) { buttons[k - 1].click(); return true; }
    return false;
  });
  const find = v => buttons.find(b => b.dataset.value === String(v));
  return {
    el: wrap, buttons,
    mark(v, kind) {
      const b = find(v); if (!b) return;
      b.classList.remove('hit'); b.classList.add(kind);
      if (kind === 'right') { actor.classList.add('win'); wrap.classList.add('won'); }
      else { actor.classList.remove('go'); actor.classList.add('bonk'); setTimeout(() => actor.classList.remove('bonk'), 500); }
    },
    disable(v) { const b = find(v); if (b) b.disabled = true; },
    lock() { locked = true; wrap.classList.add('locked'); },
    unlock() { locked = false; wrap.classList.remove('locked'); actor.classList.remove('go', 'win'); },
  };
}

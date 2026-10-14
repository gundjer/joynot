// Small drawing + teaching helpers shared by the JoyNot Play games (each game has its own unique game play).
//  - canvas buttons with big touch targets, wrapped text, speech bubbles, the "watch me" hand
//  - teach(): I do / We do / You do inside the game. The first task of every stage is "we do" (a guide hand and
//    step-by-step talk; logged, but it doesn't move levels). Later tasks are "you do". Help is always one tap away.
import { roundRect, emoji, clamp } from './play.js';

export const INK = '#2b2350';
export const FONT = 'Fredoka, Andika, system-ui, sans-serif';
export const inBox = (x, y, b) => !!b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
export const lerp = (a, b, k) => a + (b - a) * k;
export const ease = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
export const noTags = s => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** Text that wraps to fit maxW. Returns the height used. */
export function text(ctx, t, x, y, { size = 18, color = INK, weight = 700, align = 'center', base = 'middle', max = 0, lh = 1.2, font = FONT, shadow = null } = {}) {
  ctx.save(); ctx.font = `${weight} ${Math.round(size)}px ${font}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base;
  if (shadow) { ctx.shadowColor = shadow; ctx.shadowBlur = 6; }
  const lines = [];
  if (max) { let line = ''; for (const w of String(t).split(' ')) { const tryL = line ? line + ' ' + w : w; if (ctx.measureText(tryL).width > max && line) { lines.push(line); line = w; } else line = tryL; } if (line) lines.push(line); }
  else lines.push(String(t));
  const h = size * lh, y0 = base === 'middle' ? y - (lines.length - 1) * h / 2 : y;
  lines.forEach((l, i) => ctx.fillText(l, x, y0 + i * h));
  ctx.restore();
  return lines.length * h;
}
/** A rounded panel. */
export function panel(ctx, b, { fill = '#fffdf6', stroke = null, lw = 3, r = 18, shadow = true } = {}) {
  ctx.save();
  if (shadow) { ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4; }
  ctx.fillStyle = fill; roundRect(ctx, b.x, b.y, b.w, b.h, r); ctx.fill();
  ctx.shadowColor = 'transparent';
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  ctx.restore();
}
/** A big canvas button. b = {x,y,w,h}. */
export function button(ctx, b, label, { fill = '#ffc93c', color = INK, size = 0, on = false, off = false, icon = null, pulse = 0 } = {}) {
  ctx.save();
  if (off) ctx.globalAlpha = 0.45;
  const grow = pulse ? Math.sin(pulse * 6) * 2 : 0;
  ctx.fillStyle = 'rgba(0,0,0,.22)'; roundRect(ctx, b.x - grow, b.y + 4 - grow, b.w + grow * 2, b.h + grow * 2, Math.min(18, b.h / 2)); ctx.fill();
  ctx.fillStyle = on ? '#2fae66' : fill; roundRect(ctx, b.x - grow, b.y - grow, b.w + grow * 2, b.h + grow * 2, Math.min(18, b.h / 2)); ctx.fill();
  const fs = size || Math.min(26, b.h * 0.42);
  if (icon) { emoji(ctx, icon, b.x + b.w / 2, b.y + b.h * (label ? 0.38 : 0.5), Math.min(b.h * (label ? 0.42 : 0.6), b.w * 0.5)); if (label) text(ctx, label, b.x + b.w / 2, b.y + b.h * 0.8, { size: Math.min(fs, b.h * 0.22), color: on ? '#fff' : color, max: b.w - 6 }); }
  else text(ctx, label, b.x + b.w / 2, b.y + b.h / 2 + 1, { size: fs, color: on ? '#fff' : color, max: b.w - 10 });
  ctx.restore();
}
/** Speech bubble pointing down at (x, y). */
export function bubble(ctx, t, x, y, { max = 260, size = 17, fill = '#fff', color = INK, up = false } = {}) {
  ctx.save(); ctx.font = `700 ${size}px ${FONT}`;
  const words = String(t).split(' '); const lines = []; let line = '';
  for (const w of words) { const tl = line ? line + ' ' + w : w; if (ctx.measureText(tl).width > max - 24 && line) { lines.push(line); line = w; } else line = tl; }
  if (line) lines.push(line);
  const w = Math.min(max, Math.max(...lines.map(l => ctx.measureText(l).width)) + 26), h = lines.length * size * 1.25 + 16;
  const CW = ctx.canvas.width / Math.min(2, window.devicePixelRatio || 1), bx = clamp(x - w / 2, 6, Math.max(6, CW - w - 6)), by = up ? y + 14 : y - h - 14;
  ctx.fillStyle = fill; ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 8; roundRect(ctx, bx, by, w, h, 14); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.beginPath(); if (up) { ctx.moveTo(x - 9, by); ctx.lineTo(x, y + 2); ctx.lineTo(x + 9, by); } else { ctx.moveTo(x - 9, by + h); ctx.lineTo(x, y - 2); ctx.lineTo(x + 9, by + h); } ctx.fill();
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, bx + w / 2, by + 8 + i * size * 1.25));
  ctx.restore();
  return { x: bx, y: by, w, h };
}
/** The "watch me" / "your turn" guide hand (👆), bobbing at x, y. */
export function hand(ctx, x, y, t = 0, size = 46) { emoji(ctx, '👆', x + 6, y + size * 0.55 + Math.sin(t * 7) * 6, size); }
/** Floating "+3" style pop-ups. */
export function popups() {
  const list = [];
  return {
    add(t, x, y, color = '#2fae66', size = 22) { list.push({ t, x, y, color, size, a: 1.2 }); },
    update(dt) { for (const p of list) { p.y -= 40 * dt; p.a -= dt; } for (let i = list.length - 1; i >= 0; i--) if (list[i].a <= 0) list.splice(i, 1); },
    draw(ctx) { for (const p of list) { ctx.save(); ctx.globalAlpha = clamp(p.a, 0, 1); text(ctx, p.t, p.x, p.y, { size: p.size, color: p.color, shadow: '#fff' }); ctx.restore(); } },
  };
}
/** Little particle bursts (sparkles, splashes, confetti). */
export function particles() {
  const list = [];
  return {
    burst(x, y, n = 14, colors = ['#ffc93c', '#ff6b9d', '#3dd6a3', '#4ba8ff'], speed = 220) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8); list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, c: colors[i % colors.length], t: 0.7 + Math.random() * 0.4, r: 3 + Math.random() * 3 }); } },
    update(dt) { for (const p of list) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; p.t -= dt; } for (let i = list.length - 1; i >= 0; i--) if (list[i].t <= 0) list.splice(i, 1); },
    draw(ctx) { for (const p of list) { ctx.globalAlpha = clamp(p.t * 2, 0, 1); ctx.fillStyle = p.c; ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); } ctx.globalAlpha = 1; },
    get n() { return list.length; },
  };
}

/**
 * I do / We do / You do for one learning task.
 * const T = teach(api, { level, guided, prompt, expected });
 *   T.say(text)          read aloud (always)
 *   T.miss(given)        a wrong try: returns 1 (first miss: show the next step), 2 (second: show it fully), 3+ (out of tries)
 *   T.help()             the kid (or a grown-up) asked for help → helped
 *   T.done(correct, given) logs it once: { levelUp, gradeBoss }
 * guided = "we do": logged with adapt:false, so it never moves levels.
 */
export function teach(api, { level, guided = false, prompt = '', expected = '' }) {
  let misses = 0, helped = false, logged = null;
  return {
    get misses() { return misses; },
    get helped() { return helped; },
    get guided() { return guided; },
    say: t => api.speak(noTags(t), { force: true }),
    miss() { misses++; return misses; },
    help() { helped = true; },
    done(correct, given = '') {
      if (logged) return logged;
      logged = api.record({ level, correct, firstTry: misses === 0, helped: helped || guided, prompt: noTags(prompt), expected: String(expected), given: String(given ?? ''), adapt: !guided }) || { levelUp: false, gradeBoss: false };
      return logged;
    },
  };
}

/** Pick the level for the next task: the grade boss mixes the grade's levels; otherwise the quiet-help level. */
export function taskLevel(api, o) { return o && o.boss && o.bossLevels && o.bossLevels.length ? o.bossLevels[Math.floor(Math.random() * o.bossLevels.length)] : api.learn.work(); }

/** Scale everything from one number: phones get bigger touch targets. */
export function unit(W, H) { return clamp(Math.min(W, H) / 9, 34, 72); }

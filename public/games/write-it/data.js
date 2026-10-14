// Write It data: letter sets, words, the writing layout and drawing helpers, and lessons.
import { el, pick, sample, sleep } from '../_joy/js/util.js';
import { pics, note } from '../_joy/js/lesson.js';
import { GLYPHS, strokePoints, ABC } from './glyphs.js';
export { GLYPHS, ABC };

export const SETS = {
  1: ['|', '—', '/', '\\', '○', '+', '✕', '□', '△', '∿'],
  2: '0123456789'.split(''),
  3: 'EFHILT'.split(''),
  4: 'AKMNVWXYZ'.split(''),
  5: 'BCDGJOPQRSU'.split(''),
  6: 'cadgoqesf'.split(''),
  7: 'abcdefghijklmnopqrstuvwxyz'.split(''),
};
export const WORDS = ['cat', 'dog', 'sun', 'map', 'pig', 'fox', 'hat', 'bed', 'cup', 'red', 'big', 'run', 'jam', 'web', 'zip', 'yes', 'box', 'fun'];
export const SENTENCES = ['I can run', 'I see a cat', 'We like dogs', 'The sun is up', 'I am happy', 'Look at me'];
export const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

/** Draw the letters onto a canvas and give back where every point of the path is (for checking + demos). */
export function layout(chars, W, H) {
  const gap = 18, space = 34;
  const gl = chars.map(ch => (ch === ' ' ? null : GLYPHS[ch])).filter((g, i) => g || chars[i] === ' ');
  const totalW = chars.reduce((s, ch) => s + (ch === ' ' ? space : (GLYPHS[ch]?.w || 60) + gap), 0) - gap;
  const scale = Math.min((W - 30) / totalW, (H - 24) / 145, 3.2);
  const ox = (W - totalW * scale) / 2, oy = Math.max(10, (H - 140 * scale) / 2);
  let x = 0;
  const strokes = [];
  chars.forEach(ch => {
    if (ch === ' ') { x += space; return; }
    const g = GLYPHS[ch]; if (!g) return;
    strokePoints(g).forEach(pts => strokes.push(pts.map(([px, py]) => [ox + (x + px) * scale, oy + py * scale])));
    x += g.w + gap;
  });
  return { strokes, scale, ox, oy, width: totalW * scale };
}

export function drawLines(ctx, L, W) {
  const y = u => L.oy + u * L.scale;
  ctx.save();
  ctx.lineWidth = 2; ctx.strokeStyle = '#8cb6f0';
  [0, 100].forEach(u => { ctx.beginPath(); ctx.moveTo(8, y(u)); ctx.lineTo(W - 8, y(u)); ctx.stroke(); });
  ctx.setLineDash([8, 8]); ctx.strokeStyle = '#f0a0a0';
  ctx.beginPath(); ctx.moveTo(8, y(50)); ctx.lineTo(W - 8, y(50)); ctx.stroke();
  ctx.setLineDash([3, 7]); ctx.strokeStyle = '#d7dde8';
  ctx.beginPath(); ctx.moveTo(8, y(135)); ctx.lineTo(W - 8, y(135)); ctx.stroke();
  ctx.restore();
}
export function drawGuide(ctx, L, alpha, dots = true) {
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (alpha > 0) {
    ctx.globalAlpha = alpha; ctx.strokeStyle = '#9aa6bd'; ctx.lineWidth = Math.max(10, 16 * L.scale);
    L.strokes.forEach(pts => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); });
  }
  ctx.globalAlpha = 1;
  if (dots) L.strokes.forEach((pts, i) => {
    const [x, y] = pts[0], [x2, y2] = pts[Math.min(pts.length - 1, 4)];
    const r = Math.max(9, 9 * L.scale);
    ctx.fillStyle = '#22a06b'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.round(r * 1.2)}px Fredoka, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), x, y + 1);
    // little arrow showing which way to go
    const a = Math.atan2(y2 - y, x2 - x), ax = x + Math.cos(a) * r * 2.3, ay = y + Math.sin(a) * r * 2.3;
    ctx.strokeStyle = '#22a06b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax - Math.cos(a - 0.5) * 9, ay - Math.sin(a - 0.5) * 9); ctx.lineTo(ax, ay); ctx.lineTo(ax - Math.cos(a + 0.5) * 9, ay - Math.sin(a + 0.5) * 9); ctx.stroke();
  });
  ctx.restore();
}

/** A pencil writes the letters stroke by stroke (the "watch me" part). */
export async function demo(ctx, L, isAlive, color = '#2b7de9') {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color; ctx.lineWidth = Math.max(5, 8 * L.scale);
  for (const pts of L.strokes) {
    for (let i = 1; i < pts.length; i++) {
      if (!isAlive()) { ctx.restore(); return; }
      ctx.beginPath(); ctx.moveTo(...pts[i - 1]); ctx.lineTo(...pts[i]); ctx.stroke();
      if (i % 2 === 0) await sleep(14);
    }
    await sleep(180);
  }
  ctx.restore();
}

/** Lesson art: a canvas that writes some letters over and over. */
const writeArt = chars => box => {
  const cv = el('canvas', { width: 520, height: 220, style: { width: '100%', maxWidth: '520px', height: 'auto', background: '#fff', borderRadius: '16px' } });
  box.appendChild(cv);
  const ctx = cv.getContext('2d'); let alive = true;
  const loop = async () => {
    while (alive) {
      ctx.clearRect(0, 0, 520, 220);
      const L = layout(chars, 520, 220);
      drawLines(ctx, L, 520); drawGuide(ctx, L, 0.35);
      await demo(ctx, L, () => alive);
      await sleep(1400);
    }
  };
  loop();
  return () => { alive = false; };
};

export const LESSONS = {
  1: [
    { title: 'Get ready to write!', text: 'Sit up tall. If you use a finger, use your pointer finger. If you use a pencil or stylus, hold it with your thumb and pointer finger, resting on your middle finger.', art: pics([['🧒', 'sit tall'], ['👉', 'pointer finger'], ['✏️', 'pencil grip']]) },
    { title: 'Start at the green dot', text: 'Every line starts at a green dot with a number. Number 1 goes first. The little arrow shows which way to go.', art: writeArt(['+']) },
    { title: 'Top to bottom, left to right', text: 'Most lines go from the TOP down, and from LEFT to right — the same way we read. Watch, then trace over the gray path!', art: writeArt(['|', '—', '○']) },
  ],
  2: [
    { title: 'Writing numbers', text: 'Numbers start at the TOP. Say the number out loud while you write it. Watch how 2 and 5 are made.', art: writeArt(['2', '5']) },
  ],
  3: [
    { title: 'Writing lines', text: 'The blue lines are the top line and the bottom line. Capital letters go from the top line all the way down to the bottom line.', art: writeArt(['E', 'T']) },
    { title: 'Big line first', text: 'For letters like E, F, H, L and T, make the big line down FIRST, then the little lines across.', art: writeArt(['F', 'H']) },
  ],
  4: [
    { title: 'Slanted lines', text: 'A, K, M, N, V, W, X, Y and Z have slanted lines, like a slide. Keep your line straight and stop at the bottom line.', art: writeArt(['A', 'V']) },
  ],
  5: [
    { title: 'Curvy letters', text: 'C, G, O, Q and S start near the top and curve the OTHER way from a clock — around to the left first. B, D, P and R have bumps that curve to the right.', art: writeArt(['C', 'O', 'D']) },
  ],
  6: [
    { title: 'Small letters', text: 'Most small letters live between the dashed middle line and the bottom line.', art: writeArt(['a', 'c', 'o']) },
    { title: 'Magic c', text: 'Many letters start with a “magic c” curve: c, a, d, g, o and q. Make a c, then finish the letter.', art: writeArt(['c', 'a', 'd']) },
  ],
  7: [
    { title: 'Tall, small and tail letters', text: 'TALL letters (b, d, f, h, k, l, t) reach the top line. SMALL letters stay below the dashed line. TAIL letters (g, j, p, q, y) drop below the bottom line.', art: writeArt(['h', 'a', 'g']) },
  ],
  8: [
    { title: 'Writing words', text: 'Letters in a word sit close together. Write each letter, left to right. Say the sounds as you write: c-a-t, cat!', art: writeArt('cat'.split('')) },
  ],
  9: [
    { title: 'Finger spaces', text: 'Between words, leave a space about as wide as your finger. Start a sentence with a capital letter.', art: writeArt('I can'.split('')) },
    { title: 'Your name', text: 'Your name starts with a capital letter. The rest are small letters.', art: note('Capital first ➜ small letters after') },
  ],
};

export function makeQ(level, ctx) {
    let chars, prompt, say, pic = '';
    if (level <= 7) {
      const ch = pick(SETS[level]);
      chars = [ch];
      if (level === 1) { prompt = `Trace the ${GLYPHS[ch].name}.`; }
      else if (level === 2) { prompt = `Write the number ${ch}.`; say = `Write the number ${NUM_WORDS[+ch]}.`; pic = '⭐'.repeat(+ch) || '0️⃣'; }
      else { const low = ch.toLowerCase(), [word, ic] = ABC[low]; prompt = `Write the letter ${ch}. ${ch} is for ${word}.`; say = `${level >= 6 ? 'Small letter' : 'Capital'} ${ch}. ${ch} is for ${word}.`; pic = ic; }
    } else if (level === 8) {
      const w = pick(WORDS); chars = w.split(''); prompt = `Write the word “${w}”.`; say = `Write the word ${w}. ${w.split('').join(', ')}.`;
    } else {
      const name = (ctx.state.name || '').replace(/[^A-Za-z]/g, '');
      const useName = name.length >= 2 && name.length <= 8 && Math.random() < 0.5;
      const t = useName ? name[0].toUpperCase() + name.slice(1).toLowerCase() : pick(SENTENCES);
      chars = t.split('');
      prompt = useName ? `Write your name: ${t}` : `Write the sentence: “${t}.”`; say = useName ? `Write your name, ${t}.` : `Write: ${t}.`;
    }
    return { key: 'w' + chars.join(''), chars, prompt, say, pic, mode: 'write', tries: 3, expected: chars.join(''), steps: ['Watch Penn write it.', 'Put your finger on green dot number 1.', 'Follow the arrow along the gray path. Then do dot number 2, and so on.'] };
  }

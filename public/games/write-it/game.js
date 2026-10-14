// Write It: Spell Casters! Monsters march toward your tower. Write the magic letter on the spell pad (start at
// green dot ①, follow the arrow, trace the gray path) and your spell zaps the monster. Neat writing = a big blast;
// messy writing fizzles. Watch Penn write it first with ▶ Watch. Levels (must match app/Games/WriteIt.php):
// 1 Lines & Shapes · 2 Numbers 0–9 · 3 Capitals: Straight Lines · 4 Capitals: Slanted Lines · 5 Capitals: Curvy Letters
// 6 Lowercase: Magic C Letters · 7 All Lowercase Letters · 8 Words · 9 Names & Sentences
import { startGame, rand, pick, clamp, emoji, label, roundRect, realFrom, hudBottom, actionsLeft, Sfx } from '../_play/play.js';
import { makeQ, layout, drawLines, drawGuide, LESSONS, GLYPHS } from './data.js';
import { REAL } from '../_joy/js/reallife.js';

const MONSTERS = ['👾', '👹', '👻', '🐲', '🧟', '🦇', '🐙'];
// A new monster land at every level.
const LANDS = [
  { name: 'Doodle Meadow', sky: ['#2f5d3a', '#5c9a5a'], ground: '#6a8f4e', mons: ['🐛', '🐌', '🐞'], deco: '🌼' },
  { name: 'Number Caves', sky: ['#2a2238', '#4a3a60'], ground: '#5a4a3a', mons: ['🦇', '🕷️', '🐍'], deco: '💎' },
  { name: 'Castle Gates', sky: ['#2a1f4d', '#5b4a8a'], ground: '#6a8f4e', mons: ['👹', '👺', '👻'], deco: '🏰' },
  { name: 'Lightning Peaks', sky: ['#1f2a4d', '#4a5a8a'], ground: '#7a7a8a', mons: ['🐉', '🦅', '🐺'], deco: '⚡' },
  { name: 'Curly Woods', sky: ['#1f3a2a', '#3a6a4a'], ground: '#4a6a3a', mons: ['🐙', '🦑', '🐊'], deco: '🍄' },
  { name: 'Magic C Sea', sky: ['#103a5a', '#2a7aaa'], ground: '#e8c27a', mons: ['🦈', '🐡', '🦀'], deco: '🐚' },
  { name: 'Lowercase Lagoon', sky: ['#1a4a4a', '#3a8a7a'], ground: '#5a8a4a', mons: ['🐊', '🐢', '🐸'], deco: '🌴' },
  { name: 'Word Wizard Tower', sky: ['#2a1a3a', '#6a3a7a'], ground: '#4a3a5a', mons: ['🧟', '🧛', '👻'], deco: '🔮' },
  { name: 'Sentence Sky Castle', sky: ['#3a4a8a', '#8aa8e8'], ground: '#e8eef8', mons: ['🐲', '🌪️', '👾'], deco: '☁️' },
];
const landFor = lv => LANDS[(lv - 1) % LANDS.length];

function createGame(api) {
  let S = null, t = 0;
  const geo = () => {
    const top = hudBottom() + 4, phone = api.W < 900 && api.H > 500, bottom = api.H - (phone ? 112 : 10), right = api.H <= 500 ? Math.min(api.W - 100, actionsLeft(api.W) - 10) : api.W - 10;
    const fieldH = clamp((bottom - top) * 0.3, 90, 170);
    return { field: { x: 10, y: top, w: right - 10, h: fieldH }, pad: { x: 10, y: top + fieldH + 8, w: right - 10, h: bottom - top - fieldH - 8 } };
  };
  function start(o) {
    t = 0;
    S = { o, land: landFor(o.real), first: !o.boss, n: o.boss ? 6 : o.edition <= 0 ? 4 : 5, done: 0, mons: [], bolts: [], spell: null, strokes: [], drawing: null, demo: 0, L: null, padKey: '' };
    api.actions([{ key: 'watch', label: '▶ Watch' }, { key: 'clear', label: '↺' }, { key: 'check', label: '✨ Cast', big: true }]);
    nextSpell(); spawn();
    api.chime(`🗺️ Welcome to <b>${S.land.name}</b>! Monsters are coming! Write the magic letter to cast your spell.`, '✏️', { speak: true });
  }
  function nextSpell() {
    if (S.done >= S.n) { S.over = true; setTimeout(() => api.finish({ win: true, title: '🏰 Your tower is safe!', text: `You cast ${S.n} spells with neat writing.` }), 700); return; }
    const lvl = S.o.boss ? pick(S.o.bossLevels) : api.learn.work(), q = makeQ(lvl, { state: api.state });
    S.spell = { ...q, lvl, tries: 0, recorded: false, guided: S.first }; S.first = false;
    S.strokes = []; S.L = null; S.demo = 0.001;
    api.goal(`✨ ${q.prompt}${q.pic && S.o.edition <= 3 ? ' ' + q.pic : ''}`, { speak: false }); api.speak(q.say || q.prompt);
    api.progress(S.done / S.n, 'Spells');
  }
  function spawn() { const g = geo(); S.mons.push({ x: g.field.x + g.field.w + 30, e: pick(S.land ? S.land.mons : MONSTERS), hp: 1, hit: 0 }); }
  const guideMode = () => { const s = api.settings.guide, lv = S.spell.lvl; return s === 'trace' ? 'trace' : s === 'fade' ? 'fade' : lv <= 6 ? 'trace' : 'fade'; };
  function score() {
    const L = S.L, tol = Math.max(10, 15 * L.scale), tol2 = tol * 1.7, user = S.strokes.flat(), target = L.strokes.flat();
    if (user.length < 3) return { cover: 0, acc: 0 };
    const near = (p, list, tt) => list.some(q2 => (q2[0] - p[0]) ** 2 + (q2[1] - p[1]) ** 2 <= tt * tt);
    S.marks = target.map(p => [p[0], p[1], near(p, user, tol)]);
    return { cover: S.marks.filter(m => m[2]).length / target.length, acc: user.filter(p => near(p, target, tol2)).length / user.length };
  }
  function cast(auto) {
    const sp = S.spell; if (!sp || !S.L) return;
    if (!S.strokes.length) { if (!auto) api.toast('Write first! Start at the green dot ①.', 1400); return; }
    const r = score(), lv = sp.lvl, need = lv >= 8 ? [0.7, 0.65] : lv >= 6 ? [0.72, 0.68] : [0.7, 0.62];
    const ok = r.cover >= need[0] && r.acc >= need[1];
    if (auto && !ok) return; // keep writing
    if (!sp.recorded) {
      sp.recorded = true;
      const rec = api.record({ level: lv, correct: ok, helped: !!sp.guided, adapt: !sp.guided, prompt: sp.prompt, expected: sp.expected, given: `covered ${Math.round(r.cover * 100)}%, neat ${Math.round(r.acc * 100)}%`, boss: S.o.boss });
      if (rec.levelUp) setTimeout(() => api.chime(`⬆️ <b>Level up!</b> ${api.levelInfo(api.state.level).name}`, '🏆'), 900);
      if (rec.gradeBoss) setTimeout(() => api.chime('🎓 You mastered this grade! The <b>Grade Boss</b> is ready on the menu.', '🏆'), 900);
    }
    if (ok) {
      const target = S.mons.find(m => !m.dead);
      S.bolts.push({ t: 0, to: target, big: r.acc > 0.85 && r.cover > 0.85 });
      Sfx.zap(); S.done++; S.marks = null;
      api.chime(r.acc > 0.85 ? '✨ SUPER spell! Beautiful writing!' : '✨ Zap! Nice writing!', '✏️', { ms: 2500, speak: false });
      setTimeout(() => nextSpell(), 700);
      return;
    }
    sp.tries++; Sfx.wrong();
    api.chime(r.cover < need[0] ? '💨 Fizzle! Some parts are missing. Trace the WHOLE gray path (the red dots show where).' : '💨 Fizzle! Stay closer to the gray path. Start at the green dot and go slowly.', '✏️', { ms: 6000 });
    if (sp.tries >= 2) S.demo = 0.001;
    setTimeout(() => { S.strokes = []; S.marks = null; }, 1300);
  }
  function update(dt) {
    if (!S || S.over) return;
    t += dt;
    const g = geo(), sp = S.spell;
    const key = `${g.pad.w}x${g.pad.h}`;
    if (sp && (!S.L || S.padKey !== key)) { S.L = layout(sp.chars, g.pad.w, g.pad.h); S.padKey = key; }
    if (api.input.pressed('watch')) S.demo = 0.001;
    if (api.input.pressed('clear')) { S.strokes = []; S.marks = null; }
    if (api.input.pressed('check') || api.input.pressed('action')) cast(false);
    if (S.demo) { S.demo += dt; if (S.L && S.demo > S.L.strokes.length * 1.1 + 0.6) S.demo = 0; }
    // monsters march toward the tower
    const speed = (g.field.w + 30) / (S.o.edition <= 0 ? 34 : S.o.edition <= 2 ? 27 : 22);
    for (const m of S.mons) {
      if (m.dead) { m.dead += dt; continue; }
      if (!S.demo) m.x -= speed * dt;
      if (m.x < g.field.x + 60) { m.dead = 0.01; m.gone = true; api.loseHeart(`${m.e} A monster reached your tower!`); }
    }
    for (const b of S.bolts) { b.t += dt * 2.4; if (b.t >= 1 && !b.done) { b.done = true; if (b.to && !b.to.dead) { b.to.dead = 0.01; api.confetti(); } } }
    S.bolts = S.bolts.filter(b => b.t < 1.3);
    S.mons = S.mons.filter(m => !(m.dead && m.dead > 0.8));
    if (!S.mons.some(m => !m.dead) && !S.over && S.done < S.n) spawn();
    api.score(`✨ ${S.done}/${S.n}`);
  }
  function draw(ctx, W, H, title) {
    ctx.fillStyle = '#2a1f4d'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.3 * Math.sin(t * 2 + i)})`; ctx.fillRect((i * 97) % W, (i * 53) % (H * 0.5), 2, 2); }
    if (!S) { emoji(ctx, '🏰', W / 2, H * 0.6, 90); return; }
    const g = geo(), f = g.field, p = g.pad;
    // battlefield
    const Ld = S.land || LANDS[2], grd = ctx.createLinearGradient(0, f.y, 0, f.y + f.h); grd.addColorStop(0, Ld.sky[0]); grd.addColorStop(1, Ld.sky[1]); ctx.fillStyle = grd; roundRect(ctx, f.x, f.y, f.w, f.h, 16); ctx.fill();
    ctx.fillStyle = Ld.ground; ctx.fillRect(f.x, f.y + f.h * 0.78, f.w, f.h * 0.22);
    for (let i = 1; i < 5; i++) emoji(ctx, Ld.deco, f.x + f.w * i / 5, f.y + f.h * 0.3 + (i % 2) * f.h * 0.15, Math.min(28, f.h * 0.2), { alpha: 0.5 });
    label(ctx, Ld.name, f.x + f.w - 70, f.y + 14, { size: 11, bg: 'rgba(0,0,0,.35)' });
    const gy = f.y + f.h * 0.62, sz = Math.min(f.h * 0.5, 64);
    emoji(ctx, '🏰', f.x + 34, gy, sz); ctx.fillStyle = api.kid.color || '#ff9d3d'; ctx.beginPath(); ctx.arc(f.x + 80, gy + 6, sz * 0.32, 0, 7); ctx.fill(); emoji(ctx, api.kid.avatar || '🙂', f.x + 80, gy + 6, sz * 0.45);
    for (const m of S.mons) { const a = m.dead ? Math.max(0, 1 - m.dead * 1.4) : 1; emoji(ctx, m.dead && !m.gone ? '💥' : m.e, m.x, gy + Math.sin(t * 6 + m.x) * 3, sz * (m.dead ? 1.1 : 0.9), { alpha: a }); }
    for (const b of S.bolts) { const tx = b.to ? b.to.x : f.x + f.w, k = Math.min(1, b.t), x = f.x + 90 + (tx - f.x - 90) * k, y = gy - Math.sin(k * Math.PI) * f.h * 0.3; emoji(ctx, b.big ? '🌟' : '✨', x, y, b.big ? 44 : 32); }
    // the spell pad
    ctx.fillStyle = '#fffdf6'; roundRect(ctx, p.x, p.y, p.w, p.h, 18); ctx.fill();
    if (S.L) {
      ctx.save(); ctx.translate(p.x, p.y);
      drawLines(ctx, S.L, p.w);
      drawGuide(ctx, S.L, guideMode() === 'trace' ? 0.5 : 0.16);
      if (S.marks) S.marks.forEach(([x, y, ok]) => { if (!ok) { ctx.fillStyle = 'rgba(224,69,58,.55)'; ctx.beginPath(); ctx.arc(x, y, Math.max(3, 4 * S.L.scale), 0, 7); ctx.fill(); } });
      if (S.demo) { // Penn writes it
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#2b7de9'; ctx.lineWidth = Math.max(5, 8 * S.L.scale);
        S.L.strokes.forEach((pts, i) => { const k = clamp(S.demo / 1.1 - i, 0, 1); if (k <= 0) return; const n = Math.max(2, Math.floor(pts.length * k)); ctx.beginPath(); pts.slice(0, n).forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); if (k < 1) emoji(ctx, '✏️', pts[n - 1][0] + 10, pts[n - 1][1] - 12, 28); });
      }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = Math.max(6, 9 * S.L.scale);
      S.strokes.forEach(st => { ctx.beginPath(); st.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); if (st.length === 1) ctx.lineTo(st[0][0] + 0.1, st[0][1]); ctx.stroke(); });
      ctx.restore();
    }
    if (S.demo) label(ctx, '👀 Watch Penn write it', p.x + p.w / 2, p.y + 18, { size: 13, bg: '#2b7de9' });
  }
  const inPad = (x, y) => { const p = geo().pad; return x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h; };
  return {
    start, update, draw,
    onTap(x, y) { if (!S || S.over || !inPad(x, y)) return; S.demo = 0; const p = geo().pad; S.drawing = [[x - p.x, y - p.y]]; S.strokes.push(S.drawing); S.marks = null; },
    onMove(x, y) { if (!S || !S.drawing) return; const p = geo().pad, q = [x - p.x, y - p.y], l = S.drawing[S.drawing.length - 1]; if (Math.hypot(q[0] - l[0], q[1] - l[1]) > 1.5) S.drawing.push(q); },
    onUp() { if (!S) return; if (S.drawing) { S.drawing = null; if (S.L && S.strokes.length >= S.L.strokes.length) cast(true); } },
    tapZone: () => true,
    stop() { S = null; api.progress(null); },
    checkpoint() { if (S) { S.mons = []; spawn(); } api.toast('🏰 The tower is repaired!'); },
    _S: () => S, _cast: cast,
  };
}

startGame({
  mascot: '✏️',
  stick: false,
  story: (d, e) => (e >= 3 ? 'Spell writing: neat letters, words and sentences power up your tower’s magic.' : 'Monsters are coming to your tower! Write magic letters to cast spells. Neat writing makes the strongest magic!'),
  howTo: ['👀 Tap ▶ Watch to see Penn write it.', '👉 Start at the green dot ①, follow the arrow, and trace the gray path.', '✨ When you finish, your spell zaps the monster (or tap ✨ Cast).', '↺ Clear erases your writing.'],
  lessons: level => LESSONS[level] || [],
  realLife: realFrom(REAL['write-it']),
  create: createGame,
});

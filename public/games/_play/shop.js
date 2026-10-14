// Busy-shop kit (like Diner Dash): customers walk in and line up at your counter, each with a job. Tap the
// customer at the front (or press Serve) to do their job with a hands-on puzzle: count coins, make change,
// set clock hands. Fast, right answers = happy customers and bigger tips. Customers who wait too long walk
// out (lose a heart). Pests sneak in (a raccoon at the tip jar, wasps at the lemonade): tap them away!
import { clamp, rand, pick, emoji, label, roundRect, Sfx, hudBottom, playBox } from './play.js';
import { puzzles } from './widgets.js';

export function shopScene(api, game) {
  const P = { api, game, puz: puzzles(api), line: [], t: 0, served: 0, tips: 0, pests: [], S: null, over: false };
  const FACES = game.faces || ['🧑', '👩', '👨', '👧', '👦', '👵', '👴', '🧔', '👩‍🦱', '👨‍🦰'];
  let nextIn = 0, pestIn = 8, spawned = 0;

  function start(o) {
    P.o = o; P.t = 0; P.served = 0; P.tips = 0; P.line = []; P.pests = []; P.over = false; spawned = 0; nextIn = 0.5; pestIn = rand(10, 16);
    P.S = game.build ? game.build(o, P) : { n: 5 };
    P.n = P.S.n;
    P.patience = game.patience ? game.patience(o) : (o.edition <= 1 ? 75 : 60);
    setActs();
    game.start && game.start(o, P);
  }
  const counterX = () => api.W * (api.W < 600 ? 0.3 : 0.32);
  const frontX = () => counterX() + 92;
  function setActs() { if (P.puz.on) return; api.actions([{ key: 'serve', label: game.serveLabel || '🛎️ Serve', big: true }]); }
  P.setActs = setActs; P.spawn = () => spawn(); P.counterX = () => frontX();
  function spawn() {
    if (spawned >= P.n) return;
    spawned++;
    const c = { face: pick(FACES), x: api.W + 40, slot: P.line.length, wait: 0, mood: 1, state: 'walk', id: spawned };
    c.job = game.order(c, P);
    P.line.push(c);
  }
  function update(dt) {
    P.t += dt;
    // pests run even while you work (tap them!)
    pestIn -= dt;
    if (pestIn <= 0 && game.pest && !P.over) { pestIn = rand(12, 20); const pb = playBox(api.W, api.H); P.pests.push({ x: rand(pb.x + 40, pb.x + pb.w - 40), y: rand(pb.y + 60, pb.y + pb.h * 0.6), t: 3.5 }); }
    for (const p of P.pests) { p.t -= dt; if (p.t <= 0 && !p.gone) { p.gone = true; const loss = game.pestSteal ? game.pestSteal(P) : 0; api.toast(game.pestText || 'Oh no!', 1600); P.tips = Math.max(0, P.tips - loss); } }
    P.pests = P.pests.filter(p => !p.gone);
    if (P.puz.on) { P.puz.update(dt); if (!P.puz.on) setActs(); }
    // customers walk to their spot; the one at the front waits for you
    nextIn -= dt;
    if (nextIn <= 0 && P.line.length < 3) { spawn(); nextIn = game.gap ? game.gap(P) : rand(6, 10); }
    const cx = counterX();
    P.line.forEach((c, i) => {
      c.slot = i; const want = frontX() + i * Math.min(100, api.W * 0.15);
      if (c.state === 'leave') { c.x += dt * 260 * c.dir; return; }
      c.x += clamp(want - c.x, -dt * 220, dt * 220);
      c.wait += dt * (P.puz.on && i === 0 ? 0.5 : 1);
      c.mood = clamp(1 - c.wait / P.patience, 0, 1);
      if (c.mood <= 0 && c.state !== 'leave') { leave(c, false); if (P.puz.on && i === 0) { P.puz.close(); setActs(); } api.loseHeart(game.leaveText || '😤 A customer got tired of waiting and left!'); }
    });
    P.line = P.line.filter(c => !(c.state === 'leave' && (c.x > api.W + 80 || c.x < -80)));
    if (!P.puz.on && (api.input.pressed('serve') || api.input.pressed('action'))) openFront();
    game.update && game.update(dt, P);
    if (!P.over && P.served >= P.n) { P.over = true; setTimeout(() => game.onDone(P), 900); }
    api.score(`${game.tipIcon || '💵'} ${P.tips} · 😊 ${P.served}/${P.n}`);
    api.progress(P.served / P.n, 'Customers');
  }
  function leave(c, happy) { c.state = 'leave'; c.dir = happy ? -1 : 1; c.happy = happy; }
  function openFront() {
    const c = P.line[0];
    if (!c || c.state !== 'walk' || Math.abs(c.x - frontX()) > 30) { api.toast('Wait for a customer to reach the counter.', 1300); return; }
    if (c.tries == null) c.tries = 0;
    const j = c.job;
    P.puz.open(j.w, { prompt: j.prompt, check: j.label || '✔ Done', dim: false, onCheck: v => {
      const ok = j.check(v);
      if (ok === null) { api.toast(j.empty || 'Finish the job first!', 1300); return false; }
      if (!c.recorded) {
        c.recorded = true;
        const r = api.record({ level: j.lvl, correct: ok, prompt: String(j.prompt).replace(/<[^>]+>/g, ''), expected: j.expected || '', given: j.given ? j.given(v) : String(v), boss: P.o.boss });
        if (r.levelUp) setTimeout(() => api.chime(`⬆️ <b>Level up!</b> ${api.levelInfo(api.state.level).name}`, '🏆'), 900);
        if (r.gradeBoss) setTimeout(() => api.chime('🎓 You mastered this grade! The <b>Grade Boss</b> is ready on the menu.', '🏆'), 900);
      }
      if (ok) {
        const tip = Math.max(1, Math.round(c.mood * 5)) + (c.tries === 0 ? 2 : 0);
        P.tips += tip; P.served++; Sfx.register ? Sfx.register() : Sfx.correct(); api.confetti();
        c.say = pick(['Thank you!', 'Perfect!', 'You’re the best!', 'Wow, fast!']);
        leave(c, true); P.line.shift();
        if (j.why) api.chime(`✅ ${j.why}`, game.mascot, { ms: 5000 });
        api.toast(`${game.tipIcon || '💵'} +${tip} tip!`, 1100);
        return true;
      }
      c.tries++;
      if (c.tries >= 3 && j.reveal) { j.reveal(); api.chime(`🤝 Let's do it together. ${j.why || ''}`, game.mascot, { ms: 9000 }); }
      else api.chime(`${j.fail ? j.fail(v) : 'Not quite!'}${c.tries >= 2 && j.why ? ' ' + j.why : ''}`, game.mascot, { ms: 8000 });
      c.wait += P.patience * 0.12;
      api.loseHeart();
      return false;
    } });
  }

  function draw(ctx, W, H, title) {
    const th = game.theme || {};
    ctx.fillStyle = th.wall || '#fde7c4'; ctx.fillRect(0, 0, W, H);
    // wallpaper stripes + shelves
    ctx.fillStyle = th.stripe || 'rgba(255,255,255,.35)'; for (let x = 0; x < W; x += 60) ctx.fillRect(x, 0, 26, H);
    const floorY = H * (W < 900 && H > 500 ? 0.66 : 0.72);
    (th.shelves || []).forEach((row, r) => { const y = H * 0.22 + r * H * 0.13; ctx.fillStyle = '#b07a4a'; ctx.fillRect(W * 0.52, y + 22, W * 0.46, 8); row.forEach((e, i) => emoji(ctx, e, W * 0.55 + i * (W * 0.42 / row.length) + 20, y, Math.min(40, W * 0.06))); });
    th.backdrop && th.backdrop(ctx, W, H, P);
    ctx.fillStyle = th.floor || '#c79a6b'; ctx.fillRect(0, floorY, W, H - floorY);
    ctx.fillStyle = 'rgba(0,0,0,.06)'; for (let x = 0; x < W; x += 70) ctx.fillRect(x, floorY, 2, H);
    // door on the right
    ctx.fillStyle = '#8a5a3c'; ctx.fillRect(W - 70, floorY - 150, 60, 150); ctx.fillStyle = '#bde3ff'; ctx.fillRect(W - 62, floorY - 140, 44, 60);
    // the customers
    const cx = counterX();
    P.line.forEach(c => {
      const bob = c.state === 'walk' ? Math.sin(P.t * 8 + c.id) * 2 : 0, y = floorY - 46 + bob;
      emoji(ctx, c.face, c.x, y, 64, { flip: c.state === 'leave' && c.dir < 0 });
      if (c.state !== 'leave') {
        // patience bar
        const bw = 56; ctx.fillStyle = 'rgba(0,0,0,.2)'; roundRect(ctx, c.x - bw / 2, y - 52, bw, 8, 4); ctx.fill();
        ctx.fillStyle = c.mood > 0.5 ? '#2f9e44' : c.mood > 0.25 ? '#f59f00' : '#e03131'; roundRect(ctx, c.x - bw / 2, y - 52, bw * c.mood, 8, 4); ctx.fill();
        emoji(ctx, c.mood > 0.5 ? '🙂' : c.mood > 0.25 ? '😐' : '😠', c.x + 34, y - 48, 18);
        if (c.slot === 0 && Math.abs(c.x - frontX()) < 30 && c.job.bubble) game.drawBubble ? game.drawBubble(ctx, c, c.x, y - 70, P) : label(ctx, c.job.bubble, c.x, y - 74, { size: 15, bg: '#2b2350' });
      } else if (c.say) label(ctx, c.say, c.x, y - 60, { size: 13, bg: c.happy ? '#2f9e44' : '#e03131' });
    });
    // the counter, you behind it
    ctx.fillStyle = th.counter || '#7a4b2a'; roundRect(ctx, cx - 120, floorY - 30, 150, 80, 10); ctx.fill();
    ctx.fillStyle = th.counterTop || '#a8703f'; ctx.fillRect(cx - 126, floorY - 34, 162, 12);
    ctx.fillStyle = api.kid.color || '#ff9d3d'; ctx.beginPath(); ctx.arc(cx - 70, floorY - 70, 30, 0, 7); ctx.fill(); emoji(ctx, api.kid.avatar || '🙂', cx - 70, floorY - 70, 40);
    if (th.register) emoji(ctx, th.register, cx - 10, floorY - 58, 44);
    emoji(ctx, game.tipJar || '💰', cx - 105, floorY - 50, 28);
    game.drawOver && game.drawOver(ctx, W, H, P, { floorY, cx });
    if (!title && !P.puz.on && P.line[0] && Math.abs(P.line[0].x - frontX()) < 30 && P.line[0].state === 'walk') label(ctx, '👆 Tap the customer to help them', W / 2, floorY + (H - floorY) * 0.45, { size: 15, bg: 'rgba(43,35,80,.85)' });
    P.puz.draw(ctx, W, H);
    for (const p of P.pests) { emoji(ctx, game.pest, p.x + Math.sin(P.t * 6) * 6, p.y, 48); label(ctx, '👆 tap!', p.x, p.y - 36, { size: 12, bg: '#e03131' }); }
  }
  return {
    start, update, draw,
    onTap(x, y) {
      const p = P.pests.find(q => Math.hypot(q.x - x, q.y - y) < 46);
      if (p) { p.gone = true; Sfx.pop(); api.toast(game.shooText || '👋 Shoo!', 900); P.tips += 1; return; }
      if (P.puz.on) { P.puz.down(x, y); return; }
      const c = P.line[0]; if (c && Math.abs(x - c.x) < 60) openFront();
    },
    onMove(x, y) { P.puz.move(x, y); }, onUp(x, y) { P.puz.up(x, y); },
    tapZone: () => true,
    stop() { P.puz.close(); P.line = []; P.pests = []; api.progress(null); },
    checkpoint() { P.line.forEach(c => { c.wait = 0; }); api.toast('😊 Fresh start! The customers are patient again.'); },
    P, _P: P,
  };
}

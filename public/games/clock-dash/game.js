// Clock Dash: kart racing on a GIANT clock face! The race track is the rim of the clock, with the numbers 1–12 as
// mile markers. Every race calls a time. Drive the short RED kart around the track and park it on the HOUR, then
// drive the long BLUE kart and park it on the MINUTE. The giant clock's hands are tied to your karts, so when both
// are parked the clock shows the time. Beat Bunny's lap for a carrot bonus. Dodge oil slicks and cones (switch lanes)
// — a spin-out costs a heart. Each finished time is a checkpoint. A new track every level: meadow, desert, snow…
// Levels (must match app/Games/ClockDash.php):
// 1 O'Clock Match · 2 Half Hour Match · 3 Quarter Hours · 4 5-Minute Match · 5 Time Words Match · 6 Minute Match ·
// 7 12-Hour to 24-Hour · 8 Time Unit Switch (drive whole laps: 1 lap of the minute kart = 60 minutes!)
import { startGame, rand, pick, shuffle, clamp, emoji, roundRect, realFrom, playBox, Sfx } from '../_play/play.js';
import { LESSONS } from './lessons.js';
import { REAL } from '../_joy/js/reallife.js';
import { text, panel, button, bubble, hand, popups, particles, teach, taskLevel, inBox, INK } from '../_play/kit.js';

const pad2 = n => String(n).padStart(2, '0');
const norm = m => ((m % 1440) + 1440) % 1440;
const h12 = m => { const h = Math.floor(norm(m) / 60) % 12; return h === 0 ? 12 : h; };
const dig = m => `${h12(m)}:${pad2(norm(m) % 60)}`;
const ampm = m => `${dig(m)} ${Math.floor(norm(m) / 60) < 12 ? 'AM' : 'PM'}`;
const d24 = m => `${pad2(Math.floor(norm(m) / 60))}:${pad2(norm(m) % 60)}`;
const NUM = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
function words(m) {
  m = norm(m); const h = h12(m), mm = m % 60, next = h12(m + 60);
  if (mm === 0) return `${NUM[h]} o’clock`; if (mm === 30) return `half past ${NUM[h]}`; if (mm === 15) return `quarter past ${NUM[h]}`; if (mm === 45) return `quarter to ${NUM[next]}`;
  return mm < 30 ? `${mm} past ${NUM[h]}` : `${60 - mm} to ${NUM[next]}`;
}
const TRACKS = [
  { name: 'Meadow Ring', grass: '#7cc96a', road: '#5b5a66', deco: ['🌼', '🌳', '🐄'] },
  { name: 'Sandy Desert', grass: '#f0d08a', road: '#8a6a4a', deco: ['🌵', '🐪', '🦂'] },
  { name: 'Snowy Peak', grass: '#e8f2ff', road: '#7a8fa6', deco: ['⛄', '🌲', '🐧'] },
  { name: 'Beach Loop', grass: '#f3d899', road: '#6b7a8a', deco: ['🌴', '🦀', '🏖️'] },
  { name: 'Volcano Valley', grass: '#5a3a3a', road: '#2b2b33', deco: ['🌋', '🔥', '🦖'] },
  { name: 'City Circuit', grass: '#9aa3ad', road: '#3a3f46', deco: ['🏙️', '🚕', '🚦'] },
  { name: 'Candy Course', grass: '#ffd6ec', road: '#b06a9a', deco: ['🍭', '🍬', '🧁'] },
  { name: 'Space Speedway', grass: '#1b1a3a', road: '#4a4a7a', deco: ['🌙', '⭐', '🚀'] },
];

/** The time to build. lap: level 8 only (minutes to drive the minute kart, may be > 60). */
function makeTarget(level) {
  const H = rand(1, 12) * 60;
  if (level === 1) return { level, t: H, say: `${NUM[h12(H)]} o’clock`, show: `${h12(H)}:00`, tolH: 0.45, tolM: 3 };
  if (level === 2) { const t = H + pick([0, 30, 30]); return { level, t, say: t % 60 ? `half past ${NUM[h12(t)]}` : `${NUM[h12(t)]} o’clock`, show: dig(t), tolH: 0.5, tolM: 3 }; }
  if (level === 3) { const t = H + pick([15, 45, 30, 15, 45]); return { level, t, say: words(t), show: dig(t), tolH: 0.5, tolM: 2.5 }; }
  if (level === 4) { const t = H + rand(1, 11) * 5; return { level, t, say: dig(t), show: dig(t), tolH: 0.5, tolM: 2 }; }
  if (level === 5) { const t = H + rand(1, 11) * 5; return { level, t, say: words(t), show: words(t), tolH: 0.5, tolM: 2 }; }
  if (level === 6) { let m = rand(1, 59); if (m % 5 === 0) m++; const t = H + m; return { level, t, say: dig(t), show: dig(t), tolH: 0.5, tolM: 0.6 }; }
  if (level === 7) { const t = rand(13, 23) * 60 + pick([0, 15, 30, 45]); return { level, t, say: `${d24(t).replace(':', ' ')} hours`, show: `${d24(t)}`, sub: 'Show it on the 12-hour clock!', tolH: 0.5, tolM: 2.5, why: `${d24(t)}: take away 12 from ${Math.floor(t / 60)} → ${h12(t)}. So it's ${dig(t)} PM.` }; }
  const mins = pick([60, 90, 120, 75, 45, 105, 150, 30]); const hrs = Math.floor(mins / 60), rest = mins % 60;
  return { level, lap: mins, t: mins, say: `${hrs ? `${hrs} hour${hrs > 1 ? 's' : ''}${rest ? ` and ${rest} minutes` : ''}` : `${rest} minutes`}`, show: `${hrs ? `${hrs} h ${rest ? rest + ' min' : ''}` : rest + ' min'}`, sub: 'Drive the BLUE kart that many minutes!', tolM: 2, why: `1 hour = 60 minutes = 1 lap. ${hrs ? `${hrs} hour${hrs > 1 ? 's' : ''} = ${hrs * 60} minutes` : ''}${rest && hrs ? ` + ${rest} = ${mins}` : ''}.` };
}
const hourAngle = t => ((norm(t) % 720) / 720) * Math.PI * 2;
const minAngle = t => ((norm(t) % 60) / 60) * Math.PI * 2;
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

function createGame(api) {
  let P = null;
  const pops = popups(), fx = particles();

  function start(o) {
    const track = TRACKS[(o.real - 1) % TRACKS.length];
    P = { o, t: 0, track, n: o.boss ? 5 : o.edition <= 1 ? 4 : 5, done: 0, carrots: 0, phase: 'intro', guidedDone: !!o.boss, karts: { h: { a: 0, v: 0, lane: 0, spin: 0 }, m: { a: 0, v: 0, lane: 0, spin: 0, laps: 0, total: 0 } }, hazards: [], bunny: { a: Math.PI, v: 0 } };
    api.score('🥕 0'); api.progress(0, 'Times');
    api.goal(`🏁 Welcome to <b>${track.name}</b>! The track is a giant clock.`, { speak: true });
    setTimeout(() => P && newTarget(), 1400);
  }
  function newTarget() {
    if (P.done >= P.n) { P.phase = 'done'; api.finish({ win: true, title: `🏁 ${P.track.name} champion!`, text: `You built ${P.done} times and won ${P.carrots} carrots.` }); return; }
    const lv = taskLevel(api, P.o), T = makeTarget(lv), guided = !P.guidedDone;
    P.T = T; P.teach = teach(api, { level: lv, guided, prompt: T.say, expected: lv === 8 ? `${T.lap} minutes` : dig(T.t) }); P.showSol = guided ? 1 : 0;
    const K = P.karts; K.h.a = hourAngle(T.t) + Math.PI * (0.6 + Math.random() * 0.6); K.m.a = 0; K.m.laps = 0; K.m.total = 0; K.h.v = K.m.v = 0;
    if (lv === 8) K.h.a = 0;
    P.hazards = Array.from({ length: P.o.edition <= 1 ? 1 : 3 }, () => ({ a: Math.random() * Math.PI * 2, lane: rand(0, 1), e: pick(['🛢️', '🚧']) }));
    P.bunny = { a: 0, v: 0.25 + P.o.edition * 0.02 };
    P.phase = lv === 8 ? 'minute' : 'hour'; P.timer = 0;
    controls();
    const say = lv === 8 ? `Drive the blue minute kart for ${T.say}. One lap is 60 minutes!` : `Build ${T.say}! First drive the short red HOUR kart to ${h12(T.t)}${T.t % 60 ? ', the hour part' : ''}.`;
    api.goal(`⏰ ${lv === 8 ? 'Drive' : 'Build'} <b>${T.show}</b>${T.sub ? ` · ${T.sub}` : ''}`, { speak: false });
    api.speak((guided ? "Let's do one together. " : '') + say + (guided ? ' Hold GO to drive. Let go to stop. Then press PARK.' : ''));
  }
  function controls() { api.actions([{ key: 'left', label: '◀' }, { key: 'help', label: '💡' }, { key: 'park', label: '🅿️ Park' }, { key: 'right', label: '▶ GO', big: true }]); }
  const cur = () => (P.phase === 'hour' ? P.karts.h : P.karts.m);
  function park() {
    const T = P.T, k = cur();
    if (P.phase === 'hour') {
      const want = hourAngle(T.t), d = Math.abs(angDiff(k.a, want)) / (Math.PI * 2) * 12;
      if (d <= T.tolH) { k.a = want; Sfx.correct(); fx.burst(...pos(k.a, 0), 14); api.speak(T.t % 60 === 0 ? `Parked on ${h12(T.t)}!` : `Parked just past ${h12(T.t)}!`); P.phase = 'minute'; P.karts.m.a = 0; api.speak(`Now drive the long BLUE minute kart to ${T.t % 60 === 0 ? 'the 12, straight up' : `${T.t % 60} minutes`}.`); return; }
      return miss(`The hour kart is at about ${Math.round(((k.a / (Math.PI * 2)) * 12 + 11) % 12) + 1}. ${T.t % 60 >= 30 ? `For ${dig(T.t)} the hour hand is past ${h12(T.t)}, on the way to ${h12(T.t + 60)}.` : `Drive it to ${h12(T.t)}.`}`);
    }
    if (T.level === 8) {
      const got = Math.round(k.total), d = Math.abs(got - T.lap);
      if (d <= T.tolM) return win();
      return miss(got < T.lap ? `That's ${got} minutes. Keep driving — ${T.lap} minutes is ${T.why}` : `That's ${got} minutes — too far! Back up with ◀.`);
    }
    const want = minAngle(T.t), d = Math.abs(angDiff(k.a, want)) / (Math.PI * 2) * 60;
    if (d <= T.tolM) return win();
    const at = Math.round((((k.a / (Math.PI * 2)) * 60) % 60 + 60) % 60);
    miss(`The minute kart is at ${at} minutes. We need ${T.t % 60}. ${T.t % 60 % 5 === 0 ? `Count by 5s: the ${(T.t % 60) / 5 || 12}.` : `Count by 5s to ${Math.floor((T.t % 60) / 5) * 5}, then ${T.t % 5} little ticks.`}`);
  }
  function miss(why) {
    const n = P.teach.miss(); Sfx.wrong();
    if (n >= 3) {
      P.teach.done(false, 'parked wrong');
      api.speak(`Watch me! ${P.T.why || ''}`, { force: true });
      const K = P.karts; if (P.T.level === 8) { K.m.total = P.T.lap; K.m.a = minAngle(P.T.lap); } else { K.h.a = hourAngle(P.T.t); K.m.a = minAngle(P.T.t); }
      if (!api.loseHeart('Bunny showed you the spot.')) setTimeout(() => P && P.T && win(true), 1800);
      return;
    }
    if (n === 2) { P.teach.help(); P.showSol = 1; }
    api.speak(why, { force: true });
  }
  function win(already) {
    const T = P.T;
    if (!already) { const r = P.teach.done(true, T.level === 8 ? `${Math.round(P.karts.m.total)} minutes` : dig(T.t)); if (r.levelUp) api.chime('⭐ <b>Level up!</b> A new track opens next race!', '🐰'); }
    const beat = P.bunny.a < Math.PI * 2;
    if (beat) { P.carrots += 3; pops.add('🏁 Beat Bunny! +3 🥕', api.W / 2, api.H * 0.3, '#ff6b4a', 24); } else { P.carrots += 1; pops.add('+1 🥕', api.W / 2, api.H * 0.3); }
    api.score(`🥕 ${P.carrots}`);
    Sfx.win(); fx.burst(api.W / 2, api.H / 2, 30);
    api.speak(T.level === 8 ? `Yes! ${T.say} is ${T.lap} minutes!` : `Ding dong! The clock says ${T.level === 7 ? `${dig(T.t)} PM, that's ${d24(T.t)}` : T.say}!`);
    P.done++; P.guidedDone = true; api.progress(P.done / P.n, 'Times'); P.phase = 'cheer'; api.actions([]);
    setTimeout(() => P && newTarget(), 2200);
  }
  function geo() { const b = playBox(api.W, api.H), R = Math.min(b.w, b.h) * 0.42; return { cx: b.x + b.w / 2, cy: b.y + b.h / 2 + (api.H <= 500 ? 4 : 0), R, lane: Math.max(12, R * 0.07) }; }
  function pos(a, lane) { const G = geo(), r = G.R + (lane ? -G.lane : G.lane) * 0.9; return [G.cx + Math.sin(a) * r, G.cy - Math.cos(a) * r]; }

  return {
    start(o) { start(o); },
    checkpoint() { if (P && P.T) newTarget(); },
    stop() { P = null; },
    update(dt) {
      if (!P) return; P.t += dt; pops.update(dt); fx.update(dt);
      if (P.phase !== 'hour' && P.phase !== 'minute') return;
      const k = cur(), I = api.input;
      if (k.spin > 0) { k.spin -= dt; k.v = 0; }
      else {
        const fine = P.T.level === 6 && P.phase === 'minute' ? 0.45 : 1;
        const top = (P.phase === 'hour' ? 0.9 : 1.6) * fine;
        if (I.held('right')) k.v = Math.min(top, k.v + dt * 2.2); else if (I.held('left')) k.v = Math.max(-top * 0.5, k.v - dt * 2.2); else k.v *= Math.pow(0.0006, dt);
        if (Math.abs(k.v) < 0.01) k.v = 0;
        k.a += k.v * dt;
        if (P.phase === 'minute') { k.total = Math.max(0, (k.total || 0) + (k.v * dt) / (Math.PI * 2) * 60); }
        if (P.phase === 'hour' || P.T.level !== 8) k.a = ((k.a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        if (I.pressed('up') || I.pressed('down')) { k.lane = 1 - k.lane; Sfx.click(); }
        for (const h of P.hazards) if (h.lane === k.lane && Math.abs(angDiff(k.a, h.a)) < 0.06 && Math.abs(k.v) > 0.15) { k.spin = 1; Sfx.wrong(); pops.add('💫 Spin out!', api.W / 2, api.H * 0.25, '#e5484d'); api.loseHeart('You hit something on the track! Tap the track to switch lanes.'); h.a += 0.4; }
      }
      P.bunny.a += P.bunny.v * dt;
      if (I.pressed('park')) park();
      if (I.pressed('help')) this.hint();
    },
    hint() {
      if (!P || !P.T) return false;
      P.teach.help(); P.showSol = 1;
      const T = P.T;
      api.speak(T.level === 8 ? T.why : P.phase === 'hour' ? `The hour kart goes to ${h12(T.t)}${T.t % 60 >= 30 ? `, past the ${h12(T.t)} toward ${h12(T.t + 60)}` : ''}. Follow the glowing spot!` : `The minute kart goes to ${T.t % 60} minutes. Count by 5s around the clock. Follow the glowing spot!`, { force: true });
      return true;
    },
    coach() { if (!P || !P.T) return ''; const T = P.T; return T.level === 8 ? `${T.say} = ${T.lap} minutes. Each lap is 60.` : P.phase === 'hour' ? `Hour kart → near ${h12(T.t)}.` : `Minute kart → ${T.t % 60} min (count by 5s).`; },
    onHelp(id) { if (!P) return ''; if (id === 'boost') { P.bunny.a = Math.max(0, P.bunny.a - 1.5); return 'slowed Bunny down with a carrot!'; } return ''; },
    screen() { if (!P || !P.T) return ''; const K = P.karts; return `Target ${P.T.show}. Hour kart at ${(((K.h.a / (Math.PI * 2)) * 12 + 12) % 12 || 12).toFixed(1)}, minute kart at ${Math.round(K.m.total || ((K.m.a / (Math.PI * 2)) * 60))} min.`; },
    /** Tap the track (or press ↑/↓) to switch lanes and dodge oil and cones. */
    onTap() { if (!P || (P.phase !== 'hour' && P.phase !== 'minute')) return; const k = cur(); k.lane = 1 - k.lane; Sfx.click(); },
    draw(ctx, W, H, onTitle) {
      const tr = P ? P.track : TRACKS[0];
      ctx.fillStyle = tr.grass; ctx.fillRect(0, 0, W, H);
      const G = P ? geo() : { cx: W / 2, cy: H / 2, R: Math.min(W, H) * 0.38, lane: 20 };
      tr.deco.forEach((e, i) => { emoji(ctx, e, (i + 0.5) * W / 3, H - 30, 36, { alpha: 0.6 }); emoji(ctx, e, W - 40, 80 + i * 60, 30, { alpha: 0.5 }); });
      // the clock-face track
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(G.cx, G.cy, G.R - G.lane * 2.2, 0, 7); ctx.fill();
      ctx.strokeStyle = tr.road; ctx.lineWidth = G.lane * 4; ctx.beginPath(); ctx.arc(G.cx, G.cy, G.R, 0, 7); ctx.stroke();
      ctx.setLineDash([10, 12]); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(G.cx, G.cy, G.R, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, r1 = G.R - G.lane * 2.2, r2 = r1 - (i % 5 ? 6 : 14); ctx.strokeStyle = INK; ctx.lineWidth = i % 5 ? 2 : 4; ctx.beginPath(); ctx.moveTo(G.cx + Math.sin(a) * r1, G.cy - Math.cos(a) * r1); ctx.lineTo(G.cx + Math.sin(a) * r2, G.cy - Math.cos(a) * r2); ctx.stroke(); }
      for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2, r = G.R - G.lane * 2.2 - Math.max(22, G.R * 0.13); text(ctx, String(i), G.cx + Math.sin(a) * r, G.cy - Math.cos(a) * r, { size: Math.max(16, G.R * 0.12) }); }
      if (P && P.T && P.T.level >= 4 && P.phase === 'minute') for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r = G.R + G.lane * 3.1; text(ctx, String(i * 5), G.cx + Math.sin(a) * r, G.cy - Math.cos(a) * r, { size: Math.max(11, G.R * 0.06), color: '#fff', shadow: '#000' }); }
      // start/finish line at 12
      ctx.fillStyle = '#fff'; for (let i = 0; i < 4; i++) ctx.fillRect(G.cx - 3 + (i % 2) * 3, G.cy - G.R - G.lane * 2 + i * G.lane, 3, G.lane);
      if (onTitle || !P || !P.T) { emoji(ctx, '🏎️', G.cx, G.cy - G.R, 40); return; }
      const K = P.karts;
      // hands follow the karts
      const handTo = (a, len, w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(G.cx, G.cy); ctx.lineTo(G.cx + Math.sin(a) * len, G.cy - Math.cos(a) * len); ctx.stroke(); };
      if (P.T.level !== 8) handTo(K.h.a, G.R * 0.5, G.R * 0.07, '#e5484d');
      if (P.phase === 'minute' || P.phase === 'cheer') handTo(K.m.a, G.R * 0.75, G.R * 0.045, '#2f7de1');
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(G.cx, G.cy, G.R * 0.05, 0, 7); ctx.fill();
      // target glow (we do / help)
      if (P.showSol && P.T.level === 8) text(ctx, `${P.T.lap} min = ${Math.floor(P.T.lap / 60)} lap${P.T.lap >= 120 ? 's' : ''}${P.T.lap % 60 ? ` + ${P.T.lap % 60} min` : ''}`, G.cx, G.cy + G.R * 0.2, { size: Math.max(14, G.R * 0.08), color: '#2f7de1' });
      if (P.showSol && P.T.level !== 8 && (P.phase === 'hour' || P.phase === 'minute')) { const a = P.phase === 'hour' ? hourAngle(P.T.t) : minAngle(P.T.t); const [x, y] = pos(a, 0); ctx.save(); ctx.globalAlpha = 0.4 + 0.3 * Math.sin(P.t * 6); ctx.fillStyle = P.phase === 'hour' ? '#e5484d' : '#2f7de1'; ctx.beginPath(); ctx.arc(x, y, G.lane * 1.8, 0, 7); ctx.fill(); ctx.restore(); hand(ctx, x, y, P.t, 34); }
      // hazards, bunny, karts
      for (const h of P.hazards) { const [x, y] = pos(h.a, h.lane); emoji(ctx, h.e, x, y, G.lane * 1.6); }
      { const [x, y] = pos(P.bunny.a, 1); emoji(ctx, '🐰', x, y, G.lane * 1.8); }
      const drawKart = (k, col, label) => { const [x, y] = pos(k.a, k.lane); ctx.save(); ctx.translate(x, y); ctx.rotate(k.a + (k.spin > 0 ? P.t * 20 : 0)); ctx.fillStyle = col; roundRect(ctx, -G.lane * 1.1, -G.lane * 0.7, G.lane * 2.2, G.lane * 1.4, 6); ctx.fill(); ctx.fillStyle = '#222'; ctx.fillRect(-G.lane * 1.1, -G.lane * 0.9, G.lane * 0.5, G.lane * 0.25); ctx.fillRect(G.lane * 0.6, -G.lane * 0.9, G.lane * 0.5, G.lane * 0.25); ctx.fillRect(-G.lane * 1.1, G.lane * 0.65, G.lane * 0.5, G.lane * 0.25); ctx.fillRect(G.lane * 0.6, G.lane * 0.65, G.lane * 0.5, G.lane * 0.25); ctx.restore(); emoji(ctx, label, x, y - G.lane * 0.1, G.lane * 1.2); };
      if (P.T.level !== 8) drawKart(K.h, '#e5484d', api.kid.avatar || '🙂');
      if (P.phase === 'minute' || P.phase === 'cheer') drawKart(K.m, '#2f7de1', P.T.level === 8 || P.phase !== 'hour' ? (api.kid.avatar || '🙂') : '');
      // dashboard
      const dash = P.T.level === 8 ? `⏱️ ${Math.round(K.m.total || 0)} min · lap ${Math.floor((K.m.total || 0) / 60) + 1}  (1 lap = 60 min)` : P.phase === 'hour' ? '🔴 Hour kart' : '🔵 Minute kart';
      text(ctx, dash, G.cx, G.cy + G.R * 0.38, { size: Math.max(13, G.R * 0.075), color: '#6b6380' });
      text(ctx, `🎯 ${P.T.show}`, G.cx, G.cy - G.R * 0.32, { size: Math.max(16, G.R * 0.11), color: '#c94a2d', max: G.R * 1.3 });
      fx.draw(ctx); pops.draw(ctx);
    },
    _test: { step() {
      if (!P || !P.T) return 'none';
      const T = P.T, K = P.karts;
      if (P.phase === 'hour') { K.h.a = hourAngle(T.t); park(); return 'hour'; }
      if (P.phase === 'minute') { if (T.level === 8) K.m.total = T.lap; else K.m.a = minAngle(T.t); park(); return 'minute'; }
      return P.phase;
    }, get P() { return P; } },
  };
}

startGame({
  mascot: '🐰',
  stick: false,
  story: (d, e) => (e >= 4 ? 'Race the giant clock: 24-hour times and whole laps of minutes. One lap of the minute kart is 60 minutes!' : 'The race track is a giant clock! Park the red HOUR kart on the hour and the blue MINUTE kart on the minutes to build the time.'),
  howTo: ['▶ Hold GO to drive around the clock. ◀ backs up. Let go to stop.', '🅿️ Press PARK when your kart is on the right spot.', '🔴 Red kart = HOUR (short hand). 🔵 Blue kart = MINUTES (long hand).', '👆 Tap the track to switch lanes and dodge oil and cones!'],
  together: { helps: [{ id: 'boost', icon: '🥕', label: 'Slow Bunny', cool: 20 }] },
  lessons: level => LESSONS[level] || [],
  realLife: realFrom(REAL['clock-dash']),
  create: createGame,
});

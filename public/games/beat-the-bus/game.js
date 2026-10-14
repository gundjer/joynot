// Beat the Bus: a run-and-jump race to the bus stop. The town clock ticks while the bus drives along the
// road behind you. Holes in the sidewalk need a TIME BRIDGE: drag along the time line to the right time
// (or type the minutes) and the bridge pops into place. Wrong time = the bridge falls short (lose a heart).
// Reach the 🚏 before the bus pulls away. Dogs and birds get in the way: hop on them or jump over.
// Levels (must match app/Games/BeatTheBus.php):
// 1 One Hour Later · 2 Half an Hour Later · 3 Minutes Later · 4 Over the Hour · 5 How Long Did It Take?
// 6 When Did It Start? · 7 Across Noon (AM/PM) · 8 Busy Schedules
import { startGame, rand, pick, clamp, emoji, label, clockFace, realFrom } from '../_play/play.js';
import { platformScene, makeLevel, openStation } from '../_play/platform.js';
import { slider, keypad } from '../_play/widgets.js';
import { LESSONS } from './lessons.js';
import { REAL } from '../_joy/js/reallife.js';
import { clockText, durationText } from '../_joy/js/util.js';

const T = (m, ap = false) => clockText(m, { ampm: ap });
const STORIES = [
  ['🚌', 'The bus leaves', 'the ride takes', 'arrive'], ['🎬', 'The movie starts', 'it lasts', 'end'], ['⚽', 'Soccer practice starts', 'it lasts', 'end'],
  ['🍪', 'The cookies go in the oven', 'they bake for', 'come out'], ['🚂', 'The train leaves', 'the trip takes', 'arrive'], ['🎹', 'Piano lesson starts', 'it lasts', 'end'],
  ['🏊', 'Swim class starts', 'it lasts', 'end'], ['🎨', 'Art club starts', 'it lasts', 'end'],
];
// A new town at every level, and the bus gets a little faster each time.
const TOWNS = [
  { name: 'Maple Town', sky1: '#9fdcff', sky2: '#fff6dc', ground: '#a8743f', grass: '#c9c9c9', walker: '🐕', flyer: '🐦', deco: ['🏠', '🌳', '🏪', '🌳', '🏫', '☁️'] },
  { name: 'Sunny Beach', sky1: '#7fd4ff', sky2: '#fff2c4', ground: '#e8c27a', grass: '#f3d899', walker: '🦀', flyer: '🐦', deco: ['🌴', '⛱️', '🏖️', '🌴', '🍦', '☁️'] },
  { name: 'Farm Valley', sky1: '#a8e0ff', sky2: '#f2ffe0', ground: '#8a5a2b', grass: '#9ccc65', walker: '🐔', flyer: '🐦', deco: ['🌾', '🐄', '🚜', '🌾', '🏡', '☁️'] },
  { name: 'Mountain Pass', sky1: '#8fc8ff', sky2: '#eaf4ff', ground: '#7a6a5a', grass: '#b8c4a8', walker: '🐐', flyer: '🦅', deco: ['🏔️', '🌲', '🌲', '⛺', '🏔️', '☁️'] },
  { name: 'Big City', sky1: '#a0b4d6', sky2: '#f1f4fa', ground: '#6b6b73', grass: '#b7b7bd', walker: '🐕', flyer: '🐦', deco: ['🏙️', '🏢', '🚕', '🏬', '🏢', '☁️'] },
  { name: 'Snowy Village', sky1: '#c4dcff', sky2: '#ffffff', ground: '#9aa8b8', grass: '#eef4ff', walker: '🐧', flyer: '🦉', deco: ['⛄', '🌲', '🏠', '🌲', '⛪', '❄️'] },
  { name: 'Desert Town', sky1: '#ffcf8a', sky2: '#fff2d6', ground: '#c99a5a', grass: '#e8c48a', walker: '🦎', flyer: '🦅', deco: ['🌵', '🏜️', '🌵', '🐪', '🏠', '☀️'] },
  { name: 'Harbor Town', sky1: '#7fc4ef', sky2: '#e6f6ff', ground: '#6b7a8a', grass: '#a8b8c8', walker: '🦀', flyer: '🐦', deco: ['⛵', '⚓', '🏠', '🐟', '🚢', '☁️'] },
];
const townFor = lv => TOWNS[(lv - 1) % TOWNS.length];
const endWord = s => (s[3] === 'arrive' ? 'What time will it arrive?' : s[3] === 'come out' ? 'What time do they come out?' : 'What time does it end?');

/** One time puzzle: { kind: 'end'|'start'|'dur', startM, dur, ans, ampm, prompt, expected, parts? } */
function makeQ(level) {
  if (level <= 4) {
    const s = pick(STORIES); let startM, dur;
    if (level === 1) { startM = rand(1, 9) * 60 + (Math.random() < 0.3 ? 30 : 0); dur = rand(1, 3) * 60; }
    else if (level === 2) { startM = rand(1, 10) * 60 + (Math.random() < 0.5 ? 30 : 0); dur = pick([30, 30, 90, 60]); }
    else if (level === 3) { const m0 = rand(0, 6) * 5; startM = rand(1, 10) * 60 + m0; dur = rand(1, Math.max(1, (55 - m0) / 5)) * 5; }
    else { startM = rand(1, 10) * 60 + rand(7, 11) * 5; dur = rand(4, 11) * 5 + (Math.random() < 0.3 ? 60 : 0); }
    return { kind: 'end', e: s[0], startM, dur, ans: startM + dur, prompt: `${s[0]} ${s[1]} at <b>${T(startM)}</b> and ${s[2]} <b>${durationText(dur)}</b>. ${endWord(s)}`, expected: T(startM + dur) };
  }
  if (level === 5) {
    const s = pick(STORIES), startM = rand(1, 10) * 60 + rand(0, 11) * 5, dur = rand(3, 20) * 5;
    return { kind: 'dur', e: s[0], startM, dur, ans: dur, prompt: `${s[0]} ${s[1]} at <b>${T(startM)}</b> and is done at <b>${T(startM + dur)}</b>. How many minutes is that?`, expected: `${dur} minutes` };
  }
  if (level === 6) {
    const s = pick(STORIES), dur = rand(3, 21) * 5, endM = rand(2, 11) * 60 + rand(0, 11) * 5;
    return { kind: 'start', e: s[0], startM: endM - dur, dur, ans: endM - dur, prompt: `${s[0]} It lasted <b>${durationText(dur)}</b> and was done at <b>${T(endM)}</b>. What time did it start?`, expected: T(endM - dur) };
  }
  if (level === 7) {
    const s = pick(STORIES), startM = rand(10, 11) * 60 + rand(0, 11) * 5, dur = rand(1, 2) * 60 + rand(1, 11) * 5;
    if (startM + dur < 12 * 60) return makeQ(7);
    return { kind: 'end', e: s[0], startM, dur, ans: startM + dur, ampm: true, prompt: `${s[0]} ${s[1]} at <b>${T(startM, true)}</b> and ${s[2]} <b>${durationText(dur)}</b>. ${endWord(s)}`, expected: T(startM + dur, true) };
  }
  const v = rand(0, 2);
  if (v === 0) {
    const leave = 7 * 60 + rand(3, 9) * 5, ride = rand(3, 6) * 5, walk = rand(1, 3) * 5, school = 8 * 60 + 30, arrive = leave + ride + walk;
    return { kind: 'dur', e: '🏫', startM: arrive, dur: school - arrive, ans: school - arrive, parts: [ride, walk], prompt: `🚌 Leave at <b>${T(leave, true)}</b>, ride <b>${ride} min</b>, walk <b>${walk} min</b>. School starts at <b>${T(school, true)}</b>. How many minutes early are you?`, expected: `${school - arrive} minutes` };
  }
  if (v === 1) {
    const startM = 15 * 60 + rand(0, 6) * 5, a = rand(4, 9) * 5, b = rand(2, 6) * 5, c = rand(2, 5) * 5;
    return { kind: 'end', e: '📚', startM, dur: a + b + c, ans: startM + a + b + c, ampm: true, parts: [a, b, c], prompt: `🏫 School gets out at <b>${T(startM, true)}</b>. Ride home <b>${a} min</b>, snack <b>${b} min</b>, read <b>${c} min</b>. What time do you finish reading?`, expected: T(startM + a + b + c, true) };
  }
  const a = rand(6, 10) * 5, b = rand(3, 6) * 5, c = rand(8, 14) * 5;
  return { kind: 'dur', e: '🦁', startM: 9 * 60, dur: a + b + c, ans: a + b + c, parts: [a, b, c], prompt: `🦁 Field trip: lions <b>${a} min</b>, lunch <b>${b} min</b>, train <b>${c} min</b>. How many minutes in all?`, expected: `${a + b + c} minutes` };
}
function steps(q) {
  if (q.parts) return `Add the parts: ${q.parts.join(' + ')} = ${q.parts.reduce((x, y) => x + y, 0)} minutes.`;
  if (q.kind === 'dur') { const m = q.startM % 60; return `Count on from ${T(q.startM)}${m ? `: ${60 - m} minutes gets you to ${T(q.startM - m + 60)}` : ''}, then keep going to ${T(q.startM + q.dur)}.`; }
  if (q.kind === 'start') return `Count BACKWARD from ${T(q.startM + q.dur)} by ${durationText(q.dur)}.`;
  const m = q.startM % 60;
  if (m && m + (q.dur % 60) >= 60) return `Jump ${60 - m} minutes to ${T(q.startM - m + 60)} first, then add the rest.`;
  return `Start at ${T(q.startM, q.ampm)} and add ${durationText(q.dur)}. Hours change the first number, minutes the second.`;
}

function createGame(api) {
  let S = null;
  const scene = platformScene(api, {
    theme: { sky1: '#9fdcff', sky2: '#fff6dc', ground: '#a8743f', grass: '#c9c9c9', plat: '#d9a066', wall: '#c0603a', bridge: '#f2a20c', coin: '🎟️', goal: '🚏', walker: '🐕', flyer: '🐦', deco: ['🏠', '🌳', '🏪', '🌳', '🏫', '☁️'],
      backdrop(ctx, W, H, cam, P) { const y = P.toScreen(0, 6.6).y; ctx.fillStyle = '#7d8590'; ctx.fillRect(0, y, W, P.T * 0.42); ctx.fillStyle = '#ffd34a'; for (let x = -((cam * 0.9) % 60); x < W; x += 60) ctx.fillRect(x, y + P.T * 0.19, 26, 3); } },
    build(o, P) {
      const n = o.boss ? 5 : o.edition <= 1 ? 3 : 4, town = townFor(o.real);
      Object.assign(this.theme, { sky1: town.sky1, sky2: town.sky2, ground: town.ground, grass: town.grass, walker: town.walker, flyer: town.flyer, deco: town.deco });
      S = { o, n, town, solved: 0, start: 7 * 60 + 20, busAt: 7 * 60 + 20 + (o.edition <= 1 ? 30 : 25), lastTip: 0, tries: 0, beat: false, first: !o.boss };
      const lv = makeLevel({ stations: Array.from({ length: n }, () => ({ kind: 'gap', w: 5 })), edition: o.edition, gapEvery: o.edition <= 1 ? 0.2 : 0.3, enemy: 0.6 });
      return lv;
    },
    // the bus gets a little faster every level (and a bit faster again for the grade boss)
    rival(o, P) { const goal = P.lv.objs.find(q => q.t === 'goal').x, secs = Math.max(55, (o.edition <= 1 ? 100 : 86) + S.n * 6 - (o.real - 1) * 4 - (o.boss ? 6 : 0)); return { e: '🚌', speed: goal / secs, row: 6.15 }; },
    start(o, P) {
      api.chime(`🏘️ Welcome to <b>${S.town.name}</b>! It's <b>${T(S.start)}</b>. The bus comes at <b>${T(S.busAt)}</b>. That's <b>${S.busAt - S.start} minutes</b>. Run to the 🚏 bus stop!`, '🚌');
      api.goal(`🏃 Run to the 🚏! The bus comes at <b>${T(S.busAt)}</b>.`, { speak: false });
      api.progress(0, 'Bridges');
    },
    update(dt, P) {
      if (!P.rival) return;
      const goal = P.lv.objs.find(q => q.t === 'goal').x, now = Math.round(S.start + clamp(P.rival.x / goal, 0, 1) * (S.busAt - S.start));
      api.score(`🕒 ${T(now)} · 🚌 ${T(S.busAt)}`);
      if (now - S.lastTip >= 6 && now < S.busAt && !P.puz.on) { S.lastTip = now; if (now > S.start) api.chime(`🕒 It's ${T(now)}. The bus comes at ${T(S.busAt)}: <b>${S.busAt - now} minutes</b> left!`, '🚌', { ms: 4000 }); }
    },
    onStation(st, P) {
      const lvl = S.o.boss ? pick(S.o.bossLevels) : api.learn.work(), q = makeQ(lvl);
      st.q = q; st.lvl = lvl; st.tries = 0;
      const step = lvl === 1 ? 60 : lvl === 2 ? 30 : 5, tick = lvl <= 2 ? 30 : 15;
      const fmt = v => T(v, q.ampm), tickFmt = v => (v % 60 === 0 ? T(v, q.ampm).replace(':00', '') : '');
      let w;
      if (q.kind === 'dur') w = keypad({ header: '🌉 Type the minutes', suffix: ' min', digits: 3, art: (ctx, b) => twoClocks(ctx, b, q) });
      else {
        const span = Math.max(lvl <= 2 ? 240 : 120, Math.ceil((q.dur + rand(2, 6) * step) / 60) * 60);
        const min = q.kind === 'end' ? q.startM : q.startM + q.dur - span, max = q.kind === 'end' ? q.startM + span : q.startM + q.dur;
        w = slider({ header: q.kind === 'end' ? '🌉 Slide to the answer' : '🌉 Slide BACK to the start time', min, max, step, value: q.kind === 'end' ? min : max, ticks: tick, fmt, tickFmt, arcFrom: q.kind === 'end' ? min : max, arcText: v => `${v > (q.kind === 'end' ? min : max) ? '+' : '−'}${durationText(Math.abs(v - (q.kind === 'end' ? min : max)))}`, art: (ctx, b, v) => bridgeArt(ctx, b, q, v) });
        w.arc = api.settings.timeline === 'always' || (lvl <= 2 && api.settings.timeline !== 'never');
      }
      st.guided = S.first; S.first = false;
      if (st.guided) { w.arc = true; api.chime(`🤝 Let's build this one together. ${steps(q)}`, '🚌', { ms: 9000 }); }
      P.puz.open(w, { prompt: q.prompt, check: '🌉 Build it!', onCheck: v => check(st, v, w, P) });
    },
    drawStation(ctx, st, x, gy, T_, P) {
      // a sign with a clock, a work crew, and the hole
      emoji(ctx, '🚧', x + T_ * 0.2, gy - T_ * 0.5, T_ * 0.9);
      if (!st.done) { emoji(ctx, '👷', x - T_ * 0.9, gy - T_ * 0.55, T_ * 0.9); label(ctx, '⏰ Time bridge', x, gy - T_ * 1.6, { size: Math.max(11, T_ * 0.3), bg: '#b07200' }); }
      else label(ctx, '✔', x, gy - T_ * 1.5, { size: 14, bg: '#2f9e44' });
    },
    onGoal(P) {
      const beat = P.rival.x < P.me.x;
      api.finish({ win: true, stars: beat ? undefined : 2, title: beat ? '🚌 You caught the bus!' : '🚏 Made it to the stop!', text: beat ? 'You got to the bus stop before the bus. Right on time!' : 'The bus got there first, but the driver waited for you. Faster time bridges next time!' });
    },
    hurtText: f => (f.t === 'walk' ? '🐕 A puppy knocked you over! Jump over it or hop on top.' : '🐦 A bird swooped down! Watch the sky.'),
    fallText: () => '🕳️ Oops, you fell in a hole!',
  });

  function check(st, v, w, P) {
    const q = st.q, ok = v != null && (q.kind === 'dur' ? v === q.ans : q.ampm ? ((v % 1440) === (q.ans % 1440)) : ((v - q.ans) % 720 === 0));
    if (st.tries === 0 && v != null) { const r = api.record({ level: st.lvl, correct: ok, helped: !!st.guided, adapt: !st.guided, prompt: q.prompt.replace(/<[^>]+>/g, ''), expected: q.expected, given: q.kind === 'dur' ? `${v} minutes` : T(v, q.ampm), boss: S.o.boss }); if (r.levelUp) setTimeout(() => api.chime(`⬆️ <b>Level up!</b> ${api.levelInfo(api.state.level).name}`, '🏆'), 900); if (r.gradeBoss) setTimeout(() => api.chime('🎓 You mastered this grade! The <b>Grade Boss</b> is ready on the menu.', '🏆'), 900); }
    if (ok) {
      openStation(P, st); S.solved++; api.confetti(); api.sfx.correct();
      api.toast(st.tries === 0 ? '🌉 Perfect bridge!' : '🌉 Bridge built!', 1400);
      api.progress(S.solved / S.n, 'Bridges');
      api.goal(`🏃 Run to the 🚏! The bus comes at <b>${T(S.busAt)}</b>.`, { speak: false });
      return true;
    }
    st.tries++;
    if (v == null) { st.tries--; api.toast('Pick a time first!'); return false; }
    if (api.settings.timeline !== 'never') w.arc = true; // show the jump on the time line after a miss
    if (st.tries >= 3) { // do it together
      api.chime(`🤝 Let's do it together. ${steps(q)} The answer is <b>${q.expected}</b>.`, '🚌', { ms: 9000 });
      if (w.v !== undefined) w.v = q.ans; else w.s = String(q.ans);
      return false;
    }
    api.chime(`The bridge fell short! ${steps(q)}`, '🚌', { ms: 8000 });
    api.loseHeart();
    return false;
  }
  function twoClocks(ctx, b, q) {
    if (q.parts) { const n = q.parts.length, cw = Math.min(110, b.w / (n * 1.5)); q.parts.forEach((m, i) => { const x = b.x + b.w / 2 + (i - (n - 1) / 2) * cw * 1.45; label(ctx, `${m} min`, x, b.y + b.h / 2, { size: 18, bg: '#f2a20c' }); if (i) label(ctx, '+', x - cw * 0.72, b.y + b.h / 2, { size: 18, bg: null, color: '#2b2350' }); }); return; }
    const r = Math.min(b.h * 0.42, b.w * 0.16), y = b.y + b.h * 0.48;
    clockFace(ctx, b.x + b.w * 0.28, y, r, q.startM, {}); clockFace(ctx, b.x + b.w * 0.72, y, r, q.startM + q.dur, {});
    label(ctx, q.parts ? 'Add the parts' : `${T(q.startM)} → ${T(q.startM + q.dur)}`, b.x + b.w / 2, y, { size: 14, bg: '#2b2350' });
  }
  function bridgeArt(ctx, b, q, v) {
    const r = Math.min(b.h * 0.42, 52), y = b.y + b.h / 2;
    const known = q.kind === 'end' ? q.startM : q.startM + q.dur;
    clockFace(ctx, b.x + r + 6, y, r, known); label(ctx, q.kind === 'end' ? 'Start' : 'End', b.x + r + 6, y + r + 10, { size: 12 });
    clockFace(ctx, b.x + b.w - r - 6, y, r, v); label(ctx, 'Your time', b.x + b.w - r - 6, y + r + 10, { size: 12 });
    emoji(ctx, q.e, b.x + b.w / 2, y, Math.min(60, r * 1.2));
  }
  return { ...scene, _S: () => S };
}

startGame({
  mascot: '🚌',
  story: () => 'The bus is coming! Run and jump to the bus stop. Build time bridges over the holes before the bus pulls away.',
  howTo: ['🏃 Move with the joystick or arrow keys. Jump with ⤴ (or Space).', '🌉 At a hole, build the TIME BRIDGE: slide to the right time, or type the minutes.', '🐕 Hop on top of puppies and birds, or jump over them.', '🚏 Beat the 🚌 bus to the stop!'],
  lessons: level => LESSONS[level] || [],
  realLife: realFrom(REAL['beat-the-bus']),
  create: createGame,
});

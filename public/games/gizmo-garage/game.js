// Gizmo's Garage: a build-a-machine workshop. Every job is a real little machine on the pegboard:
// put the parts where they go, set them up, then press ⚙️ GO and watch it work (or not — then tinker and try again).
// New parts unlock as you level up: 👐 pusher & puller → ⭕ wheels → 📐 ramp → ⚖️ lever → ⚙️ gears → 🏋️ pulleys → 🔩 screw & wedge.
// Levels (must match app/Games/GizmoGarage.php):
// 1 Push or Pull? · 2 Wheels & Rolling · 3 Ramps · 4 Levers · 5 Gears: Which Way? · 6 Gears: How Fast? · 7 Pulleys ·
// 8 Screws & Wedges · 9 Machines Inside Machines · 10 Engineer's Challenge
import { startGame, rand, pick, shuffle, clamp, emoji, roundRect, realFrom, playBox, Sfx } from '../_play/play.js';
import { REAL } from '../_joy/js/reallife.js';
import { LESSONS } from './data.js';
import { text, panel, button, bubble, hand, popups, particles, teach, taskLevel, inBox, INK } from '../_play/kit.js';

const PARTS = [['👐', 'Pusher & puller', 1], ['⭕', 'Wheels', 2], ['📐', 'Ramp', 3], ['⚖️', 'Lever', 4], ['⚙️', 'Gears', 5], ['🏋️', 'Pulleys', 7], ['🔩', 'Screw & wedge', 8]];
const TOYS = ['🧸', '🚂', '🦆', '🤖', '🐶', '🎁'];

function drawGear(ctx, x, y, r, a, col) {
  const teeth = Math.max(8, Math.round(r / 5)); ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = col; ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) { const rr = i % 2 ? r * 0.8 : r, aa = (i / (teeth * 2)) * Math.PI * 2; ctx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); }
  ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(0, 0, r * 0.22, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(-2, -r * 0.7, 4, r * 0.35); ctx.restore();
}

/** One job. kind decides the UI and how GO is judged. */
function makeJob(lv) {
  if (lv === 1) { const dir = pick([1, -1]); return { lv, kind: 'pushpull', dir, toy: pick(TOYS), slots: [{ side: -1, part: null }, { side: 1, part: null }], tray: ['push', 'pull'], ask: `Get the toy to the flag on the ${dir > 0 ? 'RIGHT' : 'LEFT'}! Put a pusher or a puller next to it.` }; }
  if (lv === 2) { return { lv, kind: 'wheels', box: pick(['📦', '🧺', '🎁']), slots: [null, null], tray: ['wheel', 'square', 'triangle'], ask: 'This box is too heavy to drag. Put things under it so it ROLLS to the flag!' }; }
  if (lv === 3) { const goal = rand(45, 80) / 100; return { lv, kind: 'ramp', goal, h: 0.3, ask: `Set the ramp height so the ball rolls into the bucket. Higher ramp = faster ball = goes farther!` }; }
  if (lv === 4) { const load = pick([20, 30, 40, 60]), eff = load / pick([2, 3, 4]); return { lv, kind: 'lever', load, eff, f: 0.5, ask: `Lift the ${load}-pound stone with only a ${eff}-pound weight! Slide the ▲ fulcrum to make the lever work.` }; }
  if (lv === 5) { const want = pick(['cw', 'ccw']), min = rand(1, 3); return { lv, kind: 'gearsdir', want, min, max: 5, n: 0, ask: `The motor turns CLOCKWISE ↻. Add gears in a row (at least ${min}) so the fan spins ${want === 'cw' ? 'CLOCKWISE ↻' : 'COUNTERCLOCKWISE ↺'}.` }; }
  if (lv === 6) { const inR = pick(['big', 'small', 'medium']), want = pick(inR === 'small' ? ['slower', 'same'] : inR === 'big' ? ['faster', 'same'] : ['faster', 'slower']); return { lv, kind: 'gearsspeed', inR, want, out: null, ask: `The motor gear is ${inR.toUpperCase()}. Pick the gear for the fan so it spins ${want === 'same' ? 'the SAME speed as' : want.toUpperCase() + ' than'} the motor.` }; }
  if (lv === 7) { const w = pick([40, 60, 80]), strength = 20; return { lv, kind: 'pulley', w, strength, n: 0, ask: `The crate weighs ${w} pounds. You can pull ${strength} pounds. Add pulleys so each rope holds less! Each movable pulley adds a rope.` }; }
  if (lv === 8) {
    if (Math.random() < 0.5) { const pitch = pick([1, 2]), h = pitch * rand(3, 8); return { lv, kind: 'screw', pitch, h, turns: 0, ask: `Raise the platform ${h} inches with the screw jack. Each turn lifts it ${pitch} inch${pitch > 1 ? 'es' : ''}. How many turns?` }; }
    const need = rand(2, 4); return { lv, kind: 'wedge', need, sharp: 1, ask: 'Split the log with a wedge! A thinner, sharper wedge needs less force. Make it sharp enough for your hammer.' };
  }
  if (lv === 9) { const plan = shuffle([['ramp', '📐', 'makes the ball roll'], ['lever', '⚖️', 'flips the ball up'], ['pulley', '🏋️', 'lifts the bucket'], ['gear', '⚙️', 'spins the wheel']]).slice(0, 3); return { lv, kind: 'chain', plan, slots: [null, null, null], tray: ['ramp', 'lever', 'pulley', 'gear', 'wheel'], ask: 'Build a chain machine! Read what each step needs, then drag the right part into each spot.' }; }
  const goal = rand(76, 90) / 100, load = pick([20, 30]), eff = load / 2; return { lv, kind: 'combo', goal, h: 0.3, load, eff, f: 0.5, stage: 'ramp', ask: 'Engineer\'s challenge! First set the ramp so the ball lands on the lever, then slide the fulcrum so it launches the toy up to the shelf.' };
}
function part(ctx, k, x, y, size, o) {
  if (k !== 'wheel') return emoji(ctx, ICON[k], x, y, size, o);
  const r = size * 0.42; ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.fillStyle = '#bbb'; ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, 7); ctx.fill();
  ctx.strokeStyle = '#777'; ctx.lineWidth = 2; for (let i = 0; i < 5; i++) { const a = i * 1.2566; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55); ctx.stroke(); } ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(0, 0, r * 0.15, 0, 7); ctx.fill(); ctx.restore();
}
const ICON = { push: '👐', pull: '🧲', wheel: '⭕', square: '⬛', triangle: '🔺', ramp: '📐', lever: '⚖️', pulley: '🏋️', gear: '⚙️' };

function createGame(api) {
  let P = null;
  const pops = popups(), fx = particles();

  function start(o) {
    P = { o, t: 0, n: o.boss ? 5 : o.edition <= 1 ? 3 : 4, done: 0, guidedDone: !!o.boss, phase: 'build', anim: null };
    const unlocked = PARTS.filter(p => p[2] <= o.real), fresh = PARTS.find(p => p[2] === o.real);
    api.score('⚙️ 0'); api.progress(0, 'Machines');
    api.goal(fresh ? `🆕 New part unlocked: <b>${fresh[0]} ${fresh[1]}</b>!` : `🔧 Gizmo's Garage: ${unlocked.length} kinds of parts in your bin.`, { speak: true });
    setTimeout(() => P && nextJob(), 1200);
  }
  function nextJob() {
    if (P.done >= P.n) { P.phase = 'over'; api.finish({ win: true, title: '🔧 Garage jobs done!', text: `You built ${P.done} working machines.` }); return; }
    const lv = taskLevel(api, P.o), J = makeJob(lv), guided = !P.guidedDone;
    P.J = J; P.phase = 'build'; P.anim = null; P.showSol = guided ? 1 : 0; P.drag = null;
    P.teach = teach(api, { level: lv, guided, prompt: J.ask, expected: J.kind });
    api.actions([{ key: 'help', label: '💡 Help' }, { key: 'check', label: '⚙️ GO!', big: true }]);
    api.goal(`🔧 ${J.ask}`, { speak: false });
    api.speak((guided ? "Let's build this one together. " : '') + J.ask);
  }
  /** Decide what the machine does. Returns { ok, why, anim } */
  function judge() {
    const J = P.J;
    if (J.kind === 'pushpull') {
      let move = 0; for (const s of J.slots) { if (!s.part) continue; move += s.part === 'push' ? -s.side : s.side; }
      move = Math.sign(move);
      if (!J.slots.some(s => s.part)) return { none: true };
      return { ok: move === J.dir, move, why: move === 0 ? 'The push and the pull cancel out — the toy didn’t move!' : 'The toy went the wrong way! A PUSH moves things AWAY from it. A PULL moves things TOWARD it.' };
    }
    if (J.kind === 'wheels') { if (J.slots.some(s => !s)) return { none: true }; const ok = J.slots.every(s => s === 'wheel'); return { ok, why: ok ? '' : J.slots.includes('wheel') ? 'Almost! ALL the parts underneath need to be round to roll smoothly.' : 'Flat sides and corners scrape and stop. Round things ROLL!' }; }
    if (J.kind === 'ramp' || (J.kind === 'combo' && J.stage === 'ramp')) { const dist = 0.18 + J.h * 0.9, ok = Math.abs(dist - J.goal) < 0.06; return { ok, dist, why: dist < J.goal ? 'Too short! Make the ramp HIGHER so the ball goes faster.' : 'Too far! Make the ramp LOWER so the ball goes slower.' }; }
    if (J.kind === 'lever' || J.kind === 'combo') { const dL = J.f, dE = 1 - J.f, ok = J.eff * dE >= J.load * dL * 0.98; return { ok, why: ok ? '' : 'Not enough push! Slide the fulcrum CLOSER to the heavy stone. A longer arm on your side gives more power.' }; }
    if (J.kind === 'gearsdir') { if (J.n < J.min) return { ok: false, why: `The fan needs to reach the window. Use at least ${J.min} gear${J.min > 1 ? 's' : ''}.` }; const out = J.n % 2 === 0 ? 'ccw' : 'cw'; return { ok: out === J.want, why: 'Each gear turns the OPPOSITE way from the gear it touches. Count along: motor clockwise, next counterclockwise, next clockwise…' }; }
    if (J.kind === 'gearsspeed') { if (!J.out) return { none: true }; const size = { small: 1, medium: 2, big: 3 }, r = size[J.inR] / size[J.out], got = r > 1 ? 'faster' : r < 1 ? 'slower' : 'same'; return { ok: got === J.want, got, why: got === 'faster' ? 'That made it spin FASTER: a smaller gear turns more times.' : got === 'slower' ? 'That made it spin SLOWER: a bigger gear turns fewer times.' : 'Same size gears spin the same speed.' }; }
    if (J.kind === 'pulley') { const ropes = 1 + J.n, per = J.w / ropes; return { ok: per <= J.strength, per, why: `With ${ropes} rope${ropes > 1 ? 's' : ''}, each rope holds ${Math.round(per)} pounds. You can only pull ${J.strength}. Add a pulley!`, over: J.n > 0 && J.w / J.n <= J.strength }; }
    if (J.kind === 'screw') { const got = J.turns * J.pitch; return { ok: got === J.h, why: got < J.h ? `That only lifts ${got} inches. More turns!` : `That lifts ${got} inches — too high! Fewer turns.` }; }
    if (J.kind === 'wedge') { return { ok: J.sharp >= J.need, why: 'The hammer bounced off! Make the wedge thinner and sharper.' }; }
    if (J.kind === 'chain') { if (J.slots.some(s => !s)) return { none: true }; const bad = J.slots.findIndex((s, i) => s !== J.plan[i][0]); return { ok: bad < 0, bad, why: bad >= 0 ? `Step ${bad + 1} needs something that ${J.plan[bad][2]}.` : '' }; }
    return { ok: false };
  }
  function go() {
    const r = judge();
    if (r.none) { api.speak('Put your parts on the machine first!', { force: true }); return; }
    P.phase = 'anim'; P.anim = { t: 0, r }; Sfx.click();
  }
  function after() {
    const r = P.anim.r, J = P.J;
    if (J.kind === 'combo' && J.stage === 'ramp' && r.ok) { J.stage = 'lever'; P.phase = 'build'; P.anim = null; Sfx.correct(); api.speak('The ball lands on the lever! Now slide the fulcrum so it can launch the toy.', { force: true }); return; }
    if (r.ok) return solved();
    const n = P.teach.miss(); Sfx.wrong();
    P.phase = 'build'; P.anim = null;
    if (n >= 3) { P.teach.done(false, J.kind); api.speak(`Watch Gizmo set it up. ${r.why}`, { force: true }); solve(J); P.phase = 'auto'; if (!api.loseHeart('Gizmo fixed that machine for you.')) setTimeout(() => { if (P && P.J === J) { P.phase = 'anim'; P.anim = { t: 0, r: judge(), after: 'win' }; } }, 1500); return; }
    if (n === 2) { P.teach.help(); P.showSol = 1; }
    api.speak(r.why, { force: true });
  }
  function solve(J) {
    if (J.kind === 'pushpull') { J.slots[0].part = J.dir > 0 ? 'push' : 'pull'; J.slots[1].part = J.dir > 0 ? 'pull' : 'push'; }
    if (J.kind === 'wheels') J.slots = ['wheel', 'wheel'];
    if (J.kind === 'ramp' || J.kind === 'combo') { J.h = clamp((J.goal - 0.18) / 0.9, 0, 1); if (J.kind === 'combo') J.stage = 'lever'; }
    if (J.kind === 'lever' || J.kind === 'combo') J.f = Math.round((J.eff / (J.eff + J.load)) * 100) / 100 - 0.01;
    if (J.kind === 'gearsdir') { J.n = J.min; if ((J.n % 2 === 0 ? 'ccw' : 'cw') !== J.want) J.n++; }
    if (J.kind === 'gearsspeed') J.out = J.want === 'same' ? J.inR : J.want === 'faster' ? (J.inR === 'big' ? 'small' : 'small') : (J.inR === 'small' ? 'big' : 'big');
    if (J.kind === 'pulley') J.n = Math.ceil(J.w / J.strength) - 1;
    if (J.kind === 'screw') J.turns = J.h / J.pitch;
    if (J.kind === 'wedge') J.sharp = J.need;
    if (J.kind === 'chain') J.slots = J.plan.map(p => p[0]);
  }
  function solved() {
    const r = P.teach.done(true, P.J.kind); if (r.levelUp) api.chime('⭐ <b>Level up!</b> A new part unlocks next time!', '🔧');
    Sfx.win(); fx.burst(api.W / 2, api.H * 0.4, 28, ['#ffc93c', '#3dc2ff', '#ff6b4a']); api.speak(pick(['It works! Great engineering!', 'Whirr, click, ding! It works!', 'Machine complete!']));
    P.done++; P.guidedDone = true; api.score(`⚙️ ${P.done}`); api.progress(P.done / P.n, 'Machines'); P.phase = 'cheer'; api.actions([]);
    setTimeout(() => P && nextJob(), 1800);
  }

  // ------------------------------------------------ layout
  const L = () => { const b = playBox(api.W, api.H), short = api.H <= 500; if (!(P && P.J && (P.J.tray || P.J.kind === 'gearsspeed'))) return { b, short, tray: null, board: b }; const tray = short ? { x: b.x + b.w * 0.78, y: b.y, w: b.w * 0.22, h: b.h } : { x: b.x, y: b.y + b.h - Math.min(110, b.h * 0.2), w: b.w, h: Math.min(110, b.h * 0.2) }; const board = short ? { x: b.x, y: b.y, w: b.w * 0.77, h: b.h } : { x: b.x, y: b.y, w: b.w, h: b.h - tray.h - 8 }; return { b, short, tray, board }; };
  function trayItems() {
    const J = P.J, T = L().tray, list = J.tray || (J.kind === 'gearsspeed' ? ['small', 'medium', 'big'] : []), short = L().short, n = list.length;
    return list.map((k, i) => short ? { k, x: T.x + 6, y: T.y + 6 + i * ((T.h - 12) / Math.max(n, 1)), w: T.w - 12, h: (T.h - 12) / Math.max(n, 1) - 6 } : { k, x: T.x + 6 + i * ((T.w - 12) / Math.max(n, 1)), y: T.y + 6, w: (T.w - 12) / Math.max(n, 1) - 6, h: T.h - 12 });
  }
  /** Places on the board where parts drop or controls live. */
  function spots() {
    const J = P.J, B = L().board, cx = B.x + B.w / 2, gy = B.y + B.h * (B.h < 330 ? 0.62 : 0.72);
    if (J.kind === 'pushpull') return { cart: { x: cx, y: gy }, slots: J.slots.map(s => ({ s, x: cx + s.side * B.w * 0.18 - 40, y: gy - 50, w: 80, h: 80 })), flagL: B.x + B.w * 0.08, flagR: B.x + B.w * 0.92 };
    if (J.kind === 'wheels') return { box: { x: B.x + B.w * 0.25, y: gy - 60 }, slots: [0, 1].map(i => ({ i, x: B.x + B.w * 0.25 - 60 + i * 64, y: gy - 10, w: 56, h: 56 })) };
    if (J.kind === 'gearsdir') { const r = Math.min((B.w - 40) / 14, B.h * 0.16), x0 = B.x + 20 + r, y = B.y + B.h * 0.5, at = i => x0 + r * 2 * i; return { r, at, y, pegs: Array.from({ length: J.max }, (_, i) => ({ i, x: at(i + 1), y, r })), motor: { x: at(0), y }, fan: { x: at(J.n + 1), y } }; }
    if (J.kind === 'chain') return { slots: [0, 1, 2].map(i => ({ i, x: B.x + B.w * (0.08 + i * 0.31), y: B.y + B.h * 0.25, w: B.w * 0.26, h: B.h * 0.55 })) };
    return {};
  }
  const knob = () => { const B = L().board; return { x: B.x + B.w * 0.1, y: B.y + B.h * 0.88, w: B.w * 0.8 }; }; // slider line for ramp / lever / wedge
  const plusMinus = () => { const B = L().board, s = Math.min(64, B.h * 0.18); if (B.w < 600) { const cx = B.x + B.w / 2; return { minus: { x: cx - s * 1.6, y: B.y + B.h * 0.86 - s / 2, w: s, h: s }, plus: { x: cx + s * 0.6, y: B.y + B.h * 0.86 - s / 2, w: s, h: s } }; } return { minus: { x: B.x + B.w * 0.6, y: B.y + B.h * 0.7, w: s, h: s }, plus: { x: B.x + B.w * 0.6 + s * 2.2, y: B.y + B.h * 0.7, w: s, h: s } }; };

  return {
    start(o) { start(o); },
    checkpoint() { if (P && P.J) { P.phase = 'build'; P.anim = null; } },
    stop() { P = null; },
    update(dt) {
      if (!P) return; P.t += dt; pops.update(dt); fx.update(dt);
      if (P.phase === 'build') { if (api.input.pressed('check')) go(); if (api.input.pressed('help')) this.hint(); }
      if (P.phase === 'anim') { P.anim.t += dt; if (P.anim.t > 2.2) { if (P.anim.after === 'win') { P.anim = null; solved(); } else after(); } }
    },
    hint() {
      if (!P || !P.J || P.phase !== 'build') return false;
      P.teach.help(); P.showSol = 1;
      const J = P.J;
      api.speak({ pushpull: 'A push moves things away from the pusher. A pull brings things closer. Which side is the flag on?', wheels: 'Round things roll! Put round parts under the box.', ramp: 'Higher ramp, faster ball, longer roll. Lower ramp, slower ball, shorter roll.', lever: 'Move the fulcrum closer to the heavy stone. Your side gets longer and stronger!', gearsdir: 'Each gear turns the opposite way. One gear between: the fan turns the opposite of the motor... count!', gearsspeed: 'A smaller gear spins faster. A bigger gear spins slower. Same size, same speed.', pulley: `Divide the weight by the number of ropes. ${J.w} pounds needs ${Math.ceil(J.w / J.strength)} ropes.`, screw: `Divide: ${J.h} inches ÷ ${J.pitch} per turn.`, wedge: 'Slide it toward SHARP.', chain: 'Read each step: which part does that job?', combo: J.stage === 'ramp' ? 'Set the ramp height first.' : 'Now the fulcrum: closer to the heavy toy.' }[J.kind], { force: true });
      return true;
    },
    coach() { if (!P || !P.J) return ''; return { pushpull: 'Push = away, pull = toward.', wheels: 'Round = rolls.', ramp: 'Higher = farther.', lever: 'Fulcrum closer to the load = easier.', gearsdir: 'Gears alternate direction.', gearsspeed: 'Small gear = fast, big gear = slow.', pulley: 'Weight ÷ ropes = force.', screw: 'Height ÷ lift per turn = turns.', wedge: 'Sharper wedge = less force.', chain: 'Match each job to a part.', combo: 'Ramp, then lever.' }[P.J.kind] || ''; },
    onHelp(id) { if (!P || !P.J) return ''; if (id === 'oil') { pops.add('🛢️ oiled!', api.W / 2, api.H * 0.3); if (P.phase === 'build') { P.showSol = 1; P.teach.help(); } return 'oiled the machine and showed a tip!'; } return ''; },
    screen() { if (!P || !P.J) return ''; return `Job: ${P.J.ask}`; },
    onTap(x, y) {
      if (!P || !P.J || P.phase !== 'build') return;
      const J = P.J;
      const it = trayItems().find(q => inBox(x, y, q));
      if (it) { if (J.kind === 'gearsspeed') { J.out = it.k; Sfx.click(); api.speak(`${it.k} gear`); return; } P.drag = { k: it.k, x, y }; return; }
      const S = spots();
      if (J.kind === 'gearsdir') { const p = S.pegs.find(q => Math.abs(x - q.x) < q.r + 2 && Math.abs(y - q.y) < q.r * 2); if (p) { J.n = p.i < J.n ? p.i : p.i + 1; Sfx.click(); api.speak(`${J.n} gear${J.n === 1 ? '' : 's'}`); } return; }
      if (J.kind === 'pushpull') { const s = S.slots.find(q => inBox(x, y, q)); if (s && s.s.part) { s.s.part = null; Sfx.click(); } return; }
      if (J.kind === 'wheels') { const s = S.slots.find(q => inBox(x, y, q)); if (s && J.slots[s.i]) { J.slots[s.i] = null; Sfx.click(); } return; }
      if (J.kind === 'chain') { const s = S.slots.find(q => inBox(x, y, q)); if (s && J.slots[s.i]) { J.slots[s.i] = null; Sfx.click(); } return; }
      if (['ramp', 'lever', 'wedge', 'combo'].includes(J.kind)) { const K = knob(); if (Math.abs(y - K.y) < 40) { P.slide = true; this.onMove(x, y); } return; }
      if (J.kind === 'pulley' || J.kind === 'screw') { const pm = plusMinus(); const d = inBox(x, y, pm.plus) ? 1 : inBox(x, y, pm.minus) ? -1 : 0; if (!d) return; if (J.kind === 'pulley') J.n = clamp(J.n + d, 0, 4); else J.turns = clamp(J.turns + d, 0, 20); Sfx.click(); api.speak(J.kind === 'pulley' ? `${J.n + 1} ropes` : `${J.turns} turns`); }
    },
    onMove(x, y) {
      if (!P || !P.J) return;
      if (P.drag) { P.drag.x = x; P.drag.y = y; return; }
      if (!P.slide) return;
      const J = P.J, K = knob(), v = clamp((x - K.x) / K.w, 0, 1);
      if (J.kind === 'ramp' || (J.kind === 'combo' && J.stage === 'ramp')) J.h = Math.round(v * 20) / 20;
      else if (J.kind === 'lever' || J.kind === 'combo') J.f = clamp(Math.round(v * 20) / 20, 0.1, 0.9);
      else if (J.kind === 'wedge') J.sharp = 1 + Math.round(v * 4);
    },
    onUp(x, y) {
      if (!P || !P.J) return;
      if (P.slide) { P.slide = false; Sfx.click(); return; }
      if (!P.drag) return;
      const J = P.J, k = P.drag.k, S = spots(); P.drag = null;
      if (J.kind === 'pushpull') { const s = S.slots.find(q => inBox(x, y, q)); if (s) { s.s.part = k; Sfx.click(); api.speak(k === 'push' ? 'pusher' : 'puller'); } return; }
      if (J.kind === 'wheels') { const s = S.slots.find(q => inBox(x, y, q)); if (s) { J.slots[s.i] = k; Sfx.click(); api.speak(k); } return; }
      if (J.kind === 'chain') { const s = S.slots.find(q => inBox(x, y, q)); if (s) { J.slots[s.i] = k; Sfx.click(); api.speak(k); } }
    },
    draw(ctx, W, H, onTitle) {
      ctx.fillStyle = '#e9edf2'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#d6dce4'; for (let x = 20; x < W; x += 34) for (let y = 20; y < H; y += 34) { ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); } // pegboard
      if (onTitle || !P || !P.J) { emoji(ctx, '🔧', W * 0.4, H * 0.5, 90); emoji(ctx, '⚙️', W * 0.6, H * 0.45, 70); return; }
      const lay = L(), J = P.J, B = lay.board, A = P.anim, k = A ? Math.min(1, A.t / 1.6) : 0;
      panel(ctx, B, { fill: 'rgba(255,255,255,.85)', r: 16 });
      const gy = B.y + B.h * (B.h < 330 ? 0.62 : 0.72);
      ctx.fillStyle = '#8a6a4a'; ctx.fillRect(B.x + 10, gy + 30, B.w - 20, 8);
      const S = spots();
      if (J.kind === 'pushpull') {
        const flagX = J.dir > 0 ? S.flagR : S.flagL; emoji(ctx, '🏁', flagX, gy - 10, 46);
        const mv = A ? (A.r.move || 0) * k * B.w * 0.3 : 0;
        emoji(ctx, '🛒', S.cart.x + mv, gy, 70); emoji(ctx, J.toy, S.cart.x + mv, gy - 40, 40);
        for (const s of S.slots) { ctx.setLineDash([5, 4]); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2; roundRect(ctx, s.x, s.y, s.w, s.h, 12); ctx.stroke(); ctx.setLineDash([]); if (s.s.part) part(ctx, s.s.part, s.x + s.w / 2, s.y + s.h / 2, 52, { flip: s.s.side > 0 }); }
      } else if (J.kind === 'wheels') {
        const roll = A && A.r.ok ? k : A ? Math.min(0.08, k) : 0, bx = S.box.x + roll * B.w * 0.55;
        emoji(ctx, '🏁', B.x + B.w * 0.88, gy - 10, 46); emoji(ctx, J.box, bx, S.box.y, 80);
        S.slots.forEach(s => { const sx = s.x + roll * B.w * 0.55; ctx.setLineDash([5, 4]); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2; roundRect(ctx, sx, s.y, s.w, s.h, 10); ctx.stroke(); ctx.setLineDash([]); if (J.slots[s.i]) { ctx.save(); ctx.translate(sx + s.w / 2, s.y + s.h / 2); if (J.slots[s.i] === 'wheel') ctx.rotate(roll * 20); part(ctx, J.slots[s.i], 0, 0, 44); ctx.restore(); } });
      } else if (J.kind === 'ramp' || J.kind === 'combo') {
        const rx = B.x + B.w * 0.08, rw = B.w * 0.2, rh = B.h * 0.55 * (J.kind === 'combo' && J.stage === 'lever' ? clamp((J.goal - 0.18) / 0.9, 0, 1) : J.h) + 10;
        ctx.fillStyle = '#c47a3c'; ctx.beginPath(); ctx.moveTo(rx, gy + 30); ctx.lineTo(rx, gy + 30 - rh); ctx.lineTo(rx + rw, gy + 30); ctx.closePath(); ctx.fill();
        const gx = B.x + B.w * J.goal; if (J.kind === 'ramp') emoji(ctx, '🧺', gx, gy + 8, 50);
        let bx = rx + 8, by = gy + 22 - rh;
        if (A && (J.kind === 'ramp' || J.stage === 'ramp')) { const d = A.r.dist != null ? A.r.dist : 0.18 + J.h * 0.9; const tt = Math.min(1, A.t / 1.8); if (tt < 0.35) { const q = tt / 0.35; bx = rx + 8 + q * (rw - 8); by = gy + 22 - rh * (1 - q); } else { const q = (tt - 0.35) / 0.65; bx = rx + rw + q * (B.x + B.w * d - rx - rw); by = gy + 22; } }
        if (!(J.kind === 'combo' && J.stage === 'lever')) emoji(ctx, '⚽', bx, by, 28);
        if (J.kind === 'combo') this.drawLever(ctx, B, gy, J, A, k, gx);
        const K = knob(); this.drawSlider(ctx, K, J.kind === 'combo' && J.stage === 'lever' ? J.f : J.h, J.kind === 'combo' && J.stage === 'lever' ? '▲ fulcrum' : '📐 ramp height');
      } else if (J.kind === 'lever') { this.drawLever(ctx, B, gy, J, A, k); const K = knob(); this.drawSlider(ctx, K, J.f, '▲ fulcrum: slide it'); }
      else if (J.kind === 'gearsdir') {
        const spin = A ? A.t * 3 : P.t * 0.4, live = !A || A.r.ok || J.n >= J.min, wx = S.at(J.min + 1);
        ctx.fillStyle = '#cfe8ff'; roundRect(ctx, wx - S.r - 6, B.y + 10, B.w - (wx - B.x) + S.r - 4, B.h - 20, 12); ctx.fill(); text(ctx, 'fan goes here or farther ➡️', (wx + B.x + B.w) / 2 - S.r / 2, B.y + 26, { size: 12, color: '#3a6ea5', max: B.x + B.w - wx });
        drawGear(ctx, S.motor.x, S.y, S.r, spin, '#e5484d'); text(ctx, '↻ motor', S.motor.x, S.y + S.r + 16, { size: 12 });
        S.pegs.forEach(p => { if (p.i < J.n) drawGear(ctx, p.x, p.y, p.r, live ? (p.i % 2 ? spin : -spin) : 0, '#3a7bd5'); else if (p.i > J.n - 1 + 1 || p.i >= J.n) { ctx.fillStyle = '#999'; ctx.beginPath(); ctx.arc(p.x, p.y + S.r * 1.6, 4, 0, 7); ctx.fill(); } });
        drawGear(ctx, S.fan.x, S.y, S.r, live ? (J.n % 2 ? spin : -spin) : 0, '#22a06b'); emoji(ctx, '🌀', S.fan.x, S.y - S.r - 22, 28, { rot: live ? (J.n % 2 ? spin : -spin) : 0 });
        text(ctx, J.want === 'cw' ? 'fan must spin ↻' : 'fan must spin ↺', B.x + B.w / 2, B.y + B.h * 0.2, { size: 15, color: '#c94a2d' });
        text(ctx, 'Tap along the row to add or take away gears.', B.x + B.w / 2, B.y + B.h - 16, { size: 13, color: '#6b6380' });
        if (P.showSol) { const t = { ...J }; solve(t); if (t.n !== J.n) { const p = S.pegs[t.n - 1]; if (p) hand(ctx, p.x, p.y, P.t, 30); } }
      } else if (J.kind === 'gearsspeed') {
        const U = Math.min(B.w, B.h * 1.6), size = { small: 0.08, medium: 0.12, big: 0.16 }, rIn = U * size[J.inR], rOut = J.out ? U * size[J.out] : U * 0.1, x1 = B.x + B.w * 0.3, x2 = x1 + rIn + rOut, y = B.y + B.h * 0.45, spin = A ? A.t * 3 : P.t * 0.6;
        drawGear(ctx, x1, y, rIn, spin, '#e5484d'); text(ctx, `motor (${J.inR})`, x1, y + rIn + 16, { size: 13 });
        if (J.out) { drawGear(ctx, x2, y, rOut, -spin * rIn / rOut, '#3a7bd5'); emoji(ctx, '🌀', x2, y - rOut - 24, 30); } else { ctx.setLineDash([5, 4]); ctx.strokeStyle = '#999'; ctx.beginPath(); ctx.arc(x2, y, rOut, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
        text(ctx, `want: ${J.want === 'same' ? 'SAME speed' : J.want.toUpperCase()}`, B.x + B.w * 0.78, B.y + 30, { size: 16, color: '#c94a2d' });
      } else if (J.kind === 'pulley') {
        const ropes = 1 + J.n, per = J.w / ropes, lift = A && A.r.ok ? k : A ? 0.03 : 0, cx = B.x + B.w * 0.35, top = B.y + 20;
        ctx.fillStyle = '#555'; ctx.fillRect(B.x + 20, top, B.w * 0.5, 8);
        const cy = gy - lift * B.h * 0.4;
        for (let i = 0; i < ropes; i++) { const x = cx - 20 * (ropes - 1) / 2 + i * 20; ctx.strokeStyle = '#a0703c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, top + 8); ctx.lineTo(x, cy - 30); ctx.stroke(); if (i) { ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(x - 10, cy - 34, 12, 0, 7); ctx.fill(); } }
        emoji(ctx, '📦', cx, cy, 70); text(ctx, `${J.w} lb`, cx, cy + 46, { size: 14 });
        emoji(ctx, api.kid.avatar || '🙂', B.x + B.w * 0.62, gy - 20, 46); text(ctx, `💪 ${J.strength} lb`, B.x + B.w * 0.62, gy + 18, { size: 13 });
        text(ctx, `${ropes} rope${ropes > 1 ? 's' : ''} → ${Math.round(per)} lb each`, B.x + B.w * 0.78, B.y + 40, { size: 16, color: per <= J.strength ? '#2fae66' : '#e5484d' });
        const pm = plusMinus(); button(ctx, pm.minus, '−', { fill: '#fff' }); button(ctx, pm.plus, '+'); if (P.showSol && per > J.strength) hand(ctx, pm.plus.x + pm.plus.w / 2, pm.plus.y + pm.plus.h / 2, P.t, 28); text(ctx, '🏋️ pulleys', (pm.minus.x + pm.plus.x + pm.plus.w) / 2, (L().board.w < 600 ? pm.minus.y + pm.minus.h + 18 : pm.minus.y - 14), { size: 14 });
      } else if (J.kind === 'screw') {
        const scale = B.h * 0.4 / 20, up = A ? Math.min(J.turns * J.pitch, J.h + 4) * k : 0, px = B.x + B.w * 0.3, base = gy + 26, col = B.h * 0.12, top = base - col - up * scale, goalY = base - col - J.h * scale;
        ctx.fillStyle = '#9aa3ad'; for (let yy = base; yy > top; yy -= 9) ctx.fillRect(px - 8, yy - 5, 16, 5);
        ctx.fillStyle = '#6b4423'; ctx.fillRect(px - 60, top - 12, 120, 12); emoji(ctx, '🎁', px, top - 32, 34);
        ctx.strokeStyle = '#2fae66'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(px - 80, goalY - 12); ctx.lineTo(px + 80, goalY - 12); ctx.stroke(); ctx.setLineDash([]); text(ctx, `goal: up ${J.h} in`, px + 80, goalY - 26, { size: 13, color: '#2fae66' });
        const pm = plusMinus(); button(ctx, pm.minus, '−', { fill: '#fff' }); button(ctx, pm.plus, '+'); text(ctx, `🔩 ${J.turns} turns × ${J.pitch} in`, (pm.minus.x + pm.plus.x + pm.plus.w) / 2, (L().board.w < 600 ? pm.minus.y + pm.minus.h + 18 : pm.minus.y - 14), { size: 14 });
        if (P.showSol && J.turns !== J.h / J.pitch) hand(ctx, (J.turns < J.h / J.pitch ? pm.plus : pm.minus).x + pm.plus.w / 2, pm.plus.y + pm.plus.h / 2, P.t, 28);
      } else if (J.kind === 'wedge') {
        const lx = B.x + B.w * 0.45, ly = gy - 20, split = A && A.r.ok ? k : 0;
        ctx.fillStyle = '#a0703c'; ctx.fillRect(lx - 70 - split * 30, ly - 40, 70, 80); ctx.fillRect(lx + split * 30, ly - 40, 70, 80);
        const wW = 50 - J.sharp * 8, drop = A ? Math.min(A.r.ok ? 1 : 0.25, k) * 50 : 0;
        ctx.fillStyle = '#9aa3ad'; ctx.beginPath(); ctx.moveTo(lx - wW / 2, ly - 90 + drop); ctx.lineTo(lx + wW / 2, ly - 90 + drop); ctx.lineTo(lx, ly - 30 + drop); ctx.closePath(); ctx.fill();
        emoji(ctx, '🔨', lx + 50, ly - 110 + (A ? Math.sin(A.t * 10) * 10 : 0), 40);
        text(ctx, `This log is tough: it needs ${'★'.repeat(J.need)} sharpness`, B.x + B.w / 2, B.y + 22, { size: 15, color: '#c94a2d' }); text(ctx, `Your wedge: ${'★'.repeat(J.sharp)}${'☆'.repeat(5 - J.sharp)}`, B.x + B.w / 2, B.y + 46, { size: 15 }); const K = knob(); this.drawSlider(ctx, K, (J.sharp - 1) / 4, 'thick ◀ wedge ▶ sharp');
      } else if (J.kind === 'chain') {
        S.slots.forEach(s => { panel(ctx, s, { fill: J.slots[s.i] ? '#fff3c4' : '#f4f6f9', r: 12, shadow: false, stroke: A && A.r.ok && k * 3 > s.i ? '#2fae66' : '#c9d1db' }); text(ctx, `Step ${s.i + 1}`, s.x + s.w / 2, s.y + 16, { size: 14 }); text(ctx, `needs something that ${J.plan[s.i][2]}`, s.x + s.w / 2, s.y + 44, { size: 12, max: s.w - 10, color: '#6b6380' }); if (J.slots[s.i]) part(ctx, J.slots[s.i], s.x + s.w / 2, s.y + s.h * 0.62, Math.min(60, s.w * 0.4)); if (s.i < 2) text(ctx, '➜', s.x + s.w + B.w * 0.025, s.y + s.h / 2, { size: 22 }); });
        if (A && A.r.ok) emoji(ctx, '⚽', S.slots[Math.min(2, Math.floor(k * 3))].x + S.slots[0].w / 2, S.slots[0].y - 14, 26);
      }
      // the parts bin
      if (J.tray || J.kind === 'gearsspeed') {
        const T = lay.tray; panel(ctx, T, { fill: '#3a4a5e', r: 14 });
        for (const it of trayItems()) { const on = J.kind === 'gearsspeed' && J.out === it.k; panel(ctx, it, { fill: on ? '#ffc93c' : '#fff', r: 10, shadow: false }); if (J.kind === 'gearsspeed') { drawGear(ctx, it.x + it.w / 2, it.y + it.h * 0.42, Math.min(it.w, it.h) * ({ small: 0.16, medium: 0.24, big: 0.32 }[it.k]), 0, '#3a7bd5'); text(ctx, it.k, it.x + it.w / 2, it.y + it.h - 10, { size: 12 }); } else { part(ctx, it.k, it.x + it.w / 2, it.y + it.h * 0.42, Math.min(46, it.h * 0.5)); text(ctx, it.k === 'push' ? 'pusher' : it.k === 'pull' ? 'puller' : it.k, it.x + it.w / 2, it.y + it.h - 10, { size: 12 }); } }
        if (P.showSol && P.phase === 'build') { const want = this.nextPart(); if (want) { const it = trayItems().find(q => q.k === want); if (it) hand(ctx, it.x + it.w / 2, it.y + it.h / 2, P.t, 30); } }
      }
      if (P.drag) part(ctx, P.drag.k, P.drag.x, P.drag.y, 56);
      if (A && A.t > 1.6) text(ctx, A.r.ok ? '✅ It works!' : '❌ Not yet…', B.x + B.w / 2, B.y + 30, { size: 24, color: A.r.ok ? '#2fae66' : '#e5484d' });
      fx.draw(ctx); pops.draw(ctx);
    },
    nextPart() { const J = P.J; if (J.kind === 'pushpull') { const s = J.slots.find(q => !q.part); return s ? ((s.side < 0) === (J.dir > 0) ? 'push' : 'pull') : null; } if (J.kind === 'wheels') return J.slots.some(s => s !== 'wheel') ? 'wheel' : null; if (J.kind === 'chain') { const i = J.slots.findIndex((s, k) => s !== J.plan[k][0]); return i >= 0 ? J.plan[i][0] : null; } if (J.kind === 'gearsspeed') { const t = { ...J }; solve(t); return J.out === t.out ? null : t.out; } return null; },
    drawLever(ctx, B, gy, J, A, k, ballX) {
      const x0 = B.x + B.w * (J.kind === 'combo' ? J.goal - 0.38 : 0.15), len = B.w * (J.kind === 'combo' ? 0.4 : 0.7), fx0 = x0 + len * J.f, py = gy + 4;
      const res = A ? A.r : null, tilt = res ? (res.ok ? -0.35 : 0.08) * Math.min(1, (A.t - (J.kind === 'combo' ? 0 : 0.3)) / 0.8) : 0;
      ctx.fillStyle = '#555'; ctx.beginPath(); ctx.moveTo(fx0, py); ctx.lineTo(fx0 - 16, gy + 30); ctx.lineTo(fx0 + 16, gy + 30); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.translate(fx0, py); ctx.rotate(tilt); ctx.fillStyle = '#a0703c'; ctx.fillRect(x0 - fx0, -6, len, 12);
      emoji(ctx, J.kind === 'combo' ? '🧸' : '🗿', x0 - fx0 + 20, -30, 44); text(ctx, `${J.load} lb`, x0 - fx0 + 20, 22, { size: 12 });
      if (J.kind !== 'combo' || J.stage === 'lever') emoji(ctx, J.kind === 'combo' ? '⚽' : '🧱', x0 - fx0 + len - 18, -26, 36); else emoji(ctx, '🎯', x0 - fx0 + len - 18, -22, 28); text(ctx, `${J.eff} lb`, x0 - fx0 + len - 18, 22, { size: 12 });
      ctx.restore();
      if (J.kind === 'combo') { ctx.fillStyle = '#6b4423'; ctx.fillRect(x0 - 30, B.y + B.h * 0.2, 80, 10); text(ctx, 'shelf', x0 + 10, B.y + B.h * 0.2 - 10, { size: 12 }); }
      void ballX; void k;
    },
    drawSlider(ctx, K, v, label) { ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(K.x, K.y); ctx.lineTo(K.x + K.w, K.y); ctx.stroke(); const kx = K.x + v * K.w; ctx.fillStyle = '#ff9d3d'; ctx.beginPath(); ctx.arc(kx, K.y, 16, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); text(ctx, label, K.x + K.w / 2, K.y - 22, { size: 13, color: '#6b6380' }); if (P.showSol && P.phase === 'build') hand(ctx, kx, K.y, P.t, 30); },
    _test: { step() { if (!P || !P.J) return 'none'; if (P.phase === 'anim') { P.anim.t = 3; return 'anim'; } if (P.phase !== 'build') return P.phase; solve(P.J); go(); return P.J.kind; }, get P() { return P; }, go() { if (P && P.phase === 'build') go(); } },
  };
}

startGame({
  mascot: '🔧',
  stick: false,
  story: (d, e) => (e >= 3 ? 'Engineer\'s garage: gear trains, pulleys, screws, wedges and chain-reaction machines. Build it, test it, fix it!' : 'Gizmo needs help in the garage! Put the parts on each machine, press GO, and watch it work.'),
  howTo: ['🧰 Drag parts from the bin onto the machine (tap a part on the machine to take it off).', '🎚️ Some machines have a slider or ➖ ➕ to set them up.', '⚙️ Press GO and watch! If it doesn\'t work, change something and try again.'],
  together: { helps: [{ id: 'oil', icon: '🛢️', label: 'Oil can', cool: 20 }] },
  lessons: level => LESSONS[level] || [],
  realLife: realFrom(REAL['gizmo-garage']),
  create: createGame,
});

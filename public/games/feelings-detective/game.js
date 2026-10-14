// Feelings Detective: solve feelings mysteries! Every case has a scene with hidden clues — move your 🔍 magnifying
// glass and tap to find them (each clue is read aloud). Then crack the case:
//  😀 BUILD THE FACE: tap the eyebrows, eyes and mouth to make the face that shows the feeling.
//  🎈 CALM-DOWN TOOLS: really do them — breathe the balloon up and down, squeeze the ball, count slowly, stretch.
//  💛 KIND OR NOT: drag each idea to the friend (it helps) or to the storm cloud (it doesn't).
//  🌡️ FEELINGS THERMOMETER: put feeling words in order from small to BIG.
//  🧩 PROBLEM-SOLVING STEPS: put the steps in order.
// No answer buttons. Each case is a checkpoint; a case that goes cold after lots of tries costs a heart.
// Levels (must match app/Games/FeelingsDetective.php):
// 1 Name That Face · 2 More Faces · 3 How Would You Feel? · 4 Calm-Down Tools · 5 Being a Good Friend · 6 Big Feeling Words
// 7 Solving Problems · 8 Two Feelings at Once · 9 Walk in Their Shoes
import { startGame, rand, pick, shuffle, clamp, emoji, roundRect, realFrom, playBox, Sfx } from '../_play/play.js';
import { REAL } from '../_joy/js/reallife.js';
import { LESSONS } from './lessons.js';
import { HOW, CALM, FRIEND, SOLVE, MIXED, SHOES } from './data.js';
import { text, panel, button, bubble, hand, popups, particles, teach, taskLevel, inBox, INK } from '../_play/kit.js';

// ---------------------------------------------------------------- the face builder
const PARTS = {
  brows: ['relaxed', 'raised', 'angry', 'worried'],
  eyes: ['open', 'wide', 'closed', 'tears', 'wink', 'stars'],
  mouth: ['smile', 'frown', 'O', 'flat', 'grin', 'tongue', 'wavy', 'yawn'],
};
const BASIC = { brows: ['relaxed', 'raised', 'angry', 'worried'], eyes: ['open', 'wide', 'tears'], mouth: ['smile', 'frown', 'O', 'flat'] };
// what each feeling's face needs (any of the listed parts)
const RECIPE = {
  happy: { brows: ['relaxed', 'raised'], eyes: ['open', 'wide'], mouth: ['smile', 'grin'] },
  sad: { brows: ['worried', 'relaxed'], eyes: ['tears', 'open'], mouth: ['frown'] },
  mad: { brows: ['angry'], eyes: ['open', 'wide'], mouth: ['frown', 'flat', 'wavy'] },
  scared: { brows: ['raised', 'worried'], eyes: ['wide'], mouth: ['O', 'wavy'] },
  surprised: { brows: ['raised'], eyes: ['wide', 'open'], mouth: ['O'] },
  tired: { brows: ['relaxed'], eyes: ['closed'], mouth: ['yawn', 'flat'] },
  silly: { eyes: ['wink'], mouth: ['tongue', 'grin'] },
  worried: { brows: ['worried'], eyes: ['open', 'wide'], mouth: ['wavy', 'flat'] },
  excited: { brows: ['raised', 'relaxed'], eyes: ['stars', 'wide'], mouth: ['grin'] },
  calm: { brows: ['relaxed'], eyes: ['closed'], mouth: ['smile'] },
};
const NEAR = { sad: ['worried'], mad: [], scared: ['worried', 'surprised'], worried: ['scared', 'sad'], excited: ['happy'], happy: ['excited', 'calm'], surprised: ['scared', 'excited'], tired: ['calm'], calm: ['happy', 'tired'], silly: ['happy'] };
const matches = (f, feel) => { const R = RECIPE[feel]; return Object.keys(R).every(k => R[k].includes(f[k])); };
const feelingOf = f => Object.keys(RECIPE).find(k => matches(f, k)) || null;
const WORDFACE = { proud: 'happy', nervous: 'worried', upset: 'mad', forgiving: 'calm', jealous: 'mad', 'left out': 'sad', disappointed: 'sad', embarrassed: 'worried', lonely: 'sad', 'in pain': 'sad' };
const faceWord = w => { w = String(w).toLowerCase(); for (const k of Object.keys(RECIPE)) if (w.includes(k)) return k; for (const k of Object.keys(WORDFACE)) if (w.includes(k)) return WORDFACE[k]; return null; };

function drawFace(ctx, f, x, y, r, { color = '#ffd34d', t = 0 } = {}) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = r * 0.04; ctx.stroke();
  ctx.strokeStyle = '#3a2a1a'; ctx.fillStyle = '#3a2a1a'; ctx.lineCap = 'round'; ctx.lineWidth = r * 0.07;
  // brows
  const by = -r * 0.38, bx = r * 0.33, bw = r * 0.2;
  for (const s of [-1, 1]) {
    let a = 0, dy = 0;
    if (f.brows === 'raised') dy = -r * 0.12; else if (f.brows === 'angry') a = s * 0.45; else if (f.brows === 'worried') a = -s * 0.4;
    ctx.save(); ctx.translate(s * bx, by + dy); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(-bw, 0); ctx.lineTo(bw, 0); ctx.stroke(); ctx.restore();
  }
  // eyes
  const ey = -r * 0.12, ex = r * 0.33;
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(s * ex, ey);
    if (f.eyes === 'closed' || (f.eyes === 'wink' && s > 0)) { ctx.beginPath(); ctx.arc(0, -r * 0.03, r * 0.1, 0.2, Math.PI - 0.2); ctx.stroke(); }
    else if (f.eyes === 'stars') { ctx.fillStyle = '#e5484d'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.06 : r * 0.14, a = i * Math.PI / 5 - Math.PI / 2; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.fill(); }
    else { const big = f.eyes === 'wide' ? 1.5 : 1; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.11 * big, r * 0.13 * big, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(0, r * 0.02, r * 0.06 * (big > 1 ? 0.8 : 1), 0, 7); ctx.fill(); }
    if (f.eyes === 'tears' && s < 0) { ctx.fillStyle = '#4ba8ff'; ctx.beginPath(); ctx.ellipse(0, r * 0.25 + Math.sin(t * 3) * 2, r * 0.05, r * 0.08, 0, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  // mouth
  ctx.save(); ctx.translate(0, r * 0.4); const mw = r * 0.34;
  ctx.beginPath();
  if (f.mouth === 'smile') ctx.arc(0, -r * 0.12, mw, 0.25 * Math.PI, 0.75 * Math.PI);
  else if (f.mouth === 'grin') { ctx.moveTo(-mw, -r * 0.05); ctx.quadraticCurveTo(0, r * 0.3, mw, -r * 0.05); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); }
  else if (f.mouth === 'frown') ctx.arc(0, r * 0.18, mw, 1.25 * Math.PI, 1.75 * Math.PI);
  else if (f.mouth === 'O') { ctx.ellipse(0, 0, r * 0.11, r * 0.15, 0, 0, 7); ctx.fillStyle = '#5a2a1a'; ctx.fill(); }
  else if (f.mouth === 'flat') { ctx.moveTo(-mw * 0.8, 0); ctx.lineTo(mw * 0.8, 0); }
  else if (f.mouth === 'tongue') { ctx.arc(0, -r * 0.12, mw, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke(); ctx.beginPath(); ctx.fillStyle = '#ff6b8a'; ctx.ellipse(r * 0.05, r * 0.12, r * 0.08, r * 0.1, 0, 0, 7); ctx.fill(); }
  else if (f.mouth === 'wavy') { ctx.moveTo(-mw, 0); for (let i = 1; i <= 4; i++) ctx.quadraticCurveTo(-mw + (i - 0.5) * mw / 2, (i % 2 ? -1 : 1) * r * 0.06, -mw + i * mw / 2, 0); }
  else if (f.mouth === 'yawn') { ctx.ellipse(0, 0, r * 0.14, r * 0.2, 0, 0, 7); ctx.fillStyle = '#5a2a1a'; ctx.fill(); }
  ctx.stroke(); ctx.restore();
  if (f.eyes === 'tears') {}
  ctx.restore();
}

// ---------------------------------------------------------------- scenes + clues
const PLACES = {
  playground: { sky: '#bfe6ff', ground: '#9ad46a', things: ['🎠', '🌳'] },
  school: { sky: '#fff1d6', ground: '#c9a27a', things: ['📚', '✏️'] },
  home: { sky: '#ffe6f1', ground: '#d9b38a', things: ['🛋️', '🖼️'] },
  park: { sky: '#cdeeff', ground: '#8fd16a', things: ['🌼', '🌳'] },
  night: { sky: '#2b2b5a', ground: '#3a3a6a', things: ['🌙', '⭐'] },
};
const CLUEWORDS = [['ice cream', '🍦', 'playground'], ['puppy', '🐶', 'home'], ['dog', '🐕', 'park'], ['toy', '🧸', 'home'], ['late', '🌙', 'night'], ['beach', '🏖️', 'home'], ['box', '🎁', 'home'], ['store', '🛒', 'school'], ['moves', '🚚', 'home'], ['tower', '🧱', 'school'], ['hammock', '🌳', 'park'], ['thunder', '⛈️', 'night'], ['test', '📝', 'school'], ['homework', '📝', 'school'], ['knee', '🏥', 'playground'], ['lunch', '🍎', 'school'], ['fish', '🐟', 'home'], ['prize', '🏆', 'school'], ['crayons', '🖍️', 'school'], ['slide', '🎠', 'playground'], ['cookie', '🍪', 'home'], ['line', '🚶', 'school'], ['game', '⚽', 'playground'], ['team', '⚽', 'playground'], ['school', '🏫', 'school'], ['grandma', '👵', 'home'], ['grandpa', '👴', 'home'], ['roller coaster', '🎢', 'park'], ['play', '🎭', 'school'], ['book', '📖', 'home'], ['race', '🏃', 'playground'], ['bike', '🚲', 'park'], ['dark', '🌙', 'night'], ['soccer', '⚽', 'playground'], ['drawing', '🎨', 'school'], ['hat', '🎩', 'home'], ['surprise', '🎉', 'home'], ['clouds', '☁️', 'park'], ['doctor', '💉', 'home'], ['puzzle', '🧩', 'home'], ['vase', '🏺', 'home'], ['pencil', '✏️', 'school'], ['tablet', '📱', 'home'], ['teacher', '👩‍🏫', 'school']];
function cluesFor(sentence) {
  const s = sentence.toLowerCase(), hit = CLUEWORDS.filter(c => s.includes(c[0]));
  const place = hit.length ? hit[0][2] : pick(Object.keys(PLACES));
  const icons = hit.map(c => [c[1], c[0]]);
  const extra = [['👣', 'footprints'], ['💬', 'someone talking'], ['❗', 'something happened'], ['🔦', 'a light'], ['📍', 'a spot']];
  while (icons.length < 3) icons.push(pick(extra));
  return { place, clues: icons.slice(0, 3) };
}
const sayClean = s => String(s).replace(/[“”]/g, '"');
// emoji in the clue list that are newer than Emoji 11 get swapped for safe ones
const SAFE = {};

// ---------------------------------------------------------------- feelings thermometer + problem steps
const LADDERS = [['annoyed', 'frustrated', 'furious'], ['okay', 'glad', 'overjoyed'], ['uneasy', 'nervous', 'terrified'], ['bummed', 'sad', 'heartbroken'], ['curious', 'interested', 'fascinated'], ['sleepy', 'tired', 'exhausted'], ['calm', 'peaceful', 'blissful'], ['grumpy', 'mad', 'enraged']];
const STEPS = ['🛑 Stop and take a breath', '🔎 Name the problem and the feeling', '💡 Think of ideas', '✅ Try a fair idea'];
const TOOLS = { breathe: { icon: '🎈', name: 'balloon breathing', say: 'Hold the button to breathe IN — the balloon grows. Let go to breathe OUT slowly. Do it 3 times.' }, squeeze: { icon: '🥎', name: 'squeeze the ball', say: 'Hold to squeeze the ball tight, count to 3, then let go and relax. Do it 3 times.' }, count: { icon: '🔢', name: 'count slowly', say: 'Tap the stars slowly, one at a time, when they glow. Count to 5 with me.' }, stretch: { icon: '🙆', name: 'stretch', say: 'Follow the arrow: hold UP to stretch up high, let go to come down. 3 times.' } };
const toolFor = s => { s = s.toLowerCase(); if (/breath/.test(s)) return 'breathe'; if (/squeeze|pillow|ball/.test(s)) return 'squeeze'; if (/count/.test(s)) return 'count'; if (/stretch|jump|move/.test(s)) return 'stretch'; return pick(['breathe', 'squeeze', 'count', 'stretch']); };

function makeCase(lv) {
  if (lv <= 2) { const feel = pick(lv === 1 ? ['happy', 'sad', 'mad', 'scared'] : Object.keys(RECIPE)); const h = HOW.filter(x => x[1] === feel); const story = h.length ? pick(h) : [`Someone feels ${feel}.`, feel, '']; return { lv, kind: 'face', story: story[0], feel, named: true, parts: lv === 1 ? BASIC : PARTS, ask: `They feel ${feel.toUpperCase()}. Build a ${feel} face!`, why: story[2] }; }
  if (lv === 3) { const h = pick(HOW); return { lv, kind: 'face', story: h[0], feel: h[1], named: false, parts: PARTS, ask: 'How would YOU feel? Build the face!', why: h[2] }; }
  if (lv === 4) { const c = pick(CALM); return { lv, kind: 'calm', story: c[0], tool: toolFor(c[1]), toolText: c[1], why: c[3] }; }
  if (lv === 5) { const a = pick(FRIEND); let b = pick(FRIEND); while (b === a) b = pick(FRIEND); const cards = shuffle([[a[1], true], ...a[2].map(x => [x, false]), [b[1], true]]); return { lv, kind: 'sort', story: a[0], cards: cards.map(([t, ok]) => ({ t, ok, at: null })), why: a[3] }; }
  if (lv === 6) { const L = pick(LADDERS); return { lv, kind: 'thermo', story: 'Feelings come in small, medium and BIG sizes.', words: shuffle(L.map((w, i) => ({ w, i, at: null }))), why: `${L[0]} is a small feeling, ${L[1]} is medium, and ${L[2]} is a BIG feeling.` }; }
  if (lv === 7) { const s = pick(SOLVE); return { lv, kind: 'steps', story: s[0], idea: s[1], cards: shuffle(STEPS.map((t, i) => ({ t: i === 3 ? `✅ Try it: ${s[1]}` : t, i, at: null }))), why: s[3] }; }
  if (lv === 8) { const ok = MIXED.filter(m => { const p = m[1].split(/ and /i); return p.length === 2 && faceWord(p[0]) && faceWord(p[1]) && faceWord(p[0]) !== faceWord(p[1]); }); const m = pick(ok.length ? ok : MIXED); const p = m[1].split(/ and /i); return { lv, kind: 'two', story: m[0], feels: [faceWord(p[0]) || 'happy', faceWord(p[1]) || 'sad'], words: p, parts: PARTS, why: m[3] }; }
  const s = pick(SHOES); const feel = faceWord(s[1]) || 'sad'; const act = s[1].split(/[—:]/).slice(1).join(' ').trim() || s[1];
  const wrong = s[2].map(x => x.split(/[—:]/).slice(1).join(' ').trim() || x);
  return { lv, kind: 'shoes', story: s[0], feel, parts: PARTS, cards: shuffle([{ t: act, ok: true, at: null }, ...wrong.map(t => ({ t, ok: false, at: null }))]), why: s[3], stage: 'face' };
}

function createGame(api) {
  let P = null;
  const pops = popups(), fx = particles();

  function start(o) {
    P = { o, t: 0, n: o.boss ? 5 : o.edition <= 1 ? 3 : 4, done: 0, phase: 'clues', guidedDone: !!o.boss, mag: { x: 0.5, y: 0.5 } };
    api.score('🔍 0'); api.progress(0, 'Cases');
    nextCase();
  }
  function nextCase() {
    if (P.done >= P.n) { P.phase = 'over'; api.finish({ win: true, title: '🕵️ Cases closed!', text: `Detective, you solved ${P.done} feelings mysteries.` }); return; }
    const lv = taskLevel(api, P.o), C = makeCase(lv), K = cluesFor(C.story);
    C.place = K.place; const spots = shuffle([[0.15, 0.5], [0.85, 0.5], [0.3, 0.25], [0.7, 0.25]]).slice(0, 3);
    C.clues = K.clues.map(([e, w], i) => ({ e: SAFE[e] || e, w, x: spots[i][0] + (Math.random() - 0.5) * 0.06, y: spots[i][1] + (Math.random() - 0.5) * 0.08, found: false }));
    C.face = { brows: 'relaxed', eyes: 'open', mouth: 'flat' }; C.face2 = { brows: 'relaxed', eyes: 'open', mouth: 'flat' };
    C.who = pick(['👧', '👦', '🧒', '👩', '👨']);
    const guided = !P.guidedDone;
    P.C = C; P.phase = 'clues'; P.showSol = guided ? 1 : 0;
    P.teach = teach(api, { level: lv, guided, prompt: C.story, expected: C.feel || (C.feels && C.feels.join(' + ')) || C.toolText || 'case' });
    api.actions([{ key: 'help', label: '💡 Help' }]);
    api.goal(`🔍 Case #${P.done + 1}: find the 3 clues! Tap around the scene.`, { speak: false });
    api.speak(guided ? "New case, detective! Let's look for clues together. Tap the glowing spots with your magnifying glass." : 'New case! Find the clues.');
  }
  function clueFound(c) {
    c.found = true; Sfx.coin(); pops.add(`${c.e} ${c.w}`, ...scenePx(c.x, c.y - 0.08), '#2b2350', 18); api.speak(c.w);
    if (P.C.clues.every(q => q.found)) setTimeout(() => P && P.phase === 'clues' && crack(), 700);
  }
  function crack() {
    const C = P.C; P.phase = 'task';
    api.speak(`Here's what happened: ${sayClean(C.story)}`);
    const acts = [{ key: 'help', label: '💡 Help' }];
    if (C.kind === 'calm') { P.tool = { k: C.tool, reps: 0, v: 0, hold: false, phase: 'in', stars: 0, glow: 0, ok: 0 }; acts.push({ key: 'hold', label: `${TOOLS[C.tool].icon} HOLD`, big: true }); setTimeout(() => P && api.speak(`Let's try ${TOOLS[C.tool].name}. ${TOOLS[C.tool].say}`), 2600); }
    else acts.push({ key: 'check', label: '✔ Solve it', big: true });
    api.actions(acts);
    const ask = { face: C.ask, calm: `${C.who} needs to calm down. Do ${TOOLS[C.tool || 'breathe'].name} together!`, sort: 'Drag each idea: helps → to the friend 💛, doesn’t help → to the storm ⛈️.', thermo: 'Put the words on the thermometer: small feeling at the bottom, BIG at the top.', steps: 'Put the problem-solving steps in order!', two: 'Two feelings at once! Build BOTH faces.', shoes: 'How might they feel? Build their face.' }[C.kind];
    api.goal(`🕵️ ${ask}`, { speak: false });
    setTimeout(() => P && P.C === C && api.speak(ask), 1600);
  }
  function check() {
    const C = P.C;
    let ok = false, why = '';
    if (C.kind === 'face') {
      const got = feelingOf(C.face);
      ok = got === C.feel || (!C.named && (NEAR[C.feel] || []).includes(got));
      why = got ? `That face looks ${got.toUpperCase()}. ${C.named ? `We need ${C.feel}.` : 'Hmm, think about the clues again.'}` : 'Keep changing the face. Look at the eyebrows, eyes and mouth.';
      if (!ok) why += ` ${tipFor(C.feel)}`;
    } else if (C.kind === 'two') { const a = feelingOf(C.face), b = feelingOf(C.face2); ok = (a === C.feels[0] && b === C.feels[1]) || (a === C.feels[1] && b === C.feels[0]); why = `The clues say ${C.words.join(' and ')}. Make one face for each.`; }
    else if (C.kind === 'shoes' && C.stage === 'face') { const got = feelingOf(C.face); ok = got === C.feel || (NEAR[C.feel] || []).includes(got); if (ok) { C.stage = 'cards'; Sfx.correct(); api.speak(`Yes — they might feel ${C.feel}. Now drag each idea: does it help?`, { force: true }); api.goal('🕵️ Drag each idea: helps → 💛, doesn’t help → ⛈️.', { speak: false }); return; } why = `Look at the clues. ${tipFor(C.feel)}`; }
    else if (C.kind === 'sort' || C.kind === 'shoes') { if (C.cards.some(c => !c.at)) { api.speak('Drag every idea to the heart or the storm first!', { force: true }); return; } ok = C.cards.every(c => (c.at === 'heart') === c.ok); why = 'Look again: would that make your friend feel better?'; }
    else if (C.kind === 'thermo') { if (C.words.some(w => w.at == null)) { api.speak('Put all three words on the thermometer!', { force: true }); return; } ok = C.words.every(w => w.at === w.i); why = 'Which word is the smallest feeling? Which is the BIGGEST?'; }
    else if (C.kind === 'steps') { if (C.cards.some(c => c.at == null)) { api.speak('Put all four steps in the boxes!', { force: true }); return; } ok = C.cards.every(c => c.at === c.i); why = 'What do you do FIRST when you have a problem? Stop and breathe!'; }
    if (ok) return solved();
    miss(why);
  }
  function tipFor(feel) { return { happy: 'Happy has a big smile.', sad: 'Sad has a frown and maybe tears.', mad: 'Mad has angry eyebrows.', scared: 'Scared has wide eyes and an O mouth.', surprised: 'Surprised has raised eyebrows, wide eyes and an O mouth.', tired: 'Tired has closed eyes and a yawn.', silly: 'Silly winks and sticks out a tongue.', worried: 'Worried has worried eyebrows and a wavy mouth.', excited: 'Excited has star eyes and a big grin.', calm: 'Calm has relaxed eyebrows, closed eyes and a small smile.' }[feel] || ''; }
  function miss(why) {
    const n = P.teach.miss(); Sfx.wrong();
    if (n >= 3) {
      P.teach.done(false, '');
      api.speak(`This case was tricky. ${P.C.why || ''} Let's close it together.`, { force: true });
      if (!api.loseHeart('The case went cold — your partner helped crack it.')) setTimeout(() => P && solved(true), 2200);
      return;
    }
    if (n === 2) { P.teach.help(); P.showSol = 1; }
    api.speak(why, { force: true });
  }
  function solved(already) {
    const C = P.C;
    if (!already) { const r = P.teach.done(true, C.feel || ''); if (r.levelUp) api.chime('⭐ <b>Level up!</b> Tougher cases are coming!', '🕵️'); }
    Sfx.correct(); fx.burst(api.W / 2, api.H * 0.4, 24, ['#ffd34d', '#ff6b9d', '#3dd6a3']);
    api.speak(`Case closed! ${C.why || ''}`);
    P.done++; P.guidedDone = true; api.score(`🔍 ${P.done}`); api.progress(P.done / P.n, 'Cases'); P.phase = 'closed'; api.actions([]);
    setTimeout(() => P && nextCase(), 2600);
  }

  // ------------------------------------------------ layout
  function L() {
    const b = playBox(api.W, api.H), short = api.H <= 500;
    const scene = short ? { x: b.x, y: b.y, w: b.w * 0.42, h: b.h } : { x: b.x, y: b.y, w: b.w, h: b.h * 0.4 };
    const work = short ? { x: b.x + b.w * 0.43, y: b.y, w: b.w * 0.57, h: b.h } : { x: b.x, y: b.y + b.h * 0.42, w: b.w, h: b.h * 0.58 };
    if (P && P.phase === 'clues') { scene.x = b.x; scene.y = b.y; scene.w = b.w; scene.h = b.h; }
    return { b, short, scene, work };
  }
  const scenePx = (x, y) => { const S = L().scene; return [S.x + x * S.w, S.y + y * S.h]; };
  function faceUI(which = 0) {
    const Wk = L().work, two = P.C.kind === 'two', fw = two ? Wk.w / 2 : Wk.w, x0 = Wk.x + which * fw;
    const r = Math.min(fw * 0.22, Wk.h * 0.3), cx = x0 + fw * 0.35, cy = Wk.y + Wk.h * 0.45;
    const bw = Math.min(110, fw * 0.32), bh = Math.min(48, Wk.h * 0.17);
    const bx = x0 + fw * 0.68 - bw / 2 + (two ? fw * 0.02 : 0);
    return { cx, cy, r, btns: ['brows', 'eyes', 'mouth'].map((k, i) => ({ k, x: two ? x0 + 6 + i * ((fw - 12) / 3) : bx, y: two ? Wk.y + Wk.h - bh - 6 : cy - bh * 1.7 + i * (bh + 10), w: two ? (fw - 18) / 3 : bw, h: bh })) };
  }
  function dropUI() {
    const Wk = L().work, C = P.C;
    if (C.kind === 'thermo') { const tx = Wk.x + Wk.w * 0.25, slots = [0, 1, 2].map(i => ({ i, x: tx + 40, y: Wk.y + Wk.h * (0.72 - i * 0.28), w: Math.min(170, Wk.w * 0.38), h: 40 })); const cards = C.words.map((item, k) => (item.at != null ? { item, x: slots[item.at].x, y: slots[item.at].y, w: slots[item.at].w, h: slots[item.at].h } : { item, x: Wk.x + Wk.w * 0.66, y: Wk.y + 14 + k * 54, w: Math.min(150, Wk.w * 0.32), h: 44 })); return { tx, slots, cards }; }
    if (C.kind === 'steps') { const sw = Math.min(260, Wk.w * 0.48), slots = [0, 1, 2, 3].map(i => ({ i, x: Wk.x + 10, y: Wk.y + 8 + i * (Wk.h - 16) / 4, w: sw, h: (Wk.h - 16) / 4 - 8 })); const cards = C.cards.map((c, k) => (c.at != null ? { c, ...slots[c.at] } : { c, x: Wk.x + sw + 26, y: Wk.y + 8 + k * (Wk.h - 16) / 4, w: Wk.w - sw - 36, h: (Wk.h - 16) / 4 - 8 })); return { slots, cards }; }
    // sort: heart + storm
    const heart = { x: Wk.x + 8, y: Wk.y + Wk.h * 0.55, w: Wk.w / 2 - 12, h: Wk.h * 0.43 }, storm = { x: Wk.x + Wk.w / 2 + 4, y: Wk.y + Wk.h * 0.55, w: Wk.w / 2 - 12, h: Wk.h * 0.43 };
    const free = C.cards.filter(c => !c.at), cw = (Wk.w - 16) / Math.max(1, Math.min(2, free.length)), ch = Math.min(60, (Wk.h * 0.52 - 10) / Math.ceil(free.length / 2));
    const cards = C.cards.map(c => { if (c.at) { const box = c.at === 'heart' ? heart : storm, list = C.cards.filter(q => q.at === c.at), i = list.indexOf(c); return { c, x: box.x + 6, y: box.y + 30 + i * 30, w: box.w - 12, h: 26, small: true }; } const i = free.indexOf(c); return { c, x: Wk.x + 8 + (i % 2) * cw, y: Wk.y + 4 + Math.floor(i / 2) * (ch + 6), w: cw - 8, h: ch }; });
    return { heart, storm, cards };
  }

  return {
    start(o) { start(o); },
    checkpoint() { if (P && P.C) { P.phase = 'task'; } },
    stop() { P = null; },
    update(dt) {
      if (!P) return; P.t += dt; pops.update(dt); fx.update(dt);
      const I = api.input;
      if (I.pressed('help')) this.hint();
      if (P.phase === 'task' && P.C.kind !== 'calm' && I.pressed('check')) check();
      if (P.phase === 'task' && P.C.kind === 'calm') this.updateTool(dt, I.held('hold') || P.toolHold);
    },
    updateTool(dt, hold) {
      const T = P.tool;
      if (T.k === 'count') {
        T.glow -= dt; if (T.glow <= 0 && T.stars < 5) { T.glow = 1.6; T.ready = true; }
        return;
      }
      if (T.k === 'breathe' || T.k === 'stretch') {
        if (hold) { T.v = Math.min(1, T.v + dt / 3); if (T.v >= 1 && T.phase === 'in') { T.phase = 'out'; api.speak(T.k === 'breathe' ? 'Now let go, and breathe out slowly.' : 'Now let go and come down.'); } }
        else { if (T.phase === 'out') { T.v = Math.max(0, T.v - dt / 3.5); if (T.v <= 0) { T.reps++; T.phase = 'in'; Sfx.coin(); pops.add(`${T.reps} ✔`, api.W / 2, api.H * 0.3); if (T.reps < 3) api.speak(T.k === 'breathe' ? 'Great! Breathe in again.' : 'Great! Stretch up again.'); } } else T.v = Math.max(0, T.v - dt / 1.5); }
      } else if (T.k === 'squeeze') {
        if (hold) { T.v += dt; if (T.v >= 3 && T.phase === 'in') { T.phase = 'out'; api.speak('Now let go. Relax.'); Sfx.coin(); } }
        else { if (T.phase === 'out') { T.reps++; T.phase = 'in'; pops.add(`${T.reps} ✔`, api.W / 2, api.H * 0.3); if (T.reps < 3) api.speak('Squeeze again!'); } T.v = 0; }
      }
      if (T.reps >= 3 && !T.done) { T.done = true; P.C.calmed = 1; solved(); }
    },
    hint() {
      if (!P || !P.C) return false;
      P.showSol = 1; P.teach.help();
      const C = P.C;
      if (P.phase === 'clues') { api.speak('Look for the glowing spots and tap them!', { force: true }); return true; }
      api.speak(C.kind === 'face' || (C.kind === 'shoes' && C.stage === 'face') ? tipFor(C.feel) : C.kind === 'two' ? `${tipFor(C.feels[0])} ${tipFor(C.feels[1])}` : C.kind === 'calm' ? TOOLS[C.tool].say : C.kind === 'thermo' ? C.why : C.kind === 'steps' ? 'First, stop and breathe. Then name the problem. Then think of ideas. Then try one.' : 'Would it make your friend feel better? Then it goes to the heart.', { force: true });
      return true;
    },
    coach() { if (!P || !P.C) return ''; const C = P.C; return P.phase === 'clues' ? 'Let them find the clues, then talk about what happened.' : C.kind === 'face' ? `Ask: "How would that feel?" Target: ${C.feel}.` : C.kind === 'calm' ? 'Do the calm-down tool together — breathe with them!' : C.kind === 'two' ? `Two feelings: ${C.words.join(' + ')}.` : 'Talk about each idea: would it help?'; },
    onHelp(id) { if (!P || !P.C) return ''; if (id === 'hug') { pops.add('🤗', api.W / 2, api.H * 0.35, '#ff6b9d', 60); return 'sent you a big hug!'; } return ''; },
    screen() { if (!P || !P.C) return ''; return `Case: ${P.C.story}`; },
    onTap(x, y) {
      if (!P || !P.C) return;
      const C = P.C;
      if (P.phase === 'clues') { const S = L().scene; P.mag = { x: (x - S.x) / S.w, y: (y - S.y) / S.h }; const c = C.clues.find(q => !q.found && Math.hypot(...scenePx(q.x, q.y).map((v, i) => v - [x, y][i])) < 60); if (c) clueFound(c); else Sfx.click(); return; }
      if (P.phase !== 'task') return;
      if (C.kind === 'face' || C.kind === 'two' || (C.kind === 'shoes' && C.stage === 'face')) {
        for (const which of C.kind === 'two' ? [0, 1] : [0]) {
          const U = faceUI(which), f = which ? C.face2 : C.face, b = U.btns.find(q => inBox(x, y, q));
          const opts = (C.parts || PARTS)[b ? b.k : 'mouth'];
          if (b) { f[b.k] = opts[(opts.indexOf(f[b.k]) + 1) % opts.length]; Sfx.click(); const g = feelingOf(f); api.speak(g ? `That looks ${g}.` : f[b.k]); return; }
          if (Math.hypot(x - U.cx, y - U.cy) < U.r) { const part = y < U.cy - U.r * 0.25 ? 'brows' : y < U.cy + U.r * 0.15 ? 'eyes' : 'mouth', o = (C.parts || PARTS)[part]; f[part] = o[(o.indexOf(f[part]) + 1) % o.length]; Sfx.click(); const g = feelingOf(f); api.speak(g ? `That looks ${g}.` : f[part]); return; }
        }
        return;
      }
      if (C.kind === 'calm') { const T = P.tool; if (T.k === 'count' && T.ready) { T.ready = false; T.stars++; Sfx.coin(); api.speak(String(T.stars)); if (T.stars >= 5) { T.reps = 3; } } else if (T.k === 'count') { api.speak('Wait for the star to glow. Slowly!', { force: true }); } else P.toolHold = true; return; }
      const D = dropUI();
      const card = D.cards.slice().reverse().find(q => inBox(x, y, q));
      if (card) { P.drag = { item: card.c || card.item, x, y }; }
    },
    onMove(x, y) { if (P && P.drag) { P.drag.x = x; P.drag.y = y; } },
    onUp(x, y) {
      if (!P) return; P.toolHold = false;
      if (!P.drag) return;
      const it = P.drag.item, C = P.C, D = dropUI(); P.drag = null;
      if (C.kind === 'thermo' || C.kind === 'steps') { const s = D.slots.find(q => inBox(x, y, q)); const list = C.kind === 'thermo' ? C.words : C.cards; if (s) { const other = list.find(q => q.at === s.i); if (other) other.at = it.at; it.at = s.i; Sfx.click(); api.speak(it.w || it.t.replace(/^\S+\s/, '')); } else it.at = null; return; }
      if (inBox(x, y, D.heart)) { it.at = 'heart'; Sfx.click(); } else if (inBox(x, y, D.storm)) { it.at = 'storm'; Sfx.click(); } else it.at = null;
      api.speak(it.t);
    },
    draw(ctx, W, H, onTitle) {
      ctx.fillStyle = '#fff7ec'; ctx.fillRect(0, 0, W, H);
      if (onTitle || !P || !P.C) { drawFace(ctx, { brows: 'raised', eyes: 'stars', mouth: 'grin' }, W / 2, H * 0.48, Math.min(W, H) * 0.18); emoji(ctx, '🔍', W * 0.68, H * 0.6, 60); return; }
      const lay = L(), C = P.C, S = lay.scene, pl = PLACES[C.place] || PLACES.park;
      // the scene
      ctx.save(); roundRect(ctx, S.x, S.y, S.w, S.h, 16); ctx.clip();
      ctx.fillStyle = pl.sky; ctx.fillRect(S.x, S.y, S.w, S.h); ctx.fillStyle = pl.ground; ctx.fillRect(S.x, S.y + S.h * 0.72, S.w, S.h * 0.28);
      pl.things.forEach((e, i) => emoji(ctx, SAFE[e] || e, S.x + S.w * (0.15 + i * 0.7), S.y + S.h * 0.6, Math.min(60, S.h * 0.22), { alpha: 0.6 }));
      const who = scenePx(0.5, 0.62);
      if (P.phase === 'clues') emoji(ctx, C.who, who[0], who[1], Math.min(80, S.h * 0.25));
      else drawFace(ctx, C.kind === 'calm' ? (C.calmed ? { brows: 'relaxed', eyes: 'closed', mouth: 'smile' } : { brows: 'angry', eyes: 'open', mouth: 'frown' }) : C.face, who[0], who[1], Math.min(46, S.h * 0.18), { color: '#ffd34d', t: P.t });
      for (const c of C.clues) { const [cx, cy] = scenePx(c.x, c.y); if (c.found) emoji(ctx, c.e, cx, cy, Math.min(48, S.h * 0.16)); else if (P.phase === 'clues') { ctx.fillStyle = `rgba(255,220,80,${0.25 + 0.2 * Math.sin(P.t * 4 + c.x * 10)})`; ctx.beginPath(); ctx.arc(cx, cy, 26, 0, 7); ctx.fill(); if (P.showSol) hand(ctx, cx, cy, P.t, 32); } }
      if (P.phase === 'clues') { const [mx, my] = scenePx(P.mag.x, P.mag.y); emoji(ctx, '🔍', mx, my, 56); }
      ctx.restore();
      if (P.phase !== 'clues') { text(ctx, C.story, S.x + S.w / 2, S.y + 14, { size: 14, max: S.w - 20, base: 'top', color: pl === PLACES.night ? '#fff' : INK }); this.drawTask(ctx, lay); }
      fx.draw(ctx); pops.draw(ctx);
    },
    drawTask(ctx, lay) {
      const C = P.C, Wk = lay.work;
      panel(ctx, Wk, { fill: '#fffdf6' });
      if (C.kind === 'face' || C.kind === 'two' || (C.kind === 'shoes' && C.stage === 'face')) {
        for (const which of C.kind === 'two' ? [0, 1] : [0]) {
          const U = faceUI(which), f = which ? C.face2 : C.face, g = feelingOf(f);
          drawFace(ctx, f, U.cx, U.cy, U.r, { t: P.t });
          text(ctx, g ? `looks ${g}` : '…', U.cx, U.cy + U.r + 16, { size: 15, color: '#8a6d1f' });
          if (C.kind === 'two') text(ctx, `Feeling ${which + 1}`, U.cx, Wk.y + 14, { size: 14 });
          for (const b of U.btns) button(ctx, b, { brows: 'Eyebrows', eyes: 'Eyes', mouth: 'Mouth' }[b.k], { fill: '#e9e3ff', size: 15 });
          if (P.showSol) { const want = C.kind === 'two' ? C.feels[which] : C.feel, R = RECIPE[want]; const k = Object.keys(R).find(q => !R[q].includes(f[q])); if (k) { const b = U.btns.find(q => q.k === k); hand(ctx, b.x + b.w * 0.8, b.y + b.h * 0.6, P.t, 30); } }
        }
        return;
      }
      if (C.kind === 'calm') {
        const T = P.tool, cx = Wk.x + Wk.w / 2, cy = Wk.y + Wk.h * 0.5, r = Math.min(Wk.w, Wk.h) * 0.3;
        text(ctx, `${TOOLS[T.k].icon} ${TOOLS[T.k].name} · ${Math.min(3, T.reps)}/3`, cx, Wk.y + 18, { size: 16 });
        if (T.k === 'breathe') { const rr = r * (0.4 + 0.6 * T.v); ctx.fillStyle = '#ff6b9d'; ctx.beginPath(); ctx.ellipse(cx, cy, rr * 0.85, rr, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy + rr); ctx.lineTo(cx, Wk.y + Wk.h - 10); ctx.stroke(); text(ctx, T.phase === 'in' ? 'breathe IN… (hold)' : 'breathe OUT… (let go)', cx, Wk.y + Wk.h - 16, { size: 16 }); }
        else if (T.k === 'squeeze') { const k = T.phase === 'out' ? 1 : Math.min(1, T.v / 3); ctx.fillStyle = '#ffc93c'; ctx.beginPath(); ctx.ellipse(cx, cy, r * (1 + k * 0.25), r * (1 - k * 0.35), 0, 0, 7); ctx.fill(); text(ctx, T.phase === 'out' ? 'let go…' : `squeeze… ${Math.min(3, Math.floor(T.v) + 1)}`, cx, cy, { size: 18 }); }
        else if (T.k === 'stretch') { const k = T.v; emoji(ctx, '🙆', cx, cy + r * 0.6 - k * r * 0.9, r * 0.9); text(ctx, T.phase === 'in' ? '⬆ hold to stretch up' : '⬇ let go to come down', cx, Wk.y + Wk.h - 18, { size: 15 }); }
        else { for (let i = 0; i < 5; i++) { const x = Wk.x + Wk.w * (0.15 + i * 0.175), lit = i < T.stars, glow = i === T.stars && T.ready; emoji(ctx, lit ? '⭐' : '✨', x, cy, glow ? 54 : 40, { alpha: lit || glow ? 1 : 0.3 }); if (glow) hand(ctx, x, cy, P.t, 30); } text(ctx, `${T.stars} …`, cx, cy + 60, { size: 22 }); }
        return;
      }
      if (C.kind === 'thermo') {
        const D = dropUI(); ctx.fillStyle = '#e8e8e8'; roundRect(ctx, D.tx - 14, Wk.y + 16, 28, Wk.h - 40, 14); ctx.fill();
        const grd = ctx.createLinearGradient(0, Wk.y + Wk.h, 0, Wk.y); grd.addColorStop(0, '#3dd6a3'); grd.addColorStop(0.5, '#ffc93c'); grd.addColorStop(1, '#e5484d'); ctx.fillStyle = grd; roundRect(ctx, D.tx - 8, Wk.y + 24, 16, Wk.h - 56, 8); ctx.fill();
        ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(D.tx, Wk.y + Wk.h - 20, 18, 0, 7); ctx.fill();
        D.slots.forEach(s => { ctx.setLineDash([5, 4]); ctx.strokeStyle = '#bbb'; ctx.lineWidth = 2; roundRect(ctx, s.x, s.y, s.w, s.h, 10); ctx.stroke(); ctx.setLineDash([]); text(ctx, ['small', 'medium', 'BIG'][s.i], D.tx - 24, s.y + s.h / 2, { size: 13, color: '#888', align: 'right' }); });
        for (const c of D.cards) { if (P.drag && P.drag.item === c.item) continue; panel(ctx, c, { fill: '#fff3c4', r: 10, shadow: false }); text(ctx, c.item.w, c.x + c.w / 2, c.y + c.h / 2, { size: 16 }); }
        if (P.drag) { const w = P.drag.item; panel(ctx, { x: P.drag.x - 70, y: P.drag.y - 20, w: 140, h: 40 }, { fill: '#fff3c4', r: 10 }); text(ctx, w.w, P.drag.x, P.drag.y, { size: 16 }); }
        return;
      }
      if (C.kind === 'steps') {
        const D = dropUI();
        D.slots.forEach(s => { ctx.setLineDash([5, 4]); ctx.strokeStyle = '#bbb'; ctx.lineWidth = 2; roundRect(ctx, s.x, s.y, s.w, s.h, 10); ctx.stroke(); ctx.setLineDash([]); text(ctx, String(s.i + 1), s.x + 14, s.y + s.h / 2, { size: 18, color: '#bbb' }); });
        for (const c of D.cards) { if (P.drag && P.drag.item === c.c) continue; panel(ctx, c, { fill: '#e9f7ff', r: 10, shadow: false }); text(ctx, c.c.t, c.x + 28, c.y + c.h / 2, { size: 13, align: 'left', max: c.w - 34 }); }
        if (P.drag) { panel(ctx, { x: P.drag.x - 120, y: P.drag.y - 22, w: 240, h: 44 }, { fill: '#e9f7ff', r: 10 }); text(ctx, P.drag.item.t, P.drag.x, P.drag.y, { size: 13, max: 230 }); }
        if (P.showSol) { const nxt = C.cards.find(c => c.at !== c.i); if (nxt) { const cc = D.cards.find(q => q.c === nxt); hand(ctx, cc.x + 20, cc.y + cc.h / 2, P.t, 28); } }
        return;
      }
      // sort (friend / shoes cards)
      const D = dropUI();
      panel(ctx, D.heart, { fill: '#ffe6ef', r: 14, shadow: false }); text(ctx, '💛 Helps', D.heart.x + D.heart.w / 2, D.heart.y + 14, { size: 15 });
      panel(ctx, D.storm, { fill: '#e6ecf5', r: 14, shadow: false }); text(ctx, '⛈️ Doesn’t help', D.storm.x + D.storm.w / 2, D.storm.y + 14, { size: 15 });
      for (const c of D.cards) { if (P.drag && P.drag.item === c.c) continue; panel(ctx, c, { fill: c.small ? '#fff' : '#fff3c4', r: 10, shadow: false }); text(ctx, c.c.t, c.x + c.w / 2, c.y + c.h / 2, { size: c.small ? 11 : 13, max: c.w - 10 }); }
      if (P.drag) { panel(ctx, { x: P.drag.x - 110, y: P.drag.y - 26, w: 220, h: 52 }, { fill: '#fff3c4', r: 10 }); text(ctx, P.drag.item.t, P.drag.x, P.drag.y, { size: 13, max: 210 }); }
      if (P.showSol) { const nxt = C.cards.find(c => !c.at); if (nxt) { const cc = D.cards.find(q => q.c === nxt); hand(ctx, cc.x + cc.w / 2, cc.y + cc.h / 2, P.t, 28); } }
    },
    _test: { step() {
      if (!P || !P.C) return 'none';
      const C = P.C;
      if (P.phase === 'clues') { C.clues.forEach(c => (c.found = true)); crack(); return 'clues'; }
      if (P.phase !== 'task') return P.phase;
      const set = (f, feel) => { const R = RECIPE[feel]; for (const k of ['brows', 'eyes', 'mouth']) f[k] = R[k] ? R[k][0] : f[k]; };
      if (C.kind === 'face') set(C.face, C.feel);
      else if (C.kind === 'two') { set(C.face, C.feels[0]); set(C.face2, C.feels[1]); }
      else if (C.kind === 'shoes') { if (C.stage === 'face') set(C.face, C.feel); else C.cards.forEach(c => (c.at = c.ok ? 'heart' : 'storm')); }
      else if (C.kind === 'sort') C.cards.forEach(c => (c.at = c.ok ? 'heart' : 'storm'));
      else if (C.kind === 'thermo') C.words.forEach(w => (w.at = w.i));
      else if (C.kind === 'steps') C.cards.forEach(c => (c.at = c.i));
      else if (C.kind === 'calm') { P.tool.reps = 3; return 'calm'; }
      check(); return C.kind;
    }, get P() { return P; } },
  };
}

startGame({
  mascot: '🕵️',
  stick: false,
  story: (d, e) => (e >= 3 ? 'Detective, crack tougher feelings cases: big feeling words, problem-solving steps, two feelings at once, and walking in someone else’s shoes.' : 'Be a Feelings Detective! Find the clues, then build the face that shows how someone feels — and help them calm down.'),
  howTo: ['🔍 Tap around the scene to find 3 clues.', '😀 Tap the eyebrows, eyes and mouth to build a face.', '🎈 Calm-down tools: hold and let go slowly, just like real breathing.', '💛 Drag ideas to the heart if they help.'],
  together: { helps: [{ id: 'hug', icon: '🤗', label: 'Send a hug', cool: 15 }] },
  lessons: level => LESSONS[level] || [],
  realLife: realFrom(REAL['feelings-detective']),
  create: createGame,
});

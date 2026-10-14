// Pip's mini-lessons. Runs when he gets one wrong (or taps "Help me").
import { FLASHLIGHT_STEPS, fracWords } from './curriculum-math.js';

const PLACE = ['ones', 'tens', 'hundreds', 'thousands'];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ===================== READING =====================
export async function teachReading(item, box, k) {
  if (item.type === 'phrase') return teachPhrase(item, box, k);
  const sight = item.type === 'sight';
  box.innerHTML = `
    ${sight ? '<div class="heart">❤️ Heart Word</div>' : ''}
    <div class="tiles">${item.chunks.map((c, i) => `<span class="tile ${c.silent ? 'silent' : ''} ${c.long ? 'long' : ''}" data-i="${i}">${esc(c.t)}</span>`).join('')}</div>
    <div class="teach-note"></div>`;
  const tiles = [...box.querySelectorAll('.tile')], note = box.querySelector('.teach-note');

  if (sight) {
    await k.say('This is a heart word. We learn heart words by heart! Let\'s spell it.');
    for (let i = 0; i < tiles.length; i++) { if (!k.alive()) return; tiles[i].classList.add('lit'); await k.say(item.chunks[i].say, { rate: 0.8 }); tiles[i].classList.replace('lit', 'done'); }
    tiles.forEach(t => t.classList.add('lit'));
    await k.say(`That spells ${item.text}.`);
    await k.sleep(300); await k.say(item.text, { rate: 0.7 });
    return;
  }

  await k.say(item.syllables ? 'Let\'s break it into parts.' : 'Let\'s sound it out together.');
  for (let i = 0; i < tiles.length; i++) {
    if (!k.alive()) return;
    const c = item.chunks[i];
    tiles[i].classList.add('lit');
    if (c.silent) { note.textContent = 'Shh! This letter is quiet.'; await k.say(`The ${c.t} is quiet!`); }
    else await k.say(c.say, { rate: 0.8 });
    tiles[i].classList.replace('lit', 'done');
    await k.sleep(150);
  }
  if (item.tip) { note.textContent = item.tip; await k.say(item.tip); }
  if (!k.alive()) return;
  note.textContent = 'Now blend it together!';
  await k.say('Now put it together.');
  // sweep across the tiles while saying it slowly
  tiles.forEach(t => t.classList.remove('done'));
  for (const t of tiles) { t.classList.add('lit'); await k.sleep(170); }
  await k.say(item.text, { rate: 0.55 });
  await k.say(`${item.text}. The word is ${item.text}.`, { rate: 0.9 });
}

async function teachPhrase(item, box, k) {
  box.innerHTML = `<div class="phrase">${item.text.split(' ').map((w, i) => `<span class="pw" data-i="${i}">${esc(w)}</span>`).join(' ')}</div><div class="teach-note">Read one word at a time. Point to each word!</div>`;
  const ws = [...box.querySelectorAll('.pw')];
  await k.say('Let\'s read it one word at a time.');
  for (const el of ws) { if (!k.alive()) return; el.classList.add('lit'); await k.say(el.textContent.replace(/[.,?!]/g, ''), { rate: 0.75 }); el.classList.replace('lit', 'done'); }
  ws.forEach(e => e.classList.add('lit'));
  await k.say('Now the whole thing.');
  await k.say(item.text, { rate: 0.85 });
}

// ===================== MATH =====================
export async function teachMath(item, box, k) {
  switch (item.kind) {
    case 'count': return teachCount(item, box, k);
    case 'add': return (item.a + item.b <= 20) ? teachAddSmall(item, box, k) : teachColumn(item, box, k);
    case 'sub': return (item.a <= 20) ? teachSubSmall(item, box, k) : teachColumn(item, box, k);
    case 'missing': return teachMissing(item, box, k);
    case 'place': return teachPlace(item, box, k);
    case 'mul': return item.a >= 11 ? teachBreakApart(item, box, k) : teachArray(item, box, k);
    case 'div': return teachDivide(item, box, k);
    case 'frac': return teachFraction(item, box, k);
    case 'word': return teachWord(item, box, k);
  }
}

function dotsHTML(n, cls = '', start = 0) {
  let h = ''; for (let i = 0; i < n; i++) h += `<span class="dot ${cls}" data-i="${start + i}"></span>`; return h;
}
function frames(groups) { // groups: [{n, cls}] -> ten frames
  let all = []; groups.forEach(g => { for (let i = 0; i < g.n; i++) all.push(g.cls); });
  const total = Math.max(10, Math.ceil(all.length / 10) * 10);
  let h = '<div class="frames">';
  for (let f = 0; f < total / 10; f++) {
    h += '<div class="frame">';
    for (let i = 0; i < 10; i++) { const idx = f * 10 + i; h += idx < all.length ? `<span class="dot ${all[idx]}" data-i="${idx}"></span>` : '<span class="dot empty"></span>'; }
    h += '</div>';
  }
  return h + '</div>';
}

async function teachCount(item, box, k) {
  box.innerHTML = `<div class="dots big">${dotsHTML(item.n, 'a')}</div><div class="teach-note">Touch each one and count!</div>`;
  const ds = [...box.querySelectorAll('.dot')];
  await k.say('Let\'s count them together. Point to each one.');
  for (let i = 0; i < ds.length; i++) { if (!k.alive()) return; ds[i].classList.add('lit'); await k.say(String(i + 1), { rate: 0.9 }); }
  await k.say(`The last number we said is ${item.n}. So there are ${item.n}!`);
}

async function teachAddSmall(item, box, k) {
  const big = Math.max(item.a, item.b), small = Math.min(item.a, item.b);
  box.innerHTML = `<div class="eq">${item.a} + ${item.b}</div>${frames([{ n: big, cls: 'a' }, { n: small, cls: 'b' }])}<div class="teach-note">Start with the BIG number, then count on!</div>`;
  const ds = [...box.querySelectorAll('.dot:not(.empty)')];
  await k.say(`Here is a trick. Start with the bigger number, ${big}. Then count on ${small} more.`);
  ds.slice(0, big).forEach(d => d.classList.add('lit'));
  await k.say(`${big}...`);
  for (let i = 0; i < small; i++) { if (!k.alive()) return; ds[big + i].classList.add('lit'); await k.say(String(big + i + 1), { rate: 0.9 }); }
  await k.say(`${item.a} plus ${item.b} equals ${item.answer}!`);
}

async function teachSubSmall(item, box, k) {
  box.innerHTML = `<div class="eq">${item.a} − ${item.b}</div>${frames([{ n: item.a, cls: 'a' }])}<div class="teach-note">Start with ${item.a}. Take away ${item.b}.</div>`;
  const ds = [...box.querySelectorAll('.dot:not(.empty)')];
  await k.say(`We start with ${item.a}. Now we take away ${item.b}. Let's cross them out.`);
  for (let i = 0; i < item.b; i++) { if (!k.alive()) return; ds[item.a - 1 - i].classList.add('gone'); await k.say(String(i + 1), { rate: 0.9 }); }
  await k.say('Now count what is left.');
  for (let i = 0; i < item.answer; i++) { if (!k.alive()) return; ds[i].classList.add('lit'); await k.say(String(i + 1), { rate: 1 }); }
  await k.say(`${item.a} minus ${item.b} equals ${item.answer}!`);
}

async function teachMissing(item, box, k) {
  box.innerHTML = `<div class="eq">${item.a} + ? = ${item.total}</div><div class="frames"><div class="frame">${dotsHTML(item.a, 'a lit')}${'<span class="dot empty"></span>'.repeat(10 - item.a)}</div></div><div class="teach-note">Count UP from ${item.a} to ${item.total}.</div>`;
  const empties = [...box.querySelectorAll('.dot.empty')];
  await k.say(`We have ${item.a}. How many more do we need to make ${item.total}? Let's count up and use our fingers.`);
  await k.say(`${item.a}...`);
  for (let i = 0; i < item.answer; i++) { if (!k.alive()) return; empties[i].className = 'dot b lit'; await k.say(`${item.a + i + 1}. That's ${i + 1}.`, { rate: 1 }); }
  await k.say(`We counted ${item.answer} more. So ${item.a} plus ${item.answer} makes ${item.total}!`);
}

async function teachPlace(item, box, k) {
  const n = item.mode === 'build' ? item.answer : item.n;
  const tens = Math.floor(n / 10), ones = n % 10;
  const rods = t => '<span class="rod"></span>'.repeat(t), cubes = o => '<span class="cube"></span>'.repeat(o);
  box.innerHTML = `<div class="pv"><div class="pv-t">${rods(tens)}</div><div class="pv-o">${cubes(ones)}</div></div><div class="teach-note"></div>`;
  const note = box.querySelector('.teach-note');
  if (item.mode === 'build') {
    note.textContent = 'Tall rods are TENS. Little cubes are ONES.';
    await k.say('Each tall rod is ten. Each little cube is one. Count the tens first.');
    const rs = [...box.querySelectorAll('.rod')];
    for (let i = 0; i < rs.length; i++) { if (!k.alive()) return; rs[i].classList.add('lit'); await k.say(String((i + 1) * 10)); }
    const cs = [...box.querySelectorAll('.cube')];
    for (let i = 0; i < cs.length; i++) { if (!k.alive()) return; cs[i].classList.add('lit'); await k.say(String(tens * 10 + i + 1)); }
    await k.say(`${item.tens} tens and ${item.ones} ones makes ${item.answer}.`);
  } else {
    const more = item.mode === 'more';
    note.textContent = more ? 'Ten MORE = one more rod. The tens number goes UP by one.' : 'Ten LESS = one less rod. The tens number goes DOWN by one.';
    await k.say(`This is ${n}. It has ${tens} tens and ${ones} ones.`);
    const pt = box.querySelector('.pv-t');
    if (more) { pt.insertAdjacentHTML('beforeend', '<span class="rod lit new"></span>'); await k.say('Ten more means we add one more rod of ten.'); }
    else { const r = pt.querySelector('.rod:last-child'); if (r) r.classList.add('gone'); await k.say('Ten less means we take away one rod of ten.'); }
    await k.say(`Now we have ${more ? tens + 1 : tens - 1} tens and ${ones} ones. That is ${item.answer}!`);
  }
}

async function teachColumn(item, box, k) {
  const op = item.op === '+' ? '+' : '−';
  const ans = String(item.answer);
  const n = item.op === '+' ? Math.max(String(item.a).length, String(item.b).length, ans.length) : String(item.a).length;
  const digit = (num, i) => { const s = String(num); return i < s.length ? +s[s.length - 1 - i] : null; };
  const cell = (row, i, v, cls = '') => `<span class="cc ${cls}" data-r="${row}" data-c="${i}">${v ?? ''}</span>`;
  let html = '<div class="col-grid">';
  html += '<div class="cr carry"><span class="cc op"></span>'; for (let i = n - 1; i >= 0; i--) html += cell('k', i, ''); html += '</div>';
  html += '<div class="cr"><span class="cc op"></span>'; for (let i = n - 1; i >= 0; i--) html += cell('a', i, digit(item.a, i)); html += '</div>';
  html += `<div class="cr"><span class="cc op">${op}</span>`; for (let i = n - 1; i >= 0; i--) html += cell('b', i, digit(item.b, i)); html += '</div>';
  html += '<div class="cr line"></div>';
  html += '<div class="cr"><span class="cc op"></span>'; for (let i = n - 1; i >= 0; i--) html += cell('s', i, ''); html += '</div></div>';
  html += `<div class="place-labels">${Array.from({ length: n }, (_, j) => PLACE[n - 1 - j] || '').map(p => `<span>${p}</span>`).join('')}</div><div class="teach-note">Always start with the ONES (on the right)!</div>`;
  box.innerHTML = html;
  const C = (r, i) => box.querySelector(`.cc[data-r="${r}"][data-c="${i}"]`);
  const hl = i => { box.querySelectorAll('.cc').forEach(e => e.classList.remove('hl')); ['k', 'a', 'b', 's'].forEach(r => C(r, i) && C(r, i).classList.add('hl')); };
  await k.say('Let\'s line them up and start with the ones, on the right side.');

  if (item.op === '+') {
    let carry = 0;
    for (let i = 0; i < n; i++) {
      if (!k.alive()) return;
      const da = digit(item.a, i) || 0, db = digit(item.b, i) || 0, s = da + db + carry;
      if (digit(item.a, i) === null && digit(item.b, i) === null && !carry) break;
      hl(i);
      await k.say(`${PLACE[i]}: ${da} plus ${db}${carry ? ', plus the 1 we carried,' : ''} equals ${s}.`);
      if (s >= 10 && i < n - 1) {
        C('s', i).textContent = s % 10; C('k', i + 1).textContent = '1'; C('k', i + 1).classList.add('pop');
        await k.say(`${s} is too big for one spot. Write ${s % 10}, and carry the 1 to the ${PLACE[i + 1]}.`);
        carry = 1;
      } else { C('s', i).textContent = s; carry = 0; }
    }
  } else {
    const top = []; for (let i = 0; i < n; i++) top[i] = digit(item.a, i) || 0;
    for (let i = 0; i < n; i++) {
      if (!k.alive()) return;
      const db = digit(item.b, i) || 0;
      hl(i);
      if (top[i] < db) {
        let j = i + 1; while (j < n && top[j] === 0) j++;
        await k.say(`${PLACE[i]}: we can't take ${db} from ${top[i]}. So we borrow from the ${PLACE[i + 1]}.`);
        top[j] -= 1; C('a', j).innerHTML = `<s>${C('a', j).textContent}</s>`; C('k', j).textContent = top[j]; C('k', j).classList.add('pop');
        for (let m = j - 1; m > i; m--) { top[m] = 9; C('a', m).innerHTML = '<s>0</s>'; C('k', m).textContent = '9'; C('k', m).classList.add('pop'); }
        top[i] += 10; C('k', i).textContent = top[i]; C('k', i).classList.add('pop');
        await k.say(`Now we have ${top[i]} ${PLACE[i]}.`);
      }
      const d = top[i] - db;
      await k.say(`${top[i]} minus ${db} equals ${d}.`);
      const isLeadingZero = d === 0 && i >= ans.length;
      C('s', i).textContent = isLeadingZero ? '' : d;
    }
  }
  await k.say(`So the answer is ${item.answer}!`);
}

async function teachArray(item, box, k) {
  const rows = item.a, cols = item.b;
  let h = `<div class="eq">${item.a} × ${item.b}</div><div class="array">`;
  for (let r = 0; r < rows; r++) { h += `<div class="arow" data-r="${r}">${dotsHTML(cols, 'a')}<span class="rowsum"></span></div>`; }
  box.innerHTML = h + `</div><div class="teach-note">${item.a} groups of ${item.b}. Skip count by ${item.b}!</div>`;
  if (item.a === 0 || item.b === 0) { await k.say(`Anything times zero is zero!`); return; }
  await k.say(`${item.a} times ${item.b} means ${item.a} groups of ${item.b}. Let's skip count by ${item.b}.`);
  const rs = [...box.querySelectorAll('.arow')];
  for (let r = 0; r < rows; r++) { if (!k.alive()) return; rs[r].classList.add('lit'); rs[r].querySelector('.rowsum').textContent = (r + 1) * cols; await k.say(String((r + 1) * cols), { rate: 0.9 }); }
  await k.say(`${item.a} times ${item.b} equals ${item.answer}!`);
}

async function teachBreakApart(item, box, k) {
  const tens = Math.floor(item.a / 10) * 10, ones = item.a % 10;
  box.innerHTML = `<div class="eq">${item.a} × ${item.b}</div>
    <div class="steps-math">
      <div class="sm" data-s="0">Break ${item.a} into <b>${tens}</b> and <b>${ones}</b></div>
      <div class="sm" data-s="1">${tens} × ${item.b} = <b>${tens * item.b}</b></div>
      <div class="sm" data-s="2">${ones} × ${item.b} = <b>${ones * item.b}</b></div>
      <div class="sm" data-s="3">${tens * item.b} + ${ones * item.b} = <b>${item.answer}</b></div>
    </div><div class="teach-note">Big numbers? Break them apart!</div>`;
  const s = i => box.querySelector(`.sm[data-s="${i}"]`).classList.add('lit');
  s(0); await k.say(`Big numbers are easier if we break them apart. ${item.a} is ${tens} and ${ones}.`);
  s(1); await k.say(`${tens} times ${item.b} is ${tens * item.b}. Hint: ${tens / 10} times ${item.b} is ${tens / 10 * item.b}, then add a zero.`);
  s(2); await k.say(`${ones} times ${item.b} is ${ones * item.b}.`);
  s(3); await k.say(`Now add them: ${tens * item.b} plus ${ones * item.b} equals ${item.answer}!`);
}

async function teachDivide(item, box, k) {
  const g = item.b, q = item.answer;
  box.innerHTML = `<div class="eq">${item.a} ÷ ${item.b}</div><div class="groups">${Array.from({ length: g }, (_, i) => `<div class="grp" data-g="${i}"></div>`).join('')}</div><div class="teach-note">Share ${item.a} into ${g} equal groups.</div>`;
  const gs = [...box.querySelectorAll('.grp')];
  await k.say(`${item.a} divided by ${g} means we share ${item.a} into ${g} equal groups. Let's deal them out, one at a time.`);
  for (let r = 0; r < q; r++) {
    for (let i = 0; i < g; i++) { if (!k.alive()) return; gs[i].insertAdjacentHTML('beforeend', '<span class="dot a lit"></span>'); await k.sleep(item.a > 30 ? 25 : 90); }
  }
  gs[0].classList.add('lit');
  await k.say(`Each group got ${q}. So ${item.a} divided by ${g} is ${q}. Here's a secret: ${g} times ${q} equals ${item.a}!`);
}

async function teachFraction(item, box, k) {
  const g = item.den, each = item.total / g;
  box.innerHTML = `<div class="eq">${item.num}/${item.den} of ${item.total}</div><div class="groups">${Array.from({ length: g }, (_, i) => `<div class="grp" data-g="${i}"></div>`).join('')}</div><div class="teach-note">The bottom number tells how many equal groups.</div>`;
  const gs = [...box.querySelectorAll('.grp')];
  await k.say(`The bottom number is ${g}. So we split ${item.total} into ${g} equal groups.`);
  for (let r = 0; r < each; r++) for (let i = 0; i < g; i++) { if (!k.alive()) return; gs[i].insertAdjacentHTML('beforeend', '<span class="dot a"></span>'); await k.sleep(60); }
  await k.say(`Each group has ${each}.`);
  for (let i = 0; i < item.num; i++) gs[i].classList.add('lit');
  await k.say(`The top number is ${item.num}, so we take ${item.num} ${item.num === 1 ? 'group' : 'groups'}. ${fracWords(item.num, item.den)} of ${item.total} is ${item.answer}!`);
}

// ---------- story problems: the Rainbow Steps ----------
const OPWORD = { '+': 'add', '-': 'subtract', '×': 'multiply', '÷': 'divide' };
const OPSYM = { '+': '+', '-': '−', '×': '×', '÷': '÷' };
const KIND = { '+': 'add', '-': 'sub', '×': 'mul', '÷': 'div' };

export function storyHTML(item) {
  let s = esc(item.story);
  if (item.clue) item.clue.split(/,\s*then\s*|then /).forEach(c => { const cc = c.trim(); if (cc) s = s.replace(new RegExp(`(${cc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'), '<span class="clue">$1</span>'); });
  return s.replace(/\b(\d+)\b/g, '<span class="num">$1</span>');
}

async function teachWord(item, box, k) {
  box.innerHTML = `<div class="story">${storyHTML(item)}</div>
    <ol class="fsteps">${FLASHLIGHT_STEPS.map((s, i) => `<li data-s="${i}"><span>${s.icon}</span> <b>${s.title}</b></li>`).join('')}</ol>
    <div class="work"></div>`;
  const st = i => { box.querySelectorAll('.fsteps li').forEach(l => l.classList.remove('lit')); box.querySelector(`.fsteps li[data-s="${i}"]`).classList.add('lit', 'done'); };
  const work = box.querySelector('.work');
  await k.say('Let\'s use the Rainbow Steps!');
  st(0); await k.say('Step 1. Shine a light on it. Let\'s read it.'); await k.say(item.story, { rate: 0.85 });
  if (!k.alive()) return;
  st(1); box.querySelectorAll('.num').forEach(n => n.classList.add('lit'));
  const nums = (item.story.match(/\d+/g) || []);
  await k.say(`Step 2. Find the numbers. We know ${nums.join(', and ')}.`);
  st(2); await k.say(`Step 3. What is the question? ${item.story.split('. ').pop()}`);
  if (!k.alive()) return;
  st(3); box.querySelectorAll('.clue').forEach(n => n.classList.add('lit'));
  const plan = item.steps.map(s => OPWORD[s.op]).join(', then ');
  await k.say(`Step 4. Make a plan. Look for clue words. The clue words "${item.clue}" tell us to ${plan}.`);
  work.innerHTML = item.steps.map((s, i) => `<div class="sm" data-w="${i}">${s.a} ${OPSYM[s.op]} ${s.b} = <b class="ans">?</b></div>`).join('') + '<div class="sub-teach"></div>';
  st(4); await k.say('Step 5. Solve it.');
  for (let i = 0; i < item.steps.length; i++) {
    if (!k.alive()) return;
    const s = item.steps[i];
    const row = work.querySelector(`.sm[data-w="${i}"]`); row.classList.add('lit');
    const sub = { kind: KIND[s.op], a: s.a, b: s.b, op: s.op, answer: s.ans };
    const small = (s.op === '+' && s.ans <= 20) || (s.op === '-' && s.a <= 20) || (s.op === '×' && s.a <= 10 && s.b <= 10) || (s.op === '÷' && s.a <= 50);
    if (small || item.steps.length === 1) { await teachMath(sub, work.querySelector('.sub-teach'), k); }
    else await k.say(`${s.a} ${OPWORD[s.op] === 'add' ? 'plus' : OPWORD[s.op] === 'subtract' ? 'minus' : OPWORD[s.op] === 'multiply' ? 'times' : 'divided by'} ${s.b} equals ${s.ans}.`);
    row.querySelector('.ans').textContent = s.ans;
    work.querySelector('.sub-teach').innerHTML = '';
  }
  st(5); await k.say(`Step 6. Check it. Does ${item.answer} ${item.unit} make sense? Yes! The answer is ${item.answer}.`);
}

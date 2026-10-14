// Checks what the speech recognizer heard against the right answer.
// Kids' speech gets misheard a lot, so this is forgiving on purpose.

const HOMO = [['see', 'sea', 'c'], ['to', 'too', 'two', '2'], ['no', 'know'], ['be', 'bee', 'b'], ['we', 'wee'], ['by', 'buy', 'bye'],
  ['right', 'write', 'rite'], ['would', 'wood'], ['for', 'four', '4'], ['one', 'won', '1'], ['eight', 'ate', '8'], ['hear', 'here'],
  ['their', 'there', "they're"], ['red', 'read'], ['son', 'sun'], ['knight', 'night'], ['tail', 'tale'], ['road', 'rode', 'rowed'],
  ['blue', 'blew'], ['hole', 'whole'], ['meet', 'meat'], ['so', 'sew', 'sow'], ['through', 'threw'], ['knew', 'new'], ['not', 'knot'],
  ['you', 'u'], ['are', 'r'], ['why', 'y'], ['oh', 'o', 'owe'], ['your', "you're"], ['which', 'witch'], ['some', 'sum'], ['wait', 'weight'],
  ['plane', 'plain'], ['tea', 'tee', 't'], ['mail', 'male'], ['hour', 'our'], ['made', 'maid'], ['seem', 'seam'], ['by', 'buy'],
  ['ten', '10'], ['six', '6'], ['five', '5'], ['three', '3'], ['seven', '7'], ['nine', '9'], ['zero', '0'], ['an', 'and'],
  ['is', "it's"], ['he', 'hee'], ['me', 'mi'], ['go', 'goes'], ['look', 'luke'], ['dad', 'dead'], ['bus', 'buss'], ['bear', 'bare'],
  ['steak', 'stake'], ['flower', 'flour'], ['pail', 'pale'], ['week', 'weak'], ['sail', 'sale'], ['toe', 'tow'], ['peek', 'peak'],
  ['stair', 'stare'], ['roll', 'role'], ['whale', 'wail'], ['hi', 'high'], ['pair', 'pear'], ['deer', 'dear'], ['jeans', 'genes']];
const CANON = {};
HOMO.forEach(g => g.forEach(w => { if (!CANON[w]) CANON[w] = g[0]; }));
const canon = w => CANON[w] || w;

export function normalize(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

function wordMatches(target, heard, strict) {
  if (canon(heard) === canon(target)) return true;
  if (heard.replace(/'/g, '') === target.replace(/'/g, '')) return true;
  if (strict === 'easy' && target.length >= 5 && lev(heard, target) <= 1) return true;
  if (strict === 'easy' && target.length >= 8 && lev(heard, target) <= 2) return true;
  return false;
}

export function matchWord(target, alts, strict = 'easy') {
  const t = normalize(target);
  for (const raw of alts) {
    const a = normalize(raw);
    if (!a) continue;
    if (a.replace(/ /g, '') === t.replace(/ /g, '')) return true;      // "cup cake" -> cupcake
    for (const w of a.split(' ')) if (wordMatches(t, w, strict)) return true;
  }
  return false;
}

export function matchPhrase(target, alts, strict = 'easy') {
  const tw = normalize(target).split(' ');
  let best = { score: 0, missing: tw };
  for (const raw of alts) {
    const hw = normalize(raw).split(' ');
    const missing = tw.filter(t => !hw.some(h => wordMatches(t, h, strict)));
    const score = (tw.length - missing.length) / tw.length;
    if (score > best.score) best = { score, missing };
  }
  const need = strict === 'easy' ? 0.75 : 0.9;
  return { ok: best.score >= need, missing: best.missing };
}

const SMALL = { zero: 0, oh: 0, one: 1, won: 1, two: 2, to: 2, too: 2, three: 3, tree: 3, free: 3, four: 4, for: 4, fore: 4,
  five: 5, six: 6, seven: 7, eight: 8, ate: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
const TENS = { twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };

export function parseNumbers(s) {
  const toks = String(s).toLowerCase().replace(/(\d),(\d)/g, '$1$2').replace(/-/g, ' ').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const out = []; let cur = null;
  const flush = () => { if (cur !== null) out.push(cur); cur = null; };
  for (const t of toks) {
    if (/^\d+$/.test(t)) { flush(); out.push(parseInt(t, 10)); continue; }
    if (t in SMALL) {
      const v = SMALL[t];
      if (cur !== null && v < 10 && cur % 10 === 0 && cur >= 20) cur += v;
      else if (cur !== null && cur % 100 === 0 && cur >= 100) cur += v;
      else { flush(); cur = v; }
      continue;
    }
    if (t in TENS) {
      if (cur !== null && cur % 100 === 0 && cur >= 100) cur += TENS[t];
      else { flush(); cur = TENS[t]; }
      continue;
    }
    if (t === 'hundred') { cur = (cur ?? 1) * 100; continue; }
    if (t === 'thousand') { cur = (cur ?? 1) * 1000; continue; }
    if (t === 'and') continue;
    flush();
  }
  flush();
  return out;
}

export function matchNumber(answer, alts) {
  for (const a of alts) if (parseNumbers(a).includes(answer)) return true;
  return false;
}

// =====================================================================
// READING CURRICULUM  (Kindergarten -> 4th grade)
// Word syntax:  chunks separated by "-".  A chunk may have "=sound":
//   "a=A"  -> long vowel (says its name)       "e=_" -> silent letter
//   "ed=tuh" -> custom spoken sound              "ow=O" -> ow says "oh"
// Chunks longer than 2-3 letters with no map entry are spoken as-is
// (syllables like "rab", "bit").
// =====================================================================

export const READING_LEVELS = [
  { n: 1, name: 'Heart Words 1', grade: 'K', type: 'sight',
    tip: 'Heart words are words we learn by heart. We just remember them!',
    words: ['the','see','go','me','we','is','it','at','can','my','to','he','in','on','up','and','like','look','no','yes','you','am','do','an','so','big','run','red','one','not'] },
  { n: 2, name: 'Short A and I', grade: 'K', type: 'word',
    words: ['c-a-t','h-a-t','m-a-p','s-a-d','b-a-g','r-a-n','p-a-n','f-a-n','j-a-m','d-a-d','m-a-n','b-a-t','r-a-t','c-a-p','s-i-t','p-i-g','d-i-g','w-i-n','p-i-n','f-i-x','l-i-p','h-i-t','s-i-x','z-i-p','b-i-b','k-i-d'] },
  { n: 3, name: 'Short O, U, E', grade: 'K-1', type: 'word',
    words: ['d-o-g','h-o-t','p-o-t','t-o-p','m-o-p','b-o-x','f-o-x','l-o-g','s-u-n','r-u-n','b-u-g','c-u-p','m-u-d','h-u-t','b-u-s','n-u-t','b-e-d','r-e-d','t-e-n','p-e-t','w-e-t','j-e-t','l-e-g','h-e-n','n-e-t','g-u-m'] },
  { n: 4, name: 'Heart Words 2', grade: '1', type: 'sight',
    tip: 'These heart words do not follow the rules, so we remember them!',
    words: ['was','said','they','have','come','what','where','here','there','of','are','some','were','your','want','from','put','who','again','does','give','live','many','very','why','could'] },
  { n: 5, name: 'SH CH TH WH CK', grade: '1', type: 'word',
    tip: 'Two letters can team up to make ONE sound!',
    words: ['sh-i-p','sh-o-p','f-i-sh','d-i-sh','ch-i-p','ch-o-p','l-u-n-ch','th-i-n','th-e-m','b-a-th','m-a-th','wh-e-n','wh-i-p','d-u-ck','b-a-ck','s-o-ck','r-o-ck','n-e-ck','k-i-ck','r-i-ng','s-i-ng','k-i-ng','sh-e-d','ch-e-ck','th-a-t','m-u-ch'] },
  { n: 6, name: 'Blends', grade: '1', type: 'word',
    tip: 'In a blend, you can hear both sounds. Say them fast together!',
    words: ['s-t-o-p','f-r-o-g','d-r-u-m','c-l-a-p','f-l-a-g','s-l-e-d','s-n-a-ck','s-w-i-m','t-r-i-p','g-r-a-b','p-l-a-n','s-p-o-t','j-u-m-p','h-a-n-d','l-a-m-p','b-e-s-t','m-i-l-k','t-e-n-t','d-e-s-k','f-a-s-t','s-t-a-m-p','g-r-i-n','c-r-a-b','s-k-i-p','b-l-o-ck','f-r-o-s-t'] },
  { n: 7, name: 'Magic E', grade: '1-2', type: 'word',
    tip: 'Magic E is quiet, but it makes the other vowel say its name!',
    words: ['c-a=A-k-e=_','g-a=A-m-e=_','g-a=A-t-e=_','n-a=A-m-e=_','m-a=A-d-e=_','b-i=I-k-e=_','k-i=I-t-e=_','t-i=I-m-e=_','r-i=I-d-e=_','f-i=I-v-e=_','h-i=I-d-e=_','h-o=O-m-e=_','b-o=O-n-e=_','r-o=O-p-e=_','n-o=O-s-e=_','h-o=O-l-e=_','c-u=U-t-e=_','t-u=U-b-e=_','l-a=A-t-e=_','sh-a=A-k-e=_','s-m-i=I-l-e=_','s-l-i=I-d-e=_','s-t-o=O-n-e=_','s-n-a=A-k-e=_','p-l-a=A-n-e=_'] },
  { n: 8, name: 'Vowel Teams', grade: '2', type: 'word',
    tip: 'When two vowels go walking, the first one does the talking!',
    words: ['r-ai-n','t-ai-l','p-ai-n-t','d-ay','p-l-ay','s-t-ay','t-r-ee','f-ee-t','s-ee-d','s-l-ee-p','ea-t','s-ea-t','t-ea-m','d-r-ea-m','b-oa-t','r-oa-d','c-oa-t','s-oa-p','s-n-ow=O','g-r-ow=O','s-l-ow=O','g-r-ee-n','w-ai-t','s-p-ea-k','t-r-ai-n'] },
  { n: 9, name: 'Bossy R', grade: '2', type: 'word',
    tip: 'Bossy R changes the sound of the vowel in front of it!',
    words: ['c-ar','s-t-ar','p-ar-k','d-ar-k','f-ar-m','c-or-n','f-or-k','s-t-or-m','h-or-n','sh-or-t','h-er','f-er-n','b-ir-d','g-ir-l','f-ir-s-t','sh-ir-t','t-ur-n','b-ur-n','h-ur-t','c-ur-l','sh-ar-k','p-or-ch','ch-ar-t','s-p-or-t','th-ir-d'] },
  { n: 10, name: 'Heart Words 3', grade: '2', type: 'sight',
    tip: 'Big kid heart words! Learn them by heart.',
    words: ['because','around','before','would','could','should','friend','people','always','every','laugh','goes','which','write','other','about','thought','once','only','been','both','pretty','together','early','answer'] },
  { n: 11, name: 'Two Syllables', grade: '2', type: 'word', syllables: true,
    tip: 'Big words are easy if you cut them into parts. Read each part, then put them together!',
    words: ['sun-set','cup-cake','rab-bit','nap-kin','bas-ket','kit-ten','pic-nic','bath-tub','pump-kin','muf-fin','ro-bot','pup-pet','rock-et','lad-der','zig-zag','in-sect','pen-cil','mag-net','sand-box','back-pack','gob-lin','hel-met','tick-et','dark-ness','pop-corn'] },
  { n: 12, name: 'OI OY OU OW OO', grade: '2-3', type: 'word',
    tip: 'These vowel teams make brand new sounds!',
    words: ['c-oi-n','b-oi-l','p-oi-n-t','t-oy','b-oy','j-oy','ou-t','sh-ou-t','c-l-ou-d','h-ou-s-e=_','c-ow','n-ow','d-ow-n','c-l-ow-n','s-aw','d-r-aw','c-l-aw','m-oo-n','s-p-oo-n','b-oo-t','z-oo','r-oo-m','b-oo=oo, like book-k','l-oo=oo, like book-k','g-r-ow-l'] },
  { n: 13, name: 'Endings', grade: '3', type: 'word', syllables: true,
    tip: 'Find the ending first. Read the main word, then add the ending!',
    words: ['jump-ing','play-ing','read-ing','sing-ing','look-ing','fast-er','tall-er','small-est','quick-ly','slow-ly','loud-ly','help-ful','play-ful','kind-ness','play-ed=d','walk-ed=t','jump-ed=t','yell-ed=d','dark-est','hid-ing','sneak-ing','scar-y','bright-er','qui-et-ly'] },
  { n: 14, name: 'Big Words', grade: '3', type: 'word', syllables: true,
    tip: 'Clap the parts! Read one part at a time.',
    words: ['an-i-mal','im-por-tant','to-geth-er','re-mem-ber','fam-i-ly','ba-na-na','com-pu-ter','dif-fer-ent','yes-ter-day','dan-ger-ous','ad-ven-ture','el-e-phant','hos-pi-tal','but-ter-fly','won-der-ful','choc-o-late','en-er-gy','to-mor-row','pi-an-o','sat-ur-day'] },
  { n: 15, name: 'Prefixes', grade: '3-4', type: 'word', syllables: true,
    tip: 'A prefix goes at the front and changes what the word means!',
    words: ['un-lock','un-tie','un-safe','un-hap-py','re-play','re-fill','re-turn','re-build','dis-like','dis-a-gree','mis-take','pre-view','non-stop','un-fair','re-start','dis-ap-pear','in-vis-i-ble','un-plug'] },
  { n: 16, name: 'Tricky 4th Grade', grade: '4', type: 'word', syllables: true,
    tip: 'Tricky words! Look for parts you already know.',
    words: ['through','thought','e-nough=nuff','ma-chine=sheen','mys-te-ri-ous','e-lec-tric-i-ty','mag-i-cal','beau-ti-ful','cel-e-brate','fam-i-lies','u-ni-corn','whis-per','be-lieve','sci-ence','sur-prise','knight','cau-tious','in-ves-ti-gate','ex-pe-ri-ment','tem-per-a-ture'] },
];

// Sentences mixed in once he is reading at level 5+
export const PHRASES = [
  /* P1 */ ['I see a cat.','The dog can run.','It is hot.','We can go.','Look at me.','I like the red hat.','The pig is big.','A bug is on the cup.'],
  /* P2 */ ['The red bus is big.','I like to play.','Can you see the fox?','The fish can swim fast.','My dog sat on the mat.','The kid has a ship.','Stop and look back.'],
  /* P3 */ ['The bird sings in the tree.','Sparkle has a pink tail.','Pick up the jelly beans.','We can play in the rain.','The rainbow is so pretty.','Go down the road to the pond.','I see a star in the sky.'],
  /* P4 */ ['Sparkle is looking for her family.','The rainbow bridge leads to the castle.','I remember the way to the garden.','The flowers are blooming in the meadow.','Pip the bird is singing for me.','We should find the rainbows together.'],
  /* P5 */ ['The magical rainbow sparkled across the sky.','Her family was waiting beyond the gate.','I believe we can find them before sunset.','The jelly bean path curves through the garden, so be careful.','Explore the castle and discover the hidden treasure.'],
];

export function phraseSetForLevel(level) {
  if (level <= 6) return 0;
  if (level <= 9) return 1;
  if (level <= 12) return 2;
  if (level <= 14) return 3;
  return 4;
}

// ---- Sound maps ------------------------------------------------------
const CONS = { b:'buh', c:'kuh', d:'duh', f:'fff', g:'guh', h:'huh', j:'juh', k:'kuh', l:'lll', m:'mmm', n:'nnn', p:'puh',
  q:'kwuh', r:'rrr', s:'sss', t:'tuh', v:'vvv', w:'wuh', x:'ks', y:'yuh', z:'zzz',
  ck:'kuh', sh:'shhh', ch:'chuh', th:'thhh', wh:'wuh', ng:'ng, like sing', qu:'kwuh', ll:'lll', ss:'sss', ff:'fff', ph:'fff', kn:'nnn', wr:'rrr', tch:'chuh' };
const SHORT = { a:'short a, like apple', e:'short e, like egg', i:'short i, like igloo', o:'short o, like octopus', u:'short u, like umbrella' };
const LONG = { A:'long a, it says its name, ay', E:'long e, ee', I:'long i, eye', O:'long o, oh', U:'long u, you' };
const TEAMS = { ai:'ay', ay:'ay', ee:'ee', ea:'ee', oa:'oh', ow:'ow, like cow', ar:'ar', or:'or', er:'er', ir:'er', ur:'er',
  oi:'oy', oy:'oy', ou:'ow, like cow', aw:'aw', au:'aw', oo:'oo, like moon', igh:'eye' };
export const LETTER_NAMES = { a:'ay', b:'bee', c:'see', d:'dee', e:'ee', f:'eff', g:'jee', h:'aitch', i:'eye', j:'jay', k:'kay', l:'ell',
  m:'em', n:'en', o:'oh', p:'pee', q:'cue', r:'ar', s:'ess', t:'tee', u:'you', v:'vee', w:'double you', x:'ex', y:'why', z:'zee', "'":'' };

export function parseWord(spec, syllables = false) {
  const chunks = spec.split('-').map(part => {
    let [t, snd] = part.split('=');
    const c = { t, say: '' };
    if (snd === '_') { c.silent = true; c.say = ''; }
    else if (snd && LONG[snd]) { c.long = true; c.say = LONG[snd]; }
    else if (snd === 'O') { c.long = true; c.say = 'oh'; }
    else if (snd) { c.say = snd; }
    else if (syllables) { c.say = t; }
    else c.say = CONS[t] || SHORT[t] || TEAMS[t] || t;
    return c;
  });
  return { text: chunks.map(c => c.t).join(''), chunks };
}

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export function readingItem(level, recent = []) {
  const L = READING_LEVELS[Math.max(0, Math.min(READING_LEVELS.length - 1, level - 1))];
  // sentences sometimes, once ready
  if (level >= 5 && Math.random() < 0.22) {
    const set = PHRASES[phraseSetForLevel(level)];
    let s; for (let i = 0; i < 8; i++) { s = rand(set); if (!recent.includes(s)) break; }
    return { track: 'reading', level, type: 'phrase', key: s, text: s, words: s.replace(/[.,?!]/g, '').split(' ') };
  }
  let spec; for (let i = 0; i < 10; i++) { spec = rand(L.words); if (!recent.includes(parseWord(spec).text)) break; }
  return itemFromSpec(L, spec, level);
}

function itemFromSpec(L, spec, level) {
  if (L.type === 'sight') {
    return { track: 'reading', level, type: 'sight', key: spec, text: spec, tip: L.tip,
      chunks: spec.split('').map(ch => ({ t: ch, say: LETTER_NAMES[ch] || ch })) };
  }
  const w = parseWord(spec, !!L.syllables);
  return { track: 'reading', level, type: 'word', key: w.text, text: w.text, chunks: w.chunks, tip: L.tip, syllables: !!L.syllables };
}

// rebuild a missed word later from its key
export function readingItemByKey(level, key) {
  if (/\s/.test(key)) return { track: 'reading', level, type: 'phrase', key, text: key, words: key.replace(/[.,?!]/g, '').split(' ') };
  const L = READING_LEVELS[Math.max(0, Math.min(READING_LEVELS.length - 1, level - 1))];
  const spec = L.words.find(s => parseWord(s).text === key);
  if (!spec) return null;
  return itemFromSpec(L, spec, level);
}

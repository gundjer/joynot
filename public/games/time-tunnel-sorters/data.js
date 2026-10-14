// Time Tunnel data: sequences, inventions, history events and the puzzle maker for each level.
import { pick, sample, shuffle, rand } from '../_joy/js/util.js';

export const SEQ = [
  [['😴', 'wake up'], ['🦷', 'brush teeth'], ['🎒', 'go to school']],
  [['🌰', 'plant a seed'], ['🌱', 'it sprouts'], ['🌻', 'a flower blooms']],
  [['❄️', 'snow falls'], ['⛄', 'build a snowman'], ['💧', 'the snowman melts']],
  [['🥣', 'mix the batter'], ['🔥', 'bake the cake'], ['🎂', 'eat the cake']],
  [['🍞', 'get the bread'], ['🧀', 'add the cheese'], ['🥪', 'eat the sandwich']],
  [['🌅', 'morning'], ['☀️', 'afternoon'], ['🌙', 'night']],
  [['🥚', 'an egg'], ['🐛', 'a caterpillar'], ['🦋', 'a butterfly']],
  [['🛁', 'fill the tub'], ['🧼', 'wash up'], ['🛌', 'go to bed']],
  [['👕', 'put on a shirt'], ['🧥', 'put on a coat'], ['🚪', 'go outside']],
  [['🎁', 'get a present'], ['✂️', 'open it'], ['🧸', 'play with the toy']],
  [['☁️', 'clouds fill with rain'], ['☔', 'rain falls'], ['🌈', 'a rainbow appears']],
  [['🥚', 'crack the egg'], ['🍳', 'cook the egg'], ['🍽️', 'eat breakfast']],
  [['🧦', 'put on socks'], ['👟', 'put on shoes'], ['🏃', 'go for a run']],
  [['✏️', 'draw a picture'], ['🖍️', 'color it in'], ['🖼️', 'hang it on the wall']],
  [['🛒', 'shop for food'], ['🍲', 'cook dinner'], ['🍽️', 'eat dinner']],
  [['✉️', 'write a letter'], ['📮', 'mail it'], ['📬', 'your friend gets it']],
  [['⚽', 'kick the ball'], ['🥅', 'it flies to the goal'], ['🎉', 'score!']],
  [['🎈', 'blow up the balloon'], ['🎀', 'tie the string'], ['🥳', 'party time']],
  [['📖', 'read the book'], ['✏️', 'write about it'], ['⭐', 'get a gold star']],
  [['🌑', 'dark night'], ['🌄', 'the sun rises'], ['🌞', 'sunny day']],
  [['🍦', 'buy ice cream'], ['☀️', 'the sun shines on it'], ['💧', 'it melts']],
  [['🐕', 'the dog gets muddy'], ['🛁', 'give the dog a bath'], ['✨', 'a clean dog']],
];
export const THEN_NOW = [ // [long ago, today]
  [['🕯️', 'candle'], ['💡', 'light bulb']], [['🐎', 'horse ride'], ['🚗', 'car']], [['📜', 'scroll'], ['💻', 'laptop']],
  [['🚂', 'steam train'], ['🚄', 'bullet train']], [['☎️', 'old phone'], ['📱', 'smartphone']], [['✉️', 'paper letter'], ['📧', 'email']],
  [['🗺️', 'paper map'], ['🛰️', 'GPS']], [['⛵', 'sailing ship'], ['🛳️', 'cruise ship']], [['📻', 'old radio'], ['🎧', 'music app']], [['🏹', 'bow and arrow hunting'], ['🛒', 'grocery store']],
];
export const GROW = [
  [['👶', 'baby'], ['🧒', 'child'], ['🧑', 'grown-up'], ['🧓', 'older adult']],
  [['🌰', 'seed'], ['🌱', 'sprout'], ['🌿', 'young plant'], ['🌳', 'tree']],
  [['🥚', 'egg'], ['🐣', 'hatching'], ['🐥', 'chick'], ['🐔', 'hen']],
  [['🌸', 'blossom'], ['🍏', 'little green apple'], ['🍎', 'ripe red apple']],
  [['🧱', 'pile of bricks'], ['🏗️', 'building it'], ['🏠', 'finished house']],
  [['🥚', 'frog eggs'], ['🐟', 'tadpole'], ['🐸', 'frog']],
  [['🌑', 'new moon'], ['🌓', 'half moon'], ['🌕', 'full moon']],
  [['🍼', 'baby drinks milk'], ['🥣', 'toddler eats cereal'], ['🍕', 'kid eats pizza']],
  [['🌰', 'bulb in the dirt'], ['🌱', 'green shoot'], ['🌷', 'tulip blooms']],
  [['🌾', 'grow wheat'], ['🏭', 'grind it into flour'], ['🍞', 'bake bread']],
  [['🐛', 'tiny caterpillar'], ['🐛', 'big fat caterpillar'], ['🦋', 'butterfly']],
  [['🌱', 'corn seedling'], ['🌽', 'tall corn plant'], ['🍿', 'popcorn snack']],
];
// inventions: [emoji, name, year]
export const INV = [
  ['🧭', 'magnetic compass', 1040], ['📖', 'printing press', 1440], ['🔭', 'telescope', 1608], ['🚂', 'steam train', 1804], ['🚲', 'bicycle', 1817],
  ['📷', 'first photograph', 1826], ['☎️', 'telephone', 1876], ['💡', 'light bulb', 1879], ['🚗', 'car', 1886], ['✈️', 'airplane', 1903],
  ['📺', 'television', 1927], ['🎮', 'video game console', 1972], ['💻', 'home computer', 1975], ['🌐', 'World Wide Web', 1991], ['📱', 'smartphone', 2007],
  ['🌡️', 'thermometer', 1714], ['🎈', 'first hot-air balloon flight', 1783], ['🎵', 'record player (phonograph)', 1877], ['🎥', 'movie camera', 1891],
  ['📻', 'radio', 1895], ['🔦', 'flashlight', 1899], ['🚁', 'helicopter', 1939], ['🛰️', 'first satellite in space', 1957], ['🏧', 'ATM cash machine', 1967], ['📧', 'email', 1971],
];
// events: [emoji, name, year] (negative = BC)
export const EVT = [
  ['🔺', 'Great Pyramid of Egypt is built', -2560], ['🏅', 'first Olympic Games in Greece', -776], ['🏰', 'knights and castles in the Middle Ages', 1100],
  ['⛵', 'Columbus sails to the Americas', 1492], ['🦃', 'Pilgrims sail on the Mayflower', 1620], ['📜', 'Declaration of Independence is signed', 1776],
  ['⚔️', 'the U.S. Civil War begins', 1861], ['🚂', 'railroad crosses the whole U.S.', 1869], ['🗽', 'Statue of Liberty opens', 1886],
  ['🗳️', 'U.S. women win the right to vote', 1920], ['✊', 'March on Washington for civil rights', 1963], ['🌙', 'first people walk on the Moon', 1969],
  ['🧱', 'the Berlin Wall comes down', 1989],
  ['🏛️', 'the Roman Colosseum opens', 80], ['🔔', 'the Liberty Bell is made', 1752], ['🚢', 'the Titanic sinks', 1912], ['🛩️', 'Lindbergh flies alone across the Atlantic', 1927],
  ['🏔️', 'first climbers reach the top of Mount Everest', 1953], ['🚀', 'first person goes to space', 1961], ['🏈', 'the first Super Bowl', 1967], ['🎆', 'the year 2000 begins', 2000],
];
export const yearText = y => (y < 0 ? `about ${-y} BC` : y < 1500 ? `about ${y}` : String(y));
export const ORD = n => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

function spaced(pool, n, gap) {
  for (let t = 0; t < 200; t++) {
    const pickd = sample(pool, n).sort((a, b) => a[2] - b[2]);
    if (pickd.every((x, i) => !i || x[2] - pickd[i - 1][2] >= gap)) return pickd;
  }
  return sample(pool, n).sort((a, b) => a[2] - b[2]);
}


export function makeQ(level, ctx) {
    const topic = ctx.settings.topics || 'all';
    const pool = topic === 'inventions' ? INV : topic === 'events' ? EVT : (Math.random() < 0.5 ? INV : EVT);
    if (level === 1) { const s = pick(SEQ); return { kind: 'order', key: 's' + s[0][1], items: s, labels: ['First', 'Next', 'Last'], prompt: 'What happens first, next and last? Put the cards in order.', expected: s.map(x => x[1]).join(' → ') }; }
    if (level === 2) {
      const [old, now] = pick(THEN_NOW), askOld = Math.random() < 0.6;
      return { kind: 'pick2', key: 't' + old[1] + askOld, opts: shuffle([old, now]), ans: askOld ? old[1] : now[1], prompt: askOld ? 'Which one is from LONG AGO?' : 'Which one do people use TODAY?', expected: askOld ? old[1] : now[1],
        explain: `Long ago people used a ${old[1]}. Today we have a ${now[1]}.` };
    }
    if (level === 3) { const g = pick(GROW.filter(x => x.length >= 3)); return { kind: 'order', key: 'g' + g[0][1], items: g, labels: g.map((_, i) => (i === 0 ? 'First' : i === g.length - 1 ? 'Last' : 'Then')), prompt: 'How does it grow and change? Put the cards in order from first to last.', expected: g.map(x => x[1]).join(' → ') }; }
    if (level === 4 || level === 5 || level === 6 || level === 9) {
      const n = level === 4 ? 3 : level === 5 ? 4 : level === 6 ? 3 : 5;
      const src = level === 4 || level === 5 ? (topic === 'events' ? EVT : INV) : level === 6 ? (topic === 'inventions' ? INV : EVT) : pool;
      const items = spaced(src, n, level === 9 ? 10 : 25);
      return { kind: 'order', key: 'o' + items.map(x => x[2]).join(), items, years: true, labels: items.map((_, i) => (i === 0 ? 'Oldest' : i === n - 1 ? 'Newest' : String(i + 1))),
        prompt: src === INV ? 'Put these inventions in order, from oldest to newest.' : 'Put these moments in history in order, from oldest to newest.', expected: items.map(x => `${x[1]} (${yearText(x[2])})`).join(' → ') };
    }
    if (level === 7) {
      const [a, b] = spaced(pool, 2, 20);
      const opts = shuffle([a, b]);
      return { kind: 'pick2', key: 'f' + a[1] + b[1], opts, ans: a[1], years: true, prompt: 'Which came FIRST?', expected: `${a[1]} (${yearText(a[2])})`,
        explain: `${a[1][0].toUpperCase() + a[1].slice(1)}: ${yearText(a[2])}. ${b[1][0].toUpperCase() + b[1].slice(1)}: ${yearText(b[2])}.` };
    }
    // centuries
    const it = pick([...INV, ...EVT].filter(x => x[2] >= 1000 && x[2] % 100 !== 0));
    const c = Math.floor((it[2] - 1) / 100) + 1, hund = Math.floor(it[2] / 100) * 100;
    const mk = k => `${ORD(k)} century (the ${(k - 1) * 100}s)`;
    const opts = shuffle([c, c - 1, c + 1, c - 2].filter(k => k > 0 && k <= 21)).slice(0, 4);
    if (!opts.includes(c)) opts[0] = c;
    return { kind: 'mc', key: 'c' + it[1], it, ans: mk(c), opts: shuffle(opts.map(mk)), prompt: `${it[0]} The ${it[1]} — ${it[2]}. Which century is that?`, say: `The ${it[1]} was in ${it[2]}. Which century is that?`, expected: mk(c),
      explain: `The ${hund}s are the ${ORD(c)} century, because the 1st century was years 1 to 100. Add one to the first two digits!` };
  }

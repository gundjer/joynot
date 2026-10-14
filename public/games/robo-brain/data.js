// Robo Brain data: training sets, the robot's brain, decision tree, question banks and lessons.
import { el, pick, sample, shuffle, rand } from '../_joy/js/util.js';
import { pics, note, stack, eq } from '../_joy/js/lesson.js';
import { addRoboBanks, ROBO_GEN } from './more.js';
export { ROBO_GEN };

export const TASKS = [
  { name: 'fly or swim', a: ['✈️', 'FLIES'], b: ['🌊', 'SWIMS'], items: [['🦅', 'eagle', 'a', [1, 1, 0]], ['🐦', 'bird', 'a', [1, 1, 0]], ['🦋', 'butterfly', 'a', [1, 0, 0]], ['🐝', 'bee', 'a', [1, 0, 0]], ['🦉', 'owl', 'a', [1, 1, 0]], ['🐟', 'fish', 'b', [0, 0, 1]], ['🐬', 'dolphin', 'b', [0, 0, 1]], ['🐙', 'octopus', 'b', [0, 0, 1]], ['🦈', 'shark', 'b', [0, 0, 1]], ['🐳', 'whale', 'b', [0, 0, 1]]], feat: ['wings', 'feathers', 'fins'] },
  { name: 'hot or cold', a: ['🔥', 'HOT'], b: ['❄️', 'COLD'], items: [['🔥', 'fire', 'a', [1, 0]], ['☀️', 'sun', 'a', [1, 0]], ['☕', 'hot cocoa', 'a', [1, 0]], ['🌶️', 'hot pepper', 'a', [1, 0]], ['🌋', 'volcano', 'a', [1, 0]], ['⛄', 'snowman', 'b', [0, 1]], ['🍦', 'ice cream', 'b', [0, 1]], ['🐧', 'penguin', 'b', [0, 1]], ['❄️', 'snowflake', 'b', [0, 1]], ['🥶', 'shivering face', 'b', [0, 1]]], feat: ['heat', 'ice'] },
  { name: 'fruit or not', a: ['🍎', 'FRUIT'], b: ['🚫', 'NOT FRUIT'], items: [['🍎', 'apple', 'a', [1, 1]], ['🍌', 'banana', 'a', [1, 1]], ['🍇', 'grapes', 'a', [1, 1]], ['🍓', 'strawberry', 'a', [1, 1]], ['🍉', 'watermelon', 'a', [1, 1]], ['🚗', 'car', 'b', [0, 0]], ['⚽', 'ball', 'b', [0, 0]], ['📚', 'book', 'b', [0, 0]], ['✏️', 'pencil', 'b', [0, 0]], ['👟', 'shoe', 'b', [0, 0]]], feat: ['grows on plants', 'sweet'] },
];
/** The robot's brain: k-nearest-neighbor. It answers like the training example that looks most similar. */
export function robotGuess(train, test) {
  let best = null, bd = 1e9;
  train.forEach(t => { const d = t.f.reduce((s, v, i) => s + (v - test.f[i]) ** 2, 0); if (d < bd) { bd = d; best = t; } });
  return best;
}

export const AI_WHERE = [
  ['Which of these uses AI?', 'A voice helper that answers questions', ['A wooden spoon', 'A paper book'], 'Voice helpers use AI to understand speech and find answers.'],
  ['Which of these uses AI?', 'A map app that finds the fastest way home', ['A pencil', 'A rock'], 'Map apps use AI to predict traffic and pick a route.'],
  ['Which of these uses AI?', 'A video app that suggests what to watch next', ['A light switch', 'A teddy bear'], 'It learns what you like from what you watched before.'],
  ['What is AI?', 'A computer program that learns from examples to make smart guesses', ['A robot with real feelings', 'A magic box that knows everything'], 'AI = Artificial Intelligence. Artificial means made by people.'],
  ['Does AI think and feel like a person?', 'No — it finds patterns in data, but it doesn’t have feelings', ['Yes, exactly like people', 'Only on weekends'], 'AI can be very helpful, but it is a tool made by people.'],
  ['Who makes AI?', 'People — engineers and scientists write the programs and choose the data', ['It grows on trees', 'It makes itself out of nothing'], 'People build AI and are responsible for how it is used.'],
];
export const MORE = [
  ['Try the slider. What happens when the robot learns from MORE examples?', 'It usually gets better at guessing', ['It gets worse', 'Nothing changes'], 'More (and more varied) examples help AI learn the pattern.'],
  ['A robot only saw 2 pictures of dogs. Will it be good at spotting all dogs?', 'Probably not — it needs many examples', ['Yes, perfect', 'Only the 2 dogs'], 'Big, small, fluffy, spotted… it needs to see lots of different dogs.'],
  ['What do we call the examples an AI learns from?', 'Training data', ['Lunch', 'A password'], 'Training data is like practice for the AI.'],
  ['Why do AI makers test the AI on NEW examples it never saw?', 'To check it really learned, not just memorized', ['To make it tired', 'Because testing is fun'], 'Like a spelling test with new words — it shows if you understand.'],
];
export const BIAS = [
  ['A robot learned “cat” only from ORANGE cats. Then it sees a gray cat. What might happen?', 'It might say it’s not a cat', ['It will always be right', 'It will paint the cat orange'], 'If the training data is missing kinds of things, the AI can make unfair mistakes.'],
  ['Someone teaches the robot that a tomato is a “car.” What will the robot do?', 'Learn the wrong thing and make mistakes', ['Know it is wrong', 'Turn into a tomato'], 'AI copies the examples it gets. Bad examples → bad answers. “Garbage in, garbage out.”'],
  ['How can we make AI fairer?', 'Train it with many different kinds of examples', ['Use only one kind of example', 'Never test it'], 'Diverse data helps AI work well for everyone.'],
  ['A voice helper understands some accents better than others. Why?', 'It heard more examples of some voices while learning', ['Some people talk wrong', 'Voices are too loud'], 'This is called bias. Engineers fix it with more varied training data.'],
];
export const CHAT = [
  ['A chatbot learned by reading lots of text. What does it do when it writes?', 'Predicts which words are likely to come next', ['Looks up a perfect answer every time', 'Reads your mind'], 'Chatbots guess the next word over and over, very quickly.'],
  ['Which prompt will get a better answer?', '“Write a 4-line poem about a sleepy cat for a 2nd grader.”', ['“poem”', '“write something”'], 'Clear prompts say WHAT you want, WHO it’s for and HOW long.'],
  ['A chatbot says “Abraham Lincoln invented the phone.” What should you do?', 'Check a trusted source — chatbots can be wrong', ['Believe it', 'Tell everyone right away'], 'Chatbots sometimes make things up. Always double-check facts.'],
  ['Which is a good prompt for help with homework?', '“Explain how to add fractions with an example, step by step.”', ['“Do my homework”', '“answer”'], 'Asking AI to EXPLAIN helps you learn instead of just copying.'],
  ['The cat sat on the ___. What word would a chatbot most likely predict?', 'mat', ['rocket', 'pizza'], 'It picks the word that most often comes next in the text it learned from.'],
];
export const WISE = [
  ['Should you tell an AI chatbot your home address or password?', 'No — keep private information private', ['Yes, it’s a robot', 'Only if it asks nicely'], 'Never share private info with apps or AI without a grown-up.'],
  ['You see a picture online of a cat flying a jet. What might be true?', 'It could be made by AI — not everything is real', ['Cats can fly jets', 'Photos are always real'], 'AI can make realistic fake pictures and videos. Think before you believe or share.'],
  ['Is it OK to turn in an AI’s writing as your own work?', 'No — be honest and follow your teacher’s rules', ['Yes, always', 'Only if it’s short'], 'Use AI to learn and brainstorm, and say when you used it.'],
  ['An AI helper gives you an answer that seems strange. What is smart?', 'Ask a grown-up or check another source', ['Do it anyway', 'Never ask questions'], 'People should stay in charge and use their own judgment.'],
  ['What is something AI is great at?', 'Finding patterns in huge amounts of data', ['Knowing how you feel inside', 'Always being 100% right'], 'AI is powerful at patterns — and still needs people to check it.'],
];
export const TREE = { q: 'Does it have feathers?', yes: { q: 'Can it fly?', yes: { leaf: 'Flying bird 🦅' }, no: { leaf: 'Penguin-type bird 🐧' } }, no: { q: 'Does it live in water?', yes: { leaf: 'Fish or sea animal 🐟' }, no: { q: 'Does it have fur?', yes: { leaf: 'Furry mammal 🐻' }, no: { leaf: 'Reptile 🦎' } } } };
export const TREE_ITEMS = [['🦅', 'eagle', { feathers: 1, fly: 1 }], ['🐧', 'penguin', { feathers: 1, fly: 0 }], ['🐦', 'robin', { feathers: 1, fly: 1 }], ['🦈', 'shark', { feathers: 0, water: 1 }], ['🐠', 'clownfish', { feathers: 0, water: 1 }], ['🐻', 'bear', { feathers: 0, water: 0, fur: 1 }], ['🦊', 'fox', { feathers: 0, water: 0, fur: 1 }], ['🐍', 'snake', { feathers: 0, water: 0, fur: 0 }], ['🦎', 'lizard', { feathers: 0, water: 0, fur: 0 }]];
export const QKEY = { 'Does it have feathers?': 'feathers', 'Can it fly?': 'fly', 'Does it live in water?': 'water', 'Does it have fur?': 'fur' };

addRoboBanks({ AI_WHERE, MORE, BIAS, CHAT, WISE, TREE_ITEMS });

export const LESSONS = {
  1: [
    { title: 'What is AI?', text: 'AI stands for ARTIFICIAL INTELLIGENCE. It is a computer program that learns from lots of examples so it can make smart guesses.', art: pics([['🤖', 'artificial = made by people'], ['🧠', 'intelligence = smart guessing']]) },
    { title: 'AI is all around', text: 'AI helps voice helpers understand you, maps find fast routes, cameras focus on faces and apps suggest songs.', art: pics([['🗣️', 'voice helpers'], ['🗺️', 'maps'], ['📷', 'cameras'], ['🎵', 'music picks']]) },
    { title: 'AI is a tool', text: 'AI does not have feelings and is not alive. People build it, and people decide how to use it.', art: pics([['🔨', 'a tool'], ['👩‍🔬', 'built by people']]) },
  ],
  2: [
    { title: 'Learning from examples', text: 'You learned what a dog is by seeing lots of dogs. AI learns the same way! We show it EXAMPLES with the right answers. This is called TRAINING.', art: pics([['🐶', 'dog'], ['🐕', 'dog'], ['🐩', 'dog'], ['➜'], ['🤖', 'learns “dog”']]) },
    { title: 'You are the teacher', text: 'Sort the example cards into the robot’s two boxes. Then the robot will guess a NEW card by finding the example that looks most like it.', art: pics([['🗂️', 'you sort'], ['🤖', 'robot learns'], ['❓', 'robot guesses']]) },
  ],
  3: [
    { title: 'Patterns', text: 'AI is great at finding PATTERNS — things that repeat. Red, blue, red, blue… what comes next? Red!', art: '<div class="row-items">🔴 🔵 🔴 🔵 ❓</div>' },
  ],
  4: [
    { title: 'Practice makes perfect', text: 'The more examples an AI learns from, the better it usually gets — especially if the examples are DIFFERENT from each other.', art: box => practiceSim(box) },
  ],
  5: [
    { title: 'AI can be wrong', text: 'AI only knows what it learned. If the examples were wrong or missing some kinds of things, it makes mistakes. Unfair mistakes like this are called BIAS.', art: pics([['🐈', 'only orange cats'], ['➜'], ['🤖', '“gray cat = not a cat?”']]) },
    { title: 'Garbage in, garbage out', text: 'Bad examples make a bad AI. That’s why people must choose training data carefully and test the AI.', art: note('✅ good, varied data → better AI<br>❌ wrong or one-sided data → mistakes') },
  ],
  6: [
    { title: 'Decision trees', text: 'Some AI decides by asking yes/no questions, one after another, like the game 20 Questions. This is called a DECISION TREE.', art: note('Feathers? → yes → Can it fly? → no → 🐧') },
  ],
  7: [
    { title: 'How sure?', text: 'AI doesn’t just guess — it gives a CONFIDENCE score. “I’m 90% sure this is a dog” means it’s pretty sure. 51% means it’s barely sure — maybe check!', art: note('🐶 dog 90% · 🐱 cat 8% · 🦊 fox 2%') },
  ],
  8: [
    { title: 'How chatbots work', text: 'Chatbots read huge amounts of text while training. When they answer, they predict the next likely word, again and again, very fast.', art: note('“The sun rises in the ___” → <b>east</b>') },
    { title: 'Good prompts', text: 'A PROMPT is what you ask the AI. Good prompts are clear: say what you want, who it’s for, and how long or what style.', art: note('❌ “story”<br>✅ “A short funny story about a dragon who loves pancakes, for a 1st grader.”') },
  ],
  9: [
    { title: 'Use AI wisely', text: 'Keep private information private. Double-check facts. Remember that pictures and videos can be made by AI. Be honest when you use AI for schoolwork.', art: pics([['🔒', 'stay private'], ['🔍', 'check facts'], ['🖼️', 'pictures can be fake'], ['🙋', 'be honest']]) },
  ],
  10: [
    { title: 'Neural networks', text: 'Many AIs use NEURAL NETWORKS, inspired by brain cells. Each “neuron” adds up clues. Important clues get bigger WEIGHTS. If the total is big enough, the neuron says YES.', art: eq('furry×3 + barks×5 + meows×(−4) = score') },
    { title: 'Example', text: 'An animal is furry (1) and barks (1) but doesn’t meow (0): 1×3 + 1×5 + 0×(−4) = 8. If the rule is “more than 5 means dog”, the neuron says DOG!', art: eq('3 + 5 + 0 = 8 > 5 → DOG') },
  ],
};

function practiceSim(box) {
  const slider = el('input', { type: 'range', min: 1, max: 30, value: 3, 'aria-label': 'Number of examples' });
  const m = el('div', { class: 'sim-meter' }, [el('div', { class: 'sim-fill' }), el('span', { class: 'sim-val' })]);
  const pics2 = el('div', { class: 'row-items rb-ex' });
  const draw = () => { const n = +slider.value, acc = Math.round(50 + 48 * (1 - Math.exp(-n / 7))); m.firstChild.style.width = acc + '%'; m.lastChild.textContent = `${n} examples → right ${acc}% of the time`; pics2.textContent = ['🐶', '🐕', '🐩'].concat(Array(Math.max(0, n - 3)).fill('🐶')).slice(0, n).join(' '); };
  slider.addEventListener('input', draw);
  box.append(pics2, el('label', { class: 'sim-lab' }, ['📚 ', slider]), m);
  draw();
  return () => {};
}

const mc = (q, a, w, why, key, extra = {}) => ({ kind: 'mc', key, prompt: q, ans: a, opts: shuffle([a, ...w]), expected: a, explain: why, ...extra });

export function makeQ(level, ctx) {
    if (ROBO_GEN[level] && Math.random() < 0.5) { const g = ROBO_GEN[level](); if (g) return g; }
    if (level === 1) { const [q, a, w, why] = pick(AI_WHERE); return mc(q, a, w, why, 'w' + a.slice(0, 20)); }
    if (level === 2) {
      const T = pick(TASKS), as = sample(T.items.filter(i => i[2] === 'a'), 3), bs = sample(T.items.filter(i => i[2] === 'b'), 3);
      const train = shuffle([...as.slice(0, 2), ...bs.slice(0, 2)]), test = pick([as[2], bs[2]]);
      return { kind: 'train', key: 'tr' + T.name + test[1], T, train, test, prompt: `Teach Robo: sort these into ${T.a[1]} and ${T.b[1]}. Then Robo will guess a new one!`, expected: train.map(t => `${t[1]}: ${t[2] === 'a' ? T.a[1] : T.b[1]}`).join(', '), tries: 2 };
    }
    if (level === 3) {
      const sets = [['🔴', '🔵'], ['⭐', '🌙'], ['🐶', '🐱'], ['🍎', '🍌', '🍇'], ['🔺', '🔷', '⚪']];
      const S = pick(sets), kind = rand(0, 2);
      let seq;
      if (kind === 0) seq = Array.from({ length: 6 }, (_, i) => S[i % S.length]);
      else if (kind === 1) seq = Array.from({ length: 7 }, (_, i) => (i % 3 === 2 ? S[1] : S[0]));
      else seq = Array.from({ length: 7 }, (_, i) => S[[0, 0, 1, 1][i % 4]]);
      const ans = kind === 0 ? S[6 % S.length] : kind === 1 ? S[7 % 3 === 2 ? 1 : 0] : S[[0, 0, 1, 1][7 % 4]];
      return { kind: 'pattern', key: 'p' + seq.join(''), seq, ans, opts: shuffle([ans, ...S.filter(x => x !== ans), '💚']).slice(0, 4), prompt: 'Find the pattern, like an AI. What comes next?', expected: ans, explain: 'Spotting what repeats is exactly what AI does with huge amounts of data.' };
    }
    if (level === 4) { const [q, a, w, why] = pick(MORE); return mc(q, a, w, why, 'm' + q.slice(0, 18), { sim: 'practice' }); }
    if (level === 5) { const [q, a, w, why] = pick(BIAS); return mc(q, a, w, why, 'b' + q.slice(0, 18)); }
    if (level === 6) { const [ic, name, f] = pick(TREE_ITEMS); return { kind: 'tree', key: 't' + name, ic, name, f, prompt: `Help Robo decide what the ${name} is. Answer each question in the decision tree.`, expected: leafFor(f), tries: 2 }; }
    if (level === 7) {
      const animals = [['🐶', 'dog'], ['🐱', 'cat'], ['🦊', 'fox'], ['🐰', 'rabbit'], ['🐻', 'bear']];
      const pickd = sample(animals, 3), p1 = rand(55, 92), p2 = rand(3, 100 - p1 - 2), p3 = 100 - p1 - p2;
      const ps = [p1, p2, p3];
      const ask = rand(0, 2);
      const q = ask === 0 ? 'What does Robo think the picture is?' : ask === 1 ? 'Which guess is Robo LEAST sure about?' : `How sure is Robo that it is a ${pickd[0][1]}?`;
      const ans = ask === 0 ? pickd[0][1] : ask === 1 ? pickd[ps.indexOf(Math.min(...ps))][1] : `${p1}%`;
      const opts = ask === 2 ? shuffle([`${p1}%`, `${p2}%`, '100%']) : shuffle(pickd.map(a => a[1]));
      return { kind: 'conf', key: 'c' + pickd.map(a => a[1]).join() + ps.join(), bars: pickd.map((a, i) => [...a, ps[i]]), prompt: q, ans, opts, expected: ans, explain: p1 < 65 ? `Robo is only ${p1}% sure — not very confident. When AI isn’t sure, people should double-check.` : 'The highest percent is the AI’s best guess.' };
    }
    if (level === 8) { const [q, a, w, why] = pick(CHAT); return mc(q, a, w, why, 'ch' + q.slice(0, 18)); }
    if (level === 9) { const [q, a, w, why] = pick(WISE); return mc(q, a, w, why, 'wi' + q.slice(0, 18)); }
    // neural network neuron
    const furry = rand(0, 1), barks = rand(0, 1), meows = rand(0, 1), score = furry * 3 + barks * 5 + meows * -4;
    const says = score > 5 ? 'DOG' : 'NOT A DOG';
    return { kind: 'neuron', key: `n${furry}${barks}${meows}`, f: [furry, barks, meows], score, prompt: `The neuron adds up clues: furry ×3, barks ×5, meows ×(−4). If the score is MORE than 5, it says DOG. This animal: furry = ${furry}, barks = ${barks}, meows = ${meows}. What does the neuron say?`, ans: says, opts: ['DOG', 'NOT A DOG'], expected: `${says} (score ${score})`, steps: [`furry: ${furry} × 3 = ${furry * 3}`, `barks: ${barks} × 5 = ${barks * 5}`, `meows: ${meows} × (−4) = ${meows * -4}`, `Total = ${score}. ${score > 5 ? 'More than 5 → DOG' : '5 or less → NOT A DOG'}.`] };
  }
export function leafFor(f) { let n = TREE; while (!n.leaf) n = f[QKEY[n.q]] ? n.yes : n.no; return n.leaf; }


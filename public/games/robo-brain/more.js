// Robo Brain: more questions plus generators, so kids keep thinking instead of memorizing.
import { pick, shuffle, rand, sample } from '../_joy/js/util.js';

const mcq = (key, prompt, ans, wrong, explain, extra = {}) => ({ kind: 'mc', key, prompt, ans, opts: shuffle([ans, ...wrong]), expected: ans, explain, ...extra });

// AI or not? [emoji, thing, uses AI?, why]
const AI_OR_NOT = [
  ['🗣️', 'a voice helper that answers questions', true, 'It learned to understand speech from millions of examples.'],
  ['🗺️', 'a map app that predicts traffic', true, 'It learned traffic patterns from lots of trips.'],
  ['📸', 'a phone that unlocks when it sees your face', true, 'It learned what your face looks like.'],
  ['📧', 'an email spam filter', true, 'It learned what junk mail usually looks like.'],
  ['🎵', 'a music app that picks songs you might like', true, 'It learned from songs you and others liked.'],
  ['🌐', 'a translation app', true, 'It learned from huge amounts of text in many languages.'],
  ['🚗', 'a self-driving car', true, 'It learned to spot roads, signs and people.'],
  ['🔦', 'a flashlight', false, 'It just turns on and off. It doesn’t learn anything.'],
  ['⏰', 'a wind-up alarm clock', false, 'It follows the same gears every time. No learning.'],
  ['🧮', 'a calculator', false, 'It follows fixed math rules. It never learns from examples.'],
  ['💡', 'a light switch', false, 'On or off, the same every time. No learning.'],
  ['🎈', 'a balloon', false, 'Not a computer at all!'],
  ['📖', 'a paper book', false, 'Paper can’t learn or make guesses.'],
  ['🚪', 'a door with a regular lock and key', false, 'The key fits or it doesn’t. No learning.'],
];

export function addRoboBanks({ AI_WHERE, MORE, BIAS, CHAT, WISE, TREE_ITEMS }) {
  AI_WHERE.push(
    ['What does “artificial” mean in Artificial Intelligence?', 'Made by people', ['Very old', 'Made of plastic'], 'Artificial = made by people, not by nature.'],
    ['How does AI learn?', 'By finding patterns in lots of examples', ['By eating', 'By sleeping'], 'Show it thousands of cat pictures and it learns what cats usually look like.'],
    ['Can AI make mistakes?', 'Yes, so people need to check it', ['No, never', 'Only robots that are tired'], 'AI makes smart guesses, and guesses can be wrong.'],
  );
  MORE.push(
    ['A robot learned apples from only RED apples. What else should we show it?', 'Green and yellow apples too', ['More red apples only', 'Bananas labeled as apples'], 'Different examples teach the whole idea of “apple”.'],
    ['Which training set will teach a robot about dogs best?', '1,000 pictures of many kinds of dogs', ['10 pictures of one dog', '1,000 pictures of cats'], 'Lots of examples AND lots of variety.'],
    ['A student practices 2 spelling words vs. 50 words. Who is more ready for a surprise word? (AI learns the same way!)', 'The one who practiced 50', ['The one who practiced 2', 'They are the same'], 'More practice with more variety helps both kids and AI.'],
  );
  BIAS.push(
    ['A robot learned “shoes” only from sneakers. It sees a boot. What might it say?', 'Not a shoe', ['Definitely a shoe', 'A boot is a hat'], 'Missing examples lead to wrong guesses.'],
    ['Who should check that an AI is fair?', 'People who build and use it', ['No one', 'Only the AI itself'], 'People are responsible for testing and fixing AI.'],
    ['An AI picks only kids who wear blue for a game, because the examples it learned from had mostly blue shirts. Is that fair?', 'No, it learned a pattern that doesn’t matter', ['Yes, blue is best', 'It is fair because a computer chose'], 'AI can learn unfair patterns from unfair examples.'],
  );
  CHAT.push(
    ['Which prompt is clearer?', '“List 3 fun facts about octopuses for a 3rd grader.”', ['“octopus”', '“tell me stuff”'], 'Say what you want, who it is for and how much.'],
    ['After a chatbot gives a science fact, what is a smart next step?', 'Check it in a book or trusted website', ['Assume it is perfect', 'Ask it to be louder'], 'Chatbots can sound sure and still be wrong.'],
    ['Twinkle, twinkle, little ___. What word would a chatbot most likely predict next?', 'star', ['potato', 'shoe'], 'It picks the word that most often comes next in text it learned from.'],
  );
  WISE.push(
    ['Your friend sends a video of a famous person saying something silly. It might be…', 'A deepfake made by AI', ['Always real', 'A cartoon only'], 'AI can fake voices and faces. Check trusted news before believing.'],
    ['What is a good way to use AI for a school project?', 'Ask it to explain ideas, then write in your own words', ['Copy its whole answer', 'Let it pick your grade'], 'Use AI as a helper, not a replacement for your thinking.'],
  );
  TREE_ITEMS.push(['🦜', 'parrot', { feathers: 1, fly: 1 }], ['🐬', 'dolphin', { feathers: 0, water: 1 }], ['🐙', 'octopus', { feathers: 0, water: 1 }], ['🐢', 'tortoise', { feathers: 0, water: 0, fur: 0 }], ['🐿️', 'squirrel', { feathers: 0, water: 0, fur: 1 }], ['🦉', 'owl', { feathers: 1, fly: 1 }]);
}

const SETS = [['🔴', '🔵'], ['⭐', '🌙'], ['🐶', '🐱'], ['🍎', '🍌', '🍇'], ['🔺', '🔷', '⚪'], ['🌞', '☁️', '🌧️'], ['🐸', '🐢'], ['🍓', '🥕', '🍋'], ['🚗', '🚌'], ['❤️', '💙', '💚']];
export const ROBO_GEN = {
  1: () => {
    const [ic, name, yes, why] = pick(AI_OR_NOT);
    return mcq('ain' + name, `${ic} Does ${name} use AI?`, yes ? 'Yes, it learns from examples' : 'No, it just follows the same steps', [yes ? 'No, it just follows the same steps' : 'Yes, it learns from examples'], why,
      { steps: ['Ask: does it LEARN from lots of examples to make guesses?', yes ? 'Yes, so it uses AI.' : 'No, it does the same thing every time, so it is not AI.'] });
  },
  3: () => {
    // number patterns: AI finds the rule
    const v = rand(0, 2);
    if (v === 0) { const a = rand(1, 9), d = rand(2, 5), seq = [0, 1, 2, 3].map(i => a + d * i); return mcq('np' + a + d, `Find the pattern like an AI: ${seq.join(', ')}, ? What comes next?`, String(a + d * 4), [String(a + d * 4 + 1), String(a + d * 3 + 1)], `The rule is “add ${d}”. ${seq[3]} + ${d} = ${a + d * 4}.`, { steps: [`Look at how each number changes: +${d}, +${d}, +${d}.`, `So the next one is ${seq[3]} + ${d} = ${a + d * 4}.`] }); }
    if (v === 1) { const a = rand(1, 3), seq = [a, a * 2, a * 4, a * 8]; return mcq('dp' + a, `Find the pattern: ${seq.join(', ')}, ? What comes next?`, String(a * 16), [String(a * 8 + a), String(a * 12)], 'The rule is “double it”.', { steps: ['Each number is 2 times the one before.', `${a * 8} × 2 = ${a * 16}.`] }); }
    const S = pick(SETS), len = rand(2, 3), unit = Array.from({ length: len }, (_, i) => S[i % S.length]), seq = Array.from({ length: len * 2 + 1 }, (_, i) => unit[i % len]), ans = unit[(len * 2 + 1) % len];
    return mcq('ep' + seq.join(''), `Find the pattern: ${seq.join(' ')} ? What comes next?`, ans, sample(S.filter(x => x !== ans), Math.min(2, S.length - 1)), 'Find the part that repeats, then keep it going.', { steps: [`The repeating part is: ${unit.join(' ')}.`, `Keep going: the next one is ${ans}.`] });
  },
};

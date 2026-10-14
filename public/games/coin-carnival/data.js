// Coin Carnival data: the coin challenge for each level.
import { MONEY, COIN_KINDS, fewest, piecesText, countSteps, makeSteps } from '../_joy/js/money.js';
import { rand, pick, shuffle, money, sayMoney, dollars } from '../_joy/js/util.js';

export const KINDS_FOR = { 3: ['penny', 'nickel'], 4: ['penny', 'nickel', 'dime'], 5: COIN_KINDS, 7: COIN_KINDS, 8: ['one', 'five', ...COIN_KINDS] };
const showValues = (s, lv) => (s.values === 'always' ? true : s.values === 'never' ? false : lv >= 3 && lv <= 5);
export const amt = c => (c >= 100 ? dollars(c) : c + '¢');

export const LOOKS = { penny: 'copper-brown and small', nickel: 'silver, thick and bigger than a penny', dime: 'silver and the SMALLEST coin', quarter: 'silver and the BIGGEST coin' };
export function teach(q) {
  if (q.mode === 'pickcoin') q.steps = [`A ${MONEY[q.kind].name} is ${LOOKS[q.kind]}.`, `It is worth ${MONEY[q.kind].cents}¢.`];
  else if (q.mode === 'value') q.steps = [`A ${MONEY[q.kind].name} is worth ${MONEY[q.kind].cents}¢.`, 'Remember: penny 1¢, nickel 5¢, dime 10¢, quarter 25¢. The tiny dime is worth more than the bigger nickel!'];
  else if (q.mode === 'count') q.steps = countSteps(q.pile);
  else if (q.mode === 'make') q.steps = makeSteps(q.target, q.kinds, { fewestWords: q.fewest });
  return q;
}

export function makeQ(level) {
    if (level === 1) {
      const k = pick(COIN_KINDS);
      return { mode: 'pickcoin', key: 'id' + k + rand(1, 3), kind: k, prompt: `Tap the ${MONEY[k].name}.`, expected: MONEY[k].name };
    }
    if (level === 2) {
      const k = pick(COIN_KINDS), named = Math.random() < 0.5;
      return { mode: 'value', key: 'v' + k + named, kind: k, named, prompt: named ? `How much is a ${MONEY[k].name} worth?` : 'How much is this coin worth?', expected: MONEY[k].cents + '¢' };
    }
    if (level === 6) {
      const n = rand(3, 7), pile = Array.from({ length: n }, () => pick(COIN_KINDS));
      const total = pile.reduce((s, k) => s + MONEY[k].cents, 0);
      if (total > 99) return makeQ(6);
      return { mode: 'count', key: 'p' + pile.sort().join(), pile: shuffle(pile), total, prompt: 'How much money is in the pile?', expected: total + '¢' };
    }
    const max = { 3: 20, 4: 50, 5: 99, 7: 99, 8: 500 }[level];
    const min = { 3: 3, 4: 11, 5: 26, 7: 30, 8: 105 }[level];
    let target = rand(min, max);
    if (level === 8) target = rand(1, 4) * 100 + rand(0, 19) * 5;
    const kinds = KINDS_FOR[level];
    return {
      mode: 'make', key: 'm' + target, target, kinds, fewest: level === 7,
      prompt: level === 7 ? `Put ${amt(target)} in the piggy bank using the FEWEST coins you can.` : `Put ${amt(target)} in the piggy bank.`,
      say: level === 7 ? `Put ${sayMoney(target)} in the piggy bank using the fewest coins you can.` : `Put ${sayMoney(target)} in the piggy bank.`,
      expected: `${amt(target)} (${piecesText(fewest(target, kinds))})`,
    };
  }

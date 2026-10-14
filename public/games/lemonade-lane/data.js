// Lemonade Lane data: menu, supplies and the money problem for each level.
import { rand, pick, sample, money, dollars, sayMoney } from '../_joy/js/util.js';

export const MENU = [['🍋', 'lemonade'], ['🍪', 'cookie'], ['🧁', 'cupcake'], ['🍓', 'strawberry lemonade'], ['🍩', 'donut'], ['🍉', 'watermelon slice'], ['🥨', 'pretzel'], ['🍎', 'bag of apple slices']];
export const SUPPLY = [['🍋', 'bag of lemons'], ['🥤', 'pack of cups'], ['🍬', 'bag of sugar'], ['🍓', 'box of strawberries'], ['🧻', 'pack of napkins']];
const PEOPLE = ['👧', '🧒', '👦', '👩', '🧑', '👨', '👵', '👴'];
const c = x => (x < 100 ? x + '¢' : money(x));
const cSay = x => sayMoney(x);

export function makeQ(level) {
    const who = pick(PEOPLE);
    if (level === 1) {
      const each = pick([1, 1, 1, 2, 5, 10]), n = each === 1 ? rand(2, 10) : rand(2, 5);
      return { kind: 'money', key: `c${each}x${n}`, who, lines: [['🍋', 'cup of lemonade', each, n]], ans: each * n,
        prompt: `Each cup costs ${each}¢. ${who} buys ${n} cups. How much is that?`, say: `Each cup costs ${each} cents. The customer buys ${n} cups. How much is that?`, expected: `${each * n}¢`,
        steps: [each === 1 ? `Count the cups: ${n} cups × 1¢ = ${n}¢.` : `Skip count by ${each}: ${Array.from({ length: n }, (_, i) => (i + 1) * each).join(', ')}.`] };
    }
    if (level === 2) {
      const [a, b] = sample(MENU, 2), pa = rand(2, 12), pb = rand(1, 19 - pa);
      return { kind: 'money', key: `t${pa}+${pb}`, who, lines: [[a[0], a[1], pa, 1], [b[0], b[1], pb, 1]], ans: pa + pb,
        prompt: `${who} buys a ${a[1]} for ${pa}¢ and a ${b[1]} for ${pb}¢. What is the total?`, expected: `${pa + pb}¢`, steps: [`${pa}¢ + ${pb}¢ = ${pa + pb}¢`] };
    }
    if (level === 3) {
      const items = sample(MENU, rand(2, 3)).map(m => [m[0], m[1], rand(1, 6) * 100, 1]);
      const t = items.reduce((s, i) => s + i[2], 0);
      return { kind: 'money', key: 'w' + items.map(i => i[2]).join('+'), who, lines: items, ans: t,
        prompt: `${who} buys ${items.map(i => `a ${i[1]} (${dollars(i[2])})`).join(', ')}. What is the total?`, expected: money(t), steps: [items.map(i => dollars(i[2])).join(' + ') + ` = ${dollars(t)}`] };
    }
    if (level === 4) {
      const [a, b] = sample(MENU, 2), pa = rand(3, 30) * 5, pb = rand(3, 30) * 5;
      return { kind: 'money', key: `d${pa}+${pb}`, who, lines: [[a[0], a[1], pa, 1], [b[0], b[1], pb, 1]], ans: pa + pb,
        prompt: `A ${a[1]} costs ${money(pa)} and a ${b[1]} costs ${money(pb)}. How much for both?`, expected: money(pa + pb),
        steps: [`Add the dollars, then the cents: ${money(pa)} + ${money(pb)} = ${money(pa + pb)}.`] };
    }
    if (level === 5) {
      const [a, b] = sample(SUPPLY, 2), pa = rand(4, 40) * 5, pb = rand(4, 30) * 5, have = rand(2, 7) * 100;
      const t = pa + pb, ok = have >= t;
      return { kind: 'yesno', key: `e${have}-${t}`, lines: [[a[0], a[1], pa, 1], [b[0], b[1], pb, 1]], ans: ok ? 'yes' : 'no', have,
        prompt: `You have ${dollars(have)}. You need a ${a[1]} (${money(pa)}) and a ${b[1]} (${money(pb)}). Do you have enough money?`, expected: ok ? 'Yes' : 'No',
        explain: `${money(pa)} + ${money(pb)} = ${money(t)}. ${ok ? `You'd have ${money(have - t)} left.` : `You need ${money(t - have)} more.`}`, steps: [`Add the two prices: ${money(pa)} + ${money(pb)} = ${money(t)}. Is that more or less than ${dollars(have)}?`] };
    }
    if (level === 6) {
      const [ic, name] = pick(SUPPLY), each = rand(2, 6) * 100, n = rand(2, 6), extra = Math.random() < 0.4 ? rand(1, each / 100 - 1) * 100 : 0, have = each * n + extra;
      return { kind: 'count', key: `h${have}/${each}`, lines: [[ic, name, each, 1]], ans: n, have, unit: name + 's',
        prompt: `You have ${dollars(have)}. Each ${name} costs ${dollars(each)}. How many can you buy?`, expected: `${n}`,
        steps: [`How many groups of ${dollars(each)} fit in ${dollars(have)}? ${dollars(each)} × ${n} = ${dollars(each * n)}${extra ? ` (with ${dollars(extra)} left over)` : ''}.`] };
    }
    if (level === 7) {
      const price = pick([25, 50, 75, 100, 125]), n = rand(4, 12), cost = rand(2, Math.max(2, Math.floor(price * n / 100) - 1)) * 50;
      const sales = price * n, profit = sales - cost;
      if (profit <= 0) return makeQ(7);
      return { kind: 'money', key: `p${price}x${n}-${cost}`, lines: [['🍋', 'cups sold', price, n], ['🧾', 'supplies cost', cost, 1]], ans: profit, profit: true,
        prompt: `You sold ${n} cups of lemonade at ${c(price)} each. Your supplies cost ${money(cost)}. What is your profit?`, expected: money(profit),
        steps: [`Money in: ${n} × ${c(price)} = ${money(sales)}.`, `Profit = money in − supplies: ${money(sales)} − ${money(cost)} = ${money(profit)}.`] };
    }
    if (level === 8) {
      const items = sample(MENU, 2).map(m => [m[0], m[1], rand(3, 12) * 25, rand(2, 4)]);
      const t = items.reduce((s, i) => s + i[2] * i[3], 0);
      return { kind: 'money', key: 'b' + items.map(i => i[2] + 'x' + i[3]).join(), who, lines: items, ans: t,
        prompt: `${who} orders ${items.map(i => `${i[3]} ${i[1]}${i[1].endsWith('s') ? '' : 's'} at ${money(i[2])} each`).join(' and ')}. What is the total?`, expected: money(t),
        steps: [...items.map(i => `${i[3]} × ${money(i[2])} = ${money(i[2] * i[3])}`), `${items.map(i => money(i[2] * i[3])).join(' + ')} = ${money(t)}`] };
    }
    // sales & discounts
    const [ic, name] = pick(MENU);
    const v = rand(0, 2);
    if (v === 0) {
      const price = pick([100, 200, 300, 400, 120, 160, 240]), pct = pick([25, 50, 10]), off = price * pct / 100;
      if (off % 5) return makeQ(9);
      return { kind: 'money', key: `s${price}-${pct}`, lines: [[ic, name, price, 1]], ans: price - off, pct,
        prompt: `A ${name} usually costs ${money(price)}. Today it's ${pct}% off! What is the sale price?`, expected: money(price - off),
        steps: [`${pct}% of ${money(price)} = ${money(off)}${pct === 25 ? ' (one quarter)' : pct === 50 ? ' (half)' : ' (one tenth)'}.`, `${money(price)} − ${money(off)} = ${money(price - off)}.`] };
    }
    if (v === 1) {
      const price = pick([50, 75, 100, 125, 150]), n = pick([4, 6, 8, 10]);
      const t = price * n, off = t / 10;
      if (off % 5) return makeQ(9);
      return { kind: 'money', key: `g${price}x${n}`, lines: [[ic, name, price, n]], ans: t - off,
        prompt: `A soccer team buys ${n} ${name}s at ${money(price)} each. Big orders get 10% off. What do they pay?`, expected: money(t - off),
        steps: [`${n} × ${money(price)} = ${money(t)}.`, `10% of ${money(t)} is ${money(off)}.`, `${money(t)} − ${money(off)} = ${money(t - off)}.`] };
    }
    const price = pick([100, 150, 200]), deal = 'Buy 2, get 1 free', n = 3 * rand(1, 3);
    const pay = (n / 3) * 2 * price;
    return { kind: 'money', key: `f${price}x${n}`, lines: [[ic, name, price, n]], ans: pay,
      prompt: `${deal}! A ${name} is ${money(price)}. How much do you pay for ${n} of them?`, expected: money(pay),
      steps: [`Every 3 ${name}s, you only pay for 2.`, `${n} ${name}s = ${n / 3} group${n > 3 ? 's' : ''} of 3, so you pay for ${(n / 3) * 2}: ${(n / 3) * 2} × ${money(price)} = ${money(pay)}.`] };
  }

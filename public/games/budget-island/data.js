// Budget Island data: the money choice for each level.
import { rand, pick, sample, shuffle, money, dollars } from '../_joy/js/util.js';

export const NEEDS = [['🍎', 'healthy food'], ['💧', 'water'], ['🧥', 'warm coat'], ['🏠', 'a home'], ['💊', 'medicine'], ['🦷', 'toothbrush'], ['👟', 'shoes that fit'], ['🛏️', 'a bed'], ['🧼', 'soap'], ['📓', 'school notebook'], ['🥦', 'vegetables'], ['🧦', 'socks']];
export const WANTS = [['🎮', 'video game'], ['🍭', 'giant lollipop'], ['🧸', 'another teddy bear'], ['🎈', 'balloons'], ['🛹', 'skateboard'], ['🍦', 'ice cream'], ['🎢', 'theme park ticket'], ['🕶️', 'cool sunglasses'], ['🎧', 'fancy headphones'], ['🧩', 'new puzzle'], ['🎸', 'toy guitar'], ['🍫', 'chocolate bar']];
export const TOYS = [['🎈', 'kite'], ['⚽', 'ball'], ['🧸', 'teddy bear'], ['🎨', 'paint set'], ['📚', 'book'], ['🚲', 'bike'], ['🎮', 'video game'], ['🛹', 'skateboard'], ['🎸', 'guitar'], ['🧩', 'puzzle'], ['🦖', 'dino toy'], ['🚀', 'rocket kit']].filter(t => t[0] !== '🎈');
export const CHORES = [['🐕', 'walk the dog'], ['🚗', 'wash the car'], ['🍂', 'rake leaves'], ['🌱', 'water the plants'], ['🧺', 'fold laundry'], ['🍽️', 'do the dishes']];
export const ISLAND = [[0, '🏝️'], [5, '🌴'], [15, '⛺'], [30, '🌺'], [50, '🏠'], [75, '⛵'], [105, '🐠'], [140, '🏰'], [180, '🎡'], [230, '🗼'], [290, '🚀']];

export function makeQ(level) {
    if (level === 1) {
      const need = Math.random() < 0.5, [ic, name] = pick(need ? NEEDS : WANTS);
      return { kind: 'sort', key: 'nw' + name, ic, name, ans: need ? 'need' : 'want', prompt: `Is “${name}” a NEED or a WANT? Drag it to the right box.`, expected: need ? 'Need' : 'Want',
        explain: need ? `${name[0].toUpperCase() + name.slice(1)} is a need — something we must have to be healthy and safe.` : `${name[0].toUpperCase() + name.slice(1)} is a want — fun to have, but we can live without it.` };
    }
    if (level === 2) {
      const have = rand(3, 12) * 100, toys = sample(TOYS, 3);
      const okI = rand(0, 2);
      const prices = toys.map((t, i) => (i === okI ? rand(1, have / 100) * 100 : rand(have / 100 + 1, have / 100 + 8) * 100));
      return { kind: 'pickitem', key: 'cb' + have + prices.join(), have, items: toys.map((t, i) => [...t, prices[i]]), ans: okI,
        prompt: `Coco has ${dollars(have)}. Which one can Coco buy?`, expected: `${toys[okI][1]} (${dollars(prices[okI])})`, explain: `${dollars(prices[okI])} is not more than ${dollars(have)}, so Coco can buy it.` };
    }
    if (level === 3) {
      const have = rand(5, 20) * 100, [ic, name] = pick(TOYS), p = rand(1, have / 100 - 1) * 100 + (Math.random() < 0.4 ? pick([25, 50, 75]) : 0);
      return { kind: 'money', key: 'l' + have + '-' + p, have, items: [[ic, name, p]], ans: have - p, prompt: `Coco has ${dollars(have)} and buys a ${name} for ${money(p)}. How much money is left?`, expected: money(have - p), steps: [`${money(have)} − ${money(p)} = ${money(have - p)}`] };
    }
    if (level === 4) {
      const [ic, name] = pick(TOYS), per = pick([2, 3, 4, 5, 10]), weeks = rand(3, 10), saved = Math.random() < 0.4 ? rand(1, 4) * per : 0;
      const cost = per * weeks + saved;
      return { kind: 'count', key: 'g' + cost + '/' + per + '/' + saved, items: [[ic, name, cost * 100]], ans: weeks, unit: 'weeks',
        prompt: `A ${name} costs ${dollars(cost * 100)}. ${saved ? `Coco already saved ${dollars(saved * 100)}. ` : ''}Coco saves ${dollars(per * 100)} every week. How many weeks until Coco can buy it?`, expected: `${weeks} weeks`,
        steps: [saved ? `First: ${dollars(cost * 100)} − ${dollars(saved * 100)} = ${dollars((cost - saved) * 100)} still needed.` : `Count by ${per}s up to ${cost}.`, `${dollars((cost - saved) * 100)} ÷ ${dollars(per * 100)} = ${weeks} weeks.`] };
    }
    if (level === 5) {
      const total = pick([6, 8, 10, 12]);
      const rules = [
        { text: 'Put HALF in Save. Put 1 dollar in Share. The rest goes in Spend.', save: total / 2, share: 1 },
        { text: 'Put 2 dollars in Share. Put 3 dollars in Save. The rest goes in Spend.', save: 3, share: 2 },
        { text: 'Put the SAME amount in Save and Spend. Put 2 dollars in Share.', save: (total - 2) / 2, share: 2 },
        { text: 'Put 1 dollar in Share. Save TWICE as much as you spend.', save: ((total - 1) / 3) * 2, share: 1 },
      ].filter(r => Number.isInteger(r.save) && r.save + r.share < total);
      const r = pick(rules), spend = total - r.save - r.share;
      return { kind: 'jars', key: 'j' + total + r.text, total, rule: r, ans: { save: r.save, spend, share: r.share },
        prompt: `Coco earned ${dollars(total * 100)} this week. ${r.text}`, expected: `Save ${dollars(r.save * 100)}, Spend ${dollars(spend * 100)}, Share ${dollars(r.share * 100)}` };
    }
    if (level === 6) {
      const [a, b] = sample(CHORES, 2), pa = rand(1, 5), pb = rand(2, 8), na = rand(1, 5), nb = rand(1, 3);
      const t = pa * na + pb * nb;
      return { kind: 'money', key: 'e' + pa + na + pb + nb, items: [[a[0], a[1], pa * 100, na], [b[0], b[1], pb * 100, nb]], ans: t * 100,
        prompt: `Coco earns ${dollars(pa * 100)} to ${a[1]} and ${dollars(pb * 100)} to ${b[1]}. This week Coco does "${a[1]}" ${na} ${na === 1 ? 'time' : 'times'} and "${b[1]}" ${nb} ${nb === 1 ? 'time' : 'times'}. How much did Coco earn?`,
        expected: dollars(t * 100), steps: [`${na} × ${dollars(pa * 100)} = ${dollars(pa * na * 100)}`, `${nb} × ${dollars(pb * 100)} = ${dollars(pb * nb * 100)}`, `Total: ${dollars(t * 100)}`] };
    }
    if (level === 7) {
      const things = [['🥤', 'juice boxes'], ['🖍️', 'crayons'], ['🍪', 'cookies'], ['🎾', 'tennis balls'], ['✏️', 'pencils']];
      const [ic, name] = pick(things);
      let a, b;
      for (let i = 0; i < 30; i++) {
        a = { n: pick([2, 3, 4, 5, 6]), unit: pick([25, 50, 75, 100]) }; b = { n: pick([4, 6, 8, 10, 12]), unit: pick([25, 50, 75, 100]) };
        if (a.unit !== b.unit && a.n !== b.n) break;
      }
      const pa = a.n * a.unit, pb = b.n * b.unit, best = a.unit < b.unit ? 'A' : 'B';
      return { kind: 'deal', key: 'd' + name + pa + pb, ic, name, a: { ...a, p: pa }, b: { ...b, p: pb }, ans: best,
        prompt: `Which pack of ${name} is the better deal — the one that costs less for each one?`, expected: `Pack ${best}`,
        explain: `Pack A: ${money(pa)} ÷ ${a.n} = ${money(a.unit)} each. Pack B: ${money(pb)} ÷ ${b.n} = ${money(b.unit)} each. Pack ${best} is cheaper per ${name.replace(/e?s$/, '')}.` };
    }
    if (level === 8) {
      if (Math.random() < 0.5) {
        const earn = pick([20, 40, 60, 80, 100]), plan = pick([[50, 'save'], [25, 'share'], [25, 'spend'], [10, 'share'], [20, 'save'], [75, 'save']]);
        const ans = earn * plan[0];
        return { kind: 'money', key: 'bp' + earn + plan.join(), ans, items: [['💵', 'earned', earn * 100, 1]], prompt: `Coco earned ${dollars(earn * 100)}. The budget says ${plan[1]} ${plan[0]}%. How much should Coco ${plan[1]}?`, expected: money(ans),
          steps: [`${plan[0]}% means ${plan[0]} out of every 100.`, `${plan[0]}% of ${dollars(earn * 100)} = ${dollars(ans)}.`] };
      }
      const have = rand(15, 40) * 100, a = rand(10, 60) * 25, b = rand(10, 50) * 25;
      if (a + b >= have) return makeQ(8);
      return { kind: 'money', key: 'bl' + have + a + b, ans: have - a - b, items: [['🧾', 'snack', a, 1], ['🧾', 'movie', b, 1]], have,
        prompt: `Coco has ${dollars(have)}. Coco spends ${money(a)} on a snack and ${money(b)} on a movie. How much is left in the budget?`, expected: money(have - a - b),
        steps: [`Spent: ${money(a)} + ${money(b)} = ${money(a + b)}.`, `Left: ${money(have)} − ${money(a + b)} = ${money(have - a - b)}.`] };
    }
    // growing savings (simple interest)
    const p = pick([100, 200, 50, 400, 1000]), r = pick([2, 5, 10]), yrs = pick([1, 1, 2, 3]);
    const interest = p * r / 100 * yrs;
    const askTotal = Math.random() < 0.5;
    return { kind: 'money', key: 'i' + p + r + yrs + askTotal, ans: (askTotal ? p + interest : interest) * 100, items: [['🏦', 'savings', p * 100, 1]],
      prompt: `Coco puts ${dollars(p * 100)} in a savings account that pays ${r}% interest each year (on the starting amount). ${askTotal ? `How much is in the account after ${yrs} ${yrs === 1 ? 'year' : 'years'}?` : `How much interest does Coco earn in ${yrs} ${yrs === 1 ? 'year' : 'years'}?`}`,
      expected: money((askTotal ? p + interest : interest) * 100),
      steps: [`${r}% of ${dollars(p * 100)} = ${money(p * r)} each year.`, `${yrs} ${yrs === 1 ? 'year' : 'years'} × ${money(p * r)} = ${money(interest * 100)} interest.`, askTotal ? `${dollars(p * 100)} + ${money(interest * 100)} = ${money((p + interest) * 100)}.` : ''] };
  }

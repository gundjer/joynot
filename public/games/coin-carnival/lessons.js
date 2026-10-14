// Penny's Coin Carnival — lessons. Concrete → picture → number: real-looking coins first, then values, then counting.
import { moneyPiece } from '../_joy/js/money.js';
import { eq, note, stack } from '../_joy/js/lesson.js';

const coin = (k, v = true) => moneyPiece(k, { showValue: v }).outerHTML;
const row = (...k) => `<div class="row-items">${k.join('')}</div>`;

export const LESSONS = {
  1: [
    { title: 'Meet the coins', text: 'In the United States we use four main coins: the PENNY, the NICKEL, the DIME and the QUARTER.', art: row(coin('penny', false), coin('nickel', false), coin('dime', false), coin('quarter', false)) },
    { title: 'How to tell them apart', text: 'The penny is the only brown (copper) coin. The dime is the smallest silver coin. The quarter is the biggest. The nickel is medium and smooth.', art: row(coin('penny', false), coin('dime', false), coin('nickel', false), coin('quarter', false)) },
  ],
  2: [
    { title: 'What each coin is worth', text: 'Each coin is worth some CENTS. Penny = 1 cent. Nickel = 5 cents. Dime = 10 cents. Quarter = 25 cents. We write cents with ¢.', art: row(coin('penny'), coin('nickel'), coin('dime'), coin('quarter')) },
    { title: 'Bigger is not always more!', text: 'The dime is smaller than a nickel, but it is worth MORE: 10¢ instead of 5¢. Remember the value, not the size.', art: row(coin('dime'), '<span class="eq">&gt;</span>', coin('nickel')) },
  ],
  3: [
    { title: 'Count pennies by 1s', text: 'Each penny is 1¢. Count them one at a time: 1, 2, 3…', art: row(coin('penny'), coin('penny'), coin('penny'), '<span class="eq">= 3¢</span>') },
    { title: 'Nickels count by 5s', text: 'Each nickel is 5¢. Count by fives: 5, 10, 15. Start with the nickels, then count on the pennies: 5, 10, 11, 12.', art: row(coin('nickel'), coin('nickel'), coin('penny'), coin('penny'), '<span class="eq">= 12¢</span>') },
  ],
  4: [
    { title: 'Dimes count by 10s', text: 'Each dime is 10¢. Count the biggest coins first: 10, 20, then nickels 25, then pennies 26, 27.', art: row(coin('dime'), coin('dime'), coin('nickel'), coin('penny'), coin('penny'), '<span class="eq">= 27¢</span>') },
  ],
  5: [
    { title: 'Quarters count by 25s', text: 'Each quarter is 25¢. 25, 50, 75, 100. Four quarters make 100¢ — that is one whole dollar!', art: row(coin('quarter'), coin('quarter'), coin('quarter'), coin('quarter'), '<span class="eq">= $1.00</span>') },
    { title: 'Make an amount', text: 'To make 41¢: start with the biggest coin that fits (a quarter, 25¢). Then a dime (35¢), a nickel (40¢), and a penny (41¢).', art: row(coin('quarter'), coin('dime'), coin('nickel'), coin('penny'), '<span class="eq">= 41¢</span>') },
  ],
  6: [
    { title: 'Sort, then count', text: 'When coins are all mixed up, first sort them from biggest value to smallest. Then count on: quarters, dimes, nickels, pennies.', art: stack(note('🌀 messy pile → 📶 sort big to small → 🔢 count on'), eq('25, 35, 45, 50, 51')) },
  ],
  7: [
    { title: 'The fewest coins', text: 'To use the FEWEST coins, always grab the biggest coin that still fits. 30¢ is a quarter and a nickel — 2 coins, not 30 pennies!', art: row(coin('quarter'), coin('nickel'), '<span class="eq">= 30¢</span>') },
  ],
  8: [
    { title: 'Dollars and cents', text: 'A dollar bill is worth 100¢. We write $1.00. The number before the dot is dollars. After the dot are cents. $2.35 = 2 dollars and 35 cents.', art: row(moneyPiece('one').outerHTML, moneyPiece('one').outerHTML, coin('quarter'), coin('dime'), '<span class="eq">= $2.35</span>') },
  ],
};

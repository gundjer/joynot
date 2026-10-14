// Lemonade Lane — lessons. Real-world money math, from counting to profit and percent.
import { eq, note, stack, pics } from '../_joy/js/lesson.js';

export const LESSONS = {
  1: [
    { title: 'Count the cups', text: 'If each cup costs 1¢, count the cups to find the cost. 4 cups = 4¢. If each cup costs 2¢, count by twos: 2, 4, 6, 8.', art: stack(pics([['🥤'], ['🥤'], ['🥤'], ['🥤']]), eq('2, 4, 6, 8 → 8¢')) },
  ],
  2: [
    { title: 'Adding prices', text: 'The TOTAL is all the prices added together. A lemonade for 8¢ and a cookie for 5¢: 8 + 5 = 13¢. Start with the bigger number and count on.', art: eq('8¢ + 5¢ = 13¢') },
  ],
  3: [
    { title: 'Whole dollars', text: 'Adding dollars is just like adding numbers. $3 + $4 + $2 = $9.', art: eq('$3 + $4 + $2 = $9') },
  ],
  4: [
    { title: 'Line up the dot', text: 'With dollars and cents, add the cents, then the dollars. $1.25 + $0.50: 25¢ + 50¢ = 75¢, and 1 dollar → $1.75.', art: `<div class="note" style="font-family:monospace;font-size:24px;text-align:right">  $1.25<br>+ $0.50<br>———<br>  $1.75</div>` },
    { title: 'When cents go over 100', text: '$0.75 + $0.50 = 125¢. 100¢ is a whole dollar, so it is $1.25.', art: eq('75¢ + 50¢ = 125¢ = $1.25') },
  ],
  5: [
    { title: 'Is there enough?', text: 'Add up everything you need. Then compare with the money you have. If the total is the same or less, you have enough!', art: stack(eq('$2.75 + $1.50 = $4.25'), note('You have $5 → yes! $0.75 left over')) },
  ],
  6: [
    { title: 'How many can I buy?', text: 'Divide your money by the price. $12 ÷ $3 = 4 bags. If there is money left over, it is not enough for another one.', art: stack(eq('$12 ÷ $3 = 4'), eq('$14 ÷ $3 = 4, $2 left')) },
  ],
  7: [
    { title: 'Profit', text: 'Money you get from selling is called REVENUE. Money you spend on supplies is COST. PROFIT = revenue − cost. Real businesses use this every day!', art: stack(eq('8 cups × $0.50 = $4.00'), eq('$4.00 − $2.50 = $1.50 profit')) },
  ],
  8: [
    { title: 'Big orders', text: 'For several of the same item, MULTIPLY. 3 lemonades at $1.25 = 3 × $1.25 = $3.75. Do each item, then add them up.', art: eq('3 × $1.25 = $3.75') },
  ],
  9: [
    { title: 'Percent off', text: 'PERCENT means "out of 100." 50% is half. 25% is one quarter. 10% is one tenth — move the decimal one place left: 10% of $4.00 is $0.40.', art: stack(eq('50% of $4 = $2'), eq('25% of $4 = $1'), eq('10% of $4 = $0.40')) },
    { title: 'Sale price', text: 'Sale price = original price − the discount. $4.00 − 25% ($1.00) = $3.00.', art: eq('$4.00 − $1.00 = $3.00') },
  ],
};

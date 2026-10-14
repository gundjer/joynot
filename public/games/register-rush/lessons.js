// Register Rush — lessons. Strategy taught: pay with the biggest money first; make change by COUNTING UP like a cashier.
import { moneyPiece } from '../_joy/js/money.js';
import { eq, note, stack, pics } from '../_joy/js/lesson.js';
const m = k => moneyPiece(k, { label: false }).outerHTML;
const row = (...k) => `<div class="row-items">${k.join('')}</div>`;

export const LESSONS = {
  1: [
    { title: 'Paying for things', text: 'When you buy something, you give the cashier money that equals the price. A $3 toy needs three $1 bills.', art: row('<span class="big">🧸</span>', '<span class="price-tag">$3</span>', m('one'), m('one'), m('one')) },
  ],
  2: [
    { title: 'A $5 bill = five $1 bills', text: 'One $5 bill is worth the same as five $1 bills. For $7, use one $5 and two $1 bills — fewer bills to carry!', art: row(m('five'), m('one'), m('one'), '<span class="eq">= $7</span>') },
  ],
  3: [
    { title: 'Bills and coins together', text: 'For $1.35: one $1 bill for the dollar, then coins for the 35 cents — a quarter and a dime.', art: row(m('one'), m('quarter'), m('dime'), '<span class="eq">= $1.35</span>') },
  ],
  4: [
    { title: 'What is change?', text: 'If you pay MORE than the price, the cashier gives some money back. That money is called CHANGE.', art: pics([['💵', 'You pay $1.00'], ['🍪', 'Cookie costs 65¢'], ['💰', 'Change back: 35¢']]) },
    { title: 'Count up!', text: 'Cashiers COUNT UP from the price to what you paid. 65¢ … +10 = 75¢ … +25 = $1.00. So the change is 10¢ + 25¢ = 35¢.', art: eq('65¢ → 75¢ → $1.00') },
  ],
  5: [
    { title: 'Count up to the next dollar', text: 'Price $3.40, paid $5. First coins up to a whole dollar: $3.40 + 10¢ = $3.50, + 50¢ (two quarters) = $4.00. Then bills: + $1 = $5.00.', art: eq('$3.40 → $3.50 → $4.00 → $5.00') },
    { title: 'Add up what you counted', text: '10¢ + 50¢ + $1 = $1.60 change. Counting up means you never have to subtract in your head!', art: eq('Change = $1.60') },
  ],
  6: [
    { title: 'Bigger bills', text: 'Paid with $20 for something that costs $12.75: coins to $13.00 (+25¢), $1 bills to $15 (+$2), then a $5 to $20. Change: $7.25.', art: eq('$12.75 → $13 → $15 → $20') },
  ],
  7: [
    { title: 'Two items: add first', text: 'With two things, first ADD the prices to get the total. $2.50 + $3.25 = $5.75. Then count up from the total to what they paid.', art: eq('$2.50 + $3.25 = $5.75') },
  ],
  8: [
    { title: 'Sales tax', text: 'Many states add a SALES TAX. 10% tax means 10 cents for every dollar. $4.00 + 10% = $4.00 + $0.40 = $4.40.', art: eq('10% of $4.00 = $0.40') },
    { title: 'Discounts', text: 'A DISCOUNT takes money off. 25% off means one quarter off. 25% of $8 = $2, so you pay $6.', art: eq('$8 − 25% = $8 − $2 = $6') },
  ],
};

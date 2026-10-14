// Coco's Budget Island — lessons. Life skills: needs vs wants, saving, budgeting, interest.
import { eq, note, stack, pics } from '../_joy/js/lesson.js';

export const LESSONS = {
  1: [
    { title: 'Needs and wants', text: 'A NEED is something you must have to live and be healthy and safe — food, water, a home, clothes. A WANT is something nice to have, like toys and treats.', art: stack(pics([['🍎', 'need'], ['💧', 'need'], ['🏠', 'need']]), pics([['🎮', 'want'], ['🍭', 'want'], ['🧸', 'want']])) },
    { title: 'Needs come first', text: 'Smart money plans pay for needs FIRST. Then, if there is money left, you can choose a want.', art: note('1️⃣ Needs → 2️⃣ Save → 3️⃣ Wants') },
  ],
  2: [
    { title: 'Can I buy it?', text: 'You can buy something if its price is the SAME as or LESS than the money you have. $5 can buy a $4 ball, but not a $7 kite.', art: stack(eq('$4 ≤ $5 ✔'), eq('$7 > $5 ✖')) },
  ],
  3: [
    { title: 'What is left?', text: 'After you buy something, subtract the price from your money. $10 − $4 = $6 left.', art: eq('$10 − $4 = $6') },
  ],
  4: [
    { title: 'Saving goals', text: 'A SAVING GOAL is something you save up for. If a bike costs $40 and you save $5 every week, it takes 40 ÷ 5 = 8 weeks.', art: stack(pics([['🚲', '$40 goal']]), eq('$40 ÷ $5 a week = 8 weeks')) },
  ],
  5: [
    { title: 'Save, Spend, Share', text: 'Many families use three jars: SAVE for later, SPEND for now, and SHARE to help others.', art: pics([['🐷', 'Save'], ['🛍️', 'Spend'], ['💝', 'Share']]) },
    { title: 'Follow the rule', text: 'Read the rule carefully. "Half in Save" means divide by 2. Put the exact amounts first, then the rest goes in the last jar.', art: eq('$10: Save $5, Share $1, Spend $4') },
  ],
  6: [
    { title: 'Earning money', text: 'People EARN money by working. If walking a dog pays $3 and you walk it 4 times, you earn 4 × $3 = $12.', art: eq('4 × $3 = $12') },
  ],
  7: [
    { title: 'Unit price', text: 'To find the better deal, find the price of ONE. Pack A: 4 for $2 → $2 ÷ 4 = 50¢ each. Pack B: 6 for $4 → about 67¢ each. Pack A is the better deal.', art: stack(eq('$2 ÷ 4 = $0.50 each'), eq('$4 ÷ 6 ≈ $0.67 each')) },
  ],
  8: [
    { title: 'Budgets and percents', text: 'A BUDGET is a plan for your money. A common plan: save 50%, spend 30%, share 20%. 50% of $40 = $20.', art: eq('50% of $40 = $20') },
  ],
  9: [
    { title: 'Interest', text: 'Banks pay you INTEREST for keeping money in a savings account. 5% interest on $100 is $5 a year. After 2 years of simple interest, that is $10.', art: stack(eq('5% of $100 = $5 per year'), eq('2 years → $10 interest → $110')) },
    { title: 'Why save early?', text: 'The longer money stays saved, the more interest it earns. That is why grown-ups say: start saving early!', art: pics([['🌱', 'year 1'], ['🌿', 'year 5'], ['🌳', 'year 20']]) },
  ],
};

// Beat the Bus — lessons (watch me first). Strategy taught: "count on" with a time line (jump to the next hour, then add the rest).
import { clockDemo, clockSweep, pics, eq, note, stack } from '../_joy/js/lesson.js';

const line = (a, b, jumps) => `<svg class="diagram" viewBox="0 0 520 120"><line x1="30" y1="80" x2="490" y2="80" stroke="#2b2350" stroke-width="4" stroke-linecap="round"/>${jumps.map(([x1, x2, lab]) => `<path d="M${x1} 76 Q${(x1 + x2) / 2} ${76 - Math.min(60, (x2 - x1) / 2.5)} ${x2} 76" fill="none" stroke="#f2a20c" stroke-width="4"/><text x="${(x1 + x2) / 2}" y="${76 - Math.min(60, (x2 - x1) / 2.5) / 1.5}" text-anchor="middle" font-size="18" font-weight="700" fill="#a86e00">${lab}</text>`).join('')}${[a, b].map(([x, t]) => `<line x1="${x}" y1="70" x2="${x}" y2="90" stroke="#2b2350" stroke-width="4"/><text x="${x}" y="112" text-anchor="middle" font-size="18" font-weight="700" fill="#2b2350">${t}</text>`).join('')}</svg>`;

export const LESSONS = {
  1: [
    { title: 'What is elapsed time?', text: 'ELAPSED time is how much time goes by. If you start playing at 3:00 and stop at 4:00, one hour went by.', art: clockSweep(180, 240, { caption: '3:00 → 4:00 = 1 hour went by' }) },
    { title: 'One hour later', text: 'One hour later, the short HOUR hand moves to the next number, and the minutes stay the same. 3:00 + 1 hour = 4:00. 5:30 + 1 hour = 6:30.', art: stack(eq('3:00 + 1 hour = 4:00'), eq('5:30 + 1 hour = 6:30')) },
    { title: 'More hours', text: 'For 2 hours later, count 2 hours on your fingers: 4:00 … 5:00, 6:00. So 4:00 + 2 hours = 6:00.', art: pics([['☝️', '5:00'], ['✌️', '6:00']]) },
  ],
  2: [
    { title: 'Half an hour', text: 'Half an hour is 30 minutes — the long minute hand goes halfway around the clock.', art: clockDemo([{ min: 120, caption: '2:00' }, { min: 150, glow: 'minute', caption: '30 minutes later → 2:30' }], { ms: 2200 }) },
    { title: 'Past the hour', text: 'If it is already :30, another half hour makes a NEW hour. 2:30 + 30 minutes = 3:00.', art: eq('2:30 + 30 min = 3:00') },
  ],
  3: [
    { title: 'Minutes later', text: 'When you add minutes and you do NOT pass the hour, just add the minutes. 2:15 + 25 minutes → 15 + 25 = 40 → 2:40.', art: eq('2:15 + 25 min = 2:40') },
    { title: 'Use a time line', text: 'A time line is like a number line for time. Start at the left, jump forward by the minutes, and land on the answer.', art: line([40, '2:15'], [480, '2:40'], [[40, 480, '+25 min']]) },
  ],
  4: [
    { title: 'Jump to the next hour', text: 'When the minutes go past 60, jump to the next o’clock first. 2:45 + 30 minutes: 2:45 → 3:00 is 15 minutes. 15 more is left.', art: line([40, '2:45'], [480, '?'], [[40, 200, '+15'], [200, 480, '+15']]) },
    { title: 'Then add the rest', text: '3:00 + the 15 minutes that are left = 3:15. So 2:45 + 30 minutes = 3:15.', art: eq('2:45 → 3:00 (+15) → 3:15 (+15)') },
  ],
  5: [
    { title: 'How long did it take?', text: 'To find how long, count UP from the start time to the end time. Add up all the jumps.', art: line([40, '1:40'], [480, '2:25'], [[40, 200, '+20'], [200, 480, '+25']]) },
    { title: 'Add the jumps', text: '1:40 to 2:00 is 20 minutes. 2:00 to 2:25 is 25 minutes. 20 + 25 = 45 minutes.', art: eq('20 + 25 = 45 minutes') },
  ],
  6: [
    { title: 'Go backward', text: 'If you know when something ENDED and how long it took, count BACKWARD to find when it started.', art: line([40, '?'], [480, '4:10'], [[40, 260, '−1 h'], [260, 480, '−10']]) },
    { title: 'Example', text: 'A movie ended at 4:10 and lasted 1 hour 10 minutes. 4:10 − 1 hour = 3:10. 3:10 − 10 minutes = 3:00. It started at 3:00.', art: eq('4:10 − 1 h − 10 min = 3:00') },
  ],
  7: [
    { title: 'Crossing noon', text: 'When the time goes past 12 noon, AM changes to PM. 11:30 AM + 1 hour = 12:30 PM. 12:30 PM + 1 hour = 1:30 PM.', art: pics([['🌅', '11:30 AM'], ['☀️', '12:30 PM'], ['🌆', '1:30 PM']]) },
  ],
  8: [
    { title: 'Many steps', text: 'Real schedules have many parts. Write each part as a jump, add the jumps, and then compare. Bus 25 min + walk 10 min = 35 minutes total.', art: eq('25 + 10 = 35 minutes') },
    { title: 'Early or late?', text: 'If you leave at 7:45 and travel 35 minutes, you arrive at 8:20. If school starts at 8:30, you are 10 minutes early!', art: line([40, '7:45'], [480, '8:30'], [[40, 180, '+15'], [180, 400, '+20'], [400, 480, '10 early']]) },
  ],
};

// Clock Dash — lessons (I do): short picture lessons before each new level.
const svgClock = (m, label = '') => {
  const hA = ((m / 60) % 12) / 12 * 360, mA = (m % 60) / 60 * 360;
  const nums = Array.from({ length: 12 }, (_, i) => { const a = (i + 1) / 12 * Math.PI * 2; return `<text x="${60 + Math.sin(a) * 40}" y="${64 + -Math.cos(a) * 40}" font-size="12" text-anchor="middle" font-weight="700" fill="#2b2350">${i + 1}</text>`; }).join('');
  return `<svg viewBox="0 0 120 ${label ? 142 : 122}" width="150"><circle cx="60" cy="60" r="54" fill="#fff" stroke="#2b2350" stroke-width="5"/>${nums}<line x1="60" y1="60" x2="60" y2="30" stroke="#e5484d" stroke-width="7" stroke-linecap="round" transform="rotate(${hA} 60 60)"/><line x1="60" y1="60" x2="60" y2="16" stroke="#2f7de1" stroke-width="4.5" stroke-linecap="round" transform="rotate(${mA} 60 60)"/><circle cx="60" cy="60" r="4" fill="#2b2350"/>${label ? `<text x="60" y="138" text-anchor="middle" font-size="16" font-weight="800" fill="#2b2350">${label}</text>` : ''}</svg>`;
};

export const LESSONS = {
  1: [{ title: 'Two hands on a clock', text: 'A clock has a SHORT red hand and a LONG blue hand. The short hand is the HOUR hand. The long hand is the MINUTE hand.', art: svgClock(180, '3:00') }, { title: 'O’clock', text: 'When the long minute hand points straight up at 12, it is o’clock. Read the short hand: it points at 3, so it’s 3 o’clock!', art: svgClock(180, '3 o’clock') + svgClock(480, '8 o’clock') }, { title: 'How to race', text: 'When the narrator calls a time, steer into the lane with that clock before the gate. The sooner you get there, the bigger your boost!', art: '🏎️💨' }],
  2: [{ title: 'Half past', text: 'Half past means 30 minutes after the hour. The long hand points DOWN at the 6. The short hand is halfway between two numbers.', art: svgClock(270, '4:30') }],
  3: [{ title: 'Quarter past and quarter to', text: 'Quarter past: the long hand points at 3 (15 minutes). Quarter to: the long hand points at 9: 15 minutes BEFORE the next hour.', art: svgClock(435, 'quarter past 7') + svgClock(525, 'quarter to 9') }],
  4: [{ title: 'Count by 5s', text: 'Each number on the clock is 5 minutes for the long hand: 1 = 5, 2 = 10, 3 = 15, all the way to 12 = 60.', art: svgClock(385, '6:25') }],
  5: [{ title: 'Time words', text: 'Before the long hand reaches 6, say “past”: 2:20 is twenty past two. After 6, say “to” the next hour: 2:40 is twenty to three.', art: svgClock(140, 'twenty past two') + svgClock(160, 'twenty to three') }],
  6: [{ title: 'To the minute', text: 'Count by 5s to the last number the long hand passed, then count the small marks one by one. 4:37 = 35 + 2.', art: svgClock(277, '4:37') }],
  7: [{ title: '24-hour time', text: '24-hour clocks never use AM or PM. Midnight is 00:00. After 12 noon, add 12 to the hour: 3:00 PM = 15:00, 9:30 PM = 21:30.', art: '🕒 3:00 PM = 15:00' }],
  8: [{ title: 'Time units', text: '60 seconds = 1 minute. 60 minutes = 1 hour. 24 hours = 1 day. 7 days = 1 week. Multiply to go to the smaller unit, divide to go to the bigger one.', art: '⏱️ ➜ 🕐 ➜ 📅' }],
};

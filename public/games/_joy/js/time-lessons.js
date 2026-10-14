// Shared time-telling lessons (Tick-Tock Clock Shop + Clock Dash).
import { makeClock } from './clock.js';
import { clockDemo, clockSweep, pics, stack, eq } from './lesson.js';
import { el } from './util.js';

export const legend = '<div class="note"><b style="color:#e5484d">Short red hand = HOUR hand</b><br><b style="color:#2b7de9">Long blue hand = MINUTE hand</b></div>';

export const TIME_LESSONS = {
  1: [
    { title: 'Meet the clock!', text: 'A clock tells us the TIME. Time tells us when to wake up, eat, go to school and go to bed.', art: stack(pics([['🌅', 'wake up'], ['🍎', 'lunch'], ['🛏️', 'bedtime']]), '<div class="big">🕒</div>') },
    { title: 'The numbers', text: 'A clock has the numbers 1 to 12 in a circle. 12 is at the very top. They go around the same way the hands move — we call that clockwise.', art: clockDemo([{ min: 0, nums: [12], caption: '12 is at the top' }, { min: 0, nums: [3], caption: '3 is on the right side' }, { min: 0, nums: [6], caption: '6 is at the bottom' }, { min: 0, nums: [9], caption: '9 is on the left side' }], { ms: 1500 }) },
    { title: 'Two hands', text: 'A clock has two pointers called HANDS. The SHORT red hand is the HOUR hand. The LONG blue hand is the MINUTE hand.', art: box => { const f = clockDemo([{ min: 180, glow: 'hour', nums: [3], caption: 'Short red hand = HOUR hand' }, { min: 180, glow: 'minute', nums2: [12], caption: 'Long blue hand = MINUTE hand' }], { ms: 2200 })(box); return f; } },
    { title: 'O’clock', text: 'When the long minute hand points straight UP at 12, it is an o’clock time. Then just read the short hand: it points at 3, so it is 3 o’clock.', art: clockDemo([{ min: 180, glow: 'hour', nums: [3], nums2: [12], caption: 'Short hand on 3, long hand on 12 → <b>3 o’clock (3:00)</b>' }, { min: 420, glow: 'hour', nums: [7], nums2: [12], caption: 'Short hand on 7, long hand on 12 → <b>7 o’clock (7:00)</b>' }, { min: 600, glow: 'hour', nums: [10], nums2: [12], caption: 'Short hand on 10 → <b>10 o’clock (10:00)</b>' }], { ms: 2600 }) },
    { title: 'How to set a clock', text: 'Look at the ticket. 5:00 means 5 o’clock. Drag the short red hand to the 5. The long hand stays on 12. Then tap Check!', art: clockDemo([{ min: 120, glow: 'hour', caption: 'Ticket says <b>5:00</b>. Drag the short hand…' }, { min: 240, glow: 'hour', caption: '…around…' }, { min: 300, glow: 'hour', nums: [5], caption: '…to the 5! Now it says 5 o’clock ✔' }], { ms: 1500 }) },
  ],
  2: [
    { title: 'The minute hand goes all the way around', text: 'The long minute hand takes 60 minutes — one whole hour — to go all the way around. Watch the short hand slowly move to the next number too!', art: clockSweep(180, 240, { caption: 'From 3:00 to 4:00 = 60 minutes = 1 hour' }) },
    { title: 'Half past', text: 'When the minute hand goes HALFWAY around and points at 6, 30 minutes have passed. We call that HALF PAST.', art: clockDemo([{ min: 180, nums2: [12], caption: '3:00 — start' }, { min: 210, nums2: [6], glow: 'minute', caption: 'Halfway around → 30 minutes → <b>3:30, half past 3</b>' }], { ms: 2400 }) },
    { title: 'Where is the hour hand?', text: 'At half past, the short hand is HALFWAY between two numbers. Always use the number it just went past. Between 3 and 4 means 3.', art: clockDemo([{ min: 210, glow: 'hour', nums: [3, 4], caption: 'Between 3 and 4 → the hour is <b>3</b> → 3:30' }, { min: 570, glow: 'hour', nums: [9, 10], caption: 'Between 9 and 10 → <b>9:30</b>' }], { ms: 2600 }) },
  ],
  3: [
    { title: 'Cut the clock into 4 parts', text: 'Think of the clock like a pizza cut into 4 slices. Each slice is a QUARTER of an hour — 15 minutes.', art: clockDemo([{ min: 0, nums2: [3], caption: 'Minute hand on 3 → 15 minutes → <b>quarter past</b>' }, { min: 30, nums2: [6], caption: 'On 6 → 30 minutes → <b>half past</b>' }, { min: 45, nums2: [9], caption: 'On 9 → 45 minutes → <b>quarter to</b> the next hour' }], { ms: 2600 }) },
    { title: 'Quarter past and quarter to', text: '2:15 is QUARTER PAST 2. 2:45 is QUARTER TO 3, because there are only 15 minutes left until 3 o’clock.', art: clockDemo([{ min: 135, glow: 'minute', nums2: [3], caption: '<b>2:15</b> — quarter past 2' }, { min: 165, glow: 'minute', nums2: [9], caption: '<b>2:45</b> — quarter to 3' }], { ms: 2600 }) },
  ],
  4: [
    { title: 'Count by 5s', text: 'For the MINUTE hand, every number means 5 more minutes. Count by fives around the clock: 5, 10, 15, 20…', art: box => { const c = makeClock({ minutes: 0, colorHands: true, minuteLabels: true }); const cap = el('div', { class: 'note' }); box.append(el('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' } }, [c.el, cap])); let n = 0; const id = setInterval(() => { n = n % 12 + 1; c.set(n * 5); c.highlight([n], 'hl2'); cap.innerHTML = `Points at ${n} → ${n} × 5 = <b>${n * 5} minutes</b>`; }, 1100); return () => clearInterval(id); } },
    { title: 'Read it in 2 steps', text: 'Step 1: the short hand is past 8 → the hour is 8. Step 2: the long hand is on 5 → 5 × 5 = 25 minutes. So it is 8:25!', art: clockDemo([{ min: 505, glow: 'hour', nums: [8], caption: 'Step 1: HOUR = 8' }, { min: 505, glow: 'minute', nums2: [5], caption: 'Step 2: count 5, 10, 15, 20, 25 → <b>8:25</b>' }], { ms: 2600, minuteLabels: true }) },
  ],
  5: [
    { title: 'Time words', text: 'People say times with words, too. "PAST" means minutes after the hour. "TO" means minutes before the NEXT hour.', art: '<div class="note" style="text-align:left;line-height:1.7">4:00 = <b>4 o’clock</b><br>4:10 = <b>10 past 4</b><br>4:15 = <b>quarter past 4</b><br>4:30 = <b>half past 4</b><br>4:45 = <b>quarter to 5</b><br>4:50 = <b>10 to 5</b></div>' },
    { title: '"To" counts backward', text: '"20 to 6" means 20 minutes BEFORE 6:00. 60 − 20 = 40, so it is 5:40.', art: clockDemo([{ min: 360, nums: [6], caption: '6:00' }, { min: 340, glow: 'minute', nums2: [8], caption: '20 minutes before 6 → <b>5:40</b>' }], { ms: 2400 }) },
  ],
  6: [
    { title: 'The little marks are minutes', text: 'Between every two numbers there are 4 little tick marks. Each little mark is 1 minute.', art: clockDemo([{ min: 240, nums2: [12], caption: 'Each little tick = 1 minute' }, { min: 241, caption: '4:01' }, { min: 242, caption: '4:02' }, { min: 243, caption: '4:03' }], { ms: 1200 }) },
    { title: 'Count by 5s, then by 1s', text: 'For 4:37: count by 5s to 35 (the 7), then count 2 little marks more: 36, 37.', art: clockDemo([{ min: 275, glow: 'minute', nums2: [7], caption: '5, 10, 15 … 35' }, { min: 277, glow: 'minute', caption: '…36, 37 → <b>4:37</b>' }], { ms: 2400 }) },
  ],
  7: [
    { title: 'Two of every time', text: 'The hour hand goes around TWICE every day. 7:00 happens in the morning AND at night! AM and PM tell us which one.', art: pics([['🌅', '7:00 AM — breakfast'], ['🌙', '7:00 PM — bath time']]) },
    { title: 'AM and PM', text: 'AM is from midnight to noon (the morning). PM is from noon to midnight (afternoon and night). 12 noon is lunchtime.', art: '<div class="note" style="line-height:1.8">🌙 12 midnight → 🌅 morning = <b>AM</b><br>☀️ 12 noon → 🌆 afternoon → 🌙 night = <b>PM</b></div>' },
  ],
  8: [
    { title: '24-hour time', text: 'Trains, airplanes, hospitals and the military count the hours from 0 to 23, so there is no AM or PM.', art: '<div class="note" style="line-height:1.8">00:00 = 12 midnight<br>09:00 = 9 AM<br>12:00 = 12 noon<br><b>13:00 = 1 PM</b><br>18:30 = 6:30 PM</div>' },
    { title: 'Take away 12', text: 'If the hour is 13 or more, subtract 12 and it is PM. 15:45 → 15 − 12 = 3 → 3:45 PM.', art: eq('15:45 → 15 − 12 = 3 → 3:45 PM') },
  ],
};


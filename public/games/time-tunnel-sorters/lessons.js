// Time Tunnel Sorters — lessons. Sequencing → then vs now → timelines → years and centuries.
import { eq, note, stack, pics } from '../_joy/js/lesson.js';

export const LESSONS = {
  1: [
    { title: 'First, next, last', text: 'Things happen in an ORDER. FIRST you plant a seed, NEXT it sprouts, LAST a flower grows. Ordering helps us tell stories and follow steps.', art: pics([['🌰', 'first'], ['🌱', 'next'], ['🌻', 'last']]) },
  ],
  2: [
    { title: 'Long ago and today', text: 'LONG AGO people did things differently. Before electric lights, people used candles. Before cars, people rode horses.', art: stack(pics([['🕯️', 'long ago'], ['💡', 'today']]), pics([['🐎', 'long ago'], ['🚗', 'today']])) },
  ],
  3: [
    { title: 'Growing and changing', text: 'People, plants and animals change as they grow. A baby grows into a child, then a grown-up, then an older adult.', art: pics([['👶', 'baby'], ['🧒', 'child'], ['🧑', 'grown-up'], ['🧓', 'older']]) },
  ],
  4: [
    { title: 'Inventions', text: 'An INVENTION is something new that people create. Many inventions build on older ones: the car came after the wheel and the engine.', art: pics([['🚲', 'bicycle'], ['🚗', 'car'], ['✈️', 'airplane']]) },
  ],
  5: [
    { title: 'Timelines', text: 'A TIMELINE puts events in order from oldest (left) to newest (right). Years with smaller numbers happened earlier.', art: `<svg class="diagram" viewBox="0 0 520 110"><line x1="20" y1="60" x2="500" y2="60" stroke="#7b4fd6" stroke-width="5"/>${[['1876', '☎️', 60], ['1903', '✈️', 200], ['1969', '🌙', 340], ['2007', '📱', 470]].map(([y, e, x]) => `<text x="${x}" y="42" font-size="30" text-anchor="middle">${e}</text><circle cx="${x}" cy="60" r="7" fill="#7b4fd6"/><text x="${x}" y="92" font-size="18" font-weight="700" text-anchor="middle" fill="#2b2350">${y}</text>`).join('')}</svg>` },
  ],
  6: [
    { title: 'Big moments in history', text: 'History is the story of people. 1492: Columbus sailed. 1776: the Declaration of Independence. 1969: people walked on the Moon.', art: pics([['⛵', '1492'], ['📜', '1776'], ['🌙', '1969']]) },
  ],
  7: [
    { title: 'Which came first?', text: 'Compare the years. The SMALLER year came first. 1620 comes before 1776. BC years count backward — 2560 BC is older than 776 BC.', art: stack(eq('1620 < 1776'), note('BC = before year 1 (very long ago)')) },
  ],
  8: [
    { title: 'Centuries', text: 'A CENTURY is 100 years. The years 1701–1800 are the 18th century — one more than the first two digits (17 + 1). So 1776 is in the 18th century!', art: stack(eq('1776 → 17 + 1 = 18th century'), eq('1969 → 19 + 1 = 20th century')) },
  ],
  9: [
    { title: 'Cause and effect in history', text: 'Historians ask WHY things happened. The printing press (1440) made books cheap, so more people learned to read. Every invention changes what comes next.', art: pics([['📖', 'printing press'], ['➡️', ''], ['🧒', 'more readers']]) },
  ],
};

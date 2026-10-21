// Local, transparent writing checks: structure and required story words, not AI grading.
export const REALMS = [
  { name: 'Rune Smithy', tag: 'FORGE YOUR FIRST MAGIC', story: 'Oakhaven’s gate is tangled in sleeping vines. Forge runes to wake its ancient lock.', reward: 'Rune-forged shield', color: '#edac57' },
  { name: 'Whispering Forest', tag: 'YOUR WORDS CHANGE THE WORLD', story: 'A river blocks the path. Describe a daring rescue and let your spell build the way across.', reward: 'Moonwing companion', color: '#70d5b5' },
  { name: 'Citadel of Legends', tag: 'BEFRIEND THE LEGEND', story: 'Pyra guards the Ember Crown. She needs a friend, not a fight. Write a scroll that invites her into your story.', reward: 'The Ember Crown', color: '#b8a3f4' },
];
export const CARDS = [
  { noun: 'dragon', verb: 'flew', tiles: ['the', 'over'], hint: 'Describe how your dragon helps everyone cross the river.', outcome: 'Your dragon spreads her wings. A bridge of warm light unfurls across the river!' },
  { noun: 'cheese', verb: 'bounced', tiles: ['into', 'the'], hint: 'Distract the goblins with an unexpected snack.', outcome: 'The cheese bounces into the soup! The giggling goblins leave a trail of mana gems.' },
  { noun: 'fox', verb: 'carried', tiles: ['the', 'across'], hint: 'Tell how the fox carries something precious to safety.', outcome: 'Your fox bounds across the stepping stones. Moonwing joins your party!' },
];
export const words = s => String(s).toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];
export function checkSentence(text, card) {
  const w = words(text), missing = [card.noun, card.verb, ...card.tiles].filter(x => !w.includes(x));
  if (missing.length) return { ok: false, message: `The spell needs these runes: ${missing.join(', ')}. Keep your idea and weave them in.` };
  if (w.length < 6) return { ok: false, message: 'Add a little more magic: where does it happen, or what is your hero like? Try six words or more.' };
  return { ok: true, bonus: /^[A-Z]/.test(text.trim()) && /[.!?]$/.test(text.trim()) ? 5 : 0 };
}
export function checkParagraph(lines) {
  if (lines.length !== 4 || lines.some(s => words(s).length < 4)) return { ok: false, message: 'Your castle needs all four stones. Give each scroll line a complete idea of at least four words.' };
  if (lines.some(s => !/^[A-Z]/.test(s.trim()) || !/[.!?]$/.test(s.trim()))) return { ok: false, message: 'Light each stone with a capital at the start and a period, question mark, or exclamation mark at the end.' };
  if (!words(lines.join(' ')).some(w => ['dragon', 'pyra', 'crown'].includes(w))) return { ok: false, message: 'Invite Pyra into your story: mention Pyra, the dragon, or the crown.' };
  if (!/\b(first|next|also|because|then)\b/i.test(lines.slice(1, 3).join(' '))) return { ok: false, message: 'Link your two details with First, Next, Also, Then, or Because.' };
  if (new Set(lines.map(s => words(s).join(' '))).size < 4) return { ok: false, message: 'Give each castle stone a different idea: an opening, two details, and a closing.' };
  return { ok: true, bonus: 5 };
}
export function checkInk(strokes, targetStrokes, scale = 1) {
  const ink = strokes.flat(), target = targetStrokes.flat(), tolerance = Math.max(10, 15 * scale);
  if (ink.length < 3 || !target.length) return { ok: false, cover: 0, accuracy: 0 };
  const near = (p, points, d) => points.some(q => (p[0]-q[0])**2+(p[1]-q[1])**2 <= d*d);
  const marks = target.map(p => [...p, near(p, ink, tolerance)]);
  const cover = marks.filter(p => p[2]).length / target.length;
  const accuracy = ink.filter(p => near(p, target, tolerance * 1.7)).length / ink.length;
  return { ok: cover >= .70 && accuracy >= .65, cover, accuracy, marks };
}

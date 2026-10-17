// Scare level ("tier") for Rusty's After Hours.
//   0 = Gentle (Pre-K, K): lights on, smiling animatronics, "Tag, you're it!" instead of a scare.
//   1 = Spooky-lite (1st–3rd): dim rooms + flashlight, worn animatronics with glowing eyes, a quick "Gotcha!".
//   2 = Spooky (4th–5th): dark rooms, broken-down animatronics (metal showing, no gore), real jump scare.
// It follows the kid's grade. A grown-up can turn it DOWN (never up) in Grown-ups → this game's settings.
export const TIERS = [
  { id: 'gentle', name: 'Gentle', grades: 'Pre-K · K' },
  { id: 'lite', name: 'Spooky-lite', grades: '1st · 2nd · 3rd' },
  { id: 'spooky', name: 'Spooky', grades: '4th · 5th' },
];

/** Highest tier allowed for a school grade ('PK', 'K', '1' … '8'). Unknown grade → Spooky-lite. */
export function gradeTier(grade) {
  if (grade === null || grade === undefined || grade === '') return 1;
  const g = String(grade).toUpperCase();
  if (g === 'PK' || g === 'K') return 0;
  const n = parseInt(g, 10);
  if (Number.isNaN(n)) return 1;
  return n <= 3 ? 1 : 2;
}

/** The tier to play at: the grade's tier, or lower if a grown-up turned it down. */
export function scareTier(kid, settings) {
  const max = gradeTier(kid && (kid.grade || kid.reads));
  const s = settings && settings.scare;
  // 'off' / 'mild' / 'full' are the old settings: off → gentle, mild/full → follow the grade
  const want = { gentle: 0, off: 0, lite: 1, spooky: 2, auto: max, mild: max, full: max }[s];
  return Math.max(0, Math.min(max, want === undefined ? max : want));
}

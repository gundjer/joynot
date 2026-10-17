// Original animatronic cast for "Rusty's After Hours": names, voices, lines, and drawing.
// The pictures come from animatronics.js and change with the scare tier (Gentle / Spooky-lite / Spooky).
import { drawAnimatronic, eyeScreen, CAST } from './animatronics.js';

// Voices: a natural voice with a small pitch change sounds like a costumed performer, not a robot.
// voice: 'deep' | 'warm' | 'bright' picks a matching natural voice on the device when there is one.
export const CHARACTERS = {
  rusty: { id: 'rusty', name: 'Rusty the Raccoon', eye: '#ffe680', pitch: 0.85, rate: 0.92, heavy: 1.0, voice: 'warm',
    intro: ['I am Rusty the Raccoon! Let\'s play hide and seek. Ready or not, here I come!', 'I am Rusty the Raccoon. I love to play hide and seek. Ready or not, here I come!', 'Rusty is awake... and Rusty wants to play.'] },
  hoot: { id: 'hoot', name: 'Hoot the Owl', eye: '#ffe680', pitch: 1.25, rate: 1.0, heavy: 1.3, voice: 'bright',
    intro: ['Hoo hoo! I am Hoot the Owl! I love books. Can you find me?', 'Hoo hoo! I am Hoot the Owl. I can see in the dark. Can you?', 'Hoo... hoo... I see everything in the dark.'] },
  chomps: { id: 'chomps', name: 'Chomps the Gator', eye: '#ffe680', pitch: 0.7, rate: 0.88, heavy: 0.8, voice: 'deep',
    intro: ['Chomp chomp! I am Chomps the Gator, the pizza chef! Want a slice?', 'Chomp chomp. I am Chomps the Gator. I am very, very hungry.', 'Chomp... chomp... the kitchen is closed. But I am still hungry.'] },
  major: { id: 'major', name: 'Major Moose', eye: '#ffe680', pitch: 0.75, rate: 0.86, heavy: 0.7, voice: 'deep',
    intro: ['Attention, everyone! I am Major Moose! Let\'s march and play!', 'Attention! I am Major Moose. Nobody escapes on my watch!', 'Attention... Major Moose is on patrol. Nobody leaves.'] },
};

// Lines by tier: [Gentle, Spooky-lite, Spooky]
const LINE_SETS = [
  {
    near: ['Hee hee! Where are you?', 'Are you hiding? I love hide and seek!', 'Ready or not, here I come!', 'I hear giggles!', 'Peekaboo!', 'Is it my turn to look?'],
    hunt: ['I found you! Hee hee!', 'Here I come!', 'You can\'t catch me... wait, I\'m catching you!', 'Tag time!'],
    lost: ['Where did you go? You are a good hider!', 'Hmm... I lost you!', 'You are so sneaky!'],
    flashed: ['Hee hee! That tickles!', 'Whoa! Bright light!', 'You found me! I will hide again!', 'Okay, okay, I will count to ten!'],
    caught: ['Tag, you\'re it!', 'Got you! Hee hee!', 'Tag! Let\'s play again!'],
  },
  {
    near: ['I can hear you...', 'Come out, come out, wherever you are!', 'Do you want to play with me?', 'Is somebody there?', 'I smell pizza... and a kid!', 'Hee hee hee...', 'Where are you?', 'It is past bedtime...'],
    hunt: ['I see you!', 'There you are!', 'Come back here!', 'Tag, you are it!', 'You cannot hide from me!'],
    lost: ['Where did you go?', 'Hmm... I lost them.', 'You are a good hider...'],
    flashed: ['Too bright!', 'Aaah! My eyes!', 'Noooo! The light!', 'I will be back!', 'Turn that off!'],
    caught: ['Gotcha!', 'Found you!', 'Tag, you are it!'],
  },
  {
    near: ['I know you are here...', 'The show is not over yet...', 'Come out... and play...', 'Nobody leaves after hours...', 'I hear your footsteps...', 'Where... are... you?'],
    hunt: ['There you are!', 'I see you!', 'You can run... but I am faster!', 'Showtime!'],
    lost: ['You cannot hide forever...', 'I will find you...', 'Hmm... so quiet...'],
    flashed: ['Too bright!', 'Aaah! The light!', 'Turn it off!', 'I will be back...'],
    caught: ['Gotcha!', 'Found you!', 'Showtime!'],
  },
];

let tier = 1;
export function setTier(t) { tier = Math.max(0, Math.min(2, t | 0)); }
export function getTier() { return tier; }
export const LINES = new Proxy({}, { get: (_, k) => LINE_SETS[tier][k] || [] });
export function introLine(id) { const c = CHARACTERS[id]; return c ? c.intro[tier] || c.intro[1] : ''; }

/** Which animatronics come out on this night. Gentle: 1 at a time, Spooky-lite: up to 2, Spooky: up to 4. */
export function castForNight(night) {
  const order = ['rusty', 'hoot', 'chomps', 'major'];
  const cap = [1, 2, 4][tier];
  const n = Math.max(1, Math.min(cap, night));
  // gentle: a different friend each night
  if (tier === 0) return [order[(night - 1) % 4]];
  if (tier === 1 && night > 2) { const a = order[(night - 1) % 4], b = order[night % 4]; return [a, b]; }
  return order.slice(0, n);
}

/** Draw an animatronic centered at (cx, cy); s ≈ body height in px. opts: { walking, tier, alpha } */
export function drawCharacter(ctx, id, cx, cy, s, t = 0, opts = {}) {
  if (!CAST[id]) return;
  drawAnimatronic(ctx, id, cx, cy, s, t, { tier, ...opts });
}

/** Just the glowing eyes (drawn on top of the darkness so they peek out at you). */
export function drawEyes(ctx, id, cx, cy, s, alpha = 1) {
  if (tier === 0 || !CAST[id]) return;
  const col = tier === 2 ? '#ff3b30' : '#ffe680';
  const pts = eyeScreen(id, cx, cy, s);
  ctx.save(); ctx.globalAlpha = alpha; ctx.shadowColor = col; ctx.shadowBlur = s * 0.12; ctx.fillStyle = col;
  pts.forEach(([x, y], i) => { if (tier === 2 && i === 1) { ctx.beginPath(); ctx.arc(x, y + s * 0.012, s * 0.012, 0, 7); ctx.fill(); return; } ctx.beginPath(); ctx.arc(x, y + s * 0.01, s * 0.022, 0, 7); ctx.fill(); });
  ctx.restore();
}

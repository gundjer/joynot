// Animatronics the kid BUILDS in the Workshop. The newest one comes to life and chases the kid in the next
// Hallway Run, then becomes a helper on later nights (its glow lights the room and it scares off an animatronic once).
// Each bot: { kind, color, name, at, powers: { speed, ears, eyes } }. Parts go on one at a time:
// legs → body → arms → head → eyes → bow. Pictures come from animatronics.js (same style as the cast).
import { drawRobot } from './animatronics.js';
import { getTier } from './characters.js';
import { drawRobotPreview, drawComponentPreview } from './scene3d.js';

export const KINDS = {
  bunny: { name: 'Bunny', ears: 'long' },
  bear: { name: 'Bear', ears: 'round' },
  pup: { name: 'Pup', ears: 'flop' },
  penguin: { name: 'Penguin', ears: 'none' },
};
export const KIND_LIST = ['bunny', 'bear', 'pup', 'penguin'];
export const COLORS = ['#4fb6ff', '#ff7ab8', '#7ed957', '#ffb84a', '#b28cff', '#ff6b5b'];
/** Paint cans are labeled with color words (a little reading on every can). */
export const COLOR_WORDS = { '#4fb6ff': 'blue', '#ff7ab8': 'pink', '#7ed957': 'green', '#ffb84a': 'orange', '#b28cff': 'purple', '#ff6b5b': 'red' };
export const NAMES = ['Bolt', 'Sunny', 'Patch', 'Gizmo', 'Buttons', 'Sprocket', 'Pip', 'Tinker', 'Nova', 'Zippy', 'Cog', 'Daisy'];
export const PARTS = [
  { id: 'legs', label: 'servo legs', word: 'legs' },
  { id: 'body', label: 'control frame', word: 'body' },
  { id: 'arms', label: 'arm linkages', word: 'arms' },
  { id: 'head', label: 'hinged head', word: 'head' },
  { id: 'eyes', label: 'light sensors', word: 'eyes' },
  { id: 'bow', label: 'power module', word: 'power' },
];
/** Where each part sits on the bot (units of s/100 from the center). Used to drop parts in the right place. */
export const SLOTS = { legs: [0, 33], body: [0, 1], arms: [0, 9], head: [0, -42], eyes: [0, -43], bow: [0, -19] };
/** Powers the kid sets with math in the Workshop. 1–5 each. Bigger = harder chase (and more stars). */
export const POWERS = [
  { id: 'speed', label: 'Speed', icon: '⚡', help: 'how fast it runs' },
  { id: 'ears', label: 'Big ears', icon: '👂', help: 'how well it hears you' },
  { id: 'eyes', label: 'Glow eyes', icon: '👀', help: 'how well it sees you' },
];
export const powersOf = bot => ({ speed: 2, ears: 2, eyes: 2, ...(bot && bot.powers) });

/**
 * Draw a built animatronic. has = Set of part ids that are on (all when omitted); ghost = dashed outline of missing
 * parts (Workshop). mood: 'friendly' (Workshop, helper) or 'chase' (it came to life and is after you).
 */
export function drawBot(ctx, bot, cx, cy, s, t = 0, { has = null, ghost = false, walking = false, glow = 0, mood = 'friendly', tier = null } = {}) {
  if (drawRobotPreview(ctx, bot, cx, cy, s, t, { has, walking })) return;
  if (glow > 0) {
    ctx.save(); ctx.globalAlpha = glow;
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, s * 0.9); g.addColorStop(0, 'rgba(120,255,220,.55)'); g.addColorStop(1, 'rgba(120,255,220,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, s * 0.9, 0, 7); ctx.fill(); ctx.restore();
  }
  drawRobot(ctx, { kind: bot.kind || 'bunny', color: bot.color || COLORS[0] }, cx, cy, s, t, { has, ghost, walking, mood, tier: tier ?? (mood === 'friendly' ? 0 : getTier()) });
}

/** Draw just one loose part (floating out of a crate, or being dragged), centered at (cx, cy). */
export function drawPart(ctx, bot, id, cx, cy, s, t = 0) {
  if (drawComponentPreview(ctx, bot, id, cx, cy, s * .65, t)) return;
  const [ox, oy] = SLOTS[id] || [0, 0], u = s / 100;
  drawRobot(ctx, { kind: bot.kind || 'bunny', color: bot.color || COLORS[0] }, cx - ox * u, cy - oy * u, s, t, { has: new Set([id]), mood: 'friendly', tier: 0 });
}

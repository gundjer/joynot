// Serializable rules shared by the renderer and turn controls. No DOM or timers.
export const FINISH = 60;
export const COLORS = ['#f879a1', '#ffb75e', '#f7d65a', '#66cba8', '#69bdf3', '#ad96ed'];
export const SHIRTS = ['#e54d86', '#287ed6', '#168c78', '#d47a18', '#8654cc', '#bd4740', '#b79a18', '#354b7c', '#669c32', '#555963'];
export const SHIRT_NAMES = ['Pink', 'Blue', 'Teal', 'Orange', 'Purple', 'Red', 'Gold', 'Navy', 'Green', 'Gray'];
export function assignShirts(seats) {
  const used = new Set();
  const colors = seats.map(p => { if (SHIRTS.includes(p.shirt) && !used.has(p.shirt)) { used.add(p.shirt); return p.shirt; } return null; });
  return colors.map(c => { if (c) return c; const free = SHIRTS.find(s => !used.has(s)); used.add(free); return free; });
}
export function shirtPicker(selected, taken = [], seat = '') {
  return `<div class="shirt-picker" role="group" aria-label="Choose shirt color">${SHIRTS.map((color, i) => `<button type="button" data-shirt="${color}" data-color-seat="${seat}" style="--swatch:${color}" aria-label="${SHIRT_NAMES[i]}${taken.includes(color) ? ', already chosen' : ''}" title="${SHIRT_NAMES[i]}${taken.includes(color) ? ' · already chosen' : ''}" aria-pressed="${selected === color}" ${taken.includes(color) ? 'disabled' : ''}>${selected === color ? '✓' : ''}</button>`).join('')}</div>`;
}
export const CHARACTERS = [
  { name: 'Amara', skin: '#824b34', hair: '#282031', style: 'curls' },
  { name: 'Kai', skin: '#e8ad7b', hair: '#252737', style: 'short' },
  { name: 'Sofia', skin: '#bd794e', hair: '#513028', style: 'braids' },
  { name: 'Noah', skin: '#f5d0ae', hair: '#b76c38', style: 'short', glasses: true },
  { name: 'Zara', skin: '#a96745', hair: '#8862c2', style: 'hijab' },
  { name: 'Eli', skin: '#efbc91', hair: '#49332b', style: 'short', wheelchair: true },
  { name: 'Maya', skin: '#583a30', hair: '#211f29', style: 'puffs', glasses: true },
  { name: 'Luca', skin: '#f3cda7', hair: '#ceb45a', style: 'waves' },
];
export const LINKS = [
  { from: 4, to: 17, kind: 'ladder' }, { from: 13, to: 28, kind: 'ladder' },
  { from: 26, to: 43, kind: 'ladder' }, { from: 42, to: 55, kind: 'ladder' },
  { from: 19, to: 7, kind: 'slide' }, { from: 33, to: 23, kind: 'slide' },
  { from: 47, to: 35, kind: 'slide' }, { from: 57, to: 45, kind: 'slide' },
];
export const CANDY = [9, 22, 36, 48];
export const LAND_NAMES = ['Strawberry Start', 'Peachy Paths', 'Lemon Drop Lane', 'Mint Meadow', 'Blueberry Bay', 'Lavender Castle'];
// Public seat label derived from a random token; bearer tokens stay on the host.
// This label is for UI only. The host always checks the actual transport sender.
export function controllerTag(token) {
  let a = 2166136261, b = 5381;
  for (const char of String(token)) { a = Math.imul(a ^ char.charCodeAt(0), 16777619); b = Math.imul(b, 33) ^ char.charCodeAt(0); }
  return `${(a >>> 0).toString(36)}-${(b >>> 0).toString(36)}`;
}
export function tilePoint(n) {
  if (n === 0) return { x: -5.7, z: 3.5 };
  const row = Math.floor((n - 1) / 10), col = (n - 1) % 10;
  return { x: (row % 2 ? 9 - col : col) - 4.5, z: 2.5 - row };
}
export function newMatch(seats, focus = 'both') {
  if (!Array.isArray(seats) || seats.length < 2 || seats.length > 6 || seats.every(p => p.bot)) throw new Error('Choose 2–6 players, including a person.');
  const shirts = assignShirts(seats);
  return { version: 1, id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`, players: seats.map((p, i) => ({
    name: String(p.name || `Player ${i + 1}`).trim().slice(0, 24) || `Player ${i + 1}`,
    bot: !!p.bot, remote: !!p.remote, character: Math.max(0, Math.min(CHARACTERS.length - 1, p.character | 0)),
    shirt: shirts[i], pos: 0,
  })), turn: 0, round: 1, phase: 'question', focus, question: null, attempts: 0, helped: false, die: null, move: null, winner: null, rewarded: false };
}
export function restoreMatch(saved) {
  if (!saved || saved.version !== 1 || !Array.isArray(saved.players)) return null;
  try {
    const base = newMatch(saved.players, ['math', 'reading', 'both'].includes(saved.focus) ? saved.focus : 'both');
    if (!Number.isInteger(saved.turn) || saved.turn < 0 || saved.turn >= base.players.length || !['question', 'ready', 'result', 'finished'].includes(saved.phase)) return null;
    for (let i = 0; i < base.players.length; i++) {
      const pos = saved.players[i].pos;
      if (!Number.isInteger(pos) || pos < 0 || pos > FINISH) return null;
      base.players[i].pos = pos;
    }
    if (saved.phase === 'finished' && (!Number.isInteger(saved.winner) || !base.players[saved.winner] || base.players[saved.winner].pos !== FINISH)) return null;
    return { ...base, id: typeof saved.id === 'string' ? saved.id : base.id, turn: saved.turn, round: Math.max(1, saved.round | 0), phase: saved.phase,
      question: saved.phase === 'question' && saved.question?.track ? saved.question : null,
      attempts: Math.max(0, saved.attempts | 0), helped: !!saved.helped,
      die: Number.isInteger(saved.die) && saved.die >= 1 && saved.die <= 6 ? saved.die : null,
      move: saved.move && typeof saved.move.message === 'string' ? saved.move : null,
      winner: saved.phase === 'finished' ? saved.winner : null, rewarded: !!saved.rewarded };
  } catch { return null; }
}
export function unlockRoll(match) {
  if (match.phase !== 'question') return false;
  match.phase = 'ready'; match.question = null; return true;
}
export function roll(match, random = Math.random) {
  if (match.phase !== 'ready') return null;
  const die = 1 + Math.min(5, Math.max(0, Math.floor(random() * 6)));
  const player = match.players[match.turn], from = player.pos, landing = Math.min(FINISH, from + die);
  let to = landing, message = `Rolled ${die}. Move ${landing - from} spaces.`, kind = 'walk', color = null;
  const link = LINKS.find(l => l.from === landing);
  if (link) { to = link.to; kind = link.kind; message += link.kind === 'ladder' ? ` Rainbow ladder! Climb to ${to}.` : ` Whee! Slide down to ${to}.`; }
  else if (CANDY.includes(landing)) {
    const colorIndex = Math.min(5, Math.max(0, Math.floor(random() * 6)));
    const next = Array.from({ length: FINISH - landing }, (_, i) => landing + i + 1).find(n => (n - 1) % 6 === colorIndex);
    color = COLORS[colorIndex]; kind = 'candy'; to = next || landing;
    message += next ? ` Candy card! Follow the matching color to ${to}.` : ' Candy card! Enjoy a sweet rest here.';
  }
  player.pos = to; match.die = die;
  match.move = { from, landing, to, kind, color, message };
  if (to === FINISH) { match.winner = match.turn; match.phase = 'finished'; }
  else match.phase = 'result';
  return match.move;
}
export function nextTurn(match) {
  if (match.phase !== 'result') return false;
  match.turn = (match.turn + 1) % match.players.length;
  if (match.turn === 0) match.round++;
  match.phase = 'question'; match.question = null; match.attempts = 0; match.helped = false;
  match.move = null; match.die = null; return true;
}
// Native SVG portraits match the 3D pawns, with no external images to load.
export function portrait(index, shirt) {
  const c = CHARACTERS[index] || CHARACTERS[0];
  const hair = c.style === 'hijab' ? `<path d="M23 47Q18 9 50 8Q82 9 77 47L85 72H15Z" fill="${c.hair}"/>` : `<ellipse cx="50" cy="31" rx="28" ry="26" fill="${c.hair}"/>`;
  const puffs = ['curls', 'puffs'].includes(c.style) ? [23, 38, 55, 73].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 15 : 23}" r="13" fill="${c.hair}"/>`).join('') : '';
  return `<svg viewBox="0 0 100 110" role="img" aria-label="${c.name} character"><ellipse cx="50" cy="103" rx="36" ry="5" fill="#43365b" opacity=".12"/>${hair}${puffs}<path d="M15 101V82Q18 62 50 63Q82 62 85 82V101" fill="${shirt}"/><rect x="43" y="54" width="14" height="18" rx="6" fill="${c.skin}"/><ellipse cx="50" cy="38" rx="21" ry="26" fill="${c.skin}"/><path d="M28 30Q28 7 52 11Q73 12 74 31Q58 17 28 30" fill="${c.hair}"/><circle cx="42" cy="38" r="2.5" fill="#292238"/><circle cx="59" cy="38" r="2.5" fill="#292238"/><path d="M43 49Q50 55 58 49" fill="none" stroke="#703b36" stroke-width="2" stroke-linecap="round"/>${c.glasses ? '<g fill="none" stroke="#39384f" stroke-width="2.5"><rect x="31" y="31" width="17" height="13" rx="5"/><rect x="52" y="31" width="17" height="13" rx="5"/><path d="M48 35H52"/></g>' : ''}${c.style === 'braids' ? `<path d="M27 32L22 73M73 32L78 73" stroke="${c.hair}" stroke-width="11" stroke-linecap="round"/>` : ''}${c.wheelchair ? '<g fill="none" stroke="#434b6c" stroke-width="5"><circle cx="25" cy="90" r="15"/><circle cx="77" cy="90" r="15"/></g>' : ''}<path d="M46 79L50 72L54 79L62 80L56 86L57 94L50 90L43 94L44 86L38 80Z" fill="#fff5ce"/></svg>`;
}

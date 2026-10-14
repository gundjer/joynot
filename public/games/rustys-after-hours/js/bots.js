// Friendly animatronics the kid BUILDS in the Workshop. They become helpers on later nights and in Hallway Runs.
// Each bot: { kind, color, name, at }. Parts go on one at a time: legs → body → arms → head → eyes → bow.
export const KINDS = {
  bunny: { name: 'Bunny', ears: 'long' },
  bear: { name: 'Bear', ears: 'round' },
  pup: { name: 'Pup', ears: 'flop' },
  penguin: { name: 'Penguin', ears: 'none' },
};
export const KIND_LIST = ['bunny', 'bear', 'pup', 'penguin'];
export const COLORS = ['#4fb6ff', '#ff7ab8', '#7ed957', '#ffb84a', '#b28cff', '#ff6b5b'];
export const NAMES = ['Bolt', 'Sunny', 'Patch', 'Gizmo', 'Buttons', 'Sprocket', 'Pip', 'Tinker', 'Nova', 'Zippy', 'Cog', 'Daisy'];
export const PARTS = [
  { id: 'legs', label: 'legs', word: 'legs' },
  { id: 'body', label: 'body', word: 'body' },
  { id: 'arms', label: 'arms', word: 'arms' },
  { id: 'head', label: 'head', word: 'head' },
  { id: 'eyes', label: 'eyes', word: 'eyes' },
  { id: 'bow', label: 'bow tie', word: 'bow tie' },
];
/** Where each part sits on the bot (design units, bot is ~100 tall, centred). Used to drop parts in the right place. */
export const SLOTS = { legs: [0, 36], body: [0, 10], arms: [0, 8], head: [0, -30], eyes: [0, -33], bow: [0, -9] };

const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};

/**
 * Draw a friendly bot. has = Set of part ids that are on (all parts when omitted). Missing parts show as a dashed
 * outline when ghost=true (the workshop shows where things go).
 */
export function drawBot(ctx, bot, cx, cy, s, t = 0, { has = null, ghost = false, wave = 0, walking = false, glow = 0, spine = true } = {}) {
  const u = s / 100, col = bot.color || COLORS[0], dark = shade(col, 0.6), light = shade(col, 1.25);
  const on = id => !has || has.has(id);
  ctx.save(); ctx.translate(cx, cy);
  const bob = Math.sin(t * 6) * 1.5 * u * (walking ? 1 : 0.25);
  ctx.translate(0, bob);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const rr = (x, y, w, h, r, fill, stroke) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2 * u; ctx.stroke(); } };
  const circ = (x, y, r, fill, stroke) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2 * u; ctx.stroke(); } };
  const ghostLine = () => { ctx.setLineDash([4 * u, 3 * u]); ctx.strokeStyle = 'rgba(160,230,255,.75)'; ctx.lineWidth = 2 * u; };

  if (glow > 0) { ctx.save(); ctx.globalAlpha = glow; const g = ctx.createRadialGradient(0, 0, 4 * u, 0, 0, 70 * u); g.addColorStop(0, 'rgba(120,255,220,.55)'); g.addColorStop(1, 'rgba(120,255,220,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 70 * u, 0, 7); ctx.fill(); ctx.restore(); }

  // metal stand (endoskeleton spine), always there
  if (spine) { ctx.strokeStyle = '#8a9099'; ctx.lineWidth = 4 * u; ctx.beginPath(); ctx.moveTo(0, -30 * u); ctx.lineTo(0, 30 * u); ctx.stroke(); }

  // legs
  const step = walking ? Math.sin(t * 9) * 3 * u : 0;
  if (on('legs')) {
    rr(-16 * u, 24 * u + step, 12 * u, 20 * u, 5 * u, dark); rr(4 * u, 24 * u - step, 12 * u, 20 * u, 5 * u, dark);
    rr(-19 * u, 42 * u + step, 17 * u, 8 * u, 4 * u, '#2b2b33'); rr(2 * u, 42 * u - step, 17 * u, 8 * u, 4 * u, '#2b2b33');
  } else if (ghost) { ctx.save(); ghostLine(); rr(-16 * u, 24 * u, 12 * u, 24 * u, 5 * u, null, null); ctx.stroke(); rr(4 * u, 24 * u, 12 * u, 24 * u, 5 * u, null, null); ctx.stroke(); ctx.restore(); }

  // arms (behind body)
  const sw = wave ? Math.sin(t * 10) * 18 * u : 0;
  if (on('arms')) {
    rr(-34 * u, -6 * u, 10 * u, 28 * u, 5 * u, col, dark);
    ctx.save(); ctx.translate(29 * u, -4 * u); ctx.rotate(wave ? -2.2 + Math.sin(t * 10) * 0.35 : 0); rr(-5 * u, 0, 10 * u, 28 * u, 5 * u, col, dark); circ(0, 30 * u, 5 * u, light); ctx.restore();
    circ(-29 * u, 24 * u, 5 * u, light);
  } else if (ghost) { ctx.save(); ghostLine(); rr(-34 * u, -6 * u, 10 * u, 28 * u, 5 * u); ctx.stroke(); rr(24 * u, -6 * u, 10 * u, 28 * u, 5 * u); ctx.stroke(); ctx.restore(); }
  void sw;

  // body
  if (on('body')) {
    rr(-24 * u, -12 * u, 48 * u, 40 * u, 16 * u, col, dark);
    if (bot.kind === 'penguin') { ctx.beginPath(); ctx.ellipse(0, 9 * u, 15 * u, 17 * u, 0, 0, 7); ctx.fillStyle = '#f4f1ea'; ctx.fill(); }
    else rr(-14 * u, -3 * u, 28 * u, 26 * u, 12 * u, light);
    // friendly heart light on the chest
    ctx.save(); ctx.shadowColor = '#ff6b8a'; ctx.shadowBlur = 8 * u; ctx.fillStyle = '#ff6b8a';
    ctx.beginPath(); const hx = 0, hy = 8 * u, k = 4 * u; ctx.moveTo(hx, hy + k); ctx.bezierCurveTo(hx - 2 * k, hy - k / 2, hx - k / 2, hy - 2 * k, hx, hy - k / 2); ctx.bezierCurveTo(hx + k / 2, hy - 2 * k, hx + 2 * k, hy - k / 2, hx, hy + k); ctx.fill(); ctx.restore();
  } else if (ghost) { ctx.save(); ghostLine(); rr(-24 * u, -12 * u, 48 * u, 40 * u, 16 * u); ctx.stroke(); ctx.restore(); }

  // head
  const hy = -32 * u;
  if (on('head')) {
    if (bot.kind === 'bunny') for (const sx of [-1, 1]) { ctx.save(); ctx.translate(sx * 9 * u, hy - 16 * u); ctx.rotate(sx * 0.15 + Math.sin(t * 2 + sx) * 0.05); rr(-5 * u, -28 * u, 10 * u, 30 * u, 5 * u, col, dark); rr(-2.5 * u, -24 * u, 5 * u, 22 * u, 3 * u, '#ffc6dc'); ctx.restore(); }
    if (bot.kind === 'bear') for (const sx of [-1, 1]) { circ(sx * 15 * u, hy - 16 * u, 8 * u, col, dark); circ(sx * 15 * u, hy - 16 * u, 4 * u, light); }
    if (bot.kind === 'pup') for (const sx of [-1, 1]) { ctx.save(); ctx.translate(sx * 18 * u, hy - 8 * u); ctx.rotate(sx * 0.35); ctx.beginPath(); ctx.ellipse(0, 8 * u, 6 * u, 13 * u, 0, 0, 7); ctx.fillStyle = dark; ctx.fill(); ctx.restore(); }
    circ(0, hy, 21 * u, col, dark);
    if (bot.kind === 'penguin') { ctx.beginPath(); ctx.ellipse(0, hy + 4 * u, 15 * u, 13 * u, 0, 0, 7); ctx.fillStyle = '#f4f1ea'; ctx.fill(); ctx.fillStyle = '#ffb030'; ctx.beginPath(); ctx.moveTo(-5 * u, hy + 6 * u); ctx.lineTo(5 * u, hy + 6 * u); ctx.lineTo(0, hy + 13 * u); ctx.closePath(); ctx.fill(); }
    else { ctx.beginPath(); ctx.ellipse(0, hy + 9 * u, 11 * u, 8 * u, 0, 0, 7); ctx.fillStyle = light; ctx.fill(); circ(0, hy + 5 * u, 3.5 * u, '#3a2a2a'); ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = 1.6 * u; ctx.beginPath(); ctx.arc(0, hy + 9 * u, 5 * u, 0.2, Math.PI - 0.2); ctx.stroke(); }
    circ(-14 * u, hy + 6 * u, 3 * u, 'rgba(255,120,150,.45)'); circ(14 * u, hy + 6 * u, 3 * u, 'rgba(255,120,150,.45)');
  } else if (ghost) { ctx.save(); ghostLine(); circ(0, hy, 21 * u); ctx.stroke(); ctx.restore(); }

  // eyes (friendly: big, teal, with a shine)
  const ey = hy - 4 * u;
  if (on('eyes') && on('head')) {
    for (const sx of [-1, 1]) { circ(sx * 8 * u, ey, 6 * u, '#fff'); ctx.save(); ctx.shadowColor = '#3ff2d0'; ctx.shadowBlur = 8 * u; circ(sx * 8 * u, ey + 0.5 * u, 3.6 * u, '#19c9a8'); ctx.restore(); circ(sx * 8 * u - 1.4 * u, ey - 1.4 * u, 1.2 * u, '#fff'); }
  } else if (on('eyes') && ghost) { for (const sx of [-1, 1]) circ(sx * 8 * u, ey, 3.6 * u, '#19c9a8'); }
  else if (ghost) { ctx.save(); ghostLine(); for (const sx of [-1, 1]) { circ(sx * 8 * u, ey, 5 * u); ctx.stroke(); } ctx.restore(); }

  // bow tie
  if (on('bow')) {
    ctx.fillStyle = '#ffd84a'; ctx.strokeStyle = '#b88a00'; ctx.lineWidth = 1.5 * u;
    ctx.beginPath(); ctx.moveTo(0, -9 * u); ctx.lineTo(-11 * u, -15 * u); ctx.lineTo(-11 * u, -3 * u); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -9 * u); ctx.lineTo(11 * u, -15 * u); ctx.lineTo(11 * u, -3 * u); ctx.closePath(); ctx.fill(); ctx.stroke();
    circ(0, -9 * u, 3 * u, '#ffb000');
  } else if (ghost) { ctx.save(); ghostLine(); ctx.beginPath(); ctx.moveTo(-11 * u, -15 * u); ctx.lineTo(11 * u, -3 * u); ctx.lineTo(11 * u, -15 * u); ctx.lineTo(-11 * u, -3 * u); ctx.closePath(); ctx.stroke(); ctx.restore(); }
  ctx.restore();
}

/** Draw just one loose part (floating out of a crate, or being dragged). */
export function drawPart(ctx, bot, id, cx, cy, s, t = 0) {
  const has = new Set([id]);
  if (id === 'eyes') has.add('head');
  const [ox, oy] = SLOTS[id];
  const u = s / 100;
  ctx.save();
  if (id === 'eyes') { // just the two eyes
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + sx * 8 * u, cy, 6 * u, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.beginPath(); ctx.arc(cx + sx * 8 * u, cy + 0.5 * u, 3.6 * u, 0, 7); ctx.fillStyle = '#19c9a8'; ctx.fill(); }
    ctx.restore(); return;
  }
  drawBot(ctx, bot, cx - ox * u, cy - oy * u, s, t, { has, spine: false });
  ctx.restore();
}

// Sparkle and her family — drawn with plain canvas shapes (no image files).

export const FAMILY = [
  { id: 'button', name: 'Button', who: 'baby brother', body: '#cfeaff', mane: ['#6ec6ff', '#a0e7ff', '#ffffff'], size: 0.7, pitch: 1.8 },
  { id: 'daisy', name: 'Daisy', who: 'big sister', body: '#efe0ff', mane: ['#b388ff', '#ff9ad5', '#ffe066'], size: 0.9, pitch: 1.5 },
  { id: 'willow', name: 'Granny Willow', who: 'granny', body: '#e3f8ec', mane: ['#ffffff', '#c9f2dd', '#bfe8ff'], size: 0.95, pitch: 1.2, glasses: true },
  { id: 'sunny', name: 'Papa Sunny', who: 'papa', body: '#fff3c4', mane: ['#ffb347', '#ffd84a', '#ff8a5c'], size: 1.15, pitch: 0.9 },
  { id: 'luna', name: 'Mama Luna', who: 'mama', body: '#ffe1ef', mane: ['#ff6fa8', '#b388ff', '#6ec6ff'], size: 1.1, pitch: 1.25 },
];
export const SPARKLE = { id: 'sparkle', name: 'Sparkle', body: '#ffffff', mane: ['#ff6b6b', '#ffb347', '#ffe066', '#6be675', '#6ec6ff', '#b388ff'], size: 1, pitch: 1.4 };

/** Who she finds at the end of each stage (stage 6+ = friends join the family party). */
export function memberForStage(stage) {
  return FAMILY[(stage - 1) % FAMILY.length];
}

/**
 * Draw a unicorn standing on (x, y) = feet center. s = height in pixels.
 * o: { facing: 1 | -1, t: seconds, walking: bool, hearts: bool }
 */
export function drawUnicorn(ctx, c, x, y, s, o = {}) {
  const f = o.facing || 1, t = o.t || 0, walk = o.walking ? 1 : 0;
  const u = s / 100;
  const bob = Math.sin(t * (walk ? 12 : 3)) * (walk ? 2.2 : 1.2) * u;
  ctx.save();
  ctx.translate(x, y);
  // shadow
  ctx.fillStyle = 'rgba(80, 40, 120, .18)';
  ctx.beginPath(); ctx.ellipse(0, -2 * u, 40 * u, 9 * u, 0, 0, Math.PI * 2); ctx.fill();
  ctx.scale(f, 1);
  ctx.translate(0, bob);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const line = '#7a5aa6';

  // legs (back pair first)
  const legSwing = i => Math.sin(t * 12 + i * Math.PI) * 7 * u * walk;
  const leg = (lx, i, shade) => {
    ctx.save(); ctx.translate(lx * u, -36 * u); ctx.rotate(legSwing(i) / (30 * u || 1));
    ctx.fillStyle = shade; ctx.strokeStyle = line; ctx.lineWidth = 2.2 * u;
    roundRect(ctx, -5 * u, 0, 10 * u, 32 * u, 5 * u); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c9a0ff'; roundRect(ctx, -5.5 * u, 26 * u, 11 * u, 8 * u, 3 * u); ctx.fill();
    ctx.restore();
  };
  const shade = mix(c.body, '#d9c8f0', 0.35);
  leg(-20, 1, shade); leg(16, 0, shade);

  // tail (rainbow strands)
  c.mane.forEach((col, i) => {
    ctx.strokeStyle = col; ctx.lineWidth = 7 * u;
    const sway = Math.sin(t * 4 + i) * 4 * u;
    ctx.beginPath(); ctx.moveTo(-30 * u, -58 * u + i * 2 * u);
    ctx.quadraticCurveTo(-50 * u + sway, -60 * u + i * 4 * u, -46 * u + sway, -30 * u + i * 3 * u); ctx.stroke();
  });

  // body
  ctx.fillStyle = c.body; ctx.strokeStyle = line; ctx.lineWidth = 2.6 * u;
  ctx.beginPath(); ctx.ellipse(-2 * u, -50 * u, 34 * u, 20 * u, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // front legs
  leg(-12, 0, c.body); leg(22, 1, c.body);
  // neck + head
  ctx.fillStyle = c.body;
  ctx.beginPath(); ctx.moveTo(14 * u, -62 * u); ctx.quadraticCurveTo(22 * u, -84 * u, 30 * u, -90 * u); ctx.lineTo(40 * u, -78 * u); ctx.quadraticCurveTo(34 * u, -62 * u, 30 * u, -48 * u); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(38 * u, -88 * u, 17 * u, 14 * u, 0.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // snout
  ctx.fillStyle = mix(c.body, '#ffc9e3', 0.5);
  ctx.beginPath(); ctx.ellipse(50 * u, -82 * u, 9 * u, 8 * u, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = line; ctx.beginPath(); ctx.arc(53 * u, -83 * u, 1.4 * u, 0, Math.PI * 2); ctx.fill();
  // ear
  ctx.fillStyle = c.body; ctx.beginPath(); ctx.moveTo(30 * u, -98 * u); ctx.lineTo(28 * u, -112 * u); ctx.lineTo(37 * u, -101 * u); ctx.closePath(); ctx.fill(); ctx.stroke();
  // horn
  const hg = ctx.createLinearGradient(40 * u, -100 * u, 50 * u, -128 * u); hg.addColorStop(0, '#ffd84a'); hg.addColorStop(1, '#fff6c2');
  ctx.fillStyle = hg; ctx.strokeStyle = '#d99a00'; ctx.lineWidth = 2 * u;
  ctx.beginPath(); ctx.moveTo(38 * u, -100 * u); ctx.lineTo(52 * u, -130 * u); ctx.lineTo(46 * u, -98 * u); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(217,154,0,.7)'; ctx.lineWidth = 1.4 * u;
  for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo((39 + i * 2.6) * u, (-101 - i * 7) * u); ctx.lineTo((46 + i * 1.2) * u, (-99 - i * 7) * u); ctx.stroke(); }
  // mane
  c.mane.forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse((26 - i * 2.5) * u, (-96 + i * 8) * u, 8 * u, 7 * u, 0, 0, Math.PI * 2); ctx.fill();
  });
  // eye
  ctx.fillStyle = '#3b2a5c'; ctx.beginPath(); ctx.ellipse(41 * u, -90 * u, 3.6 * u, 4.8 * u, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(42.3 * u, -91.8 * u, 1.5 * u, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3b2a5c'; ctx.lineWidth = 1.6 * u; ctx.beginPath(); ctx.moveTo(38 * u, -95.5 * u); ctx.lineTo(36 * u, -97.5 * u); ctx.moveTo(41 * u, -96 * u); ctx.lineTo(40.5 * u, -98.5 * u); ctx.stroke();
  // blush + smile
  ctx.fillStyle = 'rgba(255,120,170,.45)'; ctx.beginPath(); ctx.ellipse(46 * u, -80 * u, 4 * u, 2.6 * u, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = line; ctx.lineWidth = 1.6 * u; ctx.beginPath(); ctx.arc(52 * u, -78 * u, 3 * u, 0.2, 1.6); ctx.stroke();
  if (c.glasses) { ctx.strokeStyle = '#7a5aa6'; ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.arc(41 * u, -90 * u, 6 * u, 0, Math.PI * 2); ctx.stroke(); }
  // cutie mark (little star)
  star(ctx, -14 * u, -50 * u, 6 * u, '#ffd84a');
  ctx.restore();
  if (o.hearts) for (let i = 0; i < 3; i++) heart(ctx, x + (i - 1) * 18 * u + Math.sin(t * 3 + i) * 4 * u, y - 140 * u - ((t * 30 + i * 20) % 40) * u, 7 * u, 'rgba(255,90,150,.9)');
}

export function star(ctx, x, y, r, col) {
  ctx.save(); ctx.fillStyle = col; ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
export function heart(ctx, x, y, r, col) {
  ctx.save(); ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(x, y + r * 0.9);
  ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.7, y - r * 1.4, x, y - r * 0.5);
  ctx.bezierCurveTo(x + r * 0.7, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
  ctx.fill(); ctx.restore();
}
export function rainbowArc(ctx, x, y, r, w, alpha = 1) {
  const cols = ['#ff6b6b', '#ffb347', '#ffe066', '#6be675', '#6ec6ff', '#b388ff'];
  ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = 'round';
  cols.forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x, y, r - i * w, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); });
  // little clouds
  ctx.fillStyle = '#fff';
  [[-1, 0], [1, 0]].forEach(([sx]) => { const cx = x + sx * (r - w * 2.5); ctx.beginPath(); ctx.arc(cx - w, y, w * 1.3, 0, 7); ctx.arc(cx + w * 0.6, y - w * 0.3, w * 1.6, 0, 7); ctx.arc(cx + w * 1.9, y, w * 1.1, 0, 7); ctx.fill(); });
  ctx.restore();
}
export function jellyBean(ctx, x, y, r, col, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.3, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.beginPath(); ctx.ellipse(-r * 0.4, -r * 0.3, r * 0.45, r * 0.2, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function mix(a, b, k) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
}

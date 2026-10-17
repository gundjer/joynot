// Wall, floor, door and ceiling pictures for the 3D rooms. Made once per night with the canvas (no image files).
// Each texture is 64 × 64 (doors are 128 × 64: one door is two tiles wide) stored as pixel arrays the 3D renderer
// can read fast. "glow" marks pixels that light themselves (EXIT signs, door signs, arcade screens).
export const TS = 64;
export const THEME_LIST = ['dining', 'arcade', 'kitchen', 'parts', 'office', 'storage', 'party', 'stage'];

// colors by tier: [gentle, spooky-lite, spooky]
const WALLS = {
  dining: [['#ffd9a0', '#ffe9c4'], ['#5a4468', '#4a3858'], ['#3a2a3e', '#2c2030']],
  party: [['#bfe6ff', '#d9f0ff'], ['#3f4a72', '#34405f'], ['#262a3e', '#1e2132']],
  arcade: [['#c9b6ff', '#ddd0ff'], ['#2e2350', '#251c42'], ['#1d1630', '#161124']],
  kitchen: [['#e8f4f0', '#ffffff'], ['#6b7d78', '#5d6e6a'], ['#3d4846', '#323b39']],
  parts: [['#d6d0c4', '#e6e0d4'], ['#5b5650', '#4d4944'], ['#33302c', '#292724']],
  office: [['#cfe8c8', '#e2f2dc'], ['#3e5a4a', '#344d3f'], ['#25362c', '#1e2c24']],
  storage: [['#e6d2b0', '#f2e2c6'], ['#5f5444', '#524839'], ['#36301f', '#2c2719']],
  stage: [['#ffc2c2', '#ffd6d6'], ['#5c2a35', '#4c222b'], ['#351820', '#2a1218']],
};
const FLOORS = {
  dining: 'checker', party: 'checker', arcade: 'carpet', kitchen: 'tile', parts: 'concrete', storage: 'concrete', office: 'carpet2', stage: 'planks',
};

function mk(w = TS, h = TS) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function grab(c, glowC) {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  const px = new Uint32Array(c.width * c.height), glow = new Uint8Array(c.width * c.height);
  const gd = glowC ? glowC.getContext('2d').getImageData(0, 0, c.width, c.height).data : null;
  for (let i = 0, j = 0; i < px.length; i++, j += 4) {
    px[i] = (255 << 24) | (d[j + 2] << 16) | (d[j + 1] << 8) | d[j]; // little-endian ABGR for ImageData
    if (gd && gd[j + 3] > 128) glow[i] = 1;
  }
  return { w: c.width, h: c.height, px, glow };
}
const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);

function wall(theme, tier) {
  const [c, x] = mk(); const [a, b] = WALLS[theme][tier];
  x.fillStyle = a; x.fillRect(0, 0, TS, TS);
  // wallpaper
  if (theme === 'dining' || theme === 'party' || theme === 'stage') { x.fillStyle = b; for (let i = 0; i < TS; i += 16) x.fillRect(i, 0, 8, 40); }
  if (theme === 'arcade') { const cols = tier ? ['#7b3cff', '#ff3cc8', '#3cd2ff'] : ['#ff7ab8', '#4fb6ff', '#7ed957']; for (let i = 0; i < 18; i++) { x.fillStyle = cols[i % 3]; x.globalAlpha = tier ? 0.5 : 0.8; x.fillRect(rnd() * 60, rnd() * 36, 4, 4); } x.globalAlpha = 1; }
  if (theme === 'kitchen') { x.strokeStyle = tier ? 'rgba(0,0,0,.25)' : 'rgba(0,0,0,.08)'; for (let i = 0; i <= TS; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 44); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(TS, i); x.stroke(); } }
  if (theme === 'parts' || theme === 'storage') { x.fillStyle = 'rgba(0,0,0,.12)'; for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) x.fillRect(((r % 2) * 11 + k * 22) % 64 + 1, r * 11 + 1, 20, 9); }
  if (theme === 'office') { x.fillStyle = b; x.fillRect(0, 0, TS, 6); }
  // pizza-place checker band + baseboard
  for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? (tier === 0 ? '#ff7ab8' : '#e9e2d4') : (tier === 0 ? '#ffffff' : '#141018'); x.fillRect(i * 4, 44, 4, 3); x.fillStyle = i % 2 ? (tier === 0 ? '#ffffff' : '#141018') : (tier === 0 ? '#ff7ab8' : '#e9e2d4'); x.fillRect(i * 4, 47, 4, 3); }
  x.fillStyle = tier === 0 ? '#7a4a24' : '#1a1418'; x.fillRect(0, 56, TS, 8);
  // wear and grime
  if (tier >= 1) { for (let i = 0; i < (tier === 2 ? 26 : 10); i++) { x.fillStyle = `rgba(20,12,8,${0.08 + rnd() * 0.15})`; x.beginPath(); x.ellipse(rnd() * 64, rnd() * 56, 2 + rnd() * 7, 1 + rnd() * 5, 0, 0, 7); x.fill(); } }
  if (tier === 2) { x.strokeStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.moveTo(10, 0); x.lineTo(14, 18); x.lineTo(9, 30); x.stroke(); }
  return grab(c);
}

function poster(theme, tier, v) {
  const [c, x] = mk(); const base = wall(theme, tier); const id = x.createImageData(TS, TS);
  new Uint32Array(id.data.buffer).set(base.px); x.putImageData(id, 0, 0);
  const col = ['#d94848', '#4878d9', '#e6b43a', '#48b06a'][v % 4];
  x.fillStyle = tier === 2 ? '#3a3228' : '#f4ead2'; x.fillRect(14, 8, 36, 30);
  x.fillStyle = col; x.fillRect(16, 10, 32, 26);
  x.fillStyle = '#fff'; x.font = 'bold 8px sans-serif'; x.textAlign = 'center'; x.fillText(['PARTY!', 'PLAY!', 'PIZZA', 'FUN!'][v % 4], 32, 19);
  x.fillStyle = '#7d7368'; x.beginPath(); x.arc(32, 28, 6, 0, 7); x.fill();
  x.fillStyle = tier === 2 ? '#ff3b30' : '#222'; x.fillRect(29, 27, 2, 2); x.fillRect(33, 27, 2, 2);
  if (tier >= 1) { x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.moveTo(48, 10); x.lineTo(40, 10); x.lineTo(48, 18); x.fill(); }
  return grab(c);
}

function door(kind, tier) {
  const W = TS * 2;
  // drawn twice as sharp as walls (you stand right in front of doors)
  const [c, x] = mk(W * 2, TS * 2), [g, gx] = mk(W * 2, TS * 2);
  x.scale(2, 2); gx.scale(2, 2);
  // frame + wall around
  x.fillStyle = tier === 0 ? '#e9dcc4' : '#2b2433'; x.fillRect(0, 0, W, TS);
  const body = kind === 'exit' ? (tier === 0 ? '#2f9e5a' : '#7a1414') : kind === 'math' ? '#4a5058' : (tier === 0 ? '#b07a44' : '#6b4423');
  x.fillStyle = body; x.fillRect(10, 4, W - 20, TS - 4);
  if (kind === 'math') { x.fillStyle = '#9aa3ad'; for (let i = 0; i < 12; i++) x.fillRect(14 + i * 9, 6, 3, TS - 8); x.fillRect(12, 20, W - 24, 3); x.fillRect(12, 46, W - 24, 3); }
  else { x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 2; x.strokeRect(16, 10, W / 2 - 20, TS - 16); x.strokeRect(W / 2 + 4, 10, W / 2 - 20, TS - 16); x.beginPath(); x.moveTo(W / 2, 4); x.lineTo(W / 2, TS); x.stroke(); }
  // sign (glows)
  const sign = (ctx, glowOnly) => {
    if (kind === 'exit') {
      ctx.fillStyle = glowOnly ? '#fff' : (tier === 0 ? '#7ed957' : '#ff4040'); ctx.fillRect(W / 2 - 22, 8, 44, 14);
      if (!glowOnly) { ctx.fillStyle = tier === 0 ? '#0e3a1a' : '#2a0000'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('EXIT', W / 2, 19); }
      return;
    }
    const col = kind === 'math' ? '#ffb347' : '#7fc8ff';
    ctx.fillStyle = glowOnly ? '#fff' : col; ctx.beginPath(); ctx.arc(W / 2, 30, 12, 0, 7); ctx.fill();
    if (!glowOnly) { ctx.fillStyle = '#111'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(kind === 'math' ? '123' : 'ABC', W / 2, 33); }
  };
  sign(x, false); sign(gx, true);
  // keypad light
  x.fillStyle = '#ff5a4f'; x.fillRect(W - 22, 30, 4, 4); gx.fillStyle = '#fff'; gx.fillRect(W - 22, 30, 4, 4);
  if (tier === 2) { x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(20, 50, 30, 6); }
  return grab(c, g);
}

function floor(type, tier) {
  const [c, x] = mk();
  const k = [1, 0.62, 0.42][tier];
  const C = h => { const n = parseInt(h.slice(1), 16); return `rgb(${(n >> 16) * k | 0},${((n >> 8) & 255) * k | 0},${(n & 255) * k | 0})`; };
  if (type === 'checker') { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? C(tier ? '#e4ded2' : '#fff4dc') : C(tier ? '#2a2630' : '#ff9ac2'); x.fillRect(i * 32, j * 32, 32, 32); } }
  else if (type === 'carpet') { x.fillStyle = C(tier ? '#2a1840' : '#7a5ac8'); x.fillRect(0, 0, TS, TS); for (let i = 0; i < 40; i++) { x.fillStyle = C(['#ff4fd8', '#4fd1ff', '#ffe14f'][i % 3]); x.fillRect(rnd() * 62, rnd() * 62, 3, 3); } }
  else if (type === 'carpet2') { x.fillStyle = C(tier ? '#2f4a3c' : '#9fd49a'); x.fillRect(0, 0, TS, TS); x.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < TS; i += 4) x.fillRect(0, i, TS, 1); }
  else if (type === 'tile') { x.fillStyle = C(tier ? '#8fa3ad' : '#e8f4ff'); x.fillRect(0, 0, TS, TS); x.fillStyle = C(tier ? '#7a8e98' : '#cfe6f7'); x.fillRect(0, 0, 32, 32); x.fillRect(32, 32, 32, 32); x.strokeStyle = 'rgba(0,0,0,.2)'; x.strokeRect(0, 0, 64, 64); }
  else if (type === 'planks') { for (let i = 0; i < 4; i++) { x.fillStyle = C(i % 2 ? '#8a5a32' : '#7d5029'); x.fillRect(0, i * 16, TS, 16); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, i * 16, TS, 1); x.fillRect((i * 23) % 64, i * 16, 1, 16); } }
  else { x.fillStyle = C(tier ? '#5b5a57' : '#d8d2c8'); x.fillRect(0, 0, TS, TS); for (let i = 0; i < 50; i++) { x.fillStyle = `rgba(0,0,0,${rnd() * 0.12})`; x.fillRect(rnd() * 64, rnd() * 64, 2, 2); } }
  if (tier === 2) for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(20,12,6,.25)'; x.beginPath(); x.ellipse(rnd() * 64, rnd() * 64, 3 + rnd() * 8, 2 + rnd() * 5, 0, 0, 7); x.fill(); }
  return grab(c);
}

function ceiling(tier) {
  const [c, x] = mk();
  x.fillStyle = ['#fff8ea', '#1c1724', '#100d14'][tier]; x.fillRect(0, 0, TS, TS);
  x.strokeStyle = ['#e8dcc4', '#2a2433', '#1a1520'][tier]; x.lineWidth = 2; x.strokeRect(1, 1, 62, 62);
  x.fillStyle = 'rgba(0,0,0,.1)'; for (let i = 0; i < 30; i++) x.fillRect(rnd() * 62, rnd() * 62, 1, 1);
  if (tier === 0) { x.fillStyle = '#fffbe0'; x.fillRect(20, 26, 24, 12); }
  return grab(c);
}

/** Build every texture for one night. */
export function buildTextures(tier) {
  const T = { walls: {}, posters: {}, floors: {}, doors: {}, ceiling: ceiling(tier) };
  for (const th of THEME_LIST) {
    T.walls[th] = wall(th, tier);
    T.posters[th] = [0, 1, 2, 3].map(v => poster(th, tier, v));
    T.floors[th] = floor(FLOORS[th], tier);
  }
  for (const k of ['read', 'math', 'exit']) T.doors[k] = door(k, tier);
  return T;
}

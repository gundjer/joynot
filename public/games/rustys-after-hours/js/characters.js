// Original animatronic cast for "Rusty's After Hours" + their voices and lines.
export const CHARACTERS = {
  rusty: { id: 'rusty', name: 'Rusty the Raccoon', body: '#7d7368', dark: '#3b332c', belly: '#bfb4a4', eye: '#ff3b30', pitch: 0.45, rate: 0.85, heavy: 1.0,
    intro: 'I am Rusty the Raccoon. I love to play hide and seek. Ready or not, here I come!' },
  hoot: { id: 'hoot', name: 'Hoot the Owl', body: '#3f5f8f', dark: '#22324d', belly: '#d8c7a0', eye: '#ffd400', pitch: 1.8, rate: 1.05, heavy: 1.3,
    intro: 'Hoo hoo! I am Hoot the Owl. I can see in the dark. Can you?' },
  chomps: { id: 'chomps', name: 'Chomps the Gator', body: '#3d7a3a', dark: '#1f3f1d', belly: '#c9dc8a', eye: '#ff8a00', pitch: 0.1, rate: 0.75, heavy: 0.8,
    intro: 'Chomp chomp. I am Chomps the Gator. I am very, very hungry.' },
  major: { id: 'major', name: 'Major Moose', body: '#7a4a24', dark: '#3d2410', belly: '#c49a6c', eye: '#5ff', pitch: 0.7, rate: 0.7, heavy: 0.7,
    intro: 'Attention! I am Major Moose. Nobody escapes on my watch!' },
};

export const LINES = {
  near: ['I can hear you...', 'Come out, come out, wherever you are!', 'Do you want to play with me?', 'Is somebody there?', 'I smell pizza... and a kid!', 'Hee hee hee...', 'Where are you?', 'It is past bedtime...'],
  hunt: ['I see you!', 'There you are!', 'Come back here!', 'Tag, you are it!', 'You cannot hide from me!'],
  lost: ['Where did you go?', 'Hmm... I lost them.', 'You are a good hider...'],
  flashed: ['Too bright!', 'Aaah! My eyes!', 'Noooo! The light!', 'I will be back!', 'Turn that off!'],
  caught: ['Gotcha!', 'Found you!', 'Tag, you are it!'],
};

export function castForNight(night) {
  const order = ['rusty', 'hoot', 'chomps', 'major'];
  return order.slice(0, Math.min(4, night));
}

// --------- drawing (front-facing animatronic, size s = height in px) ---------
export function drawCharacter(ctx, id, cx, cy, s, t = 0, opts = {}) {
  const c = CHARACTERS[id]; if (!c) return;
  const u = s / 100; // design units: figure is ~100 tall, centred
  ctx.save(); ctx.translate(cx, cy);
  const bob = Math.sin(t * 6) * 1.5 * u * (opts.walking ? 1 : 0.3);
  ctx.translate(0, bob);
  ctx.lineJoin = 'round';

  const rr = (x, y, w, h, r, fill, stroke) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2 * u; ctx.stroke(); } };
  const circ = (x, y, r, fill, stroke) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2 * u; ctx.stroke(); } };

  // tail (behind)
  if (id === 'rusty') { for (let i = 0; i < 5; i++) circ(26 * u + i * 4 * u, 18 * u - i * 6 * u, 7 * u, i % 2 ? c.dark : c.body); }
  if (id === 'chomps') { ctx.beginPath(); ctx.moveTo(14 * u, 30 * u); ctx.quadraticCurveTo(44 * u, 40 * u, 40 * u, 10 * u); ctx.lineWidth = 9 * u; ctx.strokeStyle = c.body; ctx.stroke(); }

  // legs (with metal endoskeleton ankle)
  rr(-17 * u, 26 * u, 12 * u, 22 * u, 4 * u, c.dark); rr(5 * u, 26 * u, 12 * u, 22 * u, 4 * u, c.dark);
  rr(-14 * u, 40 * u, 6 * u, 5 * u, 1 * u, '#8a8f96'); rr(8 * u, 40 * u, 6 * u, 5 * u, 1 * u, '#8a8f96');
  rr(-20 * u, 45 * u, 17 * u, 7 * u, 3 * u, '#222'); rr(3 * u, 45 * u, 17 * u, 7 * u, 3 * u, '#222');

  // arms
  const sw = Math.sin(t * 6) * 4 * u * (opts.walking ? 1 : 0);
  rr(-33 * u, -6 * u + sw, 10 * u, 30 * u, 5 * u, c.body, c.dark); rr(23 * u, -6 * u - sw, 10 * u, 30 * u, 5 * u, c.body, c.dark);
  if (id === 'hoot') { // wings
    ctx.fillStyle = c.dark; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 24 * u, -8 * u); ctx.lineTo(sx * 40 * u, 18 * u); ctx.lineTo(sx * 26 * u, 26 * u); ctx.closePath(); ctx.fill(); }
  }
  // hands (claws)
  circ(-28 * u, 26 * u + sw, 5 * u, '#9aa0a6'); circ(28 * u, 26 * u - sw, 5 * u, '#9aa0a6');

  // body
  rr(-24 * u, -10 * u, 48 * u, 42 * u, 14 * u, c.body, c.dark);
  rr(-14 * u, -2 * u, 28 * u, 28 * u, 12 * u, c.belly);
  if (id === 'major') { // red vest + buttons
    ctx.fillStyle = '#b3261e'; ctx.beginPath(); ctx.moveTo(-24 * u, -8 * u); ctx.lineTo(-4 * u, 30 * u); ctx.lineTo(-24 * u, 30 * u); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(24 * u, -8 * u); ctx.lineTo(4 * u, 30 * u); ctx.lineTo(24 * u, 30 * u); ctx.closePath(); ctx.fill();
    circ(0, 6 * u, 2 * u, '#e7c04a'); circ(0, 16 * u, 2 * u, '#e7c04a');
  }
  // worn patch with wires
  rr(8 * u, 12 * u, 10 * u, 9 * u, 2 * u, '#2a2a2a'); ctx.strokeStyle = '#c33'; ctx.lineWidth = 1.2 * u; ctx.beginPath(); ctx.moveTo(10 * u, 14 * u); ctx.lineTo(16 * u, 19 * u); ctx.stroke();
  ctx.strokeStyle = '#3a6'; ctx.beginPath(); ctx.moveTo(16 * u, 13 * u); ctx.lineTo(11 * u, 20 * u); ctx.stroke();

  // head
  const hy = -32 * u;
  if (id === 'rusty') { // pointy ears
    ctx.fillStyle = c.body; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 10 * u, hy - 14 * u); ctx.lineTo(sx * 24 * u, hy - 30 * u); ctx.lineTo(sx * 24 * u, hy - 8 * u); ctx.closePath(); ctx.fill(); ctx.strokeStyle = c.dark; ctx.lineWidth = 2 * u; ctx.stroke(); }
  }
  if (id === 'hoot') { ctx.fillStyle = c.dark; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 8 * u, hy - 16 * u); ctx.lineTo(sx * 22 * u, hy - 30 * u); ctx.lineTo(sx * 20 * u, hy - 10 * u); ctx.closePath(); ctx.fill(); } }
  if (id === 'major') { // antlers
    ctx.strokeStyle = '#d8c39a'; ctx.lineWidth = 5 * u; ctx.lineCap = 'round';
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 12 * u, hy - 14 * u); ctx.lineTo(sx * 34 * u, hy - 30 * u); ctx.moveTo(sx * 22 * u, hy - 22 * u); ctx.lineTo(sx * 22 * u, hy - 38 * u); ctx.moveTo(sx * 30 * u, hy - 27 * u); ctx.lineTo(sx * 36 * u, hy - 40 * u); ctx.stroke(); }
  }
  circ(0, hy, 22 * u, c.body, c.dark);
  if (id === 'chomps') { // bumps + long snout
    circ(-10 * u, hy - 18 * u, 5 * u, c.dark); circ(10 * u, hy - 18 * u, 5 * u, c.dark);
    rr(-15 * u, hy + 2 * u, 30 * u, 24 * u, 6 * u, c.body, c.dark);
    ctx.fillStyle = '#f2f2e6'; ctx.beginPath();
    for (let i = 0; i < 6; i++) { const x = -13 * u + i * 5 * u; ctx.moveTo(x, hy + 14 * u); ctx.lineTo(x + 2.5 * u, hy + 19 * u); ctx.lineTo(x + 5 * u, hy + 14 * u); }
    ctx.fill();
    circ(-5 * u, hy + 6 * u, 1.6 * u, '#111'); circ(5 * u, hy + 6 * u, 1.6 * u, '#111');
  }
  if (id === 'rusty') { // raccoon mask
    ctx.fillStyle = '#1d1a17'; ctx.beginPath(); ctx.ellipse(0, hy - 2 * u, 20 * u, 8 * u, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (id === 'hoot') { circ(-9 * u, hy - 2 * u, 10 * u, '#e9e2cf', '#d08a1e'); circ(9 * u, hy - 2 * u, 10 * u, '#e9e2cf', '#d08a1e'); }

  // eyes: dark sockets + glowing pupils
  const ey = hy - 3 * u + (id === 'chomps' ? -6 * u : 0);
  const er = id === 'hoot' ? 6 * u : 5 * u;
  circ(-9 * u, ey, er, '#050505'); circ(9 * u, ey, er, '#050505');
  ctx.save(); ctx.shadowColor = c.eye; ctx.shadowBlur = 12 * u;
  circ(-9 * u, ey, er * 0.45, c.eye); circ(9 * u, ey, er * 0.45, c.eye);
  ctx.restore();

  // muzzle + jaw
  if (id !== 'chomps') {
    if (id === 'hoot') { ctx.fillStyle = '#e8a33d'; ctx.beginPath(); ctx.moveTo(-5 * u, hy + 7 * u); ctx.lineTo(5 * u, hy + 7 * u); ctx.lineTo(0, hy + 16 * u); ctx.closePath(); ctx.fill(); }
    else {
      ctx.beginPath(); ctx.ellipse(0, hy + 10 * u, 11 * u, 8 * u, 0, 0, Math.PI * 2); ctx.fillStyle = c.belly; ctx.fill();
      circ(0, hy + 5 * u, id === 'major' ? 5 * u : 3.5 * u, '#1a1a1a');
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.moveTo(-7 * u, hy + 13 * u); ctx.lineTo(7 * u, hy + 13 * u); ctx.stroke();
      ctx.fillStyle = '#eee'; for (let i = 0; i < 4; i++) ctx.fillRect(-6 * u + i * 3.4 * u, hy + 13 * u, 2.4 * u, 3 * u);
    }
  }
  // rivets
  ctx.fillStyle = '#b8bec4'; for (const [x, y] of [[-18, -6], [18, -6], [-18, 26], [18, 26]]) { ctx.beginPath(); ctx.arc(x * u, y * u, 1.6 * u, 0, 7); ctx.fill(); }
  ctx.restore();
}

// Just the glowing eyes (drawn on top of darkness so they peek out at you)
export function drawEyes(ctx, id, cx, cy, s, alpha = 1) {
  const c = CHARACTERS[id]; const u = s / 100; const hy = -32 * u;
  const ey = cy + hy - 3 * u + (id === 'chomps' ? -6 * u : 0);
  ctx.save(); ctx.globalAlpha = alpha; ctx.shadowColor = c.eye; ctx.shadowBlur = 14 * u; ctx.fillStyle = c.eye;
  for (const sx of [-9, 9]) { ctx.beginPath(); ctx.arc(cx + sx * u, ey, 2.6 * u, 0, 7); ctx.fill(); }
  ctx.restore();
}

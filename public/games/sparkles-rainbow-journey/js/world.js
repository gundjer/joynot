// Builds each stage: candy-land areas joined by gates, rainbows to collect, jelly beans, and the Rainbow Gate.
// Each stage gets a little bigger, with more locked gates and more rainbows to find.
export const T = { FLOOR: 0, WALL: 1, GATE: 2, PROP: 3 };
export const CW = 9, CH = 7;   // area cell size (8x6 inside + shared wall)

export const AREAS = {
  meadow: { name: 'Jelly Bean Meadow', floor: ['#c8f5b4', '#bdefa8'], wall: '#7ccf6a', dots: ['#ff6b9d', '#ffe066', '#6ec6ff'], props: ['flower', 'flower', 'bush'] },
  clouds: { name: 'Cotton Candy Clouds', floor: ['#e9f6ff', '#dff1ff'], wall: '#ffb3d9', dots: ['#ffffff', '#ffd1ec'], props: ['cloud', 'cloud', 'cottoncandy'] },
  gumdrop: { name: 'Gumdrop Garden', floor: ['#ffe9c7', '#ffe2b8'], wall: '#ff9d6b', dots: ['#ff6b6b', '#6be675', '#b388ff'], props: ['gumdrop', 'gumdrop', 'flower'] },
  lollipop: { name: 'Lollipop Forest', floor: ['#d9f7e8', '#ccf2de'], wall: '#4dc79a', dots: ['#ff6b9d', '#ffb347'], props: ['lollipop', 'lollipop', 'bush'] },
  beach: { name: 'Sprinkle Beach', floor: ['#fff4cf', '#ffefbd'], wall: '#6ec6ff', dots: ['#ff6b9d', '#6ec6ff', '#6be675', '#ffb347'], props: ['shell', 'umbrella', 'shell'] },
  cupcake: { name: 'Cupcake Cottage', floor: ['#ffe3f0', '#ffd8ea'], wall: '#c58a5c', dots: ['#ffffff', '#ff6b9d'], props: ['cupcake', 'cupcake', 'table'] },
  pond: { name: 'Bubblegum Pond', floor: ['#e0f3ff', '#d4eeff'], wall: '#ff8fc7', dots: ['#ffffff', '#b388ff'], props: ['lily', 'bubble', 'lily'] },
  castle: { name: 'Candy Castle', floor: ['#efe4ff', '#e6d8ff'], wall: '#b388ff', dots: ['#ffe066', '#ffffff'], props: ['tower', 'cupcake', 'tower'] },
};
const AREA_KEYS = Object.keys(AREAS);
export const BEAN_COLORS = ['#ff4f6d', '#ff9f1c', '#ffd60a', '#38d26f', '#2fb5ff', '#9b5cff', '#ff70c8'];

const rnd = n => Math.floor(Math.random() * n);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** How big / hard each stage is. */
export function stagePlan(stage) {
  const size = stage === 1 ? [3, 2] : stage === 2 ? [3, 3] : stage <= 4 ? [4, 3] : stage <= 7 ? [5, 3] : [5, 4];
  return {
    size,
    rainbows: stage === 1 ? 2 : stage <= 3 ? 3 : stage <= 6 ? 4 : 5,
    lockChance: Math.min(0.85, 0.5 + 0.06 * (stage - 1)),
    loops: stage === 1 ? 1 : 2,
  };
}

export function buildStage(stage, settings = {}) {
  const plan = stagePlan(stage);
  const [RW, RH] = plan.size;
  const W = RW * CW + 1, H = RH * CH + 1;
  const tiles = new Uint8Array(W * H).fill(T.WALL);
  const w = { stage, RW, RH, W, H, tiles, rooms: [], gates: [], gateAt: new Map(), props: [], items: [], sparkles: [] };
  const set = (x, y, v) => { tiles[y * W + x] = v; };

  // areas
  const themes = shuffle([...AREA_KEYS]);
  for (let ry = 0; ry < RH; ry++) for (let rx = 0; rx < RW; rx++) {
    const id = w.rooms.length, theme = themes[id % themes.length];
    const room = { id, rx, ry, x0: rx * CW + 1, y0: ry * CH + 1, x1: rx * CW + CW - 1, y1: ry * CH + CH - 1, theme, name: AREAS[theme].name, visited: false, adj: [] };
    w.rooms.push(room);
    for (let y = room.y0; y <= room.y1; y++) for (let x = room.x0; x <= room.x1; x++) set(x, y, T.FLOOR);
  }
  const R = (rx, ry) => w.rooms[ry * RW + rx];
  const start = [R(0, 0), R(RW - 1, 0), R(0, RH - 1), R(RW - 1, RH - 1)][rnd(4)];

  // maze of areas (random tree + a few loops so there is more than one way)
  const edges = new Set(); const key = (a, b) => a < b ? `${a}-${b}` : `${b}-${a}`;
  const seen = new Set([start.id]); const stack = [start];
  const nbrs = r => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [r.rx + dx, r.ry + dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < RW && y < RH).map(([x, y]) => R(x, y));
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const opts = nbrs(cur).filter(n => !seen.has(n.id));
    if (!opts.length) { stack.pop(); continue; }
    const nx = opts[rnd(opts.length)]; seen.add(nx.id); edges.add(key(cur.id, nx.id)); stack.push(nx);
  }
  for (let i = 0, tries = 0; i < plan.loops && tries < 50; tries++) {
    const r = w.rooms[rnd(w.rooms.length)], ns = nbrs(r), n = ns[rnd(ns.length)];
    if (n && !edges.has(key(r.id, n.id))) { edges.add(key(r.id, n.id)); i++; }
  }

  // gates between areas: some open, some need reading or math
  const focus = settings.focus || 'both';
  const kindFor = () => focus === 'reading' ? (Math.random() < 0.8 ? 'read' : 'math') : focus === 'math' ? (Math.random() < 0.8 ? 'math' : 'read') : (Math.random() < 0.5 ? 'read' : 'math');
  for (const e of edges) {
    const [a, b] = e.split('-').map(Number); const A = w.rooms[a], B = w.rooms[b];
    const gate = { id: w.gates.length, rooms: [a, b], tiles: [], open: false, kind: null, item: null };
    if (A.ry === B.ry) { const L = A.rx < B.rx ? A : B; const x = (L.rx + 1) * CW; gate.orient = 'v'; gate.tiles = [[x, L.ry * CH + 3], [x, L.ry * CH + 4]]; }
    else { const T0 = A.ry < B.ry ? A : B; const y = (T0.ry + 1) * CH; gate.orient = 'h'; gate.tiles = [[T0.rx * CW + 4, y], [T0.rx * CW + 5, y]]; }
    const locked = Math.random() < plan.lockChance;
    gate.kind = locked ? kindFor() : null;
    gate.open = !locked;
    A.adj.push(B.id); B.adj.push(A.id);
    addGate(w, gate);
  }

  // distance from start
  const dist = new Map([[start.id, 0]]); const q = [start];
  while (q.length) { const r = q.shift(); for (const n of r.adj) if (!dist.has(n)) { dist.set(n, dist.get(r.id) + 1); q.push(w.rooms[n]); } }
  w.rooms.forEach(r => r.dist = dist.get(r.id) ?? 0);

  // Rainbow Gate on the outside edge of the farthest outer area
  const outer = w.rooms.filter(r => r.rx === 0 || r.ry === 0 || r.rx === RW - 1 || r.ry === RH - 1);
  const exitRoom = outer.filter(r => r.id !== start.id).sort((a, b) => b.dist - a.dist)[0];
  const sides = [];
  if (exitRoom.ry === 0) sides.push('top'); if (exitRoom.ry === RH - 1) sides.push('bottom');
  if (exitRoom.rx === 0) sides.push('left'); if (exitRoom.rx === RW - 1) sides.push('right');
  const side = sides[rnd(sides.length)];
  const ex = { id: w.gates.length, rooms: [exitRoom.id], tiles: [], open: false, kind: 'exit', item: null, exit: true, side };
  if (side === 'top') { ex.orient = 'h'; ex.tiles = [[exitRoom.rx * CW + 4, 0], [exitRoom.rx * CW + 5, 0]]; }
  if (side === 'bottom') { ex.orient = 'h'; ex.tiles = [[exitRoom.rx * CW + 4, H - 1], [exitRoom.rx * CW + 5, H - 1]]; }
  if (side === 'left') { ex.orient = 'v'; ex.tiles = [[0, exitRoom.ry * CH + 3], [0, exitRoom.ry * CH + 4]]; }
  if (side === 'right') { ex.orient = 'v'; ex.tiles = [[W - 1, exitRoom.ry * CH + 3], [W - 1, exitRoom.ry * CH + 4]]; }
  addGate(w, ex);
  w.exit = ex; w.exitRoom = exitRoom; w.start = start;

  // decorations in the corners only, so the middle "+" path is always open
  const quads = [[[0, 0], [1, 0]], [[6, 0], [7, 0]], [[0, 5], [1, 5]], [[6, 5], [7, 5]]];
  const freeSpots = [[1, 1], [2, 1], [5, 1], [6, 1], [1, 4], [2, 4], [5, 4], [6, 4], [3, 1], [4, 4], [2, 3], [5, 2], [3, 4], [4, 1]];
  for (const room of w.rooms) {
    shuffle([0, 1, 2, 3]).forEach((qi, idx) => {
      if (idx > 2 || Math.random() > 0.8) return;
      const [[ax, ay], [bx, by]] = quads[qi];
      const type = AREAS[room.theme].props[rnd(3)];
      const cell = qi % 2 === 0 ? [ax, ay] : [bx, by];
      set(room.x0 + cell[0], room.y0 + cell[1], T.PROP);
      w.props.push({ type, x: room.x0 + cell[0], y: room.y0 + cell[1], room: room.id, v: rnd(4) });
    });
    room.free = shuffle(freeSpots.map(([fx, fy]) => [room.x0 + fx, room.y0 + fy]).filter(([x, y]) => tiles[y * W + x] === T.FLOOR));
  }

  // rainbows in the far areas, jelly beans everywhere
  w.rainbowsNeeded = Math.min(plan.rainbows, w.rooms.length - 1);
  const far = w.rooms.filter(r => r !== start).sort((a, b) => b.dist - a.dist);
  far.slice(0, w.rainbowsNeeded).forEach(r => { const p = r.free.pop(); w.items.push({ type: 'rainbow', x: p[0] + 0.5, y: p[1] + 0.5 }); });
  w.rooms.forEach(r => {
    const n = r === start ? 2 : 3;
    for (let k = 0; k < n && r.free.length; k++) { const p = r.free.pop(); w.items.push({ type: 'bean', x: p[0] + 0.5, y: p[1] + 0.5, c: BEAN_COLORS[rnd(BEAN_COLORS.length)], rot: Math.random() * 3 }); }
  });

  w.startPos = { x: start.x0 + 4, y: start.y0 + 3 };
  start.visited = true;
  return w;
}

function addGate(w, gate) {
  w.gates.push(gate);
  for (const [x, y] of gate.tiles) { w.tiles[y * w.W + x] = T.GATE; w.gateAt.set(y * w.W + x, gate); }
}

export function tileAt(w, x, y) { if (x < 0 || y < 0 || x >= w.W || y >= w.H) return T.WALL; return w.tiles[y * w.W + x]; }
export function gateAtTile(w, x, y) { return w.gateAt.get(y * w.W + x); }
export function solid(w, x, y) {
  const t = tileAt(w, x, y);
  if (t === T.FLOOR) return false;
  if (t === T.GATE) return !gateAtTile(w, x, y).open;
  return true;
}
export function roomAt(w, x, y) {
  const rx = Math.floor(x / CW), ry = Math.floor(y / CH);
  if (rx < 0 || ry < 0 || rx >= w.RW || ry >= w.RH) return null;
  const r = w.rooms[ry * w.RW + rx];
  return (x >= r.x0 && x < r.x1 + 1 && y >= r.y0 && y < r.y1 + 1) ? r : null;
}

// Builds the dark building for each night: rooms, doors, gates, hiding spots, items.
export const T = { FLOOR: 0, WALL: 1, DOOR: 2, PROP: 3, HIDE: 4 };
export const CW = 9, CH = 7;   // room cell size (8x6 inside + shared wall)

const THEMES = ['dining', 'arcade', 'kitchen', 'parts', 'office', 'storage', 'party', 'stage'];
const THEME_NAMES = { dining: 'Dining Room', arcade: 'Arcade', kitchen: 'Kitchen', parts: 'Parts & Service', office: 'Security Office', storage: 'Storage Room', party: 'Party Room', stage: 'Show Stage' };
const PROPS = {
  dining: ['table', 'table', 'table'], party: ['table', 'presents', 'table'], arcade: ['arcade', 'arcade', 'prize'],
  kitchen: ['counter', 'stove', 'fridge'], parts: ['shelf', 'heads', 'crate'], office: ['desk', 'cabinet', 'desk'],
  storage: ['crate', 'crate', 'shelf'], stage: ['stage', 'stage', 'speaker'],
};
const HIDES = { dining: 'table', party: 'table', arcade: 'cabinet', kitchen: 'locker', parts: 'locker', office: 'locker', storage: 'box', stage: 'curtain' };

const rnd = n => Math.floor(Math.random() * n);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function buildNight(night, settings = {}) {
  const [RW, RH] = night === 1 ? [3, 2] : night === 2 ? [3, 3] : night <= 4 ? [4, 3] : [5, 3];
  const W = RW * CW + 1, H = RH * CH + 1;
  const tiles = new Uint8Array(W * H).fill(T.WALL);
  const w = { night, RW, RH, W, H, tiles, rooms: [], doors: [], doorAt: new Map(), props: [], hides: [], items: [], decor: [] };
  const set = (x, y, v) => { tiles[y * W + x] = v; };

  // rooms
  const themes = ['dining', 'stage', 'arcade', ...shuffle(THEMES.filter(t => !['dining', 'stage', 'arcade'].includes(t)))];
  for (let ry = 0; ry < RH; ry++) for (let rx = 0; rx < RW; rx++) {
    const id = w.rooms.length;
    const theme = themes[id % themes.length];
    const room = { id, rx, ry, x0: rx * CW + 1, y0: ry * CH + 1, x1: rx * CW + CW - 1, y1: ry * CH + CH - 1, theme, name: THEME_NAMES[theme], visited: false, adj: [] };
    w.rooms.push(room);
    for (let y = room.y0; y <= room.y1; y++) for (let x = room.x0; x <= room.x1; x++) set(x, y, T.FLOOR);
  }
  const R = (rx, ry) => w.rooms[ry * RW + rx];

  // Begin in dining, with the show stage next door as the first visual clue.
  const start = R(0, 0);

  // spanning tree (random DFS) + a couple of loops
  const edges = new Set(); const key = (a, b) => a < b ? `${a}-${b}` : `${b}-${a}`;
  const seen = new Set([start.id]); const stack = [start];
  const nbrs = r => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [r.rx + dx, r.ry + dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < RW && y < RH).map(([x, y]) => R(x, y));
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const opts = nbrs(cur).filter(n => !seen.has(n.id));
    if (!opts.length) { stack.pop(); continue; }
    const nx = opts[rnd(opts.length)]; seen.add(nx.id); edges.add(key(cur.id, nx.id)); stack.push(nx);
  }
  edges.add(key(start.id, R(1, 0).id));
  const extra = night === 1 ? 1 : 2;
  for (let i = 0, tries = 0; i < extra && tries < 50; tries++) {
    const r = w.rooms[rnd(w.rooms.length)], n = nbrs(r)[rnd(nbrs(r).length)];
    if (n && !edges.has(key(r.id, n.id))) { edges.add(key(r.id, n.id)); i++; }
  }

  // doors
  const pLock = night === 1 ? 0.6 : 0.72;
  const focus = settings.focus || 'both';
  const kindFor = () => focus === 'reading' ? (Math.random() < 0.8 ? 'read' : 'math') : focus === 'math' ? (Math.random() < 0.8 ? 'math' : 'read') : (Math.random() < 0.5 ? 'read' : 'math');
  for (const e of edges) {
    const [a, b] = e.split('-').map(Number); const A = w.rooms[a], B = w.rooms[b];
    const door = { id: w.doors.length, rooms: [a, b], tiles: [], open: false, locked: false, kind: null, item: null };
    if (A.ry === B.ry) { const L = A.rx < B.rx ? A : B; const x = (L.rx + 1) * CW; door.orient = 'v'; door.tiles = [[x, L.ry * CH + 3], [x, L.ry * CH + 4]]; }
    else { const T0 = A.ry < B.ry ? A : B; const y = (T0.ry + 1) * CH; door.orient = 'h'; door.tiles = [[T0.rx * CW + 4, y], [T0.rx * CW + 5, y]]; }
    door.locked = Math.random() < pLock;
    if (a === start.id && b === R(1, 0).id) door.locked = false;
    door.kind = door.locked ? kindFor() : null;
    door.open = !door.locked;
    A.adj.push(B.id); B.adj.push(A.id);
    addDoor(w, door);
  }

  // distances from start (room graph)
  const dist = new Map([[start.id, 0]]); const q = [start];
  while (q.length) { const r = q.shift(); for (const n of r.adj) if (!dist.has(n)) { dist.set(n, dist.get(r.id) + 1); q.push(w.rooms[n]); } }
  w.rooms.forEach(r => r.dist = dist.get(r.id) ?? 0);

  // exit on the outside wall of the farthest outer room
  const outer = w.rooms.filter(r => r.rx === 0 || r.ry === 0 || r.rx === RW - 1 || r.ry === RH - 1);
  const exitRoom = outer.filter(r => r.id !== start.id).sort((a, b) => b.dist - a.dist)[0];
  const sides = [];
  if (exitRoom.ry === 0) sides.push('top'); if (exitRoom.ry === RH - 1) sides.push('bottom');
  if (exitRoom.rx === 0) sides.push('left'); if (exitRoom.rx === RW - 1) sides.push('right');
  const side = sides[rnd(sides.length)];
  const ex = { id: w.doors.length, rooms: [exitRoom.id], tiles: [], open: false, locked: true, kind: 'exit', item: null, exit: true };
  if (side === 'top') { ex.orient = 'h'; ex.tiles = [[exitRoom.rx * CW + 4, 0], [exitRoom.rx * CW + 5, 0]]; }
  if (side === 'bottom') { ex.orient = 'h'; ex.tiles = [[exitRoom.rx * CW + 4, H - 1], [exitRoom.rx * CW + 5, H - 1]]; }
  if (side === 'left') { ex.orient = 'v'; ex.tiles = [[0, exitRoom.ry * CH + 3], [0, exitRoom.ry * CH + 4]]; }
  if (side === 'right') { ex.orient = 'v'; ex.tiles = [[W - 1, exitRoom.ry * CH + 3], [W - 1, exitRoom.ry * CH + 4]]; }
  ex.side = side;
  addDoor(w, ex);
  w.exit = ex; w.exitRoom = exitRoom; w.start = start;

  // furniture + hiding spots (only in the 4 corners, so the middle "+" path is always open)
  const quads = [[[0, 0], [1, 0]], [[6, 0], [7, 0]], [[0, 5], [1, 5]], [[6, 5], [7, 5]]];
  const freeSpots = [[1, 1], [2, 1], [5, 1], [6, 1], [1, 4], [2, 4], [5, 4], [6, 4], [3, 1], [4, 4], [2, 3], [5, 2]];
  for (const room of w.rooms) {
    const qorder = shuffle([0, 1, 2, 3]);
    const nHide = room === start ? 1 : (night >= 3 && Math.random() < 0.4 ? 2 : 1);
    qorder.forEach((qi, idx) => {
      const [[ax, ay], [bx, by]] = quads[qi];
      if (idx < nHide) {
        const x = room.x0 + (qi % 2 === 0 ? ax : bx), y = room.y0 + ay;
        set(x, y, T.HIDE); w.hides.push({ x, y, type: HIDES[room.theme], room: room.id });
      } else if (Math.random() < 0.85) {
        const type = PROPS[room.theme][rnd(3)];
        const wide = ['table', 'counter', 'stage', 'shelf', 'desk', 'arcade'].includes(type) && Math.random() < 0.6;
        const cells = wide ? [[ax, ay], [bx, by]] : [qi % 2 === 0 ? [ax, ay] : [bx, by]];
        cells.forEach(([cx, cy]) => set(room.x0 + cx, room.y0 + cy, T.PROP));
        w.props.push({ type, x: room.x0 + cells[0][0], y: room.y0 + cells[0][1], w: cells.length, room: room.id });
      }
    });
    room.free = shuffle(freeSpots.map(([fx, fy]) => [room.x0 + fx, room.y0 + fy]).filter(([x, y]) => tiles[y * W + x] === T.FLOOR));
    // wall posters
    if (Math.random() < 0.7) w.decor.push({ type: 'poster', x: room.x0 + 1 + rnd(6), y: room.y0 - 1, room: room.id, v: rnd(4) });
  }

  // items: power cells far away, batteries, tokens
  w.cellsNeeded = night === 1 ? 2 : 3;
  const far = w.rooms.filter(r => r !== start && r !== exitRoom).sort((a, b) => b.dist - a.dist);
  const cellRooms = far.slice(0, w.cellsNeeded);
  while (cellRooms.length < w.cellsNeeded) cellRooms.push(exitRoom);
  cellRooms.forEach(r => { const p = r.free.pop(); w.items.push({ type: 'cell', x: p[0] + 0.5, y: p[1] + 0.5 }); });
  w.rooms.forEach((r, i) => {
    if (r !== start && i % 2 === 0 && r.free.length) { const p = r.free.pop(); w.items.push({ type: 'battery', x: p[0] + 0.5, y: p[1] + 0.5 }); }
    for (let k = 0; k < 3 && r.free.length; k++) { const p = r.free.pop(); w.items.push({ type: 'coin', x: p[0] + 0.5, y: p[1] + 0.5 }); }
  });

  w.startPos = { x: start.x0 + 4, y: start.y0 + 3 };
  start.visited = true;
  return w;
}

function addDoor(w, door) {
  w.doors.push(door);
  for (const [x, y] of door.tiles) { w.tiles[y * w.W + x] = T.DOOR; w.doorAt.set(y * w.W + x, door); }
}

export function tileAt(w, x, y) { if (x < 0 || y < 0 || x >= w.W || y >= w.H) return T.WALL; return w.tiles[y * w.W + x]; }
export function doorAtTile(w, x, y) { return w.doorAt.get(y * w.W + x); }

export function solidForPlayer(w, x, y) {
  const t = tileAt(w, x, y);
  if (t === T.FLOOR) return false;
  if (t === T.DOOR) return !doorAtTile(w, x, y).open;
  return true;
}
export function passableForMonster(w, x, y) {
  const t = tileAt(w, x, y);
  if (t === T.FLOOR) return true;
  if (t === T.DOOR) { const d = doorAtTile(w, x, y); return !d.exit; }
  return false;
}
export function blocksLight(w, x, y) {
  const t = tileAt(w, x, y);
  if (t === T.WALL) return true;
  if (t === T.DOOR) return !doorAtTile(w, x, y).open;
  return false;
}

export function roomAt(w, x, y) {
  const rx = Math.floor(x / CW), ry = Math.floor(y / CH);
  if (rx < 0 || ry < 0 || rx >= w.RW || ry >= w.RH) return null;
  const r = w.rooms[ry * w.RW + rx];
  if (x >= r.x0 && x < r.x1 + 1 && y >= r.y0 && y < r.y1 + 1) return r;
  return null;
}

export function lineOfSight(w, x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy); const steps = Math.ceil(d / 0.2);
  for (let i = 1; i < steps; i++) { const x = x0 + dx * i / steps, y = y0 + dy * i / steps; if (blocksLight(w, Math.floor(x), Math.floor(y))) return false; }
  return true;
}

// BFS path on tiles for animatronics
export function findPath(w, sx, sy, tx, ty, maxNodes = 4000) {
  sx |= 0; sy |= 0; tx |= 0; ty |= 0;
  if (sx === tx && sy === ty) return [];
  const W = w.W, prev = new Int32Array(w.W * w.H).fill(-1);
  const s = sy * W + sx, t = ty * W + tx; prev[s] = s;
  const q = [s]; let head = 0;
  while (head < q.length && head < maxNodes) {
    const c = q[head++]; if (c === t) break;
    const cx = c % W, cy = (c / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy, n = ny * W + nx;
      if (nx < 0 || ny < 0 || nx >= W || ny >= w.H || prev[n] !== -1) continue;
      if (!passableForMonster(w, nx, ny) && n !== t) continue;
      prev[n] = c; q.push(n);
    }
  }
  if (prev[t] === -1) return null;
  const path = []; let c = t;
  while (c !== s) { path.push([c % W + 0.5, ((c / W) | 0) + 0.5]); c = prev[c]; }
  return path.reverse();
}

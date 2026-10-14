// Bee Smart co-op, kid's side: grown-ups join from the Grown-ups page on their own phones and play as Guard Bees.
// They can shoo hornets, plant flowers, make a flower golden, cheer, light up a hint (never the answer) and help fan
// honey. The kid still does every puzzle, so the reports stay honest (a grown-up's hint is logged as "helped").
import { CoopLink } from '../_play/coop-link.js';
import { Store } from '../_play/play.js';

const COOL = { shoo: 2.5, plant: 10, gold: 1, hint: 8, cheer: 3 };
const R = n => Math.round(n);

export function coopHost(api, hooks) {
  const CFG = window.JOYNOT || {}, url = CFG.urls && CFG.urls.coop;
  const G = new Map();
  let link = null, opening = false, world = null, stT = 0, t = 0, trip = 0;
  const key = `joynot_coop_${CFG.game}_${CFG.kid && CFG.kid.id}`;
  const ss = { get() { try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch (e) { return null; } }, set(v) { try { sessionStorage.setItem(key, JSON.stringify(v)); } catch (e) {} } };

  async function open() {
    if (!url || opening || link) return;
    opening = true;
    try {
      const prev = ss.get() || {};
      const r = await fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': Store.csrf || document.querySelector('meta[name="csrf-token"]')?.content || '' }, body: JSON.stringify({ world: world ? world.name : null, session: prev.session || null, token: prev.token || null }) });
      if (!r.ok) return;
      const j = await r.json();
      ss.set({ session: j.session, token: j.token });
      link = new CoopLink({ urls: j.urls, token: j.token, role: 'host', csrf: Store.csrf, onMsg, onMembers, onLink: () => {}, onEnded: () => { link = null; G.clear(); } });
      link.start();
      addEventListener('pagehide', () => link && link.end());
    } catch (e) {} finally { opening = false; }
  }
  function guard(token, name, color) {
    let g = G.get(token);
    if (!g) { g = { token, name: name || 'Grown-up', color: color || '#8b6cff', x: 0, y: 0, tx: null, ty: null, busy: 0, fan: false, cool: {}, plants: 0, golds: 0, trip }; G.set(token, g); const S = hooks.state(); if (S) { g.x = S.bee.x - 80; g.y = S.bee.y - 60; } }
    if (name) g.name = name; if (color) g.color = color;
    return g;
  }
  const ready = (g, k) => { if ((g.cool[k] || 0) > t) return false; g.cool[k] = t + COOL[k]; return true; };
  function onMsg(from, b) {
    if (b.t === 'join') { const isNew = !G.has(from); const g = guard(from, b.name, b.color); if (isNew) hooks.joined(g); link.connect(from); return; }
    const g = G.get(from); if (!g) return;
    if (g.trip !== trip) { g.trip = trip; g.plants = 0; g.golds = 0; }
    if (b.t === 'leave') { G.delete(from); link.drop(from); hooks.left(g); return; }
    if (b.t === 'shoo' && ready(g, 'shoo')) hooks.shoo(b.id, g);
    if (b.t === 'plant' && g.plants < 3 && ready(g, 'plant')) { g.plants++; hooks.plant(+b.x, +b.y, g); }
    if (b.t === 'gold' && g.golds < 1 && ready(g, 'gold')) { g.golds++; hooks.gold(b.id, g); }
    if (b.t === 'hint' && ready(g, 'hint')) hooks.hint(g);
    if (b.t === 'cheer' && ready(g, 'cheer')) hooks.cheer(g);
    if (b.t === 'fan') g.fan = !!b.on;
  }
  function onMembers(list) {
    const live = new Set(list.map(m => m.token));
    for (const m of list) if (!G.has(m.token)) { guard(m.token, m.name, m.color); link.connect(m.token); }
    for (const [k, g] of G) if (!live.has(k)) { G.delete(k); link.drop(k); hooks.left(g); }
  }
  function snapshot() {
    const S = hooks.state(); if (!S) return { mode: 'menu' };
    const hz = S.hz, bd = hz.bird, tr = hz.spray.tr;
    return {
      w: S.world.id, seed: S.seed, mode: S.mode, kid: CFG.kid ? CFG.kid.name : 'Kid', hearts: api.hearts(), need: S.need, done: S.done,
      bee: [R(S.bee.x), R(S.bee.y), S.bee.face, (api.state.extra.bee || {}).hat || ''],
      fl: S.flowers.map(f => [f.id, R(f.x), R(f.y), f.e, f.st === 'open' ? 1 : 0, f.gold ? 1 : 0, f.fruit || '']),
      hz: hz.list.filter(h => !h.gone).map(h => [h.id, R(h.x), R(h.y), h.face, h.flee > 0 ? 1 : 0, h.raid ? 1 : 0]),
      bird: bd.active ? [R(bd.x), R(bd.y), bd.dir] : null,
      clouds: hz.clouds.map(c => [R(c.x), R(c.y), c.r]), tr: tr && tr.warn <= 0 ? [R(tr.x), R(tr.y), tr.dir] : null,
      coach: S.mode === 'chal' && S.chal ? S.chal.coach() : null,
      hive: S.mode === 'hive' && S.hive ? { step: S.hive.H.step, fan: Math.round(S.hive.H.fan * 100) / 100 } : null,
      g: [...G.values()].map(g => [g.token, g.name, g.color, R(g.x), R(g.y)]),
    };
  }
  return {
    start(w) { world = w; trip++; if (!link) open(); },
    tick(dt) {
      t += dt;
      const S = hooks.state();
      if (S) {
        let i = 0;
        for (const g of G.values()) {
          g.busy = Math.max(0, g.busy - dt);
          let tx = g.tx, ty = g.ty;
          if (!g.busy || tx == null) { const a = t * 1.3 + i * 2.1; tx = S.bee.x + Math.cos(a) * 95; ty = S.bee.y + Math.sin(a) * 70; g.tx = null; }
          g.x += (tx - g.x) * Math.min(1, dt * 4); g.y += (ty - g.y) * Math.min(1, dt * 4); i++;
        }
      }
      if (link && G.size) { stT -= dt; if (stT <= 0) { stT = 0.1; link.setState(snapshot()); } }
    },
    event() { stT = 0; },
    stop() {},
    count: () => G.size,
    fanning: () => [...G.values()].some(g => g.fan),
    guards: () => [...G.values()],
    flyTo(g, x, y) { if (!g) return; g.tx = x; g.ty = y; g.busy = 2.2; },
    _link: () => link, _snapshot: snapshot,
  };
}

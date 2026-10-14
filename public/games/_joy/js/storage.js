// Saves progress on the device (localStorage) AND on JoyNot — one save per kid per game.
// The page tells us who is playing (window.JOYNOT) and which game this is (window.JOY_GAME).
const CFG = window.JOYNOT || { game: 'demo', kid: { id: 0, name: 'Player', avatar: '🦊', color: '#ff9d3d' }, urls: {} };
const GAME = window.JOY_GAME || { defaults: {}, levels: [{ name: 'Level 1', grade: 'K' }] };
const QKEY = `joynot_${CFG.game}_queue_v1`;
const keyFor = id => `joynot_${CFG.game}_kid_${id}_v1`;
const attemptsUrl = id => String(CFG.urls.attempts || '').replace('__KID__', encodeURIComponent(id));

export function defaults() {
  return {
    name: 'Player',
    level: 1, history: [], recent: [],
    stars: 0, bestStreak: 0,
    settings: { ...(GAME.defaults || {}) },
    stats: { right: 0, wrong: 0, helped: 0, questions: 0, rounds: 0, perfect: 0 },
    extra: {},
    updatedAt: 0, parentEditAt: 0, seenParentEditAt: 0,
  };
}

function merge(base, over) {
  if (!over || typeof over !== 'object' || Array.isArray(over)) return over ?? base;
  const out = { ...base };
  for (const k of Object.keys(over)) {
    const b = base ? base[k] : undefined, o = over[k];
    out[k] = (b && typeof b === 'object' && !Array.isArray(b) && o && typeof o === 'object' && !Array.isArray(o)) ? merge(b, o) : o;
  }
  return out;
}

// PHP turns empty {} into [] — put objects back so the game keeps working
function sanitize(d) {
  const def = defaults();
  for (const k of ['settings', 'stats', 'extra']) if (!d[k] || typeof d[k] !== 'object' || Array.isArray(d[k])) d[k] = def[k];
  d.settings = { ...def.settings, ...d.settings };
  if (!Array.isArray(d.history)) d.history = [];
  if (!Array.isArray(d.recent)) d.recent = [];
  const max = (GAME.levels || []).length || 1;
  d.level = Math.max(1, Math.min(max, parseInt(d.level, 10) || 1));
  d.stars = Math.max(0, parseInt(d.stars, 10) || 0);
  return d;
}

const readJSON = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

export const Store = {
  data: defaults(),
  playerId: null,
  player: null,
  config: CFG,
  csrf: document.querySelector('meta[name="csrf-token"]')?.content || '',
  onExternalChange: null,

  async load(kid = CFG.kid) {
    this.playerId = kid.id; this.player = kid;
    const local = readJSON(keyFor(kid.id));
    let server = null, online = false;
    try {
      const r = await fetch(CFG.urls.progress, { headers: { Accept: 'application/json' }, credentials: 'same-origin', cache: 'no-store' });
      if (r.status === 401 || (r.redirected && /\/login/.test(r.url))) { location.href = '/login'; return { offline: false }; }
      if (r.ok) { const j = await r.json(); online = true; if (j.csrf) this.csrf = j.csrf; server = j.state; if (j.kid) this.player = j.kid; }
    } catch (e) {}
    let pick = local;
    if (server && (!local || (server.updatedAt || 0) > (local.updatedAt || 0) || (server.parentEditAt || 0) > (local.seenParentEditAt || 0))) pick = server;
    this.data = sanitize(merge(defaults(), pick || {}));
    this.data.seenParentEditAt = this.data.parentEditAt || 0;
    this.data.name = this.player.name;
    delete this.data.reset;
    this.persistLocal();
    if (online && local && pick === local) this.push();
    this.flushQueue();
    return { offline: !online };
  },

  persistLocal() { if (this.playerId !== null) writeJSON(keyFor(this.playerId), this.data); },

  save() {
    if (this.playerId === null) return;
    this.data.updatedAt = Date.now();
    this.persistLocal();
    clearTimeout(this._t); this._t = setTimeout(() => this.push(), 1500);
  },

  async post(url, body, retry = true) {
    const r = await fetch(url, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': this.csrf },
      body: JSON.stringify(body),
    });
    if (r.status === 419 && retry) { await this.refreshCsrf(); return this.post(url, body, false); }
    return r;
  },
  async refreshCsrf() {
    try { const r = await fetch(CFG.urls.progress, { headers: { Accept: 'application/json' }, credentials: 'same-origin', cache: 'no-store' }); const j = await r.json(); this.csrf = j.csrf || this.csrf; } catch (e) {}
  },

  async push() {
    const id = this.playerId; if (id === null || !CFG.urls.save) return;
    try {
      const r = await this.post(CFG.urls.save, { state: this.data });
      if (r.ok && id === this.playerId) {
        const j = await r.json();
        if (j.stale && j.state) { // a grown-up changed this kid's settings
          this.data = sanitize(merge(defaults(), j.state));
          this.data.seenParentEditAt = this.data.parentEditAt || 0;
          this.data.name = this.player.name;
          delete this.data.reset;
          this.persistLocal();
          this.onExternalChange && this.onExternalChange();
        }
      }
    } catch (e) {}
  },

  async flushNow() {
    clearTimeout(this._t); clearTimeout(this._qt);
    await Promise.race([Promise.all([this.push(), this.flushQueue()]), new Promise(r => setTimeout(r, 2500))]);
  },

  beacon() {
    if (this.playerId === null || !CFG.urls.save) return;
    try {
      fetch(CFG.urls.save, {
        method: 'POST', keepalive: true, credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': this.csrf },
        body: JSON.stringify({ state: this.data }),
      }).catch(() => {});
    } catch (e) {}
  },

  // ---------- answer log ----------
  logAttempt(a) {
    if (this.playerId === null) return;
    let q = readJSON(QKEY) || [];
    q.push({ ...a, kid_id: this.playerId }); if (q.length > 500) q = q.slice(-500);
    writeJSON(QKEY, q);
    clearTimeout(this._qt); this._qt = setTimeout(() => this.flushQueue(), 2000);
  },
  async flushQueue() {
    const q = readJSON(QKEY) || [];
    if (!q.length || this._flushing || !CFG.urls.attempts) return;
    this._flushing = true;
    const groups = {};
    q.forEach(a => { (groups[a.kid_id] = groups[a.kid_id] || []).push(a); });
    const keep = [];
    for (const [kid, list] of Object.entries(groups)) {
      try {
        const r = await this.post(attemptsUrl(kid), { attempts: list.map(({ kid_id, ...rest }) => rest) });
        if (!(r.ok || [403, 404, 422].includes(r.status))) keep.push(...list);
      } catch (e) { keep.push(...list); }
    }
    const now = readJSON(QKEY) || [];
    writeJSON(QKEY, [...keep, ...now.slice(q.length)]);
    this._flushing = false;
  },
};

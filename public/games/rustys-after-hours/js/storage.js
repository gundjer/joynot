// Saves progress on the device (localStorage) AND on JoyNot — one save per kid.
// The page tells us who is playing in window.JOYNOT (see resources/views/games/rustys-after-hours/play.blade.php).
const CFG = window.JOYNOT || { game: 'rustys-after-hours', kid: { id: 0, name: 'Player', avatar: '🦊', color: '#ff9d3d' }, urls: {} };
const QKEY = `joynot_${CFG.game}_queue_v1`;
const keyFor = id => `joynot_${CFG.game}_kid_${id}_v1`;
const attemptsUrl = id => String(CFG.urls.attempts || '').replace('__KID__', encodeURIComponent(id));

export function defaults() {
  return {
    name: 'Player',
    reading: { level: 1, history: [], missed: {}, recent: [] },
    math: { level: 1, history: [], missed: {}, recent: [] },
    night: 1, tokens: 0, bestStreak: 0,
    // level-up cycle: 0 night → 1 workshop → 2 hallway run → 3 workshop. stageUp = a level-up happened, next one unlocks
    stage: 0, stageUp: false, bots: [], runs: 0, builds: 0,
    settings: { scare: 'mild', monsterSpeed: 'normal', focus: 'both', strict: 'easy', voices: true },
    stats: { readRight: 0, readWrong: 0, mathRight: 0, mathWrong: 0, nights: 0, caught: 0 },
    updatedAt: 0, parentEditAt: 0, seenParentEditAt: 0,
  };
}

function merge(base, over) {
  if (!over || typeof over !== 'object' || Array.isArray(over)) return over ?? base;
  const out = Array.isArray(base) ? [] : { ...base };
  for (const k of Object.keys(over)) {
    const b = base ? base[k] : undefined, o = over[k];
    out[k] = (b && typeof b === 'object' && !Array.isArray(b) && o && typeof o === 'object' && !Array.isArray(o)) ? merge(b, o) : o;
  }
  return out;
}

// PHP turns empty {} into [] — fix that so missed-word lists keep working
function sanitize(d) {
  for (const t of ['reading', 'math']) {
    if (!d[t] || typeof d[t] !== 'object') d[t] = defaults()[t];
    if (!d[t].missed || Array.isArray(d[t].missed)) d[t].missed = {};
    if (!Array.isArray(d[t].history)) d[t].history = [];
    if (!Array.isArray(d[t].recent)) d[t].recent = [];
  }
  if (!d.settings || Array.isArray(d.settings)) d.settings = defaults().settings;
  if (!d.stats || Array.isArray(d.stats)) d.stats = defaults().stats;
  if (!Array.isArray(d.bots)) d.bots = [];
  d.bots = d.bots.filter(b => b && typeof b === 'object' && b.kind && b.name);
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

  // ---------- this kid's progress ----------
  async load(kid = CFG.kid) {
    this.playerId = kid.id; this.player = kid;
    const local = readJSON(keyFor(kid.id));
    let server = null, online = false;
    try {
      const r = await fetch(CFG.urls.progress, { headers: { Accept: 'application/json' }, credentials: 'same-origin', cache: 'no-store' });
      if (r.status === 401 || r.redirected) { location.href = '/login'; return; }
      if (r.ok) { const j = await r.json(); online = true; if (j.csrf) this.csrf = j.csrf; server = j.state; if (j.kid) this.player = j.kid; }
    } catch (e) {}
    let pick = local;
    if (server && (!local || (server.updatedAt || 0) > (local.updatedAt || 0) || (server.parentEditAt || 0) > (local.seenParentEditAt || 0))) pick = server;
    this.data = sanitize(merge(defaults(), pick || {}));
    this.data.seenParentEditAt = this.data.parentEditAt || 0;
    this.data.name = this.player.name; // name always comes from the JoyNot profile
    delete this.data.reset;
    this.persistLocal();
    if (online && local && pick === local) this.push(); // device had newer progress: send it up now
    this.flushQueue();
    return { offline: !online };
  },

  persistLocal() { if (this.playerId) writeJSON(keyFor(this.playerId), this.data); },

  save() {
    if (!this.playerId) return;
    this.data.updatedAt = Date.now();
    this.persistLocal();
    clearTimeout(this._t); this._t = setTimeout(() => this.push(), 1500);
  },

  async post(url, body, retry = true) {
    const r = await fetch(url, { method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': this.csrf },
      body: JSON.stringify(body) });
    if (r.status === 419 && retry) { await this.refreshCsrf(); return this.post(url, body, false); }
    return r;
  },
  async refreshCsrf() {
    try { const r = await fetch(CFG.urls.progress, { headers: { Accept: 'application/json' }, credentials: 'same-origin', cache: 'no-store' }); const j = await r.json(); this.csrf = j.csrf || this.csrf; } catch (e) {}
  },

  async push() {
    const id = this.playerId; if (!id) return;
    try {
      const r = await this.post(CFG.urls.save, { state: this.data });
      if (r.ok && id === this.playerId) {
        const j = await r.json();
        if (j.stale && j.state) { // a grown-up changed this kid's settings in the Grown-ups area
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

  // Save everything right now (before leaving the page). Gives up after a couple of seconds.
  async flushNow() {
    clearTimeout(this._t); clearTimeout(this._qt);
    const work = Promise.all([this.push(), this.flushQueue()]);
    await Promise.race([work, new Promise(r => setTimeout(r, 2500))]);
  },

  // Last-chance save when the tab is closed or the app is swiped away.
  beacon() {
    if (!this.playerId) return;
    try {
      fetch(CFG.urls.save, { method: 'POST', keepalive: true, credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': this.csrf },
        body: JSON.stringify({ state: this.data }) }).catch(() => {});
    } catch (e) {}
  },

  // ---------- answer log (each answer remembers whose it is) ----------
  logAttempt(a) {
    if (!this.playerId) return;
    let q = readJSON(QKEY) || [];
    q.push({ ...a, kid_id: this.playerId }); if (q.length > 500) q = q.slice(-500);
    writeJSON(QKEY, q);
    clearTimeout(this._qt); this._qt = setTimeout(() => this.flushQueue(), 2000);
  },
  async flushQueue() {
    const q = readJSON(QKEY) || [];
    if (!q.length || this._flushing) return;
    this._flushing = true;
    const groups = {};
    q.forEach(a => { (groups[a.kid_id] = groups[a.kid_id] || []).push(a); });
    const keep = [];
    for (const [kid, list] of Object.entries(groups)) {
      try {
        const r = await this.post(attemptsUrl(kid), { attempts: list.map(({ kid_id, ...rest }) => rest) });
        // 404/403/422 = kid removed, other family, or bad data: drop them. Anything else: try again later.
        if (!(r.ok || [403, 404, 422].includes(r.status))) keep.push(...list);
      } catch (e) { keep.push(...list); }
    }
    // answers logged while we were sending stay in the queue
    const now = readJSON(QKEY) || [];
    writeJSON(QKEY, [...keep, ...now.slice(q.length)]);
    this._flushing = false;
  },
};

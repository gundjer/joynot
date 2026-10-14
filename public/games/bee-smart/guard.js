// Bee Smart: Guard Bee. A grown-up's phone plays along with the kid's game.
// Jobs: 🛡️ Guard (tap hornets to shoo them), 🌱 Gardener (tap grass to plant a flower, tap a flower to make it golden),
// 💡 Coach (during a puzzle: light up a hint and read the coaching tip — never the answer). Everyone can cheer and fan honey.
import { CoopLink } from '../_play/coop-link.js';
import { emoji, roundRect, label, clamp } from '../_play/play.js';
import { WORLDS, WW, WH, HIVE, buildScenery, drawWorld, drawLeaves, drawHornet, drawBee } from './worlds.js';

const C = window.COOP || {};
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KID = C.kid || { name: 'Your kid', avatar: '🐝', color: '#ffd34d' };
const COOL = { shoo: 2.5, plant: 10, gold: 1, hint: 8, cheer: 3 };
const JOBS = [
  ['guard', '🛡️ Guard', `Tap a hornet to shoo it away from ${KID.name}.`],
  ['garden', '🌱 Gardener', 'Tap the grass to plant a flower. Tap a flower to make it golden ✨ (worth double pollen).'],
  ['coach', '💡 Coach', `When ${KID.name} is on a puzzle, read the tip and light up a hint. Never say the answer!`],
];
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
};

let me = null, link = null, st = null, job = 0, cool = {}, golds = 0, plants = 0, trip = null, t = 0, scKey = '', sc = null, disp = new Map(), net = 'connecting';

// ------------------------------------------------ screens
function header() {
  return `<div class="gh"><span class="t">🐝<span class="w"> Guard Bee</span></span><span class="kid"><i style="--c:${esc(KID.color)}">${esc(KID.avatar)}</i>${esc(KID.name)}</span><span class="net" id="net">⏳ Connecting</span><button id="leave" type="button">Leave</button></div>`;
}
function nameScreen(msg = '') {
  const saved = store.get('joynot_guard_name') || '';
  $('#guard').innerHTML = `${header()}<div class="stage" style="display:flex"><form class="card" id="nameForm">
    <h1>🐝 Play with ${esc(KID.name)}!</h1>
    <p>You’ll be a <b>Guard Bee</b> in ${esc(KID.name)}’s game. ${esc(KID.name)} will see your name.</p>
    <input id="nm" maxlength="30" placeholder="Your name (Grandma, Dad…)" value="${esc(saved)}" autocomplete="off">
    <div class="chips">${['Mom', 'Dad', 'Grandma', 'Grandpa', 'Aunt', 'Uncle'].map(n => `<button type="button" data-n="${n}">${n}</button>`).join('')}</div>
    ${msg ? `<p style="color:#c0392b">${esc(msg)}</p>` : ''}
    <button class="btn go" type="submit">🐝 Join the game</button></form></div>`;
  $('#leave').onclick = () => { location.href = C.urls.back; };
  $('#guard').querySelectorAll('.chips button').forEach(b => { b.onclick = () => { $('#nm').value = b.dataset.n; }; });
  $('#nameForm').onsubmit = e => { e.preventDefault(); const n = $('#nm').value.trim(); if (!n) { $('#nm').focus(); return; } store.set('joynot_guard_name', n); join(n); };
}
function endedScreen(text) {
  if (link) { link.stopped = true; }
  $('#guard').innerHTML = `${header()}<div class="stage" style="display:flex"><div class="card"><h1>🍯 Game over</h1><p>${esc(text)}</p><button class="btn go" id="back" type="button">Back to Grown-ups</button></div></div>`;
  $('#leave').onclick = $('#back').onclick = () => { location.href = C.urls.back; };
  $('#net').textContent = '⏹ Ended';
}

async function join(name) {
  const key = `joynot_guard_${C.session}`;
  try {
    const r = await fetch(C.urls.member, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content }, body: JSON.stringify({ name, token: store.sget(key) }) });
    if (r.status === 410) { endedScreen(`${KID.name} isn’t playing right now.`); return; }
    if (r.status === 409) { const j = await r.json().catch(() => ({})); nameScreen(j.message || 'The hive is full.'); return; }
    if (r.status === 419 || r.status === 401 || r.redirected) { nameScreen('Please unlock the Grown-ups area again, then come back.'); return; }
    if (!r.ok) { nameScreen('Could not join. Try again.'); return; }
    me = await r.json(); store.sset(key, me.token);
  } catch (e) { nameScreen('No internet. Try again.'); return; }
  play();
}

// ------------------------------------------------ playing
function play() {
  $('#guard').innerHTML = `${header()}<div class="stage"><canvas id="cv"></canvas></div>
    <div class="panel"><div class="row"><button class="job" id="job" type="button" style="--c:${esc(me.color)}"></button><span class="tip" id="tip"></span></div>
    <div id="coach"></div>
    <div class="btns"><button class="btn" id="cheer" type="button">🎉 Cheer</button><button class="btn" id="hint" type="button">💡 Hint</button><button class="btn" id="fan" type="button">🌀 Fan</button></div></div>
    <div class="toast" id="toast"></div>`;
  $('#leave').onclick = () => { if (link) link.end(); location.href = C.urls.back; };
  const nm = document.createElement('button'); nm.type = 'button'; nm.textContent = `✏️ ${me.name}`; nm.style.background = me.color; $('#leave').before(nm);
  nm.onclick = () => { if (link) { link.stopped = true; [...link.peers.keys()].forEach(k => link.drop(k)); } nameScreen(); };
  toast(`🐝 You joined as ${me.name}!`);
  $('#job').onclick = () => { job = (job + 1) % JOBS.length; showJob(); };
  $('#cheer').onclick = () => act('cheer', {}, '🎉 You cheered!');
  $('#hint').onclick = () => act('hint', {}, `💡 You lit up a hint for ${KID.name}.`);
  const fan = $('#fan');
  const fanOn = on => { if (!st || st.mode !== 'hive') return; fan.classList.toggle('down', on); link.send('host', { t: 'fan', on }); };
  fan.addEventListener('pointerdown', e => { e.preventDefault(); fanOn(true); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => fan.addEventListener(ev, () => fanOn(false)));
  const cv = $('#cv');
  cv.addEventListener('pointerdown', e => { const r = cv.getBoundingClientRect(); tap(e.clientX - r.left, e.clientY - r.top); });
  showJob(); panel();
  link = new CoopLink({ urls: C.urls, token: me.token, role: 'member', onState, onMsg: () => {}, onMembers, onLink: (tk, open) => { net = open ? 'direct' : 'relay'; netPill(); }, onEnded: () => endedScreen(`${KID.name} stopped playing. Thanks for helping the hive!`) });
  link.start();
  addEventListener('pagehide', () => link && link.end());
  requestAnimationFrame(loop);
}
function netPill() { const el = $('#net'); if (!el) return; el.textContent = net === 'direct' ? '⚡ Direct link' : net === 'relay' ? '☁️ Online' : '⏳ Connecting'; }
function showJob() { const j = JOBS[job]; $('#job').textContent = j[1]; $('#tip').textContent = j[2]; }
function onMembers(list) { const i = list.findIndex(m => m.token === me.token); if (i >= 0 && !onMembers.done) { job = i % JOBS.length; onMembers.done = 1; showJob(); } }
function onState(s) {
  if (net === 'connecting') { net = 'relay'; netPill(); }
  if (s && s.seed !== undefined && trip !== `${s.w}:${s.seed}:${s.need}`) { trip = `${s.w}:${s.seed}:${s.need}`; golds = 0; plants = 0; }
  const prevMode = st && st.mode; st = s; if (prevMode !== s.mode || (s.coach && !$('#coach').dataset.on) || (!s.coach && $('#coach').dataset.on)) panel();
}
function panel() {
  const box = $('#coach'); if (!box) return;
  const s = st || {};
  if (s.coach) { box.dataset.on = 1; box.innerHTML = `<div class="coach">🧩 ${esc(KID.name)} is solving: <b>${esc(s.coach.show)}</b><br>💬 ${esc(s.coach.tip)}</div>`; }
  else if (s.mode === 'hive') { box.dataset.on = ''; box.innerHTML = `<div class="coach">🍯 ${esc(KID.name)} is in the hive making honey. <b>Hold 🌀 Fan</b> to help dry the nectar!</div>`; }
  else if (s.mode === 'intro') { box.dataset.on = ''; box.innerHTML = `<div class="coach">📖 ${esc(KID.name)} is reading about this world. Get ready!</div>`; }
  else if (!st || s.mode === 'menu') { box.dataset.on = ''; box.innerHTML = `<div class="coach">⏳ Waiting for ${esc(KID.name)} to start flying…</div>`; }
  else { box.dataset.on = ''; box.innerHTML = ''; }
  $('#hint').disabled = !s.coach; $('#fan').disabled = s.mode !== 'hive';
}
function ready(k) { const now = performance.now() / 1000; if ((cool[k] || 0) > now) { toast(`⏳ Wait ${Math.ceil(cool[k] - now)}s`); return false; } cool[k] = now + COOL[k]; return true; }
function act(k, extra, msg) { if (!link || !ready(k)) return; link.send('host', { t: k, ...extra }); if (msg) toast(msg); if (navigator.vibrate) try { navigator.vibrate(25); } catch (e) {} }
let toastT = 0;
function toast(m) { const el = $('#toast'); if (!el) return; el.textContent = m; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 1800); }

// ------------------------------------------------ the field picture
function view() {
  const cv = $('#cv'), W = cv.clientWidth, H = cv.clientHeight, sc = clamp(Math.min(W, H) / 820, 0.36, 0.75);
  const b = st && st.bee ? pos('bee', st.bee[0], st.bee[1]) : { x: WW / 2, y: WH / 2 };
  const hw = W / 2 / sc, hh = H / 2 / sc;
  return { W, H, sc, cx: clamp(b.x, Math.min(hw, WW / 2), Math.max(WW - hw, WW / 2)), cy: clamp(b.y, Math.min(hh, WH / 2), Math.max(WH - hh, WH / 2)) };
}
function pos(id, x, y) { let d = disp.get(id); if (!d) { d = { x, y }; disp.set(id, d); } d.tx = x; d.ty = y; return d; }
function tap(x, y) {
  if (!st || (st.mode !== 'field' && st.mode !== 'raid')) { if (st && st.mode === 'chal') toast(`🧩 ${KID.name} is on a puzzle. Try 💡 Hint!`); return; }
  const v = view(), wx = (x - v.W / 2) / v.sc + v.cx, wy = (y - v.H / 2) / v.sc + v.cy, near = 70 / Math.max(v.sc, 0.5);
  const h = (st.hz || []).map(a => ({ id: a[0], x: a[1], y: a[2] })).sort((a, b) => Math.hypot(a.x - wx, a.y - wy) - Math.hypot(b.x - wx, b.y - wy))[0];
  if (h && Math.hypot(h.x - wx, h.y - wy) < near * 1.3) { act('shoo', { id: h.id }, '🛡️ Shoo! The hornet flies away.'); return; }
  const f = (st.fl || []).filter(a => a[4]).map(a => ({ id: a[0], x: a[1], y: a[2], gold: a[5] })).find(a => Math.hypot(a.x - wx, a.y - wy) < near);
  if (f) { if (f.gold) { toast('✨ That flower is already golden.'); return; } if (golds >= 1) { toast('✨ One golden flower per trip.'); return; } golds++; act('gold', { id: f.id }, '✨ You made a golden flower!'); return; }
  if (plants >= 3) { toast('🌱 You planted 3 flowers this trip. Nice gardening!'); return; }
  if (Math.hypot(wx - HIVE.x, wy - HIVE.y) < 260) { toast('🌱 Plant a little farther from the hive.'); return; }
  if (cool.plant && cool.plant > performance.now() / 1000) { ready('plant'); return; }
  plants++; act('plant', { x: Math.round(wx), y: Math.round(wy) }, '🌱 You planted a flower!');
}
function loop(ts) {
  t = ts / 1000;
  const cv = $('#cv'); if (!cv) return;
  const dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (const d of disp.values()) { if (d.tx != null) { d.x += (d.tx - d.x) * 0.25; d.y += (d.ty - d.y) * 0.25; } }
  draw(ctx, W, H);
  requestAnimationFrame(loop);
}
function draw(ctx, W, H) {
  if (!st || st.w === undefined) {
    ctx.fillStyle = '#bfe9ff'; ctx.fillRect(0, 0, W, H); emoji(ctx, '🐝', W / 2 + Math.sin(t * 2) * 40, H / 2, 70);
    ctx.fillStyle = '#2b2350'; ctx.font = '700 18px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`Waiting for ${KID.name}…`, W / 2, H / 2 + 70); return;
  }
  const world = WORLDS[st.w] || WORLDS[0];
  if (scKey !== `${st.w}:${st.seed}`) { scKey = `${st.w}:${st.seed}`; sc = buildScenery(world, st.seed); }
  if (st.mode === 'hive') {
    const g = ctx.createRadialGradient(W / 2, H / 2, 30, W / 2, H / 2, Math.max(W, H)); g.addColorStop(0, '#ffd77a'); g.addColorStop(1, '#c98a00'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    emoji(ctx, '🍯', W / 2, H * 0.38, 90);
    const fan = st.hive ? st.hive.fan : 0, bw = Math.min(W - 40, 360);
    ctx.fillStyle = 'rgba(255,255,255,.6)'; roundRect(ctx, W / 2 - bw / 2, H * 0.62, bw, 20, 10); ctx.fill(); ctx.fillStyle = '#e99a00'; roundRect(ctx, W / 2 - bw / 2, H * 0.62, bw * fan, 20, 10); ctx.fill();
    ctx.fillStyle = '#2b2350'; ctx.font = '700 16px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText({ deposit: 'Dropping off nectar…', fan: 'Fanning nectar into honey!', cap: 'Capping honey with wax…', fact: 'Learning a hive fact…', build: 'Building the hive…' }[st.hive && st.hive.step] || 'In the hive', W / 2, H * 0.62 - 18);
    (st.g || []).forEach((g, i) => emoji(ctx, '🐝', W / 2 - 60 + i * 40 + Math.sin(t * 20) * (st.hive && st.hive.step === 'fan' ? 3 : 0), H * 0.78, 34));
    return;
  }
  const v = view();
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(v.sc, v.sc); ctx.translate(-v.cx, -v.cy);
  drawWorld(ctx, world, sc, t, { x: v.cx - W / 2 / v.sc, y: v.cy - H / 2 / v.sc, w: W / v.sc, h: H / v.sc });
  for (const f of st.fl || []) {
    const [id, x, y, e, open, gold, fruit] = f;
    if (open) { if (gold) { ctx.fillStyle = 'rgba(255,215,0,.45)'; ctx.beginPath(); ctx.arc(x, y, 58, 0, 7); ctx.fill(); } emoji(ctx, e, x, y, 84); }
    else { emoji(ctx, e, x, y, 54, { alpha: 0.5 }); if (fruit) emoji(ctx, fruit, x + 16, y + 12, 38); }
  }
  drawLeaves(ctx, sc);
  for (const c of st.clouds || []) { ctx.fillStyle = 'rgba(40,70,120,.22)'; ctx.beginPath(); ctx.arc(c[0], c[1], c[2], 0, 7); ctx.fill(); emoji(ctx, '☁️', c[0], c[1] - c[2] * 0.55, c[2] * 1.2, { alpha: 0.9 }); }
  if (st.tr) emoji(ctx, '🚜', st.tr[0], st.tr[1], 90, { flip: st.tr[2] > 0 });
  for (const h of st.hz || []) { const d = pos('h' + h[0], h[1], h[2]); ctx.strokeStyle = 'rgba(229,72,77,.6)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(d.x, d.y, 56, 0, 7); ctx.stroke(); drawHornet(ctx, d.x, d.y, 90, t, h[3], h[4] ? 0.55 : 1); }
  if (st.bird) emoji(ctx, '🐦', st.bird[0], st.bird[1], 70, { flip: st.bird[2] > 0 });
  const b = pos('bee', st.bee[0], st.bee[1]);
  drawBee(ctx, b.x, b.y, 84, t, st.bee[2], st.bee[3]);
  label(ctx, `${KID.name} · 🧺 ${st.done}/${st.need}`, b.x, b.y - 66, { size: 22, bg: '#e08a00' });
  for (const g of st.g || []) { const d = pos('g' + g[0], g[3], g[4]); drawBee(ctx, d.x, d.y, 60, t + 1, d.x < b.x ? 1 : -1, '', 1, g[2]); label(ctx, g[0] === me.token ? `${g[1]} (you)` : g[1], d.x, d.y - 46, { size: 18, bg: g[2] }); }
  ctx.restore();
  // hearts + status
  ctx.font = '22px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  emoji(ctx, '❤️', 20, 22, 22, { alpha: st.hearts >= 1 ? 1 : 0.25 }); emoji(ctx, '❤️', 46, 22, 22, { alpha: st.hearts >= 2 ? 1 : 0.25 }); emoji(ctx, '❤️', 72, 22, 22, { alpha: st.hearts >= 3 ? 1 : 0.25 });
  if (st.mode === 'chal') { ctx.fillStyle = 'rgba(43,35,80,.45)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.font = '700 20px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`🧩 ${KID.name} is solving a puzzle…`, W / 2, H / 2); }
  if (st.mode === 'raid') { label(ctx, '🛡️ Hornet raid! Tap hornets to help!', W / 2, 26, { size: 16, bg: '#c0392b' }); }
}

// ------------------------------------------------ boot
if (!C.live) endedScreen(`${KID.name} isn’t playing right now. Ask them to start the game, then tap Join again.`);
else if (store.get('joynot_guard_name')) join(store.get('joynot_guard_name')); // this phone remembers its name
else nameScreen();

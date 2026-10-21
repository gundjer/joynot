// JoyNot "Play together", kid's side — used by every game (Play engine games, Rusty's After Hours, Sparkle's Rainbow Journey).
// Grown-ups join from the Grown-ups page on their own phone. They see the kid's game live (the same screen the kid
// sees, plus the same problem card and the same voice lines), can tap it to point (the kid sees a big glowing finger
// with the grown-up's name), cheer, light up a hint and use the game's own help buttons. With "Talk & Chat" ON
// (Grown-ups → this game's settings) they can hold-to-talk and chat (chat is read aloud; 3rd–5th graders can type back
// with emoji). With "Video" ON it's a video call: the kid sees the grown-up and the grown-up sees the kid.
// The kid still does every puzzle, so reports stay honest (help is logged as "helped").
//
// Game picture: a live video of the game (about 15 frames a second) over the direct link (WebRTC, through your own
// coturn relay when two homes can't connect directly). If no direct link is possible, small JPEG pictures go through
// JoyNot instead (about 1 every 1.5 s), and the cameras send a small picture about every 1.5 s too.
import { CoopLink } from './coop-link.js';
import { talker, voicePlayer, playClip, sendChat, canTalk } from './coop-voice.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const noEmoji = s => String(s).replace(/\p{Extended_Pictographic}|️|‍/gu, ' ').replace(/\s+/g, ' ').trim();
const QUICK = [['👍', 'OK!'], ['❤️', 'Love you!'], ['🤔', 'Help me!'], ['😂', 'Ha ha!'], ['👀', 'Look!'], ['👋', 'Bye!']];
const EMO = ['😀', '😂', '😍', '👍', '❤️', '🎉', '⭐', '🤔', '😮', '🙏', '🔥', '🌈'];
const COOL = { cheer: 3, hint: 8, point: 0.5 };
const CHUNK = 12000; // data channel message size that every browser accepts

/**
 * o = {
 *   canvas: HTMLCanvasElement | () => HTMLCanvasElement     the game picture
 *   kid: { id, name, avatar, color, reads }                  CFG.kid
 *   game: 'game-key', url: CFG.urls.coop, csrf: () => token
 *   speak(text), stopSpeak(), sfx: { pop(), coin() }, duck(on)   read aloud (forced), sounds, music quieter while someone talks
 *   toast(text, ms), confetti()
 *   status(): { goal, screen, tip, level }                    what the grown-up sees under the picture (tip = coaching, never the answer)
 *   view(): { ch, css }                                       optional: the problem card on screen (mirrored on the grown-up's phone)
 *   helps: [{ id, icon, label, cool }]                       game's own help buttons on the grown-up's phone
 *   onHelp(id, g): string|void                               do the help; return a line to show/say to the kid
 *   onHint(g): bool                                          game hint (e.g. replay the "we do" demo); false → read the goal again
 *   world(): string                                          shown on the Grown-ups "is playing" card
 *   dock: true                                               floating 💬 / 🎙️ buttons on the right (games with their own buttons pass false)
 * }
 */
export function mountTogether(o) {
  if (!o.url) return null;
  css();
  const kid = o.kid || { name: 'Kid' };
  const canvas = () => (typeof o.canvas === 'function' ? o.canvas() : o.canvas);
  const G = new Map(); // grown-ups by token
  const player = voicePlayer(), seenChat = new Set(), log = [];
  let link = null, opening = false, urls = null, token = null, F = { talk: false, video: false }, kidTalk = null, iv = 0, t0 = performance.now();
  let lastFrame = 0, lastStatus = 0, lastRelay = 0, frameId = 0, unread = 0, opened = false, popT = 0, duck = 0, world = '';
  let cam = null, camAsked = false, screenTrack = null, lastCamRelay = 0;
  const key = `joynot_coop_${o.game}_${kid.id}`;
  const ss = { get() { try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch (e) { return null; } }, set(v) { try { sessionStorage.setItem(key, JSON.stringify(v)); } catch (e) {} } };
  const csrf = () => (o.csrf && o.csrf()) || document.querySelector('meta[name="csrf-token"]')?.content || '';
  const now = () => (performance.now() - t0) / 1000;

  // ------------------------------------------------ kid screen pieces
  const root = document.createElement('div');
  root.id = 'jt';
  root.innerHTML = `
    <div class="jt-pill hidden" id="jtTalk"></div>
    <div class="jt-videos" id="jtVideos"><div class="jt-vid jt-self hidden" id="jtSelf"><video autoplay playsinline muted></video><span>You</span></div></div>
    <div class="jt-points" id="jtPoints"></div>
    <div class="jt-pop hidden" id="jtPop"></div>
    <div class="jt-dock hidden" id="jtDock">
      <button type="button" class="jt-db" id="jtChatBtn" aria-label="Chat">💬<i class="jt-badge hidden" id="jtBadge"></i></button>
      <button type="button" class="jt-db talk" id="jtTalkBtn" aria-label="Hold to talk">🎙️<small>Hold</small></button>
    </div>
    <div class="jt-chat hidden" id="jtChat" role="dialog" aria-label="Chat">
      <div class="jt-card">
        <div class="jt-head"><b id="jtWho">💬 Chat</b><button type="button" class="jt-x" id="jtClose" aria-label="Close">✖</button></div>
        <div class="jt-log" id="jtLog"></div>
        <div class="jt-quick">${QUICK.map(([e, t], i) => `<button type="button" data-q="${i}"><span>${e}</span>${esc(t)}</button>`).join('')}</div>
        <div class="jt-typing hidden" id="jtTyping"><div class="jt-emo">${EMO.map(e => `<button type="button" data-e="${e}">${e}</button>`).join('')}</div>
        <form class="jt-type" id="jtForm"><input id="jtText" maxlength="200" autocomplete="off" placeholder="Type a message…" enterkeyhint="send"><button type="submit">Send ➤</button></form></div>
      </div>
    </div>`;
  document.body.appendChild(root);
  const $ = s => root.querySelector(s);
  const stopKeys = e => e.stopPropagation();
  ['keydown', 'keyup', 'keypress'].forEach(ev => $('#jtText').addEventListener(ev, stopKeys));
  $('#jtClose').onclick = () => closeChat();
  $('#jtChat').addEventListener('pointerdown', e => { if (e.target.id === 'jtChat') closeChat(); });
  root.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => { const [e, t] = QUICK[+b.dataset.q]; o.speak && o.speak(t); chat(`${e} ${t}`); }));
  root.querySelectorAll('[data-e]').forEach(b => b.addEventListener('click', () => { const i = $('#jtText'); i.value = (i.value + b.dataset.e).slice(0, 200); i.focus(); }));
  $('#jtForm').addEventListener('submit', e => { e.preventDefault(); const i = $('#jtText'), v = i.value.trim(); if (!v) return; i.value = ''; chat(v); });
  $('#jtChatBtn').onclick = () => (opened ? closeChat() : openChat());
  const tb = $('#jtTalkBtn');
  tb.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); tb.classList.add('down'); talkDown(); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => tb.addEventListener(ev, () => { tb.classList.remove('down'); talkUp(); }));
  tb.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('pointerdown', () => { player.resume(); root.querySelectorAll('video').forEach(v => { if (v.paused && v.srcObject) v.play().catch(() => {}); }); }, { capture: true });

  const canType = () => { const r = String(kid.reads ?? 'K'); return r !== 'K' && r !== 'PK' && (parseInt(r, 10) || 0) >= 3; };
  function openChat() { opened = true; unread = 0; badge(); const gs = [...G.values()]; $('#jtWho').textContent = gs.length ? `💬 Chat with ${gs.map(g => g.name).join(' & ')}` : '💬 Chat'; $('#jtTyping').classList.toggle('hidden', !canType()); $('#jtChat').classList.remove('hidden'); const b = $('#jtLog'); b.scrollTop = b.scrollHeight; }
  function closeChat() { opened = false; $('#jtChat').classList.add('hidden'); }
  function badge() { const b = $('#jtBadge'); b.textContent = unread; b.classList.toggle('hidden', !unread); }
  function dock() { $('#jtDock').classList.toggle('hidden', !(o.dock !== false && F.talk && G.size)); tb.classList.toggle('hidden', !canTalk()); if (!F.talk || !G.size) closeChat(); }
  function addLog(m) {
    log.push(m); if (log.length > 80) log.shift();
    const box = $('#jtLog');
    box.innerHTML = log.map(x => `<div class="jt-msg ${x.kid ? 'me' : ''}" style="--c:${esc(x.color || '#8b6cff')}"><b>${x.kid ? 'You' : esc(x.name)}</b>${esc(x.text)}${x.kid ? '' : ` <button type="button" class="jt-say" data-say="${esc(x.name)} says: ${esc(noEmoji(x.text))}" aria-label="Hear it">🔊</button>`}</div>`).join('');
    box.querySelectorAll('[data-say]').forEach(b => b.onclick = () => o.speak && o.speak(b.dataset.say));
    box.scrollTop = box.scrollHeight;
  }
  function pill(text, color) { const p = $('#jtTalk'); if (!text) { p.classList.add('hidden'); return; } p.textContent = text; p.style.setProperty('--c', color || '#8b6cff'); p.classList.remove('hidden'); }
  function pop(html, ms = 6000, onTap = null) { const p = $('#jtPop'); p.innerHTML = html; p.classList.remove('hidden'); clearTimeout(popT); popT = setTimeout(() => p.classList.add('hidden'), ms); p.onclick = () => { p.classList.add('hidden'); onTap && onTap(); }; }
  function setDuck(on) { duck = Math.max(0, duck + (on ? 1 : -1)); o.duck && o.duck(duck > 0); if (on && o.stopSpeak) o.stopSpeak(); }
  function talkDown() { if (kidTalk && F.talk && G.size) kidTalk.down(); }
  function talkUp() { if (kidTalk) kidTalk.up(); }
  async function chat(text) {
    if (!link || !F.talk) { o.toast && o.toast('💬 Chat is turned off.', 2000); return; }
    try { const m = await sendChat({ chatUrl: urls.chat, token, csrf: csrf(), link }, text); if (m) { seenChat.add(m.id); addLog(m); } o.sfx && o.sfx.pop && o.sfx.pop(); }
    catch (e) { o.toast && o.toast(e.message === 'off' ? '💬 Chat is turned off.' : '💬 Message didn’t send. Try again.', 2200); }
  }

  /** A grown-up points: big glowing ring + finger + name, where they tapped on the picture. */
  function point(g, nx, ny) {
    const c = canvas(); if (!c) return;
    const r = c.getBoundingClientRect(), x = r.left + nx * r.width, y = r.top + ny * r.height;
    const el = document.createElement('div');
    el.className = 'jt-point'; el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.setProperty('--c', g.color);
    el.innerHTML = `<i></i><span>👆</span><b>${esc(g.name)}</b>`;
    $('#jtPoints').appendChild(el);
    setTimeout(() => el.remove(), 2600);
    o.sfx && o.sfx.pop && o.sfx.pop();
  }

  // ------------------------------------------------ the kid's camera (Video ON: grown-ups and kid see each other)
  async function startCam() {
    if (cam || camAsked || !F.video || !canTalk()) return;
    camAsked = true;
    try {
      cam = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15 } }, audio: false });
      if (!F.video || !G.size || !link || link.stopped) { stopCam(); return; }
      if (link) link.setCam(cam.getVideoTracks()[0]);
      const v = $('#jtSelf video'); v.srcObject = cam; v.play().catch(() => {});
      $('#jtSelf').classList.toggle('hidden', !G.size);
    } catch (e) { cam = null; o.toast && o.toast('📹 Ask a grown-up to allow the camera so they can see you.', 3200); }
    finally { camAsked = false; }
  }
  function stopCam() {
    if (cam) cam.getTracks().forEach(t => t.stop());
    cam = null; if (link) link.setCam(null);
    const v = $('#jtSelf video'); if (v) v.srcObject = null; $('#jtSelf').classList.add('hidden');
  }

  // ------------------------------------------------ live video of the game screen for grown-ups
  // A small copy of the game canvas (plus whatever the game adds with o.compose) is redrawn ~15 times a second and
  // sent as a video track. Grown-ups see exactly what the kid sees, smoothly.
  const mirror = document.createElement('canvas'), mctx = mirror.getContext('2d');
  function screenOn() {
    if (screenTrack || o.screen === false || !mirror.captureStream) return;
    try { const s = mirror.captureStream(15); screenTrack = s.getVideoTracks()[0]; if (link) link.setScreen(screenTrack); } catch (e) { screenTrack = null; }
  }
  function drawMirror() {
    const c = canvas(); if (!c || !c.width) return;
    const r = c.getBoundingClientRect(), ar = r.width / Math.max(1, r.height);
    const w = ar >= 1 ? 720 : Math.round(720 * ar), h = ar >= 1 ? Math.round(720 / ar) : 720;
    if (mirror.width !== w || mirror.height !== h) { mirror.width = w; mirror.height = h; }
    try { mctx.drawImage(c, 0, 0, w, h); if (o.compose) o.compose(mctx, w, h); } catch (e) {}
  }

  // ------------------------------------------------ the link
  async function open() {
    if (opening || link) return;
    opening = true;
    try {
      const prev = ss.get() || {};
      const r = await fetch(o.url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf() }, body: JSON.stringify({ world: world || null, session: prev.session || null, token: prev.token || null }) });
      if (!r.ok) return;
      const j = await r.json();
      ss.set({ session: j.session, token: j.token });
      urls = j.urls; token = j.token; F = { ...F, ...(j.features || {}) };
      link = new CoopLink({
        urls: j.urls, token: j.token, role: 'host', csrf: csrf(), ice: j.ice, media: { audio: F.talk, video: F.video }, screen: o.screen !== false && !!mirror.captureStream,
        onMsg, onMembers, onPoll, onLink: () => { lastStatus = 0; }, onEnded: () => { link = null; G.clear(); dock(); stopCam(); },
        onTrack: (tk, track, stream, tag) => { if (track.kind === 'audio') player.attach(tk, track); else if (tag === 'cam') video(tk, track); },
      });
      window.__joynotLink = link; // tests
      if (screenTrack) link.setScreen(screenTrack);
      if (cam) link.setCam(cam.getVideoTracks()[0]);
      kidTalk = talker({ link, voiceUrl: urls.voice, token, csrf: csrf(), onTalk: (on, mode) => pill(on ? (mode === 'clip' ? '🎙️ Recording… let go to send' : '🎙️ They can hear you!') : '', '#2fae66'), onError: m => o.toast && o.toast('🎙️ ' + m, 2600) });
      link.start();
      addEventListener('pagehide', () => link && link.end());
      iv = setInterval(tick, 66);
    } catch (e) {} finally { opening = false; }
  }
  function onPoll(j) {
    if (!j.features) return;
    const was = F; F = { talk: !!j.features.talk, video: !!j.features.video };
    if (was.talk !== F.talk || was.video !== F.video) {
      if (F.video && G.size) startCam(); else if (!F.video) {
        stopCam();
        for (const g of G.values()) { g.cam = false; const el = bubble(g.token); el.classList.add('hidden'); delete el.dataset.live; }
      }
      link.setMedia({ audio: F.talk, video: F.video }); if (!F.talk) talkUp(); dock();
    }
  }
  function grownup(tk, name, color) {
    let g = G.get(tk);
    if (!g) { g = { token: tk, name: name || 'Grown-up', color: color || '#8b6cff', cool: {}, cam: false, screen: false }; G.set(tk, g); }
    if (name) g.name = name; if (color) g.color = color;
    return g;
  }
  const ready = (g, k, s) => { const n = now(); if ((g.cool[k] || 0) > n) return false; g.cool[k] = n + (s ?? COOL[k] ?? 5); return true; };
  function joined(g) {
    o.sfx && o.sfx.coin && o.sfx.coin(); pop(`<b style="color:${esc(g.color)}">👋 ${esc(g.name)}</b> is playing with you!`, 4000); o.speak && o.speak(`${g.name} is playing with you!`);
    dock(); lastStatus = 0; screenOn();
    if (F.video) startCam();
    if (cam) $('#jtSelf').classList.remove('hidden');
  }
  function left(g) { video(g.token, null); o.toast && o.toast(`👋 ${g.name} left`, 1800); dock(); if (!G.size) { stopCam(); } }
  function onMsg(from, b) {
    o.onMsg && o.onMsg(from, b);
    if (b.t === 'join') { const isNew = !G.has(from); const g = grownup(from, b.name, b.color); if (isNew) joined(g); g.screen = false; link.reconnect(from); return; }
    if (b.t === 'chat') {
      if (!F.talk || seenChat.has(b.id)) return; seenChat.add(b.id); addLog(b);
      if (b.kid) return;
      if (!opened) { unread++; badge(); }
      o.sfx && o.sfx.coin && o.sfx.coin();
      pop(`<b style="color:${esc(b.color)}">💬 ${esc(b.name)}:</b> ${esc(b.text)}`, 6000, openChat);
      o.speak && o.speak(`${b.name} says: ${noEmoji(b.text)}`);
      return;
    }
    const g = G.get(from); if (!g) return;
    if (b.t === 'leave') { G.delete(from); link.drop(from); player.drop(from); left(g); return; }
    if (b.t === 'point' && ready(g, 'point')) point(g, Math.max(0, Math.min(1, +b.nx || 0)), Math.max(0, Math.min(1, +b.ny || 0)));
    if (b.t === 'cheer' && ready(g, 'cheer')) { o.confetti && o.confetti(); o.sfx && o.sfx.coin && o.sfx.coin(); pop(`<b style="color:${esc(g.color)}">🎉 ${esc(g.name)}</b> cheers for you!`, 2600); o.speak && o.speak(`${g.name} cheers for you!`); }
    if (b.t === 'hint' && ready(g, 'hint')) {
      const done = o.onHint && o.onHint(g);
      if (!done) { const s = o.status ? o.status() : {}; pop(`<b style="color:${esc(g.color)}">💡 ${esc(g.name)}:</b> ${esc(s.goal || 'You can do it!')}`, 5000); o.speak && o.speak(`Hint from ${g.name}. ${noEmoji(s.goal || 'You can do it!')}`); }
    }
    if (b.t === 'help') {
      const h = (o.helps || []).find(x => x.id === b.id);
      if (h && ready(g, 'h_' + h.id, h.cool ?? 10)) {
        const said = o.onHelp && o.onHelp(h.id, g);
        if (said) { pop(`<b style="color:${esc(g.color)}">${esc(h.icon || '✨')} ${esc(g.name)}:</b> ${esc(said)}`, 3500); o.speak && o.speak(`${g.name}: ${noEmoji(said)}`); }
      }
    }
    if (b.t === 'talk' && F.talk) { setDuck(!!b.on); pill(b.on ? `🎙️ ${g.name} is talking…` : '', g.color); }
    if (b.t === 'voice' && F.talk) playClip(b.url, () => { setDuck(true); pill(`🎙️ ${g.name} is talking…`, g.color); }, () => { setDuck(false); pill(''); });
    if (b.t === 'cam') { g.cam = !!b.on && F.video; const el = bubble(g.token); el.classList.toggle('hidden', !g.cam); if (!g.cam) { const im = el.querySelector('img'); if (im) im.removeAttribute('src'); } }
    // camera picture through JoyNot (no direct link): show it in the grown-up's bubble
    if (b.t === 'camf' && F.video && typeof b.d === 'string' && b.d.startsWith('data:image/jpeg')) {
      g.cam = true; const el = bubble(g.token); el.classList.remove('hidden');
      if (!el.dataset.live) { const im = el.querySelector('img'); im.src = b.d; im.classList.remove('hidden'); el.querySelector('video').classList.add('hidden'); }
    }
    if (b.t === 'scr') g.screen = !!b.on; // this grown-up is getting the live game video (so skip the slow pictures)
  }
  function onMembers(list) {
    o.onMembers && o.onMembers(list);
    const live = new Set(list.map(m => m.token));
    for (const m of list) if (!G.has(m.token)) { joined(grownup(m.token, m.name, m.color)); link.connect(m.token); }
    for (const [k, g] of G) if (!live.has(k)) { G.delete(k); link.drop(k); player.drop(k); left(g); }
  }
  function bubble(tk) {
    const box = $('#jtVideos'); let el = box.querySelector(`[data-tk="${tk}"]`);
    if (!el) { el = document.createElement('div'); el.className = 'jt-vid hidden'; el.dataset.tk = tk; el.innerHTML = '<video autoplay playsinline muted></video><img class="hidden" alt=""><span></span>'; box.insertBefore(el, $('#jtSelf')); }
    const g = G.get(tk); el.querySelector('span').textContent = g ? g.name : ''; if (g) el.style.setProperty('--c', g.color);
    return el;
  }
  function video(tk, track) {
    if (!track) { const el = $('#jtVideos').querySelector(`[data-tk="${tk}"]`); if (el) el.remove(); return; }
    const el = bubble(tk), g = G.get(tk);
    const v = el.querySelector('video'); v.srcObject = new MediaStream([track]); v.play().catch(() => {});
    const live = () => { el.dataset.live = '1'; el.classList.toggle('hidden', !F.video); v.classList.remove('hidden'); el.querySelector('img').classList.add('hidden'); };
    track.onunmute = live; v.onplaying = live;
    track.onmute = () => { delete el.dataset.live; };
    if (g) el.classList.toggle('hidden', !g.cam);
  }

  // ------------------------------------------------ the live picture + what the kid is doing
  const shot = document.createElement('canvas');
  function jpeg(src, maxW, q) {
    if (!src || !(src.videoWidth || src.width) || !(src.videoHeight || src.height)) return null;
    const sw = src.videoWidth || src.width, sh = src.videoHeight || src.height;
    const k = Math.min(1, maxW / sw), w = Math.max(2, Math.round(sw * k)), h = Math.max(2, Math.round(sh * k));
    if (shot.width !== w || shot.height !== h) { shot.width = w; shot.height = h; }
    const x = shot.getContext('2d');
    try { x.drawImage(src, 0, 0, w, h); return shot.toDataURL('image/jpeg', q); } catch (e) { return null; }
  }
  const frame = (maxW, q) => { drawMirror(); return jpeg(mirror.width ? mirror : canvas(), maxW, q); };
  function camShot() { const v = $('#jtSelf video'); return cam && v && v.videoWidth ? jpeg(v, 160, 0.5) : null; }
  function status() {
    let s = {};
    try { s = (o.status && o.status()) || {}; } catch (e) {}
    let view = null;
    try { view = o.view ? o.view() : null; } catch (e) {}
    const c = canvas(), r = c ? c.getBoundingClientRect() : { width: 16, height: 9 };
    return {
      ...s,
      kid: kid.name, goal: String(s.goal || '').slice(0, 300), screen: String(s.screen || '').slice(0, 400), tip: String(s.tip || '').slice(0, 300),
      level: String(s.level || '').slice(0, 80), ar: Math.round(r.width / Math.max(1, r.height) * 1000) / 1000,
      helps: (o.helps || []).map(h => [h.id, h.icon || '✨', h.label || h.id]), features: F, world,
      view: view && view.ch ? { ch: view.ch, css: String(view.css || '') } : null,
    };
  }
  function tick() {
    if (!link || !G.size || document.hidden) return;
    const n = performance.now();
    if (screenTrack) drawMirror(); // keeps the live game video moving
    const direct = link.members.filter(m => link.linkOpen(m.token)), relay = link.members.length - direct.length;
    const needFrames = direct.filter(m => !(G.get(m.token) || {}).screen);
    if (o.frames !== false && needFrames.length && n - lastFrame > 330) {
      lastFrame = n;
      const d = frame(480, 0.55);
      if (d) {
        const id = ++frameId, parts = Math.ceil(d.length / CHUNK);
        for (const m of needFrames) for (let i = 0; i < parts; i++) link.direct1(m.token, { t: 'fr', k: id, i, n: parts, d: d.slice(i * CHUNK, (i + 1) * CHUNK) });
      }
    }
    if (n - lastStatus > (o.statusInterval || 600)) { lastStatus = n; const s = status(); for (const m of direct) link.direct1(m.token, { t: 'st', s }); }
    if (relay > 0 && n - lastRelay > (o.relayInterval || 1500)) {
      lastRelay = n;
      const st = { ...status(), ...(o.frames !== false ? { f: frame(360, 0.5) } : {}) };
      if (F.video && n - lastCamRelay > 1400) { lastCamRelay = n; const c = camShot(); if (c) st.cam = c; }
      link.pendingState = st;
    }
  }

  return {
    /** Call when the kid starts playing (opens the session the Grown-ups page can join). */
    start(w) { if (w) world = String(w).slice(0, 60); open(); },
    count: () => G.size,
    grownups: () => [...G.values()],
    features: () => F,
    /** Something changed on screen — send the status soon. */
    poke() { lastStatus = Math.min(lastStatus, performance.now() - 450); },
    /** Something was said out loud on the kid's screen: grown-ups hear it too (on their phone, if they want). */
    say(text, opt = {}) {
      if (!link || !G.size || !text) return;
      link.send('*', { t: 'say', text: String(text).slice(0, 400), pitch: +opt.pitch || 1, rate: +opt.rate || 1, voice: opt.voice || '' });
    },
    talkDown, talkUp, openChat, closeChat,
    get talking() { return !!(kidTalk && kidTalk.on); },
    chat,
    link: () => link,
    stop() { clearInterval(iv); if (kidTalk) kidTalk.stop(); stopCam(); if (screenTrack) screenTrack.stop(); screenTrack = null; if (link) link.end(); link = null; },
  };
}

function css() {
  if (document.querySelector('link[data-together]')) return;
  const ln = document.createElement('link'); ln.rel = 'stylesheet'; ln.href = '/games/_play/together.css?v=2'; ln.dataset.together = '1';
  document.head.appendChild(ln);
}

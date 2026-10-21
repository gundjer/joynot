// JoyNot "Play together", grown-up's phone — every game except Bee Smart (which has Guard Bee).
// Opened from the "Join" card on the Grown-ups pages. Shows the kid's game LIVE — the same screen the kid sees — and,
// when a problem pops up, the same problem card on top (games that share it, like Rusty's After Hours), and you hear
// the same voice lines (🔊 Hear game). Tap the picture to point. 🎉 Cheer, 💡 Hint (the game teaches how to get the
// answer) and the game's own help buttons. With Talk & Chat on: hold-to-talk and chat. With Video on: a video call —
// your camera in a bubble on the kid's screen, and the kid's camera here.
import { CoopLink } from './coop-link.js';
import { talker, voicePlayer, playClip, sendChat, canTalk } from './coop-voice.js';
import { tune, clean } from '/js/joynot-voice.js';
import { mountBoardRemote } from '../sparkles-rainbow-journey/js/board-remote.js';
import { mountGarageRemote } from '../gizmo-garage/remote.js';

const C = window.COOP || {};
let boardRemote = null;
let garageRemote = null;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KID = C.kid || { name: 'Your kid', avatar: '🙂', color: '#ffd34d' };
const EMO = ['😀', '😂', '😍', '👍', '❤️', '🎉', '⭐', '🤔', '😮', '🙏', '🔥', '🌈'];
const COOL = { cheer: 3, hint: 8, point: 0.5 };
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
};

let F = { talk: false, video: false, ...(C.features || {}) }, me = null, link = null, talk = null, cam = null, st = null, net = 'connecting';
let unread = 0, sheetOpen = false, toastT = 0, lastFrameAt = 0, helpsKey = '', screenLive = false, mirrorKey = '', kidCamLive = false;
let hear = store.get('joynot_hear_game') !== 'off', camRelayT = 0, frameWatchT = 0, camOpening = false;
const cool = {}, parts = new Map(), player = voicePlayer(), seenChat = new Set(), chatLog = [];
const ready = (k, s) => { const n = performance.now() / 1000; if ((cool[k] || 0) > n) return false; cool[k] = n + (s ?? COOL[k] ?? 5); return true; };

// ------------------------------------------------ screens
function header() {
  return `<div class="hh"><span class="t">👨‍👩‍👧<span class="w"> Play together</span></span><span class="kid"><i style="--c:${esc(KID.color)}">${esc(KID.avatar)}</i>${esc(KID.name)}</span><span class="net" id="net">⏳ Connecting</span><button id="leave" type="button">Leave</button></div>`;
}
function nameScreen(msg = '') {
  const saved = store.get('joynot_guard_name') || '';
  $('#guard').innerHTML = `${header()}<div class="stage center"><form class="card" id="nameForm">
    <h1>👋 Play with ${esc(KID.name)}!</h1>
    <p>You’ll see ${esc(KID.name)}’s game <b>${esc(C.title || '')}</b> live on this phone. Tap the picture to point, cheer, and give hints. ${esc(KID.name)} will see your name.</p>
    <input id="nm" maxlength="30" placeholder="Your name (Grandma, Dad…)" value="${esc(saved)}" autocomplete="off">
    <div class="chips">${['Mom', 'Dad', 'Grandma', 'Grandpa', 'Aunt', 'Uncle'].map(n => `<button type="button" data-n="${n}">${n}</button>`).join('')}</div>
    ${msg ? `<p class="err">${esc(msg)}</p>` : ''}
    <button class="btn go" type="submit">▶ Join the game</button></form></div>`;
  $('#leave').onclick = () => { location.href = C.urls.back; };
  $('#guard').querySelectorAll('.chips button').forEach(b => { b.onclick = () => { $('#nm').value = b.dataset.n; }; });
  $('#nameForm').onsubmit = e => { e.preventDefault(); const n = $('#nm').value.trim(); if (!n) { $('#nm').focus(); return; } store.set('joynot_guard_name', n); unlockVoice(); join(n); };
}
// phones only allow speech after a tap: say nothing once while the Join button is pressed
function unlockVoice() { try { if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch (e) {} }
function endedScreen(text) {
  if (link) link.stopped = true;
  $('#guard').innerHTML = `${header()}<div class="stage center"><div class="card"><h1>⭐ Game over</h1><p>${esc(text)}</p><button class="btn go" id="back" type="button">Back to Grown-ups</button></div></div>`;
  $('#leave').onclick = $('#back').onclick = () => { location.href = C.urls.back; };
  $('#net').textContent = '⏹ Ended';
}
async function join(name) {
  const key = `joynot_guard_${C.session}`;
  try {
    const r = await fetch(C.urls.member, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content }, body: JSON.stringify({ name, token: store.sget(key) }) });
    if (r.status === 410) { endedScreen(`${KID.name} isn’t playing right now.`); return; }
    if (r.status === 409) { const j = await r.json().catch(() => ({})); nameScreen(j.message || 'The game is full.'); return; }
    if (r.status === 419 || r.status === 401 || r.redirected) { nameScreen('Please unlock the Grown-ups area again, then come back.'); return; }
    if (!r.ok) { nameScreen('Could not join. Try again.'); return; }
    me = await r.json(); store.sset(key, me.token);
  } catch (e) { nameScreen('No internet. Try again.'); return; }
  play();
}

// ------------------------------------------------ playing
function play() {
  garageRemote?.destroy(); garageRemote = null;
  boardRemote = null;
  screenLive = false; kidCamLive = false; lastFrameAt = 0; helpsKey = ''; mirrorKey = '';
  $('#guard').innerHTML = `${header()}
    <div class="stage" id="stage"><img id="pic" alt="${esc(KID.name)}’s game" draggable="false"><video id="screen" class="hidden" autoplay playsinline muted></video>
      <iframe id="mirror" class="hidden" sandbox="allow-same-origin" title="The problem ${esc(KID.name)} sees" tabindex="-1"></iframe>
      <div class="wait" id="wait">⏳ Waiting for ${esc(KID.name)}’s game…</div><div class="dots" id="dots"></div>
      <video id="selfcam" class="selfcam hidden" autoplay playsinline muted></video>
      <div class="kidcam hidden" id="kidcam"><video autoplay playsinline muted></video><img class="hidden" alt=""><span>${esc(KID.name)}</span></div>
      <div class="answer hidden" id="answer"></div></div>
    <div class="panel">
      <div class="status" id="status"></div>
      <div class="btns2" id="together"></div>
      <div class="btns" id="btns"></div>
    </div>
    <div class="toast" id="toast"></div>
    <div class="gpill hidden" id="gpill"></div>
    <div class="sheet hidden" id="sheet"><div class="sheet-card">
      <div class="sheet-head"><b>💬 Chat with ${esc(KID.name)}</b><button type="button" id="sheetX">✖</button></div>
      <div class="sheet-log" id="sheetLog"></div>
      <div class="sheet-emo">${EMO.map(e => `<button type="button" data-e="${e}">${e}</button>`).join('')}</div>
      <form class="sheet-form" id="sheetForm"><input id="sheetText" maxlength="200" autocomplete="off" placeholder="Message ${esc(KID.name)}… (read aloud)" enterkeyhint="send"><button type="submit">Send ➤</button></form>
    </div></div>`;
  $('#leave').onclick = () => { if (link) link.end(); location.href = C.urls.back; };
  const nm = document.createElement('button'); nm.type = 'button'; nm.textContent = `✏️ ${me.name}`; nm.style.background = me.color; $('#leave').before(nm);
  nm.onclick = () => { if (link) link.end(true); nameScreen(); };
  toast(`👋 You joined as ${me.name}!`);
  buttons();
  const pic = $('#pic'), scr = $('#screen');
  const tapPoint = e => {
    e.preventDefault();
    const el = screenLive ? scr : pic;
    const r = el.getBoundingClientRect(), iw = (screenLive ? scr.videoWidth : pic.naturalWidth) || 16, ih = (screenLive ? scr.videoHeight : pic.naturalHeight) || 9;
    const k = Math.min(r.width / iw, r.height / ih), w = iw * k, h = ih * k, x0 = r.left + (r.width - w) / 2, y0 = r.top + (r.height - h) / 2;
    const nx = (e.clientX - x0) / w, ny = (e.clientY - y0) / h;
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1 || !ready('point')) return;
    link.send('host', { t: 'point', nx: Math.round(nx * 1000) / 1000, ny: Math.round(ny * 1000) / 1000 });
    const d = document.createElement('i'); d.className = 'dot'; d.style.left = (e.clientX - $('#stage').getBoundingClientRect().left) + 'px'; d.style.top = (e.clientY - $('#stage').getBoundingClientRect().top) + 'px'; d.style.setProperty('--c', me.color);
    $('#dots').appendChild(d); setTimeout(() => d.remove(), 1200);
    if (navigator.vibrate) try { navigator.vibrate(20); } catch (er) {}
  };
  pic.addEventListener('pointerdown', tapPoint); scr.addEventListener('pointerdown', tapPoint);
  scr.addEventListener('playing', () => { screenLive = true; scr.classList.remove('hidden'); pic.classList.add('hidden'); $('#wait').classList.add('hidden'); lastFrameAt = performance.now(); if (link) link.send('host', { t: 'scr', on: true }); });
  setupMirror();
  $('#sheetX').onclick = () => sheet(false);
  $('#sheet').addEventListener('pointerdown', e => { if (e.target.id === 'sheet') sheet(false); });
  $('#guard').querySelectorAll('[data-e]').forEach(b => b.addEventListener('click', () => { const i = $('#sheetText'); i.value = (i.value + b.dataset.e).slice(0, 200); i.focus(); }));
  $('#sheetForm').addEventListener('submit', async e => {
    e.preventDefault(); const i = $('#sheetText'), v = i.value.trim(); if (!v) return; i.value = '';
    try { const m = await sendChat({ chatUrl: C.urls.chat, token: me.token, link }, v); if (m) { seenChat.add(m.id); addChat(m, true); } }
    catch (er) { toast(er.message === 'off' ? '💬 Talk & Chat is off in Grown-ups.' : '💬 Didn’t send. Try again.'); }
  });
  link = new CoopLink({
    urls: C.urls, token: me.token, role: 'member', ice: C.ice, media: { audio: F.talk, video: F.video },
    onState, onMsg, onPoll,
    onTrack: (tk, track, stream, tag) => {
      if (track.kind === 'audio') player.attach('host', track);
      else if (tag === 'screen') screenVideo(track);
      else if (tag === 'cam') kidCam(track);
    },
    onLink: (tk, open) => { net = open ? 'direct' : 'relay'; netPill(); if (open && cam) link.send('host', { t: 'cam', on: true }); if (!open) { kidCamLive = false; screenOff(); } },
    onEnded: () => { clearInterval(camRelayT); clearInterval(frameWatchT); stopCam(); if (talk) talk.stop(); player.drop('host'); endedScreen(`${KID.name} stopped playing. Thanks for playing together!`); },
  });
  window.__joynotLink = link; // tests
  talk = talker({ link, voiceUrl: C.urls.voice, token: me.token, onTalk: (on, mode) => gpill(on ? (mode === 'clip' ? '🎙️ Recording… let go to send' : `🎙️ ${KID.name} can hear you`) : '', me.color), onError: m => toast('🎙️ ' + m) });
  renderTogether();
  link.start();
  addEventListener('pointerdown', () => player.resume(), { capture: true });
  addEventListener('pagehide', () => link && link.end());
  frameWatchT = setInterval(() => { if (net !== 'connecting' && lastFrameAt && !screenLive && performance.now() - lastFrameAt > 8000) $('#wait')?.classList.remove('hidden'); }, 2000);
  // camera through JoyNot when there's no direct link: a small picture about every 1.5 seconds
  camRelayT = setInterval(() => { if (cam && link && !link.linkOpen('host') && F.video) { const d = camShot(); if (d) link.send('host', { t: 'camf', d }); } }, 1500);
  addEventListener('pointerdown', () => { [$('#screen'), $('#kidcam video')].forEach(v => { if (v && v.paused && v.srcObject) v.play().catch(() => {}); }); }, { capture: true });
}
function netPill() { const el = $('#net'); if (!el) return; el.textContent = net === 'direct' ? '⚡ Direct' : net === 'relay' ? '☁️ Online' : '⏳ Connecting'; }
function buttons() {
  const helps = (st && st.helps) || [];
  const k = JSON.stringify(helps); if (k === helpsKey && $('#btns').children.length) return; helpsKey = k;
  $('#btns').innerHTML = `<button class="btn" id="cheer" type="button">🎉 Cheer</button><button class="btn" id="hint" type="button">💡 Hint</button>` +
    helps.map(([id, icon, lbl]) => `<button class="btn help" type="button" data-h="${esc(id)}">${esc(icon)} ${esc(lbl)}</button>`).join('');
  $('#cheer').onclick = () => act('cheer', {}, '🎉 You cheered!');
  $('#hint').onclick = () => act('hint', {}, `💡 You lit up a hint for ${KID.name}.`);
  $('#btns').querySelectorAll('[data-h]').forEach(b => { b.onclick = () => act('h_' + b.dataset.h, { t: 'help', id: b.dataset.h }, `${b.textContent} — sent!`, 10); });
}
function act(k, extra, msg, cd) {
  if (!link || !ready(k, cd)) return;
  link.send('host', { t: k, ...extra });
  if (msg) toast(msg);
  if (navigator.vibrate) try { navigator.vibrate(25); } catch (e) {}
}
function onState(s) {
  if (!s || typeof s !== 'object') return;
  st = s;
  if (C.game === 'gizmo-garage' && s.garage) {
    if (!garageRemote) garageRemote = mountGarageRemote({parent:document.querySelector('.panel'),me,send:message=>link&&link.send('host',message),onQuit:()=>{link?.end();location.href=C.urls.back;}});
    garageRemote.update(s.garage);
  }
  if (C.game === 'sparkles-rainbow-journey' && s.board) {
    if (!boardRemote) boardRemote = mountBoardRemote({ parent: document.querySelector('.panel'), me, send: message => link && link.send('host', message) });
    boardRemote.update(s.board);
  }
  if (net === 'connecting' && link && !link.linkOpen('host')) { net = 'relay'; netPill(); }
  if (s.f && !screenLive) showFrame(s.f);
  if (s.cam && !kidCamLive && F.video) { const k = $('#kidcam'); k.querySelector('img').src = s.cam; k.querySelector('img').classList.remove('hidden'); k.querySelector('video').classList.add('hidden'); k.classList.remove('hidden'); }
  showMirror(s.view);
  if (s.features) applyFeatures(s.features);
  $('#status').innerHTML = `${s.level ? `<div class="lv">${esc(s.level)}</div>` : ''}${s.goal ? `<div class="goal">🎯 ${esc(s.goal)}</div>` : ''}${s.screen ? `<div class="scr">📺 ${esc(s.screen)}</div>` : ''}${s.tip ? `<div class="tipbox">💡 <b>Coach tip:</b> ${esc(s.tip)}</div>` : ''}` || `<div class="scr">${esc(KID.name)} is getting ready…</div>`;
  buttons();
}
function showFrame(d) {
  const pic = $('#pic'); if (!pic || screenLive) return;
  pic.src = d; lastFrameAt = performance.now(); $('#wait').classList.add('hidden');
}
// ------------------------------------------------ the live game video (same screen the kid sees)
function screenVideo(track) {
  const v = $('#screen'); if (!v) return;
  v.srcObject = new MediaStream([track]); v.play().catch(() => {});
  track.onended = screenOff; track.onmute = () => setTimeout(() => { if (track.muted) screenOff(); }, 2500);
  track.onunmute = () => v.play().catch(() => {});
}
function screenOff() {
  if (!screenLive) return;
  screenLive = false; const v = $('#screen'); if (v) v.classList.add('hidden'); const p = $('#pic'); if (p) p.classList.remove('hidden');
  if (link) link.send('host', { t: 'scr', on: false });
}
// ------------------------------------------------ the kid's camera (video call)
function kidCam(track) {
  const k = $('#kidcam'); if (!k) return;
  const v = k.querySelector('video'); v.srcObject = new MediaStream([track]); v.play().catch(() => {});
  const live = () => { kidCamLive = true; v.classList.remove('hidden'); k.querySelector('img').classList.add('hidden'); k.classList.toggle('hidden', !F.video); };
  v.onplaying = live; track.onunmute = live;
  track.onmute = () => { kidCamLive = false; };
  track.onended = () => { kidCamLive = false; k.classList.add('hidden'); };
}
function camShot() {
  const v = $('#selfcam'); if (!v || !v.videoWidth) return null;
  const c = camShot.c || (camShot.c = document.createElement('canvas')); const k = 160 / v.videoWidth;
  c.width = 160; c.height = Math.round(v.videoHeight * k);
  try { c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.5); } catch (e) { return null; }
}
// ------------------------------------------------ the problem card the kid sees, drawn with the game's own styles
function setupMirror() {
  const f = $('#mirror'); if (!f) return;
  f.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/fonts/fonts.css"><link id="gcss" rel="stylesheet" href=""><style>html,body{background:transparent!important;overflow:hidden!important;margin:0}#challenge{position:absolute!important;background:rgba(5,2,10,.55)!important}.ch-actions,.x{display:none!important}.pad-mirror{text-align:center;font-size:28px;font-weight:700;color:#ffd84a}.listen-mirror{text-align:center;font-size:20px;color:#7fff9a;font-weight:700}</style></head><body><div id="m"></div></body></html>';
}
function showMirror(view) {
  const f = $('#mirror'); if (!f) return;
  const ch = view && view.ch;
  const k = ch ? JSON.stringify(ch) : '';
  if (k === mirrorKey) return; mirrorKey = k;
  const a = $('#answer');
  if (!ch) { f.classList.add('hidden'); a.classList.add('hidden'); return; }
  const d = f.contentDocument; if (!d || !d.getElementById('m')) { mirrorKey = ''; return; }
  const css = d.getElementById('gcss'); if (view.css && /^\/games\/[a-z0-9_\/.-]+\.css$/i.test(view.css) && css.getAttribute('href') !== view.css) css.setAttribute('href', view.css);
  // the card's HTML comes from the kid's game (same family). It shows in a sandboxed frame where no script can run.
  d.getElementById('m').innerHTML = `<div id="challenge" class="${esc(String(ch.cls || 'overlay').replace(/[^a-z0-9 _-]/gi, ''))}"><div class="panel ch-panel">
    <div class="ch-head"><span>${esc(ch.title)}</span></div>
    <div class="ch-sparky"><div class="bubble">${esc(ch.bubble)}</div></div>
    <div class="ch-body">${ch.content ? `<div class="ch-content">${ch.content}</div>` : ''}${ch.teach ? `<div class="ch-teach">${ch.teach}</div>` : ''}</div>
    ${ch.typed !== null && ch.typed !== undefined ? `<div class="pad-mirror">${esc(ch.typed) || '…'}</div>` : ''}
    ${ch.listening ? '<div class="listen-mirror">👂 Listening…</div>' : ''}
    <div class="heard">${esc(ch.heard)}</div></div></div>`;
  f.classList.remove('hidden');
  a.innerHTML = `🔑 Answer (only you see this): <b>${esc(ch.answer)}</b>`; a.classList.remove('hidden');
}
// ------------------------------------------------ hear what the kid hears (the game's voice lines)
function sayHere(b) {
  if (!hear || !('speechSynthesis' in window) || !b.text) return;
  try {
    if (speechSynthesis.pending) speechSynthesis.cancel(); // never fall behind the kid's screen
    const u = tune(new SpeechSynthesisUtterance(clean(b.text)), { pitch: Math.max(0.5, Math.min(1.6, +b.pitch || 1)), rate: Math.max(0.6, Math.min(1.4, +b.rate || 1)) });
    speechSynthesis.speak(u);
  } catch (e) {}
}
function onMsg(from, b) {
  if (b.t === 'fr') {
    let p = parts.get(b.k); if (!p) { p = { n: b.n, got: 0, d: [] }; parts.set(b.k, p); }
    if (p.d[b.i] == null) { p.d[b.i] = b.d; p.got++; }
    if (p.got === p.n) { showFrame(p.d.join('')); for (const k of [...parts.keys()]) if (k <= b.k) parts.delete(k); }
    if (parts.size > 6) parts.delete(parts.keys().next().value);
    return;
  }
  if (b.t === 'chat') { if (!F.talk || seenChat.has(b.id)) return; seenChat.add(b.id); addChat(b, false); return; }
  if (b.t === 'say') { sayHere(b); return; }
  if (b.t === 'talk' && F.talk) gpill(b.on ? `🎙️ ${KID.name} is talking…` : '', KID.color);
  if (b.t === 'voice' && F.talk) playClip(b.url, () => gpill(`🎙️ ${b.name} is talking…`, KID.color), () => gpill(''));
}
function applyFeatures(features) {
  const was = F; F = { talk: !!features.talk, video: !!features.video };
  if (was.talk === F.talk && was.video === F.video) return;
  link.setMedia({ audio: F.talk, video: F.video });
  if (!F.video) { stopCam(); kidCamLive = false; $('#kidcam').classList.add('hidden'); }
  if (!F.talk && talk) talk.stop();
  renderTogether();
}
function onPoll(j) { if (j.features) applyFeatures(j.features); }

// ------------------------------------------------ talk, chat, camera
function renderTogether() {
  const box = $('#together'); if (!box) return;
  const hearBtn = `<button class="btn hear ${hear ? 'on' : ''}" id="hearBtn" type="button" aria-pressed="${hear}">${hear ? '🔊 Hearing game' : '🔇 Game muted'}</button>`;
  if (!F.talk && !F.video) { box.innerHTML = `${hearBtn}<p class="off">🎙️ Talk, 💬 chat and 📹 video are off. Turn them on in Grown-ups → this game’s settings.</p>`; box.className = 'btns2 none'; if (sheetOpen) sheet(false); bindHear(); return; }
  box.className = 'btns2';
  const mic = canTalk();
  box.innerHTML = `${F.talk ? `<button class="btn talk" id="talkBtn" type="button" ${mic ? '' : 'disabled'}>${mic ? '🎙️ Hold to talk' : '🎙️ Talk needs https'}</button>
    <button class="btn" id="chatBtn" type="button">💬 Chat${unread ? ` <i class="badge">${unread}</i>` : ''}</button>` : ''}
    ${F.video ? `<button class="btn" id="camBtn" type="button">${cam ? '📹 Camera on' : '📹 Camera'}</button>` : ''}${hearBtn}`;
  bindHear();
  const tb = $('#talkBtn');
  if (tb && mic) {
    tb.addEventListener('pointerdown', e => { e.preventDefault(); tb.classList.add('down'); talk.down(); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => tb.addEventListener(ev, () => { tb.classList.remove('down'); talk.up(); }));
    tb.addEventListener('contextmenu', e => e.preventDefault());
  }
  if ($('#chatBtn')) $('#chatBtn').onclick = () => sheet(true);
  if ($('#camBtn')) $('#camBtn').onclick = () => (cam ? stopCam() : startCam());
}
function bindHear() {
  const b = $('#hearBtn'); if (!b) return;
  b.onclick = () => { hear = !hear; store.set('joynot_hear_game', hear ? 'on' : 'off'); if (!hear && 'speechSynthesis' in window) speechSynthesis.cancel(); renderTogether(); toast(hear ? '🔊 You’ll hear what the game says' : '🔇 Game voice muted on this phone'); };
}
function sheet(on) {
  sheetOpen = on; $('#sheet').classList.toggle('hidden', !on);
  if (on) { unread = 0; renderTogether(); drawLog(); setTimeout(() => $('#sheetText').focus(), 50); }
}
function addChat(m, mine) {
  chatLog.push(m); if (chatLog.length > 100) chatLog.shift();
  drawLog();
  if (mine || (m.name === me.name && !m.kid)) return;
  if (!sheetOpen) { unread++; renderTogether(); }
  const help = m.kid && /help me/i.test(m.text);
  toast(`${m.kid ? KID.avatar : '💬'} ${m.name}: ${m.text}`, help ? 4000 : 2600);
  if (navigator.vibrate) try { navigator.vibrate(help ? [120, 80, 120] : 60); } catch (e) {}
}
function drawLog() {
  const box = $('#sheetLog'); if (!box) return;
  box.innerHTML = chatLog.length ? chatLog.map(m => `<div class="msg ${!m.kid && m.name === me.name ? 'me' : ''}" style="--c:${esc(m.color || '#8b6cff')}"><b>${m.kid ? esc(KID.avatar + ' ' + m.name) : esc(m.name)}</b>${esc(m.text)}</div>`).join('') : `<p class="muted">Say hi to ${esc(KID.name)}! Your messages are read aloud on ${esc(KID.name)}’s screen.</p>`;
  box.scrollTop = box.scrollHeight;
}
async function startCam() {
  if (camOpening || cam || !F.video || !link || link.stopped) return;
  if (!canTalk()) { toast('📹 The camera needs a secure https:// page.'); return; }
  camOpening = true;
  try {
    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15 } }, audio: false });
    if (!F.video || !link || link.stopped) { s.getTracks().forEach(t => t.stop()); return; }
    cam = s; link.setCam(s.getVideoTracks()[0]); link.send('host', { t: 'cam', on: true });
    const v = $('#selfcam'); v.srcObject = s; v.classList.remove('hidden'); v.play().catch(() => {});
    toast(`📹 Video call on: you and ${KID.name} can see each other`);
  } catch (e) { toast('📹 Please allow the camera.'); }
  finally { camOpening = false; }
  renderTogether();
}
function stopCam() {
  if (!cam) return;
  cam.getTracks().forEach(t => t.stop()); cam = null;
  if (link) { link.setCam(null); link.send('host', { t: 'cam', on: false }); }
  const v = $('#selfcam'); if (v) { v.srcObject = null; v.classList.add('hidden'); }
  renderTogether();
}
function gpill(text, color) { const p = $('#gpill'); if (!p) return; if (!text) { p.classList.add('hidden'); return; } p.textContent = text; p.style.setProperty('--c', color || '#2fae66'); p.classList.remove('hidden'); }
function toast(m, ms = 1800) { const el = $('#toast'); if (!el) return; el.textContent = m; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), ms); }

if (!C.live) endedScreen(`${KID.name} isn’t playing right now.`); else nameScreen();

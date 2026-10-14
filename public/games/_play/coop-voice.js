// JoyNot hold-to-talk (walkie-talkie) for playing together.
// Hold the button: if the direct link is open, your voice goes live; if not, a short voice message is recorded
// and sent through JoyNot when you let go (it plays 1–2 seconds later). Voice is never saved for long:
// clips are deleted after 10 minutes and when the game ends.
// Microphones only work on secure pages (https:// or http://localhost).

export const canTalk = () => !!(window.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
export const canRecord = () => typeof MediaRecorder !== 'undefined';

/** Play every remote voice track as it arrives. Returns { attach(token, track), stopAll() } */
export function voicePlayer() {
  const els = new Map();
  return {
    attach(token, track) {
      if (!track || track.kind !== 'audio') return;
      let el = els.get(token);
      if (!el) { el = document.createElement('audio'); el.autoplay = true; el.setAttribute('playsinline', ''); el.style.display = 'none'; document.body.appendChild(el); els.set(token, el); }
      el.srcObject = new MediaStream([track]);
      el.play().catch(() => {});
    },
    /** iPhones sometimes block audio until a tap: call this from any tap. */
    resume() { for (const el of els.values()) if (el.paused) el.play().catch(() => {}); },
    drop(token) { const el = els.get(token); if (el) { el.srcObject = null; el.remove(); els.delete(token); } },
  };
}

let clipQueue = Promise.resolve();
/** Play a voice message (one at a time). */
export function playClip(url, onStart, onEnd) {
  clipQueue = clipQueue.then(() => new Promise(res => {
    const a = new Audio(url); a.setAttribute('playsinline', '');
    const done = () => { onEnd && onEnd(); res(); };
    a.onended = done; a.onerror = done;
    onStart && onStart();
    a.play().catch(done);
    setTimeout(done, 25000);
  }));
}

/**
 * o: { link (CoopLink), voiceUrl, token, csrf, onTalk(on), onError(msg) }
 * Call down() when the button is pressed and up() when it is released.
 */
export function talker(o) {
  let stream = null, pressing = false, mode = null, rec = null, chunks = [], recT = 0, startedAt = 0;
  const csrf = () => o.csrf || document.querySelector('meta[name="csrf-token"]')?.content || '';
  async function mic() {
    if (stream && stream.getAudioTracks().some(t => t.readyState === 'live')) return stream;
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    return stream;
  }
  async function down() {
    if (pressing) return;
    pressing = true;
    if (!canTalk()) { o.onError && o.onError('Talking needs a secure https:// page.'); pressing = false; return; }
    let s;
    try { s = await mic(); } catch (e) { pressing = false; o.onError && o.onError('Please allow the microphone to talk.'); return; }
    if (!pressing) return; // let go while the permission box was open
    const track = s.getAudioTracks()[0];
    if (o.link.liveToAll()) { mode = 'live'; o.link.setMic(track); }
    else if (canRecord()) {
      mode = 'clip'; chunks = []; startedAt = Date.now();
      const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
      try { rec = new MediaRecorder(s, type ? { mimeType: type } : undefined); } catch (e) { rec = new MediaRecorder(s); }
      rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => send(rec.mimeType || type || 'audio/webm');
      rec.start();
      recT = setTimeout(() => up(), 20000); // 20 seconds max
    } else { pressing = false; o.onError && o.onError('This device can’t send voice messages.'); return; }
    o.link.send(o.link.o.role === 'host' ? '*' : 'host', { t: 'talk', on: true });
    o.onTalk && o.onTalk(true, mode);
  }
  function up() {
    if (!pressing) return;
    pressing = false; clearTimeout(recT);
    if (mode === 'live') o.link.setMic(null);
    if (mode === 'clip' && rec && rec.state !== 'inactive') rec.stop();
    o.link.send(o.link.o.role === 'host' ? '*' : 'host', { t: 'talk', on: false });
    o.onTalk && o.onTalk(false, mode);
    mode = null;
  }
  async function send(type) {
    if (Date.now() - startedAt < 400 || !chunks.length) return; // a quick tap, nothing said
    const blob = new Blob(chunks, { type }), ext = /mp4|aac|m4a/.test(type) ? 'mp4' : /ogg/.test(type) ? 'ogg' : 'webm';
    const fd = new FormData(); fd.append('token', o.token); fd.append('clip', blob, `clip.${ext}`);
    try {
      const r = await fetch(o.voiceUrl, { method: 'POST', body: fd, credentials: 'same-origin', headers: { 'X-CSRF-TOKEN': csrf(), Accept: 'application/json' } });
      if (!r.ok) o.onError && o.onError(r.status === 403 ? 'Talk is turned off in Grown-ups.' : 'Your voice message didn’t send.');
    } catch (e) { o.onError && o.onError('Your voice message didn’t send.'); }
  }
  return { down, up, get on() { return pressing; }, get mode() { return mode; }, stop() { up(); if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; } };
}

/** Send a chat message through JoyNot (it is saved for the grown-ups), then nudge the others over the direct link. */
export async function sendChat(o, text) {
  const r = await fetch(o.chatUrl, {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': o.csrf || document.querySelector('meta[name="csrf-token"]')?.content || '' },
    body: JSON.stringify({ token: o.token, text }),
  });
  if (!r.ok) throw new Error(r.status === 403 ? 'off' : 'fail');
  const j = await r.json();
  if (j.msg) o.link.send(o.link.o.role === 'host' ? '*' : 'host', j.msg); // instant on a direct link (duplicates are ignored by id)
  return j.msg;
}

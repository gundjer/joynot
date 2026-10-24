// Guard Bee uses the shared co-op media link while retaining its own game controls.
import {cameraTurn,readCameraTurn,saveCameraTurn,applyCameraTurn} from '../_play/camera-view.js';
import { canTalk, talker, voicePlayer, playClip, sendChat } from '../_play/coop-voice.js';

export function memberTools(link, config, toast) {
  let ownTurn=readCameraTurn('self');let features = {}, cam = null, opening = false, live = false;
  const player = voicePlayer();
  const box = document.createElement('div');
  box.innerHTML = `<div class="btns"><button type="button" class="btn" data-camera>📹 Camera</button><button type="button" class="btn" data-rotate hidden>↻ Rotate my camera</button><button type="button" class="btn" data-talk>🎙️ Hold to talk</button></div>
    <div data-videos style="display:flex;gap:8px;justify-content:center"><video data-self autoplay playsinline muted hidden style="width:120px"></video><video data-kid autoplay playsinline muted hidden style="width:160px"></video><img data-frame hidden alt="Child's camera" style="width:160px"></div>
    <form data-chat class="btns"><input maxlength="200" aria-label="Message your child" placeholder="Message your child…"><button type="submit" class="btn">Send 💬</button></form><p data-message role="status"></p>`;
  document.querySelector('.panel').appendChild(box);
  const $ = s => box.querySelector(s), self = $('[data-self]'), kid = $('[data-kid]'), frame = $('[data-frame]');
  const voice = talker({ link, voiceUrl: config.urls.voice, token: link.o.token, onError: toast });
  const camera = $('[data-camera]'), talk = $('[data-talk]');
  function stopCam() {
    if (cam) cam.getTracks().forEach(t => t.stop()); cam = null;
    link.setCam(null); link.send('host', { t: 'cam', on: false });
    self.srcObject = null; self.hidden = true; camera.textContent = '📹 Camera';$('[data-rotate]').hidden=true;
  }
  $('[data-rotate]').onclick=()=>{ownTurn=cameraTurn(ownTurn+90);saveCameraTurn('self',ownTurn);applyCameraTurn(self,ownTurn,true);link.send('host',{t:'cam',on:true,rotation:ownTurn});};
  camera.onclick = async () => {
    if (cam) { stopCam(); return; }
    if (opening || !features.video) return;
    if (!canTalk()) { toast('📹 The camera needs a secure https:// page.'); return; }
    opening = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } }, audio: false });
      if (!features.video || link.stopped) { stream.getTracks().forEach(t => t.stop()); return; }
      cam=stream;applyCameraTurn(self,ownTurn,true);$('[data-rotate]').hidden=false; self.srcObject = stream; self.hidden = false; self.play().catch(() => {});
      link.setCam(stream.getVideoTracks()[0]); link.send('host', { t: 'cam', on: true,rotation:ownTurn }); camera.textContent = '📹 Camera on';
    } catch (e) { toast('📹 Please allow the camera.'); }
    finally { opening = false; }
  };
  talk.onpointerdown = e => { e.preventDefault(); if (features.talk) voice.down(); };
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(event => talk.addEventListener(event, () => voice.up()));
  $('[data-chat]').onsubmit = async e => {
    e.preventDefault(); const input = $('[data-chat] input'), text = input.value.trim();
    if (!text || !features.talk) return;
    try { await sendChat({ link, token: link.o.token, chatUrl: config.urls.chat }, text); input.value = ''; toast('💬 Message sent'); }
    catch (e) { toast('💬 Message didn’t send. Try again.'); }
  };
  const canvas = document.createElement('canvas');
  const timer = setInterval(() => {
    if (!cam || !features.video || link.stopped || link.linkOpen('host') || !self.videoWidth) return;
    canvas.width = 160; canvas.height = Math.round(self.videoHeight * 160 / self.videoWidth);
    canvas.getContext('2d').drawImage(self, 0, 0, canvas.width, canvas.height);
    link.send('host', { t: 'camf',rotation:ownTurn, d: canvas.toDataURL('image/jpeg', 0.5) });
  }, 1500);
  const resume = () => { player.resume(); [self, kid].forEach(v => { if (v.srcObject && v.paused) v.play().catch(() => {}); }); };
  addEventListener('pointerdown', resume, { capture: true });
  function update(f) {
    features = { talk: !!f.talk, video: !!f.video }; link.setMedia({ audio: features.talk, video: features.video });
    camera.hidden = !features.video; talk.hidden = !features.talk; $('[data-chat]').hidden = !features.talk;
    if (!features.video) { if (cam) stopCam(); kid.hidden = frame.hidden = true; live = false; }
    if (!features.talk) voice.stop();
  }
  update(config.features || {});
  return {
    poll: j => { if (j.features) update(j.features); },
    state: s => { [kid,frame].forEach(v=>applyCameraTurn(v,s.camTurn||0));if (s.cam && features.video && !live) { frame.src = s.cam; frame.hidden = false; kid.hidden = true; } },
    track: (token, track, stream, tag) => {
      if (track.kind === 'audio') { player.attach(token, track); return; }
      if (tag !== 'cam') return;
      kid.srcObject = new MediaStream([track]); kid.play().catch(() => {});
      const show = () => { live = true; kid.hidden = !features.video; frame.hidden = true; };
      kid.onplaying = show; track.onunmute = show;
      track.onmute = track.onended = () => { live = false; kid.hidden = true; };
    },
    message: (from, body) => {if(body.t==='cam-turn'){[kid,frame].forEach(v=>applyCameraTurn(v,body.turn));return;}
      if (body.t === 'chat' && features.talk) $('[data-message]').textContent = `${body.name}: ${body.text}`;
      if (body.t === 'voice' && features.talk) playClip(body.url);
    },
    connected: open => { if (open && cam) link.send('host', { t: 'cam', on: true, rotation: ownTurn }); if (!open) { live = false; kid.hidden = true; } },
    stop: () => { clearInterval(timer); removeEventListener('pointerdown', resume, { capture: true }); stopCam(); voice.stop(); player.drop('host'); box.remove(); },
  };
}

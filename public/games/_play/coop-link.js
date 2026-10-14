// JoyNot co-op link: the kid's game (host) and grown-ups' phones (members) talk through JoyNot (simple polling,
// works on any host, no Node), and also try a direct device-to-device link (WebRTC data channel). When the direct
// link is open, messages and the game picture go that way (fast); otherwise they go through JoyNot (about ½ second).
// Talk/video ride on the same direct link (audio/video tracks). STUN/TURN servers (your own coturn) come from the server
// in o.ice. No outside (Google) servers: with none set, devices on the same Wi-Fi still link directly.
const ICE = [];

export class CoopLink {
  /**
   * o: { urls: {poll, send, end}, token, role: 'host'|'member', csrf, noRtc,
   *      onMsg(from, body), onMembers(list), onState(state), onEnded(), onLink(token, open),
   *      ice: [RTCIceServer], media: { audio: bool, video: bool }, onTrack(token, track, stream), onPoll(json) }
   */
  constructor(o) {
    this.o = o; this.since = 0; this.ver = 0; this.out = []; this.peers = new Map(); this.members = [];
    this.stopped = false; this.mid = 0; this.seen = new Set(); this.lastStateRelay = 0; this.pendingState = null; this.fail = 0;
    this.rtcOk = !o.noRtc && typeof RTCPeerConnection !== 'undefined';
    this.media = o.media || { audio: false, video: false }; this.micTrack = null; this.camTrack = null;
  }
  csrf() { return this.o.csrf || document.querySelector('meta[name="csrf-token"]')?.content || ''; }
  start() { this.loop(); }
  get direct() { return [...this.peers.values()].some(p => p.open); }
  /** A grown-up's phone calls the kid's game 'host'; its direct link is stored under the kid's token. */
  key(token) { return token === 'host' && this.hostToken ? this.hostToken : token; }
  linkOpen(token) { const p = this.peers.get(this.key(token)); return !!(p && p.open); }

  // ---------------------------------------------------------------- polling (always on: presence, joins, fallback)
  interval() {
    if (this.o.role === 'host') return this.members.length ? (this.allDirect() ? 1500 : 400) : 3000;
    return this.linkOpen('host') ? 1500 : 350;
  }
  allDirect() { return this.members.length > 0 && this.members.every(m => this.linkOpen(m.token)); }
  async loop() {
    if (this.stopped) return;
    try { await this.flush(); await this.poll(); this.fail = 0; } catch (e) { this.fail++; }
    if (!this.stopped) this.timer = setTimeout(() => this.loop(), document.hidden ? 4000 : Math.min(8000, this.interval() * (1 + this.fail)));
  }
  async poll() {
    const u = new URL(this.o.urls.poll, location.href);
    u.searchParams.set('token', this.o.token); u.searchParams.set('since', this.since); u.searchParams.set('ver', this.ver);
    const r = await fetch(u, { headers: { Accept: 'application/json' }, credentials: 'same-origin', cache: 'no-store' });
    if (r.status === 403 || r.status === 404 || r.status === 410) { this.end(true); return; }
    if (!r.ok) throw new Error('poll ' + r.status);
    const j = await r.json();
    this.since = Math.max(this.since, j.last || 0);
    if (Array.isArray(j.members)) { this.members = j.members; this.o.onMembers && this.o.onMembers(j.members); }
    for (const m of j.msgs || []) this.recv(m.from, m.body);
    if (j.state && j.ver > this.ver && !this.linkOpen('host')) { this.ver = j.ver; this.o.onState && this.o.onState(j.state); }
    this.o.onPoll && this.o.onPoll(j);
    if (j.ended) this.end(true);
  }
  async flush() {
    const st = this.pendingState && this.o.role === 'host' && Date.now() - this.lastStateRelay > 420 ? this.pendingState : null;
    if (!this.out.length && !st) return;
    const msgs = this.out.splice(0, 40);
    if (st) { this.pendingState = null; this.lastStateRelay = Date.now(); }
    const r = await fetch(this.o.urls.send, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': this.csrf() },
      body: JSON.stringify({ token: this.o.token, msgs, ...(st ? { state: st } : {}) }),
    });
    if (r.status === 410 || r.status === 403) { this.end(true); return; }
    if (!r.ok) { this.out.unshift(...msgs); throw new Error('send ' + r.status); }
  }
  relay(to, body) { this.out.push({ to, body }); if (this.out.length === 1) clearTimeout(this.kick), this.kick = setTimeout(() => this.flush().catch(() => {}), 60); }

  // ---------------------------------------------------------------- messages
  /** Send to one device: 'host', a member token, or '*' (every grown-up). */
  send(to, body) {
    body = { ...body, mid: `${this.o.token.slice(0, 6)}${++this.mid}` };
    if (to === '*') {
      let needRelay = false;
      for (const m of this.members) { if (this.linkOpen(m.token)) this.direct1(m.token, body); else needRelay = true; }
      if (needRelay || !this.members.length) this.relay('*', body);
      return;
    }
    if (this.linkOpen(to)) this.direct1(to, body); else this.relay(to, body);
  }
  direct1(to, body) { try { this.peers.get(this.key(to)).ch.send(JSON.stringify(body)); } catch (e) { this.relay(to, body); } }
  /** Host: the latest game picture for every grown-up. */
  setState(state) {
    for (const m of this.members) if (this.linkOpen(m.token)) this.direct1(m.token, { t: 'st', s: state });
    if (!this.allDirect()) this.pendingState = state;
  }
  recv(from, body) {
    if (!body || typeof body !== 'object') return;
    if (body.mid) { if (this.seen.has(body.mid)) return; this.seen.add(body.mid); if (this.seen.size > 400) this.seen = new Set([...this.seen].slice(-200)); }
    if (body.t === 'st') { this.o.onState && this.o.onState(body.s); return; }
    if (body.t === 'rtc-offer') { this.answer(from, body.sdp); return; }
    if (body.t === 'rtc-answer') { const p = this.peers.get(from); if (p) p.pc.setRemoteDescription(body.sdp).then(() => this.drainIce(p)).catch(() => {}); return; }
    if (body.t === 'rtc-ice') { const p = this.peers.get(from); if (!p) { (this.early = this.early || {})[from] = (this.early[from] || []).concat([body.c]); return; } if (p.pc.remoteDescription) p.pc.addIceCandidate(body.c).catch(() => {}); else p.ice.push(body.c); return; }
    this.o.onMsg && this.o.onMsg(from, body);
  }

  // ---------------------------------------------------------------- direct link (WebRTC)
  /** Host calls this when a grown-up joins. */
  connect(token) {
    if (!this.rtcOk || this.peers.has(token)) return;
    const p = this.peer(token);
    const ch = p.pc.createDataChannel('joy'); this.wire(token, p, ch);
    // talk: both ways · video: grown-up → kid only (the kid's camera is never used)
    if (this.media.audio) { const tr = p.pc.addTransceiver('audio', { direction: 'sendrecv' }); if (this.micTrack) tr.sender.replaceTrack(this.micTrack).catch(() => {}); }
    if (this.media.video) p.pc.addTransceiver('video', { direction: 'recvonly' });
    p.pc.createOffer().then(o => p.pc.setLocalDescription(o)).then(() => this.relay(token, { t: 'rtc-offer', sdp: p.pc.localDescription })).catch(() => {});
  }
  async answer(from, sdp) {
    if (!this.rtcOk) return;
    if (this.o.role === 'member') this.hostToken = from;
    const old = this.peers.get(from); if (old) { try { old.pc.close(); } catch (e) {} this.peers.delete(from); }
    const p = this.peer(from);
    if (this.early && this.early[from]) { p.ice.push(...this.early[from]); delete this.early[from]; }
    p.pc.ondatachannel = e => this.wire(from, p, e.channel);
    try { await p.pc.setRemoteDescription(sdp); this.drainIce(p); this.mediaAnswer(p); const a = await p.pc.createAnswer(); await p.pc.setLocalDescription(a); this.relay(from, { t: 'rtc-answer', sdp: p.pc.localDescription }); } catch (e) {}
  }
  /** Grown-up side: answer the kid's talk/video tracks (send our mic and, if on, our camera). */
  mediaAnswer(p) {
    for (const t of p.pc.getTransceivers()) {
      const kind = t.receiver && t.receiver.track && t.receiver.track.kind;
      try {
        if (kind === 'audio') { t.direction = 'sendrecv'; t.sender.replaceTrack(this.micTrack).catch(() => {}); }
        if (kind === 'video') { t.direction = 'sendonly'; t.sender.replaceTrack(this.camTrack).catch(() => {}); }
      } catch (e) {}
    }
  }
  /** Live talk possible to this device right now? */
  liveTo(token) { const p = this.peers.get(this.key(token)); return !!(p && p.open && p.pc.getTransceivers().some(t => t.receiver.track && t.receiver.track.kind === 'audio')); }
  liveToAll() { return this.o.role === 'member' ? this.liveTo('host') : this.members.length > 0 && this.members.every(m => this.liveTo(m.token)); }
  /** Push-to-talk: put our microphone on (track) or off (null) for every direct link. */
  setMic(track) { this.micTrack = track; this.eachSender('audio', track); }
  setCam(track) { this.camTrack = track; this.eachSender('video', track); }
  eachSender(kind, track) {
    for (const p of this.peers.values()) for (const t of p.pc.getTransceivers()) {
      if (t.receiver && t.receiver.track && t.receiver.track.kind === kind && t.sender) t.sender.replaceTrack(track).catch(() => {});
    }
  }
  /** Host: talk/video switched on or off mid-game → reconnect everyone with the new tracks. */
  setMedia(media) {
    if (media.audio === this.media.audio && media.video === this.media.video) return;
    this.media = { ...media };
    if (this.o.role !== 'host') return;
    for (const m of this.members) { this.drop(m.token); this.connect(m.token); }
  }
  peer(token) {
    const pc = new RTCPeerConnection({ iceServers: this.o.ice && this.o.ice.length ? this.o.ice : ICE });
    const p = { pc, ch: null, open: false, ice: [] };
    pc.ontrack = e => { this.o.onTrack && this.o.onTrack(token, e.track, e.streams && e.streams[0]); };
    pc.onicecandidate = e => { if (e.candidate) this.relay(token, { t: 'rtc-ice', c: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate }); };
    pc.onconnectionstatechange = () => { if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) { p.open = false; this.o.onLink && this.o.onLink(token, false); } };
    this.peers.set(token, p);
    return p;
  }
  drainIce(p) { const q = p.ice.splice(0); q.forEach(c => p.pc.addIceCandidate(c).catch(() => {})); }
  wire(token, p, ch) {
    p.ch = ch;
    ch.onopen = () => { p.open = true; this.o.onLink && this.o.onLink(token, true); };
    ch.onclose = () => { p.open = false; this.o.onLink && this.o.onLink(token, false); };
    ch.onmessage = e => { try { this.recv(token, JSON.parse(e.data)); } catch (er) {} };
  }
  drop(token) { const p = this.peers.get(token); if (p) { try { p.pc.close(); } catch (e) {} this.peers.delete(token); } }

  // ---------------------------------------------------------------- the end
  end(remote = false) {
    if (this.stopped) return;
    this.stopped = true; clearTimeout(this.timer);
    for (const t of [...this.peers.keys()]) this.drop(t);
    if (!remote) {
      const fd = new FormData(); fd.append('token', this.o.token); fd.append('_token', this.csrf());
      try { navigator.sendBeacon(this.o.urls.end, fd); } catch (e) {}
    }
    this.o.onEnded && this.o.onEnded(remote);
  }
}

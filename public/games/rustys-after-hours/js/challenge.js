// The door / gate pop-up: TALK button, checking answers, teaching when wrong.
import { Voice, Ears } from './speech.js';
import { matchWord, matchPhrase, matchNumber } from './answers.js';
import { teachReading, teachMath, storyHTML } from './teach.js';
import { Sfx } from './audio.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const PRAISE_READ = ['Awesome reading!', 'You read it!', 'Super reader!', 'Great job!', 'Wow! You are getting so good at this!', 'Nailed it!', 'Yes! That is right!'];
const PRAISE_MATH = ['You got it!', 'Math wizard!', 'Super smart!', 'Correct! Great thinking!', 'Yes! That is right!', 'Awesome math!', 'Nailed it!'];
const pick = a => a[Math.floor(Math.random() * a.length)];

export class Challenge {
  constructor(store, tutor) {
    this.store = store; this.tutor = tutor; this.session = 0; this.streak = 0;
    $('chTalk').addEventListener('click', () => this.talk());
    $('chHelp').addEventListener('click', () => this.help());
    $('chType').addEventListener('click', () => $('chPad').classList.toggle('hidden'));
    $('chClose').addEventListener('click', () => this.close(false));
    $('chYes').addEventListener('click', () => this.judge(null, true));
    $('chNo').addEventListener('click', () => this.judge(null, false));
    const pad = $('chPad');
    pad.innerHTML = '<div id="padVal" class="pad-val"></div>' + [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✔'].map(v => `<button data-v="${v}">${v}</button>`).join('');
    pad.addEventListener('click', e => {
      const v = e.target.dataset && e.target.dataset.v; if (v === undefined) return;
      const el = $('padVal');
      if (v === '⌫') el.textContent = el.textContent.slice(0, -1);
      else if (v === '✔') { if (el.textContent) { const val = el.textContent; el.textContent = ''; this.judge([val]); } }
      else if (el.textContent.length < 5) el.textContent += v;
    });
  }

  k(sess) {
    return {
      say: (t, o = {}) => { if (sess !== this.session) return Promise.resolve(); this.bubble(t); return Voice.speak(t, { pitch: 1.05, rate: 0.95, ...o }); },
      sleep: ms => new Promise(r => setTimeout(r, ms)),
      alive: () => sess === this.session,
    };
  }
  bubble(t) { $('chBubble').textContent = t; }
  sparky(t, o) { return this.k(this.session).say(t, o); }
  setBusy(b) { this.busy = b; ['chTalk', 'chHelp', 'chType'].forEach(id => $(id).disabled = b); }

  open(item, opts = {}) {
    this.session++; this.item = item; this.attempts = 0; this.helped = false; this.storyRead = false; this.finished = false;
    this.opts = opts; this.lastHeard = ''; this._rec = null;
    const isRead = item.track === 'reading';
    $('challenge').className = 'overlay ' + (opts.exit ? 'exit' : isRead ? 'read' : 'math');
    $('chTitle').textContent = opts.exit ? '🚪 EXIT GATE — Detective Problem' : isRead ? '📖 Read the door!' : '🔢 Solve to open the gate!';
    $('chType').classList.toggle('hidden', isRead);
    // no speech recognition (e.g. Chrome/Firefox on iPhone): show the number pad for math right away
    $('chPad').classList.toggle('hidden', isRead || Ears.supported); $('padVal').textContent = '';
    $('chGrown').classList.toggle('hidden', Ears.supported);
    $('chHeard').textContent = '';
    $('chTeach').classList.add('hidden'); $('chTeach').innerHTML = '';
    $('chContent').classList.remove('hidden');
    $('chContent').innerHTML = this.contentHTML(item);
    $('chHelp').textContent = item.kind === 'word' ? '🔊 Read it to me' : '💡 Help me';
    this.setBusy(false);
    this.intro();
    return new Promise(res => { this.resolve = res; });
  }

  contentHTML(it) {
    if (it.track === 'reading') {
      if (it.type === 'phrase') return `<div class="door-sign phrase-sign">${esc(it.text)}</div>`;
      return `<div class="door-sign word-sign">${esc(it.text)}</div>`;
    }
    if (it.kind === 'count') return `<div class="dots big">${'<span class="dot a"></span>'.repeat(it.n)}</div><div class="door-sign math-sign small">How many?</div>`;
    if (it.kind === 'word') return `<div class="story">${storyHTML(it)}</div>`;
    return `<div class="door-sign math-sign">${esc(it.text)}</div>`;
  }

  async intro() {
    const it = this.item;
    if (it.track === 'reading') {
      await this.sparky(it.type === 'phrase' ? 'Read the sentence on the door! Press TALK, then read it out loud.' : 'Read the word on the door! Press TALK, then say the word.');
    } else if (it.kind === 'word') {
      await this.sparky(this.opts.exit ? 'This is the exit gate! Solve the story problem to escape. Listen!' : 'Story problem! Listen carefully.');
      await this.sparky(it.story, { rate: 0.88 }); this.storyRead = true;
      await this.sparky('Press TALK and say the answer. Need help? Tap Help me.');
      $('chHelp').textContent = '💡 Help me';
    } else {
      await this.sparky(`${it.say} Press TALK and say the answer.`);
    }
  }

  async talk() {
    if (this.busy || this.finished) return;
    Sfx.click(); Voice.stop();
    this.setBusy(true);
    $('chTalk').classList.add('listening'); $('chTalk').textContent = '👂 Listening...';
    this.bubble('I\'m listening...');
    const r = await Ears.listen(this.item.type === 'phrase' || this.item.kind === 'word' ? 9000 : 6000);
    $('chTalk').classList.remove('listening'); $('chTalk').textContent = '🎤 TALK';
    Sfx.init(); // iPhone can pause game sounds while the mic is on — wake them back up
    this.setBusy(false);
    if (this.finished) return;
    if (!r.ok) {
      if (r.error === 'not-allowed' || r.error === 'service-not-allowed') { $('chGrown').classList.remove('hidden'); return this.sparky('I need the microphone to hear you. Ask a grown-up to allow the microphone. A grown-up can also tap the check or X buttons.'); }
      if (r.error === 'network') { $('chGrown').classList.remove('hidden'); return this.sparky('The talk button needs the internet right now. A grown-up can tap the check or X buttons.'); }
      if (r.error === 'unsupported') { $('chGrown').classList.remove('hidden'); return this.sparky('This browser can\'t hear you. Use Chrome on Android, or Safari on iPhone and iPad. A grown-up can tap the check or X buttons.'); }
      return this.sparky('I didn\'t hear anything. Press TALK and say it nice and loud!');
    }
    this.judge(r.alts);
  }

  async judge(alts, forced) {
    if (this.finished || this.busy) return;
    const it = this.item; let ok = false, missing = [];
    if (alts) {
      this.lastHeard = alts[0] || '';
      $('chHeard').textContent = `I heard: "${this.lastHeard}"`;
      const strict = this.store.data.settings.strict || 'easy';
      if (it.track === 'reading') {
        if (it.type === 'phrase') { const m = matchPhrase(it.text, alts, strict); ok = m.ok; missing = m.missing; }
        else ok = matchWord(it.text, alts, strict);
      } else ok = matchNumber(it.answer, alts);
    } else { ok = !!forced; this.lastHeard = forced ? '(grown-up ✔)' : '(grown-up ✖)'; }

    if (ok) return this.win();
    this.attempts++; this.streak = 0; Sfx.wrong();
    this.setBusy(true);
    const sess = this.session, k = this.k(sess);
    if (this.attempts === 1) {
      await k.say(it.track === 'reading' ? 'Hmm, not quite. That\'s okay! Let\'s figure it out together.' : 'Not quite. That\'s okay! Let\'s figure it out together.');
      await this.runTeach(k);
      if (!k.alive()) return;
      await k.say(it.track === 'reading' ? `Your turn! Press TALK and read it.` : 'Your turn! Press TALK and say the answer.');
    } else if (this.attempts === 2) {
      if (it.track === 'reading') {
        if (missing.length && it.type === 'phrase') await k.say(`Almost! Look at ${missing.length === 1 ? 'this word' : 'these words'}: ${missing.join(', ')}.`);
        await k.say(`Listen carefully. ${it.text}. Now you say it. Press TALK.`, { rate: 0.8 });
      } else {
        await k.say(`Let's look again. The answer is ${it.answer}. Press TALK and say ${it.answer}.`);
      }
    } else {
      await k.say('Good try! You worked hard. We will practice that one again later.');
      if (!k.alive()) return;
      this.finish(false);
      return;
    }
    if (k.alive()) this.setBusy(false);
  }

  async runTeach(k) {
    const box = $('chTeach');
    box.classList.remove('hidden'); $('chContent').classList.add('hidden');
    if (this.item.track === 'reading') await teachReading(this.item, box, k); else await teachMath(this.item, box, k);
    if (!k.alive()) return;
    // put the door back so he reads the real thing again (teaching stays for math)
    if (this.item.track === 'reading') { box.classList.add('hidden'); $('chContent').classList.remove('hidden'); }
  }

  /** Is the pop-up open right now? (grown-ups watching see the door's word / problem) */
  get isOpen() { return !!this.resolve; }

  async help() {
    if (this.busy || this.finished) return;
    const it = this.item;
    if (it.kind === 'word' && !this.storyRead) {
      this.setBusy(true); await this.sparky(it.story, { rate: 0.88 }); this.storyRead = true; $('chHelp').textContent = '💡 Help me'; this.setBusy(false); return;
    }
    this.helped = true; this.setBusy(true);
    const k = this.k(this.session);
    await this.runTeach(k);
    if (!k.alive()) return;
    await k.say(it.track === 'reading' ? 'Now you try! Press TALK and read it.' : 'Now you try! Press TALK and say the answer.');
    this.setBusy(false);
  }

  async win() {
    this.setBusy(true); this.streak++;
    Sfx.correct();
    $('challenge').classList.add('win');
    const it = this.item;
    const k = this.k(this.session);
    const rec = this.finish(true, true);
    let msg = pick(it.track === 'reading' ? PRAISE_READ : PRAISE_MATH);
    if (this.streak === 3) msg += ' Three in a row!';
    if (this.streak === 5) msg += ' Five in a row! You are on fire!';
    await k.say(msg);
    if (rec.change === 1) {
      const info = this.tutor.levelInfo(it.track, rec.level);
      await k.say(`Level up! ${it.track === 'reading' ? 'Reading' : 'Math'} level ${rec.level}: ${info.name}!`);
    }
    this.close(true);
  }

  // record the result exactly once
  finish(correct, keepOpen = false) {
    if (this.finished) return this._rec;
    this.finished = true;
    const it = this.item;
    const firstTry = this.attempts === 0;
    const rec = this.tutor.record(it, { correct, firstTry, helped: this.helped });
    const clean = correct && firstTry && !this.helped;
    this.store.data.tokens += clean ? 3 : 1;
    this.store.logAttempt({ track: it.track, level: it.level, prompt: it.track === 'reading' ? it.text : (it.story || it.text), expected: String(it.track === 'reading' ? it.text : it.answer),
      heard: this.lastHeard, correct, first_try: firstTry, helped: this.helped, review: !!it.review, at: new Date().toISOString() });
    this.store.save();
    this._rec = { ...rec, clean };
    if (!keepOpen) setTimeout(() => this.close(true), 400);
    return this._rec;
  }

  close(solved) {
    if (!this.resolve) return;
    this.session++; Voice.stop(); Ears.stop();
    $('challenge').classList.add('hidden'); $('challenge').classList.remove('win');
    const r = this.resolve; this.resolve = null;
    r({ solved, clean: this._rec ? this._rec.clean : false, levelUp: !!(this._rec && this._rec.change === 1) });
    this._rec = null;
  }
}

import {createGuide,guideView,submitGuide} from './hint-guide.js';
import {mountHintPanel} from './hint-panel.js';
import { Store, defaults } from './storage.js';
import { Tutor } from './tutor.js';
import { Voice, Ears } from './speech.js';
import { matchWord, matchPhrase, matchNumber } from './answers.js';
import { Sfx } from './audio.js';
import { mountTogether } from '/games/_play/together.js';
import { BoardRenderer } from './board-render.js';
import {motionFor,sampleMotion} from './board-motion.js';
import { CHARACTERS, SHIRTS, FINISH, portrait, tilePoint, newMatch, restoreMatch, unlockRoll, roll, nextTurn, controllerTag, assignShirts, shirtPicker } from './board.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = Store, tutor = new Tutor(store);
const renderer = new BoardRenderer($('game'));
let match = null, lobby = [], controllers = {}, members = [], together, animation = null, botTimer;
let guide=null;
const hintPanel=mountHintPanel($('questionHelp'),(value,revision)=>{if(activeLocal())hintStep(value,revision);});
let questionOpen=false,autoTurnTimer=null;let paused = false, muted = false, listening = false, loaded = false, lastFrame = 0, resumeControllers = {};
const guestTutors = new Map();
const current = () => match?.players[match.turn];
const key = () => match ? `${match.id}:${match.round}:${match.turn}:${match.phase}:${match.attempts}` : 'lobby';
const activeLocal = () => match && !current().bot && !current().remote && !animation && !paused;
const controllerKey = () => `candy-cloud-controllers-${store.playerId}`;

function tell(text) { $('announcement').textContent = text; together?.poke(); }
function speak(text) { if (!muted) Voice.speak(text, { rate: .95, pitch: 1.1 }); together?.say(text); }
function save() {
  if (match) store.data.boardMatch = match;
  store.save();
  if (match) { resumeControllers = { ...controllers }; try { sessionStorage.setItem(controllerKey(), JSON.stringify(controllers)); } catch {} }
  together?.poke();
}
function show(id, on) { $(id).classList.toggle('hidden', !on); if (id === 'table') document.body.classList.toggle('playing', on); }
function clearTimers() { clearTimeout(botTimer);clearTimeout(autoTurnTimer); botTimer = null; }

function seatCard(seat,i){if(seat.remote)return '<article class="seat remote-reserved"><b>Family seat · another device</b><div class="seat-person">'+(controllers[i]?portrait(seat.character,seat.shirt):'<span class="reserved-avatar">?</span>')+'<div><strong>'+esc(seat.name)+'</strong><p>'+(controllers[i]?'Character and color chosen on their device.':'Your parent or grandparent chooses their own character in Grown-Ups → Join.')+'</p></div></div><button class="icon remove-seat" data-index="'+i+'" aria-label="Remove family seat">×</button></article>';
  return `<article class="seat" style="--seat:${seat.shirt}"><div class="seat-top"><span class="seat-number">${i + 1}</span><b>${i === 0 ? 'You' : seat.bot ? 'Bot player' : seat.remote ? 'Separate device' : 'Family player'}</b>${i ? `<button type="button" class="icon remove-seat" data-index="${i}" aria-label="Remove player ${i + 1}">×</button>` : ''}</div>
    <div class="seat-person">${portrait(seat.character, seat.shirt)}<div><label for="seatName${i}">Player name</label><input id="seatName${i}" data-name="${i}" value="${esc(seat.name)}" maxlength="24" ${seat.remote ? 'readonly' : ''} autocomplete="off"><small>${seat.remote ? (controllers[i] ? '✓ Connected through Grown-Ups' : 'Waiting for a Grown-Up to join…') : seat.bot ? 'A friendly computer opponent' : 'Takes turns on this device'}</small></div></div>
    <div class="character-grid" aria-label="Choose a character for player ${i + 1}">${CHARACTERS.map((c, n) => `<button type="button" class="character ${seat.character === n ? 'selected' : ''}" data-seat="${i}" data-character="${n}" aria-pressed="${seat.character === n}" title="${c.name}${c.wheelchair ? ', wheelchair user' : ''}">${portrait(n, seat.shirt)}<span>${c.name}</span></button>`).join('')}</div><small>Shirt color · colors already chosen are unavailable</small>${shirtPicker(seat.shirt, lobby.filter((p, n) => n !== i).map(p => p.shirt), i)}</article>`;
}
function drawLobby() {
  assignShirts(lobby).forEach((color, i) => { lobby[i].shirt = color; });
  $('seats').innerHTML = lobby.map(seatCard).join('');
  $('playerCount').textContent = `${lobby.length} / 6 players`;
  ['addFamily', 'addBot', 'addRemote'].forEach(id => { $(id).disabled = lobby.length >= 6; });
  $('startGame').disabled = lobby.length < 2 || lobby.some((p, i) => p.remote && !controllers[i]);
  $('resumeGame').classList.toggle('hidden', !restoreMatch(store.data.boardMatch));
  $('resumeGame').textContent = store.data.boardMatch?.phase === 'finished' ? 'View last game' : 'Resume saved game';
  $('addRemote').disabled = lobby.length >= 6 || lobby.filter(p => p.remote).length >= 4;
  together?.poke();
}
function makeLobby() {
  lobby = [{ name: store.data.name, character: 0, bot: false }, { name: 'Pip Bot', character: 1, bot: true }];
  controllers = {}; drawLobby();
}
function addSeat(type) {
  if (lobby.length >= 6) return;
  const i = lobby.length;
  lobby.push({ name: type === 'remote' ? 'Waiting for family' : type === 'bot' ? `Candy Bot ${i}` : `Player ${i + 1}`, character: i % CHARACTERS.length, bot: type === 'bot', remote: type === 'remote' });
  drawLobby();
}
function startGame() {questionOpen=false;
  if (lobby.some((p, i) => p.remote && !controllers[i])) return;
  match = newMatch(lobby, $('practiceFocus').value); guestTutors.clear(); paused = false;
  if (store.data.settings.music && !muted) Sfx.startMusic();
  animation = null; clearTimers(); save(); show('setup', false); show('table', true); show('pause', false); show('winner', false);
  enterTurn();
}
function resumeGame() {
  match = restoreMatch(store.data.boardMatch); if (!match) return;
  controllers = { ...resumeControllers };
  if (store.data.settings.music && !muted) Sfx.startMusic();
  clearTimers(); animation = null; paused = false; guestTutors.clear();
  show('setup', false); show('table', true); show('winner', false); show('pause', false);
  if (match.phase === 'finished') { drawTurn(); finishGame(); }
  else if (match.phase === 'question') enterTurn(); else if(match.phase==='ready'){doRoll();}else {drawTurn();autoTurnTimer=setTimeout(passTurn,600);}
}
function turnTutor() {
  if (match.turn === 0) return tutor;
  if (!guestTutors.has(match.turn)) {
    const data = defaults(); data.reading.level = store.data.reading.level; data.math.level = store.data.math.level;
    data.settings = { ...store.data.settings };
    guestTutors.set(match.turn, new Tutor({ data, save() {} }));
  }
  return guestTutors.get(match.turn);
}
function enterTurn() {
  if (!match || match.phase !== 'question') return;
  const p = current();
  if (!match.question) {
    const track = match.focus === 'both' ? ((match.round + match.turn) % 2 ? 'math' : 'reading') : match.focus;
    match.question = turnTutor().pick(track); save();
  }
  guide=null;hintPanel.update(null);$('answerInput').value = ''; $('answerFeedback').textContent = ''; show('questionHelp', false);
  questionOpen=false;tell(`${p.name}’s turn. Tap the die to start.`); drawTurn(); scheduleBot();
}
function questionText(item = match?.question) {
  if (!item) return '';
  if (item.track === 'reading') return `Read aloud: ${item.text}`;
  if (item.kind === 'count') return `How many candies? ${'● '.repeat(item.n)}`;
  return item.story || item.text || item.say;
}
function drawTurn() {
  if (!match) return;
  const p = current(), remote = p.remote, bot = p.bot, q = match.phase === 'question';
  $('turnName').textContent = `${p.name}’s turn`;
  $('turnAvatar').innerHTML = portrait(p.character, p.shirt);
  $('roundNumber').textContent = `Round ${match.round}`;
  $('turnKind').textContent = bot ? 'BOT PLAYER' : remote ? 'FAMILY · SEPARATE DEVICE' : 'YOUR TURN · THIS DEVICE';
  $('turnCard').style.setProperty('--seat', p.shirt);
  $('players').innerHTML = match.players.map((p, i) => `<li class="${i === match.turn ? 'active' : ''}" style="--seat:${p.shirt}">${portrait(p.character, p.shirt)}<div><b>${esc(p.name)}</b><small>${p.bot ? 'Bot' : p.remote ? 'Family online' : 'This device'} · ${p.pos === FINISH ? 'Finish!' : p.pos === 0 ? 'At start' : `Space ${p.pos}`}</small></div><span>${i === match.turn ? '●' : ''}</span></li>`).join('');
  show('questionCard',true);show('questionModal',q&&questionOpen&&activeLocal());show('rollCard',false);show('resultCard',false);$('rollDice').classList.remove('hidden');
  $('questionTrack').textContent = match.question?.track === 'reading' ? '📖 Reading stop' : '🔢 Think it through';
  $('questionText').textContent = questionText();
  $('answerInput').inputMode = match.question?.track === 'math' ? 'decimal' : 'text';
  $('answerInput').placeholder = match.question?.track === 'math' ? 'Your answer' : 'Read aloud, or type the word';
  $('answerInput').disabled = !activeLocal(); $('checkAnswer').disabled = !activeLocal();
  $('listenAnswer').disabled = !activeLocal() || listening;
  $('listenAnswer').textContent = listening ? 'Listening…' : '🎤 Say it';
  $('listenAnswer').classList.toggle('hidden', !Ears.supported);
  $('turnWait').textContent = remote ? `${p.name} plays from Grown-Ups on their device.` : bot ? `${p.name} is thinking…` : 'Tap the die. A correct answer starts your move!';
  $('rollDice').classList.toggle('dice-prompt',activeLocal()&&!questionOpen&&!paused&&!animation&&['question','ready'].includes(match.phase));
  $('rollDice').disabled = !activeLocal()||!['question','ready'].includes(match.phase);$('rollDice').querySelector('strong').textContent=animation?'Moving…':current().remote?current().name+'’s turn':current().bot?'Bot’s turn':'Tap the die';
  $('rollHint').textContent = bot ? `${p.name} earned a roll!` : remote ? `${p.name} can roll on their device.` : 'You did it! Tap the die to roll.';
  $('rollDice').querySelector('.dice-face').textContent=match.die?['⚀','⚁','⚂','⚃','⚄','⚅'][match.die-1]:'⚄';$('dice').textContent = match.die ? ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][match.die - 1] : '⚄';
  $('dice').classList.toggle('rolling', !!animation);
  $('resultText').textContent = match.move?.message || '';
  $('candySwatch').style.background = match.move?.color || 'transparent'; show('candySwatch', match.move?.kind === 'candy');
  $('nextTurn').disabled = !!animation || paused || remote;
  $('nextTurn').textContent = match.phase === 'finished' ? 'View winner ★' : 'Next player →';
  $('resultWait').textContent = animation ? 'Follow your character along the trail…' : remote ? `${p.name} can pass the die on their device.` : bot ? 'Ready for the next player.' : 'Pass the die when you’re ready.';
  $('boardMode').textContent = renderer.backend === 'webgl' ? '3D TABLETOP' : 'CLASSIC TABLETOP';
  renderer.dirty = true; together?.poke();
}
function isCorrect(value, speech = false) {
  const it = match.question;
  if (it.track === 'math') return speech ? matchNumber(it.answer, value) : /^-?\d+(?:\.\d+)?$/.test(String(value).trim()) && Number(value) === it.answer;
  const alts = speech ? value : [String(value)];
  const strict = store.data.settings.strict || 'easy';
  return it.type === 'phrase' ? matchPhrase(it.text, alts, strict).ok : matchWord(it.text, alts, strict);
}
function answer(value, speech = false) {
  if (!match || match.phase !== 'question' || animation || paused || !current().bot&&!questionOpen) return;
  if (!isCorrect(value, speech)) {
    match.attempts++; save(); Sfx.wrong();
    $('answerFeedback').textContent = 'Not quite. Try again, or ask for a hint. Your turn stays with you.';
    tell(`${current().name}, try again. A hint can help.`); return false;
  }
  const item = match.question, clean = match.attempts === 0 && !match.helped;
  // Only the signed-in child's own answers belong in their learning report.
  if (match.turn === 0) {
    tutor.record(item, { correct: true, firstTry: match.attempts === 0, helped: match.helped });
    store.data.tokens += clean ? 3 : 1;
    store.logAttempt({ track: item.track, level: item.level, prompt: item.story || item.text || item.say,
      expected: String(item.track === 'reading' ? item.text : item.answer), heard: speech ? value[0] : String(value),
      correct: true, first_try: match.attempts === 0, helped: match.helped, review: !!item.review, at: new Date().toISOString() });
  } else if (!current().bot) turnTutor().record(item, { correct: true, firstTry: match.attempts === 0, helped: match.helped });
  unlockRoll(match);questionOpen=false;save();Sfx.correct();drawTurn();doRoll();return true;
}
function hint() {
  if (!match?.question || match.phase !== 'question') return;
  match.helped = true;
  if(!guide)guide=createGuide(match.question);
  const view=guideView(guide);hintPanel.update(view);show('questionHelp',true);save();speak([view.text,view.prompt].filter(Boolean).join(' '));
}
function hintStep(value,revision){
  if(!guide||guide.revision!==revision||match?.phase!=='question'||!questionOpen||paused||animation)return;
  submitGuide(guide,value);const view=guideView(guide);hintPanel.update(view);speak([view.feedback,view.text,view.prompt].filter(Boolean).join(' '));together?.poke();
}
async function listen() {
  if (!activeLocal() || match.phase !== 'question' || listening) return;
  const turnKey = key(); listening = true; Voice.stop(); drawTurn();
  const result = await Ears.listen(); listening = false;
  if (turnKey !== key() || paused) return;
  if (result.ok) answer(result.alts, true);
  else $('answerFeedback').textContent = 'You can type your answer instead. The microphone is optional.';
  drawTurn();
}
function doRoll() {
  if (!match || match.phase !== 'ready' || animation || paused) return;
  clearTimers(); Voice.stop();
  const move = roll(match); if (!move) return;
  // Save the outcome before animating: reloads cannot reroll a turn.
  const motion=motionFor(move,{reduced:window.matchMedia('(prefers-reduced-motion: reduce)').matches,speed:store.data.settings.speed});save();animation={...motion,index:match.turn,start:performance.now()};
  Sfx.click(); tell(`${current().name} rolled ${match.die}!`); drawTurn();
}
function finishAnimation() {
  animation = null; renderer.visual = null;renderer.follow=null; renderer.dieRolling = false;
  tell(`${current().name}: ${match.move.message}`); drawTurn();
  if (match.phase === 'finished') finishGame(); else autoTurnTimer=setTimeout(passTurn,600);
}
function passTurn() {
  if (!match || animation || paused) return;
  if (match.phase === 'finished') return finishGame();
  if (nextTurn(match)) { clearTimers(); Voice.stop(); Ears.stop(); listening = false; save(); enterTurn(); }
}
function openQuestion(){if(!match||animation||paused)return;if(match.phase==='ready')return doRoll();if(match.phase!=='question')return;questionOpen=true;drawTurn();if(activeLocal()){speak(questionText());setTimeout(()=>$('answerInput').focus(),60);}together?.poke();}
function scheduleBot() {
  clearTimeout(botTimer);
  if (!match || !current().bot || paused || animation) return;
  const turnKey = key();
  botTimer = setTimeout(() => {
    if (!match || key() !== turnKey || paused || animation) return;
    if (match.phase === 'question') {
      const it = match.question, value = it.track === 'reading' ? it.text : String(it.answer);
      answer(value);
    } else if (match.phase === 'ready') doRoll();
    else if (match.phase === 'result') passTurn();
  }, match.phase === 'question' ? 2200 : 1400);
}
function finishGame() {
  if (!match || match.phase !== 'finished') return;
  clearTimers(); Sfx.stopMusic();
  if (!match.rewarded) {
    match.rewarded = true; store.data.stats.stages++; store.data.stats.boardGames = (store.data.stats.boardGames || 0) + 1; store.data.stage++;
    store.data.tokens += match.winner === 0 ? 10 : 5; save(); Sfx.rainbow();
  }
  const p = match.players[match.winner];
  $('winnerAvatar').innerHTML = portrait(p.character, p.shirt);
  $('winnerName').textContent = `${p.name} reached the Summit Lookout!`;
  $('winnerCopy').textContent = `What an adventure! ${match.round} rounds of thinking, climbing, and sliding. ${match.winner === 0 ? 'You earned 10' : 'You earned 5'} jelly beans for playing.`;
  show('winner', true); together?.poke();
}
function setPaused(value) {
  if (!match || animation) return;
  paused = value; clearTimers(); Voice.stop(); Ears.stop(); listening = false;
  if (value) Sfx.stopMusic(); else if (store.data.settings.music && !muted) Sfx.startMusic();
  show('pause', value); drawTurn();
  if (value) {
    $('recoverSeats').textContent='Family seats are controlled from the Grown-Ups device.';
  } else if(match.phase==='result') autoTurnTimer=setTimeout(passTurn,600);
  else if(match.phase==='ready') doRoll();
  else scheduleBot();
  together?.poke();
}
function menu() {questionOpen=false;show('questionModal',false);renderer.follow=null;
  clearTimers(); Voice.stop(); Ears.stop(); Sfx.stopMusic(); paused = false; animation = null; renderer.visual = null;
  save(); resumeControllers = { ...controllers }; match = null; show('table', false); show('pause', false); show('winner', false); show('setup', true); makeLobby();
}
async function leave() {
  clearTimers(); Voice.stop(); Ears.stop(); Sfx.stopMusic(); save(); $('exitGame').disabled = true;
  await Promise.race([store.flushNow(), new Promise(resolve => setTimeout(resolve, 2500))]);
  location.href = store.config.urls.exit || '/dashboard';
}

// Remote input travels over the existing authenticated Grown-Ups co-op link.
// The host owns the rules, die and turn state. A sender may act only for their seat.
function remoteMessage(from, message) {
  if (message.t !== 'board' || !loaded || !together?.grownups().some(g => g.token === from)) return;
  const member = together.grownups().find(g => g.token === from);
  if (!match) {
    if (message.action === 'join') {
      let index = Object.keys(controllers).find(i => controllers[i] === from);
      if (index === undefined) index = lobby.findIndex((p, i) => p.remote && !controllers[i]);
      if (index < 0 || !lobby[index]?.remote) return;
      controllers[index] = from; lobby[index].name = member.name.slice(0, 24);
      lobby[index].character = Math.max(0, Math.min(CHARACTERS.length - 1, message.character | 0));
      if (SHIRTS.includes(message.shirt) && !lobby.some((p, i) => Number(i) !== Number(index) && p.shirt === message.shirt)) lobby[index].shirt = message.shirt;
      drawLobby(); save();
    }
    return;
  }
  // Reclaim a reserved seat after rejoining with the same authenticated token.
  if (message.action === 'join') {
    const assigned = Object.keys(controllers).some(i => controllers[i] === from);
    if (!assigned) {
      const i = match.players.findIndex((p, i) => p.remote && p.name === member.name.slice(0, 24) && !members.some(m => m.token === controllers[i]));
      if (i >= 0) { controllers[i] = from; save(); }
    }
    return;
  }
  if (controllers[match.turn] !== from || !current().remote || message.key !== key() || paused || animation) return;
  if(message.action==='open'&&match.phase==='question')return openQuestion();if(message.action==='close'){questionOpen=false;drawTurn();return;}
  if (message.action === 'answer' && typeof message.value === 'string' && message.value.length <= 200 && match.phase === 'question') answer(message.value);
  else if(message.action==='hint-step'&&typeof message.value?.value==='string'&&message.value.value.length<=3)hintStep(message.value.value,message.value.revision);
  else if (message.action === 'hint' && match.phase === 'question') hint();
  else if (message.action === 'roll' && match.phase === 'ready') doRoll();
  else if (message.action === 'next' && ['result', 'finished'].includes(match.phase)) passTurn();
}
function remoteState() {
  const seats = (match?.players || lobby).map((p, i) => ({ name: p.name, character: p.character, shirt: p.shirt, bot: !!p.bot, remote: !!p.remote, pos: p.pos || 0,
    // Public labels identify controllers without sharing their bearer tokens.
    controller: controllers[i] ? controllerTag(controllers[i]) : null }));
  return { title: 'Candy Cloud Trail', lobby: !match, seats, key: key(), turn: match?.turn ?? 0,
    questionOpen,motion:animation?{...animation,start:undefined,elapsed:performance.now()-animation.start,sentAt:Date.now()}:null,phase: paused ? 'paused' : animation ? 'moving' : match?.phase || 'lobby', question: questionText(),
    feedback: $('answerFeedback').textContent, hint: '',guide:guideView(guide),
    message: $('announcement').textContent, die: match?.die || null };
}
function mountFamily() {
  const C = store.config;
  together = mountTogether({ canvas: $('game'), kid: C.kid, game: C.game, url: C.urls.coop, csrf: () => store.csrf, frames: false, screen: false,
    speak, stopSpeak: () => Voice.stop(), toast: tell, sfx: { coin: () => Sfx.bean() },
    status: () => ({ goal: match ? `${current().name}’s turn · Round ${match.round}` : 'Choose your players. Join a reserved family seat from Grown-Ups.',
      screen: $('announcement').textContent, tip: 'Solve a problem, roll the die, follow the candy trail.',
      level: `Reading ${store.data.reading.level} · Math ${store.data.math.level}`, board: remoteState() }),
    onMsg: remoteMessage, onMembers: list => { members = list; together?.poke(); },
    helps: [{ id: 'board-hint', icon: '💡', label: 'Help with the problem', cool: 2 }],
    onHelp: () => { if (match?.phase === 'question' && !current().bot) hint(); },
    onHint: () => { hint(); return true; },
  });
  together?.start('Candy Cloud Trail');
}

const dialog=document.createElement('div');dialog.id='questionModal';dialog.className='modal hidden question-modal';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Roll challenge');dialog.innerHTML='<div class="modal-card"><button id="closeQuestion" class="text-button">← Back to board</button><h2>Earn your move</h2></div>';document.body.appendChild(dialog);dialog.firstElementChild.appendChild($('questionCard'));dialog.addEventListener('keydown',e=>{if(e.key==='Tab'){const focus=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled)')].filter(e=>!e.closest('.hidden')),first=focus[0],last=focus.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});document.querySelector('.board-area').appendChild($('rollDice'));
$('seats').addEventListener('input', e => { const index = e.target.dataset.name; if (lobby[index]?.remote)return;if (index !== undefined) { lobby[index].name = e.target.value; together?.poke(); } });
$('seats').addEventListener('click', e => {
  const color = e.target.closest('[data-shirt]');
  if (color && !color.disabled) { const i = Number(color.dataset.colorSeat);if(lobby[i]?.remote)return; if (!lobby.some((p, n) => n !== i && p.shirt === color.dataset.shirt)) { lobby[i].shirt = color.dataset.shirt; drawLobby(); } }
  const character = e.target.closest('[data-character]'), remove = e.target.closest('.remove-seat');
  if (character) {if(lobby[character.dataset.seat]?.remote)return; lobby[character.dataset.seat].character = Number(character.dataset.character); drawLobby(); }
  if (remove) {
    const i = Number(remove.dataset.index); lobby.splice(i, 1);
    controllers = Object.fromEntries(Object.entries(controllers).filter(([n]) => Number(n) !== i).map(([n, token]) => [Number(n) > i ? Number(n) - 1 : Number(n), token])); drawLobby();
  }
});
$('addFamily').onclick = () => addSeat('remote'); $('addBot').onclick = () => addSeat('bot'); $('addRemote').onclick = () => addSeat('remote');
function initAudio() { Voice.unlock(); Sfx.init(); if (Sfx.master) Sfx.master.gain.value = muted ? 0 : .8; }
$('startGame').onclick = () => { initAudio(); startGame(); };
$('resumeGame').onclick = () => { initAudio(); resumeGame(); };
$('answerForm').onsubmit = e => { e.preventDefault(); if (activeLocal()) answer($('answerInput').value); };
$('listenAnswer').onclick = listen;
$('readQuestion').onclick = () => { Voice.stop(); speak(questionText()); };
$('hintQuestion').onclick = hint;
$('rollDice').onclick=()=>{if(activeLocal())openQuestion();};$('closeQuestion').onclick=()=>{questionOpen=false;drawTurn();$('rollDice').focus();};let tapStart;renderer.canvas.addEventListener('pointerdown',e=>tapStart={x:e.clientX,y:e.clientY});renderer.canvas.addEventListener('pointerup',e=>{const r=renderer.canvas.getBoundingClientRect(),d=renderer.project(5.92,.5,3.55);if(tapStart&&Math.hypot(e.clientX-tapStart.x,e.clientY-tapStart.y)<10&&Math.hypot(e.clientX-r.left-d.x,e.clientY-r.top-d.y)<45&&activeLocal())openQuestion();});
$('nextTurn').onclick = () => { if (!current()?.remote) passTurn(); };
$('pauseGame').onclick = () => setPaused(true); $('resumeTurn').onclick = () => setPaused(false);
$('backToSetup').onclick = menu; $('playAgain').onclick = menu; $('winnerHome').onclick = leave;
$('exitGame').onclick = leave; $('setupExit').onclick = leave;
$('soundToggle').onclick = () => { muted = !muted; Voice.stop(); if (Sfx.master) Sfx.master.gain.value = muted ? 0 : .8; if (muted) Sfx.stopMusic(); else if (match && !paused && store.data.settings.music) Sfx.startMusic(); $('soundToggle').textContent = muted ? '🔇' : '🔊'; $('soundToggle').setAttribute('aria-pressed', String(muted)); };
$('zoomIn').onclick = () => { renderer.zoom = Math.min(1.35, renderer.zoom + .1); renderer.dirty = true; };
$('zoomOut').onclick = () => { renderer.zoom = Math.max(.75, renderer.zoom - .1); renderer.dirty = true; };
$('resetView').onclick = () => { renderer.angle = 0; renderer.zoom = 1; renderer.dirty = true; };
window.addEventListener('keydown', e => { if(e.key==='Escape'&&questionOpen){questionOpen=false;drawTurn();$('rollDice').focus();}else if (e.key === 'Escape' && match && !animation) setPaused(!paused); });
window.addEventListener('pagehide', () => { save(); store.beacon(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { Voice.stop(); Ears.stop(); } });

function frame(now) {
  requestAnimationFrame(frame);
  if (now - lastFrame < 33) return; lastFrame = now;
  if (animation) {
    const a = animation, elapsed = now - a.start, move = a.move;
    if (elapsed >= a.duration) { finishAnimation(); }
    else {
      const sample=sampleMotion(a,elapsed);renderer.dieRolling=sample.dieRolling;renderer.visual={index:a.index,...sample};renderer.follow={x:sample.x,z:sample.z,amount:sample.zoom};renderer.dirty=true;
      if (elapsed < a.rollDuration) $('dice').textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][Math.floor(elapsed / 80) % 6];
      else $('dice').textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][match.die - 1];$('rollDice').querySelector('.dice-face').textContent=$('dice').textContent;
    }
  }
  if (renderer.dirty || match && now % 1000 < 70) renderer.draw(match, now / 1000);
}
requestAnimationFrame(frame);

async function boot() {
  const result = await store.load();
  try { controllers = JSON.parse(sessionStorage.getItem(controllerKey()) || '{}'); } catch { controllers = {}; }
  resumeControllers = { ...controllers };
  makeLobby();
  $('practiceFocus').value = store.data.settings.focus || 'both';
  loaded = true; $('startGame').textContent = 'Let’s play →'; show('loading', false); drawLobby();
  tell(result?.offline ? 'Offline? You can still play on this device. Your progress saves here.' : 'A little thinking. A little luck. A whole lot of candy.');
  mountFamily();
  store.onExternalChange = () => { clearTimers(); Voice.stop(); Ears.stop(); match = null; animation = null; renderer.visual = null; show('table', false); show('pause', false); show('winner', false); show('setup', true); makeLobby(); tell('Grown-up settings updated. Choose your players to start again.'); };
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  window.__candy = { renderer, get match() { return match; }, get lobby() { return lobby; }, get animation() { return animation; } };
}
boot().catch(() => { $('loading').textContent = 'Could not load the game. Refresh to try again.'; });

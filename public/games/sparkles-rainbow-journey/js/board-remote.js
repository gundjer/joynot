import {mountHintPanel} from './hint-panel.js';
import { CHARACTERS, SHIRTS, portrait, controllerTag, shirtPicker } from './board.js';
import { BoardRenderer } from './board-render.js';
import {sampleMotion} from './board-motion.js';

// Mounted only in Candy Cloud Trail's PIN-protected Grown-Ups helper page.
export function mountBoardRemote({ parent, me, send }) {
  const root = document.createElement('section'); root.id = 'boardRemote';
  root.innerHTML = `<style>
    #guard.candy-family{display:flex;background:#f7f4e9}#guard.candy-family>.panel{grid-column:auto;flex:1;max-height:none;border:0;padding:20px 4%;background:#f7f4e9;align-content:start}
    #guard.candy-family>.hh{background:#e2e9d8}#guard.candy-family #status,#guard.candy-family #together,#guard.candy-family #btns{width:100%;max-width:1200px;margin:auto}
    #boardRemote{background:#f9f5e8;color:#304b40;padding:20px;border-radius:20px;margin:16px 0;font-family:Andika,sans-serif}
    #guard.candy-family #boardRemote{width:100%;max-width:1200px;margin:0 auto 20px;display:grid;grid-template-columns:minmax(0,1.4fr) minmax(250px,1fr);gap:0 25px}
    #boardRemote>small,#boardRemote>h2{grid-column:1/-1}#boardRemote>canvas{grid-column:1;grid-row:3/8;align-self:start}
    #boardRemote>.br-status,#boardRemote>.br-join,#boardRemote>.br-play{grid-column:2}
    #boardRemote h2{font-family:Georgia,serif;font-weight:400;font-size:30px;margin:6px 0 15px;color:#304b40}
    #boardRemote p{font-size:14px;line-height:1.7;color:#687a64}#boardRemote small{font-size:11px;color:#7a8b72}
    #boardRemote canvas{width:100%;height:480px;display:block;touch-action:none;border-radius:14px;background:#e4ebdf}
    #boardRemote .br-characters{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
    #boardRemote .br-character{padding:6px;border:2px solid transparent;background:#eeeede;border-radius:12px;color:#40563f;min-height:65px}
    #boardRemote .br-character[aria-pressed=true]{border-color:#c77a48}#boardRemote svg{width:42px;height:47px;display:block;margin:auto}
    #boardRemote .br-character span{display:block;font-size:11px}#boardRemote .br-action{border:0;border-radius:10px;background:#355345;color:#fff9df;padding:14px 18px;min-height:48px;font:inherit;cursor:pointer;margin:10px 8px 5px 0}
    #boardRemote button:disabled{opacity:.45;cursor:default}#boardRemote input{width:100%;background:#fffdf6;border:1px solid #b7c9ac;border-radius:10px;padding:14px;font:inherit;color:#304b40;margin-top:10px}
    #boardRemote .br-question{font-size:23px;white-space:pre-wrap;background:#eee8d7;border-radius:12px;padding:16px;color:#304b40}
    #boardRemote .br-note{border-left:3px solid #d19662;padding-left:12px}#boardRemote .br-die{font-size:60px;line-height:1.1;color:#b8885e}
    #boardRemote [hidden]{display:none!important}#boardRemote button:focus-visible,#boardRemote input:focus-visible{outline:3px solid #cf8755;outline-offset:3px}
    @media(max-width:720px){#guard.candy-family>.panel{padding:12px}#guard.candy-family #boardRemote{display:block;padding:15px}#boardRemote canvas{height:300px}}
    #boardRemote .shirt-picker{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
    #boardRemote .shirt-picker button{width:34px;height:34px;background:var(--swatch);border:3px solid white;border-radius:50%;color:white;font-weight:bold;box-shadow:0 0 0 1px #adbba4}
    #boardRemote .shirt-picker button[aria-pressed=true]{outline:2px solid #304e42;outline-offset:2px}#boardRemote .shirt-picker button:disabled{opacity:.22}
    #guard.candy-family #boardRemote.br-playing{display:flex;flex-direction:column;height:calc(100dvh - 95px);min-height:350px;margin:0 auto;padding:8px 14px;gap:0}
    #boardRemote.br-playing>small{display:none}#boardRemote.br-playing>h2{font-size:23px;margin:0 0 5px}
    #boardRemote.br-playing>canvas{flex:1;height:0;min-height:120px;width:100%}
    #boardRemote.br-playing>.br-status{font-size:11px;margin:4px 0}
    #boardRemote.br-playing .br-seat{font-size:12px;margin:3px 0}#boardRemote.br-playing .br-quiz{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px}
    #boardRemote.br-playing .br-question{grid-column:1;grid-row:1/4;font-size:23px;margin:0;padding:10px;max-height:115px;overflow:auto}
    #boardRemote.br-playing form{grid-column:2;grid-row:1;display:flex;align-items:end;gap:8px}#boardRemote.br-playing form label{flex:1;min-width:0;font-size:10px}
    #boardRemote.br-playing input{min-width:0;padding:8px;margin:2px 0 0;min-height:40px}#boardRemote.br-playing .br-action{padding:8px 12px;min-height:36px;font-size:12px;margin:3px 0}
    #boardRemote.br-playing .br-hint{grid-column:2;grid-row:2;justify-self:start}#boardRemote.br-playing .br-feedback{grid-column:2;grid-row:3;font-size:11px;margin:0}
    #boardRemote.br-playing .br-note{grid-column:1/-1;max-height:none;overflow:visible;font-size:12px;margin:2px 0}
    #boardRemote.br-playing .br-die{display:inline-block;font-size:42px;vertical-align:middle;margin-right:18px}
    @media(max-width:720px){#boardRemote.br-playing .br-quiz{grid-template-columns:1fr}#boardRemote.br-playing .br-question{grid-column:1;grid-row:1;font-size:20px;max-height:75px;padding:7px}#boardRemote.br-playing form{grid-column:1;grid-row:2}#boardRemote.br-playing .br-hint{grid-column:1;grid-row:3}#boardRemote.br-playing .br-feedback{grid-column:1;grid-row:4}#guard.candy-family #boardRemote.br-playing{height:calc(100dvh - 85px)}}
    #boardRemote .br-question-modal{position:fixed;inset:0;z-index:1000;background:#183c34bc;display:grid;place-items:center;padding:15px}#boardRemote .br-question-content{background:#fff8e8;max-width:580px;width:100%;border-radius:20px;padding:24px;max-height:90dvh;overflow:auto}#boardRemote .br-question-modal .br-quiz{display:block}#boardRemote .br-question-modal .br-question{font-size:25px;max-height:none}#boardRemote.br-playing .br-play{position:absolute;bottom:8px;right:12px}#boardRemote.br-playing{position:relative}#boardRemote.br-playing>.br-status{position:absolute;bottom:10px;left:12px;right:160px;background:#fff7e6df;border-radius:10px;padding:8px}#boardRemote.br-playing .br-seat,#boardRemote.br-playing .br-die{display:none}#boardRemote.br-playing .br-roll{background:#fef6e4;border:2px solid #8fa68a;color:#294d42;padding:15px;font-size:18px}#boardRemote.br-playing>h2{font-size:16px}#boardRemote .br-question-modal .br-close{border:0;background:none;color:#315b4b;font:inherit;cursor:pointer}
    #boardRemote.br-playing>.br-status{width:auto;max-width:none;right:160px}#boardRemote.br-playing .br-roll{max-width:145px;white-space:normal;font-size:14px}
    #boardRemote .br-question-modal form{display:flex;flex-wrap:wrap;gap:8px}#boardRemote .br-question-modal form label{flex:1;min-width:150px}#boardRemote .br-question-modal .br-action{font-size:15px;min-height:44px}
    #boardRemote .br-roll{position:relative;overflow:visible}
    #boardRemote .br-roll.dice-prompt::before{content:'';position:absolute;bottom:calc(100% + 9px);left:50%;margin-left:-20px;width:40px;height:52px;background:#ffda29;clip-path:polygon(29% 0,71% 0,71% 54%,100% 54%,50% 100%,0 54%,29% 54%);filter:drop-shadow(0 2px 2px #46370080);pointer-events:none;animation:familyDieArrow .85s ease-in-out infinite}
    @keyframes familyDieArrow{0%,100%{transform:translateY(-9px)}50%{transform:translateY(0)}}
    @media(prefers-reduced-motion:reduce){#boardRemote .br-roll.dice-prompt::before{animation:none}}
  </style><small>YOUR FAMILY TABLE</small><h2>Candy Cloud Trail</h2><canvas aria-label="3D board. Drag to rotate."></canvas>
  <p class="br-status" role="status" aria-live="polite"></p>
  <div class="br-join"><p>Choose your traveler and shirt color, then claim a reserved family seat.</p><div class="br-characters">${CHARACTERS.map((c, i) => `<button type="button" class="br-character" data-character="${i}" aria-pressed="${i === 0}">${portrait(i, '#287ed6')}<span>${c.name}</span></button>`).join('')}</div><p>Shirt color</p><div class="br-colors"></div><button class="br-action br-join-button" type="button">Join a family seat →</button></div>
  <div class="br-play" hidden><p class="br-seat"></p><div class="br-quiz"><p class="br-question"></p><form><label>Type your answer<input maxlength="200" autocomplete="off" enterkeyhint="done" aria-label="Your answer"></label><button class="br-action br-check" type="submit">Check answer ✓</button></form><button type="button" class="br-action br-hint">Need a hint?</button><p class="br-feedback"></p><div class="br-note" hidden></div></div><div class="br-die"></div><button type="button" class="br-action br-roll" hidden>Roll the die</button><button type="button" class="br-action br-next" hidden>Next player →</button></div>`;
  parent.prepend(root);
  document.getElementById('guard')?.classList.add('candy-family');
  const $ = selector => root.querySelector(selector);
  const renderer = new BoardRenderer($('canvas'));
  let receivedAt=0;let state, selected = 0, selectedShirt = SHIRTS[0], lastKey, lastFeedback,lastOpen, pending = false, joinRequested = false;
  function frame(now){if(!root.isConnected)return;requestAnimationFrame(frame);if(state?.motion&&state.phase==='moving'){const sample=sampleMotion(state.motion,state.motion.elapsed+now-receivedAt);renderer.visual={index:state.motion.index,...sample};renderer.follow={x:sample.x,z:sample.z,amount:sample.zoom};renderer.dieRolling=sample.dieRolling;renderer.dirty=true;}if(state&&renderer.dirty)renderer.draw({players:state.seats,turn:state.turn,die:state.die},now/1000);}
  requestAnimationFrame(frame);
  function action(name, value) {
    if (!state) return;
    send({ t: 'board', action: name, key: state.key, value, character: selected, shirt: selectedShirt });
    if (name !== 'hint' && name !== 'hint-step' && name !== 'join') { pending = true; buttons(); }
  }
  const hintPanel=mountHintPanel($('.br-note'),(value,revision)=>action('hint-step',{value,revision}));
  function owned() { return state?.seats.findIndex(p => p.remote && p.controller === controllerTag(me.token)) ?? -1; }
  function buttons() {
    const index = owned(), active = index >= 0 && index === state?.turn && !state.lobby;
    $('.br-check').disabled = !active || pending || state.phase !== 'question';
    $('input').disabled = !active || state.phase !== 'question';
    $('.br-hint').disabled = !active || state.phase !== 'question';
    $('.br-roll').classList.toggle('dice-prompt',active&&!pending&&!state.questionOpen&&['question','ready'].includes(state.phase));
    $('.br-roll').disabled = !active || pending||!['question','ready'].includes(state.phase); $('.br-next').disabled = !active || pending;
  }
  root.addEventListener('click', e => {
    const color = e.target.closest('[data-shirt]');
    if (color && !color.disabled) { selectedShirt = color.dataset.shirt; drawColors(); if ((owned() >= 0 || joinRequested) && state?.lobby) action('join'); }
    const button = e.target.closest('[data-character]');
    if (button) {
      selected = Number(button.dataset.character); root.querySelectorAll('[data-character]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.character) === selected)));
      if (owned() >= 0 && state?.lobby) action('join');
    }
  });
  function drawColors() {
    const index = owned(), taken = (state?.seats || []).filter((p, i) => i !== index).map(p => p.shirt);
    $('.br-colors').innerHTML = shirtPicker(selectedShirt, taken);
    root.querySelectorAll('.br-character').forEach((b, i) => { b.querySelector('svg').outerHTML = portrait(i, selectedShirt); });
  }
  $('.br-join-button').onclick = () => { joinRequested = true; action('join'); };
  $('form').onsubmit = e => { e.preventDefault(); if (!$('.br-check').disabled && $('input').value.trim()) action('answer', $('input').value); };
  $('.br-hint').onclick = () => action('hint'); $('.br-roll').onclick = () => action(state.phase==='question'?'open':'roll'); $('.br-next').onclick = () => action('next');
  const popup=document.createElement('div');popup.className='br-question-modal';popup.hidden=true;popup.setAttribute('role','dialog');popup.setAttribute('aria-modal','true');popup.setAttribute('aria-label','Your roll challenge');popup.innerHTML='<div class="br-question-content"><button class="br-close">← Back to board</button><h2>Earn your move</h2></div>';root.appendChild(popup);popup.firstElementChild.appendChild($('.br-quiz'));$('.br-close').onclick=()=>action('close');
  root.addEventListener('keydown',e=>{if(popup.hidden)return;if(e.key==='Escape'){e.preventDefault();action('close');}if(e.key==='Tab'){const items=[...popup.querySelectorAll('button:not(:disabled),input:not(:disabled)')].filter(el=>!el.closest('[hidden]')),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  return {
    update(next) {
      if (!next || !Array.isArray(next.seats)) return;
      state=next;receivedAt=performance.now();if(!next.motion){renderer.visual=null;renderer.follow=null;renderer.dieRolling=false;}
      root.classList.toggle('br-playing', !next.lobby);
      const index = owned(), player = next.seats[next.turn];
      if (index >= 0) { selectedShirt = next.seats[index].shirt; selected = next.seats[index].character; root.querySelectorAll('[data-character]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.character) === selected))); }
      else if (next.seats.some(p => p.shirt === selectedShirt)) selectedShirt = SHIRTS.find(c => !next.seats.some(p => p.shirt === c)) || SHIRTS[0];
      drawColors();
      if (lastKey !== next.key || lastFeedback !== next.feedback||state.questionOpen!==lastOpen) { pending = false; if (lastKey !== next.key) $('input').value = ''; }
      lastKey = next.key; lastFeedback = next.feedback;lastOpen=next.questionOpen;
      $('.br-join').hidden = !next.lobby && index >= 0;
      $('.br-join-button').textContent = index >= 0 ? '✓ Seat claimed · update character' : next.lobby ? 'Join a family seat →' : 'Reconnect my family seat';
      $('.br-join-button').disabled = next.lobby && index < 0 && !next.seats.some(p => p.remote && !p.controller);
      $('.br-play').hidden = next.lobby;
      $('.br-seat').textContent = index < 0 ? 'Watching the table. Ask the host to reserve a family seat before starting.' : `You’re playing as ${next.seats[index].name}. ${next.turn === index ? 'It’s your turn!' : `Waiting for ${player?.name}.`}`;
      $('.br-status').textContent = next.lobby ? (index >= 0 ? 'Your seat is ready. The host can start when everyone has joined.' : 'Waiting at the family table.') : next.message;
      const wasHidden=popup.hidden;popup.hidden=!(next.phase==='question'&&next.questionOpen&&index===next.turn);$('.br-quiz').hidden=false; $('.br-question').textContent = next.question;
      $('input').inputMode = /Read aloud:/.test(next.question) ? 'text' : 'decimal';
      $('.br-feedback').textContent = next.feedback;
      hintPanel.update(next.guide);$('.br-note').hidden=!next.guide;
      $('.br-die').textContent = next.die ? ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][next.die - 1] : '';
      $('.br-roll').hidden=false;$('.br-roll').textContent=index===next.turn?'⚄ Tap the die':'⚄ '+(player?.name||'Player')+'’s turn';$('.br-next').hidden=true;
      $('.br-next').textContent = next.phase === 'finished' ? 'Celebrate the winner ★' : 'Next player →';
      buttons();if(wasHidden&&!popup.hidden)$('input').focus(); renderer.draw({ players: next.seats, turn: next.turn, die: next.die }, performance.now() / 1000);
      // The family device renders the actual board locally, so no video feed is required.
      const stage = document.getElementById('stage'); if (stage) stage.classList.add('hidden');
    },
  };
}

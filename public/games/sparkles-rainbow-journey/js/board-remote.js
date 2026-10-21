import { CHARACTERS, SHIRTS, portrait, controllerTag, shirtPicker } from './board.js';
import { BoardRenderer } from './board-render.js';

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
    #boardRemote.br-playing .br-note{grid-column:1/-1;max-height:70px;overflow:auto;font-size:12px;margin:2px 0}
    #boardRemote.br-playing .br-die{display:inline-block;font-size:42px;vertical-align:middle;margin-right:18px}
    @media(max-width:720px){#boardRemote.br-playing .br-quiz{grid-template-columns:1fr}#boardRemote.br-playing .br-question{grid-column:1;grid-row:1;font-size:20px;max-height:75px;padding:7px}#boardRemote.br-playing form{grid-column:1;grid-row:2}#boardRemote.br-playing .br-hint{grid-column:1;grid-row:3}#boardRemote.br-playing .br-feedback{grid-column:1;grid-row:4}#guard.candy-family #boardRemote.br-playing{height:calc(100dvh - 85px)}}
  </style><small>YOUR FAMILY TABLE</small><h2>Candy Cloud Trail</h2><canvas aria-label="3D board. Drag to rotate."></canvas>
  <p class="br-status" role="status" aria-live="polite"></p>
  <div class="br-join"><p>Choose your traveler and shirt color, then claim a reserved family seat.</p><div class="br-characters">${CHARACTERS.map((c, i) => `<button type="button" class="br-character" data-character="${i}" aria-pressed="${i === 0}">${portrait(i, '#287ed6')}<span>${c.name}</span></button>`).join('')}</div><p>Shirt color</p><div class="br-colors"></div><button class="br-action br-join-button" type="button">Join a family seat →</button></div>
  <div class="br-play" hidden><p class="br-seat"></p><div class="br-quiz"><p class="br-question"></p><form><label>Type your answer<input maxlength="200" autocomplete="off" enterkeyhint="done" aria-label="Your answer"></label><button class="br-action br-check" type="submit">Check answer ✓</button></form><button type="button" class="br-action br-hint">Need a hint?</button><p class="br-feedback"></p><p class="br-note" hidden></p></div><div class="br-die"></div><button type="button" class="br-action br-roll" hidden>Roll the die</button><button type="button" class="br-action br-next" hidden>Next player →</button></div>`;
  parent.prepend(root);
  document.getElementById('guard')?.classList.add('candy-family');
  const $ = selector => root.querySelector(selector);
  const renderer = new BoardRenderer($('canvas'));
  let state, selected = 0, selectedShirt = SHIRTS[0], lastKey, lastFeedback, pending = false, joinRequested = false;
  function frame() { if (!root.isConnected) return; requestAnimationFrame(frame); if (state && renderer.dirty) renderer.draw({ players: state.seats, turn: state.turn }, performance.now() / 1000); }
  requestAnimationFrame(frame);
  function action(name, value) {
    if (!state) return;
    send({ t: 'board', action: name, key: state.key, value, character: selected, shirt: selectedShirt });
    if (name !== 'hint' && name !== 'join') { pending = true; buttons(); }
  }
  function owned() { return state?.seats.findIndex(p => p.remote && p.controller === controllerTag(me.token)) ?? -1; }
  function buttons() {
    const index = owned(), active = index >= 0 && index === state?.turn && !state.lobby;
    $('.br-check').disabled = !active || pending || state.phase !== 'question';
    $('input').disabled = !active || state.phase !== 'question';
    $('.br-hint').disabled = !active || state.phase !== 'question';
    $('.br-roll').disabled = !active || pending; $('.br-next').disabled = !active || pending;
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
  $('.br-hint').onclick = () => action('hint'); $('.br-roll').onclick = () => action('roll'); $('.br-next').onclick = () => action('next');
  return {
    update(next) {
      if (!next || !Array.isArray(next.seats)) return;
      state = next;
      root.classList.toggle('br-playing', !next.lobby);
      const index = owned(), player = next.seats[next.turn];
      if (index >= 0) { selectedShirt = next.seats[index].shirt; selected = next.seats[index].character; root.querySelectorAll('[data-character]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.character) === selected))); }
      else if (next.seats.some(p => p.shirt === selectedShirt)) selectedShirt = SHIRTS.find(c => !next.seats.some(p => p.shirt === c)) || SHIRTS[0];
      drawColors();
      if (lastKey !== next.key || lastFeedback !== next.feedback) { pending = false; if (lastKey !== next.key) $('input').value = ''; }
      lastKey = next.key; lastFeedback = next.feedback;
      $('.br-join').hidden = !next.lobby && index >= 0;
      $('.br-join-button').textContent = index >= 0 ? '✓ Seat claimed · update character' : next.lobby ? 'Join a family seat →' : 'Reconnect my family seat';
      $('.br-join-button').disabled = next.lobby && index < 0 && !next.seats.some(p => p.remote && !p.controller);
      $('.br-play').hidden = next.lobby;
      $('.br-seat').textContent = index < 0 ? 'Watching the table. Ask the host to reserve a family seat before starting.' : `You’re playing as ${next.seats[index].name}. ${next.turn === index ? 'It’s your turn!' : `Waiting for ${player?.name}.`}`;
      $('.br-status').textContent = next.lobby ? (index >= 0 ? 'Your seat is ready. The host can start when everyone has joined.' : 'Waiting at the family table.') : next.message;
      $('.br-quiz').hidden = next.phase !== 'question'; $('.br-question').textContent = next.question;
      $('input').inputMode = /Read aloud:/.test(next.question) ? 'text' : 'decimal';
      $('.br-feedback').textContent = next.feedback;
      $('.br-note').textContent = next.hint; $('.br-note').hidden = !next.hint;
      $('.br-die').textContent = next.die ? ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][next.die - 1] : '';
      $('.br-roll').hidden = next.phase !== 'ready'; $('.br-next').hidden = !['result', 'finished'].includes(next.phase);
      $('.br-next').textContent = next.phase === 'finished' ? 'Celebrate the winner ★' : 'Next player →';
      buttons(); renderer.draw({ players: next.seats, turn: next.turn }, performance.now() / 1000);
      // The family device renders the actual board locally, so no video feed is required.
      const stage = document.getElementById('stage'); if (stage) stage.classList.add('hidden');
    },
  };
}

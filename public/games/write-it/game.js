import { startGame, realFrom } from '../_play/play.js';
import { createExplorer } from './explorer.js';
import { REAL } from '../_joy/js/reallife.js';
import { Store } from '../_joy/js/storage.js';

import { drawHero } from './realm-art.js';

function createGame(api) {

  const book=()=>api.state.extra.quillbound ||= {mana:0,loot:[],realms:[],party:[{name:api.kid.name||'Hero',cloak:api.kid.color||'#8365db',skin:'#b97f5a'}]};
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ui=document.createElement('section');ui.id='qb-ui';ui.hidden=true;document.getElementById('app').appendChild(ui);
  const logo=document.createElement('div');logo.className='qb-brand';logo.innerHTML='<img src="/icons/logo.svg" alt="JoyNot logo"><span>JoyNot</span>';
  document.querySelector('#pg-title .pg-card').prepend(logo);
  document.querySelector('.pg-mascot').innerHTML='<img src="/games/write-it/crest.svg" alt="Enchanted quill and crown" width="76" height="76">';
  document.querySelector('.pg-keys').textContent='WASD / arrows or touch stick to walk · Tap tiles to travel · E / Space to interact · Q for wand';
  const setup=document.createElement('div');setup.className='qb-setup';setup.innerHTML='<label>Adventurers <select id="qb-party"><option value="1">Solo adventure</option><option value="2">2 players · take turns</option><option value="3">3 players · take turns</option><option value="4">4 players · take turns</option></select></label><div id="qb-heroes"></div><p class="qb-small">Family turns share this device. Writing progress belongs to the signed-in child.</p>';
  document.querySelector('#pgPlay').before(setup);
  function paintHeroes(){setup.querySelectorAll('[data-hero]').forEach(cv=>{const c=cv.getContext('2d');c.clearRect(0,0,64,82);drawHero(c,28,79,.95,book().party[+cv.dataset.hero]);});}
  function heroSetup(){const b=book(),count=+setup.querySelector('select').value;while(b.party.length<count)b.party.push({name:`Hero ${b.party.length+1}`,cloak:['#8365db','#297c80','#b95546','#c28c30'][b.party.length],skin:'#b97f5a'});b.party.length=count;
    setup.querySelector('#qb-heroes').innerHTML=b.party.map((h,i)=>`<div class="qb-hero"><canvas width="64" height="82" data-hero="${i}" aria-label="Hero preview"></canvas><label>Name <input data-name="${i}" maxlength="18" value="${esc(h.name)}"></label><label>Cloak <input type="color" data-cloak="${i}" value="${esc(h.cloak)}"></label><label>Skin <select data-skin="${i}">${['#f1c6a5','#dba47a','#b97f5a','#88543e','#563b34'].map((x,n)=>`<option value="${x}" ${h.skin===x?'selected':''}>${['Light','Warm','Tan','Brown','Deep'][n]}</option>`).join('')}</select></label></div>`).join('');paintHeroes();Store.save();}
  setup.querySelector('select').value=String(book().party.length);heroSetup();
  setup.addEventListener('change',e=>{if(e.target.id==='qb-party')heroSetup();else{const d=e.target.dataset,i=+(d.skin??d.cloak??d.name);if(d.skin!==undefined)book().party[i].skin=e.target.value;if(d.cloak!==undefined)book().party[i].cloak=e.target.value;if(d.name!==undefined)book().party[i].name=e.target.value.trim()||`Hero ${i+1}`;paintHeroes();Store.save();}});
  return createExplorer(api,{ui,book,esc,paintHeroes});
}
startGame({mascot:'',stick:true,story:'Your guide welcomes you to Oakhaven. Follow the golden footprints, meet the Rune Smith, rescue Moonwing and cross the river to Pyra. Your written spells wake the realm around you.',howTo:['Walk with WASD, arrows or the touch joystick. Tap a ground tile to walk to it.','Follow the golden footprints to the floating marker. Walk close and characters greet you automatically. Interact, E or Space also starts a nearby encounter.','Turn Narration on to hear your guide. Where next? repeats your next steps, and Listen again replays a line.','Roll the red and blue rune dice, open the spell scroll, write your rune or story, then Cast into the world to change the scene.','The bouncing green ball is moss slime. Calm slime or Q spends 3 mana to put it to sleep for 6 seconds. To cross the river, cast a written spell at the Broken Crossing, then walk over the restored wooden planks.'],realLife:realFrom(REAL['write-it']),create:createGame});

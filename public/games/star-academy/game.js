// Full replacement: the spiral discovery race owns its rules, tours and co-op state.
import {Store} from '../_joy/js/storage.js';
import {Sfx} from '../_joy/js/audio.js';
import {Voice} from '../_joy/js/speech.js';
import {mountTogether} from '../_play/together.js';
import {CHARACTERS,SHIRTS,controllerTag} from '../sparkles-rainbow-journey/js/board.js';
import {newRace,restoreRace,raceKey,act,finishMove,finishLaunch,tour,publicRace} from './race.js';
import {mountSpaceTable} from './table-ui.js';
const C=Store.config,G=window.JOY_GAME;
let race=null,lobby=[],saved=null,together=null,botTimer=null,moveStart=0,launchStart=0,members=[],lobbyRevision=0;
const key=()=>race?raceKey(race):'lobby:'+lobbyRevision;
const grade=()=>{const label=G.levels[Math.max(0,Store.data.level-1)]?.grade||'K';return Math.min(5,Math.max(0,parseInt(label,10)||0));};
const freeColor=()=>SHIRTS.find(c=>!lobby.some(p=>p.color===c))||SHIRTS[0];
const kid=()=>({name:Store.player?.name||C.kid.name,character:0,color:SHIRTS[0],owner:'local',pos:0});
const ui=mountSpaceTable({parent:document.getElementById('app'),actor:'local',host:true,send:perform,onQuit:quit});
function elapsed(){return race?.phase==='moving'?Math.min(race.move.duration,(race.move.elapsed||0)+Math.max(0,performance.now()-moveStart)):0;}
function launchElapsed(){return race?.phase==='launch'?Math.min(race.launch.duration,(race.launch.elapsed||0)+Math.max(0,performance.now()-launchStart)):0;}
function snapshot(){const s=race?publicRace(race,elapsed(),launchElapsed()):{phase:'lobby',id:'lobby',revision:lobbyRevision,players:lobby,turn:0,grade:grade(),canResume:!!saved};return {...s,key:key(),voice:Store.data.settings.voice!=='off',music:Store.data.settings.music==='on'};}
function save(){if(!Store.playerId)return;if(race){const copy=JSON.parse(JSON.stringify(race));if(copy.move&&copy.phase==='moving')copy.move.elapsed=elapsed();if(copy.launch&&copy.phase==='launch')copy.launch.elapsed=launchElapsed();Store.data.extra.starRace=copy;saved=copy;}Store.save();}
function publish(persist=true){if(persist)save();ui.update(snapshot());together?.poke();scheduleBot();}
function startNew(){race=newRace(lobby,grade());saved=race;publish();}
function reward(){if(!['finished','launch'].includes(race?.phase)||race.rewarded)return;race.rewarded=true;Store.data.stars+=race.winner===0?10:5;Store.data.stats.rounds++;Sfx.win();save();}
function logAnswer(before,value){if(before.turn!==0||before.phase!=='recall')return;const q=tour(before).questions[before.question],correct=value===q.correct,d=Store.data;d.stats.questions++;d.stats[correct?'right':'wrong']++;if(before.helped)d.stats.helped=(d.stats.helped||0)+1;if(correct)d.stars+=before.helped?1:3;Store.logAttempt({track:'space',level:d.level,prompt:q.ask,expected:q.choices[q.correct],heard:q.choices[value],correct,first_try:!(before.questionAttempts||0),helped:before.helped,review:before.helped,at:new Date().toISOString()});}
function perform(action,value,actor='local'){
 if(actor==='local'){Voice.unlock();Sfx.init();Sfx.enabled=Store.data.settings.sfx!=='off';}
 if(action==='music'&&actor==='local'&&typeof value==='boolean'){Store.data.settings.music=value?'on':'off';publish();return;}
 if(!race){
  if(actor!=='local')return;
  if(action==='start'){if(lobby.some(p=>p.remote&&!p.owner))return;startNew();return;}
  if(action==='resume'&&saved){race=restoreRace(saved);if(!race)return;moveStart=performance.now();launchStart=performance.now();publish();return;}
  if(action==='add-bot'&&lobby.length<4)lobby.push({name:'Nova Bot '+lobby.length,bot:true,character:lobby.length%CHARACTERS.length,color:freeColor(),owner:'bot',pos:0});
  else if(action==='add-family'&&lobby.length<4)lobby.push({name:'Family seat',remote:true,character:lobby.length%CHARACTERS.length,color:freeColor(),owner:null,pos:0});
  else if(action==='remove'&&Number.isInteger(value)&&value>0&&value<lobby.length)lobby.splice(value,1);
  else if(action==='character'&&Number.isInteger(value)&&CHARACTERS[value])lobby[0].character=value;
  else if(action==='color'&&SHIRTS.includes(value)&&!lobby.some((p,i)=>i>0&&p.color===value))lobby[0].color=value;
  lobbyRevision++;publish(false);return;
 }
 if(action==='new'&&actor==='local'){save();saved=null;Store.data.extra.starRace=null;race=null;lobby=[kid(),{name:'Nova Bot',bot:true,character:2,color:SHIRTS[1],owner:'bot',pos:0}];lobbyRevision++;publish();return;}
 if(race.players[race.turn]?.owner!==actor)return;
 const before=action==='answer'?JSON.parse(JSON.stringify(race)):null;
 if(act(race,action,value)){
  if(before&&Number.isInteger(value)&&value>=0&&value<tour(before).questions[before.question].choices.length){logAnswer(before,value);if(value===tour(before).questions[before.question].correct)Sfx.correct();else Sfx.wrong();}
  else Sfx.pop();
  if(race.phase==='moving')moveStart=performance.now();
  publish();
 }
}
function scheduleBot(){clearTimeout(botTimer);if(!race||!race.players[race.turn]?.bot||['moving','launch','finished'].includes(race.phase))return;const token=key(),delay=race.phase==='tour'?Math.max(6500,tour(race).stops[race.stop].text.length*80):2200;botTimer=setTimeout(()=>{if(key()!==token)return;const op={board:'draw',card:'visit',tour:'next',recall:'answer'}[race.phase];if(op)perform(op,op==='answer'?tour(race).questions[race.question].correct:undefined,'bot');},delay);}
function remote(from,message){if(message.t!=='space-race'||!together?.grownups().some(m=>m.token===from))return;const tag=controllerTag(from),member=together.grownups().find(m=>m.token===from);
 if(message.action==='join'){
  const players=race?.players||lobby;let seat=players.find(p=>p.remote&&p.owner===tag);
  if(!seat&&race)seat=players.find(p=>p.remote&&p.name===member.name&&!members.some(m=>controllerTag(m.token)===p.owner));
  if(!seat&&!race)seat=players.find(p=>p.remote&&!p.owner);
  if(!seat)return;seat.owner=tag;seat.name=member.name.slice(0,24);
  if(!race){const v=message.value||{};if(CHARACTERS[v.character])seat.character=v.character;if(SHIRTS.includes(v.color)&&!players.some(p=>p!==seat&&p.color===v.color))seat.color=v.color;lobbyRevision++;}
  publish(!!race);return;
 }
 if(message.key!==key()||!race||race.players[race.turn]?.owner!==tag)return;
 if(['draw','visit','next','review','answer'].includes(message.action))perform(message.action,message.value,tag);
}
async function quit(){clearTimeout(botTimer);Voice.stop();Sfx.stopMusic();save();await Store.flushNow();together?.stop();location.href=C.urls.back||'/dashboard';}
async function boot(){await Store.load();saved=restoreRace(Store.data.extra.starRace);lobby=[kid(),{name:'Nova Bot',bot:true,character:2,color:SHIRTS[1],owner:'bot',pos:0}];publish(false);
 together=mountTogether({canvas:ui.scene.canvas,kid:C.kid,game:C.game,url:C.urls.coop,csrf:()=>Store.csrf,frames:false,screen:false,speak:text=>Voice.speak(text),stopSpeak:()=>Voice.stop(),sfx:Sfx,
 status:()=>({goal:race?`${race.players[race.turn].name}’s turn`:'Build a space crew. Reserve family seats before starting.',screen:race?'Explore, remember, and race to the rocket.':'Family players join through Grown-Ups.',tip:'Listen to the tour, then recall the facts. Revisit if you need a reminder.',level:(grade()?'Grade '+grade():'Kindergarten')+' space expedition',spaceRace:snapshot()}),onMsg:remote,onMembers:list=>{members=list;together?.poke();},helps:[],onHint:()=>{if(race?.phase==='recall')perform('review',undefined,race.players[race.turn].owner);return true;}});
 together?.start('Galaxy Spiral · Star Academy');
 Store.onExternalChange=()=>{clearTimeout(botTimer);Voice.stop();saved=restoreRace(Store.data.extra.starRace);race=null;lobby=[kid()];publish(false);};
 setInterval(()=>{if(race?.phase==='moving'&&elapsed()>=race.move.duration){finishMove(race);if(race.phase==='launch')launchStart=performance.now();reward();publish();}else if(race?.phase==='launch'&&launchElapsed()>=race.launch.duration){finishLaunch(race);reward();publish();}},100);
 window.__starRace={get state(){return race;},get lobby(){return lobby;},get scene(){return ui.scene;},get key(){return key();},perform,snapshot};
}
addEventListener('pagehide',()=>{Sfx.stopMusic();Voice.stop();save();Store.beacon();});boot().catch(error=>{console.error(error);document.querySelector('.space-content').innerHTML='<div class="space-lobby"><h1>We could not load your expedition.</h1><p>Please reload this page to try again.</p><a href="/dashboard">Back to games</a></div>';});

import {moveDuration,LAUNCH_MS} from './race-motion.js';
import {DESTINATIONS,mission} from './destinations.js';
export const FINISH=48;
export const SETBACKS={asteroid:3,comet:2,microgravity:2,blackhole:5,nebula:2};
export const OBSTACLES={6:'asteroid',10:'comet',15:'microgravity',21:'blackhole',28:'nebula',34:'asteroid',40:'comet',45:'blackhole'};
const samples=Array.from({length:1601},(_,i)=>{const t=i/1600,r=6.6-5.6*t,a=-Math.PI/2+Math.PI*4.6*t;return {x:r*Math.cos(a),z:r*Math.sin(a)};});
const lengths=[0];for(let i=1;i<samples.length;i++)lengths[i]=lengths[i-1]+Math.hypot(samples[i].x-samples[i-1].x,samples[i].z-samples[i-1].z);
export function spiralPoint(n){if(n>=FINISH)return {x:0,z:0};const at=Math.max(0,n)/47*lengths.at(-1);let i=lengths.findIndex(l=>l>=at);return {...samples[Math.max(0,i)]};}
export function newRace(players,grade=0){return {version:2,id:globalThis.crypto?.randomUUID?.()||String(Date.now()),revision:0,grade:Math.min(5,Math.max(0,grade)),players:players.map((p,i)=>({character:0,color:['#287ed6','#168c78','#d47a18','#8654cc'][i],...p,name:String(p.name||'Astronaut').trim().slice(0,24)||'Astronaut',pos:0})),turn:0,round:1,phase:'board',deck:[],topic:null,stop:0,question:0,encounter:false,attempts:0,questionAttempts:0,helped:false,feedback:'',move:null,winner:null,rewarded:false};}
export const raceKey=s=>s?`${s.id}:${s.revision}`:'lobby';
export function tour(s){return s.topic?mission(s.topic,s.grade,s.round+s.turn):null;}
function changed(s){s.revision++;return true;}
function chooseTopic(s,rng){if(!s.deck.length){s.deck=DESTINATIONS.map(d=>d.id);for(let i=s.deck.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[s.deck[i],s.deck[j]]=[s.deck[j],s.deck[i]];}}return s.deck.pop();}
export function beginVisit(s,id,encounter=false){s.topic=id;s.phase=encounter?'tour':'card';s.stop=0;s.question=0;s.encounter=encounter;s.setback=encounter?SETBACKS[id]:0;s.attempts=0;s.questionAttempts=0;s.helped=false;s.feedback='';return changed(s);}
export function act(s,action,value,rng=Math.random){
 if(!s||s.winner!==null||s.phase==='moving')return false;
 if(action==='draw'&&s.phase==='board')return beginVisit(s,chooseTopic(s,rng));
 if(action==='visit'&&s.phase==='card'){s.phase='tour';return changed(s);}
 if(action==='next'&&s.phase==='tour'){if(s.stop<tour(s).stops.length-1)s.stop++;else{s.phase='recall';s.question=0;}return changed(s);}
 if(action==='review'&&s.phase==='recall'){s.phase='tour';s.stop=0;s.question=0;s.questionAttempts=0;s.helped=true;s.feedback='Listen again, then try remembering the discoveries.';return changed(s);}
 if(action==='answer'&&s.phase==='recall'){
  const q=tour(s).questions[s.question];if(!Number.isInteger(value)||value<0||value>=q.choices.length)return false;
  if(value!==q.correct){s.attempts++;s.questionAttempts=(s.questionAttempts||0)+1;s.feedback='That does not match the story. Try again, or revisit the tour for a reminder.';return changed(s);}
  s.questionAttempts=0;s.feedback='You remembered that discovery!';if(++s.question<tour(s).questions.length)return changed(s);
  const die=s.encounter?0:1+Math.min(5,Math.max(0,Math.floor(rng()*6))),from=s.players[s.turn].pos,to=s.encounter?Math.max(0,from-SETBACKS[s.topic]):Math.min(FINISH,from+die);s.move={from,to,die,kind:s.encounter?'setback':'forward',reason:s.encounter?s.topic:null,elapsed:0,motionVersion:2,duration:moveDuration(from,to)};s.players[s.turn].pos=to;s.phase='moving';return changed(s);
 }
 return false;
}
export function finishMove(s){
 if(s?.phase!=='moving')return false;
 if(s.players[s.turn].pos===FINISH){s.winner=s.turn;s.phase='launch';s.launch={elapsed:0,duration:LAUNCH_MS};return changed(s);}
 const obstacle=OBSTACLES[s.players[s.turn].pos];if(obstacle&&!s.encounter)return beginVisit(s,obstacle,true);
 s.turn=(s.turn+1)%s.players.length;if(s.turn===0)s.round++;s.phase='board';s.topic=null;s.move=null;s.encounter=false;s.feedback='';return changed(s);
}
export function finishLaunch(s){if(s?.phase!=='launch')return false;s.phase='finished';return changed(s);}
export function restoreRace(raw){
 try{const s=JSON.parse(JSON.stringify(raw));if(![1,2].includes(s.version)||!Array.isArray(s.players)||s.players.length<1||s.players.length>4||!Number.isInteger(s.turn)||s.turn<0||s.turn>=s.players.length||!['board','card','tour','recall','moving','launch','finished'].includes(s.phase))return null;
 if(s.version===1){s.version=2;if(s.phase==='moving'&&s.encounter&&s.move?.bonus){const from=s.move.from,to=Math.max(0,from-SETBACKS[s.topic]);s.players[s.turn].pos=to;s.move={from,to,die:0,kind:'setback',reason:s.topic,elapsed:0,duration:700+(from-to)*700};}}
 if(s.phase==='moving'&&s.move&&s.move.motionVersion!==2){const portion=Math.max(0,Math.min(1,(s.move.elapsed||0)/s.move.duration));s.move.duration=moveDuration(s.move.from,s.move.to);s.move.elapsed=portion*s.move.duration;s.move.motionVersion=2;}
 if(typeof s.id!=='string'||!Number.isSafeInteger(s.revision)||s.revision<0||!Number.isInteger(s.grade)||s.grade<0||s.grade>5||!Number.isSafeInteger(s.round)||s.round<1)return null;
 if(!Array.isArray(s.deck)||s.deck.some(id=>!DESTINATIONS.some(d=>d.id===id)))return null;
 if(!s.players.every(p=>typeof p.name==='string'&&p.name.length<=24&&/^#[a-f0-9]{6}$/i.test(p.color)&&Number.isInteger(p.character)&&p.character>=0&&p.character<8&&Number.isInteger(p.pos)&&p.pos>=0&&p.pos<=FINISH))return null;
 if(['card','tour','recall'].includes(s.phase)&&!DESTINATIONS.some(d=>d.id===s.topic))return null;
 if(s.phase==='moving'&&(!s.move||!Number.isFinite(s.move.duration)||s.move.duration<700||s.move.to!==s.players[s.turn].pos||!Number.isInteger(s.move.from)||s.move.from<0||s.move.from>FINISH||(s.move.kind==='setback'?s.move.to>s.move.from:s.move.from>s.move.to)))return null;
 if(['finished','launch'].includes(s.phase)&&(!Number.isInteger(s.winner)||!s.players[s.winner]||s.players[s.winner].pos!==FINISH))return null;
 if(!['finished','launch'].includes(s.phase)&&s.winner!==null)return null;
 if(s.phase==='launch'&&(!s.launch||s.launch.duration!==LAUNCH_MS||!Number.isFinite(s.launch.elapsed)))return null;
 const m=tour(s);if(m&&(!Number.isInteger(s.stop)||s.stop<0||s.stop>=m.stops.length||!Number.isInteger(s.question)||s.question<0||s.question>m.questions.length))return null;
 if(s.phase==='recall'&&s.question>=m.questions.length)return null;
 return s;}catch{return null;}
}
export function publicRace(s,elapsed=0,launchElapsed=0){if(!s)return null;const m=tour(s),q=s.phase==='recall'?m.questions[s.question]:null;return {...s,deck:undefined,launch:s.launch?{...s.launch,elapsed:launchElapsed}:null,move:s.move?{...s.move,elapsed}:null,mission:m?{id:m.id,name:m.name,card:s.phase==='card'?m.card:'',stops:s.phase==='tour'?[m.stops[s.stop]]:[],stopCount:m.stops.length,source:m.source}:null,quiz:q?{ask:q.ask,choices:q.choices,index:s.question+1,total:m.questions.length}:null};}

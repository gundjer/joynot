import {PARTS,MISSIONS,blueprint,clone,part} from './jobs.js';
import {createRun,step,STEP} from './mechanics.js';
import {createInventor,stepInventor,seesawBuild} from './inventor.js';
import {CHALLENGES} from './jobs.js';
import {ropeCheck} from './rope-tool.js';
const finite=n=>typeof n==='number'&&Number.isFinite(n),clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function createGarage(job=MISSIONS[0],mode='campaign'){return {schema:2,job:clone(job),mode,phase:'build',blueprint:blueprint(job),run:null,revision:0,locks:{},operators:{},history:[],note:job.story,players:[],events:[],runCount:0,completed:false,analysis:false,accumulator:0};}
export function cost(s){return s.blueprint.parts.filter(p=>!p.fixed).reduce((n,p)=>n+(PARTS[p.kind]?.cost||0),0);}
function event(s,text,actor){s.note=text;s.events.push({text,name:actor.name,id:++s.revision});s.events=s.events.slice(-12);}
function remember(s){s.history.push(clone(s.blueprint));s.history=s.history.slice(-25);}
export function command(s,op,actor={id:'host',name:'You'},now=Date.now()){
 if(!op||typeof op!=='object')return {ok:false,reason:'Invalid workshop action.'};
 const p=s.blueprint.parts.find(p=>p.id===op.id),lock=p&&s.locks[p.id];
 if(lock&&lock.until>now&&lock.actor!==actor.id)return {ok:false,reason:`${lock.name} is working on this part. Choose another part.`};
 if(op.action==='lock'){if(!p)return {ok:false};s.locks[p.id]={actor:actor.id,name:actor.name,until:now+3500};return {ok:true};}
 if(op.action==='unlock'){if(lock?.actor===actor.id)delete s.locks[p.id];return {ok:true};}
 if(op.action==='move-gear'){
  if(!p||p.kind!=='gear'||p.fixed||!finite(op.x)||!finite(op.y))return {ok:false,reason:'Drag a movable gear on the board.'};
  s.liveEdits ||= {};const edit=s.liveEdits[p.id];
  if(!edit||edit.until<now){remember(s);s.liveEdits[p.id]={actor:actor.id,until:now+3500};}
  else if(edit.actor!==actor.id)return {ok:false,reason:'Another player is moving this gear.'};
  s.liveEdits[p.id].until=now+3500;s.locks[p.id]={actor:actor.id,name:actor.name,until:now+3500};
  p.x=Math.round(clamp(op.x,.3,9.7)*4)/4;p.y=Math.round(clamp(op.y,.25,5.7)*4)/4;p.rev=(p.rev||0)+1;
  const moving=s.run?.parts.find(q=>q.id===p.id);if(moving){moving.x=p.x;moving.y=p.y;}
  if(op.end){delete s.liveEdits[p.id];delete s.locks[p.id];event(s,`${actor.name} moved a gear. Touch the teeth to pass motion along.`,actor);}return {ok:true};
 }
 if(op.action==='crank'){
  s.cranks ||= {};const old=s.cranks[op.id];
  if(!op.on){if(old?.actor===actor.id)delete s.cranks[op.id];return {ok:true};}
  if(!p||p.kind!=='motor'||s.job.kind!=='workshop'||!finite(op.speed))return {ok:false,reason:'Choose a hand crank handle.'};
  if(old&&old.until>now&&old.actor!==actor.id)return {ok:false,reason:'Another player is turning this crank.'};
  if(s.phase==='build'&&op.start)command(s,{action:'test'},actor,now);
  if(s.phase!=='run')return {ok:false,reason:'Resume the test to turn the crank.'};
  s.cranks[op.id]={actor:actor.id,speed:clamp(op.speed,-14,14),until:now+1500};return {ok:true};
 }
 if(op.action==='operate'){if(!op.on){delete s.operators[actor.id];return {ok:true};}if(s.phase!=='run')return {ok:false,reason:'Start a test, then hold Power to power the machine.'};s.operators[actor.id]=now+1800;return {ok:true};}
 if(op.action==='brake'){if(s.run&&['run','paused'].includes(s.phase)){s.run.brake=!s.run.brake;event(s,s.run.brake?'The brake is holding the machine.':'The brake is released.',actor);return {ok:true};}return {ok:false,reason:'The brake works during a test.'};}
 if(op.action==='analysis'){s.analysis=!s.analysis;return {ok:true};}
 if(op.action==='clear-board'){
  if(Object.values(s.locks).some(l=>l.until>now&&l.actor!==actor.id))return {ok:false,reason:'Wait until the other builder finishes their part before clearing the shared board.'};
  s.blueprint={parts:[],rope:[],nextId:1,revision:0};s.run=null;s.phase='build';s.operators={};s.cranks={};s.liveEdits={};s.locks={};s.history=[];s.accumulator=0;s.completed=false;
  s.clearRevision=(s.clearRevision||0)+1;event(s,'Board cleared. All parts and rope removed. Your earned trophies are kept.',actor);return {ok:true};
 }
 if(op.action==='challenge'&&s.job.kind==='workshop'){s.challenge=CHALLENGES.find(c=>c.id===op.challenge)||null;if(s.run){s.run.challenge=s.challenge;s.run.hold=0;s.run.earned=false;}event(s,s.challenge?'Optional trophy: '+s.challenge.goal:'No challenge selected. Keep inventing!',actor);return {ok:true};}
 if(op.action==='example'&&s.job.kind==='workshop'){if(Object.values(s.locks).some(l=>l.until>now&&l.actor!==actor.id))return {ok:false,reason:'Wait until the other builder finishes their part.'};remember(s);s.blueprint=seesawBuild();s.run=null;s.phase='build';s.operators={};s.cranks={};s.liveEdits={};s.locks={};s.accumulator=0;event(s,'Here is a seesaw. The green support is its fulcrum. Run, then hold Power. Try moving the support or changing the weight. Undo restores your previous board.',actor);return {ok:true};}
 if(op.action==='pause'){if(s.phase==='run'){s.phase='paused';s.operators={};s.cranks={};s.liveEdits={};}else if(s.phase==='paused'&&op.paused!==true)s.phase='run';return {ok:true};}
 if(op.action==='reset'){s.phase='build';s.run=null;s.operators={};s.cranks={};s.liveEdits={};s.locks={};s.accumulator=0;s.completed=false;event(s,'Your build is preserved. Tinker with it and test again.',actor);return {ok:true};}
 if(op.action==='test'){if(s.phase!=='build')return {ok:false,reason:'Reset the test before starting a new one.'};s.run=s.job.kind==='workshop'?createInventor(s.job,s.blueprint,s.challenge||null):createRun(s.job,s.blueprint);s.phase='run';s.operators={};s.cranks={};s.liveEdits={};s.runCount++;s.accumulator=0;event(s,'Test running. Drag the blue crank handle to turn it yourself. Hold Power can also run the machine. Gears can be moved while it runs.',actor);return {ok:true};}
 if(s.phase!=='build')return {ok:false,reason:'Reset to the workbench to change parts. You keep your design.'};
 if(op.action==='undo'){if(Object.values(s.locks).some(l=>l.until>now&&l.actor!==actor.id))return {ok:false,reason:'Wait until the other builder finishes their edit before Undo.'};const old=s.history.pop();if(!old)return {ok:false,reason:'No individual change to undo.'};s.blueprint=old;s.locks={};event(s,'Last build change undone.',actor);return {ok:true};}
 if(op.action==='place'){
  if(!PARTS[op.kind]||!finite(op.x)||!finite(op.y))return {ok:false,reason:'Place the part on the pegboard.'};
  if(s.mode!=='sandbox'&&!s.job.parts.includes(op.kind))return {ok:false,reason:'This part is not in this job’s toolbox.'};
  if(s.blueprint.parts.length>=35)return {ok:false,reason:'The workbench has room for 35 parts.'};
  if(s.mode!=='sandbox'&&cost(s)+PARTS[op.kind].cost>s.job.budget)return {ok:false,reason:'The parts budget is full. Reuse or remove a part.'};
  if(op.kind==='weight'&&op.lbs!==undefined&&(!finite(op.lbs)||op.lbs<1||op.lbs>20))return {ok:false,reason:'Choose a weight from 1 to 20 lb.'};
  remember(s);const id='p'+s.blueprint.nextId++;s.blueprint.parts.push(part(op.kind,Math.round(clamp(op.x,.3,9.7)*4)/4,Math.round(clamp(op.y,.25,5.7)*4)/4,{id,rev:0,...(op.kind==='weight'?{lbs:op.lbs??2}:{}),...(op.kind==='ramp'?{angle:-.45}:{}),...(op.kind==='wedge'?{angle:.3}:{})}));event(s,`${actor.name} placed ${op.kind==='weight'?(op.lbs??2)+' lb weight':'a '+PARTS[op.kind].name.toLowerCase()}.`,actor);return {ok:true,id};
 }
 if(op.action==='rope'){
  if(!Array.isArray(op.path))return {ok:false,reason:'Choose rope attachment points first.'};
  const check=ropeCheck(s.blueprint.parts,op.path,{legacyLoad:s.job.kind!=='workshop'});if(op.path.length&&!check.ok)return {ok:false,reason:check.message};
  remember(s);s.blueprint.rope=[...op.path];event(s,op.path.length?'Rope connected. Press Run, then hold Power to wind the drum.':'Rope removed. Your parts stay on the board.',actor);return {ok:true};
 }
 if(!p)return {ok:false,reason:'Select a part on the board first.'};
 if(op.partRev!==undefined&&op.partRev!==(p.rev||0))return {ok:false,reason:'This part changed on another device. Select it again.'};
 if(p.fixed)return {ok:false,reason:'That customer’s fixture stays mounted here.'};remember(s);
 if(op.action==='move'){if(!finite(op.x)||!finite(op.y)){s.history.pop();return {ok:false};}p.x=Math.round(clamp(op.x,.3,9.7)*4)/4;p.y=Math.round(clamp(op.y,.25,5.7)*4)/4;if(p.moving){const w=s.job.kind==='workshop'?s.blueprint.parts.find(q=>q.id===p.loadId):null;p.offsetX=clamp(p.x-(w?.x??8),-.6,.6);p.x=(w?.x??8)+p.offsetX;p.y=w?w.y+.55:1.05;}}
 else if(op.action==='adjust'){
  const allowed={angle:[-.75,.75],r:[.25,1],length:[1,6],friction:[.005,.4],pivot:[.15,.85],pitch:[.03,.2],lbs:[1,20],forceLbs:[.5,10]};if(!allowed[op.key]||!finite(op.value)){s.history.pop();return {ok:false};}p[op.key]=clamp(op.value,...allowed[op.key]);
 }else if(op.action==='moving'){
  if(p.kind!=='pulley'){s.history.pop();return {ok:false};}p.moving=!p.moving;if(p.moving&&s.job.kind==='workshop'){const w=s.blueprint.parts.filter(q=>q.kind==='weight').sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(!w){p.moving=false;s.history.pop();return {ok:false,reason:'Place a weight first. The pulley clips to the closest weight.'};}p.loadId=w.id;p.offsetX=clamp(p.x-w.x,-.5,.5);p.x=w.x+p.offsetX;p.y=w.y+.55;}else if(p.moving){p.y=1.05;p.offsetX=s.blueprint.parts.filter(q=>q.kind==='pulley'&&q.moving&&q.id!==p.id).length?.35:-.35;p.x=8+p.offsetX;}else{p.loadId=null;p.y=Math.min(5.5,p.y+2);}
 }else if(op.action==='remove'){s.blueprint.parts=s.blueprint.parts.filter(q=>q.id!==p.id);s.blueprint.rope=s.blueprint.rope.filter(id=>id!==p.id);}
 else{s.history.pop();return {ok:false,reason:'Unknown workshop action.'};}
 p.rev=(p.rev||0)+1;delete s.locks[p.id];event(s,`${actor.name} adjusted the ${PARTS[p.kind].name.toLowerCase()}.`,actor);return {ok:true};
}
export function tick(s,dt,now=Date.now()){
 for(const [id,l]of Object.entries(s.locks))if(l.until<now)delete s.locks[id];
 if(s.phase!=='run'){s.cranks={};return;}s.run.manual={};for(const [id,c]of Object.entries(s.cranks||{})){if(c.until>now)s.run.manual[id]=c.speed;else delete s.cranks[id];}s.run.operating=Object.values(s.operators).some(until=>until>now);s.accumulator+=Math.min(.1,dt);
 let count=0;while(s.accumulator>=STEP&&count<24){if(s.job.kind==='workshop')stepInventor(s.run,STEP);else step(s.run,STEP);s.accumulator-=STEP;count++;}
 if(s.run.win){s.phase='success';s.completed=true;s.operators={};s.cranks={};s.liveEdits={};event(s,'It worked! Your machine completed the customer’s job.',{name:'Gizmo'});}
}
export function snapshot(s){return {schema:2,job:s.job,mode:s.mode,phase:s.phase,blueprint:s.blueprint,run:s.run,clearRevision:s.clearRevision||0,canUndo:s.history.length>0,challenge:s.challenge||null,revision:s.revision,note:s.note,players:s.players,locks:s.locks,analysis:s.analysis,runCount:s.runCount,completed:s.completed,events:s.events};}

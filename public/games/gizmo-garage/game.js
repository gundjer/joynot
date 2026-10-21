import {Store} from '../_joy/js/storage.js';
import {Sfx} from '../_joy/js/audio.js';
import {Voice} from '../_joy/js/speech.js';
import {mountTogether} from '../_play/together.js';
import {MISSIONS,WORKSHOP,CHALLENGES,gradeOf,clone,part} from './jobs.js';
import {createGarage,command,tick,snapshot} from './garage.js';
import {mountWorkshop} from './workshop-ui.js';
import {seesawBuild} from './inventor.js';
const CFG=window.JOYNOT||{},app=document.querySelector('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state=null,ui=null,together=null,members=[],last=performance.now(),lastSound=0,lastCollision=0,winRecorded=false;
await Store.load();
const progress=Store.data.extra.garage2 ||= {grade:gradeOf(CFG.kid?.grade),completed:{},blueprints:[],sound:true,voice:true};
progress.completed ||= {};progress.blueprints ||= [];progress.trophies ||= {};
Sfx.enabled=progress.sound??(Store.data.settings.sfx!=='off');Voice.enabled=progress.voice??(Store.data.settings.voice!=='off');
function speak(text,force=false){Voice.unlock();Voice.speak(text,{force});}
function toast(text){let el=document.querySelector('.gg-toast');if(!el){el=document.createElement('div');el.className='gg-toast';el.setAttribute('role','status');document.body.appendChild(el);}el.textContent=text;el.hidden=false;clearTimeout(el.timer);el.timer=setTimeout(()=>el.hidden=true,4500);}
function saveBuild(){if(!state)return;progress.resume={job:state.job.id,mode:state.mode,grade:state.job.grade,challenge:state.challenge||null,blueprint:clone(state.blueprint)};Store.save();}
function saveBlueprint(){if(!state)return;progress.blueprints.unshift({job:state.job.id,name:state.job.name,date:Date.now(),blueprint:clone(state.blueprint)});progress.blueprints=progress.blueprints.slice(0,12);saveBuild();toast('Blueprint saved to your workshop library.');}
function act(op,actor={id:'host',name:CFG.kid?.name||'You'}){if(!state)return;const result=command(state,op,actor);if(!result.ok){toast(result.reason||'Choose a part first.');return result;}if(['place','move','adjust','rope','remove','moving','undo','example','clear-board','move-gear'].includes(op.action)){Sfx.init();if(Sfx.enabled)Sfx.click();saveBuild();}ui?.update(state);together?.poke();if(op.action==='example')speak(state.note);return result;}
function playerList(){if(state)state.players=[{id:'host',name:CFG.kid?.name||'You',color:CFG.kid?.color},...members.map(m=>({id:m.token,name:m.name,color:m.color}))];}
function begin(job,mode='campaign',build=null,challenge=null){
 Sfx.init();Voice.unlock();ui?.destroy();state=createGarage(job,mode);state.challenge=challenge;winRecorded=false;
 if(build&&Array.isArray(build.parts)&&build.parts.length<=35){state.blueprint=clone(build);state.blueprint.rope ||= [];state.blueprint.nextId ||= 100;}
 playerList();app.innerHTML='';ui=mountWorkshop({parent:app,send:act,onBook:menu,onQuit:quit,onSave:saveBlueprint,speak,onAudio:()=>{Sfx.enabled=!Sfx.enabled;progress.sound=Sfx.enabled;Store.save();return Sfx.enabled;}});ui.update(state);ui.root.querySelector('#gg-audio').textContent=Sfx.enabled?'Sound on':'Sound off';
 together ||= mountTogether({canvas:()=>ui?.canvas,kid:CFG.kid,game:'gizmo-garage',url:CFG.urls?.coop,csrf:()=>Store.csrf,speak,stopSpeak:()=>Voice.stop(),sfx:Sfx,toast,frames:false,screen:false,statusInterval:100,relayInterval:450,
  status:()=>({garage:state?snapshot(state):null,goal:state?.job.story||'Choosing a workshop job',screen:state?.phase||'Workshop book',level:state?`Grade ${state.job.grade||'K'} · ${state.job.name}`:'Gizmo Garage',tip:'Build, operate and test together. Help / Ask Gizmo explains the controls and results.'}),
  onMembers:list=>{members=list.slice(0,3);playerList();},onMsg:(from,b)=>{if(b?.t!=='garage'||!state)return;const member=members.find(m=>m.token===from);if(member)act(b.op,{id:from,name:member.name});}
 });
 if(mode==='family')together?.start(job.name);
 else{together?.stop();members=[];playerList();}
 saveBuild();speak(`${job.story} Need help? Tap Help, Ask Gizmo. It explains every control and part, reads instructions aloud, and helps you understand each test.`);
}
async function quit(){saveBuild();Voice.stop();together?.stop();Store.beacon();try{await Promise.race([Store.flushNow(),new Promise(resolve=>setTimeout(resolve,1000))]);}finally{location.assign('/');}}
function menu(){
 if(state){saveBuild();if(state.phase==='run')act({action:'pause',paused:true});}ui?.destroy();ui=null;together?.stop();members=[];Voice.stop();
 const grade=gradeOf(progress.grade),challenges=CHALLENGES.filter(c=>c.grade<=Math.max(2,grade));
 app.innerHTML='<section class="gg-menu"><header><img src="/icons/logo.svg" alt="JoyNot"><a href="/">Quit to JoyNot</a><button id="gg-voice">Narration '+(Voice.enabled?'on':'off')+'</button></header><div class="gg-menu-intro"><span class="gg-eyebrow">YOU ARE THE INVENTOR</span><h1>Gizmo Garage</h1><p>A box of parts. A place to try your ideas. Build a seesaw, send weights down ramps, turn gears or lift something heavy.</p><div class="gg-start-actions"><button id="gg-free" class="gg-primary">Open my parts workshop</button><button id="gg-family">Build with family</button><button id="gg-seesaw">Show me a seesaw</button></div><p>Not sure where to start? <b>Show me a seesaw</b> gives you a machine to play with. Every part has a <b>?</b> with a picture and simple instructions.</p><label>School grade <select id="gg-grade">'+[0,1,2,3,4,5].map(g=>'<option value="'+g+'" '+(grade===g?'selected':'')+'>'+(g?'Grade '+g:'Kindergarten')+'</option>').join('')+'</select></label><p class="gg-family-note">Parents and grandparents can build alongside you from the private Grown-Ups area on their own devices.</p></div><h2>Optional trophy challenges</h2><p>You can try these whenever you want. Skip them and keep building, or complete one to collect its trophy.</p><div class="gg-job-grid">'+challenges.map(c=>'<article><span class="gg-job-icon">'+(progress.trophies[c.id]?'🏆':'⚙')+'</span><small>'+(progress.trophies[c.id]?'TROPHY COLLECTED':'OPTIONAL · GRADE '+(c.grade||'K'))+'</small><h2>'+esc(c.name)+'</h2><p>'+esc(c.goal)+'</p><button data-challenge="'+c.id+'">Try for the '+esc(c.trophy)+' trophy</button></article>').join('')+'</div><div class="gg-library"><h2>My saved inventions</h2>'+(progress.resume?'<button id="gg-resume">Continue my last invention</button>':'')+progress.blueprints.map((v,i)=>'<button data-saved="'+i+'">'+esc(v.name)+' · '+new Date(v.date).toLocaleDateString()+'</button>').join('')+'</div></section>';
 const open=(challenge=null,example=false,family=false)=>begin({...WORKSHOP,grade},family?'family':'sandbox',example?seesawBuild():null,challenge);
 app.querySelector('#gg-free').onclick=()=>open();app.querySelector('#gg-family').onclick=()=>open(null,false,true);app.querySelector('#gg-seesaw').onclick=()=>open(null,true);
 app.querySelector('#gg-grade').onchange=e=>{progress.grade=gradeOf(e.target.value);Store.save();menu();};app.querySelector('#gg-voice').onclick=()=>{Voice.enabled=!Voice.enabled;progress.voice=Voice.enabled;Store.save();menu();};
 app.querySelectorAll('[data-challenge]').forEach(b=>b.onclick=()=>open(CHALLENGES.find(c=>c.id===b.dataset.challenge)));
 const restore=r=>{let build=clone(r.blueprint);if(r.job!==WORKSHOP.id){const legacy=MISSIONS.find(j=>j.id===r.job);for(const beam of build.parts.filter(p=>p.kind==='lever'))build.parts.push(part('fulcrum',beam.x+((beam.pivot||.5)-.5)*beam.length,beam.y,{id:'migrated-support-'+beam.id}));if(legacy?.mass)build.parts.push(part('weight',legacy.kind==='lever'?6.25:legacy.spawn?.x||8,legacy.kind==='lever'?1.6:legacy.spawn?.y||.75,{id:'migrated-weight',lbs:Math.min(20,Math.max(1,Math.round(legacy.mass/.45359237)))}));build.parts.forEach(p=>p.fixed=false);}begin({...WORKSHOP,grade:r.grade??grade},r.mode==='family'?'family':'sandbox',build,r.challenge||null);};
 app.querySelectorAll('[data-saved]').forEach(b=>b.onclick=()=>restore(progress.blueprints[+b.dataset.saved]));const resume=app.querySelector('#gg-resume');if(resume)resume.onclick=()=>restore(progress.resume);
}
function frame(now){const dt=(now-last)/1000;last=now;if(state&&ui){tick(state,dt);ui.update(state);if(state.run&&Sfx.ctx&&Sfx.enabled&&now-lastSound>180){if(state.run.collisions>lastCollision){Sfx.drop();lastCollision=state.run.collisions;lastSound=now;}else if(state.run.operating&&state.phase==='run'){const speed=state.run.parts.reduce((n,p)=>n+Math.abs(p.w||0),Math.abs(state.run.shaftSpeed||0));Sfx._tone(Sfx.ctx.currentTime,.065,75+Math.min(300,speed*5),'triangle',.035);lastSound=now;}}if(state.job.kind==='workshop'&&state.run?.earned&&state.challenge&&!progress.trophies[state.challenge.id]){progress.trophies[state.challenge.id]={date:Date.now(),trophy:state.challenge.trophy};saveBuild();if(Sfx.enabled)Sfx.win();toast('🏆 '+state.challenge.trophy+' trophy earned! Keep inventing.');speak('Trophy earned! '+state.challenge.trophy+'. You can keep playing with your invention.');}if(state.phase==='success'&&!winRecorded){winRecorded=true;progress.completed[state.job.id]={date:Date.now(),seconds:state.run.t,joules:state.run.energy,tests:state.runCount};saveBuild();Sfx.init();if(Sfx.enabled)Sfx.win();speak(`It worked! ${state.job.real}`);together?.poke();}}requestAnimationFrame(frame);}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state?.phase==='run')act({action:'pause'});});
window.addEventListener('pagehide',()=>{saveBuild();Store.beacon();});
menu();requestAnimationFrame(frame);

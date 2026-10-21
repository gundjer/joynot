import {PARTS} from './jobs.js';
export function ropeCheck(parts,path,{legacyLoad=false,draft=false}={}){
 if(!Array.isArray(path)||path.length>16)return {ok:false,message:'A rope can visit up to 16 attachment points.'};
 const items=path.map(id=>id==='load'&&legacyLoad?{id,kind:'weight'}:parts.find(p=>p.id===id));
 if(items.some(p=>!p))return {ok:false,message:'A part in this rope was removed. Undo that point and choose another.'};
 if(new Set(path).size!==path.length)return {ok:false,message:'That point is already in this rope. Use Undo point to go back.'};
 if(!items.length)return {ok:!!draft,message:'First, tap the green socket on a rope drum.'};
 if(items[0].kind!=='winch')return {ok:false,message:'Start at a rope drum. Its handle winds up your rope.'};
 const tail=items.at(-1),complete=items.length>=2&&['weight','anchor'].includes(tail.kind);
 if(items.slice(1,complete?-1:undefined).some(p=>p.kind!=='pulley'))return {ok:false,message:'Visit pulley wheels, then finish at a weight or an anchor.'};
 if(!complete)return {ok:!!draft,message:'Now tap a pulley, or tap a weight to tie the end. You can add more pulleys before the end.'};
 const carried=items.filter(p=>p.kind==='pulley'&&p.moving),loads=carried.map(p=>p.loadId).filter(Boolean);
 if(carried.some(p=>p.loadId&&!parts.some(w=>w.id===p.loadId&&w.kind==='weight')))return {ok:false,message:'A carried pulley needs a weight. Clip it to a weight again.'};
 if(new Set([...loads,...(tail.kind==='weight'&&tail.id!=='load'?[tail.id]:[])]).size>1)return {ok:false,message:'Use one weight for this rope. Clip the carried pulleys to that same weight.'};
 if(tail.kind==='anchor'&&!carried.length)return {ok:false,message:'This rope holds no weight yet. End at a weight, or use a pulley clipped to a weight before the anchor.'};
 return {ok:true,complete:true,message:'Rope ready! Finish rope, then Run and hold Power.'};
}
export function ropePorts(state){const parts=state.run&&state.phase!=='build'?state.run.parts:state.blueprint.parts;
 const ports=parts.filter(p=>['winch','pulley','weight','anchor'].includes(p.kind)).map(p=>{const load=parts.find(w=>w.id===p.loadId)||state.run?.body;return {id:p.id,kind:p.kind,label:p.kind==='weight'?`${p.lbs||2} lb weight`:p.moving?'Pulley clipped to weight':PARTS[p.kind].name,x:p.moving&&load?load.x+(p.offsetX||0):p.x,y:p.moving&&load?load.y+.55:p.y+(p.kind==='weight'?.35:0)};});
 if(state.job.kind!=='workshop'&&['pulley','compound'].includes(state.job.kind)){const b=state.run?.body||{x:8,y:.5};ports.push({id:'load',kind:'weight',label:'Basket',x:b.x,y:b.y+.45});}return ports;
}
export function pickRopePort(renderer,x,y,state){return ropePorts(state).map(p=>{const q=renderer.project(p.x,p.y);return {...p,distance:Math.hypot(q.x-x,q.y-y)};}).filter(p=>p.distance<=24).sort((a,b)=>a.distance-b.distance)[0]||null;}

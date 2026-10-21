// Local, fixed-step mechanics. Success is measured from motion, never a part-name recipe.
import {clone} from './jobs.js';
export const STEP=1/240,G=9.81;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const dot=(a,b)=>a.x*b.x+a.y*b.y;
export function endpoints(p){const l=(p.length||3)/2,c=Math.cos(p.angle),s=Math.sin(p.angle),f=p.kind==='lever'?((p.pivot||.5)-.5)*p.length:0;return [{x:p.x+f+c*(-l-f),y:p.y+s*(-l-f)},{x:p.x+f+c*(l-f),y:p.y+s*(l-f)}];}
function nearestLine(p,a,b){const d={x:b.x-a.x,y:b.y-a.y},t=clamp(((p.x-a.x)*d.x+(p.y-a.y)*d.y)/(dot(d,d)||1),0,1);return {x:a.x+d.x*t,y:a.y+d.y*t,t};}
export function createRun(job,bp){const parts=clone(bp.parts).map(p=>({...p,a:p.angle||0,w:0,inertia:Math.max(.01,.4*(p.r||.3)**2),impulse:0}));
 const body={x:job.kind==='cart'?2:job.kind==='lever'?6.25:job.kind==='ramp'?job.spawn.x:8,y:job.kind==='ramp'?job.spawn.y:job.kind==='lever'?1.6:job.kind==='cart'?.5:.5,vx:0,vy:0,m:job.mass||1,r:job.kind==='ramp'?.16:.38};
 const run={job:clone(job),parts,rope:clone(bp.rope),body,t:0,hold:0,win:false,energy:0,effort:0,brake:false,operating:false,collisions:0,diagnosis:'Operate your machine and watch its motion.',shaftAngle:0,shaftSpeed:0,door:0,ropeLength:0,tension:0};
 run.ropeLength=ropeGeometry(run).length;return run;
}
export function ropePoints(run){const out=[];for(const id of run.rope){if(id==='load')out.push({id,x:run.body.x,y:run.body.y+.45,load:true});else{const p=run.parts.find(p=>p.id===id);if(p){const moving=p.kind==='pulley'&&p.moving,b=run.parts.find(q=>q.id===p.loadId)||run.body;out.push({id,x:moving?b.x+(p.offsetX||0):p.x,y:moving?b.y+.55:p.y+(p.kind==='weight'?.35:0),load:moving||p.kind==='weight',part:p});}}}return out;}
export function ropeGeometry(run){const points=ropePoints(run);let length=0,jy=0;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.001;length+=d;jy+=(b.load?1:0)*dy/d-(a.load?1:0)*dy/d;}return {points,length,jy};}
export function supportingStrands(run){return Math.abs(ropeGeometry(run).jy);}
export function collide(run,p){const b=run.body,[a,z]=endpoints(p),npt=nearestLine(b,a,z),dx=b.x-npt.x,dy=b.y-npt.y,d=Math.hypot(dx,dy);if(d>=b.r+.07||dy<-.1)return;
 const n={x:d>1e-7?dx/d:-Math.sin(p.angle),y:d>1e-7?dy/d:Math.cos(p.angle)},r={x:npt.x-p.x-(p.kind==='lever'?((p.pivot||.5)-.5)*p.length:0),y:npt.y-p.y},cross=r.x*n.y-r.y*n.x,dynamic=p.kind==='lever',lv=dynamic?{x:-r.y*p.w,y:r.x*p.w}:{x:0,y:0},vn=dot({x:b.vx-lv.x,y:b.vy-lv.y},n),inv=1/b.m+(dynamic?cross*cross/p.inertia:0);
 if(vn<0){const impulse=-(1.03)*vn/inv;b.vx+=impulse*n.x/b.m;b.vy+=impulse*n.y/b.m;if(dynamic)p.w-=impulse*cross/p.inertia;run.collisions++;}
 const penetration=b.r+.07-d;b.x+=n.x*penetration*.75;b.y+=n.y*penetration*.75;
 const tangent={x:n.y,y:-n.x},v=dot({x:b.vx-lv.x,y:b.vy-lv.y},tangent),friction=clamp(v,-G*(p.friction||.08)*STEP,G*(p.friction||.08)*STEP);b.vx-=friction*tangent.x;b.vy-=friction*tangent.y;
}
export function gears(run,dt){for(const p of run.parts){if(!['gear','motor','fan','winch'].includes(p.kind))continue;
  if(p.kind==='motor'&&run.operating){const torque=run.job.kind==='compound'?run.job.effort*.1:.8,drive=Math.max(0,1-Math.abs(p.w)/30);p.w+=torque*drive/p.inertia*dt;run.energy+=Math.max(0,torque*drive*p.w*dt);run.effort=torque/.1;}
  p.w*=Math.exp(-(p.kind==='fan'?.10:.025)*dt);if(p.kind==='winch'&&run.job.kind==='pulley'&&run.operating&&!run.brake){const torque=run.job.effort*.1,drive=Math.max(0,1-Math.abs(p.w)/18);p.w+=torque*drive/p.inertia*dt;run.energy+=Math.max(0,torque*drive*p.w*dt);run.effort=torque/.1;}
  if(p.kind==='winch'&&run.brake)p.w=0;
 }
 for(let iteration=0;iteration<10;iteration++)for(let i=0;i<run.parts.length;i++)for(let j=i+1;j<run.parts.length;j++){const a=run.parts[i],b=run.parts[j];if(!['gear','motor','fan','winch'].includes(a.kind)||!['gear','motor','fan','winch'].includes(b.kind))continue;if(Math.abs(Math.hypot(a.x-b.x,a.y-b.y)-a.r-b.r)>.12)continue;
  const ia=a.kind==='winch'&&run.brake?0:1/a.inertia,ib=b.kind==='winch'&&run.brake?0:1/b.inertia,den=a.r*a.r*ia+b.r*b.r*ib;if(!den)continue;const lambda=-(a.r*a.w+b.r*b.w)/den;a.w+=lambda*a.r*ia;b.w+=lambda*b.r*ib;
 }
}
export function rope(run,dt){const winch=run.parts.find(p=>p.id===run.rope[0]&&p.kind==='winch'),geo=ropeGeometry(run);if(!winch||geo.points.length<2||!geo.points.some(p=>p.load)||geo.jy>=-.05)return;
 const radius=.1,position=geo.length+radius*winch.a-run.ropeLength,velocity=geo.jy*run.body.vy+radius*winch.w,iw=run.brake?0:1/winch.inertia,den=geo.jy**2/run.body.m+radius**2*iw;if(position<-.01&&velocity<=0)return;
 const impulse=Math.min(0,-(velocity+Math.max(0,position)*.15/dt)/den);winch.w+=radius*impulse*iw;run.body.vy+=geo.jy*impulse/run.body.m;run.tension=Math.max(run.tension,-impulse/dt);
}
function screw(run,dt){const s=run.parts.find(p=>p.kind==='screw'),w=run.parts.find(p=>p.kind==='wedge');if(!s||!w||Math.hypot(s.x-w.x,s.y-w.y)>2){run.diagnosis='Move the screw jack close enough to drive the wedge.';return;}
 const slope=Math.tan(Math.abs(w.angle)||.25),lead=s.pitch/(2*Math.PI),mass=run.job.mass,gravity=mass*G*slope*lead,friction=mass*G*.06*lead,inertia=.003+mass*(slope*lead)**2;
 const torque=run.operating?run.job.effort*.1:0;run.shaftSpeed+=(torque-gravity-Math.sign(run.shaftSpeed||1)*friction)/inertia*dt;run.shaftSpeed=clamp(run.shaftSpeed,-15,15);if(run.brake)run.shaftSpeed=0;run.shaftAngle=Math.max(0,run.shaftAngle+run.shaftSpeed*dt);if(run.shaftAngle===0)run.shaftSpeed=Math.max(0,run.shaftSpeed);run.door=Math.min(1.4,run.shaftAngle*lead*slope);run.body.y=.5+run.door;run.body.vy=run.shaftSpeed*lead*slope;run.energy+=Math.max(0,torque*run.shaftSpeed*dt);run.effort=torque/.1;s.a=run.shaftAngle;w.slide=run.shaftAngle*lead;
}
export function step(run,dt=STEP){if(run.win)return;const b=run.body,j=run.job;run.t+=dt;run.effort=0;run.tension=0;
 if(j.energy&&run.energy>=j.energy)run.operating=false;
 if(j.kind==='screw'){screw(run,dt);if(run.parts.some(p=>p.kind==='screw')&&run.parts.some(p=>p.kind==='wedge'))run.diagnosis=run.shaftSpeed>.1?'The thread is driving the wedge and raising the door. Watch how far each turn moves it.':run.operating?'The jack is stalled under the door’s weight. Try a finer thread or shallower wedge.':'Hold Operate to turn the screw. Brake holds the door while you inspect it.';}
 else if(j.kind==='lever'){
  // A shallow bolted cradle keeps the load on the beam. Its mass contributes
  // to rotational inertia and gravity torque around the actual fulcrum.
  const p=run.parts.find(p=>p.kind==='lever');
  if(p){const pivot=p.x+((p.pivot||.5)-.5)*p.length,arm=6.25-pivot,input=(p.pivot||.5)*p.length;
   const end=endpoints(p)[0],push=run.parts.find(q=>q.kind==='piston'&&Math.abs(q.x-end.x)<1.1&&q.y>end.y&&q.y-end.y<4);
   const drive=push&&run.operating&&!run.brake?j.effort*input*Math.cos(p.angle):0;
   const load=b.m*G*arm*Math.cos(p.angle),inertia=4+b.m*arm*arm;
   p.w+=(drive-load-.8*p.w)/inertia*dt;if(run.brake)p.w=0;
   p.angle=clamp(p.angle+p.w*dt,-.35,.6);if(p.angle===-.35||p.angle===.6)p.w=0;
   b.x=pivot+Math.cos(p.angle)*arm-Math.sin(p.angle)*.45;b.y=p.y+Math.sin(p.angle)*arm+Math.cos(p.angle)*.45;
   b.vx=(-Math.sin(p.angle)*arm-Math.cos(p.angle)*.45)*p.w;b.vy=(Math.cos(p.angle)*arm-Math.sin(p.angle)*.45)*p.w;
   run.energy+=Math.max(0,drive*p.w*dt);run.effort=drive?j.effort:0;
   run.diagnosis=!push?'Place the pusher above the left effort end.':drive<=load?'The load is winning the turning contest. Try a longer effort arm.':'The pusher turns the lever and raises the load in its cradle.';
  }else{b.vy-=G*dt;b.y=Math.max(b.r+.05,b.y+b.vy*dt);run.diagnosis='The crate needs a lever and fulcrum beneath its cradle.';}
 }else if(j.kind==='cart'){
  const wheels=run.parts.filter(p=>p.kind==='wheel'&&Math.hypot(p.x-b.x,p.y-.32)<.9).length,pusher=run.parts.some(p=>p.kind==='piston'&&p.x<b.x&&b.x-p.x<7),force=run.operating&&pusher&&!run.brake?j.effort:0,friction=(run.brake?.6:wheels>=2?.018:.5)*b.m*G;
  const net=Math.abs(b.vx)<.001&&force<=friction?0:force-Math.sign(b.vx||force)*friction;b.vx+=net/(b.m+(wheels>=2?b.m*.15:0))*dt;if(!force&&Math.abs(b.vx)<.03)b.vx=0;b.x+=b.vx*dt;run.energy+=Math.max(0,force*b.vx*dt);run.effort=force;
  if(wheels>=2)for(const p of run.parts.filter(p=>p.kind==='wheel')){p.offsetX??=p.x-2;p.x=b.x+p.offsetX;p.a-=b.vx/p.r*dt;}
  // A telescopic spring pusher follows its contact face while its finite stroke extends.
  if(force)for(const p of run.parts.filter(p=>p.kind==='piston'))p.extension=clamp(b.x-p.x-.5,0,6);
  run.diagnosis=wheels<2?'The crate scrapes along the floor. Try round wheels under both axle marks.':!pusher?'Place a pusher behind the cart, then hold Operate.':'The wheels are rolling. Release Operate to slow the cart in the green bay.';
 }else{
  b.vy-=G*dt;gears(run,dt);
  for(const p of run.parts.filter(p=>p.kind==='lever')){p.inertia=4;p.w-=Math.cos(p.angle)*.12*dt;const push=run.parts.find(q=>q.kind==='piston'&&Math.abs(q.x-(p.x-1.5))<1.5);if(push&&run.operating){const arm=(p.pivot||.5)*p.length,torque=j.effort*arm;p.w+=torque/p.inertia*dt;run.effort=j.effort;run.energy+=Math.max(0,torque*p.w*dt);}p.w*=Math.exp(-.4*dt);p.angle=clamp(p.angle+p.w*dt,-.6,.6);if(Math.abs(p.angle)>=.6)p.w=0;}
  for(let i=0;i<6;i++)rope(run,dt);
  b.x+=b.vx*dt;b.y+=b.vy*dt;
  for(const p of run.parts.filter(p=>['ramp','lever'].includes(p.kind)))collide(run,p);
  if(b.y<b.r+.05){b.y=b.r+.05;if(b.vy<0)b.vy*=-.07;b.vx*=Math.exp(-2*dt);}
  if(b.x<.15){b.x=.15;b.vx=Math.abs(b.vx)*.1;}if(b.x>9.8){b.x=9.8;b.vx=-Math.abs(b.vx)*.1;}
  if(j.kind==='ramp'&&b.y<.93){for(const wall of [j.target-.55,j.target+.55]){if(Math.abs(b.x-wall)<b.r+.04){const side=b.x<wall?-1:1;b.x=wall+side*(b.r+.04);if(b.vx*side<0)b.vx=-b.vx*.15;}}}
  for(const p of run.parts.filter(p=>['gear','motor','fan','winch'].includes(p.kind)))p.a+=p.w*dt;
  if(j.kind==='gears'){const fan=run.parts.find(p=>p.kind==='fan');run.diagnosis=!fan||Math.abs(fan.w)<.1?'The fan is still. Mesh gear teeth from the crank all the way to the fan.':fan.w<0?'The fan is turning backward. Try another meshing gear.':'The fan is moving air. Keep it turning steadily.';}
  else if(['pulley','compound'].includes(j.kind)){const n=supportingStrands(run);run.diagnosis=n<1?'The basket has no supporting rope. Connect the drum, upper wheels, basket wheels and anchor.':b.vy<.01&&run.operating?'The crank is loaded. More supporting rope strands or a gear reduction can trade distance for lifting force.':`The rope supports ${n.toFixed(1)} effective strands. Lift, then use the brake to park at the loft.`;}
  else if(j.kind==='ramp')run.diagnosis=b.y<.3&&Math.abs(b.x-j.target)>1?'The apple missed the basket. Reset the test, then adjust the ramp slope or position.':'Gravity is moving the apple. Watch where the ramp sends it.';
 }
 let reached=false;
 if(j.kind==='cart')reached=Math.abs(b.x-j.target)<.6&&Math.abs(b.vx)<.7;
 if(j.kind==='ramp')reached=Math.abs(b.x-j.target)<.6&&b.y<.8&&Math.abs(b.vx)<1.2;
 if(j.kind==='lever')reached=b.y>=j.target;
 if(j.kind==='gears'){const fan=run.parts.find(p=>p.kind==='fan');reached=!!fan&&fan.w>j.target;}
 if(['pulley','compound'].includes(j.kind))reached=b.y>=j.target-.1&&b.y<j.target+.5&&Math.abs(b.vy)<.3&&run.brake;
 if(j.kind==='screw')reached=run.door>=j.target;
 if(j.energy&&run.energy>j.energy){reached=false;run.diagnosis='The energy budget is spent. Reset and reduce friction or improve the transmission.';run.operating=false;}
 run.hold=reached?run.hold+dt:0;run.win=run.hold>=1.1;
}
export function advance(run,seconds){const n=Math.floor(seconds/STEP);for(let i=0;i<n;i++)step(run);return run;}

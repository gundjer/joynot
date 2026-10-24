import {tilePoint} from './board.js';
const ease=t=>t*t*(3-2*t),clamp=x=>Math.min(1,Math.max(0,x));
export function motionFor(move,{reduced=false,speed='normal'}={}){const factor=reduced?.15:({slow:1.2,normal:1,fast:.85}[speed]||1),rollDuration=600*factor,walkDuration=Math.max(1,move.landing-move.from)*720*factor,linkDuration=move.to!==move.landing?1800*factor:0;return {move,rollDuration,walkDuration,linkDuration,duration:rollDuration+walkDuration+linkDuration+650*factor,reduced};}
export function sampleMotion(m,elapsed){const {move}=m,walking=Math.max(0,elapsed-m.rollDuration),steps=move.landing-move.from;let p,lift=0;
 if(walking<m.walkDuration){const at=clamp(walking/m.walkDuration)*steps,n=Math.min(Math.floor(at),Math.max(0,steps-1)),fraction=steps?at-n:0,a=tilePoint(move.from+n),b=tilePoint(Math.min(move.landing,move.from+n+1)),t=ease(fraction);p={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};lift=m.reduced?0:Math.sin(fraction*Math.PI)*.32;}
 else{const a=tilePoint(move.landing),b=tilePoint(move.to),t=m.linkDuration?ease(clamp((walking-m.walkDuration)/m.linkDuration)):1;p={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};}
 const zoom=m.reduced?0:ease(clamp(elapsed/650))*ease(clamp((m.duration-elapsed)/650));return {...p,lift,zoom,done:elapsed>=m.duration,dieRolling:elapsed<m.rollDuration};
}

import {mountSpaceTable} from './table-ui.js';
import {controllerTag} from '../sparkles-rainbow-journey/js/board.js';
// The existing helper route verifies the family account and Grown-Ups access.
export function mountSpaceRemote({parent,me,send,onQuit}){
 if(!document.querySelector('[data-space-style]')){const css=document.createElement('link');css.rel='stylesheet';css.href='/games/star-academy/game.css?v=spiral3';css.dataset.spaceStyle='1';document.head.appendChild(css);}
 const guard=document.getElementById('guard');guard?.classList.add('space-family');for(const id of ['selfcam','kidcam']){const el=document.getElementById(id);if(el)guard?.appendChild(el);}
 let key='',nextClaim=0;const actor=controllerTag(me.token);
 const ui=mountSpaceTable({parent,actor,send:(action,value)=>send({t:'space-race',action,value,key}),onQuit});
 return {update(s){key=s.key;ui.update(s);if(s.phase!=='lobby'&&!s.players.some(p=>p.owner===actor)&&s.players.some(p=>p.remote&&p.name===me.name)&&Date.now()>nextClaim){nextClaim=Date.now()+2500;send({t:'space-race',action:'join',key});}},destroy:()=>ui.destroy()};
}

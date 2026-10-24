import {mountAcademyUI} from './ui.bundle.js';
import {controllerTag} from '../../sparkles-rainbow-journey/js/board.js';
export function mountAcademyRemote({parent,me,send,onQuit}){
 if(!document.querySelector('[data-academy-style]')){const css=document.createElement('link');css.rel='stylesheet';css.href='/games/robo-brain/academy/game.css?v=academy3';css.dataset.academyStyle='1';document.head.appendChild(css);}const guard=document.getElementById('guard');guard?.classList.add('robo-family');for(const id of ['selfcam','kidcam']){const el=document.getElementById(id);if(el)guard?.appendChild(el);}
 let key='';const actor=controllerTag(me.token);const ui=mountAcademyUI({parent,actor,send:(action,value)=>send({t:'academy',action,value,key}),onQuit});return {update(s){key=s.key;ui.update(s);window.__academyRemote={get state(){return s},get world(){return ui.world}};},destroy(){ui.destroy();guard?.classList.remove('robo-family');}};
}

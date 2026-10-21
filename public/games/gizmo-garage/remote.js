import {mountWorkshop} from './workshop-ui.js';
import {Voice} from '../_joy/js/speech.js';
import {Sfx} from '../_joy/js/audio.js';
// The existing helper route enforces family ownership and the Grown-Ups PIN.
export function mountGarageRemote({parent,me,send,onQuit}){
 let css=document.querySelector('[data-garage-style]');if(!css){css=document.createElement('link');css.rel='stylesheet';css.href='/games/gizmo-garage/game.css?v=garage5';css.dataset.garageStyle='1';document.head.appendChild(css);}
 document.querySelector('#guard')?.classList.add('garage-family');
 const ui=mountWorkshop({parent,actor:me.token,remote:true,onQuit,send:op=>send({t:'garage',op}),speak:(text,force=false)=>{Voice.unlock();Voice.speak(text,{force});},onAudio:()=>{Sfx.init();return Sfx.enabled=!Sfx.enabled;}});
 // Do not expose controls before their canvas layout and pointer projection exist.
 ui.root.style.visibility='hidden';const ready=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{ui.root.style.visibility='visible';}));if(css.sheet)ready();else css.addEventListener('load',ready,{once:true});
 return {update:s=>ui.update(s),destroy:()=>ui.destroy()};
}

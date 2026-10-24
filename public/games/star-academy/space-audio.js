import {Sfx} from '../_joy/js/audio.js';
import {Voice} from '../_joy/js/speech.js';
// One owner for music per game view; hiding, blurring, quitting or destroying always silences it.
export class SpaceAudio{
 constructor(root){this.root=root;this.active=false;this.wanted=false;this.unlocked=false;this.disposed=false;Sfx.stopMusic();this.sync=this.sync.bind(this);this.unlock=this.unlock.bind(this);this.hide=()=>{Sfx.stopMusic();Voice.stop();if(Sfx.master)Sfx.master.gain.value=0;};root.addEventListener('pointerdown',this.unlock,{capture:true});this.visibility=()=>{if(document.hidden)this.hide();else this.sync();};document.addEventListener('visibilitychange',this.visibility);window.addEventListener('focus',this.sync);window.addEventListener('blur',this.hide);window.addEventListener('pageshow',this.sync);window.addEventListener('pagehide',this.hide);}
 unlock(){if(this.disposed)return;Sfx.init();Voice.unlock();this.unlocked=true;this.sync();}
 set(active,wanted){this.active=active;this.wanted=wanted;this.sync();}
 sync(){if(this.disposed)return;const visible=this.root.isConnected&&!document.hidden&&document.hasFocus();if(Sfx.master)Sfx.master.gain.value=visible?.8:0;if(visible&&this.active&&this.wanted&&this.unlocked)Sfx.startMusic();else Sfx.stopMusic();}
 destroy(){if(this.disposed)return;this.hide();this.disposed=true;this.root.removeEventListener('pointerdown',this.unlock,{capture:true});document.removeEventListener('visibilitychange',this.visibility);window.removeEventListener('focus',this.sync);window.removeEventListener('blur',this.hide);window.removeEventListener('pageshow',this.sync);window.removeEventListener('pagehide',this.hide);}
}

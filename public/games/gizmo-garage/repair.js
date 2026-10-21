import {blueprint,part} from './jobs.js';
// A customer brings in a broken machine. The child repairs its actual geometry.
// Faults are never multiple-choice prompts and cannot complete through a named answer.
export function repairBuild(job){const b=blueprint(job);let n=0;const add=(kind,x,y,extra={})=>{const p=part(kind,x,y,{id:'repair'+(++n),...extra});b.parts.push(p);return p.id;};
 if(job.kind==='cart'){add('wheel',1.5,.25);add('wheel',3.5,1.5);add('piston',1,.5);}
 if(job.kind==='ramp')add('ramp',3.5,2.5,{length:6,angle:-.6,friction:.1});
 if(job.kind==='lever'){b.parts[0].pivot=.4;add('piston',3,3.25);}
 if(job.kind==='gears'){add('gear',3,3);add('gear',4.5,4);add('gear',6,3);}
 if(['pulley','compound'].includes(job.kind)){
  if(job.kind==='compound'){add('gear',2.5,3,{r:.5});add('gear',4,4,{r:1});add('gear',6,3,{r:1});}
  const a=add('pulley',7.25,5.25),c=add('pulley',7.65,1.05,{moving:true,offsetX:-.35}),d=add('pulley',8.35,1.05,{moving:true,offsetX:.35}),z=add('pulley',8.75,5.25),anchor=add('anchor',6.75,5.25);
  b.rope=job.kind==='pulley'?['winch',a,'load']:['winch',a,c,z,d,anchor];
 }
 if(job.kind==='screw'){add('screw',6.5,1);add('wedge',7.5,.5,{angle:.35});}
 b.nextId=100;return b;
}

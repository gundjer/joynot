import {part,blueprint} from '../../public/games/gizmo-garage/jobs.js';
export function referenceBuild(job){const b=blueprint(job);let id=0;const add=(k,x,y,extra={})=>{const p=part(k,x,y,{id:'test'+(++id),...extra});b.parts.push(p);return p.id;};
 if(job.kind==='cart'){add('wheel',1.6,.32);add('wheel',2.4,.32);add('piston',1,.6);}
 if(job.kind==='ramp')add('ramp',3.5,2.5,{length:6,angle:-.3,friction:.1});
 if(job.kind==='lever')add('piston',3,3.25);
 if(job.kind==='gears'){add('gear',3,3);add('gear',4.5,3);add('gear',6,3);}
 if(['pulley','compound'].includes(job.kind)){if(job.kind==='compound'){add('gear',2.5,3,{r:.5});add('gear',4,3,{r:1});add('gear',6,3,{r:1});}
  const A=add('pulley',7.25,5.3),B=add('pulley',8.75,5.3),C=add('pulley',7.65,1.05,{moving:true,offsetX:-.35}),D=add('pulley',8.35,1.05,{moving:true,offsetX:.35}),anchor=add('anchor',6.8,5.3);b.rope=['winch',A,C,B,D,anchor];
 }
 if(job.kind==='screw'){add('screw',6.5,.9,{pitch:.05});add('wedge',7.5,.5,{angle:.35});}return b;
}

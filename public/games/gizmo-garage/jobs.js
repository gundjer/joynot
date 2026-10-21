export const PARTS={
 weight:{name:'Weight',color:'#687d93',cost:1},fulcrum:{name:'Fulcrum · seesaw support',color:'#659b81',cost:1},
 wheel:{name:'Wheel & axle',color:'#517c86',r:.32,cost:1},ramp:{name:'Wooden ramp',color:'#bc8d55',length:3,cost:2},lever:{name:'Lever & fulcrum',color:'#bd965f',length:3,cost:2},
 gear:{name:'Brass gear',color:'#c7a15a',r:.75,cost:2},motor:{name:'Hand crank',color:'#60968e',r:.75,cost:2},fan:{name:'Drying fan',color:'#72aaa0',r:.75,cost:2},
 pulley:{name:'Pulley wheel',color:'#7f9bab',r:.25,cost:2},winch:{name:'Rope drum',color:'#bb7656',r:.5,cost:2},anchor:{name:'Rope anchor',color:'#71818c',cost:1},
 piston:{name:'Spring pusher',color:'#b96d55',cost:2},screw:{name:'Threaded jack',color:'#8d9da4',cost:3},wedge:{name:'Lifting wedge',color:'#d0a569',cost:2},
};
export const WORKSHOP={id:'open-workshop',grade:0,name:'Inventor’s Playground',kind:'workshop',story:'Build anything you want to try. Pick parts, put them together, then Run and hold Power. Tap any ? to see what a part does. Challenges are optional.',real:'You can invent, test, change things and try again.',parts:Object.keys(PARTS),budget:999};
export const CHALLENGES=[
 {id:'first-lift',grade:0,name:'First lift',goal:'Raise any weight a little using a lever or rope.',trophy:'Little Lifter',type:'lift',rise:.15,minLbs:1,maxForce:20},
 {id:'rolling-discovery',grade:1,name:'Downhill discovery',goal:'Send a weight down a ramp so it travels at least 3 board spaces.',trophy:'Ramp Explorer',type:'roll',distance:3},
 {id:'ten-with-two',grade:2,name:'Lift 10 lb with 2 lb of force',goal:'Lift a weight of at least 10 lb clear of its starting position. Use no more than 2 lb of force. Try moving the fulcrum closer to the weight.',trophy:'Small Force, Big Lift',type:'lift',rise:.15,minLbs:10,maxForce:2},
 {id:'fan-builder',grade:3,name:'Make your own gear train',goal:'Connect a hand crank to a fan through at least two gears. Make the fan spin.',trophy:'Gear Inventor',type:'fan'},
 {id:'rope-lifter',grade:4,name:'Share the load',goal:'Lift a 10 lb weight clear of its starting position using a rope and basket-mounted pulley, with at most 4 lb of force.',trophy:'Rope Engineer',type:'rope',rise:.5,minLbs:10,maxForce:4},
 {id:'twenty-with-two',grade:5,name:'Heavyweight inventor',goal:'Lift a weight of at least 20 lb by half a board space using no more than 2 lb of force. Combine parts or use a counterweight.',trophy:'Master Inventor',type:'lift',rise:.08,minLbs:20,maxForce:2},
];
export const MISSIONS=[
 {id:'market-cart',grade:0,name:'Market Day Delivery',kind:'cart',story:'Mina’s fruit stall opens soon. Her heavy trolley scrapes along the floor. Give it wheels, then hold the pusher to move it into the loading bay.',real:'Shopping trolleys and wheelbarrows use wheels to reduce the effort needed to move a load.',parts:['wheel','piston'],mass:4,effort:5,target:8,budget:6},
 {id:'toy-rescue',grade:0,name:'Toy Rescue Run',kind:'cart',story:'The toy hospital needs its supply cart. Build a rolling base and operate your pusher. Stop the cart inside the green bay.',real:'Hospital carts carry heavy equipment on wheels so people can move it more easily.',parts:['wheel','piston'],mass:5,effort:5,target:7.5,budget:5},
 {id:'orchard-ramp',grade:1,name:'Apple Delivery Chute',kind:'ramp',story:'An apple rolls from the orchard loft. Build a smooth ramp into Mina’s basket. Release the apple, watch where it goes, and adjust your machine.',real:'Loading ramps and gravity-fed delivery chutes guide things downhill without a motor.',parts:['ramp'],mass:.3,target:7.8,budget:6,spawn:{x:1.4,y:4.3}},
 {id:'marble-mail',grade:1,name:'Marble Mail',kind:'ramp',story:'Send a glass message marble into the receiving basket. Join two ramps or try one longer slope. Catch it without sending it over the far edge.',real:'Conveyor chutes guide parcels between different heights in sorting warehouses.',parts:['ramp'],mass:.2,target:8.3,budget:6,spawn:{x:1.4,y:4.3}},
 {id:'garden-lever',grade:2,name:'Lift the Garden Gate',kind:'lever',story:'A fallen stone has blocked the garden gate. Slide the fulcrum, place a pusher above the long arm and lift the stone clear.',real:'A crowbar uses a long effort arm to lift a heavy load with a smaller force.',parts:['lever','piston'],mass:4,effort:18,target:1.75,budget:6},
 {id:'rescue-lift',grade:2,name:'Rescue Platform',kind:'lever',story:'Lift the supply box onto the rescue ledge. Try the fulcrum in different places, operate the pusher and watch the beam respond to the weight.',real:'A seesaw and a crowbar balance turning forces around a pivot.',parts:['lever','piston'],mass:5,effort:20,target:1.75,budget:6},
 {id:'windy-washing',grade:3,name:'Spin the Drying Fan',kind:'gears',story:'The community laundry needs moving air. Connect the crank to the fan with meshing gears. Turn the crank and make the fan run steadily in the marked direction.',real:'Gear trains transmit rotation in clocks, hand drills and mechanical tools.',parts:['gear'],target:3,effort:3,budget:12},
 {id:'clock-repair',grade:3,name:'Clockwork Repair',kind:'gears',story:'The town clock’s cooling fan has stopped. Bridge the gap with gears, then crank the machine. Change a gear’s size to explore speed and torque.',real:'A large gear driving a smaller gear trades turning force for faster rotation.',parts:['gear'],target:4,effort:3,budget:12},
 {id:'apple-picker',grade:4,name:'The Apple Picker',kind:'pulley',story:'Lift the five-kilogram apple basket to the loft. The crank can pull with only eighteen newtons. Route the rope around wheels attached to the basket so several rope sections share the load.',real:'Block-and-tackle pulleys share the load across supporting rope strands, as used in lifting rigs and sailboat tackle.',parts:['pulley','anchor','winch'],mass:5,effort:18,target:2.4,budget:15},
 {id:'jammed-safe',grade:4,name:'The Jammed Storehouse',kind:'screw',story:'The storehouse door is stuck. Position a screw jack and wedge beneath it. Crank the screw to drive the wedge, then lift the door clear of the latch.',real:'Threaded jacks and wedges turn a long, gentle input motion into a short lifting motion.',parts:['screw','wedge'],mass:20,effort:8,target:.6,budget:6},
 {id:'loft-engineer',grade:5,name:'Loft Loading Challenge',kind:'compound',story:'The small motor cannot lift this basket alone. Build a gear reduction into the rope drum, route a compound pulley and use the brake to park the load at the loft. Stay within the parts and energy budgets.',real:'Cranes combine motors, reduction gears, rope tackle and holding brakes to lift and safely park loads.',parts:['gear','pulley','anchor'],mass:5,effort:8,target:2.4,budget:18,energy:180},
 {id:'water-tower',grade:5,name:'Water Tower Repair',kind:'compound',story:'Raise the maintenance basket with the limited motor. Compare gear ratios and pulley layouts, then hold the basket at the service platform without overrunning the energy budget.',real:'Winches use gearing and brakes to control loads instead of relying on motor strength alone.',parts:['gear','pulley','anchor'],mass:6,effort:9,target:2.3,budget:18,energy:210},
];
export const clone=x=>JSON.parse(JSON.stringify(x));
export const gradeOf=x=>Math.max(0,Math.min(5,parseInt(x,10)||0));
export function missionForGrade(grade,index=0){return MISSIONS.filter(m=>m.grade===gradeOf(grade))[index%2];}
export function part(kind,x,y,extra={}){return {id:'',kind,x,y,angle:0,r:PARTS[kind]?.r||.25,length:PARTS[kind]?.length||1,friction:.08,pitch:.08,lbs:2,forceLbs:2,...extra};}
export function blueprint(job){const parts=[];if(job.kind==='gears'){parts.push(part('motor',1.5,3,{id:'motor',fixed:true}),part('fan',7.5,3,{id:'fan',fixed:true}));}
 if(job.kind==='compound'){parts.push(part('motor',1.5,3,{id:'motor',fixed:true,r:.5}),part('winch',8,3,{id:'winch',fixed:true,r:1}));}
 if(job.kind==='pulley')parts.push(part('winch',1.5,4.8,{id:'winch',fixed:true}));
 if(job.kind==='lever')parts.push(part('lever',5,1.1,{id:'beam',fixed:false,length:4,pivot:.65}));
 return {parts,rope:[],nextId:1,revision:0};}



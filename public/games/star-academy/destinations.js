// Original, age-scaled narration. NASA references are included with every destination.
const f=(text,ask,right,...wrong)=>({text,ask,right,wrong});
export const DESTINATIONS=[
 {id:'moon',name:'Moon Base',color:'#becbdf',icon:'☾',source:'https://science.nasa.gov/moon/facts/',facts:[
 f('The Moon shines by reflecting sunlight. It does not make its own light.','Where does the Moon get its light?','The Sun','Its own fire','City lights'),
 f('Round hollows called craters mark the Moon. Many formed when space rocks hit its surface.','What made many Moon craters?','Space rocks hitting the surface','Ocean waves','Tree roots'),
 f('The Moon has much weaker gravity than Earth. The same astronaut can jump higher on the Moon.','Why could our astronaut jump higher here?','Weaker gravity','Heavier boots','Stronger wind'),
 f('The Moon travels around Earth. As it moves, we see different amounts of its sunlit half. These changing shapes are called phases.','What causes the Moon’s changing phases?','Our changing view of its sunlit half','The Moon changing its shape','The Sun turning off'),
 f('Almost no air surrounds the Moon. There is no wind like Earth’s wind to quickly brush away an astronaut’s footprints.','Why can footprints last so long here?','There is no wind like Earth’s to erase them','The Moon has sticky rain','Astronauts paint the ground'),
 f('A lunar day and night are very long. Explorers must plan for huge temperature changes and bring their own air.','What must our explorers bring?','Air to breathe','An umbrella for rain','Seeds to breathe immediately') ]},
 {id:'sun',name:'Solar Observatory',color:'#ffc359',icon:'☀',source:'https://science.nasa.gov/sun/facts/',facts:[
 f('The Sun is a star. It gives Earth light and heat.','What is the Sun?','A star','A planet','A moon'),
 f('Earth and the other planets travel around the Sun. This trip around another object is an orbit.','What do the planets orbit?','The Sun','Our rocket','The Moon'),
 f('The Sun is made mostly of hydrogen and helium. It is not a solid ball of rock.','What is the Sun mostly made of?','Hydrogen and helium','Rock and soil','Liquid water'),
 f('Deep inside the Sun, hydrogen joins together in a process called fusion. Fusion releases the energy that makes the Sun shine.','What process powers the Sun?','Fusion','Burning wood','Ocean tides'),
 f('Sunlight takes about eight minutes to reach Earth. Our instruments are seeing light that has already traveled through space.','About how long does sunlight take to reach Earth?','Eight minutes','Eight seconds','Eight years'),
 f('Our spacecraft observes from a distance. Looking straight at the Sun can damage eyes, so real observers use special safe equipment.','How does our observatory study the Sun?','With special safe equipment','By staring at it','By touching it') ]},
 {id:'mars',name:'Mars Rover Camp',color:'#e68a63',icon:'◉',source:'https://science.nasa.gov/mars/facts/',facts:[
 f('Mars is called the Red Planet. Rusty iron minerals give its surface a reddish color.','Why does Mars look red?','Rusty iron minerals','Red flowers','A red ocean'),
 f('Robot rovers explore Mars. They photograph the ground and study rocks.','What do our rovers study?','Rocks and the ground','Fish in oceans','Trees in forests'),
 f('Mars has a thin atmosphere. People cannot breathe its air without life-support equipment.','What would a human explorer need?','Life-support equipment','Only a bicycle helmet','Only sunglasses'),
 f('Frozen water is found on Mars, including at its poles. Scientists also study signs that liquid water flowed there long ago.','What water clue are scientists studying?','Ice and signs of ancient flowing water','Modern rainy forests','An ocean full of whales'),
 f('Mars has two small moons called Phobos and Deimos. They are not round, ocean-covered worlds like Earth.','How many moons does Mars have?','Two','One','Eight'),
 f('Olympus Mons is an enormous volcano on Mars. Our rover team compares its landscape with volcanic landscapes on Earth.','What is Olympus Mons?','A volcano','A comet','A space station') ]},
 {id:'saturn',name:'Saturn Ring Patrol',color:'#e8cc92',icon:'◎',source:'https://science.nasa.gov/saturn/facts/',facts:[
 f('Saturn has bright rings. The rings contain countless pieces of ice and rock.','What are Saturn’s rings made of?','Ice and rock','One solid metal hoop','Clouds of butterflies'),
 f('Saturn is a gas giant. Our ship cannot land on a solid surface like Earth’s ground.','Why does our ship stay above Saturn?','It has no solid ground like Earth’s','Its grass is too tall','It has traffic lights'),
 f('Saturn is the sixth planet from the Sun. It orbits beyond Jupiter.','Which planet lies just inside Saturn’s orbit?','Jupiter','Earth','Mercury'),
 f('The rings are not one solid sheet. Many separate particles travel around Saturn along their own paths.','How do the ring particles move?','They orbit Saturn','They stand still','They all fall onto Earth'),
 f('Saturn’s moon Titan has a thick atmosphere. Lakes on Titan contain liquid methane instead of liquid water.','What fills Titan’s lakes?','Liquid methane','Chocolate milk','Liquid iron'),
 f('Saturn takes about twenty-nine Earth years to go around the Sun once. Its year is far longer than Earth’s.','Compared with Earth, Saturn’s year is…','Much longer','Much shorter','Exactly the same') ]},
 {id:'earth',name:'Earth Orbit',color:'#64b9ed',icon:'⊕',source:'https://science.nasa.gov/earth/facts/',facts:[
 f('Earth is our home planet. Its surface has large oceans of liquid water.','Which planet is our home?','Earth','Mars','Saturn'),
 f('Earth spins. The side facing the Sun has daytime, while the side facing away has nighttime.','Why does our home have day and night?','Earth spins','The Sun switches off','The Moon covers every town'),
 f('A complete spin takes about one day. Our observation window shows the surface slowly turning beneath us.','About how long is one Earth spin?','One day','One minute','One year'),
 f('Earth travels around the Sun. One complete orbit takes about one year.','What takes about one year?','Earth’s orbit around the Sun','One Earth spin','One ocean wave'),
 f('Earth’s axis is tilted. That tilt, as Earth orbits the Sun, gives places different amounts of sunlight through the seasons.','What causes Earth’s seasons?','Its tilted axis as it orbits','The Sun changing color','The Moon getting hotter'),
 f('Earth’s atmosphere surrounds the planet. It contains the oxygen people need to breathe and helps protect life.','What provides the oxygen in the air around Earth?','Earth’s atmosphere','Saturn’s rings','The vacuum of space') ]},
 {id:'comet',name:'Comet Crossing',color:'#85e7ef',icon:'☄',source:'https://science.nasa.gov/solar-system/comets/facts/',facts:[
 f('A comet contains ice, dust, and rocky material. Think of an icy traveler through space.','What does a comet contain?','Ice and dust','Only liquid fire','Green leaves'),
 f('A comet travels around the Sun. Some follow long paths that carry them far from it.','What does a comet orbit?','The Sun','Only our board','Every astronaut'),
 f('As a comet approaches the Sun, its ice releases gas. Gas and dust form a fuzzy cloud around its center.','What makes the fuzzy cloud near the Sun?','Released gas and dust','Smoke from a rocket engine','Water from rain clouds'),
 f('Sunlight and the solar wind push material away from the Sun. This forms the comet’s glowing tails.','Which way are the tails pushed?','Away from the Sun','Always toward Earth','Always toward the Sun'),
 f('The comet’s solid center is called its nucleus. The bright surrounding cloud is called the coma.','What is the solid center called?','The nucleus','The atmosphere of Earth','The launch pad'),
 f('The tail does not always trail behind the comet’s direction of travel. Its direction depends on the Sun.','What controls the tail’s general direction?','The Sun','The comet’s steering wheel','Our rocket’s headlights') ]},
 {id:'asteroid',name:'Asteroid Survey',color:'#b8a99b',icon:'⬡',source:'https://science.nasa.gov/solar-system/asteroids/facts/',facts:[
 f('An asteroid is a rocky object that travels through space around the Sun. It is smaller than a planet.','What is an asteroid?','A small rocky object orbiting the Sun','A cloud of rain','A star'),
 f('Many asteroids orbit between Mars and Jupiter. This region is called the main asteroid belt.','Where is the main asteroid belt?','Between Mars and Jupiter','Inside Earth’s ocean','Between Earth and the Moon'),
 f('Asteroids come in different sizes and shapes. Many are lumpy rather than perfectly round.','What shapes can asteroids have?','Lumpy, irregular shapes','Only perfect cubes','Only flat squares'),
 f('Real asteroids are usually very far apart. Our close-together training scene makes them easier to see.','What is different about the real belt?','Its rocks are usually far apart','Its rocks all touch','It is a solid wall'),
 f('Some asteroids contain metals as well as rock. Scientists use instruments to learn what they are made of.','What can some asteroids contain besides rock?','Metals','Forest soil and roots','Living coral'),
 f('Many asteroids are leftovers from the early solar system. Their materials help scientists investigate how planets formed.','Why do scientists study old asteroid material?','To investigate the early solar system','To predict tomorrow’s lunch','To make the Sun turn off') ]},
 {id:'blackhole',name:'Black-Hole Observatory',color:'#b29af3',icon:'◌',source:'https://science.nasa.gov/universe/black-holes/anatomy/',facts:[
 f('A black hole has extremely strong gravity. We observe it from far away in this simulation.','What is especially strong near a black hole?','Gravity','A sea breeze','Rain'),
 f('A boundary around a black hole is called its event horizon. Our observation ship stays outside it.','Where does our observation ship stay?','Outside the event horizon','Inside the black hole','On its solid ground'),
 f('Once something passes inside the event horizon, it cannot escape outward. Even light cannot escape from inside.','Can light escape from inside the event horizon?','No','Yes, if it is blue','Yes, every morning'),
 f('Hot material outside a black hole can glow. That glowing material is not light escaping from inside the black hole.','Where can the glowing material be?','Outside the black hole','Inside a wooden shell','Inside Earth’s clouds'),
 f('A black hole is not a tunnel that scientists can use to visit another place. Our board’s travel effects are pretend.','Is our black-hole travel effect a real transport method?','No, it is pretend','Yes, a public bus route','Yes, a safe doorway'),
 f('Astronomers study light from nearby hot material and the motions of nearby objects to learn about black holes.','What can help scientists study a black hole?','Nearby light and object motions','Listening for its singing','Measuring its tree rings') ]},
 {id:'microgravity',name:'Floating Lab',color:'#7fe2c3',icon:'◇',source:'https://www.nasa.gov/learning-resources/for-kids-and-students/what-is-microgravity-grades-5-8/',facts:[
 f('Astronauts and loose objects float together inside an orbiting space station. This is called microgravity.','What do loose objects do inside the orbiting station?','Float','Fall onto a grassy field','Turn into rocks'),
 f('Gravity still acts at the space station. Floating does not mean gravity has disappeared.','Is there still gravity at the station?','Yes','No','Only on Tuesdays'),
 f('The station, astronauts, and loose objects are falling around Earth together. Their shared free fall makes them appear weightless.','Why do astronauts appear weightless?','They fall around Earth with the station','They switch gravity off','Their suits blow them upward'),
 f('Orbiting objects also move sideways very fast. As they fall, Earth curves away beneath their path.','What motion helps the station keep orbiting?','Fast sideways motion','Standing still above one tree','Sinking into the ocean'),
 f('Astronauts secure tools and food so they do not drift away. Our lab uses straps for the same reason.','Why do we strap down loose tools?','To stop them drifting away','To make them hotter','To turn them into magnets'),
 f('Antigravity is a familiar idea in fiction. This lab demonstrates real microgravity through free fall, not a machine that cancels gravity.','What does our lab demonstrate?','Free fall and microgravity','A machine that removes gravity','A planet with no mass') ]},
 {id:'nebula',name:'Stellar Nursery',color:'#d795e3',icon:'✦',source:'https://spaceplace.nasa.gov/nebula/en/',facts:[
 f('A nebula is a huge cloud of gas and dust in space. Our window looks across one of these clouds.','What is a nebula?','A cloud of gas and dust','A solid planet','A rocket engine'),
 f('Some nebulae are places where new stars form. We call these places stellar nurseries.','What can form in a stellar nursery?','Stars','Earth’s ocean waves','Finished rocket ships'),
 f('Gravity can pull parts of a cloud closer together. A shrinking clump becomes denser.','What pulls parts of the cloud together?','Gravity','Tree roots','An ocean tide on a beach'),
 f('Light from nearby stars can make gas glow. Dust can also block light and create dark shapes.','Why can dust look dark?','It blocks light','It is a hole in the picture','It turns off all stars'),
 f('A growing young star can have a disk of material around it. Planets may form from material in such a disk.','What may form from material around a young star?','Planets','Plastic cups','Road signs'),
 f('Not every nebula is a nursery. Some clouds come from material released by aging or dying stars.','Do all nebulae make new stars?','No, some come from aging stars','Yes, every cloud is identical','No nebula contains gas') ]},
];
export const destination=id=>DESTINATIONS.find(d=>d.id===id)||DESTINATIONS[0];
export function mission(id,grade=0,seed=0){
 const d=destination(id),g=Math.min(5,Math.max(0,Number(grade)||0)),facts=d.facts.slice(0,g+1),stops=[];
 for(let i=0;i<facts.length;i+=2){const text=(g>=3?(i===0?'Our exploration crew arrives at '+d.name+'. ':'We turn our instruments toward the next discovery. '):'')+facts.slice(i,i+2).map(f=>f.text).join(' ');stops.push({title:['Arrival window','Science scan','Mission discovery'][i/2],text});}
 const count=g<2?1:g<4?2:3,indices=Array.from({length:count},(_,i)=>Math.floor((i+1)*facts.length/count)-1);
 const questions=indices.map((n,i)=>{const f=facts[n],choices=[f.right,...f.wrong].slice(0,g===0?2:3),shift=(seed+i)%choices.length;return {ask:f.ask,choices:choices.slice(shift).concat(choices.slice(0,shift)),correct:(choices.length-shift)%choices.length};});
 return {id:d.id,name:d.name,card:d.facts[0].text,stops,questions,source:d.source};
}

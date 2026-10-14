// Star Academy: a solar-system explorer. Fly your ship around the real solar system (planets orbit the Sun,
// an asteroid belt sits between Mars and Jupiter, the Sun burns if you get too close). Land on any planet or
// the Moon and walk around: each world has its real gravity (huge jumps on the Moon!), its own hazards and
// real things to scan. Missions teach the level: catch day/night things on a spinning Earth, visit planets
// in order, find the planet from a clue, aim the Moon to make a phase, launch a satellite into orbit,
// find a lost hiker with 3 GPS satellites (triangulation), fly through the warp gate with the right answer.
// Levels (must match app/Games/StarAcademy.php):
// 1 Day & Night Sky · 2 Our Sun Is a Star · 3 Planets in Order · 4 Planet Facts · 5 Spin & Orbit
// 6 Moon Phases · 7 Gravity & Orbits · 8 How Satellites Help Us · 9 Missions & Light-Years · 10 Space Scientist
import { startGame, rand, pick, shuffle, clamp, emoji, label, roundRect, Sfx, Store } from '../_play/play.js';
import { keypad } from '../_play/widgets.js';

// ---------------------------------------------------------------- the solar system (distances squished to fit, order and looks are real)
const BODIES = [
  { n: 'Mercury', r: 14, orbit: 250, c: '#a59d97', g: 0.38, w: 0.16, sky: '#000', ground: '#8d8580', haz: 'flare', order: 1, type: 'rocky', year: '88 days',
    pois: [['🕳️', 'Craters everywhere! Mercury has almost no air, so space rocks hit the ground.'], ['🌡️', 'Days here are about 800°F and nights fall to about −290°F. No air blanket keeps the heat in.'], ['☀️', 'The Sun looks about 3 times bigger from Mercury than from Earth.'], ['⏱️', 'A year on Mercury is only 88 Earth days. It is the fastest planet around the Sun.']] },
  { n: 'Venus', r: 22, orbit: 360, c: '#e8c16e', g: 0.9, w: 0.12, sky: '#d9a441', ground: '#a8743a', haz: 'acid', order: 2, type: 'rocky', year: '225 days',
    pois: [['🌋', 'Venus has more volcanoes than any other planet.'], ['☁️', 'Thick clouds trap heat like a blanket, so Venus is the HOTTEST planet, even hotter than Mercury.'], ['🔄', 'Venus spins backward. Here the Sun rises in the west!'], ['🌟', 'From Earth, Venus is the brightest “star” in the evening sky.']] },
  { n: 'Earth', r: 24, orbit: 490, c: '#3b8ee0', g: 1, w: 0.09, sky: '#7cc6ff', ground: '#5cb85c', haz: null, order: 3, type: 'rocky', year: '365 days', moon: true,
    pois: [['🌊', 'About 70% of Earth is covered by water. It is the only planet we know with oceans of liquid water.'], ['🌳', 'Plants make the oxygen we breathe.'], ['📡', 'Satellite dishes talk to satellites for TV, weather and GPS.'], ['🏙️', 'About 8 billion people live on Earth.']] },
  { n: 'Mars', r: 17, orbit: 620, c: '#d0603a', g: 0.38, w: 0.07, sky: '#e9a66b', ground: '#b5532e', haz: 'dust', order: 4, type: 'rocky', year: '687 days (about 2 Earth years)',
    pois: [['🤖', 'Robot rovers like Perseverance drive on Mars, taking pictures and testing rocks.'], ['🌋', 'Olympus Mons on Mars is the tallest volcano in the whole solar system.'], ['🔴', 'Mars is red because its dirt has rust in it.'], ['❄️', 'Mars has ice at its north and south poles.']] },
  { n: 'Jupiter', r: 52, orbit: 860, c: '#d9a77c', g: 2.4, w: 0.04, sky: '#c98f5c', ground: '#efe2c9', haz: 'lightning', order: 5, type: 'gas giant', year: 'about 12 Earth years', gas: true,
    pois: [['🌀', 'The Great Red Spot is a storm bigger than the whole Earth!'], ['⚡', 'Jupiter has giant lightning storms.'], ['🌑', 'Jupiter has dozens of moons. Ganymede is the biggest moon in the solar system.'], ['💪', 'Jupiter is the biggest planet. More than 1,000 Earths could fit inside.']] },
  { n: 'Saturn', r: 44, orbit: 1090, c: '#e3c98f', g: 1.07, w: 0.03, sky: '#e8d6a3', ground: '#dfe8f2', haz: 'ice', order: 6, type: 'gas giant', year: 'about 29 Earth years', gas: true, ring: true,
    pois: [['💍', 'Saturn’s rings are made of chunks of ice and rock, some as small as sand and some as big as houses.'], ['🛁', 'Saturn is so light for its size that it would float in a giant bathtub.'], ['🌕', 'Its moon Titan has lakes, but they are full of liquid methane, not water.']] },
  { n: 'Uranus', r: 32, orbit: 1300, c: '#9fe0e6', g: 0.9, w: 0.022, sky: '#a8e4ea', ground: '#dff6f8', haz: 'wind', order: 7, type: 'ice giant', year: 'about 84 Earth years', gas: true,
    pois: [['🔄', 'Uranus spins tipped over on its side, like a rolling ball.'], ['❄️', 'Uranus is an ice giant: very cold and icy.'], ['📅', 'One year on Uranus lasts 84 Earth years.']] },
  { n: 'Neptune', r: 31, orbit: 1500, c: '#4b6fe0', g: 1.14, w: 0.018, sky: '#3f62c9', ground: '#c9d6ff', haz: 'wind', order: 8, type: 'ice giant', year: 'about 165 Earth years', gas: true,
    pois: [['💨', 'Neptune has the fastest winds in the solar system, faster than a jet plane.'], ['🔵', 'Methane gas makes Neptune look deep blue.'], ['🥶', 'Neptune is the farthest planet from the Sun and one of the coldest.']] },
];
const MOON = { n: 'the Moon', r: 7, g: 0.17, sky: '#000', ground: '#bfc3c9', haz: 'crater', moonOf: 'Earth',
  pois: [['👣', 'Astronaut footprints from 1969 are still here. There is no wind to blow them away.'], ['🚩', 'Apollo 11 landed here in 1969. Neil Armstrong was the first person to walk on the Moon.'], ['🕳️', 'Craters are holes made by space rocks crashing into the Moon.'], ['🌍', 'From the Moon you can see Earth hanging in the sky!']] };
// New destinations: one more opens at every level (they stay open). Fly there and LAND to explore.
const EXTRAS = [
  { n: 'the Space Station', unlock: 1, e: '🛰️', parent: 'Earth', dist: 66, spd: 1.4, r: 9, g: 0.02, sky: '#02030a', ground: '#c9ced6', haz: null, station: true,
    pois: [['👩‍🚀', 'Astronauts live on the Space Station. It circles Earth about 16 times every day!'], ['🎈', 'Everything floats here because the station is always falling around Earth.'], ['🍽️', 'Astronauts strap in their food so it doesn’t float away.'], ['🌅', 'Astronauts see 16 sunrises a day.']] },
  { n: 'Halley’s Comet', unlock: 2, e: '☄️', orbit: 980, comet: true, w: 0.05, r: 10, g: 0.01, sky: '#02030a', ground: '#9aa3ad', haz: 'crater',
    pois: [['❄️', 'A comet is a dirty snowball of ice and dust.'], ['☀️', 'Near the Sun the ice melts, making a long glowing tail.'], ['🗓️', 'Halley’s Comet comes back about every 76 years.']] },
  { n: 'Ceres', unlock: 3, orbit: 752, w: 0.05, r: 8, c: '#8d8a86', g: 0.03, sky: '#000', ground: '#7f7b77', haz: 'crater', dwarf: true,
    pois: [['🌑', 'Ceres is a dwarf planet in the asteroid belt, between Mars and Jupiter.'], ['💧', 'Ceres may have salty water under its surface.'], ['✨', 'Bright white spots on Ceres are salt left behind.']] },
  { n: 'Europa', unlock: 4, parent: 'Jupiter', dist: 92, spd: 0.9, r: 8, c: '#d8cbb0', g: 0.13, sky: '#0a0a14', ground: '#e8e0cc', haz: 'ice',
    pois: [['❄️', 'Europa, a moon of Jupiter, is covered in ice.'], ['🌊', 'Under the ice is a giant salty ocean — bigger than all of Earth’s oceans!'], ['🔬', 'Scientists think Europa’s ocean is one of the best places to look for tiny life.']] },
  { n: 'Titan', unlock: 5, parent: 'Saturn', dist: 100, spd: 0.7, r: 10, c: '#d99a3a', g: 0.14, sky: '#c98a3a', ground: '#8a6a3a', haz: 'wind',
    pois: [['🌫️', 'Titan, Saturn’s biggest moon, has thick orange air.'], ['🏞️', 'Titan has lakes and rivers — of liquid methane, not water!'], ['🚁', 'NASA is sending a flying drone called Dragonfly to Titan.']] },
  { n: 'Phobos', unlock: 6, parent: 'Mars', dist: 40, spd: 2.2, r: 5, c: '#8a7a6a', g: 0.01, sky: '#000', ground: '#6b5d50', haz: 'crater',
    pois: [['🥔', 'Phobos is a tiny lumpy moon of Mars, shaped like a potato.'], ['⬇️', 'Phobos is slowly getting closer to Mars.'], ['🦘', 'Its gravity is so weak you could jump right off into space!']] },
  { n: 'Pluto', unlock: 7, orbit: 1610, w: 0.014, r: 9, c: '#d9c2a8', g: 0.06, sky: '#000', ground: '#e6d6c4', haz: 'ice', dwarf: true,
    pois: [['❤️', 'Pluto has a big heart-shaped plain of nitrogen ice.'], ['❄️', 'Pluto is a dwarf planet, colder than −370°F.'], ['📸', 'The New Horizons spacecraft flew past Pluto in 2015 and took close-up pictures.']] },
  { n: 'the Space Telescope', unlock: 8, e: '🔭', parent: 'Earth', dist: 120, spd: 0.25, r: 9, g: 0.02, sky: '#02030a', ground: '#c9a227', haz: null, station: true,
    pois: [['🔭', 'Space telescopes see far-away galaxies without Earth’s air making things blurry.'], ['🌌', 'They have spotted galaxies over 13 billion light-years away.'], ['🔥', 'Some telescopes see heat (infrared light) that our eyes can’t.']] },
  { n: 'Voyager 1', unlock: 9, e: '📡', orbit: 1760, w: 0.004, r: 8, g: 0.01, sky: '#02030a', ground: '#b8bec4', haz: null, station: true,
    pois: [['🚀', 'Voyager 1 launched in 1977 and is the farthest human-made object from Earth.'], ['💿', 'It carries a golden record with sounds and music from Earth.'], ['📶', 'Its radio messages take almost a whole day to reach us — even at the speed of light!']] },
  { n: 'Alpha Centauri', unlock: 10, e: '⭐', orbit: 1900, w: 0.002, r: 14, g: 1.2, sky: '#1a1030', ground: '#7a5a8a', haz: 'flare',
    pois: [['⭐', 'Alpha Centauri is the closest star system to our Sun: about 4 light-years away.'], ['👯', 'It has three stars that travel together.'], ['🌍', 'A planet called Proxima b goes around one of its stars.']] },
];
EXTRAS.forEach((e, i) => { e.ang = i * 2.1; });
const openExtras = () => EXTRAS.filter(e => e.unlock <= ((Store.data && Store.data.level) || 1));
const byName = n => BODIES.find(b => b.n === n) || EXTRAS.find(b => b.n === n);

// ---------------------------------------------------------------- what each level teaches, and real life
const REAL = {
  1: ['Earth spins all the time. When your side faces the Sun, it’s daytime. When it turns away, it’s night and time for bed!', 'Tonight, look out the window with a grown-up. Can you see the Moon or stars?'],
  2: ['The Sun is a star, so never look straight at it, even with sunglasses. Wear sunscreen on sunny days!', 'Plants need sunlight to grow. That’s why gardens are planted in sunny spots.'],
  3: ['Remember the order with: My Very Excellent Mother Just Served Us Nachos.', 'Some nights you can see Venus, Mars and Jupiter without a telescope. Ask a grown-up to look with you!'],
  4: ['Scientists study planet facts to plan real missions. NASA has sent rovers to Mars!'],
  5: ['Every birthday means Earth went all the way around the Sun one more time!', 'Seasons happen because Earth is tilted as it goes around the Sun.'],
  6: ['Tonight, look at the Moon: is it a crescent, a half or full? It changes every few days.', 'The Moon’s pull makes ocean tides. People at the beach watch the tide times.'],
  7: ['Gravity is why your ball falls back down and why you don’t float away.', 'Astronauts float in space because they are falling around Earth together with the space station.'],
  8: ['GPS satellites send signals to your phone. Your phone measures how far away 3 of them are, and the ONE spot where all 3 distances meet is where you are!', 'Pet collars, school buses and rescue helicopters use GPS to find where they are.', 'Weather satellites help forecasters warn families when big storms are coming.'],
  9: ['When you look at a star, you see light that left it years ago. You’re looking back in time!'],
  10: ['Astronauts and engineers use math every day to plan trips and keep people safe.'],
};
const GPS_SVG = '<svg viewBox="0 0 220 170" width="240"><rect width="220" height="170" rx="14" fill="#9bd67c"/><circle cx="40" cy="40" r="78" fill="none" stroke="#ff5a5a" stroke-width="4"/><circle cx="190" cy="50" r="86" fill="none" stroke="#2196f3" stroke-width="4"/><circle cx="120" cy="160" r="60" fill="none" stroke="#e0a000" stroke-width="4"/><text x="40" y="46" font-size="22" text-anchor="middle">🛰️</text><text x="190" y="56" font-size="22" text-anchor="middle">🛰️</text><text x="120" y="166" font-size="22" text-anchor="middle">🛰️</text><circle cx="108" cy="101" r="9" fill="#fff" stroke="#2b2350" stroke-width="3"/><text x="108" y="128" font-size="13" font-weight="800" text-anchor="middle" fill="#2b2350">YOU</text></svg>';
const LESSONS = {
  1: [{ title: 'Why we have day and night', text: 'Earth is a giant ball that SPINS. When your side faces the Sun, it is DAY. When your side turns away, it is NIGHT. One spin takes a whole day: 24 hours.', art: '🌍 ↻ ☀️' }, { title: 'Your mission', text: 'Walk around on Earth. In the DAY, catch day things like the sun, rainbows and butterflies. At NIGHT, catch night things like the Moon, stars and owls. Don’t catch the wrong ones!', art: '☀️🌈🦋 · 🌙⭐🦉' }],
  2: [{ title: 'The Sun is a star', text: 'The Sun is a STAR: a giant ball of super hot glowing gas. It gives Earth light and heat. Other stars are suns too, just very far away.', art: '☀️ = ⭐' }, { title: 'Careful!', text: 'Your ship can fly near the Sun to collect sunbeams for power, but don’t get too close or it will burn!', art: '🚀 ☀️ 🔥' }],
  3: [{ title: 'The eight planets', text: 'From the Sun out: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune. Remember: My Very Excellent Mother Just Served Us Nachos!', art: '☀️ ● ● 🌍 ● ⭕' }, { title: 'Your mission', text: 'Fly to the planets in order. When you reach the right one, tap 📡 THIS ONE! Wrong order costs a heart.', art: '🚀 ➜ 1 ➜ 2 ➜ 3' }],
  4: [{ title: 'Every planet is different', text: 'Jupiter is the biggest. Saturn has bright rings. Mars is red. Venus is the hottest. Neptune is farthest. Earth is the only one with life we know of. Land and scan to learn more!', art: '🔴 💍 🌀 🔵' }],
  5: [{ title: 'Spin and orbit', text: 'Earth does two things at once. It SPINS (one spin = one day) and it ORBITS, or travels around the Sun (one trip = one year). Planets far from the Sun have much longer years.', art: '↻ day · ⭕ year' }],
  6: [{ title: 'Moon phases', text: 'The Moon doesn’t make light. We see the side lit by the Sun. As the Moon goes around Earth, we see more or less of the lit side: new moon, crescent, quarter, gibbous, full.', art: '🌑🌒🌓🌔🌕🌖🌗🌘' }, { title: 'Your mission', text: 'Move the Moon around Earth until it shows the phase on the screen, then tap 📸 SNAP. Full moon: the Moon is on the far side of Earth from the Sun. New moon: between Earth and the Sun.', art: '☀️ ➜ 🌑 🌍 🌕' }],
  7: [{ title: 'Gravity', text: 'Gravity pulls things together. Big planets pull harder. On the Moon, gravity is weak, so you can jump 6 times higher!', art: '🌍 💪 · 🌙 🦘' }, { title: 'Orbits', text: 'Throw a ball sideways super fast and it falls AROUND Earth instead of to the ground: that is an orbit! Too slow, it falls. Too fast, it flies away.', art: '🛰️ ⭕ 🌍' }],
  8: [{ title: 'Satellites help us', text: 'Satellites are machines that orbit Earth. GPS satellites help maps find you. Weather satellites watch storms. TV satellites send shows around the world.', art: '🛰️ 📍 🌀 📺' },
    { title: 'How GPS finds you', text: 'Each GPS satellite sends out a signal that says what time it left. Your phone hears it and works out how far away that satellite is. One satellite tells you you’re somewhere on a big circle. Two circles cross in two spots. THREE circles cross in just ONE spot: that’s you! Grown-ups call this triangulation. Real phones also listen to a 4th satellite to double-check the time.', art: GPS_SVG }],
  9: [{ title: 'Light-years', text: 'A light-year is how far light travels in one year: about 6 trillion miles! If a star is 4 light-years away, its light takes 4 years to reach us.', art: '⭐ ··· 4 years ··· 🌍' }],
  10: [{ title: 'Space scientist', text: 'Scientists use math to plan missions: how long a trip takes, how much fuel to bring, how old you’d be on Mars. Fly through the warp gate with the right answer!', art: '🧮 🚀' }],
};

// ---------------------------------------------------------------- missions for each level
const PHASES = [[0, 'new moon', '🌑'], [0.125, 'waxing crescent', '🌒'], [0.25, 'first quarter', '🌓'], [0.375, 'waxing gibbous', '🌔'], [0.5, 'full moon', '🌕'], [0.625, 'waning gibbous', '🌖'], [0.75, 'last quarter', '🌗'], [0.875, 'waning crescent', '🌘']];
const CLUES = [
  ['the planet with bright RINGS', 'Saturn'], ['the RED planet', 'Mars'], ['the BIGGEST planet', 'Jupiter'], ['the HOTTEST planet', 'Venus'],
  ['the planet CLOSEST to the Sun', 'Mercury'], ['the planet FARTHEST from the Sun', 'Neptune'], ['the planet that spins on its SIDE', 'Uranus'], ['the planet where WE live', 'Earth'],
  ['the planet with the Great Red Spot storm', 'Jupiter'], ['the planet with the tallest volcano, Olympus Mons', 'Mars'],
];
const ORD = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
function mathGate(level) {
  const v = rand(0, level >= 10 ? 4 : 2);
  if (level <= 9 && v === 0) { const n = rand(2, 30); return { q: `A star is ${n} light-years away. How long does its light take to reach us?`, a: `${n} years`, w: [`${n} days`, `${n} minutes`], why: `A light-year is how far light goes in ONE year. ${n} light-years = ${n} years.` }; }
  if (level <= 9 && v === 1) { const n = rand(2, 5); return { q: `Sunlight takes about 8 minutes to reach Earth. How many minutes for ${n} trips?`, a: `${8 * n} minutes`, w: [], why: `8 × ${n} = ${8 * n} minutes. The Sun is about 93 million miles away!` }; }
  if (level <= 9) { const n = rand(2, 6); return { q: `Light takes about 1 second to get from the Moon to Earth. How long for ${n} trips?`, a: `${n} seconds`, w: [`${n} minutes`, `${n * 60} seconds`], why: `1 second each × ${n} = ${n} seconds.` }; }
  if (v === 0) { const age = rand(4, 11) * 2; return { q: `A Mars year is about 2 Earth years. You are ${age}. About how old in Mars years?`, a: `${age / 2}`, w: [`${age * 2}`, `${age + 2}`], why: `${age} ÷ 2 = ${age / 2}. Longer years mean fewer birthdays!` }; }
  if (v === 1) { const w = rand(4, 15) * 6; return { q: `On the Moon you weigh 1/6 of your Earth weight. ${w} lb on Earth = ? on the Moon`, a: `${w / 6} lb`, w: [`${w * 6} lb`, `${w - 6} lb`], why: `${w} ÷ 6 = ${w / 6}.` }; }
  if (v === 2) { const h = rand(1, 6) * 3; return { q: `The space station circles Earth every 1½ hours. How many trips in ${h} hours?`, a: `${h / 1.5}`, w: [`${h}`, `${h * 2}`], why: `${h} ÷ 1.5 = ${h / 1.5}.` }; }
  if (v === 3) { const n = rand(2, 4); return { q: `Jupiter takes about 12 Earth years to go around the Sun. How long for ${n} trips?`, a: `${12 * n} years`, w: [`${12 + n} years`, `${n} years`], why: `12 × ${n} = ${12 * n}.` }; }
  const d = rand(2, 5); return { q: `A rocket flies 1,000 miles each hour. How far in ${d} hours?`, a: `${(d * 1000).toLocaleString()} miles`, w: [`${(d * 100).toLocaleString()} miles`, `${(d + 1000).toLocaleString()} miles`], why: `1,000 × ${d} = ${(d * 1000).toLocaleString()}.` };
}
// GPS rescue: listen to 3 satellites, see each distance circle, find the ONE spot where all 3 cross
const GPS_JOBS = [
  { who: '🥾', name: 'hiker', text: '🥾 A hiker is lost in the mountains! Their phone has GPS. Tap each 🛰️ satellite to hear how far away the phone is, then tap the spot where ALL 3 circles cross.', send: '🚁 SEND HELP', found: '🚁 The rescue helicopter found the hiker!' },
  { who: '🐕', name: 'puppy', text: '🐕 A puppy ran off! Its collar has a GPS tag. Tap each 🛰️ satellite, then tap the spot where ALL 3 circles cross.', send: '🏃 GO GET IT', found: '🐕 The family found their puppy!' },
  { who: '🚌', name: 'school bus', text: '🚌 Where is the school bus? It has GPS. Tap each 🛰️ satellite, then tap the spot where ALL 3 circles cross.', send: '📍 IT’S HERE', found: '🚌 Now the app can show families when the bus is coming!' },
];
const GPS_JOB = () => { const j = pick(GPS_JOBS); return { kind: 'gps', job: j, text: j.text }; };

/** One mission at the given level: { kind, text, ... } */
function makeMission(level, edition) {
  switch (level) {
    case 1: return { kind: 'catch', text: '🌍 Land on EARTH and catch the right things: DAY things in the day, NIGHT things at night!', need: edition <= 0 ? 5 : 7 };
    case 2: return pick([{ kind: 'sunbeams', text: '☀️ Collect 5 sunbeams near the Sun for power. Don’t fly too close!', need: 5 }, { kind: 'deliver', target: 'Sun', text: '⭐ Fly to the closest STAR to Earth and tap 📡 THIS ONE!' }, { kind: 'deliver', target: 'Earth', text: '🏠 Fly to the planet where we live and tap 📡 THIS ONE!' }]);
    case 3: { const n = edition <= 1 ? 3 : 4, s = rand(0, 8 - n); return { kind: 'order', list: BODIES.slice(s, s + n).map(b => b.n), i: 0, text: s === 0 ? `🌍 Visit the first ${n} planets IN ORDER, starting closest to the Sun!` : `🌍 Start at the ${ORD[s]} planet, then visit the next ${n - 1} in order!` }; }
    case 4: { const [c, t] = pick(CLUES); return { kind: 'deliver', target: t, text: `🔭 Fly to ${c} and tap 📡 THIS ONE!` }; }
    case 5: return pick([{ kind: 'deliver', target: 'Mercury', text: '⏱️ Fly to the planet with the SHORTEST year and tap 📡 THIS ONE!' }, { kind: 'deliver', target: 'Neptune', text: '📅 Fly to the planet with the LONGEST year and tap 📡 THIS ONE!' }, { kind: 'follow', target: 'Earth', text: '🛸 ORBIT time: stay close to Earth for 8 seconds as it travels around the Sun!', need: 8 }, { kind: 'catch', text: '🌍 Land on Earth: watch it spin from day to night and catch the right things!', need: 6 }]);
    case 6: { const p = pick(edition >= 3 ? PHASES : PHASES.filter((_, i) => i % 2 === 0)); return { kind: 'phase', phase: p, text: `🌙 Move the Moon to make a <b>${p[1].toUpperCase()}</b> ${p[2]}, then tap 📸 SNAP!` }; }
    case 7: return pick([{ kind: 'launch', text: '🛰️ Launch the satellite into ORBIT: not too slow, not too fast!' }, { kind: 'jump', target: 'Mars', text: '🦘 Land on MARS and jump across the canyon. Gravity is weaker there!' }, { kind: 'jump', target: 'the Moon', text: '🦘 Land on the MOON (next to Earth) and make a giant jump!' }]);
    case 8: return pick([GPS_JOB(), GPS_JOB(), { kind: 'launch', sat: ['📍', 'GPS'], text: '📍 Launch a GPS satellite into orbit so maps know where people are!' }, { kind: 'launch', sat: ['🌀', 'weather'], text: '🌀 Launch a WEATHER satellite to watch for storms!' }, { kind: 'launch', sat: ['📺', 'TV'], text: '📺 Launch a TV satellite to send shows around the world!' }]);
    default: { const g = mathGate(level); return { kind: 'gates', g, text: `🌀 Warp computer: ${g.q}` }; }
  }
}

// ---------------------------------------------------------------- the game
function createStar(api) {
  let M = null;   // mission run
  let mode = 'space';
  const ship = { x: 0, y: -490, vx: 0, vy: 0, a: 0, inv: 0 };
  const cam = { x: 0, y: 0, z: 1 };
  let t = 0, near = null, autopilot = null, stars = [], rocks = [], beams = [], gates = [], respawn = { x: 0, y: -560 };
  let surf = null, phaseS = null, launchS = null, gpsS = null;
  for (let i = 0; i < 260; i++) stars.push({ x: rand(-2400, 2400), y: rand(-2400, 2400), s: Math.random() * 1.6 + 0.4, tw: Math.random() * 6 });
  BODIES.forEach((b, i) => { b.ang = (i * 1.7) % (Math.PI * 2); });
  function makeRocks() { rocks = []; for (let i = 0; i < 55; i++) { const a = Math.random() * Math.PI * 2, r = rand(715, 790); rocks.push({ a, r, s: rand(6, 14), w: 0.03 + Math.random() * 0.02 }); } }
  makeRocks();
  const pos = b => (b.parent ? (() => { const q = pos(byName(b.parent)); return { x: q.x + Math.cos(t * b.spd + b.ang) * b.dist, y: q.y + Math.sin(t * b.spd + b.ang) * b.dist }; })() : b.comet ? { x: Math.cos(b.ang) * b.orbit * 1.5 + 300, y: Math.sin(b.ang) * b.orbit * 0.55 } : b.n === 'Sun' ? { x: 0, y: 0 } : b === MOON ? (() => { const e = pos(byName('Earth')); return { x: e.x + Math.cos(t * 0.5) * 48, y: e.y + Math.sin(t * 0.5) * 48 }; })() : { x: Math.cos(b.ang) * b.orbit, y: Math.sin(b.ang) * b.orbit });

  // ------------------------------------------ mission flow
  function start({ level, boss, bossLevels, edition }) {
    const n = boss ? 5 : edition <= 1 ? 3 : edition <= 3 ? 4 : 5;
    M = { level, boss, bossLevels, edition, n, done: 0, cur: null, scans: 0 };
    mode = 'space'; surf = phaseS = launchS = null; gates = []; beams = [];
    ship.x = respawn.x = 0; ship.y = respawn.y = -560; ship.vx = ship.vy = 0; ship.inv = 0;
    const fresh = openExtras().filter(e => !visited()[e.n]);
    if (fresh.length && !boss) { const e = fresh[fresh.length - 1]; api.chime(`🆕 <b>New destination:</b> ${cap(e.n)}! It shows a ⭐ NEW sign on the map. Fly there and LAND to explore it.`, '👩‍🚀'); }
    else api.chime(`<b>Real life:</b> ${pick(REAL[level] || REAL[1])}`, '👩‍🚀', { speak: false });
    nextMission();
  }
  function nextMission() {
    if (M.done >= M.n) { api.finish({ win: true, title: '🚀 Missions complete!', text: `You finished ${M.n} missions and made ${M.scans} discoveries.` }); return; }
    const lvl = M.boss ? pick(M.bossLevels) : api.learn.work();
    M.cur = makeMission(lvl, M.edition); M.cur.lvl = lvl;
    api.goal(`${M.cur.text}`);
    api.progress(M.done / M.n, 'Missions');
    if (M.cur.kind === 'sunbeams') spawnBeams();
    if (M.cur.kind === 'gates') spawnGates();
    if (M.cur.kind === 'phase') enterPhase();
    if (M.cur.kind === 'launch') enterLaunch();
    if (M.cur.kind === 'gps') enterGps();
    setActions();
  }
  function missionDone(ok, info = {}) {
    const r = api.record({ level: M.cur.lvl, correct: ok, firstTry: ok, prompt: M.cur.text.replace(/<[^>]+>/g, ''), expected: info.expected || '', given: info.given || '', boss: M.boss });
    if (ok) {
      Sfx.correct(); api.confetti(); M.done++;
      api.toast(pick(['🌟 Mission complete!', '🚀 Great flying, astronaut!', '✅ Nailed it!']));
      if (r.levelUp) setTimeout(() => api.chime(`⬆️ <b>Level up!</b> ${api.levelInfo(api.state.level).name}`, '🏆'), 800);
      if (r.gradeBoss) setTimeout(() => api.chime('🎓 You mastered this grade! The <b>Grade Boss</b> mission is ready on the menu.', '🏆'), 800);
      setTimeout(() => { if (mode !== 'space') exitTo('space'); nextMission(); }, 900);
    }
    return r;
  }
  function wrong(text, info = {}) {
    missionDone(false, info);
    api.chime(text, '👩‍🚀');
    api.loseHeart();
  }

  // ------------------------------------------ actions (touch buttons) depend on where you are
  function setActions() {
    if (warp) { api.actions([{ key: 'check', label: '🌀 WARP!', big: true }]); return; }
    if (mode === 'surface') api.actions([{ key: 'scan', label: '🔍 Scan' }, { key: 'action', label: '⤴ Jump', big: true }]);
    else if (mode === 'phase') api.actions([{ key: 'left', label: '↺' }, { key: 'right', label: '↻' }, { key: 'snap', label: '📸 SNAP', big: true }]);
    else if (mode === 'launch') api.actions([{ key: 'action', label: '🚀 Hold to power up', big: true }]);
    else if (mode === 'gps') api.actions([{ key: 'action', label: M.cur.job.send, big: true }]);
    else {
      const list = [];
      if (near && near !== 'Sun') list.push({ key: 'land', label: '🛬 Land' });
      if (near && M && M.cur && (M.cur.kind === 'deliver' || M.cur.kind === 'order')) list.push({ key: 'this', label: '📡 THIS ONE!', big: true });
      api.actions(list);
    }
  }
  let lastNear = undefined;

  // ------------------------------------------ SPACE
  function updateSpace(dt) {
    BODIES.forEach(b => { b.ang += b.w * dt * 0.35; });
    EXTRAS.forEach(e => { if (e.w) e.ang += e.w * dt * 0.35; });
    rocks.forEach(r => { r.a += r.w * dt; });
    // flying: joystick / keys, or tap-to-fly autopilot
    let ix = api.input.x, iy = api.input.y;
    if (ix || iy) autopilot = null;
    else if (autopilot) { const dx = autopilot.x - ship.x, dy = autopilot.y - ship.y, d = Math.hypot(dx, dy); if (d < 30) autopilot = null; else { ix = dx / d; iy = dy / d; } }
    const max = 330, m = Math.hypot(ix, iy) || 1;
    ship.vx += ((ix / Math.max(1, m)) * max - ship.vx) * Math.min(1, dt * 3);
    ship.vy += ((iy / Math.max(1, m)) * max - ship.vy) * Math.min(1, dt * 3);
    ship.x = clamp(ship.x + ship.vx * dt, -1750, 1750); ship.y = clamp(ship.y + ship.vy * dt, -1750, 1750);
    if (Math.hypot(ship.vx, ship.vy) > 20) ship.a = Math.atan2(ship.vy, ship.vx);
    ship.inv = Math.max(0, ship.inv - dt);
    // hazards: the Sun's heat and the asteroid belt
    const sd = Math.hypot(ship.x, ship.y);
    if (sd < 150 && ship.inv <= 0) { hurt('🔥 Too close to the Sun! It is about 10,000°F on the surface.', 0, -1); }
    else if (sd < 230 && Math.random() < dt * 0.6) api.toast('🥵 Hot! The Sun is super hot. Back away a little!', 1200);
    if (ship.inv <= 0) for (const r of rocks) { const rx = Math.cos(r.a) * r.r, ry = Math.sin(r.a) * r.r; if (Math.hypot(rx - ship.x, ry - ship.y) < r.s + 12) { hurt('☄️ Asteroid hit! The asteroid belt sits between Mars and Jupiter.', rx, ry); break; } }
    // nearby planet?
    near = null;
    if (Math.hypot(ship.x, ship.y) < 175 + 40) near = 'Sun';
    for (const b of [...BODIES, MOON, ...openExtras()]) { const p = pos(b); if (Math.hypot(p.x - ship.x, p.y - ship.y) < b.r + 46) { near = b.n; respawn = { x: p.x, y: p.y - b.r - 60 }; if (!b.seen) { b.seen = 1; api.chime(`${b === MOON ? '🌙' : b.e || '🌍'} <b>${cap(b.n)}</b>: ${b.pois[0][1]}`, '👩‍🚀'); } } }
    if (near !== lastNear) { lastNear = near; setActions(); }
    // mission-specific
    const c = M && M.cur;
    if (c && c.kind === 'sunbeams') beams = beams.filter(bm => { if (Math.hypot(bm.x - ship.x, bm.y - ship.y) < 26) { c.got = (c.got || 0) + 1; Sfx.correct(); if (c.got >= c.need) missionDone(true, { expected: '5 sunbeams' }); else api.toast(`☀️ Sunbeam ${c.got}/${c.need}`, 900); return false; } return true; });
    if (c && c.kind === 'follow') { const p = pos(byName(c.target)); const d = Math.hypot(p.x - ship.x, p.y - ship.y); if (d < 120) { c.t = (c.t || 0) + dt; api.progress(c.t / c.need, 'Orbit'); if (c.t >= c.need) { missionDone(true, { expected: 'followed Earth' }); api.chime('Earth travels around the Sun like that all year long. One full trip = one year!', '👩‍🚀'); } } }
    if (c && c.kind === 'gates' && warp) { warp.pad.update(dt, api.input); if (api.input.pressed('check') && !warp.fly) warpCheck(); if (warp && warp.fly) warp.fly = Math.max(0.01, warp.fly - dt); return; }
    // keys
    if (api.input.pressed('land') || (api.input.pressed('action') && near && near !== 'Sun')) land(near);
    if (api.input.pressed('this') && near) deliver(near);
  }
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const visited = () => { const x = api.state.extra; x.visited = x.visited && typeof x.visited === 'object' && !Array.isArray(x.visited) ? x.visited : {}; return x.visited; };
  function hurt(msg, fx, fy) { ship.inv = 2; const d = Math.hypot(ship.x - fx, ship.y - fy) || 1; ship.vx = (ship.x - fx) / d * 400; ship.vy = (ship.y - fy) / d * 400; if (!api.loseHeart(msg)) api.chime(msg, '⚠️'); }
  function deliver(name) {
    const c = M.cur;
    if (c.kind === 'deliver') {
      if (name === c.target) { missionDone(true, { expected: c.target, given: name }); api.chime(`✅ <b>${cap(name)}</b>! ${name === 'Sun' ? 'The Sun is the closest star to Earth.' : byName(name).pois[0][1]}`, '👩‍🚀'); }
      else wrong(`That’s <b>${cap(name)}</b>: ${name === 'Sun' ? 'the Sun is a star, not a planet' : byName(name)?.pois[0][1] || ''}. Keep looking!`, { expected: c.target, given: name });
    } else if (c.kind === 'order') {
      const want = c.list[c.i];
      if (name === want) { c.i++; Sfx.correct(); api.toast(`✅ ${want}: planet #${byName(want).order}!`); api.record({ level: c.lvl, correct: true, prompt: `Planet #${byName(want).order}`, expected: want, given: name, boss: M.boss }); if (c.i >= c.list.length) { M.done++; api.confetti(); setTimeout(nextMission, 700); } else api.goal(`🌍 Next: planet #${byName(c.list[c.i]).order} from the Sun!`); }
      else { api.record({ level: c.lvl, correct: false, prompt: `Planet #${byName(want).order}`, expected: want, given: name, boss: M.boss }); api.chime(`That’s <b>${name}</b>, planet #${byName(name)?.order || '?'} from the Sun. You need #${byName(want).order}. Remember: My Very Excellent Mother Just Served Us Nachos!`, '👩‍🚀'); api.loseHeart(); }
    }
  }
  function spawnBeams() { beams = []; for (let i = 0; i < 8; i++) { const a = Math.random() * Math.PI * 2, r = rand(175, 240); beams.push({ x: Math.cos(a) * r, y: Math.sin(a) * r }); } }
  // Warp computer: type the answer on the number pad to power the warp drive (no answer choices).
  let warp = null;
  function spawnGates() {
    const g = M.cur.g, m = String(g.a).replace(/,/g, '').match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    warp = { g, ans: Number(m[1]), unit: m[2] || '', pad: keypad({ suffix: m[2] ? ' ' + m[2] : '', decimal: m[1].includes('.'), digits: 6 }), tries: 0, fly: 0 };
    warp.pad.api = api; gates = [];
    api.actions([{ key: 'check', label: '🌀 WARP!', big: true }]);
  }
  function warpCheck() {
    const v = warp.pad.value(); if (v == null) return;
    if (Math.abs(v - warp.ans) < 1e-9) { warp.fly = 1.2; Sfx.correct(); api.chime(`🌀 Warp! ${warp.g.why}`, '👩‍🚀'); const w = warp; setTimeout(() => { if (warp === w) { warp = null; missionDone(true, { expected: w.g.a, given: String(v) }); } }, 1200); return; }
    warp.tries++; Sfx.wrong();
    if (warp.tries >= 3) { const w = warp; warp = null; wrong(`The warp drive sputtered. ${w.g.why}`, { expected: w.g.a, given: String(v) }); setActions(); return; }
    api.chime(`⚠️ Not enough power! ${warp.tries === 2 ? warp.g.why.replace(/=\s*[^.]*\./, '= ?') : 'Check your math and try again.'}`, '👩‍🚀');
  }
  function checkGates() {
    for (const gt of gates) {
      if (gt.hit) continue;
      if (Math.hypot(gt.x - ship.x, gt.y - ship.y) < 44) {
        gt.hit = true;
        if (gt.ok) { missionDone(true, { expected: M.cur.g.a, given: gt.text }); api.chime(`🌀 Warp! ${M.cur.g.why}`, '👩‍🚀'); gates = []; }
        else { wrong(`💥 That gate was a dead end. ${M.cur.g.why}`, { expected: M.cur.g.a, given: gt.text }); }
      }
    }
  }
  function land(name) {
    if (!name || name === 'Sun') return;
    const b = name === 'the Moon' ? MOON : byName(name);
    if (b && b.unlock && !visited()[b.n]) { visited()[b.n] = Date.now(); Store.save(); api.chime(`🆕 <b>Discovery!</b> You explored ${cap(b.n)}. ${b.pois[1] ? b.pois[1][1] : ''}`, '👩‍🚀'); api.confetti(); }
    enterSurface(b);
  }

  // ------------------------------------------ SURFACE (side view, real gravity)
  function enterSurface(b) {
    mode = 'surface';
    const W = 2600, ground = [], gaps = [], c = M.cur;
    const isJump = c && c.kind === 'jump' && ((c.target === 'Mars' && b.n === 'Mars') || (c.target === 'the Moon' && b === MOON));
    const isCatch = c && c.kind === 'catch' && b.n === 'Earth';
    // terrain: flat runs with gaps (craters/canyons); gas giants: floating cloud platforms
    let x = 0;
    while (x < W) {
      const len = rand(260, 520);
      ground.push({ x0: x, x1: Math.min(W, x + len), y: b.gas ? rand(-18, 18) : 0 });
      x += len;
      const gap = isJump && x > 900 && !gaps.length ? (b === MOON ? 360 : 230) : b.gas ? rand(40, 70) : (Math.random() < 0.55 && !isCatch ? rand(60, 110) : 0);
      if (gap) gaps.push({ x0: x, x1: x + gap, big: isJump && !gaps.length }); x += gap;
    }
    const pois = b.pois.map((p, i) => ({ e: p[0], fact: p[1], x: 300 + i * ((W - 600) / Math.max(1, b.pois.length - 1)), scanned: false }));
    surf = { b, W, ground, gaps, pois, me: { x: 80, y: -40, vx: 0, vy: 0, on: false, face: 1 }, cam: 0, hz: [], items: [], dayT: 0, isJump, isCatch, beacon: W - 120, checkpoint: 80, cleared: false };
    api.chime(`🛬 Welcome to <b>${cap(b.n)}</b>! Gravity here is ${b.g === 1 ? 'the same as Earth' : b.g < 1 ? `only ${Math.round(b.g * 100)}% of Earth’s: you’ll jump ${b.g < 0.3 ? 'super' : 'extra'} high!` : `${b.g}× Earth’s: jumps are short and heavy!`}${b.gas ? ' This planet has no solid ground, so you’re on a floating cloud station.' : ''}`, '👩‍🚀');
    if (isCatch) api.goal('☀️ DAY: catch day things! 🌙 NIGHT: catch night things! Watch the sky change as Earth spins.');
    else if (!c || c.kind !== 'jump' || !isJump) api.goal(`🔍 Explore ${cap(b.n)}: scan the 4 discoveries, then walk to your ship 🚀 →`, { speak: false });
    setActions();
  }
  const groundAt = (s, x) => s.ground.find(g => x >= g.x0 && x <= g.x1);
  function updateSurface(dt) {
    const s = surf, me = s.me, b = s.b, g = 1500 * Math.max(0.2, b.g);
    me.vx += (api.input.x * 260 - me.vx) * Math.min(1, dt * 8);
    if (api.input.x) me.face = Math.sign(api.input.x);
    if ((api.input.pressed('action') || api.input.pressed('up')) && me.on) { me.vy = -560; me.on = false; Sfx.click(); }
    // winds push you on ice giants, dust devils on Mars
    if (b.haz === 'wind') me.vx += Math.sin(t * 0.7) * 90 * dt;
    me.vy += g * dt; me.x = clamp(me.x + me.vx * dt, 20, s.W - 20); me.y += me.vy * dt;
    const gr = groundAt(s, me.x);
    if (gr && me.y >= gr.y && me.y - me.vy * dt <= gr.y + 4) { me.y = gr.y; me.vy = 0; me.on = true; } else if (!gr || me.y < gr.y) me.on = me.on && gr && Math.abs(me.y - gr.y) < 1;
    if (me.y > 400) { // fell into a crater / off the cloud
      const gap = s.gaps.find(gp => me.x > gp.x0 - 30 && me.x < gp.x1 + 30);
      if (s.isJump && gap && gap.big && M.cur && M.cur.kind === 'jump') { missionDone(false, { expected: 'jump across' }); api.chime(`Almost! On ${cap(b.n)} gravity is ${Math.round(b.g * 100)}% of Earth’s. Take a running start and jump right at the edge!`, '👩‍🚀'); }
      me.x = s.checkpoint; me.y = -40; me.vy = 0;
      if (!api.loseHeart(b.gas ? 'You fell through the clouds!' : 'You fell into a crater!')) {}
    }
    // checkpoints at each beacon you pass
    if (me.on && gr && me.x > s.checkpoint + 500) s.checkpoint = me.x;
    // jump mission: made it over the big canyon?
    const big = s.gaps.find(gp => gp.big);
    if (s.isJump && big && me.x > big.x1 + 20 && me.on && !s.cleared) { s.cleared = true; missionDone(true, { expected: 'jump across' }); api.chime(`🦘 What a jump! Weaker gravity (${Math.round(b.g * 100)}% of Earth’s) means you go higher and farther. On Earth you could NOT make that jump!`, '👩‍🚀'); }
    // discoveries
    for (const p of s.pois) if (!p.scanned && Math.abs(p.x - me.x) < 60 && (api.input.pressed('scan') || api.input.pressed('down') || api.input.pressed('n1'))) { p.scanned = true; M.scans++; Sfx.correct(); api.chime(`${p.e} ${p.fact}`, '🔍'); }
    for (const p of s.pois) if (!p.scanned && Math.abs(p.x - me.x) < 60) p.hint = true; else p.hint = false;
    // hazards
    s.hzT = (s.hzT || 0) - dt;
    if (s.hzT <= 0 && b.haz) { s.hzT = rand(2, 4); if (['acid', 'lightning', 'flare'].includes(b.haz)) s.hz.push({ x: me.x + rand(-160, 260), t: 1.4, kind: b.haz }); if (b.haz === 'dust' || b.haz === 'ice') s.hz.push({ x: me.x + 420, vx: -140, t: 6, kind: b.haz === 'dust' ? 'devil' : 'chunk', y: 0 }); }
    s.hz = s.hz.filter(h => {
      h.t -= dt; if (h.vx) h.x += h.vx * dt;
      const strike = (h.kind === 'acid' || h.kind === 'lightning' || h.kind === 'flare') && h.t < 0.3 && h.t > 0.1;
      if ((strike || h.kind === 'devil' || h.kind === 'chunk') && Math.abs(h.x - me.x) < 34 && Math.abs(me.y - (h.y || 0)) < 60 && !s.hurtT) {
        s.hurtT = 1.5; me.vx = (me.x - h.x) * 8;
        api.loseHeart({ acid: 'Acid rain on Venus!', lightning: '⚡ Jupiter lightning!', flare: '☀️ Solar flare!', devil: '🌪️ A Martian dust devil!', chunk: '❄️ A ring chunk!' }[h.kind]);
      }
      return h.t > 0;
    });
    s.hurtT = Math.max(0, (s.hurtT || 0) - dt);
    // catch game: day/night sky on a spinning Earth
    if (s.isCatch && M.cur && M.cur.kind === 'catch') updateCatch(dt);
    // back to the ship
    if (me.x >= s.beacon - 20 && !(s.isCatch && M.cur && M.cur.kind === 'catch')) exitTo('space');
    s.cam += (clamp(me.x - api.W * 0.4, 0, s.W - api.W) - s.cam) * Math.min(1, dt * 5);
  }
  const DAY = [['☀️', 'the Sun'], ['🌈', 'a rainbow'], ['🦋', 'a butterfly'], ['🌻', 'a sunflower'], ['🐝', 'a bee']], NIGHT = [['🌙', 'the Moon'], ['⭐', 'a star'], ['🦉', 'an owl'], ['🦇', 'a bat'], ['🌌', 'the Milky Way']];
  function updateCatch(dt) {
    const s = surf, c = M.cur;
    s.dayT += dt; const isDay = Math.sin(s.dayT * 0.35) > 0;
    if (s.isDayWas !== isDay) { s.isDayWas = isDay; api.goal(isDay ? '☀️ It’s DAY on this side of Earth! Catch DAY things.' : '🌙 Earth turned away from the Sun: it’s NIGHT! Catch NIGHT things.'); }
    s.spawn = (s.spawn || 0) - dt;
    if (s.spawn <= 0) { s.spawn = M.edition <= 0 ? 1.8 : 1.3; const day = Math.random() < 0.5, it = pick(day ? DAY : NIGHT); s.items.push({ e: it[0], name: it[1], day, x: s.me.x + rand(-220, 220), y: -420, vy: M.edition <= 0 ? 70 : 100 }); }
    s.items = s.items.filter(it => {
      it.y += it.vy * dt;
      if (Math.abs(it.x - s.me.x) < 36 && Math.abs(it.y - (s.me.y - 30)) < 40) {
        const ok = it.day === isDay;
        api.record({ level: c.lvl, correct: ok, prompt: `${isDay ? 'Day' : 'Night'}: catch ${it.name}?`, expected: isDay ? 'day thing' : 'night thing', given: it.name, boss: M.boss });
        if (ok) { c.got = (c.got || 0) + 1; Sfx.correct(); api.toast(`${it.e} ${it.day ? 'Day' : 'Night'} thing! ${c.got}/${c.need}`, 900); if (c.got >= c.need) { M.done++; api.confetti(); api.chime('You caught them all! Remember: Earth SPINS. Facing the Sun = day. Facing away = night.', '👩‍🚀'); setTimeout(() => { exitTo('space'); nextMission(); }, 900); } }
        else { api.chime(`Oops! ${it.e} ${cap(it.name)} is a ${it.day ? 'DAY' : 'NIGHT'} thing, but it’s ${isDay ? 'day' : 'night'} now.`, '👩‍🚀'); api.loseHeart(); }
        return false;
      }
      return it.y < 120;
    });
  }
  function exitTo(m) {
    if (m === 'space' && surf) { const b = surf.b, p = pos(b); ship.x = p.x; ship.y = p.y - b.r - 70; ship.vx = ship.vy = 0; }
    mode = m; surf = null; phaseS = null; launchS = null; gpsS = null; lastNear = undefined;
    if (M && M.cur) api.goal(M.cur.text, { speak: false });
    setActions();
  }

  // ------------------------------------------ MOON PHASES (move the Moon around Earth)
  function enterPhase() { mode = 'phase'; phaseS = { a: rand(0, 6), tries: 0 }; setActions(); }
  const phaseOf = a => ((((a - Math.PI) / (Math.PI * 2)) % 1) + 1) % 1;
  function updatePhase(dt) {
    const p = phaseS;
    if (api.input.held('left') || api.input.x < -0.3) p.a += dt * 1.4;
    if (api.input.held('right') || api.input.x > 0.3) p.a -= dt * 1.4;
    if (api.input.pressed('snap') || api.input.pressed('action')) {
      const want = M.cur.phase[0], got = phaseOf(p.a), diff = Math.min(Math.abs(got - want), 1 - Math.abs(got - want));
      const name = PHASES.reduce((best, ph) => { const d = Math.min(Math.abs(got - ph[0]), 1 - Math.abs(got - ph[0])); return d < best[0] ? [d, ph] : best; }, [9, null])[1];
      if (diff < (M.edition >= 3 ? 0.05 : 0.07)) { missionDone(true, { expected: M.cur.phase[1], given: name[1] }); api.chime(`📸 ${M.cur.phase[2]} A perfect <b>${M.cur.phase[1]}</b>! ${want === 0.5 ? 'The Moon is on the far side of Earth, so we see its whole lit side.' : want === 0 ? 'The Moon is between Earth and the Sun, so its lit side faces away from us.' : 'We see part of the Moon’s sunny side.'}`, '👩‍🚀'); }
      else { wrong(`That made a ${name[2]} <b>${name[1]}</b>. ${M.cur.phase[0] === 0.5 ? 'For a FULL moon, put the Moon on the far side of Earth, away from the Sun.' : M.cur.phase[0] === 0 ? 'For a NEW moon, put the Moon between Earth and the Sun.' : 'Watch the little picture of the Moon as you move it.'}`, { expected: M.cur.phase[1], given: name[1] }); }
    }
  }
  /** Draw the Moon as seen from Earth: phase 0 new → 0.5 full (lit on the right while growing). */
  function drawPhase(ctx, x, y, r, ph) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#2b2f3a'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    const k = Math.cos(ph * Math.PI * 2); // 1 new, -1 full
    ctx.fillStyle = '#f4f1e6'; ctx.beginPath();
    const right = ph < 0.5;
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, !right);
    ctx.ellipse(0, 0, Math.abs(k) * r, r, 0, Math.PI / 2, -Math.PI / 2, (k > 0) === right ? true : false);
    ctx.fill(); ctx.restore();
  }

  // ------------------------------------------ SATELLITE LAUNCH (orbits)
  function enterLaunch() { mode = 'launch'; launchS = { power: 0, charging: false, flying: null, tries: 0 }; setActions(); }
  function updateLaunch(dt) {
    const L = launchS;
    if (!L.flying) {
      if (api.input.held('action')) { L.charging = true; L.power = Math.min(1, L.power + dt * 0.45); }
      else if (L.charging) { L.charging = false; fire(); }
      return;
    }
    // simple gravity toward Earth's center
    const f = L.flying, steps = 4;
    for (let i = 0; i < steps; i++) {
      const h = dt / steps, d = Math.hypot(f.x, f.y), acc = 140 * 140 * 110 / (d * d);
      f.vx -= f.x / d * acc * h; f.vy -= f.y / d * acc * h; f.x += f.vx * h; f.y += f.vy * h; f.trail.push([f.x, f.y]);
      if (f.trail.length > 600) f.trail.shift();
      if (d < 100) return endLaunch('fell');
      if (d > 520) return endLaunch('escaped');
    }
    f.angle += Math.hypot(f.vx, f.vy) * dt / Math.hypot(f.x, f.y);
    if (f.angle > Math.PI * 2.05) endLaunch('orbit');
  }
  function fire() { const v = 60 + launchS.power * 150; launchS.flying = { x: 0, y: -110, vx: v, vy: 0, trail: [], angle: 0, v }; Sfx.whoosh && Sfx.whoosh(); }
  function endLaunch(how) {
    const L = launchS; if (!L || !L.flying) return;
    const sat = M.cur.sat;
    if (how === 'orbit') { missionDone(true, { expected: 'orbit', given: 'orbit' }); api.chime(`🛰️ ORBIT! It keeps falling AROUND Earth instead of falling down. ${sat ? `Your ${sat[1]} satellite is working${sat[1] === 'GPS' ? ': it sends out signals, and phones listen to 3 or more GPS satellites at once to find where they are' : sat[1] === 'weather' ? ': forecasters can see storms coming' : ': shows can travel around the world'}!` : ''}`, '👩‍🚀'); }
    else { wrong(how === 'fell' ? '⬇️ Too slow! Gravity pulled it back down. Power up a little MORE.' : '🚀 Too fast! It escaped into space. Power up a little LESS.', { expected: 'orbit', given: how }); L.flying = null; L.power = 0; }
  }

  // ------------------------------------------ GPS RESCUE (how 3 satellites find you)
  const GCOL = ['#ff5a5a', '#2196f3', '#e0a000'];
  function gpsBox() { const W = api.W, H = api.H, hud = document.getElementById('pg-hud'), top = (hud ? hud.getBoundingClientRect().bottom : 96) + 8, bot = W < 900 && H > 500 ? 220 : 40; const h = Math.max(160, H - top - bot), w = Math.min(W - 24, h * 1.5); return { x: (W - w) / 2, y: top, w, h }; }
  function enterGps() {
    mode = 'gps';
    const sats = shuffle([[0.08, 0.1], [0.92, 0.12], [0.5, 0.95], [0.08, 0.88], [0.92, 0.9]]).slice(0, 3);
    if (sats.every(p => p[1] > 0.5) || sats.every(p => p[1] < 0.5)) sats[2] = [0.5, sats[0][1] > 0.5 ? 0.1 : 0.95];
    const scen = Array.from({ length: 14 }, () => [Math.random(), Math.random(), pick(['🌲', '🌲', '⛰️', '🌳', '🏞️'])]);
    gpsS = { sats: sats.map(([x, y]) => ({ x, y, r: 0, want: 0, on: false })), tx: 0.3 + Math.random() * 0.4, ty: 0.3 + Math.random() * 0.4, pin: null, scen, found: 0 };
    gpsS.sats.forEach(q => { q.want = Math.hypot((q.x - gpsS.tx) * 1.5, q.y - gpsS.ty); }); // distance in box units (box is 1.5 wide)
    setActions();
  }
  function ping(i) {
    const g = gpsS, q = g.sats[i]; if (!q || q.on) return;
    q.on = true; Sfx.click && Sfx.click();
    const n = g.sats.filter(z => z.on).length;
    const say = n === 1 ? '📡 The signal took a tiny bit of time to arrive, so we know how FAR away it is. It’s somewhere on this circle… but where? Listen to another satellite!'
      : n === 2 ? '📡 Two circles cross in TWO spots. Which one is it? We still can’t tell. Listen to one more!'
      : '🎯 THREE circles cross in just ONE spot. That’s where it is! Tap that spot.';
    api.chime(say, '👩‍🚀');
  }
  function updateGps(dt) {
    const g = gpsS;
    g.sats.forEach(q => { if (q.on) q.r = Math.min(q.want, q.r + dt * 0.9); });
    ['n1', 'n2', 'n3'].forEach((k, i) => { if (api.input.pressed(k)) ping(i); });
    if (g.pin) { const sp = dt * 0.35; g.pin.x = clamp(g.pin.x + (api.input.x) * sp / 1.5, 0, 1); g.pin.y = clamp(g.pin.y + api.input.y * sp, 0, 1); }
    else if (api.input.x || api.input.y) g.pin = { x: 0.5, y: 0.5 };
    if (g.found) { g.found -= dt; return; }
    if (api.input.pressed('action')) {
      const on = g.sats.filter(q => q.on).length;
      if (!on) { api.toast('📡 Tap a 🛰️ satellite first to hear its signal!', 1600); return; }
      if (!g.pin) { api.toast('👆 Tap the map where all the circles cross.', 1600); return; }
      const d = Math.hypot((g.pin.x - g.tx) * 1.5, g.pin.y - g.ty), J = M.cur.job;
      if (d < 0.09) {
        g.found = 3; g.pin = { x: g.tx, y: g.ty };
        missionDone(true, { expected: 'where the 3 circles cross', given: 'found' });
        api.chime(`${J.found} That’s how GPS works: measure how far away 3 satellites are, and the ONE spot where all 3 distances meet is the answer. Grown-ups call it <b>triangulation</b>.`, '👩‍🚀');
      } else wrong(on < 3 ? `Not there. With only ${on} circle${on > 1 ? 's' : ''} we can’t be sure. Listen to all 3 satellites, then pick the ONE spot where every circle crosses.` : 'Not there. Look for the ONE spot where all 3 circles cross each other.', { expected: 'where the 3 circles cross', given: on < 3 ? `guessed with ${on} satellites` : 'wrong spot' });
    }
  }
  function tapGps(x, y) {
    const g = gpsS, b = gpsBox();
    const hit = g.sats.findIndex(q => Math.hypot(b.x + q.x * b.w - x, b.y + q.y * b.h - y) < 34);
    if (hit >= 0) return ping(hit);
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) g.pin = { x: (x - b.x) / b.w, y: (y - b.y) / b.h };
  }
  function drawGps(ctx, W, H) {
    const g = gpsS, b = gpsBox(), u = b.h; // 1 distance unit = box height
    for (const s0 of stars.slice(0, 120)) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect((s0.x + 2400) % W, (s0.y + 2400) % H, 1.5, 1.5); }
    ctx.save(); roundRect(ctx, b.x, b.y, b.w, b.h, 18); ctx.fillStyle = '#8fcf72'; ctx.fill(); ctx.clip();
    ctx.fillStyle = '#7cbf5e'; ctx.beginPath(); ctx.ellipse(b.x + b.w * 0.7, b.y + b.h * 0.3, b.w * 0.25, b.h * 0.18, 0.3, 0, 7); ctx.fill();
    ctx.strokeStyle = '#d9b77a'; ctx.lineWidth = 5; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(b.x, b.y + b.h * 0.8); ctx.bezierCurveTo(b.x + b.w * 0.3, b.y + b.h * 0.4, b.x + b.w * 0.6, b.y + b.h * 0.9, b.x + b.w, b.y + b.h * 0.5); ctx.stroke(); ctx.setLineDash([]);
    g.scen.forEach(([x, y, e]) => emoji(ctx, e, b.x + x * b.w, b.y + y * b.h, Math.max(18, u * 0.08), { alpha: 0.85 }));
    g.sats.forEach((q, i) => { if (!q.on) return; const cx = b.x + q.x * b.w, cy = b.y + q.y * b.h; ctx.fillStyle = GCOL[i] + '18'; ctx.beginPath(); ctx.arc(cx, cy, q.r * u, 0, 7); ctx.fill(); ctx.strokeStyle = GCOL[i]; ctx.lineWidth = 4; ctx.stroke(); });
    ctx.restore();
    // satellites (tap them); unheard ones pulse
    g.sats.forEach((q, i) => {
      const cx = b.x + q.x * b.w, cy = b.y + q.y * b.h;
      ctx.fillStyle = q.on ? GCOL[i] : `rgba(255,255,255,${0.35 + 0.25 * Math.sin(t * 5)})`; ctx.beginPath(); ctx.arc(cx, cy, 26, 0, 7); ctx.fill();
      emoji(ctx, '🛰️', cx, cy, 28); label(ctx, String(i + 1), cx + 22, cy - 22, { size: 12 });
    });
    if (g.pin) { const px = b.x + g.pin.x * b.w, py = b.y + g.pin.y * b.h; if (g.found > 0) emoji(ctx, M.cur.job.who, px, py, 34); emoji(ctx, '📍', px, py - 20, 30); }
    const on = g.sats.filter(q => q.on).length;
    label(ctx, on < 3 ? `📡 Satellites heard: ${on} of 3` : '🎯 Tap where all 3 circles cross', W / 2, b.y + b.h + 16, { size: 14 });
  }

  // ------------------------------------------ drawing
  function draw(ctx, W, H, title) {
    t += 1 / 60;
    ctx.fillStyle = '#05070f'; ctx.fillRect(0, 0, W, H);
    if (mode === 'surface' && surf) return drawSurface(ctx, W, H);
    if (mode === 'phase' && phaseS) return drawPhaseScene(ctx, W, H);
    if (mode === 'launch' && launchS) return drawLaunch(ctx, W, H);
    if (mode === 'gps' && gpsS) return drawGps(ctx, W, H);
    // space camera follows the ship
    cam.z = clamp(Math.min(W, H) / 820, 0.38, 1.1);
    cam.x += (ship.x - cam.x) * 0.12; cam.y += (ship.y - cam.y) * 0.12;
    if (title) { cam.x = Math.cos(t * 0.05) * 300; cam.y = Math.sin(t * 0.05) * 300; cam.z = clamp(Math.min(W, H) / 1400, 0.25, 0.7); }
    const S = (x, y) => [W / 2 + (x - cam.x) * cam.z, H / 2 + (y - cam.y) * cam.z];
    for (const s of stars) { const [x, y] = [W / 2 + (s.x - cam.x * 0.3) * cam.z, H / 2 + (s.y - cam.y * 0.3) * cam.z]; if (x < 0 || y < 0 || x > W || y > H) continue; ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 2 + s.tw)})`; ctx.fillRect(x, y, s.s, s.s); }
    // orbits
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1;
    BODIES.forEach(b => { const [x, y] = S(0, 0); ctx.beginPath(); ctx.arc(x, y, b.orbit * cam.z, 0, 7); ctx.stroke(); });
    // sun
    const [sx, sy] = S(0, 0), sg = ctx.createRadialGradient(sx, sy, 10, sx, sy, 150 * cam.z);
    sg.addColorStop(0, '#fff6c8'); sg.addColorStop(0.35, '#ffcc33'); sg.addColorStop(1, 'rgba(255,140,0,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, 150 * cam.z, 0, 7); ctx.fill();
    label(ctx, 'Sun', sx, sy + 82 * cam.z + 12, { size: 13 });
    // asteroid belt
    ctx.fillStyle = '#8b8178';
    rocks.forEach(r => { const [x, y] = S(Math.cos(r.a) * r.r, Math.sin(r.a) * r.r); ctx.beginPath(); ctx.arc(x, y, r.s * cam.z, 0, 7); ctx.fill(); });
    // sunbeams
    beams.forEach(b => { const [x, y] = S(b.x, b.y); emoji(ctx, '✨', x, y, 26 * Math.max(0.7, cam.z)); });
    // planets
    for (const b of BODIES) {
      const p = pos(b), [x, y] = S(p.x, p.y), r = b.r * cam.z;
      if (b.ring) { ctx.strokeStyle = 'rgba(230,210,160,.8)'; ctx.lineWidth = Math.max(2, r * 0.18); ctx.beginPath(); ctx.ellipse(x, y, r * 1.9, r * 0.55, -0.35, 0, 7); ctx.stroke(); }
      const gr = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.2, x, y, r); gr.addColorStop(0, '#fff'); gr.addColorStop(0.25, b.c); gr.addColorStop(1, shade(b.c));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      if (b.n === 'Jupiter') { ctx.fillStyle = '#b5532e'; ctx.beginPath(); ctx.ellipse(x + r * 0.3, y + r * 0.3, r * 0.22, r * 0.13, 0, 0, 7); ctx.fill(); }
      if (b.n === 'Earth') { const [mx, my] = S(pos(MOON).x, pos(MOON).y); ctx.fillStyle = '#d9dbe0'; ctx.beginPath(); ctx.arc(mx, my, MOON.r * cam.z + 1, 0, 7); ctx.fill(); if (near === 'the Moon') label(ctx, 'Moon', mx, my - 14, { size: 11 }); }
      label(ctx, b.n, x, y + r + 14, { size: 12, bg: near === b.n ? 'rgba(255,140,40,.9)' : 'rgba(0,0,0,.5)' });
    }
    // new destinations (one more opens each level)
    for (const e of openExtras()) {
      const p = pos(e), [x, y] = S(p.x, p.y), r = Math.max(4, e.r * cam.z);
      if (e.comet) { const g = ctx.createLinearGradient(x, y, x + p.x * 0.12 * cam.z, y + p.y * 0.12 * cam.z); g.addColorStop(0, 'rgba(180,220,255,.8)'); g.addColorStop(1, 'rgba(180,220,255,0)'); ctx.strokeStyle = g; ctx.lineWidth = r * 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + p.x * 0.12 * cam.z, y + p.y * 0.12 * cam.z); ctx.stroke(); }
      if (e.e) emoji(ctx, e.e, x, y, Math.max(16, r * 2.4));
      else { ctx.fillStyle = e.c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
      label(ctx, visited()[e.n] ? e.n : `⭐ NEW · ${e.n}`, x, y + r + 14, { size: 11, bg: near === e.n ? 'rgba(255,140,40,.9)' : visited()[e.n] ? 'rgba(0,0,0,.5)' : 'rgba(139,108,255,.9)' });
    }
    // warp gates
    gates.forEach(g => { if (g.hit) return; const [x, y] = S(g.x, g.y); ctx.strokeStyle = '#8b6cff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, 40 * cam.z + 10, 0, 7); ctx.stroke(); ctx.strokeStyle = 'rgba(139,108,255,.35)'; ctx.lineWidth = 16; ctx.stroke(); label(ctx, g.text, x, y, { size: 14, bg: 'rgba(30,20,70,.85)' }); });
    if (title) return;
    // ship
    const [x, y] = S(ship.x, ship.y);
    ctx.save(); ctx.translate(x, y); ctx.rotate(ship.a + Math.PI / 2); if (ship.inv > 0 && Math.floor(t * 10) % 2) ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#e8edf8'; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(11, 12); ctx.lineTo(0, 7); ctx.lineTo(-11, 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = api.kid.color || '#ff6b4a'; ctx.beginPath(); ctx.arc(0, -3, 5, 0, 7); ctx.fill();
    if (Math.hypot(ship.vx, ship.vy) > 40) { ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.moveTo(-5, 10); ctx.lineTo(0, 22 + Math.random() * 8); ctx.lineTo(5, 10); ctx.fill(); }
    ctx.restore();
    if (autopilot) { const [ax, ay] = S(autopilot.x, autopilot.y); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ax, ay); ctx.stroke(); ctx.setLineDash([]); }
    drawRadar(ctx, W, H);
    if (warp) {
      const bw = Math.min(520, W - 24), bh = Math.min(H - 110, 420), bx = (W - bw) / 2, by = Math.max(60, (H - bh) / 2 + 10);
      ctx.fillStyle = 'rgba(10,16,34,.92)'; roundRect(ctx, bx, by, bw, bh, 20); ctx.fill(); ctx.strokeStyle = '#8b6cff'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#fffdf6'; roundRect(ctx, bx + 10, by + 52, bw - 20, bh - 62, 14); ctx.fill();
      label(ctx, '🌀 WARP COMPUTER', W / 2, by + 26, { size: 16, bg: '#8b6cff' });
      warp.box = { x: bx + 16, y: by + 58, w: bw - 32, h: bh - 74 };
      warp.pad.draw(ctx, warp.box);
      if (warp.fly) { ctx.fillStyle = `rgba(200,180,255,${warp.fly / 1.2})`; ctx.fillRect(0, 0, W, H); }
    }
  }
  function drawRadar(ctx, W, H) {
    const R = Math.min(70, W * 0.13), cx = W - R - 14, cy = H - R - (W < 900 ? 120 : 20), k = R / 1650;
    ctx.fillStyle = 'rgba(10,16,34,.75)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.stroke();
    ctx.fillStyle = '#ffcc33'; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 7); ctx.fill();
    BODIES.forEach(b => { const p = pos(b); ctx.fillStyle = b.c; ctx.beginPath(); ctx.arc(cx + p.x * k, cy + p.y * k, 2.5, 0, 7); ctx.fill(); });
    openExtras().forEach(e => { const p = pos(e); ctx.fillStyle = visited()[e.n] ? '#aaa' : '#b28cff'; ctx.beginPath(); ctx.arc(clamp(cx + p.x * k, cx - R, cx + R), clamp(cy + p.y * k, cy - R, cy + R), 2, 0, 7); ctx.fill(); });
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + ship.x * k, cy + ship.y * k, 2.5, 0, 7); ctx.fill();
  }
  function shade(hex) { const n = parseInt(hex.slice(1), 16), f = 0.55; return `rgb(${(n >> 16 & 255) * f | 0},${(n >> 8 & 255) * f | 0},${(n & 255) * f | 0})`; }
  function drawSurface(ctx, W, H) {
    const s = surf, b = s.b, base = H * 0.68, X = x => x - s.cam;
    let sky = b.sky;
    if (s.isCatch) { const day = Math.sin(s.dayT * 0.35) > 0; sky = day ? '#7cc6ff' : '#0b1736'; }
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    if (b.sky === '#000' || (s.isCatch && sky === '#0b1736')) for (let i = 0; i < 60; i++) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect((i * 97 - s.cam * 0.1) % W, (i * 53) % (H * 0.5), 2, 2); }
    if (b === MOON) emoji(ctx, '🌍', W * 0.8, H * 0.18, 60);
    if (s.isCatch) emoji(ctx, sky === '#0b1736' ? '🌙' : '☀️', W * 0.82, H * 0.14, 54);
    if (b.gas) { ctx.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse((i * 260 - s.cam * 0.5) % (W + 300), base + 90 + (i % 2) * 30, 200, 40, 0, 0, 7); ctx.fill(); } }
    // ground and gaps
    for (const g of s.ground) {
      const x0 = X(g.x0), x1 = X(g.x1); if (x1 < -10 || x0 > W + 10) continue;
      ctx.fillStyle = b.ground; if (b.gas) { roundRect(ctx, x0, base + g.y, x1 - x0, 26, 12); ctx.fill(); } else ctx.fillRect(x0, base + g.y, x1 - x0, H);
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x0, base + g.y, x1 - x0, 5);
    }
    s.gaps.filter(g => g.big).forEach(g => label(ctx, s.b === MOON ? 'Giant crater!' : 'Canyon!', X((g.x0 + g.x1) / 2), base - 40, { size: 14 }));
    // discoveries
    for (const p of s.pois) { const x = X(p.x); if (x < -50 || x > W + 50) continue; const gy = (groundAt(s, p.x)?.y || 0) + base; emoji(ctx, p.e, x, gy - 34, 46, { alpha: p.scanned ? 0.55 : 1 }); if (p.hint) label(ctx, '🔍 Scan me!', x, gy - 74, { size: 13, bg: 'rgba(255,140,40,.9)' }); if (p.scanned) label(ctx, '✓', x + 20, gy - 54, { size: 12, bg: '#2e9e5b' }); }
    // hazards
    for (const h of s.hz) {
      const x = X(h.x);
      if (h.kind === 'devil' || h.kind === 'chunk') emoji(ctx, h.kind === 'devil' ? '🌪️' : '❄️', x, base - 30, 48);
      else { const warn = h.t > 0.3; ctx.fillStyle = warn ? 'rgba(255,200,0,.25)' : h.kind === 'acid' ? 'rgba(160,220,60,.6)' : 'rgba(255,255,140,.8)'; ctx.fillRect(x - 30, 0, 60, base); emoji(ctx, warn ? '⚠️' : h.kind === 'lightning' ? '⚡' : h.kind === 'acid' ? '🧪' : '🔥', x, base - 60, 34); }
    }
    for (const it of s.items) emoji(ctx, it.e, X(it.x), base + it.y, 40);
    // ship to go home
    if (!s.isCatch) emoji(ctx, '🚀', X(s.beacon), base - 40, 64);
    // you (astronaut)
    const me = s.me, x = X(me.x), y = base + me.y;
    ctx.save(); ctx.translate(x, y - 30); if (s.hurtT && Math.floor(t * 10) % 2) ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#f2f4f8'; roundRect(ctx, -14, -6, 28, 34, 9); ctx.fill();
    ctx.fillStyle = '#dfe5ee'; ctx.beginPath(); ctx.arc(0, -16, 16, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(70,110,180,.85)'; ctx.beginPath(); ctx.arc(0, -16, 11, 0, 7); ctx.fill();
    ctx.restore(); emoji(ctx, api.kid.avatar || '🙂', x, y - 46, 14);
    label(ctx, `${cap(b.n)} · gravity ${b.g}× Earth · 🔍 ${s.pois.filter(p => p.scanned).length}/${s.pois.length}`, 12, H - (W < 900 ? 210 : 30), { size: 13, align: 'left' });
  }
  function drawPhaseScene(ctx, W, H) {
    const cx = W / 2, cy = H * 0.5, R = Math.min(W, H) * 0.28;
    for (const s of stars.slice(0, 120)) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect((s.x + 2400) % W, (s.y + 2400) % H, 1.5, 1.5); }
    // sunlight from the left
    const g = ctx.createLinearGradient(0, 0, W * 0.3, 0); g.addColorStop(0, 'rgba(255,210,80,.45)'); g.addColorStop(1, 'rgba(255,210,80,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W * 0.3, H);
    emoji(ctx, '☀️', 34, cy, 50); label(ctx, 'Sunlight →', 90, cy - 40, { size: 13 });
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.setLineDash([5, 7]); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    emoji(ctx, '🌍', cx, cy, R * 0.45);
    const a = phaseS.a, mx = cx + Math.cos(a) * R, my = cy - Math.sin(a) * R;
    // the moon from space: always lit on the Sun side (left)
    ctx.fillStyle = '#2b2f3a'; ctx.beginPath(); ctx.arc(mx, my, 20, 0, 7); ctx.fill();
    ctx.fillStyle = '#f4f1e6'; ctx.beginPath(); ctx.arc(mx, my, 20, Math.PI / 2, -Math.PI / 2); ctx.fill();
    // what people on Earth see
    const bx = W - 100, by = Math.max(170, H * 0.24);
    ctx.fillStyle = 'rgba(10,16,34,.85)'; roundRect(ctx, bx - 80, by - 70, 160, 170, 16); ctx.fill();
    label(ctx, 'From Earth:', bx, by - 50, { size: 13, bg: null });
    drawPhase(ctx, bx, by + 10, 42, phaseOf(a));
    label(ctx, `Goal: ${M.cur.phase[1]} ${M.cur.phase[2]}`, bx, by + 80, { size: 12, bg: null });
    label(ctx, '↺ ↻ move the Moon · 📸 SNAP', cx, H - (W < 900 ? 210 : 40), { size: 14 });
  }
  function drawLaunch(ctx, W, H) {
    const cx = W / 2, cy = H * 0.52, k = Math.min(W, H) / 1100, L = launchS;
    for (const s of stars.slice(0, 150)) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect((s.x + 2400) % W, (s.y + 2400) % H, 1.5, 1.5); }
    ctx.fillStyle = '#3b8ee0'; ctx.beginPath(); ctx.arc(cx, cy, 100 * k, 0, 7); ctx.fill();
    ctx.fillStyle = '#5cb85c'; ctx.beginPath(); ctx.arc(cx - 30 * k, cy - 20 * k, 40 * k, 0, 7); ctx.arc(cx + 40 * k, cy + 30 * k, 30 * k, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(120,220,140,.35)'; ctx.setLineDash([4, 8]); ctx.beginPath(); ctx.arc(cx, cy, 110 * k, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    emoji(ctx, '🏔️', cx, cy - 104 * k, 30);
    if (L.flying) {
      ctx.strokeStyle = 'rgba(255,200,80,.8)'; ctx.lineWidth = 2; ctx.beginPath(); L.flying.trail.forEach(([x, y], i) => (i ? ctx.lineTo(cx + x * k, cy + y * k) : ctx.moveTo(cx + x * k, cy + y * k))); ctx.stroke();
      emoji(ctx, M.cur.sat ? M.cur.sat[0] : '🛰️', cx + L.flying.x * k, cy + L.flying.y * k, 26);
    } else emoji(ctx, '🛰️', cx + 6, cy - 128 * k, 26);
    // power meter
    const mw = Math.min(300, W * 0.7), mx = cx - mw / 2, my = H - (W < 900 ? 200 : 60);
    ctx.fillStyle = 'rgba(255,255,255,.15)'; roundRect(ctx, mx, my, mw, 20, 10); ctx.fill();
    ctx.fillStyle = 'rgba(120,220,140,.4)'; ctx.fillRect(mx + mw * 0.56, my, mw * 0.18, 20);
    ctx.fillStyle = L.power < 0.56 ? '#ffb347' : L.power < 0.74 ? '#3dd68c' : '#ff5a5a'; roundRect(ctx, mx, my, mw * L.power, 20, 10); ctx.fill();
    label(ctx, 'too slow', mx + mw * 0.2, my - 14, { size: 11, bg: null }); label(ctx, 'ORBIT', mx + mw * 0.65, my - 14, { size: 11, bg: null }); label(ctx, 'too fast', mx + mw * 0.9, my - 14, { size: 11, bg: null });
  }

  return {
    start, draw,
    update(dt) {
      if (!M) return;
      if (mode === 'space') updateSpace(dt);
      else if (mode === 'surface') updateSurface(dt);
      else if (mode === 'phase') updatePhase(dt);
      else if (mode === 'launch') updateLaunch(dt);
      else if (mode === 'gps' && gpsS) updateGps(dt);
    },
    onTap(x, y) {
      if (mode === 'space' && warp) { warp.pad.down(x, y); return; }
      if (mode === 'space') { const z = cam.z; autopilot = { x: cam.x + (x - api.W / 2) / z, y: cam.y + (y - api.H / 2) / z }; }
      else if (mode === 'surface' && surf) { const me = surf.me; if (me.on) { me.vy = -560; me.on = false; } }
      else if (mode === 'gps' && gpsS) tapGps(x, y);
      else if (mode === 'phase' && phaseS) { const cx = api.W / 2, cy = api.H * 0.5; phaseS.a = Math.atan2(-(y - cy), x - cx); }
    },
    tapZone: () => mode === 'gps' || !!warp,
    stop() { warp = null; M = null; mode = 'space'; surf = phaseS = launchS = gpsS = null; api.progress(null); },
    checkpoint() { if (mode === 'space') { ship.x = respawn.x; ship.y = respawn.y; ship.vx = ship.vy = 0; ship.inv = 2; } else if (surf) { surf.me.x = surf.checkpoint; surf.me.y = -40; surf.me.vy = 0; } api.toast('🚩 Back at your checkpoint!'); },
    _warp: () => warp, _M: () => M, _mode: () => mode, _ship: ship, _pos: pos, _BODIES: BODIES, _surf: () => surf, _phase: () => phaseS, _launch: () => launchS, _gps: () => gpsS, // tests
  };
}

startGame({
  mascot: '👩‍🚀',
  story: (d, e) => (e >= 4 ? 'Mission control: fly the solar system, launch satellites, and solve space math at warp speed.' : 'Blast off with Captain Nova! Fly your ship around the Sun, land on planets, walk on the Moon and complete space missions.'),
  howTo: ['🕹️ Fly with the joystick, arrow keys, or tap where you want to go.', '🛬 Near a planet, tap LAND to walk around. Jump with ⤴ and scan discoveries with 🔍.', '📡 Mission planet? Tap THIS ONE! Wrong planet costs a heart.', '☄️ Watch out for the asteroid belt, the hot Sun and planet hazards. 🚩 You restart at your last planet.'],
  lessons: level => LESSONS[level] || [],
  realLife: REAL,
  create: createStar,
});

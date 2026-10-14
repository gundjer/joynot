// Star Academy: extra questions and number generators, so kids can't just memorize the answers.
import { pick, sample, shuffle, rand } from '../_joy/js/util.js';

// Kid-friendly planet facts (rounded). Moon counts are left out on purpose: scientists keep finding new ones.
const P = {
  Mercury: { type: 'rocky', year: '88 days', yearE: 0.24, temp: 'very hot in the day and freezing at night' },
  Venus: { type: 'rocky', year: '225 days', yearE: 0.62, temp: 'the hottest, about 870°F' },
  Earth: { type: 'rocky', year: '365 days', yearE: 1, temp: 'just right for water and life' },
  Mars: { type: 'rocky', year: '687 days (about 2 Earth years)', yearE: 2, temp: 'cold and dusty' },
  Jupiter: { type: 'gas giant', year: 'about 12 Earth years', yearE: 12, temp: 'cold on top, super hot deep inside' },
  Saturn: { type: 'gas giant', year: 'about 29 Earth years', yearE: 29, temp: 'very cold' },
  Uranus: { type: 'ice giant', year: 'about 84 Earth years', yearE: 84, temp: 'icy cold' },
  Neptune: { type: 'ice giant', year: 'about 165 Earth years', yearE: 165, temp: 'the coldest and windiest' },
};
const ORD = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
const mc = (q, a, wrong, why, key) => ({ kind: 'mc', key, prompt: q, ans: a, opts: shuffle([a, ...wrong]), expected: a, explain: why });

export function addStarBanks({ FACTS, SPIN_Q, ORBIT_Q, DAYNIGHT }) {
  DAYNIGHT.push(['🌠', 'shooting stars', 'night'], ['🦇', 'bats flying', 'night'], ['🌻', 'sunflowers facing the Sun', 'day'], ['🏖️', 'sunbathing at the beach', 'day'],
    ['🌃', 'city lights glowing', 'night'], ['🐓', 'a rooster crowing at sunrise', 'day'], ['🎆', 'a fireworks show', 'night'], ['🐝', 'bees visiting flowers', 'day'], ['🔦', 'needing a flashlight outside', 'night']);
  FACTS[2].push(
    ['How long does sunlight take to reach Earth?', 'About 8 minutes', ['About 8 seconds', 'About 8 days'], 'The Sun is about 93 million miles away. Even light, the fastest thing there is, needs 8 minutes!'],
    ['How many Earths could fit inside the Sun?', 'About one million', ['About ten', 'Exactly two'], 'The Sun is enormous. It holds almost all of the mass in our solar system.'],
    ['What keeps the planets going around the Sun?', 'The Sun’s gravity', ['Wind in space', 'Strings'], 'Gravity is a pull. The Sun’s huge pull keeps every planet on its path.'],
    ['Plants need the Sun to…', 'Make their own food', ['Sleep at night', 'Make noise'], 'Plants use sunlight to make food. Animals eat plants, so the Sun feeds us all!'],
    ['What is the closest star to Earth?', 'The Sun', ['The North Star', 'The Moon'], 'The Moon is not a star. It only reflects the Sun’s light.'],
    ['What color is the Sun really?', 'White, but our air makes it look yellow', ['Green', 'Blue'], 'Air scatters some colors of light, which is also why the sky looks blue.'],
  );
  SPIN_Q.push(
    ['How long does it take Earth to spin around one time?', 'About 24 hours (one day)', ['About one year', 'About one minute'], 'One spin = one day. One trip around the Sun = one year.'],
    ['When it is daytime in the United States, what is it on the other side of Earth?', 'Nighttime', ['Also daytime', 'Always morning'], 'Only half of Earth faces the Sun at a time.'],
    ['Why does the Sun seem to move across the sky?', 'Earth is spinning, not the Sun moving', ['The Sun walks', 'Clouds push it'], 'Like a merry-go-round: the world seems to slide by, but you are the one turning.'],
    ['What does ORBIT mean?', 'To travel around something in a loop', ['To spin in place', 'To fall straight down'], 'Earth orbits the Sun. The Moon orbits Earth.'],
    ['Why do we have seasons?', 'Earth is tilted, so each half gets more direct sunlight at different times', ['Earth gets closer to the Sun in summer', 'The Sun gets hotter in summer'], 'When your half tilts toward the Sun, sunlight hits more directly: summer!'],
  );
  ORBIT_Q.push(
    ['What would happen to a ball thrown on the Moon?', 'It would go higher and farther', ['It would float away forever', 'It would fall faster'], 'The Moon’s gravity is weaker, about one sixth of Earth’s.'],
    ['Why do astronauts float in the space station?', 'They are falling around Earth together with the station', ['There is no gravity at all in space', 'They wear magic suits'], 'The station and astronauts fall around Earth at the same speed, so they float inside it.'],
    ['Which has the strongest pull of gravity?', 'Jupiter', ['Earth', 'The Moon'], 'More mass = more gravity. Jupiter is the most massive planet.'],
    ['What keeps the Moon going around Earth?', 'Earth’s gravity', ['The Moon’s engine', 'Ocean waves'], 'Earth’s gravity bends the Moon’s path into a loop.'],
  );
  FACTS[8].push(
    ['About how many GPS satellites does your phone need to find where it is?', 'At least 4', ['Just 1', 'At least 100'], 'With 4 signals, the phone can work out its exact spot and the time.'],
    ['How do satellites get power?', 'Solar panels that turn sunlight into electricity', ['Long cables from Earth', 'Gasoline'], 'Those big wing-like panels are solar panels!'],
    ['What does a satellite-photo map app use?', 'Pictures taken from space by satellites', ['Drawings by hand', 'Guesses'], 'Satellites take pictures of Earth from far above.'],
    ['Why do satellites not fall down?', 'They move sideways so fast that they keep falling AROUND Earth', ['There is no gravity up there', 'They are tied to a tower'], 'That is what an orbit is: falling around, never hitting the ground.'],
  );
  FACTS[9].push(
    ['What is a light-year?', 'How far light travels in one year', ['How long a year feels', 'A very bright year'], 'It is a distance, not a time: about 6 trillion miles!'],
    ['Which mission landed the first people on the Moon?', 'Apollo 11', ['Voyager 1', 'Hubble'], 'In 1969, Neil Armstrong and Buzz Aldrin walked on the Moon.'],
    ['What do Mars rovers do?', 'Drive around Mars taking pictures and testing rocks', ['Carry people to Mars', 'Make Mars warmer'], 'Rovers like Curiosity and Perseverance are robot scientists.'],
  );
  FACTS[10].push(
    ['What is a galaxy?', 'A giant group of billions of stars', ['A single planet', 'A kind of comet'], 'We live in the Milky Way galaxy.'],
    ['What is a comet made of?', 'Ice, dust and rock', ['Fire', 'Metal only'], 'When a comet nears the Sun, the ice melts into a glowing tail.'],
  );
}

/** Number and table generators by level. Return null to fall back to the normal bank. */
export const STAR_GEN = {
  3: (PLANETS) => {
    const i = rand(0, 7), p = PLANETS[i];
    if (Math.random() < 0.5) return mc(`Which planet is ${ORD[i]} from the Sun?`, p.n, sample(PLANETS.filter(x => x !== p).map(x => x.n), 3), `Count: ${PLANETS.slice(0, i + 1).map(x => x.n).join(', ')}. My Very Excellent Mother Just Served Us Nachos!`, 'gpo' + i);
    if (i === 7) return null;
    const nx = PLANETS[i + 1];
    return mc(`Which planet comes right AFTER ${p.n}, going away from the Sun?`, nx.n, sample(PLANETS.filter(x => x !== nx && x !== p).map(x => x.n), 3), `${p.n} is ${ORD[i]}, so ${ORD[i + 1]} is ${nx.n}.`, 'gnx' + i);
  },
  4: (PLANETS) => {
    const v = rand(0, 2);
    if (v === 0) { const p = pick(PLANETS); const t = P[p.n].type; return mc(`What kind of planet is ${p.n}?`, t === 'rocky' ? 'A small rocky planet' : t === 'gas giant' ? 'A gas giant' : 'An ice giant', ['A small rocky planet', 'A gas giant', 'An ice giant'].filter(x => !x.toLowerCase().includes(t)), 'The 4 planets closest to the Sun are rocky. Jupiter and Saturn are gas giants. Uranus and Neptune are ice giants.', 'gty' + p.n); }
    if (v === 1) { const [a, b] = sample(PLANETS, 2); const big = a.s > b.s ? a : b, small = big === a ? b : a; return mc(`Which is BIGGER: ${a.n} or ${b.n}?`, big.n, [small.n], `${big.n} is bigger. Order by size: Jupiter, Saturn, Uranus, Neptune, Earth, Venus, Mars, Mercury.`, 'gbg' + a.n + b.n); }
    const p = pick(PLANETS); return mc(`How long is one year (one trip around the Sun) on ${p.n}?`, P[p.n].year, sample(Object.entries(P).filter(([k]) => k !== p.n).map(([, x]) => x.year), 2), 'Planets farther from the Sun have a longer path, so their year is longer.', 'gyr' + p.n);
  },
  5: () => {
    if (Math.random() < 0.5) { const n = rand(5, 11); return mc(`You are ${n} years old. How many times has Earth gone all the way around the Sun since you were born?`, String(n), [String(n * 12), String(n * 365)], 'One trip around the Sun = one year. So your age = how many orbits!', 'gor' + n); }
    const d = rand(2, 5); return mc(`Earth spins once every 24 hours. How many hours is ${d} days?`, String(d * 24), [String(d * 12), String(d + 24)], `${d} × 24 = ${d * 24} hours.`, 'gsp' + d);
  },
  7: () => {
    const w = rand(4, 15) * 6; return mc(`On the Moon you weigh about ONE SIXTH of your Earth weight. A kid weighs ${w} pounds on Earth. About how much on the Moon?`, `${w / 6} pounds`, [`${w * 6} pounds`, `${w - 6} pounds`], `${w} ÷ 6 = ${w / 6}. Less gravity = less weight, but you are still the same YOU (same mass).`, 'gmw' + w);
  },
  9: () => {
    const n = rand(2, 40); return mc(`A star is ${n} light-years away. How long does its light take to reach us?`, `${n} years`, [`${n} days`, `${n} minutes`], `A light-year is how far light goes in one year. ${n} light-years away = ${n} years of travel. The light you see left that star ${n} years ago!`, 'gly' + n);
  },
  10: () => {
    const v = rand(0, 2);
    if (v === 0) { const age = rand(4, 11) * 2; return mc(`A year on Mars is about 2 Earth years. If you are ${age} on Earth, about how old are you in Mars years?`, String(age / 2), [String(age * 2), String(age + 2)], `${age} ÷ 2 = ${age / 2}. A longer year means fewer birthdays!`, 'gma' + age); }
    if (v === 1) { const h = rand(1, 6) * 3; return mc(`The space station goes around Earth about every 90 minutes (1½ hours). How many trips in ${h} hours?`, String(h / 1.5), [String(h), String(h * 2)], `${h} ÷ 1.5 = ${h / 1.5} trips around Earth.`, 'giss' + h); }
    const n = rand(2, 4); return mc(`Jupiter takes about 12 Earth years to go around the Sun once. How many Earth years for ${n} trips?`, String(12 * n), [String(12 + n), String(12 / n)], `12 × ${n} = ${12 * n} years.`, 'gju' + n);
  },
};

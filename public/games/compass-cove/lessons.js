// Compass Cove — lessons. Real maps: what each part is FOR, then a hands-on picture to tap.
import { note, stack, pics, eq, frames } from '../_joy/js/lesson.js';
import { el } from '../_joy/js/util.js';
import { worldMap, PLACES, llText } from './world.js';

const grid = (mark = 'C3') => {
  const L = 'ABCDE', cells = [];
  for (let r = 1; r <= 4; r++) for (let c = 0; c < 5; c++) cells.push(`<rect x="${40 + c * 60}" y="${30 + (r - 1) * 50}" width="58" height="48" rx="6" fill="${L[c] + r === mark ? '#ffd23f' : '#a8e08a'}"/>`);
  return `<svg class="diagram" viewBox="0 0 360 240">${L.split('').map((l, c) => `<text x="${69 + c * 60}" y="22" text-anchor="middle" font-size="20" font-weight="700" fill="#7a5a1c">${l}</text>`).join('')}${[1, 2, 3, 4].map(r => `<text x="22" y="${60 + (r - 1) * 50}" text-anchor="middle" font-size="20" font-weight="700" fill="#7a5a1c">${r}</text>`).join('')}${cells.join('')}<text x="${69 + 2 * 60}" y="${60 + 2 * 50}" text-anchor="middle" font-size="26">⛲</text></svg>`;
};
const compassSvg = `<svg class="diagram" viewBox="0 0 240 240"><circle cx="120" cy="120" r="96" fill="#fff" stroke="#1c8fc9" stroke-width="6"/><path d="M120 34 L136 120 L120 206 L104 120 Z" fill="#e5484d"/><path d="M34 120 L120 104 L206 120 L120 136 Z" fill="#2b2350" opacity=".8"/>${[['N', 120, 26], ['E', 220, 128], ['S', 120, 232], ['W', 20, 128]].map(([t, x, y]) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="26" font-weight="800" fill="${t === 'N' ? '#e5484d' : '#2b2350'}">${t}</text>`).join('')}</svg>`;
const sunFrame = (x, y, label) => `<svg class="diagram" viewBox="0 0 320 170"><rect width="320" height="170" rx="14" fill="#dff4ff"/><path d="M0 140 H320 V170 H0Z" fill="#a8e08a"/><path d="M30 140 Q160 -10 290 140" fill="none" stroke="#ffc93c" stroke-width="3" stroke-dasharray="6 6"/><text x="${x}" y="${y}" font-size="34" text-anchor="middle">☀️</text><text x="20" y="162" font-size="16" font-weight="800" fill="#2b2350">EAST</text><text x="250" y="162" font-size="16" font-weight="800" fill="#2b2350">WEST</text><text x="160" y="26" font-size="15" text-anchor="middle" fill="#2b2350">${label}</text></svg>`;

// A tiny town map + key: tap the key to light up the symbols (the real "how to read a map" move)
function keyDemo(box, api) {
  const syms = [['✚', 'hospital', 'red', [[0, 3]]], ['⛲', 'park', '', [[1, 0], [3, 2]]], ['Ⓟ', 'parking lot', 'blue', [[2, 4]]], ['★', 'town hall', 'gold', [[1, 2]]]];
  const map = el('div', { class: 'cc-map lesson', style: { '--c': 5, '--r': 4 } });
  const cells = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
    const t = c === 0 && r !== 1 ? 'water' : r === 2 ? 'road' : 'grass';
    const cell = el('div', { class: 'cc-cell t-' + t });
    const s = syms.find(x => x[3].some(([rr, cc]) => rr === r && cc === c));
    if (s) { cell.innerHTML = `<span class="cc-mark">${s[2] ? `<span class="cc-sym ${s[2]}">${s[0]}</span>` : s[0]}</span>`; cell.dataset.ic = s[0]; }
    cells.push(cell); map.appendChild(cell);
  }
  const key = el('div', { class: 'cc-key' }, [el('b', { class: 'cc-key-t' }, '🔑 MAP KEY')]);
  syms.forEach(([ic, name, cls]) => {
    const row = el('button', { type: 'button', class: 'cc-key-row' }, [el('span', { class: 'cc-key-ic', html: cls ? `<span class="cc-sym ${cls}">${ic}</span>` : ic }), el('span', {}, name)]);
    row.addEventListener('click', () => { cells.forEach(cl => cl.classList.toggle('keyhl', cl.dataset.ic === ic)); api.voice.speak(name, { force: true }); });
    key.appendChild(row);
  });
  [['tw', 'water'], ['tr', 'road']].forEach(([c, n]) => key.appendChild(el('div', { class: 'cc-key-row' }, [el('span', { class: 'cc-key-sw ' + c }), el('span', {}, n)])));
  box.appendChild(el('div', { class: 'cc-wrap keyed lesson' }, [map, el('div', { class: 'cc-side' }, [key])]));
  box.appendChild(el('div', { class: 'note' }, '👆 Tap a row in the key to light it up on the map!'));
}
// World map you can tap: lines and famous places tell you their names
function worldDemo(glow) {
  return (box, api) => {
    const W = worldMap({ places: PLACES.filter(p => ['New York City', 'London', 'Sydney', 'Quito, Ecuador', 'Tokyo'].includes(p[1])), glow,
      onPlace: (p, n) => { n.classList.add('pinged'); setTimeout(() => n.classList.remove('pinged'), 700); api.voice.speak(`${p[1]}. About ${llText(p)}.`, { force: true }); },
      onLine: k => { if (k === 'eq') api.voice.speak('The Equator. Zero degrees latitude.', { force: true }); else if (k === 'pm') api.voice.speak('The Prime Meridian. Zero degrees longitude.', { force: true }); } });
    box.appendChild(el('div', { class: 'cc-world-wrap lesson' }, [W.svg]));
    box.appendChild(el('div', { class: 'note' }, '👆 Tap a place or a colored line!'));
  };
}

export const LESSONS = {
  1: [
    { title: 'What is a map?', text: 'A MAP is a picture of a place as if you were a bird looking down from the sky. Delivery drivers, firefighters, pilots and families on a trip all use maps to find their way.', art: pics([['🐦', 'bird’s-eye view'], ['🗺️', 'map'], ['🚒', 'firefighters use them']]) },
    { title: 'Up, down, left, right', text: 'Help Polly the parrot fly around Cove Town! Tap ⬆️ to go up, ⬇️ down, ⬅️ left and ➡️ right. Count each square as she flies.', art: pics([['⬆️', 'up'], ['⬇️', 'down'], ['⬅️', 'left'], ['➡️', 'right']]) },
    { title: 'Land here', text: '“Fly 3 squares right” means tap ➡️ three times: one, two, three! Then tap 📍 Land here.', art: pics([['🦜'], ['➡️', '1'], ['➡️', '2'], ['➡️', '3'], ['📍', 'land']]) },
  ],
  2: [
    { title: 'Why North, South, East and West?', text: '“Left” and “right” change when you turn around, so people can get mixed up. North, South, East and West NEVER change. That way everyone in the world can give the same directions.', art: pics([['🙋', 'my left?'], ['🔄', 'or yours?'], ['🧭', 'North is always North!']]) },
    { title: 'The Sun shows the way', text: 'The Sun comes up in the EAST every morning and goes down in the WEST every evening. Long ago, people found their way by watching the Sun and stars.', art: frames([sunFrame(40, 120, 'Morning: the Sun rises in the EAST'), sunFrame(160, 50, 'Noon: high in the sky'), sunFrame(280, 120, 'Evening: the Sun sets in the WEST')], 1800) },
    { title: 'The compass', text: 'A COMPASS has a tiny magnet for a needle. Earth is like a giant magnet, so the needle always points NORTH. On almost every map, North is at the top.', art: compassSvg },
    { title: 'Never Eat Soggy Waffles', text: 'Go around the compass clockwise: North, East, South, West. Never Eat Soggy Waffles! Hikers, ship captains, pilots and the map app on a phone all use these words.', art: pics([['⬆️', 'North'], ['➡️', 'East'], ['⬇️', 'South'], ['⬅️', 'West']]) },
  ],
  3: [
    { title: 'What is a map key?', text: 'Maps are small, so they use SYMBOLS (little pictures and shapes) instead of words. The MAP KEY, also called a LEGEND, tells you what every symbol means. Without the key, ★ could mean anything!', art: pics([['✚', 'hospital'], ['Ⓟ', 'parking'], ['★', 'town hall'], ['▲', 'mountain']]) },
    { title: 'Colors mean things too', text: 'On real maps, BLUE is water, GREEN is parks and fields, and lines are roads. When you visit a zoo, a mall or a national park, look for the key on the map. Try it here!', art: keyDemo },
    { title: 'How to use a key', text: 'Step 1: find the word in the key (like “hospital”). Step 2: look at its symbol (✚). Step 3: find that symbol on the map. That’s how you read any map in the world!', art: note('word ➜ symbol ➜ find it on the map') },
  ],
  4: [
    { title: 'Directions with two steps', text: 'Real directions often have steps: “Go 2 blocks East, then 1 block North.” A phone map talks just like this. Do the steps IN ORDER, counting each square.', art: pics([['➡️', '1'], ['➡️', '2'], ['⬆️', '1'], ['📍']]) },
  ],
  5: [
    { title: 'Why maps have grids', text: 'A big map has hundreds of places. A GRID splits it into squares so anyone can find a spot fast. Old city maps had a list: “Library ... C3”. Stadiums do this too: Section D, Seat 3!', art: pics([['🗺️', 'city map'], ['🏟️', 'stadium seats'], ['🅿️', 'parking garage']]) },
    { title: 'Reading a grid square', text: 'Letters go ACROSS the top. Numbers go DOWN the side. To find C3, put one finger on C and slide down to row 3. Where your fingers meet is C3.', art: grid('C3') },
    { title: 'A secret about grids', text: 'Grown-up maps of the whole world use the SAME idea with numbers instead of letters. They are called latitude and longitude, and you will learn them later. C3 is your first step!', art: stack(grid('C3'), note('C3 ➜ later: 40°N, 70°W')) },
  ],
  6: [
    { title: 'Fly to a square', text: 'Find the square’s name first. Then count how many squares across (letters) and how many down (numbers) Polly must fly.', art: grid('B2') },
  ],
  7: [
    { title: 'Treasure trails', text: 'Start at a landmark, then follow each step in order, counting squares in your head. People really do this! Geocaching is a treasure hunt where people use GPS directions to find hidden boxes.', art: pics([['🏫', 'start'], ['⬆️', '3 North'], ['➡️', '2 East'], ['💰', 'dig']]) },
  ],
  8: [
    { title: 'What is a map scale?', text: 'A map SHRINKS the real world so it fits on paper or a screen. The SCALE tells you how much: “1 square = 2 miles” means each square on the map is really 2 miles long.', art: stack(note('▬ = 2 miles'), pics([['🗺️', 'map: 3 squares'], ['✖️', '× 2'], ['🚗', 'real trip: 6 miles']])) },
    { title: 'Why scale matters', text: 'Scale tells you if you can walk there or need a car, and how long a trip will take. Count the jumps between two places, then multiply by the scale.', art: eq('squares × scale = real distance') },
  ],
  9: [
    { title: 'In-between directions', text: 'Between the four main directions are four more. Northeast is up AND right. Weather reports use them: “A cold wind from the northwest!” Wind vanes on roofs point this way too.', art: pics([['↖️', 'NW'], ['⬆️', 'N'], ['↗️', 'NE'], ['➡️', 'E'], ['↘️', 'SE'], ['⬇️', 'S'], ['↙️', 'SW'], ['⬅️', 'W']]) },
  ],
  10: [
    { title: 'Which way from here?', text: 'Ask two questions. Up (North) or down (South)? Left (West) or right (East)? Put them together. Pilots and ship captains say things like “heading southwest”.', art: note('Up + right = <b>Northeast</b><br>Down + left = <b>Southwest</b>') },
  ],
  11: [
    { title: 'A grid for the whole Earth', text: 'Remember grid squares like C3? Earth has its own invisible grid! LATITUDE lines go across, like ladder rungs (“lat” sounds like “flat”). LONGITUDE lines go up and down, from pole to pole.', art: worldDemo(null) },
    { title: 'The Equator', text: 'The EQUATOR is the latitude line around the middle of the Earth: 0°. Places above it are NORTH (like 40°N). Places below it are SOUTH (like 30°S). The farther from the Equator, the bigger the number and usually the colder.', art: worldDemo('eq') },
    { title: 'The Prime Meridian', text: 'The PRIME MERIDIAN is the longitude line at 0°. It runs through London, England. Places to the left are WEST (like 70°W). Places to the right are EAST (like 140°E).', art: worldDemo('pm') },
    { title: 'Why it matters', text: 'Every place on Earth has its own latitude and longitude, like a home address for the planet. GPS in phones and cars, airplane pilots, ship captains and rescue teams all use them. Say latitude first: New York City is about 40°N, 70°W.', art: pics([['📱', 'GPS'], ['✈️', 'pilots'], ['🚢', 'ships'], ['🚁', 'rescue teams']]) },
  ],
  12: [
    { title: 'The coordinate plane', text: 'Mathematicians use a grid with two number lines, just like latitude and longitude. The x-axis goes ACROSS. The y-axis goes UP. A point is written (x, y).', art: `<svg class="diagram" viewBox="0 0 260 240"><g stroke="#b9dbe8">${[0, 1, 2, 3, 4, 5].map(i => `<line x1="${30 + i * 40}" y1="20" x2="${30 + i * 40}" y2="210"/><line x1="30" y1="${210 - i * 38}" x2="230" y2="${210 - i * 38}"/>`).join('')}</g><line x1="30" y1="210" x2="240" y2="210" stroke="#2b2350" stroke-width="4"/><line x1="30" y1="210" x2="30" y2="12" stroke="#2b2350" stroke-width="4"/><path d="M30 214 H150" stroke="#ff8a00" stroke-width="5" stroke-dasharray="6 5"/><path d="M150 210 V96" stroke="#ff8a00" stroke-width="5" stroke-dasharray="6 5"/><text x="150" y="100" text-anchor="middle" font-size="26">💰</text><text x="160" y="230" font-size="16" font-weight="700">x = 3</text><text x="160" y="140" font-size="16" font-weight="700">y = 3</text></svg>` },
    { title: 'Across, then up', text: '(3, 5) means walk ACROSS 3, then climb UP 5. Always x first! A trick: you have to walk to a ladder before you can climb it. Video games use (x, y) to place every character on the screen!', art: eq('(x, y) = (across, up)') },
  ],
};

// Compass Cove: a simple world map (flat "equirectangular" projection) for latitude and longitude.
// x = longitude + 180, y = 85 − latitude. Continents are rough cartoon outlines, made for kids.
import { el } from '../_joy/js/util.js';

export const CONT = {
  'North America': [[-168, 66], [-140, 70], [-95, 72], [-80, 62], [-62, 55], [-66, 44], [-75, 35], [-81, 25], [-97, 26], [-105, 20], [-92, 15], [-83, 9], [-78, 8], [-87, 13], [-106, 23], [-117, 32], [-124, 40], [-124, 48], [-135, 58], [-150, 60], [-165, 60]],
  Greenland: [[-55, 60], [-43, 60], [-20, 70], [-20, 80], [-60, 82], [-72, 77], [-56, 68]],
  'South America': [[-80, 10], [-62, 11], [-50, 0], [-35, -6], [-40, -22], [-48, -28], [-58, -38], [-65, -55], [-74, -50], [-72, -30], [-70, -18], [-81, -5], [-78, 2]],
  Europe: [[-10, 36], [-9, 43], [-1, 46], [-5, 48], [3, 51], [8, 54], [5, 58], [10, 63], [20, 70], [30, 70], [40, 66], [40, 45], [30, 41], [26, 38], [20, 40], [12, 44], [15, 38], [8, 44], [3, 42]],
  'Great Britain': [[-6, 50], [2, 51], [-2, 56], [-5, 58], [-6, 55]],
  Africa: [[-17, 21], [-10, 30], [-6, 36], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 12], [40, -2], [40, -15], [33, -26], [20, -35], [18, -30], [12, -15], [9, -1], [5, 5], [-8, 4], [-17, 14]],
  Asia: [[40, 66], [60, 70], [80, 73], [110, 76], [140, 72], [170, 70], [180, 66], [160, 60], [142, 52], [135, 43], [122, 40], [122, 30], [110, 20], [108, 11], [100, 14], [103, 2], [98, 8], [92, 22], [80, 15], [77, 8], [72, 20], [66, 25], [57, 25], [52, 30], [48, 30], [43, 13], [35, 28], [36, 36], [30, 41], [40, 45]],
  Japan: [[130, 31], [141, 36], [142, 43], [140, 41], [135, 34]],
  Australia: [[114, -22], [122, -17], [131, -12], [137, -12], [142, -11], [146, -19], [153, -27], [150, -37], [141, -38], [131, -31], [115, -34]],
  Antarctica: [[-180, -72], [-120, -74], [-60, -64], [0, -70], [60, -67], [120, -66], [180, -72], [180, -85], [-180, -85]],
};
// famous places: [emoji, name, longitude, latitude]
export const PLACES = [
  ['🗽', 'New York City', -74, 41], ['🏔️', 'Denver, Colorado', -105, 40], ['🏰', 'London', -0.1, 51.5], ['🗻', 'Tokyo', 139.7, 35.7], ['🐨', 'Sydney', 151.2, -33.9],
  ['🦁', 'Nairobi, Kenya', 36.8, -1.3], ['⚽', 'Rio de Janeiro', -43.2, -22.9], ['🌴', 'Honolulu, Hawaii', -157.9, 21.3], ['🔺', 'Cairo, Egypt', 31.2, 30], ['🌋', 'Quito, Ecuador', -78.5, -0.2],
  ['🐼', 'Beijing', 116.4, 39.9], ['🐧', 'a research station in Antarctica', 166.7, -77.8], ['🦘', 'the middle of Australia', 133.9, -23.7], ['🌮', 'Mexico City', -99.1, 19.4], ['🐻', 'Anchorage, Alaska', -149.9, 61.2],
];
export const X = lon => lon + 180, Y = lat => 85 - lat;
const r10 = v => Math.round(v / 10) * 10 + 0;
export const latText = lat => { const v = Math.abs(r10(lat)); return v === 0 ? '0° (the Equator)' : `${v}°${lat > 0 ? 'N' : 'S'}`; };
export const lonText = lon => { const v = Math.abs(r10(lon)); return v === 0 ? '0° (the Prime Meridian)' : v === 180 ? '180°' : `${v}°${lon > 0 ? 'E' : 'W'}`; };
export const llText = p => `${latText(p[3])}, ${lonText(p[2])}`;
export const llShort = (lat, lon) => { const a = Math.abs(r10(lat)), b = Math.abs(r10(lon)); return `${a ? a + '°' + (lat > 0 ? 'N' : 'S') : '0°'}, ${b ? b + '°' + (lon > 0 ? 'E' : 'W') : '0°'}`; };

/** Draw the world. opts: { places: [...], labels: true, onPlace(p, node), onLine(kind) } */
export function worldMap({ places = [], labels = true, onPlace = null, onLine = null, glow = null } = {}) {
  const svg = el('svg', { viewBox: '-26 -6 400 188', class: 'cc-world', role: 'img', 'aria-label': 'World map with latitude and longitude lines' });
  svg.appendChild(el('rect', { x: 0, y: 0, width: 360, height: 170, class: 'w-sea', rx: 4 }));
  for (const [name, pts] of Object.entries(CONT)) {
    const p = el('polygon', { points: pts.map(([lo, la]) => `${X(lo)},${Y(la)}`).join(' '), class: 'w-land' });
    p.appendChild(el('title', {}, name));
    svg.appendChild(p);
  }
  const g = el('g', { class: 'w-grid' });
  for (let lat = -80; lat <= 80; lat += 10) if (lat) g.appendChild(el('line', { x1: 0, y1: Y(lat), x2: 360, y2: Y(lat), class: lat % 30 ? 'w-fine' : 'w-mid' }));
  for (let lon = -170; lon <= 170; lon += 10) if (lon) g.appendChild(el('line', { x1: X(lon), y1: 0, x2: X(lon), y2: 170, class: lon % 30 ? 'w-fine' : 'w-mid' }));
  svg.appendChild(g);
  const eqL = el('line', { x1: 0, y1: Y(0), x2: 360, y2: Y(0), class: 'w-eq' + (glow === 'eq' ? ' glow' : '') });
  const pmL = el('line', { x1: X(0), y1: 0, x2: X(0), y2: 170, class: 'w-pm' + (glow === 'pm' ? ' glow' : '') });
  svg.append(eqL, pmL);
  if (labels) {
    [60, 30, 0, -30, -60].forEach(lat => svg.appendChild(el('text', { x: -2, y: Y(lat) + 3, 'text-anchor': 'end', class: 'w-lab' + (lat ? '' : ' e0') }, lat ? `${Math.abs(lat)}°${lat > 0 ? 'N' : 'S'}` : '0°')));
    [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].forEach(lon => svg.appendChild(el('text', { x: X(lon), y: 178, 'text-anchor': 'middle', class: 'w-lab' + (lon ? '' : ' p0') }, lon ? `${Math.abs(lon)}°${lon > 0 ? 'E' : 'W'}` : '0°')));
    svg.appendChild(el('text', { x: 4, y: Y(0) - 2, class: 'w-name e0' }, 'Equator'));
    svg.appendChild(el('text', { x: X(0) + 2, y: 9, class: 'w-name p0' }, 'Prime Meridian'));
  }
  // line tapping (wide invisible hit areas)
  if (onLine) {
    const hitE = el('rect', { x: 0, y: Y(0) - 6, width: 360, height: 12, class: 'w-hit' });
    const hitP = el('rect', { x: X(0) - 6, y: 0, width: 12, height: 170, class: 'w-hit' });
    hitE.addEventListener('click', e => { e.stopPropagation(); onLine('eq', eqL); });
    hitP.addEventListener('click', e => { e.stopPropagation(); onLine('pm', pmL); });
    svg.addEventListener('click', () => onLine('other', null));
    svg.append(hitE, hitP);
  }
  const nodes = places.map(p => {
    const n = el('g', { class: 'w-place', transform: `translate(${X(p[2])} ${Y(p[3])})`, tabindex: onPlace ? 0 : -1, role: onPlace ? 'button' : null, 'aria-label': p[1] });
    n.appendChild(el('circle', { r: 9, class: 'w-dot' }));
    n.appendChild(el('text', { y: 4, 'text-anchor': 'middle', class: 'w-emo' }, p[0]));
    if (onPlace) { n.addEventListener('click', e => { e.stopPropagation(); onPlace(p, n); }); n.addEventListener('keydown', e => { if (e.key === 'Enter') onPlace(p, n); }); }
    svg.appendChild(n);
    return n;
  });
  return { svg, nodes, eqL, pmL };
}

// The animatronics, drawn the way real pizza-place animatronics look: fur suits with seams, hard plastic snouts,
// glass eyes with eyelids, jaws on hinges and bolts at the joints. Every character has three looks (scare tiers):
//   0 Gentle      — shiny and new, like a stage show. Big friendly glass eyes and a smile.
//   1 Spooky-lite — old and dusty. Sleepy lids, glowing eyes, small rips with metal showing, dented hat.
//   2 Spooky      — broken down. Half the face shell is gone (metal skull + red eye), jaw hanging, wires. No gore.
// Built robots (the Workshop) use the same parts with the kid's paint color. Each picture is an SVG made here,
// turned into an image once, and then drawn on the game canvas (and in the 3D rooms as a billboard).
import { gradeTier } from './tier.js';

// ------------------------------------------------------------------ colors
const rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mul = (h, k) => hex(rgb(h).map(v => v * k));
export const mix = (h, h2, t) => { const a = rgb(h), b = rgb(h2); return hex(a.map((v, i) => v + (b[i] - v) * t)); };
const dull = (h, d) => (d === 0 ? h : d === 1 ? mul(mix(h, '#777777', 0.2), 0.78) : mul(mix(h, '#6a6a6a', 0.32), 0.52));

// ------------------------------------------------------------------ the cast
export const CAST = {
  rusty: { kind: 'raccoon', fur: '#958a7d', belly: '#ece3d4', mask: '#3b332c', snout: '#f2e9d8', iris: '#3a8fd9', accent: '#d13d2e', hat: 'tophat', prop: 'mic' },
  hoot: { kind: 'owl', fur: '#46689c', belly: '#dccaa2', mask: '#22324d', snout: '#e8a33d', iris: '#e89a00', accent: '#7b4fd1', hat: 'grad', prop: 'book' },
  chomps: { kind: 'gator', fur: '#3f8a3b', belly: '#cfe08f', mask: '#1f4a1d', snout: '#56a051', iris: '#ff8a00', accent: '#c0392b', hat: 'chef', prop: 'pizza' },
  major: { kind: 'moose', fur: '#86532a', belly: '#cfa577', mask: '#3d2410', snout: '#d6ae80', iris: '#2f9fb8', accent: '#2d4a2b', hat: 'cap', prop: 'medal' },
};
// built robots (Workshop kits)
export const BOT_KINDS = { bunny: 'bunny', bear: 'bear', pup: 'pup', penguin: 'penguin' };

/** Eye centers in picture units (300 × 520), for glowing eyes in the dark. */
export function eyePoints(kind) {
  if (kind === 'gator') return [[112, 74], [188, 74]];
  if (kind === 'owl') return [[108, 110], [192, 110]];
  if (kind === 'moose') return [[112, 104], [188, 104]];
  return [[110, 112], [190, 112]];
}
export const ART_W = 300, ART_H = 520;

// ------------------------------------------------------------------ SVG pieces
const defs = (p, id) => `<defs>
<radialGradient id="f${id}" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="${mul(p.fur, 1.25)}"/><stop offset="1" stop-color="${mul(p.fur, 0.68)}"/></radialGradient>
<radialGradient id="b${id}" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="${mul(p.belly, 1.05)}"/><stop offset="1" stop-color="${mul(p.belly, 0.8)}"/></radialGradient>
<radialGradient id="m${id}" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="${mul(p.mask, 1.25)}"/><stop offset="1" stop-color="${mul(p.mask, 0.45)}"/></radialGradient>
<radialGradient id="p${id}" cx="40%" cy="25%" r="80%"><stop offset="0" stop-color="${mul(p.snout, 1.08)}"/><stop offset="1" stop-color="${mul(p.snout, 0.78)}"/></radialGradient>
<radialGradient id="e${id}" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="${p.d ? '#d9d4c4' : '#ffffff'}"/><stop offset="1" stop-color="${p.d ? '#6e6a5e' : '#b9c3cc'}"/></radialGradient>
<linearGradient id="t${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d7dce2"/><stop offset=".5" stop-color="#8d949c"/><stop offset="1" stop-color="#4b5158"/></linearGradient>
<linearGradient id="u${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9aa0a6"/><stop offset="1" stop-color="#33373c"/></linearGradient>
<pattern id="x${id}" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M2 2 l2 5 M8 1 l-1 5 M5 7 l2 4 M10 7 l1 4" stroke="#000" stroke-opacity="0.16" stroke-width="1.2"/></pattern>
<filter id="g${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>`;

const GHOST = 'fill="none" stroke="#9fe8ff" stroke-width="3" stroke-dasharray="9 7" opacity="0.8"';

/**
 * Make the SVG for one animatronic.
 * o = { kind, pal: {fur, belly, mask, snout, iris, accent}, hat, prop, look: {eyes, jaw, damage}, frame, bot, has, ghost }
 *   look.eyes: 'happy' | 'glow' | 'evil' | 'endo'   look.jaw: 'smile' | 'drop' | 'hang'   look.damage: 0 | 1 | 2
 *   has: Set of parts that are built (legs, body, arms, head, eyes, bow) — Workshop. ghost: dashed outline of the rest.
 */
export function svgFor(o) {
  const id = 'a' + Math.random().toString(36).slice(2, 7);
  const L = o.look, D = L.damage, kind = o.kind, f = o.frame || 0;
  const p = { ...o.pal, d: D };
  const on = part => !o.has || o.has.has(part);
  const F = `url(#f${id})`, B = `url(#b${id})`, M = `url(#m${id})`, PL = `url(#p${id})`, EW = `url(#e${id})`, MT = `url(#t${id})`, MD = `url(#u${id})`, TX = `url(#x${id})`, GL = `url(#g${id})`;
  const legDy = f ? 5 : -5, swing = f ? 6 : -6;
  const ink = mul(p.mask, 0.8);
  let s = '', front = '';

  // ---------------- tail (part of the body)
  const tail = () => {
    if (kind === 'raccoon') return `<path d="M222 360 Q292 340 284 262 Q278 222 252 210" stroke="${F}" stroke-width="44" fill="none" stroke-linecap="round"/><path d="M234 352 Q286 334 281 280 Q279 252 264 232" stroke="${mul(p.mask, 0.9)}" stroke-width="40" stroke-dasharray="16 30" fill="none" opacity=".85"/>`;
    if (kind === 'gator') return `<path d="M210 350 Q300 380 290 300 Q286 270 270 262" stroke="${F}" stroke-width="40" fill="none" stroke-linecap="round"/><path d="M262 300 L272 290 L278 304 L286 294" stroke="${ink}" stroke-width="4" fill="none"/>`;
    if (kind === 'owl' || kind === 'penguin') return `<path d="M130 368 L150 410 L170 368Z" fill="${M}"/>`;
    if (kind === 'bunny') return `<circle cx="226" cy="352" r="18" fill="${mul(p.belly, 1.05)}"/>`;
    if (kind === 'pup') return `<path d="M222 346 Q270 320 262 280" stroke="${F}" stroke-width="18" fill="none" stroke-linecap="round"/>`;
    return '';
  };

  // ---------------- legs
  if (on('legs')) {
    const LL = (x, dy) => `<g transform="translate(0 ${dy})"><rect x="${x}" y="360" width="46" height="128" rx="20" fill="${F}"/><rect x="${x}" y="360" width="46" height="128" rx="20" fill="${TX}"/><path d="M${x + 4} 426 H${x + 42}" stroke="${ink}" stroke-width="3" stroke-dasharray="4 4" opacity=".6"/><circle cx="${x + 23}" cy="426" r="6" fill="${MT}"/></g>`;
    s += LL(96, legDy);
    if (D === 2) {
      s += `<g transform="translate(0 ${-legDy})"><rect x="158" y="360" width="46" height="62" rx="18" fill="${F}"/><rect x="174" y="414" width="14" height="74" rx="4" fill="${MT}"/><circle cx="181" cy="418" r="9" fill="${MD}"/><path d="M160 418 L170 432 L158 428 M204 416 L196 432 L206 430" stroke="${mul(p.fur, 0.5)}" stroke-width="5" fill="none"/></g>`;
    } else s += LL(158, -legDy);
    if (D === 1) s += `<path d="M164 ${430 - legDy} l12 -6 l8 12 l12 -8 l-4 18 l-22 2z" fill="#141110"/><path d="M172 ${432 - legDy} v14 M186 ${432 - legDy} v14" stroke="${MT}" stroke-width="4"/>`;
    const foot = kind === 'owl' || kind === 'penguin' ? '#e0a030' : mul(p.mask, 0.75);
    s += `<ellipse cx="114" cy="${494 + legDy}" rx="44" ry="17" fill="${foot}"/><ellipse cx="186" cy="${494 - legDy}" rx="44" ry="17" fill="${foot}"/>`;
    if (!D) s += `<ellipse cx="104" cy="${487 + legDy}" rx="18" ry="5" fill="#fff" opacity=".2"/><ellipse cx="176" cy="${487 - legDy}" rx="18" ry="5" fill="#fff" opacity=".2"/>`;
  } else if (o.ghost) s += `<rect x="96" y="360" width="46" height="140" rx="20" ${GHOST}/><rect x="158" y="360" width="46" height="140" rx="20" ${GHOST}/>`;

  // ---------------- arms (+ hands and what they hold)
  const wing = kind === 'owl';
  const armCol = wing ? M : F;
  const hand = (x, y) => (wing
    ? `<path d="M${x - 18} ${y - 6} L${x - 10} ${y + 22} L${x} ${y} L${x + 8} ${y + 24} L${x + 16} ${y - 4}Z" fill="${mul(p.mask, 0.9)}"/>`
    : `<ellipse cx="${x}" cy="${y}" rx="25" ry="23" fill="${mul(p.mask, 0.85)}"/><path d="M${x - 12} ${y + 12} v10 M${x - 2} ${y + 15} v10 M${x + 8} ${y + 13} v10" stroke="${mul(p.mask, 0.85)}" stroke-width="7" stroke-linecap="round"/>`);
  const propArt = () => {
    if (D || o.bot) return '';
    if (o.prop === 'mic') return `<rect x="216" y="270" width="12" height="62" rx="5" fill="#2a2a2e" transform="rotate(-18 222 300)"/><circle cx="214" cy="266" r="14" fill="${MT}"/><path d="M204 262 H224 M204 268 H224 M208 257 H220" stroke="#555" stroke-width="1.5"/>`;
    if (o.prop === 'book') return `<g transform="rotate(-12 244 330)"><rect x="214" y="300" width="62" height="46" rx="4" fill="#c0392b"/><rect x="218" y="304" width="54" height="38" fill="#fff6e0"/><path d="M245 304 V342 M224 314 H240 M224 322 H240 M250 314 H266 M250 322 H266" stroke="#7a6a50" stroke-width="2"/></g>`;
    if (o.prop === 'pizza') return `<g transform="rotate(-8 246 320)"><rect x="240" y="320" width="10" height="56" fill="#8a5a2b"/><circle cx="246" cy="300" r="36" fill="#e9b949"/><circle cx="246" cy="300" r="29" fill="#d9592b"/><circle cx="236" cy="292" r="5" fill="#8e1b1b"/><circle cx="256" cy="304" r="5" fill="#8e1b1b"/><circle cx="242" cy="312" r="4" fill="#8e1b1b"/></g>`;
    return '';
  };
  if (on('arms')) {
    if (D === 2 && !o.bot) {
      s += `<path d="M84 238 Q40 250 22 214" stroke="${armCol}" stroke-width="40" fill="none" stroke-linecap="round"/>${hand(18, 198)}`;
      s += `<path d="M216 238 Q246 268 248 300" stroke="${armCol}" stroke-width="40" fill="none" stroke-linecap="round"/><path d="M232 298 L240 312 L252 300 L264 314 L262 296Z" fill="${mul(p.fur, 0.5)}"/>
<rect x="244" y="306" width="12" height="80" rx="4" fill="${MT}" transform="rotate(-8 250 346)"/><rect x="254" y="316" width="6" height="56" rx="3" fill="${MD}" transform="rotate(-8 257 344)"/>
<path d="M246 316 Q236 340 248 362" stroke="#d13d2e" stroke-width="2.5" fill="none"/><path d="M252 318 Q266 344 254 368" stroke="#3a8fd9" stroke-width="2.5" fill="none"/><path d="M250 320 Q244 350 258 372" stroke="#e9b949" stroke-width="2.5" fill="none"/>
<circle cx="258" cy="388" r="11" fill="${MD}"/><path d="M250 394 L242 422 M258 398 L256 428 M266 394 L274 420" stroke="${MT}" stroke-width="6" stroke-linecap="round"/>`;
    } else if (D === 1 || (o.bot && L.jaw !== 'smile')) {
      s += `<g transform="rotate(${swing} 84 238)"><path d="M84 238 Q60 290 62 340 Q62 376 66 404" stroke="${armCol}" stroke-width="40" fill="none" stroke-linecap="round"/>${hand(66, 418)}</g>`;
      s += `<g transform="rotate(${-swing} 216 238)"><path d="M216 238 Q240 290 238 340 Q238 376 234 404" stroke="${armCol}" stroke-width="40" fill="none" stroke-linecap="round"/>${hand(234, 418)}</g>`;
      if (D === 1 && o.prop === 'mic') s += `<path d="M226 430 Q214 470 232 500 Q240 516 226 530" stroke="#1a1a1e" stroke-width="3" fill="none"/>`;
      if (D === 1) s += `<path d="M48 330 l10 -8 l8 10 l-6 12z" fill="#141110"/><path d="M54 326 l6 14" stroke="${MT}" stroke-width="3"/>`;
    } else {
      s += `<g transform="rotate(${swing * 0.6} 84 238)"><path d="M84 238 Q50 282 54 330 Q56 372 70 398" stroke="${armCol}" stroke-width="40" fill="none" stroke-linecap="round"/><path d="M36 322 Q55 334 74 322" stroke="${ink}" stroke-width="3" fill="none" opacity=".5"/>${hand(72, 412)}</g>`;
      s += `<path d="M216 238 Q256 272 254 314 Q252 336 238 348" stroke="${armCol}" stroke-width="40" fill="none" stroke-linecap="round"/>`;
      front = propArt() + hand(238, 352);
    }
  } else if (o.ghost) s += `<path d="M84 238 Q50 282 54 330 Q56 372 70 404" stroke-linecap="round" ${GHOST}/><path d="M216 238 Q250 282 246 330 Q244 372 230 404" stroke-linecap="round" ${GHOST}/>`;

  // ---------------- body
  if (on('body')) {
    s = tail() + s;
    s += `<rect x="70" y="206" width="160" height="176" rx="72" fill="${F}"/><rect x="70" y="206" width="160" height="176" rx="72" fill="${TX}"/>`;
    s += `<ellipse cx="150" cy="${kind === 'penguin' ? 300 : 298}" rx="${kind === 'penguin' ? 62 : 54}" ry="${kind === 'penguin' ? 74 : 66}" fill="${B}"/>`;
    s += `<path d="M150 238 V366" stroke="${mul(p.belly, 0.6)}" stroke-width="2" stroke-dasharray="5 5"/><path d="M88 250 Q80 300 92 352 M212 250 Q220 300 208 352" stroke="${ink}" stroke-width="2" stroke-dasharray="4 5" fill="none" opacity=".6"/>`;
    if (kind === 'owl') s += `<path d="M118 280 q16 12 32 0 q16 12 32 0 M118 310 q16 12 32 0 q16 12 32 0 M126 338 q12 10 24 0 q12 10 24 0" fill="none" stroke="${mul(p.belly, 0.75)}" stroke-width="3"/>`;
    if (kind === 'gator') s += `<path d="M108 262 H192 M104 290 H196 M104 318 H196 M110 344 H190" stroke="${mul(p.belly, 0.8)}" stroke-width="3"/>`;
    if (o.bot) { // chest panel with lights (a heart that glows)
      const hc = L.eyes === 'evil' ? '#ff3b30' : L.eyes === 'glow' ? '#ffb02e' : '#ff6b8a';
      s += `<rect x="118" y="262" width="64" height="46" rx="10" fill="#2a1a3a"/><circle cx="150" cy="285" r="22" fill="${hc}" opacity=".35" filter="${GL}"/><path d="M150 298 C134 286 136 270 146 272 C149 272 150 276 150 278 C150 276 151 272 154 272 C164 270 166 286 150 298Z" fill="${hc}"/>`;
    } else if (!D) s += `<circle cx="150" cy="272" r="7" fill="#e9b949"/><circle cx="150" cy="306" r="7" fill="#e9b949"/>`;
    if (o.prop === 'medal' && D < 2 && !o.bot) s += `<path d="M140 232 L150 262 L160 232Z" fill="#3a6ea5"/><circle cx="150" cy="268" r="11" fill="#e9b949"/><path d="M150 261 l2 5 h5 l-4 3 l2 5 l-5 -3 l-5 3 l2 -5 l-4 -3 h5z" fill="#a8811f"/>`;
    if (D === 1) s += `<path d="M164 316 L176 306 L190 318 L184 334 L168 338Z" fill="#141110"/><path d="M170 316 L184 330 M176 312 V334" stroke="${MT}" stroke-width="3"/><ellipse cx="112" cy="330" rx="22" ry="14" fill="#2a241e" opacity=".35"/>`;
    if (D === 2) s += `<path d="M108 250 L130 242 L146 254 L170 240 L192 256 L196 300 L186 334 L160 326 L138 340 L114 324 L104 290Z" fill="#0e0c0b"/>
<rect x="146" y="248" width="10" height="86" rx="3" fill="${MT}"/><path d="M118 268 Q150 258 184 268 M116 290 Q150 280 186 290 M120 312 Q150 302 182 312" stroke="${MT}" stroke-width="6" fill="none" stroke-linecap="round"/>
<circle cx="166" cy="300" r="10" fill="${MD}"/><circle cx="166" cy="300" r="3" fill="#ff5a3c"/><path d="M128 278 Q140 300 126 322" stroke="#d13d2e" stroke-width="2.5" fill="none"/><path d="M178 274 Q168 300 182 324" stroke="#3a8fd9" stroke-width="2.5" fill="none"/>
<ellipse cx="200" cy="350" rx="18" ry="12" fill="#1a1410" opacity=".5"/><ellipse cx="96" cy="230" rx="14" ry="9" fill="#1a1410" opacity=".45"/>`;
    // neck joint
    s += `<rect x="118" y="190" width="64" height="24" rx="8" fill="#110e0c"/>`;
    if (D === 2 || (o.bot && L.eyes === 'evil')) s += `<rect x="132" y="186" width="8" height="30" fill="${MT}"/><rect x="160" y="186" width="8" height="30" fill="${MT}"/><path d="M140 200 q6 10 -2 18 M162 198 q-8 10 2 20" stroke="#e9b949" stroke-width="2" fill="none"/>`;
  } else if (o.ghost) s += `<rect x="70" y="206" width="160" height="176" rx="72" ${GHOST}/>`;
  s += front; // what the right hand holds goes in front of the body

  // ---------------- head
  const [[lx, ly], [rx, ry]] = eyePoints(kind);
  if (on('head')) {
    s += ears(kind, F, p, D, TX);
    // head shape
    if (kind === 'owl') s += `<ellipse cx="150" cy="116" rx="100" ry="88" fill="${F}"/><ellipse cx="150" cy="116" rx="100" ry="88" fill="${TX}"/>`;
    else if (kind === 'gator') s += `<ellipse cx="150" cy="116" rx="92" ry="74" fill="${F}"/><ellipse cx="150" cy="116" rx="92" ry="74" fill="${TX}"/><circle cx="112" cy="74" r="34" fill="${F}"/><circle cx="188" cy="74" r="34" fill="${F}"/>`;
    else if (kind === 'moose') s += `<ellipse cx="150" cy="112" rx="82" ry="86" fill="${F}"/><ellipse cx="150" cy="112" rx="82" ry="86" fill="${TX}"/>`;
    else s += `<ellipse cx="150" cy="118" rx="94" ry="82" fill="${F}"/><ellipse cx="150" cy="118" rx="94" ry="82" fill="${TX}"/>`;
    // face markings
    if (kind === 'raccoon') {
      s += `<path d="M58 128 L36 150 L64 148 L50 170 L86 158Z" fill="${p.belly}"/><path d="M242 128 L264 150 L236 148 L250 170 L214 158Z" fill="${p.belly}"/><path d="M150 38 Q140 68 150 92 Q160 68 150 38Z" fill="${p.mask}"/>`;
      s += `<path d="M60 112 Q100 76 150 100 Q200 76 240 112 Q222 144 186 138 Q150 130 114 138 Q78 144 60 112Z" fill="${M}"/>`;
    }
    if (kind === 'owl') s += `<circle cx="108" cy="110" r="40" fill="${p.belly}"/><circle cx="192" cy="110" r="40" fill="${p.belly}"/><path d="M68 108 Q108 60 150 96 Q192 60 232 108" fill="none" stroke="${p.mask}" stroke-width="6"/>`;
    if (kind === 'penguin') s += `<path d="M84 150 Q90 76 150 92 Q210 76 216 150 Q200 196 150 196 Q100 196 84 150Z" fill="${p.belly}"/>`;
    if (kind === 'bear' || kind === 'pup' || kind === 'bunny') s += `<ellipse cx="150" cy="160" rx="58" ry="40" fill="${mul(p.belly, 0.98)}" opacity=".7"/>`;
    // eye sockets (built here so the face shell can cover them)
    s += mouthAndSnout(kind, L.jaw, p, { PL, MT, MD, ink });
    // spooky: half of the face shell is missing (metal skull behind)
    if (L.eyes === 'endo') s += endoFace(lx, ly, MT);
    // hat
    if (!o.bot) s += hat(o.hat, D, p);
  } else if (o.ghost) s += `<ellipse cx="150" cy="118" rx="94" ry="82" ${GHOST}/>`;

  // ---------------- eyes
  if (on('eyes') && on('head')) s += eyes(kind, L.eyes, p, lx, ly, rx, ry, { EW, GL, MT, MD });
  else if (on('eyes') && !on('head')) s += `<circle cx="${lx}" cy="${ly}" r="21" fill="${EW}"/><circle cx="${rx}" cy="${ry}" r="21" fill="${EW}"/><circle cx="${lx}" cy="${ly + 3}" r="10" fill="${p.iris}"/><circle cx="${rx}" cy="${ry + 3}" r="10" fill="${p.iris}"/>`;
  else if (o.ghost) s += `<circle cx="${lx}" cy="${ly}" r="22" ${GHOST}/><circle cx="${rx}" cy="${ry}" r="22" ${GHOST}/>`;

  // ---------------- bow tie
  if (on('bow') && on('body')) {
    const bc = o.bot ? (p.bow || '#ffd84a') : kind === 'moose' ? '#c0392b' : p.accent;
    if (D === 2) s += `<path d="M150 218 L120 212 L124 240Z" fill="${mul(bc, 0.45)}"/><path d="M150 218 L176 230 L170 254Z" fill="${mul(bc, 0.45)}"/>`;
    else s += `<path d="M150 212 L114 ${D ? 200 : 194} L116 232Z" fill="${dull(bc, D)}"/><path d="M150 212 L186 194 L184 ${D ? 228 : 232}Z" fill="${dull(bc, D)}"/><circle cx="150" cy="212" r="9" fill="${mul(bc, 0.65)}"/>${D ? '' : '<path d="M118 200 L138 208" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>'}`;
  } else if (o.ghost) s += `<path d="M150 212 L114 194 L114 232 L186 194 L186 232Z" ${GHOST}/>`;

  // gloss on a new suit; grime on old ones
  if (on('head')) {
    if (!D) s += `<ellipse cx="118" cy="64" rx="26" ry="9" fill="#fff" opacity=".12"/>`;
    if (D === 2) s += `<ellipse cx="200" cy="80" rx="20" ry="12" fill="#14100d" opacity=".5"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ART_W}" height="${ART_H}" viewBox="-10 -10 ${ART_W + 20} ${ART_H + 20}">${defs(p, id)}${s}</svg>`;
}

function ears(kind, F, p, D, TX) {
  const torn = D === 2;
  const wires = '<path d="M92 42 L84 26 M100 44 L104 24" stroke="#e9b949" stroke-width="2"/><path d="M96 44 L92 22" stroke="#d13d2e" stroke-width="2"/>';
  const web = D === 1 ? '<path d="M82 20 L130 40 M86 14 L104 52 M80 30 L128 26 M90 18 Q100 30 118 30" stroke="#ddd8cf" stroke-opacity=".5" stroke-width="1" fill="none"/>' : '';
  switch (kind) {
    case 'raccoon':
      return (torn ? `<path d="M80 70 L88 40 L104 46 L112 34 L128 52Z" fill="${F}"/>${wires}` : `<path d="M76 76 L88 8 L134 52Z" fill="${F}"/><path d="M90 62 L96 28 L120 50Z" fill="${mix(p.belly, '#e9a9b0', 0.4)}"/>`)
        + (D === 1 ? `<path d="M224 76 L236 22 L246 40 L172 54Z" fill="${F}"/>` : `<path d="M224 76 L212 8 L166 52Z" fill="${F}"/>${torn ? '' : `<path d="M210 62 L204 28 L180 50Z" fill="${mix(p.belly, '#e9a9b0', 0.4)}"/>`}`) + web;
    case 'owl':
      return (torn ? `<path d="M56 74 L62 44 L80 56Z" fill="${p.mask}"/>${wires}` : `<path d="M50 80 L54 18 L96 60Z" fill="${p.mask}"/>`) + `<path d="M250 80 L246 18 L204 60Z" fill="${p.mask}"/>` + web;
    case 'moose': {
      const ant = c => `<path d="M100 50 Q60 40 44 6 M70 38 Q50 34 32 42 M80 28 Q78 12 86 0 M200 50 Q240 40 256 6 M230 38 Q250 34 268 42 M220 28 Q222 12 214 0" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="round"/>`;
      return ant(D === 2 ? '#7a6a52' : D === 1 ? '#a8916c' : '#d8c39a') + (torn ? wires : '')
        + `<ellipse cx="66" cy="96" rx="26" ry="11" fill="${F}" transform="rotate(-25 66 96)"/><ellipse cx="234" cy="96" rx="26" ry="11" fill="${F}" transform="rotate(25 234 96)"/>` + web;
    }
    case 'gator': return '';
    case 'bunny':
      return `<rect x="88" y="-40" width="34" height="110" rx="17" fill="${F}" transform="rotate(-10 105 40)"/><rect x="178" y="-40" width="34" height="110" rx="17" fill="${F}" transform="rotate(10 195 40)"/><rect x="97" y="-28" width="16" height="84" rx="8" fill="#ffc2d9" transform="rotate(-10 105 40)"/><rect x="187" y="-28" width="16" height="84" rx="8" fill="#ffc2d9" transform="rotate(10 195 40)"/>`;
    case 'bear':
      return `<circle cx="76" cy="54" r="30" fill="${F}"/><circle cx="224" cy="54" r="30" fill="${F}"/><circle cx="76" cy="54" r="15" fill="${mul(p.belly, 0.95)}"/><circle cx="224" cy="54" r="15" fill="${mul(p.belly, 0.95)}"/>`;
    case 'pup':
      return `<ellipse cx="60" cy="110" rx="24" ry="52" fill="${mul(p.fur, 0.62)}" transform="rotate(18 60 110)"/><ellipse cx="240" cy="110" rx="24" ry="52" fill="${mul(p.fur, 0.62)}" transform="rotate(-18 240 110)"/>`;
    default: return '';
  }
}

function mouthAndSnout(kind, jaw, p, { PL, MT, MD, ink }) {
  const dark = '#2a0c0c';
  // jaw pose: smile (closed, friendly), drop (a little open, flat teeth), hang (crooked + metal teeth)
  const teethFlat = (y, x0 = 120, x1 = 180) => `<path d="M${x0} ${y} H${x1}" stroke="#e8e0cc" stroke-width="8" stroke-dasharray="8 3"/>`;
  const teethMetal = (y, x0 = 114, x1 = 186) => { let d = `M${x0} ${y}`; for (let x = x0; x < x1; x += 12) d += ` L${x + 6} ${y + 14} L${x + 12} ${y}`; return `<path d="${d}Z" fill="${MT}"/>`; };
  if (kind === 'owl' || kind === 'penguin') {
    const c = p.snout;
    const lower = jaw === 'smile' ? `<path d="M134 146 L150 164 L166 146Z" fill="${mul(c, 0.8)}"/>`
      : jaw === 'drop' ? `<path d="M128 150 L150 176 L172 150Z" fill="${mul(c, 0.75)}"/><path d="M134 150 L166 150" stroke="#e8e0cc" stroke-width="4"/>`
        : `<path d="M126 156 L150 190 L176 160Z" fill="${mul(c, 0.6)}" transform="rotate(14 172 150)"/>${teethMetal(150, 130, 170)}`;
    return `${jaw !== 'smile' ? `<path d="M128 146 L150 ${jaw === 'drop' ? 172 : 186} L172 146Z" fill="${dark}"/>` : ''}${lower}<path d="M150 112 L128 132 L150 152 L172 132Z" fill="${c}"/><path d="M150 112 L140 124" stroke="#fff" stroke-opacity=".4" stroke-width="3"/>`;
  }
  if (kind === 'gator') {
    const snout = `<rect x="64" y="104" width="172" height="56" rx="26" fill="${PL}"/><circle cx="130" cy="116" r="5" fill="${ink}"/><circle cx="170" cy="116" r="5" fill="${ink}"/>`;
    if (jaw === 'smile') return `<path d="M70 150 Q150 186 230 150 Q150 168 70 150Z" fill="${dark}"/>${snout}${teethFlat(156, 80, 220)}<path d="M76 160 Q150 198 224 160 Q220 176 150 184 Q80 176 76 160Z" fill="${PL}"/>`;
    if (jaw === 'drop') return `<path d="M70 150 Q150 200 230 150 Q150 172 70 150Z" fill="${dark}"/>${snout}${teethFlat(156, 76, 224)}<g transform="translate(0 12)"><path d="M76 160 Q150 198 224 160 Q220 180 150 188 Q80 180 76 160Z" fill="${PL}"/>${teethFlat(164, 90, 210)}</g>`;
    return `<path d="M66 150 Q150 240 234 150 Q150 180 66 150Z" fill="${dark}"/><g transform="rotate(14 228 156)"><path d="M76 166 Q150 204 224 166 Q220 190 150 198 Q80 190 76 166Z" fill="${PL}"/>${teethMetal(164, 86, 214)}</g>${snout}${teethMetal(154, 74, 226)}`;
  }
  if (kind === 'moose') {
    const snout = `<ellipse cx="150" cy="140" rx="46" ry="36" fill="${PL}"/><ellipse cx="134" cy="142" rx="7" ry="9" fill="${ink}"/><ellipse cx="166" cy="142" rx="7" ry="9" fill="${ink}"/>`;
    if (jaw === 'smile') return `${snout}<path d="M120 168 Q150 186 180 168" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/><path d="M120 176 Q150 200 180 176 Q174 196 150 198 Q126 196 120 176Z" fill="${PL}"/>`;
    if (jaw === 'drop') return `<path d="M118 172 Q150 206 182 172Z" fill="${dark}"/>${snout}${teethFlat(174, 126, 174)}<path d="M120 188 Q150 196 180 188 Q176 214 150 216 Q124 214 120 188Z" fill="${PL}"/>`;
    return `<path d="M114 170 Q150 240 186 172Z" fill="${dark}"/><g transform="rotate(16 184 172)"><path d="M120 194 Q150 202 180 194 Q176 226 150 230 Q124 226 120 194Z" fill="${PL}"/>${teethMetal(192, 124, 178)}</g>${snout}${teethMetal(172, 120, 180)}`;
  }
  // muzzle (raccoon, bear, pup, bunny)
  const upper = `<path d="M104 150 Q150 120 196 150 Q198 176 150 180 Q102 176 104 150Z" fill="${PL}"/><ellipse cx="150" cy="144" rx="17" ry="11" fill="#111"/><ellipse cx="144" cy="140" rx="6" ry="3" fill="#fff" opacity=".55"/>`;
  const bolts = `<circle cx="102" cy="168" r="6" fill="${MT}"/><circle cx="198" cy="168" r="6" fill="${MT}"/><circle cx="102" cy="168" r="2" fill="#333"/><circle cx="198" cy="168" r="2" fill="#333"/>`;
  if (jaw === 'smile') return `<path d="M110 178 Q150 200 190 178 Q150 190 110 178Z" fill="#3a1414"/><path d="M112 180 Q150 188 188 180 Q184 214 150 216 Q116 214 112 180Z" fill="${PL}"/><ellipse cx="150" cy="190" rx="20" ry="6" fill="#e0607a"/>${upper}<rect x="140" y="174" width="9" height="10" rx="2" fill="#fff"/><rect x="151" y="174" width="9" height="10" rx="2" fill="#fff"/>${bolts}`;
  if (jaw === 'drop') return `<path d="M108 176 Q150 214 192 176 Q150 196 108 176Z" fill="#160707"/><path d="M112 192 Q150 200 188 192 Q184 226 150 228 Q116 226 112 192Z" fill="${PL}"/>${teethFlat(194)}${upper}${teethFlat(176, 116, 184)}${bolts}`;
  return `<path d="M100 170 Q150 250 202 172 Q150 196 100 170Z" fill="#070303"/><g transform="rotate(16 198 172)"><path d="M112 196 Q150 204 188 196 Q184 234 150 238 Q116 234 112 196Z" fill="${PL}"/>${teethMetal(198, 118, 186)}</g>${upper}${teethMetal(178, 114, 186)}<circle cx="100" cy="170" r="8" fill="${MT}"/><rect x="98" y="168" width="40" height="5" rx="2" fill="${MD}" transform="rotate(32 100 170)"/><circle cx="200" cy="170" r="7" fill="${MD}"/>`;
}

function endoFace(ex, ey, MT) {
  const x = ex, y = ey;
  return `<path d="M${x - 52} ${y - 20} L${x - 30} ${y - 42} L${x - 12} ${y - 32} L${x + 8} ${y - 46} L${x + 32} ${y - 30} L${x + 40} ${y - 8} L${x + 36} ${y + 28} L${x + 20} ${y + 54} L${x - 6} ${y + 64} L${x - 30} ${y + 48} L${x - 46} ${y + 22}Z" fill="#0b0909"/>
<path d="M${x - 38} ${y - 14} Q${x - 18} ${y - 36} ${x + 28} ${y - 22} L${x + 32} ${y + 16} Q${x + 18} ${y + 46} ${x - 8} ${y + 52} Q${x - 32} ${y + 40} ${x - 38} ${y + 8}Z" fill="${MT}"/>
<circle cx="${x - 30}" cy="${y - 10}" r="3.5" fill="#3a3f45"/><circle cx="${x + 22}" cy="${y - 18}" r="3.5" fill="#3a3f45"/><circle cx="${x - 26}" cy="${y + 34}" r="3.5" fill="#3a3f45"/><path d="M${x - 34} ${y + 18} H${x + 30}" stroke="#4b5158" stroke-width="3"/>`;
}

function eyes(kind, mood, p, lx, ly, rx, ry, { EW, GL, MT, MD }) {
  const R = kind === 'owl' ? 30 : 25, r = kind === 'owl' ? 25 : 21, ir = kind === 'owl' ? 13 : 11;
  const lid = mul(p.fur, mood === 'happy' ? 0.92 : 0.62);
  let s = '';
  if (mood === 'happy') {
    for (const [x, y] of [[lx, ly], [rx, ry]]) s += `<circle cx="${x}" cy="${y}" r="${R}" fill="#0e0b0a"/><circle cx="${x}" cy="${y}" r="${r}" fill="${EW}"/><circle cx="${x + (x < 150 ? 2 : -2)}" cy="${y + 3}" r="${ir}" fill="${p.iris}"/><circle cx="${x + (x < 150 ? 2 : -2)}" cy="${y + 3}" r="${ir / 2}" fill="#0b0b0b"/><circle cx="${x - 4}" cy="${y - 4}" r="4" fill="#fff"/><path d="M${x - r} ${y - 6} Q${x} ${y - r - 8} ${x + r} ${y - 6} Q${x} ${y - 16} ${x - r} ${y - 6}Z" fill="${lid}"/>`;
    return s;
  }
  if (mood === 'glow' || mood === 'evil') {
    const c = mood === 'evil' ? '#ff3b30' : '#ffe680';
    for (const [x, y] of [[lx, ly], [rx, ry]]) s += `<circle cx="${x}" cy="${y + 2}" r="${R * 0.75}" fill="${c}" opacity=".5" filter="${GL}"/><circle cx="${x}" cy="${y}" r="${R}" fill="#070505"/><circle cx="${x}" cy="${y}" r="${r}" fill="${EW}"/><circle cx="${x}" cy="${y + 5}" r="${ir * 0.9}" fill="${c}"/><circle cx="${x}" cy="${y + 5}" r="${ir * 0.36}" fill="#2a1a00"/><path d="M${x - r - 1} ${y + 1} A${r + 1} ${r + 1} 0 0 1 ${x + r + 1} ${y + 1} Z" fill="${lid}"/><path d="M${x - r - 1} ${y + 1} H${x + r + 1}" stroke="#1a1614" stroke-width="3"/>`;
    return s;
  }
  // endo: left eye bare robot eye (no lid), right eye heavy lid with a red pinprick
  s += `<circle cx="${lx}" cy="${ly}" r="22" fill="#ff3b30" opacity=".55" filter="${GL}"/><circle cx="${lx}" cy="${ly}" r="19" fill="#22262b"/><circle cx="${lx}" cy="${ly}" r="15" fill="${EW}"/><circle cx="${lx}" cy="${ly}" r="7" fill="#ff3b30"/><circle cx="${lx}" cy="${ly}" r="2.5" fill="#ffd2c8"/>`;
  s += `<circle cx="${rx}" cy="${ry + 2}" r="12" fill="#ff3b30" opacity=".5" filter="${GL}"/><circle cx="${rx}" cy="${ry}" r="${R}" fill="#050404"/><circle cx="${rx}" cy="${ry}" r="${r}" fill="${EW}"/><circle cx="${rx}" cy="${ry + 8}" r="4" fill="#ff3b30"/><path d="M${rx - r - 1} ${ry + 5} A${r + 1} ${r + 1} 0 0 1 ${rx + r + 1} ${ry + 5} Z" fill="${lid}"/><path d="M${rx - r - 1} ${ry + 5} H${rx + r + 1}" stroke="#0d0b0a" stroke-width="3"/>`;
  return s;
}

function hat(type, D, p) {
  if (D === 2 || !type) return '';
  const tilt = D === 1 ? ' transform="rotate(-14 150 40)"' : '';
  const dk = D === 1 ? '#141210' : '#1d1a17';
  if (type === 'tophat') return `<g${tilt}><rect x="112" y="14" width="76" height="42" rx="5" fill="${dk}"/>${D ? '<path d="M140 14 L150 24 L162 14" fill="#2a2622"/>' : ''}<rect x="98" y="50" width="104" height="11" rx="5" fill="${dk}"/><rect x="112" y="40" width="76" height="8" fill="${D ? '#6b2a22' : '#d13d2e'}"/>${D ? '' : '<path d="M120 20 V38" stroke="#fff" stroke-opacity=".2" stroke-width="4" stroke-linecap="round"/>'}</g>`;
  if (type === 'grad') return `<g${tilt}><rect x="114" y="30" width="72" height="22" rx="4" fill="${dk}"/><path d="M150 8 L218 30 L150 52 L82 30Z" fill="${D ? '#24222e' : '#2b2b3e'}"/><path d="M196 34 V70" stroke="${D ? '#8a7a3a' : '#ffd84a'}" stroke-width="4"/><circle cx="196" cy="72" r="6" fill="${D ? '#8a7a3a' : '#ffd84a'}"/></g>`;
  if (type === 'chef') { const w = D ? '#b9b4a8' : '#ffffff'; return `<g${tilt}><circle cx="122" cy="20" r="22" fill="${w}"/><circle cx="150" cy="10" r="26" fill="${w}"/><circle cx="178" cy="20" r="22" fill="${w}"/><rect x="110" y="22" width="80" height="34" rx="6" fill="${w}"/><rect x="110" y="46" width="80" height="10" fill="${D ? '#9c978b' : '#e8e4da'}"/></g>`; }
  if (type === 'cap') return `<g${tilt}><rect x="104" y="18" width="92" height="26" rx="8" fill="${D ? '#24371f' : '#2d4a2b'}"/><ellipse cx="150" cy="45" rx="54" ry="7" fill="#1c2e1b"/><path d="M150 21 l3 6 h7 l-5 4 l2 7 l-7 -4 l-7 4 l2 -7 l-5 -4 h7z" fill="${D ? '#8a7a3a' : '#e9b949'}"/></g>`;
  return '';
}

// ------------------------------------------------------------------ looks per tier
export function lookFor(tier, bot = false, mood = 'chase') {
  if (bot && mood === 'friendly') return { eyes: 'happy', jaw: 'smile', damage: 0 };
  if (tier <= 0) return { eyes: 'happy', jaw: 'smile', damage: 0 };
  if (tier === 1) return bot ? { eyes: 'glow', jaw: 'drop', damage: 0 } : { eyes: 'glow', jaw: 'drop', damage: 1 };
  return bot ? { eyes: 'evil', jaw: 'hang', damage: 0 } : { eyes: 'endo', jaw: 'hang', damage: 2 };
}

function charOpts(id, tier, frame) {
  const c = CAST[id] || CAST.rusty;
  const d = Math.max(0, Math.min(2, tier));
  const pal = { fur: dull(c.fur, d), belly: dull(c.belly, d), mask: dull(c.mask, d), snout: dull(c.snout, d), iris: c.iris, accent: c.accent };
  return { kind: c.kind, pal, hat: c.hat, prop: c.prop, look: lookFor(d), frame };
}
function botOpts(bot, tier, { mood = 'chase', frame = 0, has = null, ghost = false } = {}) {
  const col = bot.color || '#4fb6ff';
  const look = lookFor(tier, true, mood);
  const k = bot.kind || 'bunny';
  const pal = {
    fur: col, belly: k === 'penguin' ? '#f4f1ea' : mix(col, '#ffffff', 0.55), mask: mul(col, 0.45),
    snout: k === 'penguin' ? '#ffb030' : mix(col, '#ffffff', 0.7), iris: '#19c9a8', accent: '#ffd84a', bow: '#ffd84a',
  };
  return { kind: k, pal, look, frame, bot: true, has, ghost };
}

// ------------------------------------------------------------------ turning SVGs into canvases (cached)
const cache = new Map();
const SCALE = 1.6; // canvases are drawn this many times bigger than 300 × 520 so close-ups stay sharp
function render(key, svg) {
  let e = cache.get(key);
  if (e) return e.canvas;
  e = { canvas: null, p: null };
  cache.set(key, e);
  e.p = new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = Math.round((ART_W + 20) * SCALE); c.height = Math.round((ART_H + 20) * SCALE);
      const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
      e.canvas = c; res(c);
    };
    img.onerror = () => res(null);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
  return null;
}
const keyOf = (b, o) => `${b.kind}|${b.color}|${o.mood || 'chase'}|${o.frame || 0}|${o.has ? [...o.has].sort().join(',') : '*'}|${o.ghost ? 1 : 0}`;

export const Art = {
  /** Canvas for a cast member (null while it's still being made). */
  char(id, tier, frame = 0) { const k = `c|${id}|${tier}|${frame}`; return render(k, svgFor(charOpts(id, tier, frame))); },
  /** Canvas for a built robot. o = { mood: 'friendly'|'chase', frame, has, ghost } */
  bot(bot, tier, o = {}) { const k = `b|${tier}|${keyOf(bot, o)}`; return render(k, svgFor(botOpts(bot, tier, o))); },
  /** Make everything for this tier ahead of time. */
  preload(tier, bots = []) {
    const ids = Object.keys(CAST);
    for (const id of ids) { this.char(id, tier, 0); this.char(id, tier, 1); this.char(id, 0, 0); }
    for (const b of bots) { this.bot(b, tier, { frame: 0 }); this.bot(b, tier, { frame: 1 }); this.bot(b, 0, { mood: 'friendly' }); }
    return Promise.all([...cache.values()].map(e => e.p));
  },
  whenReady() { return Promise.all([...cache.values()].map(e => e.p)); },
};

/**
 * Draw a cast member centered at (cx, cy). s ≈ body height in px (the old drawCharacter size), so old callers work.
 * The picture is a bit taller than s (ears, hat). opts: { tier, walking, alpha }
 */
export function drawAnimatronic(ctx, id, cx, cy, s, t = 0, opts = {}) {
  const tier = opts.tier ?? 0;
  const frame = opts.walking ? (Math.floor(t * 4) % 2) : 0;
  const c = Art.char(id, tier, frame) || Art.char(id, tier, 0);
  drawPic(ctx, c, cx, cy, s, t, opts);
}
const lastPic = new Map(); // while the next picture of a robot is being made, keep showing the one before
export function drawRobot(ctx, bot, cx, cy, s, t = 0, opts = {}) {
  const tier = opts.tier ?? 0;
  const frame = opts.walking ? (Math.floor(t * 4) % 2) : 0;
  const o = { mood: opts.mood || 'chase', frame, has: opts.has || null, ghost: !!opts.ghost };
  const k = `${bot.kind}|${bot.color}|${o.mood}|${opts.has ? 'has' : 'all'}`;
  let c = Art.bot(bot, tier, o) || (opts.has ? null : Art.bot(bot, tier, { ...o, frame: 0 }));
  if (c) lastPic.set(k, c); else c = lastPic.get(k) || null;
  drawPic(ctx, c, cx, cy, s, t, opts);
}
function drawPic(ctx, c, cx, cy, s, t, opts) {
  if (!c) return;
  const H = s * 1.3, W = H * c.width / c.height;
  const bob = opts.walking ? Math.abs(Math.sin(t * 8)) * s * 0.025 : Math.sin(t * 2) * s * 0.006;
  ctx.save();
  if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
  ctx.drawImage(c, cx - W / 2, cy - H * 0.56 - bob, W, H);
  ctx.restore();
}
/** Where the eyes are when drawn with drawAnimatronic (for glowing eyes over the dark). */
export function eyeScreen(id, cx, cy, s) {
  const c = CAST[id] || CAST.rusty, H = s * 1.3, W = H * (ART_W + 20) / (ART_H + 20);
  const x0 = cx - W / 2, y0 = cy - H * 0.56, k = H / (ART_H + 20);
  return eyePoints(c.kind).map(([x, y]) => [x0 + (x + 10) * k, y0 + (y + 10) * k]);
}

export { gradeTier };

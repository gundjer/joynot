// Play styles ("modes"). Same questions, different game wrapped around them, like Blooket and Prodigy.
// 🥚 Critter Hatchery (collect creatures)  🏎️ Turbo Race (beat the rival)
// 🧱 Block Builder (build your world)      🐉 Dungeon Quest (heroes, d20 dice, bosses)
// The strip above the question shows the action; the end of the round shows the reward.
// Rewards live in "meta": shared by every JoyNot game on this device and backed up in each game's save.
import { el } from './util.js';

export const MODE_LIST = [
  { key: 'hatch', icon: '🥚', name: 'Critter Hatchery', blurb: 'Warm the egg with right answers. Every round hatches a critter for your collection!' },
  { key: 'race', icon: '🏁', name: 'Turbo Race', blurb: 'Right answers give your kart a boost. Beat the rival to the finish line!' },
  { key: 'build', icon: '🧱', name: 'Block Builder', blurb: 'Every answer places blocks. Finish a new build for your world each round!' },
  { key: 'dungeon', icon: '🐉', name: 'Dungeon Quest', blurb: 'Pick a hero, roll the d20 and defeat monsters. A boss waits at the end!' },
];
export const HEROES = { knight: ['🛡️', 'Knight'], wizard: ['🧙', 'Wizard'], ranger: ['🏹', 'Ranger'] };
export const defaultMode = ed => (ed <= 1 ? 'hatch' : ed <= 3 ? 'race' : 'dungeon');

// ------------------------------------------------------------------ shared rewards (meta)
const CRITTERS = [
  // common
  ['🐰', 'Hoppy', 0], ['🐹', 'Nibbles', 0], ['🐸', 'Ribbit', 0], ['🐢', 'Shelly', 0], ['🐞', 'Dotty', 0], ['🐥', 'Peep', 0], ['🐷', 'Oinkers', 0], ['🐮', 'Moo-Moo', 0], ['🐱', 'Whiskers', 0], ['🐶', 'Biscuit', 0],
  // uncommon
  ['🦊', 'Blaze', 1], ['🐼', 'Bamboo', 1], ['🐨', 'Snoozy', 1], ['🐧', 'Waddles', 1], ['🦉', 'Hoot', 1], ['🐬', 'Splash', 1], ['🐙', 'Inky', 1], ['🦀', 'Pinchy', 1], ['🦔', 'Spike', 1],
  // rare
  ['🦁', 'Roary', 2], ['🐯', 'Stripes', 2], ['🦄', 'Sparkle', 2], ['🦋', 'Flutter', 2], ['🦜', 'Echo', 2], ['🦒', 'Tallulah', 2], ['🦓', 'Zigzag', 2], ['🦈', 'Chomp', 2],
  // legendary
  ['🐉', 'Ember', 3], ['🦖', 'Rex', 3], ['🦕', 'Longneck', 3], ['🦚', 'Prism', 3],
];
const RARITY = [['Common', '#8a94a6'], ['Uncommon', '#2fa36b'], ['Rare', '#3a7bd5'], ['Legendary', '#e0a000']];
export const CRITTER_COUNT = CRITTERS.length;

// Build plans: rows top→bottom, 10 wide. Letters are block colors, '.' is empty.
const BLOCK = { w: '#c8894e', W: '#8d5a2b', r: '#d94d3a', g: '#4caf50', G: '#2e7d32', s: '#9aa3ad', S: '#6b7480', b: '#5aa9e6', B: '#2c6fb3', y: '#ffc93c', o: '#ff8c3a', p: '#b06ad9', k: '#3a3a4a', t: '#e8d6a8', l: '#d6f0ff' };
const BUILDS = [
  { k: 'house', name: 'Cozy House', plan: ['....rr....', '...rrrr...', '..rrrrrr..', '.rrrrrrrr.', '.wwwwwwww.', '.wllwwllw.', '.wwwWWwww.', '.wwwWWwww.'] },
  { k: 'tree', name: 'Giant Oak', plan: ['...gggg...', '..gGgggg..', '.ggggGggg.', '.gGgggggg.', '..gggggg..', '....WW....', '....WW....', '...WWWW...'] },
  { k: 'rocket', name: 'Star Rocket', plan: ['....rr....', '...ssss...', '...sbbs...', '...ssss...', '...ssss...', '..rssssr..', '.rr.oo.rr.', '....yy....'] },
  { k: 'castle', name: 'Stone Castle', plan: ['s.s....s.s', 'sss....sss', 'ssssssssss', 'sSssssssSs', 'ssssssssss', 'sssskksss.', 'sssskkssss', 'ssssssssss'] },
  { k: 'boat', name: 'Sailboat', plan: ['....y.....', '....yy....', '....yyy...', '....yyyy..', '....W.....', 'WWWWWWWWWW', '.WWWWWWWW.', 'bbBbbbBbbb'] },
  { k: 'robot', name: 'Robo Pal', plan: ['....yy....', '...ssss...', '...sbbs...', '...ssss...', '.ssssssss.', '.s.ssss.s.', '...ssss...', '...s..s...'] },
  { k: 'pyramid', name: 'Desert Pyramid', plan: ['..........', '....tt....', '...tttt...', '..tttttt..', '.tttttttt.', 'tttttttttt', 'tttttttttt', 'yyyyyyyyyy'] },
  { k: 'windmill', name: 'Windmill', plan: ['.p.....p..', '..p...p...', '...p.p....', '....W.....', '...p.p....', '...WWW....', '..WWkWW...', '..WWkWW...'] },
  { k: 'lighthouse', name: 'Lighthouse', plan: ['....yy....', '...kkkk...', '....rr....', '....ww....', '...rrrr...', '...wwww...', '..rrrrrr..', 'bbbbbbbbbb'] },
  { k: 'space', name: 'Space Station', plan: ['..........', 'bb..ss..bb', 'bbssssssbb', 'bb.sbbs.bb', 'bbssssssbb', 'bb..ss..bb', '....ss....', '..........'] },
];
const LOOT = ['Flame Sword', 'Frost Staff', 'Thunder Bow', 'Dragon Shield', 'Moon Cloak', 'Boots of Speed', 'Crystal Wand', 'Golden Helm', 'Owl Amulet', 'Ring of Focus', 'Star Map', 'Phoenix Feather', 'Map of Secrets', 'Lucky Dice', 'Storm Hammer'];
const MONSTERS = ['👾', '👻', '🦇', '🕷️', '💀', '🧟', '👺', '🐍', '🦂', '👹'];

const metaKey = id => `joynot_meta_kid_${id}_v1`;
const blank = () => ({ critters: {}, gold: 0, loot: [], builds: [], hero: 'knight', races: 0, wins: 0, cups: 0, bosses: 0 });
/** Load the kid's rewards: device copy merged with this game's backup (keeps the bigger of everything). */
export function loadMeta(d, kidId) {
  let local = null;
  try { local = JSON.parse(localStorage.getItem(metaKey(kidId))); } catch (e) {}
  const a = { ...blank(), ...(local || {}) }, b = { ...blank(), ...((d.extra && d.extra.meta && !Array.isArray(d.extra.meta)) ? d.extra.meta : {}) };
  const m = blank();
  for (const k of ['gold', 'races', 'wins', 'cups', 'bosses']) m[k] = Math.max(a[k] || 0, b[k] || 0);
  const ca = a.critters && !Array.isArray(a.critters) ? a.critters : {}, cb = b.critters && !Array.isArray(b.critters) ? b.critters : {};
  for (const k of new Set([...Object.keys(ca), ...Object.keys(cb)])) m.critters[k] = Math.max(ca[k] || 0, cb[k] || 0);
  m.loot = [...new Set([...(a.loot || []), ...(b.loot || [])])];
  const seen = new Set(); m.builds = [...(a.builds || []), ...(b.builds || [])].filter(x => x && !seen.has(x.at + x.k) && seen.add(x.at + x.k)).sort((x, y) => x.at - y.at).slice(-60);
  m.hero = (local && local.hero) || b.hero || 'knight';
  return m;
}
export function saveMeta(d, kidId, m) {
  d.extra.meta = m;
  try { localStorage.setItem(metaKey(kidId), JSON.stringify(m)); } catch (e) {}
}
export const critterCount = m => Object.keys(m.critters || {}).length;

// ------------------------------------------------------------------ helpers
export const kartSvg = (color, label) => `<svg viewBox="0 0 64 34" class="kart" aria-label="${label}"><path d="M8 22 L14 12 H36 L44 18 H56 Q60 18 60 23 V26 H6 V24 Z" fill="${color}"/><path d="M18 12 L22 5 H30 L33 12 Z" fill="rgba(255,255,255,.75)"/><circle cx="26" cy="9" r="4" fill="#ffe0b8"/><rect x="21" y="3" width="10" height="4" rx="2" fill="#333"/><circle cx="16" cy="27" r="6" fill="#222"/><circle cx="16" cy="27" r="2.4" fill="#bbb"/><circle cx="48" cy="27" r="6" fill="#222"/><circle cx="48" cy="27" r="2.4" fill="#bbb"/></svg>`;
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pickArr = a => a[Math.floor(Math.random() * a.length)];

function hatchRarity(ratio, boss) {
  if (boss) return 3;
  const r = Math.random();
  if (ratio >= 1) return r < 0.3 ? 3 : 2;
  if (ratio >= 0.8) return r < 0.12 ? 3 : r < 0.6 ? 2 : 1;
  if (ratio >= 0.5) return r < 0.25 ? 2 : r < 0.7 ? 1 : 0;
  return r < 0.35 ? 1 : 0;
}
function pickCritter(m, rarity) {
  const pool = CRITTERS.filter(c => c[2] === rarity);
  const fresh = pool.filter(c => !m.critters[c[0]]);
  return pickArr(fresh.length && Math.random() < 0.8 ? fresh : pool);
}

// ------------------------------------------------------------------ the modes
/** host: { strip, total, edition, boss, meta, kid, sfx } */
export function createMode(key, host) {
  const f = { hatch: hatchMode, race: raceMode, build: buildMode, dungeon: dungeonMode }[key];
  if (!f) return null;
  host.strip.innerHTML = '';
  host.strip.className = 'modestrip m-' + key + (host.boss ? ' boss' : '');
  return f(host);
}

function hatchMode(h) {
  let warmth = 0;
  const egg = el('div', { class: 'egg' + (h.boss ? ' golden' : '') }, [el('span', { class: 'egg-ic' }, h.boss ? '🌟' : '🥚'), el('i', { class: 'crack' })]);
  const meter = el('div', { class: 'meter' }, [el('span')]);
  const label = el('div', { class: 'ms-label' }, h.boss ? '🌟 Golden Egg: show what you know!' : `🥚 Warm the egg! · Collection ${critterCount(h.meta)}/${CRITTER_COUNT}`);
  h.strip.append(egg, el('div', { class: 'ms-mid' }, [label, meter]));
  const paint = () => { const p = Math.min(1, warmth / h.total); meter.firstChild.style.width = (p * 100) + '%'; egg.style.setProperty('--crack', p.toFixed(2)); };
  paint();
  return {
    answer({ clean, correct }) {
      warmth += clean ? 1 : correct ? 0.6 : 0.2;
      paint();
      egg.classList.remove('wiggle'); void egg.offsetWidth; if (correct) egg.classList.add('wiggle');
    },
    finish({ clean, total, passed }) {
      const ratio = clean / Math.max(1, total);
      const rar = h.boss ? (passed ? 3 : 1) : hatchRarity(ratio, false);
      const c = pickCritter(h.meta, rar);
      const isNew = !h.meta.critters[c[0]];
      h.meta.critters[c[0]] = (h.meta.critters[c[0]] || 0) + 1;
      return {
        title: isNew ? `${c[1]} hatched!` : `Another ${c[1]}!`,
        html: `<div class="reward hatch"><div class="big-ic pop">${c[0]}</div><div><b style="color:${RARITY[c[2]][1]}">${RARITY[c[2]][0]}</b> critter${isNew ? ' · <b>NEW!</b>' : ''}<br><small>Collection: ${critterCount(h.meta)} of ${CRITTER_COUNT}. More first-try answers hatch rarer critters!</small></div></div>`,
        say: `${c[1]} hatched! A ${RARITY[c[2]][0]} critter!`,
      };
    },
  };
}

function raceMode(h) {
  // Rival pace: about how a kid who is getting it does. A Grade Check uses the graduation pace.
  const pace = h.boss ? 0.8 : h.edition <= 1 ? 0.55 : h.edition <= 3 ? 0.66 : 0.76;
  let me = 0, rival = 0, n = 0;
  const track = el('div', { class: 'track' });
  track.innerHTML = `<div class="lane"></div><div class="lane"></div><div class="finish">🏁</div>
    <div class="car me" style="--p:0">${kartSvg(h.kid.color || '#ff6b4a', 'your kart')}<span class="who">${h.kid.avatar || ''}</span></div>
    <div class="car rival" style="--p:0">${kartSvg(h.boss ? '#e0a000' : '#7a6cff', 'rival kart')}<span class="who">${h.boss ? '🏆' : '🤖'}</span></div>`;
  const label = el('div', { class: 'ms-label' }, h.boss ? '🏆 Championship Cup! Win to graduate.' : `🏁 Turbo Race · Wins: ${h.meta.wins || 0}`);
  h.strip.append(label, track);
  const carMe = track.querySelector('.me'), carRv = track.querySelector('.rival');
  const paint = () => { carMe.style.setProperty('--p', Math.min(1, me / h.total).toFixed(3)); carRv.style.setProperty('--p', Math.min(1, rival / h.total).toFixed(3)); };
  return {
    answer({ clean, correct }) {
      n++;
      me += clean ? 1 : correct ? 0.6 : 0.25;
      rival = n * pace;
      carMe.classList.remove('boost', 'skid'); void carMe.offsetWidth;
      carMe.classList.add(clean ? 'boost' : correct ? 'boost' : 'skid');
      paint();
    },
    finish({ passed }) {
      const win = h.boss ? passed : me >= rival;
      h.meta.races = (h.meta.races || 0) + 1;
      if (win) { h.meta.wins = (h.meta.wins || 0) + 1; if (h.boss) h.meta.cups = (h.meta.cups || 0) + 1; }
      const gap = Math.abs(me - rival).toFixed(1);
      return {
        title: win ? (h.boss ? '🏆 Champion!' : '🥇 You won the race!') : '🥈 So close!',
        html: `<div class="reward race"><div class="big-ic">${win ? '🥇' : '🥈'}</div><div>${win ? 'You crossed the finish line first!' : `The rival won by just ${gap}. First-try answers give the biggest boosts!`}<br><small>Races won: ${h.meta.wins} of ${h.meta.races}${h.meta.cups ? ` · 🏆 Cups: ${h.meta.cups}` : ''}</small></div></div>`,
        say: win ? 'You won the race!' : 'So close! First try answers give the biggest boosts.',
      };
    },
  };
}

function buildMode(h) {
  const plan = h.boss ? { k: 'grand', name: 'Grand Castle', plan: ['y.y.yy.y.y', 'ssssssssss', 'sSssssssSs', 'ssyssssyss', 'ssssssssss', 'sSsskksSss', 'ssssksksss', 'gggggggggg'] } : BUILDS[(h.meta.builds || []).length % BUILDS.length];
  const cells = [];
  plan.plan.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') cells.push({ x, y, ch }); }));
  cells.sort((a, b) => b.y - a.y || a.x - b.x); // build from the ground up
  let placed = 0, gold = 0;
  const grid = el('div', { class: 'bgrid' });
  const nodes = cells.map(c => { const n = el('i', { style: { gridColumn: c.x + 1, gridRow: c.y + 1, '--c': BLOCK[c.ch] || '#999' } }); grid.appendChild(n); return n; });
  const label = el('div', { class: 'ms-label' }, h.boss ? '🏰 Grand Castle: show what you know!' : `🧱 Building: ${plan.name} · World: ${(h.meta.builds || []).length} builds`);
  h.strip.append(grid, el('div', { class: 'ms-mid' }, [label, el('small', { class: 'ms-sub' }, 'First-try answers place ✨ golden blocks')]));
  let n = 0;
  return {
    answer({ clean, correct }) {
      n++;
      const upto = Math.round(cells.length * n / h.total);
      for (; placed < upto; placed++) { nodes[placed].classList.add('on'); if (clean) { nodes[placed].classList.add('gold'); gold++; } else if (!correct) nodes[placed].classList.add('crack'); }
    },
    finish({ clean, total, passed }) {
      for (; placed < cells.length; placed++) nodes[placed].classList.add('on');
      const golden = clean === total;
      const entry = { k: plan.k, at: Date.now(), gold: golden };
      if (!h.boss || passed) h.meta.builds = [...(h.meta.builds || []), entry].slice(-60);
      const big = grid.cloneNode(true); big.className = 'bgrid big';
      const box = el('div', { class: 'reward build' }, [big, el('div', {}, [el('b', {}, golden ? `✨ Golden ${plan.name}!` : `${plan.name} built!`), el('br'), el('small', {}, `${gold} golden blocks · Your world has ${(h.meta.builds || []).length} builds`)])]);
      return { title: h.boss ? (passed ? '🏰 Grand Castle complete!' : 'Almost finished the castle!') : golden ? '✨ Perfect build!' : '🧱 Build complete!', node: box, say: `${plan.name} built!` };
    },
  };
}

function dungeonMode(h) {
  const [heroIc, heroName] = HEROES[h.meta.hero] || HEROES.knight;
  let n = 0, gold = 0, crits = 0, bossHp = h.total;
  const hero = el('div', { class: 'hero' }, [el('span', { class: 'h-av' }, h.kid.avatar || '🙂'), el('span', { class: 'h-cls' }, heroIc)]);
  const mon = el('div', { class: 'mon' }, h.boss ? '🐉' : pickArr(MONSTERS));
  const die = el('div', { class: 'd20' }, '20');
  const hp = el('div', { class: 'meter hp' }, [el('span', { style: { width: '100%' } })]);
  const label = el('div', { class: 'ms-label' }, h.boss ? '🎓 The Grade Guardian blocks the way!' : `⚔️ ${heroName} · 💰 ${h.meta.gold || 0}`);
  h.strip.append(hero, el('div', { class: 'ms-mid' }, [label, die, h.boss ? hp : el('span')]), mon);
  const nextMonster = () => { if (h.boss) return; mon.textContent = n === h.total - 1 ? '🐲' : pickArr(MONSTERS); mon.classList.toggle('bossy', n === h.total - 1); mon.className = mon.className.replace(/\b(poof|dodge)\b/g, ''); };
  if (!h.boss && h.total === 1) nextMonster();
  return {
    answer({ clean, correct }) {
      n++;
      const roll = clean ? ri(8, 20) : correct ? ri(3, 14) : ri(1, 7);
      die.textContent = roll; die.classList.remove('roll'); void die.offsetWidth; die.classList.add('roll');
      die.classList.toggle('crit', clean && roll >= 18);
      hero.classList.remove('lunge'); void hero.offsetWidth; if (correct) hero.classList.add('lunge');
      if (correct) {
        const g = (clean ? 3 : 1) * (clean && roll >= 18 ? 2 : 1);
        gold += g; if (clean && roll >= 18) crits++;
        if (h.boss) { bossHp -= 1; hp.firstChild.style.width = Math.max(0, bossHp / h.total * 100) + '%'; mon.classList.remove('hit'); void mon.offsetWidth; mon.classList.add('hit'); }
        else mon.classList.add('poof');
      } else if (!h.boss) mon.classList.add('dodge');
      if (!h.boss) setTimeout(nextMonster, 900);
    },
    finish({ passed }) {
      h.meta.gold = (h.meta.gold || 0) + gold;
      let found = '';
      if ((h.boss && passed) || Math.random() < 0.35 + crits * 0.1) {
        const left = LOOT.filter(x => !(h.meta.loot || []).includes(x));
        if (left.length) { found = pickArr(left); h.meta.loot = [...(h.meta.loot || []), found]; }
      }
      if (h.boss && passed) h.meta.bosses = (h.meta.bosses || 0) + 1;
      return {
        title: h.boss ? (passed ? '🎓 Guardian defeated!' : 'The Guardian is still standing…') : '⚔️ Dungeon cleared!',
        html: `<div class="reward dungeon"><div class="big-ic">${found ? '🎁' : '💰'}</div><div>+${gold} gold${crits ? ` · ${crits} critical hit${crits > 1 ? 's' : ''}!` : ''}${found ? `<br>Treasure chest: <b>${found}</b>!` : ''}<br><small>💰 ${h.meta.gold} gold · 🎒 ${(h.meta.loot || []).length} treasures</small></div></div>`,
        say: found ? `Dungeon cleared! You found the ${found}!` : 'Dungeon cleared!',
      };
    },
  };
}

// ------------------------------------------------------------------ "My stuff" collection view
export function collectionView(m) {
  const box = el('div', { class: 'coll' });
  const crit = CRITTERS.map(c => `<span class="cr${m.critters[c[0]] ? ' got' : ''}" title="${m.critters[c[0]] ? c[1] : '???'}" style="--rc:${RARITY[c[2]][1]}">${m.critters[c[0]] ? c[0] : '❔'}${m.critters[c[0]] > 1 ? `<small>×${m.critters[c[0]]}</small>` : ''}</span>`).join('');
  const builds = (m.builds || []).slice(-12).map(b => { const B = BUILDS.find(x => x.k === b.k); return `<span class="bt${b.gold ? ' gold' : ''}">${B ? B.name : '🏰 Grand Castle'}</span>`; }).join('') || '<small>No builds yet. Try 🧱 Block Builder!</small>';
  box.innerHTML = `<h3>🥚 Critters ${critterCount(m)}/${CRITTER_COUNT}</h3><div class="crits">${crit}</div>
    <h3>🧱 My world (${(m.builds || []).length} builds)</h3><div class="builds">${builds}</div>
    <h3>🐉 Hero bag</h3><p>💰 ${m.gold || 0} gold · 🎓 ${m.bosses || 0} guardians beaten<br>${(m.loot || []).map(x => `<span class="bt">${x}</span>`).join('') || '<small>No treasure yet. Try 🐉 Dungeon Quest!</small>'}</p>
    <h3>🏁 Races</h3><p>🥇 ${m.wins || 0} wins of ${m.races || 0} · 🏆 ${m.cups || 0} cups</p>`;
  return box;
}

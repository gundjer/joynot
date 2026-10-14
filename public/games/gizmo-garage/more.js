// Gizmo Garage: more questions plus generators with fresh numbers, so every round is new.
import { pick, shuffle, rand, sample } from '../_joy/js/util.js';

const q = (level, prompt, ans, wrong, explain, extra = {}) => ({ kind: 'mc', key: `gg${level}-${prompt}`, prompt, ans, opts: shuffle([ans, ...wrong]), expected: ans, explain, ...extra });
const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th'];

export function addGizmoBanks(BANK, PUSHPULL) {
  PUSHPULL.push(['🧹', 'sweeping dirt away with a broom', 'push'], ['🎣', 'reeling in a fish', 'pull'], ['🚪', 'closing a door away from you', 'push'], ['🧲', 'a magnet sticking to the fridge', 'pull'],
    ['⚽', 'throwing a ball to a friend', 'push'], ['🎒', 'picking up your backpack', 'pull'], ['🛒', 'pushing a stroller', 'push'], ['🌱', 'pulling a weed out of the ground', 'pull'], ['🎹', 'pressing a piano key', 'push']);
  BANK[2].push(
    ['Which would be EASIEST to move across the room?', 'A box on a cart with wheels', ['A box sliding on carpet', 'A box you drag on its corner'], 'Wheels roll, so there is much less friction.'],
    ['Which surface has the MOST friction?', 'Sandpaper', ['Ice', 'A smooth slide'], 'Rough surfaces grab and slow things down.'],
    ['Why do sneakers have bumpy bottoms?', 'More friction so you don’t slip', ['To make noise', 'To be lighter'], 'Friction can be helpful too!'],
    ['A skateboard rolls easily because…', 'Its wheels turn on axles', ['It is flat', 'It is painted'], 'Wheel + axle = a simple machine that cuts friction.'],
    ['Which of these is NOT a wheel and axle?', 'A slide', ['A steering wheel', 'A bike wheel'], 'A slide is a ramp (inclined plane).'],
    ['What happens to a toy car on carpet compared to a smooth floor?', 'It slows down faster on carpet', ['It goes faster on carpet', 'Nothing is different'], 'Carpet has more friction.'],
  );
  BANK[3].push(
    ['Which is a ramp?', 'A slide at the playground', ['A doorknob', 'A seesaw'], 'A slide is a tilted flat surface: an inclined plane.'],
    ['Movers push a heavy piano up a ramp into the truck instead of lifting it. Why?', 'The ramp makes the push smaller', ['The piano gets lighter on a ramp', 'Ramps are faster'], 'You push less, but over a longer distance.'],
    ['Mountain roads zig-zag back and forth. Why?', 'Each part is a gentler ramp, so cars climb more easily', ['To make the trip shorter', 'To see more trees'], 'Zig-zags are long, gentle ramps.'],
    ['A ball rolls down a steep ramp and a gentle ramp. Which goes faster at the bottom?', 'The steep ramp', ['The gentle ramp', 'Always the same'], 'Steeper ramps let gravity speed things up more quickly.'],
  );
  BANK[4].push(
    ['Which part of your body works like a lever?', 'Your arm (the elbow is the fulcrum)', ['Your hair', 'Your ear'], 'Your muscles pull on your arm bone, and the elbow is the pivot.'],
    ['A bottle opener is a lever. Where is the fulcrum?', 'The edge that rests on the cap', ['The handle end', 'Inside the bottle'], 'The opener pivots on the cap’s edge to pry it up.'],
    ['On a seesaw, a big kid and a small kid want to balance. Where should the big kid sit?', 'Closer to the middle', ['At the very end', 'It doesn’t matter'], 'Sitting closer to the fulcrum gives the heavier kid less turning power.'],
    ['Which is easier for opening a paint can lid: a short spoon or a long screwdriver?', 'The long screwdriver', ['The short spoon', 'They are the same'], 'A longer lever arm needs less push.'],
  );
  BANK[7].push(
    ['A window blind goes up when you pull the cord down. What machine is that?', 'A pulley', ['A wedge', 'A screw'], 'The cord runs over little wheels at the top.'],
    ['What is the trade-off when a pulley makes lifting easier?', 'You pull more rope', ['The box gets heavier', 'Nothing'], 'Half the force means twice the rope.'],
    ['What does a pulley wheel have around its edge?', 'A groove for the rope', ['Teeth', 'A screw thread'], 'The groove keeps the rope from slipping off.'],
  );
  BANK[8].push(
    ['Which is a wedge?', 'A knife blade', ['A wheel', 'A seesaw'], 'Thin edge + thick back = a wedge that splits things.'],
    ['Why is a long, thin screw easier to turn into wood than a fat, steep one?', 'Its ramp is longer and gentler', ['It is lighter', 'Wood likes thin things'], 'A screw is a ramp: gentler ramp = easier push, more turns.'],
    ['A zipper uses little wedges to…', 'Push the teeth together and apart', ['Spin a wheel', 'Lift a flag'], 'The slider has wedges inside!'],
    ['A light bulb base, a bottle cap and a car jack all use a…', 'Screw', ['Pulley', 'Wedge'], 'Twisting along a spiral thread moves things in or up.'],
  );
  BANK[9].push(
    ['A wheelbarrow uses a wheel and axle and a…', 'Lever', ['Pulley', 'Screw'], 'The wheel is the fulcrum, the load is in the middle and you lift the handles.'],
    ['An escalator uses a motor, gears and a long moving…', 'Ramp of steps on a belt', ['Pulley rope only', 'Screw'], 'Escalators combine many machines.'],
    ['A pencil sharpener uses a wedge and a…', 'Wheel and axle (the crank)', ['Pulley', 'Seesaw'], 'Turning the crank spins sharp wedge blades.'],
  );
}

/** Generators: brand-new numbers every time. Return a full question object, or null. */
export const GIZMO_GEN = {
  3: () => {
    const len = shuffle([4, 8, 12]).slice(0, 2), h = rand(1, 3);
    const easy = Math.max(...len), hard = Math.min(...len);
    return q(3, `Two ramps both go up ${h} ft. Ramp A is ${len[0]} ft long. Ramp B is ${len[1]} ft long. Which needs LESS push?`, `Ramp ${len[0] === easy ? 'A' : 'B'} (${easy} ft long)`, [`Ramp ${len[0] === hard ? 'A' : 'B'} (${hard} ft long)`, 'They need the same push'],
      'Same height, but the longer ramp is less steep, so each step takes less force.', { sim: 'ramp', steps: ['Both ramps lift the box the same height.', `The ${easy} ft ramp spreads that climb over more distance.`, 'Longer and less steep = less push.'] });
  },
  5: () => {
    const n = rand(2, 5), k = rand(2, n), dir0 = pick(['clockwise', 'counter-clockwise']), other = dir0 === 'clockwise' ? 'counter-clockwise' : 'clockwise';
    const ans = k % 2 === 1 ? dir0 : other;
    return q(5, `${n} gears in a row. The 1st gear turns ${dir0}. Which way does the ${ORD[k]} gear turn?`, ans[0].toUpperCase() + ans.slice(1), [(ans === dir0 ? other : dir0).replace(/^./, c => c.toUpperCase())],
      'Touching gears turn opposite ways. Odd gears (1st, 3rd, 5th) match the first gear; even gears turn the other way.',
      { sim: 'gears', teeth: Array(n).fill(12), steps: Array.from({ length: k }, (_, i) => `Gear ${i + 1}: ${i % 2 === 0 ? dir0 : other}`).concat([`So gear ${k} turns ${ans}.`]) });
  },
  6: () => {
    const small = pick([6, 8, 10, 12]), m = rand(2, 4), big = small * m, turns = rand(1, 3);
    if (Math.random() < 0.5) return q(6, `A ${big}-tooth gear drives a ${small}-tooth gear. The big gear turns ${turns} time${turns > 1 ? 's' : ''}. How many times does the small gear turn?`, `${m * turns} times`, [`${turns} time${turns > 1 ? 's' : ''}`, `${big * turns} times`],
      `Each turn of the big gear pushes ${big} teeth past. The small gear needs ${big} ÷ ${small} = ${m} turns to keep up. ${m} × ${turns} = ${m * turns}.`, { sim: 'gears2', teeth: [big, small], steps: [`${big} ÷ ${small} = ${m}: the small gear turns ${m} times for each big turn.`, `${m} × ${turns} = ${m * turns} turns.`] });
    return q(6, `A small ${small}-tooth gear drives a big ${big}-tooth gear. Which turns faster?`, `The small ${small}-tooth gear`, [`The big ${big}-tooth gear`, 'They turn at the same speed'],
      `The small gear must turn ${m} times to make the big gear turn once.`, { sim: 'gears2', teeth: [small, big] });
  },
  7: () => {
    const ropes = rand(2, 4), load = ropes * rand(5, 25) * (ropes === 3 ? 2 : 1);
    return q(7, `${ropes} rope sections hold up a ${load} lb box with pulleys. How hard do you pull?`, `${load / ropes} lb`, [`${load} lb`, `${load * ropes} lb`],
      `The ropes share the weight: ${load} ÷ ${ropes} = ${load / ropes} lb. You pull ${ropes} times as much rope, though!`, { sim: 'pulley', steps: [`Count the ropes holding the box: ${ropes}.`, `Share the weight: ${load} ÷ ${ropes} = ${load / ropes} lb.`] });
  },
  10: () => {
    const v = rand(0, 2);
    if (v === 0) {
      const d1 = rand(1, 4), w1 = rand(2, 9) * 10, d2 = pick([2, 4, 5, 8].filter(x => (w1 * d1) % x === 0 && x !== d1)) || d1 * 2, w2 = (w1 * d1) / d2;
      return q(10, `Lever balance: ${w1} lb sits ${d1} ft from the fulcrum. What weight balances it ${d2} ft away on the other side?`, `${w2} lb`, [`${w1 * d2} lb`, `${w1} lb`], `Weight × distance must match on both sides: ${w1} × ${d1} = ${w1 * d1}, and ${w2} × ${d2} = ${w1 * d1}.`,
        { steps: [`Turning power on side 1: ${w1} × ${d1} = ${w1 * d1}.`, `Side 2 needs the same: ? × ${d2} = ${w1 * d1}.`, `${w1 * d1} ÷ ${d2} = ${w2} lb.`] });
    }
    if (v === 1) {
      const small = pick([8, 10, 12, 15]), m = rand(2, 5), rpm = rand(2, 6) * 10;
      return q(10, `A ${small * m}-tooth gear spins ${rpm} times a minute and drives a ${small}-tooth gear. How fast does the small gear spin?`, `${rpm * m} times a minute`, [`${rpm} times a minute`, `${rpm + m} times a minute`],
        `Gear ratio = ${small * m} ÷ ${small} = ${m}. ${rpm} × ${m} = ${rpm * m}.`, { sim: 'gears2', teeth: [small * m, small], steps: [`Ratio: ${small * m} ÷ ${small} = ${m}.`, `Small gear speed: ${rpm} × ${m} = ${rpm * m} turns a minute.`] });
    }
    const ropes = rand(2, 6), pull = rand(4, 20) * 5;
    return q(10, `You can pull with ${pull} lb of force. With ${ropes} rope sections, what is the heaviest load you can lift?`, `${pull * ropes} lb`, [`${pull} lb`, `${pull + ropes} lb`], `Each rope holds ${pull} lb: ${pull} × ${ropes} = ${pull * ropes} lb.`,
      { sim: 'pulley', steps: [`Each rope section can hold your pull: ${pull} lb.`, `${ropes} ropes × ${pull} lb = ${pull * ropes} lb.`] });
  },
};

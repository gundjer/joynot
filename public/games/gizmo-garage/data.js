// Gizmo Garage data: question banks, lessons, and little DOM machine simulators used in the lesson cards.
import { el, pick, sample, shuffle, rand } from '../_joy/js/util.js';
import { pics, note, stack, eq } from '../_joy/js/lesson.js';
import { addGizmoBanks, GIZMO_GEN } from './more.js';
export { GIZMO_GEN };

// ---------------------------------------------------------------- gear drawing + animation
function gearPath(teeth, r) {
  const rIn = r - Math.max(5, r * 0.14), pts = [];
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2, w = Math.PI / teeth;
    [[a - w * 0.5, rIn], [a - w * 0.3, r], [a + w * 0.3, r], [a + w * 0.5, rIn]].forEach(([b, rr]) => pts.push(`${(Math.cos(b) * rr).toFixed(1)},${(Math.sin(b) * rr).toFixed(1)}`));
  }
  return `M${pts.join('L')}Z`;
}
/** A row of meshing gears. teeth = [12, 24, 8]. Returns {el, stop}. dir = 1 clockwise for gear 0. */
export function gearTrain(teethList, { colors = ['#f08a24', '#3a7bd5', '#22a06b', '#e2557a'], speed = 1, labels = true, arrows = true, autoplay = true } = {}) {
  const k = 3.2; // radius per tooth
  const rs = teethList.map(t => t * k);
  let x = rs[0] + 10; const xs = [];
  rs.forEach((r, i) => { if (i) x += rs[i - 1] + r - 6; xs.push(x); });
  const W = x + rs[rs.length - 1] + 10, H = Math.max(...rs) * 2 + (labels ? 46 : 20);
  const cy = Math.max(...rs) + 10;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'gg-gears diagram' });
  const groups = teethList.map((t, i) => {
    const g = el('g', { transform: `translate(${xs[i]} ${cy})` });
    const rot = el('g');
    rot.appendChild(el('path', { d: gearPath(t, rs[i]), fill: colors[i % colors.length], stroke: '#2b2350', 'stroke-width': 2 }));
    rot.appendChild(el('circle', { r: Math.max(5, rs[i] * 0.18), fill: '#fff', stroke: '#2b2350', 'stroke-width': 2 }));
    rot.appendChild(el('line', { x1: 0, y1: 0, x2: 0, y2: -rs[i] * 0.7, stroke: '#2b2350', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    g.appendChild(rot);
    if (labels) g.appendChild(el('text', { y: rs[i] + 26, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700, fill: '#2b2350' }, `${t} teeth`));
    svg.appendChild(g);
    return rot;
  });
  let ang = 0, raf = 0, last = performance.now(), running = autoplay;
  const counts = teethList.map(() => 0);
  const tick = now => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (running) {
      ang += dt * 60 * speed;
      groups.forEach((g, i) => { const a = ang * (teethList[0] / teethList[i]) * (i % 2 ? -1 : 1) + (i % 2 ? 180 / teethList[i] : 0); g.setAttribute('transform', `rotate(${a.toFixed(2)})`); counts[i] = Math.abs(ang * (teethList[0] / teethList[i])) / 360; });
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return { el: svg, stop: () => cancelAnimationFrame(raf), play: v => { running = v; }, counts };
}

// ---------------------------------------------------------------- lever + pulley + ramp simulators
export function leverSim(box, { load = 100, effortMax = 50 } = {}) {
  const slider = el('input', { type: 'range', min: 1, max: 9, value: 5, 'aria-label': 'Fulcrum position' });
  const svg = el('svg', { viewBox: '0 0 400 180', class: 'diagram' });
  const lab = el('div', { class: 'note' });
  const draw = () => {
    const f = +slider.value, fx = 20 + f * 36, dL = fx - 30, dR = 370 - fx;
    const need = Math.round(load * dL / dR);
    const lifts = need <= effortMax;
    const tilt = lifts ? -8 : 8;
    svg.innerHTML = `<polygon points="${fx - 20},170 ${fx + 20},170 ${fx},132" fill="#8a5a3c"/>
      <g transform="rotate(${tilt} ${fx} 130)"><rect x="20" y="122" width="360" height="12" rx="5" fill="#d9a77c" stroke="#8a5a3c" stroke-width="2"/>
      <text x="38" y="112" font-size="40" text-anchor="middle">🗿</text><text x="362" y="112" font-size="40" text-anchor="middle">🙋</text></g>`;
    lab.innerHTML = `Fulcrum ▲ is ${f <= 3 ? 'close to the rock' : f >= 7 ? 'close to you' : 'in the middle'}. You need to push <b>${need} pounds</b> to lift a ${load}-pound rock. ${lifts ? '✅ You can lift it!' : `❌ Too hard (you can push ${effortMax}).`}`;
  };
  slider.addEventListener('input', draw);
  box.append(svg, el('label', { class: 'sim-lab' }, ['🗿 ', slider, ' 🙋']), lab);
  draw();
  return () => {};
}
export function pulleySim(box) {
  const opts = [[1, 'No pulley (lift it)'], [1, '1 fixed pulley'], [2, '1 movable pulley'], [4, 'Block and tackle (4 ropes)']];
  const svg = el('div', { class: 'gg-pulley' });
  const lab = el('div', { class: 'note' });
  const btns = el('div', { class: 'sim-btns' });
  const set = i => {
    const [n, name] = opts[i];
    btns.querySelectorAll('button').forEach((b, j) => b.classList.toggle('on', j === i));
    svg.innerHTML = `<div class="gg-rope-row">${'<span class="gg-rope"></span>'.repeat(n)}</div><div class="gg-box">📦 100 lb</div>`;
    lab.innerHTML = i === 0 ? 'Lifting straight up: you pull <b>100 lb</b> UP.' : i === 1 ? 'A fixed pulley changes the DIRECTION: you pull DOWN, the box goes UP. Still <b>100 lb</b>.' : `${n} ropes hold the box, so each one does part of the work: you pull only <b>${100 / n} lb</b> — but you pull ${n}× as much rope.`;
  };
  opts.forEach((o, i) => btns.appendChild(el('button', { type: 'button', class: 'btn sm ghost', onclick: () => set(i) }, o[1])));
  box.append(btns, svg, lab);
  set(1);
  return () => {};
}
export function rampSim(box) {
  const slider = el('input', { type: 'range', min: 10, max: 80, value: 30, 'aria-label': 'Ramp steepness' });
  const svg = el('svg', { viewBox: '0 0 400 170', class: 'diagram' });
  const lab = el('div', { class: 'note' });
  const draw = () => {
    const a = +slider.value * Math.PI / 180, h = 120, len = h / Math.sin(a), base = Math.min(360, h / Math.tan(a));
    const force = Math.round(100 * Math.sin(a));
    svg.innerHTML = `<polygon points="20,150 ${20 + base},150 ${20 + base},30" fill="#d9e8ff" stroke="#3a7bd5" stroke-width="3"/><text x="${20 + base * 0.45}" y="${150 - 120 * 0.45 - 6}" font-size="32" transform="rotate(${-slider.value} ${20 + base * 0.45} ${150 - 120 * 0.45})">📦</text>`;
    lab.innerHTML = `Ramp ${slider.value < 30 ? 'gentle' : slider.value > 55 ? 'steep' : 'medium'}: push about <b>${force} lb</b> over <b>${(len / 40).toFixed(1)} m</b>. Gentle ramps = less push, but a longer trip.`;
  };
  slider.addEventListener('input', draw);
  box.append(svg, el('label', { class: 'sim-lab' }, ['📐 gentle ', slider, ' steep']), lab);
  draw();
  return () => {};
}

// ---------------------------------------------------------------- question banks
export const PUSHPULL = [['🚪', 'opening a door toward you', 'pull'], ['⚽', 'kicking a ball', 'push'], ['🛒', 'moving a shopping cart forward', 'push'], ['🎈', 'a balloon on a string you walk with', 'pull'], ['🧲', 'a magnet grabbing a paper clip', 'pull'], ['🛷', 'dragging a sled up a hill', 'pull'], ['🔘', 'pressing an elevator button', 'push'], ['🦷', 'pulling a loose tooth', 'pull'], ['🏀', 'shooting a basketball', 'push'], ['🐕', 'a dog tugging on a leash', 'pull']];
export const BANK = {
  2: [
    ['Which one will ROLL down a hill?', 'A ball', ['A box', 'A book'], 'Round things roll! Flat sides make things slide or stop.'],
    ['Why do wagons have wheels?', 'Wheels make it easier to move heavy things', ['Wheels make it heavier', 'For decoration only'], 'Wheels roll instead of rubbing on the ground, so there is less friction.'],
    ['What is the rod in the middle of a wheel called?', 'An axle', ['A ramp', 'A pulley'], 'The wheel and axle turn together — a doorknob is a wheel and axle too!'],
    ['Which of these is a wheel and axle?', 'A doorknob', ['A slide', 'A knife'], 'Turning the big knob turns the small rod inside, which pulls the latch.'],
    ['What is friction?', 'A force that slows things when they rub together', ['A kind of wheel', 'A loud noise'], 'Ice has little friction (slippery). Sandpaper has lots.'],
  ],
  3: [
    ['Try the ramp. Which ramp needs the LEAST push?', 'A gentle (not steep) ramp', ['A very steep ramp', 'All ramps are the same'], 'A gentle ramp spreads the work over a longer distance, so each step is easier.'],
    ['What is a ramp’s science name?', 'An inclined plane', ['A lever', 'A gear'], 'Inclined means tilted. Plane means a flat surface.'],
    ['Why do wheelchair ramps go back and forth or stretch out long?', 'Longer ramps are less steep and easier to go up', ['To look nice', 'To make it harder'], 'Less steep = less force needed.'],
    ['What is the trade-off with a gentle ramp?', 'You go a longer distance', ['You need more force', 'Nothing changes'], 'Machines trade force for distance.'],
  ],
  4: [
    ['Slide the fulcrum. Where should it go to lift the heavy rock most easily?', 'Close to the rock', ['Close to you', 'It doesn’t matter'], 'The longer your side of the lever, the less you have to push.'],
    ['What is the point a lever turns on called?', 'The fulcrum', ['The handle', 'The axle'], 'A seesaw’s fulcrum is the middle part it rocks on.'],
    ['Which of these is a lever?', 'A seesaw', ['A ball', 'A screw'], 'Seesaws, crowbars, bottle openers and even your arm are levers!'],
    ['A crowbar helps you pry open a heavy lid. What does the lever let you do?', 'Use a small push to make a big force', ['Make the lid lighter', 'Change the color'], 'Levers multiply your force.'],
  ],
  5: [
    ['Watch the gears. If the first gear turns clockwise, which way does the second gear turn?', 'Counter-clockwise (the other way)', ['Clockwise (the same way)', 'It doesn’t move'], 'Gears that touch always turn in opposite directions.'],
    ['Three gears in a row. The first turns clockwise. Which way does the THIRD turn?', 'Clockwise (same as the first)', ['Counter-clockwise', 'It stops'], 'Each gear flips the direction: clockwise → counter → clockwise.'],
    ['Four gears in a row. The first turns clockwise. Which way does the FOURTH turn?', 'Counter-clockwise', ['Clockwise', 'It stops'], 'Odd gears (1st, 3rd) match the first. Even gears (2nd, 4th) turn the other way.'],
    ['What are the bumps on a gear called?', 'Teeth', ['Toes', 'Spokes'], 'The teeth fit together so one gear can push the next.'],
  ],
  6: [
    ['A BIG gear turns a small gear. Which one spins faster?', 'The small gear', ['The big gear', 'They spin the same'], 'The small gear has fewer teeth, so it must go around more times to keep up.'],
    ['A 24-tooth gear turns once. It drives an 8-tooth gear. How many times does the small gear turn?', '3 times', ['8 times', '1 time'], '24 ÷ 8 = 3.'],
    ['A 30-tooth gear turns a 10-tooth gear. If the big one turns 2 times, how many times does the small one turn?', '6 times', ['3 times', '20 times'], '30 ÷ 10 = 3 turns each time, × 2 = 6.'],
    ['Why does a bike have small and big gears?', 'To trade speed for easy pedaling on hills', ['To look cool', 'To make the bike heavier'], 'Low gears make hills easier; high gears make you go fast on flat roads.'],
  ],
  7: [
    ['Try the pulleys. What does a single FIXED pulley do?', 'Changes the direction you pull', ['Makes the box lighter', 'Nothing'], 'You pull down to lift up — easier for your body!'],
    ['With a movable pulley (2 ropes), how hard do you pull to lift 100 lb?', '50 lb', ['100 lb', '200 lb'], 'Two ropes share the weight: 100 ÷ 2 = 50.'],
    ['With 4 ropes holding a 100 lb box, how hard do you pull?', '25 lb', ['400 lb', '50 lb'], '100 ÷ 4 = 25 — but you pull 4 times as much rope.'],
    ['Where would you see a pulley?', 'A flagpole', ['A shoe', 'A pencil'], 'You pull the rope down and the flag goes up. Cranes and elevators use pulleys too.'],
  ],
  8: [
    ['What is a screw, really?', 'A ramp (inclined plane) wrapped around a pole', ['A tiny lever', 'A gear'], 'The spiral thread is a long ramp that turns twisting into pulling things together.'],
    ['Which is a wedge?', 'An axe blade', ['A wheel', 'A flagpole'], 'A wedge is two ramps back to back. It splits or pushes things apart.'],
    ['Which of these uses a screw?', 'A jar lid', ['A seesaw', 'A slide'], 'The lid twists along a spiral thread.'],
    ['What does a doorstop wedge do?', 'Pushes against the floor and door to hold it still', ['Spins the door', 'Lifts the door off'], 'Wedges push things apart or hold them in place.'],
    ['Your front teeth are a kind of…', 'Wedge', ['Pulley', 'Gear'], 'Front teeth are thin wedges that cut food.'],
  ],
  9: [
    ['A bicycle uses which simple machines?', 'Wheels and axles, gears, and levers', ['Only a screw', 'Only a pulley'], 'Pedals and brake handles are levers, the chain links gears, and wheels roll on axles.'],
    ['Scissors are made of which two machines?', 'Two levers with wedge blades', ['Two pulleys', 'A screw and a wheel'], 'The handles are levers around a pivot; the sharp edges are wedges.'],
    ['What is a compound machine?', 'Two or more simple machines working together', ['A machine made of compounds', 'A very small machine'], 'Most machines around you are compound machines!'],
    ['A can opener uses a wheel, a wedge, and a…', 'Lever', ['Ramp', 'Pulley'], 'The handles are levers, the cutting wheel is a wedge, and the turning knob is a wheel and axle.'],
    ['How does a crane lift heavy steel beams?', 'Pulleys and levers multiply the force', ['It uses magic', 'The beams are light'], 'Long cables run over many pulleys, and the long arm works like a lever.'],
  ],
  10: [
    ['Lever balance: 20 lb sits 2 ft from the fulcrum. How much weight balances it 4 ft away on the other side?', '10 lb', ['40 lb', '20 lb'], 'Weight × distance must match: 20 × 2 = 40, and 10 × 4 = 40.'],
    ['Lever balance: 30 lb is 1 ft from the fulcrum. How far away must a 10 lb weight sit to balance?', '3 ft', ['10 ft', '1 ft'], '30 × 1 = 30, so 10 × 3 = 30.'],
    ['Gear ratio: a 40-tooth gear drives a 10-tooth gear. What is the speed gain?', '4 times faster', ['10 times faster', '4 times slower'], '40 ÷ 10 = 4.'],
    ['A pulley system has 3 ropes holding a 90 lb load. What pull is needed (no friction)?', '30 lb', ['90 lb', '270 lb'], '90 ÷ 3 = 30.'],
    ['Engineers say machines don’t make free energy. What do they trade?', 'Less force for more distance (or the reverse)', ['Nothing — they make energy', 'Color for weight'], 'Work = force × distance. A machine changes the mix, not the total.'],
  ],
};

export const LESSONS = {
  1: [
    { title: 'Forces', text: 'A FORCE is a push or a pull. Forces make things start moving, stop, speed up or change direction.', art: pics([['👐', 'push = away from you'], ['🤲', 'pull = toward you']]) },
    { title: 'Push or pull?', text: 'Kicking a ball is a PUSH — it moves away from you. Opening a drawer is a PULL — it comes toward you.', art: pics([['⚽', 'push'], ['🗄️', 'pull']]) },
  ],
  2: [
    { title: 'Wheels', text: 'Wheels roll, which makes moving heavy things much easier. The rod through the middle is the AXLE. A wheel and axle is a simple machine.', art: pics([['🚲', 'bike'], ['🛒', 'cart'], ['🚗', 'car']]) },
    { title: 'Friction', text: 'FRICTION is a force that slows things down when they rub. Wheels have less friction than dragging, so they roll easily.', art: pics([['⛸️', 'little friction'], ['🧱', 'lots of friction']]) },
  ],
  3: [
    { title: 'Ramps', text: 'A ramp — an INCLINED PLANE — is a simple machine. Pushing a box UP a ramp is easier than lifting it straight up. Try making the ramp steeper or gentler!', art: box => rampSim(box) },
  ],
  4: [
    { title: 'Levers', text: 'A LEVER is a bar that turns on a point called the FULCRUM. Seesaws, crowbars and bottle openers are levers. Slide the fulcrum and see how much easier lifting gets!', art: box => leverSim(box) },
  ],
  5: [
    { title: 'Gears', text: 'GEARS are wheels with TEETH. When the teeth fit together, one gear turns the next. Gears are inside clocks, bikes, cars and robots.', art: box => { const g = gearTrain([16, 16]); box.appendChild(g.el); return g.stop; } },
    { title: 'Opposite directions', text: 'Gears that touch turn in OPPOSITE directions. If one turns clockwise, its neighbor turns counter-clockwise. With three gears, the third turns the same way as the first!', art: box => { const g = gearTrain([12, 12, 12]); box.appendChild(g.el); box.appendChild(el('div', { class: 'note', html: '↻ clockwise · ↺ counter · ↻ clockwise' })); return g.stop; } },
  ],
  6: [
    { title: 'Big and small gears', text: 'A big gear turning a small gear makes the small one spin FASTER. Count the teeth: 24 teeth driving 8 teeth → the small gear spins 3 times for each turn of the big one.', art: box => { const g = gearTrain([24, 8]); box.appendChild(g.el); box.appendChild(el('div', { class: 'note', html: '24 ÷ 8 = <b>3 times faster</b>' })); return g.stop; } },
    { title: 'Speed or strength', text: 'Small gear driving a big gear = slower but STRONGER. That’s why bikes have low gears for hills.', art: box => { const g = gearTrain([8, 24]); box.appendChild(g.el); return g.stop; } },
  ],
  7: [
    { title: 'Pulleys', text: 'A PULLEY is a wheel with a rope. A fixed pulley changes the direction of your pull. Movable pulleys share the weight between ropes, so you pull less. Try them!', art: box => pulleySim(box) },
  ],
  8: [
    { title: 'Wedges', text: 'A WEDGE is two ramps back to back. It splits or pushes things apart: axes, knives, doorstops and even your front teeth!', art: pics([['🗡️', 'blade'], ['🔪', 'knife'], ['🦷', 'teeth']]) },
    { title: 'Screws', text: 'A SCREW is a ramp wrapped around a pole. Twisting it moves it a little forward each turn. Jar lids, bottle caps and light bulbs use screw threads.', art: pics([['🔩', 'screw'], ['🥫', 'jar lid'], ['💡', 'light bulb']]) },
  ],
  9: [
    { title: 'The six simple machines', text: 'Lever, wheel and axle, pulley, inclined plane (ramp), wedge and screw. Put them together and you get COMPOUND machines like bikes, cranes and can openers.', art: pics([['⚖️', 'lever'], ['🚲', 'wheel'], ['🏗️', 'pulley'], ['📐', 'ramp'], ['🔪', 'wedge'], ['🔩', 'screw']]) },
  ],
  10: [
    { title: 'The lever rule', text: 'Engineers use math. A lever balances when weight × distance is the same on both sides: 20 lb × 2 ft = 10 lb × 4 ft.', art: eq('W₁ × d₁ = W₂ × d₂') },
    { title: 'No free energy', text: 'Machines make work EASIER, not smaller. They trade force for distance: push less, but push farther.', art: eq('Work = Force × Distance') },
  ],
};

addGizmoBanks(BANK, PUSHPULL);


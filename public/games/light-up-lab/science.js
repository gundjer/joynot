// Lumi's Light-Up Lab — lessons + science experiments (resistors, capacitors, solar, wind).
// Each experiment is a little simulator kids can play with BEFORE answering (explore → explain → check).
import { el, pick, shuffle, sample } from '../_joy/js/util.js';
import { pics, note, stack, eq } from '../_joy/js/lesson.js';

// ---------------------------------------------------------------- drawings
const loopSvg = (lit = true, open = false) => `<svg class="diagram" viewBox="0 0 400 220">
  <rect x="40" y="40" width="320" height="140" rx="16" fill="none" stroke="${lit ? '#ffc21a' : '#8496bf'}" stroke-width="10" ${open ? 'stroke-dasharray="250 40 700"' : ''} style="${lit ? 'filter:drop-shadow(0 0 6px #ffcc00)' : ''}"/>
  <text x="40" y="125" font-size="54" text-anchor="middle">🔋</text>
  <text x="200" y="62" font-size="54" text-anchor="middle" style="${lit ? 'filter:drop-shadow(0 0 14px #ffe14d)' : 'filter:grayscale(1) brightness(.7)'}">💡</text>
  ${lit ? '<g fill="#ff8a00"><text x="120" y="32" font-size="22">➜</text><text x="350" y="120" font-size="22">⬇</text><text x="250" y="200" font-size="22">⬅</text><text x="18" y="85" font-size="22">⬆</text></g>' : ''}
</svg>`;

export const LESSONS = {
  1: [
    { title: 'What is electricity?', text: 'Electricity is a flow of super tiny particles called ELECTRONS. They are much too small to see! When they flow through a light bulb, it glows.', art: pics([['⚡', 'electricity'], ['💡', 'light'], ['🔊', 'sound'], ['🔥', 'heat']]) },
    { title: 'A circuit is a loop', text: 'Electricity needs a complete path called a CIRCUIT. It flows OUT of the battery, through the wire, through the bulb, and BACK to the battery.', art: loopSvg(true) },
    { title: 'A break stops it', text: 'If there is any gap in the loop, electricity stops and the bulb goes dark. We call that an OPEN circuit. A complete loop is a CLOSED circuit.', art: loopSvg(false, true) },
    { title: 'How to play', text: 'Tap a wire tile to turn it. Keep turning tiles until there is one complete loop from the battery, through the bulb, and back. The glowing wires show how far the electricity gets!', art: pics([['🔄', 'tap to turn'], ['✨', 'glow = power'], ['💡', 'loop = light!']]) },
  ],
  2: [
    { title: 'Corners', text: 'Wires can turn corners. A corner piece connects two sides that are next to each other. Electricity follows the wire around the bend.', art: pics([['┗', 'corner'], ['━', 'straight'], ['┏', 'corner']]) },
  ],
  3: [
    { title: 'Follow the glow', text: 'On big boards, start at the battery and follow the glowing wire. When the glow stops, the next tile is turned the wrong way. Fix that one!', art: pics([['🔋', 'start here'], ['✨', 'follow'], ['🔎', 'find the break']]) },
  ],
  4: [
    { title: 'Conductors', text: 'A CONDUCTOR lets electricity flow through it. Metals are great conductors: copper, iron, aluminum, a metal key, a spoon or a paper clip.', art: pics([['🔑', 'key'], ['🥄', 'spoon'], ['📎', 'paper clip'], ['🔩', 'bolt']]) },
    { title: 'Insulators', text: 'An INSULATOR blocks electricity. Rubber, plastic, wood, glass, wool and wax are insulators. That is why wires are covered in plastic — to keep us safe!', art: pics([['🎈', 'rubber'], ['🥤', 'plastic'], ['🧶', 'wool'], ['🖍️', 'wax']]) },
    { title: '⚠️ Safety', text: 'NEVER touch outlets or plug things in with wet hands. The electricity in a wall is much stronger than a toy battery. Water is a conductor!', art: pics([['🔌', 'outlets'], ['💧', 'water'], ['🚫', 'never mix']]) },
  ],
  5: [
    { title: 'Switches', text: 'A SWITCH is a door for electricity. ON closes the circuit and the light turns on. OFF opens a gap and the light turns off.', art: stack(loopSvg(true), note('Switch ON = closed = light ON')) },
    { title: 'Switches everywhere', text: 'Light switches, TV buttons, the power button on a tablet — they all open and close circuits.', art: pics([['🔦', 'flashlight'], ['📺', 'TV'], ['💡', 'room light']]) },
  ],
  6: [
    { title: 'Two bulbs in a row', text: 'When bulbs are in one loop, one after another, it is called a SERIES circuit. The electricity goes through the first bulb, then the second.', art: pics([['🔋'], ['➜'], ['💡'], ['➜'], ['💡'], ['↩']]) },
    { title: 'Series vs parallel', text: 'In series, if one bulb breaks, they ALL go out. Houses use PARALLEL circuits — each light has its own path, so one burned-out bulb doesn’t turn off the rest.', art: note('Series: one path 🔁 · Parallel: many paths 🔀') },
  ],
  7: [
    { title: 'Resistors', text: 'A RESISTOR slows down the flow of electricity. It is like a narrow part of a water pipe — less water can squeeze through.', art: `<svg class="diagram" viewBox="0 0 420 120"><rect x="10" y="40" width="160" height="40" fill="#6ec6ff"/><rect x="170" y="52" width="80" height="16" fill="#6ec6ff"/><rect x="250" y="40" width="160" height="40" fill="#6ec6ff"/><text x="210" y="105" text-anchor="middle" font-size="18" font-weight="700">narrow = resistor</text><polyline points="150,20 165,8 180,32 195,8 210,32 225,8 240,32 255,20" fill="none" stroke="#2b2350" stroke-width="4"/></svg>` },
    { title: 'Why use a resistor?', text: 'Some parts, like small LED lights, burn out if too much electricity rushes through. A resistor protects them. Too much resistance and the light is too dim.', art: pics([['💥', 'no resistor'], ['✅', 'just right'], ['🌑', 'too much']]) },
    { title: 'Ohm’s law (4th–5th grade)', text: 'Scientists measure push in VOLTS, flow in AMPS and resistance in OHMS (Ω). Current = Volts ÷ Ohms. A 6-volt battery with a 2-ohm resistor: 6 ÷ 2 = 3 amps.', art: eq('Amps = Volts ÷ Ohms') },
  ],
  8: [
    { title: 'Capacitors', text: 'A CAPACITOR stores a little bit of electricity, like a small water tank. It fills up fast and empties fast.', art: pics([['🔋', 'battery = big lake'], ['🥛', 'capacitor = small cup']]) },
    { title: 'What they do', text: 'When the battery is removed, a charged capacitor keeps the light on for a moment, then it fades. Camera flashes use capacitors to dump lots of energy in a quick flash!', art: pics([['📸', 'camera flash'], ['⏰', 'clock memory'], ['🔊', 'smooth sound']]) },
  ],
  9: [
    { title: 'Solar panels', text: 'A SOLAR PANEL turns sunlight straight into electricity. It is made of special cells (usually silicon). When light hits them, electrons start to flow.', art: pics([['☀️', 'sunlight'], ['➜'], ['⬛', 'solar panel'], ['➜'], ['⚡', 'electricity']]) },
    { title: 'More sun = more power', text: 'Panels make the most electricity when the sun shines straight onto them, around noon. Clouds make less. At night they make none, so homes store energy in batteries.', art: pics([['🌅', 'a little'], ['☀️', 'the most'], ['☁️', 'less'], ['🌙', 'none']]) },
    { title: 'Renewable energy', text: 'Sunlight is RENEWABLE — it will not run out. Burning coal, oil and gas makes pollution and those fuels can run out.', art: pics([['☀️', 'renewable'], ['💨', 'renewable'], ['🛢️', 'runs out']]) },
  ],
  10: [
    { title: 'Wind turbines', text: 'Wind pushes the big blades and makes them spin. The spinning shaft turns a GENERATOR inside, where magnets spin past coils of copper wire. That makes electricity!', art: pics([['💨', 'wind'], ['➜'], ['🌀', 'blades spin'], ['➜'], ['🧲', 'generator'], ['➜'], ['⚡', 'power']]) },
    { title: 'Faster wind, more power', text: 'Stronger wind spins the blades faster and makes more electricity. If there is no wind — no power. In a storm, turbines lock their blades to stay safe.', art: pics([['🍃', 'breeze: some'], ['💨', 'windy: lots'], ['🌪️', 'storm: stop!']]) },
  ],
  11: [
    { title: 'Master electrician', text: 'Big circuits use everything: wires, switches, conductors and more than one bulb. Plan first: find the battery, follow the path, then fix one tile at a time.', art: pics([['🧠', 'plan'], ['🔎', 'trace'], ['🔧', 'fix'], ['💡', 'test']]) },
  ],
};
export const SCIENCE = true;

// ---------------------------------------------------------------- question banks
const BANK = {
  resistor: [
    { q: 'Try each resistor. Which one makes the LED glow safely?', opts: ['No resistor', '330 Ω (medium)', '1,000,000 Ω (huge)'], a: '330 Ω (medium)', why: 'With no resistor, too much current burns out the LED. A huge resistor lets almost nothing through. Medium is just right!' },
    { q: 'A resistor is most like…', opts: ['a narrow part of a water pipe', 'a bigger battery', 'a light switch'], a: 'a narrow part of a water pipe', why: 'Resistors slow the flow, like a narrow pipe slows water.' },
    { q: 'If you add MORE resistance, the current gets…', opts: ['smaller', 'bigger', 'exactly the same'], a: 'smaller', why: 'More resistance means less electricity can flow, so the light gets dimmer.' },
    { q: 'What happens to an LED with NO resistor on a strong battery?', opts: ['It can burn out', 'It glows forever', 'Nothing at all'], a: 'It can burn out', why: 'Too much current heats it up and breaks it. Resistors protect parts.' },
    { q: 'Ohm’s law: a 9-volt battery and a 3-ohm resistor. How many amps flow? (Amps = Volts ÷ Ohms)', opts: ['3 amps', '27 amps', '12 amps'], a: '3 amps', why: '9 ÷ 3 = 3 amps.', min: 4 },
    { q: 'Ohm’s law: 12 volts and 4 ohms. How many amps?', opts: ['3 amps', '48 amps', '8 amps'], a: '3 amps', why: '12 ÷ 4 = 3 amps.', min: 4 },
  ],
  capacitor: [
    { q: 'Charge the capacitor, then unplug the battery. What happens to the bulb?', opts: ['It stays lit for a moment, then fades', 'It turns off instantly', 'It gets brighter and brighter'], a: 'It stays lit for a moment, then fades', why: 'The capacitor gives back the electricity it stored until it is empty.' },
    { q: 'A capacitor is most like…', opts: ['a small water tank that fills and empties fast', 'a long wire', 'a rubber band'], a: 'a small water tank that fills and empties fast', why: 'It stores a little charge and lets it out quickly.' },
    { q: 'Which gadget uses a capacitor for a quick burst of light?', opts: ['A camera flash', 'A wooden spoon', 'A paper book'], a: 'A camera flash', why: 'The flash charges a capacitor, then empties it all at once — FLASH!' },
    { q: 'How is a capacitor different from a battery?', opts: ['It stores a little and empties fast', 'It stores way more energy', 'It makes energy from nothing'], a: 'It stores a little and empties fast', why: 'Batteries store lots of energy and let it out slowly. Capacitors store a little and release it fast.' },
  ],
  solar: [
    { q: 'Move the sun. When does the solar panel make the MOST electricity?', opts: ['Around noon, with the sun high', 'Early morning', 'At night'], a: 'Around noon, with the sun high', why: 'The sun shines most strongly and directly around midday.' },
    { q: 'What does a solar panel turn into electricity?', opts: ['Sunlight', 'Wind', 'Water'], a: 'Sunlight', why: 'Solar cells turn light into electricity.' },
    { q: 'Turn on the clouds. What happens?', opts: ['The panel makes less power', 'The panel makes more power', 'Nothing changes'], a: 'The panel makes less power', why: 'Clouds block some sunlight, so less electricity is made.' },
    { q: 'How do solar homes have power at night?', opts: ['They store daytime energy in batteries', 'The moon powers the panels', 'They never use lights at night'], a: 'They store daytime energy in batteries', why: 'Extra energy from the day charges batteries for the night.' },
    { q: 'Why is solar energy called RENEWABLE?', opts: ['The sun will not run out', 'It is very old', 'It is made of coal'], a: 'The sun will not run out', why: 'Renewable energy comes from sources that keep coming back, like sunlight and wind.' },
  ],
  wind: [
    { q: 'Change the wind. When does the turbine make the most electricity?', opts: ['When it is windy', 'When there is no wind', 'When it is dark'], a: 'When it is windy', why: 'Faster wind spins the blades faster, which makes more power.' },
    { q: 'What is inside a wind turbine that makes electricity?', opts: ['A generator with magnets and coils', 'A giant battery', 'A light bulb'], a: 'A generator with magnets and coils', why: 'Spinning magnets near copper coils push electrons through the wire.' },
    { q: 'In a big storm, what do turbines do?', opts: ['Lock the blades to stay safe', 'Spin as fast as they can', 'Fly away'], a: 'Lock the blades to stay safe', why: 'Very strong winds could break them, so they stop and wait.' },
    { q: 'Where is a good place to build wind turbines?', opts: ['On windy hills or out at sea', 'Inside a house', 'In a deep cave'], a: 'On windy hills or out at sea', why: 'Turbines need lots of steady wind.' },
    { q: 'Which of these is NOT renewable?', opts: ['Coal', 'Wind', 'Sunlight'], a: 'Coal', why: 'Coal is dug out of the ground and can run out. It also makes pollution.' },
  ],
};

// Fresh numbers every time, so kids reason instead of memorizing.
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const SCI_GEN = {
  resistor: ed => {
    if (ed >= 4) { const amps = R(1, 6), ohms = R(2, 6), volts = amps * ohms; return { q: `Ohm’s law: a ${volts}-volt battery and a ${ohms}-ohm resistor. How many amps flow? (Amps = Volts ÷ Ohms)`, opts: [`${amps} amps`, `${volts * ohms} amps`, `${volts + ohms} amps`], a: `${amps} amps`, why: `${volts} ÷ ${ohms} = ${amps} amps.`, steps: ['Amps = Volts ÷ Ohms.', `${volts} ÷ ${ohms} = ${amps}.`] }; }
    const [lo, hi] = [R(1, 4) * 10, R(5, 9) * 100];
    return { q: `Resistor A is ${lo} Ω. Resistor B is ${hi} Ω. With the same battery, which one makes the bulb BRIGHTER?`, opts: [`Resistor A (${lo} Ω)`, `Resistor B (${hi} Ω)`, 'They are the same'], a: `Resistor A (${lo} Ω)`, why: 'Less resistance lets more electricity flow, so the bulb is brighter.', steps: ['Ω (ohms) measures how much a resistor slows electricity.', `${lo} is less than ${hi}, so A slows it less.`, 'More current flows through A: brighter!'] };
  },
  solar: ed => {
    const w = R(2, 6) * 10, n = R(2, 6);
    if (Math.random() < 0.5) return { q: `Each solar panel makes ${w} watts in full sun. How many watts do ${n} panels make?`, opts: [`${w * n} watts`, `${w + n} watts`, `${w} watts`], a: `${w * n} watts`, why: `${w} × ${n} = ${w * n} watts. More panels catch more sunlight.`, steps: ['Every panel makes the same amount.', `${n} panels × ${w} watts = ${w * n} watts.`] };
    const pick = [['at noon on a sunny day', 'the MOST'], ['on a cloudy afternoon', 'some, but less'], ['at midnight', 'none']][R(0, 2)];
    return { q: `How much power does a solar panel make ${pick[0]}?`, opts: ['the MOST', 'some, but less', 'none'], a: pick[1], why: 'Solar panels turn sunlight into electricity. More direct sunlight = more power. No sun = no power (that’s why we store it in batteries).' };
  },
  wind: ed => {
    const p = R(1, 5), n = R(2, 8);
    if (Math.random() < 0.5) return { q: `One wind turbine powers ${p * 100} homes. How many homes can ${n} turbines power?`, opts: [`${p * 100 * n} homes`, `${p * 100 + n} homes`, `${p * 100} homes`], a: `${p * 100 * n} homes`, why: `${p * 100} × ${n} = ${p * 100 * n} homes.`, steps: [`Each turbine: ${p * 100} homes.`, `${n} × ${p * 100} = ${p * 100 * n}.`] };
    const pick = [['the wind is strong and steady', 'More power'], ['there is no wind at all', 'No power'], ['the wind is a gentle breeze', 'A little power']][R(0, 2)];
    return { q: `A wind turbine makes how much power when ${pick[0]}?`, opts: ['More power', 'A little power', 'No power'], a: pick[1], why: 'Moving air spins the blades, which spin a generator. Faster wind = faster spin = more electricity.' };
  },
};

export function sciQuestion(kind, ctx = {}) {
  const ed = ctx.edition ?? 2;
  if (SCI_GEN[kind] && Math.random() < 0.5) {
    const g = SCI_GEN[kind](ed);
    return { kind: 'sci', sim: kind, key: kind + g.q.slice(0, 40), prompt: g.q, opts: shuffle(g.opts), ans: g.a, expected: g.a, explain: g.why, steps: g.steps, mode: 'sci' };
  }
  const list = BANK[kind].filter(b => !b.min || ed >= b.min);
  const b = pick(list);
  return { kind: 'sci', sim: kind, key: kind + b.q.slice(0, 24), prompt: b.q, opts: shuffle(b.opts), ans: b.a, expected: b.a, explain: b.why, mode: 'sci' };
}

export function sciMount(q, ui) {
  const box = el('div', { class: 'sim' });
  ui.stage.appendChild(box);
  const stop = SIMS[q.sim](box, ui);
  ui.choose(q.opts.map(o => ({ value: o, label: o })), q.ans, { cols: 1, cls: 'text' });
  return { destroy: stop, hint: () => SIM_HINT[q.sim] };
}
const SIM_HINT = {
  resistor: 'Tap each resistor button and watch the LED. Which one glows without breaking?',
  capacitor: 'Tap “Charge”, then tap “Unplug battery”. Watch the bulb carefully.',
  solar: 'Drag the time slider from morning to night and watch the power meter.',
  wind: 'Drag the wind slider and watch how fast the blades spin and how much power is made.',
};

// ---------------------------------------------------------------- simulators
const meter = () => el('div', { class: 'sim-meter' }, [el('div', { class: 'sim-fill' }), el('span', { class: 'sim-val' })]);
const setMeter = (m, frac, label) => { m.querySelector('.sim-fill').style.width = Math.round(Math.max(0, Math.min(1, frac)) * 100) + '%'; m.querySelector('.sim-val').textContent = label; };

const SIMS = {
  resistor(box, ui) {
    const led = el('div', { class: 'sim-led' }, '💡');
    const status = el('div', { class: 'sim-status' }, 'Pick a resistor to test →');
    const m = meter();
    const choicesEl = el('div', { class: 'sim-btns' });
    const opts = [['none', 'No resistor', 1.6], ['mid', '330 Ω', 0.85], ['big', '1,000,000 Ω', 0.04]];
    const set = ([k, label, cur]) => {
      led.className = 'sim-led'; led.textContent = '💡';
      choicesEl.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === k));
      setMeter(m, cur / 1.6, `current: ${k === 'none' ? 'TOO MUCH' : k === 'mid' ? 'just right' : 'almost none'}`);
      if (k === 'none') { led.classList.add('blow'); ui.sfx.zap(); setTimeout(() => { led.textContent = '💥'; status.textContent = 'Pop! Too much current burned out the LED.'; }, 450); }
      else if (k === 'mid') { led.style.setProperty('--b', 1); led.classList.add('on'); status.textContent = 'Nice and bright — and safe!'; ui.sfx.pop(); }
      else { led.style.setProperty('--b', 0.12); led.classList.add('on', 'dim'); status.textContent = 'So much resistance — barely any glow.'; }
    };
    opts.forEach(o => choicesEl.appendChild(el('button', { type: 'button', class: 'btn sm ghost', 'data-k': o[0], onclick: () => set(o) }, o[1])));
    box.append(el('div', { class: 'sim-row' }, [el('span', { class: 'sim-ic' }, '🔋'), el('span', { class: 'sim-zig' }, '⏦⏦⏦'), led]), choicesEl, m, status);
    return () => {};
  },
  capacitor(box, ui) {
    let charge = 0, plugged = false, raf = 0, last = performance.now();
    const bulb = el('div', { class: 'sim-led' }, '💡');
    const tank = el('div', { class: 'sim-tank' }, [el('div', { class: 'sim-water' })]);
    const status = el('div', { class: 'sim-status' }, 'Tap Charge to plug in the battery.');
    const bPlug = el('button', { type: 'button', class: 'btn sm go', onclick: () => { plugged = true; status.textContent = 'Battery connected: the capacitor fills up and the bulb is on.'; ui.sfx.pop(); } }, '🔌 Charge');
    const bUn = el('button', { type: 'button', class: 'btn sm ghost', onclick: () => { plugged = false; status.textContent = 'Battery unplugged! The capacitor empties into the bulb…'; ui.sfx.click(); } }, '✂️ Unplug battery');
    const tick = now => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      charge = plugged ? Math.min(1, charge + dt * 0.9) : Math.max(0, charge - dt * 0.45);
      const bright = plugged ? 1 : charge;
      bulb.style.setProperty('--b', bright); bulb.classList.toggle('on', bright > 0.02);
      tank.firstChild.style.height = Math.round(charge * 100) + '%';
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    box.append(el('div', { class: 'sim-row' }, [el('span', { class: 'sim-ic' }, '🔋'), el('div', { class: 'sim-cap' }, [tank, el('small', {}, 'capacitor')]), bulb]), el('div', { class: 'sim-btns' }, [bPlug, bUn]), status);
    return () => cancelAnimationFrame(raf);
  },
  solar(box, ui) {
    const sky = el('div', { class: 'sim-sky' }, [el('span', { class: 'sim-sun' }, '☀️'), el('span', { class: 'sim-cloud hidden' }, '☁️☁️'), el('span', { class: 'sim-panel' }, '⬛⬛'), el('span', { class: 'sim-house' }, '🏠')]);
    const m = meter();
    const slider = el('input', { type: 'range', min: 5, max: 21, step: 0.25, value: 8, 'aria-label': 'Time of day' });
    const cloud = el('button', { type: 'button', class: 'btn sm ghost' }, '☁️ Clouds: off');
    let clouds = false;
    const draw = () => {
      const h = +slider.value, f = Math.max(0, Math.sin((h - 6) / 12 * Math.PI));
      const sun = sky.querySelector('.sim-sun');
      sun.style.left = ((h - 5) / 16 * 90 + 2) + '%'; sun.style.bottom = (f * 60 + 4) + '%'; sun.textContent = h < 6.2 || h > 19.8 ? '🌙' : '☀️';
      sky.classList.toggle('night', f === 0);
      const p = f * (clouds ? 0.3 : 1);
      setMeter(m, p, `${Math.round(p * 300)} watts · ${(h % 12 || 12).toFixed(0)}${h < 12 ? ' AM' : ' PM'}`);
    };
    slider.addEventListener('input', draw);
    cloud.addEventListener('click', () => { clouds = !clouds; cloud.textContent = `☁️ Clouds: ${clouds ? 'on' : 'off'}`; sky.querySelector('.sim-cloud').classList.toggle('hidden', !clouds); draw(); ui.sfx.click(); });
    box.append(sky, el('label', { class: 'sim-lab' }, ['🕒 Time of day ', slider]), cloud, m);
    draw();
    return () => {};
  },
  wind(box, ui) {
    const blades = el('span', { class: 'sim-blades' }, '✣');
    const tur = el('div', { class: 'sim-turbine' }, [blades, el('div', { class: 'sim-pole' })]);
    const m = meter();
    const slider = el('input', { type: 'range', min: 0, max: 4, step: 1, value: 1, 'aria-label': 'Wind speed' });
    const label = el('div', { class: 'sim-status' });
    let ang = 0, raf = 0;
    const names = ['😶 calm — no wind', '🍃 light breeze', '💨 windy', '💨💨 very windy', '🌪️ storm — blades locked for safety'];
    const speeds = [0, 2, 6, 10, 0], power = [0, 0.15, 0.55, 1, 0];
    const tick = () => { ang = (ang + speeds[+slider.value]) % 360; blades.style.transform = `rotate(${ang}deg)`; raf = requestAnimationFrame(tick); };
    const draw = () => { const v = +slider.value; label.textContent = names[v]; setMeter(m, power[v], `${Math.round(power[v] * 2000)} watts`); };
    slider.addEventListener('input', () => { draw(); ui.sfx.whoosh(); });
    raf = requestAnimationFrame(tick); draw();
    box.append(tur, el('label', { class: 'sim-lab' }, ['💨 Wind ', slider]), label, m);
    return () => cancelAnimationFrame(raf);
  },
};

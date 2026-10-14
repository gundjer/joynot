// Signal Squad data: question banks, lessons (with binary-card demo) used by the game.
import { el, pick, sample, shuffle, rand } from '../_joy/js/util.js';
import { pics, note, stack, eq } from '../_joy/js/lesson.js';
import { addSignalBanks, SIGNAL_GEN, PACKET_WORDS } from './more.js';
export { SIGNAL_GEN, PACKET_WORDS };

export const COMPUTERS = [['📱', 'phone', true], ['💻', 'laptop', true], ['🖥️', 'desktop computer', true], ['⌚', 'smartwatch', true], ['🎮', 'game console', true], ['📺', 'smart TV', true], ['🍌', 'banana', false], ['📚', 'book', false], ['🧸', 'teddy bear', false], ['✏️', 'pencil', false], ['🥄', 'spoon', false], ['🛋️', 'couch', false]];
export const PHONE_PARTS = [
  ['screen', 'shows pictures and words, and feels your finger touch it', 'Which part shows pictures and feels your touch?'],
  ['camera', 'takes photos and videos', 'Which part takes pictures?'],
  ['microphone', 'hears your voice', 'Which part hears you talk?'],
  ['speaker', 'plays sounds and voices', 'Which part plays sounds?'],
  ['battery', 'stores the energy that powers the phone', 'Which part stores energy so the phone can run?'],
  ['antenna', 'sends and receives invisible radio signals', 'Which part sends and gets signals through the air?'],
  ['chip (processor)', 'is the phone’s “brain” that follows instructions', 'Which part is the phone’s “brain”?'],
];
export const IO = [['⌨️', 'keyboard', 'input'], ['🖱️', 'mouse', 'input'], ['🎤', 'microphone', 'input'], ['📷', 'camera', 'input'], ['👆', 'touch screen tap', 'input'], ['🎮', 'game controller', 'input'], ['🖥️', 'screen', 'output'], ['🔊', 'speaker', 'output'], ['🖨️', 'printer', 'output'], ['🎧', 'headphones', 'output'], ['📳', 'phone vibrating', 'output']];
export const SAFE = [
  ['A game asks for your home address. What should you do?', 'Don’t share it — ask a grown-up', ['Type it in', 'Share it with a friend online'], 'Your address, school, phone number and full name are private. Keep them secret online.'],
  ['What makes a strong password?', 'A long mix of words, numbers and symbols you keep secret', ['Your name', '1234'], 'Long passwords with mixed characters are hardest to guess. Only share them with your grown-up.'],
  ['Someone you don’t know sends you a message asking to meet. What do you do?', 'Don’t answer and tell a trusted grown-up', ['Say yes', 'Keep it a secret'], 'Always tell a grown-up when something online feels strange or scary.'],
  ['A pop-up says “You won a prize! Click here!” What is the smart choice?', 'Don’t click — it might be a trick', ['Click fast', 'Enter your password'], 'Tricks like this are called scams or phishing. Close it and tell a grown-up.'],
  ['Someone posts a mean comment about a classmate. What should you do?', 'Don’t join in, and tell a grown-up', ['Add a meaner comment', 'Share it with everyone'], 'Be kind online — words on a screen still hurt real people.'],
  ['Is everything you read on the internet true?', 'No — check with trusted sources', ['Yes, always', 'Only if it has pictures'], 'Anyone can post online. Good researchers check more than one trusted source.'],
  ['Can you take back a photo after you post it online?', 'Not really — others may have copied it', ['Yes, it disappears forever', 'Only on Tuesdays'], 'Think before you post. The internet can remember for a very long time.'],
];
export const WAVES = [
  ['How does a phone send a call without wires?', 'Invisible radio waves travel to a cell tower', ['A long hidden wire', 'Magic'], 'Phones use radio waves — like a radio station, but two ways.'],
  ['What does a Wi-Fi router do?', 'Shares the internet with devices using radio waves', ['Cooks food', 'Charges your phone'], 'The router is connected to the internet by a cable and talks to your devices through the air.'],
  ['Why do phones lose signal far out in the country?', 'They are too far from a cell tower', ['The phone is tired', 'Grass blocks sound'], 'Radio waves get weaker the farther they travel.'],
  ['What is a cell tower?', 'A tall antenna that talks to the phones near it', ['A tower for prisoners', 'A water tower'], 'Each tower covers an area called a “cell” — that’s why they are called cell phones!'],
  ['Which travels through the air: Wi-Fi or a garden hose?', 'Wi-Fi', ['A garden hose', 'Neither'], 'Wi-Fi is made of radio waves — you can’t see them, but they are all around you.'],
];
export const CLOUD = [
  ['What is an IP address?', 'A number that tells the internet where a device is, like a home address', ['A password', 'A type of phone case'], 'Every device online has an address so messages know where to go.'],
  ['When you type a website name, what turns it into the computer’s address?', 'DNS — like the internet’s phone book', ['The keyboard', 'The screen'], 'DNS looks up names like joynot.com and finds the right IP address.'],
  ['What is “the cloud”?', 'Other big computers (servers) that store your stuff and run apps', ['Real clouds in the sky', 'Your phone’s screen'], 'Cloud photos are saved on servers in buildings called data centers.'],
  ['What carries most internet traffic between continents?', 'Huge cables on the bottom of the ocean', ['Birds', 'Paper mail'], 'Undersea fiber-optic cables carry signals as flashes of light!'],
  ['What is a server?', 'A computer that “serves” websites and files to other computers', ['A waiter at a restaurant', 'A phone charger'], 'When you open a website, a server sends you the page.'],
  ['What does a router do with packets?', 'Picks the best path for each one, like a traffic director', ['Eats them', 'Prints them'], 'Routers pass packets along, hop by hop, toward their address.'],
];
export const SCIENCE = [
  ['How does a touch screen know where your finger is?', 'Your finger changes a tiny electric field on the screen', ['It sees you with a camera', 'It hears your finger'], 'Most phone screens are “capacitive” — that’s why gloves usually don’t work on them!'],
  ['How does a phone know when you turn it sideways?', 'A tiny motion sensor called an accelerometer', ['It guesses', 'The battery tips over'], 'The accelerometer feels which way gravity pulls.'],
  ['What is inside a phone’s chip?', 'Billions of tiny switches called transistors', ['Water', 'Tiny people'], 'Transistors switch on and off — 1s and 0s — billions of times every second.'],
  ['What kind of battery do most phones use?', 'Lithium-ion', ['AA batteries', 'Potato batteries'], 'Lithium-ion batteries hold lots of energy and can be recharged many times.'],
  ['How does a phone camera take a picture?', 'A sensor turns light into numbers (pixels)', ['It paints it', 'It prints it inside'], 'Each pixel is stored as numbers that say how much red, green and blue light there is.'],
  ['Why should you not leave a phone in a hot car?', 'Heat can damage the battery', ['It will get cold', 'It makes the screen bigger'], 'Batteries like being not too hot and not too cold.'],
];
export const TRAVEL = ['📱 Your phone turns your words into 1s and 0s', '📶 It sends them by radio waves to a cell tower', '🌐 The tower sends them through internet cables and routers', '📡 A tower near your friend sends them through the air', '📲 Your friend’s phone turns the 1s and 0s back into words'];

addSignalBanks({ COMPUTERS, PHONE_PARTS, IO, SAFE, WAVES, CLOUD, SCIENCE });

export const LESSONS = {
  1: [
    { title: 'What is a computer?', text: 'A COMPUTER is a machine that follows instructions to work with information: words, pictures, sounds and numbers. Phones, tablets and game consoles are all computers!', art: pics([['📱', 'phone'], ['💻', 'laptop'], ['🎮', 'console'], ['⌚', 'smartwatch']]) },
    { title: 'Not a computer', text: 'A book or a teddy bear can’t follow instructions or change information, so they are not computers.', art: pics([['📚', 'book'], ['🧸', 'teddy'], ['🍌', 'banana']]) },
  ],
  2: [
    { title: 'Inside a phone', text: 'A phone has a screen to see and touch, a camera, a microphone to hear you, a speaker to play sounds, a battery for energy, an antenna for signals and a chip that is its brain.', art: `<svg class="diagram" viewBox="0 0 360 230"><rect x="120" y="10" width="120" height="210" rx="20" fill="#2b2350"/><rect x="128" y="34" width="104" height="160" rx="6" fill="#9fdcff"/><circle cx="180" cy="22" r="5" fill="#ffd23f"/><rect x="160" y="200" width="40" height="8" rx="4" fill="#666"/><text x="250" y="26" font-size="15" font-weight="700">← camera</text><text x="250" y="110" font-size="15" font-weight="700">← screen</text><text x="10" y="206" font-size="15" font-weight="700">microphone →</text><text x="10" y="40" font-size="15" font-weight="700">speaker →</text><text x="140" y="120" font-size="14" fill="#2b2350">🔋 battery</text><text x="142" y="150" font-size="14" fill="#2b2350">🧠 chip</text></svg>` },
  ],
  3: [
    { title: 'Input and output', text: 'INPUT is information going INTO a computer: typing, clicking, talking, taking a picture. OUTPUT is information coming OUT: pictures on the screen, sounds, printed paper.', art: stack(pics([['⌨️', 'input'], ['🎤', 'input'], ['📷', 'input']]), pics([['🖥️', 'output'], ['🔊', 'output'], ['🖨️', 'output']])) },
  ],
  4: [
    { title: 'Private information', text: 'Some things are PRIVATE: your full name, address, school, phone number and passwords. Never share them online without asking a grown-up.', art: pics([['🏠', 'address'], ['🔑', 'password'], ['🏫', 'school']]) },
    { title: 'Stop, think, tell', text: 'If something online feels strange, mean or scary: STOP, don’t click or answer, and TELL a trusted grown-up. You will not be in trouble for telling.', art: note('🛑 Stop → 🤔 Think → 🗣️ Tell a grown-up') },
  ],
  5: [
    { title: 'Computers speak in 1s and 0s', text: 'Inside, a computer is made of billions of tiny switches that are either ON (1) or OFF (0). Each 1 or 0 is called a BIT. Everything — photos, games, music — is stored as bits!', art: pics([['💡', 'ON = 1'], ['⚫', 'OFF = 0']]) },
    { title: 'Binary cards', text: 'Binary numbers use cards worth 16, 8, 4, 2 and 1 dots. Turn on the cards you need and add them up. 5 = the 4 card + the 1 card → 00101.', art: box => binaryCards(box, 5, null, true) },
  ],
  6: [
    { title: 'Invisible waves', text: 'Wi-Fi and phones send information through the air using RADIO WAVES. You can’t see or feel them, but they travel at the speed of light!', art: pics([['📱', 'phone'], ['〰️', 'radio waves'], ['📶', 'router or tower']]) },
    { title: 'Cell towers', text: 'Cell towers are tall antennas. Each one talks to phones in its area, called a cell. As you drive, your phone switches from tower to tower.', art: pics([['📡', 'tower'], ['🚗', 'you drive'], ['📡', 'next tower']]) },
  ],
  7: [
    { title: 'Packets', text: 'Big messages are chopped into small pieces called PACKETS. Each packet has a number and an address. They can travel different paths and arrive mixed up!', art: pics([['✉️', 'message'], ['➜'], ['📦', '1'], ['📦', '2'], ['📦', '3']]) },
    { title: 'Putting it back together', text: 'The receiving computer uses the numbers to put the packets back in order. If one is missing, it asks for it again.', art: note('📦3 📦1 📦2 → sort → 📦1 📦2 📦3 → “HELLO”') },
  ],
  8: [
    { title: 'A text message’s trip', text: 'Your phone → radio waves → cell tower → internet cables and routers → a tower near your friend → your friend’s phone. It takes less than a second!', art: note(TRAVEL.join('<br>')) },
  ],
  9: [
    { title: 'Addresses', text: 'Every device on the internet has an IP ADDRESS, like a house address, so packets know where to go. DNS is the internet’s phone book: it changes names like joynot.com into addresses.', art: eq('joynot.com → 203.0.113.7') },
    { title: 'The cloud', text: '“The cloud” is not in the sky! It means big computers called SERVERS in buildings called data centers. Your photos in the cloud are saved on those computers.', art: pics([['☁️', 'the cloud'], ['=', ''], ['🏢', 'data center'], ['🖥️', 'servers']]) },
  ],
  10: [
    { title: 'Phone science', text: 'Touch screens feel the tiny electricity in your finger. A motion sensor knows when you tip the phone. The chip has billions of transistors. GPS finds you using satellites.', art: pics([['👆', 'touch'], ['🔄', 'motion'], ['🧠', 'chip'], ['🛰️', 'GPS']]) },
  ],
};

// binary cards: tap to flip; target = number to make (or null for free play)
export function binaryCards(box, target, onChange, demo = false) {
  const vals = [16, 8, 4, 2, 1];
  const on = vals.map(v => (demo ? (target & v) > 0 : false));
  const row = el('div', { class: 'ss-bin' });
  const total = el('div', { class: 'note' });
  const draw = () => {
    row.innerHTML = '';
    vals.forEach((v, i) => {
      const c = el('button', { type: 'button', class: 'ss-card' + (on[i] ? ' on' : ''), 'aria-label': `${v} card ${on[i] ? 'on' : 'off'}` }, [el('span', { class: 'ss-dots' }, on[i] ? '●'.repeat(Math.min(v, 16)) : ''), el('b', {}, on[i] ? String(v) : ''), el('small', {}, on[i] ? '1' : '0')]);
      c.addEventListener('click', () => { if (demo) return; on[i] = !on[i]; draw(); onChange && onChange(sum()); });
      row.appendChild(c);
    });
    total.innerHTML = `Binary <b>${on.map(x => (x ? 1 : 0)).join('')}</b> = <b>${sum()}</b>`;
  };
  const sum = () => vals.reduce((s, v, i) => s + (on[i] ? v : 0), 0);
  box.append(row, total);
  draw();
  return { sum, reset() { on.fill(false); draw(); } };
}


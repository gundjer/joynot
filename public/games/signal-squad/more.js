// Signal Squad: more questions plus generators with fresh numbers.
import { pick, shuffle, rand } from '../_joy/js/util.js';

const mcq = (key, prompt, ans, wrong, explain, steps) => ({ kind: 'mc', key, prompt, ans, opts: shuffle([ans, ...wrong]), expected: ans, explain, ...(steps ? { steps } : {}) });

export function addSignalBanks({ COMPUTERS, PHONE_PARTS, IO, SAFE, WAVES, CLOUD, SCIENCE }) {
  COMPUTERS.push(['🚗', 'new car (it has computers inside!)', true], ['🎲', 'pair of dice', false], ['🧮', 'abacus (counting beads)', false], ['📟', 'calculator', true], ['🤖', 'robot vacuum', true], ['🍎', 'apple', false], ['📷', 'digital camera', true], ['🧦', 'sock', false]);
  PHONE_PARTS.push(
    ['charging port', 'lets electricity flow in to fill the battery', 'Which part do you plug the charger into?'],
    ['GPS chip', 'listens to satellites to figure out where you are', 'Which part helps a map app know where you are?'],
    ['memory (storage)', 'saves your photos, apps and games', 'Which part saves your photos and apps?'],
    ['vibration motor', 'makes the phone buzz', 'Which part makes the phone buzz?'],
  );
  IO.push(['🕹️', 'joystick', 'input'], ['🔍', 'scanner', 'input'], ['👆', 'fingerprint reader', 'input'], ['💡', 'blinking light on the device', 'output'], ['📽️', 'projector', 'output'], ['🎙️', 'voice command', 'input']);
  SAFE.push(
    ['A friend asks for your password so they can help you in a game. What do you do?', 'Keep it secret: only share passwords with your grown-up', ['Give it to them', 'Post it so you don’t forget'], 'Even good friends should not know your passwords.'],
    ['You see something online that makes you feel scared or uncomfortable. What should you do?', 'Close it and tell a trusted grown-up', ['Keep watching', 'Send it to friends'], 'You will not be in trouble for telling. Grown-ups can help.'],
    ['What is OK to share in a public game chat?', 'Your favorite color', ['Your school name', 'Your phone number'], 'Fun facts are fine. Anything that helps a stranger find you is private.'],
    ['An app wants to use your location. What is the smart move?', 'Ask a grown-up first', ['Always say yes', 'Turn your phone off forever'], 'Location tells people where you are. A grown-up can help decide.'],
    ['How can you tell if a website is a trusted source for a school report?', 'Check who made it and see if other trusted sites agree', ['If it has lots of ads', 'If it uses big letters'], 'Libraries, museums, science groups and news you know are good places to check.'],
    ['How much screen time is healthy?', 'Take breaks, move your body and follow your family’s rules', ['As much as possible', 'Only at night'], 'Breaks help your eyes, your body and your brain.'],
  );
  WAVES.push(
    ['What happens to Wi-Fi signal when you walk far from the router?', 'It gets weaker', ['It gets stronger', 'It changes color'], 'Radio waves spread out and fade with distance. Walls block them too.'],
    ['Which of these also uses radio waves?', 'A car radio', ['A flashlight', 'A garden hose'], 'Radios, TVs, phones, Wi-Fi and GPS all use radio waves.'],
    ['Why are cell towers built up high?', 'So signals can reach far without being blocked', ['To be closer to the Sun', 'To keep birds away'], 'Hills and buildings block signals, so high is better.'],
    ['What does Bluetooth do?', 'Connects devices that are close by, like wireless headphones', ['Paints your teeth blue', 'Connects to satellites'], 'Bluetooth is short-range radio, good for about one room.'],
  );
  CLOUD.push(
    ['Where are cloud photos really stored?', 'On servers in big buildings called data centers', ['In the sky', 'Inside your camera only'], 'Data centers hold thousands of computers that store files and run apps.'],
    ['Why does the internet split big files into packets?', 'Small pieces travel faster and can take different paths', ['To make them lose pieces', 'Because computers can’t read big files'], 'If one packet gets lost, only that piece is sent again.'],
    ['A website address like joynot.com is called a…', 'Domain name', ['Password', 'Screen name'], 'DNS changes the domain name into an IP address.'],
  );
  SCIENCE.push(
    ['How does a phone charger fill the battery?', 'It sends electricity that is stored as chemical energy', ['It pours in liquid', 'It sends light'], 'When you use the phone, the battery turns chemical energy back into electricity.'],
    ['What does a phone’s face unlock use to see your face?', 'A camera and sensors that measure your face', ['A tiny mirror', 'Your voice'], 'It compares the shape of your face to the one it saved.'],
    ['Why do phone screens use millions of pixels?', 'Tiny colored dots together make pictures', ['To keep it warm', 'To store music'], 'Each pixel mixes red, green and blue light.'],
  );
}

export const SIGNAL_GEN = {
  5: () => {
    const bits = Array.from({ length: 4 }, () => rand(0, 1)); if (!bits.some(Boolean)) bits[3] = 1;
    const vals = [8, 4, 2, 1], n = bits.reduce((s, b, i) => s + b * vals[i], 0), code = bits.join('');
    return mcq('bin' + code, `Read the binary code ${code}. The cards are worth 8, 4, 2 and 1. What number is it?`, String(n), [String(n + 1), String(Math.max(0, n - 2) === n ? n + 3 : Math.max(0, n - 2))],
      'Add up the cards that are ON (1). Cards that are OFF (0) count as nothing.', bits.map((b, i) => `${vals[i]} card: ${b ? 'ON, add ' + vals[i] : 'off'}`).concat([`${bits.map((b, i) => (b ? vals[i] : 0)).filter(Boolean).join(' + ')} = ${n}`]));
  },
  9: () => {
    const per = pick([4, 5, 10]), len = rand(2, 9) * per + rand(0, per - 1), n = Math.ceil(len / per);
    return mcq('pkt' + len + per, `A message has ${len} letters. Each packet can carry ${per} letters. How many packets does it need?`, String(n), [String(n - 1), String(n + 2)],
      'If letters are left over, they still need one more packet.', [`${len} ÷ ${per} = ${Math.floor(len / per)}${len % per ? ` with ${len % per} left over` : ''}.`, len % per ? `The leftover letters need 1 more packet: ${n}.` : `So ${n} packets.`]);
  },
  10: () => {
    if (Math.random() < 0.5) {
      const photo = pick([2, 3, 4, 5]), space = photo * rand(5, 20);
      return mcq('st' + photo + space, `Each photo uses ${photo} MB of storage. You have ${space} MB free. How many photos can you save?`, String(space / photo), [String(space - photo), String(space * photo)], `${space} ÷ ${photo} = ${space / photo} photos.`, [`Storage ÷ size of one photo = how many fit.`, `${space} ÷ ${photo} = ${space / photo}.`]);
    }
    const pct = rand(4, 9) * 10, hrs = rand(1, 3), use = pick([10, 20]);
    const left = pct - use * hrs;
    if (left < 0) return null;
    return mcq('bt' + pct + hrs + use, `Your battery is at ${pct}%. A game uses ${use}% every hour. How much is left after ${hrs} hour${hrs > 1 ? 's' : ''}?`, `${left}%`, [`${pct - use}%`, `${pct + use * hrs}%`].filter(x => x !== `${left}%`), `${use} × ${hrs} = ${use * hrs}% used. ${pct} − ${use * hrs} = ${left}%.`);
  },
};
export const PACKET_WORDS = ['HELLO', 'GAMES', 'PIZZA', 'PLANET', 'ROBOT', 'TIGER', 'MUSIC', 'SPACE', 'CASTLE', 'DRAGON', 'GARDEN', 'ROCKET', 'PUPPY', 'OCEAN', 'BRIDGE', 'SOCCER', 'FRIEND', 'SCHOOL', 'JUNGLE', 'PENCIL'];

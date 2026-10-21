// Bee Smart: real bee science, dangers, Field Guide cards, hive rooms and real-life lines.

/** Why bees matter (one per trip, spoken at the start). */
export const WHY = [
  'Bees help plants make fruit and seeds. About one out of every three bites of food we eat needs pollinators like bees!',
  'When a bee visits a flower, yellow pollen sticks to her fuzzy body. She carries it to the next flower. That is called pollination.',
  'Apples, strawberries, pumpkins, almonds and blueberries all need bees to grow.',
  'A honey bee visits about fifty to one hundred flowers on one trip out of the hive.',
  'Bees drink sweet nectar from flowers and bring it home to make honey.',
  'Without bees, farms would grow much less food, and many flowers could not make seeds.',
];

/** Dangers, introduced the first time a kid meets them. icon '#hornet' is drawn on the canvas. */
export const DANGERS = {
  hornet: { icon: '#hornet', name: 'Hornets', text: 'Hornets are big wasps that hunt bees. Stay away from them!' },
  bird: { icon: '🐦', name: 'Birds', text: 'Some birds catch bees to eat. When you see a shadow, fly out of the way!' },
  web: { icon: '🕸️', name: 'Spider webs', text: 'Sticky webs can trap a bee. Fly around them.' },
  wind: { icon: '🌀', name: 'Wind', text: 'Strong wind pushes little bees around. Fly against it to stay on course.' },
  rain: { icon: '🌧️', name: 'Rain', text: 'Wet wings are heavy and slow. Hide under a leaf 🍃 when the rain cloud comes.' },
  spray: { icon: '🚜', name: 'Crop spray', text: 'Some farm sprays hurt bees. Stay out of the spray cloud behind the tractor.' },
  tower: { icon: '🏢', name: 'Tall buildings', text: 'You can’t fly through buildings. Find the flowers in parks and window boxes.' },
  raid: { icon: '#hornet', name: 'Hornet raid', text: 'Hornets attack hives! Tap a hornet to call the guard bees. They hug it in a hot “bee ball” to chase it away.' },
};

/** Field Guide: flowers (unlocked by pollinating them). */
export const FLOWERS = {
  '🌸': ['Cherry blossom', 'Cherry trees need bees to turn blossoms into cherries.'],
  '🌼': ['Daisy', 'A daisy is really hundreds of tiny flowers packed together!'],
  '🌻': ['Sunflower', 'Young sunflowers turn to follow the sun across the sky.'],
  '🌷': ['Tulip', 'Tulips bloom in spring, one of the first meals for hungry bees.'],
  '🌺': ['Hibiscus', 'Big open flowers like hibiscus are easy for bees to land on.'],
  '🌹': ['Rose', 'Wild roses with open middles are best for bees.'],
  '🍀': ['Clover', 'Clover is one of a honey bee’s favorite foods. Leave some in your yard!'],
  '💮': ['Apple blossom', 'Every apple starts as a flower that a bee visited.'],
};
export const CRITTERS = {
  hornet: ['#hornet', 'Hornet', 'Hornets hunt other insects, including bees.'],
  bird: ['🐦', 'Bee-eater bird', 'Some birds, like bee-eaters, snap bees out of the air.'],
  web: ['🕸️', 'Spider', 'Spiders catch bugs in sticky webs. They help gardens by eating pests too.'],
  ladybug: ['🐞', 'Ladybug', 'Ladybugs are garden friends. They eat aphids that hurt plants.'],
  butterfly: ['🦋', 'Butterfly', 'Butterflies are pollinators too!'],
  pigeon: ['🐦', 'City pigeon', 'Pigeons live in cities all over the world.'],
  tractor: ['🚜', 'Tractor', 'Farmers can help bees by spraying at night, when bees are home.'],
};

/** Hive science, one new fact each hive visit (by world). */
export const HIVE_FACTS = [
  // K meadow
  ['🍯 How honey is made', 'Bees sip nectar, carry it home, and pass it to house bees who put it in wax cells.'],
  ['👑 The queen', 'Each hive has one queen. She lays up to two thousand eggs a day!'],
  ['🐝 Worker bees', 'Worker bees are all girls. They clean, feed babies, build, guard and fly out for food.'],
  ['⬡ Honeycomb', 'Bees build honeycomb out of wax in six-sided shapes called hexagons.'],
  // 1 orchard
  ['🌀 Fanning wings', 'Nectar is watery. Bees fan their wings to dry it until it turns thick: that’s honey!'],
  ['🕯️ Beeswax', 'Young bees make wax from special spots on their bellies.'],
  ['🍎 Fruit', 'A flower must get pollen before it can grow into a fruit.'],
  // 2 rainy garden
  ['🍼 Nurse bees', 'Nurse bees eat pollen and honey and use their glands to prepare food for the growing larvae.'],
  ['🛡️ Guard bees', 'Guard bees stand at the door and smell every bee that comes in.'],
  ['🌧️ Rainy days', 'Bees stay home when it rains. They live on stored honey.'],
  // 3 farm
  ['🚜 Beekeepers', 'Farmers rent beehives so bees can pollinate their crops, like almonds and pumpkins.'],
  ['⬡ Why hexagons?', 'Hexagons fit together with no gaps, so bees store the most honey using the least wax.'],
  ['🌾 Farms and bees', 'Planting wildflowers next to farm fields gives bees food all summer.'],
  // 4 city
  ['💃 The waggle dance', 'A forager dances to tell other bees where flowers are: the direction of the dance points the way and the length tells how far.'],
  ['☀️ Bee compass', 'Bees use the sun like a compass to find their way home.'],
  ['🏙️ City bees', 'Rooftop gardens and window boxes feed bees living in cities.'],
  // 5 raid
  ['🔥 Bee ball', 'Some honey bees surround a hornet and buzz their muscles to make heat. The hornet gets too hot!'],
  ['🌡️ Hive heater', 'In winter, bees huddle in a ball and shiver to keep the queen warm.'],
  ['📊 Colony size', 'A strong hive can have fifty thousand bees working together.'],
  ['UV nectar guides', 'Bees can see ultraviolet patterns on some petals. These nectar guides help them find the center of a flower. The game uses purple to show the hidden patterns.'],
  ['Nectar and pollen', 'Nectar supplies sugary flight fuel. Pollen supplies protein and fat that growing bees need. Nurse bees prepare food for the larvae.'],
  ['Winter fuel', 'Honey bees cluster together in cold weather. They use stored honey as fuel while vibrating their flight muscles to generate warmth.'],
  ['Buzzing and bee types', 'Some native bees, including bumble bees, shake certain flowers to release pollen. Honey bees cannot perform this buzz pollination. Buzzing letter sounds in this game is phonics practice.'],
];

/** Rooms you build with honey (each one unlocks a hat for your bee). */
export const ROOMS = [
  { id: 'vault', e: '🍯', name: 'Honey Vault', cost: 30, hat: '🎀', fact: 'Honey can last thousands of years without spoiling!' },
  { id: 'nursery', e: '🥚', name: 'Nursery', cost: 70, hat: '🧢', fact: 'A bee egg hatches in three days.' },
  { id: 'wax', e: '🕯️', name: 'Wax Workshop', cost: 120, hat: '🎩', fact: 'Bees eat about eight times more honey than the wax they make.' },
  { id: 'guard', e: '🛡️', name: 'Guard Post', cost: 180, hat: '⛑️', fact: 'Guard bees know their family by smell.' },
  { id: 'dance', e: '💃', name: 'Dance Floor', cost: 250, hat: '🌸', fact: 'The waggle dance is how bees share a map!' },
  { id: 'queen', e: '👑', name: 'Queen’s Chamber', cost: 330, hat: '👑', fact: 'A queen bee can live for several years.' },
];

/** End-of-stage "In real life" lines by literacy level (the engine shows these). */
export const REAL_LIT = {
  1: ['🔤', 'Letters are on signs, cereal boxes and screens everywhere you look.'],
  2: ['📚', 'Libraries and dictionaries put things in ABC order so you can find them fast.'],
  3: ['🗣️', 'Hearing the first sound of a word is the first step to reading it.'],
  4: ['✍️', 'Names and sentences start with a big letter. You see it in every book.'],
  5: ['📝', 'Sounding out words lets you write notes, cards and lists.'],
  6: ['🚢', 'Sh, ch and th are in words you use every day: ship, chips, thank you!'],
  7: ['💌', 'Good spelling helps people read your letters, cards and messages.'],
  8: ['📇', 'Phone contacts, class lists and indexes are all in ABC order.'],
  9: ['🔎', 'Spelling words right helps you search for things online.'],
  10: ['🧩', 'Knowing un-, re- and -ful helps you figure out new words in books.'],
  11: ['📰', 'Writers and reporters check their spelling before anyone reads their work.'],
  12: ['🧠', 'Word parts like -ment and -ous unlock thousands of big words.'],
  13: ['🏆', 'Kids compete in real spelling bees, all the way to a national championship!'],
  14: ['🔬', 'Scientists name new things with Greek and Latin roots, like “telescope” and “biology”.'],
};

// Habitat Heroes data: animals, habitats, adaptations, food chains, food-web jobs and ecosystem changes.
import { pick, sample, shuffle, rand } from '../_joy/js/util.js';
import { addHabitatBanks } from './more.js';

export const HAB = {
  ocean: ['🌊', 'Ocean'], forest: ['🌲', 'Forest'], desert: ['🏜️', 'Desert'], polar: ['❄️', 'Icy Poles'],
  grassland: ['🌾', 'Grassland'], rainforest: ['🌴', 'Rainforest'], water: ['💧', 'Water'], land: ['⛰️', 'Land'],
};
// [emoji, name, habitat, water|land|null, diet: plant|meat|both|null, fact, white?]
export const A = [
  ['🐳', 'whale', 'ocean', 'water', 'meat', 'Blue whales are the biggest animals that ever lived — and they eat tiny shrimp-like krill!'],
  ['🐬', 'dolphin', 'ocean', 'water', 'meat', 'Dolphins breathe air through a blowhole on top of their heads.'],
  ['🦈', 'shark', 'ocean', 'water', 'meat', 'Sharks have been swimming in the ocean since before the dinosaurs.'],
  ['🐙', 'octopus', 'ocean', 'water', 'meat', 'An octopus has eight arms and three hearts!'],
  ['🐠', 'tropical fish', 'ocean', 'water', null, 'Fish breathe underwater with gills.'],
  ['🦑', 'squid', 'ocean', 'water', 'meat', 'Squids squirt ink to escape from danger.'],
  ['🐡', 'pufferfish', 'ocean', 'water', null, 'A pufferfish puffs up like a ball to scare away animals that want to eat it.'],
  ['🦌', 'deer', 'forest', 'land', 'plant', 'Deer munch on leaves, twigs, acorns and grass.'],
  ['🦉', 'owl', 'forest', 'land', 'meat', 'Owls hunt at night and can turn their heads very far around.'],
  ['🦊', 'fox', 'forest', 'land', 'both', 'Foxes eat mice, bugs, berries and fruit.'],
  ['🐻', 'bear', 'forest', 'land', 'both', 'Bears eat berries, nuts, fish and even honey.'],
  ['🦔', 'hedgehog', 'forest', 'land', null, 'Hedgehogs roll into a spiky ball to stay safe.'],
  ['🐺', 'wolf', 'forest', 'land', 'meat', 'Wolves live and hunt together in groups called packs.'],
  ['🦝', 'raccoon', 'forest', 'land', 'both', 'Raccoons eat almost anything — fruit, nuts, bugs and fish.'],
  ['🐪', 'camel', 'desert', 'land', 'plant', "A camel's hump stores fat, not water. Camels can go many days without a drink."],
  ['🦂', 'scorpion', 'desert', 'land', 'meat', 'Scorpions hide under rocks during the hot day and hunt at night.'],
  ['🦎', 'lizard', 'desert', 'land', null, 'Lizards warm up by lying in the sun.'],
  ['🐍', 'rattlesnake', 'desert', 'land', 'meat', 'Rattlesnakes shake their tails to warn other animals to stay away.'],
  ['🐧', 'penguin', 'polar', null, 'meat', "Penguins can't fly, but they are amazing swimmers."],
  ['🐻', 'polar bear', 'polar', 'land', 'meat', 'Polar bears have black skin under their white fur to soak up the sun’s warmth.', true],
  ['🦊', 'arctic fox', 'polar', 'land', 'both', 'Arctic foxes turn white in winter to hide in the snow.', true],
  ['🦉', 'snowy owl', 'polar', 'land', 'meat', 'Snowy owls have feathers on their feet to keep them warm.', true],
  ['🐇', 'arctic hare', 'polar', 'land', 'plant', 'Arctic hares have short ears so they lose less body heat.'],
  ['🦁', 'lion', 'grassland', 'land', 'meat', 'Lions live in family groups called prides.'],
  ['🦒', 'giraffe', 'grassland', 'land', 'plant', 'A giraffe’s long neck helps it reach leaves high up in trees.'],
  ['🦓', 'zebra', 'grassland', 'land', 'plant', 'No two zebras have exactly the same stripes.'],
  ['🐘', 'elephant', 'grassland', 'land', 'plant', 'Elephants use their trunks to drink, smell, and pick up food.'],
  ['🦏', 'rhino', 'grassland', 'land', 'plant', 'Rhinos eat grass and leaves all day long.'],
  ['🦘', 'kangaroo', 'grassland', 'land', 'plant', 'Kangaroos hop on strong back legs and carry babies in a pouch.'],
  ['🦜', 'parrot', 'rainforest', 'land', 'plant', 'Parrots crack open nuts and seeds with their strong beaks.'],
  ['🐒', 'monkey', 'rainforest', 'land', 'both', 'Many monkeys use their tails to hold on to branches.'],
  ['🦍', 'gorilla', 'rainforest', 'land', 'plant', 'Gorillas mostly eat leaves, stems and fruit.'],
  ['🐸', 'tree frog', 'rainforest', null, 'meat', 'Tree frogs have sticky toes for climbing.'],
  ['🐆', 'jaguar', 'rainforest', 'land', 'meat', 'Jaguars are great swimmers — unlike most big cats!'],
  ['🦋', 'butterfly', 'rainforest', 'land', 'plant', 'Butterflies drink sweet nectar from flowers.'],
  ['🐄', 'cow', null, 'land', 'plant', 'Cows chew grass for hours every day.'],
  ['🐴', 'horse', null, 'land', 'plant', 'Horses eat grass and hay.'],
  ['🐑', 'sheep', null, 'land', 'plant', 'Sheep eat grass and grow wool.'],
  ['🐖', 'pig', null, 'land', 'both', 'Pigs will eat plants and meat.'],
  ['🐔', 'chicken', null, 'land', 'both', 'Chickens peck at seeds, bugs and worms.'],
  ['🦅', 'eagle', null, 'land', 'meat', 'Eagles can spot a fish from high up in the sky.'],
  ['🐰', 'rabbit', null, 'land', 'plant', 'Rabbits eat grass, clover and veggies.'],
];
export const DIET = { plant: ['🌿', 'Plant eater', 'herbivore'], meat: ['🍖', 'Meat eater', 'carnivore'], both: ['🍽️', 'Eats both', 'omnivore'] };

export const ADAPT = [
  ['🐪', 'camel', 'live in the hot, dry desert', 'It can go a long time without drinking water.'],
  ['🐻', 'polar bear', 'stay warm in the snow and ice', 'It has thick fur and a layer of fat.', true],
  ['🦆', 'duck', 'swim in a pond', 'It has webbed feet that work like paddles.'],
  ['🦒', 'giraffe', 'get food in the grassland', 'Its long neck reaches leaves high in trees.'],
  ['🐟', 'fish', 'breathe underwater', 'It has gills that take air from the water.'],
  ['🦉', 'owl', 'hunt at night', 'It has big eyes that see well in the dark.'],
  ['🦅', 'eagle', 'catch food', 'It has sharp eyes and sharp claws called talons.'],
  ['🦊', 'arctic fox', 'hide from danger in the snow', 'Its white fur blends in with the snow.', true],
  ['🦔', 'hedgehog', 'stay safe from animals that want to eat it', 'It has sharp spines.'],
  ['🐢', 'turtle', 'stay safe from danger', 'It can hide inside its hard shell.'],
  ['🐘', 'elephant', 'drink water and grab food', 'It uses its long trunk.'],
  ['🦇', 'bat', 'find bugs in the dark', 'It makes sounds and listens to the echoes.'],
  ['🐳', 'whale', 'stay warm in the cold ocean', 'It has a thick layer of fat called blubber.'],
  ['🐸', 'frog', 'catch flying bugs', 'It has a long, sticky tongue.'],
  ['🦘', 'kangaroo', 'travel far across the grassland', 'It hops fast on strong back legs.'],
  ['🌵', 'cactus', 'live where it hardly ever rains', 'It stores water in its thick stem.'],
  ['🐧', 'penguin', 'swim fast to catch fish', 'Its wings work like flippers.'],
  ['🦎', 'chameleon', 'hide from animals that eat it', 'It can change its color to match what is around it.'],
];
export const CHAINS = [
  [['🌾', 'grass'], ['🐇', 'rabbit'], ['🦊', 'fox']],
  [['🌾', 'grass'], ['🦓', 'zebra'], ['🦁', 'lion']],
  [['🌿', 'algae'], ['🐟', 'small fish'], ['🦈', 'shark']],
  [['🌰', 'acorn'], ['🐿️', 'squirrel'], ['🦉', 'owl']],
  [['🍃', 'leaves'], ['🐛', 'caterpillar'], ['🐸', 'frog'], ['🐍', 'snake']],
  [['🌻', 'seeds'], ['🐭', 'mouse'], ['🐍', 'snake'], ['🦅', 'eagle']],
  [['🌿', 'plankton'], ['🐟', 'fish'], ['🐧', 'penguin'], ['🐳', 'orca']],
  [['🌱', 'plant'], ['🦗', 'grasshopper'], ['🐦', 'bird'], ['🦅', 'hawk']],
  [['🍂', 'leaves'], ['🐌', 'snail'], ['🐦', 'bird'], ['🐱', 'wild cat']],
];
export const JOBS = {
  producer: ['☀️', 'Producer', 'makes its own food from sunlight', [['🌳', 'oak tree'], ['🌾', 'grass'], ['🌻', 'sunflower'], ['🌿', 'algae'], ['🌵', 'cactus'], ['🍀', 'clover'], ['🌲', 'pine tree'], ['🌱', 'bean sprout']]],
  consumer: ['🍴', 'Consumer', 'eats plants or other animals', [['🐇', 'rabbit'], ['🦁', 'lion'], ['🐛', 'caterpillar'], ['🦅', 'hawk'], ['🐟', 'fish'], ['🐄', 'cow'], ['🐸', 'frog'], ['🐻', 'bear']]],
  decomposer: ['♻️', 'Decomposer', 'breaks down dead things into soil', [['🍄', 'mushroom'], ['🦠', 'bacteria'], ['🍞', 'bread mold']]],
};
export const CHANGE = [
  ['If all the rabbits in a meadow disappeared, what would happen to the foxes that eat them?', 'They would have less food, so there would be fewer foxes.', ['The foxes would grow bigger.', 'Nothing would change for the foxes.']],
  ['A forest is cut down. What happens to the animals that lived there?', 'They lose their homes and must move or may not survive.', ['They get more food.', 'They are not affected at all.']],
  ['What would happen to many flowers and fruits if there were no bees?', 'Many plants could not make seeds or fruit, because bees carry pollen.', ['The plants would grow faster.', 'There would be more fruit.']],
  ['What would happen if there were no decomposers, like mushrooms and worms?', 'Dead plants and animals would pile up, and soil would lose nutrients.', ['Plants would grow better.', 'Animals would never get hungry.']],
  ['A drought means very little rain for a long time. How does it affect zebras in the grassland?', 'Less grass grows, so zebras have less food and water.', ['Zebras get more grass to eat.', 'Zebras turn into lions.']],
  ['A forest has lots of deer and no wolves. What may happen?', 'The deer may eat too many plants and run out of food.', ['The deer will start eating meat.', 'More trees will grow.']],
  ['Why does every food chain start with a plant?', 'Plants make their own food using energy from the sun.', ['Plants are the biggest living things.', 'Animals do not like to eat other animals.']],
  ['Oil spills into the ocean. Who is hurt?', 'Fish, birds and other ocean life that live in or near the water.', ['Only the boats.', 'Nobody — oil helps the ocean.']],
  ['People plant new trees where a forest burned. How does this help?', 'Animals get homes and food again as the forest grows back.', ['It makes the animals leave.', 'It does not help animals.']],
  ['A new kind of fish is put in a lake and eats all the small fish. What happens to birds that ate the small fish?', 'They have less food and may leave or go hungry.', ['They get more food.', 'They learn to eat rocks.']],
];

addHabitatBanks({ ADAPT, CHAINS, JOBS, CHANGE });

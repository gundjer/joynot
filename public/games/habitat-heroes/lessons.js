// Habitat Heroes — lessons. Science vocabulary + cause and effect, from habitats to food webs.
import { eq, note, stack, pics } from '../_joy/js/lesson.js';

export const LESSONS = {
  1: [
    { title: 'Where animals live', text: 'Every animal has a home where it can find food, water and shelter. Some animals live in WATER, some live on LAND.', art: stack(pics([['🐬', 'water'], ['🐙', 'water'], ['🐟', 'water']]), pics([['🦁', 'land'], ['🐄', 'land'], ['🐰', 'land']])) },
    { title: 'Clues', text: 'Look for clues! Fins and gills mean water. Legs and fur usually mean land.', art: pics([['🐠', 'fins = water'], ['🦊', 'legs + fur = land']]) },
  ],
  2: [
    { title: 'Habitats', text: 'A HABITAT is the natural home of an animal. The ocean is salty water. A forest has lots of trees. A desert is very dry and hot.', art: pics([['🌊', 'Ocean'], ['🌲', 'Forest'], ['🏜️', 'Desert']]) },
  ],
  3: [
    { title: 'The icy poles', text: 'At the top and bottom of Earth it is freezing cold. Animals there have thick fur, feathers or fat to stay warm.', art: pics([['🐧', 'penguin'], ['❄️', 'ice'], ['🦉', 'snowy owl']]) },
  ],
  4: [
    { title: 'Six habitats', text: 'Grasslands are wide and grassy (lions, zebras). Rainforests are hot, wet and full of trees (monkeys, parrots).', art: pics([['🌊', 'Ocean'], ['🌲', 'Forest'], ['🏜️', 'Desert'], ['❄️', 'Poles'], ['🌾', 'Grassland'], ['🌴', 'Rainforest']]) },
  ],
  5: [
    { title: 'What animals eat', text: 'HERBIVORES eat only plants. CARNIVORES eat other animals. OMNIVORES eat both plants and animals — like bears, and people!', art: pics([['🐄', 'herbivore'], ['🦁', 'carnivore'], ['🐻', 'omnivore']]) },
    { title: 'Teeth are clues', text: 'Flat teeth grind plants. Sharp pointed teeth tear meat. Omnivores have both.', art: note('Flat teeth 🌿 · Sharp teeth 🍖 · Both 🍽️') },
  ],
  6: [
    { title: 'Adaptations', text: 'An ADAPTATION is a body part or behavior that helps an animal survive where it lives. A camel can go days without water. A duck has webbed feet for swimming.', art: pics([['🐪', 'saves water'], ['🦆', 'webbed feet'], ['🦒', 'long neck']]) },
  ],
  7: [
    { title: 'Food chains', text: 'A FOOD CHAIN shows who eats whom. It always starts with a plant, because plants make food from sunlight. The arrow means "is eaten by" — energy moves along it.', art: stack(pics([['☀️', 'sun'], ['🌾', 'grass'], ['🐇', 'rabbit'], ['🦊', 'fox']]), note('sun → grass → rabbit → fox')) },
  ],
  8: [
    { title: 'Jobs in an ecosystem', text: 'PRODUCERS (plants) make food from sunlight. CONSUMERS eat plants or animals. DECOMPOSERS (mushrooms, worms, bacteria) break down dead things into soil so new plants can grow.', art: pics([['🌻', 'producer'], ['🐇', 'consumer'], ['🍄', 'decomposer']]) },
  ],
  9: [
    { title: 'Everything is connected', text: 'In a FOOD WEB, many food chains connect. If one living thing disappears, it changes things for the others. Fewer rabbits → less food for foxes.', art: note('🌾 → 🐇 → 🦊<br>🌾 → 🐭 → 🦉<br>Remove 🐇 → 🦊 go hungry') },
    { title: 'People matter too', text: 'People can harm habitats (pollution, cutting forests) or help them (planting trees, recycling, protecting parks). Scientists study these changes.', art: pics([['🌳', 'plant trees'], ['♻️', 'recycle'], ['🏞️', 'protect parks']]) },
  ],
};

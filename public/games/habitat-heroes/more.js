// Habitat Heroes: more food chains, producers/consumers/decomposers and "what if" ecosystem questions.
export function addHabitatBanks({ ADAPT, CHAINS, JOBS, CHANGE }) {
  ADAPT.push(
    ['🐿️', 'squirrel', 'get ready for winter', 'It hides nuts to eat when food is hard to find.'],
    ['🦈', 'shark', 'swim fast to catch prey', 'Its smooth, pointed body slips through water.'],
    ['🐙', 'octopus', 'escape from danger', 'It squirts ink and squeezes into tiny cracks.'],
    ['🦓', 'zebra', 'stay safe in a herd', 'Its stripes make it hard for lions to pick out one zebra.'],
  );
  CHAINS.push(
    [['🌾', 'grass'], ['🐄', 'cow'], ['🧑', 'person']],
    [['🌿', 'leaves'], ['🦒', 'giraffe'], ['🦁', 'lion']],
    [['🌸', 'flower nectar'], ['🦋', 'butterfly'], ['🐦', 'bird']],
    [['🌿', 'seaweed'], ['🐢', 'sea turtle'], ['🦈', 'shark']],
    [['🌾', 'wheat'], ['🐭', 'mouse'], ['🦉', 'owl']],
  );
  JOBS.producer[3].push(['🍎', 'apple tree'], ['🌽', 'corn plant']);
  JOBS.consumer[3].push(['🦊', 'fox'], ['🐝', 'bee'], ['🐋', 'whale']);
  JOBS.decomposer[3].push(['🐛', 'earthworm'], ['🐞', 'beetle that eats dead wood']);
  CHANGE.push(
    ['A town builds a big new road through a meadow. How might it change things for the rabbits?', 'They may lose space, food and safe places to hide.', ['They will get more food.', 'Nothing will change.'], 'Animals need food, water, shelter and space. Taking away space affects all of them.'],
    ['A pond dries up in summer. What happens to the frogs?', 'They must find another wet place or they may not survive.', ['They grow fur.', 'They are happier.'], 'Frogs need water to keep their skin wet and to lay eggs.'],
    ['People put a bird feeder and a birdbath in a yard. What may happen?', 'More birds may visit because there is food and water.', ['Birds will stay away.', 'Squirrels will disappear.'], 'Giving animals what they need helps them.'],
    ['Too many fish are caught from the ocean. What happens to seals that eat fish?', 'Seals have less food and their numbers may drop.', ['Seals get more food.', 'Seals start eating plants.'], 'Every animal in a food web is connected.'],
    ['Why is pollution in rivers a problem for animals far away in the ocean?', 'Rivers flow into the ocean and carry the pollution there.', ['Rivers never reach the ocean.', 'Pollution disappears in water.'], 'Water connects habitats.'],
    ['Wolves come back to a park with too many elk. What can happen?', 'Elk numbers go down, so more young trees and plants can grow.', ['Plants all die.', 'Elk grow bigger.'], 'Predators help keep an ecosystem in balance.'],
  );
}

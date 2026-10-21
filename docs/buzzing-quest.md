# Buzzing Quest: Pollen, Honey & Survival

The existing `bee-smart` game key, grade ladders, learning reports, saved honey and rooms remain compatible. The dashboard name is Buzzing Quest. Existing family helpers join through the same authenticated, PIN-protected Grown-Ups area.

## Flight and graphics

The game renders locally in WebGL using modeled flowers, individual petals and leaves, tree branches, bark and ground materials, pollen, hornets, birds, spider webs, rain, crop sprayers, water and honeycomb cells. The original top-down renderer remains available automatically on devices without WebGL. Shadow mapping and atmospheric haze provide depth; UV markings and the compound-eye overlay are optional. Family helper devices render the same meadow locally.

- Arrow keys / WASD or the touch joystick move horizontally; tapping a flower steers toward its landing pad.
- R and F change height; Shift or the Boost button increases speed at an energy cost.
- Bee eyes switches to first-person; Follow view switches back.
- Hive steers home. The flight timer and energy stop during puzzles, field-guide use, chat and pause screens.
- Nectar restores flight energy. Pollen and nectar have separate cargo counters. Empty emergency returns create no honey. Partial harvests do not count as a completed grade mission.
- The hive visit includes counting cells, drying nectar, wax capping, feeding larvae, a winter-cluster exercise, science facts and room building. The winter exercise consumes one honey drop. Honey is credited once per visit.

## Science references

- [USDA NRCS: New Jersey Pollinators](https://www.nrcs.usda.gov/state-offices/new-jersey/new-jersey-pollinators) explains that honey bees cannot perform buzz pollination. Phonics buzzing is treated as a learning activity; the field guide distinguishes honey bees from buzz-pollinating native bees.
- [US Forest Service: Pollinators](https://www.fs.usda.gov/Internet/FSE_DOCUMENTS/fseprd899357.pdf) describes ultraviolet nectar guides. Purple in the game represents those markings.
- [Penn State Extension: Honey Bee Management Throughout the Seasons](https://extension.psu.edu/honey-bee-management-throughout-the-seasons) describes seasonal foraging and winter thermoregulating clusters.
- [Mississippi State University Extension: Colony Growth and Seasonal Management](https://www.extension.msstate.edu/publications/colony-growth-and-seasonal-management-honey-bees) describes winter honey use and variable cluster temperatures. The game uses a warmth meter rather than teaching a single fixed temperature for every winter cluster.

## Deployment and checks

Deploy both modified files and new files under `public/games/bee-smart`, the renderer in `public/games/sparkles-rainbow-journey/js/board-scene.js` and its existing dependencies, `public/sw.js`, the game configuration and application metadata. The Bee Smart version receives a `-buzzing-quest-1` suffix to update the entry script and stylesheet. Clearing Laravel's cache alone does not copy or deploy new JavaScript files.

Run `node --test tests/bee-flight.test.js tests/game-assets.test.js` and `node tests/Browser/bee-quest.cjs` against the isolated browser test server described in `tests/Browser/README.md`. Screenshots and the browser report appear under `storage/testing/buzzing-*`.

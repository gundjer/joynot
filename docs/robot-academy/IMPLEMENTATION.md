# Robot Training Academy (Robo Brain replacement)

The production game at `/play/robo-brain/{kid}` uses the actual renderer, robot model and photographic materials from the accepted local prototype. The old quiz/sorting engine is no longer mounted for Robo Brain. Prototype files remain separate for visual comparison.

## Six adventure levels

The map unlocks these levels in order, with independent trophies. The existing three workshop variations remain optional practice inside Level 1.

| Level | Player activity | Actual learning model |
| --- | --- | --- |
| 1. Robot Training Workshop | Pick, label, train, watch new deliveries and improve examples | Nearest-example classifier using color, shape and stem features |
| 2. Rescue Robot | Hear synthesized sound patterns, label examples, investigate predictions and rescue two friends | Nearest-example matching of authored rhythm/pitch feature vectors; no microphone recording or speech recognition |
| 3. Find a Better Way | Edit physical course tiles, set reward goals, train and run deliveries | Tabular Q-learning with exploration, step costs, hazard penalties, chargers and terminal delivery reward |
| 4. Creature Care Center | Offer items, observe individual reactions and test recommendations | Collaborative filtering from shared creature preferences; suggestions with no shared evidence are explicitly called trial suggestions |
| 5. Storyworld Studio | Author picture sequences, train a generator, generate and play a new story, repair missing crossings | Seeded Markov transition generator trained on the player's examples; not an external language model |
| 6. Robot Detective | Inspect a recording/logs, verify observations, compare changing AI leads, find the parcel | Naive Bayes on six transparent authored past cases; evidence changes relative model weights, not real-world calibrated certainty |

K–1 uses fewer required examples, two care goals and a 4×4 course. Grades 2–3 use a 5×5 course with a hazard shortcut and three care goals. Grades 4–5 use a more constrained 6×6 course, more practice episodes and visible model details. Older story authors supply two examples; early readers can use editable picture starters. Difficulty remains controlled by the Grown-Ups grade setting.

The child owns exploration/teaching. Family members can own training and testing on their own screens; missing teammates are bots. Each level provides explicit bot handoff buttons as well as manual controls for an open bot role. Parents can help verify detective evidence. Only the child selects levels. Both views render the same serialized activity and timed robot action; the child device owns outcomes and rewards.

Saved version-1 workshop sessions migrate to version 2. Saved timed adventures retain their elapsed progress and model snapshot. Previously earned workshop trophies unlock Level 2; repeated completions do not award duplicate data chips. A completed level unlocks the next. Completing Level 6 returns to the map for replay.

## Help and accessibility

- Pulsing next-action controls and a moving yellow target in the world.
- Large object pictures and two picture trays; keyboard-operable alternatives to 3D picking.
- Spoken step guidance after Start, object selection, phase changes and test transitions, with narration enabled by default.
- Hint, Show me and Hear step controls stay available. Demonstrations do not silently label a child's data.
- Help explains what AI is, how the learned prediction differs from a programmed walking route, and how to perform each action.
- Touch orbit/pinch zoom, fullscreen, reduced-motion styling, phone and landscape layouts, and explicit Exit.
- Separate background music and voice switches. Music stops on exit, hidden/blurred views and completed missions.
- Unsupported WebGL shows a readable error and an Exit button.

## Cooperative roles

The child collects and labels. Authenticated Grown-Ups members can claim trainer or tester on separate devices, and both devices render the same serialized academy state. Two family members can play these jobs together; additional members can watch and help. Open training/testing jobs are bots. Bots wait for the team's handoff instead of choosing the child's labels. The child can also try an open bot job manually.

Host validates role ownership, revision and action allowlists. Public state contains hashed controller labels, not bearer tokens. Leaving a family role releases it immediately; missing family members' jobs return to bots after a grace period. Saved sessions resume with bots filling temporarily disconnected jobs until family rejoins.

Reports show child labeling actions, team training/test runs and completed missions. Robot predictions are not reported as independent quiz answers from the child.

## Assets and tests

Local assets are copied into `academy/assets/` and `academy/vendor/` with original licenses. Source links and source URLs are in `docs/robot-academy/README.md` and `asset-downloads.json`. The render uses real photographic floor/wood maps and HDR lighting; no generated scene image is used.

- `tests/academy.test.js`: grade progression, actual learned mistakes/improvements, role enforcement, bot boundaries, cautious predictions, restore validation and hints.
- `tests/Browser/academy-game.cjs`: separate child and authenticated family devices, training ownership, synchronized deliveries, bot handoff, trophies/recovery, and phone help. Set `ACADEMY_RELAY=1` to disable direct WebRTC and test server relay.
- `tests/Browser/academy-guidance.cjs`: older-grade feature experiment, live delivery sequence, and browser speech-call verification for early-reader directions.

Local changes require deploying the new PHP view/class, modules, vendor files, images/model/HDR, helper integration and service worker together. This workspace does not deploy them automatically.

## Rebuilding the shipped module

The game and helper load `academy/ui.bundle.js` to avoid a large graph of separate graphics requests on phones. The editable source remains `ui.js`, `world.js`, `training.js`, `adventures.js`, `adventure-ui.js` and `adventure-world.js`. Rebuild after editing those files, from the workspace root:

```powershell
npx --yes --package=esbuild@0.25.0 esbuild public/games/robo-brain/academy/ui.js --bundle --format=esm --target=es2020 --minify --legal-comments=linked --external:../../_joy/js/* --external:../../star-academy/space-audio.js --outfile=public/games/robo-brain/academy/ui.bundle.js
```

Shared narration/audio stay external so host effects and the music switch use the same audio owner. The full Three.js MIT notice is retained in `academy/vendor/THREE-LICENSE.txt` alongside the generated bundle legal notice.

## Additional adventure assets and verification

Leafy Grass photographic color/normal maps are bundled locally from [Poly Haven](https://polyhaven.com/a/leafy_grass), CC0. The five new environments use authored Three.js geometry, the existing CC0 robot, shared photographic materials and HDR lighting. No generated concept image is used as a scene backdrop.

`node --test tests/academy.test.js tests/academy-adventures.test.js tests/game-assets.test.js` checks all six grades, real prediction changes, blocked routes, progression, role boundaries, migration and shipped module paths. `tests/Browser/academy-adventures.cjs` completes all six levels through their controls, including an initially wrong detective lead, trophy restoration and phone guidance. `tests/Browser/academy-adventures-family.cjs` checks Grown-Ups training ownership, live level/evidence synchronization and phone layouts. Screenshots under `storage/testing/academy-*` are actual renderer captures. Production loads `ui.bundle.js`; rebuild it after source changes.

Family snapshots are immutable copies, so queued relay updates cannot combine a previous revision key with newly mutated examples or role assignments. Regression tests cover this case. Wrong sound labels now cause missed rescues until the player repairs examples and retrains.

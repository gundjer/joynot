# Robot Training Academy: rendered visual baseline

This is a separate, working visual prototype. It does not replace the existing Robo Brain game or its routes. No generated concept image is used as a backdrop or screenshot.

Open `/prototypes/robot-academy/index.html` on the local application's web server. All models, libraries and textures load locally; no runtime CDN is required. This prototype requires WebGL 2.

## Actual screenshots

- `01-collect-desktop.png`: collection bench, learner robot, bot helper and connected workshop.
- `02-train-desktop.png`: physical training display with examples and model status.
- `03-test-mistake-desktop.png`: a model trained without green apples incorrectly delivers a green apple to OTHER ITEMS.
- `04-test-improved-desktop.png`: after adding a green apple and retraining, the same test delivers correctly.
- `05-parent-camera-desktop.png`: alternate role camera of the same local state.
- `06-phone.png`: actual 390 × 844 browser layout.

These images are unretouched Playwright screenshots of the running Three.js renderer and HTML interface, captured at 1600 × 1000 unless noted. They are the demonstrated visual baseline, rather than a promise to reproduce the earlier generated illustration. The robot and props are deliberately simpler than photorealistic people. Existing JoyNot logo is unchanged.

## What already works

- Camera orbit, touch/pinch zoom, scene transitions and fullscreen where supported.
- Clicking 3D objects or accessible object buttons adds labeled training examples.
- A small nearest-example classifier uses explicit color and shape features. Training copies the selected examples into a separate model; collecting more examples alone does not change it until retraining.
- A robot delivery test animates the resulting classification, including a mistake and subsequent improvement.
- Two camera presets show how family members could look at the same scene.
- Help and asset credits dialogs.

## Not implemented in this visual prototype

Authenticated multiplayer, network synchronization, joining/leaving players, role assignment, autonomous bot task execution, persistent progression, grade-scaled missions, avatar customization and audio. Parent camera is a clearly labeled role preview in the same browser, not a connected multiplayer session. These remain full-game development work. R0 is the learner; Pip is the proposed teammate bot.

## Reproducibility

Run `tests/Browser/robot-academy-preview.cjs` with PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE configured. The test uses the existing isolated browser test server on port 8766 and does not write learner progress. It verifies the actual wrong-then-correct prediction, browser errors, phone width and captures all six screenshots.

All photographic materials and the robot below are already incorporated, not just shortlisted:

| Asset | Source and license | Use |
| --- | --- | --- |
| Smooth Concrete Floor | https://polyhaven.com/a/smooth_concrete_floor · Dimitrios Savva · CC0 | Color/normal/roughness maps on floor; color partially desaturated in shader |
| Wood Table 001 | https://polyhaven.com/a/wood_table_001 · Poly Haven · CC0 | Color/normal maps on benches, shelves and crates; material tint |
| Industrial Workshop Foundry | https://polyhaven.com/a/industrial_workshop_foundry · Dimitrios Savva / Jarod Guest · CC0 | HDR environment lighting and material reflections, not a backdrop |
| RobotExpressive | https://github.com/mrdoob/three.js/tree/r170/examples/models/gltf/RobotExpressive · Tomás Laulhé, modifications Don McCurdy · CC0 per bundled README | Animated learner and smaller helper model |
| Three.js r170 | https://github.com/mrdoob/three.js/tree/r170 · MIT | Local renderer, loaders and camera controls |

Original robot license is in `assets/ROBOT-LICENSE.md`; Three.js license is in `vendor/THREE-LICENSE.txt`. Download URLs are recorded in `asset-downloads.json`. Room, furniture geometry, signs, fruit and interface are code-built. The photographic assets are mapped onto real 3D geometry; no AI-generated image is part of the scene.

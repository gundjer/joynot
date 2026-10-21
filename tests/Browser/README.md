# Browser verification

These tests use a separate SQLite database in `storage/testing/smoke.sqlite`, a test family, and Chromium's simulated cameras. They never use the application's normal database. `server.php` provides a test login; use it only as the explicitly selected local test router.

Install Playwright separately (`npm install --no-save playwright` and `npx playwright install chromium`), or set `PLAYWRIGHT_MODULE` to an existing Playwright package. Set `BROWSER_EXECUTABLE` when using an existing Chromium/Chrome executable.

From the project root:

```sh
php tests/Browser/server.php
php -S 127.0.0.1:8766 -t public tests/Browser/server.php
```

In another terminal, run these **sequentially**: they deliberately share the same test kid, so launching the same game simultaneously replaces its co-op session.

```sh
node tests/Browser/games.cjs
node tests/Browser/video.cjs
node tests/Browser/fallback.cjs
node tests/Browser/rusty.cjs
node tests/Browser/candy.cjs
node tests/Browser/candy-graphics.cjs
node tests/Browser/bee-quest.cjs
```

The game test opens all 21 games, advances the initial teaching screens, and captures loading/script errors. The video test checks decoded camera frames in both directions for the standard parent view and Guard Bee, then refreshes and checks rejoin/video recovery. The fallback test disables WebRTC and checks camera pictures in both directions. JSON reports are written to `storage/testing`.

The Rusty test checks WebGL rendering, coin purchases, battery pickups/use, doors and the powered exit, the 3D workshop and part guide on desktop/mobile, and a parent reset during robot activation. It simulates successful quiz responses when checking door transitions; it does not test speech recognition. Screenshots are saved in `storage/testing/rusty-*.png`.

These checks cover startup and local video transport, not every game level or real devices on different networks. Cross-network calls require a working coturn deployment: configure `JOYNOT_TURN_HOST` and the matching `JOYNOT_TURN_SECRET`, or the fixed-account TURN URL/username/password variables in `.env.example`. Refresh Laravel's cached configuration after changing deployment settings.

The Candy Cloud Trail check covers locked dice, wrong-answer retries, bot turns, distinct shirts, saved rolls, winning and reward idempotency, phone/tablet/landscape layouts, an independently authenticated family device, turn ownership, reconnecting, and the canvas fallback. Set `CANDY_RELAY=1` to run the same checks with WebRTC disabled; board turns use the existing authenticated HTTP relay and do not require TURN. Screenshots and JSON results are saved under `storage/testing/candy-*`.

The graphics check verifies an error-free WebGL render with beveled pieces, shadow mapping, printed tile textures, modeled routes and dice, and checks that questions and answers stay below the board and inside the viewport at desktop and phone sizes. It saves `candy-detailed-*` previews. The main Candy test also checks local/remote color choices, reserved colors, saved colors, and the original JoyNot logo.

The Buzzing Quest check verifies WebGL meadow rendering, altitude and vision controls, flower landings, the paused educational timer, the complete nectar-to-honey/larva/winter sequence, family-helper rendering, hazard worlds, safe emergency returns and responsive layouts. See `docs/buzzing-quest.md` for controls, deployment files and science references.

Other regression checks:

```sh
php artisan test
node --test tests/*.test.js
```
# Quillbound / Write It

Run `node tests/Browser/quillbound-3d.cjs` with the configured Playwright module and browser executable, against the same isolated test server. It checks actual 3D walking, blocking gates, bridge traversal, rune dice, in-world scrolls, a dragon encounter, scratch maps, equipment and spell decks, expedition persistence and responsive layouts. `quillbound.cjs` forwards to this test. See `docs/quillbound.md` for mechanics and deployment details.

Run `node tests/Browser/quillbound-guidance.cjs` for the narrated opening, automatic approach greetings, golden trail, mute/replay controls, actual slime calming, spoken bridge instructions/outcome and phone layouts. This test captures requests at the browser speech API boundary instead of requiring an audio device.

# Gizmo Garage inventor workshop

Run `node tests/Browser/gizmo-garage.cjs` against the isolated server with the same Playwright/browser environment variables. It checks the free parts workshop, illustrated and spoken fulcrum guide, editable pound weights, optional 10 lb / 2 lb trophy without stopping play, Save & quit/Continue, responsive layouts and separate-device family controls. Set `GARAGE_RELAY=1` to exercise the server fallback. Pure mechanics: `node --test tests/gizmo-inventor.test.js tests/gizmo-physics.test.js tests/game-assets.test.js`. Design and deployment: `docs/gizmo-garage-redesign.md`.

Run `node tests/Browser/gizmo-rope.cjs` for live draft rope, numbered sockets, invalid-route guidance, saved connections, lifting, Cancel preservation, Clear board versus single-change Undo, trophy preservation and real phone touch events. Unit coverage is in `tests/gizmo-rope.test.js`.

Run `node tests/Browser/gizmo-crank.cjs` to test mouse/touch crank circles, reversing rotation, releasing input, moving gears during Run and placing labeled weight presets. It mounts the actual workshop/solver in an isolated browser fixture.

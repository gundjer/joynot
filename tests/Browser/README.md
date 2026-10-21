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
```

The game test opens all 21 games, advances the initial teaching screens, and captures loading/script errors. The video test checks decoded camera frames in both directions for the standard parent view and Guard Bee, then refreshes and checks rejoin/video recovery. The fallback test disables WebRTC and checks camera pictures in both directions. JSON reports are written to `storage/testing`.

The Rusty test checks WebGL rendering, coin purchases, battery pickups/use, doors and the powered exit, the 3D workshop and part guide on desktop/mobile, and a parent reset during robot activation. It simulates successful quiz responses when checking door transitions; it does not test speech recognition. Screenshots are saved in `storage/testing/rusty-*.png`.

These checks cover startup and local video transport, not every game level or real devices on different networks. Cross-network calls require a working coturn deployment: configure `JOYNOT_TURN_HOST` and the matching `JOYNOT_TURN_SECRET`, or the fixed-account TURN URL/username/password variables in `.env.example`. Refresh Laravel's cached configuration after changing deployment settings.

Other regression checks:

```sh
php artisan test
node --test tests/*.test.js
```

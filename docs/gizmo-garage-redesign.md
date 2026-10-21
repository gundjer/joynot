# Gizmo Garage: Inventor’s Playground

## Current experience

The game opens a parts workshop. Children can invent freely with all fourteen part types; no customer job, quiz answer, parts budget or completed challenge is required. The school grade suggests optional trophy challenges. It does not lock parts. Family co-building remains available through the existing private Grown-Ups join flow.

The main book offers Open my parts workshop, Build with family, Show me a seesaw, optional trophy cards and saved inventions. Show me a seesaw places a beam, separate green fulcrum, 2 lb weight and 2 lb pusher. Children press Run and hold Power, then Reset to change the machine. The example is editable. Loading it from inside the workshop is reversible with Undo.

A fulcrum is explicitly introduced as the support under a seesaw: the beam rests on its point and turns around it. It is a separate draggable component, not an unexplained slider inside a combined lever. Moving the support changes the actual distances on each side and therefore the forces needed to lift the weight.

Every part in the drawer has its own independent ? button. The inspector also has What does this do? Clicking either opens a labeled illustration, short purpose, three steps to try, a familiar example and read-aloud support. Asking about a drawer part never places it. General Help provides an illustrated seesaw starting guide. Help pauses shared motion without deleting the design; it does not toggle an already paused test back on. Escape and Back to my machine return to play. Children can inspect parts during a running test too.

Save & quit is visible in the workshop header, including the family controller. The child's exit saves the blueprint, ends the family session and returns to JoyNot. Continue my last invention restores the design. A family guest's exit leaves that session without quitting the child's game. The book scrolls independently of the shared quiz stylesheet so saved inventions remain reachable.

## Direct play controls

Grab the blue knob on a hand crank and drag in a circle with mouse or touch. This starts the test when still building. Signed angular input drives the real transmission in either direction with a finite torque limit; releasing stops input and leaves physical coasting. Hold Power remains optional automatic drive. Family commands use per-crank ownership and expiring holds. Pause, reset, Help and Clear board release manual input.

Gears can be dragged during a running or paused test. Moving their centers changes actual meshing on the host immediately, so a child can connect and disconnect a transmission without resetting. A continuous drag is recorded as one edit. A persistent weight rack above the board provides 1, 2, 5, 10 and 20 lb blocks through tap/place or drag/drop; Reset test re-enables adding weights.

## Parts and interaction

| Part | What children do |
|---|---|
| Weight | Choose 1–20 lb; drop on ramps, clip to a lever cradle, connect to rope or lift with a jack |
| Fulcrum | Place its green tip against a beam and drag it toward or away from a load |
| Lever beam | Change angle/length; combine with a fulcrum, weights, pushers or counterweights |
| Pusher | Choose input force; push down on a nearby beam end or push a loose weight right |
| Ramp | Change position, slope, length and friction; guide falling weights |
| Wheel and axle | Place a pair under a floor-level weight to reduce rolling resistance |
| Hand crank | Supply finite turning input while Power is held |
| Gear | Mesh edges; alter radius to explore speed, direction and turning force |
| Fan | Observe rotation at the end of a transmission |
| Rope drum | Wind a routed rope, directly or through gears; Brake holds it |
| Pulley | Redirect rope; clip a pulley to the closest weight to share a load |
| Anchor | Fix a rope end to the board |
| Threaded jack | Turn a nearby wedge drive, with adjustable thread pitch and input force |
| Wedge | Convert a jack's horizontal travel into lifting motion beneath a weight |

Parts snap to quarter-unit board positions. Select a mounted part to adjust it; edit controls are disabled during a test. Reset preserves the design. Clear board removes every part, all rope and the active test. It keeps earned trophies and the selected optional challenge, and clears the Undo history so Undo cannot restore the whole cleared board. Undo reverses one individual build edit. Run starts gravity; Power supplies force. Release Power to stop supplying effort. Brake holds driven lifting mechanisms. Pause stops time. Inspector weight and force controls use pounds; the internal solver uses kilograms, newtons and meters. Several family members holding Power do not multiply the calibrated input.

### Drawing rope

Route rope opens a visible editor above the board. The player taps large green sockets on the rope drum, optional pulley wheels and then a weight or anchor. Each point is numbered and the draft rope is drawn immediately. The editor explains wrong starts, repeated ports and unsupported anchor endings without discarding the draft. Undo point removes the last draft point; Cancel preserves the previously saved rope. Finish rope commits a valid path and closes only after the host snapshot confirms it. A drum can connect directly to a weight. The weight’s visible ring and touch target use the same coordinates as the rope constraint. Explicitly roped weights are not trapped in nearby lever/jack holders. Run is disabled until the draft is finished or cancelled.

## Optional trophies

| Suggested grade | Challenge |
|---|---|
| K | First lift: raise a weight |
| 1 | Downhill discovery: move a weight three spaces using a ramp |
| 2 | Lift at least 10 lb with no more than 2 lb of applied force |
| 3 | Turn a fan through a crank and at least two meshing gears |
| 4 | Lift 10 lb using a carried pulley and at most 4 lb of force |
| 5 | Lift 20 lb with at most 2 lb of force; combine parts or counterbalance |

The challenge selector includes Just invent and Skip challenge. Completing a challenge records a trophy under extra.garage2.trophies, celebrates briefly and keeps the experiment running. There is no success modal interrupting free play. Changing or skipping a challenge keeps the same invention. Trophies persist across quit/reload and appear in the book and Grown-Ups progress view.

The 10 lb / 2 lb trophy measures actual rise and the peak applied force during the lift. A bigger push can physically lift the weight but cannot earn that low-force trophy. Tests contrast the same machine with its fulcrum in the center versus near the weight. Beam travel stops at the floor. No named arrangement or answer is accepted as a substitute for motion.

## Mechanics

inventor.js is the open-workbench solver. Placed weights share a vertical-plane simulation. A nearby separate support defines a beam's pivot. Weights placed just above the beam clip to its load cradle at Run; their mass and distance contribute gravity torque and rotational inertia. Pushers must reach an end. Multiple weights can counterbalance each other. An unsupported beam falls. Ramps resolve circle/segment contact; loose weights collide with each other and the floor. Gear meshing transmits finite crank torque. Routed rope uses actual path length and carried-weight geometry. A screw/wedge pair carries a nearby weight through a reduced-coordinate threaded drive.

Physics advances on the child's authoritative host in fixed 1/240 s steps, with capped accumulated time after a slow frame. Geometry, force, speed and work are evaluated continuously. SI conversion is 0.45359237 kg per pound of mass and approximately 4.44822 N per pound-force. Gravity is 9.81 m/s². The renderer is 3D; the mechanical model is a constrained plane.

This is a purpose-built educational model, not a general 3D rigid-body editor. Gear axes are mounted to the board; lever loads use holders; rope is an ideal centerline constraint; one continuous rope circuit is supported per board; screw/wedge coupling uses proximity. There are no arbitrary weld joints, rope stretch, individual tooth collisions, breakable structures or host migration. Up to 35 components fit a board. Existing mechanics.js and old customer-job definitions remain for historical builds/tests; the current book uses the open workshop. Old saved designs are converted to editable workshop parts, adding explicit supports/weights where previous scenes supplied them implicitly.

## UI, family and persistence

Desktop/tablet: visible exit/help controls above the story and optional challenge strip, parts drawer left, large 3D workbench center, inspector right, operating controls below. Phone: central board, scrollable compact parts tray, inspector and sticky controls. All parts keep their ? button. Text accompanies speech; device voices are optional. Mechanical effects use Web Audio. Original JoyNot logo assets are retained.

A child plus up to three authenticated family guests can share the machine. The existing server enforces family ownership and Grown-Ups PIN access. Guests render locally and send commands; only the host advances physics. Per-part leases and revisions protect concurrent edits. Operator holds expire. Direct snapshots target about 10 Hz; server relay updates target 450 ms, subject to network/polling delay. Slow replicas cannot accidentally resume the game by asking for Help. A hidden host tab pauses shared motion.

New progress lives in extra.garage2. Saved designs retain blueprint, selected challenge, mode and grade. Historic question records remain separate. Grown-Ups settings describe school grade, narration and sound instead of quiz levels/rounds. Reports show optional trophies and saved inventions.

## Verification and deployment

Run:

    node --test tests/gizmo-rope.test.js tests/gizmo-inventor.test.js tests/gizmo-physics.test.js tests/game-assets.test.js
    php vendor/phpunit/phpunit/phpunit -c .phpunit-local.xml
    node tests/Browser/gizmo-garage.cjs
    node tests/Browser/gizmo-rope.cjs

The browser test checks illustrated fulcrum help, speech, keyboard weight editing, moving the actual support, optional trophy without interrupted play, Save & quit/Continue, phone/tablet layouts and a separate family controller. Set GARAGE_RELAY=1 for the server fallback. Browser tests use the isolated tests/Browser/server.php SQLite environment.

Deploy all changed PHP, views, the complete Gizmo directory, shared helper/together modules and public/sw.js together. Game version suffix is -garage5 and worker cache is joynot-v26. Close old game tabs and reopen after deploying the new assets; Laravel optimize:clear does not deploy files or itself replace browser assets. No database migration is required.

Manual control verification: `node --test tests/gizmo-crank.test.js` and `node tests/Browser/gizmo-crank.cjs` cover clockwise/counterclockwise input, release, touch, live gear positioning and weight presets.

<?php

return [

    // How long the Grown-ups area stays unlocked after the PIN is entered (minutes of no activity).
    'pin_minutes' => (int) env('JOYNOT_PIN_MINUTES', 15),

    // 💚 "Support JoyNot" button (home page + Grown-ups). A one-time Stripe Payment Link, e.g. https://donate.stripe.com/xxxx
    // Leave JOYNOT_DONATE_URL empty and the button says "Donations open soon".
    'donate_url' => env('JOYNOT_DONATE_URL'),

    // Who runs JoyNot (shown on the legal pages and in the footer).
    'legal' => [
        'company' => 'Vibe Works Studio LLC',
        'email' => env('JOYNOT_CONTACT_EMAIL', 'vibeworksstudio@outlook.com'),
        'address' => ['Vibe Works Studio LLC', 'PO Box 33', 'Erie, CO 80516'],
        'state' => 'Colorado',
        'updated' => 'October 13, 2026',
    ],

    // Most kid profiles one family can have.
    'max_kids' => 12,

    // Pictures kids can pick for their profile.
    'avatars' => ['🦊', '🐻', '🐯', '🐸', '🐵', '🦖', '🐱', '🐶', '🐼', '🦁', '🐙', '🤖', '🦄', '🐧', '🐰', '🐨', '🐢', '🦉', '🐳', '🦋', '🐝', '🚀', '⚽', '🌈'],

    // School grades a grown-up can pick (key is saved in the database).
    'grades' => [
        'PK' => 'Pre-K', 'K' => 'Kindergarten', '1' => '1st grade', '2' => '2nd grade', '3' => '3rd grade',
        '4' => '4th grade', '5' => '5th grade', '6' => '6th grade', '7' => '7th grade', '8' => '8th grade',
    ],

    /*
    | Play together (every game): live talk and video use a direct device-to-device link (WebRTC).
    | Your own coturn server on the VPS does both jobs, free: STUN (helps the two devices find each other)
    | and TURN (relays the link when two homes can't connect directly). No Google servers are used.
    |
    | Recommended (safer): coturn with "use-auth-secret". Set the host and the same secret as in /etc/turnserver.conf:
    |   JOYNOT_TURN_HOST=turn.joynot.com
    |   JOYNOT_TURN_SECRET=long-random-secret
    | JoyNot then hands each game a login that expires after 'ttl' seconds.
    |
    | Older style (fixed user + password in coturn) still works: JOYNOT_TURN_URL / _USERNAME / _PASSWORD.
    | Leave everything empty while testing on localhost: talk then falls back to short voice messages.
    */
    'turn' => [
        'host' => env('JOYNOT_TURN_HOST'),
        'secret' => env('JOYNOT_TURN_SECRET'),
        'port' => (int) env('JOYNOT_TURN_PORT', 3478),
        'tls_port' => (int) env('JOYNOT_TURN_TLS_PORT', 5349),
        'ttl' => (int) env('JOYNOT_TURN_TTL', 6 * 3600),
        'url' => env('JOYNOT_TURN_URL'),
        'username' => env('JOYNOT_TURN_USERNAME'),
        'password' => env('JOYNOT_TURN_PASSWORD'),
    ],

    // Profile colors.
    'colors' => ['#ff9d3d', '#3dc2ff', '#3dd6a3', '#ff6b9d', '#8b6cff', '#ffc93c', '#4dd0c8', '#ff6b6b'],

    /*
    |--------------------------------------------------------------------------
    | Games
    |--------------------------------------------------------------------------
    | Every game is one entry. The key is the game's address: /play/{key}/{kid}.
    | 'class' handles that game's settings, progress and reports (see app/Games).
    | Order here = order of the cards on the dashboard.
    */
    'games' => [

        'rustys-after-hours' => [
            'class' => App\Games\RustysAfterHours::class,
            'title' => "Rusty's After Hours",
            'description' => 'Sneak through a 3D pizza place after hours. Read the doors and solve the gates to escape the animatronics — then build your own animatronic and see if you can outrun it! Spookiness matches the kid’s grade.',
            'cover' => '/games/rustys-after-hours/cover.jpg?v=2',
            'skills' => ['📖 Reading', '🔢 Math'],
            'ages' => 'Ages 5–10',
            'theme' => 'spooky',
            'version' => env('GAME_VERSION', '1.0.0'),
        ],

        'sparkles-rainbow-journey' => [
            'class' => App\Games\SparklesRainbowJourney::class,
            'title' => "Sparkle's Rainbow Journey",
            'description' => 'Sparkle the unicorn is lost! Gallop through candy-land mazes, collect rainbows and jelly beans, and read and solve your way through the gates to find her family.',
            'cover' => '/games/sparkles-rainbow-journey/cover.jpg',
            'skills' => ['📖 Reading', '🔢 Math'],
            'ages' => 'Ages 4–10',
            'theme' => 'rainbow',
            'version' => env('GAME_VERSION', '1.0.0'),
        ],

        // ----- Learning mini-games (shared engine in public/games/_joy) -----

        'bee-smart' => [
            'class' => App\Games\BeeSmart::class,
            'title' => 'Bee Smart',
            'description' => 'Count with Buzzy the bee, learn the ABCs and letter sounds, build words, and grow all the way up to a real spelling bee.',
            'cover' => '/games/bee-smart/cover.jpg',
            'skills' => ['🔢 Counting', '🔤 ABCs', '🐝 Spelling'],
            'ages' => 'Ages 4–11',
            'theme' => 'learn bee',
            'version' => env('GAME_VERSION', '1.0.0'),
        ],

        'write-it' => [
            'class' => App\Games\WriteIt::class,
            'title' => 'Write It!',
            'description' => 'Watch Penn the pencil write, then trace letters, numbers and words to cast spells and defend the tower in new monster lands.',
            'cover' => '/games/write-it/cover.jpg',
            'skills' => ['✏️ Handwriting', '🔤 Letters'],
            'ages' => 'Ages 4–8',
            'theme' => 'learn write',
            'version' => env('GAME_VERSION', '1.0.0'),
        ],

        'star-academy' => [
            'class' => App\Games\StarAcademy::class,
            'title' => 'Star Academy',
            'description' => 'Blast off with Captain Nova! Fly your ship to the Sun, planets and Moon, unlock new destinations as you level up, and type warp codes to jump through space.',
            'cover' => '/games/star-academy/cover.jpg',
            'skills' => ['🚀 Space', '🔬 Science'],
            'ages' => 'Ages 5–11',
            'theme' => 'learn space night',
            'version' => env('GAME_VERSION', '1.0.0'),
        ],

        'gizmo-garage' => [
            'class' => App\Games\GizmoGarage::class,
            'title' => 'Gizmo Garage',
            'description' => 'Build real machines on Gizmo’s pegboard: pushers, wheels, ramps, levers, gears, pulleys, screws and wedges. Set them up, press GO and watch them work!',
            'cover' => '/games/gizmo-garage/cover.jpg',
            'skills' => ['⚙️ Machines', '🔧 Engineering'],
            'ages' => 'Ages 5–11',
            'theme' => 'learn gizmo',
            'version' => env('GAME_VERSION', '1.0.0'),
        ],

        'robo-brain' => [
            'class' => App\Games\RoboBrain::class,
            'title' => 'Robo Brain',
            'description' => 'Train Robo, a robot pet that really learns from how you sort, then watch it race! Debug its data, build decision trees, tune a neuron and learn to use AI wisely.',
            'cover' => '/games/robo-brain/cover.jpg',
            'skills' => ['🤖 AI', '🧠 Logic'],
            'ages' => 'Ages 5–11',
            'theme' => 'learn ai night',
            'version' => env('GAME_VERSION', '1.0.0'),
        ],

        'signal-squad' => [
            'class' => App\Games\SignalSquad::class,
            'title' => 'Signal Squad',
            'description' => 'Run the network! Flip track switches to route packets, block viruses and scams, dial binary addresses, place towers and satellites, and decode pixels.',
            'cover' => '/games/signal-squad/cover.jpg',
            'skills' => ['📡 Tech', '🛡️ Online safety'],
            'ages' => 'Ages 5–11',
            'theme' => 'learn tech night',
            'version' => env('GAME_VERSION', '1.0.0'),
        ],

        'clock-shop' => [
            'class' => App\Games\ClockShop::class,
            'title' => 'Tick-Tock Clock Shop',
            'description' => "Tock the cuckoo bird's clocks are broken! Open them up, fix the gears, and set the hands: cuckoo clocks, alarm clocks with AM/PM, and a 24-hour station board.",
            'cover' => '/games/clock-shop/cover.jpg',
            'skills' => ['⏰ Telling time'],
            'ages' => 'Ages 5–10',
            'theme' => 'learn time',
            'version' => env('GAME_VERSION', '1.0.0'),
        ],

        'clock-dash' => [
            'class' => App\Games\ClockDash::class,
            'title' => 'Clock Dash',
            'description' => 'Kart racing on a giant clock-face track! Steer Zip the bunny to the right hour, then the right minute, on new tracks as you level up.',
            'cover' => '/games/clock-dash/cover.jpg',
            'skills' => ['⏱️ Time', '⚡ Speed'],
            'ages' => 'Ages 5–11',
            'theme' => 'learn dash night',
            'version' => env('GAME_VERSION', '1.0.0'),
        ],

        'beat-the-bus' => [
            'class' => App\Games\BeatTheBus::class,
            'title' => 'Beat the Bus',
            'description' => 'Help Bea the bus driver keep the whole town on schedule. Figure out start times, end times and how long things take.',
            'cover' => '/games/beat-the-bus/cover.jpg',
            'skills' => ['🚌 Elapsed time'],
            'ages' => 'Ages 6–11',
            'theme' => 'learn bus',
            'version' => env('GAME_VERSION', '1.0.0'),
        ],

        'coin-carnival' => [
            'class' => App\Games\CoinCarnival::class,
            'title' => "Penny's Coin Carnival",
            'description' => 'Step right up! Pay the exact coins at each ride gate, then play the ride. A new ride opens every level.',
            'cover' => '/games/coin-carnival/cover.jpg',
            'skills' => ['🐷 Coins', '🔢 Counting'],
            'ages' => 'Ages 5–9',
            'theme' => 'learn coins',
            'version' => env('GAME_VERSION', '1.0.0'),
        ],

        'register-rush' => [
            'class' => App\Games\RegisterRush::class,
            'title' => 'Register Rush',
            'description' => 'Run the register with Max the cat: scan items on the conveyor belt and count back change before the line gets impatient. Toy shop, grocery, then electronics with tax.',
            'cover' => '/games/register-rush/cover.jpg',
            'skills' => ['🧾 Making change', '💵 Money'],
            'ages' => 'Ages 5–11',
            'theme' => 'learn change',
            'version' => env('GAME_VERSION', '1.0.0'),
        ],

        'lemonade-lane' => [
            'class' => App\Games\LemonadeLane::class,
            'title' => 'Lemonade Lane',
            'description' => 'Run a whole lemonade business day: check the weather, buy supplies, set prices, pour and ring up orders, and open new stands.',
            'cover' => '/games/lemonade-lane/cover.jpg',
            'skills' => ['💰 Money math'],
            'ages' => 'Ages 5–11',
            'theme' => 'learn lemon',
            'version' => env('GAME_VERSION', '1.0.0'),
        ],

        'budget-island' => [
            'class' => App\Games\BudgetIsland::class,
            'title' => "Coco's Budget Island",
            'description' => 'Shipwrecked with Coco the monkey! Earn, trade and budget to build a raft, then a hut, then a whole village.',
            'cover' => '/games/budget-island/cover.jpg',
            'skills' => ['🏝️ Saving', '💰 Budgeting'],
            'ages' => 'Ages 5–11',
            'theme' => 'learn island',
            'version' => env('GAME_VERSION', '1.0.0'),
        ],

        'habitat-heroes' => [
            'class' => App\Games\HabitatHeroes::class,
            'title' => 'Habitat Heroes',
            'description' => 'Fly Ranger Hoot’s rescue drone, bring lost animals home and build their habitats. Then feed animals, build body parts, link food chains and fix ecosystems.',
            'cover' => '/games/habitat-heroes/cover.jpg',
            'skills' => ['🔬 Science', '🌍 Nature'],
            'ages' => 'Ages 5–11',
            'theme' => 'learn science',
            'version' => env('GAME_VERSION', '1.0.0'),
        ],

        'light-up-lab' => [
            'class' => App\Games\LightUpLab::class,
            'title' => "Lumi's Light-Up Lab",
            'description' => 'The town went dark! Wire circuits to light it up building by building, then add resistors, capacitors, solar panels, wind turbines and a whole power grid.',
            'cover' => '/games/light-up-lab/cover.jpg',
            'skills' => ['⚡ Circuits', '🧩 Logic'],
            'ages' => 'Ages 5–11',
            'theme' => 'learn spark night',
            'version' => env('GAME_VERSION', '1.0.0'),
        ],

        'code-quest' => [
            'class' => App\Games\CodeQuest::class,
            'title' => "Beep's Code Quest",
            'description' => 'Program Beep the robot through a factory: build code, predict and debug it, ride the conveyors, and use loops and if-sensors.',
            'cover' => '/games/code-quest/cover.jpg',
            'skills' => ['💻 Coding', '🧩 Logic'],
            'ages' => 'Ages 5–11',
            'theme' => 'learn code night',
            'version' => env('GAME_VERSION', '1.0.0'),
        ],

        'compass-cove' => [
            'class' => App\Games\CompassCove::class,
            'title' => 'Compass Cove',
            'description' => 'Sail with Captain Polly by compass! Steer around rocks and storms, read the map key, dig at grid squares like C3, and find treasure by latitude and longitude.',
            'cover' => '/games/compass-cove/cover.jpg',
            'skills' => ['🗺️ Maps', '🧭 Directions'],
            'ages' => 'Ages 5–11',
            'theme' => 'learn map',
            'version' => env('GAME_VERSION', '1.0.0'),
        ],

        'time-tunnel-sorters' => [
            'class' => App\Games\TimeTunnelSorters::class,
            'title' => 'Time Tunnel Sorters',
            'description' => "Fly Dottie's time machine through the eras, grab lost artifacts, and pin them on the timeline rope: in order, at the right year, or in the right century.",
            'cover' => '/games/time-tunnel-sorters/cover.jpg',
            'skills' => ['🏛️ History', '📅 Timelines'],
            'ages' => 'Ages 5–11',
            'theme' => 'learn history night',
            'version' => env('GAME_VERSION', '1.0.0'),
        ],

        'feelings-detective' => [
            'class' => App\Games\FeelingsDetective::class,
            'title' => 'Feelings Detective',
            'description' => 'Crack feelings cases with Scout the detective pup: hunt for clues, build faces, try calm-down tools and solve friendship problems.',
            'cover' => '/games/feelings-detective/cover.jpg',
            'skills' => ['💛 Feelings', '🤝 Friendship'],
            'ages' => 'Ages 5–11',
            'theme' => 'learn feel',
            'version' => env('GAME_VERSION', '1.0.0'),
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | "Coming soon" cards
    |--------------------------------------------------------------------------
    | Blank cards shown after the real games. Add one back when you're planning a new game.
    */
    'coming_soon' => [],

];

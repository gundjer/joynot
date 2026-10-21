<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="#0b0712">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="JoyNot">
    <meta name="format-detection" content="telephone=no">
    <title>Rusty's After Hours — {{ $kid->name }} — JoyNot</title>
    <link rel="manifest" href="/manifest.json">
    <link rel="icon" href="/games/rustys-after-hours/icons/favicon.ico" sizes="any">
    <link rel="icon" href="/games/rustys-after-hours/icons/favicon.svg" type="image/svg+xml">
    <link rel="icon" href="/games/rustys-after-hours/icons/favicon-32.png" type="image/png" sizes="32x32">
    <link rel="icon" href="/games/rustys-after-hours/icons/favicon-16.png" type="image/png" sizes="16x16">
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" sizes="180x180">
    <link rel="stylesheet" href="/fonts/fonts.css">
    <link rel="stylesheet" href="/games/rustys-after-hours/css/game.css?v={{ $game->version() }}">
    <style>
        /* ---------- JoyNot: loading + who's playing chip ---------- */
        .loading-av { --c: #ff9d3d; font-size: clamp(54px, 13vh, 80px); width: 1.6em; height: 1.6em; border-radius: 50%; display: grid; place-items: center; background: var(--c); margin: 0 auto 12px; box-shadow: 0 0 0 5px #2b2140, 0 0 30px rgba(255, 216, 74, .25); }
        .loading-dots::after { content: ''; animation: dots 1.2s steps(4) infinite; }
        @keyframes dots { 0% { content: ''; } 25% { content: '.'; } 50% { content: '..'; } 75% { content: '...'; } }
        .player-row { margin: 4px 0 10px; display: flex; justify-content: center; gap: 6px; flex-wrap: wrap; }
        .kid-chip { --c: #ff9d3d; display: inline-flex; align-items: center; gap: 8px; padding: 4px 14px 4px 4px; border-radius: 999px; background: var(--panel2); border: 2px solid var(--c); font-size: clamp(16px, 3.6vh, 20px); font-weight: 700; }
        .kid-chip span { width: 1.9em; height: 1.9em; border-radius: 50%; display: grid; place-items: center; background: var(--c); font-size: 1.1em; }
        .exit-btn { background: #2b2140; }
    </style>
</head>
<body>
<canvas id="game"></canvas>
<div id="aimZone"></div>

{{-- ================= HUD ================= --}}
<div id="hud" class="hidden">
    <div class="hud-left">
        <div id="hudCells" class="pill cells">⚡ 0/3</div>
        <div id="hudTokens" class="pill">🪙 0</div>
        <div class="pill battery"><span>🔦</span><div class="bar"><div id="hudBattery"></div></div></div>
    </div>
    <div id="danger" class="danger"><span id="dangerArrow" class="arrow">➤</span><span class="feet">👣</span></div>
    <div class="hud-right">
        <canvas id="minimap" width="200" height="120"></canvas>
        <button id="btnPause" class="round" title="Pause">⏸</button>
        <button id="btnExit" class="round" title="Exit to main menu">🏠</button>
    </div>
    <div id="toast" class="toast"></div>
</div>

<div id="controls" class="hidden">
    <div id="stickZone"><div id="stickBase"><div id="stickKnob"></div></div><div class="stick-hint">Drag here to walk</div></div>
    <div class="action-btns">
        <button id="btnAction" class="act hidden">🎤 Open</button>
        <button id="btnLight" class="act light">🔦</button>
        <button id="btnSpare" class="act" aria-label="Use a spare flashlight battery">🔋 0</button>
    </div>
</div>

{{-- ================= LOADING ================= --}}
<div id="loading" class="screen">
    <div class="title-inner">
        <div class="loading-av" style="--c: {{ $kid->color }}">{{ $kid->avatar }}</div>
        <h1 class="logo small">Rusty's <span>After Hours</span></h1>
        <p id="loadingText" class="sub">Getting {{ $kid->name }}'s flashlight ready<span class="loading-dots"></span></p>
    </div>
</div>

{{-- ================= TITLE ================= --}}
{{-- The cast stands on a lit stage behind the menu (drawn on #titleArt in the kid's scare tier: Gentle / Spooky-lite / Spooky). --}}
<div id="title" class="screen title-screen hidden">
    <canvas id="titleArt" aria-hidden="true"></canvas>
    <div class="title-inner title-over">
        <h1 class="logo">Rusty's<br><span>After Hours</span></h1>
        <div class="tagline">Read · Count · Hide · Build</div>
        <div id="titleName" class="welcome"></div>
        <div class="player-row">
            <span class="kid-chip" style="--c: {{ $kid->color }}"><span>{{ $kid->avatar }}</span>{{ $kid->name }}</span>
            <button id="btnSwitch" class="mid-btn">👥 Switch player</button>
        </div>
        <div class="row">
            <button id="btnPlay" class="big-btn">▶ PLAY</button>
        </div>
        <div id="titleMode" class="mode-chip"></div>
        <div id="titleStats" class="stats"></div>
        <div class="row">
            <button id="btnVoice" class="mid-btn">🗣️ Voice</button>
            <button id="btnPrizes" class="mid-btn">🪙 Prize counter</button>
            <button id="btnTitleExit" class="mid-btn exit-btn">🏠 Back to games</button>
            <a class="grownups" href="{{ $joynot['urls']['grownups'] }}">Grown-ups 🔒</a>
        </div>
        <div class="turn-tip">📱↔ Tip: turn your phone sideways for a bigger view!</div>
    </div>
</div>

{{-- ================= NIGHT INTRO ================= --}}
<div id="intro" class="screen hidden">
    <div class="title-inner">
        <h1 id="introNight" class="logo small">Night 1</h1>
        <div id="introGoal" class="goal"></div>
        <div id="introCast" class="cast-row"></div>
        <div class="row">
            <button id="btnStartNight" class="big-btn">🔦 Start the Night</button>
            <button id="btnIntroBack" class="mid-btn">🏠 Main Menu</button>
        </div>
        <div class="turn-tip">📱↔ Tip: turn your phone sideways for a bigger view!</div>
        <ul class="howto">
            <li>🕹️ Drag your thumb on the <b>left side</b>: up to walk, down to back up, sideways to turn. Drag on the <b>right side</b> to look around.</li>
            <li>📖 🔢 Walk up to a door or gate and tap <b>Read door</b> / <b>Solve gate</b>. Then press <b>TALK</b>.</li>
            <li>🔦 Shine your light on an animatronic to make it <b>go away</b>.</li>
            <li>👣 Hear footsteps getting louder? Find a hiding spot and tap <b>HIDE</b>.</li>
        </ul>
    </div>
</div>

{{-- ================= DOOR / GATE CHALLENGE ================= --}}
<div id="challenge" class="overlay hidden">
    <div class="panel ch-panel">
        <div class="ch-head"><span id="chTitle">Read the door!</span><button id="chClose" class="x" title="Walk away">✖</button></div>
        <div class="ch-sparky">
            <svg class="sparky" viewBox="0 0 100 100" aria-hidden="true">
                <line x1="50" y1="18" x2="50" y2="6" stroke="#ccc" stroke-width="4"/><circle cx="50" cy="6" r="6" fill="#ff5"/>
                <rect x="14" y="18" width="72" height="58" rx="18" fill="#ffc83d" stroke="#a07800" stroke-width="3"/>
                <rect x="24" y="28" width="52" height="34" rx="10" fill="#14324a"/>
                <circle cx="40" cy="42" r="6" fill="#6ff"/><circle cx="60" cy="42" r="6" fill="#6ff"/>
                <path d="M38 52 Q50 60 62 52" stroke="#6ff" stroke-width="4" fill="none" stroke-linecap="round"/>
                <rect x="30" y="78" width="40" height="14" rx="6" fill="#999"/>
            </svg>
            <div id="chBubble" class="bubble">Hi!</div>
        </div>
        <div class="ch-body">
            <div id="chContent" class="ch-content"></div>
            <div id="chTeach" class="ch-teach hidden"></div>
        </div>
        <div id="chHeard" class="heard"></div>
        <div class="ch-actions">
            <button id="chHelp" class="mid-btn">💡 Help me</button>
            <button id="chTalk" class="talk">🎤 TALK</button>
            <button id="chType" class="mid-btn">⌨️ Type</button>
        </div>
        <div id="chGrown" class="grown hidden">Grown-up check: <button id="chYes">✔ Right</button> <button id="chNo">✖ Not yet</button></div>
        <div id="chPad" class="pad hidden"></div>
    </div>
</div>

{{-- ================= PAUSE / SETTINGS / STEPS ================= --}}
<div id="pause" class="overlay hidden">
    <div class="panel menu">
        <h2>Paused</h2>
        <button id="btnResume" class="big-btn">▶ Keep Playing</button>
        <button id="btnSteps" class="mid-btn">🔦 Flashlight Steps (problem solving)</button>
        <button id="btnVoice2" class="mid-btn">🗣️ Voice</button>
        <button id="btnQuit" class="mid-btn">🏠 Main Menu</button>
        <button id="btnPauseExit" class="mid-btn exit-btn">🚪 Exit to JoyNot</button>
    </div>
</div>

<div id="steps" class="overlay hidden">
    <div class="panel menu wide">
        <h2>🔦 The Flashlight Steps</h2>
        <p class="sub">Use these steps for ANY tricky problem!</p>
        <ol id="stepsList" class="steps-list"></ol>
        <button id="btnStepsClose" class="big-btn">Got it!</button>
    </div>
</div>

{{-- Pick the read-aloud voice: any voice installed on this phone / tablet / computer, or the device's own voice --}}
<div id="voicePick" class="overlay hidden">
    <div class="panel menu">
        <h2>🗣️ Voice</h2>
        <p class="tip" style="font-size:16px">Pick any voice on this device. It's saved on this device.</p>
        <select id="gVoiceSel" class="voice-sel"></select>
        <label style="justify-content:center">Speed
            <select id="gVoiceRate"><option value="0.8">Slower</option><option value="0.9">A bit slower</option><option value="1">Normal</option><option value="1.1">A bit faster</option></select></label>
        <button id="gVoiceTry" class="mid-btn">▶ Try it</button>
        <button id="gVoiceDone" class="big-btn">✔ Done</button>
    </div>
</div>

<div id="caught" class="overlay hidden">
    <div class="panel menu">
        <h2 id="caughtTitle">Caught!</h2>
        <p class="tip">💡 <span id="caughtTip"></span></p>
        <button id="btnTryAgain" class="big-btn">🔦 Try Again</button>
        <button id="btnCaughtQuit" class="mid-btn">🏠 Main Menu</button>
    </div>
</div>

<div id="done" class="overlay hidden">
    <div class="panel menu">
        <h2>🌅 You Escaped!</h2>
        <div id="doneStars" class="stars">★★★</div>
        <div id="doneStats" class="done-stats"></div>
        <button id="btnNextNight" class="big-btn">🌙 Play Next Night</button>
        <button id="btnDoneTitle" class="mid-btn">🏠 Main Menu</button>
        <button id="btnDoneExit" class="mid-btn exit-btn">🚪 Exit to JoyNot</button>
    </div>
</div>

<div id="quitConfirm" class="overlay hidden">
    <div class="panel menu">
        <h2>🏠 Leave the night?</h2>
        <p class="tip">Your reading level, math level, night and coins are saved. This night's map starts over next time.</p>
        <button id="btnQuitNo" class="big-btn">▶ Keep Playing</button>
        <button id="btnPlayAgain" class="mid-btn">🔄 Play Again</button>
        <button id="btnQuitYes" class="mid-btn">🏠 Main Menu</button>
        <button id="btnQuitExit" class="mid-btn exit-btn">🚪 Exit to JoyNot</button>
    </div>
</div>

{{-- ================= LEVEL-UP ADVENTURES: workshop + hallway run ================= --}}
<div id="stageTouch" class="hidden"></div>
<div id="stageHud" class="hidden">
    <div class="sh-left"><span id="shHearts" class="pill hearts"></span><span id="shGoal" class="pill goal-pill"></span></div>
    <div class="hud-right"><button id="shPause" class="round" title="Pause">⏸</button><button id="shExit" class="round" title="Exit to main menu">🏠</button></div>
</div>
<div id="runBtns" class="hidden">
    <button id="rbHelp" class="act help">🤖</button>
    <button id="rbAct" class="act hidden"></button>
    <button id="rbJump" class="act light jump">⤴</button>
</div>
<div id="stageIntro" class="screen hidden">
    <div class="title-inner">
        <h1 id="siTitle" class="logo small"></h1>
        <div id="siGoal" class="goal"></div>
        <canvas id="siArt" width="480" height="230"></canvas>
        <div class="row">
            <button id="btnStageGo" class="big-btn">▶ Let's go!</button>
            <button id="btnStageBack" class="mid-btn">🏠 Main Menu</button>
        </div>
        <ul id="siHow" class="howto"></ul>
    </div>
</div>
<div id="stageDone" class="overlay hidden">
    <div class="panel menu">
        <h2 id="sdTitle"></h2>
        <canvas id="sdArt" width="480" height="230"></canvas>
        <div id="sdStats" class="done-stats"></div>
        <button id="sdNext" class="big-btn">▶ Keep going</button>
        <button id="sdMenu" class="mid-btn">🏠 Main Menu</button>
        <button id="sdExit" class="mid-btn exit-btn">🚪 Exit to JoyNot</button>
    </div>
</div>

<canvas id="scare" class="hidden"></canvas>

@php
    // Every game file gets ?v=<last changed time>, so phones and tablets never mix an old cached file with new ones.
    $jsMap = [];
    foreach (['games/rustys-after-hours/js', 'games/_play', 'js'] as $dir) {
        foreach (glob(public_path($dir) . '/*.js') ?: [] as $file) {
            $jsMap['/' . $dir . '/' . basename($file)] = '/' . $dir . '/' . basename($file) . '?v=' . filemtime($file);
        }
    }
    $gameJs = $jsMap['/games/rustys-after-hours/js/game.js'] ?? '/games/rustys-after-hours/js/game.js?v=' . $game->version();
@endphp
<script type="importmap">{!! json_encode(['imports' => $jsMap], JSON_UNESCAPED_SLASHES) !!}</script>
<script>
window.JOYNOT = @json($joynot);
// If the game can't start (an old file stuck on the device, or an error), show a Try again button instead of loading forever.
(function () {
    var shown = false;
    function stuck(msg) {
        if (shown || window.__rustyStarted) return; shown = true;
        var box = document.querySelector('#loading .title-inner'); if (!box) return;
        var p = document.createElement('p'); p.className = 'sub'; p.style.cssText = 'margin-top:14px;font-size:15px;opacity:.85';
        p.textContent = 'The game is taking too long to start.';
        var b = document.createElement('button'); b.className = 'big-btn'; b.style.marginTop = '14px'; b.textContent = '🔄 Try again';
        b.onclick = function () {
            b.disabled = true; b.textContent = 'Loading...';
            var done = function () { location.replace(location.pathname + '?r=' + Date.now()); };
            var jobs = [];
            try { if (window.caches) jobs.push(caches.keys().then(function (k) { return Promise.all(k.map(function (n) { return caches.delete(n); })); })); } catch (e) {}
            try { if (navigator.serviceWorker) jobs.push(navigator.serviceWorker.getRegistrations().then(function (r) { return Promise.all(r.map(function (x) { return x.unregister(); })); })); } catch (e) {}
            Promise.all(jobs).then(done, done); setTimeout(done, 2500);
        };
        box.appendChild(p); box.appendChild(b);
        if (msg) { var d = document.createElement('p'); d.style.cssText = 'margin-top:10px;font-size:11px;opacity:.5;max-width:90vw;word-break:break-word'; d.textContent = msg; box.appendChild(d); }
    }
    window.addEventListener('error', function (e) { if (!window.__rustyStarted) setTimeout(function () { stuck(String(e.message || 'error')); }, 1500); });
    window.addEventListener('unhandledrejection', function (e) { if (!window.__rustyStarted) setTimeout(function () { stuck(String((e.reason && e.reason.message) || e.reason || 'error')); }, 1500); });
    setTimeout(function () { stuck(''); }, 15000);
})();
</script>
<script type="module" src="{{ $gameJs }}"></script>
</body>
</html>

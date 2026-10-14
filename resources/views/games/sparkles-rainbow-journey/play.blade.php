@php $B = '/games/sparkles-rainbow-journey'; @endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="#ffe9f5">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="JoyNot">
    <meta name="format-detection" content="telephone=no">
    <title>Sparkle's Rainbow Journey — {{ $kid->name }} — JoyNot</title>
    <link rel="manifest" href="/manifest.json">
    <link rel="icon" href="{{ $B }}/icons/favicon.svg" type="image/svg+xml">
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" sizes="180x180">
    <link rel="stylesheet" href="/fonts/fonts.css">
    <link rel="stylesheet" href="{{ $B }}/css/game.css?v={{ $game->version() }}">
    <style>
        .loading-av { --c: #ff9d3d; font-size: clamp(54px, 13vh, 80px); width: 1.6em; height: 1.6em; border-radius: 50%; display: grid; place-items: center; background: var(--c); margin: 0 auto 12px; box-shadow: 0 0 0 6px #fff, 0 10px 30px rgba(122, 90, 166, .3); }
        .loading-dots::after { content: ''; animation: dots 1.2s steps(4) infinite; }
        @keyframes dots { 0% { content: ''; } 25% { content: '.'; } 50% { content: '..'; } 75% { content: '...'; } }
        .player-row { margin: 4px 0 10px; display: flex; justify-content: center; gap: 6px; flex-wrap: wrap; }
        .kid-chip { --c: #ff9d3d; display: inline-flex; align-items: center; gap: 8px; padding: 4px 14px 4px 4px; border-radius: 999px; background: #fff; border: 2px solid var(--c); font-size: clamp(16px, 3.6vh, 20px); font-weight: 700; }
        .kid-chip span { width: 1.9em; height: 1.9em; border-radius: 50%; display: grid; place-items: center; background: var(--c); font-size: 1.1em; }
    </style>
</head>
<body>
<canvas id="game"></canvas>

{{-- ================= HUD ================= --}}
<div id="hud" class="hidden">
    <div class="hud-left">
        <div id="hudRainbows" class="pill rb">🌈 0/2</div>
        <div id="hudBeans" class="pill">🍬 0</div>
        <div id="hudStage" class="pill">Stage 1</div>
    </div>
    <div class="hud-right">
        <canvas id="minimap" width="200" height="120"></canvas>
        <button id="btnPause" class="round" title="Pause (P)" aria-label="Pause">⏸</button>
        <button id="btnExit" class="round" title="Leave" aria-label="Leave">🏠</button>
    </div>
    <div id="toast" class="toast"></div>
</div>

<div id="controls" class="hidden">
    <div id="stickZone">
        <div id="stickBase"><div id="stickKnob"></div></div>
        <div id="stickHint" class="stick-hint"><span class="touch-only">👆 Press and drag to walk</span><span class="key-only">⌨️ Arrow keys or WASD to walk, Space to open gates</span></div>
    </div>
    <div class="action-btns">
        <button id="btnAction" class="act hidden">✨ Open</button>
    </div>
</div>

{{-- ================= LOADING ================= --}}
<div id="loading" class="screen">
    <div class="title-inner">
        <div class="loading-av" style="--c: {{ $kid->color }}">{{ $kid->avatar }}</div>
        <h1 class="logo small">Sparkle's <span>Rainbow Journey</span></h1>
        <p id="loadingText" class="sub">Getting {{ $kid->name }}'s adventure ready<span class="loading-dots"></span></p>
    </div>
</div>

{{-- ================= TITLE ================= --}}
<div id="title" class="screen hidden">
    <div class="title-inner">
        <h1 class="logo">Sparkle's<br><span>Rainbow Journey</span></h1>
        <canvas id="titleArt" width="560" height="230"></canvas>
        <div id="titleName" class="welcome"></div>
        <div id="titleStory" class="story-line"></div>
        <div class="player-row">
            <span class="kid-chip" style="--c: {{ $kid->color }}"><span>{{ $kid->avatar }}</span>{{ $kid->name }}</span>
            <button id="btnSwitch" class="mid-btn">👥 Switch player</button>
        </div>
        <div id="titleStats" class="stats"></div>
        <div class="row">
            <button id="btnPlay" class="big-btn">▶ PLAY</button>
            <button id="btnTitleExit" class="mid-btn">🏠 Back to games</button>
        </div>
        <div class="turn-tip">📱↔ Tip: turn your phone sideways for a bigger view!</div>
        <div class="key-hint">⌨️ Arrow keys or WASD to walk · Space to open gates · P to pause · M for music</div>
        <a class="grownups" href="{{ $joynot['urls']['grownups'] }}">Grown-ups 🔒</a>
    </div>
</div>

{{-- ================= STAGE INTRO ================= --}}
<div id="intro" class="screen hidden">
    <div class="title-inner">
        <h1 id="introStage" class="logo small">Stage 1</h1>
        <canvas id="introArt" width="460" height="190"></canvas>
        <div id="introWho" class="who-line"></div>
        <div id="introGoal" class="goal"></div>
        <div class="row">
            <button id="btnStart" class="big-btn">🦄 Let's go!</button>
            <button id="btnIntroBack" class="mid-btn">🏠 Main Menu</button>
        </div>
        <ul class="howto">
            <li class="touch-only">🕹️ Press anywhere and drag your finger to walk.</li>
            <li class="key-only">⌨️ Arrow keys or WASD to walk. Space or Enter opens a gate.</li>
            <li>🌈 Collect the rainbows. Grab jelly beans 🍬 along the way!</li>
            <li>📖 🔢 Walk up to a gate and tap <b>Read gate</b> / <b>Solve gate</b>. Then press <b>TALK</b>.</li>
            <li>🌈 When you have all the rainbows, open the <b>Rainbow Gate</b> to find Sparkle's family!</li>
        </ul>
    </div>
</div>

{{-- ================= GATE CHALLENGE ================= --}}
<div id="challenge" class="overlay hidden">
    <div class="panel ch-panel">
        <div class="ch-head"><span id="chTitle">Read the gate!</span><button id="chClose" class="x" title="Walk away (Esc)" aria-label="Walk away">✖</button></div>
        <div class="ch-sparky">
            {{-- Pip the helper bird --}}
            <svg class="pip" viewBox="0 0 100 100" aria-hidden="true">
                <ellipse cx="50" cy="58" rx="34" ry="30" fill="#6ec6ff" stroke="#3b8fd1" stroke-width="3"/>
                <ellipse cx="54" cy="66" rx="20" ry="16" fill="#fff4c2"/>
                <path d="M22 54 Q10 46 14 66 Q22 64 28 60 Z" fill="#b388ff"/>
                <path d="M46 30 Q50 14 58 26 Q64 12 66 30" fill="#ff6fa8"/>
                <circle cx="62" cy="48" r="7" fill="#fff"/><circle cx="63" cy="48" r="4" fill="#3b2a5c"/><circle cx="64.5" cy="46.5" r="1.4" fill="#fff"/>
                <path d="M74 52 L88 56 L74 60 Z" fill="#ffb347"/>
                <ellipse cx="66" cy="58" rx="4" ry="2.4" fill="#ff9ad5" opacity=".7"/>
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

{{-- ================= PAUSE / STEPS ================= --}}
<div id="pause" class="overlay hidden">
    <div class="panel menu">
        <h2>Paused</h2>
        <button id="btnResume" class="big-btn">▶ Keep Playing</button>
        <button id="btnSteps" class="mid-btn">🌈 Rainbow Steps (problem solving)</button>
        <button id="btnMusic" class="mid-btn">🎵 Music: On</button>
        <button id="btnQuit" class="mid-btn">🏠 Main Menu</button>
        <button id="btnPauseExit" class="mid-btn">🚪 Exit to JoyNot</button>
    </div>
</div>

<div id="steps" class="overlay hidden">
    <div class="panel menu wide">
        <h2>🌈 The Rainbow Steps</h2>
        <p class="sub">Use these steps for ANY tricky problem!</p>
        <ol id="stepsList" class="steps-list"></ol>
        <button id="btnStepsClose" class="big-btn">Got it!</button>
    </div>
</div>

<div id="done" class="overlay hidden">
    <div class="panel menu wide">
        <h2 id="doneTitle">You found her!</h2>
        <canvas id="doneArt" width="460" height="200"></canvas>
        <p id="doneText" class="tip"></p>
        <div id="doneStats" class="done-stats"></div>
        <button id="btnNext" class="big-btn">🌈 Next Stage</button>
        <button id="btnDoneTitle" class="mid-btn">🏠 Main Menu</button>
        <button id="btnDoneExit" class="mid-btn">🚪 Exit to JoyNot</button>
    </div>
</div>

<div id="quitConfirm" class="overlay hidden">
    <div class="panel menu">
        <h2>🏠 Leave this stage?</h2>
        <p class="tip">Reading level, math level, stage and jelly beans are saved. This stage's map starts over next time.</p>
        <button id="btnQuitNo" class="big-btn">▶ Keep Playing</button>
        <button id="btnPlayAgain" class="mid-btn">🔄 Play Again</button>
        <button id="btnQuitYes" class="mid-btn">🏠 Main Menu</button>
        <button id="btnQuitExit" class="mid-btn">🚪 Exit to JoyNot</button>
    </div>
</div>

<script>window.JOYNOT = @json($joynot);</script>
<script type="module" src="{{ $B }}/js/game.js?v={{ $game->version() }}"></script>
</body>
</html>

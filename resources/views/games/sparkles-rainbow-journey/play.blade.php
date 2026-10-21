@php $B = '/games/sparkles-rainbow-journey'; @endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="#f7f4e9">
    <title>Candy Cloud Trail — {{ $kid->name }} — JoyNot</title>
    <link rel="manifest" href="/manifest.json">
    <link rel="icon" href="{{ $B }}/icons/favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="/fonts/fonts.css">
    <link rel="stylesheet" href="{{ $B }}/css/board.css?v={{ $game->version() }}">
</head>
<body>
<header class="masthead">
    <a href="{{ $joynot['urls']['exit'] ?? '/dashboard' }}" class="brand" aria-label="JoyNot games"><img src="/icons/logo.svg" alt="" width="44" height="44"><b>Joy<span>Not</span></b></a>
    <div class="mast-title">CANDY CLOUD TRAIL <span>•</span> A THINK & ROLL ADVENTURE</div>
    <button id="soundToggle" class="icon" aria-label="Toggle voice" aria-pressed="false">🔊</button>
</header>
<div id="loading" role="status">Setting the table…</div>
<main id="setup" class="setup">
    <section class="welcome">
        <div class="eyebrow"><span class="spark">✦</span> LITTLE QUESTIONS. BIG ADVENTURES.</div>
        <h1>Candy<br><em>Cloud Trail.</em><span class="title-star">✳</span></h1>
        <p>Think a little. Roll a little.<br>Race your favorite people to Candy Castle.</p>
        <div class="welcome-board" aria-hidden="true"><div class="tiny-path"><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i><i>6</i><i>7</i><i>8</i><i>9</i></div><span class="tiny-die">⚄</span><span class="tiny-castle">♜</span><span class="tiny-cloud">☁</span></div>
        <div class="how-play"><h2>A sweet little race</h2><ol><li><b>01</b><span>Solve a reading or math problem.</span></li><li><b>02</b><span>Roll the die. Move that many spaces.</span></li><li><b>03</b><span>Climb ladders, swoosh down slides, and follow candy cards to the next matching color.</span></li><li><b>04</b><span>Reach space 60 to win. No exact roll needed!</span></li></ol></div>
        <a class="grownup-link" href="{{ $joynot['urls']['grownups'] }}">Grown-Ups ↗</a>
    </section>
    <section class="setup-panel">
        <div class="section-heading"><div><div class="eyebrow">SAVE A SEAT FOR SOMEONE SWEET</div><h2>Who’s coming along?</h2></div><span id="playerCount" class="count">2 / 6 players</span></div>
        <p class="setup-tip">Play with bots, family, or both. Choose your character and shirt color.</p>
        <div id="seats" class="seats"></div>
        <div class="add-players"><button id="addFamily" class="secondary">＋ Family · this device</button><button id="addRemote" class="secondary">＋ Family · another device</button><button id="addBot" class="secondary">＋ Bot</button></div>
        <p class="remote-tip">🔒 Separate devices: reserve a family seat, then have them open <b>Grown-Ups → Join</b> on their device. Only family with access to that area can join. Keep this game open as the host.</p>
        <div class="setup-footer"><label for="practiceFocus">Practice along the way<select id="practiceFocus"><option value="both">Reading + math</option><option value="math">Math problems</option><option value="reading">Reading</option></select><small>Uses your Grown-Ups learning levels.</small></label><div><button id="resumeGame" class="secondary hidden">Resume saved game</button><button id="startGame" class="primary" disabled>Setting the table…</button></div></div>
        <button id="setupExit" class="text-button">← Back to games</button>
    </section>
</main>
<main id="table" class="table hidden">
    <section class="board-area" aria-label="Candy Cloud Trail board">
        <div class="board-heading"><div><div class="eyebrow">WELCOME TO THE SWEET SIDE</div><h1>Candy Cloud Trail<span>✦</span></h1></div><div class="board-actions"><button id="pauseGame" class="icon" aria-label="Pause game">Ⅱ</button><button id="exitGame" class="icon" aria-label="Save and return to games">⌂</button></div></div>
        <div class="land-labels"><span>🍓 Strawberry Start</span><span>🌿 Mint Meadow</span><span>♜ Candy Castle</span></div>
        <canvas id="game" tabindex="0" aria-label="3D candy board with 60 spaces. Drag to rotate. Player positions are listed beside the board."></canvas>
        <div class="board-bottom"><div class="legend"><span><i class="ladder-dot"></i>Rainbow ladder ↑</span><span><i class="slide-dot"></i>Twisty slide ↓</span><span>🍬 Candy card</span></div><div class="view-tools"><span id="boardMode">3D TABLETOP</span><button id="zoomOut" aria-label="Zoom out">−</button><button id="resetView" aria-label="Reset board view">↺</button><button id="zoomIn" aria-label="Zoom in">＋</button></div></div>
        <p class="board-tip">Drag the board to look around · Buttons and answers work with touch, mouse, or keyboard.</p>
    </section>
    <aside class="turn-panel">
        <div class="turn-top"><span class="eyebrow">PASS THE LUCK AROUND</span><span id="roundNumber">Round 1</span></div>
        <section id="turnCard" class="turn-card"><div id="turnAvatar" class="turn-avatar"></div><div><small id="turnKind">YOUR TURN</small><h2 id="turnName">Your turn</h2></div></section>
        <section id="questionCard" class="question-card"><div class="step-label"><span>1</span><b id="questionTrack">Think it through</b><button id="readQuestion" class="icon" aria-label="Read question aloud">🔊</button></div><p id="questionText" class="question-text"></p><p id="turnWait" class="muted"></p><form id="answerForm"><label for="answerInput" class="sr-only">Your answer</label><input id="answerInput" autocomplete="off" maxlength="200" enterkeyhint="done"><button id="checkAnswer" class="primary" type="submit">Check answer ✓</button></form><div class="question-tools"><button id="listenAnswer" class="secondary">🎤 Say it</button><button id="hintQuestion" class="text-button">Need a hint?</button></div><p id="answerFeedback" class="feedback" role="status"></p><p id="questionHelp" class="help-note hidden"></p></section>
        <section id="rollCard" class="roll-card hidden"><div class="step-label"><span>2</span><b>Your roll is ready!</b></div><p id="rollHint"></p><button id="rollDice" class="die-button"><span class="dice-face">⚄</span><strong>Roll the die</strong></button></section>
        <section id="resultCard" class="result-card hidden"><div class="step-label"><span>3</span><b>Follow the trail</b></div><div id="dice" class="result-die">⚄</div><p id="resultText"></p><span id="candySwatch" class="candy-swatch hidden"></span><p id="resultWait" class="muted"></p><button id="nextTurn" class="primary">Next player →</button></section>
        <section class="players-section"><h3>THE TRAVELERS</h3><ol id="players"></ol></section>
    </aside>
</main>
<footer id="announcement" class="announcement" aria-live="polite">A little thinking. A little luck. A whole lot of candy.</footer>
<div id="pause" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="pauseTitle"><div class="modal-card"><span class="eyebrow">TAKE A LITTLE BREATHER</span><h2 id="pauseTitle">Your trail can wait.</h2><p>The game is saved after every turn. You can resume it from the player setup screen.</p><button id="resumeTurn" class="primary">Keep playing →</button><div id="recoverSeats"></div><button id="backToSetup" class="secondary">Save & player setup</button></div></div>
<div id="winner" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="winnerName"><div class="modal-card winner-card"><div class="eyebrow">SWEET VICTORY!</div><div id="winnerAvatar"></div><h2 id="winnerName"></h2><p id="winnerCopy"></p><button id="playAgain" class="primary">Another sweet adventure →</button><button id="winnerHome" class="secondary">Back to games</button></div></div>
<script>window.JOYNOT = @json($joynot);</script>
<script type="module" src="{{ $B }}/js/board-game.js?v={{ $game->version() }}"></script>
</body>
</html>

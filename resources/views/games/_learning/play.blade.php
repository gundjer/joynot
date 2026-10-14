{{-- Shared page for every JoyNot learning mini-game (engine: public/games/_joy, game: public/games/{key}/game.js) --}}
@php $B = '/games/'.$game->key(); $J = '/games/_joy'; $v = $game->version(); $c = $game->clientConfig(); @endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="{{ ! empty($c['dark']) ? '#0e1424' : ($c['theme']['bg1'] ?? '#fff8ee') }}">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="JoyNot">
    <meta name="format-detection" content="telephone=no">
    <title>{{ $game->title() }} — {{ $kid->name }} — JoyNot</title>
    <link rel="manifest" href="/manifest.json">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" sizes="180x180">
    <link rel="stylesheet" href="/fonts/fonts.css">
    <link rel="stylesheet" href="{{ $J }}/css/joy.css?v={{ $v }}">
    @if (file_exists(public_path('games/'.$game->key().'/game.css')))
        <link rel="stylesheet" href="{{ $B }}/game.css?v={{ $v }}">
    @endif
</head>
<body class="game-{{ $game->key() }}{{ ! empty($c['dark']) ? ' dark' : '' }}">
<div id="app">
    <noscript><p style="padding:20px;font-size:20px">This game needs JavaScript turned on.</p></noscript>
</div>
<script>window.JOYNOT = @json($joynot); window.JOY_GAME = @json($c);</script>
<script type="module" src="{{ $B }}/game.js?v={{ $v }}"></script>
</body>
</html>

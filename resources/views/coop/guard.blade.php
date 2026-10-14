{{-- A grown-up's phone playing along with a kid's game. Opened from the "Join" card on the Grown-ups pages.
     A game with its own helper (public/games/{key}/guard.js, e.g. Bee Smart's Guard Bee) uses that; every other game
     uses the shared live-picture helper (public/games/_play/helper.js). --}}
@php
    $own = is_file(public_path('games/'.$game->key().'/guard.js'));
    $base = $own ? '/games/'.$game->key().'/guard' : '/games/_play/helper';
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="#ffd34d">
    <meta name="format-detection" content="telephone=no">
    <title>{{ $own ? 'Guard Bee' : 'Play together' }} — {{ $session->kid->name }} — JoyNot</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="/fonts/fonts.css">
    <link rel="stylesheet" href="{{ $base }}.css?v={{ $game->version() }}">
</head>
<body>
<div id="guard"><noscript><p style="padding:20px">This needs JavaScript turned on.</p></noscript></div>
<script>window.COOP = @json($coop);</script>
<script type="module" src="{{ $base }}.js?v={{ $game->version() }}"></script>
</body>
</html>

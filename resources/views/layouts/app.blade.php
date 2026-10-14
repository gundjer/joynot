<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="#fff8ee">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="JoyNot">
    <title>@yield('title', 'JoyNot') — JoyNot</title>
    <meta name="description" content="@yield('description', 'Learning mini-games kids love. Reading, math and more — with progress for grown-ups.')">
    <link rel="manifest" href="/manifest.json">
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" sizes="180x180">
    <link rel="stylesheet" href="/fonts/fonts.css">
    <link rel="stylesheet" href="/css/joynot.css?v={{ config('joynot.games.rustys-after-hours.version', '1') }}">
    @stack('head')
</head>
<body class="@yield('body_class')">
<div class="wrap">
    <header class="top">
        <a class="brand" href="{{ auth()->check() ? route('dashboard') : route('home') }}">
            <img src="/icons/logo.svg" alt="" width="44" height="44">
            <b>Joy<span>Not</span></b>
        </a>
        <div class="top-links">@yield('top_links')</div>
    </header>

    @if (session('status')) <div class="alert ok">{{ session('status') }}</div> @endif

    @yield('content')

    {{-- Legal links: public pages and the Grown-ups area only (kids' screens stay clean). --}}
    @if (! $__env->hasSection('no_footer') && (! auth()->check() || request()->routeIs('grownups.*') || request()->routeIs('legal.*')))
        @include('partials.footer')
    @endif
</div>
<script>
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
</script>
@stack('scripts')
</body>
</html>

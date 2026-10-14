@extends('layouts.app')
@section('title', 'Learning games kids love')

@section('top_links')
    <a class="pill-link" href="{{ route('login') }}">Log in</a>
    <a class="btn sm" href="{{ route('register') }}">Sign up free</a>
@endsection

@section('content')
<section class="hero">
    <div>
        <h1>Learning games kids <em>actually</em> want to play.</h1>
        <p class="lead">JoyNot is a growing set of mini-games for reading, math and more. Each kid gets their own profile, the games adjust to their level, and grown-ups can see how everyone is doing.</p>
        <div class="cta">
            <a class="btn" href="{{ route('register') }}">Create a family account</a>
            <a class="btn ghost" href="{{ route('login') }}">I already have one</a>
        </div>
    </div>
    <div class="hero-art">
        @php $first = $games->first(); @endphp
        @if ($first)
            <div class="game {{ $first->theme() }}" style="pointer-events:none">
                <div class="cover" style="background-image:url('{{ $first->cover() }}')"></div>
                <div class="body"><h3>{{ $first->title() }}</h3><p>{{ $first->description() }}</p></div>
            </div>
        @endif
    </div>
</section>

<section class="features">
    <div class="feature"><div class="ic">👧👦</div><h3>A profile for every kid</h3><p class="muted">Kids tap their picture and play. Everyone's progress stays separate.</p></div>
    <div class="feature"><div class="ic">📈</div><h3>Levels that adjust</h3><p class="muted">Games start easy, get harder as they improve, and step back when it's too tough.</p></div>
    <div class="feature"><div class="ic">🔒</div><h3>Grown-ups area</h3><p class="muted">Your own PIN protects settings, profiles and progress reports.</p></div>
    <div class="feature"><div class="ic">📱</div><h3>Phones, tablets, computers</h3><p class="muted">Works in the browser on Android, iPhone, iPad and desktop. Stay logged in on the family tablet.</p></div>
</section>
<div style="max-width:860px;margin:0 auto 20px">@include('partials.donate')</div>
@endsection

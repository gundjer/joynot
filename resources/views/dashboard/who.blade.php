@extends('layouts.app')
@section('title', "Who's playing?")

@section('top_links')
    <a class="pill-link" href="{{ route('grownups.index') }}">Grown-ups 🔒</a>
@endsection

@section('content')
<section class="who">
    @if ($kids->isEmpty())
        <div class="card empty">
            <div class="big">🎈</div>
            <h1>Let's get set up!</h1>
            <p class="muted">A grown-up needs to add the players first. It only takes a minute.</p>
            <a class="btn" href="{{ route('grownups.index') }}">Grown-ups: add players 🔒</a>
        </div>
    @else
        <h1>Who's playing?</h1>
        <p class="sub">Tap your picture!</p>
        <div class="kids">
            @foreach ($kids as $kid)
                <a class="kid {{ $kid->id === $lastKidId ? 'last' : '' }}" style="--c: {{ $kid->color }}" href="{{ route('kid.games', $kid) }}">
                    <span class="av">{{ $kid->avatar }}</span>
                    <span class="nm">{{ $kid->name }}</span>
                </a>
            @endforeach
        </div>
        <div class="who-foot">
            <a class="pill-link" href="{{ route('grownups.kids.create') }}">➕ Add a player (grown-ups)</a>
        </div>
    @endif
</section>
@endsection

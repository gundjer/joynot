@extends('layouts.app')
@section('title', $kid->name.' — '.$game->title())

@section('content')
@include('partials.grownups-bar')
<div class="crumbs"><a href="{{ route('grownups.index') }}">Overview</a> › <a href="{{ route('grownups.kids.edit', $kid) }}">{{ $kid->name }}</a> › {{ $game->title() }}</div>

<h1 style="display:flex; align-items:center; gap:12px; flex-wrap:wrap">
    <span class="mini-av" style="--c: {{ $kid->color }}">{{ $kid->avatar }}</span>
    {{ $kid->name }} · {{ $game->title() }}
</h1>
<p class="muted" style="margin-top:-6px">Played {{ $progress->plays }} {{ \Illuminate\Support\Str::plural('time', $progress->plays) }} · Last played {{ optional($progress->last_played_at)->diffForHumans() ?? 'never' }}</p>

<div class="grid" style="align-items:start">
    <section class="card">
        <h2>⚙️ {{ $kid->name }}'s settings</h2>
        <form method="POST" action="{{ route('grownups.games.update', [$kid, $game->key()]) }}">
            @csrf @method('PUT')
            <label class="field">Show this game on {{ $kid->name }}'s dashboard
                <select name="visible">
                    <option value="1" @selected(! $progress->hidden)>Yes, show it</option>
                    <option value="0" @selected($progress->hidden)>No, hide it</option>
                </select>
            </label>
            @if ($game->settingsView())
                @include($game->settingsView(), $settings + ['kid' => $kid])
            @endif
            <button class="btn block" type="submit">Save settings</button>
        </form>
    </section>

    <section class="card danger-zone">
        <h2>Start {{ $kid->name }} over</h2>
        <p class="small muted">Erases {{ $kid->name }}'s progress and answers in {{ $game->title() }} only. Settings stay the same.</p>
        <form method="POST" action="{{ route('grownups.games.reset', [$kid, $game->key()]) }}" onsubmit="return window.confirm('Erase {{ addslashes($kid->name) }}\'s {{ addslashes($game->title()) }} progress?')">
            @csrf
            <label class="field">Type RESET to confirm <input type="text" name="confirm" placeholder="RESET" autocomplete="off"></label>
            <button class="btn danger sm" type="submit">Reset progress</button>
        </form>
    </section>
</div>
@if ($game->reportView())
    <h2 style="margin-top:24px">📊 Progress</h2>
    @include($game->reportView(), $report + ['kid' => $kid])
@endif
@endsection

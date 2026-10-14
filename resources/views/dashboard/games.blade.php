@extends('layouts.app')
@section('title', $kid->name."'s games")

@section('top_links')
    <a class="pill-link" href="{{ route('dashboard') }}">👥 Switch player</a>
    <a class="pill-link" href="{{ route('grownups.index') }}">Grown-ups 🔒</a>
@endsection

@section('content')
<div class="hello">
    <span class="av" style="--c: {{ $kid->color }}">{{ $kid->avatar }}</span>
    <div class="grow">
        <h1>Hi, {{ $kid->name }}!</h1>
        <p>Pick a game to play.</p>
    </div>
</div>

<div class="games">
    @foreach ($games as $row)
        @php $g = $row['game']; @endphp
        <a class="game {{ $g->theme() }}" href="{{ route('play', [$g->key(), $kid->id]) }}">
            <div class="cover" style="background-image:url('{{ $g->cover() }}')">
                <div class="skills">@foreach ($g->skills() as $s)<span>{{ $s }}</span>@endforeach</div>
            </div>
            <div class="body">
                <h3>{{ $g->title() }}</h3>
                <p>{{ $g->description() }}</p>
                @if ($row['badges'])
                    <div class="chips">@foreach ($row['badges'] as [$icon, $text])<span>{{ $icon }} {{ $text }}</span>@endforeach</div>
                @endif
                <span class="btn go">▶ Play</span>
            </div>
        </a>
    @endforeach

    @foreach ($comingSoon as $soon)
        <div class="game soon" aria-label="Coming soon">
            <div class="cover">{{ $soon['icon'] ?? '🧩' }}</div>
            <div class="body">
                <h3>{{ $soon['title'] ?? 'Coming soon' }}</h3>
                <p>{{ $soon['description'] ?? '' }}</p>
            </div>
        </div>
    @endforeach
</div>
@endsection

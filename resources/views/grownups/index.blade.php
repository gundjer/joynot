@extends('layouts.app')
@section('title', 'Grown-ups')

@section('content')
@include('partials.grownups-bar')

<section class="card">
    <h2>Every kid, every game</h2>
    @foreach ($rows as $i => $row)
        @php $k = $row['kid']; @endphp
        <div class="kid-row">
            <span class="mini-av" style="--c: {{ $k->color }}">{{ $k->avatar }}</span>
            <div>
                <h3 style="margin:4px 0 2px">{{ $k->name }}</h3>
                <div class="small muted">
                    🏫 {{ \App\Models\Kid::gradeName($k->grade) }}
                    · 📖 reads at {{ \App\Models\Kid::gradeName($k->grades()['reading']) }}
                    · 🔢 math at {{ \App\Models\Kid::gradeName($k->grades()['math']) }}
                    · 🎯 goal {{ \App\Models\Kid::gradeName($k->goal_grade) }}
                </div>
                <div class="gprog">
                    @foreach ($row['games'] as $g)
                        <a class="g" href="{{ route('grownups.kids.edit', $k->id) }}#game-{{ $g['game']->key() }}">
                            <b>{{ $g['game']->title() }} ›</b>
                            @foreach ($g['overview'] as $label => $value)<span><strong>{{ $label }}:</strong> {{ $value }}</span>@endforeach
                            <span class="muted">Last played {{ optional($g['progress']?->last_played_at)->diffForHumans() ?? 'never' }}</span>
                            @if ($g['progress']?->hidden) <span class="off">Hidden for {{ $k->name }}</span> @endif
                        </a>
                    @endforeach
                </div>
            </div>
            <div class="row-actions">
                <a class="btn sm ghost" href="{{ route('grownups.kids.edit', $k->id) }}">✏️ Edit</a>
                @if ($rows->count() > 1)
                    <form method="POST" action="{{ route('grownups.kids.order') }}">@csrf<input type="hidden" name="kid_id" value="{{ $k->id }}"><input type="hidden" name="dir" value="up"><button class="btn sm ghost" type="submit" @disabled($i === 0) aria-label="Move {{ $k->name }} up">▲</button></form>
                    <form method="POST" action="{{ route('grownups.kids.order') }}">@csrf<input type="hidden" name="kid_id" value="{{ $k->id }}"><input type="hidden" name="dir" value="down"><button class="btn sm ghost" type="submit" @disabled($i === $rows->count() - 1) aria-label="Move {{ $k->name }} down">▼</button></form>
                @endif
            </div>
        </div>
    @endforeach
</section>
@endsection

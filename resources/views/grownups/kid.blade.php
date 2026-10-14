@extends('layouts.app')
@section('title', $kid->name.' — Grown-ups')

@section('content')
@include('partials.grownups-bar')

{{-- ===== Profile + grades ===== --}}
<section class="card">
    <h2 style="display:flex; align-items:center; gap:12px; flex-wrap:wrap">
        <span class="mini-av" style="--c: {{ $kid->color }}">{{ $kid->avatar }}</span> {{ $kid->name }}
    </h2>
    <form method="POST" action="{{ route('grownups.kids.update', $kid->id) }}">
        @csrf @method('PUT')
        <div class="grid" style="align-items:start">
            <div>
                <label class="field">Name <input type="text" name="name" value="{{ old('name', $kid->name) }}" maxlength="40" required></label>
                @include('partials.kid-pickers', ['avatars' => config('joynot.avatars'), 'colors' => config('joynot.colors'), 'avatar' => $kid->avatar, 'color' => $kid->color])
            </div>
            <div>
                <h3>📚 Grade levels</h3>
                @include('partials.grade-fields', ['kid' => $kid])
                <label class="check" style="margin:0 0 4px"><input type="checkbox" name="match_levels" value="1" id="matchLevels" style="width:22px;height:22px"> Also move <b>all</b> game levels to match these grades</label>
                <p class="small muted" style="margin:0 0 14px">📖 <b>Reads at</b> sets reading, writing, science, coding, space, AI and feelings games. 🔢 <b>Does math at</b> sets the time and money games. Blank = uses Grade in school. This box ticks itself when you change a grade.</p>
            </div>
        </div>
        <button class="btn block" type="submit">Save {{ $kid->name }}</button>
    </form>
</section>

{{-- ===== Each game: settings + progress ===== --}}
@foreach ($games as $row)
    @php $game = $row['game']; $progress = $row['progress']; @endphp
    <section id="game-{{ $game->key() }}" class="game-block">
        <div class="game-head {{ $game->theme() }}">
            <span class="thumb" style="background-image:url('{{ $game->cover() }}')"></span>
            <div>
                <h2>{{ $game->title() }}</h2>
                <div class="small">Played {{ $progress->plays }} {{ \Illuminate\Support\Str::plural('time', $progress->plays) }} · Last played {{ optional($progress->last_played_at)->diffForHumans() ?? 'never' }}</div>
            </div>
            <a class="btn sm sun" href="{{ route('play', [$game->key(), $kid->id]) }}">▶ Play as {{ $kid->name }}</a>
        </div>

        <div class="grid" style="align-items:start">
            <div class="card">
                <h3>⚙️ {{ $kid->name }}'s settings</h3>
                <form method="POST" action="{{ route('grownups.games.update', [$kid->id, $game->key()]) }}">
                    @csrf @method('PUT')
                    <label class="field">Show this game on {{ $kid->name }}'s dashboard
                        <select name="visible">
                            <option value="1" @selected(! $progress->hidden)>Yes, show it</option>
                            <option value="0" @selected($progress->hidden)>No, hide it</option>
                        </select>
                    </label>
                    @if ($game->settingsView())
                        @include($game->settingsView(), $row['settings'] + ['kid' => $kid])
                    @endif
                    <button class="btn block" type="submit">Save {{ $game->title() }} settings</button>
                </form>
            </div>
            <div class="stack">
                @if ($game->reportView())
                    @include($game->reportView(), $row['report'] + ['kid' => $kid, 'part' => 'summary'])
                @endif
                <div class="card danger-zone">
                    <h3>Start {{ $kid->name }} over</h3>
                    <p class="small muted">Erases {{ $kid->name }}'s {{ $game->title() }} progress and answers, then starts again at their grade levels. Settings stay the same.</p>
                    <form method="POST" action="{{ route('grownups.games.reset', [$kid->id, $game->key()]) }}" onsubmit="return window.confirm('Erase {{ addslashes($kid->name) }}\'s {{ addslashes($game->title()) }} progress?')">
                        @csrf
                        <label class="field">Type RESET to confirm <input type="text" name="confirm" placeholder="RESET" autocomplete="off" autocapitalize="characters"></label>
                        <button class="btn danger sm" type="submit">Reset progress</button>
                    </form>
                </div>
            </div>
        </div>

        @if ($game->supportsCoop())
            @include('partials.coop-chats', ['kid' => $kid, 'game' => $game])
        @endif

        @if ($game->reportView())
            @include($game->reportView(), $row['report'] + ['kid' => $kid, 'part' => 'details'])
        @endif
    </section>
@endforeach

{{-- ===== Remove ===== --}}
<section class="card danger-zone" style="margin:24px 0 40px">
    <h2>Remove {{ $kid->name }}</h2>
    <p class="small muted">Deletes {{ $kid->name }}'s profile, progress in every game, and all their answers. It can't be undone.</p>
    <form method="POST" action="{{ route('grownups.kids.destroy', $kid->id) }}" onsubmit="return window.confirm('Remove {{ addslashes($kid->name) }} for good?')">
        @csrf @method('DELETE')
        <label class="field">Type DELETE to confirm <input type="text" name="confirm" placeholder="DELETE" autocomplete="off" autocapitalize="characters"></label>
        <button class="btn danger sm" type="submit">Remove {{ $kid->name }}</button>
    </form>
</section>
@endsection

@push('scripts')
<script>
    (function () {
        var box = document.getElementById('matchLevels');
        if (!box) return;
        ['grade', 'reading_grade', 'math_grade'].forEach(function (n) {
            var s = box.form && box.form.querySelector('select[name="' + n + '"]');
            if (s) s.addEventListener('change', function () { box.checked = true; });
        });
    })();
</script>
@endpush

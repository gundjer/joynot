{{-- Candy Cloud Trail — per-kid settings fields (inside the Grown-ups settings form) --}}
@include('partials.together-toggles', ['toggles' => \App\Games\Game::togetherSettings(), 'settings' => $settings])
<div class="settings-grid">
    <label class="field">📖 Reading level
        <select name="reading_level">@foreach ($readingLevels as $n => $lv)<option value="{{ $n }}" @selected($n == $rl)>{{ $n }}. {{ $lv[0] }} (Gr {{ $lv[1] }})</option>@endforeach</select></label>
    <label class="field">🔢 Math level
        <select name="math_level">@foreach ($mathLevels as $n => $lv)<option value="{{ $n }}" @selected($n == $ml)>{{ $n }}. {{ $lv[0] }} (Gr {{ $lv[1] }})</option>@endforeach</select></label>
    <input type="hidden" name="stage" value="{{ $stage }}">
    <label class="field">🎲 Board questions
        <select name="focus">@foreach (['both' => 'Reading + Math', 'reading' => 'Reading', 'math' => 'Math'] as $v => $t)<option value="{{ $v }}" @selected($settings['focus'] === $v)>{{ $t }}</option>@endforeach</select></label>
    <label class="field">🎤 Talk button checking
        <select name="strict">@foreach (['easy' => 'Easy (forgiving)', 'normal' => 'Normal'] as $v => $t)<option value="{{ $v }}" @selected($settings['strict'] === $v)>{{ $t }}</option>@endforeach</select></label>
    <label class="field">🎲 Piece movement speed
        <select name="speed">@foreach (['slow' => 'Slow', 'normal' => 'Normal', 'fast' => 'Fast'] as $v => $t)<option value="{{ $v }}" @selected($settings['speed'] === $v)>{{ $t }}</option>@endforeach</select></label>
    <label class="field">🎵 Music
        <select name="music"><option value="on" @selected($settings['music'])>On</option><option value="off" @selected(! $settings['music'])>Off</option></select></label>
</div>

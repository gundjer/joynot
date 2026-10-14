{{-- Rusty's After Hours — per-kid settings fields (inside the Grown-ups settings form) --}}
@include('partials.together-toggles', ['toggles' => \App\Games\Game::togetherSettings(), 'settings' => $settings])
<div class="settings-grid">
    <label class="field">📖 Reading level
        <select name="reading_level">@foreach ($readingLevels as $n => $lv)<option value="{{ $n }}" @selected($n == $rl)>{{ $n }}. {{ $lv[0] }} (Gr {{ $lv[1] }})</option>@endforeach</select></label>
    <label class="field">🔢 Math level
        <select name="math_level">@foreach ($mathLevels as $n => $lv)<option value="{{ $n }}" @selected($n == $ml)>{{ $n }}. {{ $lv[0] }} (Gr {{ $lv[1] }})</option>@endforeach</select></label>
    <label class="field">🌙 Night <input type="number" name="night" min="1" max="999" value="{{ $night }}"></label>
    <label class="field">😱 Scare level
        <select name="scare">@foreach (['off' => 'Off (no jump scare)', 'mild' => 'Mild ("Gotcha!")', 'full' => 'Full (loud jump scare)'] as $v => $t)<option value="{{ $v }}" @selected($settings['scare'] === $v)>{{ $t }}</option>@endforeach</select></label>
    <label class="field">🐾 Animatronic speed
        <select name="monsterSpeed">@foreach (['slow' => 'Slow', 'normal' => 'Normal', 'fast' => 'Fast'] as $v => $t)<option value="{{ $v }}" @selected($settings['monsterSpeed'] === $v)>{{ $t }}</option>@endforeach</select></label>
    <label class="field">🚪 Door mix
        <select name="focus">@foreach (['both' => 'Reading + Math', 'reading' => 'Mostly reading', 'math' => 'Mostly math'] as $v => $t)<option value="{{ $v }}" @selected($settings['focus'] === $v)>{{ $t }}</option>@endforeach</select></label>
    <label class="field">🎤 Talk button checking
        <select name="strict">@foreach (['easy' => 'Easy (forgiving)', 'normal' => 'Normal'] as $v => $t)<option value="{{ $v }}" @selected($settings['strict'] === $v)>{{ $t }}</option>@endforeach</select></label>
    <label class="field">🗣️ Animatronic voices
        <select name="voices"><option value="on" @selected($settings['voices'])>On</option><option value="off" @selected(! $settings['voices'])>Off</option></select></label>
</div>

{{-- School grade / working-at grades / goal. Optional $kid. --}}
@php
    $grades = config('joynot.grades');
    $g = fn ($field) => old($field, isset($kid) ? $kid->{$field} : null);
@endphp
<div class="settings-grid">
    <label class="field">🏫 Grade in school
        <select name="grade">
            <option value="">Not in school yet / skip</option>
            @foreach ($grades as $v => $t)<option value="{{ $v }}" @selected((string) $g('grade') === (string) $v)>{{ $t }}</option>@endforeach
        </select>
    </label>
    <label class="field">🎯 Goal: get them to
        <select name="goal_grade">
            <option value="">No goal set</option>
            @foreach ($grades as $v => $t)<option value="{{ $v }}" @selected((string) $g('goal_grade') === (string) $v)>{{ $t }} level</option>@endforeach
        </select>
    </label>
    <label class="field">📖 Reads at
        <span class="hint">Where they really are right now. Games start here.</span>
        <select name="reading_grade">
            <option value="">Same as grade in school</option>
            @foreach ($grades as $v => $t)<option value="{{ $v }}" @selected((string) $g('reading_grade') === (string) $v)>{{ $t }} level</option>@endforeach
        </select>
    </label>
    <label class="field">🔢 Does math at
        <span class="hint">Pick Kindergarten to start with the basics.</span>
        <select name="math_grade">
            <option value="">Same as grade in school</option>
            @foreach ($grades as $v => $t)<option value="{{ $v }}" @selected((string) $g('math_grade') === (string) $v)>{{ $t }} level</option>@endforeach
        </select>
    </label>
</div>

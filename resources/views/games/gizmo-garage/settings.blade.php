@include('partials.together-toggles', ['toggles' => array_filter($schema, fn ($f) => ! empty($f['toggle'])), 'settings' => $settings])
<p class="small muted">All parts are available in the open workshop. Grade suggests optional trophy challenges; children can invent without completing a challenge. Every part has illustrated, spoken help.</p>
<div class="settings-grid">
    <label class="field">School grade
        <select name="level">
            @foreach (range(0, 5) as $grade)
                <option value="{{ $grade * 2 + 1 }}" @selected(intdiv($level - 1, 2) === $grade)>{{ $grade ? 'Grade '.$grade : 'Kindergarten' }}</option>
            @endforeach
        </select>
    </label>
    @foreach ($schema as $name => $field)
        @continue(! empty($field['toggle']))
        <label class="field">{{ $field['label'] }}
            <select name="{{ $name }}">
                @foreach ($field['options'] as $value => $text)
                    <option value="{{ $value }}" @selected((string) $settings[$name] === (string) $value)>{{ $text }}</option>
                @endforeach
            </select>
        </label>
    @endforeach
</div>

{{-- Learning games — per-kid settings fields (inside the Grown-ups settings form). Fields come from the game class (settingsSchema).
     Fields with 'toggle' => true are big on/off switches in a highlighted "Play together" box at the top. --}}
@include('partials.together-toggles', ['toggles' => array_filter($schema, fn ($f) => ! empty($f['toggle'])), 'settings' => $settings])
<div class="settings-grid">
    <label class="field">{{ $skill[0] }} Level
        <span class="hint">Where {{ $kid->name }} plays right now.</span>
        <select name="level">
            @foreach ($levels as $n => $lv)
                <option value="{{ $n }}" @selected($n == $level)>{{ $n }}. {{ $lv[0] }} (Gr {{ $lv[1] }})</option>
            @endforeach
        </select>
    </label>
    @foreach ($schema as $name => $field)
        @continue(! empty($field['toggle']))
        <label class="field">{{ $field['label'] }}
            @if (! empty($field['hint']))<span class="hint">{{ $field['hint'] }}</span>@endif
            <select name="{{ $name }}">
                @foreach ($field['options'] as $value => $text)
                    <option value="{{ $value }}" @selected((string) $settings[$name] === (string) $value)>{{ $text }}</option>
                @endforeach
            </select>
        </label>
    @endforeach
</div>

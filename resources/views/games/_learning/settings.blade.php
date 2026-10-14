{{-- Learning games — per-kid settings fields (inside the Grown-ups settings form). Fields come from the game class (settingsSchema).
     Fields with 'toggle' => true are big on/off switches in a highlighted "Play together" box at the top. --}}
@include('partials.together-toggles', ['toggles' => array_filter($schema, fn ($f) => ! empty($f['toggle'])), 'settings' => $settings])
                </span>
            </label>
        @endforeach
        <p class="small muted" style="margin:6px 0 0">Press <b>Save</b> below after you flip a switch.</p>
    </div>
    <style>
        .together-box { border: 3px solid #f5b301; background: #fff7d6; border-radius: 16px; padding: 12px 14px; margin: 0 0 14px; }
        .together-box h4 { margin: 0 0 8px; font-size: 18px; }
        .switch-row { display: flex; gap: 12px; align-items: flex-start; padding: 10px 0; border-top: 1px dashed rgba(0,0,0,.12); cursor: pointer; }
        .switch-row:first-of-type { border-top: 0; }
        .switch-input { position: absolute; opacity: 0; width: 1px; height: 1px; }
        .switch { flex: none; width: 64px; height: 36px; border-radius: 999px; background: #c9c3b5; position: relative; transition: background .2s; margin-top: 2px; }
        .switch .knob { position: absolute; top: 4px; left: 4px; width: 28px; height: 28px; border-radius: 50%; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,.25); transition: left .2s; }
        .switch-input:checked + .switch { background: #2fae66; }
        .switch-input:checked + .switch .knob { left: 32px; }
        .switch-input:focus-visible + .switch { outline: 3px solid #2f7de1; outline-offset: 2px; }
        .switch-text { display: grid; gap: 2px; }
        .switch-state::after { content: 'OFF'; font-weight: 800; font-size: 13px; color: #8a8270; margin-left: 6px; }
        .switch-input:checked ~ .switch-text .switch-state::after { content: 'ON'; color: #2fae66; }
    </style>
@endif
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

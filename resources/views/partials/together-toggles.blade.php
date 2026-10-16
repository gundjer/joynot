{{-- "Play together" switches (Talk & Chat, Video). Used by every game's settings. Needs \$toggles (from Game::togetherSettings()) and \$settings (values 'on'/'off'). --}}
@if ($toggles)
    <div class="together-box">
        <h4>👨‍👩‍👧 Play together</h4>
        @foreach ($toggles as $name => $field)
            @php $on = (string) ($settings[$name] ?? 'off') === 'on'; @endphp
            <label class="switch-row">
                <input type="hidden" name="{{ $name }}" value="off">
                <input type="checkbox" class="switch-input" name="{{ $name }}" value="on" @checked($on)>
                <span class="switch" aria-hidden="true"><span class="knob"></span></span>
                <span class="switch-text"><b>{{ $field['label'] }}</b> <span class="switch-state"></span>
                    @if (! empty($field['hint']))<span class="hint">{{ $field['hint'] }}</span>@endif
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

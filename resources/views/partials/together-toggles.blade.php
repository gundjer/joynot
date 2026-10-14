{{-- "Play together" switches (Talk & Chat, Video). Used by every game's settings. Needs \$toggles (from Game::togetherSettings()) and \$settings (values 'on'/'off'). --}}
@if ($toggles)
    <div class="together-box">
        <h4>👨‍👩‍👧 Play together</h4>
        @foreach ($toggles as $name => $field)
            @php $on = (string) $settings[$name] === 'on'; @endphp
            <label class="switch-row">
                <input type="hidden" name="{{ $name }}" value="off">
                <input type="checkbox" class="switch-input" name="{{ $name }}" value="on" @checked($on)>
                <span class="switch" aria-hidden="true"><span class="knob"></span></span>
                <span class="switch-text"><b>{{ $field['label'] }}</b> <span class="switch-state"></span>
                    @if (! empty($field['hint']))<span class="hint">{{ $field['hint'] }}</span>@endif

{{-- avatar + color pickers. Needs $avatars, $colors, $avatar, $color --}}
<div class="field" style="font-weight:700">Picture
    <div class="pick">
        @foreach ($avatars as $a)
            <label><input type="radio" name="avatar" value="{{ $a }}" @checked($a === $avatar)><span>{{ $a }}</span></label>
        @endforeach
    </div>
</div>
<div class="field" style="font-weight:700; margin-top:12px">Color
    <div class="pick colors">
        @foreach ($colors as $c)
            <label><input type="radio" name="color" value="{{ $c }}" @checked($c === $color)><span style="background: {{ $c }}"></span></label>
        @endforeach
    </div>
</div>

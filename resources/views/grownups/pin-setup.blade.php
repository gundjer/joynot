@extends('layouts.app')
@section('title', $forgot ? 'Reset your PIN' : 'Set your PIN')

@section('top_links')
    <a class="pill-link" href="{{ route('dashboard') }}">← Back to kids</a>
@endsection

@section('content')
<div class="auth">
    <form class="card" method="POST" action="{{ route('grownups.pin.setup') }}">
        @csrf
        <div class="lock-art">{{ $forgot ? '🔑' : '🛡️' }}</div>
        <h1>{{ $forgot ? 'Make a new PIN' : 'Set your Grown-ups PIN' }}</h1>
        <p class="sub">{{ $forgot ? 'Type your account password to make a new PIN.' : 'This 4–6 number PIN keeps kids out of settings and reports. Pick one they won\'t guess!' }}</p>
        @if ($errors->any()) <div class="alert err">{{ $errors->first() }}</div> @endif
        @if ($needsPassword)
            <label class="field">Account password <input type="password" name="password" required autocomplete="current-password"></label>
        @endif
        <label class="field">New PIN <input class="pin-input" type="password" name="pin" inputmode="numeric" pattern="[0-9]*" minlength="4" maxlength="6" required autocomplete="off"></label>
        <label class="field">PIN again <input class="pin-input" type="password" name="pin_confirmation" inputmode="numeric" pattern="[0-9]*" minlength="4" maxlength="6" required autocomplete="off"></label>
        <button class="btn block" type="submit">Save PIN</button>
    </form>
</div>
@endsection

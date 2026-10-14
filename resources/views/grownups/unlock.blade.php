@extends('layouts.app')
@section('title', 'Grown-ups')

@section('top_links')
    <a class="pill-link" href="{{ route('dashboard') }}">← Back to kids</a>
@endsection

@section('content')
<div class="auth">
    <form class="card" method="POST" action="{{ route('grownups.unlock') }}">
        @csrf
        <div class="lock-art">🔒</div>
        <h1>Grown-ups only</h1>
        <p class="sub">Type your Grown-ups PIN.</p>
        @if ($errors->any()) <div class="alert err">{{ $errors->first() }}</div> @endif
        <input class="pin-input" type="password" name="pin" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" required autofocus aria-label="PIN">
        <div style="margin-top:16px"><button class="btn block" type="submit">Unlock</button></div>
        <div class="links">
            <a href="{{ route('dashboard') }}">← Back to kids</a>
            <a href="{{ route('grownups.pin.setup') }}">Forgot PIN?</a>
        </div>
    </form>
</div>
@endsection

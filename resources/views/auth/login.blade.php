@extends('layouts.app')
@section('title', 'Log in')

@section('content')
<div class="auth">
    <form class="card" method="POST" action="{{ route('login') }}">
        @csrf
        <h1>Welcome back! 👋</h1>
        <p class="sub">Grown-ups log in once. Kids can just play after that.</p>
        @if ($errors->any()) <div class="alert err">{{ $errors->first() }}</div> @endif
        <label class="field">Email <input type="email" name="email" value="{{ old('email') }}" required autofocus autocomplete="email"></label>
        <label class="field">Password <input type="password" name="password" required autocomplete="current-password"></label>
        <p class="small muted">🔒 You'll stay logged in on this device.</p>
        <button class="btn block" type="submit">Log in</button>
        <div class="links">
            <a href="{{ route('password.request') }}">Forgot password?</a>
            <a href="{{ route('register') }}">New here? Sign up</a>
        </div>
    </form>
</div>
@endsection

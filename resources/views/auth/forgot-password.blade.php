@extends('layouts.app')
@section('title', 'Forgot password')

@section('content')
<div class="auth">
    <form class="card" method="POST" action="{{ route('password.email') }}">
        @csrf
        <h1>Forgot your password?</h1>
        <p class="sub">We'll email you a link to make a new one.</p>
        @if ($errors->any()) <div class="alert err">{{ $errors->first() }}</div> @endif
        <label class="field">Email <input type="email" name="email" value="{{ old('email') }}" required autofocus></label>
        <button class="btn block" type="submit">Email me a reset link</button>
        <div class="links"><a href="{{ route('login') }}">← Back to log in</a></div>
    </form>
</div>
@endsection

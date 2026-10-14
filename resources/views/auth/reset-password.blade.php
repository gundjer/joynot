@extends('layouts.app')
@section('title', 'New password')

@section('content')
<div class="auth">
    <form class="card" method="POST" action="{{ route('password.update') }}">
        @csrf
        <input type="hidden" name="token" value="{{ $token }}">
        <h1>Make a new password</h1>
        @if ($errors->any()) <div class="alert err">{{ $errors->first() }}</div> @endif
        <label class="field">Email <input type="email" name="email" value="{{ old('email', $email) }}" required></label>
        <label class="field">New password <input type="password" name="password" required minlength="8" autocomplete="new-password"></label>
        <label class="field">New password again <input type="password" name="password_confirmation" required minlength="8" autocomplete="new-password"></label>
        <button class="btn block" type="submit">Save and log in</button>
    </form>
</div>
@endsection

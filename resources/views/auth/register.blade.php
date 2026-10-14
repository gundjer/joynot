@extends('layouts.app')
@section('title', 'Sign up')

@section('content')
<div class="auth">
    <form class="card" method="POST" action="{{ route('register') }}">
        @csrf
        <h1>Make a family account</h1>
        <p class="sub">For grown-ups. You'll add your kids next.</p>
        @if ($errors->any()) <div class="alert err">{{ $errors->first() }}</div> @endif
        <label class="field">Your name <input type="text" name="name" value="{{ old('name') }}" required maxlength="80" autocomplete="name"></label>
        <label class="field">Email <input type="email" name="email" value="{{ old('email') }}" required autocomplete="email"></label>
        <label class="field">Password <span class="hint">At least 8 characters.</span><input type="password" name="password" required minlength="8" autocomplete="new-password"></label>
        <label class="field">Password again <input type="password" name="password_confirmation" required minlength="8" autocomplete="new-password"></label>
        <label class="check-row"><input type="checkbox" name="agree" value="1" required @checked(old('agree'))> <span>I'm a parent or legal guardian, 18 or older, and I agree to the <a href="{{ route('legal.terms') }}" target="_blank">Terms</a> and <a href="{{ route('legal.privacy') }}" target="_blank">Privacy Policy</a> (including how JoyNot handles children's information).</span></label>
        <button class="btn block" type="submit">Create account</button>
        <div class="links"><span></span><a href="{{ route('login') }}">Already have an account? Log in</a></div>
    </form>
</div>
@endsection

{{-- Top-right links on the legal pages. --}}
@auth
    <a class="pill-link" href="{{ route('dashboard') }}">Back to JoyNot</a>
@else
    <a class="pill-link" href="{{ route('login') }}">Log in</a>
    <a class="btn sm" href="{{ route('register') }}">Sign up free</a>
@endauth

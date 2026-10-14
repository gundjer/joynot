@extends('layouts.app')
@section('title', 'Cookie Policy')
@section('description', 'JoyNot uses only the cookies and on-device storage it needs to work. No ads, no analytics, no tracking.')

@section('top_links')
    @include('legal._nav')
@endsection

@section('content')
@php $L = config('joynot.legal'); @endphp
<article class="card legal">
    <h1>Cookie Policy</h1>
    <p class="updated">Last updated: {{ $L['updated'] }}</p>

    <p class="note">JoyNot uses only <b>essential</b> cookies and on-device storage that keep you signed in, keep forms safe and save game progress. We do not use advertising, analytics or tracking cookies, and no other company sets cookies on joynot.com. That's why you don't see a cookie banner.</p>

    <h2>Cookies we use</h2>
    <ul>
        <li><b>Session cookie</b> ({{ config('session.cookie') }}): keeps you signed in while you use JoyNot and remembers that the Grown-ups area is unlocked. It expires after a period of no activity.</li>
        <li><b>Stay-signed-in cookie</b> (remember_web_…): keeps the family tablet or computer signed in so kids can tap their picture and play. It's removed when you log out.</li>
        <li><b>Security cookie</b> (XSRF-TOKEN): protects your forms from being sent by other websites.</li>
    </ul>

    <h2>Storage on your device</h2>
    <ul>
        <li><b>Game saves</b>: each game keeps a small backup of your child's progress on the device, so a game can pick up where it left off even if the internet drops for a moment.</li>
        <li><b>Your choices</b>: the read-aloud voice and speed you pick, and the helper name you use when playing together.</li>
        <li><b>App files</b>: JoyNot can be installed like an app. To load faster, it stores copies of game pictures, sounds, code and fonts on your device. These files don't contain personal information.</li>
    </ul>

    <h2>Your choices</h2>
    <p>You can delete cookies and site data in your browser settings at any time. If you block JoyNot's essential cookies, you won't be able to sign in or save progress.</p>

    <h2>Gifts through Stripe</h2>
    <p>If you choose to support JoyNot, the "Support JoyNot" button takes you to Stripe's own secure payment page. Stripe may use its own cookies on its site to process the payment and prevent fraud. See Stripe's privacy and cookie policies at stripe.com.</p>

    <h2>Questions</h2>
    <p>Email <a href="mailto:{{ $L['email'] }}">{{ $L['email'] }}</a>.</p>
</article>
@endsection

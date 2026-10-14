@extends('layouts.app')
@section('title', 'Contact')
@section('description', 'How to reach the JoyNot team.')

@section('top_links')
    @include('legal._nav')
@endsection

@section('content')
@php $L = config('joynot.legal'); @endphp
<article class="card legal">
    <h1>Contact us</h1>
    <p>We'd love to hear from you: questions, ideas for new games, bug reports, privacy requests or refunds.</p>

    <h2>Email</h2>
    <p><a class="btn" href="mailto:{{ $L['email'] }}?subject=JoyNot">✉️ {{ $L['email'] }}</a></p>
    <p class="muted">We try to answer within 3 business days.</p>

    <h2>Mail</h2>
    <address>{{ $L['address'][0] }}<br>{{ $L['address'][1] }}<br>{{ $L['address'][2] }}</address>

    <h2>Privacy and your child's information</h2>
    <p>To see, change or delete your family's information, most things can be done right away in the Grown-ups area. To delete your whole account, or for any privacy question, email us from the address on your account and write "Privacy request" in the subject. See our <a href="{{ route('legal.privacy') }}#coppa">Privacy Policy</a> for details.</p>

    <h2>Refunds</h2>
    <p>See <a href="{{ route('legal.donations') }}">Donations &amp; Refunds</a>.</p>
</article>
@endsection

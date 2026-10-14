@extends('layouts.app')
@section('title', 'Donations & Refunds')
@section('description', 'How one-time gifts to support JoyNot work, and how to get a refund.')

@section('top_links')
    @include('legal._nav')
@endsection

@section('content')
@php $L = config('joynot.legal'); @endphp
<article class="card legal">
    <h1>Donations &amp; Refunds</h1>
    <p class="updated">Last updated: {{ $L['updated'] }}</p>

    <h2>Supporting JoyNot</h2>
    <p>Every JoyNot game is free for every family, with no ads and no paid plans. The "Support JoyNot" button lets grown-ups give a <b>one-time gift</b> of any amount to help pay for hosting, security updates and new games. There are no monthly or recurring gifts, so you will never be charged again unless you choose to give again.</p>
    <ul>
        <li>Gifts are completely optional. They don't unlock games, levels or features, and families who don't give get exactly the same JoyNot.</li>
        <li>The button only appears on the home page and in the PIN-protected Grown-ups area, never on kids' screens.</li>
    </ul>

    <h2>Not tax-deductible</h2>
    <p>Gifts go to <b>{{ $L['company'] }}</b>, the limited liability company that runs JoyNot. It is <b>not</b> a charity or tax-exempt nonprofit, so gifts are <b>not tax-deductible</b>. Stripe emails you a receipt for your records.</p>

    <h2>How payment works</h2>
    <p>Payments are handled by Stripe on its own secure page. JoyNot never sees or stores your card number. Stripe shares with us your name, email address, the amount and the date so we can match receipts and handle refunds. We don't use this for marketing, and we don't connect it to your children's profiles.</p>

    <h2>Refunds</h2>
    <ul>
        <li>Gave by mistake, or gave the wrong amount? Email <a href="mailto:{{ $L['email'] }}">{{ $L['email'] }}</a> within <b>30 days</b> and we'll refund the full amount.</li>
        <li>Please include the email address you used, the date and the amount (or forward your Stripe receipt).</li>
        <li>Refunds go back to the original card or payment method through Stripe. Banks usually take 5–10 business days to show it.</li>
        <li>After 30 days we look at requests case by case. If you think a charge was unauthorized or fraudulent, contact us right away.</li>
    </ul>

    <h2>Questions</h2>
    <address>{{ $L['address'][0] }}<br>{{ $L['address'][1] }}<br>{{ $L['address'][2] }}<br><a href="mailto:{{ $L['email'] }}">{{ $L['email'] }}</a></address>
</article>
@endsection

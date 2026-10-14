@extends('layouts.app')
@section('title', 'Terms of Use')
@section('description', 'The rules for using JoyNot, the free learning games site for families.')

@section('top_links')
    @include('legal._nav')
@endsection

@section('content')
@php $L = config('joynot.legal'); @endphp
<article class="card legal">
    <h1>Terms of Use</h1>
    <p class="updated">Last updated: {{ $L['updated'] }}</p>

    <p>Welcome to JoyNot! These Terms are an agreement between you and {{ $L['company'] }} ("we", "us"), the company that runs joynot.com ("JoyNot"). By creating an account or using JoyNot, you agree to these Terms and to our <a href="{{ route('legal.privacy') }}">Privacy Policy</a>. If you don't agree, please don't use JoyNot.</p>

    <h2>1. Who can use JoyNot</h2>
    <ul>
        <li>Accounts are for parents and legal guardians who are <b>18 or older</b>. You may add profiles for children in your care and let them play.</li>
        <li>You are responsible for your children's use of JoyNot and for everything that happens under your account.</li>
        <li>Teachers or caregivers who use JoyNot with children must have permission from those children's parents or guardians.</li>
    </ul>

    <h2>2. Your account and PIN</h2>
    <ul>
        <li>Give us a real email address so you can reset your password.</li>
        <li>Keep your password and Grown-ups PIN private. Anyone who has your PIN can change settings, see progress and join your children's games.</li>
        <li>Tell us right away at <a href="mailto:{{ $L['email'] }}">{{ $L['email'] }}</a> if you think someone else is using your account.</li>
    </ul>

    <h2>3. Playing together</h2>
    <p>JoyNot lets grown-ups in your family join a child's game from their own device to help, cheer, point, chat, talk and (if you turn it on) show a small video bubble. Talk &amp; Chat and Video are <b>off by default</b> and can be turned on or off for each child and game in the Grown-ups area. Only people signed in to your family account who know your PIN can join. You agree to use these features kindly and only with your own family.</p>

    <h2>4. Fair use</h2>
    <p>Please don't:</p>
    <ul>
        <li>use JoyNot for anything illegal, harmful or unkind, or to bother anyone;</li>
        <li>try to break, overload, scrape, copy or reverse-engineer JoyNot, or get into accounts that aren't yours;</li>
        <li>upload or send anything that's hateful, violent, sexual, or that shares someone else's private information;</li>
        <li>sell, rent or resell access to JoyNot.</li>
    </ul>

    <h2>5. Our games and content</h2>
    <p>The JoyNot name, games, artwork, code, characters and text belong to {{ $L['company'] }} or our licensors and are protected by law. We give you a personal, non-commercial, revocable permission to use JoyNot with your family. Some parts use open-source materials under their own licenses (for example, our fonts are under the SIL Open Font License).</p>
    <p>JoyNot is for practice and fun. It isn't a replacement for a teacher, school, doctor, counselor or other professional. The Feelings Detective game shares general social-emotional tips, not medical or mental-health advice.</p>

    <h2>6. Free to use, and supporting JoyNot</h2>
    <p>JoyNot is free. There are no ads and no paid plans. If you'd like to help, you can give a one-time gift with the "Support JoyNot" button. Gifts are completely optional, don't unlock anything, and are not tax-deductible. See <a href="{{ route('legal.donations') }}">Donations &amp; Refunds</a>.</p>

    <h2>7. Changes and availability</h2>
    <p>We're always improving JoyNot, so games, levels and features may change, and the site may sometimes be unavailable for updates or repairs. We may change these Terms; if a change is important, we'll tell you by email or on the site before it takes effect. Using JoyNot after the change means you accept the new Terms.</p>

    <h2>8. Ending your account</h2>
    <p>You can stop using JoyNot at any time and ask us to delete your account by emailing us. We may suspend or close accounts that break these Terms or put children or JoyNot at risk.</p>

    <h2>9. No warranties</h2>
    <p>We work hard to make JoyNot safe, accurate and reliable, but it is provided <b>"as is" and "as available,"</b> without warranties of any kind, to the fullest extent the law allows. We don't promise that JoyNot will always be available, error-free or that it will meet a particular learning result.</p>

    <h2>10. Limits on our responsibility</h2>
    <p>To the fullest extent the law allows, {{ $L['company'] }} and its owners and team will not be responsible for indirect, incidental, special or consequential damages, or for lost data, related to JoyNot. Our total responsibility for any claim about JoyNot is limited to the greater of the amount you gave us in the 12 months before the claim or US $50. Some places don't allow these limits, so they may not all apply to you.</p>

    <h2>11. Disputes</h2>
    <p>These Terms are governed by the laws of the State of {{ $L['state'] }}, USA, without regard to conflict-of-law rules. If there's a problem, please email us first; most things can be fixed quickly. Any lawsuit must be brought in the state or federal courts located in {{ $L['state'] }}, and you and we agree to those courts' jurisdiction.</p>

    <h2>12. Contact</h2>
    <address>{{ $L['address'][0] }}<br>{{ $L['address'][1] }}<br>{{ $L['address'][2] }}<br><a href="mailto:{{ $L['email'] }}">{{ $L['email'] }}</a></address>
</article>
@endsection

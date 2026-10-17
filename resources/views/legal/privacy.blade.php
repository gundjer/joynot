@extends('layouts.app')
@section('title', 'Privacy Policy')
@section('description', 'How JoyNot collects, uses and protects information about families and children, including our COPPA notice.')

@section('top_links')
    @include('legal._nav')
@endsection

@section('content')
@php $L = config('joynot.legal'); @endphp
<article class="card legal">
    <h1>Privacy Policy</h1>
    <p class="updated">Last updated: {{ $L['updated'] }}</p>

    <p class="note">The short version: JoyNot is made for families. A grown-up makes the account and adds the kids. We collect only what the games need to work, we never show ads, we never sell or rent anyone's information, and we don't use any tracking or analytics tools (not Google, not anyone).</p>

    <p>JoyNot ("JoyNot", "we", "us") is run by {{ $L['company'] }}, {{ $L['address'][1] }}, {{ $L['address'][2] }}. This policy explains what information we collect on joynot.com, how we use it, and the choices parents and guardians have. It includes our notice under the U.S. Children's Online Privacy Protection Act (COPPA).</p>

    <h2>1. Who can make an account</h2>
    <p>Only a parent or legal guardian who is 18 or older can create a JoyNot account. Children do not sign up themselves. The grown-up adds each child's profile, chooses the settings, and protects the Grown-ups area with a PIN.</p>

    <h2>2. Information we collect</h2>
    <h3>From the grown-up who makes the account</h3>
    <ul>
        <li><b>Name, email address and password.</b> The password is stored only as a secure one-way hash, so we can't read it.</li>
        <li><b>Grown-ups PIN.</b> Also stored only as a secure hash.</li>
        <li><b>Settings you choose</b> for each child and each game (for example, grade level, which subjects to practice, and whether Talk &amp; Chat or Video are turned on).</li>
    </ul>
    <h3>About each child (entered by the grown-up, or created while the child plays)</h3>
    <ul>
        <li><b>A first name or nickname</b>, a picture chosen from our emoji list, a color and school grades. Please use a nickname if you prefer. We don't ask for last names, birthdays, photos, addresses or school names.</li>
        <li><b>Game progress</b>: levels, stars, and the answers given in the games (for example, "the clock was set to 3:15 and the answer was 3:15"), so the games can pick the right level and the Grown-ups area can show progress.</li>
        <li><b>Play-together chat messages</b>, only if a grown-up turns on Talk &amp; Chat for that game (it is off by default). Children in 3rd–5th grade can type short messages and emoji to the grown-ups in their own family who join the game. Messages are saved so grown-ups can read them later, and a grown-up can delete any message, or all of them, from the Grown-ups area at any time.</li>
    </ul>
    <h3>Play-together voice, video and game pictures</h3>
    <ul>
        <li><b>Hold-to-talk voice and the video call</b> are live and off by default. When a grown-up turns Video on, the grown-up's camera and the child's camera are both used so they can see each other (the child's device asks for permission first). The sound and picture go directly between your family's own devices. If two homes can't connect directly, they pass through our own relay server (coturn) without being saved. <b>We do not record live voice or video.</b></li>
        <li><b>Short voice messages.</b> If a live connection isn't possible, a voice message may be uploaded so the other family member can hear it. These clips are deleted after about 10 minutes, and right away when the game ends.</li>
        <li><b>The game screen.</b> So a grown-up can help, a live view of the game screen (and the problem on it) is shared with the family members who joined. It shows the game only, not the camera. It is not recorded or kept after the game ends.</li>
        <li>Only grown-ups who are signed in to <b>your</b> family account and have unlocked the Grown-ups area with your PIN can join a child's game. Strangers cannot join.</li>
    </ul>
    <h3>Collected automatically</h3>
    <ul>
        <li><b>Basic server logs</b> (IP address, browser type, the page requested, and the time). We use them only to keep JoyNot running and secure (for example, to stop someone guessing passwords). They are deleted after 14 days.</li>
        <li><b>Essential cookies and on-device storage</b> that keep you signed in and save game progress. See our <a href="{{ route('legal.cookies') }}">Cookie Policy</a>.</li>
    </ul>
    <p>We do <b>not</b> use advertising, advertising IDs, analytics, tracking pixels, social-media plugins, fingerprinting, or location tracking. Our fonts are stored on our own server, so loading JoyNot doesn't contact Google or other font services.</p>

    <h2>3. How we use information</h2>
    <ul>
        <li>To run the games, save progress, and adjust each game to your child's level.</li>
        <li>To show grown-ups progress reports and saved chats in the Grown-ups area.</li>
        <li>To let family members play together when a grown-up turns that on.</li>
        <li>To send account emails you ask for, like password resets.</li>
        <li>To keep JoyNot safe and working, and to fix problems.</li>
    </ul>
    <p>We never use children's information for advertising or marketing, and we never build profiles of children for any purpose other than running the games for your family.</p>

    <h2>4. Who we share information with</h2>
    <p>We do not sell, rent or trade personal information. We share it only with:</p>
    <ul>
        <li><b>Our hosting provider</b>, which runs the server where JoyNot and its data are stored in the United States.</li>
        <li><b>The email service</b> we use to send account emails, such as password resets.</li>
        <li><b>Stripe</b>, only if a grown-up chooses to support JoyNot with a gift. Payments happen on Stripe's own secure page; we never see card numbers. See the <a href="{{ route('legal.donations') }}">Donations &amp; Refunds</a> page.</li>
        <li><b>The law</b>: if we are required to by law, or to protect the safety of a child or others.</li>
        <li><b>A new owner</b>: if JoyNot is ever transferred to another company, this policy (or one that is at least as protective) will continue to apply, and we will tell you first.</li>
    </ul>
    <p>Read-aloud uses the voices built into your device or browser. Some browsers offer "online" voices that are run by the browser maker; JoyNot never picks Google's online voices on its own, and a grown-up can choose the voice in Grown-ups → Account. Only game text is read aloud.</p>

    <h2 id="coppa">5. Children's privacy (COPPA notice)</h2>
    <p>JoyNot is designed for children under 13 and their families, and we follow the Children's Online Privacy Protection Act.</p>
    <ul>
        <li><b>Parent consent.</b> When a grown-up makes an account, they confirm they are a parent or legal guardian, 18 or older, and agree to this policy. Children can't use JoyNot without that account.</li>
        <li><b>Only what's needed.</b> We don't make a child share more information than a game needs to work. Games never ask children for their full name, address, phone number, email, school, photos or location.</li>
        <li><b>Chat is limited and parent-controlled.</b> Typed chat is available only to children in 3rd–5th grade, only with grown-ups in their own family, and only when a grown-up turns it on. Grown-ups can read and delete it.</li>
        <li><b>Your rights as a parent.</b> At any time you can:
            <ul>
                <li>See your child's information in the Grown-ups area (profile, progress and saved chats).</li>
                <li>Change it, or turn off Talk &amp; Chat and Video in each game's settings.</li>
                <li>Delete saved chats, reset a game, or delete your child's whole profile (this deletes their progress and chats).</li>
                <li>Ask us to delete your whole account, or ask what information we have, by emailing <a href="mailto:{{ $L['email'] }}">{{ $L['email'] }}</a>. We may ask you to confirm you own the account. We delete accounts within 30 days.</li>
            </ul>
        </li>
        <li>If you believe a child made an account without a parent, email us and we will delete it.</li>
    </ul>

    <h2>6. How long we keep information</h2>
    <ul>
        <li>Account and child profiles: until you delete them or ask us to delete your account.</li>
        <li>Game progress and saved chats: until you delete them, reset the game, delete the child's profile, or delete the account.</li>
        <li>Voice messages: about 10 minutes, and deleted when the game ends. Live voice and video: never stored.</li>
        <li>Server logs: 14 days. Backups: up to 30 days, then overwritten.</li>
    </ul>

    <h2>7. How we protect information</h2>
    <p>JoyNot uses encrypted connections (HTTPS), hashed passwords and PINs, a PIN-locked Grown-ups area, a firewall and regular security updates on our server. No system is perfectly secure, but we work hard to protect your family's information. If we ever learn of a breach that affects you, we will tell you as required by law.</p>

    <h2>8. Your other privacy rights</h2>
    <p>Depending on where you live (for example, under Colorado or California law), you may have rights to access, correct, delete or get a copy of your information. Email us and we'll help. We don't sell personal information or use it for targeted advertising, so there is nothing to opt out of there.</p>

    <h2>9. Changes to this policy</h2>
    <p>If we change this policy, we'll update the date above. If a change affects how we handle children's information, we'll email the account holder and, when the law requires it, ask for your consent before the change applies.</p>

    <h2>10. Contact us</h2>
    <address>{{ $L['address'][0] }}<br>{{ $L['address'][1] }}<br>{{ $L['address'][2] }}<br><a href="mailto:{{ $L['email'] }}">{{ $L['email'] }}</a></address>
</article>
@endsection

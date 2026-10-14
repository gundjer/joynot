@extends('layouts.app')
@section('title', 'Account')

@section('content')
@include('partials.grownups-bar')

<div class="grid" style="max-width:860px">
    <section class="card">
        <h2>🔑 Change Grown-ups PIN</h2>
        <form method="POST" action="{{ route('grownups.pin.change') }}">
            @csrf
            <label class="field">New PIN (4–6 numbers) <input class="pin-input" type="password" name="pin" inputmode="numeric" pattern="[0-9]*" minlength="4" maxlength="6" required autocomplete="off"></label>
            <label class="field">PIN again <input class="pin-input" type="password" name="pin_confirmation" inputmode="numeric" pattern="[0-9]*" minlength="4" maxlength="6" required autocomplete="off"></label>
            <button class="btn" type="submit">Save new PIN</button>
        </form>
    </section>
    <section class="card">
        <h2>👤 Account</h2>
        <p>Logged in as <b>{{ auth()->user()->email }}</b></p>
        <p class="small muted">This device stays logged in so kids can just open JoyNot and play.</p>
        <form method="POST" action="{{ route('logout') }}">
            @csrf
            <button class="btn ghost" type="submit" onclick="return window.confirm('Log out on this device? Kids won\'t be able to play until you log in again.')">Log out of this device</button>
        </form>
    </section>
</div>

<section class="card" id="voice" style="max-width:860px;margin-top:16px">
    <h2>🔊 Read-aloud voice</h2>
    <p class="small muted">JoyNot automatically picks the warmest, most natural female voice on this device. You can choose a different one here. The choice is saved <b>on this device only</b>, because every phone, tablet and computer has its own voices.</p>
    <label class="field">Voice
        <span class="voice-row">
            <select id="voiceSel"><option value="">Automatic (recommended)</option></select>
            <button type="button" class="btn sm" id="voiceTry">▶ Try it</button>
        </span>
    </label>
    <label class="field">Speed
        <select id="voiceRate">
            <option value="0.85">Slower</option>
            <option value="1" selected>Normal</option>
            <option value="1.12">A little faster</option>
        </select>
    </label>
    <p class="small muted" id="voiceMsg" style="margin:6px 0 0"></p>
    <details class="small muted" style="margin-top:10px">
        <summary>Getting a more natural voice</summary>
        <ul style="margin:8px 0 0;padding-left:18px;line-height:1.6">
            <li><b>iPhone / iPad:</b> Settings → Accessibility → Spoken Content → Voices → English → download <b>Ava (Premium)</b> or <b>Zoe (Premium)</b>. Then pick it here.</li>
            <li><b>Mac:</b> System Settings → Accessibility → Spoken Content → System voice → Manage Voices → add <b>Ava (Premium)</b>.</li>
            <li><b>Windows:</b> the Microsoft Edge browser includes very natural voices (Ava, Jenny, Aria). Open JoyNot in Edge.</li>
            <li><b>Android:</b> Settings → search "Text-to-speech" → Speech Services by Google → install voice data → English (US) → choose a female voice.</li>
        </ul>
    </details>
</section>

<div style="max-width:860px;margin-top:16px">@include('partials.donate')</div>
@endsection

@push('scripts')
<script type="module">
import { sortedVoices, onVoices, getPref, setPref, tune } from '/js/joynot-voice.js';
const sel = document.getElementById('voiceSel');
const rate = document.getElementById('voiceRate');
const msg = document.getElementById('voiceMsg');
const pref = getPref();
if (pref.rate) rate.value = String(pref.rate);

function fill() {
    const list = sortedVoices();
    const keep = getPref().name || '';
    sel.length = 1;
    list.forEach((v, i) => {
        const o = document.createElement('option');
        o.value = v.name;
        o.textContent = v.name.replace(/^Microsoft /, '').replace(/ Online \(Natural\)/, ' (natural)') + ' · ' + v.lang + (v.localService === false ? ' · online' : '') + (i === 0 ? '  ★ best' : '');
        sel.appendChild(o);
    });
    sel.value = list.some(v => v.name === keep) ? keep : '';
    msg.textContent = list.length ? '' : 'No read-aloud voices found on this device yet. Try again in a moment, or check the tips below.';
}
onVoices(fill);
setTimeout(fill, 600);

function save() {
    setPref({ name: sel.value || null, rate: Number(rate.value) || 1 });
    msg.textContent = '✓ Saved for this device.';
}
sel.addEventListener('change', () => { save(); speak(); });
rate.addEventListener('change', () => { save(); speak(); });

function speak() {
    if (!('speechSynthesis' in window)) { msg.textContent = 'This browser cannot read aloud.'; return; }
    try { speechSynthesis.cancel(); } catch (e) {}
    const u = tune(new SpeechSynthesisUtterance("Hi there! I'm so glad you're here. Let's learn something fun together!"));
    speechSynthesis.speak(u);
}
document.getElementById('voiceTry').addEventListener('click', speak);
</script>
@endpush

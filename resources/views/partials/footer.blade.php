{{-- Site footer: legal links. Shown on public pages and in the Grown-ups area (layouts/app decides). --}}
<footer class="foot">
    <nav class="foot-links" aria-label="Legal">
        <a href="{{ route('legal.terms') }}">Terms</a>
        <a href="{{ route('legal.privacy') }}">Privacy</a>
        <a href="{{ route('legal.cookies') }}">Cookies</a>
        <a href="{{ route('legal.donations') }}">Donations &amp; Refunds</a>
        <a href="{{ route('legal.contact') }}">Contact</a>
    </nav>
    <div>© {{ date('Y') }} JoyNot · {{ config('joynot.legal.company') }}</div>
</footer>

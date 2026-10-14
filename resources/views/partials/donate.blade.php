{{--
    💚 "Support JoyNot" (one-time Stripe Payment Link) — Grown-ups area and the public home page only, never on kid screens.
    Set JOYNOT_DONATE_URL in .env. Styles: 'ribbon' (Grown-ups bar), 'card', 'link'.
--}}
@php
    $donateUrl = config('joynot.donate_url');
    $style = $style ?? 'card';
    $ribbon = '<svg class="ribbon-ic" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 2.2c-2.6 0-4.4 2-4.4 4.6 0 2 1 3.9 2.3 5.8L5.2 19.4l2.9.4 1.2 2.7 2.7-4.3 2.7 4.3 1.2-2.7 2.9-.4-4.7-6.8c1.3-1.9 2.3-3.8 2.3-5.8 0-2.6-1.8-4.6-4.4-4.6Zm0 2.4c1.2 0 2 .9 2 2.3 0 1.1-.7 2.5-2 4.3-1.3-1.8-2-3.2-2-4.3 0-1.4.8-2.3 2-2.3Z"/></svg>';
@endphp

@if ($style === 'ribbon')
    <span class="donate-wrap">
        @if ($donateUrl)
            <a class="donate-btn" href="{{ $donateUrl }}" target="_blank" rel="noopener">{!! $ribbon !!}<span>Support JoyNot</span></a>
        @else
            <button type="button" class="donate-btn" data-donate-open>{!! $ribbon !!}<span>Support JoyNot</span></button>
        @endif
        <button type="button" class="donate-why" data-donate-open aria-label="Why support JoyNot?" title="Why support JoyNot?">?</button>
    </span>
    @once
        <div class="donate-pop" id="donatePop" role="dialog" aria-modal="true" aria-labelledby="donatePopTitle" hidden>
            <div class="donate-pop-card">
                <button type="button" class="donate-x" data-donate-close aria-label="Close">✕</button>
                <div class="donate-pop-ic">{!! $ribbon !!}</div>
                <h2 id="donatePopTitle">Learning should be free.</h2>
                <p>Every game on JoyNot is free for every family, with no ads and no paywalls, and we never sell your data. That isn't going to change.</p>
                <p>Running it does cost money, though. Servers, security updates and new games all have a monthly bill.</p>
                <p>If you're able to chip in, any amount helps keep JoyNot free for every child. If not, <b>no worries at all</b>. We're just glad your kids are learning with us. Enjoy the games! 💚</p>
                <div class="donate-pop-actions">
                    @if ($donateUrl)
                        <a class="donate-btn big" href="{{ $donateUrl }}" target="_blank" rel="noopener">{!! $ribbon !!}<span>Support JoyNot</span></a>
                    @else
                        <span class="donate-btn big off" aria-disabled="true">{!! $ribbon !!}<span>Donations open soon</span></span>
                    @endif
                    <button type="button" class="pill-link" data-donate-close>Maybe later</button>
                </div>
                <p class="small muted" style="margin:12px 0 0">A one-time gift of any amount, handled securely by Stripe. JoyNot never sees your card. Gifts go to {{ config('joynot.legal.company') }} and are not tax-deductible. <a href="{{ route('legal.donations') }}">Donations &amp; Refunds</a></p>
            </div>
        </div>
        @push('scripts')
        <script>
        (function () {
            var pop = document.getElementById('donatePop');
            if (!pop) return;
            var last = null;
            function open(e) { if (e) e.preventDefault(); last = document.activeElement; pop.hidden = false; document.body.classList.add('donate-lock'); var b = pop.querySelector('.donate-x'); b && b.focus(); }
            function close() { pop.hidden = true; document.body.classList.remove('donate-lock'); last && last.focus && last.focus(); }
            document.querySelectorAll('[data-donate-open]').forEach(function (b) { b.addEventListener('click', open); });
            pop.querySelectorAll('[data-donate-close]').forEach(function (b) { b.addEventListener('click', close); });
            pop.addEventListener('click', function (e) { if (e.target === pop) close(); });
            document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) close(); });
        })();
        </script>
        @endpush
    @endonce
@elseif ($donateUrl && $style === 'card')
    <section class="card donate-card">
        <div class="donate-ic" aria-hidden="true">{!! $ribbon !!}</div>
        <div class="grow">
            <h3>Keep JoyNot free for every family</h3>
            <p class="small muted">No ads, no paid plans. A one-time gift of any amount helps cover hosting, upkeep and new games. If now isn't the time, that's okay too. Gifts are not tax-deductible. <a href="{{ route('legal.donations') }}">Details</a></p>
        </div>
        <a class="donate-btn" href="{{ $donateUrl }}" target="_blank" rel="noopener">{!! $ribbon !!}<span>Support JoyNot</span></a>
    </section>
@elseif ($donateUrl)
    <a class="donate-btn sm" href="{{ $donateUrl }}" target="_blank" rel="noopener">{!! $ribbon !!}<span>Support JoyNot</span></a>
@endif

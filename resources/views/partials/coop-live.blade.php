{{-- "Mia is playing Clock Dash · Join" cards. Shown on every Grown-ups page while a kid is playing a game grown-ups can join. --}}
<div id="coopLive" class="coop-live" data-url="{{ route('coop.live') }}" hidden></div>
<style>
    .coop-live { display: grid; gap: 10px; margin: 10px 0 14px; }
    .coop-live .cl-card { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 12px 14px; border-radius: 16px; background: #fff7d6; border: 3px solid #f5b301; box-shadow: 0 4px 0 rgba(0,0,0,.06); }
    .coop-live .cl-av { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; font-size: 26px; background: var(--c, #ffd34d); flex: none; }
    .coop-live .cl-txt { flex: 1 1 180px; min-width: 0; }
    .coop-live .cl-txt b { font-size: 17px; }
    .coop-live .cl-txt small { display: block; opacity: .75; }
    .coop-live .cl-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #2fae66; margin-right: 6px; animation: clPulse 1.2s infinite; }
    .coop-live .cl-join { padding: 12px 18px; border-radius: 14px; background: #2fae66; color: #fff; font-weight: 700; text-decoration: none; white-space: nowrap; }
    @keyframes clPulse { 50% { opacity: .3; } }
</style>
<script>
(() => {
    const box = document.getElementById('coopLive'); if (!box) return;
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    async function check() {
        try {
            const r = await fetch(box.dataset.url, { headers: { Accept: 'application/json' }, credentials: 'same-origin', cache: 'no-store' });
            if (!r.ok) return;
            const { live } = await r.json();
            box.hidden = !live.length;
            box.innerHTML = live.map(s => `
                <div class="cl-card">
                    <span class="cl-av" style="--c:${esc(s.kid.color)}">${esc(s.kid.avatar)}</span>
                    <div class="cl-txt"><b><span class="cl-dot"></span>${esc(s.kid.name)} is playing ${esc(s.game)}</b>
                        <small>${s.world ? '📍 ' + esc(s.world) + ' · ' : ''}${s.members ? '👨‍👩‍👧 ' + s.members + ' grown-up' + (s.members > 1 ? 's' : '') + ' helping' : 'Play along from this phone!'}</small></div>
                    <a class="cl-join" href="${esc(s.join)}">${s.key === 'bee-smart' ? '🐝 Join as Guard Bee' : '👋 Join'}</a>
                </div>`).join('');
        } catch (e) {}
    }
    check(); setInterval(() => { if (!document.hidden) check(); }, 5000);
})();
</script>

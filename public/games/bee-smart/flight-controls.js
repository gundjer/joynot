export function flightControls(api, change) {
  const root = document.createElement('aside'); root.id = 'buzz-flight'; root.className = 'hidden';
  root.innerHTML = `<div class="buzz-toolbar"><span class="buzz-brand"><img src="/icons/logo.svg" width="30" height="30" alt="JoyNot"></span><button type="button" data-toggle="view" aria-pressed="false">Bee eyes</button><button type="button" data-toggle="uv" aria-pressed="true">UV guides</button><button type="button" data-toggle="compound" aria-pressed="false">Compound eyes</button></div><div class="buzz-stats"><span class="buzz-time"></span><span class="buzz-stamina"></span><span class="buzz-load"></span></div><div class="buzz-controls" role="group" aria-label="Flight controls"><button type="button" data-hold="rise" aria-label="Fly higher (R)">↑<small>Rise · R</small></button><button type="button" data-hold="fall" aria-label="Fly lower (F)">↓<small>Lower · F</small></button><button type="button" data-hold="boost" aria-label="Buzz boost (Shift)">↗<small>Boost</small></button><button type="button" data-toggle="home" aria-label="Fly back to hive">⌂<small>Hive</small></button></div><p class="buzz-move">Drag on the left to fly · Tap a flower to land · R / F change height</p>`;
  document.body.appendChild(root); const held = new Set();
  const clear = () => held.clear();
  root.querySelectorAll('[data-hold]').forEach(button => {
    button.onpointerdown = e => { e.preventDefault(); held.add(button.dataset.hold); button.setPointerCapture(e.pointerId); };
    button.onpointerup = button.onpointercancel = button.onlostpointercapture = () => held.delete(button.dataset.hold);
  });
  root.querySelectorAll('[data-toggle]').forEach(button => { button.onclick = () => change(button.dataset.toggle); });
  const key = e => ({ r:'rise',R:'rise',f:'fall',F:'fall',Shift:'boost' }[e.key]);
  document.addEventListener('keydown', e => { if (!root.classList.contains('hidden') && !api.paused && key(e) && !/INPUT|TEXTAREA/.test(e.target.tagName)) { e.preventDefault(); held.add(key(e)); } });
  document.addEventListener('keyup', e => { if (key(e)) held.delete(key(e)); });
  window.addEventListener('blur', clear);
  return {
    held: name => held.has(name),
    hide() { root.classList.add('hidden'); clear(); },
    sync(S, top, backend) {
      const visible = S && S.mode === 'field' && !S.guide && !S.chatOpen && !api.paused;
      root.classList.toggle('hidden', !visible); if (!visible) { clear(); return; }
      root.querySelector('.buzz-toolbar').style.top = `${top + 6}px`;
      const f = S.flight, seconds = Math.ceil(f.seconds);
      root.querySelector('.buzz-time').textContent = `Flight ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2,'0')}`;
      root.querySelector('.buzz-stamina').textContent = `Energy ${Math.ceil(f.stamina)}%`;
      root.querySelector('.buzz-load').textContent = `Nectar ${S.nectar || 0} · Pollen ${Math.max(0,S.pollen-S.stolen)}`;
      root.querySelector('.buzz-stats').classList.toggle('low', f.warned);
      for (const name of ['uv','compound']) root.querySelector(`[data-toggle="${name}"]`).setAttribute('aria-pressed',String(!!S.vision[name]));
      root.querySelector('[data-toggle="view"]').textContent = S.vision.firstPerson ? 'Follow view' : 'Bee eyes';
      root.querySelector('[data-toggle="view"]').setAttribute('aria-pressed',String(!!S.vision.firstPerson));
      for (const name of ['rise','fall']) root.querySelector(`[data-hold="${name}"]`).disabled = backend !== 'webgl';
      root.querySelector('[data-toggle="view"]').disabled = backend !== 'webgl';
    },
  };
}

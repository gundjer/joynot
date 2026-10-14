// Drag and drop that works the same with a finger (iPhone, iPad, Android), a mouse, a pen, or the keyboard.
// Kids can also TAP an item and then TAP where it goes — easier for little hands.
//
//   const dd = new DragDrop({ onDrop(item, target) { ... } });
//   dd.item(el); dd.target(el);
//   dd.destroy();

export class DragDrop {
  constructor({ onDrop, onPick, sfx } = {}) {
    this.onDrop = onDrop || (() => {});
    this.onPick = onPick || (() => {});
    this.sfx = sfx;
    this.items = new Set();
    this.targets = new Set();
    this.selected = null;
    this.disabled = false;
    this.cleanups = [];
    this.drag = null;
  }

  item(el) {
    this.items.add(el);
    el.classList.add('dd-item');
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    const down = e => {
      if (this.disabled || el.classList.contains('dd-locked')) return;
      if (e.button !== undefined && e.button > 0) return;
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      this.drag = { el, id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, ghost: null, over: null };
    };
    const move = e => {
      const d = this.drag; if (!d || d.el !== el || d.id !== e.pointerId) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (!d.moved && dx * dx + dy * dy > 64) this._lift(d, e);
      if (d.moved) { e.preventDefault(); this._moveGhost(d, e.clientX, e.clientY); }
    };
    const up = e => {
      const d = this.drag; if (!d || d.el !== el || d.id !== e.pointerId) return;
      this.drag = null;
      if (d.moved) {
        const t = d.over;
        this._clearOver();
        d.ghost && d.ghost.remove();
        el.classList.remove('dd-lifted');
        if (t) { this._select(null); this.onDrop(el, t); }
      } else {
        this._tapped = el; setTimeout(() => { if (this._tapped === el) this._tapped = null; }, 0);
        this._select(this.selected === el ? null : el);
      }
    };
    const cancel = () => {
      const d = this.drag; if (!d || d.el !== el) return;
      this.drag = null; this._clearOver(); d.ghost && d.ghost.remove(); el.classList.remove('dd-lifted');
    };
    const key = e => {
      if (this.disabled) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._select(this.selected === el ? null : el); }
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', cancel);
    el.addEventListener('lostpointercapture', cancel);
    el.addEventListener('keydown', key);
    el.addEventListener('contextmenu', e => e.preventDefault());
    this.cleanups.push(() => {
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', cancel);
      el.removeEventListener('lostpointercapture', cancel); el.removeEventListener('keydown', key);
    });
    return el;
  }

  target(el) {
    this.targets.add(el);
    el.classList.add('dd-target');
    el.dataset.ddTarget = '1';
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    const click = e => {
      if (this.disabled || !this.selected) return;
      if (this._tapped && el.contains(this._tapped)) return; // tapped an item sitting inside this target
      const it = this.selected; this._select(null); this.onDrop(it, el);
    };
    const key = e => { if ((e.key === 'Enter' || e.key === ' ') && this.selected && e.target === el) { e.preventDefault(); click(e); } };
    el.addEventListener('click', click);
    el.addEventListener('keydown', key);
    this.cleanups.push(() => { el.removeEventListener('click', click); el.removeEventListener('keydown', key); });
    return el;
  }

  removeItem(el) { this.items.delete(el); if (this.selected === el) this._select(null); }

  _select(el) {
    if (this.selected) this.selected.classList.remove('dd-selected');
    this.selected = el;
    this.targets.forEach(t => t.classList.toggle('dd-ready', !!el));
    if (el) { el.classList.add('dd-selected'); this.sfx && this.sfx.click(); this.onPick(el); }
  }

  _lift(d, e) {
    d.moved = true;
    const r = d.el.getBoundingClientRect();
    const g = d.el.cloneNode(true);
    g.classList.add('dd-ghost'); g.classList.remove('dd-selected');
    g.removeAttribute('id');
    Object.assign(g.style, { width: r.width + 'px', height: r.height + 'px', left: r.left + 'px', top: r.top + 'px' });
    d.offX = e.clientX - r.left; d.offY = e.clientY - r.top;
    document.body.appendChild(g);
    d.ghost = g;
    d.el.classList.add('dd-lifted');
    this._select(null);
    this.targets.forEach(t => t.classList.add('dd-ready'));
    this.sfx && this.sfx.pop();
  }

  _moveGhost(d, x, y) {
    d.ghost.style.left = (x - d.offX) + 'px';
    d.ghost.style.top = (y - d.offY) + 'px';
    const under = document.elementFromPoint(x, y);
    const t = under && under.closest('[data-dd-target]');
    const hit = t && this.targets.has(t) ? t : null;
    if (hit !== d.over) {
      d.over && d.over.classList.remove('dd-over');
      d.over = hit;
      hit && hit.classList.add('dd-over');
    }
  }

  _clearOver() {
    this.targets.forEach(t => t.classList.remove('dd-over', 'dd-ready'));
  }

  destroy() {
    this.cleanups.forEach(f => f()); this.cleanups = [];
    document.querySelectorAll('.dd-ghost').forEach(g => g.remove());
    this.items.clear(); this.targets.clear(); this.selected = null; this.drag = null;
  }
}

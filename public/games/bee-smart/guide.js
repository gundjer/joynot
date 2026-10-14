// Bee Smart Field Guide: collect cards for flowers, critters and hive facts, and pick a hat for your bee.
import { emoji, roundRect } from '../_play/play.js';
import { FLOWERS, CRITTERS, HIVE_FACTS, ROOMS } from './facts.js';
import { drawHornet } from './worlds.js';
import { wrap } from './challenge.js';

const INK = '#2b2350';
const font = (px, w = 700) => `${w} ${Math.round(px)}px Fredoka, Andika, system-ui, sans-serif`;
const TABS = [['flowers', '🌼 Flowers'], ['critters', '🐞 Critters'], ['facts', '🍯 Hive'], ['hats', '🎩 Hats']];

/** o: { bee (extra.bee), onClose(), save() } */
export function makeGuide(api, o) {
  const B = o.bee, G = { tab: 'flowers', hits: [], sel: null };
  B.cards = B.cards || { flowers: {}, critters: {}, facts: {} };
  const list = () => {
    if (G.tab === 'flowers') return Object.entries(FLOWERS).map(([e, [n, f]]) => ({ e, n, f, got: !!B.cards.flowers[e] }));
    if (G.tab === 'critters') return Object.entries(CRITTERS).map(([k, [e, n, f]]) => ({ e, n, f, got: !!B.cards.critters[k] }));
    if (G.tab === 'facts') return HIVE_FACTS.map(([n, f], i) => ({ e: n.split(' ')[0], n: n.split(' ').slice(1).join(' '), f, got: !!B.cards.facts[i] }));
    return [{ e: '🚫', n: 'No hat', f: 'Just your fuzzy head!', got: true, hat: '' }].concat(ROOMS.map(r => ({ e: r.hat, n: r.name, f: `Unlocked by building the ${r.name}.`, got: (B.hats || []).includes(r.hat), hat: r.hat })));
  };
  function draw(ctx, W, H, top) {
    G.hits = [];
    ctx.fillStyle = 'rgba(30,20,0,.5)'; ctx.fillRect(0, 0, W, H);
    const pw = Math.min(W - 12, 760), px = (W - pw) / 2, py = top + 4, ph = H - py - 6;
    ctx.fillStyle = '#fffdf3'; roundRect(ctx, px, py, pw, ph, 18); ctx.fill(); ctx.strokeStyle = '#f5b301'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = INK; ctx.font = font(22); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('📖 Field Guide', px + 16, py + 12);
    const close = { x: px + pw - 52, y: py + 8, w: 44, h: 40 }; ctx.fillStyle = '#ffe0dc'; roundRect(ctx, close.x, close.y, close.w, close.h, 10); ctx.fill(); ctx.fillStyle = INK; ctx.font = font(20); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✖', close.x + 22, close.y + 21);
    G.hits.push({ r: close, fn: o.onClose });
    const tw = (pw - 20) / 4;
    TABS.forEach(([k, label], i) => {
      const r = { x: px + 10 + i * tw, y: py + 56, w: tw - 6, h: 38 };
      ctx.fillStyle = G.tab === k ? '#ffd34d' : '#f3eedf'; roundRect(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
      ctx.fillStyle = INK; ctx.font = font(Math.min(16, tw / 7)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 1);
      G.hits.push({ r, fn: () => { G.tab = k; G.sel = null; } });
    });
    const items = list(), got = items.filter(x => x.got).length;
    ctx.fillStyle = '#9a6d00'; ctx.font = font(14, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(G.tab === 'hats' ? `Wearing: ${B.hat || 'no hat'}` : `${got} of ${items.length} found`, px + pw / 2, py + 100);
    const gy = py + 122, foot = G.sel ? 80 : 10, cols = pw > 560 ? 5 : 3, cw = (pw - 20) / cols, rows = Math.ceil(items.length / cols), ch = Math.min(96, (ph - (gy - py) - foot - 10) / rows);
    items.forEach((it, i) => {
      const r = { x: px + 10 + (i % cols) * cw, y: gy + Math.floor(i / cols) * ch, w: cw - 6, h: ch - 6 };
      ctx.fillStyle = it.got ? (G.tab === 'hats' && B.hat === it.hat ? '#ffd34d' : '#fff3c4') : '#efebe2'; roundRect(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
      if (!it.got) emoji(ctx, '🔒', r.x + r.w / 2, r.y + r.h * 0.4, Math.min(30, r.h * 0.4));
      else if (it.e === '#hornet') drawHornet(ctx, r.x + r.w / 2, r.y + r.h * 0.4, Math.min(50, r.h * 0.6));
      else emoji(ctx, it.e, r.x + r.w / 2, r.y + r.h * 0.4, Math.min(34, r.h * 0.42));
      ctx.fillStyle = INK; ctx.font = font(Math.min(13, cw / 9)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(it.got ? it.n : '???', r.x + r.w / 2, r.y + r.h * 0.8);
      G.hits.push({ r, fn: () => { if (!it.got) { api.speak('Keep exploring to find this one!'); return; } G.sel = it; api.speak(`${it.n}. ${it.f}`); if (G.tab === 'hats') { B.hat = it.hat; o.save(); } } });
    });
    if (G.sel) {
      ctx.fillStyle = '#2b2350'; const r = { x: px + 14, y: py + ph - 76, w: pw - 28, h: 66 }; roundRect(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = font(15, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      wrap(ctx, `${G.sel.n}: ${G.sel.f}`, r.w - 20).slice(0, 3).forEach((l, i) => ctx.fillText(l, r.x + r.w / 2, r.y + 8 + i * 19));
    }
  }
  return {
    draw,
    tap(x, y) { for (let i = G.hits.length - 1; i >= 0; i--) { const r = G.hits[i].r; if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { G.hits[i].fn(); return; } } },
  };
}

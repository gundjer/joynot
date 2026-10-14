// The adaptive brain. Picks the next word/problem and moves the level up or down.
//  - Level UP:   5 of the last 6 answered right on the first try with no help (mastery)
//  - Quiet support: 2 misses in a row → the next questions quietly come from an easier level.
//    3 right in a row steps back up. The kid's level never goes down and nothing says "easier".
//  - 20% review of easier levels (builds confidence), plus re-practice of missed items
import { readingItem, readingItemByKey, READING_LEVELS } from './curriculum-reading.js';
import { mathItem, MATH_LEVELS } from './curriculum-math.js';

export class Tutor {
  constructor(store) { this.store = store; }

  maxLevel(track) { return track === 'reading' ? READING_LEVELS.length : MATH_LEVELS.length; }
  levelInfo(track, level) { const L = (track === 'reading' ? READING_LEVELS : MATH_LEVELS)[level - 1]; return L ? { name: L.name, grade: L.grade } : { name: '', grade: '' }; }

  pick(track) {
    const st = this.store.data[track];
    st.level = Math.max(1, Math.min(this.maxLevel(track), st.level | 0 || 1));
    const recent = st.recent || [];
    let item = null;

    const missedKeys = Object.keys(st.missed || {});
    if (missedKeys.length && Math.random() < 0.2) {
      const k = missedKeys[Math.floor(Math.random() * missedKeys.length)];
      const m = st.missed[k];
      if (!recent.includes(k)) {
        item = track === 'reading' ? readingItemByKey(m.level, k) : (m.item ? { ...m.item } : null);
        if (item) item.review = true;
      }
    }
    if (!item) {
      const sup = Math.max(0, st.sup | 0), base = Math.max(1, st.level - sup);
      let level = base, review = false;
      if (base > 1 && Math.random() < 0.2) { level = Math.max(1, base - 1 - (Math.random() < 0.3 ? 1 : 0)); review = true; }
      item = track === 'reading' ? readingItem(level, recent) : mathItem(level, recent);
      item.review = review;
    }
    st.recent = [...recent, item.key].slice(-15);
    return item;
  }

  // result: {correct, firstTry, helped}
  record(item, result) {
    const d = this.store.data, st = d[item.track];
    const clean = result.correct && result.firstTry && !result.helped;
    const s = d.stats;
    if (item.track === 'reading') clean ? s.readRight++ : s.readWrong++; else clean ? s.mathRight++ : s.mathWrong++;

    // missed list for re-practice
    st.missed = st.missed || {};
    if (!clean) {
      st.missed[item.key] = { level: item.level, n: ((st.missed[item.key] || {}).n || 0) + 1, item: item.track === 'math' ? strip(item) : undefined };
      const keys = Object.keys(st.missed); if (keys.length > 30) delete st.missed[keys[0]];
    } else if (st.missed[item.key]) {
      delete st.missed[item.key];
    }

    let change = 0;
    st.sup = Math.max(0, st.sup | 0);
    if (!item.review && !item.exit && item.level < st.level && st.sup > 0) {
      // quiet support: easier questions until 3 in a row are right, then step back up
      st.supHist = [...(st.supHist || []), clean ? 1 : 0].slice(-3);
      const sh = st.supHist;
      if (sh.length === 3 && sh.every(Boolean)) { st.sup--; st.supHist = []; }
      else if (sh.length >= 2 && !sh[sh.length - 1] && !sh[sh.length - 2] && item.level > 1) { st.sup++; st.supHist = []; }
    } else if (!item.review && item.level === st.level && !item.exit) {
      st.history = [...(st.history || []), clean ? 1 : 0].slice(-6);
      const h = st.history, good = h.reduce((a, b) => a + b, 0);
      if (h.length >= 6 && good >= 5 && st.level < this.maxLevel(item.track)) { st.level++; st.history = []; st.sup = 0; change = 1; }
      else if (h.length >= 2 && h[h.length - 1] === 0 && h[h.length - 2] === 0 && st.level > 1) { st.sup = 1; st.supHist = []; st.history = []; } // never visibly down
    }
    this.store.save();
    return { change, level: st.level };
  }
}

function strip(it) { const o = { ...it }; delete o.review; return o; }

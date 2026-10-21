export const PRIZES = [
  { id: 'battery', price: 6, name: 'Spare flashlight battery', description: 'One full recharge. Use it during a night when your light is low.', icon: '🔋' },
  { id: 'lens', price: 20, name: 'Efficient flashlight', description: 'A permanent upgrade: your flashlight battery lasts about 50% longer.', icon: '🔦' },
  { id: 'chrome', price: 12, name: 'Chrome workshop finish', description: 'Give the real metal joints in your next robot a polished silver finish.', icon: '⚙️' },
];
export function purchase(data, id) {
  const prize = PRIZES.find(p => p.id === id);
  if (!prize) return false;
  data.supplies ||= { batteries: 0, lens: false, chrome: false };
  if ((data.tokens || 0) < prize.price || (id !== 'battery' && data.supplies[id])) return false;
  if (id === 'battery' && data.supplies.batteries >= 5) return false;
  data.tokens -= prize.price;
  if (id === 'battery') data.supplies.batteries++;
  else data.supplies[id] = true;
  return true;
}
export function useBattery(data, game) {
  if (!game || game.battery >= 95 || !(data.supplies?.batteries > 0)) return false;
  data.supplies.batteries--; game.battery = 100; game.lightOn = true;
  return true;
}
export function mountPrizeCounter(store, changed, toast) {
  const sheet = document.createElement('dialog'); sheet.id = 'rustyPrizes';
  sheet.innerHTML = `<form method="dialog"><button class="prize-close" aria-label="Close prize counter">✕</button></form><small>RUSTY'S PIZZA • PRIZE COUNTER</small><h2>Make your coins count.</h2><p>Find gold coins in the pizza shop. Choose supplies for your next adventure.</p><strong data-balance></strong><div data-goods></div><p data-result role="status"></p>`;
  const style = document.createElement('style'); style.textContent = `#rustyPrizes{box-sizing:border-box;width:min(620px,94vw);max-height:90vh;border:1px solid #c2a77b;border-radius:20px;background:#132535;color:#f4e8ce;padding:28px;font-family:Andika,system-ui;overflow:auto}#rustyPrizes::backdrop{background:#060d18d9}#rustyPrizes h2{font:700 32px Fredoka,system-ui;margin:12px 0}#rustyPrizes small{letter-spacing:2px;color:#e9bd70}#rustyPrizes p{line-height:1.6;color:#ccdacd}#rustyPrizes article{display:grid;grid-template-columns:1fr auto;gap:10px;padding:18px 0;border-bottom:1px solid #40515b}#rustyPrizes article p{margin:6px 0;font-size:14px}#rustyPrizes button{padding:12px 16px;background:#efc77b;color:#172b36;border:0;border-radius:10px;font-weight:800;font-size:15px}#rustyPrizes button:disabled{opacity:.45}#rustyPrizes .prize-close{float:right;background:#284253;color:#fff}#rustyPrizes [data-balance]{display:block;color:#ffdc8e;font-size:23px}`;
  document.head.appendChild(style); document.body.appendChild(sheet);
  function render() {
    const data = store.data, supplies = data.supplies || {};
    sheet.querySelector('[data-balance]').textContent = `🪙 ${data.tokens || 0} coins · 🔋 ${supplies.batteries || 0} spares`;
    const goods = sheet.querySelector('[data-goods]'); goods.replaceChildren();
    for (const prize of PRIZES) {
      const article = document.createElement('article'), detail = document.createElement('div'), name = document.createElement('b'), text = document.createElement('p'), button = document.createElement('button');
      name.textContent = `${prize.icon} ${prize.name}`; text.textContent = prize.description; detail.append(name, text);
      const owned = prize.id !== 'battery' && supplies[prize.id], full = prize.id === 'battery' && supplies.batteries >= 5;
      button.textContent = owned ? 'Owned ✓' : full ? 'Bag full' : `${prize.price} coins`;
      button.disabled = !!owned || full || (data.tokens || 0) < prize.price;
      button.onclick = () => { if (purchase(data, prize.id)) { store.save(); changed(); render(); sheet.querySelector('[data-result]').textContent = `${prize.name} is ready!`; toast('Prize purchased!'); } };
      article.append(detail, button); goods.appendChild(article);
    }
  }
  sheet.addEventListener('click', e => { if (e.target === sheet) sheet.close(); });
  return { open() { render(); sheet.showModal(); }, close() { sheet.close(); } };
}

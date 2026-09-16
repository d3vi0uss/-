const upgrades = [
  { name: 'STICKER SCRAPER', icon: '▱', text: '+$1 per hit', cost: 25, hit: 1 },
  { name: 'MOM\'S CREDIT CARD', icon: '▣', text: '+$4 per second', cost: 75, passive: 4 },
  { name: 'CASE HARDENER', icon: '⬡', text: '+$3 per hit', cost: 180, hit: 3 },
  { name: 'MARKET BOT', icon: '⌁', text: '+$12 per second', cost: 420, passive: 12 },
  { name: 'GOLDEN CROWBAR', icon: '⚒', text: '+$12 per hit', cost: 900, hit: 12 },
  { name: 'TRADE-UP FACTORY', icon: '⚙', text: '+$35 per second', cost: 2100, passive: 35 }
];

let state = JSON.parse(localStorage.getItem('case-crash-save')) || { cash: 0, hit: 1, passive: 0, cases: 0, combo: 0, owned: [] };
const $ = (id) => document.getElementById(id);
const format = (n) => `$${Math.floor(n).toLocaleString()}`;

function render() {
  $('balance').textContent = format(state.cash);
  $('perHit').textContent = format(state.hit);
  $('perSecond').textContent = format(state.passive);
  $('casesCrushed').textContent = state.cases.toLocaleString();
  $('upgradeCount').textContent = `${state.owned.length} / ${upgrades.length} OWNED`;
  const progress = state.cases % 25;
  $('caseProgress').style.width = `${progress * 4}%`;
  $('progressText').textContent = `${progress} / 25 hits`;
  const multiplier = 1 + Math.min(state.combo, 20) / 20;
  $('combo').textContent = `x${multiplier.toFixed(1)}`;
  $('comboMeter').style.width = `${Math.min(state.combo, 20) * 5}%`;
  $('upgradeList').innerHTML = upgrades.map((item, index) => {
    const owned = state.owned.includes(index);
    return `<button class="upgrade ${owned ? 'owned' : ''}" data-upgrade="${index}" ${owned || state.cash < item.cost ? 'disabled' : ''}>
      <span class="upgrade-icon">${item.icon}</span><span><h3>${item.name}</h3><p>${item.text}</p></span>
      <span class="upgrade-cost">${owned ? 'OWNED' : format(item.cost)}${owned ? '<small>ACTIVE</small>' : ''}</span></button>`;
  }).join('');
  localStorage.setItem('case-crash-save', JSON.stringify(state));
}

function smash(event) {
  const gain = Math.ceil(state.hit * (1 + Math.min(state.combo, 20) / 20));
  state.cash += gain; state.cases += 1; state.combo = Math.min(state.combo + 1, 20);
  const button = $('caseButton'); button.classList.remove('crash'); void button.offsetWidth; button.classList.add('crash');
  const pop = document.createElement('span'); pop.className = 'money-pop'; pop.textContent = `+${format(gain)}`;
  const rect = $('floaters').getBoundingClientRect(); pop.style.left = `${event.clientX - rect.left - 25}px`; pop.style.top = `${event.clientY - rect.top - 28}px`;
  $('floaters').append(pop); setTimeout(() => pop.remove(), 800); render();
}

$('caseButton').addEventListener('click', smash);
$('upgradeList').addEventListener('click', (event) => {
  const button = event.target.closest('[data-upgrade]'); if (!button || button.disabled) return;
  const index = Number(button.dataset.upgrade), item = upgrades[index];
  state.cash -= item.cost; state.hit += item.hit || 0; state.passive += item.passive || 0; state.owned.push(index); render();
});
let soundOn = true;
$('soundToggle').addEventListener('click', () => { soundOn = !soundOn; $('soundToggle').textContent = soundOn ? '♬' : '♩'; });
setInterval(() => { if (state.passive) { state.cash += state.passive; render(); } }, 1000);
setInterval(() => { if (state.combo) { state.combo = Math.max(0, state.combo - 1); render(); } }, 1400);
render();

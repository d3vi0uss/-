const upgrades = [
  { name: 'TAPE WRAP', icon: '▧', text: '+$1 per hit', cost: 20, hit: 1 }, { name: 'LOOSE CHANGE', icon: '◌', text: '+$2 per second', cost: 60, passive: 2 },
  { name: 'STEEL TOE', icon: '◒', text: '+$4 per hit', cost: 160, hit: 4 }, { name: 'FLIP TABLE', icon: '↯', text: '+$7 per second', cost: 375, passive: 7 },
  { name: 'BOLT CUTTERS', icon: '✂', text: '+$12 per hit', cost: 800, hit: 12 }, { name: 'SIDE HUSTLE', icon: '▦', text: '+$24 per second', cost: 1500, passive: 24 }
];
const openers = [
  { name: 'PRY BAR', icon: '╋', text: '+8 per hit', cost: 350, hit: 8 }, { name: 'BREACH HAMMER', icon: '⚒', text: '+28 per hit', cost: 1150, hit: 28 }, { name: 'HYDRAULIC RAM', icon: '⟐', text: '+85 per hit', cost: 4300, hit: 85 }
];
const cases = [
  { name: 'CARGO CACHE', desc: 'Break open the first shipment.', goal: 40, reward: 150, skin: 'cargo', badge: 'CARGO<br>CACHE' }, { name: 'NEON VAULT', desc: 'A volatile crate from the night run.', goal: 120, reward: 750, skin: 'neon', badge: 'NEON<br>VAULT' }, { name: 'RUSTED RELIC', desc: 'Old stock with a serious payout.', goal: 350, reward: 3000, skin: 'rust', badge: 'RUSTED<br>RELIC' }, { name: 'OBSIDIAN DROP', desc: 'The final sealed shipment.', goal: 900, reward: 11000, skin: 'obsidian', badge: 'OBSIDIAN<br>DROP' }
];
const skills = [
  { name: 'QUICK HANDS', text: '+1 base hit', cost: 1, key: 'quick', row: 1 }, { name: 'HARD KNOCKS', text: '+10% hit power', cost: 2, key: 'hard', row: 2, req: 'quick' }, { name: 'SIDE POCKET', text: '+15% passive income', cost: 2, key: 'pocket', row: 2, req: 'quick' }, { name: 'BREACH EXPERT', text: '+25% hit power', cost: 4, key: 'breach', row: 3, req: 'hard' }, { name: 'COLD STORAGE', text: '+1.0 combo max', cost: 4, key: 'cold', row: 3, req: 'pocket' }
];
const blank = () => ({ cash: 0, totalCash: 0, hit: 1, passive: 0, cases: 0, caseTier: 0, caseBreaks: 0, combo: 0, bestCombo: 0, owned: [], openers: [], activeOpener: null, coins: 0, skills: [] });
let state;
try { state = { ...blank(), ...JSON.parse(localStorage.getItem('case-crash-save')) }; } catch { state = blank(); }
const $ = (id) => document.getElementById(id);
const money = (n) => `$${Math.floor(n).toLocaleString()}`;
const hasSkill = (key) => state.skills.includes(key);
const hitMultiplier = () => (1 + (hasSkill('hard') ? .1 : 0) + (hasSkill('breach') ? .25 : 0));
const passiveMultiplier = () => 1 + (hasSkill('pocket') ? .15 : 0);
const baseHit = () => state.hit + (hasSkill('quick') ? 1 : 0) + (state.activeOpener === null ? 0 : openers[state.activeOpener].hit);
const activeCase = () => cases[Math.min(state.caseTier, cases.length - 1)];
const save = () => { localStorage.setItem('case-crash-save', JSON.stringify(state)); $('saveState').textContent = 'AUTO-SAVED'; };

function render() {
  const current = activeCase(), dealerOpen = state.totalCash >= 500;
  $('cash').textContent = money(state.cash); $('coins').textContent = state.coins; $('treeCoins').textContent = state.coins; $('totalCash').textContent = money(state.totalCash);
  $('casesBroken').textContent = state.cases.toLocaleString(); $('bestStreak').textContent = `x${(1 + state.bestCombo / 10).toFixed(1)}`; $('perSecond').textContent = money(state.passive * passiveMultiplier());
  $('caseName').innerHTML = current.name.replace(' ', '<br />'); $('caseDescription').textContent = current.desc; $('caseReward').textContent = money(current.reward); $('caseProgressText').textContent = `${state.caseBreaks} / ${current.goal} BREAKS`;
  $('caseProgress').style.width = `${Math.min(100, state.caseBreaks / current.goal * 100)}%`; $('caseTier').textContent = `TIER ${Math.min(state.caseTier + 1, cases.length)} / ${cases.length}`;
  $('caseBadge').innerHTML = current.badge; $('caseButton').className = `case-button ${current.skin}`;
  $('openerName').textContent = state.activeOpener === null ? 'BARE HANDS' : openers[state.activeOpener].name; $('hitValue').textContent = `+${money(baseHit() * hitMultiplier())} / HIT`;
  const comboMax = hasSkill('cold') ? 30 : 20, multi = 1 + Math.min(state.combo, comboMax) / 10;
  $('combo').textContent = `x${multi.toFixed(1)}`; $('comboMeter').style.width = `${state.combo / comboMax * 100}%`; $('comboText').textContent = state.combo > 8 ? 'DON’T LET UP!' : 'KEEP THE PRESSURE ON';
  $('upgradeCount').textContent = `${state.owned.length} / ${upgrades.length}`;
  $('upgradeList').innerHTML = upgrades.map((item, index) => `<button class="upgrade ${state.owned.includes(index) ? 'owned' : ''}" data-upgrade="${index}" ${state.owned.includes(index) || state.cash < item.cost ? 'disabled' : ''}><i>${item.icon}</i><span><b>${item.name}</b><small>${item.text}</small></span><em>${state.owned.includes(index) ? 'OWNED' : money(item.cost)}</em></button>`).join('');
  $('shopPanel').classList.toggle('dealer-open', dealerOpen); $('shopPill').textContent = dealerOpen ? 'OPEN' : 'LOCKED'; $('shopIntro').textContent = dealerOpen ? 'Pick one opener to make it your active tool.' : `Dealer access arrives at ${money(500 - state.totalCash)} lifetime cash.`;
  $('shopList').innerHTML = openers.map((item, index) => { const owned = state.openers.includes(index), active = state.activeOpener === index; return `<button class="opener ${owned ? 'owned' : ''} ${active ? 'active' : ''}" data-opener="${index}" ${!dealerOpen || (!owned && state.cash < item.cost) ? 'disabled' : ''}><i>${item.icon}</i><span><b>${item.name}</b><small>${item.text}</small></span><em>${active ? 'EQUIPPED' : owned ? 'EQUIP' : money(item.cost)}</em></button>`; }).join('');
  $('shopProgress').style.width = `${Math.min(100, state.totalCash / 500 * 100)}%`; $('shopStatus').textContent = dealerOpen ? 'DEALER OPEN · PICK AN OPENER' : `DEALER LOCKED · ${money(500 - state.totalCash)} TO GO`;
  $('caseRoute').innerHTML = cases.map((item, index) => `<div class="route-item ${index < state.caseTier ? 'cleared' : ''} ${index === state.caseTier ? 'current' : ''}"><i>${index < state.caseTier ? '✓' : index + 1}</i><span><b>${item.name}</b><small>${index < state.caseTier ? 'SHIPMENT CLEARED' : `${item.goal} breaks · reward ${money(item.reward)}`}</small></span></div>`).join('');
  const availablePrestige = Math.floor(Math.sqrt(state.totalCash / 2500)); $('prestigeCoins').textContent = availablePrestige; $('prestigeButton').disabled = availablePrestige < 1; $('prestigeButton').textContent = availablePrestige ? `RESET RUN FOR ${availablePrestige} BLACKSITE COIN${availablePrestige > 1 ? 'S' : ''}` : 'REQUIRES $2,500 LIFETIME CASH';
  $('skillTree').innerHTML = skills.map(skill => { const owned = hasSkill(skill.key), prereq = !skill.req || hasSkill(skill.req), afford = state.coins >= skill.cost; return `<button class="skill skill-${skill.row} ${owned ? 'owned' : ''} ${prereq ? '' : 'blocked'}" data-skill="${skill.key}" ${owned || !prereq || !afford ? 'disabled' : ''}><i>${owned ? '✓' : skill.cost}</i><span><b>${skill.name}</b><small>${skill.text}</small></span></button>`; }).join('');
  save();
}
function smash(event) { const comboMax = hasSkill('cold') ? 30 : 20, gain = Math.ceil(baseHit() * hitMultiplier() * (1 + Math.min(state.combo, comboMax) / 10)); state.cash += gain; state.totalCash += gain; state.cases++; state.caseBreaks++; state.combo = Math.min(comboMax, state.combo + 1); state.bestCombo = Math.max(state.bestCombo, state.combo); const current = activeCase(); if (state.caseBreaks >= current.goal && state.caseTier < cases.length - 1) { state.cash += current.reward; state.totalCash += current.reward; state.caseTier++; state.caseBreaks = 0; }
  const button = $('caseButton'); button.classList.remove('crash'); void button.offsetWidth; button.classList.add('crash'); const pop = document.createElement('span'); pop.className = 'money-pop'; pop.textContent = `+${money(gain)}`; const rect = $('floaters').getBoundingClientRect(); pop.style.left = `${event.clientX - rect.left - 22}px`; pop.style.top = `${event.clientY - rect.top - 20}px`; $('floaters').append(pop); setTimeout(() => pop.remove(), 700); render(); }
$('caseButton').addEventListener('click', smash); $('breakCallout').addEventListener('click', () => $('caseButton').click());
$('upgradeList').addEventListener('click', e => { const button = e.target.closest('[data-upgrade]'); if (!button || button.disabled) return; const i = +button.dataset.upgrade, item = upgrades[i]; state.cash -= item.cost; state.hit += item.hit || 0; state.passive += item.passive || 0; state.owned.push(i); render(); });
$('shopList').addEventListener('click', e => { const button = e.target.closest('[data-opener]'); if (!button || button.disabled) return; const i = +button.dataset.opener, item = openers[i]; if (!state.openers.includes(i)) { state.cash -= item.cost; state.openers.push(i); } state.activeOpener = i; render(); });
$('skillTree').addEventListener('click', e => { const button = e.target.closest('[data-skill]'); if (!button || button.disabled) return; const skill = skills.find(x => x.key === button.dataset.skill); state.coins -= skill.cost; state.skills.push(skill.key); render(); });
$('prestigeButton').addEventListener('click', () => { const earn = Math.floor(Math.sqrt(state.totalCash / 2500)); if (!earn) return; const permanent = { coins: state.coins + earn, skills: state.skills }; state = { ...blank(), ...permanent }; render(); });
setInterval(() => { if (state.passive) { const gain = state.passive * passiveMultiplier(); state.cash += gain; state.totalCash += gain; render(); } }, 1000);
setInterval(() => { if (state.combo) { state.combo = Math.max(0, state.combo - 1); render(); } }, 1300);
render();

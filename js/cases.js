import { rarities } from './state.js';

const names = ['Neon Fang','Urban Ghost','Steel Ember','Arctic Glitch','Nova Pulse','Desert Prism'];
const wears = [
  { name: 'Factory New', max: 0.07 },
  { name: 'Minimal Wear', max: 0.15 },
  { name: 'Field-Tested', max: 0.38 },
  { name: 'Well-Worn', max: 0.45 },
  { name: 'Battle-Scarred', max: 1 },
];

export function openCase(state, rng, caseName='Sim Case', count=1) {
  const pulls = [];
  const weekendBoost = [0,6].includes(new Date().getDay()) ? 2 : 1;
  for (let i = 0; i < count; i++) {
    const pool = rarities.map(r => ({ ...r, weight: r.weight * state.player.luck * weekendBoost }));
    const rarity = rng.pickWeighted(pool);
    const fl = +rng.next().toFixed(4);
    const wear = wears.find(w => fl <= w.max)?.name || 'Battle-Scarred';
    const base = Math.round((10 + rng.int(1, 100)) * rarity.mult);
    const item = {
      id: crypto.randomUUID(),
      name: `${names[rng.int(0, names.length - 1)]} ${rng.int(1,99)}`,
      rarity: rarity.name,
      float: fl,
      pattern: rng.int(1,999),
      baseValue: base,
      marketMultiplier: state.player.marketMultiplier,
      wear,
      statTrak: rng.next() < 0.08,
      caseName,
      createdAt: Date.now(),
      oneOfOne: rarity.name === 'ExceedinglyRare' && rng.next() < 0.05,
    };
    pulls.push(item);
  }
  return pulls;
}

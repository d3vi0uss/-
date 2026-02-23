import { addMarketPoint } from './storage.js';

export async function tickEconomy(state, rng) {
  const drift = (rng.next() - 0.5) * 0.08;
  const spike = rng.next() < 0.06 ? (rng.next() - 0.4) * 0.35 : 0;
  const crash = rng.next() < 0.02 ? -0.5 : 0;
  const undercut = rng.next() < 0.1 ? -0.08 : 0;
  state.player.marketMultiplier = Math.max(0.3, +(state.player.marketMultiplier + drift + spike + crash + undercut).toFixed(3));
  await addMarketPoint({ t: Date.now(), m: state.player.marketMultiplier });
}

export function calcNetWorth(player) {
  const inv = player.inventory.reduce((a, i) => a + i.baseValue * player.marketMultiplier, 0);
  return Math.round(player.balance + player.bankBalance + inv);
}

export const navItems = [
  'Dashboard','Clicker','Cases','Casino','Inventory','Economy','Bank','Battles','Missions','Stats','Account','Admin'
];

export function makeDefaultPlayer(username) {
  return {
    username,
    avatar: '🎯',
    balance: 1000,
    bankBalance: 0,
    xp: 0,
    level: 1,
    rank: 'Silver I',
    clickPower: 1,
    autoClick: 0,
    critChance: 0.05,
    luck: 1,
    rebirths: 0,
    inventory: [],
    favorites: [],
    history: [],
    wins: {},
    losses: {},
    streak: 0,
    totalClicks: 0,
    totalCases: 0,
    totalGambles: 0,
    missions: [],
    achievements: [],
    battlePassXp: 0,
    premiumPass: false,
    marketMultiplier: 1,
    loan: null,
    stats: { rarestPull: null, mostValuable: null, pnl: 0 },
    settings: { dark: true, sound: true, seed: Date.now() },
    rngSeeds: { casino: 'casino-seed', cases: 'case-seed', economy: 'econ-seed' },
    admin: username === 'd3vi0us',
  };
}

export const rarities = [
  { name: 'Consumer', weight: 450, mult: 0.7 },
  { name: 'Industrial', weight: 300, mult: 1 },
  { name: 'MilSpec', weight: 150, mult: 2.2 },
  { name: 'Restricted', weight: 70, mult: 5 },
  { name: 'Classified', weight: 25, mult: 10 },
  { name: 'Covert', weight: 4, mult: 25 },
  { name: 'ExceedinglyRare', weight: 1, mult: 80 },
];

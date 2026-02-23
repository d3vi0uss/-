export class SeededRNG {
  constructor(seed = Date.now()) { this.seed = seed >>> 0; }
  next() {
    this.seed += 0x6d2b79f5;
    let t = this.seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(min, max) { return Math.floor(this.next() * (max - min + 1)) + min; }
  pickWeighted(entries) {
    const total = entries.reduce((a, b) => a + b.weight, 0);
    let roll = this.next() * total;
    for (const e of entries) {
      roll -= e.weight;
      if (roll <= 0) return e;
    }
    return entries[entries.length - 1];
  }
}

export function makeStreams(base) {
  return {
    casino: new SeededRNG(base ^ 0xabc123),
    cases: new SeededRNG(base ^ 0xdef456),
    economy: new SeededRNG(base ^ 0x789abc),
  };
}

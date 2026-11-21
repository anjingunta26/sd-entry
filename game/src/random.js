// Deterministic seeded PRNG (mulberry32). The same seed always yields the
// same sequence, so any scene is reproducible — handy for debugging and
// for sharing a specific puzzle via ?seed=NNN.
export function createRandom(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convenience helpers layered on top of the raw float generator.
export function makeHelpers(seed) {
  const rnd = createRandom(seed);
  return {
    next: rnd,
    range: (min, max) => min + rnd() * (max - min),
    int: (min, max) => min + Math.floor(rnd() * (max - min + 1)), // inclusive
    pick: (arr) => arr[Math.floor(rnd() * arr.length)],
  };
}

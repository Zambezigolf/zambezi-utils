/**
 * daily-pick.ts — deterministic daily-selection helpers.
 *
 * The "everyone plays the same thing today" pattern (Wordle / daily puzzle):
 * derive a key from the date, hash it with a fixed namespace, and every user
 * on every device gets the identical pick — no server round-trip needed.
 */

/** FNV-1a string hash — stable across JS engines. */
export function hashStr(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32 PRNG — deterministic across Node/V8 and Safari/JSC. */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** "2026-11-11" — the daily key. Override `date` for tests/other days. */
export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Pick one item per key+index — e.g. today's word index or tile layout.
 * Same inputs → same pick, everywhere, forever.
 *
 *   word = dailyPick(wordList, todayKey())
 */
export function dailyPick<T>(items: T[], key: string, index: number | string = 0): T {
  return items[hashStr(`${key}|${index}`) % items.length]
}

/**
 * Distribute a target total across N slots, biased around each slot's base
 * value — e.g. simulate a field of simulated results for the day.
 * Deterministic per `seed`, so the same daily field is reproduced everywhere.
 */
export function distributeTotal(bases: number[], targetTotal: number, seed: number): number[] {
  const rng = mulberry32(seed)
  const values = [...bases]
  let delta = targetTotal - bases.reduce((a, b) => a + b, 0)
  const indices = Array.from({ length: bases.length }, (_, i) => i)
  // Fisher-Yates with the seeded rng — sort(() => rng()-0.5) is NOT
  // deterministic across JS engines.
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  for (const i of indices) {
    if (delta === 0) break
    const adj = delta > 0 ? Math.min(delta, 1 + Math.floor(rng() * 3)) : Math.max(delta, -2)
    values[i] += adj
    delta -= adj
  }
  return values
}

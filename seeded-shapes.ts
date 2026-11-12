/**
 * seeded-shapes.ts — deterministic seeded polygons & distance tests.
 *
 * Zero dependencies, works in browser and Node. Deterministic across JS
 * engines (mulberry32 + FNV-1a), which `Math.random` and `Array.prototype.sort`
 * shuffles are NOT — Node/V8 and Safari/JSC produce different orders.
 *
 * Use it for procedural map features (ponds, lakes, tree clusters, rocks)
 * that must look identical for every player on every device.
 */

export interface V {
  x: number
  y: number
}

export interface Disc extends V {
  r: number
}

/** FNV-1a string hash — stable seed source from names like "region7|lake|2". */
export function hashStr(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32 PRNG — tiny, fast, deterministic across JS engines. */
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

/**
 * Expand a plain disc into an irregular blob polygon — the same center/radius
 * always yields the same shape for a given seed, so lakes and clearings look
 * organic instead of perfectly circular without storing vertex data.
 */
export function seededPoly(d: Disc, seed: number, verts = 14): V[] {
  const rng = mulberry32(seed)
  const pts: V[] = []
  for (let i = 0; i < verts; i++) {
    const a = (i / verts) * Math.PI * 2 + (rng() - 0.5) * 0.3
    const r = d.r * (0.78 + rng() * 0.45)
    pts.push({ x: d.x + Math.cos(a) * r, y: d.y + Math.sin(a) * r })
  }
  return pts
}

/** Signed distance from a point to a polygon edge — negative when inside. */
export function polyDist(x: number, y: number, poly: V[]): number {
  let d2 = Infinity
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]
    const b = poly[j]
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside
    }
    const ex = b.x - a.x
    const ey = b.y - a.y
    const t = Math.max(0, Math.min(1, ((x - a.x) * ex + (y - a.y) * ey) / (ex * ex + ey * ey)))
    const px = a.x + ex * t
    const py = a.y + ey * t
    const dd = (x - px) * (x - px) + (y - py) * (y - py)
    if (dd < d2) d2 = dd
  }
  return (inside ? -1 : 1) * Math.sqrt(d2)
}

/**
 * Seeded scatter of points inside a bounding box — e.g. trees around a
 * meadow. `keep` rejects unwanted placements (in water, on paths...).
 */
export function scatter(
  bounds: { x: number; y: number; w: number; h: number },
  count: number,
  seed: number,
  keep: (p: V) => boolean = () => true
): V[] {
  const rng = mulberry32(seed)
  const out: V[] = []
  for (let i = 0; i < count; i++) {
    const p = { x: bounds.x + rng() * bounds.w, y: bounds.y + rng() * bounds.h }
    if (keep(p)) out.push(p)
  }
  return out
}

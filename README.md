# Deterministic seeded-gameplay utilities

Small, dependency-free TypeScript utilities for games and procedural
content. Each file stands alone; copy it into any project, no package
install needed.

| file | what it does |
|---|---|
| `seeded-shapes.ts` | Deterministic seeded polygons + point-in-polygon distance. Organic map features (lakes, forests, rocks) that render identically on every device. |
| `share-intents.ts` | Wordle-style emoji scorecard + one-link share intents for Bluesky, X, WhatsApp, Facebook, LinkedIn, and the native share sheet. |
| `postcard.ts` | Render a branded share-card PNG entirely in the browser — Canvas2D → PNG blob for `navigator.share()` or download. |
| `daily-pick.ts` | Deterministic daily-selection helpers — the "everyone gets the same puzzle today" pattern, serverless. |
| `session_features.py` | NDJSON event stream → per-session feature rows. Sessionize by inactivity gap, emit flat feature dicts for pandas/warehouse/ML. Stdlib-only. |

## Why deterministic?

Every file here is built around one idea: **same inputs → same output on every
engine**. `Math.random()` and `sort(() => rng() - 0.5)` differ between Node/V8
and Safari/JSC; mulberry32 + FNV-1a don't. That's what lets a daily puzzle, a
shared map layout, or a simulated leaderboard be identical for every player
without a backend.

## License

MIT — see [LICENSE](./LICENSE).

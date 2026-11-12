/**
 * share-intents.ts — Wordle-style scorecard text + social share intent links.
 *
 * Zero dependencies, browser-side. Builds the classic emoji-squares results
 * card and returns intent URLs that open each network's composer pre-filled.
 */

export interface ShareCard {
  /** e.g. "E", "+4", "-2" */
  score: string
  /** Colored squares row: ⬜ 🟩 🟨 🟥 ⬛ */
  squares: string
  /** One-line pitch / subtitle. */
  tagline?: string
  /** "Beat my card → https://..." */
  cta?: string
}

/** Format a delta vs target: "E", "+3", "-2". */
export function formatDelta(delta: number): string {
  return delta === 0 ? "E" : delta > 0 ? `+${delta}` : `${delta}`
}

/**
 * Emoji squares per round vs target:
 *   under target → 🟩  ·  on target → ⬜  ·  +1 → 🟨  ·  worse → 🟥  ·  not played → ⬛
 */
export function scoreSquares(strokes: (number | null)[], targets: number[]): string {
  return strokes
    .map((st, i) => {
      if (st == null) return "⬛"
      const d = st - targets[i]
      return d < 0 ? "🟩" : d === 0 ? "⬜" : d === 1 ? "🟨" : "🟥"
    })
    .join("")
}

/** Assemble the plain-text card that pastes well into any post box. */
export function shareText(card: ShareCard): string {
  return [
    `⛳ ${card.score}`,
    card.squares,
    card.tagline,
    card.cta,
  ]
    .filter(Boolean)
    .join("\n")
}

// ---------- intent URLs ----------
// Each opens the network's native composer with the text pre-filled.
// Facebook & LinkedIn have no text-intent — they share the URL, and the
// page's OpenGraph card supplies the visuals.

export const bskyIntent = (text: string) =>
  `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`

export const xIntent = (text: string) =>
  `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`

export const whatsappIntent = (text: string) =>
  `https://wa.me/?text=${encodeURIComponent(text)}`

export const facebookIntent = (url: string) =>
  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`

export const linkedinIntent = (url: string) =>
  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`

/**
 * Share via the native sheet when available (mobile) — attaches an image
 * blob too. Returns false when the API can't share it, so callers can fall
 * back to a download link.
 */
export async function nativeShare(text: string, image?: Blob): Promise<boolean> {
  try {
    const files = image ? [new File([image], "card.png", { type: "image/png" })] : undefined
    if (files && (!navigator.canShare || !navigator.canShare({ files }))) return false
    await navigator.share({ text, files })
    return true
  } catch {
    return false // user cancelled or API unavailable
  }
}

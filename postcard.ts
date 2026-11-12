/**
 * postcard.ts — render a branded share-card PNG entirely in the browser.
 *
 * No assets, no server: plain Canvas2D → PNG blob, ready for
 * navigator.share(), clipboard, or a download link. Customise via `theme`.
 */

export interface CardTheme {
  bg?: string
  accent?: string
  text?: string
  subtext?: string
  /** Header line, small caps. */
  kicker?: string
  width?: number
  height?: number
}

export interface CardContent {
  /** Big headline — e.g. "Level 12 cleared in 1:42". */
  headline: string
  /** Emoji-squares row (optional). */
  squares?: string
  /** Smaller line under the squares. */
  score?: string
  /** Bottom call-to-action — "Beat my card → example.com". */
  cta?: string
  /** Footer — defaults to today's date. */
  footer?: string
}

const DEFAULTS: Required<CardTheme> = {
  bg: "#1e2b1e",
  accent: "#bff747",
  text: "#ffffff",
  subtext: "rgba(255,255,255,0.7)",
  kicker: "",
  width: 1200,
  height: 675,
}

/** Render the card and resolve to a PNG blob. */
export async function renderCardPng(content: CardContent, theme: CardTheme = {}): Promise<Blob> {
  const t = { ...DEFAULTS, ...theme }
  const canvas = document.createElement("canvas")
  canvas.width = t.width
  canvas.height = t.height
  const ctx = canvas.getContext("2d")!
  const W = t.width
  const cx = W / 2

  ctx.fillStyle = t.bg
  ctx.fillRect(0, 0, W, t.height)
  ctx.fillStyle = t.accent
  ctx.fillRect(0, 0, W, 14)

  ctx.textAlign = "center"

  if (t.kicker) {
    ctx.fillStyle = t.accent
    ctx.font = "600 26px system-ui, sans-serif"
    ctx.fillText(t.kicker.toUpperCase(), cx, 105)
  }

  ctx.fillStyle = t.text
  ctx.font = "bold 60px Georgia, serif"
  ctx.fillText(content.headline.replace(/^⛳\s*/, ""), cx, 200)

  if (content.squares) {
    ctx.font = "46px system-ui, sans-serif"
    ctx.fillText(content.squares, cx, 305)
  }

  if (content.score) {
    ctx.fillStyle = t.subtext
    ctx.font = "32px system-ui, sans-serif"
    ctx.fillText(content.score, cx, 415)
  }

  if (content.cta) {
    ctx.fillStyle = t.accent
    ctx.font = "bold 44px Georgia, serif"
    ctx.fillText(content.cta, cx, 520)
  }

  ctx.fillStyle = "rgba(255,255,255,0.4)"
  ctx.font = "24px system-ui, sans-serif"
  ctx.fillText(content.footer ?? new Date().toLocaleDateString(), cx, 600)

  return new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("card render failed"))), "image/png")
  )
}

/** Trigger a browser download of the blob — fallback when native share isn't available. */
export function downloadBlob(blob: Blob, filename = "card.png") {
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

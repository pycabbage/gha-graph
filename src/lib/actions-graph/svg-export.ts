import type { ContentBBox } from "./types"

const SVG_NS = "http://www.w3.org/2000/svg"

/**
 * エクスポート時に埋め込む静的CSS。テキストのfont-size/weight/fillはSVG要素の
 * presentation属性として直接指定されているため、ここではfont-familyのみを補う。
 */
const EXPORT_STYLE = `
  text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif; }
`

/** CSS変数を直接指定しているpresentation属性を、エクスポート用の固定色へ置き換えるための対応表 */
const COLOR_VAR_REPLACEMENTS: ReadonlyArray<{ attr: "stroke" | "fill"; from: string; to: string }> =
  [
    { attr: "stroke", from: "var(--graph-border-soft)", to: "#d8dee4" },
    { attr: "stroke", from: "var(--graph-border)", to: "#d0d7de" },
    { attr: "stroke", from: "var(--graph-port)", to: "#afb8c1" },
    { attr: "fill", from: "var(--graph-card-bg)", to: "#ffffff" },
    { attr: "fill", from: "var(--graph-port)", to: "#afb8c1" },
    { attr: "fill", from: "var(--graph-text)", to: "#1f2328" },
    { attr: "fill", from: "var(--graph-text-muted)", to: "#59636e" },
  ]

/**
 * 現在表示中のSVG要素を、パン・ズームのtransformを除去し、CSS変数を固定色に
 * 置き換えた上で単体で開ける状態にした文字列(SVGマークアップ)へ変換する。
 * DOM APIに依存するがロジックとして純粋関数化し、UI側からはダウンロード処理のみ行わせる。
 */
export function buildExportableSvgMarkup(svg: SVGSVGElement, contentBBox: ContentBBox): string {
  const clone = svg.cloneNode(true) as SVGSVGElement

  // viewBoxをコンテンツに合わせ、transformを除去
  clone.querySelectorAll("g[transform]").forEach((node) => node.removeAttribute("transform"))
  clone.setAttribute(
    "viewBox",
    `${contentBBox.x} ${contentBBox.y} ${contentBBox.w} ${contentBBox.h}`
  )
  clone.setAttribute("width", String(contentBBox.w))
  clone.setAttribute("height", String(contentBBox.h))

  // CSS変数を実体化
  const style = document.createElementNS(SVG_NS, "style")
  style.textContent = EXPORT_STYLE
  clone.insertBefore(style, clone.firstChild)

  for (const { attr, from, to } of COLOR_VAR_REPLACEMENTS) {
    clone.querySelectorAll(`[${attr}="${from}"]`).forEach((node) => node.setAttribute(attr, to))
  }

  const background = document.createElementNS(SVG_NS, "rect")
  background.setAttribute("x", String(contentBBox.x))
  background.setAttribute("y", String(contentBBox.y))
  background.setAttribute("width", String(contentBBox.w))
  background.setAttribute("height", String(contentBBox.h))
  background.setAttribute("fill", "#f6f8fa")
  clone.insertBefore(background, clone.children[1] ?? null)

  return new XMLSerializer().serializeToString(clone)
}

/** SVGマークアップ文字列をファイルとしてダウンロードさせる */
export function downloadSvgMarkup(markup: string, filename: string): void {
  const blob = new Blob([markup], { type: "image/svg+xml" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

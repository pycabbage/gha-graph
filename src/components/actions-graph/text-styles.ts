import type { CSSProperties } from "react"

/**
 * SVGテキストのスタイル定数。CSS Modulesを使わずpresentation属性として直接
 * 指定することで、SVGエクスポート時(DOMをクローンして単体で開く場合)にも
 * クラス名解決(ハッシュ付き)に依存せず同じ見た目を再現できるようにしている。
 */

const NO_SELECT: CSSProperties = { userSelect: "none" }

export const WF_TITLE_TEXT_STYLE = {
  fontSize: 20,
  fontWeight: 600,
  fill: "var(--graph-text)",
  style: NO_SELECT,
}
export const WF_SUB_TEXT_STYLE = { fontSize: 13, fill: "var(--graph-text-muted)", style: NO_SELECT }
export const JOB_LABEL_TEXT_STYLE = {
  fontSize: 14,
  fontWeight: 600,
  fill: "var(--graph-text)",
  style: NO_SELECT,
}
export const JOB_NOTE_TEXT_STYLE = {
  fontSize: 12,
  fill: "var(--graph-text-muted)",
  style: NO_SELECT,
}
export const MATRIX_LABEL_TEXT_STYLE = {
  fontSize: 13,
  fontWeight: 600,
  fill: "var(--graph-text)",
  style: NO_SELECT,
}

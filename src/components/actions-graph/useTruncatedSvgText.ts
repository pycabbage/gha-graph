"use client"

import { useState } from "react"

/**
 * SVGの<text>要素の描画幅を計測し、maxWidthを超える場合は末尾を「…」で省略した
 * テキストへ差し替えるフック。GitHub Actionsのグラフ表示と同様の挙動を再現する。
 *
 * useLayoutEffectは使わず、要素がDOMにマウントされた瞬間に呼ばれるcallback ref内で
 * 直接計測する。text/maxWidthが変わったときに再計測できるよう、呼び出し側で
 * `key`にtext/maxWidthを含めて要素を再マウントさせる想定(measureKeyを返す)。
 */
export function useTruncatedSvgText(text: string, maxWidth: number) {
  const [displayText, setDisplayText] = useState(text)

  function measureRef(node: SVGTextElement | null) {
    if (!node) return
    node.textContent = text
    if (node.getComputedTextLength() <= maxWidth) {
      setDisplayText(text)
      return
    }
    let candidate = text
    while (candidate.length > 1) {
      candidate = candidate.slice(0, -1)
      node.textContent = `${candidate}…`
      if (node.getComputedTextLength() <= maxWidth) break
    }
    setDisplayText(`${candidate}…`)
  }

  return { ref: measureRef, measureKey: `${maxWidth}:${text}`, displayText }
}

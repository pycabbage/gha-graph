"use client"

import type { CSSProperties } from "react"
import { useTruncatedSvgText } from "./useTruncatedSvgText"

interface TruncatedTextProps {
  x: number
  y: number
  text: string
  maxWidth: number
  fontSize: number
  fontWeight?: number
  fill: string
  style?: CSSProperties
}

/**
 * 幅がmaxWidthを超える場合、末尾を省略記号(…)で切り詰めて表示するSVGテキスト。
 * フォントサイズ・太さ・色はCSS Modulesクラスではなくpresentation属性で直接
 * 指定する(SVGエクスポート時にクラス名解決に依存せず見た目を再現するため)。
 */
export function TruncatedText({
  x,
  y,
  text,
  maxWidth,
  fontSize,
  fontWeight,
  fill,
  style,
}: TruncatedTextProps) {
  const { ref, measureKey, displayText } = useTruncatedSvgText(text, maxWidth)
  return (
    // text/maxWidthが変わったらDOM要素を再マウントさせ、ref callback内で再計測させるためkeyを使う
    <text
      key={measureKey}
      ref={ref}
      x={x}
      y={y}
      fontSize={fontSize}
      fontWeight={fontWeight}
      fill={fill}
      style={style}
    >
      {displayText}
    </text>
  )
}

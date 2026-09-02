import { MAX_SCALE, MIN_SCALE } from "./dimensions"
import type { ContentBBox, ViewTransform } from "./types"

export interface ViewportRect {
  width: number
  height: number
}

/** コンテンツ全体がステージに収まるように view(平行移動・スケール)を計算する */
export function computeFitView(rect: ViewportRect, bbox: ContentBBox): ViewTransform {
  const k = Math.min(rect.width / bbox.w, rect.height / bbox.h, 1.4) * 0.94
  return {
    k,
    x: (rect.width - bbox.w * k) / 2 - bbox.x * k,
    y: (rect.height - bbox.h * k) / 2 - bbox.y * k,
  }
}

/** 指定した画面座標(cx, cy)を中心に factor 倍だけ拡大・縮小した view を計算する */
export function computeZoomAt(
  view: ViewTransform,
  factor: number,
  cx: number,
  cy: number
): ViewTransform {
  const nextScale = Math.min(Math.max(view.k * factor, MIN_SCALE), MAX_SCALE)
  const f = nextScale / view.k
  return {
    k: nextScale,
    x: cx - (cx - view.x) * f,
    y: cy - (cy - view.y) * f,
  }
}

/** view に (dx, dy) だけ平行移動を加えた新しい view を計算する */
export function computePan(view: ViewTransform, dx: number, dy: number): ViewTransform {
  return { k: view.k, x: view.x + dx, y: view.y + dy }
}

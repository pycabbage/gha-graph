"use client"

import { IconButton } from "@primer/react"
import { ScreenFullIcon, ZoomInIcon, ZoomOutIcon } from "@primer/octicons-react"

interface GraphControlsProps {
  onFit: () => void
  onZoomIn: () => void
  onZoomOut: () => void
}

/** ステージ右下に浮かせる fit / zoom コントロール群 */
export function GraphControls({ onFit, onZoomIn, onZoomOut }: GraphControlsProps) {
  return (
    <div className="absolute right-4 bottom-4 flex gap-2">
      <div
        className="
        flex overflow-hidden rounded-md border border-(--graph-border)
        bg-(--graph-card-bg) shadow-(--graph-shadow)
      "
      >
        <IconButton
          icon={ScreenFullIcon}
          aria-label="全体を表示"
          onClick={onFit}
          variant="invisible"
        />
      </div>
      <div
        className="
        flex overflow-hidden rounded-md border border-(--graph-border)
        bg-(--graph-card-bg) shadow-(--graph-shadow)
      "
      >
        <IconButton icon={ZoomOutIcon} aria-label="縮小" onClick={onZoomOut} variant="invisible" />
        <IconButton icon={ZoomInIcon} aria-label="拡大" onClick={onZoomIn} variant="invisible" />
      </div>
    </div>
  )
}

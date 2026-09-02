"use client"

import type { PointerEvent, Ref, RefObject, WheelEvent } from "react"
import { IconButton } from "@primer/react"
import { DownloadIcon, SidebarCollapseIcon, SidebarExpandIcon } from "@primer/octicons-react"
import type { LayoutResult, ViewTransform, WorkflowModel } from "@/lib/actions-graph"
import { EdgeLayer } from "./EdgeLayer"
import { GraphControls } from "./GraphControls"
import { WF_SUB_TEXT_STYLE, WF_TITLE_TEXT_STYLE } from "./text-styles"
import { WorkflowCard } from "./WorkflowCard"

interface GraphStageProps {
  stageRef: Ref<HTMLDivElement>
  svgRef: RefObject<SVGSVGElement | null>
  view: ViewTransform
  model: WorkflowModel | null
  layoutResult: LayoutResult | null
  panelCollapsed: boolean
  onTogglePanel: () => void
  onExport: () => void
  onFit: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onWheel: (event: WheelEvent<SVGSVGElement>) => void
  onPointerDown: (event: PointerEvent<SVGSVGElement>) => void
  onPointerMove: (event: PointerEvent<SVGSVGElement>) => void
  onPointerUp: (event: PointerEvent<SVGSVGElement>) => void
}

/** SVGグラフ描画領域 + フローティングコントロール */
export function GraphStage({
  stageRef,
  svgRef,
  view,
  model,
  layoutResult,
  panelCollapsed,
  onTogglePanel,
  onExport,
  onFit,
  onZoomIn,
  onZoomOut,
  onWheel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: GraphStageProps) {
  return (
    <div ref={stageRef} className="relative flex-1 overflow-hidden">
      <svg
        ref={svgRef}
        className="block size-full cursor-grab active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <defs>
          <filter id="card-shadow" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx={0} dy={2} stdDeviation={4} floodColor="#1f2328" floodOpacity={0.1} />
          </filter>
        </defs>
        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          {model && (
            <>
              <text x={0} y={28} {...WF_TITLE_TEXT_STYLE}>
                {model.name}
              </text>
              <text x={0} y={52} {...WF_SUB_TEXT_STYLE}>
                {model.trigger ? `on: ${model.trigger}` : ""}
              </text>
            </>
          )}
          {layoutResult && (
            <>
              <EdgeLayer edges={layoutResult.edges} />
              {layoutResult.groups.map((group) => (
                <WorkflowCard key={group.key} group={group} />
              ))}
            </>
          )}
        </g>
      </svg>

      <IconButton
        icon={panelCollapsed ? SidebarExpandIcon : SidebarCollapseIcon}
        aria-label="エディタの表示/非表示"
        onClick={onTogglePanel}
        className="absolute top-4 left-4 shadow-(--graph-shadow)"
      />
      <IconButton
        icon={DownloadIcon}
        aria-label="SVGとして保存"
        onClick={onExport}
        className="absolute top-4 right-4 shadow-(--graph-shadow)"
      />

      <GraphControls onFit={onFit} onZoomIn={onZoomIn} onZoomOut={onZoomOut} />
    </div>
  )
}

"use client"

import type { KeyboardEvent, PointerEvent, WheelEvent } from "react"
import { useRef, useState } from "react"
import {
  buildExportableSvgMarkup,
  computeContentBBox,
  computeFitView,
  computePan,
  computeZoomAt,
  downloadSvgMarkup,
  layout,
  parseWorkflow,
  SAMPLE_WORKFLOW_YAML,
} from "@/lib/actions-graph"
import type { ContentBBox, ViewTransform, WorkflowModel } from "@/lib/actions-graph"
import { EditorPanel } from "./EditorPanel"
import { GraphStage } from "./GraphStage"

const EMPTY_BBOX: ContentBBox = { x: -20, y: -10, w: 800, h: 400 }
const WHEEL_ZOOM_STEP = 1.12
const BUTTON_ZOOM_STEP = 1.2

/** サンプルYAMLをパースした初期モデル(useStateの遅延初期化に渡すため、コンポーネント外に定義) */
function parseInitialModel(): WorkflowModel | null {
  try {
    return parseWorkflow(SAMPLE_WORKFLOW_YAML)
  } catch {
    return null
  }
}

/** Actions Graph のロジック(state・ハンドラ)を束ねるトップレベルコンポーネント */
export function ActionsGraph() {
  const [yamlText, setYamlText] = useState(SAMPLE_WORKFLOW_YAML)
  const [model, setModel] = useState<WorkflowModel | null>(parseInitialModel)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const [view, setView] = useState<ViewTransform>({ x: 0, y: 0, k: 1 })

  // DOM要素そのものへの参照(サイズ測定・エクスポート用)。
  const stageRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  // window の resize イベントハンドラ(callback ref内で登録、レンダー外の非同期タイミングで
  // 発火する)から現在のmodelを参照するためのref。レンダー中には読み書きせず、setModelと
  // 同時にイベントハンドラ内(renderYaml)でのみ更新する。
  const modelRef = useRef(model)

  const layoutResult = model ? layout(model) : null
  const contentBBox = layoutResult ? computeContentBBox(layoutResult.groups) : EMPTY_BBOX

  /**
   * ステージ要素のDOM生存期間に合わせて window の resize イベントを購読する callback ref。
   * useEffectの代わりにReact 19のref cleanup関数を使い、要素のマウント/アンマウントに
   * 合わせてリスナーを登録・解除する(ResizeObserverや自動発火するタイマー類は使わない、
   * ブラウザの標準イベント購読のみ)。初期表示時やパネル開閉時に自動でフィットし直す処理は
   * 持たない: フィット計算は「描画」ボタン押下時と、ここでのwindow resize時、および
   * fit/zoomボタン操作時にのみ行われる。
   */
  function stageRefCallback(node: HTMLDivElement | null) {
    stageRef.current = node
    if (!node) return
    const element: HTMLDivElement = node
    function handleWindowResize() {
      const rect = element.getBoundingClientRect()
      const currentModel = modelRef.current
      const bbox = currentModel ? computeContentBBox(layout(currentModel).groups) : EMPTY_BBOX
      setView(computeFitView({ width: rect.width, height: rect.height }, bbox))
    }
    window.addEventListener("resize", handleWindowResize)
    return () => window.removeEventListener("resize", handleWindowResize)
  }

  function renderYaml(text: string) {
    try {
      const parsed = parseWorkflow(text)
      setModel(parsed)
      modelRef.current = parsed
      setErrorMessage(null)
      const rect = stageRef.current?.getBoundingClientRect()
      if (rect) {
        const nextBBox = computeContentBBox(layout(parsed).groups)
        setView(computeFitView({ width: rect.width, height: rect.height }, nextBBox))
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error))
    }
  }

  function handleRenderClick() {
    renderYaml(yamlText)
  }

  function handleSampleClick() {
    setYamlText(SAMPLE_WORKFLOW_YAML)
    renderYaml(SAMPLE_WORKFLOW_YAML)
  }

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") handleRenderClick()
  }

  function handleTogglePanel() {
    // パネル開閉によるステージ幅の変化を自動検知して再フィットする仕組みは持たない
    // (ResizeObserver不使用のため)。必要なら「全体を表示」ボタンで手動フィットする。
    setPanelCollapsed((collapsed) => !collapsed)
  }

  function handleFit() {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return
    setView(computeFitView({ width: rect.width, height: rect.height }, contentBBox))
  }

  function handleZoomIn() {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return
    setView((current) => computeZoomAt(current, BUTTON_ZOOM_STEP, rect.width / 2, rect.height / 2))
  }

  function handleZoomOut() {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return
    setView((current) =>
      computeZoomAt(current, 1 / BUTTON_ZOOM_STEP, rect.width / 2, rect.height / 2)
    )
  }

  function handleWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const factor = event.deltaY < 0 ? WHEEL_ZOOM_STEP : 1 / WHEEL_ZOOM_STEP
    setView((current) =>
      computeZoomAt(current, factor, event.clientX - rect.left, event.clientY - rect.top)
    )
  }

  // パン中かどうかは state/ref に持たず、ブラウザのpointer capture状態そのものを
  // 真実の情報源として使う。これによりドラッグ開始位置を保持するrefが不要になる。
  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    setView((current) => computePan(current, event.movementX, event.movementY))
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function handleExport() {
    if (!svgRef.current) return
    const markup = buildExportableSvgMarkup(svgRef.current, contentBBox)
    downloadSvgMarkup(markup, "workflow-graph.svg")
  }

  return (
    <div
      className="
      flex h-screen overflow-hidden bg-(--graph-bg)
      text-(--graph-text)
    "
    >
      <EditorPanel
        collapsed={panelCollapsed}
        yamlText={yamlText}
        errorMessage={errorMessage}
        onYamlChange={setYamlText}
        onRenderClick={handleRenderClick}
        onSampleClick={handleSampleClick}
        onTextareaKeyDown={handleTextareaKeyDown}
      />
      <GraphStage
        stageRef={stageRefCallback}
        svgRef={svgRef}
        view={view}
        model={model}
        layoutResult={layoutResult}
        panelCollapsed={panelCollapsed}
        onTogglePanel={handleTogglePanel}
        onExport={handleExport}
        onFit={handleFit}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  )
}

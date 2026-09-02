/**
 * GitHub Actions ワークフローのグラフ表示に関する型定義。
 * このファイルはUIに依存しない純粋なデータ構造のみを扱う。
 */

/** 展開済みの1ジョブ(needs解決・ランク計算・matrix展開まで完了した状態) */
export interface JobDefinition {
  id: string
  label: string
  needs: string[]
  isMatrix: boolean
  /** matrix静的展開後の各組み合わせを表す文字列(1行=1組み合わせ) */
  matrixRows: string[]
  /** matrixが式(${{ }})を含む等の理由で静的展開できない場合true */
  matrixDynamic: boolean
  /** needsの最長経路で決まる列番号(0始まり) */
  rank: number
}

/** workflow YAMLをパースして得られるモデル */
export interface WorkflowModel {
  name: string
  trigger: string
  jobs: JobDefinition[]
}

/** strategy.matrix を静的展開した結果 */
export interface MatrixExpansion {
  combos: Record<string, unknown>[]
  keyOrder: string[]
  dynamic: boolean
}

/** カード内の1行(ジョブ本体、またはmatrixの1組み合わせ) */
export interface CardRow {
  main: string
  sub?: string
  jobId: string
}

/** レイアウト計算後の1カード(グループ化されたジョブの集合) */
export interface CardGroup {
  key: string
  rank: number
  needs: string[]
  jobs: JobDefinition[]
  isMatrix: boolean
  rows: CardRow[]
  w: number
  bodyH: number
  tabH: number
  h: number
  x: number
  y: number
  /** このグループを始点とするエッジのY座標(重複排除済み) */
  outPorts: number[]
  /** このグループに先行ジョブがあるか(左ポート描画用) */
  hasInPort: boolean
}

/** グループ間の接続線 */
export interface GraphEdge {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** レイアウト計算の結果一式 */
export interface LayoutResult {
  groups: CardGroup[]
  edges: GraphEdge[]
}

/** SVGコンテンツ全体を包含する矩形範囲(fit表示・エクスポートに使用) */
export interface ContentBBox {
  x: number
  y: number
  w: number
  h: number
}

/** パン・ズームの状態(平行移動量とスケール) */
export interface ViewTransform {
  x: number
  y: number
  k: number
}

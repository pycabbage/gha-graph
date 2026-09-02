import { CARD_W, COL_GAP, EDGE_R, GROUP_GAP, MATRIX_TAB_H, ROW_H, TITLE_H } from "./dimensions"
import type {
  CardGroup,
  CardRow,
  ContentBBox,
  GraphEdge,
  LayoutResult,
  WorkflowModel,
} from "./types"

/**
 * WorkflowModel からカードのグループ化・座標・エッジを計算する。
 *  - 同一ランクかつ同一needs/依存元のジョブは1枚のカードにまとめる(GitHub同様)
 *  - matrixジョブは単独カード + "Matrix:" タブ
 */
export function layout({ jobs }: WorkflowModel): LayoutResult {
  // 依存元(このジョブをneedsするジョブ)を算出
  const dependents: Record<string, string[]> = {}
  jobs.forEach((job) => {
    dependents[job.id] = []
  })
  jobs.forEach((job) => job.needs.forEach((needId) => dependents[needId]?.push(job.id)))

  // グループ化: needsと依存元の両方が一致するジョブを1枚のカードにまとめる
  const groupMap = new Map<string, CardGroup>()
  for (const job of jobs) {
    const needsKey = [...job.needs].sort().join(",")
    const depsKey = [...(dependents[job.id] ?? [])].sort().join(",")
    const key = job.isMatrix ? `m:${job.id}` : `r${job.rank}|${needsKey}|${depsKey}`
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        key,
        rank: job.rank,
        needs: job.needs,
        jobs: [],
        isMatrix: job.isMatrix,
        rows: [],
        w: CARD_W,
        bodyH: 0,
        tabH: 0,
        h: 0,
        x: 0,
        y: 0,
        outPorts: [],
        hasInPort: false,
      })
    }
    groupMap.get(key)?.jobs.push(job)
  }
  const groups = [...groupMap.values()]
  const groupOfJob: Record<string, CardGroup> = {}
  groups.forEach((group) =>
    group.jobs.forEach((job) => {
      groupOfJob[job.id] = group
    })
  )

  // 寸法(行を構築: matrixは全組み合わせを個別の行として展開)
  for (const group of groups) {
    group.w = CARD_W
    const rows: CardRow[] = []
    for (const job of group.jobs) {
      if (job.isMatrix) {
        if (job.matrixDynamic) {
          rows.push({ main: job.label, sub: "dynamic matrix", jobId: job.id })
        } else if (job.matrixRows.length === 0) {
          rows.push({ main: job.label, jobId: job.id })
        } else {
          for (const matrixRow of job.matrixRows) rows.push({ main: matrixRow, jobId: job.id })
        }
      } else {
        rows.push({ main: job.label, jobId: job.id })
      }
    }
    group.rows = rows
    group.bodyH = rows.length * ROW_H
    group.tabH = group.isMatrix ? MATRIX_TAB_H : 0
    group.h = group.bodyH + group.tabH
  }

  // 列ごとに整列
  const maxRank = Math.max(...groups.map((group) => group.rank))
  const cols: CardGroup[][] = []
  for (let r = 0; r <= maxRank; r++) {
    cols.push(groups.filter((group) => group.rank === r))
  }

  // x座標
  for (const group of groups) group.x = group.rank * (CARD_W + COL_GAP)

  // 初期y: 単純スタック
  for (const col of cols) {
    let y = 0
    for (const group of col) {
      group.y = y
      y += group.h + GROUP_GAP
    }
  }

  // バリセンタ法で数回スイープして揃える
  const sweep = (forward: boolean) => {
    const order = forward ? cols : [...cols].reverse()
    for (const col of order) {
      for (const group of col) {
        const refs: number[] = []
        if (forward) {
          // 先行ジョブの中心yへ寄せる
          const uniq = new Set(group.jobs.flatMap((job) => job.needs))
          uniq.forEach((id) => {
            const parent = groupOfJob[id]
            if (parent) refs.push(parent.y + parent.tabH + parent.bodyH / 2)
          })
        } else {
          // 後続グループの中心yへ寄せる
          for (const other of groups) {
            if (
              other.jobs.some((job) => job.needs.some((needId) => groupOfJob[needId] === group))
            ) {
              refs.push(other.y + other.tabH + other.bodyH / 2)
            }
          }
        }
        if (refs.length) {
          const target = refs.reduce((a, b) => a + b, 0) / refs.length
          group.y = target - group.tabH - group.bodyH / 2
        }
      }
      // 重なり解消(上から)
      col.sort((a, b) => a.y - b.y)
      for (let i = 1; i < col.length; i++) {
        const prev = col[i - 1]
        if (col[i].y < prev.y + prev.h + GROUP_GAP) {
          col[i].y = prev.y + prev.h + GROUP_GAP
        }
      }
    }
  }
  sweep(true)
  sweep(false)
  sweep(true)

  // 原点合わせ
  const minY = Math.min(...groups.map((group) => group.y))
  groups.forEach((group) => {
    group.y -= minY
    group.y += TITLE_H
  })

  // エッジ(sourceジョブ行 → targetグループ、重複排除)
  const edgeSet = new Set<string>()
  const edges: GraphEdge[] = []
  for (const group of groups) {
    for (const job of group.jobs) {
      for (const needId of job.needs) {
        const src = groupOfJob[needId]
        if (!src) continue
        const edgeKey = `${needId}->${group.key}`
        if (edgeSet.has(edgeKey)) continue
        edgeSet.add(edgeKey)
        let y1: number
        if (src.isMatrix) {
          y1 = src.y + src.tabH + src.bodyH / 2 // matrixはグループ中央から
        } else {
          const rowIdx = src.rows.findIndex((row) => row.jobId === needId)
          y1 = src.y + src.tabH + rowIdx * ROW_H + ROW_H / 2
        }
        edges.push({
          x1: src.x + src.w,
          y1,
          x2: group.x,
          y2: group.y + group.tabH + group.bodyH / 2,
        })
      }
    }
  }

  // 右ポート(このグループを始点とするエッジのY座標、重複排除)・左ポートの有無
  for (const group of groups) {
    const ys = new Set(edges.filter((edge) => edge.x1 === group.x + group.w).map((edge) => edge.y1))
    group.outPorts = [...ys]
    group.hasInPort = group.jobs.some((job) => job.needs.length > 0)
  }

  return { groups, edges }
}

/** グループ間の接続線をSVG path文字列に変換する */
export function edgePath(edge: GraphEdge): string {
  const { x1, y1, x2, y2 } = edge
  if (Math.abs(y1 - y2) < 1) return `M ${x1} ${y1} L ${x2} ${y2}`
  const xm = (x1 + x2) / 2
  const dir = y2 > y1 ? 1 : -1
  const r = Math.min(EDGE_R, Math.abs(y2 - y1) / 2, Math.abs(x2 - x1) / 2)
  return [
    `M ${x1} ${y1}`,
    `L ${xm - r} ${y1}`,
    `Q ${xm} ${y1} ${xm} ${y1 + dir * r}`,
    `L ${xm} ${y2 - dir * r}`,
    `Q ${xm} ${y2} ${xm + r} ${y2}`,
    `L ${x2} ${y2}`,
  ].join(" ")
}

/** グラフ全体を包含する矩形範囲を計算する(fit表示・エクスポート用の余白込み) */
export function computeContentBBox(groups: CardGroup[]): ContentBBox {
  if (groups.length === 0) return { x: -20, y: -10, w: 800, h: 400 }
  const maxX = Math.max(...groups.map((group) => group.x + group.w))
  const maxY = Math.max(...groups.map((group) => group.y + group.h))
  return { x: -20, y: -10, w: maxX + 40, h: maxY + 40 }
}

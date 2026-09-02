import { load } from "js-yaml"
import { expandMatrix } from "./matrix"
import type { JobDefinition, WorkflowModel } from "./types"

interface RawJobDefinition {
  name?: unknown
  needs?: unknown
  strategy?: { matrix?: unknown }
}

/**
 * workflow YAMLをパースし、ジョブのneeds解決・ランク計算・matrix展開まで行った
 * WorkflowModel を返す。不正なYAMLや循環参照は例外(Error)として投げる。
 */
export function parseWorkflow(text: string): WorkflowModel {
  const doc = load(text) as Record<string, unknown> | undefined
  if (!doc || typeof doc !== "object") throw new Error("YAMLを解析できませんでした")

  const jobsObj = doc.jobs as Record<string, unknown> | undefined
  if (!jobsObj || typeof jobsObj !== "object") throw new Error("`jobs:` が見つかりません")

  const jobs: JobDefinition[] = []
  for (const [id, rawDef] of Object.entries(jobsObj)) {
    const def = (rawDef ?? {}) as RawJobDefinition
    const needsValue = def.needs ?? []
    const needsList =
      typeof needsValue === "string" ? [needsValue] : Array.isArray(needsValue) ? needsValue : []
    const needs = needsList.filter(
      (needId): needId is string => typeof needId === "string" && needId in jobsObj
    ) // 未定義参照は無視

    let matrixRows: string[] = []
    let matrixDynamic = false
    const matrix =
      def.strategy && typeof def.strategy === "object" ? def.strategy.matrix : undefined
    const isMatrix = matrix !== undefined && matrix !== null
    if (isMatrix) {
      const expansion = expandMatrix(matrix)
      matrixDynamic = expansion.dynamic
      const format = (value: unknown) =>
        value && typeof value === "object" ? JSON.stringify(value) : String(value)
      matrixRows = expansion.combos.map((combo) =>
        expansion.keyOrder
          .filter((key) => key in combo)
          .map((key) => format(combo[key]))
          .join(", ")
      )
    }

    jobs.push({
      id,
      label: typeof def.name === "string" ? def.name : id,
      needs,
      isMatrix,
      matrixRows,
      matrixDynamic,
      rank: 0,
    })
  }
  if (jobs.length === 0) throw new Error("ジョブが定義されていません")

  // ランク計算(最長経路)。循環はエラー。
  const byId = Object.fromEntries(jobs.map((job) => [job.id, job]))
  const rank: Record<string, number> = {}
  const state: Record<string, 0 | 1 | 2> = {} // 0=未訪問,1=訪問中,2=確定
  const calcRank = (id: string): number => {
    if (state[id] === 2) return rank[id]
    if (state[id] === 1) throw new Error(`needs に循環参照があります: ${id}`)
    state[id] = 1
    const job = byId[id]
    rank[id] = job.needs.length === 0 ? 0 : 1 + Math.max(...job.needs.map(calcRank))
    state[id] = 2
    return rank[id]
  }
  jobs.forEach((job) => calcRank(job.id))
  jobs.forEach((job) => {
    job.rank = rank[job.id]
  })

  const name = typeof doc.name === "string" ? doc.name : "workflow"
  let trigger = ""
  const on = doc.on ?? (doc as Record<string, unknown>)["true"] // YAML1.1では on が true になる
  if (typeof on === "string") trigger = on
  else if (Array.isArray(on)) trigger = on.join(", ")
  else if (on && typeof on === "object") trigger = Object.keys(on).join(", ")

  return { name, trigger, jobs }
}

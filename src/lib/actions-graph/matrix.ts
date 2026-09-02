import type { MatrixExpansion } from "./types"

/**
 * 値の中に式(${{ }})が含まれるかどうかを再帰的に判定する。
 * matrixが式を含む場合、静的に組み合わせを展開できないため dynamic 扱いにする。
 */
export function hasExpr(value: unknown): boolean {
  if (typeof value === "string") return value.includes("${{")
  if (Array.isArray(value)) return value.some(hasExpr)
  if (value && typeof value === "object") return Object.values(value).some(hasExpr)
  return false
}

/**
 * strategy.matrix の静的展開(GitHubの仕様に準拠)。
 *  1. 軸の直積で組み合わせを生成する
 *  2. exclude: 指定キーが全て一致する組み合わせを除去する(部分一致)
 *  3. include: 元の組み合わせを上書きせず拡張できるなら拡張し、
 *     できなければ新しい組み合わせとして追加する
 *  式(${{ }})を含む場合は dynamic 扱いにする。
 */
export function expandMatrix(matrix: unknown): MatrixExpansion {
  // matrix 全体が式、または配列など不正形 → dynamic
  if (typeof matrix !== "object" || matrix === null || Array.isArray(matrix)) {
    return { combos: [], keyOrder: [], dynamic: true }
  }
  if (hasExpr(matrix)) return { combos: [], keyOrder: [], dynamic: true }

  const source = matrix as Record<string, unknown>
  const axes: Record<string, unknown[]> = {}
  for (const [key, value] of Object.entries(source)) {
    if (key === "include" || key === "exclude") continue
    axes[key] = Array.isArray(value) ? value : [value] // スカラー軸は単一値扱い
  }
  const axisKeys = Object.keys(axes)
  const keyOrder = [...axisKeys]
  const seenKey = new Set(axisKeys)

  // 直積
  let combos: Record<string, unknown>[] = [{}]
  for (const key of axisKeys) {
    const next: Record<string, unknown>[] = []
    for (const combo of combos) for (const value of axes[key]) next.push({ ...combo, [key]: value })
    combos = next
  }
  if (axisKeys.length === 0) combos = []

  const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

  // exclude: 部分一致で除去
  const excludeList = source.exclude
  if (Array.isArray(excludeList)) {
    for (const exclude of excludeList) {
      if (!exclude || typeof exclude !== "object") continue
      const excludeRecord = exclude as Record<string, unknown>
      combos = combos.filter(
        (combo) =>
          !Object.entries(excludeRecord).every(
            ([key, value]) => key in combo && eq(combo[key], value)
          )
      )
    }
  }

  // include: 軸キー部分が既存組み合わせと矛盾しなければ拡張(件数は増えない)、
  // どの組み合わせにも拡張できなければ新規追加
  const includeList = source.include
  if (Array.isArray(includeList)) {
    const added: Record<string, unknown>[] = []
    for (const include of includeList) {
      if (!include || typeof include !== "object") continue
      const includeRecord = include as Record<string, unknown>
      Object.keys(includeRecord).forEach((key) => {
        if (!seenKey.has(key)) {
          seenKey.add(key)
          keyOrder.push(key)
        }
      })
      const includeAxisKeys = Object.keys(includeRecord).filter((key) => axisKeys.includes(key))
      let expanded = false
      if (combos.length > 0) {
        for (const combo of combos) {
          if (includeAxisKeys.every((key) => eq(combo[key], includeRecord[key]))) {
            Object.assign(combo, includeRecord) // 非軸キーの追加(件数不変)
            expanded = true
          }
        }
      }
      if (!expanded) added.push({ ...includeRecord })
    }
    combos = combos.concat(added)
  }

  return { combos, keyOrder, dynamic: false }
}

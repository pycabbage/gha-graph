import { edgePath } from "@/lib/actions-graph"
import type { GraphEdge } from "@/lib/actions-graph"

interface EdgeLayerProps {
  edges: GraphEdge[]
}

/** グループ間の接続線をまとめて描画する(カードの下層に配置される) */
export function EdgeLayer({ edges }: EdgeLayerProps) {
  return (
    <g>
      {edges.map((edge) => (
        <path
          key={`${edge.x1},${edge.y1}-${edge.x2},${edge.y2}`}
          d={edgePath(edge)}
          fill="none"
          stroke="var(--graph-border-soft)"
          strokeWidth={2}
        />
      ))}
    </g>
  )
}

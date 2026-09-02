import { MATRIX_TAB_H, PORT_R, RADIUS, ROW_H } from "@/lib/actions-graph"
import type { CardGroup } from "@/lib/actions-graph"
import { TruncatedText } from "./TruncatedText"
import { JOB_LABEL_TEXT_STYLE, JOB_NOTE_TEXT_STYLE, MATRIX_LABEL_TEXT_STYLE } from "./text-styles"

interface WorkflowCardProps {
  group: CardGroup
}

/** 1グループ(ジョブカード)を描画する。matrixジョブの場合は上部に"Matrix:"タブが付く */
export function WorkflowCard({ group }: WorkflowCardProps) {
  const bodyY = group.y + group.tabH
  const matrixTabWidth = Math.min(group.w * 0.72, 220)

  return (
    <g>
      {group.isMatrix && (
        <>
          <rect
            x={group.x}
            y={group.y}
            width={matrixTabWidth}
            height={MATRIX_TAB_H + RADIUS}
            rx={RADIUS}
            fill="var(--graph-card-bg)"
            stroke="var(--graph-border)"
            filter="url(#card-shadow)"
          />
          <TruncatedText
            x={group.x + 16}
            y={group.y + MATRIX_TAB_H / 2 + 5}
            text={`Matrix: ${group.jobs[0].label}`}
            maxWidth={matrixTabWidth - 32}
            {...MATRIX_LABEL_TEXT_STYLE}
          />
        </>
      )}

      <rect
        x={group.x}
        y={bodyY}
        width={group.w}
        height={group.bodyH}
        rx={RADIUS}
        fill="var(--graph-card-bg)"
        stroke="var(--graph-border)"
        filter="url(#card-shadow)"
      />

      {group.rows.map((row, i) => {
        const rowY = bodyY + i * ROW_H
        const cy = rowY + ROW_H / 2
        return (
          <g key={`${row.jobId}-${i}`}>
            {i > 0 && (
              <line
                x1={group.x + 16}
                y1={rowY}
                x2={group.x + group.w - 16}
                y2={rowY}
                stroke="var(--graph-border-soft)"
                strokeWidth={1}
              />
            )}
            <circle
              cx={group.x + 26}
              cy={cy}
              r={8}
              fill="none"
              stroke="var(--graph-port)"
              strokeWidth={2}
            />
            <TruncatedText
              x={group.x + 44}
              y={cy + (row.sub ? -2 : 5)}
              text={row.main}
              maxWidth={group.w - 60}
              {...JOB_LABEL_TEXT_STYLE}
            />
            {row.sub && (
              <TruncatedText
                x={group.x + 44}
                y={cy + 16}
                text={row.sub}
                maxWidth={group.w - 60}
                {...JOB_NOTE_TEXT_STYLE}
              />
            )}
          </g>
        )
      })}

      {/* 右ポート(このグループを始点とするエッジの位置) */}
      {group.outPorts.map((y) => (
        <circle
          key={y}
          cx={group.x + group.w}
          cy={y}
          r={PORT_R}
          fill="var(--graph-port)"
          stroke="#fff"
          strokeWidth={1.5}
        />
      ))}

      {/* 左ポート(先行ジョブがある場合、グループ中央) */}
      {group.hasInPort && (
        <circle
          cx={group.x}
          cy={bodyY + group.bodyH / 2}
          r={PORT_R}
          fill="var(--graph-port)"
          stroke="#fff"
          strokeWidth={1.5}
        />
      )}
    </g>
  )
}

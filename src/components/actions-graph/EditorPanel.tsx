"use client"

import type { ChangeEvent, KeyboardEvent } from "react"
import { Banner, Button, Textarea } from "@primer/react"

interface EditorPanelProps {
  collapsed: boolean
  yamlText: string
  errorMessage: string | null
  onYamlChange: (value: string) => void
  onRenderClick: () => void
  onSampleClick: () => void
  onTextareaKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
}

/** 左側のYAMLエディタパネル(見出し・テキストエリア・エラー表示・操作ボタン) */
export function EditorPanel({
  collapsed,
  yamlText,
  errorMessage,
  onYamlChange,
  onRenderClick,
  onSampleClick,
  onTextareaKeyDown,
}: EditorPanelProps) {
  return (
    <div
      className={`
        flex w-[380px] min-w-[380px] flex-col border-r
        border-(--graph-border) bg-(--graph-card-bg)
        transition-[margin-left] duration-200
        ${collapsed ? "ml-[-380px]" : "ml-0"}
      `}
    >
      <header
        className="
        border-b border-(--graph-border) px-4 pt-3.5 pb-2.5
      "
      >
        <h1 className="text-[15px] font-semibold">
          Actions Graph{" "}
          <span className="text-xs font-normal text-(--graph-text-muted)">workflow visualizer</span>
        </h1>
        <p className="mt-0.5 text-xs text-(--graph-text-muted)">
          ワークフローYAMLを貼り付けて「描画」を押してください
        </p>
      </header>

      <Textarea
        value={yamlText}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onYamlChange(event.target.value)}
        onKeyDown={onTextareaKeyDown}
        spellCheck={false}
        resize="none"
        block
        aria-label="workflow YAML"
        className="
          min-h-0 flex-1
          focus-within:border-(--graph-border)! focus-within:outline-none!
          [&_textarea]:h-full [&_textarea]:rounded-none [&_textarea]:border-none
          [&_textarea]:font-mono [&_textarea]:text-xs/relaxed
        "
      />

      {errorMessage && (
        <div className="mx-4 mb-2.5">
          <Banner variant="critical" title="解析エラー" description={errorMessage} hideTitle />
        </div>
      )}

      <footer
        className="
        flex items-center gap-2 border-t border-(--graph-border) px-4
        py-2.5
      "
      >
        <Button variant="primary" onClick={onRenderClick}>
          描画
        </Button>
        <Button onClick={onSampleClick}>サンプル</Button>
        <span className="flex-1" />
        <span className="text-xs text-(--graph-text-muted)">⌘/Ctrl+Enter でも描画</span>
      </footer>
    </div>
  )
}

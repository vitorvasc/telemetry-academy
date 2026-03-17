import Editor, { type OnMount } from '@monaco-editor/react'
import React, { useRef, useEffect, useState } from 'react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  filename?: string // overrides displayed filename, defaults to 'payment_service.py'
  onRunShortcut?: () => void | Promise<void> // called by Cmd/Ctrl+Enter
  defaultWordWrap?: boolean // true for YAML cases, false (default) for Python
  caseKey?: string // pass currentCaseId; changes trigger imperative setValue to reset editor
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'python',
  filename,
  onRunShortcut,
  defaultWordWrap = false,
  caseKey,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)
  const latestValueRef = useRef(value)
  useEffect(() => {
    latestValueRef.current = value
  })

  const [fontSize, setFontSize] = useState<number>(() => {
    return Number(localStorage.getItem('ta-editor-fontsize')) || 14
  })

  const [wordWrap, setWordWrap] = useState<boolean>(() => {
    const stored = localStorage.getItem('ta-editor-wordwrap')
    return stored !== null ? stored === 'true' : defaultWordWrap
  })

  const decreaseFontSize = () => {
    const next = Math.max(10, fontSize - 1)
    setFontSize(next)
    localStorage.setItem('ta-editor-fontsize', String(next))
  }

  const increaseFontSize = () => {
    const next = Math.min(20, fontSize + 1)
    setFontSize(next)
    localStorage.setItem('ta-editor-fontsize', String(next))
  }

  // Keep a ref to onRunShortcut so the Monaco addCommand closure always calls
  // the latest version without needing to re-register the command on re-renders.
  const onRunShortcutRef = useRef(onRunShortcut)
  useEffect(() => {
    onRunShortcutRef.current = onRunShortcut
  })

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    editorRef.current = editor
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    editor.addCommand(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => {
        void onRunShortcutRef.current?.()
      }
    )
    if (containerRef.current) {
      observerRef.current = new ResizeObserver(() => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        editor.layout()
      })
      observerRef.current.observe(containerRef.current)
    }
  }

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  // When the case switches externally (caseKey changes), imperatively reset editor content
  // and cursor without relying on the controlled value prop (which causes cursor jumps).
  useEffect(() => {
    if (editorRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const model = editorRef.current.getModel()
      if (model) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        model.setValue(latestValueRef.current)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        editorRef.current.setPosition({ lineNumber: 1, column: 1 })
      }
    }
  }, [caseKey])

  return (
    <div className="h-full flex flex-col rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-50">
            {filename ?? 'payment_service.py'}
          </span>
          <span className="text-xs text-slate-400">Modified</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Font size controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={decreaseFontSize}
              className="px-1.5 py-0.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors font-mono"
              title="Decrease font size"
            >
              A-
            </button>
            <span className="text-xs text-slate-500 tabular-nums w-5 text-center">
              {fontSize}
            </span>
            <button
              onClick={increaseFontSize}
              className="px-1.5 py-0.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors font-mono"
              title="Increase font size"
            >
              A+
            </button>
          </div>
          {/* Word wrap toggle */}
          <button
            onClick={() => {
              const next = !wordWrap
              setWordWrap(next)
              localStorage.setItem('ta-editor-wordwrap', String(next))
            }}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              wordWrap
                ? 'bg-sky-500/20 text-sky-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title={wordWrap ? 'Word wrap: on' : 'Word wrap: off'}
          >
            Wrap
          </button>
          <span className="text-xs text-slate-400">
            {language.toUpperCase()}
          </span>
        </div>
      </div>

      <div ref={containerRef} className="flex-1">
        <Editor
          height="100%"
          language={language}
          defaultValue={value}
          onChange={val => onChange(val || '')}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: fontSize,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: false,
            padding: { top: 16 },
            fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
            smoothScrolling: true,
            tabSize: 4,
            wordWrap: wordWrap ? 'on' : 'off',
          }}
        />
      </div>
    </div>
  )
}

import { lazy, Suspense, useState, type ReactNode } from 'react'
import { BookOpen, Code2, Terminal } from 'lucide-react'
import {
  Group,
  Panel,
  Separator,
  type useGroupRef,
  type useDefaultLayout,
} from 'react-resizable-panels'
import { InstructionsPanel } from './InstructionsPanel'
import { ValidationPanel } from './ValidationPanel'
import { OutputPanel } from './terminal/OutputPanel'
import { LANGUAGE_FILE_EXTENSIONS, type Language } from '../hooks/useCodeRunner'
import type { Case, ValidationResult } from '../types'

const CodeEditor = lazy(() =>
  import('./CodeEditor').then(m => ({ default: m.CodeEditor }))
)

type MobileTab = 'instructions' | 'code' | 'output'

const MOBILE_TABS: { id: MobileTab; label: string; icon: React.ElementType }[] =
  [
    { id: 'instructions', label: 'Guide', icon: BookOpen },
    { id: 'code', label: 'Code', icon: Code2 },
    { id: 'output', label: 'Output', icon: Terminal },
  ]

function MobileTabBar({
  active,
  onChange,
}: {
  active: MobileTab
  onChange: (tab: MobileTab) => void
}) {
  return (
    <div className="flex sm:hidden border-b border-slate-700 bg-slate-800 flex-shrink-0">
      {MOBILE_TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors border-b-2 ${
            active === id
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}

interface EditorPaneProps {
  currentCase: Case
  code: string
  onChange: (code: string) => void
  language: Language
  resetCount: number
  onRun: () => void | Promise<void>
}

function EditorPane({
  currentCase,
  code,
  onChange,
  language,
  resetCount,
  onRun,
}: EditorPaneProps) {
  const isYaml = currentCase.type === 'yaml-config'
  return (
    <Suspense
      fallback={
        <div className="flex-1 h-full bg-slate-800 rounded-lg animate-pulse" />
      }
    >
      <CodeEditor
        value={code}
        onChange={onChange}
        language={isYaml ? 'yaml' : language}
        filename={
          isYaml
            ? 'collector.yaml'
            : `payment_service${LANGUAGE_FILE_EXTENSIONS[language]}`
        }
        onRunShortcut={onRun}
        defaultWordWrap={isYaml}
        caseKey={`${currentCase.id}-${language}-${resetCount}`}
      />
    </Suspense>
  )
}

interface InstrumentationWorkspaceProps {
  currentCase: Case
  code: string
  onCodeChange: (code: string) => void
  language: Language
  resetCount: number
  onValidate: () => void | Promise<void>
  validationResults: ValidationResult[]
  isValidating: boolean
  isWorkerReady: boolean
  loadingLabel: string
  phaseUnlocked: boolean
  onStartInvestigation: () => void
  output: string[]
  workerError: string | null
  initError: string | null
  isRunning: boolean
  spanCount: number
  phaseBar: ReactNode
  languageBar: ReactNode
  groupRef: ReturnType<typeof useGroupRef>
  mainLayout: ReturnType<typeof useDefaultLayout>
  rightLayout: ReturnType<typeof useDefaultLayout>
  bottomLayout: ReturnType<typeof useDefaultLayout>
}

export function InstrumentationWorkspace({
  currentCase,
  code,
  onCodeChange,
  language,
  resetCount,
  onValidate,
  validationResults,
  isValidating,
  isWorkerReady,
  loadingLabel,
  phaseUnlocked,
  onStartInvestigation,
  output,
  workerError,
  initError,
  isRunning,
  spanCount,
  phaseBar,
  languageBar,
  groupRef,
  mainLayout,
  rightLayout,
  bottomLayout,
}: InstrumentationWorkspaceProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>('instructions')
  const runError = workerError || initError

  const editorPane = (
    <EditorPane
      currentCase={currentCase}
      code={code}
      onChange={onCodeChange}
      language={language}
      resetCount={resetCount}
      onRun={onValidate}
    />
  )

  const validationPanel = (
    <ValidationPanel
      results={validationResults}
      isValidating={isValidating}
      isWorkerReady={isWorkerReady}
      loadingLabel={loadingLabel}
      onValidate={onValidate}
      phaseUnlocked={phaseUnlocked}
      onStartInvestigation={onStartInvestigation}
    />
  )

  const outputPanel = (
    <OutputPanel output={output} error={runError} isRunning={isRunning} />
  )

  return (
    <>
      {/* ── Desktop layout (resizable panels) ── */}
      <Group
        orientation="horizontal"
        groupRef={groupRef}
        className="hidden sm:flex flex-1 overflow-hidden"
        defaultLayout={mainLayout.defaultLayout}
        onLayoutChanged={mainLayout.onLayoutChanged}
      >
        <Panel
          id="ta-instructions"
          defaultSize="25%"
          minSize="15%"
          maxSize="45%"
          className="overflow-y-auto"
        >
          <InstructionsPanel
            case={currentCase}
            phaseUnlocked={phaseUnlocked}
            onStartInvestigation={onStartInvestigation}
          />
        </Panel>
        <Separator className="w-1.5 bg-slate-700 hover:bg-sky-500/50 active:bg-sky-500 transition-colors cursor-col-resize flex-shrink-0" />
        <Panel id="ta-editor-group" className="flex flex-col overflow-hidden">
          {phaseBar}
          <Group
            orientation="vertical"
            className="flex-1 overflow-hidden"
            defaultLayout={rightLayout.defaultLayout}
            onLayoutChanged={rightLayout.onLayoutChanged}
          >
            <Panel
              id="ta-editor"
              defaultSize="70%"
              minSize="25%"
              className="overflow-hidden flex flex-col"
            >
              {languageBar}
              <div className="flex-1 p-4 overflow-hidden">{editorPane}</div>
            </Panel>
            <Separator className="h-1.5 bg-slate-700 hover:bg-sky-500/50 active:bg-sky-500 transition-colors cursor-row-resize flex-shrink-0" />
            <Panel
              id="ta-bottom"
              defaultSize="30%"
              minSize="15%"
              className="overflow-hidden bg-slate-800 border-t border-slate-700"
            >
              <Group
                orientation="horizontal"
                className="h-full"
                defaultLayout={bottomLayout.defaultLayout}
                onLayoutChanged={bottomLayout.onLayoutChanged}
              >
                <Panel id="ta-validation" defaultSize="50%" minSize="20%">
                  {validationPanel}
                </Panel>
                <Separator className="w-1.5 bg-slate-700 hover:bg-sky-500/50 active:bg-sky-500 transition-colors cursor-col-resize flex-shrink-0" />
                <Panel id="ta-output" defaultSize="50%" minSize="20%">
                  {outputPanel}
                  {spanCount > 0 && (
                    <div className="text-xs text-slate-500 mt-1 px-4">
                      Captured {spanCount} telemetry span(s)
                    </div>
                  )}
                </Panel>
              </Group>
            </Panel>
          </Group>
        </Panel>
      </Group>

      {/* ── Mobile layout (tabs) ── */}
      <div className="flex sm:hidden flex-1 flex-col overflow-hidden">
        <MobileTabBar active={mobileTab} onChange={setMobileTab} />
        {phaseBar}
        {mobileTab === 'instructions' && (
          <div className="flex-1 overflow-y-auto">
            <InstructionsPanel
              case={currentCase}
              phaseUnlocked={phaseUnlocked}
              onStartInvestigation={onStartInvestigation}
            />
          </div>
        )}
        {mobileTab === 'code' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {languageBar}
            <div className="flex-1 p-3 overflow-hidden">{editorPane}</div>
          </div>
        )}
        {mobileTab === 'output' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 border-b border-slate-700 overflow-hidden">
              {validationPanel}
            </div>
            <div className="flex-1 overflow-hidden">{outputPanel}</div>
          </div>
        )}
      </div>
    </>
  )
}

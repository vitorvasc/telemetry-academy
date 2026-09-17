import type { ReactNode } from 'react'
import { Radio } from 'lucide-react'
import {
  Group,
  Panel,
  Separator,
  type useGroupRef,
  type useDefaultLayout,
} from 'react-resizable-panels'
import { InstructionsPanel } from './InstructionsPanel'
import { InvestigationView } from './InvestigationView'
import type { Case } from '../types'
import type { Phase2Data } from '../types/phase2'

function NoTelemetryData({ onGoToPhase1 }: { onGoToPhase1: () => void }) {
  return (
    <div className="h-full flex items-center justify-center bg-slate-900 px-6">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Radio className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-200 mb-2">
          No Telemetry Data
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Run your code in Phase 1 to generate telemetry data for investigation.
        </p>
        <button
          onClick={onGoToPhase1}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Go to Phase 1
        </button>
      </div>
    </div>
  )
}

interface InvestigationWorkspaceProps {
  currentCase: Case
  phaseUnlocked: boolean
  phase2Data: Phase2Data | null
  hasPhase2Data: boolean
  output: string[]
  onCaseSolved: () => void
  onAttempt: () => void
  onGoToPhase1: () => void
  phaseBar: ReactNode
  groupRef: ReturnType<typeof useGroupRef>
  mainLayout: ReturnType<typeof useDefaultLayout>
}

export function InvestigationWorkspace({
  currentCase,
  phaseUnlocked,
  phase2Data,
  hasPhase2Data,
  output,
  onCaseSolved,
  onAttempt,
  onGoToPhase1,
  phaseBar,
  groupRef,
  mainLayout,
}: InvestigationWorkspaceProps) {
  const investigation =
    hasPhase2Data && phase2Data ? (
      <InvestigationView
        data={phase2Data}
        caseName={currentCase.name}
        currentCaseId={currentCase.id}
        onCaseSolved={onCaseSolved}
        onAttempt={onAttempt}
        userOutput={output}
      />
    ) : (
      <NoTelemetryData onGoToPhase1={onGoToPhase1} />
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
          <InstructionsPanel case={currentCase} phaseUnlocked={phaseUnlocked} />
        </Panel>
        <Separator className="w-1.5 bg-slate-700 hover:bg-sky-500/50 active:bg-sky-500 transition-colors cursor-col-resize flex-shrink-0" />
        <Panel
          id="ta-investigation"
          defaultSize="75%"
          minSize="40%"
          className="flex flex-col overflow-hidden"
        >
          {phaseBar}
          <div className="flex-1 overflow-hidden">{investigation}</div>
        </Panel>
      </Group>

      {/* ── Mobile layout (full-width investigation) ── */}
      <div className="flex sm:hidden flex-1 flex-col overflow-hidden">
        {phaseBar}
        <div className="flex-1 overflow-hidden">{investigation}</div>
      </div>
    </>
  )
}

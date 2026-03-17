// Case Loader — auto-discovers all cases from src/cases/<id>/case.yaml
//
// To add a new case:
//   1. Create a folder: src/cases/<id>/
//   2. Add case.yaml  (content, validations, root cause options)
//   3. Add setup.py   (initial Python code shown to the student)
//   4. Optionally add setup.js for JavaScript support
//   5. That's it — it's auto-discovered at build time
//
// See docs/ADDING_CASES.md for the full YAML schema reference.

import type { Case } from '../types'

// Auto-discover all case YAMLs and setup files (Python + JS)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const caseYamls: Record<string, any> = import.meta.glob(
  '../cases/*/case.yaml',
  { eager: true }
)
const caseSetupsPy = import.meta.glob('../cases/*/setup.py', {
  eager: true,
  query: '?raw',
  import: 'default',
})
const caseSetupsJs = import.meta.glob('../cases/*/setup.js', {
  eager: true,
  query: '?raw',
  import: 'default',
})

function getCaseId(path: string): string {
  return path.split('/').at(-2) ?? ''
}

function buildCase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yamlData: any,
  setupCode: string,
  setupCodeJs?: string
): Case {
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  return {
    ...yamlData,
    languages: yamlData.languages ?? ['python'],
    phase1: {
      ...yamlData.phase1,
      initialCode: setupCode,
      ...(setupCodeJs ? { initialCodeJs: setupCodeJs } : {}),
    },
  } as Case
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
}

export function loadCases(): Case[] {
  const caseMap = new Map<
    string,
    { yaml: unknown; code: string; codeJs?: string }
  >()

  for (const [path, module] of Object.entries(caseYamls)) {
    const id = getCaseId(path)
    const entry = caseMap.get(id) ?? { yaml: null, code: '' }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    entry.yaml = module?.default ?? module
    caseMap.set(id, entry)
  }

  for (const [path, code] of Object.entries(caseSetupsPy)) {
    const id = getCaseId(path)
    const entry = caseMap.get(id) ?? { yaml: null, code: '' }
    entry.code = code as string
    caseMap.set(id, entry)
  }

  for (const [path, code] of Object.entries(caseSetupsJs)) {
    const id = getCaseId(path)
    const entry = caseMap.get(id) ?? { yaml: null, code: '' }
    entry.codeJs = code as string
    caseMap.set(id, entry)
  }

  return (
    Array.from(caseMap.values())
      .filter(({ yaml }) => yaml !== null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map(({ yaml, code, codeJs }) => buildCase(yaml as any, code, codeJs))
      .sort((a, b) => {
        const aOrder = (a as unknown as Record<string, number>)['order'] ?? 999
        const bOrder = (b as unknown as Record<string, number>)['order'] ?? 999
        return aOrder - bOrder || a.id.localeCompare(b.id)
      })
  )
}

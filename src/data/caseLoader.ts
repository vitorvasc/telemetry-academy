// Case Loader — auto-discovers all cases from src/cases/<id>/case.yaml
//
// To add a new case:
//   1. Create a folder: src/cases/<id>/
//   2. Add case.yaml  (content, validations, root cause options)
//   3. Add setup.py   (initial Python code shown to the student)
//   4. That's it — it's auto-discovered at build time
//
// See docs/adding_cases.md for the full YAML schema reference.

import type { Case } from '../types';

// Auto-discover all case YAMLs and Python setup files
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const caseYamls: Record<string, any> = import.meta.glob('../cases/*/case.yaml', { eager: true });
const caseSetups = import.meta.glob('../cases/*/setup.py', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function getCaseId(path: string): string {
  // '../cases/001-hello-span/case.yaml' -> '001-hello-span'
  return path.split('/').at(-2) ?? '';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCase(yamlData: any, setupCode: string): Case {
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  return {
    ...yamlData,
    phase1: {
      ...yamlData.phase1,
      initialCode: setupCode,
    },
  } as Case;
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
}

export function loadCases(): Case[] {
  const caseMap = new Map<string, { yaml: unknown; code: string }>();

  for (const [path, module] of Object.entries(caseYamls)) {
    const id = getCaseId(path);
    const entry = caseMap.get(id) ?? { yaml: null, code: '' };
    // vite-plugin-yaml exports default or the object directly
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    entry.yaml = module?.default ?? module;
    caseMap.set(id, entry);
  }

  for (const [path, code] of Object.entries(caseSetups)) {
    const id = getCaseId(path);
    const entry = caseMap.get(id) ?? { yaml: null, code: '' };
    entry.code = code as string;
    caseMap.set(id, entry);
  }

  return Array.from(caseMap.values())
    .filter(({ yaml }) => yaml !== null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map(({ yaml, code }) => buildCase(yaml as any, code))
    .sort((a, b) => {
      // Sort by `order` field if present, else by id
      const aOrder = (a as unknown as Record<string, number>)['order'] ?? 999;
      const bOrder = (b as unknown as Record<string, number>)['order'] ?? 999;
      return aOrder - bOrder || a.id.localeCompare(b.id);
    });
}

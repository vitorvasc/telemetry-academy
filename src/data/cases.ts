// Cases are auto-loaded from src/cases/<id>/case.yaml + setup.py
// To add a new case, see docs/ADDING_CASES.md

import { loadCases } from './caseLoader';

export const cases = loadCases();

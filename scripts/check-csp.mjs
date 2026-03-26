#!/usr/bin/env node
/**
 * CSP Audit Script
 *
 * Verifies that all known external domains used by the app are present
 * in the correct Content-Security-Policy directives in public/_headers.
 *
 * Run: node scripts/check-csp.mjs
 * Or:  npm run check:csp
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const headersPath = resolve(__dirname, '../public/_headers');

// ─── Known external domains ──────────────────────────────────────────────────
// When you add a new external dependency, add it here with the required
// CSP directives and a comment explaining why it's needed.

const REQUIRED_DOMAINS = [
  {
    domain: 'cdn.jsdelivr.net',
    directives: ['script-src', 'connect-src', 'style-src'],
    reason: 'Pyodide WASM runtime + Monaco Editor CSS',
  },
  {
    domain: 'static.cloudflareinsights.com',
    directives: ['script-src', 'connect-src'],
    reason: 'Cloudflare Web Analytics beacon (auto-injected by Cloudflare Pages)',
  },
  {
    domain: 'https://pypi.org',
    directives: ['connect-src'],
    reason: 'micropip fetches package metadata to install opentelemetry-api/sdk',
  },
  {
    domain: 'https://files.pythonhosted.org',
    directives: ['connect-src'],
    reason: 'micropip downloads Python package wheels at runtime',
  },
  {
    domain: 'https://www.googletagmanager.com',
    directives: ['script-src', 'connect-src'],
    reason: 'Google Analytics 4 gtag.js loader',
  },
  {
    domain: 'https://www.google-analytics.com',
    directives: ['connect-src'],
    reason: 'Google Analytics 4 event collection endpoint',
  },
];

// ─── Parse _headers ───────────────────────────────────────────────────────────

function parseCsp(headersFile) {
  const content = readFileSync(headersFile, 'utf8');
  const cspLine = content
    .split('\n')
    .find(line => line.includes('Content-Security-Policy:'));

  if (!cspLine) throw new Error('No Content-Security-Policy header found in _headers');

  const cspValue = cspLine.split('Content-Security-Policy:')[1].trim();
  const directives = {};

  for (const part of cspValue.split(';')) {
    const [name, ...values] = part.trim().split(/\s+/);
    if (name) directives[name] = values;
  }

  return directives;
}

// ─── Run checks ───────────────────────────────────────────────────────────────

const csp = parseCsp(headersPath);
let failures = 0;

for (const { domain, directives, reason } of REQUIRED_DOMAINS) {
  for (const directive of directives) {
    const values = csp[directive] ?? [];
    const present = values.some(v => v === domain || v.startsWith(domain));

    if (!present) {
      console.error(`✗ MISSING: "${domain}" not in ${directive}`);
      console.error(`  Reason: ${reason}`);
      failures++;
    } else {
      console.log(`✓ ${directive}: ${domain}`);
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} CSP check(s) failed. Update public/_headers.`);
  process.exit(1);
} else {
  console.log('\nAll CSP checks passed.');
}

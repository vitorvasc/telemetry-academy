import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, it, expect } from 'vitest'

/**
 * CSP tests — verifies that all known external domains are present in the
 * correct Content-Security-Policy directives in public/_headers.
 *
 * When adding a new external dependency, add it to REQUIRED_DOMAINS below.
 */

const headersPath = resolve(__dirname, '../../public/_headers')

function parseCsp(): Record<string, string[]> {
  const content = readFileSync(headersPath, 'utf8')
  const cspLine = content
    .split('\n')
    .find(line => line.includes('Content-Security-Policy:'))

  if (!cspLine)
    throw new Error(
      'No Content-Security-Policy header found in public/_headers'
    )

  const cspValue = cspLine.split('Content-Security-Policy:')[1].trim()
  const directives: Record<string, string[]> = {}

  for (const part of cspValue.split(';')) {
    const [name, ...values] = part.trim().split(/\s+/)
    if (name) directives[name] = values
  }

  return directives
}

const REQUIRED_DOMAINS: Array<{
  domain: string
  directives: string[]
  reason: string
}> = [
  {
    domain: 'cdn.jsdelivr.net',
    directives: ['script-src', 'connect-src', 'style-src'],
    reason: 'Pyodide WASM runtime + Monaco Editor CSS',
  },
  {
    domain: 'static.cloudflareinsights.com',
    directives: ['script-src', 'connect-src'],
    reason:
      'Cloudflare Web Analytics beacon (auto-injected by Cloudflare Pages)',
  },
  {
    domain: 'https://pypi.org',
    directives: ['connect-src'],
    reason:
      'micropip fetches package metadata to install opentelemetry-api/sdk',
  },
  {
    domain: 'https://files.pythonhosted.org',
    directives: ['connect-src'],
    reason: 'micropip downloads Python package wheels at runtime',
  },
]

describe('Content Security Policy', () => {
  const csp = parseCsp()

  for (const { domain, directives, reason } of REQUIRED_DOMAINS) {
    for (const directive of directives) {
      it(`${directive} includes "${domain}" (${reason})`, () => {
        const values = csp[directive] ?? []
        const present = values.some(v => v === domain || v.startsWith(domain))
        expect(
          present,
          `"${domain}" is missing from ${directive} in public/_headers`
        ).toBe(true)
      })
    }
  }
})

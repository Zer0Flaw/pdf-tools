/**
 * Post-build prerender script.
 * Starts a local static server, visits each route with Puppeteer,
 * waits for the React app to signal readiness, captures the HTML,
 * and writes it to dist/<route>/index.html.
 *
 * Runs via: npm run postbuild (or: node prerender.js)
 */

import { createServer } from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const distDir = join(__dirname, 'dist')
const PORT = 3099

const ROUTES = [
  '/',
  '/edit-pdf',
  '/merge-pdf',
  '/rotate-pdf-pages',
  '/delete-pdf-pages',
  '/reorder-pdf-pages',
  '/extract-pdf-pages',
  '/split-pdf',
  '/images-to-pdf',
  '/pdf-to-image',
  '/compress-images',
  '/error-explain',
  '/about',
  '/privacy',
  '/terms',
  '/contact',
  '/faq',
  // Individual Git error pages
  '/errors/git-not-a-git-repository',
  '/errors/git-remote-origin-already-exists',
  '/errors/git-failed-to-push-refs',
  '/errors/git-refusing-to-merge-unrelated-histories',
  '/errors/git-local-changes-overwritten-by-merge',
  '/errors/git-could-not-resolve-host',
  '/errors/git-src-refspec-does-not-match',
  '/errors/git-destination-path-already-exists',
  '/errors/git-pathspec-did-not-match',
  '/errors/git-no-upstream-branch',
  '/errors/git-merge-conflict',
  '/errors/git-cannot-lock-ref',
  '/errors/git-bad-object-head',
  '/errors/git-resolve-index-first',
  '/errors/git-lf-replaced-by-crlf',
  '/errors/git-authentication-failed',
  '/errors/git-permission-denied-publickey',
  '/errors/git-could-not-read-from-remote',
  '/errors/git-failed-to-push-non-fast-forward',
  '/errors/git-branch-already-exists',
  '/errors/git-cannot-rebase-unstaged',
  '/errors/git-bad-default-revision-head',
  '/errors/git-untracked-files-overwritten',
  '/errors/git-not-a-valid-object-name',
  '/errors/git-commit-or-stash-before-switch',
  '/errors/git-ambiguous-argument',
  '/errors/git-rpc-failed-http-400',
  '/errors/git-loose-object-corrupt',
  '/errors/git-reflog-broken-commit',
  '/errors/git-cannot-pull-rebase-unstaged',
  // Individual npm / Node.js error pages
  '/errors/npm-missing-script-start',
  '/errors/npm-enoent-no-such-file',
  '/errors/npm-eacces-permission-denied',
  '/errors/npm-eresolve-dependency-tree',
  '/errors/npm-peer-dep-missing',
  '/errors/npm-e404-not-found',
  '/errors/npm-elifecycle-exit-status',
  '/errors/npm-eintegrity-checksum-failed',
  '/errors/npm-warn-deprecated',
  '/errors/npm-eperm-operation-not-permitted',
  '/errors/node-cannot-find-module',
  '/errors/node-syntax-error-unexpected-token',
  '/errors/node-syntax-error-import-outside-module',
  '/errors/node-type-error-cannot-read-undefined',
  '/errors/node-type-error-cannot-read-null',
  '/errors/node-range-error-max-call-stack',
  '/errors/node-eaddrinuse-address-already-in-use',
  '/errors/node-enospc-no-space-left',
  '/errors/node-unhandled-promise-rejection',
  '/errors/node-err-module-not-found',
  '/errors/node-err-require-esm',
  '/errors/node-heap-out-of-memory',
  '/errors/npm-eperm-unlink',
  '/errors/npm-ejsonparse-failed-to-parse',
  '/errors/node-self-signed-certificate',
  '/errors/npm-enotempty-directory-not-empty',
  '/errors/node-econnrefused',
  '/errors/npm-etarget-no-matching-version',
  '/errors/node-spawn-enoent',
  '/errors/npm-warn-optional-dependency',
  // Individual Python error pages
  '/errors/python-syntax-error-invalid-syntax',
  '/errors/python-indentation-error-unexpected-indent',
  '/errors/python-indentation-error-expected-block',
  '/errors/python-name-error-not-defined',
  '/errors/python-type-error-nonetype-not-subscriptable',
  '/errors/python-type-error-nonetype-not-iterable',
  '/errors/python-type-error-str-concatenation',
  '/errors/python-type-error-unsupported-operand',
  '/errors/python-type-error-missing-positional-argument',
  '/errors/python-attribute-error-nonetype',
  '/errors/python-attribute-error-module',
  '/errors/python-import-error-no-module',
  '/errors/python-module-not-found-error',
  '/errors/python-file-not-found-error',
  '/errors/python-key-error',
  '/errors/python-index-error-list-out-of-range',
  '/errors/python-value-error-invalid-literal-int',
  '/errors/python-value-error-too-many-values',
  '/errors/python-zero-division-error',
  '/errors/python-recursion-error-max-depth',
  '/errors/python-permission-error',
  '/errors/python-os-error-no-space',
  '/errors/python-connection-refused-error',
  '/errors/python-unicode-decode-error',
  '/errors/python-json-decode-error',
  '/errors/python-stop-iteration',
  '/errors/python-runtime-error-dict-changed-size',
  '/errors/python-overflow-error-int-too-large',
  '/errors/python-memory-error',
  '/errors/python-pip-no-matching-distribution',
  // Individual TypeScript error pages
  '/errors/ts-void-not-assignable',
  '/errors/ts-enum-not-assignable',
  '/errors/ts-type-not-assignable',
  '/errors/ts-property-does-not-exist',
  '/errors/ts-argument-not-assignable',
  '/errors/ts-object-possibly-null',
  '/errors/ts-object-possibly-undefined',
  '/errors/ts-property-missing-in-type',
  '/errors/ts-expected-arguments',
  '/errors/ts-no-overload-matches',
  '/errors/ts-conversion-may-be-mistake',
  '/errors/ts-did-you-mean-property',
  '/errors/ts-cannot-find-module',
  '/errors/ts-has-no-exported-member',
  '/errors/ts-cannot-find-name',
  '/errors/ts-has-no-default-export',
  '/errors/ts-cannot-use-import-outside-module',
  '/errors/ts-cannot-find-tsconfig',
  '/errors/ts-jsx-not-allowed',
  '/errors/ts-decorators-not-enabled',
  '/errors/ts-implicit-any',
  '/errors/ts-no-implicit-returns',
  '/errors/ts-possibly-undefined-array',
  '/errors/ts-not-all-paths-return',
  '/errors/ts-spread-must-have-tuple',
  '/errors/ts-cannot-assign-readonly',
  '/errors/ts-type-unknown-no-property',
  '/errors/ts-generic-constraint',
  '/errors/ts-index-signature-missing',
  '/errors/ts-this-implicitly-any',
]

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
}

function startServer() {
  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      const rawPath = req.url.split('?')[0]
      let filePath = join(distDir, rawPath === '/' ? 'index.html' : rawPath)

      // SPA fallback: no extension → serve index.html
      if (!extname(filePath)) {
        filePath = join(distDir, 'index.html')
      }

      try {
        const data = await readFile(filePath)
        const mime = MIME[extname(filePath)] || 'application/octet-stream'
        res.writeHead(200, { 'Content-Type': mime })
        res.end(data)
      } catch {
        try {
          const data = await readFile(join(distDir, 'index.html'))
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(data)
        } catch {
          res.writeHead(404)
          res.end('Not found')
        }
      }
    })

    server.on('error', reject)
    server.listen(PORT, () => resolve(server))
  })
}

async function prerenderRoute(page, route) {
  const url = `http://localhost:${PORT}${route}`

  // Inject listener BEFORE navigation so it catches the event if it fires early
  await page.evaluateOnNewDocument(() => {
    document.addEventListener('prerender-ready', () => {
      window.__prerenderReady = true
    })
  })

  await page.goto(url, { waitUntil: 'domcontentloaded' })

  // Wait for app to signal prerender-ready (dispatched in Root useEffect)
  await page.waitForFunction('window.__prerenderReady === true', { timeout: 10000 })

  return page.content()
}

async function writeRouteHtml(route, html) {
  if (route === '/') {
    await writeFile(join(distDir, 'index.html'), html, 'utf8')
  } else {
    const routeDir = join(distDir, route.slice(1))
    await mkdir(routeDir, { recursive: true })
    await writeFile(join(routeDir, 'index.html'), html, 'utf8')
  }
}

async function main() {
  console.log('Starting prerender...')
  const server = await startServer()

  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  page.on('console', () => {})
  page.on('pageerror', () => {})

  let failed = 0

  try {
    for (const route of ROUTES) {
      process.stdout.write(`  ${route} ... `)
      try {
        const html = await prerenderRoute(page, route)
        await writeRouteHtml(route, html)
        console.log('done')
      } catch (err) {
        console.log(`FAILED (${err.message})`)
        failed++
      }
    }
  } finally {
    await browser.close()
    server.close()
  }

  if (failed > 0) {
    console.error(`\nPrerender finished with ${failed} failure(s).`)
    process.exit(1)
  } else {
    console.log('\nPrerender complete.')
  }
}

main().catch((err) => {
  console.error('Prerender error:', err)
  process.exit(1)
})

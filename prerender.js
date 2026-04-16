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

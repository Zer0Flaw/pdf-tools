# PROJECT CONTEXT — ProjectStack

## PROJECT TYPE
Browser-based SaaS (React, client-side only)

## CORE GOAL
Build a monetizable file utility platform with:
- strong UX consistency
- clear free vs premium constraints
- scalable multi-tool architecture
- future expansion beyond PDFs and into developer utilities

---

## CURRENT ARCHITECTURE

Framework:
- React 19 (Vite 8)
- JavaScript (NO TypeScript)

Libraries:
- pdf-lib (PDF creation and manipulation)
- pdfjs-dist (PDF page rendering and previews)
- dnd-kit (drag-and-drop reorder in editor and multi-file tools)
- @clerk/clerk-react (authentication — Google OAuth + email/password)

Dev dependencies:
- puppeteer (prerendering — postbuild script only)

NO backend. Routing is manual via pushState + popstate in App.jsx.
Auth is client-side only via Clerk. Subscription status is fetched from an external Cloudflare Worker.

---

## FILE STRUCTURE

```
src/
  App.jsx                  — main shell, routing, metadata, view switching, subscription wrapper
  App.css                  — app shell layout
  index.css                — all component and tool styles (centralized, ~4000 lines)
  main.jsx                 — React entry point (conditionally wraps with ClerkProvider)
  components/
    AdSlot.jsx             — ad placement wrapper (AdSense, placeholder modes)
    ErrorDetailPage.jsx    — individual error page rendered at /errors/[slug]
    LandingPage.jsx        — marketing homepage (File Tools + Developer Tools sections)
    LockedToolCard.jsx     — premium tool placeholder (unused currently)
    ScrollToTop.jsx        — scroll reset on route change
    SiteFooter.jsx         — global footer with support page links
    SupportPage.jsx        — About, Privacy, Terms, Contact, FAQ pages
    ToolNav.jsx            — workspace tool switcher (grouped dropdowns)
    ToolSeoContent.jsx     — below-tool SEO sections (benefits, steps, FAQs, related tools)
    UpgradeBanner.jsx      — free tier banner + upgrade modal (wires to Stripe or sign-in)
    UserAuthButton.jsx     — Clerk sign-in/out button + Pro badge + Manage Subscription link
  data/
    errorDatabase.js       — 90+ curated error entries (Git, npm/Node.js, Python)
  tools/
    EditPdfTool.jsx        — flagship editor (~2930 lines, reducer-based, Fill & Sign)
    MergeTool.jsx          — multi-file merge with watermark + daily removal
    SplitTool.jsx          — single-file split to individual page downloads
    RotatePdfTool.jsx      — single-file page rotation
    DeletePdfPagesTool.jsx — single-file page deletion
    ReorderPdfPagesTool.jsx — single-file drag reorder
    ExtractPdfPagesTool.jsx — single-file page extraction
    ImagesToPdfTool.jsx    — multi-image to PDF with watermark
    PdfToImageTool.jsx     — PDF pages to PNG downloads
    CompressTool.jsx       — canvas-based image compression (not PDF compression)
    ErrorTranslatorTool.jsx — text-input error lookup (no file processing)
  utils/
    accessibility.js       — activateOnEnterOrSpace helper
    adConfig.js            — AdSense config, placement definitions, env-driven toggles
    analytics.js           — lightweight event tracking (trackEvent)
    errorMatcher.js        — regex + fuzzy keyword matching against errorDatabase
    features.js            — FEATURE_GATES per tool (file limits, premium flags)
    fileNaming.js          — getBaseFileName, getDateStamp helpers
    formatting.js          — formatBytes helper
    freeTier.js            — daily export limits + daily watermark removal (localStorage)
    pdfPageOperations.js   — shared PDF ops (rotate, delete, reorder, extract, edit)
    pdfPagePreviews.js     — pdfjs-dist page-to-canvas preview generation
    pdfValidation.js       — file type and size validation
    subscription.jsx       — SubscriptionProvider context + useSubscription hook
    upgradeReasons.js      — upgrade reason constants + trackUpgradeIntent
prerender.js               — postbuild prerender script (Puppeteer, generates static HTML for all routes)
```

---

## TOOL SYSTEM

There are 11 tools organized into two groups:

**File Tools (10):** edit, merge, split, rotate, delete, reorder, extract, images, pdfToImage, compress

**Developer Tools (1):** errorExplain (Error Translator — text input, no file processing)

TOOL_ROUTES:
```
edit          → /edit-pdf
merge         → /merge-pdf
rotate        → /rotate-pdf-pages
delete        → /delete-pdf-pages
reorder       → /reorder-pdf-pages
extract       → /extract-pdf-pages
split         → /split-pdf
images        → /images-to-pdf
pdfToImage    → /pdf-to-image
compress      → /compress-images
errorExplain  → /error-explain
```

Error detail pages live at `/errors/[slug]` — rendered as a separate view (errorPage), not a tool workspace.

VALID_VIEWS: home, workspace, support, errorPage

### Required UI Structure for File Tools (DO NOT BREAK)

1. tool-header — title, description (tool-sub), free-badge
2. UpgradeBanner — customized per tool with feature list
3. drop-zone — drag + click upload, disabled state during processing
4. usage-indicator — shows free tier limits and trust message
5. inline-message — error/success feedback, auto-dismissed after 3500ms
6. file-list (if multi-file tool) — sortable via dnd-kit, remove + reorder
7. primary action button (merge-btn class) — disabled during processing
8. AdSlot — post-export ad placement
9. ToolSeoContent — rendered below workspace in App.jsx (not inside tools)

### ErrorTranslatorTool is different from file tools

- Text input (textarea), not a file drop zone
- No file processing, no watermarks, no daily export limit
- Matches pasted input against errorDatabase via errorMatcher.js
- Displays explanation + causes + fix steps inline
- Links to individual error detail pages at /errors/[slug]

### EditPdfTool is the exception among file tools

EditPdfTool extends the base pattern with:
- Reducer-based state (editPdfEditorReducer) instead of flat useState
- Thumbnail rail with drag-and-drop page reordering (left sidebar)
- Main viewer with layered surface (document shell → overlay surface → signature layer)
- Fill & Sign system (signatures, text, date, initials)
- Placed object drag repositioning, selection, resize via scale slider
- Export flattening via buildFlattenedPdfWithFillObjects (local to EditPdfTool)
- All overlay editing logic stays inside EditPdfTool — do NOT move to shared operations

---

## STATE PATTERN (CONSISTENT for file tools)

Each standard file tool MUST use:
- files OR file (depending on single vs multi-file)
- isProcessing (or tool-specific: isMerging, isConverting, isCompressing)
- message (object: { type, text }) — auto-dismissed
- isDragOver (for drop zone hover state)
- isPremium (from useSubscription — real premium status)
- showExportAd (controls post-export AdSlot visibility)

EditPdfTool uses useReducer for editor state. See createInitialEditorState() for shape.

---

## FREE TIER RULES

Enforced at file intake (NOT at export time):

All tools: max 5MB per file

Merge: max 3 PDFs, watermark applied on export
Images → PDF: max 5 images, watermark applied on export
Split: max 1 PDF
Compress: max 5 images
Edit PDF: max 1 PDF
Rotate/Delete/Reorder/Extract: max 1 PDF
PDF to Image: max 1 PDF

**Daily export limit:** 5 exports per day across all file tools (tracked in localStorage via freeTier.js, resets at midnight). Premium users bypass this limit entirely.

**Watermarks** applied on PDF exports from: Edit, Merge, Rotate, Delete, Reorder, Extract, Images→PDF. Premium users export without watermarks.

**Daily watermark-free export:** free users get 1 watermark-free export per day (legacy feature in freeTier.js, currently used by MergeTool).

Premium users bypass all restrictions: no watermarks, no daily export cap, no upgrade banners, Pro badge shown in header.

---

## AUTH SYSTEM

Provider: Clerk (clerk.com)
SDK: @clerk/clerk-react

- ClerkProvider is conditionally applied in main.jsx — only when VITE_CLERK_PUBLISHABLE_KEY is set
- AppSubscriptionWrapper in App.jsx detects Clerk availability and routes accordingly:
  - With Clerk: AppWithSubscription calls useUser() to get the signed-in email, passes it to SubscriptionProvider
  - Without Clerk: SubscriptionProvider receives email=null (isPremium always false)
- Supported sign-in methods: Google OAuth + email/password
- Sign-in opens as an in-page modal (mode="modal")
- UserAuthButton component:
  - Renders nothing if Clerk is unavailable
  - SignedOut state: shows "Sign In" button
  - SignedIn state: shows Pro badge (if premium) + Manage Subscription button (if premium) + Clerk UserButton avatar
- NEVER call useUser() or any Clerk hooks outside components guaranteed to be inside ClerkProvider

Required env variable: VITE_CLERK_PUBLISHABLE_KEY

---

## SUBSCRIPTION SYSTEM

- SubscriptionProvider (subscription.jsx) wraps the entire app
- Fetches subscription status from an external Cloudflare Worker using the signed-in user's email
- useSubscription() hook returns: { isPremium: boolean, status: string, loading: boolean }
- When no email or no worker URL is present, isPremium is always false
- The external worker (separate repo: subscription-worker) handles:
  - Stripe webhook processing (subscription created, updated, cancelled)
  - GET /status?email=... → returns { isPremium, status }
  - POST /portal → creates Stripe Customer Portal session, returns { url }
- Premium tier: $9.99/month via Stripe Payment Link
- Manage Subscription button in UserAuthButton calls /portal to open Stripe Customer Portal
- Upgrade modal behavior:
  - Signed-out users see "Sign in to upgrade"
  - Signed-in non-premium users see link to Stripe checkout

Required env variable: VITE_SUBSCRIPTION_WORKER_URL

---

## ERROR TRANSLATOR

Files: ErrorTranslatorTool.jsx (tool), errorDatabase.js (data), errorMatcher.js (matching), ErrorDetailPage.jsx (detail pages)

- Client-side error matching — no server calls, no AI
- Current coverage: Git (30), npm/Node.js (30), Python (30) = 90+ errors
- Each entry shape: id, slug, ecosystem, pattern (RegExp), title, shortTitle, explanation, causes[], fixes[], example, tags[], searchTerms[]
- Matching: regex pattern test first; fuzzy keyword scoring as fallback (score threshold > 3)
- Individual error pages prerendered at /errors/[slug] for SEO
- ErrorDetailPage links back to the Error Translator workspace
- Designed to expand to more ecosystems (Docker, React, TypeScript, etc.)

Exported from errorMatcher.js: matchError(input), getErrorBySlug(slug), getErrorsByEcosystem(ecosystem)

---

## AD SYSTEM

Provider: Google AdSense (scaffolded, application submitted, pending approval)
Control: VITE_ADS_ENABLED env variable (currently false)
Placements: postExport, upgradeModal, landingFooter, toolSeoFooter, supportFooter
Placeholder rendering is active when ads are disabled but placements are configured.

---

## ANALYTICS

Lightweight event-based tracking via trackEvent():
- tool_opened, file_uploaded, file_removed, files_reordered
- process_started, process_completed, export_downloaded
- upgrade_banner_viewed, upgrade_cta_clicked
- free_limit_encountered, watermark_free_export_used
- ad_viewed

---

## PRERENDERING

Script: prerender.js (runs automatically as `npm run postbuild`)

- Starts a local static server on port 3099 serving the built dist folder
- Visits each route with Puppeteer, waits for the React app to signal readiness
- Captures rendered HTML and writes to dist/<route>/index.html
- Currently covers 107+ routes: all tool pages, support pages, and individual error pages (/errors/[slug])
- Critical for SEO (Google indexes prerendered HTML) and AdSense approval

**IMPORTANT: Cloudflare Pages build environment cannot run Puppeteer.**
Always build and prerender locally. Never rely on Cloudflare's Git-triggered build pipeline.

---

## DEPLOYMENT PROCESS

1. Build locally: `npm run build` (Vite build + postbuild prerender runs automatically)
2. Deploy: `wrangler pages deploy dist --project-name=projectstack`
3. Do NOT push to trigger a Cloudflare build — Puppeteer will fail in that environment

Set env variables in .env.local for local builds. Also set them in the Cloudflare Pages dashboard for reference (they are not used during Cloudflare's CI build since we deploy manually).

---

## ENVIRONMENT VARIABLES

| Variable | Purpose |
|---|---|
| VITE_CLERK_PUBLISHABLE_KEY | Clerk auth — enables ClerkProvider and UserAuthButton |
| VITE_SUBSCRIPTION_WORKER_URL | Subscription status API (external Cloudflare Worker) |
| VITE_ADS_ENABLED | Toggle AdSense rendering (true/false) |
| VITE_AD_SLOT_* | AdSense slot IDs (configure when AdSense is approved) |

All variables are VITE_ prefixed (exposed to the client bundle). No secrets or private keys belong here.

---

## HARD RULES

DO NOT:
- introduce additional backend or server-side processing (the subscription Cloudflare Worker is already in place; do not add more)
- introduce routing libraries (manual pushState routing is intentional)
- introduce large new dependencies without explicit justification
- refactor existing working tools unless explicitly asked
- break UI consistency between tools
- change CSS class naming conventions
- modify shared pdfPageOperations unless necessary
- move overlay/fill logic out of EditPdfTool
- rewrite the editor architecture
- modify monetization or analytics systems without review
- call useUser() or any Clerk hook outside components guaranteed to be inside ClerkProvider
- hardcode isPremium = false — always use useSubscription()

---

## UX PRINCIPLES

- No alert() calls — use inline-message component pattern
- Always disable UI during processing
- Keep interactions predictable across tools
- Maintain identical layout patterns for standard file tools
- Messages auto-dismiss after 3500ms
- Free tier limits enforced at intake, not export
- Premium state comes from useSubscription() — never assume free

---

## PRODUCT STRATEGY

This is a real SaaS MVP, not a demo:
- UX matters more than features
- Consistency matters more than complexity
- Perceived value > technical cleverness
- Monetization: AdSense (pending approval) + Stripe subscriptions (live at $9.99/month)

---

## CLAUDE CODE WORKING RULES

When making changes:

1. ALWAYS match existing tool patterns
2. REUSE logic from existing tools — MergeTool for multi-file, SplitTool for single-file
3. DO NOT invent new patterns or abstractions
4. KEEP changes minimal and surgical
5. If unsure about UI pattern → follow MergeTool as the source of truth
6. If unsure about editor pattern → follow EditPdfTool's existing structure
7. Test that inline-message, processing states, and free tier limits work after changes
8. Do not expand scope outside the current task
9. Get premium status from useSubscription() — never hardcode
10. New error entries go in errorDatabase.js — follow the existing entry shape exactly

---

## SUCCESS CRITERIA

Any new code must:
- visually match existing tools
- follow same state structure
- enforce free-tier limits
- avoid breaking current functionality
- maintain CSS class naming conventions
- work with the existing ad, analytics, auth, and subscription systems

---

## INTENT

This project should feel like:
→ a real product someone would pay for

NOT:
→ a random utility collection

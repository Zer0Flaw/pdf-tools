# PROJECT CONTEXT — ProjectStack

## PROJECT TYPE
Browser-based SaaS (React, client-side only)

## CORE GOAL
Build a monetizable file utility platform with:
- strong UX consistency
- clear free vs premium constraints
- scalable multi-tool architecture
- future expansion beyond PDFs

---

## CURRENT ARCHITECTURE

Framework:
- React 19 (Vite 8)
- JavaScript (NO TypeScript)

Libraries:
- pdf-lib (PDF creation and manipulation)
- pdfjs-dist (PDF page rendering and previews)
- dnd-kit (drag-and-drop reorder in editor and multi-file tools)

NO backend, NO auth, NO database, NO routing library

All processing is client-side. Routing is manual via pushState + popstate in App.jsx.

---

## FILE STRUCTURE

```
src/
  App.jsx                  — main shell, routing, metadata, view switching
  App.css                  — app shell layout
  index.css                — all component and tool styles (centralized, ~4000 lines)
  main.jsx                 — React entry point
  components/
    AdSlot.jsx             — ad placement wrapper (AdSense, placeholder modes)
    LandingPage.jsx        — marketing homepage
    LockedToolCard.jsx     — premium tool placeholder (unused currently)
    ScrollToTop.jsx        — scroll reset on route change
    SiteFooter.jsx         — global footer with support page links
    SupportPage.jsx        — About, Privacy, Terms, Contact, FAQ pages
    ToolNav.jsx            — workspace tool switcher (grouped dropdowns)
    ToolSeoContent.jsx     — below-tool SEO sections (benefits, steps, FAQs, related tools)
    UpgradeBanner.jsx      — free tier banner + upgrade modal (UI only, no payments)
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
  utils/
    accessibility.js       — activateOnEnterOrSpace helper
    adConfig.js            — AdSense config, placement definitions, env-driven toggles
    analytics.js           — lightweight event tracking (trackEvent)
    features.js            — FEATURE_GATES per tool (file limits, premium flags)
    fileNaming.js          — getBaseFileName, getDateStamp helpers
    formatting.js          — formatBytes helper
    freeTier.js            — daily watermark removal (localStorage-based)
    pdfPageOperations.js   — shared PDF ops (rotate, delete, reorder, extract, edit)
    pdfPagePreviews.js     — pdfjs-dist page-to-canvas preview generation
    pdfValidation.js       — file type and size validation
    upgradeReasons.js      — upgrade reason constants + trackUpgradeIntent
```

---

## TOOL SYSTEM

Each tool follows a STRICT shared pattern:

### Required UI Structure (DO NOT BREAK)

1. tool-header — title, description (tool-sub), free-badge
2. UpgradeBanner — customized per tool with feature list
3. drop-zone — drag + click upload, disabled state during processing
4. usage-indicator — shows free tier limits and trust message
5. inline-message — error/success feedback, auto-dismissed after 3500ms
6. file-list (if multi-file tool) — sortable via dnd-kit, remove + reorder
7. primary action button (merge-btn class) — disabled during processing
8. AdSlot — post-export ad placement
9. ToolSeoContent — rendered below workspace in App.jsx (not inside tools)

### EditPdfTool is the exception

EditPdfTool extends the base pattern with:
- Reducer-based state (editPdfEditorReducer) instead of flat useState
- Thumbnail rail with drag-and-drop page reordering (left sidebar)
- Main viewer with layered surface (document shell → overlay surface → signature layer)
- Fill & Sign system (signatures, text, date, initials)
- Placed object drag repositioning, selection, resize via scale slider
- Export flattening via buildFlattenedPdfWithFillObjects (local to EditPdfTool)
- All overlay editing logic stays inside EditPdfTool — do NOT move to shared operations

---

## STATE PATTERN (CONSISTENT)

Each standard tool MUST use:
- files OR file (depending on single vs multi-file)
- isProcessing (or tool-specific: isMerging, isConverting, isCompressing)
- message (object: { type, text }) — auto-dismissed
- isDragOver (for drop zone hover state)
- isPremium (currently always false)
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

Daily watermark removal exists in freeTier.js but is only used by MergeTool currently.

---

## AD SYSTEM

Provider: Google AdSense (scaffolded, not yet approved)
Control: VITE_ADS_ENABLED env variable (currently false)
Placements: postExport, upgradeModal, landingFooter, toolSeoFooter, supportFooter
State: pending AdSense approval — Google flagged "screens without publisher content"
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

## HARD RULES

DO NOT:
- introduce backend or server-side processing
- introduce auth or user accounts
- introduce routing libraries (manual pushState routing is intentional)
- introduce large new dependencies without explicit justification
- refactor existing working tools unless explicitly asked
- break UI consistency between tools
- change CSS class naming conventions
- modify shared pdfPageOperations unless necessary
- move overlay/fill logic out of EditPdfTool
- rewrite the editor architecture
- modify monetization or analytics systems without review

---

## UX PRINCIPLES

- No alert() calls — use inline-message component pattern
- Always disable UI during processing
- Keep interactions predictable across tools
- Maintain identical layout patterns for standard tools
- Messages auto-dismiss after 3500ms
- Free tier limits enforced at intake, not export

---

## PRODUCT STRATEGY

This is a real SaaS MVP, not a demo:
- UX matters more than features
- Consistency matters more than complexity
- Perceived value > technical cleverness
- Monetization path: AdSense (immediate) → Stripe subscriptions (future)

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

---

## SUCCESS CRITERIA

Any new code must:
- visually match existing tools
- follow same state structure
- enforce free-tier limits
- avoid breaking current functionality
- maintain CSS class naming conventions
- work with the existing ad and analytics systems

---

## INTENT

This project should feel like:
→ a real product someone would pay for

NOT:
→ a random utility collection

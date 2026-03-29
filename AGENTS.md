# 🧠 PROJECT CONTEXT — ProjectStack

## PROJECT TYPE
Browser-based SaaS (React, client-side only)

## CORE GOAL
Build a monetizable file utility platform with:
- strong UX consistency
- clear free vs premium constraints
- scalable multi-tool architecture
- future expansion beyond PDFs

---

## 🧱 CURRENT ARCHITECTURE

Framework:
- React (Vite)
- JavaScript (NO TypeScript)

Libraries:
- pdf-lib (PDF operations)
- dnd-kit (drag + reorder)

NO backend, NO auth, NO database

All processing is client-side.

---

## 🧩 TOOL SYSTEM

Each tool follows a STRICT shared pattern:

### Required UI Structure (DO NOT BREAK)

1. tool-header
   - title
   - description (tool-sub)
   - free-badge (if not premium)

2. UpgradeBanner (customized per tool)

3. drop-zone
   - drag + click upload
   - disabled state during processing

4. usage-indicator
   - shows free tier limits

5. inline-message
   - error/success feedback
   - auto-dismissed

6. file-list (if multi-file tool)
   - sortable (dnd-kit)
   - remove + reorder

7. primary action button (merge-btn)

---

## 🔁 STATE PATTERN (CONSISTENT)

Each tool MUST use:

- files OR file
- isProcessing / isMerging / isConverting / isCompressing
- message (object: { type, text })
- isDragOver
- isPremium (currently always false)

---

## 💰 FREE TIER RULES

These MUST be enforced at file intake (NOT later):

Merge:
- max 3 PDFs
- max 5MB per file
- watermark applied

Images → PDF:
- max 5 images
- max 5MB each
- watermark applied

Split:
- max 5MB file

Compress:
- max 5 images
- max 5MB each

---

## 🚫 HARD RULES

DO NOT:
- introduce backend
- introduce auth
- introduce routing libraries
- refactor existing working tools unless explicitly asked
- break UI consistency between tools
- change CSS class naming conventions

---

## 🎯 UX PRINCIPLES

- No alerts() → use inline-message
- Always disable UI during processing
- Keep interactions predictable across tools
- Maintain identical layout patterns

---

## 🧠 PRODUCT STRATEGY

This is NOT a demo project.

This is a real SaaS MVP:
- UX matters more than features
- consistency matters more than complexity
- perceived value > technical cleverness

---

## 📦 CURRENT TOOLS

MergeTool.jsx
- fully functional
- sortable queue
- watermark

ImagesToPdfTool.jsx
- fully functional
- sortable
- watermark

SplitTool.jsx
- single file
- multi-download output

CompressTool.jsx
- image compression (canvas-based)
- NOT true PDF compression yet

---

## 🧪 CURRENT ADDITIONS

- LandingPage.jsx (marketing front)
- UpgradeBanner now accepts props
- Upgrade modal exists (UI only, no payments)

---

## 🚧 NEXT PRIORITIES

1. Improve Compress Tool (future PDF compression)
2. UX consistency pass across all tools
3. Branding layer (light, not over-engineered)
4. Landing page polish

---

## 🧠 CODEX WORKING RULES

When making changes:

1. ALWAYS match existing tool patterns
2. REUSE logic from MergeTool / ImagesToPdfTool
3. DO NOT invent new patterns
4. KEEP changes minimal and surgical
5. If unsure → follow MergeTool as the source of truth

---

## ✅ SUCCESS CRITERIA

Any new code must:
- visually match existing tools
- follow same state structure
- enforce free-tier limits
- avoid breaking current functionality

---

## 🔥 INTENT

This project should feel like:
👉 a real product someone would pay for

NOT:
👉 a random utility collection

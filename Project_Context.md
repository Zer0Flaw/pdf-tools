# PROJECTSTACK – DEVELOPMENT CONTEXT

ProjectStack is a browser-based SaaS utility platform providing client-side file tools.

Live domain:
https://projectstack.cc

Hosting:
Cloudflare Pages

Framework:
React + Vite

All file processing occurs locally in the browser. No backend services are used.

---

# CORE PRODUCT

ProjectStack currently provides four tools:

Merge PDF
Split PDF
Images to PDF
Compress Images

All tools share the same architecture and UI patterns.

---

# PRODUCT PRINCIPLES

ProjectStack follows a freemium SaaS model where basic functionality is free and advanced capabilities are gated behind premium features. Freemium models attract large user bases and monetize through premium upgrades or advertising. :contentReference[oaicite:0]{index=0}

Key design rules:

- All file processing must remain client-side.
- Tools must remain fast and frictionless.
- Monetization must not interrupt core workflows.
- Ads must appear only after successful exports.

---

# CURRENT FEATURES

## Tools

MergeTool.jsx
SplitTool.jsx
ImagesToPdfTool.jsx
CompressTool.jsx

Each tool includes:

drag/drop upload
usage limits
upgrade banner
post-export messaging
trust indicators
processing indicators
post-export ad slot

---

# MONETIZATION SYSTEM

Freemium model:

Free tier limits include:

merge: max files
images to pdf: max images
compress: max images
watermark applied to some exports

Upgrade incentives:

remove watermark permanently
increase file limits
unlock premium features

---

# DAILY FREE FEATURE

Feature:
Remove watermark once per day.

Implementation:

freeTier.js
localStorage tracking

States:

available
armed
used_today

User flow:

click "Remove watermark free today"
next export is watermark-free
usage stored locally
feature disabled until next day

---

# PREMIUM INFRASTRUCTURE

files:

features.js
upgradeReasons.js

These manage:

feature gates
upgrade triggers
limit messages

Premium features planned:

unlimited merges
unlimited images
watermark-free exports
larger file sizes

Payments not yet implemented.

---

# AD INFRASTRUCTURE

files:

AdSlot.jsx
adConfig.js

Ad placements allowed:

postExport
upgradeModal
landingFooter

Ads must never appear before tool value is delivered.

Ad networks not yet integrated.

---

# ANALYTICS

analytics.js helper tracks:

tool_selected
export_success
upgrade_clicked
watermark_removed
ad_viewed

Analytics currently lightweight and client-side.

---

# SEO STRUCTURE

SEO routes implemented:

/merge-pdf
/split-pdf
/images-to-pdf
/compress-images

Each route includes:

H1 heading
intro paragraph
tool component
tool-specific metadata

robots.txt and sitemap.xml implemented.

---

# TRUST SIGNALS

Landing page includes:

Why ProjectStack section

Trust indicators:

files processed locally
no uploads required
no sign-in required
fast processing

This is a key conversion driver.

---

# LANDING PAGE

Hero
Tool grid
Trust section
CTA to workspace
Tool discovery links

---

# PERSISTENCE

localStorage used for:

last tool selected
last view
daily watermark feature
upgrade intent tracking

---

# ADS STRATEGY

Ads support free users but are not primary revenue.

Ads appear only after value is delivered.

Freemium strategy relies on:

free adoption
upgrade triggers
premium conversions

Freemium software often uses hybrid revenue streams combining ads and premium subscriptions. :contentReference[oaicite:1]{index=1}

---

# CURRENT STATE

ProjectStack now includes:

functional tools
SEO pages
upgrade system
daily unlock feature
ad infrastructure
analytics hooks
trust messaging
domain deployment

The product is ready for:

traffic
user testing
ad integration
premium experiments

---

# NEXT DEVELOPMENT PRIORITIES

Priority order:

1. analytics validation
2. ad network integration
3. SEO content pages
4. premium subscription system
5. additional tools

---

# RULES FOR FUTURE CHANGES

Do not break existing tools.

Do not introduce server-side processing.

Do not place ads inside tool workflows.

Maintain consistent UI patterns.

Prefer modular additions rather than refactors.

---

# SUCCESS METRICS

ProjectStack success will be measured by:

organic traffic
export completions
upgrade clicks
watermark unlock usage
premium conversions

---

# END CONTEXT
# ProjectStack Backlog

## Completed
- Edit PDF tool with reducer-based editor, thumbnail rail, drag reorder
- Fill & Sign system (signatures, text, date, initials, placed objects, export flattening)
- Full 10-tool suite (Edit, Merge, Split, Rotate, Delete, Reorder, Extract, Images→PDF, PDF→Image, Compress)
- Landing page with tool grid, benefit sections, CTA
- Branding (logo, mark, color theme with indigo accent)
- ToolSeoContent for all 10 tools (benefits, steps, FAQs, related tools)
- Support pages (About, Privacy, Terms, Contact, FAQ)
- AdSense scaffolding with env-driven placement system
- UpgradeBanner with modal (UI only)
- Free tier gating (file count, file size limits per tool)
- Watermark system for Merge and Images→PDF
- Daily watermark-free export (1x per day via localStorage)
- Analytics event tracking
- Meta tags and SEO metadata per tool route
- Sitemap and robots.txt


## Now — Monetization Blockers

### AdSense Approval
- Add richer informational content to homepage and tool workspace pages
- Google flagged "screens without publisher content"
- Existing ToolSeoContent and support pages are not enough
- Need visible educational/explainer content on ad-serving pages

### Free Tier Tightening
- Most tools have no friction beyond 5MB cap (which most users never hit)
- Consider daily usage caps or session-based limits
- Consider extending watermark to more export paths
- Strengthen the free→premium pressure without degrading UX

### Upgrade Path
- Upgrade modal currently closes with no action
- Add Stripe Payment Links or Checkout (client-side, no backend needed)
- Wire upgrade modal CTA to real payment flow


## Next — Polish and Consistency

### Cross-Tool UI Consistency Pass
- Merge PDF
- Split PDF
- Images → PDF
- PDF → Image
- Ensure identical spacing, drop zone behavior, message patterns

### Editor QA and Polish
- Interaction clarity refinements
- Selection state visual clarity
- Viewer hierarchy polish
- Fill & Sign placement edge cases

### Context File Maintenance
- Keep AGENTS.md and BACKLOG.md current after each development phase
- Update Project_Context.md if architecture changes


## Future — Features

### Document Features
- Annotation system
- Watermark tool (add watermarks to PDFs)
- Page numbering
- Form field expansion
- Template-based document workflows

### Signature Improvements
- Drawn signature (canvas-based freehand)
- Signature management (delete saved signatures)

### Platform
- Stripe subscription integration
- Premium feature gating (runtime, not just UI)
- Desktop app (Electron or Tauri)
- Expand beyond PDF (Word, Excel, image editing)

### Marketing
- Social media pages
- Google Search Console optimization
- Content marketing / blog
- Backlink strategy


## Icebox
- Watch ad to remove watermark (rewarded ad flow)
- True PDF compression (beyond image compression)
- Carbon Ads integration as AdSense alternative
- Multi-language support

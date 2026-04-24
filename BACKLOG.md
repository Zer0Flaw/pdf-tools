# ProjectStack Backlog

## Completed

### Core Tools
- Edit PDF tool with reducer-based editor, thumbnail rail, drag reorder
- Fill & Sign system (signatures, text, date, initials, placed objects, export flattening)
- Full 10-tool file suite (Edit, Merge, Split, Rotate, Delete, Reorder, Extract, Images→PDF, PDF→Image, Compress)
- ToolSeoContent for all 10 file tools (benefits, steps, FAQs, related tools)

### Developer Tools
- Error Translator tool (text-input, no file processing)
- Error database with 90+ errors: Git (30), npm/Node.js (30), Python (30)
- Individual prerendered error pages at /errors/[slug] for SEO

### Auth & Subscriptions
- Clerk authentication with Google OAuth + email/password sign-in
- ClerkProvider conditionally applied — safe when key is absent
- Stripe subscription at $9.99/month via Payment Link
- Cloudflare Worker handling Stripe webhooks and subscription status API
- Subscription status checking (useSubscription hook) and premium feature gating
- Stripe Customer Portal integration (Manage Subscription button for premium users)
- Pro badge shown in header for premium users

### Free Tier & Monetization
- Free tier gating (file count, file size limits per tool)
- Daily export limit: 5 exports/day across all tools (localStorage, resets daily)
- Watermark system extended to: Edit, Merge, Rotate, Delete, Reorder, Extract, Images→PDF
- Daily watermark-free export (1x/day, localStorage)
- Upgrade modal: signed-out → "Sign in to upgrade"; signed-in → Stripe checkout link
- AdSense scaffolding with env-driven placement system (application submitted)

### Site & Infrastructure
- Landing page redesign with File Tools + Developer Tools sections
- App shell and workspace visual refresh
- Prerendering for all 107+ routes via Puppeteer postbuild script
- Branding (logo, mark, color theme with indigo accent)
- Support pages (About, Privacy, Terms, Contact, FAQ)
- Analytics event tracking
- Meta tags and SEO metadata per tool route
- Sitemap and robots.txt
- Manual deploy process: `npm run build` → `wrangler pages deploy dist`


## Now

### SEO & Discoverability
- AdSense approval (application submitted — waiting for Google review)
- Google Search Console indexing (sitemap submitted, pages being crawled)
- Schema markup (JSON-LD) on error detail pages for rich search snippets

### Error Database Expansion
- Add Docker error ecosystem (30 target entries)
- Add React/JSX error ecosystem
- Add TypeScript error ecosystem

### Marketing
- Product Hunt launch
- Reddit posts in relevant subreddits (r/webdev, r/git, r/learnprogramming)
- Hacker News Show HN post


## Next

### SEO Content
- Blog / guides section for long-tail keyword content (e.g. "how to fix git merge conflicts")
- Informational articles linked from error detail pages

### New Developer Tools
- Additional tools from the product roadmap (TBD based on search demand and usage data)

### Phase 2 Project (Deferred — requires revenue)
- Video → Instruction Manual Generator (needs LLM API costs — defer until AdSense or Stripe revenue covers it)

### Polish
- Cross-tool UI consistency pass (Merge, Split, Images→PDF, PDF→Image spacing/behavior)
- Editor QA: selection state clarity, viewer hierarchy, Fill & Sign edge cases
- Context file maintenance (keep AGENTS.md and BACKLOG.md current after each dev phase)


## Future

### Error Translator
- AI-powered analysis for unrecognized errors (premium feature — requires LLM API, deferred until revenue)
- Watch-ad-to-unlock for unmatched errors (rewarded ad flow)

### File Tools
- Annotation system
- Watermark tool (add watermarks to PDFs)
- Page numbering
- Form field expansion
- Drawn signature (canvas freehand)
- Signature management (delete saved signatures)
- True PDF compression (beyond canvas image compression)
- Expand to Word, Excel, image editing

### Platform
- Desktop app (Electron or Tauri)
- Multi-language support

### Marketing
- Social media pages
- Backlink strategy
- Carbon Ads as AdSense alternative


## Icebox
- Template-based document workflows
- Multi-language support
- Carbon Ads integration

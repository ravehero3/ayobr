# TypeBeatz — Type Beat Video Generator

## What This App Is (Plain Language)

TypeBeatz is a web-based tool built for music producers who create "type beat" videos and upload them to YouTube. The core problem it solves: a producer finishes a batch of 50 beats and needs to turn each one into a YouTube video (audio + image = MP4). Doing this manually in a video editor takes hours of repetitive, boring work. TypeBeatz eliminates all of that.

The producer drags and drops up to 100 files at once (e.g. 50 audio files + 50 cover images), the app automatically pairs them up (each beat gets matched with an image), then generates all 50 MP4 videos one by one in the browser using FFmpeg WebAssembly — entirely client-side, no server needed for processing. The producer can literally walk away or go to sleep while the app works. This is the core brand identity: the sleeping alien mascot (ZZZ) represents "you sleep, we work."

The app is called **TypeBeatz** and is being developed by a Czech music producer with 18 years of experience, 9,750 Instagram followers, and a working music eshop at voodoo808.com (selling beats and sound kits to rappers and music producers). TypeBeatz is planned to be deployed at **typebeatz.app**.

---

## Business Context

- **Owner/Creator**: Czech music producer, voodoo808.com
- **Target audience**: Music producers worldwide who upload type beat videos to YouTube
- **Planned domain**: typebeatz.app
- **Deployment platform**: Vercel (free tier, static deployment)
- **Related business**: voodoo808.com — eshop selling beats ("Beaty") and sound kits ("Zvuky") with CZK and EUR payments
- **Strategy**: TypeBeatz serves as a standalone global tool that cross-promotes voodoo808.com (producers using TypeBeatz need beats → buy from voodoo808)

---

## Future Roadmap — Full SaaS Web App

The current state is a functional client-side React app. The planned evolution is a full SaaS platform with the following features:

### Authentication & User System
- User registration and login (email/password + optionally Google/social)
- Two user tiers: **Free** and **PRO**
- Free users: **5 video generation credits per month**, resetting on the 1st of each month
- PRO users: **unlimited video generation**
- Upgrade flow: free users can purchase PRO subscription from within the app
- Payment integration needed for PRO upgrades (Stripe or similar)

### Legal & Compliance
- On registration or first use, users must agree to **Terms of Service** confirming:
  - They own the rights to all audio files they upload
  - They own the rights to all images they upload
  - They will not use the app to create content from copyrighted material they do not own
- This agreement protects the platform legally from copyright liability

### Admin Panel
- Separate admin dashboard (protected route, admin role only)
- Admin can view: list of all free users, list of all PRO users, usage statistics
- Admin can manage: which features are available to free vs PRO users (feature flags)
- Admin can: manually upgrade/downgrade users, see credit usage, see video generation counts
- Admin can: set monthly credit limits for free users globally

### Landing / Marketing Homepage
- Public-facing homepage at typebeatz.app
- Explains what the app does in plain language (the "you sleep, we work" pitch)
- Screenshots or screen recordings showing the drag-and-drop workflow
- Comparison: Free vs PRO features table
- CTA to sign up (free) or go PRO
- Link back to voodoo808.com for beats and sound kits

### Core App (Post-Login)
- The current drag-and-drop video generator interface (already built)
- Credit counter visible in UI for free users (e.g. "3/5 credits remaining this month")
- Credit is consumed when a video is successfully generated
- PRO badge visible in UI for pro users
- Settings: user profile, logo upload for video overlay, account management

### Nice-to-Have / Future Features
- Video history (list of previously generated videos, re-download)
- Preset templates (different video styles/layouts)
- Batch naming conventions (auto-name output files)
- YouTube upload integration (direct upload from app to YouTube)
- Offline/desktop version (Electron) — sold as one-time purchase on voodoo808.com

---

## Current Technical State

### Tech Stack
- **Frontend**: React 19, Zustand (state), Framer Motion (animations), TailwindCSS v4
- **Video Processing**: FFmpeg WebAssembly (@ffmpeg/ffmpeg 0.12.x) — 100% client-side
- **Build System**: Webpack 5, Babel
- **Dev Server**: webpack-dev-server on port 5000
- **No backend currently** — all processing happens in the browser

### Critical Headers Required
FFmpeg WebAssembly requires SharedArrayBuffer which requires these HTTP headers on every response:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```
These are set in webpack devServer config and must be set in `vercel.json` for production deployment.

### Key Files
- `src/App.jsx` — main application, orchestrates all hooks and pages
- `src/store/appStore.js` — central Zustand state
- `src/hooks/usePairingLogic.js` — file drop, audio/image detection, pairing
- `src/hooks/usePairPreparation.js` — background pre-processing of file pairs
- `src/hooks/useFFmpeg.js` — video generation orchestration, progress, cancellation
- `src/utils/ffmpegProcessor.js` — low-level FFmpeg WASM execution
- `src/services/JobManager.js` — FFmpeg instance pooling, job queue
- `src/services/PreparationService.js` — reads buffers, extracts metadata, caches
- `src/components/DropZone.jsx` — file drop UI
- `src/components/VideoPreviewCard.jsx` — generated video preview + download
- `webpack.config.js` — build config, dev server, CORS/COOP/COEP headers

### UI/UX Design Language
- Dark theme: deep navy + matte black backgrounds
- Neon blue accents
- Glassmorphism containers: 4px thick stroke, semi-transparent backgrounds, 16px backdrop blur, noise texture overlay
- Rounded corners: 24–32px
- Framer Motion animations throughout
- Sleeping alien mascot (ZZZ) appears during video generation
- 4-page navigation: Upload → File Management → Generation → Download

### Video Output Specs
- Resolution: 1920x1080
- Audio: AAC 320kbps
- Optional logo overlay (user-uploaded, stored as base64)
- Sequential processing (1 at a time) for stability
- Pre-processing cache (40–60% faster generation due to background buffering)

### Performance Architecture
- **PreparationService**: Background pre-processes all pairs before generation starts. Loads audio/image into ArrayBuffers, extracts duration, sanitizes filenames. 450MB memory cap with LRU eviction.
- **JobManager**: FFmpeg instance pool (max 3 instances), job queueing, event-based progress forwarding
- **Token-based progress isolation**: Each video generation session gets a unique UUID token preventing cross-contamination of progress callbacks between sequential videos
- **Sequential cleanup**: Each video waits for verified filesystem cleanup before the next begins

### Known Architecture Limitation
The current `ffmpegProcessor.js` uses shared module-level state (`currentProgressToken`, `cleanupCompletionPromise`, etc.) designed for sequential processing only (maxConcurrent = 1). Enabling true parallel video generation would require full refactor to per-job isolated state containers.

---

## User Preferences (for AI agents building UI)
- Communication style: simple, everyday language (non-technical)
- Container styling: 4px thick glassmorphism stroke, semitransparent shadows
- Video container width: 200px fixed during generation
- Sleeping alien: in front of background, behind footer during generation
- "We are generating your videos" text: positioned 80px higher than default
- FFmpeg: use hardware acceleration when available, ultrafast/superfast presets, parallel CPU cores

---

## Deployment Plan
1. Buy `typebeatz.app` domain (Cloudflare Registrar recommended — cheapest .app renewals)
2. Push code to GitHub
3. Connect to Vercel (free hobby plan)
4. Add `vercel.json` with required COOP/COEP headers and build config
5. Point DNS from Cloudflare → Vercel
6. SSL is automatic via Vercel/Let's Encrypt (required for .app domains)

### vercel.json needed:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

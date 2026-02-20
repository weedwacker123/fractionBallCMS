# FractionBall CMS

Content Management System for the FractionBall LMS platform, built with FireCMS v3 + React + TypeScript.

## Architecture

- **Framework:** FireCMS v3 (self-hosted) with React 18 + TypeScript
- **Build tool:** Vite 5
- **Styling:** Tailwind CSS + Material UI (via FireCMS)
- **Backend:** Firebase (Firestore, Auth, Cloud Storage) — no server needed
- **Auth:** Google Sign-In via Firebase Authentication

## Quick Start

```bash
npm install
npm run dev        # http://localhost:5173
```

No Docker required. No environment variables required for local dev (Firebase config has hardcoded fallbacks in `src/firebase-config.ts`).

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start local dev server (port 5173) |
| `npm run build` | TypeScript check + Vite production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | ESLint check (strict — zero warnings allowed) |

## Project Structure

```
src/
├── main.tsx              # React DOM entry point
├── App.tsx               # Error boundary + Suspense wrapper
├── FireCMSApp.tsx        # FireCMS config, collections, auth setup
├── firebase-config.ts    # Firebase SDK config (env vars with fallbacks)
├── collections/          # Firestore collection schemas
│   ├── activities.ts     # Main educational content (videos, resources embedded)
│   ├── users.ts          # User management (admin only)
│   ├── taxonomies.ts     # Dynamic taxonomy system (grade, topic, court, etc.)
│   ├── menuItems.ts      # Navigation items
│   ├── faqs.ts           # FAQ entries
│   ├── communityPosts.ts # Community with moderation
│   └── siteConfig.ts     # Key-value site settings
├── actions/              # Custom CMS actions
│   ├── bulkUserUpload.ts # CSV user import
│   └── moderationActions.ts
└── views/
    └── BulkUserUploadView.tsx
```

## Deployment

### How it works

The CMS is a **static SPA** deployed to **Vercel**. No Docker needed.

```
Push to GitHub (main) → Vercel auto-builds → Live site
```

Vercel project: `fractionball-cms` (linked to GitHub repo `weedwacker123/fractionBallCMS`)

### Deploy steps

**Option A: Push to GitHub (recommended — auto-deploys)**
```bash
git add -A
git commit -m "your changes"
git push origin main
```
Vercel watches `main` and auto-builds+deploys on every push.

**Option B: Manual Vercel CLI deploy**
```bash
npx vercel              # Preview deploy
npx vercel --prod       # Production deploy
```

### Vercel config (`vercel.json`)
- Build command: `npm run build`
- Output: `dist/`
- Framework: Vite
- SPA routing: all paths rewrite to `/index.html`
- Static assets cached for 1 year (immutable hashes)

### Firebase rules deployment (separate)
If you change `firestore.rules` or `storage.rules`:
```bash
npx firebase deploy --only firestore:rules
npx firebase deploy --only storage
```

## Environment Variables

Firebase config lives in `src/firebase-config.ts` with hardcoded fallback values. For production, set these in Vercel dashboard → Settings → Environment Variables:

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Cloud Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Analytics measurement ID |

All are optional for development (fallbacks work). The `VITE_` prefix is required by Vite to expose to the client bundle.

## Key Concepts

### Taxonomy system
The `taxonomies` collection stores dynamic categories (grade, topic, court, standard, difficulty, etc.). Each taxonomy type has `values[]` with key/label/description. Adding a new taxonomy type in the CMS auto-creates a filter dropdown in the LMS within 30 seconds (cache TTL).

### Roles
- **admin** — Full access to all collections
- **content_manager** — Can edit content, videos, resources
- **teacher** — Read-only access, can manage own posts

### Collections relationship
Activities are the core content type. They reference videos, resources, and taxonomies. The LMS reads these from Firestore directly.

## GitHub

- **Repo:** `https://github.com/weedwacker123/fractionBallCMS`
- **Branch:** `main` (single branch)
- **CI/CD:** Vercel auto-deploy on push to `main`

## For New Developers

1. Clone the repo
2. Run `npm install`
3. Run `npm run dev`
4. Open http://localhost:5173
5. Sign in with an authorized Google account (must be added to Firebase Auth)
6. Push to `main` to deploy — Vercel handles the rest automatically

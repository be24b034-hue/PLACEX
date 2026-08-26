# PlaceX

- `/` — marketing landing page (static HTML)
- `/app` — the React application

## Current state (honest summary)

**Working and verified by compiling the code (no live network in this build
environment, so nothing below was tested in an actual browser):**
- Real placement data: 325 records from the two IIT Madras Bluebooks
  (`src/placex-bluebook-data.json`), loaded into `PLACEX_DATA.companies`.
- Explore, My Matches, Saved, Placement Days (grouped by year — the source
  data has no day-of-visit field, so nothing was invented there), Compare,
  and the company detail page all render real filtered/derived data instead
  of empty-state placeholders.
- Eligibility matching (branch + CGPA) is computed live against your profile.
- Save/unsave persists via `localStorage`.
- Onboarding asks for the user's own name (no placeholder name anywhere).
- Cursor glow effect is now scoped to the landing page only.
- "Ask PlaceX AI" calls a serverless function (`api/chat.js`) that proxies
  to Google's Gemini API (free tier), keeping the API key server-side.

**Explicitly NOT done in this pass — said plainly rather than pretended:**
- The full Striver A2Z DSA problem bank (hundreds of problems) was not
  built. The DSA page still shows an honest "no problem bank loaded"
  state rather than fabricated problems.
- Extra Preparation domains beyond what's already in `PREP_DOMAINS` (OS,
  Computer Networks, Statistics, Aptitude, Data Analytics as a distinct
  category) were not added — these can be added by extending the
  `PREP_DOMAINS` array.
- No external resource links were audited/verified — that requires
  checking each URL is live, which wasn't done here.
- No install-to-homescreen (PWA) prompt.
- Responsive testing at specific breakpoints was not performed.
- The role category filter (`Software`/`Data`/`ML / AI`/etc.) is derived
  from keyword-matching each company's job title/description, since the
  Bluebook data has no role-category field. It's a best-effort label, not
  guaranteed accurate for every record.

## What changed from the original chat build

This app was originally built inside a Claude.ai artifact, which provides
things that don't exist on a normal website:

1. `window.storage` (a built-in key-value store) → replaced with browser
   `localStorage` in `src/PlaceXApp.jsx`.
2. A direct, pre-authenticated `fetch` to an AI API → replaced with a call
   to `/api/chat`, a Vercel serverless function (`api/chat.js`) that holds
   your Gemini API key server-side. Never call the Gemini API directly
   from the browser in production — it would expose your key.

## Deploy to Vercel via GitHub

1. **Push this project to GitHub** using git (not the web upload button —
   it silently drops subfolders like `src/` and `api/`):
   ```bash
   git init
   git add .
   git commit -m "PlaceX deploy"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo>.git
   git push -u origin main
   ```

2. **Import into Vercel** at https://vercel.com/new

3. **Set the build settings explicitly** (Project → Settings →
   Build and Deployment) — don't rely on auto-detect:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add your Gemini API key** — Project → Settings → Environment Variables:
   - `GEMINI_API_KEY` = your key from https://aistudio.google.com/apikey
     (free, no credit card required)

5. **Redeploy** from the Deployments tab.

## Local development

```bash
npm install
npm run dev
```

For the AI assistant to work locally, copy `.env.example` to `.env.local`
and fill in your key, then use `vercel dev` (not plain `vite`) so the
`/api/chat` serverless function runs locally too.

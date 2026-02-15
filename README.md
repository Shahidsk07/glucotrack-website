# GlucoTrack — APK download page + counter

This project creates a simple website to showcase your FYP APK and track total downloads.

## What you edit

You have two options:

### Option A (recommended): Host the APK in this project

1. Put your APK here:
	 - `server/public/GlucoTrack.apk`
2. Run the server and the download button will serve that file.

Or set the full path via env var `APK_FILE_PATH`.

### Option B: Use Google Drive link

- Set your Google Drive direct-download link in `server/src/index.js` (`APK_DOWNLOAD_URL`).
	- Optionally, you can set it via environment variable `APK_DOWNLOAD_URL`.

## Run locally (Windows)

1. Install Node.js (LTS).
2. In a terminal:

```bash
cd server
npm install
npm run dev
```

Or (PowerShell) set the link without editing code:

```powershell
cd server
npm install
$env:APK_DOWNLOAD_URL = "https://drive.google.com/uc?export=download&id=YOUR_FILE_ID"
npm run dev
```

3. Open:

- http://localhost:5173

## How the counter works

- The Download button goes to `GET /download`.
- The server increments the counter and then either:
	- downloads your local `server/public/GlucoTrack.apk`, or
	- redirects to your Google Drive link (fallback).
- The server stores the count in `server/data/downloads.json`.

## About “direct install”

Websites can’t silently install an APK. The normal flow is:

1. User taps Download
2. APK downloads
3. User opens the APK and confirms installation (may need to allow “Install unknown apps”)

## Notes

- If you host on a serverless platform (Vercel/Netlify), the local JSON file won’t persist across deployments. For public hosting with a reliable counter, use a real database.

## Deploy on Netlify

### 1) Put the APK in the right place

- Place your APK here:
	- `server/public/GlucoTrack.apk`

Netlify publishes only the `client/` folder. This repo includes a build step that copies:

- `server/public/GlucoTrack.apk` → `client/GlucoTrack.apk`

So the final download URL becomes:

- `https://YOUR-SITE.netlify.app/GlucoTrack.apk`

### 2) Create the Netlify site

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import from Git**.
3. Netlify will read `netlify.toml` automatically:
	 - Publish directory: `client`
	 - Functions directory: `netlify/functions`

### 3) Set up a persistent download counter (Supabase)

Netlify Functions are stateless, so the counter must be stored in a DB.

1. Go to https://supabase.com → create an account → **New project**.
2. In your Supabase project dashboard:
   - Open **SQL Editor**
   - Run the SQL in `supabase/schema.sql`

Then in Netlify site settings → **Environment variables**, add:

- `SUPABASE_URL` (Supabase dashboard → Project Settings → API → Project URL)
- `SUPABASE_SERVICE_ROLE_KEY` (Supabase dashboard → Project Settings → API → Service role key)

Notes:
- This key is stored only in Netlify (server-side), not in the browser.
- With RLS enabled (in `supabase/schema.sql`), the anon/public key won’t be able to change the counter, which is safer.

After deploy:

- `GET /api/downloads` returns `{ count }`
- `GET /download` increments + redirects to `/GlucoTrack.apk`

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import {
  getDownloadCount,
  incrementDownloadCount,
  ensureDataFile,
} from './store.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? Number(process.env.PORT) : 5173;

// Option 1 (recommended): host the APK file in this repo and serve it directly.
// Put the file at: server/public/GlucoTrack.apk
// Or override the path with env var:
// - PowerShell: $env:APK_FILE_PATH = "C:\\path\\to\\your.apk"
const APK_FILE_PATH = process.env.APK_FILE_PATH
  ? path.resolve(String(process.env.APK_FILE_PATH))
  : path.resolve(__dirname, '..', 'public', 'GlucoTrack.apk');

// Paste your Google Drive direct-download link here, or set it via env var:
// - Windows PowerShell: $env:APK_DOWNLOAD_URL = "https://drive.google.com/uc?export=download&id=..."
// Example: https://drive.google.com/uc?export=download&id=YOUR_FILE_ID
const APK_DOWNLOAD_URL = process.env.APK_DOWNLOAD_URL
  ? String(process.env.APK_DOWNLOAD_URL)
  : 'PASTE_YOUR_GOOGLE_DRIVE_DIRECT_DOWNLOAD_LINK_HERE';

// Where the counter is persisted (simple JSON file)
const dataFilePath = process.env.DOWNLOADS_FILE
  ? path.resolve(process.env.DOWNLOADS_FILE)
  : path.resolve(__dirname, '..', 'data', 'downloads.json');

await ensureDataFile(dataFilePath);

app.use(express.json());

// Basic CORS so the client can call the API in dev or if separated
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// API
app.get('/api/downloads', async (req, res) => {
  try {
    const count = await getDownloadCount(dataFilePath);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read download count' });
  }
});

app.post('/api/downloads/increment', async (req, res) => {
  try {
    const count = await incrementDownloadCount(dataFilePath);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to increment download count' });
  }
});

async function localApkExists() {
  try {
    await fs.access(APK_FILE_PATH);
    return true;
  } catch {
    return false;
  }
}

// Direct APK download endpoint (no counting here).
// Use /download for “count + download”.
app.get('/apk', async (req, res) => {
  if (!(await localApkExists())) {
    return res
      .status(404)
      .type('text/plain')
      .send('APK file not found. Place it at server/public/GlucoTrack.apk or set APK_FILE_PATH env var.');
  }

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  return res.download(APK_FILE_PATH, 'GlucoTrack.apk');
});

// Download endpoint: increments count then redirects to the APK URL.
// This is the most reliable way to count downloads because it doesn't depend on client-side JS.
app.get('/download', async (req, res) => {
  try {
    await incrementDownloadCount(dataFilePath);
  } catch {
    // If increment fails, still allow download.
  }

  res.setHeader('Cache-Control', 'no-store');

  // Prefer local hosted APK if present.
  if (await localApkExists()) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    return res.download(APK_FILE_PATH, 'GlucoTrack.apk');
  }

  // Fallback to external link (Google Drive, etc.).
  if (!APK_DOWNLOAD_URL || APK_DOWNLOAD_URL.includes('PASTE_YOUR')) {
    return res
      .status(500)
      .type('text/plain')
      .send(
        'APK is not configured. Either place your file at server/public/GlucoTrack.apk (recommended) or set APK_DOWNLOAD_URL in server/src/index.js (or env var APK_DOWNLOAD_URL).'
      );
  }

  return res.redirect(302, APK_DOWNLOAD_URL);
});

// Serve static client
const clientDir = path.resolve(__dirname, '..', '..', 'client');
app.use(express.static(clientDir));

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Persisting download count in: ${dataFilePath}`);
});

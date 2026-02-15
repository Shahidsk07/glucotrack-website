import fs from 'fs/promises';
import path from 'path';
import process from 'process';

// Copies the APK from server/public into the Netlify publish directory (client/).
// Netlify publishes only `client/`, so the APK must exist there to be downloadable at /GlucoTrack.apk

const repoRoot = process.cwd();
const sourceApk = path.resolve(repoRoot, 'server', 'public', 'GlucoTrack.apk');
const targetApk = path.resolve(repoRoot, 'client', 'GlucoTrack.apk');

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

try {
  if (!(await exists(sourceApk))) {
    console.log(`[copy-apk] APK not found at: ${sourceApk}`);
    console.log('[copy-apk] Skipping copy. (This is OK for builds where APK is not committed yet.)');
    process.exit(0);
  }

  await fs.mkdir(path.dirname(targetApk), { recursive: true });
  await fs.copyFile(sourceApk, targetApk);
  console.log(`[copy-apk] Copied APK to publish dir: ${targetApk}`);
} catch (err) {
  console.error('[copy-apk] Failed:', err);
  process.exit(1);
}

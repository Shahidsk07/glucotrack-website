import fs from 'fs/promises';
import path from 'path';

// In-process mutex to avoid concurrent read/write corruption.
let writeLock = Promise.resolve();

async function withLock(fn) {
  const run = async () => fn();
  const next = writeLock.then(run, run);
  // Ensure the chain continues even if fn throws.
  writeLock = next.catch(() => {});
  return next;
}

export async function ensureDataFile(filePath) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify({ count: 0 }, null, 2), 'utf8');
  }
}

export async function getDownloadCount(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const count = Number(parsed?.count ?? 0);
    return Number.isFinite(count) && count >= 0 ? count : 0;
  } catch {
    return 0;
  }
}

export async function incrementDownloadCount(filePath) {
  return withLock(async () => {
    await ensureDataFile(filePath);
    const current = await getDownloadCount(filePath);
    const next = current + 1;
    await fs.writeFile(filePath, JSON.stringify({ count: next }, null, 2), 'utf8');
    return next;
  });
}

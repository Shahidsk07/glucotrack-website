const countEl = document.getElementById('downloadCount');
const btn = document.getElementById('downloadBtn');
const yearEl = document.getElementById('year');

yearEl.textContent = new Date().getFullYear();

function formatCount(n) {
  try {
    return new Intl.NumberFormat().format(n);
  } catch {
    return String(n);
  }
}

async function refreshCount() {
  const res = await fetch('/api/downloads', { method: 'GET' });
  if (!res.ok) throw new Error('Failed to fetch count');
  const data = await res.json();
  const count = Number(data?.count ?? 0);
  countEl.textContent = formatCount(Number.isFinite(count) ? count : 0);
}

// Let the server count + redirect in one step.
btn.setAttribute('href', '/download');

refreshCount().catch(() => {
  countEl.textContent = '0';
});

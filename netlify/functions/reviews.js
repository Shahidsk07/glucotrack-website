const { getSupabaseClient } = require('./_supabase');

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
    body: JSON.stringify(body),
  };
}

function normalizeText(value, fallback = '') {
  const raw = String(value ?? '').trim();
  return raw || fallback;
}

exports.handler = async (event) => {
  try {
    const supabase = getSupabaseClient();
    const method = (event?.httpMethod || 'GET').toUpperCase();

    if (method === 'POST') {
      let payload;
      try {
        payload = event?.body ? JSON.parse(event.body) : {};
      } catch {
        return json(400, { error: 'Invalid JSON body' });
      }

      const displayName = normalizeText(payload?.display_name, 'Anonymous').slice(0, 50);
      const comment = normalizeText(payload?.comment).slice(0, 500);
      const stars = Number(payload?.stars ?? 5);

      if (!comment) return json(400, { error: 'Please write a short review' });
      if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
        return json(400, { error: 'Please choose a rating from 1 to 5 stars' });
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          display_name: displayName,
          stars,
          comment,
          approved: true,
        })
        .select('id, created_at, display_name, stars, comment')
        .single();

      if (error) {
        return json(500, {
          error: 'Failed to save review',
          details: String(error?.message || 'Unknown Supabase error'),
        });
      }

      return json(200, { ok: true, review: data });
    }

    const params = new URLSearchParams(event?.rawQueryString || '');
    const limit = Number(params.get('limit') || 8);
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 20) : 8;

    const { data, error } = await supabase
      .from('reviews')
      .select('id, created_at, display_name, stars, comment')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (error) return json(500, { error: 'Failed to fetch reviews' });

    return json(200, { reviews: Array.isArray(data) ? data : [] });
  } catch {
    return json(500, { error: 'Server not configured (Supabase env vars missing)' });
  }
};

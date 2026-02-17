const { getSupabaseClient } = require('./_supabase');

// GET /.netlify/functions/transactions
// Returns latest download transaction(s) from Supabase.
// Query params:
// - limit: number (default 5, max 25)
exports.handler = async (event) => {
  try {
    const limitRaw = event?.queryStringParameters?.limit;
    const parsedLimit = Number(limitRaw);
    const limit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(25, Math.trunc(parsedLimit)))
      : 5;

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('download_events')
      .select('id, created_at')
      .order('id', { ascending: false })
      .limit(limit);

    if (error) {
      return {
        statusCode: 500,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
        body: JSON.stringify({ error: 'Failed to fetch transactions' }),
      };
    }

    const items = Array.isArray(data) ? data : [];

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      body: JSON.stringify({
        latest: items[0] || null,
        items,
      }),
    };
  } catch {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      body: JSON.stringify({ error: 'Server not configured (Supabase env vars missing)' }),
    };
  }
};

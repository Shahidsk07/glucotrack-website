const { getSupabaseClient } = require('./_supabase');

// GET /.netlify/functions/downloads
exports.handler = async () => {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('downloads')
      .select('count')
      .eq('id', 1)
      .single();

    if (error) {
      return {
        statusCode: 500,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to fetch download count' }),
      };
    }

    const count = Number(data?.count ?? 0);

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
      body: JSON.stringify({ count: Number.isFinite(count) ? count : 0 }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Server not configured (Supabase env vars missing)' }),
    };
  }
};

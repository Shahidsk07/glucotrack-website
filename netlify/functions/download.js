const { getSupabaseClient } = require('./_supabase');

// GET /.netlify/functions/download
// Increments count + logs a transaction event (best-effort) then redirects to the APK file hosted in the Netlify publish dir.
exports.handler = async (event) => {
  // Best-effort increment + log
  try {
    const supabase = getSupabaseClient();

    const headers = event?.headers || {};
    const userAgent = headers['user-agent'] || headers['User-Agent'] || null;
    const referrer = headers['referer'] || headers['referrer'] || headers['Referer'] || null;

    // Preferred: atomic increment + insert event row (schema.sql)
    const { error } = await supabase.rpc('increment_downloads_and_log', {
      p_user_agent: userAgent,
      p_referrer: referrer,
    });

    // Backwards-compat fallback if the new function isn't created yet.
    if (error) {
      await supabase.rpc('increment_downloads');
    }
  } catch {
    // Still allow download even if counting fails.
  }

  return {
    statusCode: 302,
    headers: {
      Location: '/GlucoTrack.apk',
      'cache-control': 'no-store',
    },
    body: '',
  };
};

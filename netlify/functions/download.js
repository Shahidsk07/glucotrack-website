const { getSupabaseClient } = require('./_supabase');

// GET /.netlify/functions/download
// Increments count (best-effort) then redirects to the APK file hosted in the Netlify publish dir.
exports.handler = async () => {
  // Best-effort increment
  try {
    const supabase = getSupabaseClient();
    // Recommended: create an RPC function `increment_downloads()` (see README) for atomic increments.
    await supabase.rpc('increment_downloads');
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

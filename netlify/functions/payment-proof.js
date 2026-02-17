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

function normalizeTxnId(value) {
  const raw = String(value || '').trim();
  // EasyPaisa receipts often look like: "ID#46020613208".
  // Store a canonical numeric ID when possible.
  const digits = raw.replace(/\D+/g, '');
  if (digits) return digits;
  return raw.replace(/\s+/g, ' ');
}

// GET  /.netlify/functions/payment-proof  -> latest proof
// POST /.netlify/functions/payment-proof  -> create proof
exports.handler = async (event) => {
  try {
    const supabase = getSupabaseClient();

    if ((event?.httpMethod || 'GET').toUpperCase() === 'POST') {
      let payload;
      try {
        payload = event?.body ? JSON.parse(event.body) : {};
      } catch {
        return json(400, { error: 'Invalid JSON body' });
      }

      const provider = String(payload?.provider || 'easypaisa').trim().toLowerCase();
      const transactionId = normalizeTxnId(payload?.transaction_id);
      const amountPkr = Number(payload?.amount_pkr ?? 10);
      const note = payload?.note != null ? String(payload.note).trim() : null;

      if (!transactionId) return json(400, { error: 'transaction_id is required' });
      if (!Number.isFinite(amountPkr) || amountPkr <= 0) return json(400, { error: 'amount_pkr must be a positive number' });

      const { data, error } = await supabase
        .from('payment_proofs')
        .insert({
          provider,
          transaction_id: transactionId,
          amount_pkr: Math.trunc(amountPkr),
          note,
        })
        .select('id, created_at, provider, transaction_id, amount_pkr, note')
        .single();

      if (error) {
        // Handle duplicate submits cleanly
        const message = String(error.message || 'Insert failed');
        if (message.toLowerCase().includes('duplicate') || message.toLowerCase().includes('unique')) {
          return json(409, { error: 'This transaction_id is already submitted' });
        }
        return json(500, { error: 'Failed to save payment proof' });
      }

      return json(200, { ok: true, proof: data });
    }

    // Default: GET latest proof
    const { data, error } = await supabase
      .from('payment_proofs')
      .select('id, created_at, provider, transaction_id, amount_pkr, note')
      .eq('provider', 'easypaisa')
      .order('id', { ascending: false })
      .limit(1);

    if (error) return json(500, { error: 'Failed to fetch payment proof' });

    const latest = Array.isArray(data) && data.length ? data[0] : null;
    return json(200, { latest });
  } catch {
    return json(500, { error: 'Server not configured (Supabase env vars missing)' });
  }
};

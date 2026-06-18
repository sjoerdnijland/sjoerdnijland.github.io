// feature-usage — count or bucket analytics_events for a specific feature key.
//
// GET ?feature=my-key               → { count }
// GET ?feature=my-key&mode=weekly   → { buckets: [{ week, count }] }
// GET ?feature=my-key&mode=monthly  → { buckets: [{ month, count }] }
//
// Protected by METRICS_SECRET (same as metrics-export).
//
// Deploy: paste into Supabase dashboard → Edge Functions → feature-usage

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPA_URL   = Deno.env.get('SUPABASE_URL')!;
const SUPA_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const API_SECRET = Deno.env.get('METRICS_SECRET') ?? null;

const supabase = createClient(SUPA_URL, SUPA_KEY, {
  auth: { persistSession: false },
});

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin':  origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
    'Access-Control-Max-Age':       '86400',
    'Vary':                         'Origin',
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const cors   = corsHeaders(origin);

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'GET')     return new Response('Method not allowed', { status: 405, headers: cors });

  if (API_SECRET) {
    const auth  = req.headers.get('Authorization') ?? '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    if (token !== API_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }
  }

  const url     = new URL(req.url);
  const feature = url.searchParams.get('feature');
  const mode    = url.searchParams.get('mode'); // 'weekly' | 'monthly' | null

  if (!feature) {
    return Response.json({ error: 'Missing ?feature= parameter' }, { status: 400, headers: cors });
  }

  // ── Bucketed mode: use rpc for raw SQL to bypass schema-cache issue with created_at ──
  if (mode === 'weekly' || mode === 'monthly') {
    const truncUnit = mode === 'monthly' ? 'month' : 'week';
    const colAlias  = mode === 'monthly' ? 'month'  : 'week';

    const { data, error } = await supabase.rpc('feature_usage_buckets', {
      p_feature:    feature,
      p_trunc_unit: truncUnit,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500, headers: cors });
    }

    const buckets = (data ?? []).map((row: Record<string, unknown>) => ({
      [colAlias]: row.bucket,
      count:      Number(row.count),
    }));

    return Response.json(
      { feature, mode, buckets, updated_at: new Date().toISOString() },
      { status: 200, headers: { ...cors, 'Cache-Control': 'no-store' } },
    );
  }

  // ── Simple count mode (original behaviour) ───────────────────────────────
  // Note: 'since' filter uses 'ts' (the actual timestamp column on analytics_events).
  const filter = `event=eq.feature_use&meta->>feature=eq.${encodeURIComponent(feature)}&select=id`;

  const res = await fetch(`${SUPA_URL}/rest/v1/analytics_events?${filter}`, {
    headers: {
      apikey: SUPA_KEY,
      Authorization: `Bearer ${SUPA_KEY}`,
      Prefer: 'count=exact',
      Range: '0-0',
    },
  });

  const range = res.headers.get('Content-Range') ?? '';
  const match = range.match(/\/(\d+)$/);
  const count = match ? Number(match[1]) : 0;

  return Response.json(
    { feature, count, updated_at: new Date().toISOString() },
    { status: 200, headers: { ...cors, 'Cache-Control': 'no-store' } },
  );
});

// metrics-export — JSON snapshot for external dashboard apps.
//
// Returns a single flat metrics object with updated_at timestamp.
// Protected by a shared secret: set METRICS_SECRET in Supabase secrets.
//
// Deploy:
//   npx supabase functions deploy metrics-export
//
// Secrets:
//   METRICS_SECRET              — bearer token the dashboard app sends
//   STRIPE_SECRET_KEY           — for monthly revenue (sk_live_...)
//   MAILERLITE_API_TOKEN        — reused from enter / mailerlite-stats
//   MAILERLITE_GROUP_CITIZENS   — reused from enter / mailerlite-stats
//   TOTAL_CHAPTERS_PUBLISHED    — optional override (default: 24)

// deno-lint-ignore-file no-explicit-any

const SUPA_URL    = Deno.env.get('SUPABASE_URL')!;
const SUPA_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_KEY  = Deno.env.get('STRIPE_SECRET_KEY') ?? null;
const ML_TOKEN    = Deno.env.get('MAILERLITE_API_TOKEN') ?? null;
const ML_GROUP    = Deno.env.get('MAILERLITE_GROUP_CITIZENS') ?? null;
const API_SECRET  = Deno.env.get('METRICS_SECRET') ?? null;
const CHAPTERS_PUBLISHED = Number(Deno.env.get('TOTAL_CHAPTERS_PUBLISHED') ?? '24');

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin':  origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
    'Access-Control-Max-Age':       '86400',
    'Vary':                         'Origin',
  };
}

// Count rows from analytics_events matching a filter, using Content-Range.
async function countEvents(filter: string): Promise<number> {
  const url = `${SUPA_URL}/rest/v1/analytics_events?${filter}&select=id`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPA_KEY,
      Authorization: `Bearer ${SUPA_KEY}`,
      Prefer: 'count=exact',
      Range: '0-0',
    },
  });
  const range = res.headers.get('Content-Range') ?? '';
  const match = range.match(/\/(\d+)$/);
  return match ? Number(match[1]) : 0;
}

async function reviewStats(): Promise<{ avg: number; count: number }> {
  const [supaRes, critRes] = await Promise.all([
    fetch(`${SUPA_URL}/rest/v1/reviews?select=rating`, {
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
    }),
    fetch('https://the-unfolding.net/data/critical-reviews.json').catch(() => null),
  ]);

  const rows: { rating: number | null }[] = supaRes.ok ? await supaRes.json() : [];
  const critical: { overall?: number | null }[] =
    critRes?.ok ? await critRes.json().catch(() => []) : [];

  const rated = rows.filter(r => r.rating != null);
  const sum   = rated.reduce((s, r) => s + Number(r.rating), 0);
  const avg   = rated.length > 0 ? Math.round((sum / rated.length) * 100) / 100 : 0;

  return { avg, count: rows.length + critical.length };
}

async function monthlyRevenue(): Promise<number | null> {
  if (!STRIPE_KEY) return null;
  const now = new Date();
  const monthStart = Math.floor(
    new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000
  );

  let total = 0;
  let startingAfter: string | null = null;

  while (true) {
    const params = new URLSearchParams({
      'created[gte]': String(monthStart),
      limit: '100',
    });
    if (startingAfter) params.set('starting_after', startingAfter);

    const res = await fetch(`https://api.stripe.com/v1/charges?${params}`, {
      headers: { Authorization: `Bearer ${STRIPE_KEY}` },
    });
    if (!res.ok) return null;
    const data = await res.json();

    for (const charge of data.data ?? []) {
      if (charge.status === 'succeeded' && !charge.refunded) {
        total += charge.amount; // cents
      }
    }

    if (!data.has_more) break;
    startingAfter = data.data.at(-1)?.id ?? null;
    if (!startingAfter) break;
  }

  return Math.round(total) / 100;
}

async function emailListSize(): Promise<number | null> {
  if (!ML_TOKEN || !ML_GROUP) return null;
  const res = await fetch(`https://connect.mailerlite.com/api/groups/${ML_GROUP}`, {
    headers: { Authorization: `Bearer ${ML_TOKEN}`, Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return Number((json?.data ?? json)?.active_count ?? 0);
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

  const [
    chapterStarts,
    depthCompletes,
    narrPlays,
    narrCompletes,
    paywallShown,
    purchases,
    discordSignups,
    reviews,
    revenue,
    emailCount,
  ] = await Promise.all([
    countEvents('event=eq.chapter_start'),
    countEvents('event=eq.chapter_depth&meta->>depth=eq.100'),
    countEvents('event=eq.narration_play'),
    countEvents('event=eq.narration_complete'),
    countEvents('event=eq.paywall_shown'),
    countEvents('event=eq.purchase_completed'),
    countEvents('event=eq.discord_signup'),
    reviewStats(),
    monthlyRevenue(),
    emailListSize(),
  ]);

  const chapterCompletionRate = chapterStarts > 0
    ? Math.round((depthCompletes / chapterStarts) * 1000) / 10
    : 0;

  const narrCompletionRate = narrPlays > 0
    ? Math.round((narrCompletes / narrPlays) * 1000) / 10
    : 0;

  const paywallConversionRate = paywallShown > 0
    ? Math.round((purchases / paywallShown) * 1000) / 10
    : 0;

  return Response.json(
    {
      updated_at: new Date().toISOString(),
      metrics: {
        monthly_revenue:          revenue,
        reader_review_score:      reviews.avg,
        chapter_completion_rate:  chapterCompletionRate,
        email_list_size:          emailCount,
        paywall_conversion_rate:  paywallConversionRate,
        review_volume:            reviews.count,
        discord_community_size:   discordSignups,
        narration_completion_rate: narrCompletionRate,
        total_chapters_published: CHAPTERS_PUBLISHED,
      },
    },
    { status: 200, headers: { ...cors, 'Cache-Control': 'no-store' } },
  );
});

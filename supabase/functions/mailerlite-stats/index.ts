// MailerLite stats — admin-gated subscriber count for the OKR dashboard.
//
// Returns counts (total / active / unsubscribed) for the CITIZENS group, so
// the OKR view can show KR1 ("active email subscribers") live instead of a
// manually-edited number.
//
// Deploy:
//   npx supabase functions deploy mailerlite-stats
//
// Keep JWT verification ON (the default) — Supabase rejects the call before
// it reaches this function unless the caller has a valid project JWT. We
// then decode the JWT to confirm the email is on the admin allowlist.
//
// Reuses secrets from the `enter` function:
//   MAILERLITE_API_TOKEN
//   MAILERLITE_GROUP_CITIZENS

// deno-lint-ignore-file no-explicit-any

const ADMIN_EMAILS = ['sjoerd.nyland@gmail.com', 'sjoerd.nijland@outlook.com'];

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin':  origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
    'Access-Control-Max-Age':       '86400',
    'Vary':                         'Origin',
  };
}

function envOrThrow(key: string): string {
  const v = Deno.env.get(key);
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
}

function decodeJwtClaims(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = '='.repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(b64 + pad));
  } catch {
    return null;
  }
}

function isAdmin(req: Request): boolean {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;
  const claims = decodeJwtClaims(token);
  if (!claims) return false;
  const email = String(
    claims.email || claims.user_metadata?.email || ''
  ).toLowerCase();
  return ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const cors   = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: cors });
  }

  if (!isAdmin(req)) {
    return Response.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401, headers: cors },
    );
  }

  let mlToken: string, groupId: string;
  try {
    mlToken = envOrThrow('MAILERLITE_API_TOKEN');
    groupId = envOrThrow('MAILERLITE_GROUP_CITIZENS');
  } catch (e) {
    return Response.json(
      { ok: false, error: 'Server misconfigured: ' + (e as Error).message },
      { status: 500, headers: cors },
    );
  }

  let res: Response;
  try {
    res = await fetch(`https://connect.mailerlite.com/api/groups/${groupId}`, {
      headers: {
        'Authorization': `Bearer ${mlToken}`,
        'Accept':        'application/json',
      },
    });
  } catch (err) {
    console.error('[mailerlite-stats] network error:', err);
    return Response.json(
      { ok: false, error: 'MailerLite request failed' },
      { status: 502, headers: cors },
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[mailerlite-stats] upstream error', res.status, text);
    return Response.json(
      { ok: false, error: `MailerLite ${res.status}` },
      { status: 502, headers: cors },
    );
  }

  const json  = await res.json();
  const group = json?.data || json;

  return Response.json(
    {
      ok: true,
      total:        Number(group?.total ?? 0),
      active:       Number(group?.active_count ?? 0),
      unsubscribed: Number(group?.unsubscribed_count ?? 0),
      group_name:   String(group?.name ?? ''),
      fetched_at:   new Date().toISOString(),
    },
    { status: 200, headers: cors },
  );
});

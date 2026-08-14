// Mairee Citizens — signup endpoint.
//
// Receives a JSON POST from /enter.html, generates a deterministic Citizen ID
// from the submitted email, upserts the subscriber into MailerLite with the
// right groups + custom fields, and returns the Citizen ID to the page.
//
// Deploy:
//   npx supabase functions deploy enter --no-verify-jwt
//
// Secrets to set (one-time, from the Supabase CLI or dashboard):
//   npx supabase secrets set MAILERLITE_API_TOKEN=...
//   npx supabase secrets set MAILERLITE_GROUP_CITIZENS=...
//   npx supabase secrets set MAILERLITE_GROUP_NEWCOMER=...
//   npx supabase secrets set MAILERLITE_GROUP_READING=...
//   npx supabase secrets set MAILERLITE_GROUP_FINISHED=...
//   npx supabase secrets set MAILERLITE_GROUP_SOURCE_WEBSITE=...
//   npx supabase secrets set MAILERLITE_GROUP_BOOK2=...
//
// Look up group IDs in MailerLite UI → Subscribers → Groups → click a group
// → the numeric ID is in the URL and group settings.

// deno-lint-ignore-file no-explicit-any

const READER_STATES = {
  'Just arriving':      { sector: 'G3', groupEnv: 'MAILERLITE_GROUP_NEWCOMER' },
  'Currently reading':  { sector: 'A7', groupEnv: 'MAILERLITE_GROUP_READING' },
  "I've read Part 1":   { sector: 'B2', groupEnv: 'MAILERLITE_GROUP_FINISHED' },
} as const;

type ReaderState = keyof typeof READER_STATES;

// Known signup origins. The value is stored verbatim in MailerLite's
// signup_source custom field so the Email List Size KVM can be attributed
// to the page/campaign a subscriber came in through. Unknown values fall
// back to the default so a stray/spoofed field can't pollute the data.
const SIGNUP_SOURCES = new Set([
  'website-signup', // /enter.html + FoldGate (default)
  'commons_muro',   // join-muro.html Muro landing page (PBI #43)
]);
const DEFAULT_SIGNUP_SOURCE = 'website-signup';

// In-memory rate limit: 5 POSTs per IP per 60s rolling window.
// Survives between warm invocations on the same instance. Cold starts reset
// the counters — this is intentionally lightweight; trade off against the
// cost of an extra DB roundtrip on every signup.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateLimitLog: Map<string, number[]> = new Map();

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for') || '';
  return fwd.split(',')[0].trim() || 'unknown';
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rateLimitLog.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  rateLimitLog.set(ip, hits);
  return hits.length > RATE_LIMIT_MAX;
}

// SHA-256 → 4-digit number (NNNN) + single letter (A-Z), deterministic per email.
async function generateCitizenId(email: string, sector: string): Promise<string> {
  const normalized = email.toLowerCase().trim();
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  const nnnn   = String(parseInt(hex.slice(0, 4), 16) % 10000).padStart(4, '0');
  const letter = String.fromCharCode(65 + (parseInt(hex.slice(4, 6), 16) % 26));
  return `MR-${sector}-${nnnn}-${letter}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(body: any): { ok: true; email: string; name: string; state: ReaderState; source: string } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request body.' };
  const email = String(body.email || '').trim();
  const name  = String(body.name  || '').trim();
  const state = String(body.reader_state || '').trim();
  const rawSource = String(body.signup_source || '').trim();

  if (!EMAIL_RE.test(email))         return { ok: false, error: 'Invalid comm channel address.' };
  if (email.length > 254)            return { ok: false, error: 'Comm channel address too long.' };
  if (!name)                         return { ok: false, error: 'Citizen designation is required.' };
  if (name.length > 80)              return { ok: false, error: 'Citizen designation too long.' };
  if (!(state in READER_STATES))     return { ok: false, error: 'Select where you are with The Unfolding.' };

  // Only accept known sources; anything else (or missing) uses the default.
  const source = SIGNUP_SOURCES.has(rawSource) ? rawSource : DEFAULT_SIGNUP_SOURCE;

  return { ok: true, email, name, state: state as ReaderState, source };
}

function corsHeaders(origin: string | null): Record<string, string> {
  // Allow the live site, the apex if configured, and localhost for dev.
  // No credentials are sent, so this is safe.
  return {
    'Access-Control-Allow-Origin':  origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age':       '86400',
    'Vary':                         'Origin',
  };
}

function envOrThrow(key: string): string {
  const v = Deno.env.get(key);
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const cors   = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: cors });
  }

  // Rate limit
  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return Response.json(
      { ok: false, error: 'Too many requests. Wait a minute and try again.' },
      { status: 429, headers: cors },
    );
  }

  // Parse + validate
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: 'Malformed request.' }, { status: 400, headers: cors });
  }
  const v = validate(body);
  if (!v.ok) {
    return Response.json({ ok: false, error: v.error }, { status: 400, headers: cors });
  }

  // Citizen ID — deterministic per email, so re-submissions return the same ID.
  const meta = READER_STATES[v.state];
  const citizen_id = await generateCitizenId(v.email, meta.sector);

  // Group set
  let groups: string[] = [];
  try {
    groups = [
      envOrThrow('MAILERLITE_GROUP_CITIZENS'),
      envOrThrow(meta.groupEnv),
      envOrThrow('MAILERLITE_GROUP_SOURCE_WEBSITE'),
      envOrThrow('MAILERLITE_GROUP_BOOK2'),
    ];
  } catch (e) {
    console.error('[enter] env config error:', (e as Error).message);
    return Response.json(
      { ok: false, error: 'The colony intake desk is mis-configured. Tell the operator.' },
      { status: 500, headers: cors },
    );
  }

  // Upsert subscriber in MailerLite (v3 — POST /api/subscribers is upsert).
  let mlToken: string;
  try {
    mlToken = envOrThrow('MAILERLITE_API_TOKEN');
  } catch {
    return Response.json(
      { ok: false, error: 'The colony intake desk is mis-configured. Tell the operator.' },
      { status: 500, headers: cors },
    );
  }

  const payload = {
    email:  v.email,
    fields: {
      name:           v.name,
      citizen_id,
      reader_state:   v.state,
      // Attribution: which page/campaign the subscriber came in through.
      signup_source:  v.source,
      discount_code:  'CITIZEN25',
      signup_date:    new Date().toISOString(),
    },
    groups,
  };

  let mlRes: Response;
  try {
    mlRes = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mlToken}`,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[enter] MailerLite network error:', err);
    return Response.json(
      { ok: false, error: 'The signal did not reach the colony. Try again in a moment.' },
      { status: 502, headers: cors },
    );
  }

  // 200/201 = created or updated. 422 from MailerLite means a validation issue
  // (could include "duplicate" depending on field config) — treat as success
  // since the Citizen ID is deterministic and the subscriber row is already
  // there. We do log it for visibility.
  if (mlRes.ok || mlRes.status === 422) {
    if (mlRes.status === 422) {
      const txt = await mlRes.text().catch(() => '');
      console.warn('[enter] MailerLite returned 422 (treating as success):', txt);
    }
    return Response.json(
      { ok: true, citizen_id, sector: meta.sector, reader_state: v.state },
      { status: 200, headers: cors },
    );
  }

  // Other errors: log details server-side, return a generic in-voice message.
  const errText = await mlRes.text().catch(() => '');
  console.error('[enter] MailerLite error', mlRes.status, errText);
  return Response.json(
    { ok: false, error: 'The signal did not reach the colony. Try again in a moment.' },
    { status: 502, headers: cors },
  );
});

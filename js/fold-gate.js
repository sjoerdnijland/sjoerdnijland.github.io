// FoldGate — shared inline email-capture overlay for gated content
// (reader past chapter 3, wiki entries past chapter 2, the map).
// Posts to the same Supabase edge function as /enter.html, so a citizen
// who signs in here lands in MailerLite with the same Citizen ID, the
// same groups, the same welcome flow.
//
// Public API:
//   FoldGate.isSubscribed()  → boolean (citizen-id in localStorage)
//   FoldGate.getCitizenId()  → string | null
//   FoldGate.show(opts)      → Promise<{citizen_id}> on success
//     opts = {
//       context:     short label used as default copy + signup_source meta,
//       heading:     custom heading copy,
//       body:        custom body copy,
//       readerState: 'Just arriving' | 'Currently reading' | "I've read Part 1",
//       onSuccess(citizen_id): called after a successful signup,
//     }
//   FoldGate.dismiss()  → close the overlay without resolving

(function () {
  const ENDPOINT  = 'https://sscpikfblqtmcefegrpv.supabase.co/functions/v1/enter';
  const SUPA_URL  = 'https://sscpikfblqtmcefegrpv.supabase.co';
  const SUPA_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzY3Bpa2ZibHF0bWNlZmVncnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNzUzMzgsImV4cCI6MjA5Mjk1MTMzOH0.I9qzVnzmiYxwZ6RPLV7KWva8P9L0Q1MHFqgmlmr3g0g';
  const LS_KEY    = 'mairee_citizen_id';
  const LS_SKIP   = 'mairee_gate_skipped'; // soft-gate opt-out flag ("I am already a citizen — skip")
  const SS_PEND   = 'fg_discord_pending';  // sessionStorage flag set before OAuth redirect

  // Pre-baked copy per context, so each page only needs to call show({context}).
  const CONTEXTS = {
    'reader': {
      heading: 'ENTER THE FOLD',
      body:    'Become a Maireean Citizen to unlock privileges.',
      readerState: 'Currently reading',
    },
    'wiki': {
      heading: 'ENTER THE FOLD',
      body:    'Become a Maireean Citizen to unlock privileges.',
      readerState: 'Currently reading',
    },
    'map': {
      heading: 'ENTER THE FOLD',
      body:    'Become a Maireean Citizen to unlock privileges.',
      readerState: 'Currently reading',
    },
    'default': {
      heading: 'ENTER THE FOLD',
      body:    'Become a Maireean Citizen to unlock privileges.',
      readerState: 'Currently reading',
    },
  };

  let overlayEl = null;
  let lastFocus = null;
  let onSuccessCb = null;
  let resolveOpen = null;
  let rejectOpen  = null;

  // Soft gate: a real citizen ID OR the "skip" flag both grant access.
  // The Stripe direct-buy flow uses getCitizenId() (real IDs only) so
  // skipped users still see the gate when they try to purchase.
  function isSubscribed() {
    return !!localStorage.getItem(LS_KEY)
        || localStorage.getItem(LS_SKIP) === '1';
  }
  function getCitizenId() {
    return localStorage.getItem(LS_KEY);
  }
  function hasSkipped() {
    return localStorage.getItem(LS_SKIP) === '1';
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  // Expand {placeholder} tokens in a URL template (used to build the
  // Stripe checkout link after a successful Fold signup).
  function expandTemplate(tpl, vars) {
    return String(tpl || '').replace(/\{(\w+)\}/g, (_, k) =>
      encodeURIComponent(vars[k] != null ? String(vars[k]) : '')
    );
  }

  function build(opts) {
    const o   = Object.assign({}, CONTEXTS[opts.context] || CONTEXTS.default, opts);
    const el  = document.createElement('div');
    el.className = 'fg-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'fg-heading');
    el.innerHTML = `
      <div class="fg-backdrop" data-fg-dismiss></div>
      <div class="fg-card">
        <div class="fg-eyebrow">◈ Fold · Intake</div>
        <h2 class="fg-heading" id="fg-heading">${escapeHtml(o.heading)}</h2>
        <p class="fg-body">${escapeHtml(o.body)}</p>

        <button type="button" class="fg-discord-btn" id="fg-discord">
          <span class="fg-discord-icon" aria-hidden="true">⌬</span>
          <span>Sign in with Discord</span>
        </button>

        <div class="fg-or"><span>or</span></div>

        <form class="fg-form" id="fg-form" novalidate>
          <label class="fg-label" for="fg-email">Comm channel<span class="req">*</span></label>
          <input class="fg-input" id="fg-email" name="email" type="email"
                 inputmode="email" autocomplete="email" required
                 placeholder="your@email" aria-required="true"/>

          <label class="fg-label" for="fg-name">Citizen designation<span class="req">*</span></label>
          <input class="fg-input" id="fg-name" name="name" type="text"
                 autocomplete="given-name" required maxlength="80"
                 placeholder="First name" aria-required="true"/>

          <fieldset class="fg-state">
            <legend class="fg-label">Where are you with The Unfolding?<span class="req">*</span></legend>
            <div class="fg-state-pills" role="radiogroup" aria-label="Where are you with The Unfolding?">
              ${['Just arriving','Currently reading',"I've read Part 1"].map(opt => `
                <label class="fg-pill">
                  <input type="radio" name="reader_state" value="${opt.replace(/"/g,'&quot;')}"
                         ${opt === (o.readerState || 'Just arriving') ? 'checked' : ''}/>
                  <span>${opt}</span>
                </label>
              `).join('')}
            </div>
          </fieldset>

          <button type="submit" class="fg-submit" id="fg-submit">
            Sign in my designation
          </button>

          <div class="fg-status" id="fg-status" role="status" aria-live="polite"></div>
        </form>

        <div class="fg-escape">
          ${o.afterSuccess === 'redirect' ? '' : `
            <button type="button" class="fg-skip" data-fg-skip>
              I am already a citizen — skip
            </button>
          `}
          <button type="button" class="fg-dismiss" data-fg-dismiss>
            Not now — return to the surface
          </button>
        </div>

        <p class="fg-frequency">You will receive transmissions in your inbox.</p>
      </div>
    `;

    // Submit handler
    const form    = el.querySelector('#fg-form');
    const status  = el.querySelector('#fg-status');
    const submit  = el.querySelector('#fg-submit');
    form.addEventListener('submit', (e) => handleSubmit(e, el, o));

    // Discord button — kicks off the OAuth flow; callback handled on return.
    const discordBtn = el.querySelector('#fg-discord');
    if (discordBtn) {
      discordBtn.addEventListener('click', () => signInWithDiscord(el, o));
    }

    // Dismiss handlers
    el.querySelectorAll('[data-fg-dismiss]').forEach(node => {
      node.addEventListener('click', () => dismiss());
    });
    // Skip — "I am already a citizen". Soft gate opt-out: sets a flag so
    // the gate doesn't show again on this browser, fires the onSuccess
    // callback so the host page unlocks, and dismisses.
    el.querySelectorAll('[data-fg-skip]').forEach(node => {
      node.addEventListener('click', () => {
        try { localStorage.setItem(LS_SKIP, '1'); } catch (_) {}
        if (window._track) window._track('email_gate_skipped', { context: o.context || null });
        if (typeof onSuccessCb === 'function') {
          try { onSuccessCb(null); } catch (err) { console.warn(err); }
        }
        dismiss(true);
        if (resolveOpen) resolveOpen({ skipped: true });
      });
    });
    // ESC to dismiss
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') dismiss();
    });

    return el;
  }

  function setStatus(el, msg, tone) {
    const s = el.querySelector('#fg-status');
    if (!s) return;
    s.textContent = msg || '';
    if (tone) s.setAttribute('data-tone', tone);
    else      s.removeAttribute('data-tone');
  }

  async function handleSubmit(e, el, opts) {
    e.preventDefault();
    const emailEl = el.querySelector('#fg-email');
    const nameEl  = el.querySelector('#fg-name');
    const btn     = el.querySelector('#fg-submit');
    const stateEl = el.querySelector('input[name="reader_state"]:checked');

    const email        = emailEl.value.trim();
    const name         = nameEl.value.trim();
    const reader_state = stateEl ? stateEl.value : (opts.readerState || 'Just arriving');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus(el, 'Comm channel address looks malformed.', 'error');
      emailEl.focus();
      return;
    }
    if (!name) {
      setStatus(el, 'Citizen designation is required.', 'error');
      nameEl.focus();
      return;
    }
    if (!reader_state) {
      setStatus(el, 'Tell the colony where you are in the book.', 'error');
      return;
    }

    btn.disabled = true;
    const origLabel = btn.textContent;
    btn.textContent = 'Routing…';
    setStatus(el, 'Routing your designation to the colony…', 'loading');

    try {
      const res = await fetch(ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, name, reader_state }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.ok && data.citizen_id) {
        // Persist citizen id so other gated pages know the visitor is in.
        localStorage.setItem(LS_KEY, data.citizen_id);
        try { localStorage.setItem('mairee_subscribed_at', new Date().toISOString()); } catch {}

        renderSuccess(el, data.citizen_id);

        // Redirect-to-Stripe path (used by the direct-buy flow).
        if (opts.afterSuccess === 'redirect' && opts.nextUrlTemplate) {
          const url = expandTemplate(opts.nextUrlTemplate, {
            citizen_id: data.citizen_id,
            email,
          });
          setTimeout(() => { window.location.href = url; }, 1800);
          return;
        }

        // Default: fire the onSuccess callback and dismiss the overlay.
        setTimeout(() => {
          if (typeof onSuccessCb === 'function') {
            try { onSuccessCb(data.citizen_id); } catch (err) { console.warn(err); }
          }
          dismiss(true);
          if (resolveOpen) resolveOpen({ citizen_id: data.citizen_id });
        }, 2400);
        return;
      }

      const msg = (data && data.error) || 'The signal did not reach the colony. Try again in a moment.';
      setStatus(el, msg, 'error');
    } catch (err) {
      setStatus(el, 'The signal did not reach the colony. Try again in a moment.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = origLabel;
    }
  }

  function renderSuccess(el, citizen_id) {
    const card = el.querySelector('.fg-card');
    card.innerHTML = `
      <div class="fg-eyebrow">◈ Fold · Credentials Issued</div>
      <h2 class="fg-heading">Citizen credentials issued.</h2>
      <div class="fg-id-card">
        <div class="fg-id-label">Citizen designation</div>
        <div class="fg-id">${escapeHtml(citizen_id)}</div>
      </div>
      <p class="fg-body fg-success-note">
        The colony has you. The page is unlocking.
      </p>
    `;
  }

  function show(opts = {}) {
    if (overlayEl) dismiss(true); // any previous gate first
    onSuccessCb = opts.onSuccess || null;

    overlayEl = build(opts);
    document.body.appendChild(overlayEl);
    document.body.classList.add('fg-open');
    // Trigger animation
    requestAnimationFrame(() => overlayEl.classList.add('fg-in'));

    lastFocus = document.activeElement;
    // Focus the first input
    setTimeout(() => {
      const e = overlayEl.querySelector('#fg-email');
      if (e) e.focus();
    }, 220);

    return new Promise((resolve, reject) => {
      resolveOpen = resolve;
      rejectOpen  = reject;
    });
  }

  function dismiss(success = false) {
    if (!overlayEl) return;
    overlayEl.classList.remove('fg-in');
    const el = overlayEl;
    overlayEl = null;
    document.body.classList.remove('fg-open');
    setTimeout(() => { try { el.remove(); } catch (_) {} }, 240);

    if (lastFocus && typeof lastFocus.focus === 'function') {
      try { lastFocus.focus(); } catch (_) {}
    }
    if (!success && rejectOpen) {
      rejectOpen(new Error('dismissed'));
    }
    resolveOpen = null;
    rejectOpen  = null;
    onSuccessCb = null;
  }

  // ── Discord OAuth flow ───────────────────────────────────────────
  // Lazy-loads the Supabase SDK on demand; we don't pull it on every page
  // by default. The OAuth response comes back as URL hash params, which
  // we pick up on page load if SS_PEND was set before the redirect.

  function loadSupabase() {
    if (window.supabase) return Promise.resolve(window.supabase);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src   = 'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js';
      s.onload  = () => resolve(window.supabase);
      s.onerror = () => reject(new Error('supabase load failed'));
      document.head.appendChild(s);
    });
  }

  let _db = null;
  async function getDb() {
    if (_db) return _db;
    const lib = await loadSupabase();
    _db = lib.createClient(SUPA_URL, SUPA_KEY, {
      auth: { lock: (_name, _ttl, fn) => fn() },
    });
    return _db;
  }

  async function signInWithDiscord(el, opts) {
    setStatus(el, 'Opening Discord…', 'loading');
    try {
      // Respect whatever state the user picked in the form before clicking
      // Discord — falls back to the context's default if no radio was touched.
      const stateEl = el.querySelector('input[name="reader_state"]:checked');
      const reader_state = stateEl ? stateEl.value : (opts.readerState || 'Just arriving');
      sessionStorage.setItem(SS_PEND, JSON.stringify({
        readerState:     reader_state,
        afterSuccess:    opts.afterSuccess    || null,
        nextUrlTemplate: opts.nextUrlTemplate || null,
      }));
      const db = await getDb();
      await db.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: window.location.origin + window.location.pathname + window.location.search,
          scopes:     'identify email',
        },
      });
      // The user is being redirected; if we get here, the redirect didn't happen.
    } catch (err) {
      console.warn('[fold-gate] Discord OAuth failed:', err);
      setStatus(el, 'Could not reach Discord. Try again or use the email form below.', 'error');
      sessionStorage.removeItem(SS_PEND);
    }
  }

  // On script load: detect OAuth callback, complete registration if pending.
  async function maybeCompleteDiscordCallback() {
    const hash       = window.location.hash || '';
    const search     = window.location.search || '';
    const pendingRaw = sessionStorage.getItem(SS_PEND);

    // OAuth error from Discord (user denied, etc.) — clear flag and bail.
    if (pendingRaw && (hash.includes('error=') || search.includes('error='))) {
      sessionStorage.removeItem(SS_PEND);
      history.replaceState(null, '', window.location.pathname);
      return;
    }
    // Pending flag without an access_token = the user cancelled at Discord
    // before signing in. Just clear the stale flag.
    if (pendingRaw && !hash.includes('access_token')) {
      sessionStorage.removeItem(SS_PEND);
      return;
    }
    if (!hash.includes('access_token')) return;
    if (!pendingRaw) return;  // not a FoldGate-initiated callback
    sessionStorage.removeItem(SS_PEND);

    // Build a minimal in-page banner so the user knows what's happening.
    showDiscordBanner('Routing your Discord designation…');

    let pending = {};
    try { pending = JSON.parse(pendingRaw); } catch (_) {}

    try {
      const db = await getDb();
      // Pick up the session from the hash. Newer SDKs do this automatically
      // on createClient, but we also set it manually as a fallback.
      const params = new URLSearchParams(hash.replace(/^#+/, ''));
      const access_token  = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        try { await db.auth.setSession({ access_token, refresh_token }); } catch (_) {}
      }
      const { data: { session } } = await db.auth.getSession();
      const user = session?.user;
      if (!user || !user.email) {
        throw new Error('No email on Discord profile — make sure you grant the email permission.');
      }

      const meta = user.user_metadata || {};
      const name = meta.custom_claims?.global_name
                || meta.full_name
                || meta.name
                || (user.email || '').split('@')[0]
                || 'Citizen';

      const res = await fetch(ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:        user.email,
          name,
          reader_state: pending.readerState || 'Just arriving',
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok || !data.citizen_id) {
        throw new Error(data?.error || 'The colony intake desk rejected the discord packet.');
      }

      try {
        localStorage.setItem(LS_KEY, data.citizen_id);
        localStorage.setItem('mairee_subscribed_at', new Date().toISOString());
      } catch (_) {}

      // Clean the hash off the URL so a refresh doesn't re-trigger this.
      history.replaceState(null, '', window.location.pathname + window.location.search);

      // Show the credential card briefly.
      showDiscordSuccess(data.citizen_id);

      // Redirect-to-Stripe path (initiated by the direct-buy flow).
      if (pending.afterSuccess === 'redirect' && pending.nextUrlTemplate) {
        const url = expandTemplate(pending.nextUrlTemplate, {
          citizen_id: data.citizen_id,
          email:      user.email,
        });
        setTimeout(() => { window.location.href = url; }, 1800);
        return;
      }

      // Default: reload so the host page sees its gates unlocked.
      setTimeout(() => { window.location.reload(); }, 2400);
    } catch (err) {
      console.warn('[fold-gate] Discord callback error:', err);
      showDiscordBanner('Discord sign-in failed — ' + (err.message || 'try again'), true);
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  function showDiscordBanner(msg, isError) {
    let banner = document.getElementById('fg-discord-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'fg-discord-banner';
      banner.className = 'fg-discord-banner';
      document.body.appendChild(banner);
    }
    banner.textContent = msg;
    banner.classList.toggle('fg-discord-banner--error', !!isError);
    requestAnimationFrame(() => banner.classList.add('fg-discord-banner--in'));
  }

  function showDiscordSuccess(citizen_id) {
    const banner = document.getElementById('fg-discord-banner');
    if (banner) banner.remove();
    const card = document.createElement('div');
    card.className = 'fg-overlay fg-in';
    card.innerHTML = `
      <div class="fg-backdrop"></div>
      <div class="fg-card">
        <div class="fg-eyebrow">◈ Fold · Credentials Issued via Discord</div>
        <h2 class="fg-heading">Citizen credentials issued.</h2>
        <div class="fg-id-card">
          <div class="fg-id-label">Citizen designation</div>
          <div class="fg-id">${escapeHtml(citizen_id)}</div>
        </div>
        <p class="fg-body fg-success-note">The colony has you. Reloading.</p>
      </div>`;
    document.body.classList.add('fg-open');
    document.body.appendChild(card);
  }

  // Kick off callback detection as soon as the DOM is interactive enough.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maybeCompleteDiscordCallback);
  } else {
    maybeCompleteDiscordCallback();
  }

  window.FoldGate = {
    isSubscribed,
    getCitizenId,
    hasSkipped,
    skip: () => {
      try { localStorage.setItem(LS_SKIP, '1'); } catch (_) {}
    },
    unskip: () => {
      try { localStorage.removeItem(LS_SKIP); } catch (_) {}
    },
    show,
    dismiss,
    signInWithDiscord: () => {
      // No overlay context — kick off OAuth directly with sensible defaults.
      sessionStorage.setItem(SS_PEND, JSON.stringify({ readerState: 'Just arriving' }));
      getDb().then(db => db.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: window.location.origin + window.location.pathname + window.location.search,
          scopes:     'identify email',
        },
      }));
    },
  };
})();

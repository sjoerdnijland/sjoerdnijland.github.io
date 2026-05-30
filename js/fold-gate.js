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
  const ENDPOINT = 'https://sscpikfblqtmcefegrpv.supabase.co/functions/v1/enter';
  const LS_KEY   = 'mairee_citizen_id';

  // Pre-baked copy per context, so each page only needs to call show({context}).
  const CONTEXTS = {
    'reader': {
      heading: 'Citizen credentials required.',
      body:    'Past chapter three, the colony only transmits to those it has logged. Sign in your designation and the chapters continue.',
      readerState: 'Currently reading',
    },
    'wiki': {
      heading: 'The archive is selective.',
      body:    'Entries from later in the cycle are released to citizens only. Sign in your designation and the rest of the colony opens to you.',
      readerState: 'Currently reading',
    },
    'map': {
      heading: 'The cartography is selective.',
      body:    'The colony does not release its surveys openly. Sign in your designation and the map unrolls.',
      readerState: 'Currently reading',
    },
    'default': {
      heading: 'Citizen credentials required.',
      body:    'The colony only transmits to those it has logged. Sign in your designation to continue.',
      readerState: 'Currently reading',
    },
  };

  let overlayEl = null;
  let lastFocus = null;
  let onSuccessCb = null;
  let resolveOpen = null;
  let rejectOpen  = null;

  function isSubscribed() {
    return !!localStorage.getItem(LS_KEY);
  }
  function getCitizenId() {
    return localStorage.getItem(LS_KEY);
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
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

        <form class="fg-form" id="fg-form" novalidate>
          <label class="fg-label" for="fg-email">Comm channel<span class="req">*</span></label>
          <input class="fg-input" id="fg-email" name="email" type="email"
                 inputmode="email" autocomplete="email" required
                 placeholder="your@email" aria-required="true"/>

          <label class="fg-label" for="fg-name">Citizen designation<span class="req">*</span></label>
          <input class="fg-input" id="fg-name" name="name" type="text"
                 autocomplete="given-name" required maxlength="80"
                 placeholder="First name" aria-required="true"/>

          <button type="submit" class="fg-submit" id="fg-submit">
            Sign in my designation
          </button>

          <div class="fg-status" id="fg-status" role="status" aria-live="polite"></div>
        </form>

        <button type="button" class="fg-dismiss" data-fg-dismiss>
          Not now — return to the surface
        </button>

        <p class="fg-frequency">Approximately one transmission every two weeks. No tracking.</p>
      </div>
    `;

    // Submit handler
    const form    = el.querySelector('#fg-form');
    const status  = el.querySelector('#fg-status');
    const submit  = el.querySelector('#fg-submit');
    form.addEventListener('submit', (e) => handleSubmit(e, el, o));

    // Dismiss handlers
    el.querySelectorAll('[data-fg-dismiss]').forEach(node => {
      node.addEventListener('click', () => dismiss());
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

    const email = emailEl.value.trim();
    const name  = nameEl.value.trim();

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

    btn.disabled = true;
    const origLabel = btn.textContent;
    btn.textContent = 'Routing…';
    setStatus(el, 'Routing your designation to the colony…', 'loading');

    try {
      const res = await fetch(ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email,
          name,
          reader_state: opts.readerState || 'Currently reading',
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.ok && data.citizen_id) {
        // Persist citizen id so other gated pages know the visitor is in.
        localStorage.setItem(LS_KEY, data.citizen_id);
        try { localStorage.setItem('mairee_subscribed_at', new Date().toISOString()); } catch {}

        renderSuccess(el, data.citizen_id);
        // Resolve after the celebration has a moment to land.
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

  window.FoldGate = {
    isSubscribed,
    getCitizenId,
    show,
    dismiss,
  };
})();

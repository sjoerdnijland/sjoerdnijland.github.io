// Commons · Muro landing page — email capture.
// Loaded by commons/muro/index.html. Posts to the same Supabase edge
// function as /enter and the FoldGate overlay, so a reader who signs up
// here lands in MailerLite with the same Citizen ID and welcome flow.
//
// Attribution: signups are tagged { source: 'commons_muro' } via the
// shared _track() analytics helper (event: email_gate_signup, the same
// tracked event the FoldGate fires) AND the signup_source field is sent
// to the edge function so it is preserved on the MailerLite subscriber.
// Together these let the Email List Size KVM be measured against this
// page's traffic.

(function () {
  const ENDPOINT = 'https://sscpikfblqtmcefegrpv.supabase.co/functions/v1/enter';
  const LS_KEY   = 'mairee_citizen_id';
  const SOURCE   = 'commons_muro';

  const form        = document.getElementById('muro-form');
  const emailEl     = document.getElementById('muro-email');
  const submit      = document.getElementById('muro-submit');
  const status      = document.getElementById('muro-status');
  const formView    = document.getElementById('muro-capture-form');
  const successView = document.getElementById('muro-capture-success');

  if (!form) return;

  function track(event, meta) {
    if (typeof window._track === 'function') window._track(event, meta);
  }

  function setStatus(msg, tone) {
    status.textContent = msg || '';
    if (tone) status.setAttribute('data-tone', tone);
    else      status.removeAttribute('data-tone');
  }

  function emailValid(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  function nameFromEmail(email) {
    const local = (email || '').split('@')[0] || 'Citizen';
    // Turn "jane.doe" / "jane_doe" into a tidy first name.
    const first = local.replace(/[._-].*$/, '');
    if (!first) return 'Citizen';
    return first.charAt(0).toUpperCase() + first.slice(1);
  }

  function showSuccess(citizen_id) {
    if (citizen_id) {
      const card = document.getElementById('muro-id-card');
      const idEl = document.getElementById('muro-id');
      if (card && idEl) {
        idEl.textContent = citizen_id;
        card.hidden = false;
      }
    }
    formView.hidden = true;
    successView.hidden = false;
    const title = document.getElementById('muro-success-title');
    if (title) title.focus({ preventScroll: true });
    successView.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('', null);

    const email = emailEl.value.trim();
    if (!emailValid(email)) {
      setStatus('That comm channel address looks malformed.', 'error');
      emailEl.focus();
      return;
    }

    submit.disabled = true;
    const originalLabel = submit.textContent;
    submit.textContent = 'Routing…';
    setStatus('Opening the channel…', 'loading');

    try {
      const res = await fetch(ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email,
          name:          nameFromEmail(email),
          reader_state:  'Just arriving',
          signup_source: SOURCE,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data && data.ok && data.citizen_id) {
        try {
          localStorage.setItem(LS_KEY, data.citizen_id);
          localStorage.setItem('mairee_subscribed_at', new Date().toISOString());
        } catch (_) {}

        track('email_gate_signup', { source: SOURCE });
        setStatus('', null);
        showSuccess(data.citizen_id);
        return;
      }

      const msg = (data && data.error)
        || 'The signal did not reach the colony. Try again in a moment.';
      setStatus(msg, 'error');
    } catch (err) {
      setStatus('The signal did not reach the colony. Try again in a moment.', 'error');
    } finally {
      submit.disabled = false;
      submit.textContent = originalLabel;
    }
  });
})();

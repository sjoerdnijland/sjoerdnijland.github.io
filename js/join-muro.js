// Join · Muro landing page — email capture (PBI #43).
// Loaded by join-muro.html. Posts to the same Supabase edge function as
// /enter and the FoldGate overlay, so a reader who signs up here lands in
// MailerLite with the same Citizen ID and welcome flow.
//
// Attribution: the signup_source field ('commons_muro') is sent to the edge
// function, which whitelists it and preserves it on the MailerLite subscriber
// record — this is what lets the Email List Size KVM be attributed to this
// page's traffic. A lightweight _track() analytics event is also fired for
// funnel visibility.

(function () {
  const ENDPOINT = 'https://sscpikfblqtmcefegrpv.supabase.co/functions/v1/enter';
  const LS_KEY   = 'mairee_citizen_id';
  const SOURCE   = 'commons_muro';

  const form        = document.getElementById('jm-form');
  const emailEl     = document.getElementById('jm-email');
  const nameEl      = document.getElementById('jm-name');
  const submit      = document.getElementById('jm-submit');
  const status      = document.getElementById('jm-status');
  const formView    = document.getElementById('jm-capture-form');
  const successView = document.getElementById('jm-capture-success');

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

  function showSuccess(citizen_id) {
    if (citizen_id) {
      const card = document.getElementById('jm-id-card');
      const idEl = document.getElementById('jm-id');
      if (card && idEl) {
        idEl.textContent = citizen_id;
        card.hidden = false;
      }
    }
    formView.hidden = true;
    successView.hidden = false;
    const title = document.getElementById('jm-success-title');
    if (title) title.focus({ preventScroll: true });
    successView.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('', null);

    const email = emailEl.value.trim();
    const name  = nameEl.value.trim();
    const radio = form.querySelector('input[name="reader_state"]:checked');
    const reader_state = radio ? radio.value : '';

    if (!emailValid(email)) {
      setStatus('That comm channel address looks malformed.', 'error');
      emailEl.focus();
      return;
    }
    if (!name) {
      setStatus('Citizen designation is required.', 'error');
      nameEl.focus();
      return;
    }
    if (!reader_state) {
      setStatus('Tell the colony where you are in the book.', 'error');
      const firstRadio = form.querySelector('input[name="reader_state"]');
      if (firstRadio) firstRadio.focus();
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
          name,
          reader_state,
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

// Enter the Fold — Mairee Citizens intake form.
// Loaded by enter.html. Posts to the Supabase Edge Function at
// /functions/v1/enter and swaps the form view for the success view
// when the citizen ID comes back.

(function () {
  const ENDPOINT = 'https://sscpikfblqtmcefegrpv.supabase.co/functions/v1/enter';

  const SECTOR_COPY = {
    'G3': {
      label: 'Sector G3 — the Sickle.',
      body:  'The basin between the mountains where the new arrivals are housed. The mountains glow at the summits, green and phosphorescent. Nobody has yet bothered to ask why.',
    },
    'A7': {
      label: 'Sector A7 — the Delta.',
      body:  'The Leaf, on the survey maps. The colony’s foothold in the jungle. A scar in the forest, ringed with turrets. The forest is patient. The turrets are not.',
    },
    'B2': {
      label: 'Sector B2 — the Plateau.',
      body:  'Ivaldi Base. The cold rock, the thin air, the radiation, the temple in the basement. We assigned you here because the Plateau is where the older hands live.',
    },
  };

  const form    = document.getElementById('mr-form');
  const status  = document.getElementById('mr-status');
  const submit  = document.getElementById('mr-submit');
  const formEl  = document.getElementById('mr-form-view');
  const successEl = document.getElementById('mr-success-view');

  function setStatus(msg, tone) {
    status.textContent = msg || '';
    if (tone) status.setAttribute('data-tone', tone);
    else      status.removeAttribute('data-tone');
  }

  function emailValid(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function renderSuccess(citizen_id, sector) {
    const s = SECTOR_COPY[sector] || SECTOR_COPY['G3'];
    successEl.innerHTML = `
      <div class="mr-eyebrow">◈ Uplink · Intake confirmed</div>
      <h1 class="mr-success-confirm">
        Citizen credentials issued.
      </h1>

      <div class="mr-id-card">
        <div class="mr-id-label">Citizen designation</div>
        <div class="mr-id" aria-label="Citizen ID ${esc(citizen_id)}">${esc(citizen_id)}</div>
      </div>

      <p class="mr-sector">
        <span class="mr-sector-tag">Homestead ◈</span>
        <strong style="font-style:normal;color:var(--ivory)">${esc(s.label)}</strong> ${esc(s.body)}
      </p>

      <div class="mr-block">
        <h3 class="mr-block-title">The Discord</h3>
        <p class="mr-block-body">Join other citizens on the colony channel.</p>
        <a class="mr-block-cta" href="https://discord.gg/8CMVWNwMwF" target="_blank" rel="noopener">
          Join the Discord <span aria-hidden="true">→</span>
        </a>
      </div>

      <div class="mr-block">
        <h3 class="mr-block-title">The Commissary</h3>
        <p class="mr-block-body">
          Citizen privilege: 25% off the colony commissary. Code <em>CITIZEN25</em> is applied automatically through this link.
        </p>
        <a class="mr-block-cta" href="https://nyland-shop.fourthwall.com/promo/CITIZEN25" target="_blank" rel="noopener">
          Visit the commissary <span aria-hidden="true">→</span>
        </a>
      </div>

      <div class="mr-block">
        <h3 class="mr-block-title">Part Two — early access</h3>
        <p class="mr-block-body">
          You are now in line for Part Two proofread copies. Citizens are first. We will be in touch.
        </p>
      </div>

      <p class="mr-closing">
        Your first transmission is on its way to your inbox. Approximately one transmission every two weeks.
        The pulse continues.
      </p>
      <p class="mr-signoff">—Uplink</p>
    `;
    formEl.hidden = true;
    successEl.hidden = false;
    // Focus the success heading so screen readers announce the transition.
    const h = successEl.querySelector('.mr-success-confirm');
    if (h) {
      h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('', null);

    const email = document.getElementById('mr-email').value.trim();
    const name  = document.getElementById('mr-name').value.trim();
    const radio = form.querySelector('input[name="reader_state"]:checked');
    const reader_state = radio ? radio.value : '';

    // Client-side validation — server still validates too.
    if (!emailValid(email)) {
      setStatus('Comm channel address looks malformed.', 'error');
      document.getElementById('mr-email').focus();
      return;
    }
    if (!name) {
      setStatus('Citizen designation is required.', 'error');
      document.getElementById('mr-name').focus();
      return;
    }
    if (!reader_state) {
      setStatus('Select where you are with The Unfolding.', 'error');
      const firstRadio = form.querySelector('input[name="reader_state"]');
      if (firstRadio) firstRadio.focus();
      return;
    }

    submit.disabled = true;
    const originalLabel = submit.textContent;
    submit.textContent = 'Routing…';
    setStatus('Routing your designation to the colony…', 'loading');

    try {
      const res = await fetch(ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, name, reader_state }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data && data.ok && data.citizen_id) {
        setStatus('Confirmed.', 'success');
        renderSuccess(data.citizen_id, data.sector);
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

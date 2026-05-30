// Relay channel-update routing.
// Loaded by /route/index.html. Reads the ?to=… query param and renders
// the in-voice confirmation that matches that destination channel.

(function () {
  const params  = new URLSearchParams(window.location.search);
  const to      = params.get('to');
  const content = document.getElementById('content');
  const meta    = document.getElementById('meta');

  const routes = {
    reading: {
      meta:         'Origin: Newcomer · Destination: Reader',
      confirmation: 'Channel switched.',
      detail:       'The colony is routing your signal to the Delta. You are now logged with the Reader channel. The next transmission will arrive shortly. The Leaf is expecting you.',
    },
    finished: {
      meta:         'Origin: Newcomer · Destination: Returned Reader',
      confirmation: 'Channel switched.',
      detail:       'The Plateau receives you. The Anchor is patient. Your designation has been updated. The next transmission will arrive shortly.',
    },
    arc: {
      meta:         'Application: ARC cohort · Part Two proofreader',
      confirmation: 'Application registered.',
      detail:       'Your designation has been added to the proofreader shortlist. When reading copies are ready, the colony will route the cohort briefing to your inbox. We do not promise selection. We do promise that every citizen on the list is read by the author.',
    },
  };

  const route = routes[to];
  if (route) {
    meta.textContent = route.meta;
    content.innerHTML = `
      <div class="confirmation">${route.confirmation}</div>
      <div class="detail">${route.detail}</div>
      <div class="return">
        <a href="https://the-unfolding.net">Return to the colony</a>
      </div>
    `;
  } else {
    meta.textContent = 'Status: unrecognized route';
    content.innerHTML = `
      <div class="confirmation">The relay did not recognize the route.</div>
      <div class="detail">This may be a static page that has reached you out of context. No channel change has been applied. Return to the colony for orientation.</div>
      <div class="return">
        <a href="https://the-unfolding.net">Return to the colony</a>
      </div>
    `;
  }
})();

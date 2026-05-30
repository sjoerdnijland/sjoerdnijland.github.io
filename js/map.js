// Map of Mission Assets — boot script.
// Loaded by map.html. Builds the starfield, wires the sidebar entries,
// hooks panning/zooming, the FoldGate, and the wiki deep-links.

// ── Starfield ──────────────────────────────────────────────
(function(){
  const sf=document.getElementById('stars'), r=(a,b)=>Math.random()*(b-a)+a;
  for(let i=0;i<320;i++){
    const x=r(0,700), y=r(0,2200);
    // avoid system centres
    if(Math.hypot(x-350,y-170)<60||Math.hypot(x-350,y-1150)<70) continue;
    const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('cx',x); c.setAttribute('cy',y);
    c.setAttribute('r',r(.25,1.5)); c.setAttribute('fill','#f4ead9');
    c.setAttribute('opacity',r(.08,.55)); sf.appendChild(c);
  }
})();

// ── Layer toggles ──────────────────────────────────────────
const LAYERS = {
  fleet:    ['layer-fleet-solbay','layer-fleet-stragglers','layer-fleet-brisinger','layer-fleet-dainn','layer-fleet-surface'],
  stations: ['layer-station-kepler','layer-station-yarray','layer-stations-close','layer-stations-wide'],
  planets:  ['layer-sol-planets','layer-yreus-planets','layer-mairee-moons'],
};
function toggleLayer(name, btn){
  btn.classList.toggle('on');
  const on = btn.classList.contains('on');
  LAYERS[name].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.style.display=on?'':'none';
  });
}
// Apply initial states
LAYERS.fleet.forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display=''; });
LAYERS.stations.forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display=''; });
LAYERS.planets.forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display='none'; });

// ── SVG pan/zoom on scroll ─────────────────────────────────
const svg=document.getElementById('map-svg');
const BASE={x:0,y:0,w:700,h:2200};
let vb={...BASE}, drag=false, lx=0, ly=0;
function setVB(){ svg.setAttribute('viewBox',`${vb.x} ${vb.y} ${vb.w} ${vb.h}`); }
function clamp(){
  vb.w=Math.min(3000,Math.max(150,vb.w));
  vb.h=Math.min(9000,Math.max(150,vb.h));
}
svg.addEventListener('wheel',e=>{
  e.preventDefault();
  const f=e.deltaY<0?.82:1.22, rect=svg.getBoundingClientRect();
  const mx=(e.clientX-rect.left)/rect.width*vb.w+vb.x, my=(e.clientY-rect.top)/rect.height*vb.h+vb.y;
  vb.x=mx-(mx-vb.x)*f; vb.y=my-(my-vb.y)*f; vb.w*=f; vb.h*=f; clamp(); setVB();
},{passive:false});
svg.addEventListener('mousedown',e=>{if(e.button!==0)return;drag=true;lx=e.clientX;ly=e.clientY;});
window.addEventListener('mouseup',()=>drag=false);
window.addEventListener('mousemove',e=>{
  if(!drag)return;
  const rect=svg.getBoundingClientRect();
  vb.x-=(e.clientX-lx)*vb.w/rect.width; vb.y-=(e.clientY-ly)*vb.h/rect.height;
  lx=e.clientX; ly=e.clientY; setVB();
});
function svgZoom(f){ const cx=vb.x+vb.w/2,cy=vb.y+vb.h/2; vb.w*=f; vb.h*=f; clamp(); vb.x=cx-vb.w/2; vb.y=cy-vb.h/2; setVB(); }
function svgReset(){ vb={...BASE}; setVB(); }

// ── Fly-to (smooth animated zoom) ─────────────────────────
// [svgX, svgY, viewWidth]
const POS={
  // [centerX, centerY, viewportWidth]  — coordinates match SVG elements exactly
  solbay:            [428,  98, 360],
  kepler:            [504, 261, 340],
  stragglers:        [510, 335, 440],
  mimir:             [468, 362, 260],
  alsvin:            [498, 368, 260],
  muninn:            [522, 368, 260],
  hugin:             [552, 362, 260],
  fold:              [350, 460, 480],
  'yreus-array':     [294, 623, 340],
  brisinger:         [350, 688, 340],
  dainn:             [350, 748, 320],
  mairee:            [350, 950, 340],
  freya:             [337, 938, 180],
  ivaldi:            [335, 956, 180],
  delta:             [362, 958, 180],
  'orbital-command': [350, 849, 360],
  haulers:           [350, 878, 440],
  'orbit-one':       [350, 884, 280],
  'orbit-two':       [414, 950, 280],
  'orbit-three':     [350,1016, 280],
};
let raf=null, curEntry=null;
function flyTo(id){
  const p=POS[id]; if(!p) return;
  highlight(id);
  const [tx,ty,tw]=p;
  // th: show a region tall enough to give context; use same width as tw
  const th = tw;
  const targetX = tx - tw/2;
  const targetY = ty - th/2;
  const sx=vb.x, sy=vb.y, sw=vb.w, sh=vb.h;
  const t0=performance.now();
  if(raf) cancelAnimationFrame(raf);
  function step(t){
    const pr=Math.min(1,(t-t0)/640), e=pr<.5?2*pr*pr:-1+(4-2*pr)*pr;
    vb.w = sw + (tw - sw)*e;
    vb.h = sh + (th - sh)*e;
    vb.x = sx + (targetX - sx)*e;
    vb.y = sy + (targetY - sy)*e;
    setVB(); if(pr<1) raf=requestAnimationFrame(step);
  }
  raf=requestAnimationFrame(step);
}

// ── Highlight & expand sidebar entry ──────────────────────
function highlight(id){
  if(curEntry){
    const p=document.getElementById('e-'+curEntry);
    if(p){ p.classList.remove('on'); const d=p.querySelector('.ae-desc'); if(d) d.style.display='none'; }
  }
  curEntry=id;
  const el=document.getElementById('e-'+id);
  if(el){
    el.classList.add('on');
    const d=el.querySelector('.ae-desc');
    if(d) d.style.display='block';
    el.scrollIntoView({behavior:'smooth',block:'nearest'});
    const body=el.closest('.sec-body');
    if(body&&body.style.display==='none') toggleSec(body.previousElementSibling);
  }
}

// ── Section toggle ─────────────────────────────────────────
function toggleSec(hdr){
  const b=hdr.nextElementSibling, t=hdr.querySelector('.sec-tog'), open=b.style.display!=='none';
  b.style.display=open?'none':''; if(t) t.textContent=open?'▸':'▾';
}

// ── Stragglers web ─────────────────────────────────────────
let stOpen=false;
function toggleStragglers(){
  stOpen=!stOpen;
  const w=document.getElementById('strag-web');
  w.style.opacity=stOpen?'1':'0'; w.style.pointerEvents=stOpen?'all':'none';
  document.querySelectorAll('.ae-child').forEach((c,i)=>{ if(i<4) c.classList.toggle('vis',stOpen); });
  document.getElementById('strag-lbl').textContent=stOpen?'The Stragglers ▾':'The Stragglers ▸';
  highlight('stragglers');
  if(stOpen) flyTo('stragglers');
}

// ── Haulers web ────────────────────────────────────────────
let hOpen=true;
// Show haulers open by default
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('oc-lbl').textContent='Orbital Command ▾';
  document.querySelectorAll('.ae-child').forEach((c,i)=>{
    // children 4 and 5 are haulers (after the 4 straggler children)
    if(i===4||i===5) c.classList.add('vis');
  });
});
function toggleHaulers(){
  hOpen=!hOpen;
  const w=document.getElementById('hauler-web');
  w.style.opacity=hOpen?'1':'0'; w.style.pointerEvents=hOpen?'all':'none';
  // toggle hauler children
  const children=[document.getElementById('e-haulers-b'),document.getElementById('e-haulers-t')];
  children.forEach(c=>{ if(c) c.classList.toggle('vis',hOpen); });
  document.getElementById('oc-lbl').textContent=hOpen?'Orbital Command ▾':'Orbital Command ▸';
  highlight('orbital-command');
  flyTo('orbital-command');
}

// ── Wiki deep-link ─────────────────────────────────────────
// Maps asset id to wiki.js data id so we can open wiki.html
// and trigger that entry (wiki.js reads ?entry= on load)
const WIKI_IDS = {
  brisinger:         'fns-brisinger',
  dainn:             'fns-dáinn',
  freya:             'fns-freya',
  ivaldi:            'fns-ivaldi',
  mimir:             'fns-mimir',
  alsvin:            'fns-alsvin',
  muninn:            'fns-muninn',
  hugin:             'fns-hugin',
  bygul:             'fns-bygul',
  trjegul:           'fns-trjegul',
  muro:              'frank-muro',
  mairee:            'mairee',
  delta:             'the-delta',
  fold:              'the-zaytsev-aperture-fold',
  solbay:            'solbay',
  kepler:            'kepler-array',
  'yreus-array':     'yreus-array',
  'orbital-command': 'orbital-command',
  'orbit-one':       'orbit-one-the-eyes',
  'orbit-two':       'orbit-two-the-lungs',
  'orbit-three':     'orbital-three-the-ears',
  muspel:            'muspel',
  ysk:               'ysk',
  'ginnunga-gap':    'ginnunga-gap',
  ymir:              'ymir',
  nefir:             'nefir',
  skuld:             'skuld',
  verdandi:          'verdandi',
  urdra:             'urdra',
};

let wikiTab = null;

function wikiUrl(id) {
  const wikiId = WIKI_IDS[id] || id;
  return 'wiki.html?entry=' + encodeURIComponent(wikiId);
}

function openWiki(mapId, e) {
  e.preventDefault();
  e.stopPropagation();
  const wikiId = WIKI_IDS[mapId] || mapId;
  const url = 'wiki.html?entry=' + encodeURIComponent(wikiId);

  if (wikiTab && !wikiTab.closed) {
    let done = false;
    // Listen for acknowledgement from the wiki tab
    function onAck(ev) {
      if (ev.data?.type === 'entry-opened' && ev.data.entryId === wikiId) {
        done = true;
        window.removeEventListener('message', onAck);
      }
    }
    window.addEventListener('message', onAck);
    // Navigate to the correct URL (handles case where wiki tab is on wrong entry)
    wikiTab.location.href = url;
    // Retry sending the message until acknowledged (max 10 attempts × 200ms = 2s)
    let attempts = 0;
    function send() {
      if (done || attempts++ >= 10 || !wikiTab || wikiTab.closed) return;
      try { wikiTab.postMessage({ type: 'open-entry', entryId: wikiId }, '*'); } catch(e){}
      setTimeout(send, 200);
    }
    setTimeout(send, 300); // small delay for page to start loading
    wikiTab.focus();
  } else {
    wikiTab = window.open(url, 'unfolding-wiki');
  }
}

// Stamp correct href on all wiki links so they work even without JS
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.ae-wiki[data-wiki-id]').forEach(a => {
    const id = a.dataset.wikiId;
    a.href = wikiUrl(id);
  });

  // ── Email-gate the entire map for non-citizens ──
  // Hide the survey, drop a citizen-credentials card in its place.
  if (window.FoldGate && !window.FoldGate.isSubscribed()) {
    const pageEl = document.querySelector('.page');
    if (pageEl) pageEl.style.display = 'none';

    const gate = document.createElement('div');
    gate.style.cssText = 'min-height:calc(100vh - 60px);display:flex;align-items:center;justify-content:center;padding:40px 20px;background:var(--ink)';
    gate.innerHTML = `
      <div class="fg-lock" style="max-width:560px;">
        <div class="fg-lock-eyebrow">◈ Cartography · Restricted</div>
        <h2 class="fg-lock-heading">Access Astronomy</h2>
        <p class="fg-lock-body">
          We don't show the relays, the homesteads, or the Fold residue to passersby.
          Sign in your designation and the map unrolls.
        </p>
        <button type="button" class="fg-lock-cta" id="fg-map-cta">
          Access Astronomy <span aria-hidden="true">→</span>
        </button>
      </div>
    `;
    document.body.appendChild(gate);

    if (window._track) window._track('email_gate_shown', { source: 'map' });

    document.getElementById('fg-map-cta').addEventListener('click', () => {
      if (!window.FoldGate) return;
      if (window._track) window._track('email_gate_open', { source: 'map' });
      window.FoldGate.show({
        context: 'map',
        readerState: 'Currently reading',
        onSuccess: () => window.location.reload(),
      }).catch(() => {});
    });
  }
});

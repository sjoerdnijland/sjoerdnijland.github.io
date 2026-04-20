// Buy section — TEASER mode (book not yet available)
// To re-enable the full shop: swap the Buy function below with the one in the comment block at the bottom.

function Buy() {
  const { useState: useState_B, useEffect: useEffect_B } = React;
  const [timeLeft, setTimeLeft_B] = useState_B(null);

  useEffect_B(() => {
    const target = new Date('2026-05-01T00:00:00');
    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) { setTimeLeft_B(null); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft_B({ d, h, m, s });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="buy" className="buy-teaser">
      <div className="container">
        <div className="bt-inner">

          <svg className="bt-ornament" viewBox="0 0 80 80" width="64" height="64" aria-hidden="true">
            <circle cx="40" cy="40" r="28" fill="none" stroke="var(--rose)" strokeWidth="0.8" opacity="0.4"/>
            <circle cx="40" cy="40" r="18" fill="none" stroke="var(--rose)" strokeWidth="0.5" opacity="0.3"/>
            <circle cx="40" cy="40" r="5"  fill="var(--rose)" opacity="0.7"/>
            {[0,45,90,135,180,225,270,315].map((deg, i) => {
              const rad = deg * Math.PI / 180;
              const x1 = 40 + 18 * Math.cos(rad), y1 = 40 + 18 * Math.sin(rad);
              const x2 = 40 + 28 * Math.cos(rad), y2 = 40 + 28 * Math.sin(rad);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--rose)" strokeWidth="0.7" opacity="0.35"/>;
            })}
          </svg>

          <span className="mono-label">III / The Book</span>

          <h2 className="bt-date">
            Available<br/>
            <em>1st of May, 2026</em>
          </h2>

          <p className="bt-sub">
            Hardcover · Paperback · eBook<br/>
            Pre-order details coming soon.
          </p>

          {timeLeft && (
            <div className="bt-countdown">
              {[['d','days'],['h','hrs'],['m','min'],['s','sec']].map(([k, label]) => (
                <div key={k} className="bt-unit">
                  <span className="bt-num">{String(timeLeft[k]).padStart(2,'0')}</span>
                  <span className="bt-label">{label}</span>
                </div>
              ))}
            </div>
          )}

          <p className="bt-nudge">
            Join the community on{' '}
            <a href="https://discord.gg/45bwdn8J" className="bt-link" target="_blank" rel="noopener">Discord</a>.
          </p>

        </div>
      </div>

      <style>{`
        .buy-teaser {
          padding: 140px 0;
          background: linear-gradient(180deg, transparent, rgba(45,91,102,0.08), transparent);
        }
        .bt-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 20px;
        }
        .bt-ornament { opacity: 0.9; animation: btSpin 24s linear infinite; }
        @keyframes btSpin { to { transform: rotate(360deg); } }

        .bt-date {
          font-family: var(--serif);
          font-size: clamp(2.4rem, 5vw, 4.2rem);
          font-weight: 300;
          line-height: 1.1;
          color: var(--ivory);
          margin: 0;
        }
        .bt-date em { color: var(--rose); font-style: italic; }

        .bt-sub {
          font-family: var(--serif);
          font-size: 1.05rem;
          font-style: italic;
          color: var(--muted);
          margin: 0;
          line-height: 1.7;
        }

        .bt-countdown {
          display: flex;
          gap: 0;
          align-items: flex-end;
          margin: 8px 0;
          padding: 20px 32px;
          border: 1px solid var(--line-strong);
          background: rgba(6,22,25,0.6);
        }
        .bt-unit {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          min-width: 64px;
        }
        .bt-unit + .bt-unit {
          border-left: 1px solid var(--line);
        }
        .bt-num {
          font-family: var(--mono);
          font-size: 2rem;
          font-weight: 500;
          color: var(--ivory);
          letter-spacing: 0.05em;
          line-height: 1;
        }
        .bt-label {
          font-family: var(--mono);
          font-size: 0.58rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .bt-nudge {
          font-family: var(--serif);
          font-size: 0.95rem;
          color: var(--muted);
          font-style: italic;
          margin: 0;
        }
        .bt-link {
          color: var(--rose);
          border-bottom: 1px solid var(--rose);
          padding-bottom: 1px;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .bt-link:hover { opacity: 0.7; }

        @media (max-width: 600px) {
          .bt-countdown { padding: 16px 20px; }
          .bt-unit { min-width: 52px; }
          .bt-num { font-size: 1.5rem; }
        }
      `}</style>
    </section>
  );
}

window.Buy = Buy;


/* ============================================================
   FULL BUY SECTION — uncomment and replace Buy() above
   when the book is available on 1 May 2026.
   ============================================================

const FORMATS = [
  { id:'hardcover', name:'First Edition Hardcover', sub:'Cloth-bound · Dust jacket · 428 pages',
    price:34.00, currency:'€', tagline:'A physical object built to survive the unfold.',
    features:['Signed bookplate available','Endpapers with star chart','Free bookmark'], badge:"Editor's pick" },
  { id:'paperback', name:'Trade Paperback', sub:'Soft-cover · 428 pages',
    price:18.50, currency:'€', tagline:'Lighter. Lives in backpacks and waiting rooms.',
    features:['Matte finish','French flaps','Travel-friendly'] },
  { id:'ebook', name:'eBook', sub:'Kindle · Apple Books · Kobo · EPUB',
    price:9.99, currency:'€', tagline:'Unfolds on any screen. DRM-free EPUB available.',
    features:['Instant delivery','DRM-free EPUB option','All retailers supported'] },
];

function Buy() {
  const { useState: useState_B } = React;
  const [format, setFormat] = useState_B('hardcover');
  const [qty, setQty] = useState_B(1);
  const [retailer, setRetailer] = useState_B('direct');
  const [stage, setStage] = useState_B('choose');
  // ... full implementation — restore from git or previous build output
}

window.Buy = Buy;
============================================================ */

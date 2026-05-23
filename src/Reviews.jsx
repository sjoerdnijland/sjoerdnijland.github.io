// Reviews — quiet social-proof segment driven by data/critical-reviews.json.
function Reviews() {
  const { useEffect, useRef, useState } = React;
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [pick, setPick] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch('data/critical-reviews.json', { cache: 'no-cache' })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(list => {
        if (!alive || !Array.isArray(list) || list.length === 0) return;
        const featured = list.find(r => r && r.featured) || list[0];
        setPick(featured);
      })
      .catch(err => console.warn('Critical reviews load failed:', err));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [pick]);

  if (!pick) return null;

  return (
    <section id="reviews" className={`rv-promo ${visible ? 'rv-promo-in' : ''}`} ref={ref}>
      <div className="container-narrow">
        <div className="rv-promo-card">
          {pick.badge && (
            <a
              href={pick.source_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="rv-promo-badge"
              aria-label={`${pick.source} ${pick.overall || 5}-star review`}
            >
              <img src={pick.badge} alt={`${pick.source} — ${pick.overall || 5}-star review`} loading="lazy" />
            </a>
          )}

          <div className="rv-promo-body">
            <span className="rv-promo-eyebrow">◈ Critical reception</span>

            <blockquote className="rv-promo-quote">
              <span className="rv-promo-mark">"</span>
              <em>{pick.headline}</em>
              <span className="rv-promo-mark">"</span>
            </blockquote>

            {pick.tail && <p className="rv-promo-tail">{pick.tail}</p>}

            <div className="rv-promo-attrib">
              <span className="rv-promo-name">{pick.reviewer}</span>
              <span className="rv-promo-dot">·</span>
              <span className="rv-promo-source">{pick.source}</span>
              {pick.total != null && pick.max_total != null && (
                <>
                  <span className="rv-promo-dot">·</span>
                  <span className="rv-promo-total">{pick.total}/{pick.max_total}</span>
                </>
              )}
            </div>

            <a href="reviews.html" className="rv-promo-link">
              Read all reviews <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .rv-promo {
          padding: 90px 0 100px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.8s cubic-bezier(0.22,1,0.36,1),
                      transform 0.8s cubic-bezier(0.22,1,0.36,1);
        }
        .rv-promo-in { opacity: 1; transform: none; }

        .rv-promo-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 44px;
          align-items: center;
          padding: 44px 48px;
          border: 1px solid var(--line);
          border-radius: 4px;
          background:
            radial-gradient(ellipse at 0% 50%, rgba(232,164,124,0.05) 0%, transparent 55%),
            rgba(6,22,25,0.45);
          transition: border-color 0.4s, background 0.4s;
        }
        .rv-promo-card:hover {
          border-color: rgba(232,164,124,0.28);
        }

        .rv-promo-badge {
          display: block;
          flex-shrink: 0;
          width: 124px;
          height: 124px;
          opacity: 0.88;
          transition: opacity 0.3s, transform 0.3s;
          filter: drop-shadow(0 6px 18px rgba(0,0,0,0.4));
        }
        .rv-promo-badge:hover {
          opacity: 1;
          transform: scale(1.03);
        }
        .rv-promo-badge img {
          width: 100%;
          height: 100%;
          display: block;
        }

        .rv-promo-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .rv-promo-eyebrow {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .rv-promo-quote {
          margin: 0;
          font-family: var(--serif);
          font-weight: 300;
          font-size: clamp(1.5rem, 2.6vw, 2rem);
          line-height: 1.25;
          color: var(--ivory);
          position: relative;
        }
        .rv-promo-quote em {
          font-style: italic;
          color: var(--ivory);
        }
        .rv-promo-mark {
          color: rgba(232,164,124,0.7);
          font-family: var(--serif);
          font-size: 1.1em;
          opacity: 0.85;
          padding: 0 2px;
        }

        .rv-promo-tail {
          margin: 0;
          font-family: var(--serif);
          font-size: 1.02rem;
          line-height: 1.6;
          color: var(--ivory-2, var(--ivory));
          opacity: 0.78;
          font-style: italic;
          font-weight: 300;
        }

        .rv-promo-attrib {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          font-family: var(--mono);
          font-size: 0.66rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--muted);
          margin-top: 6px;
        }
        .rv-promo-name { color: var(--ivory); letter-spacing: 0.14em; }
        .rv-promo-dot { opacity: 0.5; }
        .rv-promo-source { color: #e8a47c; }
        .rv-promo-total {
          color: #e8a47c;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.12em;
        }

        .rv-promo-link {
          align-self: flex-start;
          margin-top: 8px;
          font-family: var(--mono);
          font-size: 0.66rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--rose);
          text-decoration: none;
          transition: opacity 0.2s, gap 0.2s;
          display: inline-flex;
          gap: 8px;
          align-items: center;
        }
        .rv-promo-link:hover { opacity: 0.75; gap: 12px; }

        @media (max-width: 720px) {
          .rv-promo { padding: 60px 0 70px; }
          .rv-promo-card {
            grid-template-columns: 1fr;
            gap: 24px;
            padding: 32px 24px;
            text-align: left;
            justify-items: start;
          }
          .rv-promo-badge { width: 96px; height: 96px; }
          .rv-promo-quote { font-size: 1.4rem; }
          .rv-promo-tail { font-size: 0.95rem; }
        }
      `}</style>
    </section>
  );
}

window.Reviews = Reviews;

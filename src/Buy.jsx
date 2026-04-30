// Buy section — LIVE (book available May 2026)
function Buy() {
  const { useState: useState_B, useRef: useRef_B, useEffect: useEffect_B } = React;
  const [visible, setVisible] = useState_B(false);
  const ref = useRef_B(null);

  useEffect_B(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const RETAILERS = [
    {
      id: 'ebook',
      label: 'eBook',
      price: '€12.50',
      available: true,
      stores: [
        { name: 'Kobo',      url: 'https://www.kobo.com/nl/nl/ebook/the-unfolding-15?sId=d9bffa5d-c38a-47b2-bde7-e8741c39fccd&ssId=HrqTDzPM0i5FGl_URGUHc&cPos=1', icon: '◈' },
        { name: 'Bol.com',   url: 'https://www.bol.com/nl/nl/p/the-unfolding/9300000279913241/?cid=1777568759576-9294702268964&bltgh=5a6a8650-ce9b-46b6-aefd-36ddc2508fd8.ProductList_Middle.0.ProductTitle', icon: '◈' },
        { name: 'Bookmundo', url: 'https://publishnl.bookmundo.com/books/22065296', icon: '◈' },
      ],
    },
    {
      id: 'hardcover',
      label: 'Hardcover',
      price: 'June 1st',
      available: false,
      note: 'First edition · Cloth-bound',
      stores: [],
    },
  ];

  return (
    <section id="buy" className={`buy-live ${visible ? 'buy-visible' : ''}`} ref={ref}>
      <div className="container">

        {/* Header */}
        <div className="bl-head">
          <span className="mono-label">III / Get the Book</span>
          <h2 className="bl-title">
            The Unfolding<br/>
            <em>is out now.</em>
          </h2>
          <p className="bl-sub">
            eBook available today. Hardcover arriving June 1st.
          </p>
        </div>

        {/* Format cards */}
        <div className="bl-formats">
          {RETAILERS.map((fmt, fi) => (
            <div
              key={fmt.id}
              className={`bl-card ${!fmt.available ? 'bl-card--soon' : ''}`}
              style={{ animationDelay: `${fi * 0.12}s` }}
            >
              <div className="bl-card-top">
                <div className="bl-card-label">{fmt.label}</div>
                <div className="bl-card-price">{fmt.price}</div>
              </div>
              {fmt.note && <p className="bl-card-note">{fmt.note}</p>}

              {fmt.available ? (
                <div className="bl-stores">
                  {fmt.stores.map(s => (
                    <a
                      key={s.name}
                      href={s.url}
                      className="bl-store-btn"
                      target="_blank"
                      rel="noopener"
                    >
                      <span className="bl-store-arrow">→</span>
                      {s.name}
                    </a>
                  ))}
                </div>
              ) : (
                <div className="bl-soon-badge">Coming 1 June 2026</div>
              )}
            </div>
          ))}
        </div>

        {/* Goodreads + Reader row */}
        <div className="bl-actions">
          <a
            href="https://www.goodreads.com/book/show/251501817-the-unfolding?from_search=true&from_srp=true&qid=Qxvp1Kd87t&rank=1"
            className="bl-action-link"
            target="_blank"
            rel="noopener"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{opacity:0.7}}>
              <path d="M19.5 3h-15A1.5 1.5 0 0 0 3 4.5v15A1.5 1.5 0 0 0 4.5 21h15a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 19.5 3zm-7 13.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
            </svg>
            Add on Goodreads
          </a>
          <span className="bl-sep">·</span>
          <a href="reader.html" className="bl-action-link">
            ▶ Read the first chapter free
          </a>
          <span className="bl-sep">·</span>
          <a href="https://discord.gg/45bwdn8J" className="bl-action-link" target="_blank" rel="noopener">
            💬 Join the Discord
          </a>
        </div>

      </div>

      <style>{`
        /* ── Section ──────────────────────────────────────────── */
        .buy-live {
          padding: 140px 0;
          background: linear-gradient(180deg, transparent, rgba(45,91,102,0.06), transparent);
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1);
        }
        .buy-live.buy-visible { opacity: 1; transform: none; }

        /* ── Header ───────────────────────────────────────────── */
        .bl-head {
          text-align: center;
          margin-bottom: 56px;
        }
        .bl-title {
          font-family: var(--serif);
          font-size: clamp(2.4rem, 5vw, 4rem);
          font-weight: 300;
          line-height: 1.05;
          color: var(--ivory);
          margin: 16px 0 14px;
        }
        .bl-title em { color: var(--rose); font-style: italic; }
        .bl-sub {
          font-family: var(--serif);
          font-style: italic;
          color: var(--muted);
          font-size: 1.05rem;
          margin: 0;
        }

        /* ── Format cards ─────────────────────────────────────── */
        .bl-formats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          max-width: 780px;
          margin: 0 auto 40px;
        }
        .bl-card {
          border: 1px solid var(--line-strong);
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          background: rgba(6,22,25,0.5);
          transition: border-color 0.25s, box-shadow 0.25s;
          animation: blCardIn 0.6s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes blCardIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: none; }
        }
        .buy-visible .bl-card { animation-play-state: running; }
        .bl-card:not(.bl-card--soon):hover {
          border-color: rgba(233,74,124,0.5);
          box-shadow: 0 0 32px rgba(233,74,124,0.1);
        }
        .bl-card--soon {
          opacity: 0.6;
          border-style: dashed;
        }

        .bl-card-top {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
        }
        .bl-card-label {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .bl-card-price {
          font-family: var(--serif);
          font-size: 1.4rem;
          font-weight: 300;
          color: var(--ivory);
          letter-spacing: -0.01em;
        }
        .bl-card--soon .bl-card-price {
          font-family: var(--mono);
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .bl-card-note {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.14em;
          color: var(--muted);
          margin: -8px 0 0;
          text-transform: uppercase;
        }

        /* ── Store buttons ────────────────────────────────────── */
        .bl-stores {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .bl-store-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border: 1px solid var(--line);
          background: transparent;
          color: var(--ivory);
          font-family: var(--mono);
          font-size: 0.68rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          border-radius: 2px;
          transition: border-color 0.2s, color 0.2s, background 0.2s, padding-left 0.2s;
        }
        .bl-store-btn:hover {
          border-color: var(--rose);
          color: var(--rose);
          background: rgba(233,74,124,0.06);
          padding-left: 18px;
        }
        .bl-store-arrow {
          color: var(--rose);
          font-size: 0.75rem;
          transition: transform 0.2s;
        }
        .bl-store-btn:hover .bl-store-arrow { transform: translateX(3px); }

        /* ── Coming soon badge ────────────────────────────────── */
        .bl-soon-badge {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
          border: 1px dashed var(--line);
          padding: 10px 14px;
          text-align: center;
          border-radius: 2px;
        }

        /* ── Actions row ──────────────────────────────────────── */
        .bl-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
          max-width: 780px;
          margin: 0 auto;
          padding-top: 28px;
          border-top: 1px solid var(--line);
        }
        .bl-action-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-family: var(--mono);
          font-size: 0.66rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
          text-decoration: none;
          transition: color 0.2s;
        }
        .bl-action-link:hover { color: var(--ivory); }
        .bl-sep {
          color: var(--line-strong);
          font-size: 1rem;
        }

        /* ── Mobile ───────────────────────────────────────────── */
        @media (max-width: 620px) {
          .buy-live { padding: 80px 0 100px; }
          .bl-formats { grid-template-columns: 1fr; max-width: 420px; }
          .bl-actions { gap: 10px; }
          .bl-sep { display: none; }
        }
      `}</style>
    </section>
  );
}

window.Buy = Buy;

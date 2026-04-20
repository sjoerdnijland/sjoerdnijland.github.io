// Portal — teaser linking out to Wiki and Feed (separate pages)
function Portal() {
  return (
    <section id="portal" className="portal">
      <div className="container">
        <div className="section-head center">
          <span className="mono-label">IV / Enter the World</span>
          <h2 className="section-title">Mairee does not stop <em>on the last page.</em></h2>
          <p className="section-sub">Two doors, for readers who want to stay longer.</p>
        </div>

        <div className="portal-grid">
          <a href="wiki.html" className="portal-card portal-wiki">
            <div className="portal-bg" style={{ backgroundImage: 'url(assets/still-pool.webp)' }} />
            <div className="portal-veil" />
            <div className="portal-content">
              <span className="mono-label">The Wiki</span>
              <h3>A Reader's Wiki</h3>
              <p>
                Characters, ships, orbitals, rituals, and the Maireean calendar of Pulse /
                Beat / Thud / Click / Cycle. Light spoilers only. The deeper it goes, the
                more carefully it speaks.
              </p>
              <span className="portal-cta">Open the Wiki <span className="arr">→</span></span>
            </div>
          </a>

          <a href="feed.html" className="portal-card portal-feed">
            <div className="portal-bg" style={{ backgroundImage: 'url(assets/still-couple.png)' }} />
            <div className="portal-veil" />
            <div className="portal-content">
              <span className="mono-label">The Feed</span>
              <h3>Where Readers Unfold Together</h3>
              <p>
                A community of first-time readers, re-readers, theorists, and the
                occasional verified author. Post a passage. Propose a theory. Confess a
                re-read.
              </p>
              <span className="portal-cta">Enter the Feed <span className="arr">→</span></span>
            </div>
          </a>
        </div>
      </div>

      <style>{`
        .portal { padding: 140px 0; }
        .portal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 40px; }
        .portal-card {
          position: relative; display: block;
          aspect-ratio: 4/3;
          overflow: hidden;
          border: 1px solid var(--line);
          color: var(--ivory);
          transition: all 0.35s ease;
        }
        .portal-card:hover { border-color: var(--rose); transform: translateY(-4px); }
        .portal-bg {
          position: absolute; inset: 0;
          background-size: cover; background-position: center;
          filter: saturate(0.55) contrast(1.05) brightness(0.7);
          transition: transform 0.7s ease, filter 0.5s ease;
        }
        .portal-card:hover .portal-bg { transform: scale(1.05); filter: saturate(0.9) contrast(1.1) brightness(0.85); }
        .portal-veil {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(6,22,25,0.2) 0%, rgba(6,22,25,0.85) 70%, rgba(6,22,25,0.95) 100%);
        }
        .portal-content {
          position: absolute; inset: 0;
          padding: 36px;
          display: flex; flex-direction: column; justify-content: flex-end;
          gap: 12px;
        }
        .portal-content h3 {
          font-size: clamp(1.8rem, 3vw, 2.6rem);
          line-height: 1.05;
          color: var(--ivory);
        }
        .portal-content p {
          font-family: var(--serif); font-size: 1.05rem; line-height: 1.55;
          color: var(--ivory-2); max-width: 440px; margin: 0;
        }
        .portal-cta {
          margin-top: 16px;
          font-family: var(--mono); font-size: 0.78rem;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--rose);
          display: inline-flex; align-items: center; gap: 8px;
          padding-top: 14px; border-top: 1px solid var(--line);
        }
        .portal-card:hover .arr { transform: translateX(4px); }
        .arr { transition: transform 0.3s; display: inline-block; }

        @media (max-width: 820px) {
          .portal-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}

window.Portal = Portal;

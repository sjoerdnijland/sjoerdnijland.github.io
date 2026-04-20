// CodexInvite — full-width invitation to the reader's wiki
function CodexInvite() {
  return (
    <section id="codex" className="codex-invite">
      <div className="container">
        <div className="ci-inner">
          <div className="ci-bg" />
          <div className="ci-veil" />
          <div className="ci-content">
            <span className="mono-label">The WIKI · A Reader's Companion</span>
            <h2 className="ci-title">
              Explore <br/><em>the unknown.</em>
            </h2>
            <p className="ci-body">
              The world of <em>The Unfolding</em> runs deeper than any single reading.
              The Codex is a spoiler-aware companion to scout characters, ships, locations,
              factions, lore, and a full timeline. Set where you are in the book
              and explore freely without spoilers.
            </p>
            <div className="ci-features">
              {[
                '40 characters with appearance notes',
                'Ships, locations, items & factions',
                'Full lore glossary & story timeline',
                'Spoilers locked to your chapter',
              ].map(f => (
                <div key={f} className="ci-feat">
                  <span className="ci-glyph">◈</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <a href="wiki.html" className="btn btn-primary ci-cta">
              Open the WIKI <span style={{ fontSize: '1.1em' }}>→</span>
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .codex-invite { padding: 140px 0; }

        .ci-inner {
          position: relative;
          overflow: hidden;
          min-height: 480px;
          display: flex;
          align-items: center;
          border: 1px solid var(--line);
        }

        .ci-bg {
          position: absolute; inset: 0;
          background-image: url('assets/still-pool.webp');
          background-size: cover;
          background-position: center;
          filter: saturate(0.5) contrast(1.05) brightness(0.55);
          transition: transform 0.8s ease;
        }
        .ci-inner:hover .ci-bg { transform: scale(1.03); }

        .ci-veil {
          position: absolute; inset: 0;
          background: linear-gradient(
            105deg,
            rgba(6,22,25,0.97) 40%,
            rgba(6,22,25,0.65) 70%,
            rgba(6,22,25,0.25) 100%
          );
        }

        .ci-content {
          position: relative;
          z-index: 2;
          padding: 72px 80px;
          max-width: 660px;
        }

        .ci-title {
          font-size: clamp(2.4rem, 4.5vw, 3.8rem);
          line-height: 1.05;
          font-weight: 300;
          margin: 18px 0 24px;
        }
        .ci-title em { color: var(--rose); font-style: italic; }

        .ci-body {
          font-family: var(--serif);
          font-size: 1.15rem;
          line-height: 1.7;
          color: var(--ivory-2);
          font-weight: 300;
          margin-bottom: 36px;
        }
        .ci-body em { color: var(--rose-soft); font-style: italic; }

        .ci-features {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 32px;
          margin-bottom: 40px;
        }

        .ci-feat {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--mono);
          font-size: 0.74rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ivory-2);
        }
        .ci-glyph { color: var(--rose); font-size: 0.85rem; flex-shrink: 0; }

        .ci-cta { font-size: 0.78rem; padding: 16px 28px; }

        @media (max-width: 820px) {
          .ci-content { padding: 48px 32px; }
          .ci-features { grid-template-columns: 1fr; }
          .ci-inner { min-height: unset; }
          .ci-veil {
            background: linear-gradient(180deg, rgba(6,22,25,0.94) 0%, rgba(6,22,25,0.75) 100%);
          }
        }
      `}</style>
    </section>
  );
}

window.CodexInvite = CodexInvite;

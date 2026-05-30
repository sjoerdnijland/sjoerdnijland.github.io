// JoinFold — homepage section inviting visitors to become Mairee Citizens.
// CTA opens the inline FoldGate overlay (same Discord + email signup paths
// used by the gated reader / wiki / map). One unified entry point.

function JoinFold() {
  const openGate = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (window._track) window._track('join_fold_cta', { source: 'home_section' });
    if (window.FoldGate) {
      window.FoldGate.show({
        context: 'default',
        readerState: 'Just arriving',
      }).catch(() => { /* dismissed */ });
    } else {
      // Fallback if fold-gate.js hasn't loaded — send them to /enter.
      window.location.href = 'enter.html';
    }
  };

  const benefits = [
    { glyph: '◈', label: 'Early access to Part Two — Undergrowth' },
    { glyph: '◈', label: 'Exclusive content the open broadcast doesn\'t carry' },
    { glyph: '◈', label: '25% citizen discount on the colony commissary' },
    { glyph: '◈', label: 'Author notes from S. Nyland between transmissions' },
  ];

  return (
    <section id="join" className="join-fold">
      <div className="container">
        <div className="jf-inner">
          <div className="jf-bg" />
          <div className="jf-veil" />
          <div className="jf-content">
            <span className="mono-label">◈ Mairee Citizens · Intake</span>
            <h2 className="jf-title">
              Join <br/><em>the Fold.</em>
            </h2>
            <p className="jf-body">
              The colony keeps a register. Citizens receive transmissions from the Uplink —
              and a few things the open broadcast doesn't carry.
            </p>

            <div className="jf-benefits">
              {benefits.map((b, i) => (
                <div key={i} className="jf-benefit">
                  <span className="jf-glyph">{b.glyph}</span>
                  <span>{b.label}</span>
                </div>
              ))}
            </div>

            <button type="button" className="btn btn-primary jf-cta" onClick={openGate}>
              Sign in your designation <span style={{ fontSize: '1.1em' }}>→</span>
            </button>

            <p className="jf-note">
              You will receive transmissions in your inbox. About one every two weeks.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .join-fold { padding: 140px 0; position: relative; }

        .jf-inner {
          position: relative;
          overflow: hidden;
          min-height: 520px;
          display: flex;
          align-items: center;
          border: 1px solid var(--line);
          border-radius: 2px;
        }

        .jf-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse at 30% 20%, rgba(233,74,124,0.22), transparent 55%),
            radial-gradient(ellipse at 90% 80%, rgba(45,91,102,0.32), transparent 55%),
            linear-gradient(160deg, #061619 0%, #0b2227 60%, #1a0a14 100%);
        }
        .jf-bg::after {
          content: "";
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.4 0'/></filter><rect width='220' height='220' filter='url(%23n)'/></svg>");
          opacity: 0.06;
          mix-blend-mode: overlay;
        }
        .jf-veil {
          position: absolute; inset: 0;
          background:
            linear-gradient(180deg, rgba(6,22,25,0.40) 0%, rgba(6,22,25,0.75) 100%);
        }

        .jf-content {
          position: relative;
          z-index: 2;
          padding: 80px 80px;
          max-width: 720px;
          margin: 0 auto;
        }

        .jf-title {
          font-size: clamp(2.6rem, 5.2vw, 4.4rem);
          line-height: 1.0;
          font-weight: 300;
          margin: 22px 0 28px;
          letter-spacing: -0.01em;
        }
        .jf-title em { color: var(--rose); font-style: italic; }

        .jf-body {
          font-family: var(--serif);
          font-size: 1.22rem;
          line-height: 1.7;
          color: var(--ivory);
          font-weight: 300;
          margin-bottom: 36px;
          max-width: 560px;
        }

        .jf-benefits {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px 36px;
          margin-bottom: 44px;
        }
        .jf-benefit {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-family: var(--serif);
          font-size: 1.04rem;
          line-height: 1.4;
          color: var(--ivory-2);
        }
        .jf-glyph {
          color: var(--rose);
          font-size: 0.95rem;
          flex-shrink: 0;
          line-height: 1.5;
        }

        .jf-cta {
          font-size: 0.84rem;
          padding: 18px 32px;
          letter-spacing: 0.18em;
          font-weight: 500;
        }

        .jf-note {
          margin: 22px 0 0;
          font-family: var(--mono);
          font-size: 0.66rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
        }

        @media (max-width: 820px) {
          .join-fold { padding: 80px 0; }
          .jf-content { padding: 56px 32px; }
          .jf-benefits { grid-template-columns: 1fr; gap: 12px; }
          .jf-inner { min-height: unset; }
          .jf-body { font-size: 1.1rem; }
        }
      `}</style>
    </section>
  );
}

window.JoinFold = JoinFold;

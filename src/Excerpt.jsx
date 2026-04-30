// Excerpt — immersive reader/narration teaser (replaces inline reading)
// Design direction: atmospheric, cinematic, draws the eye toward the reader CTA.
// Shows a haunting fragment of the opening, then gates the rest behind the reader.
function Excerpt() {
  const { useState, useEffect, useRef } = React;
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="excerpt" className="excerpt-teaser" ref={ref}>
      <div className="container-narrow">

        {/* Section label */}
        <div className={`et-head ${visible ? 'et-visible' : ''}`}>
          <span className="mono-label">II / First Pages</span>
          <h2 className="et-title">Freya Homestead, <em>Mairee</em></h2>
          <p className="et-sub">A transmission. A command. A blackout.</p>
        </div>

        {/* Uplink card — atmospheric teaser */}
        <div className={`et-uplink ${visible ? 'et-visible' : ''}`} style={{ animationDelay: '0.15s' }}>
          <span className="mono-label">◉ Uplink · unknown origin</span>
          <p className="et-uplink-text">
            There is a song in the stone. And if you listen, you can hear the math
            starting to fail. To <em>unfold</em>. You weren't there. But you're next.
          </p>
          <p className="et-uplink-text">
            You're on the planet <strong>Mairee</strong>,<br/>
            the moment the hum of the station changed.
          </p>
        </div>

        {/* The opening line — then fade to gate */}
        <div className={`et-fragment-wrap ${visible ? 'et-visible' : ''}`} style={{ animationDelay: '0.3s' }}>
          <p className="et-drop">
            The Comms-Bay, usually a hive of digital chatter, was silent. All eyes
            were on the Mission Commander, Astrid Vilde. And that silence was the
            loudest scream she had ever heard. She knew it was bad when she heard
            her own blood rushing in her ears. <em>Whoosh. Whoosh. Whoosh.</em>
          </p>
          {/* Fade-to-gate */}
          <div className="et-gate">
            <div className="et-gate-fade"></div>
            <div className="et-gate-content">
              <p className="et-gate-line">The story continues in the Reader.</p>
              <div className="et-ctas">
                {/* Primary: full immersive experience */}
                <a href="reader.html" className="et-btn-primary">
                  <span className="et-btn-rings">
                    <span className="et-ring"></span>
                    <span className="et-ring et-ring--2"></span>
                  </span>
                  <span className="et-btn-icon">▶</span>
                  <span className="et-btn-inner">
                    <span className="et-btn-label">Listen &amp; Read</span>
                    <span className="et-btn-sub">Narrated · Full cast · Free</span>
                  </span>
                </a>
                {/* Secondary: just read */}
                <a href="reader.html" className="et-btn-secondary">
                  Read only →
                </a>
              </div>
              {/* Features row */}
              <div className="et-features">
                {[
                  ['▶', 'Charlotte narrates'],
                  ['◉', 'Full character voices'],
                  ['♪', 'Ambient soundscape'],
                  ['💬', 'Community threads'],
                ].map(([icon, label]) => (
                  <div key={label} className="et-feature">
                    <span className="et-feature-icon">{icon}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        /* ── Section ──────────────────────────────────────── */
        .excerpt-teaser {
          padding: 120px 0 140px;
          position: relative;
        }

        /* ── Scroll-reveal animation ──────────────────────── */
        .et-head, .et-uplink, .et-fragment-wrap {
          opacity: 0;
          transform: translateY(22px);
        }
        .et-head.et-visible,
        .et-uplink.et-visible,
        .et-fragment-wrap.et-visible {
          animation: etReveal 0.7s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        @keyframes etReveal {
          to { opacity: 1; transform: none; }
        }

        /* ── Section head ─────────────────────────────────── */
        .et-head { margin-bottom: 48px; }
        .et-title {
          font-family: var(--serif);
          font-size: clamp(1.8rem, 3.5vw, 2.8rem);
          font-weight: 300;
          color: var(--ivory);
          margin: 14px 0 10px;
          line-height: 1.1;
        }
        .et-title em { color: var(--rose); font-style: italic; }
        .et-sub {
          font-family: var(--serif);
          font-style: italic;
          color: var(--muted);
          font-size: 1.05rem;
          margin: 0;
        }

        /* ── Uplink card ──────────────────────────────────── */
        .et-uplink {
          max-width: 640px;
          margin-bottom: 52px;
          padding: 26px 30px;
          border-left: 2px solid var(--rose);
          background: linear-gradient(90deg, rgba(233,74,124,0.06), transparent 60%);
          animation-delay: 0.15s;
        }
        .et-uplink .mono-label { display: block; margin-bottom: 14px; }
        .et-uplink-text {
          font-family: var(--serif);
          font-size: 1.1rem;
          line-height: 1.65;
          color: var(--ivory-2);
          margin: 0 0 0.9em;
          font-style: italic;
          font-weight: 300;
        }
        .et-uplink-text:last-child { margin-bottom: 0; }
        .et-uplink-text em { color: var(--rose-soft); }
        .et-uplink-text strong { color: var(--rose); font-weight: 500; }

        /* ── Opening fragment ─────────────────────────────── */
        .et-fragment-wrap {
          position: relative;
          max-width: 680px;
          animation-delay: 0.3s;
        }
        .et-drop {
          font-family: var(--serif);
          font-size: 1.22rem;
          line-height: 1.78;
          color: var(--ivory-2);
          font-weight: 300;
          margin: 0;
        }
        .et-drop::first-letter {
          font-family: var(--serif);
          font-size: 5em;
          float: left;
          line-height: 0.82;
          padding: 0.08em 0.1em 0 0;
          color: var(--rose);
          font-weight: 500;
        }
        .et-drop em { color: var(--rose-soft); font-style: italic; }

        /* ── Gate / CTA area ──────────────────────────────── */
        .et-gate {
          position: relative;
          margin-top: -60px;
          padding-top: 60px;
        }
        .et-gate-fade {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 90px;
          background: linear-gradient(to bottom, transparent, var(--ink));
          pointer-events: none;
        }
        .et-gate-content {
          padding-top: 12px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 20px;
        }
        .et-gate-line {
          font-family: var(--serif);
          font-style: italic;
          color: var(--muted);
          font-size: 1rem;
          margin: 0;
        }

        /* ── CTAs ─────────────────────────────────────────── */
        .et-ctas {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        /* Primary listen button */
        .et-btn-primary {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 14px;
          padding: 16px 28px 16px 22px;
          background: rgba(233,74,124,0.1);
          border: 1px solid rgba(233,74,124,0.5);
          border-radius: 50px;
          color: var(--rose);
          text-decoration: none;
          transition: background 0.25s, border-color 0.25s, box-shadow 0.25s, transform 0.15s;
          box-shadow: 0 0 32px rgba(233,74,124,0.2), inset 0 0 20px rgba(233,74,124,0.04);
        }
        .et-btn-primary:hover {
          background: rgba(233,74,124,0.18);
          border-color: rgba(233,74,124,0.85);
          box-shadow: 0 0 56px rgba(233,74,124,0.38), 0 0 100px rgba(233,74,124,0.12);
          transform: translateY(-2px);
          color: var(--rose);
        }
        .et-btn-primary:active { transform: scale(0.97); }

        /* Pulsing rings */
        .et-btn-rings {
          position: absolute;
          inset: -1px;
          border-radius: 50px;
          pointer-events: none;
        }
        .et-ring {
          position: absolute;
          inset: 0;
          border-radius: 50px;
          border: 1px solid rgba(233,74,124,0.45);
          animation: etRing 3s ease-out infinite;
        }
        .et-ring--2 { animation-delay: 1.5s; }
        @keyframes etRing {
          0%   { transform: scale(1);    opacity: 0.55; }
          65%  { transform: scale(1.2);  opacity: 0; }
          100% { transform: scale(1.2);  opacity: 0; }
        }
        .et-btn-primary:hover .et-ring { animation: none; opacity: 0; }

        .et-btn-icon {
          font-size: 1rem;
          flex-shrink: 0;
          transition: transform 0.2s;
        }
        .et-btn-primary:hover .et-btn-icon { transform: scale(1.2); }

        .et-btn-inner {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .et-btn-label {
          font-family: var(--mono);
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-weight: 500;
        }
        .et-btn-sub {
          font-family: var(--mono);
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          opacity: 0.6;
        }

        /* Secondary read-only link */
        .et-btn-secondary {
          font-family: var(--mono);
          font-size: 0.72rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--muted);
          text-decoration: none;
          border-bottom: 1px solid transparent;
          padding-bottom: 2px;
          transition: color 0.2s, border-color 0.2s;
        }
        .et-btn-secondary:hover {
          color: var(--ivory);
          border-color: var(--line-strong);
        }

        /* ── Feature tags ─────────────────────────────────── */
        .et-features {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 20px;
          margin-top: 4px;
        }
        .et-feature {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .et-feature-icon {
          color: var(--teal-bright, #4a9aaa);
          font-size: 0.7rem;
        }

        /* ── Mobile ───────────────────────────────────────── */
        @media (max-width: 600px) {
          .excerpt-teaser { padding: 80px 0 100px; }
          .et-drop { font-size: 1.08rem; }
          .et-btn-primary { padding: 14px 22px 14px 18px; }
          .et-btn-label { font-size: 0.68rem; }
          .et-ctas { gap: 16px; }
          .et-features { gap: 8px 14px; }
        }
      `}</style>
    </section>
  );
}

window.Excerpt = Excerpt;

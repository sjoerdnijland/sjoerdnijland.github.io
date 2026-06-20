function Trailer() {
  return (
    <section id="trailer" style={{
      padding: '100px 0',
      background: 'var(--ink-2)',
      borderTop: '1px solid var(--line)',
      borderBottom: '1px solid var(--line)',
    }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <span className="section-label">Book Trailer</span>
        <h2 className="section-title">Enter the world.</h2>
        <div style={{
          maxWidth: '860px',
          margin: '0 auto',
          aspectRatio: '16 / 9',
          background: '#000',
          borderRadius: '3px',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,.7)',
        }}>
          <iframe
            src="https://www.veed.io/embed/82331e98-eafc-4fdb-b4fc-05d3c41b2e20"
            title="The Unfolding — Official Book Trailer"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
        </div>
      </div>
    </section>
  );
}
// Wiki — standalone page, richer codex with imagery
const { useState, useMemo } = React;

const WIKI = [
  { cat: 'Character', id: 'astrid', name: 'Astrid Vilde', sub: 'Mission Commander · FNS Freya',
    img: 'assets/still-kirsten.png',
    tease: "She reminded her staff that fear and courage walk the same corridor.",
    body: `Commander of the Freya Homestead and the three thousand souls who live inside it. Career officer. Her voice, honed by years of command, reaches the farthest corners of the Hearth dome. She carries a promise she made to a grieving boy in a freezing hangar — that no life given to the void would be forgotten by those who arrived.` },
  { cat: 'Character', id: 'oliver', name: 'Oliver Savannen', sub: '15 · male · engineer',
    img: 'assets/still-oliver.png',
    tease: "Mourning his father. Seeking the COG Egg. Ignoring the Grid.",
    body: `Lean. Curly black hair. Blue eyes. Wears an oversized jumpsuit that isn't quite his. Introverted, intelligent, talented at mechanics and electronics. His father died on the other side of the Fold; his mother stayed behind. He is trying, quietly, to disconnect himself from the totalitarian Grid.` },
  { cat: 'Character', id: 'kirsten', name: 'Kirsten Strand', sub: '35 · female · Guardian',
    img: 'assets/still-kirsten.png',
    tease: "Her armor reflects the Delta back at itself.",
    body: `A Guardian assigned to protect a survey team in the Delta jungle. Dark hair cropped close to the scalp. Tall, solid-built, broad-shouldered. Her chameleonic armor uses a refractive surface that bends light to reflect the mottled greens and browns of the Delta; she often pairs it with a ghillie suit.` },
  { cat: 'Character', id: 'ulre', name: 'Ulre Corbin', sub: 'Head of Logistics',
    tease: "His black uniform blends into the dim. His polished boots creak. Crr-eak. Crr-eak.",
    body: `Pulls his gloves tight, finger by finger, as if preparing to take a situation into a choke hold. Advocate of the Emergency Suppression Protocol (ESP). Calculates before he speaks. His gaze does not drop in deference.` },
  { cat: 'Character', id: 'muro', name: 'Lt. Muro', sub: 'Orbit Three · "The Ears"',
    tease: "Thinning sandy hair, sweaty and clinging to the forehead.",
    body: `Lieutenant on Orbital Three — the listening station. In nervousness, his brogue accent takes over. Mostly listens to static now. Enough to drive anyone mad.` },
  { cat: 'Symbol', id: 'fold', name: 'The Fold', sub: 'Now silent',
    tease: "A passage between Earth and Mairee. Psychedelic. Fractal.",
    body: `A (now lost) passage between Earth and Mairee. Passing through the Fold is not just an external trip — it is an internal one. People go in and someone comes out. Witnesses describe fractal geometry, color-that-is-not-color, and time that reads back.` },
  { cat: 'Symbol', id: 'paint', name: 'Paint & Colors', sub: 'A way of seeing',
    tease: "In Mairee, people are pigments. You are a color being painted.",
    body: `Throughout the saga, persons are referred to as "colors" being painted on a canvas. It is both metaphor and, increasingly, diagnosis. Pay attention to which pigments recur. Pay attention to which ones bleed.` },
  { cat: 'Item', id: 'cogegg', name: 'The COG Egg', sub: 'Palm-sized · bone-warm',
    tease: "Fits in the palm of a hand. Belonged to the father.",
    body: `A palm-sized, bone-warm ceramic oval with no visible interface. Predates the Grid by at least two generations. Oliver's father carried it. It warms on its own terms. When it warms, pay attention.` },
  { cat: 'Item', id: 'eyewyn', name: 'Eyewyn Orbs', sub: 'Drones · recording · broadcast',
    tease: "Tiny lenses that dilate and contract like mosquitoes.",
    body: `Small drifting orbs that beam a speaker's face to every soul on the planet. They orbited the Commander during her address at the Hearth — until, with the Guardians, they fell abruptly to the floor.` },
  { cat: 'Item', id: 'suppressor', name: 'Gravitic Suppressor', sub: 'Heavy-grade',
    tease: "A ruby flicker. Air thickens. Throats close.",
    body: `A heavy-grade crowd-control weapon. A momentary flicker of ruby light discharges, the field locks in, and the air becomes a thing that pins you. Vision blurs black and red. Used against the Homestead during the Hearth assembly.` },
  { cat: 'Lore', id: 'mrs', name: 'Myco-Rhyzomic System (MRS)', sub: 'Alien · fungal · intelligent',
    tease: "A fungal network that communicates through psychedelic experience.",
    body: `A planet-wide, intelligent fungal network native to Mairee. Communicates by triggering psychedelic experiences in nearby mammalian nervous systems. Does not speak. Is not spoken to. Arrives. Opens. Sits with you.` },
  { cat: 'Lore', id: 'esp', name: 'Emergency Suppression Protocol (ESP)', sub: 'Totalitarian doctrine',
    tease: "Rationing. Curfew. Silence. The quiet installation of order.",
    body: `A crisis-governance doctrine authorized in the event of Fold loss. Advocated by Logistics and enforced by Guardians. In theory: preservation. In practice: pretext. The first move in the debate is always to pretend the debate is over.` },
  { cat: 'Lore', id: 'grid', name: 'The Grid', sub: 'Post-Earth · totalitarian',
    tease: "Pulses in the periphery of anyone still plugged in.",
    body: `The successor-structure to terrestrial governance. Distributed, ambient, constant. Pulses three times and asks to be obeyed. The COG Egg is, among other things, a way to stop being plugged in.` },
  { cat: 'Place', id: 'mairee', name: 'Mairee', sub: 'Yreus System · second home',
    img: 'assets/still-mairee.png',
    tease: "From space, it looks like a jewel. Too bad we are the infection. And she knows it.",
    body: `Second planet of the Yreus System. Cataloged as habitable. Described in colonial brochures as "a soft green latitude." Was waiting for them. The jungle is called the Delta. The sky is pink for reasons no one has agreed on yet.` },
  { cat: 'Place', id: 'freya', name: 'FNS Freya / Homestead', sub: 'Flagship · Landed',
    tease: "A ship that doesn't fly anymore. Repurposed as a village.",
    body: `The flagship of the expedition. Now a landed village containing the Homestead and the Harbor. The Hearth dome at its center is where Commander Vilde addresses the settlers.` },
  { cat: 'Place', id: 'ivaldi', name: 'FNS Ivaldi / The Plateau', sub: 'Landed · industry',
    tease: "A dropped brick, anchored into the rocks.",
    body: `An industrial carcass, anchored into the rocks of the Plateau. Our industry. Smelters, fabricators, and repair bays — all housed inside what used to fly.` },
  { cat: 'Place', id: 'delta', name: 'The Delta', sub: 'Jungle · petri dish',
    img: 'assets/still-pool.webp',
    tease: "A churning petri dish. A garden that bites back.",
    body: `The Maireean jungle. Humid, mottled green, always listening. Settlers slurp from the rivers, filter out the parasites, and call it "somewhat drinkable." Guardians patrol the treeline in ghillie suits.` },
  { cat: 'Place', id: 'orbital', name: 'Orbital Command', sub: 'The brain',
    tease: "Decides what moves where, via the Corridor.",
    body: `Constructed from the split apart pieces of FNS Yggdrasil to form the Orbital network. Three stations: Orbit One — The Eyes (weather, spore storms, surveillance). Orbit Two — The Lungs (life-support particulate filtration). Orbit Three — The Ears (listening; mostly static).` },
  { cat: 'Ship', id: 'brisinger', name: 'FNS Brisinger', sub: 'The problem child',
    tease: "The last ship to breach the Fold. Still there. Sort of.",
    body: `Dragged itself quietly forward. Breached the Fold — and then the carrier wave corrupted, jagged, garbled. "We are b-being… The c-crew—" The transmission cuts off in a dental-drill whine.` },
  { cat: 'Ship', id: 'dainn', name: 'FNS Dáinn', sub: 'Our machines',
    tease: "Without her, we return to the Stone Age.",
    body: `Heavy-industry carrier, en route. Fabrication stock, seed banks, replacement printers. Still crossing the Corridor. The Homestead checks her telemetry three times a click.` },
  { cat: 'Lore', id: 'time', name: 'Mairee Time', sub: 'Pulse · Beat · Thud · Click · Cycle',
    tease: "Forget your watch. Time here is something you feel.",
    body: `PULSE — 2 min, a hitch in the hum. BEAT — 12 min, a skipped heartbeat. THUD — 72 min, deck plates shudder; fillings chatter. CLICK — 21.6 h, a bolt slamming home. CYCLE — 54 Earth days, shipwide zero-g turnover. MAYA (year) — 324 Earth days. EMWIC (week) — 5.4 Earth days. MARYON (month) — 27 Earth days.` },
];

const CATEGORIES = ['All', 'Character', 'Symbol', 'Item', 'Place', 'Ship', 'Lore'];

function WikiPage() {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');
  const [openId, setOpenId] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return WIKI.filter(e => {
      if (cat !== 'All' && e.cat !== cat) return false;
      if (!q) return true;
      return (e.name + ' ' + e.tease + ' ' + e.body + ' ' + e.cat).toLowerCase().includes(q);
    });
  }, [query, cat]);

  const counts = CATEGORIES.reduce((acc, c) => {
    acc[c] = c === 'All' ? WIKI.length : WIKI.filter(e => e.cat === c).length;
    return acc;
  }, {});

  return (
    <div className="wiki-page">
      <header className="wp-header">
        <div className="container">
          <span className="mono-label">The Codex · Volume I</span>
          <h1 className="wp-title">A Reader's Wiki</h1>
          <p className="wp-sub">
            <em>A companion for the void.</em> Browse the people, places, items, and lore of Mairee.
            Light spoilers only. Search the stone. It was waiting for you.
          </p>
          <div className="wp-stats">
            <span>{WIKI.length} entries</span>
            <span className="dot" />
            <span>6 categories</span>
            <span className="dot" />
            <span>Last tended 2 clicks ago</span>
          </div>
        </div>
      </header>

      <div className="container wiki-body-wrap">
        <div className="wiki-controls">
          <div className="wiki-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
            </svg>
            <input type="text" placeholder="Search — try 'Egg', 'Fold', 'Guardians'..." value={query} onChange={e => setQuery(e.target.value)} />
            {query && <button className="clear-q" onClick={() => setQuery('')}>×</button>}
          </div>
          <div className="wiki-cats">
            {CATEGORIES.map(c => (
              <button key={c} className={`cat-pill ${cat===c?'on':''}`} onClick={() => setCat(c)}>
                {c} <span className="cat-count">{counts[c]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="wiki-list">
          {filtered.map(e => {
            const open = openId === e.id;
            return (
              <div key={e.id} className={`wiki-entry ${open?'open':''}`}>
                <button className="wiki-row" onClick={() => setOpenId(open ? null : e.id)}>
                  <div className="wiki-row-l">
                    <span className={`wiki-cat cat-${e.cat.toLowerCase()}`}>{e.cat}</span>
                    <h4 className="wiki-name">{e.name}</h4>
                    <span className="wiki-sub">{e.sub}</span>
                  </div>
                  <div className="wiki-row-r">
                    <p className="wiki-tease">{e.tease}</p>
                    <span className="wiki-chev">{open ? '−' : '+'}</span>
                  </div>
                </button>
                {open && (
                  <div className="wiki-body">
                    {e.img && <div className="wiki-img"><img src={e.img} alt="" /></div>}
                    <div className="wiki-text">
                      <p>{e.body}</p>
                      <div className="wiki-refs">
                        <span className="mono-label muted">Cross-references</span>
                        <div className="ref-row">
                          {WIKI.filter(x => x.id !== e.id).slice(0, 4).map(x => (
                            <button key={x.id} className="ref-pill" onClick={(ev) => { ev.stopPropagation(); setOpenId(x.id); }}>{x.name}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="wiki-empty">
              <p>No entries match <em>"{query}"</em>.</p>
              <p className="dim">Try a different word. Some things in this story read back.</p>
            </div>
          )}
        </div>

        <p className="wiki-footer">
          {filtered.length} of {WIKI.length} entries · The codex is in active bloom.
          <a href="#" className="underlined">Contribute an entry →</a>
        </p>
      </div>

      <style>{`
        .wiki-page { padding-top: 100px; min-height: 100vh; }
        .wp-header {
          padding: 80px 0 60px;
          border-bottom: 1px solid var(--line);
          background:
            linear-gradient(180deg, rgba(6,22,25,0.85), rgba(6,22,25,1)),
            url("assets/still-pool.webp") center/cover;
          position: relative;
        }
        .wp-title { font-size: clamp(3rem, 6vw, 5rem); margin: 14px 0 20px; }
        .wp-sub { font-family: var(--serif); font-size: 1.25rem; color: var(--ivory-2); max-width: 620px; margin: 0 0 20px; font-weight: 300; line-height: 1.5; }
        .wp-sub em { color: var(--rose); }
        .wp-stats { display: flex; gap: 14px; align-items: center; font-family: var(--mono); font-size: 0.74rem; letter-spacing: 0.14em; color: var(--muted); text-transform: uppercase; }
        .wp-stats .dot { width: 3px; height: 3px; border-radius: 50%; background: var(--muted); }

        .wiki-body-wrap { padding: 60px 32px 120px; }
        .wiki-controls { display: flex; justify-content: space-between; gap: 24px; align-items: center; margin-bottom: 32px; flex-wrap: wrap; padding-bottom: 20px; border-bottom: 1px solid var(--line); }
        .wiki-search { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 280px; padding: 12px 16px; border: 1px solid var(--line-strong); background: rgba(11,34,39,0.5); color: var(--muted); }
        .wiki-search:focus-within { border-color: var(--rose); color: var(--ivory); }
        .wiki-search input { flex: 1; background: transparent; border: 0; color: var(--ivory); font-family: var(--serif); font-size: 1.05rem; }
        .wiki-search input:focus { outline: 0; }
        .wiki-search input::placeholder { color: var(--muted); font-style: italic; }
        .clear-q { background: transparent; border: 0; color: var(--muted); font-size: 1.4rem; padding: 0; cursor: pointer; }
        .clear-q:hover { color: var(--rose); }

        .wiki-cats { display: flex; gap: 6px; flex-wrap: wrap; }
        .cat-pill { background: transparent; border: 1px solid var(--line-strong); color: var(--ivory); padding: 8px 14px; font-family: var(--mono); font-size: 0.68rem; letter-spacing: 0.14em; text-transform: uppercase; border-radius: 2px; transition: all 0.2s; display: inline-flex; gap: 6px; align-items: center; }
        .cat-pill:hover { border-color: var(--rose); color: var(--rose); }
        .cat-pill.on { background: var(--ivory); color: var(--ink); border-color: var(--ivory); }
        .cat-count { opacity: 0.5; font-size: 0.85em; }
        .cat-pill.on .cat-count { opacity: 0.7; }

        .wiki-list { display: flex; flex-direction: column; }
        .wiki-entry { border-bottom: 1px solid var(--line); }
        .wiki-row { display: grid; grid-template-columns: 1.1fr 2fr; width: 100%; padding: 24px 8px; background: transparent; border: 0; text-align: left; color: var(--ivory); gap: 24px; align-items: center; cursor: pointer; transition: background 0.2s; }
        .wiki-row:hover { background: rgba(233,74,124,0.04); }
        .wiki-entry.open .wiki-row { background: rgba(233,74,124,0.06); }
        .wiki-row-l { display: flex; flex-direction: column; gap: 4px; }
        .wiki-cat { font-family: var(--mono); font-size: 0.62rem; letter-spacing: 0.22em; text-transform: uppercase; padding: 3px 8px; border: 1px solid currentColor; width: fit-content; border-radius: 2px; }
        .cat-character { color: var(--rose); }
        .cat-symbol { color: #c4a6ff; }
        .cat-item { color: #f4ce74; }
        .cat-place { color: #74e1c4; }
        .cat-ship { color: #88c3cd; }
        .cat-lore { color: var(--teal-soft); }
        .wiki-name { font-family: var(--serif); font-size: 1.6rem; font-weight: 400; }
        .wiki-sub { font-family: var(--mono); font-size: 0.72rem; letter-spacing: 0.12em; color: var(--muted); text-transform: uppercase; }
        .wiki-row-r { display: flex; gap: 16px; align-items: center; }
        .wiki-tease { font-family: var(--serif); font-size: 1.05rem; font-style: italic; color: var(--ivory-2); margin: 0; flex: 1; }
        .wiki-chev { font-family: var(--serif); font-size: 1.8rem; color: var(--rose); width: 28px; text-align: center; }

        .wiki-body {
          display: grid; grid-template-columns: 260px 1fr; gap: 32px;
          padding: 8px 8px 32px; animation: fadeDown 0.3s ease;
        }
        .wiki-body:only-child, .wiki-entry.open .wiki-body:not(:has(.wiki-img)) { grid-template-columns: 1fr; }
        .wiki-img img { width: 100%; display: block; filter: saturate(0.7) contrast(1.05); border: 1px solid var(--line); }
        .wiki-text p { font-family: var(--serif); font-size: 1.1rem; line-height: 1.75; color: var(--ivory-2); margin: 0 0 20px; }
        .wiki-refs { padding-top: 14px; border-top: 1px dashed var(--line); }
        .ref-row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
        .ref-pill { background: transparent; border: 1px solid var(--line); padding: 6px 12px; color: var(--ivory); font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.08em; border-radius: 20px; cursor: pointer; }
        .ref-pill:hover { border-color: var(--rose); color: var(--rose); }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }

        .wiki-empty { padding: 60px 20px; text-align: center; color: var(--muted); font-family: var(--serif); font-size: 1.15rem; }
        .wiki-empty em { color: var(--rose); }
        .wiki-empty .dim { font-size: 0.95rem; font-style: italic; margin-top: 8px; }
        .wiki-footer { margin-top: 32px; font-family: var(--mono); font-size: 0.75rem; letter-spacing: 0.1em; color: var(--muted); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .underlined { color: var(--rose); border-bottom: 1px solid currentColor; padding-bottom: 1px; }

        @media (max-width: 820px) {
          .wiki-row { grid-template-columns: 1fr; gap: 10px; padding: 20px 4px; }
          .wiki-body { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

window.WikiPage = WikiPage;

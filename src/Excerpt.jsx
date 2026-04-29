// Excerpt — the actual Prologue opening from the book
function Excerpt() {
  const { useState } = React;
  const [expanded, setExpanded] = useState(false);
  return (
    <section id="excerpt" className="excerpt">
      <div className="container-narrow">
        <div className="section-head">
          <span className="mono-label">II / Prologue</span>
          <h2 className="section-title">Freya Homestead, <em>Mairee</em></h2>
          <p className="section-sub">The first pages. A transmission. A command. A blackout.</p>
        </div>

        <div className="uplink-card">
          <span className="mono-label">◉ Uplink · unknown origin</span>
          <p className="uplink-text">
            There is a song in the stone. And if you listen, you can hear the math starting
            to fail. To <em>unfold</em>. You weren't there. But you're next. I'm uplinking this
            to you because if I don't, only the stone will remember. It just sits there,
            waiting for you, before it can get back to being a rock.
          </p>
          <p className="uplink-text">
            And if you were going to look away, <em>don't</em>. If you turn your head now,
            you'll miss the moment it decides to notice you. My name doesn't matter. Where
            we start does. Not Earth. Not Paradise.
          </p>
          <p className="uplink-text uplink-tail">
            You're on the planet <strong>Mairee</strong>, the moment the hum of the station changed.
          </p>
        </div>

        <article className={`excerpt-body ${expanded ? 'expanded' : ''}`}>
          <p className="drop-cap">
            The Comms-Bay, usually a hive of digital chatter, was silent. All eyes were on
            the Mission Commander, Astrid Vilde. And that silence was the loudest scream
            she had ever heard. She knew it was bad when she heard her own blood rushing
            in her ears. <em>Whoosh. Whoosh. Whoosh.</em> A pump desperately trying to keep
            the pressure up.
          </p>
          <p>
            She brought her hand to her quivering lip, as if to hold back the words she
            didn't yet dare to speak. She rested her open palm on the edge of the comms
            console, which normally felt warm. Now it was as though she were touching a
            corpse.
          </p>
          <p>
            "Muro, what do you hear?" she finally said. She crossed to the holoscreen. It
            rendered the lieutenant, floating weightless in Orbital Three. His thinning
            sandy hair was sweaty, clinging to his forehead.
          </p>
          <p>
            Muro scratched his temple. "Nothing, Commander. Total blackout." In his
            nervousness, Muro's brogue accent took over. "It's like the Fold got flushed.
            Gone. But the Brisinger… <em>she's still there. Sort of.</em>"
          </p>
          <p className="pullquote">
            <span className="pq-mark">"</span>
            We are b-being… The c-crew—
            <span className="pq-mark">"</span>
          </p>
          <p>
            The sound cut off in a high-pitched whine like a dental drill biting straight
            into nerve. In the bay, everyone stopped breathing as if collectively deciding
            to save oxygen. An ensign froze above the keys. Across the room, a technician
            lowered his slate. An officer stopped mid-step.
          </p>
          {expanded && (
            <>
              <p>
                Astrid gripped the console. She pushed down until the tremor in her hands
                ceased. She forced a breath deep into her lungs, holding it to slow her
                hammering heart. She turned to her staff, exhaling deeply. "<em>Breathe,
                dammit,</em>" she said. "We'll figure this out. Keep listening."
              </p>
              <p>
                And with that, the bay remembered to breathe again.
              </p>
              <p>
                The composite door hissed open. Ulre Corbin, Head of Logistics, stepped
                inside. His black uniform blended into the dim light. He pulled his gloves
                tighter, finger by finger. The sound of leather against leather was crisp
                and methodical, as if he were preparing to take the situation into a choke
                hold.
              </p>
              <p>
                "Orbital Command agrees," Ulre relayed. "We initiate the ESP."
              </p>
              <p>
                He was too quick to bring up the Emergency Suppression Protocol, Astrid
                thought, even though contact with Earth and the fleet beyond the Fold was
                indeed lost. "A carrier wave from Brisinger still persists," Astrid declared.
                "They have the key to what happened. If we can restore comms—"
              </p>
              <p>
                "<em>Irrelevant</em>," Ulre scoffed, finally stepping inside. His polished
                boots creaked. <em>Crr-eak. Crr-eak.</em> "We have to move now, Commander.
                Thousands of lives. Limited resources. Every beat we wait…"
              </p>
              <p>
                He stood firm, letting the silence speak for him.
              </p>
              <p>
                Astrid's fingernails left marks in her palm. She turned to her staff, then
                back at Corbin. The tension in his frame hadn't loosened by a millimeter.
                She whispered to him: "<em>This debate is over. Are we clear?</em>"
              </p>
              <p>
                "Clear," Ulre bit out.
              </p>
            </>
          )}
        </article>

        <div className="excerpt-controls">
          <button className="btn btn-ghost" onClick={() => setExpanded(!expanded)}>
            {expanded ? '— Collapse —' : 'Read More ↓'}
          </button>
          {expanded
            ? <a href="reader.html" className="btn btn-primary">Continue reading in the Reader →</a>
            : <a href="reader.html" className="btn btn-ghost">Open the Reader →</a>
          }
        </div>
      </div>

      <style>{`
        .excerpt { padding: 120px 0; position: relative; }
        .section-sub { font-family: var(--serif); font-size: 1.15rem; color: var(--muted); margin-top: 16px; font-style: italic; }

        .uplink-card {
          max-width: 680px;
          margin: 40px auto 60px;
          padding: 28px 32px;
          border-left: 2px solid var(--rose);
          background: linear-gradient(90deg, rgba(233,74,124,0.06), transparent 60%);
          font-family: var(--serif);
        }
        .uplink-card .mono-label { margin-bottom: 16px; display: block; }
        .uplink-text {
          font-size: 1.15rem;
          line-height: 1.65;
          color: var(--ivory-2);
          margin: 0 0 1em;
          font-style: italic;
        }
        .uplink-text em { color: var(--rose-soft); }
        .uplink-text strong { color: var(--rose); font-weight: 500; letter-spacing: 0.04em; }
        .uplink-tail { padding-top: 10px; border-top: 1px dashed var(--line); }

        .excerpt-body { font-family: var(--serif); font-size: 1.22rem; line-height: 1.75; color: var(--ivory-2); max-width: 680px; margin: 60px auto 48px; position: relative; }
        .excerpt-body p { margin: 0 0 1.3em; font-weight: 300; }
        .excerpt-body em { color: var(--rose-soft); font-style: italic; }
        .excerpt-body p:first-of-type::first-letter { font-family: var(--serif); font-size: 5em; float: left; line-height: 0.82; padding: 0.08em 0.1em 0 0; color: var(--rose); font-weight: 500; }
        .pullquote { font-style: italic; font-size: 1.6rem !important; line-height: 1.3 !important; text-align: center; color: var(--rose-soft) !important; margin: 2em 0 !important; padding: 0 40px; }
        .pq-mark { color: var(--rose); font-size: 1.4em; vertical-align: -0.2em; opacity: 0.6; }
        .excerpt-controls { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; padding-top: 20px; border-top: 1px solid var(--line); }
      `}</style>
    </section>
  );
}

window.Excerpt = Excerpt;

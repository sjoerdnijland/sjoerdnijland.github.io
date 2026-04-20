// Feed page — standalone community feed
const { useState: useStateF, useEffect: useEffectF } = React;

const SEED = [
  { id: 1, user: 'aurora.read', avatar: '#e94a7c', role: 'Guardian · Lvl 4', minutesAgo: 14, room: '#first-read',
    body: 'Finished Ch. 6 last night. I will never look at a flower the same way again. That wet, articulated sound… I had to put the book face-down.',
    reactions: { bloom: 47, fold: 12, heart: 23 }, replies: 6 },
  { id: 2, user: 'vivek_irl', avatar: '#74e1c4', role: 'Xenobotanist · Lvl 7', minutesAgo: 52, room: '#theories',
    body: 'Theory thread: the COG Egg was never a device. It is a seed. Change my mind. (spoiler-tagged, no Ch.12 replies please)',
    reactions: { bloom: 128, fold: 64, heart: 38 }, replies: 42, pinned: true },
  { id: 3, user: 'thirdwake', avatar: '#c4a6ff', role: 'Reader · Lvl 2', minutesAgo: 180, room: '#first-read',
    body: 'I read the palindrome scene three times before I noticed. Three.\n\nThen I noticed. I had to close the book and take a walk.',
    reactions: { bloom: 201, fold: 88, heart: 94 }, replies: 18 },
  { id: 4, user: 'lament.moth', avatar: '#f4ce74', role: 'Reader · Lvl 3', minutesAgo: 420, room: '#theories',
    body: 'Does anyone else feel like Kirsten and Astrid are mirrored? Something about the way they hold their hand on a thing that should be warm.',
    reactions: { bloom: 61, fold: 22, heart: 41 }, replies: 11 },
  { id: 5, user: 's.nyland', avatar: '#e94a7c', role: '✶ Author', minutesAgo: 720, room: '#ask-the-author',
    body: 'I will be at the Amsterdam launch on the 12th. Bringing bookplates and bad handwriting. Come say hello. I promise not to answer any lore questions directly. I promise.',
    reactions: { bloom: 812, fold: 210, heart: 604 }, replies: 93 },
  { id: 6, user: 'crr-eak', avatar: '#88c3cd', role: 'Reader · Lvl 5', minutesAgo: 1200, room: '#spoilers',
    body: 'Ulre Corbin is the most terrifying antagonist I\'ve read in years, and he does not raise his voice once. He just tightens his gloves. That is it. That is the whole horror.',
    reactions: { bloom: 334, fold: 51, heart: 122 }, replies: 27 },
];

const REACTIONS = [
  { key: 'bloom', label: '✿', name: 'Bloom' },
  { key: 'fold',  label: '◉', name: 'Fold'  },
  { key: 'heart', label: '❤', name: 'Holds' },
];

function timeAgo(m) {
  if (m < 60) return m + 'm ago';
  if (m < 60*24) return Math.floor(m/60) + 'h ago';
  return Math.floor(m/60/24) + 'd ago';
}

function FeedPage() {
  const [posts, setPosts] = useStateF(() => {
    try { const s = localStorage.getItem('unfolding_posts_v2'); if (s) return JSON.parse(s); } catch {}
    return SEED;
  });
  const [reacted, setReacted] = useStateF(() => {
    try { return JSON.parse(localStorage.getItem('unfolding_reacted_v2') || '{}'); } catch { return {}; }
  });
  const [draft, setDraft] = useStateF('');
  const [filter, setFilter] = useStateF('recent');
  const [room, setRoom] = useStateF('all');

  useEffectF(() => { try { localStorage.setItem('unfolding_posts_v2', JSON.stringify(posts)); } catch {} }, [posts]);
  useEffectF(() => { try { localStorage.setItem('unfolding_reacted_v2', JSON.stringify(reacted)); } catch {} }, [reacted]);

  function post(e) {
    e.preventDefault();
    const body = draft.trim(); if (!body) return;
    setPosts([{ id: Date.now(), user: 'you', avatar: '#f4ead9', role: 'Reader · Lvl 1', minutesAgo: 0, body, room: room === 'all' ? '#first-read' : room, reactions: { bloom: 0, fold: 0, heart: 0 }, replies: 0, fresh: true }, ...posts]);
    setDraft('');
  }

  function react(postId, key) {
    const rk = `${postId}:${key}`; const already = reacted[rk];
    setPosts(ps => ps.map(p => p.id !== postId ? p : { ...p, reactions: { ...p.reactions, [key]: p.reactions[key] + (already ? -1 : 1) } }));
    setReacted(r => { const nr = { ...r }; if (already) delete nr[rk]; else nr[rk] = true; return nr; });
  }

  let list = posts.filter(p => room === 'all' || p.room === room);
  list = [...list].sort((a, b) => {
    if (filter === 'popular') { const as = a.reactions.bloom + a.reactions.fold + a.reactions.heart; const bs = b.reactions.bloom + b.reactions.fold + b.reactions.heart; return bs - as; }
    if (filter === 'pinned') return (b.pinned?1:0) - (a.pinned?1:0);
    return a.minutesAgo - b.minutesAgo;
  });

  const rooms = ['all', '#first-read', '#theories', '#spoilers', '#fan-art', '#ask-the-author'];

  return (
    <div className="feed-page">
      <header className="fp-header">
        <div className="container">
          <span className="mono-label">The Feed · a companion for the void</span>
          <h1 className="fp-title">Where readers <em>unfold together.</em></h1>
          <p className="fp-sub">4,812 readers · 14,203 replies · a few theories dangerously close to correct.</p>
        </div>
      </header>

      <div className="container forum-wrap">
        <div className="forum-grid">
          <aside className="forum-side">
            <div className="side-box">
              <span className="mono-label muted">Sort</span>
              <div className="side-links">
                {['recent', 'popular', 'pinned'].map(f => (
                  <button key={f} className={`side-link ${filter===f?'on':''}`} onClick={() => setFilter(f)}>
                    {f === 'recent' && '— Recent'}
                    {f === 'popular' && '— Most Held'}
                    {f === 'pinned' && '— Pinned'}
                  </button>
                ))}
              </div>
            </div>
            <div className="side-box">
              <span className="mono-label muted">Rooms</span>
              <div className="side-links">
                {rooms.map(r => (
                  <button key={r} className={`side-link ${room===r?'on':''}`} onClick={() => setRoom(r)}>
                    {r === 'all' ? '— All rooms' : r}
                    {r === '#theories' && <span className="tag-dot" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="side-box side-promo">
              <span className="mono-label">Rules of the Room</span>
              <ol>
                <li>Spoilers go behind the fold.</li>
                <li>Theories welcome. Certainty isn't.</li>
                <li>Kindness is a form of reading.</li>
              </ol>
            </div>
          </aside>

          <div className="forum-main">
            <form className="composer" onSubmit={post}>
              <div className="composer-head">
                <div className="avatar" style={{ background: '#f4ead9' }}>Y</div>
                <div className="composer-meta">
                  <span>Posting as <strong>you</strong></span>
                  <span className="composer-sub">Reader · Lvl 1 · {room === 'all' ? '#first-read' : room}</span>
                </div>
              </div>
              <textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="Share a passage. Propose a theory. Confess a re-read..." rows={3} />
              <div className="composer-actions">
                <div className="composer-chips">
                  <span className="chip">◉ {room === 'all' ? '#first-read' : room}</span>
                  <span className="chip">✎ Spoiler fold</span>
                </div>
                <button type="submit" className="btn btn-primary btn-sm" disabled={!draft.trim()}>Post →</button>
              </div>
            </form>

            <div className="posts">
              {list.map(p => (
                <article key={p.id} className={`post ${p.fresh?'fresh':''} ${p.pinned?'pinned':''}`}>
                  {p.pinned && <div className="pin-bar"><span className="mono-label">◉ Pinned by mods</span></div>}
                  <div className="post-head">
                    <div className="avatar" style={{ background: p.avatar }}>{p.user[0].toUpperCase()}</div>
                    <div className="post-meta">
                      <span className="post-user">@{p.user} {p.role.includes('Author') && <span className="verified" title="Verified author">✶</span>}</span>
                      <span className="post-sub">{p.role} · {timeAgo(p.minutesAgo)} · {p.room}</span>
                    </div>
                  </div>
                  <div className="post-body">
                    {p.body.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
                  </div>
                  <div className="post-actions">
                    <div className="reactions">
                      {REACTIONS.map(r => (
                        <button key={r.key} className={`rx ${reacted[`${p.id}:${r.key}`] ? 'on' : ''}`} onClick={() => react(p.id, r.key)} title={r.name}>
                          <span className="rx-glyph">{r.label}</span>
                          <span className="rx-n">{p.reactions[r.key]}</span>
                        </button>
                      ))}
                    </div>
                    <button className="post-reply">↩ {p.replies} replies</button>
                  </div>
                </article>
              ))}
              {list.length === 0 && <div className="empty-room">No posts in this room yet. Be the first.</div>}
            </div>
            <div className="load-more"><button className="btn btn-ghost">Load the next 20 →</button></div>
          </div>
        </div>
      </div>

      <style>{`
        .feed-page { padding-top: 100px; }
        .fp-header { padding: 80px 0 60px; border-bottom: 1px solid var(--line); background: linear-gradient(180deg, rgba(6,22,25,0.85), rgba(6,22,25,1)), url("assets/still-floating.png") center/cover; }
        .fp-title { font-size: clamp(3rem, 6vw, 5rem); margin: 14px 0 16px; }
        .fp-title em { color: var(--rose); font-style: italic; }
        .fp-sub { font-family: var(--mono); font-size: 0.8rem; letter-spacing: 0.14em; color: var(--muted); text-transform: uppercase; }

        .forum-wrap { padding: 60px 32px 140px; }
        .forum-grid { display: grid; grid-template-columns: 260px 1fr; gap: 40px; max-width: 1100px; margin: 0 auto; }
        .forum-side { display: flex; flex-direction: column; gap: 24px; position: sticky; top: 100px; height: fit-content; }
        .side-box { padding: 20px; border: 1px solid var(--line); background: rgba(6,22,25,0.5); }
        .side-links { display: flex; flex-direction: column; gap: 4px; margin-top: 14px; }
        .side-link { background: transparent; border: 0; color: var(--ivory); text-align: left; padding: 8px 10px; font-family: var(--mono); font-size: 0.78rem; border-radius: 2px; transition: all 0.2s; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        .side-link:hover { background: rgba(233,74,124,0.1); color: var(--rose); }
        .side-link.on { background: var(--rose); color: var(--ink); }
        .tag-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--rose); }
        .side-promo ol { padding: 0 0 0 1em; margin: 12px 0 0; font-family: var(--serif); font-size: 0.95rem; color: var(--ivory-2); line-height: 1.5; }

        .composer { padding: 20px; border: 1px solid var(--line-strong); background: rgba(11,34,39,0.7); margin-bottom: 28px; }
        .composer-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .composer-meta { display: flex; flex-direction: column; font-size: 0.88rem; font-family: var(--mono); }
        .composer-meta strong { color: var(--rose); font-weight: 500; }
        .composer-sub { color: var(--muted); font-size: 0.72rem; letter-spacing: 0.1em; }
        .avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--ink); font-family: var(--serif); font-weight: 500; font-size: 1.1rem; }
        .composer textarea { width: 100%; background: transparent; border: 0; border-bottom: 1px solid var(--line); color: var(--ivory); font-family: var(--serif); font-size: 1.1rem; padding: 8px 0; resize: vertical; min-height: 72px; }
        .composer textarea:focus { outline: 0; border-bottom-color: var(--rose); }
        .composer textarea::placeholder { color: var(--muted); font-style: italic; }
        .composer-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; flex-wrap: wrap; gap: 10px; }
        .composer-chips { display: flex; gap: 8px; }
        .chip { font-family: var(--mono); font-size: 0.68rem; letter-spacing: 0.12em; padding: 4px 10px; border: 1px solid var(--line); color: var(--muted); border-radius: 20px; }
        .btn-sm { padding: 10px 18px; font-size: 0.7rem; }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .posts { display: flex; flex-direction: column; gap: 16px; }
        .post { padding: 22px 24px; border: 1px solid var(--line); background: rgba(11,34,39,0.5); transition: all 0.3s; }
        .post:hover { border-color: var(--line-strong); }
        .post.fresh { border-color: var(--rose); animation: freshGlow 0.6s ease; }
        .post.pinned { border-color: var(--rose); }
        @keyframes freshGlow { from { background: rgba(233,74,124,0.15); transform: translateY(-6px); } to { background: rgba(11,34,39,0.5); transform: none; } }
        .pin-bar { margin: -22px -24px 14px; padding: 8px 24px; background: rgba(233,74,124,0.08); border-bottom: 1px solid var(--rose); }
        .post-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .post-meta { display: flex; flex-direction: column; font-size: 0.88rem; font-family: var(--mono); }
        .post-user { color: var(--ivory); }
        .verified { color: var(--rose); }
        .post-sub { color: var(--muted); font-size: 0.7rem; letter-spacing: 0.1em; }
        .post-body { font-family: var(--serif); font-size: 1.1rem; line-height: 1.6; color: var(--ivory-2); }
        .post-body p { margin: 0 0 0.6em; }
        .post-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 14px; border-top: 1px dashed var(--line); flex-wrap: wrap; gap: 8px; }
        .reactions { display: flex; gap: 8px; }
        .rx { display: inline-flex; align-items: center; gap: 6px; background: transparent; border: 1px solid var(--line); color: var(--ivory); padding: 6px 12px; font-family: var(--mono); font-size: 0.78rem; border-radius: 24px; transition: all 0.2s; cursor: pointer; }
        .rx:hover { border-color: var(--rose); color: var(--rose); }
        .rx.on { background: rgba(233,74,124,0.14); border-color: var(--rose); color: var(--rose); }
        .rx-glyph { font-size: 1rem; line-height: 1; }
        .post-reply { background: transparent; border: 0; color: var(--muted); font-family: var(--mono); font-size: 0.76rem; letter-spacing: 0.08em; cursor: pointer; }
        .post-reply:hover { color: var(--rose); }
        .empty-room { padding: 60px; text-align: center; color: var(--muted); font-family: var(--serif); font-style: italic; border: 1px dashed var(--line); }
        .load-more { text-align: center; margin-top: 28px; }

        @media (max-width: 820px) {
          .forum-grid { grid-template-columns: 1fr; }
          .forum-side { position: relative; top: 0; flex-direction: row; overflow-x: auto; }
          .side-box { min-width: 240px; }
          .side-promo { display: none; }
        }
      `}</style>
    </div>
  );
}

window.FeedPage = FeedPage;

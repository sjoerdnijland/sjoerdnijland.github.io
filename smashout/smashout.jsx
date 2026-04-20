import { useState, useEffect, useRef, useCallback } from "react";

// ── Constants ────────────────────────────────────────────────────────────────
const COLS = 3, ROWS = 3, TOTAL = 9;
const GRID_Y_START = 0.18, GRID_Y_END = 0.82;
const GRID_ROW_H   = (GRID_Y_END - GRID_Y_START) / ROWS;
const CW = 520, CH = 280;

const PALETTE = ["#ff3864","#ff6b35","#ffe347","#3bff8a","#00d4ff","#c77dff"];
const PALETTE_NAMES = ["Red","Orange","Yellow","Green","Cyan","Purple"];

// Default color grids — distinct so players must consciously create overlaps
const DEFAULT_COLORS = [
  ["#ff3864","#ff6b35","#ffe347","#ff3864","#ff6b35","#ffe347","#ff3864","#ff6b35","#ffe347"],
  ["#3bff8a","#00d4ff","#c77dff","#3bff8a","#00d4ff","#c77dff","#3bff8a","#00d4ff","#c77dff"],
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function initPanels()    { return Array(TOTAL).fill(true); }
function initRestored()  { return Array(TOTAL).fill(false); }

function checkSmashout(panels) {
  if (panels.every(p => !p)) return "all";
  // Rows
  for (let r = 0; r < ROWS; r++)
    if (panels.slice(r*COLS, r*COLS+COLS).every(p => !p)) return `row ${r+1}`;
  // Columns
  for (let c = 0; c < COLS; c++)
    if ([0,1,2].map(r => panels[r*COLS+c]).every(p => !p)) return `col ${c+1}`;
  // Diagonals
  if ([0,4,8].every(i => !panels[i])) return "diagonal ↘";
  if ([2,4,6].every(i => !panels[i])) return "diagonal ↙";
  return false;
}

function colorName(hex) {
  const i = PALETTE.indexOf(hex);
  return i >= 0 ? PALETTE_NAMES[i] : hex;
}

// ── Setup Screen ─────────────────────────────────────────────────────────────
function SetupScreen({ onStart }) {
  const [colors, setColors] = useState([
    DEFAULT_COLORS[0].slice(),
    DEFAULT_COLORS[1].slice(),
  ]);
  const [selected, setSelected] = useState([null, null]);
  const [ready, setReady]       = useState([false, false]);

  function pickCell(p, i) {
    if (ready[p]) return;
    setSelected(s => { const n = s.slice(); n[p] = s[p] === i ? null : i; return n; });
  }
  function pickColor(p, c) {
    if (selected[p] === null || ready[p]) return;
    setColors(prev => {
      const next = [prev[0].slice(), prev[1].slice()];
      next[p][selected[p]] = c;
      return next;
    });
  }
  function toggleReady(p) {
    const next = [ready[0], ready[1]];
    next[p] = !next[p];
    setReady(next);
    if (next[0] && next[1]) setTimeout(() => onStart(colors), 400);
  }

  const accent = ["#ff3864", "#3bff8a"];

  return (
    <div style={{
      minHeight:"100vh", background:"#07070f",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      gap:"18px", fontFamily:"'Courier New',monospace", color:"#e0e0ff", padding:"20px",
    }}>
      <style>{`
        @keyframes titleGlow {
          0%,100%{text-shadow:0 0 10px #00d4ff,0 0 30px #00d4ff88;}
          50%{text-shadow:0 0 20px #00d4ff,0 0 60px #00d4ffaa;}
        }
        .sc { width:38px;height:38px;border-radius:5px;cursor:pointer;
          transition:transform 0.12s,box-shadow 0.12s;border:2px solid transparent; }
        .sc:hover { transform:scale(1.12); }
        .sc.sel { transform:scale(1.18);border-color:white !important; }
        .sw { width:32px;height:32px;border-radius:4px;cursor:pointer;
          transition:transform 0.1s;border:2px solid rgba(255,255,255,0.2); }
        .sw:hover { transform:scale(1.15); }
        .sbtn { background:transparent;border:1px solid currentColor;color:inherit;
          padding:8px 22px;font-family:'Courier New',monospace;font-size:13px;
          cursor:pointer;border-radius:3px;letter-spacing:2px;text-transform:uppercase;
          transition:background 0.15s; }
        .sbtn:hover { background:rgba(255,255,255,0.08); }
      `}</style>

      <h1 style={{fontSize:"42px",fontWeight:900,letterSpacing:"10px",color:"#00d4ff",
        margin:0,animation:"titleGlow 2s infinite"}}>SMASHOUT</h1>
      <p style={{color:"rgba(255,255,255,0.27)",fontSize:"11px",letterSpacing:"4px",marginTop:"-10px"}}>
        PRE-MATCH — CHOOSE YOUR PANEL COLORS
      </p>
      <p style={{fontSize:"11px",color:"rgba(255,255,255,0.45)",textAlign:"center",
        maxWidth:"480px",lineHeight:1.8,borderLeft:"2px solid rgba(0,212,255,0.3)",paddingLeft:"12px"}}>
        Smash a panel → any of <em>your</em> broken panels sharing that color gets restored — <strong>once per panel</strong>.<br/>
        Overlap colors with your opponent's to plan comebacks!
      </p>

      <div style={{display:"flex",gap:"48px",alignItems:"flex-start"}}>
        {[0,1].map(p => (
          <div key={p} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"10px"}}>
            <div style={{fontSize:"13px",color:accent[p],letterSpacing:"3px",fontWeight:"bold"}}>
              P{p+1} PANEL COLORS
            </div>

            <div style={{
              display:"grid", gridTemplateColumns:"repeat(3,38px)", gap:"6px",
              padding:"10px", background:"rgba(0,0,0,0.4)",
              border:`2px solid ${ready[p] ? accent[p]+"88" : "rgba(255,255,255,0.1)"}`,
              borderRadius:"8px",
              boxShadow: ready[p] ? `0 0 16px ${accent[p]}44` : "none",
              transition:"box-shadow 0.3s,border-color 0.3s",
            }}>
              {colors[p].map((c,i) => (
                <div key={i}
                  className={`sc${selected[p]===i?" sel":""}`}
                  style={{background:c,borderColor:selected[p]===i?"white":`${c}88`,
                    boxShadow:`0 0 8px ${c}66`,opacity:ready[p]?0.6:1}}
                  onClick={() => pickCell(p,i)}
                  title={`Panel ${i+1}: ${colorName(c)}`}
                />
              ))}
            </div>

            {!ready[p] && (
              <>
                <div style={{display:"flex",gap:"6px"}}>
                  {PALETTE.map((c,ci) => (
                    <div key={ci} className="sw"
                      style={{background:c,boxShadow:`0 0 6px ${c}66`,
                        opacity:selected[p]===null?0.35:1}}
                      onClick={() => pickColor(p,c)}
                      title={PALETTE_NAMES[ci]}
                    />
                  ))}
                </div>
                <div style={{fontSize:"10px",color:"rgba(255,255,255,0.3)",letterSpacing:"1px"}}>
                  {selected[p]===null
                    ? "CLICK A PANEL TO SELECT"
                    : `PANEL ${selected[p]+1} (${colorName(colors[p][selected[p]])}) — PICK COLOR`}
                </div>
              </>
            )}

            <button className="sbtn"
              style={{color:ready[p]?"#ff3864":accent[p]}}
              onClick={() => toggleReady(p)}>
              {ready[p] ? "✗ Unready" : "✓ Ready"}
            </button>
          </div>
        ))}
      </div>

      <div style={{fontSize:"11px",letterSpacing:"2px",
        color: ready[0]&&ready[1] ? "#ffe347"
          : (ready[0]||ready[1])  ? "rgba(255,255,255,0.4)"
          : "transparent"}}>
        {ready[0]&&ready[1] ? "⚡ LAUNCHING…"
          : `WAITING FOR P${ready[0]?2:1} TO READY UP…`}
      </div>
    </div>
  );
}

// ── Panel Grid ────────────────────────────────────────────────────────────────
function PanelGrid({ panels, panelColors, panelRestored, side, flashPanel, smashout }) {
  return (
    <div style={{
      display:"grid", gridTemplateColumns:`repeat(${COLS}, 1fr)`,
      gap:"4px", padding:"6px",
      background:"rgba(0,0,0,0.5)",
      border: smashout ? "2px solid #ffe347" : "2px solid rgba(255,255,255,0.1)",
      borderRadius:"6px",
      boxShadow: smashout ? "0 0 20px #ffe347, 0 0 40px #ffe34788" : "none",
      transition:"box-shadow 0.3s",
    }}>
      {panels.map((intact, i) => {
        const isFlashing = flashPanel?.player === side && flashPanel?.idx === i;
        const c = panelColors[i];
        return (
          <div key={i} style={{
            width:"28px", height:"28px", borderRadius:"4px", position:"relative",
            background: intact ? c : "rgba(255,255,255,0.05)",
            border: intact ? `1px solid ${c}` : "1px solid rgba(255,255,255,0.08)",
            boxShadow: intact ? `0 0 8px ${c}88` : "none",
            transition:"all 0.2s", opacity: intact ? 1 : 0.15,
            animation: isFlashing
              ? (flashPanel.type==="break" ? "breakFlash 0.4s" : "restoreFlash 0.4s")
              : "none",
          }}>
            {panelRestored[i] && (
              <div style={{position:"absolute",bottom:"2px",right:"2px",
                width:"5px",height:"5px",borderRadius:"50%",
                background:"white",opacity:0.55}}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Court SVG ────────────────────────────────────────────────────────────────
function Court({ state }) {
  const { ballX, ballY, playerX, playerY, ballTrail, phase, lastHit } = state;
  const ballColor = phase === "smashout" ? "#ffe347" : "#00d4ff";

  return (
    <svg width={CW} height={CH} style={{display:"block"}}>
      <defs>
        <linearGradient id="courtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#0a0a1a"/>
          <stop offset="100%" stopColor="#0d1a2a"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="cb"/>
          <feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="ballGlow">
          <feGaussianBlur stdDeviation="5" result="cb"/>
          <feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect width={CW} height={CH} fill="url(#courtGrad)" rx="8"/>
      <rect x={30} y={20} width={CW-60} height={CH-40} fill="none" stroke="#ffffff11" strokeWidth="1" rx="4"/>
      <line x1={CW/2} y1={20} x2={CW/2} y2={CH-20} stroke="#ffffff33" strokeWidth="2" strokeDasharray="6,4"/>
      <rect x={CW/2-4} y={CH/2-20} width={8} height={40} fill="#ffffff22" rx="2"/>
      <line x1={CW*0.25} y1={20} x2={CW*0.25} y2={CH-20} stroke="#ffffff0a" strokeWidth="1"/>
      <line x1={CW*0.75} y1={20} x2={CW*0.75} y2={CH-20} stroke="#ffffff0a" strokeWidth="1"/>

      {[0,1].map(p => {
        const x  = p===0 ? 0 : CW-18;
        const y  = GRID_Y_START*CH;
        const h  = (GRID_Y_END-GRID_Y_START)*CH;
        const rh = h/ROWS;
        const c  = p===0 ? "#ff3864" : "#3bff8a";
        return (
          <g key={p}>
            <rect x={x} y={y} width={18} height={h} fill={`${c}08`} stroke={`${c}30`} strokeWidth="1"/>
            {[1,2].map(r => (
              <line key={r} x1={x} y1={y+r*rh} x2={x+18} y2={y+r*rh}
                stroke={`${c}25`} strokeWidth="1" strokeDasharray="3,2"/>
            ))}
          </g>
        );
      })}

      {ballTrail.map((t,i) => (
        <circle key={i} cx={t.x*CW} cy={t.y*CH}
          r={4*(i/ballTrail.length)} fill={ballColor} opacity={(i/ballTrail.length)*0.4}/>
      ))}
      <circle cx={ballX*CW} cy={ballY*CH} r={8} fill={ballColor} filter="url(#ballGlow)"/>
      <circle cx={ballX*CW} cy={ballY*CH} r={4} fill="white"/>

      {[0,1].map(p => {
        const isHit = lastHit===p;
        const c = p===0 ? "#ff3864" : "#3bff8a";
        const x = playerX[p]*CW, y = playerY[p]*CH;
        const rx2 = p===0 ? x+16 : x-16;
        return (
          <g key={p} filter={isHit?"url(#glow)":"none"}>
            <ellipse cx={x} cy={y+10} rx={10} ry={16} fill={c} opacity={0.9}/>
            <circle  cx={x} cy={y-8}  r={9}            fill={c} opacity={0.95}/>
            <ellipse cx={rx2} cy={y+4} rx={isHit?14:10} ry={isHit?9:7}
              fill="none" stroke={c} strokeWidth={isHit?3:2}
              transform={`rotate(${p===0?-30:30},${rx2},${y+4})`}/>
            <text x={x} y={y+36} textAnchor="middle" fill={c}
              fontSize="11" fontFamily="'Courier New',monospace" fontWeight="bold">P{p+1}</text>
          </g>
        );
      })}

      {phase==="smashout" && (
        <text x={CW/2} y={CH/2} textAnchor="middle" dominantBaseline="middle"
          fill="#ffe347" fontSize="36" fontFamily="'Courier New',monospace"
          fontWeight="900" opacity="0.18" letterSpacing="6">SMASHOUT</text>
      )}
    </svg>
  );
}

// ── Game state ────────────────────────────────────────────────────────────────
function initGameState(panelColors) {
  return {
    panels:        [initPanels(), initPanels()],
    panelColors,
    panelRestored: [initRestored(), initRestored()],
    ballX:0.5, ballY:0.5, ballDX:0.038, ballDY:0.025,
    playerX:[0.08,0.92], playerY:[0.5,0.5],
    phase:"rally", smashoutPlayer:null, winner:null,
    log:["🎮 SMASHOUT — Match start! Knock out all panels to win!"],
    tick:0, lastHit:null, ballTrail:[], flashPanel:null, rallyCount:0,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Smashout() {
  const [screen, setScreen]   = useState("setup");
  const [gs, setGs]           = useState(null);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed]     = useState(50);

  function handleStart(colors) {
    setGs(initGameState(colors));
    setScreen("game");
  }

  const step = useCallback(() => {
    setGs(prev => {
      if (!prev || prev.phase==="gameover") return prev;

      let {
        panels, panelColors, panelRestored,
        ballX, ballY, ballDX, ballDY,
        playerX, playerY, phase, smashoutPlayer,
        log, tick, lastHit, ballTrail, flashPanel, rallyCount, winner,
      } = prev;

      panels        = [panels[0].slice(),       panels[1].slice()];
      panelRestored = [panelRestored[0].slice(), panelRestored[1].slice()];
      log           = log.slice();
      playerY       = playerY.slice();
      tick++;  lastHit=null;  flashPanel=null;

      let newX = ballX + ballDX;
      let newY = ballY + ballDY;
      ballTrail = [...ballTrail.slice(-10), {x:ballX, y:ballY}];

      if (newY<0.06||newY>0.94) { ballDY=-ballDY; newY=Math.max(0.06,Math.min(0.94,newY)); }

      for (let p=0; p<2; p++) {
        const px=playerX[p], py=playerY[p];
        if (Math.sqrt((newX-px)**2+(newY-py)**2) < 0.09) {
          ballDX = -ballDX*(0.98+Math.random()*0.08);
          ballDY =  ballDY*(0.90+Math.random()*0.20)+(Math.random()-0.5)*0.005;
          ballDY = Math.max(-0.045, Math.min(0.045, ballDY));
          newX   = px+(p===0?0.09:-0.09);
          lastHit=p; rallyCount++;
          playerY[p]=py+(newY-py)*0.6;
        }
      }
      for (let p=0; p<2; p++) {
        const t=ballY+(Math.random()-0.5)*0.1;
        playerY[p]=Math.max(0.15,Math.min(0.85,playerY[p]+(t-playerY[p])*0.08));
      }

      function wallHit(attacker, defender, xReset, dxSign) {
        newX   = xReset;
        ballDX = dxSign * Math.abs(ballDX);

        // Smashout finisher — only on defender's wall
        if (phase==="smashout" && defender===(1-smashoutPlayer)) {
          winner=attacker; phase="gameover";
          log.push(`💥 SMASHOUT FINISHER! P${attacker+1} wins!`);
          return;
        }

        const inGrid = newY>=GRID_Y_START && newY<=GRID_Y_END;
        if (!inGrid) {
          log.push(`⬜ P${attacker+1} clips wall — missed grid (${newY<GRID_Y_START?"too high":"too low"})!`);
          return;
        }

        const hitRow   = Math.min(ROWS-1, Math.floor((newY-GRID_Y_START)/GRID_ROW_H));
        const rowStart = hitRow*COLS;
        const intact   = panels[defender]
          .map((v,i)=>(v&&i>=rowStart&&i<rowStart+COLS)?i:-1).filter(i=>i>=0);

        if (!intact.length) {
          log.push(`↩ P${attacker+1} hits row ${hitRow+1} — nothing left there!`);
          return;
        }

        const idx      = intact[Math.floor(Math.random()*intact.length)];
        const hitColor = panelColors[defender][idx];
        panels[defender][idx] = false;
        flashPanel = {player:defender, idx, type:"break"};
        log.push(`${attacker===0?"🔵":"🔴"} P${attacker+1} smashes P${defender+1}'s ${colorName(hitColor)} panel #${idx+1}!`);

        // Same-color AND same-position restore
        const rIdx = idx; // must be exact same slot
        if (
          panelColors[attacker][rIdx] === hitColor &&
          !panels[attacker][rIdx] &&
          !panelRestored[attacker][rIdx]
        ) {
          panels[attacker][rIdx]        = true;
          panelRestored[attacker][rIdx] = true;
          flashPanel = {player:attacker, idx:rIdx, type:"restore"};
          log.push(`✨ P${attacker+1}'s ${colorName(hitColor)} panel #${rIdx+1} restored! (slot used)`);
        }

        const trigger = checkSmashout(panels[defender]);
        if (trigger && phase!=="smashout") {
          phase=smashoutPlayer=attacker; // set both
          smashoutPlayer=attacker; phase="smashout";
          log.push(trigger==="all"
            ? `⚡ ALL PANELS GONE — SMASHOUT! P${attacker+1} one hit from victory!`
            : `⚡ ${trigger.toUpperCase()} CLEARED — SMASHOUT! P${attacker+1} on match point!`);
        }
      }

      if (newX<0.04) wallHit(1,0,0.08,+1);
      if (newX>0.96) wallHit(0,1,0.92,-1);

      return {panels,panelColors,panelRestored,ballX:newX,ballY:newY,ballDX,ballDY,
        playerX,playerY,phase,smashoutPlayer,winner,log,tick,lastHit,ballTrail,flashPanel,rallyCount};
    });
  }, []);

  useEffect(() => {
    if (!running||!gs||gs.phase==="gameover") return;
    const t = setInterval(step,speed);
    return () => clearInterval(t);
  }, [running,step,speed,gs?.phase]);

  useEffect(() => { if (gs?.phase==="gameover") setRunning(false); }, [gs?.phase]);

  const logRef = useRef(null);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop=logRef.current.scrollHeight; }, [gs?.log]);

  if (screen==="setup") return <SetupScreen onStart={handleStart}/>;

  const p1i = gs.panels[0].filter(Boolean).length;
  const p2i = gs.panels[1].filter(Boolean).length;

  return (
    <div style={{minHeight:"100vh",background:"#07070f",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",padding:"20px",
      fontFamily:"'Courier New',Courier,monospace",color:"#e0e0ff"}}>
      <style>{`
        @keyframes breakFlash{0%{transform:scale(1);background:white}50%{transform:scale(1.5);background:#ff3864}100%{transform:scale(1)}}
        @keyframes restoreFlash{0%{transform:scale(0);opacity:0}60%{transform:scale(1.4);opacity:1}100%{transform:scale(1)}}
        @keyframes smashPulse{0%,100%{text-shadow:0 0 20px #ffe347,0 0 40px #ffe347}50%{text-shadow:0 0 40px #ffe347,0 0 80px #ffe347,0 0 120px #ff6b35}}
        @keyframes titleGlow{0%,100%{text-shadow:0 0 10px #00d4ff,0 0 30px #00d4ff88}50%{text-shadow:0 0 20px #00d4ff,0 0 60px #00d4ffaa}}
        .log-entry{padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px;line-height:1.6}
        .log-entry.latest{color:#ffe347;font-weight:bold}
        .btn{background:transparent;border:1px solid currentColor;color:inherit;padding:8px 20px;
          font-family:'Courier New',monospace;font-size:13px;cursor:pointer;border-radius:3px;
          letter-spacing:2px;text-transform:uppercase;transition:background 0.15s}
        .btn:hover{background:rgba(255,255,255,0.08)}
      `}</style>

      <h1 style={{fontSize:"42px",fontWeight:900,letterSpacing:"10px",color:"#00d4ff",
        margin:0,animation:"titleGlow 2s infinite"}}>SMASHOUT</h1>
      <p style={{color:"rgba(255,255,255,0.27)",fontSize:"11px",letterSpacing:"4px",margin:"4px 0 12px"}}>
        PANEL DESTRUCTION TENNIS
      </p>

      <div style={{
        padding:"6px 24px",marginBottom:"12px",borderRadius:"2px",fontSize:"12px",
        letterSpacing:"3px",textTransform:"uppercase",fontWeight:"bold",minWidth:"320px",textAlign:"center",
        background:gs.phase==="gameover"?"rgba(255,56,100,0.15)":gs.phase==="smashout"?"rgba(255,227,71,0.12)":"rgba(0,212,255,0.08)",
        color:gs.phase==="gameover"?"#ff3864":gs.phase==="smashout"?"#ffe347":"rgba(0,212,255,0.53)",
        border:`1px solid ${gs.phase==="gameover"?"rgba(255,56,100,0.27)":gs.phase==="smashout"?"rgba(255,227,71,0.27)":"rgba(0,212,255,0.13)"}`,
        animation:gs.phase==="smashout"?"smashPulse 0.8s infinite":"none",
      }}>
        {gs.phase==="gameover"?`⚡ GAME OVER — Player ${gs.winner+1} WINS!`
          :gs.phase==="smashout"?"🔥 SMASHOUT ROUND — ONE HIT LEFT!"
          :`● RALLY — ${gs.rallyCount} hits`}
      </div>

      <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
        {[0,1].map(p => (
          <div key={p} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"6px"}}>
            <div style={{fontSize:"11px",color:p===0?"#ff3864":"#3bff8a",letterSpacing:"2px"}}>P{p+1}</div>
            <PanelGrid
              panels={gs.panels[p]}
              panelColors={gs.panelColors[p]}
              panelRestored={gs.panelRestored[p]}
              side={p}
              flashPanel={gs.flashPanel}
              smashout={gs.phase==="smashout" && gs.smashoutPlayer===(1-p)}
            />
            <div style={{fontSize:"10px",color:p===0?"rgba(255,56,100,0.53)":"rgba(59,255,138,0.53)"}}>
              {p===0?p1i:p2i}/9
            </div>
          </div>
        )).reduce((acc,el,i) => i===0
          ? [el, <div key="court" style={{border:"1px solid rgba(0,212,255,0.15)",borderRadius:"8px",overflow:"hidden",
              boxShadow:gs.phase==="smashout"?"0 0 30px rgba(255,227,71,0.13)":"0 0 20px rgba(0,212,255,0.07)"}}>
              <Court state={gs}/>
            </div>, el]
          : acc, []
        )}
      </div>

      <div style={{display:"flex",gap:"10px",marginTop:"16px",alignItems:"center"}}>
        {gs.phase!=="gameover" && (
          <button className="btn" style={{color:running?"#ff3864":"#3bff8a"}}
            onClick={() => setRunning(r=>!r)}>
            {running?"⏸ Pause":"▶ Play"}
          </button>
        )}
        <button className="btn" style={{color:"#00d4ff"}}
          onClick={() => {setRunning(false);setScreen("setup");}}>↺ New Game</button>
        {!running&&gs.phase!=="gameover" && (
          <button className="btn" style={{color:"#c77dff"}} onClick={step}>▷ Step</button>
        )}
        <div style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"11px",color:"rgba(255,255,255,0.27)"}}>
          <span>SPD</span>
          <input type="range" min={1} max={10} value={Math.round(300/speed)}
            onChange={e => setSpeed(Math.round(300 / Number(e.target.value)))}
            style={{width:"70px",accentColor:"#00d4ff"}}/>
        </div>
      </div>

      <div ref={logRef} style={{marginTop:"14px",width:"580px",maxHeight:"110px",overflowY:"auto",
        background:"rgba(0,0,0,0.4)",border:"1px solid rgba(255,255,255,0.06)",
        borderRadius:"4px",padding:"8px 12px"}}>
        {gs.log.slice(-30).map((e,i,a) => (
          <div key={i} className={`log-entry${i===a.length-1?" latest":""}`}>{e}</div>
        ))}
      </div>

      <div style={{marginTop:"10px",fontSize:"10px",color:"rgba(255,255,255,0.2)",
        letterSpacing:"1px",textAlign:"center",lineHeight:1.9}}>
        SMASH PANEL → MATCHING COLOR ON YOUR WALL RESTORES (ONCE) &nbsp;•&nbsp; CLEAR ROW OR ALL → SMASHOUT &nbsp;•&nbsp; ONE MORE HIT = WIN
        <br/>● DOT = RESTORE SLOT USED ON THAT PANEL
      </div>
    </div>
  );
}

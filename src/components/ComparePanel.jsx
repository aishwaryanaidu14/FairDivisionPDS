import { useState, useMemo } from 'react';
import { RULE_COLORS } from './Sidebar';

const RULES = ['PRO', 'wNSW', 'Atkinson', 'Leximin'];
const RICE  = '#a85c1a';
const WHEAT = '#2a6175';

function AllocationBar({ rice, wheat, maxTotal }) {
  const rW = maxTotal > 0 ? (rice/maxTotal)*100 : 0;
  const wW = maxTotal > 0 ? (wheat/maxTotal)*100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 16, display: 'flex', borderRadius: 3, overflow: 'hidden', background: 'var(--bg)' }}>
        <div style={{ width: `${rW}%`, background: RICE, transition: 'width 0.3s' }} />
        <div style={{ width: `${wW}%`, background: WHEAT, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text-2)', whiteSpace: 'nowrap', width: 100 }}>
        <span style={{ color: RICE }}>{rice.toFixed(0)}R</span> + <span style={{ color: WHEAT }}>{wheat.toFixed(0)}W</span> kg/p/yr
      </span>
    </div>
  );
}

function StateCard({ state, activeRule, data, maxTotal }) {
  if (!state) return (
    <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 8, border: '2px dashed var(--border)', padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
      Select a state
    </div>
  );
  const s = data.states.find(x => x.name === state);
  if (!s) return null;
  return (
    <div className="card" style={{ flex: 1, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'Spectral, Georgia, serif', fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>{s.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, fontFamily: 'DM Sans, sans-serif' }}>
          Poverty H = {s.H_i.toFixed(3)} · Rice pref aᵢ = {s.a_i.toFixed(3)} · {s.n_i >= 1e7 ? `${(s.n_i/1e7).toFixed(1)} Cr` : `${(s.n_i/1e5).toFixed(1)} L`} poor
        </div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        {RULES.map(r => {
          const rice  = s.alloc[r]?.rice_kg_pc  || 0;
          const wheat = s.alloc[r]?.wheat_kg_pc || 0;
          const u     = s.alloc[r]?.u;
          const isActive = r === activeRule;
          return (
            <div key={r} style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 5, background: isActive ? `${RULE_COLORS[r]}0e` : 'transparent', border: isActive ? `1px solid ${RULE_COLORS[r]}40` : '1px solid transparent', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: RULE_COLORS[r], fontFamily: 'DM Sans, sans-serif' }}>{r}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: isActive ? RULE_COLORS[r] : 'var(--text-2)', fontWeight: isActive ? 700 : 400 }}>ũ = {u?.toFixed(4) ?? '—'}</span>
              </div>
              <AllocationBar rice={rice} wheat={wheat} maxTotal={maxTotal} />
            </div>
          );
        })}
        {s.rice_nfsa != null && s.n_i > 0 && (() => {
          const rN = (s.rice_nfsa || 0)*1e6/s.n_i;
          const wN = (s.wheat_nfsa || 0)*1e6/s.n_i;
          return (
            <div style={{ marginTop: 4, padding: '8px 10px', borderRadius: 5, background: 'var(--bg)', border: '1px dashed var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif' }}>NFSA baseline</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-3)' }}>ũ = {s.u_nfsa?.toFixed(4) ?? 'N/A'}</span>
              </div>
              <AllocationBar rice={rN} wheat={wN} maxTotal={maxTotal} />
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default function ComparePanel({ data }) {
  const [stateA, setStateA] = useState('Bihar');
  const [stateB, setStateB] = useState('Rajasthan');
  const [activeRule, setActiveRule] = useState('Leximin');

  const stateNames = useMemo(() => data.states.filter(s => s.n_i > 0).map(s => s.name).sort(), [data.states]);
  const sA = data.states.find(s => s.name === stateA);
  const sB = data.states.find(s => s.name === stateB);

  const maxTotal = useMemo(() => {
    let max = 0;
    [sA, sB].forEach(s => {
      if (!s) return;
      RULES.forEach(r => { const t = (s.alloc[r]?.rice_kg_pc||0)+(s.alloc[r]?.wheat_kg_pc||0); if(t>max) max=t; });
      if (s.n_i > 0) { const t = (s.rice_nfsa||0)*1e6/s.n_i + (s.wheat_nfsa||0)*1e6/s.n_i; if(t>max) max=t; }
    });
    return max || 500;
  }, [sA, sB]);

  const gapData = RULES.map(r => ({
    rule: r,
    gap: sA?.alloc[r]?.u != null && sB?.alloc[r]?.u != null ? sA.alloc[r].u - sB.alloc[r].u : null,
  }));
  const maxAbsGap = Math.max(...gapData.map(d => d.gap != null ? Math.abs(d.gap) : 0), 0.01);

  const selStyle = { padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 5, fontSize: 13, background: 'white', color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', outline: 'none', width: '100%' };

  return (
    <div className="panel" style={{ maxWidth: '100%' }}>
      <div className="panel-header">
        <h2>Compare Two States</h2>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 5, fontFamily: 'DM Sans, sans-serif' }}>State A</div>
          <select value={stateA} onChange={e => setStateA(e.target.value)} style={selStyle}>
            {stateNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 16, color: 'var(--text-3)', paddingBottom: 7, flexShrink: 0, fontFamily: 'DM Sans, sans-serif' }}>vs</div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 5, fontFamily: 'DM Sans, sans-serif' }}>State B</div>
          <select value={stateB} onChange={e => setStateB(e.target.value)} style={selStyle}>
            {stateNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 5, fontFamily: 'DM Sans, sans-serif' }}>Highlight rule</div>
          <div className="rule-tabs">
            {RULES.map(r => (
              <button key={r} className={`rule-tab ${activeRule === r ? 'active' : ''}`} onClick={() => setActiveRule(r)} style={{ color: activeRule === r ? RULE_COLORS[r] : undefined }}>{r}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <StateCard state={stateA} activeRule={activeRule} data={data} maxTotal={maxTotal} />
        <StateCard state={stateB} activeRule={activeRule} data={data} maxTotal={maxTotal} />
      </div>

      {/* Gap chart */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, fontFamily: 'DM Sans, sans-serif' }}>
          Utility gap: ũ({stateA}) − ũ({stateB})
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 14, fontFamily: 'DM Sans, sans-serif' }}>
          Positive = {stateA} is better off · Under Leximin the gap is always 0 by construction
        </div>
        {gapData.map(d => (
          <div key={d.rule} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 9 }}>
            <span style={{ width: 64, fontSize: 12, fontWeight: 600, color: RULE_COLORS[d.rule], flexShrink: 0, fontFamily: 'DM Sans, sans-serif' }}>{d.rule}</span>
            <div style={{ flex: 1, height: 18, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'var(--border)' }} />
              {d.gap != null && (
                <div style={{
                  position: 'absolute', height: 12, borderRadius: 2,
                  background: RULE_COLORS[d.rule], opacity: d.rule === activeRule ? 1 : 0.42,
                  transition: 'width 0.3s ease, opacity 0.15s',
                  ...(d.gap >= 0 ? { left: '50%', width: `${(d.gap/maxAbsGap)*45}%` } : { right: '50%', width: `${(-d.gap/maxAbsGap)*45}%` }),
                }} />
              )}
            </div>
            <span style={{ width: 72, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textAlign: 'right', flexShrink: 0, fontWeight: d.rule === activeRule ? 700 : 400, color: d.gap == null ? 'var(--text-3)' : d.gap > 0.001 ? '#2a6b42' : d.gap < -0.001 ? '#c1303a' : 'var(--text-2)' }}>
              {d.gap != null ? `${d.gap > 0 ? '+' : ''}${d.gap.toFixed(4)}` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

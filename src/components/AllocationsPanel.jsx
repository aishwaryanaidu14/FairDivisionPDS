import { useState, useMemo } from 'react';
import { RULE_COLORS } from './Sidebar';

const RULES = ['PRO', 'wNSW', 'Atkinson', 'Leximin'];
const RICE  = '#a85c1a';
const WHEAT = '#2a6175';

export default function AllocationsPanel({ data }) {
  const [rule, setRule]       = useState('Leximin');
  const [sort, setSort]       = useState('a_i');
  const [sortDir, setSortDir] = useState('asc');
  const [search, setSearch]   = useState('');

  const sorted = useMemo(() => {
    let rows = data.states.filter(s => s.n_i > 0);
    if (search) rows = rows.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    return [...rows].sort((a, b) => {
      let va = sort === 'u' ? (a.alloc[rule]?.u ?? -99) : a[sort];
      let vb = sort === 'u' ? (b.alloc[rule]?.u ?? -99) : b[sort];
      if (sort === 'name') return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      return sortDir === 'asc' ? va - vb : vb - va;
    });
  }, [data.states, rule, sort, sortDir, search]);

  const maxTotal = useMemo(() => {
    let max = 0;
    sorted.forEach(s => {
      const t = (s.alloc[rule]?.rice_kg_pc || 0) + (s.alloc[rule]?.wheat_kg_pc || 0);
      if (t > max) max = t;
    });
    return max || 400;
  }, [sorted, rule]);

  function toggleSort(col) {
    if (sort === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(col); setSortDir('asc'); }
  }

  function SortBtn({ col, label }) {
    const active = sort === col;
    return (
      <span onClick={() => toggleSort(col)} style={{ cursor: 'pointer', userSelect: 'none', color: active ? 'var(--text)' : 'var(--text-3)', fontWeight: active ? 600 : 400, fontSize: 11, fontFamily: 'DM Sans, sans-serif', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        {label} <span style={{ fontSize: 9, opacity: active ? 1 : 0.4 }}>{active ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
      </span>
    );
  }

  const IMPROVERS = ['Bihar','Uttar Pradesh','Madhya Pradesh','Jharkhand','Dadra & Nagar Haveli & Daman & Diu'];

  return (
    <div className="panel" style={{ maxWidth: '100%' }}>
      <div className="panel-header">
        <h2>Allocations by State</h2>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 5, fontFamily: 'DM Sans, sans-serif' }}>Rule</div>
          <div className="rule-tabs">
            {RULES.map(r => (
              <button key={r} className={`rule-tab ${rule === r ? 'active' : ''}`} onClick={() => setRule(r)}
                style={{ color: rule === r ? RULE_COLORS[r] : undefined }}>{r}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 5, fontFamily: 'DM Sans, sans-serif' }}>Search</div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter states…"
            style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 5, fontSize: 12, background: 'white', fontFamily: 'DM Sans, sans-serif', outline: 'none', width: 150 }} />
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif' }}>{sorted.length} states</div>
      </div>

      {/* Legend on top */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 10, fontSize: 11, color: 'var(--text-2)', alignItems: 'center', fontFamily: 'DM Sans, sans-serif', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 11, height: 11, borderRadius: 2, background: RICE }} /> Rice (kg/poor person/yr)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 11, height: 11, borderRadius: 2, background: WHEAT }} /> Wheat (kg/poor person/yr)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: '#2a6b42', fontWeight: 600 }}>Green names</span> = improves vs NFSA (robust)</div>
        <span style={{ color: 'var(--text-3)' }}>DBT = cash transfer, no in-kind allocation</span>
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '9px 12px', textAlign: 'left' }}><SortBtn col="name" label="State" /></th>
              <th style={{ padding: '9px 8px', textAlign: 'right' }}><SortBtn col="H_i" label="H (poverty)" /></th>
              <th style={{ padding: '9px 8px', textAlign: 'right' }}><SortBtn col="a_i" label="aᵢ (rice pref)" /></th>
              <th style={{ padding: '9px 8px', textAlign: 'right' }}><SortBtn col="n_i" label="Poor pop." /></th>
              <th style={{ padding: '9px 12px', textAlign: 'left', color: RULE_COLORS[rule], fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 700, minWidth: 200 }}>
                Rice + Wheat under {rule}
              </th>
              <th style={{ padding: '9px 8px', textAlign: 'right' }}><SortBtn col="u" label="ũᵢ" /></th>
              <th style={{ padding: '9px 8px', textAlign: 'right', fontSize: 11, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, whiteSpace: 'nowrap' }}>Δ vs NFSA</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => {
              const rice  = s.alloc[rule]?.rice_kg_pc  || 0;
              const wheat = s.alloc[rule]?.wheat_kg_pc || 0;
              const total = rice + wheat;
              const u     = s.alloc[rule]?.u;
              const delta = u != null && s.u_nfsa != null ? u - s.u_nfsa : null;
              const isImprover = IMPROVERS.includes(s.name);
              const isDBT = s.u_nfsa == null && (s.rice_nfsa === 0 && s.wheat_nfsa === 0);

              return (
                <tr key={s.name} style={{ borderBottom: '1px solid var(--border)', background: i%2===0 ? 'white' : 'var(--bg)' }}>
                  <td style={{ padding: '7px 12px', fontWeight: 500, color: isImprover ? '#2a6b42' : 'var(--text)', whiteSpace: 'nowrap', fontFamily: 'DM Sans, sans-serif' }}>
                    {s.name}
                    {isDBT && <span style={{ marginLeft: 5, fontSize: 9, padding: '1px 5px', background: 'var(--bg2)', borderRadius: 8, color: 'var(--text-3)' }}>DBT</span>}
                  </td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-2)', fontSize: 11 }}>{s.H_i.toFixed(3)}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-2)', fontSize: 11 }}>{s.a_i.toFixed(3)}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-2)', fontSize: 11, whiteSpace: 'nowrap' }}>
                    {s.n_i >= 1e7 ? `${(s.n_i/1e7).toFixed(1)}Cr` : s.n_i >= 1e5 ? `${(s.n_i/1e5).toFixed(1)}L` : s.n_i.toLocaleString()}
                  </td>
                  <td style={{ padding: '7px 12px', minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <div style={{ height: 11, width: `${(rice/maxTotal)*110}px`, background: RICE, borderRadius: '2px 0 0 2px', flexShrink: 0, transition: 'width 0.3s' }} />
                      <div style={{ height: 11, width: `${(wheat/maxTotal)*110}px`, background: WHEAT, borderRadius: '0 2px 2px 0', flexShrink: 0, transition: 'width 0.3s' }} />
                      <span style={{ marginLeft: 5, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                        {rice.toFixed(0)}+{wheat.toFixed(0)}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{u?.toFixed(4) ?? '—'}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                    color: delta == null ? 'var(--text-3)' : delta > 0 ? '#2a6b42' : '#c1303a' }}>
                    {delta != null ? `${delta > 0 ? '+' : ''}${delta.toFixed(4)}` : (isDBT ? 'DBT' : 'N/A')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState, useMemo, useRef } from 'react';
import { RULE_COLORS } from './Sidebar';
import indiaGeo from '../data/india.geo.json';

const RULES = ['PRO', 'wNSW', 'Atkinson', 'Leximin'];

const GEO_TO_DATA = {
  'Tamil Nadu':'Tamil Nadu','Puducherry':'Puducherry','Himachal Pradesh':'Himachal Pradesh',
  'Sikkim':'Sikkim','Delhi':'Delhi','Uttar Pradesh':'Uttar Pradesh','Haryana':'Haryana',
  'Punjab':'Punjab','Chandigarh':'Chandigarh','Rajasthan':'Rajasthan',
  'Jammu and Kashmir':'Jammu & Kashmir','Gujarat':'Gujarat','Madhya Pradesh':'Madhya Pradesh',
  'Maharashtra':'Maharashtra','Dadra and Nagar Haveli and Daman and Diu':'Dadra & Nagar Haveli & Daman & Diu',
  'Bihar':'Bihar','West Bengal':'West Bengal','Jharkhand':'Jharkhand',
  'Chhattisgarh':'Chhattisgarh','Odisha':'Odisha','Kerala':'Kerala',
  'Karnataka':'Karnataka','Andhra Pradesh':'Andhra Pradesh',
  'Andaman and Nicobar Islands':'Andaman & Nicobar Islands','Assam':'Assam',
  'Tripura':'Tripura','Arunachal Pradesh':'Arunachal Pradesh','Lakshadweep':'Lakshadweep',
  'Meghalaya':'Meghalaya','Manipur':'Manipur','Nagaland':'Nagaland',
  'Mizoram':'Mizoram','Telangana':'Telangana','Ladakh':'Ladakh',
  'Uttarakhand':'Uttarakhand','Goa':'Goa',
};

function project(lon, lat, W, H) {
  const x = ((lon - 67.5) / (98 - 67.5)) * W;
  const y = ((38 - lat) / (38 - 5.5)) * H;
  return [x, y];
}

function coordsToPath(geometry, w, h) {
  function ring(coords) {
    return coords.map((c, i) => { const [x,y] = project(c[0],c[1],w,h); return `${i===0?'M':'L'}${x.toFixed(1)},${y.toFixed(1)}`; }).join(' ') + 'Z';
  }
  if (geometry.type === 'Polygon') return geometry.coordinates.map(ring).join(' ');
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.map(p => p.map(ring).join(' ')).join(' ');
  return '';
}

function utilColor(u, minU, maxU) {
  if (u == null) return '#ddd8d0';
  const t = Math.max(0, Math.min(1, (u - minU) / (maxU - minU)));
  return `rgb(${Math.round(200-t*100)},${Math.round(100+t*100)},${Math.round(80-t*20)})`;
}

function deltaColor(delta) {
  if (delta == null) return '#ddd8d0';
  if (Math.abs(delta) < 0.02) return '#d8d4cc';
  if (delta > 0) { const t = Math.min(1, delta/1.2); return `rgb(${Math.round(80-t*30)},${Math.round(140+t*70)},${Math.round(80-t*20)})`; }
  const t = Math.min(1, -delta/1.2);
  return `rgb(${Math.round(180+t*60)},${Math.round(80-t*40)},${Math.round(60-t*20)})`;
}

export default function MapPanel({ data }) {
  const [rule, setRule] = useState('Leximin');
  const [colorMode, setColorMode] = useState('util');
  const [hovered, setHovered] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const W = 600, H = 620;

  const stateMap = useMemo(() => { const m = {}; data.states.forEach(s => { m[s.name] = s; }); return m; }, [data.states]);
  const utils = data.states.map(s => s.alloc[rule]?.u).filter(u => u != null);
  const minU = Math.min(...utils), maxU = Math.max(...utils);

  const paths = useMemo(() => indiaGeo.features.map(f => ({
    geoName: f.properties.name,
    dataName: GEO_TO_DATA[f.properties.name],
    d: coordsToPath(f.geometry, W, H),
  })), []);

  function getFill(dataName) {
    const s = stateMap[dataName];
    if (!s) return '#ddd8d0';
    if (colorMode === 'util') return utilColor(s.alloc[rule]?.u, minU, maxU);
    const u = s.alloc[rule]?.u;
    return deltaColor(u != null && s.u_nfsa != null ? u - s.u_nfsa : null);
  }

  const hovState = hovered ? stateMap[hovered] : null;

  return (
    <div className="panel" style={{ maxWidth: '100%' }}>
      <div className="panel-header">
        <h2>State Map</h2>
        <p style={{ fontFamily: 'DM Sans, sans-serif' }}>Hover any state to see its allocation and welfare. States without two-grain NFSA baselines show grey for the Δ view.</p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
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
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 5, fontFamily: 'DM Sans, sans-serif' }}>Colour by</div>
          <div className="rule-tabs">
            {[['util','Welfare ũᵢ'],['delta','Improvement vs NFSA']].map(([m,l]) => (
              <button key={m} className={`rule-tab ${colorMode === m ? 'active' : ''}`} onClick={() => setColorMode(m)} style={{ fontFamily: 'DM Sans, sans-serif' }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend on top */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 11, color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif' }}>
        <span>Low</span>
        {colorMode === 'util'
          ? <div style={{ width: 100, height: 8, borderRadius: 4, background: 'linear-gradient(to right, rgb(200,100,80), rgb(100,200,60))' }} />
          : <div style={{ width: 100, height: 8, borderRadius: 4, background: 'linear-gradient(to right, rgb(240,40,40), #d8d4cc, rgb(50,210,50))' }} />
        }
        <span>High</span>
        {colorMode === 'delta' && <span style={{ marginLeft: 8, color: 'var(--text-3)' }}>· Grey = no comparable NFSA baseline</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 20 }}>
        <div className="card" style={{ padding: 8, position: 'relative', overflow: 'hidden' }}>
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}
            onMouseLeave={() => setHovered(null)}>
            {paths.map(({ geoName, dataName, d }) => (
              <path key={geoName} d={d} fill={getFill(dataName)} stroke="white" strokeWidth={0.7}
                style={{ cursor: 'pointer', transition: 'opacity 0.12s' }}
                opacity={hovered && hovered !== dataName ? 0.72 : 1}
                onMouseEnter={e => { setHovered(dataName); setMouse({ x: e.clientX, y: e.clientY }); }}
                onMouseMove={e => setMouse({ x: e.clientX, y: e.clientY })} />
            ))}
          </svg>
          {!hovered && (
            <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', fontSize: 11, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, color: 'var(--accent)', background: 'rgba(255,255,255,0.9)', padding: '4px 10px', borderRadius: 4, pointerEvents: 'none' }}>
              Hover a state
            </div>
          )}
        </div>

        {/* State detail */}
        <div className="card" style={{ padding: '14px 16px' }}>
          {hovState ? (
            <>
              <div style={{ fontFamily: 'Spectral, Georgia, serif', fontWeight: 600, fontSize: 15, marginBottom: 10, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>{hovState.name}</div>
              <div className="stat-row"><span className="stat-label">MPI poverty H</span><span className="stat-value">{hovState.H_i.toFixed(3)}</span></div>
              <div className="stat-row"><span className="stat-label">Rice pref. aᵢ</span><span className="stat-value">{hovState.a_i.toFixed(3)}</span></div>
              <div className="stat-row"><span className="stat-label">Poor population</span><span className="stat-value">{(hovState.n_i/1e5).toFixed(1)} L</span></div>
              <div style={{ marginTop: 10, marginBottom: 6, fontSize: 10, fontWeight: 700, color: RULE_COLORS[rule], textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'DM Sans, sans-serif' }}>Under {rule}</div>
              <div className="stat-row">
                <span className="stat-label">Rice</span>
                <span className="stat-value" style={{ color: '#a85c1a' }}>{hovState.alloc[rule]?.rice_kg_pc?.toFixed(0) ?? '—'} kg/p/yr</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Wheat</span>
                <span className="stat-value" style={{ color: '#2a6175' }}>{hovState.alloc[rule]?.wheat_kg_pc?.toFixed(0) ?? '—'} kg/p/yr</span>
              </div>
              <div className="stat-row"><span className="stat-label">ũᵢ</span><span className="stat-value">{hovState.alloc[rule]?.u?.toFixed(4) ?? '—'}</span></div>
              {hovState.u_nfsa != null && (
                <div className="stat-row">
                  <span className="stat-label">Δ vs NFSA</span>
                  <span className="stat-value" style={{ color: (hovState.alloc[rule]?.u ?? 0) > hovState.u_nfsa ? '#2a6b42' : '#c1303a' }}>
                    {hovState.alloc[rule]?.u != null ? `${hovState.alloc[rule].u - hovState.u_nfsa > 0 ? '+' : ''}${(hovState.alloc[rule].u - hovState.u_nfsa).toFixed(4)}` : '—'}
                  </span>
                </div>
              )}
              <div style={{ marginTop: 12, fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'DM Sans, sans-serif' }}>All rules</div>
              {RULES.map(r => {
                const u = hovState.alloc[r]?.u;
                const pct = u != null ? Math.max(0, (u-(-9.5))/((-8.7)-(-9.5)))*100 : 0;
                return (
                  <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <span style={{ width: 58, fontSize: 11, fontWeight: r===rule ? 700 : 400, color: RULE_COLORS[r], fontFamily: 'DM Sans, sans-serif' }}>{r}</span>
                    <div className="mini-bar-track"><div className="mini-bar-fill" style={{ width: `${pct}%`, background: RULE_COLORS[r] }} /></div>
                    <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', width: 52, textAlign: 'right', fontWeight: r===rule ? 700 : 400 }}>{u?.toFixed(3) ?? '—'}</span>
                  </div>
                );
              })}
            </>
          ) : (
            <div style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '32px 0', fontFamily: 'DM Sans, sans-serif' }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>◉</div>
              Hover a state on the map
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

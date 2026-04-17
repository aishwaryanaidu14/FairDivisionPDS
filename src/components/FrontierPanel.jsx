import { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RULE_COLORS } from './Sidebar';
import { Tex } from '../utils.jsx';

const RULES = ['PRO', 'wNSW', 'Atkinson', 'Leximin'];

const METRIC_ROWS = [
  { key: 'min_u',       label: 'Floor ũ (worst-off state)' },
  { key: 'max_u',       label: 'Ceiling ũ (best-off state)' },
  { key: 'range_u',     label: 'Range (max − min)' },
  { key: 'std_u',       label: 'Std dev of ũ' },
  { key: 'atkinson',    label: 'Atkinson index on uᵢ (ε=2)' },
  { key: 'sum_nu',      label: 'Aggregate welfare Σnᵢũᵢ', fmt: v => v != null ? (v/1e9).toFixed(4)+' ×10⁹' : '—' },
];

function fmt(v, row) {
  if (v == null) return '—';
  if (row.fmt) return row.fmt(v);
  return Math.abs(v) < 1e-10 ? '0.0000' : v.toFixed(4);
}

const CustomDot = ({ cx, cy, payload, active, onHover }) => {
  const isActive = active === payload.rule;
  return (
    <g style={{ cursor: 'pointer' }} onMouseEnter={() => onHover(payload.rule)} onMouseLeave={() => onHover(null)}>
      <circle cx={cx} cy={cy} r={isActive ? 14 : 10} fill={RULE_COLORS[payload.rule]} opacity={isActive ? 1 : 0.8} stroke="white" strokeWidth={2} />
      <text x={cx} y={cy - 17} textAnchor="middle" fontSize={11} fontWeight={600} fill={RULE_COLORS[payload.rule]} fontFamily="DM Sans, sans-serif">{payload.rule}</text>
    </g>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 7, padding: '10px 13px', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ fontWeight: 700, color: RULE_COLORS[d.rule], marginBottom: 5 }}>{d.rule}</div>
      <div>Atkinson: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{Math.max(0,d.x).toFixed(4)}</span></div>
      <div>Floor ũ: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{d.y.toFixed(4)}</span></div>
    </div>
  );
};

export default function FrontierPanel({ data }) {
  const [active, setActive] = useState(null);

  const scatterData = data.metrics.map(m => ({ x: Math.max(0, m.atkinson), y: m.min_u, rule: m.rule }));

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Welfare vs. Inequality</h2>
        <p style={{ fontFamily: 'DM Sans, sans-serif' }}>Each point is one rule. Better rules are top-left (low inequality, high floor). Hover a point to highlight its column in the table.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Chart */}
        <div>
          {/* Legend on top */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 10, flexWrap: 'wrap' }}>
            {RULES.map(r => (
              <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', opacity: active && active !== r ? 0.4 : 1 }}
                onMouseEnter={() => setActive(r)} onMouseLeave={() => setActive(null)}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: RULE_COLORS[r] }} />
                {r}
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: '16px 12px 8px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 28, left: 10 }}>
                <CartesianGrid stroke="#e8e4de" />
                <XAxis type="number" dataKey="x" domain={[0, 0.135]}
                  tickFormatter={v => v.toFixed(3)}
                  tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}
                  label={{ value: 'Atkinson inequality index (ε=2)', position: 'insideBottom', offset: -14, fontSize: 11, fill: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif' }} />
                <YAxis type="number" dataKey="y" domain={[-9.5, -8.9]}
                  tickFormatter={v => v.toFixed(2)}
                  tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}
                  label={{ value: 'Worst-off state ũ', angle: -90, position: 'insideLeft', offset: 16, fontSize: 11, fill: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif' }} />
                <Tooltip content={<CustomTooltip />} />
                <Scatter data={scatterData} shape={(props) => <CustomDot {...props} active={active} onHover={setActive} />} />
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', fontFamily: 'DM Sans, sans-serif' }}>← ideal: top-left</div>
          </div>
        </div>

        {/* Metrics table */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, fontFamily: 'DM Sans, sans-serif' }}>
            Hover a rule to highlight
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4, auto)', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>Metric</div>
              {RULES.map(r => (
                <div key={r} onMouseEnter={() => setActive(r)} onMouseLeave={() => setActive(null)}
                  style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: RULE_COLORS[r], cursor: 'pointer', minWidth: 68,
                    background: active === r ? `${RULE_COLORS[r]}12` : undefined, transition: 'background 0.1s', fontFamily: 'DM Sans, sans-serif' }}>
                  {r}
                </div>
              ))}
            </div>
            {METRIC_ROWS.map((row, i) => (
              <div key={row.key} style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4, auto)', borderBottom: '1px solid var(--border)', background: i%2===0 ? 'white' : 'var(--bg)' }}>
                <div style={{ padding: '7px 12px', fontSize: 11, color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif' }}>{row.label}</div>
                {RULES.map(r => {
                  const m = data.metrics.find(m => m.rule === r);
                  return (
                    <div key={r} onMouseEnter={() => setActive(r)} onMouseLeave={() => setActive(null)}
                      style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, minWidth: 68,
                        background: active === r ? `${RULE_COLORS[r]}10` : undefined, fontWeight: active === r ? 600 : 400, transition: 'background 0.1s' }}>
                      {fmt(m?.[row.key], row)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="callout" style={{ marginTop: 10, background: 'var(--bg2)', borderRadius: 6 }}>
            Atkinson index and ũ differences are unit-invariant. Aggregate welfare (Σnᵢũᵢ) is valid only as a cross-rule comparison.
          </div>
        </div>
      </div>
    </div>
  );
}

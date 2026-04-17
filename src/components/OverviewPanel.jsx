import { RULE_COLORS } from './Sidebar';
import { Tex } from '../utils.jsx';

const RULES = ['PRO', 'wNSW', 'Atkinson', 'Leximin'];

const RULE_INFO = {
  PRO:      { full: 'Proportional',           eq: 'x_i^R = \\frac{n_i}{\\sum_j n_j} M_R',            axiom: 'Equal treatment' },
  wNSW:     { full: 'Weighted Nash SW',        eq: '\\max \\sum_i n_i \\tilde{u}_i',                  axiom: 'Aggregate welfare' },
  Atkinson: { full: 'Atkinson \\varepsilon=2', eq: '\\min \\sum_i n_i / u_i',                         axiom: 'Inequality aversion' },
  Leximin:  { full: 'Leximin',                 eq: '\\tilde{u}_i = \\tilde{u}^* \\text{ for all } i', axiom: 'Rawlsian maximin' },
};

export default function OverviewPanel({ data }) {
  const { constants } = data;

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Overview</h2>
        <p style={{ fontFamily: 'DM Sans, sans-serif' }}>
          We compare four allocation rules for distributing rice and wheat across 36 Indian states and UTs,
          using MPI-based poverty counts and HCES consumption preferences. Hover and explore any panel to see how allocations and welfare change across rules.
        </p>
        <div style={{ marginTop: 12 }}>
          <span className="hint">→ Start with the State Map or Allocations panel</span>
        </div>
      </div>

      {/* Welfare metric — once, clearly */}
      <div className="card" style={{ padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10, fontFamily: 'DM Sans, sans-serif' }}>
          Welfare metric
        </div>
        <Tex display>{`\\tilde{u}_i = a_i \\log\\!\\left(\\frac{x_i^R / n_i}{\\bar{r}}\\right) + (1 - a_i) \\log\\!\\left(\\frac{x_i^W / n_i}{\\bar{r}}\\right)`}</Tex>
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.65 }}>
          Per-capita log-Cobb-Douglas. <Tex>{'a_i'}</Tex> = rice preference share (HCES 2022–23).
          Values ≈ −9 due to unit scale; <strong>only differences across rules matter</strong>.
          The Atkinson index on <Tex>{'u_i = \\exp(\\tilde{u}_i)'}</Tex> and utility differences are unit-invariant;
          aggregate welfare <Tex>{'\\sum n_i \\tilde{u}_i'}</Tex> is valid only as a cross-rule comparison at fixed units.
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          ['States / UTs', '36'],
          ['Rice supply', `${constants.M_R.toFixed(0)} kT/yr`],
          ['Wheat supply', `${constants.M_W.toFixed(0)} kT/yr`],
          ['Poor population', `${(constants.n_total/1e7).toFixed(1)} Cr`],
        ].map(([label, value]) => (
          <div key={label} className="card" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3, fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 600 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Rule cards */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10, fontFamily: 'DM Sans, sans-serif' }}>
        The four rules
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {RULES.map(r => {
          const info = RULE_INFO[r];
          const m = data.metrics.find(m => m.rule === r);
          return (
            <div key={r} className="card" style={{ padding: '14px 16px', borderLeft: `3px solid ${RULE_COLORS[r]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: RULE_COLORS[r], fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>{r}</span>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: `${RULE_COLORS[r]}18`, color: RULE_COLORS[r], fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>
                  {info.axiom}
                </span>
              </div>
              <div style={{ background: 'var(--bg)', padding: '6px 10px', borderRadius: 4, marginBottom: 8, fontSize: 13 }}>
                <Tex>{info.eq}</Tex>
              </div>
              {m && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {[
                    ['Worst-off ũ', m.min_u?.toFixed(4)],
                    ['Atkinson idx', Math.max(0, m.atkinson).toFixed(4)],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: 'var(--bg)', borderRadius: 4, padding: '5px 8px' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 1, fontFamily: 'DM Sans, sans-serif' }}>{label}</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600 }}>{val ?? '—'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leximin theorem callout */}
      <div className="card callout" style={{ marginTop: 14, borderLeft: `3px solid ${RULE_COLORS.Leximin}` }}>
        <strong style={{ fontFamily: 'DM Sans, sans-serif' }}>Theorem (Leximin = Equal Utility):</strong> For two goods with log-Cobb-Douglas preferences,
        the unique Leximin allocation satisfies <Tex>{'\\tilde{u}_i = \\tilde{u}^*'}</Tex> for all <Tex>{'i'}</Tex>.
        Shadow price ratio <Tex>{`k^* = ${constants.k_opt}`}</Tex>, equal utility <Tex>{`\\tilde{u}^* = ${constants.u_star.toFixed(4)}`}</Tex>.
      </div>
    </div>
  );
}

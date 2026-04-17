import { useState } from 'react';
import { RULE_COLORS } from './Sidebar';
import { Tex } from '../utils.jsx';

const RULES = ['PRO', 'wNSW', 'Atkinson', 'Leximin'];

const AXIOMS = [
  {
    id: 'monotone', name: 'Monotonicity', short: 'More poor people → more grain',
    formal: '\\forall \\delta > 0 : \\frac{n_i+\\delta}{n_i+\\delta+S} > \\frac{n_i}{n_i+S}',
    explanation: 'Algebraic verification that PRO allocation is strictly increasing in n_i. S = Σⱼ≠ᵢ nⱼ. Not encoded for other rules (optimisation-based).',
    z3sketch: `s = Solver()
n_i, S, delta = Reals('n_i S delta')
s.add(n_i > 0, S > 0, delta > 0)
before = n_i / (n_i + S)
after  = (n_i + delta) / (n_i + delta + S)
s.add(Not(after > before))
s.check()  # → unsat [12.6ms]`,
    results: {
      PRO:      { status: 'proven',  result: 'UNSAT', time_ms: 12.6, note: 'Proved. Algebraic check on PRO closed form.' },
      wNSW:     { status: 'na',      result: 'N/A',   time_ms: null, note: 'Optimisation-based; not encoded.' },
      Atkinson: { status: 'na',      result: 'N/A',   time_ms: null, note: 'Optimisation-based; not encoded.' },
      Leximin:  { status: 'na',      result: 'N/A',   time_ms: null, note: 'Non-trivial due to equal-utility coupling.' },
    },
  },
  {
    id: 'scale', name: 'Scale Invariance', short: 'λ × supply → λ × allocation',
    formal: '\\text{alloc}(\\lambda M_R, \\lambda M_W) = \\lambda \\cdot \\text{alloc}(M_R, M_W)',
    explanation: 'PRO and wNSW are linear in supply by their closed forms. Z3 verifies the algebraic identity. Scale invariance of Atkinson and Leximin (defined by optimisation) is pending.',
    z3sketch: `# PRO: (n_i/N)·(λM) = λ·(n_i/N·M)
lam, M, N, ni = Reals('lam M N ni')
s.add(lam > 0, M > 0, N > 0, ni > 0, ni <= N)
s.add(Not( ni/N*(lam*M) == lam*(ni/N*M) ))
s.check()  # → unsat [0.1ms]

# wNSW: same identity on (n_i·a_i/D)·M
s.add(Not( niai/D*(lam*M) == lam*(niai/D*M) ))
s.check()  # → unsat [0.1ms]`,
    results: {
      PRO:      { status: 'proven',  result: 'UNSAT', time_ms: 0.1,  note: 'Algebraic identity on closed form.' },
      wNSW:     { status: 'proven',  result: 'UNSAT', time_ms: 0.1,  note: 'Algebraic identity on closed form.' },
      Atkinson: { status: 'pending', result: '?',     time_ms: null, note: 'Optimisation-based; requires different encoding.' },
      Leximin:  { status: 'pending', result: '?',     time_ms: null, note: 'Follows from homogeneity of ratio equation; encoding pending.' },
    },
  },
  {
    id: 'envy', name: 'Envy-Freeness', short: 'No state prefers another\'s per-capita bundle',
    formal: '\\neg\\exists\\, i,j : u_i\\!\\left(\\tfrac{x_j^R}{n_j}, \\tfrac{x_j^W}{n_j}\\right) > u_i\\!\\left(\\tfrac{x_i^R}{n_i}, \\tfrac{x_i^W}{n_i}\\right)',
    explanation: 'PRO: all per-capita bundles identical → reflexivity → UNSAT. Witnesses for other rules use polynomial encoding: rational aᵢ = p/q, raise to q-th power. Numerical counts: 0 (PRO), 2 (wNSW), 245 (Atkinson), 416 (Leximin) envy pairs.',
    z3sketch: `# PRO — reflexivity (UNSAT, 0.1ms)
s.add(Not( a*r+(1-a)*w == a*r+(1-a)*w ))

# wNSW witness: Odisha (a≈73/80, err=0.0010) envies CG
# 3095^73 * 131^7 > 3090^73 * 133^7  [5.1ms]

# Atkinson witness: Kerala (a≈7/8, err=0.0008) envies Jharkhand
# 2316^7 * 439 > 2406^7 * 138  [0.1ms]

# Leximin witness: A&N (a≈13/16, err=0.0002) envies Bihar
# 2147^13 * 698^3 > 2010^13 * 167^3  [0.2ms]
# (all per-capita values ×10 for integer arithmetic)`,
    results: {
      PRO:      { status: 'proven',  result: 'UNSAT', time_ms: 0.1,  note: 'Envy-free. Identical per-capita bundles → reflexivity. u_i(r,w) > u_i(r,w) is unsatisfiable.' },
      wNSW:     { status: 'refuted', result: 'SAT',   time_ms: 5.1,  note: 'Witness: Odisha (aᵢ=0.9135 ≈ 73/80, err=0.0010) envies Chhattisgarh. Chhattisgarh gets 309.5R+13.1W kg/p/yr; Odisha gets 309.0R+13.3W. Under Odisha\'s rice-heavy preferences the small rice gain outweighs the wheat loss.' },
      Atkinson: { status: 'refuted', result: 'SAT',   time_ms: 0.1,  note: 'Witness: Kerala (aᵢ=0.8758 ≈ 7/8, err=0.0008) envies Jharkhand. Kerala gets 240.6R+13.8W; Jharkhand gets 231.6R+43.9W kg/p/yr. Under Kerala\'s preferences the extra wheat yields higher utility.' },
      Leximin:  { status: 'refuted', result: 'SAT',   time_ms: 0.2,  note: 'Witness: A&N Islands (aᵢ=0.8123 ≈ 13/16, err=0.0002) envies Bihar. Both have equal ũᵢ = −8.9788, but Bihar gets 214.7R vs A&N\'s 201.0R kg/p/yr.' },
    },
  },
  {
    id: 'floor', name: 'wNSW Floor', short: 'ũ_wNSW(a) strictly convex; minimum at a* = 0.3131',
    formal: '\\frac{d^2\\tilde{u}}{da^2} = \\frac{1}{a} + \\frac{1}{1-a} > 0 \\quad \\text{and} \\quad a^* = \\frac{C_W}{C_R + C_W}',
    explanation: 'C_R and C_W are system-level constants independent of individual aᵢ. Z3 proves d²ũ/da² > 0 for all a ∈ (0,1) (convexity), and separately that the FOC a*·C_R = (1−a*)·C_W uniquely gives a* = C_W/(C_R+C_W) = 0.3131. States near this value (Gujarat 0.329, D&NH 0.329, MP 0.276) are structurally worst-off.',
    z3sketch: `# Convexity: 1/a + 1/(1-a) > 0 for all a ∈ (0,1)
a = Real('a')
s.add(a > 0, a < 1)
s.add(Not(1/a + 1/(1-a) > 0))
s.check()  # → unsat [6.8ms]

# a* formula: FOC ∧ ¬(a* = C_W/(C_R+C_W)) is unsat
a_star, C_R, C_W = Reals('a_star C_R C_W')
s.add(C_R > 0, C_W > 0, a_star > 0, a_star < 1)
s.add(a_star * C_R == (1 - a_star) * C_W)
s.add(Not(a_star == C_W / (C_R + C_W)))
s.check()  # → unsat [5.9ms]`,
    results: {
      PRO:      { status: 'na',      result: 'N/A',   time_ms: null, note: 'Not applicable to PRO.' },
      wNSW:     { status: 'proven',  result: 'UNSAT', time_ms: 6.8,  note: 'Convexity proved (6.8ms). a* formula proved separately (5.9ms). With computed C_R and C_W, gives a* = 0.3131.' },
      Atkinson: { status: 'na',      result: 'N/A',   time_ms: null, note: 'Not applicable.' },
      Leximin:  { status: 'na',      result: 'N/A',   time_ms: null, note: 'Not applicable — Leximin equalises all utilities.' },
    },
  },
];

const STATUS_CFG = {
  pending: { label: 'Pending', bg: '#f0ece4', color: '#8a8480', dot: '#c4bdb2', border: '#d4cec4' },
  proven:  { label: 'UNSAT ✓', bg: '#e8f3ec', color: '#1a5c32', dot: '#2a6b42', border: '#a8d4b4' },
  refuted: { label: 'SAT ✗',   bg: '#fae8e6', color: '#8c1a10', dot: '#c1303a', border: '#f0a8a0' },
  na:      { label: 'N/A',     bg: '#ece8e0', color: '#968f86', dot: '#b4ada4', border: '#d4cec4' },
};

export default function AxiomPanel() {
  const [selAxiomId, setSelAxiomId] = useState('envy');
  const [selRule, setSelRule] = useState('wNSW');

  const selAxiom  = AXIOMS.find(a => a.id === selAxiomId);
  const selResult = selAxiom ? selAxiom.results[selRule] : null;
  const stCfg     = selResult ? STATUS_CFG[selResult.status] : null;

  return (
    <div className="panel" style={{ maxWidth: '100%' }}>
      <div className="panel-header">
        <h2>
          Axiom Verification{' '}
          <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif' }}>
            via Z3 SMT v4.16.0
          </span>
        </h2>
        <div style={{ marginTop: 8 }}>
          <span className="hint">← Click any row or cell to inspect</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 24, alignItems: 'start' }}>

        {/* Grid */}
        <div>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4,100px)', marginBottom: 6, paddingLeft: 2 }}>
            <div />
            {RULES.map(r => (
              <div key={r} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: RULE_COLORS[r], fontFamily: 'DM Sans, sans-serif' }}>{r}</div>
            ))}
          </div>

          {/* Axiom rows */}
          {AXIOMS.map(axiom => (
            <div key={axiom.id}
              style={{
                display: 'grid', gridTemplateColumns: '1fr repeat(4,100px)',
                marginBottom: 8, borderRadius: 8, overflow: 'hidden',
                border: selAxiomId === axiom.id ? '2px solid #363636' : '1px solid var(--border)',
                background: selAxiomId === axiom.id ? '#faf9f7' : 'white',
                cursor: 'pointer', transition: 'all 0.13s',
              }}
              onClick={() => setSelAxiomId(axiom.id)}
            >
              <div style={{ padding: '12px 14px', borderRight: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2, fontFamily: 'DM Sans, sans-serif' }}>
                  {axiom.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', marginBottom: 6 }}>
                  {axiom.short}
                </div>
                <div style={{ fontSize: 12 }}>
                  <Tex>{axiom.formal}</Tex>
                </div>
              </div>

              {RULES.map(r => {
                const res = axiom.results[r];
                const st  = STATUS_CFG[res.status];
                const isSel = selAxiomId === axiom.id && selRule === r;
                return (
                  <div key={r}
                    onClick={e => { e.stopPropagation(); setSelAxiomId(axiom.id); setSelRule(r); }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: '10px 6px', gap: 4,
                      background: isSel ? `${RULE_COLORS[r]}18` : st.bg,
                      borderLeft: '1px solid var(--border)',
                      borderTop: isSel ? `3px solid ${RULE_COLORS[r]}` : '3px solid transparent',
                      cursor: 'pointer', transition: 'all 0.12s',
                    }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: isSel ? RULE_COLORS[r] : st.color, textAlign: 'center', fontFamily: 'DM Sans, sans-serif' }}>
                      {st.label}
                    </span>
                    {res.time_ms !== null && (
                      <span style={{ fontSize: 9, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {res.time_ms}ms
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11, color: 'var(--text-3)', flexWrap: 'wrap', fontFamily: 'DM Sans, sans-serif' }}>
            {Object.entries(STATUS_CFG).map(([k, v]) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: v.dot }} />
                {v.label}
              </span>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div style={{ position: 'sticky', top: 24 }}>
          {selAxiom && selResult && stCfg ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Header */}
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', borderTop: `4px solid ${RULE_COLORS[selRule]}` }}>
                <div style={{ padding: '12px 14px', background: `${RULE_COLORS[selRule]}10` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: RULE_COLORS[selRule], marginBottom: 4, fontFamily: 'DM Sans, sans-serif' }}>
                    {selRule} — {selAxiom.name}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    <Tex>{selAxiom.formal}</Tex>
                  </div>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7, fontFamily: 'DM Sans, sans-serif' }}>
                    {selAxiom.explanation}
                  </p>
                </div>
              </div>

              {/* Z3 encoding — always shown */}
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ padding: '8px 12px', background: '#363636', color: 'rgba(244,244,244,0.45)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif' }}>
                  Z3 encoding
                </div>
                <pre style={{ padding: '12px 14px', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', background: '#1e1c18', color: '#d4cec4', margin: 0, overflow: 'auto', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {selAxiom.z3sketch}
                </pre>
              </div>

              {/* Result badge */}
              <div style={{ padding: '11px 14px', borderRadius: 8, background: stCfg.bg, border: `1px solid ${stCfg.border}`, borderLeft: `4px solid ${RULE_COLORS[selRule]}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: stCfg.dot }} />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: stCfg.color, fontFamily: 'DM Sans, sans-serif' }}>
                    {selResult.result}{selResult.time_ms !== null ? ` · ${selResult.time_ms}ms` : ''}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, fontFamily: 'DM Sans, sans-serif' }}>
                  {selResult.note}
                </p>
              </div>

            </div>
          ) : (
            <div className="card" style={{ padding: '36px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.25 }}>⊢</div>
              <div className="hint" style={{ marginBottom: 8 }}>Click any row or cell</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif' }}>
                to see the formal definition and Z3 result
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

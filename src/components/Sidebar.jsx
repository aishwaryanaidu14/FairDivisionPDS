export const RULE_COLORS = {
  PRO:      '#5a6475',
  wNSW:     '#c1303a',
  Atkinson: '#2a6b42',
  Leximin:  '#3d5080',
};

const RULE_DESC = {
  PRO:      'Equal per-capita for all',
  wNSW:     'Maximises aggregate welfare',
  Atkinson: 'Minimises inequality (ε=2)',
  Leximin:  'Maximises worst-off state',
};

const VIEWS = [
  { id: 'overview',    icon: '⊞', label: 'Overview',             sub: 'Rules & model summary' },
  { id: 'map',         icon: '◉', label: 'State Map',            sub: 'Choropleth by rule' },
  { id: 'allocations', icon: '≣', label: 'Allocations',          sub: 'Per-state rice & wheat' },
  { id: 'frontier',    icon: '◎', label: 'Welfare vs Inequality', sub: 'Trade-off frontier' },
  { id: 'compare',     icon: '⇄', label: 'Compare States',       sub: 'Head-to-head any two' },
  { id: 'axioms',      icon: '⊢', label: 'Axiom Verification',   sub: 'Z3 SMT results' },
];

export default function Sidebar({ active, onSelect, hasPdf }) {
  return (
    <aside className="sidebar">
      {/* Title block — prominent */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{
          fontFamily: 'Spectral, Georgia, serif',
          fontSize: 16, fontWeight: 600,
          color: '#ffffff',
          lineHeight: 1.35,
          marginBottom: 10,
          letterSpacing: '-0.01em',
        }}>
          Fair Division in India's Public Distribution System
        </div>
        <div style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 11.5, color: 'rgba(255,255,255,0.5)',
          lineHeight: 1.5, marginBottom: 12,
        }}>
          Four grain allocation rules · 36 states & UTs · computational social choice
        </div>
        {/* Author — prominent */}
        <div style={{
          display: 'inline-block',
          fontFamily: 'Spectral, Georgia, serif',
          fontSize: 13, fontWeight: 500,
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.82)',
          borderTop: '1px solid rgba(255,255,255,0.15)',
          paddingTop: 10,
          width: '100%',
        }}>
          Aishwarya Naidu
        </div>

        {/* PDF download button — prominent */}
        {hasPdf && (
          <a
            href="./FairDivisionPDS-AishwaryaNaidu.pdf"
            download="./FairDivisionPDS-AishwaryaNaidu.pdf"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginTop: 14, padding: '9px 14px',
              background: 'var(--accent)',
              color: '#ffffff',
              borderRadius: 6,
              fontSize: 12, fontWeight: 600,
              fontFamily: 'DM Sans, sans-serif',
              textDecoration: 'none',
              letterSpacing: '0.01em',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <span style={{ fontSize: 14 }}>↓</span>
            Download Paper (PDF)
          </a>
        )}
      </div>

      <div className="nav-section-label">Views</div>
      <nav style={{ padding: '0 0 8px' }}>
        {VIEWS.map(v => (
          <button key={v.id} className={`nav-item ${active === v.id ? 'active' : ''}`} onClick={() => onSelect(v.id)}>
            <div className="nav-item-inner">
              <span className="nav-icon">{v.icon}</span>
              <span className="nav-label">
                {v.label}
                <span className="nav-label-sub">{v.sub}</span>
              </span>
            </div>
          </button>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '16px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(244,244,244,0.28)', marginBottom: 10, fontFamily: 'DM Sans, sans-serif' }}>
          Rules
        </div>
        {['PRO','wNSW','Atkinson','Leximin'].map(r => (
          <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: RULE_COLORS[r], flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'rgba(244,244,244,0.72)', fontFamily: 'DM Sans, sans-serif' }}>
              <strong style={{ fontWeight: 600 }}>{r}</strong>
              <span style={{ color: 'rgba(244,244,244,0.35)', marginLeft: 5, fontSize: 10 }}>{RULE_DESC[r]}</span>
            </span>
          </div>
        ))}
        <div style={{ marginTop: 12, fontSize: 10, color: 'rgba(244,244,244,0.22)', lineHeight: 1.5, fontFamily: 'DM Sans, sans-serif' }}>
          MPI 2021 · HCES 2022–23 · FCI Apr 2025
        </div>
      </div>
    </aside>
  );
}

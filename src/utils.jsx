import katex from 'katex';

export const RULE_COLORS = {
  PRO:      '#5a6475',
  wNSW:     '#c1303a',
  Atkinson: '#2a6b42',
  Leximin:  '#3d5080',
};

export const RULES = ['PRO', 'wNSW', 'Atkinson', 'Leximin'];

export const RULE_LABELS = {
  PRO:      'Proportional',
  wNSW:     'Weighted Nash',
  Atkinson: 'Atkinson ε=2',
  Leximin:  'Leximin',
};

export const RICE_COLOR  = '#a85c1a';
export const WHEAT_COLOR = '#2a6175';

// Render KaTeX inline
export function tex(str, display = false) {
  try {
    return katex.renderToString(str, { throwOnError: false, displayMode: display });
  } catch {
    return str;
  }
}

// KaTeX React component
export function Tex({ children, display = false }) {
  return (
    <span
      dangerouslySetInnerHTML={{ __html: tex(children, display) }}
      style={display ? { display: 'block', textAlign: 'center', margin: '8px 0' } : undefined}
    />
  );
}

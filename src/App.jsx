import { useState } from 'react';
import './index.css';
import data from './data/allocations.json';
import Sidebar from './components/Sidebar';
import OverviewPanel from './components/OverviewPanel';
import MapPanel from './components/MapPanel';
import AllocationsPanel from './components/AllocationsPanel';
import FrontierPanel from './components/FrontierPanel';
import ComparePanel from './components/ComparePanel';
import AxiomPanel from './components/AxiomPanel';

const PANELS = {
  overview: OverviewPanel, map: MapPanel, allocations: AllocationsPanel,
  frontier: FrontierPanel, compare: ComparePanel, axioms: AxiomPanel,
};

// Will be true once PDF is placed in /public/
const HAS_PDF = true;

export default function App() {
  const [active, setActive] = useState('overview');
  const Panel = PANELS[active] || OverviewPanel;
  return (
    <div className="app-layout">
      <Sidebar active={active} onSelect={setActive} hasPdf={HAS_PDF} />
      <main className="main-content"><Panel data={data} /></main>
    </div>
  );
}

import { } from 'react';
import SKUWizard from './components/tools/sku-wizard/SKUWizard';
import './App.scss';
import './anemia/typography.scss';

function App() {
  return (
    <>
    <div className="default-layout"> 
      <div className="layout-body">
        <div className="layout-content"><SKUWizard/></div>
      </div>
      </div>
    </>
  );
}

export default App;

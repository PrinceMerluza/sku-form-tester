import {} from 'react';
import SKUFormRoot from './components/tools/sku-wizard/SKUFormRoot';
import './App.scss';
import './anemia/typography.scss';

function App() {
	return (
		<>
			<div className="default-layout">
				<div className="layout-body">
					<div className="layout-content">
						<SKUFormRoot />
					</div>
				</div>
			</div>
		</>
	);
}

export default App;

import { GenesysDevIcon, GenesysDevIcons } from 'genesys-dev-icons';

// Embeddable components
import AlertBlock from '../components/markdown/alertblock/AlertBlock';
import SKUWizard from '../components/tools/sku-wizard/SKUWizard';

const renderers = {
	alertBlock: (props: any) => {
		return <AlertBlock {...props} />;
	},
	dxUiComponent: (props: any) => {
		switch (props.component.toLowerCase()) {
			case 'skuwizard': {
				return <SKUWizard />;
			}
			default: {
				return <i>Failed to load component: {props.component}</i>;
			}
		}
	},
	paragraph: (props: any) => {
		let className = props.indentation > 0 ? ` indent-${props.indentation}` : '';
		return <p className={className}>{props.children}</p>;
	},
};

export default renderers;

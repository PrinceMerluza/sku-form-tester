import React, { useState, useEffect } from 'react';
import { DxButton, DxTextbox, DxItemGroup, DxItemGroupItem } from 'genesys-react-components';
import Validator from '../utils/validation/Validator';
import ValidationFieldContainer from '../utils/validation/ValidationFieldContainer';
import SKUForm from './SKUForm';
import { PremiumAppSKUs, SKU } from './types';

import './SKUWizard.scss';

const currencyList: DxItemGroupItem[] = [
	{ label: 'AUD - Australian Dollar', value: 'AUD' },
	{ label: 'BRL - Brazilian Real', value: 'BRL' },
	{ label: 'CAD - Canadian Dollar', value: 'CAD' },
	{ label: 'EUR - Euro', value: 'EUR' },
	{ label: 'GBP - British Pound', value: 'GBP' },
	{ label: 'JPY - Japanese Yen', value: 'JPY' },
	{ label: 'NZD - New Zealand Dollar', value: 'NZD' },
	{ label: 'USD - US Dollar', value: 'USD', isSelected: true },
	{ label: 'ZAR - South African Rand', value: 'ZAR' },
];

const fxRate: { [key: string]: number } = {
	USD: 1.0,
	CAD: 1.273,
	GBP: 0.7496,
	EUR: 0.88,
	ZAR: 16.672,
	AUD: 1.3855,
	NZD: 1.458,
	JPY: 115.012,
	BRL: 5.6049,
};

export default function SKUWizard() {
	const [SKUs, setSKUs] = useState<SKU[]>([]);
	const [newSKUName, setNewSKUName] = useState<string>('');
	const [newSKUDescription, setNewSKUDescription] = useState<string>('');
	const [subNotificationEmail, setSubNotificationEmail] = useState<string>();
	const [salesLeadEmail, setSalesLeadEmail] = useState<string>();
	const [productTOS, setProductTOS] = useState<string>();
	const [quoteNotes, setQuoteNotes] = useState<string>();
	const [currency, setCurrency] = useState<string>('USD');
	const [errors, setErrors] = useState<{ [key: string]: Array<string> }>({});

	// Vadidation
	useEffect(() => {
		const newErrors: { [key: string]: Array<string> } = {};
		const validator: Validator = new Validator(newErrors);

		validator.validateEmail('subNotificationEmail', subNotificationEmail, false);
		validator.validateEmail('salesLeadEmail', salesLeadEmail, false);
		validator.validateURL('productTOS', productTOS, false);

		setErrors(newErrors);
	}, [subNotificationEmail, salesLeadEmail, productTOS, quoteNotes, currency]);

	const SKUList = SKUs.map((sku) => {
		return <SKUForm key={sku.id} skuId={sku.id} onDelete={() => deleteSKU(sku.id)} productName={sku.name} description={sku.description} />;
	});

	const deleteSKU = (id: string) => {
		setSKUs((SKUs) => {
			let newSKUs = SKUs.filter((e) => id.localeCompare(e.id) !== 0);
			return newSKUs;
		});
	};

	const addSKU = (name: string = '', description: string = '') => {
		setSKUs((SKUs) => {
			let lastId: string = '0';
			if (SKUs.length > 0) {
				lastId = SKUs[SKUs.length - 1].id;
			}

			let newId: string = String(parseInt(lastId) + 1);
			let newSKU = {
				id: newId,
				name: name,
				description: description,
			};
			return [...SKUs, newSKU];
		});

		// Reset inputs
		setNewSKUName('');
		setNewSKUDescription('');
	};

	const getWizard = () => {
		return (
			<div>
				<div className="required-container">
					<h2>Required Information</h2>
					<ValidationFieldContainer errors={errors} name="subNotificationEmail">
						<DxTextbox
							inputType="text"
							label="Subscription Notification Email"
							placeholder="email@domain.com"
							clearButton={true}
							value={subNotificationEmail}
							onChange={(newValue) => setSubNotificationEmail(newValue)}
							changeDebounceMs={100}
						/>
					</ValidationFieldContainer>
					<ValidationFieldContainer errors={errors} name="salesLeadEmail">
						<DxTextbox
							inputType="text"
							label="Sales Lead Email"
							placeholder="sales@domain.com"
							clearButton={true}
							value={salesLeadEmail}
							onChange={(newValue) => setSalesLeadEmail(newValue)}
							changeDebounceMs={100}
						/>
					</ValidationFieldContainer>
					<ValidationFieldContainer errors={errors} name="productTOS">
						<DxTextbox
							inputType="text"
							label="Link to Product Terms and Conditions"
							placeholder="https://www.company.com/tos"
							clearButton={true}
							value={productTOS}
							onChange={(newValue) => setProductTOS(newValue)}
							changeDebounceMs={100}
						/>
					</ValidationFieldContainer>
					<ValidationFieldContainer errors={errors} name="quoteNotes">
						<DxTextbox
							inputType="textarea"
							label="How to Quote the Product"
							placeholder="Details..."
							clearButton={true}
							value={quoteNotes}
							onChange={(newValue) => setQuoteNotes(newValue)}
							changeDebounceMs={100}
						/>
					</ValidationFieldContainer>
				</div>
				<h2>SKUs</h2>
				<DxItemGroup
					title="Currency"
					items={currencyList}
					format="dropdown"
					onItemChanged={(item, isSelected) => {
						if (isSelected) setCurrency(item.value);
					}}
				/>
				<div>{`FxRate: ${currency}/USD = ${fxRate[currency]}`}</div>
				<div className="sku-list">{SKUList}</div>
				<div className="new-sku-container">
					<DxTextbox
						inputType="text"
						label="Product Name"
						placeholder="My Product"
						clearButton={true}
						value={newSKUName}
						onChange={(newValue) => setNewSKUName(newValue)}
						changeDebounceMs={100}
						description="The name of the product"
					/>
					<DxTextbox
						inputType="text"
						label="Product Description"
						placeholder="Product description"
						clearButton={true}
						value={newSKUDescription}
						onChange={(newValue) => setNewSKUDescription(newValue)}
						changeDebounceMs={100}
						description="Partner provided marketing description that appears in SFDC quote tool and on customer service order"
					/>
					<DxButton
						type="primary"
						onClick={async () => {
							// DxTextBox debounces input so wait a bit to make sure name and description are set
							await new Promise((resolve) => setTimeout(resolve, 1000));
							addSKU(newSKUName, newSKUDescription);
						}}
						disabled={newSKUName.length <= 0 || newSKUDescription.length <= 0}
					>
						Add SKU
					</DxButton>
				</div>
				<hr />
				<div className="submission-container">
					<DxButton type="primary">Export SKUs Data</DxButton>
				</div>
			</div>
		);
	};

	return <div>{getWizard()}</div>;
}

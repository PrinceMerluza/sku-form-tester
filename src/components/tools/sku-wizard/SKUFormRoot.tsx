import React, { useState, useEffect, useRef } from 'react';
import { DxButton, DxTextbox, DxItemGroup, DxItemGroupItem, DxTabbedContent, DxTabPanel } from 'genesys-react-components';
import { UsageProduct, MeteredProduct, FlatFeeProduct, EmptyProduct, SKUFormData, BillingType, UnitOfMeasure } from './types';
import SKUForm from './SKUForm';
import ValidationFieldContainer from '../utils/validation/ValidationFieldContainer';
import Validator from '../utils/validation/Validator';
import { exportData } from './SKUExporter';
import JSZip from 'jszip';
import SKUImporter from './SKUImporter';

import './SKUFormRoot.scss';

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

export default function SKUFormRoot() {
	// products contain both base and add-ons
	const [products, setProducts] = useState<(UsageProduct | MeteredProduct | FlatFeeProduct | EmptyProduct)[]>([]);
	const [formsSavedStatus, setFormsSavedStatus] = useState<{ [key: string]: boolean }>({}); // Tracks if SKU forms are saved
	const [addProductEnabled, setAddProductEnabled] = useState<boolean>(true);
	const [currency, setCurrency] = useState<string>('USD');

	// Contact Information page state
	const [subNotificationEmail, setSubNotificationEmail] = useState<string>('');
	const [salesLeadEmail, setSalesLeadEmail] = useState<string>('');
	const [productTOS, setProductTOS] = useState<string>('');
	const [quoteNotes, setQuoteNotes] = useState<string>('');
	const [onContactsPage, setOnContactsPage] = useState<boolean>(false);
	const [errors, setErrors] = useState<{ [key: string]: Array<string> }>({});

	// Tabbing beahvior
	const [baseProductsVisible, setBaseProductsVisible] = useState<boolean>(true);
	const [addonsVisible, setAddonsVisible] = useState<boolean>(false);

	const fileUploadRef = useRef<HTMLInputElement>(null);

	// Validation
	useEffect(() => {
		const newErrors: { [key: string]: Array<string> } = {};
		const validator: Validator = new Validator(newErrors);

		validator.validateEmail('subNotificationEmail', subNotificationEmail, false);
		validator.validateEmail('salesLeadEmail', salesLeadEmail, false);
		validator.validateURL('productTOS', productTOS, false);

		setErrors(newErrors);
	}, [subNotificationEmail, salesLeadEmail, productTOS, quoteNotes, currency]);

	// Make sure there's at least 1 wizard open in the root
	useEffect(() => {
		if (products.length === 0) {
			setProducts(() => {
				return [
					{
						id: '1',
					},
				];
			});
		}
	}, [products]);

	const setFormStatus = (id: string, val: boolean) => {
		setFormsSavedStatus((oldStatus) => {
			const tmpObj = Object.assign({}, oldStatus);
			tmpObj[id] = val;

			return tmpObj;
		});
	};

	// get the SKUform element for the Product
	const getProductForm = (product: UsageProduct | MeteredProduct | FlatFeeProduct | EmptyProduct) => {
		// Make sure that all sku  forms have an entry in the formSavedStatus
		if (formsSavedStatus[product.id] === undefined) {
			setFormStatus(product.id, false);
		}

		return (
			<SKUForm
				key={product.id}
				skuId={product.id}
				isAddOn={product.isAddOn}
				onDelete={() => {
					deleteSKU(product.id);

					// delete the savestatus entry as well
					setFormsSavedStatus((oldStatus) => {
						const tmpObj = Object.assign({}, oldStatus);
						delete tmpObj[product.id];

						return tmpObj;
					});
				}}
				// On saving, replace the old product object (id basis) with the new one
				// from the component.
				onSave={(newProduct) => {
					if (!newProduct) return;
					setProducts((oldProducts) => {
						return oldProducts.map((prod) => {
							if (prod.id == newProduct.id) return newProduct;
							return prod;
						});
					});

					setFormStatus(product.id, true);
				}}
				onEdit={() => {
					setFormStatus(product.id, false);
				}}
				allProducts={products}
			/>
		);
	};

	// Contains the SKUform for each base product
	const baseProductsList = products
		.filter((product) => !product.isAddOn)
		.map((product) => {
			return getProductForm(product);
		});

	// Contains the SKUform for each add-on
	const addonsList = products
		.filter((product) => product.isAddOn)
		.map((product) => {
			return getProductForm(product);
		});

	const deleteSKU = (id: string) => {
		setProducts((oldProducts) => {
			return oldProducts.filter((e) => id.localeCompare(e.id) !== 0);
		});
	};

	const addSKU = (isAddOn: boolean = false) => {
		setProducts((oldProducts) => {
			let lastId: string = '0';
			if (oldProducts.length > 0) {
				lastId = oldProducts[oldProducts.length - 1].id;
			}

			const newId: string = String(parseInt(lastId) + 1);
			const newProduct = {
				id: newId,
				isAddOn: isAddOn,
			};
			return [...oldProducts, newProduct];
		});
	};

	const getContactsForm = () => {
		return (
			<div className="required-container">
				<div>
					<h2>Contact Information</h2>
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
				<div>
					<DxButton
						type="primary"
						onClick={() => {
							setOnContactsPage(false);
						}}
					>
						Back
					</DxButton>
					<DxButton
						type="primary"
						onClick={() => {
							const formData: SKUFormData = {
								details: {
									subNotificationEmail: subNotificationEmail,
									salesLeadEmail: salesLeadEmail,
									productTOS: productTOS,
									quoteNotes: quoteNotes,
									currency: currency,
								},
								products: products,
							};

							exportData(formData);
						}}
					>
						Export Data
					</DxButton>
				</div>
			</div>
		);
	};

	const handleImportSku = (event: React.ChangeEvent) => {
		const target = event.target as HTMLInputElement;
		if (!target.files) return;

		const fileObj = target.files[0];
		if (!fileObj) return;

		JSZip.loadAsync(fileObj)
			.then((zip) => {
				const importer = new SKUImporter(zip);
				return importer.getProducts();
			})
			.then((data) => {
				setProducts(data);
			});
	};

	return (
		<div className="sku-form-root">
			{/* Tabs. */}
			<div className={`tab-container ${onContactsPage ? 'hidden' : ''}`}>
				<div
					className={`tab ${baseProductsVisible ? 'active' : ''}`}
					onClick={() => {
						setBaseProductsVisible(true);
						setAddonsVisible(false);
					}}
				>
					Base Products
				</div>
				<div
					className={`tab ${addonsVisible ? 'active' : ''}`}
					onClick={() => {
						setBaseProductsVisible(false);
						setAddonsVisible(true);
					}}
				>
					Add-ons
				</div>
			</div>

			{/* Base products Page */}
			<div className={`base-products-container ${baseProductsVisible ? '' : 'hidden'}`}>
				<div className={`editing-page ${onContactsPage ? 'hidden' : ''}`}>
					{/* <div>
					<DxItemGroup
						title="Currency"
						items={currencyList}
						format="dropdown"
						onItemChanged={(item, isSelected) => {
							if (isSelected) setCurrency(item.value);
						}}
					/>
					<div>{`FxRate: ${currency}/USD = ${fxRate[currency]}`}</div>
				</div> */}
					<div className="import-sku-container">
						<input className="input-uploader" ref={fileUploadRef} type="file" accept=".zip" onChange={handleImportSku} />

						<DxButton
							type="primary"
							onClick={() => {
								if (!fileUploadRef || !fileUploadRef.current) return;

								fileUploadRef.current.click();
							}}
						>
							Import SKUs
						</DxButton>
					</div>
					<SKUForm
						onSave={() => {
							console.log('a');
						}}
						onDelete={() => {
							console.log('a');
						}}
						onEdit={() => {
							console.log('a');
						}}
						allProducts={[]}
						skuId="1"
						isAddOn={false}
						prefill={{
							id: '1',
							name: 'test metered name',
							description: 'test metered description',
							type: BillingType.METERED_SUM,
							billing: {
								annualPrepay: 0,
								annualMonthToMonth: 0,
								monthToMonth: 0.5,
								unitOfMeasure: UnitOfMeasure.REQUEST,
								minMonthlyCommit: 1000,
							},
							notes: 'metered notes',
						}}
					/>
					<SKUForm
						onSave={() => {
							console.log('a');
						}}
						onDelete={() => {
							console.log('a');
						}}
						onEdit={() => {
							console.log('a');
						}}
						allProducts={[]}
						skuId="1"
						isAddOn={false}
						prefill={{
							id: '1',
							name: 'test name',
							description: 'test description',
							type: BillingType.USAGE_TYPE,
							namedBilling: { annualPrepay: 100, annualMonthToMonth: 101, monthToMonth: 103 },
							concurrentBilling: { annualPrepay: 200, annualMonthToMonth: 201, minMonthlyCommit: 204 },
							startupFee: {
								name: 'startup fee',
								description: 'startup fee desc',
								oneTimeFee: 99,
								required: false,
							},
							notes: 'notes',
						}}
					/>
					<div>{baseProductsList}</div>
					<div className={`add-product ${addProductEnabled ? '' : 'hidden'}`}>
						<DxButton
							type="primary"
							onClick={() => {
								addSKU();
							}}
						>
							Add a Base Product
						</DxButton>
						<DxButton
							type="primary"
							onClick={() => {
								setOnContactsPage(true);
							}}
							disabled={
								(() => {
									let allSaved = true;
									products
										.filter((prod) => formsSavedStatus[prod.id] !== undefined)
										.forEach((prod) => {
											if (!formsSavedStatus[prod.id]) allSaved = false;
										});
									return !allSaved;
								})() || products.length === 0
							}
						>
							Finalize SKUs
						</DxButton>
					</div>
				</div>
			</div>

			{/* Add-ons Page */}
			<div className={`addons-container ${addonsVisible ? '' : 'hidden'}`}>
				<div className="temp-info-box">
					<p>
						<strong>Please Read</strong>
					</p>
					<p>Simple products may not need any add-ons.</p>
					<p>
						Add-ons provide a way to add billable items that can be attached to your base products. They can be either{' '}
						<strong>required</strong> or <strong>optional</strong>. A base product can have none or multiple add-ons and add-ons can be
						added to multiple base products.
					</p>
					<p>Some use cases include:</p>
					<ul>
						<li>Billing a required license along with the product.</li>
						<li>Adding optional features to the base product for additional billing.</li>
						<li>Adding a feature that's billed differently than the base product. (Meter-billed feature for a usage-based product)</li>
					</ul>
				</div>
				<div>{addonsList}</div>
				<div>
					<DxButton
						type="primary"
						onClick={() => {
							addSKU(true);
						}}
					>
						Declare New Add-On
					</DxButton>
				</div>
			</div>

			{/* Contacts Page */}
			<div className={`contacts-page ${onContactsPage ? '' : 'hidden'}`}>{getContactsForm()}</div>
		</div>
	);
}

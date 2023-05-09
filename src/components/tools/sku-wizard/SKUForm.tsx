import React, { useState, useEffect } from 'react';
import { DxButton, DxItemGroupItem, DxTextbox, DxItemGroup, DxCheckbox } from 'genesys-react-components';
import { BillingType, UsageProduct, MeteredProduct, FlatFeeProduct, OneTimeProduct, BillingData, EmptyProduct } from './types';
import Validator from '../utils/validation/Validator';
import ValidationFieldContainer from '../utils/validation/ValidationFieldContainer';
import SKUWizard from './SKUWizard';
import UsageForm from './billing-forms/UsageForm';
import SKUFormPreview from './SKUFormPreview';

import './SKUForm.scss';

interface IProps {
	onSave: (product: UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct | null | undefined) => void;
	onDelete: () => void;
	allProducts: (UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct | EmptyProduct)[];
	skuId: string;
	productName?: string;
	description?: string;
}

export default function SKUForm(props: IProps) {
	const skuId = props.skuId;
	const onDelete = props.onDelete;
	const onSave = props.onSave;
	const allProducts = props.allProducts;

	// Product propertues
	const [productName, setProductName] = useState<string>(props.productName || '');
	const [productDescription, setProductDescription] = useState<string>(props.description || '');
	const [billingType, setBillingType] = useState<BillingType>();
	const [billingData, setBillingData] = useState<BillingData[]>([]);
	const [requiredDeps, setRequiredDeps] = useState<(UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct | EmptyProduct)[]>([]);
	const [optionalDeps, setOptionalDeps] = useState<(UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct | EmptyProduct)[]>([]);

	// UI related
	const [formCollapsed, setFormCollapsed] = useState<boolean>(false);
	const [lockedIn, setLockedIn] = useState<boolean>(false);
	const [wizardVisible, setWizardVisible] = useState<boolean>(true);
	const [formHasErrors, setFormHasErrors] = useState<boolean>(false); // inner form for billing data
	const [errors, setErrors] = useState<{ [key: string]: Array<string> }>({});

	const productsItemGroup: DxItemGroupItem[] = allProducts
		.filter((product) => 'name' in product)
		.map((product) => {
			return { label: product.name, value: product.id };
		});

	const saveSKU = () => {
		setLockedIn(true);
		onSave(buildProduct());
	};

	const toggleCollapse = () => {
		setFormCollapsed((formCollapsed) => !formCollapsed);
	};

	const buildProduct: () => UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct | null | undefined = () => {
		switch (billingType) {
			case BillingType.USAGE_TYPE: {
				if (billingData.length != 2) return;

				const tmpBilling: UsageProduct = {
					id: skuId,
					name: productName,
					description: productDescription,
					type: BillingType.USAGE_TYPE,
					namedBilling: billingData[0],
					concurrentBilling: billingData[1],
				};
				if (requiredDeps.length > 0) tmpBilling.requires = requiredDeps;
				if (optionalDeps.length > 0) tmpBilling.optional = optionalDeps;

				return tmpBilling;
			}
			default:
				return null;
		}
	};

	const getForm = () => {
		return (
			<div className={'skuform-container'}>
				<div
					className={'skuform-header'}
					onClick={() => {
						toggleCollapse();
					}}
				>
					{productName}
				</div>
				<div className={`skuform-body ${formCollapsed ? 'collapsed' : ''}`}>
					<ValidationFieldContainer errors={errors} name="product-name">
						<DxTextbox
							inputType="text"
							label="Product Name"
							clearButton={true}
							value={productName}
							onChange={(newValue) => {
								setProductName(newValue);
							}}
						/>
					</ValidationFieldContainer>
					<ValidationFieldContainer errors={errors} name="product-description">
						<DxTextbox
							inputType="text"
							label="Product Description"
							clearButton={true}
							value={productDescription}
							onChange={(newValue) => {
								setProductDescription(newValue);
							}}
						/>
					</ValidationFieldContainer>

					{wizardVisible ? (
						<SKUWizard
							onSelectedType={(billingType) => {
								setWizardVisible(false);
								setBillingType(billingType);
							}}
						/>
					) : null}

					{/* Forms for different product types */}
					{billingType == BillingType.USAGE_TYPE ? <UsageForm setBillingData={setBillingData} setFormHasErrors={setFormHasErrors} /> : null}

					{/* Dependency Section */}
					<div
						className={`dependencies-container ${
							productsItemGroup.length > 0 && billingType !== BillingType.ONE_TIME && billingType !== undefined ? '' : 'hidden'
						}`}
					>
						<h2>Dependencies</h2>
						<div>Required Products: </div>
						<div>
							{productsItemGroup.map((prodItem, i) => (
								<DxCheckbox
									key={i}
									label={prodItem.label}
									itemValue={prodItem.value}
									onCheckChanged={(checked) => {
										const prod = allProducts.find((p) => p.id === prodItem.value);
										if (!prod) return;
										if (checked) {
											setRequiredDeps((oldDeps) => {
												return [...oldDeps, prod];
											});
										} else {
											setRequiredDeps((oldDeps) => {
												return oldDeps.filter((d) => d.id !== prod.id);
											});
										}
									}}
									disabled={prodItem.value === skuId || optionalDeps.find((dep) => dep.id === prodItem.value) !== undefined}
								/>
							))}
						</div>
						<div>Optional Products: </div>
						<div>
							{productsItemGroup.map((prodItem, i) => (
								<DxCheckbox
									key={i}
									label={prodItem.label}
									itemValue={prodItem.value}
									onCheckChanged={(checked) => {
										const prod = allProducts.find((p) => p.id === prodItem.value);
										if (!prod) return;
										if (checked) {
											setOptionalDeps((oldDeps) => {
												return [...oldDeps, prod];
											});
										} else {
											setOptionalDeps((oldDeps) => {
												return oldDeps.filter((d) => d.id !== prod.id);
											});
										}
									}}
									disabled={prodItem.value === skuId || requiredDeps.find((dep) => dep.id === prodItem.value) !== undefined}
								/>
							))}
						</div>
					</div>

					{/* Buttons */}
					<div>
						<DxButton
							disabled={Object.keys(errors).length > 0 || formHasErrors}
							type="primary"
							onClick={() => {
								saveSKU();
							}}
						>
							Save
						</DxButton>
						<DxButton type="secondary" onClick={() => onDelete()}>
							Delete
						</DxButton>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div>
			<div className={!lockedIn ? 'hidden' : ''}>
				<SKUFormPreview onEdit={() => setLockedIn(false)} product={buildProduct()} />
			</div>
			<div className={lockedIn ? 'hidden' : ''}>{getForm()}</div>
		</div>
	);
}

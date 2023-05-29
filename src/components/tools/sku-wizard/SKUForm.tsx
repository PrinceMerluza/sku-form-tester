import React, { useState, useEffect } from 'react';
import { DxButton, DxItemGroupItem, DxTextbox, DxItemGroup, DxCheckbox } from 'genesys-react-components';
import { BillingType, UsageProduct, MeteredProduct, FlatFeeProduct, OneTimeProduct, BillingData, EmptyProduct } from './types';
import Validator from '../utils/validation/Validator';
import ValidationFieldContainer from '../utils/validation/ValidationFieldContainer';
import SKUWizard from './SKUWizard';
import UsageForm from './billing-forms/UsageForm';
import MeteredForm from './billing-forms/MeteredForm';
import OneTimeForm from './billing-forms/OneTimeForm';
import SKUFormPreview from './SKUFormPreview';

import './SKUForm.scss';
import FlatFeeForm from './billing-forms/FlatFeeForm';

interface IProps {
	onSave: (product: UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct | null | undefined) => void;
	onDelete: () => void;
	onEdit: () => void;
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

	// Product properties
	const [productName, setProductName] = useState<string>(props.productName || '');
	const [productDescription, setProductDescription] = useState<string>(props.description || '');
	const [billingType, setBillingType] = useState<BillingType>();
	const [billingData, setBillingData] = useState<BillingData[]>([]);
	const [oneTimeFee, setOneTimeFee] = useState<number>(); // only used when type will be one-time fee
	const [requiredDeps, setRequiredDeps] = useState<(UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct | EmptyProduct)[]>([]);
	const [optionalDeps, setOptionalDeps] = useState<(UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct | EmptyProduct)[]>([]);
	const [notes, setNotes] = useState<string>('');

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

	// When save is pressed, it will build the actual Product object from the individual states
	const buildProduct: () => UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct | null | undefined = () => {
		switch (billingType) {
			case BillingType.USAGE_TYPE:
			case BillingType.MIMIC: {
				if (billingData.length != 2) return;

				const tmpBilling: UsageProduct = {
					id: skuId,
					name: productName,
					description: productDescription,
					type: billingType,
					namedBilling: billingData[0],
					concurrentBilling: billingData[1],
				};
				if (requiredDeps.length > 0) tmpBilling.requires = requiredDeps;
				if (optionalDeps.length > 0) tmpBilling.optional = optionalDeps;
				if (notes.length > 0) tmpBilling.notes = notes;

				return tmpBilling;
			}
			case BillingType.METERED_HIGHWATER:
			case BillingType.METERED_SUM: {
				if (billingData.length != 1) return;

				const tmpBilling: MeteredProduct = {
					id: skuId,
					name: productName,
					description: productDescription,
					type: billingType,
					billing: billingData[0],
				};
				if (requiredDeps.length > 0) tmpBilling.requires = requiredDeps;
				if (optionalDeps.length > 0) tmpBilling.optional = optionalDeps;
				if (notes.length > 0) tmpBilling.notes = notes;

				return tmpBilling;
			}
			case BillingType.FLAT_FEE: {
				if (billingData.length != 1) return;

				const tmpBilling: FlatFeeProduct = {
					id: skuId,
					name: productName,
					description: productDescription,
					type: BillingType.FLAT_FEE,
					billing: billingData[0],
				};
				if (requiredDeps.length > 0) tmpBilling.requires = requiredDeps;
				if (optionalDeps.length > 0) tmpBilling.optional = optionalDeps;
				if (notes.length > 0) tmpBilling.notes = notes;

				return tmpBilling;
			}
			case BillingType.ONE_TIME: {
				if (!oneTimeFee) return;
				const tmpBilling: OneTimeProduct = {
					id: skuId,
					name: productName,
					description: productDescription,
					type: BillingType.ONE_TIME,
					oneTimeFee: oneTimeFee,
				};
				if (notes.length > 0) tmpBilling.notes = notes;

				return tmpBilling;
			}
			default:
				return null;
		}
	};

	const getForm = () => {
		return (
			<div className={'skuform-editable-container'}>
				<div
					className={'skuform-header'}
					onClick={() => {
						toggleCollapse();
					}}
				>
					{productName || `Base Product ${skuId}`}
				</div>
				<div className={`skuform-body ${formCollapsed ? 'collapsed' : ''}`}>
					{billingType ? (
						<div>
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
						</div>
					) : null}

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
					{billingType == BillingType.MIMIC ? <UsageForm setBillingData={setBillingData} setFormHasErrors={setFormHasErrors} /> : null}
					{billingType == BillingType.METERED_HIGHWATER ? (
						<MeteredForm setBillingData={setBillingData} setFormHasErrors={setFormHasErrors} />
					) : null}
					{billingType == BillingType.METERED_SUM ? (
						<MeteredForm setBillingData={setBillingData} setFormHasErrors={setFormHasErrors} />
					) : null}
					{billingType == BillingType.FLAT_FEE ? <FlatFeeForm setBillingData={setBillingData} setFormHasErrors={setFormHasErrors} /> : null}
					{billingType == BillingType.ONE_TIME ? <OneTimeForm setOneTimeFee={setOneTimeFee} setFormHasErrors={setFormHasErrors} /> : null}

					{/* Add-Ons Section */}
					<div
						className={`dependencies-container ${
							productsItemGroup.length > 0 && billingType !== BillingType.ONE_TIME && billingType !== undefined ? '' : 'hidden'
						}`}
					>
						<h2>Add-Ons</h2>
						<div>Required Add-Ons: </div>
						<div>
							{productsItemGroup.map((prodItem, i) => (
								<div className={`chk-addon-item ${prodItem.value === skuId ? 'hidden' : ''}`}>
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
								</div>
							))}
						</div>
						<div>Optional Add-ons: </div>
						<div>
							{productsItemGroup.map((prodItem, i) => (
								<div className={`chk-addon-item ${prodItem.value === skuId ? 'hidden' : ''}`}>
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
								</div>
							))}
						</div>
					</div>

					{/* Notes Section */}
					<div className={`notes-container ${billingType !== undefined ? '' : 'hidden'}`}>
						<DxTextbox
							inputType="textarea"
							label="Additional Notes"
							clearButton={true}
							onChange={(value: string) => setNotes(value)}
							description="Other information you may want to add on this product"
						/>
					</div>

					{/* Buttons */}
					<div>
						<DxButton
							disabled={Object.keys(errors).length > 0 || formHasErrors || !(productName && productDescription && billingType)}
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
		<div className="skuform-container">
			<div className={!lockedIn ? 'hidden' : ''}>
				<SKUFormPreview
					onEdit={() => {
						setLockedIn(false);
						props.onEdit();
					}}
					product={buildProduct()}
					billingType={billingType}
				/>
			</div>
			<div className={lockedIn ? 'hidden' : ''}>{getForm()}</div>
		</div>
	);
}

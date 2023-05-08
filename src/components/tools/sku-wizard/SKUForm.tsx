import React, { useState, useEffect } from 'react';
import { DxButton, DxTextbox } from 'genesys-react-components';
import { BillingType, UsageProduct, MeteredProduct, FlatFeeProduct, OneTimeProduct, BillingData } from './types';
import Validator from '../utils/validation/Validator';
import ValidationFieldContainer from '../utils/validation/ValidationFieldContainer';
import SKUWizard from './SKUWizard';
import UsageForm from './billing-forms/UsageForm';
import SKUFormPreview from './SKUFormPreview';

import './SKUForm.scss';

interface IProps {
	onSave: (product: UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct | null | undefined) => void;
	onDelete: () => void;
	skuId: string;
	productName?: string;
	description?: string;
}

export default function SKUForm(props: IProps) {
	const skuId = props.skuId;
	const onDelete = props.onDelete;
	const onSave = props.onSave;
	// Product propertues
	const [productName, setProductName] = useState<string>(props.productName || '');
	const [productDescription, setProductDescription] = useState<string>(props.description || '');
	const [billingType, setBillingType] = useState<BillingType>();
	const [billingData, setBillingData] = useState<BillingData[]>([]);

	// UI related
	const [formCollapsed, setFormCollapsed] = useState<boolean>(false);
	const [lockedIn, setLockedIn] = useState<boolean>(false);
	const [wizardVisible, setWizardVisible] = useState<boolean>(true);
	const [formHasErrors, setFormHasErrors] = useState<boolean>(false); // inner form for billing data
	const [errors, setErrors] = useState<{ [key: string]: Array<string> }>({});

	const saveSKU = () => {
		setLockedIn(true);
		onSave(buildProduct());
	};

	const toggleCollapse = () => {
		setFormCollapsed((formCollapsed) => !formCollapsed);
	};

	const buildProduct: () => UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct | null | undefined = () => {
		switch (billingType) {
			case BillingType.USAGE_TYPE:
				if (billingData.length != 2) return;

				return {
					id: skuId,
					name: productName,
					description: productDescription,
					type: BillingType.USAGE_TYPE,
					namedBilling: billingData[0],
					concurrentBilling: billingData[1],
				};
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

					{/* Buttons */}
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

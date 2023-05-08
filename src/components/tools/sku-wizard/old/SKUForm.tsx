import React, { useState, useEffect } from 'react';
import { DxButton, DxTextbox } from 'genesys-react-components';
import { BillingType, BillingData, SKU, BillingTier } from './types';
import SKUFormEditor from './SKUFormEditor';
import SKUFormPreview from './SKUFormPreview';
import Validator from '../utils/validation/Validator';
import ValidationFieldContainer from '../utils/validation/ValidationFieldContainer';

import './SKUForm.scss';

interface IProps {
	onDelete: () => void;
	skuId: string;
	productName?: string;
	description?: string;
}

export default function SKUForm(props: IProps) {
	const skuId = props.skuId;
	const onDelete = props.onDelete;
	const [sku, setSku] = useState<SKU>();
	const [productName, setProductName] = useState<string>(props.productName || '');
	const [productDescription, setProductDescription] = useState<string>(props.description || '');
	const [billingData, setBillingData] = useState<BillingData>({
		type: BillingType.USAGE_TYPE,
		annualPrepay: 0,
		annualMonthToMonth: 0,
	});
	const [formCollapsed, setFormCollapsed] = useState<boolean>(false);
	const [lockedIn, setLockedIn] = useState<boolean>(false);
	const [errors, setErrors] = useState<{ [key: string]: Array<string> }>({});

	useEffect(() => {
		const newErrors: { [key: string]: Array<string> } = {};
		const validator: Validator = new Validator(newErrors);

		// Basic Data
		validator.validateStringLength('product-name', productName, 1);
		validator.validateStringLength('product-description', productDescription, 1);

		// Billing Data
		// non-tier pricing validation
		if (!billingData.useTiers) {
			validator.validateGreaterThanOrEqual(
				'annual-m2m',
				billingData.annualMonthToMonth * 12,
				billingData.annualPrepay,
				'Annual month-to-month is lower than the annual price.'
			);

			// month-to-month
			validator.validateGreaterThanOrEqual(
				'm2m',
				billingData.monthToMonth ? billingData.monthToMonth * 12 : undefined,
				billingData.annualPrepay,
				'Month to month price is lower than the annual prepay price.'
			);
			validator.validateGreaterThanOrEqual(
				'm2m',
				billingData.monthToMonth ? billingData.monthToMonth : undefined,
				billingData.annualMonthToMonth,
				'Month to month price is lower than the annual month-to-month price.'
			);
		}

		// Tier pricing validation
		if (billingData.useTiers && billingData.tiers) {
			billingData.tiers.forEach((tier, i) => {
				const tierEntryName = `tier-${tier.id}`;
				const prevTier: BillingTier | null = i > 0 ? billingData.tiers![i - 1] : null;
				// Make sure that tiers are discounted from previous ones.
				if (prevTier !== null) {
					validator.validateLessThan(
						tierEntryName,
						tier.annualPrepay,
						prevTier.annualPrepay,
						'Annual prepay is higher or equal to previous tier.'
					);
					validator.validateLessThan(
						tierEntryName,
						tier.annualMonthToMonth,
						prevTier.annualMonthToMonth,
						'Annual month to month is higher or equal to previous tier.'
					);
				}
				validator.validateGreaterThan(tierEntryName, tier.range.to, tier.range.from, 'Range is invalid');

				// Validate to and from that they are not overlapping each other
				for (let j = billingData.tiers!.length - 1; j >= 0; j--) {
					if (i === j) continue;
					if (
						(tier.range.to >= billingData.tiers![j].range.from && tier.range.to <= billingData.tiers![j].range.to) ||
						(tier.range.from >= billingData.tiers![j].range.from && tier.range.from <= billingData.tiers![j].range.to)
					) {
						validator.addErrorMessage(tierEntryName, 'Range is overlapping another range');
					}
				}
			});
		}

		setErrors(newErrors);
	}, [productName, productDescription, billingData]);

	const saveSKU = () => {
		setSku({
			id: skuId,
			name: productName,
			description: productDescription,
			billingData: billingData,
		});
		setLockedIn(true);
	};

	const toggleCollapse = () => {
		setFormCollapsed((formCollapsed) => !formCollapsed);
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

					<SKUFormEditor errors={errors} billingData={billingData} setBillingData={setBillingData} />

					<DxButton disabled={Object.keys(errors).length > 0} type="primary" onClick={() => saveSKU()}>
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
				<SKUFormPreview onEdit={() => setLockedIn(false)} sku={sku} />
			</div>
			<div className={lockedIn ? 'hidden' : ''}>{getForm()}</div>
		</div>
	);
}

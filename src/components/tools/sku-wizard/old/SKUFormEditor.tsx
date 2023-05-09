import React, { useState, useEffect } from 'react';
import { DxButton, DxTextbox, DxToggle, DxItemGroup, DxItemGroupItem } from 'genesys-react-components';
import { BillingData, BillingType, BillingTier } from './types';
import SKUTierBillingForm from './tier-billing/SKUTierBillingForm';
import ValidationFieldContainer from '../utils/validation/ValidationFieldContainer';

import './SKUFormEditor.scss';

interface IProps {
	billingData: BillingData;
	setBillingData: React.Dispatch<React.SetStateAction<BillingData>>;
	errors: { [key: string]: Array<string> };
}

enum Page {
	APP_TYPE,
	USAGE_TYPE,
	METERED_TYPE,
	MIMIC_TYPE,
	AMOUNTS,
}

const meteredUnits: DxItemGroupItem[] = [
	{ label: 'Million Characters', value: 'Million Characters' },
	{ label: 'Per Minute', value: 'Per Minute' },
	{ label: 'Per Hour', value: 'Per Hour' },
	{ label: 'Per Month', value: 'Per Month' },
	{ label: 'Per Invocation', value: 'Per Invocation' },
	{ label: 'Per Transaction', value: 'Per Transaction' },
];

/**
 * The actual 'wizard' part where the user is walked through a navigation of pages to determine,
 * billing type and values. Can only be used inside an SKUForm component and billingData is required
 * to be passed
 * @param props
 */
export default function SKUFormEditor(props: IProps) {
	const billingData = props.billingData;
	const errors = props.errors;
	const [activePage, setActivePage] = useState<Page>(Page.APP_TYPE);
	const [m2mEnabled, setM2mEnabled] = useState<boolean | undefined>(false);
	const [oneTimeFeeEnabled, setOneTimeFeeEnabled] = useState<boolean | undefined>(false);
	const [useTieredBilling, setUseTieredBilling] = useState<boolean | undefined>(false);

	const updateBillingData = (name: string, value: any) => {
		props.setBillingData((prevData) => {
			const tmpObj = Object.assign({}, prevData);
			tmpObj[name] = value;

			return tmpObj;
		});
	};

	// First page of billing type selection
	const getAppTypeSelection = () => {
		return (
			<div className="type-selection">
				<div className="nav-header">
					<span className="guide-text">How would you like to bill this product?</span>
				</div>
				<div className="type-selection-options">
					<div className="type-selection-option">
						<DxButton type="primary" onClick={() => navigateTo(Page.USAGE_TYPE)}>
							Per User
						</DxButton>
						<div>If you're billing based on the amount of users</div>
					</div>
					<div className="type-selection-option">
						<DxButton type="primary" onClick={() => navigateTo(Page.METERED_TYPE)}>
							Metered
						</DxButton>
						<div>If you're billing based on metered usage.</div>
					</div>
					<div className="type-selection-option">
						<DxButton type="primary">Flat Fee</DxButton>
						<div>If you're billing on a flat fee regardless of users or usage</div>
					</div>
				</div>
			</div>
		);
	};

	const getUsageTypeSelection = () => {
		return (
			<div className="type-selection">
				<div className="nav-header">
					<DxButton type="primary" onClick={() => navigateTo(Page.APP_TYPE)}>
						Back
					</DxButton>
					<span className="guide-text">How would you like to bill this product?</span>
				</div>
				<div className="type-selection-options">
					<div className="type-selection-option">
						<DxButton
							type="primary"
							onClick={() => {
								updateBillingData('type', BillingType.USAGE_TYPE);
								navigateTo(Page.AMOUNTS);
							}}
						>
							Permission Based
						</DxButton>
						<div>
							A special permission is created for the org. Only users with the specific permission and logged in on the month will be
							billed.
						</div>
					</div>
					<div className="type-selection-option">
						<DxButton type="primary" onClick={() => navigateTo(Page.MIMIC_TYPE)}>
							Per Agent Seat (Mimic)
						</DxButton>
						<div>All users with the agent license in the org will be billed</div>
					</div>
				</div>
			</div>
		);
	};

	const getMeteredTypeSelection = () => {
		return (
			<div className="type-selection">
				<div className="nav-header">
					<DxButton type="primary" onClick={() => navigateTo(Page.APP_TYPE)}>
						Back
					</DxButton>
					<span className="guide-text">How would you like to bill this product?</span>
				</div>
				<div className="type-selection-options">
					<div className="type-selection-option">
						<DxButton
							type="primary"
							onClick={() => {
								updateBillingData('type', BillingType.METERED_SUM);
								navigateTo(Page.AMOUNTS);
							}}
						>
							Metered Sum Usage
						</DxButton>
						<div>Ideal for unit types such as minutes, API hits, visits, interactions, storage gigs, etc.</div>
					</div>
					<div className="type-selection-option">
						<DxButton
							type="primary"
							onClick={() => {
								updateBillingData('type', BillingType.METERED_HIGHWATER);
								navigateTo(Page.AMOUNTS);
							}}
						>
							Metered High Water Mark
						</DxButton>
						<div>Ideal for unit types without much fluctation such as Wallboards</div>
					</div>
				</div>
			</div>
		);
	};

	const getMimicTypeSelection = () => {
		return (
			<div className="type-selection">
				<div className="nav-header">
					<DxButton type="primary" onClick={() => navigateTo(Page.APP_TYPE)}>
						Back
					</DxButton>
					<span className="guide-text">How would you like to bill this product?</span>
				</div>
				<div className="type-selection-options">
					<div className="type-selection-option">
						<DxButton type="primary">Named Users</DxButton>
						<div>All billable Named Genesys Cloud agents are matched 1:1 with Mimic Type applications</div>
					</div>
					<div className="type-selection-option">
						<DxButton type="primary">Concurrent Users</DxButton>
						<div>All billable Concurrent Genesys Cloud agents are matched 1:1 with Mimic Type applications</div>
					</div>
					<div className="type-selection-option">
						<DxButton type="primary">Hourly Users</DxButton>
						<div>All billable Hourly Genesys Cloud agents are matched 1:1 with Mimic Type applications</div>
					</div>
				</div>
			</div>
		);
	};

	const getAmountsForm = () => {
		return (
			<div>
				<div>
					Billing Type: {billingData.type}
					<DxButton type="primary" onClick={() => navigateTo(Page.APP_TYPE)}>
						Change
					</DxButton>
				</div>
				{billingData.type === BillingType.METERED_SUM || billingData.type === BillingType.METERED_HIGHWATER ? (
					<div>
						<span>Unit of Measure: </span>{' '}
						<DxItemGroup
							title="Unit of Measure"
							items={meteredUnits}
							format="dropdown"
							onItemChanged={(item, isSelected) => {
								if (isSelected) updateBillingData('unitOfMeasure', item);
							}}
						/>
					</div>
				) : null}
				<div>
					{useTieredBilling ? null : (
						<div>
							<ValidationFieldContainer errors={errors} name="annual-prepay">
								<DxTextbox
									inputType="decimal"
									label="Annual Prepay (per month)"
									initialValue="0"
									onChange={(val) => updateBillingData('annualPrepay', parseFloat(val))}
								/>
							</ValidationFieldContainer>
							<ValidationFieldContainer errors={errors} name="annual-m2m">
								<DxTextbox
									inputType="decimal"
									label="Annual Month-to-month (per month)"
									initialValue="0"
									onChange={(val) => updateBillingData('annualMonthToMonth', parseFloat(val))}
								/>
							</ValidationFieldContainer>
						</div>
					)}
					<div className="optional-fee-container">
						<DxToggle label="Enable Month to Month Billing" value={m2mEnabled} onChange={(val) => setM2mEnabled(val)} />
						{m2mEnabled ? (
							<ValidationFieldContainer errors={errors} name="m2m">
								<DxTextbox
									inputType="decimal"
									label="Month-to-month"
									initialValue="0"
									className="optional-item"
									onChange={(val) => updateBillingData('monthToMonth', parseFloat(val))}
								/>
							</ValidationFieldContainer>
						) : null}
					</div>
					<div className="optional-fee-container">
						<DxToggle label="Charge an initial fee" value={oneTimeFeeEnabled} onChange={(val) => setOneTimeFeeEnabled(val)} />
						{oneTimeFeeEnabled ? (
							<ValidationFieldContainer errors={errors} name="one-time-fee">
								<DxTextbox
									inputType="decimal"
									label="One-time Fee"
									initialValue="0"
									className="optional-item"
									onChange={(val) => updateBillingData('oneTimeFee', parseFloat(val))}
								/>
							</ValidationFieldContainer>
						) : null}
					</div>
				</div>
				{/* =========== TIERED BILLING ===========	*/}
				<div>
					<DxToggle
						label="Use Tiered Billing"
						value={useTieredBilling}
						onChange={(val) => {
							setUseTieredBilling(val);
							updateBillingData('useTiers', val);
						}}
					/>
					{useTieredBilling ? (
						<SKUTierBillingForm errors={errors} billingData={props.billingData} setBillingData={props.setBillingData} />
					) : null}
				</div>
			</div>
		);
	};

	const navigateTo = (page: Page) => {
		setActivePage(page);
	};

	return (
		<div className="sku-editor-navigation">
			{activePage === Page.APP_TYPE ? getAppTypeSelection() : null}
			{activePage === Page.USAGE_TYPE ? getUsageTypeSelection() : null}
			{activePage === Page.METERED_TYPE ? getMeteredTypeSelection() : null}
			{activePage === Page.MIMIC_TYPE ? getMimicTypeSelection() : null}
			{activePage === Page.AMOUNTS ? getAmountsForm() : null}
		</div>
	);
}

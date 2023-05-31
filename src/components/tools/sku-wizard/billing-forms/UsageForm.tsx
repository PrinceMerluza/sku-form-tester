import React, { useState, useEffect } from 'react';
import ValidationFieldContainer from '../../utils/validation/ValidationFieldContainer';
import { DxTextbox, DxToggle } from 'genesys-react-components';
import SKUTierBillingForm from './tier-billing/SKUTierBillingForm';
import { BillingData } from '../types';
import Validator from '../../utils/validation/Validator';
import './UsageForm.scss';

interface IProps {
	setBillingData: React.Dispatch<React.SetStateAction<BillingData[]>>;
	setFormHasErrors: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function UsageForm(props: IProps) {
	const setBillingData = props.setBillingData;
	const setFormHasErrors = props.setFormHasErrors;
	const [errors, setErrors] = useState<{ [key: string]: Array<string> }>({});

	// Named Billing
	const [namedBillingData, setNamedBillingData] = useState<BillingData>({
		annualPrepay: 0,
		annualMonthToMonth: 0,
	});
	const [namedM2mEnabled, setNamedM2mEnabled] = useState<boolean | undefined>(false);
	const [namedUseTieredBilling, setNamedUseTieredBilling] = useState<boolean | undefined>(false);
	const [namedHasMonthlyCommit, setNamedHasMonthlyCommit] = useState<boolean | undefined>(false);

	// Concurrent Billing
	const [concBillingData, setConcBillingData] = useState<BillingData>({
		annualPrepay: 0,
		annualMonthToMonth: 0,
	});
	const [concM2mEnabled, setConcM2mEnabled] = useState<boolean | undefined>(false);
	const [concUseTieredBilling, setConcUseTieredBilling] = useState<boolean | undefined>(false);
	const [concHasMonthlyCommit, setConcHasMonthlyCommit] = useState<boolean | undefined>(false);

	// VALIDATION
	useEffect(() => {
		const newErrors: { [key: string]: Array<string> } = {};
		const validator: Validator = new Validator(newErrors);

		// Billing Data
		// Named Billing Data
		if (!namedBillingData.useTiers) {
			validator.validateGreaterThanOrEqual(
				'named-annual-m2m',
				namedBillingData.annualMonthToMonth,
				namedBillingData.annualPrepay,
				'Annual month-to-month is lower than the annual price.'
			);

			// month-to-month
			if (namedBillingData.monthToMonth) {
				validator.validateGreaterThanOrEqual(
					'named-m2m',
					namedBillingData.monthToMonth,
					namedBillingData.annualPrepay,
					'Month to month price is lower than the annual prepay price.'
				);
				validator.validateGreaterThanOrEqual(
					'named-m2m',
					namedBillingData.monthToMonth,
					namedBillingData.annualMonthToMonth,
					'Month to month price is lower than the annual month-to-month price.'
				);
			}
		}
		// Concurrent Billing Data
		if (!concBillingData.useTiers) {
			// concurrent should have higher amount than named
			validator.validateGreaterThanOrEqual(
				'conc-annual-prepay',
				concBillingData.annualPrepay,
				namedBillingData.annualPrepay,
				'Concurrent Pricing should be higher or equal to Named pricing.'
			);

			// annual m2m should be higher or euqal than prepay
			validator.validateGreaterThanOrEqual(
				'conc-annual-m2m',
				concBillingData.annualMonthToMonth,
				concBillingData.annualPrepay,
				'Annual month-to-month is lower than the annual price.'
			);

			// month-to-month should have highest value
			if (concBillingData.monthToMonth) {
				validator.validateGreaterThanOrEqual(
					'conc-m2m',
					concBillingData.monthToMonth,
					concBillingData.annualPrepay,
					'Month to month price is lower than the annual prepay price.'
				);
				validator.validateGreaterThanOrEqual(
					'conc-m2m',
					concBillingData.monthToMonth,
					concBillingData.annualMonthToMonth,
					'Month to month price is lower than the annual month-to-month price.'
				);
			}
		}

		setErrors(newErrors);

		setFormHasErrors(Object.keys(newErrors).length > 0);
		setBillingData([namedBillingData, concBillingData]);
	}, [setBillingData, setFormHasErrors, namedBillingData, concBillingData]);

	// Reset tier values if toggle is disabled
	useEffect(() => {
		if (namedUseTieredBilling) return;
		updateNamedBillingData('tiers', []);
	}, [namedUseTieredBilling]);
	useEffect(() => {
		if (concUseTieredBilling) return;
		updateConcBillingData('tiers', []);
	}, [concUseTieredBilling]);

	const updateNamedBillingData = (name: string, value: any) => {
		setNamedBillingData((prevData) => {
			const tmpObj = Object.assign({}, prevData);
			tmpObj[name] = value;

			return tmpObj;
		});
	};

	const updateConcBillingData = (name: string, value: any) => {
		setConcBillingData((prevData) => {
			const tmpObj = Object.assign({}, prevData);
			tmpObj[name] = value;

			return tmpObj;
		});
	};

	const getAmountsForm = () => {
		return (
			<div className="portions-container">
				<hr />
				<div className="named-portion">
					<h2>Named Users Billing</h2>
					<div>
						<div>
							<ValidationFieldContainer errors={errors} name="named-annual-prepay">
								<DxTextbox
									inputType="decimal"
									label="Annual Prepay (per month)"
									initialValue="0"
									onChange={(val) => updateNamedBillingData('annualPrepay', parseFloat(val))}
								/>
							</ValidationFieldContainer>
							<ValidationFieldContainer errors={errors} name="named-annual-m2m">
								<DxTextbox
									inputType="decimal"
									label="Annual Month-to-month (per month)"
									initialValue="0"
									onChange={(val) => updateNamedBillingData('annualMonthToMonth', parseFloat(val))}
								/>
							</ValidationFieldContainer>
						</div>
						<div className="optional-fee-container">
							<div>
								<DxToggle
									label="Enable Month to Month Billing"
									value={namedM2mEnabled}
									onChange={(val) => {
										setNamedM2mEnabled(val);
										if (!val) updateNamedBillingData('monthToMonth', null);
									}}
								/>
								{namedM2mEnabled ? (
									<ValidationFieldContainer errors={errors} name="named-m2m">
										<DxTextbox
											inputType="decimal"
											label="Month-to-month"
											initialValue="0"
											className="optional-item"
											onChange={(val) => updateNamedBillingData('monthToMonth', parseFloat(val))}
										/>
									</ValidationFieldContainer>
								) : null}
							</div>
							<div>
								<DxToggle label="Set Monthly Commit" value={namedHasMonthlyCommit} onChange={(val) => setNamedHasMonthlyCommit(val)} />
								{namedHasMonthlyCommit ? (
									<ValidationFieldContainer errors={errors} name="named-monthly-commit">
										<DxTextbox
											inputType="decimal"
											label="Monthly Commit"
											initialValue="0"
											className="optional-item"
											onChange={(val) => updateNamedBillingData('minMonthlyCommit', parseFloat(val))}
										/>
									</ValidationFieldContainer>
								) : null}
							</div>
						</div>
					</div>
					{/* =========== TIERED BILLING ===========	*/}
					<div>
						<DxToggle
							label="Enable Volume Discounts"
							value={namedUseTieredBilling}
							onChange={(val) => {
								setNamedUseTieredBilling(val);
								updateNamedBillingData('useTiers', val);
							}}
						/>
						{namedUseTieredBilling ? (
							<SKUTierBillingForm errors={errors} billingData={namedBillingData} setBillingData={setNamedBillingData} />
						) : null}
					</div>
				</div>
				<hr />
				<div className="concurrent-portion">
					<h2>Concurrent Users Billing</h2>
					<div>
						<div>
							<ValidationFieldContainer errors={errors} name="conc-annual-prepay">
								<DxTextbox
									inputType="decimal"
									label="Annual Prepay (per month)"
									initialValue="0"
									onChange={(val) => updateConcBillingData('annualPrepay', parseFloat(val))}
								/>
							</ValidationFieldContainer>
							<ValidationFieldContainer errors={errors} name="conc-annual-m2m">
								<DxTextbox
									inputType="decimal"
									label="Annual Month-to-month (per month)"
									initialValue="0"
									onChange={(val) => updateConcBillingData('annualMonthToMonth', parseFloat(val))}
								/>
							</ValidationFieldContainer>
						</div>
						<div className="optional-fee-container">
							<div>
								<DxToggle
									label="Enable Month to Month Billing"
									value={concM2mEnabled}
									onChange={(val) => {
										setConcM2mEnabled(val);
										if (!val) updateConcBillingData('monthToMonth', null);
									}}
								/>
								{concM2mEnabled ? (
									<ValidationFieldContainer errors={errors} name="conc-m2m">
										<DxTextbox
											inputType="decimal"
											label="Month-to-month"
											initialValue="0"
											className="optional-item"
											onChange={(val) => updateConcBillingData('monthToMonth', parseFloat(val))}
										/>
									</ValidationFieldContainer>
								) : null}
							</div>
							<div>
								<DxToggle label="Set Monthly Commit" value={concHasMonthlyCommit} onChange={(val) => setConcHasMonthlyCommit(val)} />
								{concHasMonthlyCommit ? (
									<ValidationFieldContainer errors={errors} name="conc-monthly-commit">
										<DxTextbox
											inputType="decimal"
											label="Monthly Commit"
											initialValue="0"
											className="optional-item"
											onChange={(val) => updateConcBillingData('minMonthlyCommit', parseFloat(val))}
										/>
									</ValidationFieldContainer>
								) : null}
							</div>
						</div>
					</div>
					{/* =========== TIERED BILLING ===========	*/}
					<div>
						<DxToggle
							label="Enable Volume Discounts"
							value={concUseTieredBilling}
							onChange={(val) => {
								setConcUseTieredBilling(val);
								updateConcBillingData('useTiers', val);
							}}
						/>
						{concUseTieredBilling ? (
							<SKUTierBillingForm errors={errors} billingData={concBillingData} setBillingData={setConcBillingData} />
						) : null}
					</div>
				</div>
			</div>
		);
	};

	return <div className="usage-form-container">{getAmountsForm()}</div>;
}

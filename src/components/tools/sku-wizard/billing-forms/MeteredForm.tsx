import React, { useState, useEffect } from 'react';
import ValidationFieldContainer from '../../utils/validation/ValidationFieldContainer';
import { DxTextbox, DxToggle } from 'genesys-react-components';
import SKUTierBillingForm from './tier-billing/SKUTierBillingForm';
import { BillingData, MeteredProduct } from '../types';
import Validator from '../../utils/validation/Validator';
import { UnitOfMeasure } from '../types';
import { DxItemGroupItem, DxItemGroup } from 'genesys-react-components';

interface IProps {
	setBillingData: React.Dispatch<React.SetStateAction<BillingData[]>>;
	setFormHasErrors: React.Dispatch<React.SetStateAction<boolean>>;
	prefill?: MeteredProduct;
}

const unitsOfMeasure: DxItemGroupItem[] = [
	{ label: 'Character', value: UnitOfMeasure.CHARACTER },
	{ label: 'Digital Interaction', value: UnitOfMeasure.DIGITAL_INTERACTION },
	{ label: 'Event', value: UnitOfMeasure.EVENT },
	{ label: 'GB', value: UnitOfMeasure.GB },
	{ label: 'Hour', value: UnitOfMeasure.HOUR },
	{ label: 'Instance', value: UnitOfMeasure.INSTANCE },
	{ label: 'Invocation', value: UnitOfMeasure.INVOCATION },
	{ label: 'License', value: UnitOfMeasure.LICENSE },
	{ label: 'Minute', value: UnitOfMeasure.MINUTE },
	{ label: 'Request', value: UnitOfMeasure.REQUEST },
	{ label: 'Second', value: UnitOfMeasure.SECOND },
	{ label: 'Segment', value: UnitOfMeasure.SEGMENT },
	{ label: 'Stream', value: UnitOfMeasure.STREAM },
	{ label: 'Transaction', value: UnitOfMeasure.TRANSACTION },
	{ label: 'Unit', value: UnitOfMeasure.UNIT, isSelected: true },
	{ label: 'Usage', value: UnitOfMeasure.USAGE },
	{ label: 'User', value: UnitOfMeasure.USER },
	{ label: 'Web Visit', value: UnitOfMeasure.WEB_VISIT },
];

export default function MeteredForm(props: IProps) {
	const prefill = props.prefill;
	const setBillingData = props.setBillingData;
	const setFormHasErrors = props.setFormHasErrors;
	const [localBillingData, setLocalBillingData] = useState<BillingData>({
		annualPrepay: 0,
		annualMonthToMonth: 0,
		unitOfMeasure: UnitOfMeasure.UNIT,
	});
	const [hasMonthlyCommit, setHasMonthlyCommit] = useState<boolean | undefined>(false);
	const [useTieredBilling, setUseTieredBilling] = useState<boolean | undefined>(false);
	const [unitOfMeasure, setUnitOfMeasure] = useState<string>(UnitOfMeasure.UNIT);
	const [prefillsLoaded, setPrefillsLoaded] = useState<boolean>(false);

	const [errors, setErrors] = useState<{ [key: string]: Array<string> }>({});

	// Prefill
	useEffect(() => {
		if (!prefill) {
			setPrefillsLoaded(true);
			return;
		}

		// billing values
		setLocalBillingData(() => {
			const billing = prefill.billing;
			const ret: BillingData = {
				annualPrepay: billing.annualPrepay,
				annualMonthToMonth: billing.annualMonthToMonth,
				monthToMonth: billing.monthToMonth,
				unitOfMeasure: billing.unitOfMeasure,
			};
			if (billing.minMonthlyCommit) {
				ret.minMonthlyCommit = billing.minMonthlyCommit;
				setHasMonthlyCommit(true);
			}
			if (billing.useTiers && billing.tiers) {
				ret.useTiers = true;
				ret.tiers = billing.tiers;
				setUseTieredBilling(true);
			}
			return ret;
		});

		// Preselct the prefill unit of measurement in dropdown
		const unitSelected = unitsOfMeasure.find((u) => {
			return u.value === prefill.billing.unitOfMeasure;
		});
		if (unitSelected) unitSelected.isSelected = true;

		setPrefillsLoaded(true);
	}, [prefill]);

	// VALIDATION
	useEffect(() => {
		const newErrors: { [key: string]: Array<string> } = {};
		const validator: Validator = new Validator(newErrors);

		// Billing Data
		// Named Billing Data
		if (!localBillingData.useTiers) {
			validator.validateGreaterThanOrEqual(
				'named-annual-m2m',
				localBillingData.annualMonthToMonth,
				localBillingData.annualPrepay,
				'Annual month-to-month is lower than the annual price.'
			);

			// month-to-month
			if (localBillingData.monthToMonth) {
				validator.validateGreaterThanOrEqual(
					'named-m2m',
					localBillingData.monthToMonth,
					localBillingData.annualPrepay,
					'Month to month price is lower than the annual prepay price.'
				);
				validator.validateGreaterThanOrEqual(
					'named-m2m',
					localBillingData.monthToMonth,
					localBillingData.annualMonthToMonth,
					'Month to month price is lower than the annual month-to-month price.'
				);
			}
		}

		setErrors(newErrors);

		setFormHasErrors(Object.keys(newErrors).length > 0);
		setBillingData([localBillingData]);
	}, [setBillingData, setFormHasErrors, localBillingData]);

	const updateLocalBillingData = (name: string, value: any) => {
		setLocalBillingData((prevData) => {
			const tmpObj = Object.assign({}, prevData);
			tmpObj[name] = value;

			return tmpObj;
		});
	};

	const getAmountsForm = () => {
		return (
			<div>
				<div className="named-portion">
					<h2>Metered Billing</h2>
					<div>
						<DxItemGroup
							title="Unit of Measurement"
							items={unitsOfMeasure}
							format="dropdown"
							onItemChanged={(item, isSelected) => {
								if (isSelected) {
									setUnitOfMeasure(item.value);
									updateLocalBillingData('unitOfMeasure', item.value);
								}
							}}
						/>
					</div>
					<div>
						<div>
							<ValidationFieldContainer errors={errors} name="named-annual-prepay">
								<DxTextbox
									inputType="decimal"
									label={`Month-to-month (per ${unitOfMeasure})`}
									initialValue={localBillingData.monthToMonth?.toString()}
									onChange={(val) => updateLocalBillingData('monthToMonth', parseFloat(val))}
								/>
							</ValidationFieldContainer>
						</div>
						<div className="optional-fee-container">
							{/* <DxToggle label="Enable Month to Month Billing" value={m2mEnabled} onChange={(val) => setM2mEnabled(val)} />
							{m2mEnabled ? (
								<ValidationFieldContainer errors={errors} name="named-m2m">
									<DxTextbox
										inputType="decimal"
										label="Month-to-month"
										initialValue="0"
										className="optional-item"
										onChange={(val) => updateLocalBillingData('monthToMonth', parseFloat(val))}
									/>
								</ValidationFieldContainer>
							) : null} */}
							<div>
								<DxToggle label="Set Monthly Commit" value={hasMonthlyCommit} onChange={(val) => setHasMonthlyCommit(val)} />
								{hasMonthlyCommit ? (
									<ValidationFieldContainer errors={errors} name="monthly-commit">
										<DxTextbox
											inputType="decimal"
											label="Monthly Commit"
											initialValue={localBillingData.minMonthlyCommit?.toString()}
											className="optional-item"
											onChange={(val) => updateLocalBillingData('minMonthlyCommit', parseFloat(val))}
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
							initialValue={useTieredBilling}
							onChange={(val) => {
								setUseTieredBilling(val);
								updateLocalBillingData('useTiers', val);
							}}
						/>
						{useTieredBilling ? (
							<SKUTierBillingForm errors={errors} billingData={localBillingData} setBillingData={setLocalBillingData} />
						) : null}
					</div>
				</div>
			</div>
		);
	};

	return <div>{prefillsLoaded ? getAmountsForm() : null}</div>;
}

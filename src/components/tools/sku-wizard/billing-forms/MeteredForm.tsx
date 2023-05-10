import React, { useState, useEffect } from 'react';
import ValidationFieldContainer from '../../utils/validation/ValidationFieldContainer';
import { DxTextbox, DxToggle } from 'genesys-react-components';
import SKUTierBillingForm from './tier-billing/SKUTierBillingForm';
import { BillingData } from '../types';
import Validator from '../../utils/validation/Validator';
import { UnitOfMeasure } from '../types';
import { DxItemGroupItem, DxItemGroup } from 'genesys-react-components';

interface IProps {
	setBillingData: React.Dispatch<React.SetStateAction<BillingData[]>>;
	setFormHasErrors: React.Dispatch<React.SetStateAction<boolean>>;
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
	const setBillingData = props.setBillingData;
	const setFormHasErrors = props.setFormHasErrors;
	const [localBillingData, setLocalBillingData] = useState<BillingData>({
		annualPrepay: 0,
		annualMonthToMonth: 0,
	});
	const [m2mEnabled, setM2mEnabled] = useState<boolean | undefined>(false);
	const [useTieredBilling, setUseTieredBilling] = useState<boolean | undefined>(false);
	const [unitOfMeasure, setUnitOfMeasure] = useState<string>(UnitOfMeasure.UNIT);

	const [errors, setErrors] = useState<{ [key: string]: Array<string> }>({});

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
								if (isSelected) setUnitOfMeasure(item.value);
							}}
						/>
					</div>
					<div>
						{useTieredBilling ? null : (
							<div>
								<ValidationFieldContainer errors={errors} name="named-annual-prepay">
									<DxTextbox
										inputType="decimal"
										label={`Annual Prepay (per ${unitOfMeasure})`}
										initialValue="0"
										onChange={(val) => updateLocalBillingData('annualPrepay', parseFloat(val))}
									/>
								</ValidationFieldContainer>
								<ValidationFieldContainer errors={errors} name="named-annual-m2m">
									<DxTextbox
										inputType="decimal"
										label={`Annual Month-to-month (per ${unitOfMeasure})`}
										initialValue="0"
										onChange={(val) => updateLocalBillingData('annualMonthToMonth', parseFloat(val))}
									/>
								</ValidationFieldContainer>
							</div>
						)}
						<div className="optional-fee-container">
							<DxToggle label="Enable Month to Month Billing" value={m2mEnabled} onChange={(val) => setM2mEnabled(val)} />
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

	return <div>{getAmountsForm()}</div>;
}

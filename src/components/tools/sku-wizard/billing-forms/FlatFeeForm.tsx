import React, { useState, useEffect } from 'react';
import ValidationFieldContainer from '../../utils/validation/ValidationFieldContainer';
import { DxTextbox, DxToggle } from 'genesys-react-components';
import SKUTierBillingForm from './tier-billing/SKUTierBillingForm';
import { BillingData, FlatFeeProduct } from '../types';
import Validator from '../../utils/validation/Validator';

interface IProps {
	setBillingData: React.Dispatch<React.SetStateAction<BillingData[]>>;
	setFormHasErrors: React.Dispatch<React.SetStateAction<boolean>>;
	prefill?: FlatFeeProduct;
}

export default function FlatFeeForm(props: IProps) {
	const prefill = props.prefill;
	const setBillingData = props.setBillingData;
	const setFormHasErrors = props.setFormHasErrors;
	const [localBillingData, setLocalBillingData] = useState<BillingData>({
		annualPrepay: 0,
		annualMonthToMonth: 0,
	});
	const [m2mEnabled, setM2mEnabled] = useState<boolean | undefined>(false);
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
			};
			if (billing.monthToMonth) {
				ret.monthToMonth = billing.monthToMonth;
				setM2mEnabled(true);
			}
			return ret;
		});

		setPrefillsLoaded(true);
	}, [prefill]);

	// VALIDATION
	useEffect(() => {
		const newErrors: { [key: string]: Array<string> } = {};
		const validator: Validator = new Validator(newErrors);

		// Billing Data
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
					<h2>Recurring License Fee</h2>
					<div>
						<div>
							<ValidationFieldContainer errors={errors} name="named-annual-prepay">
								<DxTextbox
									inputType="decimal"
									label="Annual Prepay (per month)"
									initialValue={localBillingData.annualPrepay.toString()}
									onChange={(val) => updateLocalBillingData('annualPrepay', parseFloat(val))}
								/>
							</ValidationFieldContainer>
							<ValidationFieldContainer errors={errors} name="named-annual-m2m">
								<DxTextbox
									inputType="decimal"
									label="Annual Month-to-month (per month)"
									initialValue={localBillingData.annualMonthToMonth.toString()}
									onChange={(val) => updateLocalBillingData('annualMonthToMonth', parseFloat(val))}
								/>
							</ValidationFieldContainer>
						</div>
						<div className="optional-fee-container">
							<DxToggle
								label="Enable Month to Month Billing"
								value={m2mEnabled}
								onChange={(val) => {
									setM2mEnabled(val);
									if (!val) updateLocalBillingData('monthToMonth', null);
								}}
							/>
							{m2mEnabled ? (
								<ValidationFieldContainer errors={errors} name="named-m2m">
									<DxTextbox
										inputType="decimal"
										label="Month-to-month"
										initialValue={localBillingData.monthToMonth?.toString()}
										className="optional-item"
										onChange={(val) => updateLocalBillingData('monthToMonth', parseFloat(val))}
									/>
								</ValidationFieldContainer>
							) : null}
						</div>
					</div>
				</div>
			</div>
		);
	};

	return <div>{prefillsLoaded ? getAmountsForm() : null}</div>;
}

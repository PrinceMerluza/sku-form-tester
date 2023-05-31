import React, { useState, useEffect } from 'react';
import { DxButton, DxTextbox, DxToggle } from 'genesys-react-components';
import { BillingTier, SKU } from '../../types';

import './SKUTierBillingEntry.scss';

interface IProps {
	tier: BillingTier;
	setTierValue: (val: BillingTier) => void;
	onDelete: () => void;
	errors?: { [key: string]: Array<string> };
	disableDelete?: boolean;
	disableToInput?: boolean;
}

export default function SKUTierBillingEntry(props: IProps) {
	const errors = props.errors;
	const disableDelete = props.disableDelete;
	const disableToInput = props.disableToInput;
	const initalValue = props.tier.range.from;
	const tier = props.tier;
	const setTierValue = props.setTierValue;
	const onDelete = props.onDelete;

	const updateFrom = (from: number) => {
		const tmpObj = Object.assign({}, tier);
		tmpObj.range.from = from;
		setTierValue(tmpObj);
	};

	const updateTo = (to: number) => {
		const tmpObj = Object.assign({}, tier);
		tmpObj.range.to = to;
		setTierValue(tmpObj);
	};

	const updateAnnualPrepay = (amount: number) => {
		const tmpObj = Object.assign({}, tier);
		tmpObj.annualPrepay = amount;
		setTierValue(tmpObj);
	};

	const updateAnnualM2M = (amount: number) => {
		const tmpObj = Object.assign({}, tier);
		tmpObj.annualMonthToMonth = amount;
		setTierValue(tmpObj);
	};

	return (
		<div className={'entry-container'}>
			<DxTextbox
				className="tier-entry-textbox"
				inputType="decimal"
				label="From"
				disabled={true}
				initialValue={String(initalValue)}
				changeDebounceMs={100}
				onChange={(val) => updateFrom(parseFloat(val))}
			/>
			<DxTextbox
				className="tier-entry-textbox"
				inputType="decimal"
				label="To"
				disabled={disableToInput}
				changeDebounceMs={100}
				onChange={(val) => updateTo(parseFloat(val))}
			/>
			<DxTextbox
				className="tier-entry-textbox"
				inputType="decimal"
				label="Annual Prepay (per month)"
				changeDebounceMs={100}
				onChange={(val) => updateAnnualPrepay(parseFloat(val))}
			/>
			<DxTextbox
				className="tier-entry-textbox"
				inputType="decimal"
				label="Annual Month-to-month (per month)"
				changeDebounceMs={100}
				onChange={(val) => updateAnnualM2M(parseFloat(val))}
			/>
			<DxButton disabled={disableDelete} onClick={() => onDelete()}>
				Delete
			</DxButton>
		</div>
	);
}

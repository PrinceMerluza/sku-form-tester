import React, { useState, useEffect } from 'react';
import { DxButton, DxTextbox, DxToggle } from 'genesys-react-components';
import ValidationFieldContainer from '../../../utils/validation/ValidationFieldContainer';
import { BillingTier, BillingData, SKU } from '../../types';
import SKUTierBillingEntry from './SKUTierBillingEntry';

import './SKUTierBillingForm.scss';

interface IProps {
	billingData: BillingData;
	setBillingData: React.Dispatch<React.SetStateAction<BillingData>>;
	errors: { [key: string]: Array<string> };
}

export default function SKUTierBillingForm(props: IProps) {
	const errors = props.errors;
	const billingData = props.billingData;
	const tiers = billingData.tiers;
	const setBillingData = props.setBillingData;

	// Add a new tiered billing
	const addTier = () => {
		setBillingData((billingData) => {
			const newBilling = Object.assign({}, billingData);
			if (!newBilling.tiers) {
				newBilling.tiers = [];
			}

			// Give unique ID to entry
			let lastId: string = '0';
			if (newBilling.tiers.length > 0) {
				lastId = newBilling.tiers[newBilling.tiers.length - 1].id;
			}
			let newId: string = String(parseInt(lastId) + 1);

			// Create a new billing tier. Automatically set the 'from' field
			// based on the previous tier's 'to' field.
			const startingFrom = newBilling.tiers.length > 0 ? newBilling.tiers[newBilling.tiers.length - 1].range.to + 1 : 0;
			const newTier: BillingTier = {
				// Some values are set to NaN to represent empty string form values parsed to int (NaN),
				// to avoid error message showing on just newly added tiers. Either this or make the fields optional in type.
				id: newId,
				range: { from: startingFrom, to: NaN },
				annualPrepay: NaN,
				annualMonthToMonth: NaN,
			};
			newBilling.tiers.push(newTier);

			return newBilling;
		});
	};

	// Update tier values. If index nout found, do nothing
	const updateTier = (idx: number, val: BillingTier) => {
		setBillingData((billingData) => {
			const newBilling = Object.assign({}, billingData);
			if (!newBilling.tiers || idx >= newBilling.tiers.length) {
				console.error('Index out of bounds');
				return billingData;
			}

			newBilling.tiers[idx] = val;

			return newBilling;
		});
	};

	// Delete a billing tier. If index nout found, do nothing
	const deleteTier = (idx: number) => {
		setBillingData((billingData) => {
			const newBilling = Object.assign({}, billingData);
			if (!newBilling.tiers || idx >= newBilling.tiers.length) {
				console.error('Index out of bounds');
				return billingData;
			}

			// Remove entry from specific index
			newBilling.tiers = newBilling.tiers.filter((_, i) => idx !== i);

			return newBilling;
		});
	};

	const allowAddingTier = (): boolean => {
		if (!tiers || tiers.length === 0) return true;
		const lastTier = tiers[tiers.length - 1];
		if (!lastTier.range.to || !lastTier.annualMonthToMonth || !lastTier.annualPrepay) return false;
		return true;
	};

	// The view components for the tiers
	const tierList = tiers
		? tiers.map((tier, idx) => {
				return (
					<ValidationFieldContainer errors={errors} name={`tier-${tier.id}`}>
						<SKUTierBillingEntry
							errors={errors}
							key={tier.id}
							tier={tier}
							setTierValue={(tierVal) => updateTier(idx, tierVal)}
							onDelete={() => deleteTier(idx)}
							disableDelete={idx !== tiers.length - 1}
						/>
					</ValidationFieldContainer>
				);
		  })
		: null;

	return (
		<div className={'billing-form'}>
			<div>{tierList}</div>
			<div>
				<DxButton disabled={!allowAddingTier()} type="primary" onClick={() => addTier()}>
					Add Tier
				</DxButton>
			</div>
		</div>
	);
}

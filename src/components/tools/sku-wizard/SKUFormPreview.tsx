import React, { useState, useEffect } from 'react';
import { DxButton, DxTextbox, DxToggle } from 'genesys-react-components';
import { UsageProduct, MeteredProduct, FlatFeeProduct, OneTimeProduct, BillingType, BillingData, BillingTier } from './types';

import './SKUFormPreview.scss';

interface IProps {
	billingType: BillingType | undefined;
	product: UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct | null | undefined;
	onEdit: () => void;
}

export default function SKUFormPreview(props: IProps) {
	const product = props.product;
	const billingType = props.billingType;

	const regularBillingUI = (billingData: BillingData) => {
		return (
			<table>
				<thead>
					<tr>
						<th>Annual Prepay</th>
						<th>Annual Month-to-Month</th>
						<th>Month-to-month</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>{billingData.annualPrepay}</td>
						<td>{billingData.annualMonthToMonth}</td>
						<td>{billingData.monthToMonth || 'n/a'}</td>
					</tr>
				</tbody>
			</table>
		);
	};

	const tieredBillingUI = (tiers: BillingTier[] | undefined) => {
		if (!tiers) return <div>Error on displaying tiers. No tiers value</div>;
		return (
			<table>
				<thead>
					<tr>
						<th></th>
						<th>From</th>
						<th>To</th>
						<th>Annual Prepay</th>
						<th>Annual Month-to-Month</th>
					</tr>
				</thead>
				<tbody>
					{(() => {
						if (!tiers) return;
						return tiers.map((t: BillingTier) => {
							return (
								<tr key={t.id}>
									<th>{`Tier ${t.id}`}</th>
									<td>{`${t.range.from}`}</td>
									<td>{`${t.range.to}`}</td>
									<td>{`${t.annualPrepay}`}</td>
									<td>{`${t.annualMonthToMonth}`}</td>
								</tr>
							);
						});
					})()}
				</tbody>
			</table>
		);
	};

	return (
		<div className="sku-preview-container">
			{product ? (
				<div>
					<div>
						<strong>Name:</strong> {product.name}
					</div>
					<div>
						<strong>Description:</strong> {product.description}
					</div>
					<div>
						<strong>Type:</strong> {billingType}
					</div>

					{product.type === BillingType.USAGE_TYPE || product.type === BillingType.MIMIC ? (
						<div>
							<div>
								<strong>Named User Billing:</strong>
							</div>
							{!product.namedBilling.useTiers ? regularBillingUI(product.namedBilling) : tieredBillingUI(product.namedBilling.tiers)}
							<div>
								<strong>Concurrent User Billing:</strong>
							</div>
							{!product.concurrentBilling.useTiers
								? regularBillingUI(product.concurrentBilling)
								: tieredBillingUI(product.concurrentBilling.tiers)}
						</div>
					) : null}

					{product.notes ? (
						<div>
							<strong>Notes:</strong> {product.notes}
						</div>
					) : null}
					<DxButton type="primary" onClick={() => props.onEdit()}>
						Edit
					</DxButton>
				</div>
			) : null}
		</div>
	);
}

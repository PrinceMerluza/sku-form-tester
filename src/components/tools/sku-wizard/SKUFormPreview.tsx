import React, { useState, useEffect } from 'react';
import { DxButton, DxTextbox, DxToggle } from 'genesys-react-components';
import { UsageProduct, MeteredProduct, FlatFeeProduct, BillingType, BillingData, BillingTier } from './types';

import './SKUFormPreview.scss';

interface IProps {
	billingType: BillingType | undefined;
	product: UsageProduct | MeteredProduct | FlatFeeProduct | null | undefined;
	onEdit: () => void;
}

export default function SKUFormPreview(props: IProps) {
	const product = props.product;
	const billingType = props.billingType;

	const getRegularBillingUI = (billingData: BillingData) => {
		return (
			<table className="billing-table">
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

	const getTieredBillingUI = (billingData: BillingData) => {
		const tiers = billingData.tiers;
		if (!tiers) return <div>Error on displaying tiers. No tiers value</div>;
		return (
			<table className="billing-table">
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
					<tr>
						<th>Tier 1</th>
						<td>0</td>
						<td>{`${(tiers[0]?.range?.from || 1) - 1}`}</td>
						<td>{`${billingData.annualPrepay}`}</td>
						<td>{`${billingData.annualMonthToMonth}`}</td>
					</tr>
					{(() => {
						if (!tiers) return;
						return tiers.map((t: BillingTier) => {
							return (
								<tr key={t.id}>
									<th>{`Tier ${(parseInt(t.id) + 1).toString()}`}</th>
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
						<h1>{product.name}</h1>
					</div>
					<div>
						<h3>{product.description}</h3>
					</div>
					<div>
						<strong>TYPE:</strong> {billingType}
					</div>
					<hr />

					{/* QUICKSTART FEE */}
					{product.startupFee ? (
						<div>
							<strong>{`QUICKSTART (${product.startupFee.required ? 'required' : 'optional'})`}</strong>
							<div>{product.startupFee.oneTimeFee}</div>
						</div>
					) : null}

					{/* BILLING DETAILS */}
					{product.type === BillingType.USAGE_TYPE || product.type === BillingType.MIMIC ? (
						<div className="billing-details-container">
							<div>
								<strong>NAMED USER BILLING</strong>
								{!product.namedBilling.useTiers ? getRegularBillingUI(product.namedBilling) : getTieredBillingUI(product.namedBilling)}
							</div>

							<div>
								<strong>CONCURRENT USER BILLING</strong>
								{!product.concurrentBilling.useTiers
									? getRegularBillingUI(product.concurrentBilling)
									: getTieredBillingUI(product.concurrentBilling)}
							</div>
						</div>
					) : null}

					{product.type === BillingType.METERED_HIGHWATER || product.type === BillingType.METERED_SUM ? (
						<div className="billing-details-container">
							<div>
								<div>
									<strong>METERED BILLING</strong>
								</div>
								<table className="billing-table">
									<thead>
										<tr>
											<th>Unit of Measurement</th>
											<th>Month-to-month (per {product.billing.unitOfMeasure})</th>
											<th>Minimum Monthly Commit</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>{product.billing.unitOfMeasure}</td>
											<td>{product.billing.monthToMonth}</td>
											<td>{product.billing.minMonthlyCommit}</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					) : null}

					{product.type === BillingType.FLAT_FEE ? (
						<div className="billing-details-container">
							<div>
								<div>
									<strong>RECURRING LICENSE</strong>
								</div>
								<table className="billing-table">
									<thead>
										<tr>
											<th>Annual Prepay</th>
											<th>Annual Month-to-Month</th>
											<th>Month-to-Month</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>{product.billing.annualPrepay}</td>
											<td>{product.billing.annualMonthToMonth}</td>
											<td>{product.billing.monthToMonth}</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					) : null}

					{/* NOTES */}
					{product.notes ? (
						<div>
							<strong>NOTES:</strong>
							<div>{product.notes}</div>
						</div>
					) : null}
					<hr />
					<DxButton type="primary" onClick={() => props.onEdit()}>
						Edit
					</DxButton>
				</div>
			) : null}
		</div>
	);
}

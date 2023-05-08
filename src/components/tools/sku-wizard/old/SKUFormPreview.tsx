import React, { useState, useEffect } from 'react';
import { DxButton, DxTextbox, DxToggle } from 'genesys-react-components';
import { SKU } from './types';

import './SKUFormPreview.scss';

interface IProps {
	sku: SKU | undefined;
	onEdit: () => void;
}

export default function SKUFormPreview(props: IProps) {
	const sku = props.sku;
	return (
		<div className="sku-preview-container">
			{sku ? (
				<div>
					<div>
						<strong>Name:</strong> {sku.name}
					</div>
					<div>
						<strong>Description:</strong> {sku.description}
					</div>
					<div>
						<strong>Billing Type:</strong> {sku.billingData?.type}
					</div>
					{sku.billingData?.oneTimeFee ? (
						<div>
							<strong>One-time Fee:</strong> {sku.billingData.oneTimeFee}{' '}
						</div>
					) : null}
					<div>
						<strong>Annual Prepay:</strong> {sku.billingData?.annualPrepay}
					</div>
					<div>
						<strong>Annual Month-to-month:</strong> {sku.billingData?.annualMonthToMonth}
					</div>
					{sku.billingData?.monthToMonth ? (
						<div>
							<strong>Month-to-month:</strong> {sku.billingData.monthToMonth}{' '}
						</div>
					) : null}
					{sku.billingData?.tiers ? (
						<div>
							<strong>Tiers:</strong>
							{sku.billingData?.tiers?.map((tier, i) => {
								return (
									<div>
										{`${i}: ${tier.range.from}-${tier.range.to}. Annual: ${tier.annualPrepay}. Month-to-month: ${tier.annualMonthToMonth}`}
									</div>
								);
							})}
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

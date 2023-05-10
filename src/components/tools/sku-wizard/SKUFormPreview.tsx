import React, { useState, useEffect } from 'react';
import { DxButton, DxTextbox, DxToggle } from 'genesys-react-components';
import { UsageProduct, MeteredProduct, FlatFeeProduct, OneTimeProduct, BillingType } from './types';

import './SKUFormPreview.scss';

interface IProps {
	billingType: BillingType | undefined;
	product: UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct | null | undefined;
	onEdit: () => void;
}

export default function SKUFormPreview(props: IProps) {
	const product = props.product;
	const billingType = props.billingType;
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

					<DxButton type="primary" onClick={() => props.onEdit()}>
						Edit
					</DxButton>
				</div>
			) : null}
		</div>
	);
}

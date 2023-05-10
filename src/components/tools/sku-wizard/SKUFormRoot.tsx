import React, { useState, useEffect } from 'react';
import { DxButton, DxTextbox, DxItemGroup, DxItemGroupItem } from 'genesys-react-components';
import { UsageProduct, MeteredProduct, FlatFeeProduct, OneTimeProduct, EmptyProduct } from './types';
import SKUForm from './SKUForm';

import './SKUFormRoot.scss';
import { forEach } from 'jszip';

const currencyList: DxItemGroupItem[] = [
	{ label: 'AUD - Australian Dollar', value: 'AUD' },
	{ label: 'BRL - Brazilian Real', value: 'BRL' },
	{ label: 'CAD - Canadian Dollar', value: 'CAD' },
	{ label: 'EUR - Euro', value: 'EUR' },
	{ label: 'GBP - British Pound', value: 'GBP' },
	{ label: 'JPY - Japanese Yen', value: 'JPY' },
	{ label: 'NZD - New Zealand Dollar', value: 'NZD' },
	{ label: 'USD - US Dollar', value: 'USD', isSelected: true },
	{ label: 'ZAR - South African Rand', value: 'ZAR' },
];

const fxRate: { [key: string]: number } = {
	USD: 1.0,
	CAD: 1.273,
	GBP: 0.7496,
	EUR: 0.88,
	ZAR: 16.672,
	AUD: 1.3855,
	NZD: 1.458,
	JPY: 115.012,
	BRL: 5.6049,
};

export default function SKUFormRoot() {
	const [products, setProducts] = useState<(UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct | EmptyProduct)[]>([]);
	const [formsSavedStatus, setFormsSavedStatus] = useState<{ [key: string]: boolean }>({}); // Tracks if SKU forms are saved
	const [addProductEnabled, setAddProductEnabled] = useState<boolean>(true);
	const [currency, setCurrency] = useState<string>('USD');
	const [errors, setErrors] = useState<{ [key: string]: Array<string> }>({});

	const setFormStatus = (id: string, val: boolean) => {
		setFormsSavedStatus((oldStatus) => {
			const tmpObj = Object.assign({}, oldStatus);
			tmpObj[id] = val;

			return tmpObj;
		});
	};

	const SKUList = products.map((product) => {
		// Make sure that all sku  forms have an entry in the formSavedStatus
		if (formsSavedStatus[product.id] === undefined) {
			setFormStatus(product.id, false);
		}

		return (
			<SKUForm
				key={product.id}
				skuId={product.id}
				onDelete={() => {
					deleteSKU(product.id);

					// delete the savestatus entry as well
					setFormsSavedStatus((oldStatus) => {
						const tmpObj = Object.assign({}, oldStatus);
						delete tmpObj[product.id];

						return tmpObj;
					});
				}}
				onSave={(newProduct) => {
					if (!newProduct) return;
					setProducts((oldProducts) => {
						return oldProducts.map((prod) => {
							if (prod.id == newProduct.id) return newProduct;
							return prod;
						});
					});

					setFormStatus(product.id, true);
				}}
				onEdit={() => {
					setFormStatus(product.id, false);
				}}
				allProducts={products}
			/>
		);
	});

	const deleteSKU = (id: string) => {
		setProducts((oldProducts) => {
			return oldProducts.filter((e) => id.localeCompare(e.id) !== 0);
		});
	};

	const addSKU = () => {
		setProducts((oldProducts) => {
			let lastId: string = '0';
			if (oldProducts.length > 0) {
				lastId = oldProducts[oldProducts.length - 1].id;
			}

			const newId: string = String(parseInt(lastId) + 1);
			const newProduct = {
				id: newId,
			};
			return [...oldProducts, newProduct];
		});
	};

	return (
		<div className="sku-form-root">
			<div>
				<DxItemGroup
					title="Currency"
					items={currencyList}
					format="dropdown"
					onItemChanged={(item, isSelected) => {
						if (isSelected) setCurrency(item.value);
					}}
				/>
				<div>{`FxRate: ${currency}/USD = ${fxRate[currency]}`}</div>
			</div>
			<div>{SKUList}</div>
			<div className={`add-product ${addProductEnabled ? '' : 'hidden'}`}>
				<DxButton
					type="primary"
					onClick={() => {
						addSKU();
					}}
				>
					Add Product
				</DxButton>
				<DxButton
					type="primary"
					onClick={() => {
						console.log('xxxxx');
					}}
					disabled={
						(() => {
							let allSaved = true;
							console.log('a');
							products
								.filter((prod) => formsSavedStatus[prod.id] !== undefined)
								.forEach((prod) => {
									if (!formsSavedStatus[prod.id]) allSaved = false;
								});
							return !allSaved;
						})() || products.length === 0
					}
				>
					Finalize SKUs
				</DxButton>
			</div>
		</div>
	);
}

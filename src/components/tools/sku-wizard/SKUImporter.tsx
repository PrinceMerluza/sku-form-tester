import { UsageProduct, MeteredProduct, FlatFeeProduct, EmptyProduct, SKUFormData, SKUTemplateCSV, BillingType, UsageUnit } from './types';
import camelCase from 'camelcase';
import csv from 'csvtojson';
import JSZip from 'jszip';

export default class SKUImporter {
	zipObj: JSZip;

	constructor(zipObj: JSZip) {
		this.zipObj = zipObj;
	}

	async getProducts(): Promise<(UsageProduct | MeteredProduct | FlatFeeProduct | EmptyProduct)[]> {
		const products: (UsageProduct | MeteredProduct | FlatFeeProduct | EmptyProduct)[] = [];

		// GLoad the SKUTemplate file
		const skuTemp = this.zipObj.file('SKUTemplate.csv');
		if (!skuTemp) {
			throw new Error('cannot open SKUTemplate csv file');
		}

		// Get and parse the CSV data to object form
		const csvData = await skuTemp
			.async('text')
			.then((csvData) => {
				return csv().fromString(csvData);
			})
			.then((csvData) => csvData);

		// Read the rows objects
		csvData.forEach((row) => {
			const skuData: SKUTemplateCSV = row as SKUTemplateCSV;
			let product: UsageProduct | MeteredProduct | FlatFeeProduct | EmptyProduct | null = null;

			switch (skuData['Premium App Type']) {
				case BillingType.USAGE_TYPE:
				case BillingType.MIMIC: {
					// Usage Type is special. Check first if product name already in array,
					// if so that means either named or concurrent part was already converted
					// add the missing billing then add to final arr.
					const existingUsageP = products.find((p) => {
						return p.name === skuData['Product Name'];
					}) as UsageProduct;

					// Create or use existing usage product name
					if (existingUsageP) {
						product = existingUsageP;
					} else {
						product = {
							id: '4',
							name: skuData['Product Name'],
							description: skuData['Product Description'],
							type: BillingType.USAGE_TYPE,
							notes: skuData.Notes,
						};
					}

					// Add the billing
					if (skuData['Unit of Measure'] == UsageUnit.NAMED) {
						product.namedBilling = {
							annualPrepay: Number(skuData['Annual Prepay']),
							annualMonthToMonth: Number(skuData['Annual Month-to-Month']),
						};
						if (Number(skuData['Month-to-month']) > 0) {
							product.namedBilling.monthToMonth = Number(skuData['Month-to-month']);
						}
					}
					if (skuData['Unit of Measure'] == UsageUnit.CONCURRENT) {
						product.concurrentBilling = {
							annualPrepay: Number(skuData['Annual Prepay']),
							annualMonthToMonth: Number(skuData['Annual Month-to-Month']),
						};
						if (Number(skuData['Month-to-month']) > 0) {
							product.concurrentBilling.monthToMonth = Number(skuData['Month-to-month']);
						}
					}

					// Add only if not already esting product
					if (!existingUsageP) products.push(product);
				}
			}
		});

		return products;
	}
}

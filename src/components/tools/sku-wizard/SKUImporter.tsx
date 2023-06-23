import { UsageProduct, MeteredProduct, FlatFeeProduct, EmptyProduct, SKUFormData, SKUTemplateCSV, BillingType, UsageUnit } from './types';
import camelCase from 'camelcase';
import csv from 'csvtojson';
import JSZip from 'jszip';

export default class SKUImporter {
	zipObj: JSZip;

	constructor(zipObj: JSZip) {
		this.zipObj = zipObj;
	}

	// Get and build the products from the CSV file
	async getProducts(): Promise<(UsageProduct | MeteredProduct | FlatFeeProduct | EmptyProduct)[]> {
		const products: (UsageProduct | MeteredProduct | FlatFeeProduct | EmptyProduct)[] = [];

		// Load the SKUTemplate file
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
		csvData.forEach((row, i) => {
			const skuData: SKUTemplateCSV = row as SKUTemplateCSV;
			let product: UsageProduct | MeteredProduct | FlatFeeProduct | EmptyProduct | null = null;

			switch (skuData.premiumAppType) {
				// TODO: Other Billign Types
				case BillingType.USAGE_TYPE:
				case BillingType.MIMIC: {
					// Usage Type is special. Check first if product name already in array,
					// if so that means either named or concurrent part was already converted
					// add the missing billing then add to final arr.
					const existingUsageP = products.find((p) => {
						return p.name === skuData.productName;
					}) as UsageProduct;

					// Create or use existing usage product name
					if (existingUsageP) {
						product = existingUsageP;
					} else {
						product = {
							id: i.toString(),
							name: skuData.productName,
							description: skuData.productDescription,
							type: BillingType.USAGE_TYPE,
							notes: skuData.notes,
						};
					}

					// Add the billing
					if (skuData.unitOfMeasure == UsageUnit.NAMED) {
						product.namedBilling = {
							annualPrepay: Number(skuData.annualPrepay),
							annualMonthToMonth: Number(skuData.annualM2M),
						};
						if (Number(skuData.m2m) > 0) {
							product.namedBilling.monthToMonth = Number(skuData.m2m);
						}
						if (Number(skuData.minMonthlyCommit) > 0) {
							product.namedBilling.minMonthlyCommit = Number(skuData.minMonthlyCommit);
						}
					}
					if (skuData.unitOfMeasure == UsageUnit.CONCURRENT) {
						product.concurrentBilling = {
							annualPrepay: Number(skuData.annualPrepay),
							annualMonthToMonth: Number(skuData.annualM2M),
						};
						if (Number(skuData.m2m) > 0) {
							product.concurrentBilling.monthToMonth = Number(skuData.m2m);
						}
						if (Number(skuData.minMonthlyCommit) > 0) {
							product.concurrentBilling.minMonthlyCommit = Number(skuData.minMonthlyCommit);
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

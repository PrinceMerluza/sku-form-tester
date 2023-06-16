import { UsageProduct, MeteredProduct, FlatFeeProduct, EmptyProduct, SKUFormData, SKUTemplateCSV, BillingType } from './types';
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
		// csvData.forEach((row) => {
		// 	const skuData: SKUTemplateCSV = row as SKUTemplateCSV;
		// 	let product: UsageProduct | MeteredProduct | FlatFeeProduct | EmptyProduct | null = null;

		// 	switch (skuData['Premium App Type']) {
		// 		case BillingType.USAGE_TYPE: {
		// 			product = {
		// 				id: string; // used for providing ID to dynamic component
		// 				name: string;
		// 				description: string;
		// 				type: BillingType.MIMIC | BillingType.USAGE_TYPE;
		// 				namedBilling: BillingData;
		// 				concurrentBilling: BillingData;
		// 				startupFee?: StartUpFee;
		// 				notes?: string;
		// 			}
		// 		}
		// 	}

		// 	if (!product) {
		// 		throw new Error('error in reading product');
		// 	}
		// 	products.push(product);
		// });

		return products;
	}
}

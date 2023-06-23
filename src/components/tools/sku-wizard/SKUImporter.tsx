import {
	UsageProduct,
	MeteredProduct,
	FlatFeeProduct,
	EmptyProduct,
	SKUFormData,
	SKUTemplateCSV,
	BillingType,
	UsageUnit,
	TIERED_PREFIX,
	TieredBillingCSV,
	BillingData,
	BillingTier,
} from './types';
import camelCase from 'camelcase';
import csv from 'csvtojson';
import JSZip, { JSZipObject } from 'jszip';

export default class SKUImporter {
	zipObj: JSZip;
	tieredBillingData: { [key: string]: TieredBillingCSV[] } = {};

	constructor(zipObj: JSZip) {
		this.zipObj = zipObj;
	}

	// Load the tiered-* csvs and the results will be in tieredBillingData
	// with key being the filename (tiered-1-appname) which is also the value in SKUTemplate.csv
	// for reference. And the value is the array of TieredBillingCSV rows
	private async loadTieredCSVData() {
		const tieredZipNames: string[] = [];
		const tieredZipObjs: Promise<any[] | void>[] = [];
		this.zipObj.forEach((relPath, zipObj) => {
			if (!(relPath.startsWith(TIERED_PREFIX) && relPath.endsWith('.csv'))) return;

			tieredZipNames.push(relPath);
			tieredZipObjs.push(
				zipObj
					.async('text')
					.then((csvData) => {
						return csv().fromString(csvData);
					})
					.then((csvData) => csvData)
					.catch((e) => console.error(e))
			);
		});
		const tieredBillingArr = await Promise.all(tieredZipObjs);
		for (let i = 0; i < tieredZipNames.length; i++) {
			this.tieredBillingData[tieredZipNames[i]] = tieredBillingArr[i] as TieredBillingCSV[];
		}
	}

	private buildBillingData(skuData: SKUTemplateCSV): BillingData {
		const billingData: BillingData = {
			annualPrepay: Number(skuData.annualPrepay),
			annualMonthToMonth: Number(skuData.annualM2M),
		};
		if (Number(skuData.m2m) > 0) {
			billingData.monthToMonth = Number(skuData.m2m);
		}
		if (Number(skuData.minMonthlyCommit) > 0) {
			billingData.minMonthlyCommit = Number(skuData.minMonthlyCommit);
		}
		if (this.tieredBillingData[skuData.tieredBilling]) {
			billingData.useTiers = true;
			const tempTiers = this.tieredBillingData[skuData.tieredBilling].map((tierRow, i) => {
				return {
					id: i.toString(),
					range: {
						from: Number(tierRow.from),
						to: Number(tierRow.to),
					},
					annualPrepay: Number(tierRow.annualPrepay),
					annualMonthToMonth: Number(tierRow.annualM2M),
				};
			});
			tempTiers.shift(); // remove first tier which is base (0-n).
			billingData.tiers = tempTiers;
		}
		console.log(billingData);
		return billingData;
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
			.then((data) => {
				return csv().fromString(data);
			})
			.then((data) => data)
			.catch((e) => {
				throw e;
			});

		// Load the Tiered CSVs
		await this.loadTieredCSVData();

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
						product.namedBilling = this.buildBillingData(skuData);
					}
					if (skuData.unitOfMeasure == UsageUnit.CONCURRENT) {
						product.concurrentBilling = this.buildBillingData(skuData);
					}

					// Add only if not already esting product
					if (!existingUsageP) products.push(product);
				}
			}
		});

		return products;
	}
}

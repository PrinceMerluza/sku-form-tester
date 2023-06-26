import {
	UsageProduct,
	MeteredProduct,
	FlatFeeProduct,
	EmptyProduct,
	SKUTemplateCSV,
	BillingType,
	UsageUnit,
	TIERED_PREFIX,
	TieredBillingCSV,
	BillingData,
	UnitOfMeasure,
} from './types';
import csv from 'csvtojson';
import JSZip from 'jszip';

export default class SKUImporter {
	private zipObj: JSZip;
	private csvData: SKUTemplateCSV[] = [];
	private tieredBillingData: { [key: string]: TieredBillingCSV[] } = {};
	private addonIds: string[] = []; // id of addons
	private quickStarts: string[] = []; // id of quickstart 'products'

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

	// Load the array of csvtojson data.
	private async loadCSVData() {
		// Load the SKUTemplate file
		const skuTemp = this.zipObj.file('SKUTemplate.csv');
		if (!skuTemp) {
			throw new Error('cannot open SKUTemplate csv file');
		}

		// Get and parse the CSV data to object form
		this.csvData = await skuTemp
			.async('text')
			.then((data) => {
				return csv().fromString(data);
			})
			.then((data) => data)
			.catch((e) => {
				throw e;
			});
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

		// Unit of measure
		if (skuData.premiumAppType === BillingType.METERED_HIGHWATER || skuData.premiumAppType === BillingType.METERED_SUM) {
			billingData.unitOfMeasure = skuData.unitOfMeasure as UnitOfMeasure;
		}

		// Tiered Billing
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

		return billingData;
	}

	private async loadAddons() {
		// Get the quickstarts first since they'll be exceptions when determining addons
		this.csvData.forEach((row) => {
			if (row.premiumAppType === BillingType.QUICKSTART) this.quickStarts.push(row.productName);
		});

		// Determine the apps that are add-ons.
		this.csvData.forEach((row) => {
			let tempAos = row.required.split(',').concat(row.optional.split(','));
			tempAos = tempAos.map((ao) => ao.trim());

			tempAos.forEach((ao) => {
				if (!this.addonIds.includes(ao) && !this.quickStarts.includes(ao)) this.addonIds.push(ao);
			});
		});

		// Clean quickstart and addons (remove balnk string that result form empty original value)
		this.quickStarts = this.quickStarts.filter((x) => x !== '');
		this.addonIds = this.addonIds.filter((x) => x !== '');
	}

	// Get and build the products from the CSV file
	async getProducts(): Promise<(UsageProduct | MeteredProduct | FlatFeeProduct | EmptyProduct)[]> {
		// Do some required processing first on the files
		await this.loadCSVData();
		await this.loadAddons();
		await this.loadTieredCSVData();

		const products: (UsageProduct | MeteredProduct | FlatFeeProduct | EmptyProduct)[] = [];

		// Apply the StartUpFee property to a product. Should be provided a dependency string
		// from csv, this means calling this method two time: required and optional deps.
		const applyQuickstart = (product: UsageProduct | MeteredProduct | FlatFeeProduct, dependencyArr: string, required: boolean) => {
			dependencyArr
				.split(',')
				.map((ao) => ao.trim())
				.forEach((ao) => {
					if (this.quickStarts.includes(ao)) {
						if (!product) return;
						const qsData = this.csvData.find((d) => d.productName === ao);
						if (!qsData) return;

						product.startupFee = {
							name: qsData.productName,
							description: qsData.productDescription,
							oneTimeFee: Number(qsData.annualPrepay),
							required: required,
						};
					}
				});
		};

		// Read the rows objects
		this.csvData.forEach((row, i) => {
			const skuData: SKUTemplateCSV = row as SKUTemplateCSV;

			switch (skuData.premiumAppType) {
				// TODO: Other Billign Types
				case BillingType.USAGE_TYPE:
				case BillingType.MIMIC: {
					let product: UsageProduct | null;

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
							type: skuData.premiumAppType,
							notes: skuData.notes,
						} as UsageProduct;
					}

					// Add the billing
					if (skuData.unitOfMeasure == UsageUnit.NAMED) {
						product.namedBilling = this.buildBillingData(skuData);
					}
					if (skuData.unitOfMeasure == UsageUnit.CONCURRENT) {
						product.concurrentBilling = this.buildBillingData(skuData);
					}

					// Add only if not already existing in product
					// also apply quickstart
					if (!existingUsageP && product) {
						products.push(product);

						applyQuickstart(product, skuData.required, true);
						applyQuickstart(product, skuData.optional, false);
					}

					break;
				}
				case BillingType.FLAT_FEE:
				case BillingType.METERED_HIGHWATER:
				case BillingType.METERED_SUM: {
					const product = {
						id: i.toString(),
						name: skuData.productName,
						description: skuData.productDescription,
						type: skuData.premiumAppType,
						billing: this.buildBillingData(skuData),
						notes: skuData.notes,
					} as MeteredProduct | FlatFeeProduct;

					// Quickstart
					applyQuickstart(product, skuData.required, true);
					applyQuickstart(product, skuData.optional, false);

					products.push(product);

					break;
				}
			}
		});

		// Toggle products that are add-ons
		products.forEach((product) => {
			if (this.addonIds.includes(product.name)) product.isAddOn = true;
		});

		//  Apply dependencies (Add-ons)
		this.csvData.forEach((row) => {
			const product = products.find((p) => p.name === row.productName) as UsageProduct | MeteredProduct | FlatFeeProduct;
			if (!product && !this.quickStarts.includes(row.productName))
				throw new Error(`unexpected error. product ${row.productName} cannot be found`);

			row.required
				.split(',')
				.map((ao) => ao.trim())
				.forEach((ao) => {
					if (!ao || this.quickStarts.includes(ao)) return;

					const addOn = products.find((p) => p.name === ao);
					if (!addOn) throw new Error(`unexpected error. addon ${ao} cannot be found`);
					if (!product.requires) product.requires = [];
					product.requires.push(addOn);
				});

			row.optional
				.split(',')
				.map((ao) => ao.trim())
				.forEach((ao) => {
					if (!ao || this.quickStarts.includes(ao)) return;

					const addOn = products.find((p) => p.name === ao);
					if (!addOn) throw new Error(`unexpected error. addon ${ao} cannot be found`);
					if (!product.optional) product.optional = [];
					product.optional.push(addOn);
				});
		});

		return products;
	}
}

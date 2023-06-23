import {
	SKUFormData,
	UsageProduct,
	MeteredProduct,
	FlatFeeProduct,
	EmptyProduct,
	BillingType,
	UnitOfMeasure,
	BillingData,
	BillableAppJSON,
	JSONFileData,
	QuickStartJSON,
	DonutProduct,
	LicenseEntry,
	UsageUnit,
	SKUTemplateHeaders,
	TieredBillingCSV,
	GeneralDetails,
	SKUTemplateCSV,
	UsageNamedDefinition,
	UsageConcurrentDefinition,
	MimicDefinition,
	MeteredHWMDefinition,
	MeteredSumDefinition,
	TIERED_PREFIX,
} from './types';
import camelCase from 'camelcase';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { StartUpFee } from './types';

class CSVGenerator<T> {
	// sheaderOrdering should exaclty match T properties.
	// validated on generateCSV. keys not on headerOrdering won't be in csv
	headerOrdering: string[];
	rows: T[] = [];

	constructor(headerOrdering: string[]) {
		if (headerOrdering.length === 0) {
			throw new Error('headerOrdering is required');
		}
		this.headerOrdering = headerOrdering;
	}

	addRow(row: T): void {
		this.rows.push(row);
	}

	generateCSV(): string {
		let ret = '';
		if (this.rows.length === 0) return ret;

		ret += `${this.headerOrdering.toString()}\n`;
		this.rows.forEach((r) => {
			const objR = r as { [key: string]: any };
			const rowString = this.headerOrdering.map((h) => objR[h]).toString() + '\n';
			ret += rowString;
		});

		return ret;
	}
}

const getLicenseName = (productName: string): string => {
	return `${camelCase(productName)}License`;
};

// Remove 'EmptyProduct' from products array type. For better hinting and
// to avoid 'any' errors on expected properties of actually completed products.
const restrictProductType = (
	products: (UsageProduct | MeteredProduct | FlatFeeProduct | EmptyProduct)[]
): (UsageProduct | MeteredProduct | FlatFeeProduct)[] => {
	const ret: (UsageProduct | MeteredProduct | FlatFeeProduct)[] = products.map((p) => {
		switch (p.type) {
			case BillingType.USAGE_TYPE:
			case BillingType.MIMIC:
				return p as UsageProduct;
			case BillingType.METERED_HIGHWATER:
			case BillingType.METERED_SUM:
				return p as MeteredProduct;
			case BillingType.FLAT_FEE:
				return p as FlatFeeProduct;
		}
		console.error('unexpected error on product types');
		return p as UsageProduct;
	});

	return ret;
};

// Method to add an appId to the requiredAppIds. Creates the array if property undefined
const addRequiredAppId = (billableApp: BillableAppJSON, appId: string) => {
	if (billableApp.requiredAppIds === undefined) {
		billableApp.requiredAppIds = [[]];
	}
	billableApp.requiredAppIds[0].push(appId);
};

// Method to add an appId to the optionalAppIds. Creates the array if property undefined
const addOptionalAppId = (billableApp: BillableAppJSON, appId: string) => {
	if (billableApp.optionalAppIds === undefined) {
		billableApp.optionalAppIds = [];
	}
	billableApp.optionalAppIds.push(appId);
};

const serializeProducts = (products: (UsageProduct | MeteredProduct | FlatFeeProduct)[], vendorEmail: string): JSONFileData[] => {
	let ret: JSONFileData[] = [];

	products.forEach((p) => {
		ret = ret.concat(serializeProduct(p, vendorEmail));
	});

	return ret;
};

// Serialize the product (for billable files) and returns an array with json data.
// The array can include the optional quickstart json file.
// NOTE: If addon, ignore the productNames for now.
const serializeProduct = (
	product: UsageProduct | MeteredProduct | FlatFeeProduct,
	vendorEmail: string,
	includeQuickStart: boolean = true
): JSONFileData[] => {
	const ret: JSONFileData[] = [];
	const isAddOn = product.isAddOn;
	const productName = camelCase(product.name);
	const licenseName = getLicenseName(product.name);
	const fileName = `${productName}${isAddOn ? '' : 'Integration'}`;
	const billableAppContent: BillableAppJSON = {
		vendorEmail: vendorEmail,
		definitions: [],
	};

	// Build the definitions part of the product
	switch (product.type) {
		case BillingType.USAGE_TYPE: {
			const usageProduct = product as UsageProduct;
			const namedDefinition: UsageNamedDefinition = {
				partNumber: '',
				type: 'usage',
				licenseName: licenseName,
				productNames: isAddOn ? [] : [productName],
				unitOfMeasure: 'user',
			};
			const concDefinition: UsageConcurrentDefinition = {
				partNumber: '',
				type: 'concurrent',
				licenseName: licenseName,
				productNames: isAddOn ? [] : [productName],
				unitOfMeasure: 'user',
			};

			// monthly commits
			if (usageProduct.namedBilling.minMonthlyCommit) namedDefinition.qualifiesForMinimumCommit = true;
			if (usageProduct.concurrentBilling.minMonthlyCommit) concDefinition.qualifiesForMinimumCommit = true;

			billableAppContent.definitions.push(namedDefinition);
			billableAppContent.definitions.push(concDefinition);
			break;
		}
		case BillingType.MIMIC: {
			const mimicProduct = product as UsageProduct;
			const namedDefinition: MimicDefinition = {
				partNumber: '',
				type: 'mimic',
				mimicPartNumbers: ['', '', '', '', '', '', '', '', '', ''],
				productNames: isAddOn ? [] : [productName],
				unitOfMeasure: 'user',
			};
			const concDefinition: MimicDefinition = {
				partNumber: '',
				type: 'mimic',
				mimicPartNumbers: ['', '', '', '', ''],
				productNames: isAddOn ? [] : [productName],
				unitOfMeasure: 'user',
			};
			// monthly commits
			if (mimicProduct.namedBilling.minMonthlyCommit) namedDefinition.qualifiesForMinimumCommit = true;
			if (mimicProduct.concurrentBilling.minMonthlyCommit) concDefinition.qualifiesForMinimumCommit = true;

			billableAppContent.definitions.push(namedDefinition);
			billableAppContent.definitions.push(concDefinition);
			break;
		}
		case BillingType.METERED_HIGHWATER: {
			const meteredProduct = product as MeteredProduct;
			const definition: MeteredHWMDefinition = {
				partNumber: '',
				type: 'meteredHighwaterMark',
				productNames: isAddOn ? [] : [productName],
				unitOfMeasure: meteredProduct.billing?.unitOfMeasure || UnitOfMeasure.UNIT,
			};
			if (meteredProduct.billing.minMonthlyCommit) definition.qualifiesForMinimumCommit = true;

			billableAppContent.definitions.push(definition);
			break;
		}
		case BillingType.METERED_SUM: {
			const meteredProduct = product as MeteredProduct;
			const definition: MeteredSumDefinition = {
				partNumber: '',
				type: 'meteredSum',
				productNames: isAddOn ? [] : [productName],
				unitOfMeasure: meteredProduct.billing?.unitOfMeasure || UnitOfMeasure.UNIT,
			};
			if (meteredProduct.billing.minMonthlyCommit) definition.qualifiesForMinimumCommit = true;

			billableAppContent.definitions.push(definition);
			break;
		}
		case BillingType.FLAT_FEE:
			billableAppContent.definitions.push({
				partNumber: '',
				type: 'recurring',
				productNames: isAddOn ? [] : [productName],
				unitOfMeasure: 'license',
			});
			break;
	}

	// Create a quickstart file if needed
	if (product.startupFee && includeQuickStart) {
		const startupFileName = `${productName}QuickStart`;
		const quickStartJSON: QuickStartJSON = {
			vendorEmail: vendorEmail,
			definitions: [
				{
					partNumber: '',
					type: 'quickStart',
					productNames: [],
					unitOfMeasure: 'unit',
				},
			],
		};

		// Add the reference to the main billable product
		if (product.startupFee.required) {
			addRequiredAppId(billableAppContent, startupFileName);
		} else {
			addOptionalAppId(billableAppContent, startupFileName);
		}

		// Add the quickstart to return JSON data
		ret.push({
			fileName: `${startupFileName}.json`,
			json: JSON.stringify(quickStartJSON, null, 4),
		});
	}

	// Include the required or optional add-ons
	if (product.requires) {
		product.requires.forEach((addOn) => {
			addRequiredAppId(billableAppContent, camelCase(addOn.name));
		});
	}
	if (product.optional) {
		product.optional.forEach((addOn) => {
			addOptionalAppId(billableAppContent, camelCase(addOn.name));
		});
	}

	// Add the product data
	ret.push({
		fileName: `${fileName}.json`,
		json: JSON.stringify(billableAppContent, null, 4),
	});

	return ret;
};

// Generate and zip the billable files into billable-apps folder
const zipBillableFiles = (zip: JSZip, formData: SKUFormData) => {
	// Generate the json data for billable-apps
	const jsons = serializeProducts(restrictProductType(formData.products), formData.details.subNotificationEmail);
	const billableApps = zip.folder('billable-apps');
	if (!billableApps) {
		console.error("can't create zip folder billable apps");
		return;
	}
	jsons.forEach((j) => {
		billableApps.file(j.fileName, j.json);
	});
};

// Generate product files for donut
// NOTE: for now just makes product from 'base' rpoducts
const zipDonutProducts = (zip: JSZip, formData: SKUFormData) => {
	//  Generates json for donut 'products'
	const products = zip.folder('products');
	if (!products) {
		console.error('error on creating products folder');
		return;
	}

	const productFiles: JSONFileData[] = [];

	// Create index-mapped array of serialized products. This is so we can get the billabel appd efinition
	// but still associate it with the product description from form products
	const baseProducts = formData.products.filter((p) => !p.isAddOn);
	const billableAppArr = restrictProductType(baseProducts).map((p) => {
		const serializedProd = serializeProduct(p, formData.details.subNotificationEmail, false);
		return serializedProd[0];
	});

	billableAppArr.forEach((app, i) => {
		const appData: BillableAppJSON = JSON.parse(app.json);
		appData.definitions.forEach((d) => {
			if (!d.productNames || d.productNames.length <= 0) return;

			// NOTE: Get only the first productName since most common pattern is having only one.
			const productName = d.productNames[0];

			const donutEntry: DonutProduct = {
				id: productName,
				description: baseProducts[i].description,
			};
			const fileData: JSONFileData = {
				fileName: `${productName}.json`,
				json: JSON.stringify(donutEntry, null, 4),
			};

			// Add only if there's not already existing with same productName
			if (productFiles.find((p) => p.fileName === `${productName}.json`)) return;
			productFiles.push(fileData);
		});
	});

	// Add product files to zip
	productFiles.forEach((p) => {
		products.file(p.fileName, p.json);
	});
};

// Generate JSON licenses for usage types.
// Based on billable-apps licensename. For now all usage (including add-ons) will have unique licenseName
// based on their product name.
const zipDonutLicenses = (zip: JSZip, formData: SKUFormData) => {
	// Generates json for donut 'licenses'
	const licenses = zip.folder('licenses');
	if (!licenses) {
		console.error('error on creating licenses folder');
		return;
	}
	const licenseEntries: LicenseEntry[] = [];

	formData.products
		.filter((p) => p.type === BillingType.USAGE_TYPE)
		.forEach((p) => {
			licenseEntries.push({
				id: getLicenseName(p.name),
				description: `${p.name} - User License`,
				// NOTE: For now If usage is an addon instead of base, keep empty products.
				products: [p.isAddOn ? '' : camelCase(p.name)],
				permissions: ['integration:'],
			});
		});

	licenses.file('pureCloudLicenses.json', JSON.stringify(licenseEntries, null, 4));
};

// Create the CSV file representation for the form values
// TODO: Getting chunky. Probably move this as its own class
const zipCSVFile = (zip: JSZip, formData: SKUFormData) => {
	// Create an array of strings representing the required or optional add-ons
	// This also checks the possible special entry of a quickstart 'product'
	const createDependencyArr = (product: UsageProduct | MeteredProduct | FlatFeeProduct, requiredDeps: boolean): string => {
		// Add the dependencies (except startup fee)
		const ret = requiredDeps ? product.requires?.map((p) => p.name) || [] : product.optional?.map((p) => p.name) || [];
		// Add startup fee
		if (product.startupFee && product.startupFee.required === requiredDeps) ret.push(product.startupFee.name);

		return ret.join(', ');
	};

	// Create a new CSV file in the zip.
	// Return the filename of the csv file
	const addTieredBillingCsv = (zip: JSZip, product: UsageProduct | MeteredProduct | FlatFeeProduct, billingData: BillingData): string => {
		// make sure there is tiers data
		if (!billingData.useTiers || billingData.tiers?.length === undefined || billingData.tiers.length === 0) return 'n/a';
		const fileName = `${TIERED_PREFIX}${product.id}-${camelCase(product.name)}.csv`;

		const tieredCSVGen = new CSVGenerator<TieredBillingCSV>(['from', 'to', 'annualPrepay', 'annualM2M']);
		tieredCSVGen.addRow({
			from: '0',
			to: (billingData.tiers[0].range.from - 1).toString(),
			annualPrepay: billingData.annualPrepay.toString(),
			annualM2M: billingData.annualMonthToMonth.toString(),
		});

		billingData.tiers.forEach((t) => {
			tieredCSVGen.addRow({
				from: t.range.from.toString(),
				to: t.range.to.toString(),
				annualPrepay: t.annualPrepay.toString(),
				annualM2M: t.annualMonthToMonth.toString(),
			});
		});

		zip.file(fileName, tieredCSVGen.generateCSV());
		return fileName;
	};

	// ------- Contact Details -------------
	const details = formData.details;
	const contactCSVGen = new CSVGenerator<GeneralDetails>([
		'subNotificationEmail',
		'salesLeadEmail',
		'productTOS',
		'quoteNotes',
		'currency',
	]);
	contactCSVGen.addRow({
		subNotificationEmail: details.subNotificationEmail,
		salesLeadEmail: details.salesLeadEmail,
		productTOS: details.productTOS,
		quoteNotes: details.quoteNotes,
		currency: details.currency,
	});
	zip.file('contactDetails.csv', contactCSVGen.generateCSV());

	// ------- Billing Entries -----------
	// Header Part
	const products = formData.products;
	const appsCSVGen = new CSVGenerator<SKUTemplateCSV>(SKUTemplateHeaders);

	// Billing content
	products.forEach((p) => {
		// Products and reference to the addons
		switch (p.type) {
			case BillingType.USAGE_TYPE:
			case BillingType.MIMIC: {
				const usageP = p as UsageProduct;

				// Usage named billing
				appsCSVGen.addRow({
					productName: usageP.name,
					productDescription: usageP.description,
					premiumAppType: usageP.type,
					unitOfMeasure: UsageUnit.NAMED,
					annualPrepay: usageP.namedBilling.annualPrepay.toString(),
					annualM2M: usageP.namedBilling.annualMonthToMonth.toString(),
					m2m: usageP.namedBilling.monthToMonth?.toString() || 'n/a',
					tieredBilling: addTieredBillingCsv(zip, usageP, usageP.namedBilling),
					minMonthlyCommit: usageP.namedBilling.minMonthlyCommit?.toString() || 'n/a',
					required: createDependencyArr(usageP, true),
					optional: createDependencyArr(usageP, false),
					notes: usageP.notes || 'none',
				});

				// Usage concurrent billing
				appsCSVGen.addRow({
					productName: usageP.name,
					productDescription: usageP.description,
					premiumAppType: usageP.type,
					unitOfMeasure: UsageUnit.CONCURRENT,
					annualPrepay: usageP.concurrentBilling.annualPrepay.toString(),
					annualM2M: usageP.concurrentBilling.annualMonthToMonth.toString(),
					m2m: usageP.concurrentBilling.monthToMonth?.toString() || 'n/a',
					tieredBilling: addTieredBillingCsv(zip, usageP, usageP.concurrentBilling),
					minMonthlyCommit: usageP.concurrentBilling.minMonthlyCommit?.toString() || 'n/a',
					required: createDependencyArr(usageP, true),
					optional: createDependencyArr(usageP, false),
					notes: usageP.notes || 'none',
				});

				break;
			}
			case BillingType.METERED_SUM:
			case BillingType.METERED_HIGHWATER: {
				const meteredP = p as MeteredProduct;
				appsCSVGen.addRow({
					productName: meteredP.name,
					productDescription: meteredP.description,
					premiumAppType: meteredP.type,
					unitOfMeasure: meteredP.billing.unitOfMeasure || 'ERROR',
					annualPrepay: meteredP.billing.annualPrepay.toString(),
					annualM2M: meteredP.billing.annualMonthToMonth.toString(),
					m2m: meteredP.billing.monthToMonth?.toString() || 'n/a',
					tieredBilling: addTieredBillingCsv(zip, meteredP, meteredP.billing),
					minMonthlyCommit: meteredP.billing.minMonthlyCommit?.toString() || 'n/a',
					required: createDependencyArr(meteredP, true),
					optional: createDependencyArr(meteredP, false),
					notes: meteredP.notes || 'none',
				});

				break;
			}
		}

		// Quickstart Fee
		if (!p.startupFee) return;
		const quickStart = p.startupFee as StartUpFee;

		appsCSVGen.addRow({
			productName: quickStart.name,
			productDescription: quickStart.description,
			premiumAppType: 'QuickStart',
			unitOfMeasure: '',
			annualPrepay: quickStart.oneTimeFee.toString(),
			annualM2M: quickStart.oneTimeFee.toString(),
			m2m: '',
			tieredBilling: '',
			minMonthlyCommit: '',
			required: '',
			optional: '',
			notes: '',
		});
	});
	zip.file('SKUTemplate.csv', appsCSVGen.generateCSV());
};

// Zip the json files and download the zip file
export async function exportData(formData: SKUFormData) {
	const zip = new JSZip();

	zipBillableFiles(zip, formData);
	zipDonutProducts(zip, formData);
	zipDonutLicenses(zip, formData);
	zipCSVFile(zip, formData);

	// Download zip
	const content = await zip.generateAsync({ type: 'blob' });
	FileSaver.saveAs(content, `premium-app-billing-data.zip`);
}

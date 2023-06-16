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
} from './types';
import camelCase from 'camelcase';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { StartUpFee } from './types';

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

// Serialize the product and returns an array with json data.
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
	let tmpObj; // for temporary casting to specific interfaces
	switch (product.type) {
		case BillingType.USAGE_TYPE:
			billableAppContent.definitions.push({
				partNumber: '',
				type: 'usage',
				licenseName: licenseName,
				productNames: isAddOn ? [] : [productName],
				unitOfMeasure: 'user',
			});
			billableAppContent.definitions.push({
				partNumber: '',
				type: 'concurrent',
				licenseName: licenseName,
				productNames: isAddOn ? [] : [productName],
				unitOfMeasure: 'user',
			});
			break;
		case BillingType.MIMIC:
			billableAppContent.definitions.push({
				partNumber: '',
				type: 'mimic',
				mimicPartNumbers: ['', '', '', '', '', '', '', '', '', ''],
				productNames: isAddOn ? [] : [productName],
				unitOfMeasure: 'user',
			});
			billableAppContent.definitions.push({
				partNumber: '',
				type: 'mimic',
				mimicPartNumbers: ['', '', '', '', ''],
				productNames: isAddOn ? [] : [productName],
				unitOfMeasure: 'user',
			});
			break;
		case BillingType.METERED_HIGHWATER:
			tmpObj = product as MeteredProduct;
			billableAppContent.definitions.push({
				partNumber: '',
				type: 'meteredHighwaterMark',
				productNames: isAddOn ? [] : [productName],
				unitOfMeasure: tmpObj.billing?.unitOfMeasure || UnitOfMeasure.UNIT,
			});
			break;
		case BillingType.METERED_SUM:
			tmpObj = product as MeteredProduct;
			billableAppContent.definitions.push({
				partNumber: '',
				type: 'meteredSum',
				productNames: isAddOn ? [] : [productName],
				unitOfMeasure: tmpObj.billing?.unitOfMeasure || UnitOfMeasure.UNIT,
			});
			break;
		case BillingType.FLAT_FEE:
			tmpObj = product as FlatFeeProduct;
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
	// Add a CSV row to an existing csv string.
	const addCSVRow = (targetCsv: string, srcArr: string[]): string => {
		// TODO: add some handling and csv validation. if becomes more complicated jsut use some library
		return targetCsv + `${srcArr.join()}\n`;
	};

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
		const fileName = `tiered-${product.id}-${camelCase(product.name)}.csv`;

		// build csv
		let tieredCsv = addCSVRow('', ['From', 'To', 'Annual Prepay', 'Annual Month-to-Month']);
		tieredCsv = addCSVRow(tieredCsv, [
			'0',
			(billingData.tiers[0].range.from - 1).toString(),
			billingData.annualPrepay.toString(),
			billingData.annualMonthToMonth.toString(),
		]);
		billingData.tiers.forEach((t) => {
			tieredCsv = addCSVRow(tieredCsv, [
				t.range.from.toString(),
				t.range.to.toString(),
				t.annualPrepay.toString(),
				t.annualMonthToMonth.toString(),
			]);
		});

		zip.file(fileName, tieredCsv);
		return fileName;
	};

	// ------- Contact Details -------------
	const details = formData.details;
	let detailsCSV = addCSVRow('', ['Subscription Notification Email', 'Sales Lead Email', 'TOS', 'How to Quote the Product']);
	detailsCSV = addCSVRow(detailsCSV, [details.subNotificationEmail, details.salesLeadEmail, details.productTOS, details.quoteNotes]);
	zip.file('contactDetails.csv', detailsCSV);

	// ------- Billing Entries -----------
	// Header Part
	const products = formData.products;
	let billingCSV = addCSVRow('', [
		'Product Name',
		'Product Description',
		'Premium App Type',
		'Unit of Measure',
		'Annual Prepay',
		'Annual Month-to-Month',
		'Month-to-month',
		'Discount Billing (Tiered)',
		'Required Add-ons',
		'Optional Add-ons',
		'Notes',
	]);
	// Billing content
	products.forEach((p) => {
		// Products and reference to the addons
		switch (p.type) {
			case BillingType.USAGE_TYPE:
			case BillingType.MIMIC: {
				const usageP = p as UsageProduct;
				// Usage named billing
				billingCSV = addCSVRow(billingCSV, [
					usageP.name,
					usageP.description,
					usageP.type,
					'User',
					usageP.namedBilling.annualPrepay.toString(),
					usageP.namedBilling.annualMonthToMonth.toString(),
					usageP.namedBilling.monthToMonth?.toString() || 'n/a',
					addTieredBillingCsv(zip, usageP, usageP.namedBilling),
					createDependencyArr(usageP, true),
					createDependencyArr(usageP, false),
					usageP.notes || 'none',
				]);
				// Usage concurrent billing
				billingCSV = addCSVRow(billingCSV, [
					usageP.name,
					usageP.description,
					usageP.type,
					'User',
					usageP.concurrentBilling.annualPrepay.toString(),
					usageP.concurrentBilling.annualMonthToMonth.toString(),
					usageP.concurrentBilling.monthToMonth?.toString() || 'n/a',
					addTieredBillingCsv(zip, usageP, usageP.concurrentBilling),
					createDependencyArr(usageP, true),
					createDependencyArr(usageP, false),
					usageP.notes || 'none',
				]);
				break;
			}
			case BillingType.METERED_SUM:
			case BillingType.METERED_HIGHWATER: {
				const meteredP = p as MeteredProduct;
				billingCSV = addCSVRow(billingCSV, [
					meteredP.name,
					meteredP.description,
					meteredP.type,
					meteredP.billing.unitOfMeasure || 'ERROR',
					meteredP.billing.annualPrepay.toString(),
					meteredP.billing.annualMonthToMonth.toString(),
					meteredP.billing.monthToMonth?.toString() || 'n/a',
					// TODO: Metered billing only uses M2M. So need to refactor somewhere to correctly serialize it.
					addTieredBillingCsv(zip, meteredP, meteredP.billing),
					createDependencyArr(meteredP, true),
					createDependencyArr(meteredP, false),
					meteredP.notes || 'none',
				]);
				break;
			}
		}

		// Quickstart Fee
		if (!p.startupFee) return;
		const quickStart = p.startupFee as StartUpFee;
		billingCSV = addCSVRow(billingCSV, [
			quickStart.name,
			quickStart.description,
			'QuickStart',
			'',
			quickStart.oneTimeFee.toString(),
			quickStart.oneTimeFee.toString(),
			'',
			'',
			'',
			'',
		]);
	});
	zip.file('SKUTemplate.csv', billingCSV);
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

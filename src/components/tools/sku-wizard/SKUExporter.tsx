import { SKUFormData, UsageProduct, MeteredProduct, FlatFeeProduct, EmptyProduct, BillingType, UnitOfMeasure } from './types';
import camelCase from 'camelcase';
import JSZip from 'jszip';
import FileSaver from 'file-saver';

interface JSONFileData {
	fileName: string;
	json: string;
}

interface BillableAppJSON {
	vendorEmail: string;
	definitions: (
		| UsageNamedDefinition
		| UsageConcurrentDefinition
		| MimicDefinition
		| MeteredHWMDefinition
		| MeteredSumDefinition
		| LicenseDefinition
	)[];
	optionalAppIds?: string[];
	requiredAppIds?: string[][];
}

interface QuickStartJSON {
	vendorEmail: string;
	definitions: QuickStartDefinition[];
}

interface UsageNamedDefinition {
	partNumber: string;
	type: 'usage';
	licenseName: string;
	productNames: string[];
	unitOfMeasure: 'user';
}

interface UsageConcurrentDefinition {
	partNumber: string;
	type: 'concurrent';
	licenseName: string;
	productNames: string[];
	unitOfMeasure: 'user';
}

interface MimicDefinition {
	partNumber: string;
	type: 'mimic';
	mimicPartNumbers: string[];
	unitOfMeasure: 'user';
	productNames?: string[];
}

interface MeteredHWMDefinition {
	partNumber: string;
	type: 'meteredHighwaterMark';
	unitOfMeasure: UnitOfMeasure;
	productNames?: string[];
}

interface MeteredSumDefinition {
	partNumber: string;
	type: 'meteredSum';
	unitOfMeasure: UnitOfMeasure;
	productNames?: string[];
}

interface LicenseDefinition {
	partNumber: string;
	type: 'recurring';
	unitOfMeasure: 'license';
	productNames?: string[];
}

interface QuickStartDefinition {
	partNumber: string;
	type: 'quickStart';
	productNames: [];
	unitOfMeasure: 'unit';
}

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
const serializeProduct = (product: UsageProduct | MeteredProduct | FlatFeeProduct, vendorEmail: string): JSONFileData[] => {
	const ret: JSONFileData[] = [];
	const isAddOn = product.isAddOn;
	const productName = camelCase(product.name);
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
				licenseName: productName,
				productNames: isAddOn ? [] : [productName],
				unitOfMeasure: 'user',
			});
			billableAppContent.definitions.push({
				partNumber: '',
				type: 'concurrent',
				licenseName: productName,
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
	if (product.startupFee) {
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

		// Add to return JSON data
		ret.push({
			fileName: `${startupFileName}.json`,
			json: JSON.stringify(quickStartJSON),
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
		json: JSON.stringify(billableAppContent),
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

const zipDonutProducts = (zip: JSZip, formData: SKUFormData) => {
	//  Generates json for donut 'products'
	const products = zip.folder('products');
};

const zipDonutLicenses = (zip: JSZip, formData: SKUFormData) => {
	// Generates json for donut 'licenses'
	const licenses = zip.folder('licenses');
};

// Zip the json files and download the zip file
export async function exportData(formData: SKUFormData) {
	const zip = new JSZip();

	zipBillableFiles(zip, formData);
	zipDonutProducts(zip, formData);
	zipDonutLicenses(zip, formData);

	// Download zip
	const content = await zip.generateAsync({ type: 'blob' });
	FileSaver.saveAs(content, `premium-app-billing-data.zip`);
}

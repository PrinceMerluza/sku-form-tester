export interface SKUFormData {
	details: GeneralDetails;
	products: (UsageProduct | MeteredProduct | FlatFeeProduct | EmptyProduct)[];
}

export interface GeneralDetails {
	subNotificationEmail: string;
	salesLeadEmail: string;
	productTOS: string;
	quoteNotes: string;
	currency: string;
}

// Just for adding an empty product to the list with unknown type/config
export interface EmptyProduct {
	id: string; // used for providing ID to dynamic component
	[key: string]: any;
}

export interface UsageProduct {
	id: string; // used for providing ID to dynamic component
	name: string;
	description: string;
	type: BillingType.MIMIC | BillingType.USAGE_TYPE;
	namedBilling: BillingData;
	concurrentBilling: BillingData;
	startupFee?: StartUpFee;
	requires?: (UsageProduct | MeteredProduct | FlatFeeProduct | EmptyProduct)[];
	optional?: (UsageProduct | MeteredProduct | FlatFeeProduct | EmptyProduct)[];
	notes?: string;
	isAddOn?: boolean;
}

export interface MeteredProduct {
	id: string; // used for providing ID to dynamic component
	name: string;
	description: string;
	type: BillingType.METERED_HIGHWATER | BillingType.METERED_SUM;
	billing: BillingData;
	startupFee?: StartUpFee;
	requires?: (UsageProduct | MeteredProduct | FlatFeeProduct | EmptyProduct)[];
	optional?: (UsageProduct | MeteredProduct | FlatFeeProduct | EmptyProduct)[];
	notes?: string;
	isAddOn?: boolean;
}

export interface FlatFeeProduct {
	id: string; // used for providing ID to dynamic component
	name: string;
	description: string;
	type: BillingType.FLAT_FEE;
	billing: BillingData;
	startupFee?: StartUpFee;
	requires?: (UsageProduct | MeteredProduct | FlatFeeProduct | EmptyProduct)[];
	optional?: (UsageProduct | MeteredProduct | FlatFeeProduct | EmptyProduct)[];
	notes?: string;
	isAddOn?: boolean;
}

export interface StartUpFee {
	name: string;
	description: string;
	oneTimeFee: number;
	required: boolean;
}

export interface BillingData {
	annualPrepay: number;
	annualMonthToMonth: number;

	unitOfMeasure?: UnitOfMeasure; // for metered apps
	monthToMonth?: number; // used for metered apps instead of annuals

	minMonthlyCommit?: number;
	useTiers?: boolean;
	tiers?: BillingTier[];
	[key: string]: any; // for updating state method
}

export interface BillingTier {
	id: string; // used for providing ID to dynamic component
	range: BillingTierRange;
	annualPrepay: number;
	annualMonthToMonth: number;
}

export interface BillingTierRange {
	from: number;
	to: number;
}

export enum BillingType {
	USAGE_TYPE = 'Usage Type',
	MIMIC = 'Mimic',
	METERED_HIGHWATER = 'Metered Highwater',
	METERED_SUM = 'Metered Sum',
	ONE_TIME = 'One-Time Fee',
	FLAT_FEE = 'Flat Fee',
}

// based on billing-billable-apps/src/BillableAppUnitOfMeasureTypes.js
export enum UnitOfMeasure {
	CHARACTER = 'character',
	DIGITAL_INTERACTION = 'digital-interaction',
	EVENT = 'event',
	GB = 'gb',
	HOUR = 'hour',
	INSTANCE = 'instance',
	INVOCATION = 'invocation',
	LICENSE = 'license',
	MINUTE = 'minute',
	REQUEST = 'request',
	SECOND = 'second',
	SEGMENT = 'segment',
	STREAM = 'stream',
	TRANSACTION = 'transaction',
	UNIT = 'unit',
	USAGE = 'usage',
	USER = 'user',
	WEB_VISIT = 'web-visit',
}

// EXPORTER / IMPORTER
export interface JSONFileData {
	fileName: string;
	json: string;
}

export interface BillableAppJSON {
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

export interface QuickStartJSON {
	vendorEmail: string;
	definitions: QuickStartDefinition[];
}

export interface UsageNamedDefinition {
	partNumber: string;
	type: 'usage';
	licenseName: string;
	productNames: string[];
	unitOfMeasure: 'user';
}

export interface UsageConcurrentDefinition {
	partNumber: string;
	type: 'concurrent';
	licenseName: string;
	productNames: string[];
	unitOfMeasure: 'user';
}

export interface MimicDefinition {
	partNumber: string;
	type: 'mimic';
	mimicPartNumbers: string[];
	unitOfMeasure: 'user';
	productNames?: string[];
}

export interface MeteredHWMDefinition {
	partNumber: string;
	type: 'meteredHighwaterMark';
	unitOfMeasure: UnitOfMeasure;
	productNames?: string[];
}

export interface MeteredSumDefinition {
	partNumber: string;
	type: 'meteredSum';
	unitOfMeasure: UnitOfMeasure;
	productNames?: string[];
}

export interface LicenseDefinition {
	partNumber: string;
	type: 'recurring';
	unitOfMeasure: 'license';
	productNames?: string[];
}

export interface QuickStartDefinition {
	partNumber: string;
	type: 'quickStart';
	productNames: [];
	unitOfMeasure: 'unit';
}

export interface LicenseEntry {
	id: string;
	description: string;
	products: string[];
	permissions: string[];
}

export interface DonutProduct {
	id: string;
	description: string;
}

export interface SKUTemplateCSV {
	'Product Name': string;
	'Product Description': string;
	'Premium App Type': string;
	'Unit of Measure': string;
	'Annual Prepay': string;
	'Annual Month-to-Month': string;
	'Month-to-month': string;
	'Discount Billing (Tiered)': string;
	'Required Add-ons': string;
	'Optional Add-ons': string;
	Notes: string;
}

// For export as 'unit of measurement'
export enum UsageUnit {
	NAMED = 'User (Named)',
	CONCURRENT = 'User (Concurrent)',
}

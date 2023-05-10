export interface FormData {
	details: GeneralDetails;
	products: (UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct | EmptyProduct)[];
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
	requires?: (UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct | EmptyProduct)[];
	optional?: (UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct | EmptyProduct)[];
}

export interface MeteredProduct {
	id: string; // used for providing ID to dynamic component
	name: string;
	description: string;
	type: BillingType.METERED_HIGHWATER | BillingType.METERED_SUM;
	billing: BillingData;
	requires?: (UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct | EmptyProduct)[];
	optional?: (UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct | EmptyProduct)[];
}

export interface FlatFeeProduct {
	id: string; // used for providing ID to dynamic component
	name: string;
	description: string;
	type: BillingType.FLAT_FEE;
	billing: BillingData;
	requires?: (UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct | EmptyProduct)[];
	optional?: (UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct | EmptyProduct)[];
}

export interface OneTimeProduct {
	id: string; // used for providing ID to dynamic component
	name: string;
	description: string;
	type: BillingType.ONE_TIME;
	oneTimeFee: number;
}

export interface BillingData {
	annualPrepay: number;
	annualMonthToMonth: number;

	unitOfMeasure?: string; // for metered apps
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

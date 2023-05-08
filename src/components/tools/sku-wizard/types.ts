export interface FormData {
	details: GeneralDetails;
	products: (UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct)[];
}

export interface GeneralDetails {
	subNotificationEmail: string;
	salesLeadEmail: string;
	productTOS: string;
	quoteNotes: string;
	currency: string;
}

export interface UsageProduct {
	id: string; // used for providing ID to dynamic component
	name: string;
	description: string;
	type: BillingType.MIMIC | BillingType.USAGE_TYPE;
	namedBilling: BillingData;
	concurrentBilling: BillingData;
	requires: (UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct)[];
	optional: (UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct)[];
}

export interface MeteredProduct {
	id: string; // used for providing ID to dynamic component
	name: string;
	description: string;
	type: BillingType.METERED_HIGHWATER | BillingType.METERED_SUM;
	billing: BillingData;
	requires: (UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct)[];
	optional: (UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct)[];
}

export interface FlatFeeProduct {
	id: string; // used for providing ID to dynamic component
	name: string;
	description: string;
	billing: BillingData;
	requires: (UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct)[];
	optional: (UsageProduct | MeteredProduct | FlatFeeProduct | OneTimeProduct)[];
}

export interface OneTimeProduct {
	id: string; // used for providing ID to dynamic component
	name: string;
	description: string;
	oneTimeFee: number;
}

export interface BillingData {
	annualPrepay: number;
	annualMonthToMonth: number;
	unitOfMeasure?: string;
	monthToMonth?: number;
	useTiers?: boolean;
	tiers?: BillingTier[];
	[key: string]: any;
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
}

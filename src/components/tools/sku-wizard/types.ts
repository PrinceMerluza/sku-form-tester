export interface PremiumAppSKUs {
	subNotificationEmail: string;
	salesLeadEmail: string;
	productTOS: string;
	quoteNotes: string;
	currency: string;
	skus: SKU[];
}

export interface SKU {
	id: string; // used for providing ID to dynamic component
	name: string;
	description: string;
	billingData?: BillingData;
}

export interface BillingData {
	type: BillingType;
	annualPrepay: number;
	annualMonthToMonth: number;
	unitOfMeasure?: string;
	monthToMonth?: number;
	oneTimeFee?: number;
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

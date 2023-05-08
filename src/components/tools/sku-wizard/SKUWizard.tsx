import React, { useState } from 'react';
import { DxButton, DxItemGroupItem } from 'genesys-react-components';
import { BillingType } from './types';

import './SKUWizard.scss';

interface IProps {
	onSelectedType: (bilingType: BillingType) => void;
}

enum Page {
	APP_TYPE,
	USAGE_TYPE,
	METERED_TYPE,
	MIMIC_TYPE,
	AMOUNTS,
}

/**
 * The actual 'wizard' part where the user is walked through a navigation of pages to determine,
 * billing type and values. Can only be used inside an SKUForm component and billingData is required
 * to be passed
 * @param props
 */
export default function SKUWizard(props: IProps) {
	const onSelectedType = props.onSelectedType;
	const [activePage, setActivePage] = useState<Page>(Page.APP_TYPE);

	// First page of billing type selection
	const getAppTypeSelection = () => {
		return (
			<div className="type-selection">
				<div className="nav-header">
					<span className="guide-text">How would you like to bill this product?</span>
				</div>
				<div className="type-selection-options">
					<div className="type-selection-option">
						<DxButton type="primary" onClick={() => navigateTo(Page.USAGE_TYPE)}>
							Per User
						</DxButton>
						<div>If you're billing based on the amount of users</div>
					</div>
					<div className="type-selection-option">
						<DxButton type="primary" onClick={() => navigateTo(Page.METERED_TYPE)}>
							Metered
						</DxButton>
						<div>If you're billing based on metered usage. eg. Number of requests, hours, etc.</div>
					</div>
					<div className="type-selection-option">
						<DxButton
							type="primary"
							onClick={() => {
								onSelectedType(BillingType.FLAT_FEE);
							}}
						>
							Flat Fee
						</DxButton>
						<div>If you're billing on a flat fee regardless of users or usage. Commonly used for product licenses.</div>
					</div>
					<div className="type-selection-option">
						<DxButton
							type="primary"
							onClick={() => {
								onSelectedType(BillingType.ONE_TIME);
							}}
						>
							One Time Fee
						</DxButton>
						<div>
							One-time fee is used for Quick-start or setup fees. The product needs to be linked via required or optional dependecy.
						</div>
					</div>
				</div>
			</div>
		);
	};

	const getUsageTypeSelection = () => {
		return (
			<div className="type-selection">
				<div className="nav-header">
					<DxButton type="primary" onClick={() => navigateTo(Page.APP_TYPE)}>
						Back
					</DxButton>
					<span className="guide-text">How would you like to bill this product?</span>
				</div>
				<div className="type-selection-options">
					<div className="type-selection-option">
						<DxButton
							type="primary"
							onClick={() => {
								onSelectedType(BillingType.USAGE_TYPE);
							}}
						>
							Permission Based
						</DxButton>
						<div>
							A special permission is created for the org. Only users with the specific permission and logged in on the month will be
							billed.
						</div>
					</div>
					<div className="type-selection-option">
						<DxButton
							type="primary"
							onClick={() => {
								onSelectedType(BillingType.MIMIC);
							}}
						>
							Per Agent Seat (Mimic)
						</DxButton>
						<div>All users with the agent license in the org will be billed</div>
					</div>
				</div>
			</div>
		);
	};

	const getMeteredTypeSelection = () => {
		return (
			<div className="type-selection">
				<div className="nav-header">
					<DxButton type="primary" onClick={() => navigateTo(Page.APP_TYPE)}>
						Back
					</DxButton>
					<span className="guide-text">How would you like to bill this product?</span>
				</div>
				<div className="type-selection-options">
					<div className="type-selection-option">
						<DxButton
							type="primary"
							onClick={() => {
								onSelectedType(BillingType.METERED_SUM);
							}}
						>
							Metered Sum Usage
						</DxButton>
						<div>Ideal for unit types such as minutes, API hits, visits, interactions, storage gigs, etc.</div>
					</div>
					<div className="type-selection-option">
						<DxButton
							type="primary"
							onClick={() => {
								onSelectedType(BillingType.METERED_HIGHWATER);
							}}
						>
							Metered High Water Mark
						</DxButton>
						<div>Ideal for unit types without much fluctation such as Wallboards</div>
					</div>
				</div>
			</div>
		);
	};

	const navigateTo = (page: Page) => {
		setActivePage(page);
	};

	return (
		<div className="sku-editor-navigation">
			{activePage === Page.APP_TYPE ? getAppTypeSelection() : null}
			{activePage === Page.USAGE_TYPE ? getUsageTypeSelection() : null}
			{activePage === Page.METERED_TYPE ? getMeteredTypeSelection() : null}
		</div>
	);
}

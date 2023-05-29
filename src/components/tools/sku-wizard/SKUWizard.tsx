import React, { useState } from 'react';
import { DxButton, DxItemGroupItem } from 'genesys-react-components';
import { BillingType, StartUpFee } from './types';

import './SKUWizard.scss';

interface IProps {
	onSelectedType: (bilingType: BillingType) => void;
	setOneTimeFee: React.Dispatch<React.SetStateAction<StartUpFee | undefined>>;
}

enum Page {
	APP_TYPE,
	USAGE_TYPE,
	METERED_TYPE,
	MIMIC_TYPE,
	SETUP_FEE,
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
	const setOneTimeFee = props.setOneTimeFee;
	const [tempType, setTempType] = useState<BillingType | null>();
	const [activePage, setActivePage] = useState<Page>(Page.APP_TYPE);

	// First page of billing type selection
	const getAppTypeSelection = () => {
		return (
			<div className="type-selection">
				<div className="nav-header">
					<span className="guide-text">Select a billing method</span>
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
								setTempType(BillingType.FLAT_FEE);
								navigateTo(Page.SETUP_FEE);
							}}
						>
							Recurring License
						</DxButton>
						<div>You will be charging a flat fee regardless of users or usage.</div>
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
					<span className="guide-text">Select a billing method</span>
				</div>
				<div className="type-selection-options">
					<div className="type-selection-option">
						<DxButton
							type="primary"
							onClick={() => {
								setTempType(BillingType.USAGE_TYPE);
								navigateTo(Page.SETUP_FEE);
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
								setTempType(BillingType.MIMIC);
								navigateTo(Page.SETUP_FEE);
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
					<span className="guide-text">Select a billing method</span>
				</div>
				<div className="type-selection-options">
					<div className="type-selection-option">
						<DxButton
							type="primary"
							onClick={() => {
								setTempType(BillingType.METERED_SUM);
								navigateTo(Page.SETUP_FEE);
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
								setTempType(BillingType.METERED_HIGHWATER);
								navigateTo(Page.SETUP_FEE);
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

	const getSetupFeeSelection = () => {
		return (
			<div className="type-selection">
				<div className="nav-header">
					<DxButton type="primary" onClick={() => navigateTo(Page.APP_TYPE)}>
						Back
					</DxButton>
					<span className="guide-text">Would you like to add a one-time setup fee?</span>
				</div>
				<div className="type-selection-options">
					<div className="type-selection-option">
						<DxButton
							type="primary"
							onClick={() => {
								if (!tempType) {
									console.error('billing type not set');
									return;
								}
								onSelectedType(tempType);
							}}
						>
							No Setup Fee
						</DxButton>
						<div>No setup fee. Bill the product itself regularly.</div>
					</div>
					<div className="type-selection-option">
						<DxButton
							type="primary"
							onClick={() => {
								if (!tempType) {
									console.error('billing type not set');
									return;
								}

								setOneTimeFee({
									name: '',
									description: '',
									oneTimeFee: 0,
									required: true,
								});

								onSelectedType(tempType);
							}}
						>
							Required Setup Fee
						</DxButton>
						<div>The setup-fee will be required for purchasing the product.</div>
					</div>
					<div className="type-selection-option">
						<DxButton
							type="primary"
							onClick={() => {
								if (!tempType) {
									console.error('billing type not set');
									return;
								}

								setOneTimeFee({
									name: '',
									description: '',
									oneTimeFee: 0,
									required: false,
								});

								onSelectedType(tempType);
							}}
						>
							Optional Setup Fee
						</DxButton>
						<div>The setup-fee will show as an optional add-on for the produt listing.</div>
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
			{activePage === Page.SETUP_FEE ? getSetupFeeSelection() : null}
		</div>
	);
}

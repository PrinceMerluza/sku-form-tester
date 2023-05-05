import React from 'react';
import { DxButton, DxCheckbox } from 'genesys-react-components';
import { useRecoilValue } from 'recoil';

import AppSettings from '../../../../../helpers/settings/AppSettings';
import { SettingsPanelProps } from '../../../../../types';
import DxLink from '../../../../dxlink/DxLink';

import './PrivacySettings.scss';
import SettingsManager from '../../../../../helpers/settings/SettingsManager';

export default function PrivacySettings(props: SettingsPanelProps) {
	const telemetryAllowed = useRecoilValue(AppSettings.allowTelemetryAtom());
	const storageAllowed = useRecoilValue(AppSettings.allowStorageAtom());

	return (
		<div className="settings privacy-settings">
			<h2>Privacy Settings</h2>
			<p>
				This site uses cookies and related technologies, as described in our privacy policy, for purposes that may include site operation,
				analytics, enhanced user experience, or advertising. You may choose to consent to our use of these technologies, or manage your own
				preferences. <DxLink href="https://www.genesys.com/company/legal/privacy-policy">Learn more here</DxLink>
			</p>
			<DxCheckbox
				label="Allow telemetry analytics"
				itemValue="telemetry"
				checked={telemetryAllowed}
				onCheckChanged={(checked) => {
					if (checked === telemetryAllowed) return;
					AppSettings.setAllowTelemetry(checked === true);
				}}
			/>
			<DxCheckbox
				label="Allow browser storage"
				itemValue="storage"
				checked={storageAllowed}
				onCheckChanged={(checked) => {
					if (checked === storageAllowed || (checked === false && storageAllowed === undefined)) return;
					AppSettings.setAllowStorage(checked === true);
				}}
			/>
			<h2>Local App Cache</h2>
			<p>
				The local app cache contains information stored by the Developer Center site and Developer Tools interactive applications. Click the
				button below to clear it.
			</p>
			<DxButton
				type="primary"
				onClick={async () => {
					await SettingsManager.purge();
					window.location.reload();
				}}
			>
				Clear local app cache
			</DxButton>
		</div>
	);
}

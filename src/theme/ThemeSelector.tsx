import React from 'react';
import { GenesysDevIcons } from 'genesys-dev-icons';
import { BooleanChangedCallback, DxToggle } from 'genesys-react-components';
import { useRecoilState } from 'recoil';
import { AnemiaTheme } from '../types';
import { selectedThemeAtom } from './ThemeAtom';
import { addToast, Toast, ToastType } from '../helpers/atoms/ToastAtom';
import SettingsManager from '../helpers/settings/SettingsManager';

// Placeholder for something more complex when multiple themes are added
export default function ThemeSelector() {
	const [theme, setTheme] = useRecoilState(selectedThemeAtom());

	const onChange: BooleanChangedCallback = (value?: boolean) => {
		// Storage not allowed, warn users their setting will be lost
		if (!SettingsManager.getStorageAllowed()) {
			const toast: Toast = {
				toastType: ToastType.Warning,
				title: 'Browser storage is disabled',
				message: `Your theme selection will not be remembered when you refresh the page. Please enable browser storage in the Account Switcher above to allow this setting to be remembered.`,
				timeoutSeconds: 30,
			};
			addToast(toast);
		}

		setTheme(value ? AnemiaTheme.DefaultDark : AnemiaTheme.Default);
	};

	return (
		<DxToggle
			className="dark-mode-toggle"
			trueIcon={GenesysDevIcons.AppMoon}
			falseIcon={GenesysDevIcons.AppSun}
			value={theme === AnemiaTheme.DefaultDark}
			onChange={onChange}
		/>
	);
}

import React from 'react';
import { Link } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import SearchBar from '../../../search/SearchBar';
import Toaster from '../../../toaster/Toaster';
import AccountSwitcher from '../../../accountswitcher/AccountSwitcher';
import ThemeSelector from '../../../../theme/ThemeSelector';
import { selectedThemeAtom } from '../../../../theme/ThemeAtom';
import { AnemiaTheme, LogoChoice } from '../../../../types';
import AppSettings from '../../../../helpers/settings/AppSettings';

// Default
import defaultLogo from '../../../../images/developer-center-logo.svg';
import defaultLogoDark from '../../../../images/developer-center-logo-dark.svg';
// Pride
import PrideLogo from '../../../../images/developer-center-logo-pride-light.svg';
import PrideLogoDark from '../../../../images/developer-center-logo-pride-dark.svg';

import './Header.scss';

function Header() {
	const theme = useRecoilValue(selectedThemeAtom());
	const logoChoice = useRecoilValue(AppSettings.logoChoiceOption());

	let themeLogo;
	switch (theme) {
		case AnemiaTheme.DefaultDark: {
			themeLogo = logoChoice === LogoChoice.Pride ? PrideLogoDark : defaultLogoDark;
			break;
		}
		default: {
			themeLogo = logoChoice === LogoChoice.Pride ? PrideLogo : defaultLogo;
			break;
		}
	}

	return (
		<div className="layout-header">
			<Link to="/">
				<img src={themeLogo} className="header-image" alt="Genesys Cloud Developer Center" />
			</Link>
			<SearchBar enableHotkey={true} />
			<ThemeSelector />
			<div className="account-switcher-header-container">
				<AccountSwitcher className="header-account-switcher" />
			</div>
			<Toaster />
		</div>
	);
}

export default Header;

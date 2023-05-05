import SettingsManager from '../helpers/settings/SettingsManager';
import { AnemiaTheme, SettingNames } from '../types';

export function selectedThemeAtom() {
	return SettingsManager.getSettingAtom<AnemiaTheme>(SettingNames.SelectedTheme, AnemiaTheme.Default);
}

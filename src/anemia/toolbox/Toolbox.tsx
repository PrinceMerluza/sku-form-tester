import React, { useEffect, useState } from 'react';
import { GenesysDevIcon, GenesysDevIcons } from 'genesys-dev-icons';
import { useRecoilValue } from 'recoil';

import { areToolboxItemsEquivalent, removeItem, setToolboxSize, toolboxSizeAtom } from '../../../../helpers/atoms/ToolboxAtom';
import { selectedAccountAtom } from '../../../../helpers/atoms/AccountsAtom';
import { updateChannelItems } from '../../../../helpers/atoms/ChannelAtoms';
import PageContent from '../../../core/PageContent';
import { GetHistory } from '../../../historyaccess/HistoryAccess';
import ChannelContent from '../../../tools/notifications/ChannelContent';
import { Channel } from '../../../tools/notifications/notificationtopics/NotificationDefinitions';
import AppSettings from '../../../../helpers/settings/AppSettings';
import { ToolboxApp, PageInfo, SettingsPanelProps, ToolboxItem, ApiResourceProps } from '../../../../types';
import OpenAPIExplorer from '../../../tools/openapi/OpenAPIExplorer';
import PrivacySettings from './settings/PrivacySettings';
import ToolboxHelp from './ToolboxHelp';

import './Toolbox.scss';
import { DxTextbox } from 'genesys-react-components';

const REACT_MOUSE_LEFT = 0;

export default function Toolbox() {
	const [isOpen, setIsOpen] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [itemFilter, setItemFilter] = useState<string>('');
	const [doShowHelp, setDoShowHelp] = useState(false);
	const selectedApp = useRecoilValue(AppSettings.selectedToolboxAppAtom());
	const toolboxItems = useRecoilValue(AppSettings.toolboxItemsAtom());
	const selectedItem = useRecoilValue(AppSettings.selectedToolboxItemAtom());
	const toolboxSize = useRecoilValue(toolboxSizeAtom);
	const selectedAccount = useRecoilValue(selectedAccountAtom);

	// Constructor
	useEffect(() => {
		const mouseMove = (e: MouseEvent) => {
			if (!isDragging) return;
			resize(e.clientX, e.clientY);
		};
		const touchMove = (e: TouchEvent) => {
			if (!isDragging) return;
			resize(e.touches[0].clientX, e.touches[0].clientY);
		};

		const resize = (clientX: number, clientY: number) => {
			setToolboxSize({
				width: document.documentElement.clientWidth - clientX + 15,
				height: document.documentElement.clientHeight - clientY + 15,
			});
		};

		const mouseUp = (e: MouseEvent) => {
			if (e.button !== REACT_MOUSE_LEFT) return;
			setIsDragging(false);
		};

		const windowResized = () => {};

		document.addEventListener('mousemove', mouseMove);
		document.addEventListener('touchmove', touchMove);
		document.addEventListener('mouseup', mouseUp);
		window.addEventListener('resize', windowResized);
		return () => {
			document.removeEventListener('mousemove', mouseMove);
			document.removeEventListener('touchmove', touchMove);
			document.removeEventListener('mouseup', mouseUp);
			window.removeEventListener('resize', windowResized);
		};
	});

	useEffect(() => {
		updateChannelItems();
	}, [selectedAccount]);

	// Default to closed container
	let container = (
		<div className="toolbox-closed">
			<GenesysDevIcon icon={GenesysDevIcons.DestWrench} onClick={() => setIsOpen(true)} />
		</div>
	);

	// Set override with open state logic
	if (isOpen) {
		// Set selected page content -- Each app must map selectedItem to a component
		let content = <ToolboxHelp />;

		if (doShowHelp || selectedItem?.appType !== selectedApp) {
			content = <ToolboxHelp for={selectedApp} />;
		} else {
			if (selectedItem?.appType === selectedApp) {
				switch (selectedItem?.appType) {
					case ToolboxApp.ApiExplorer: {
						content = <OpenAPIExplorer {...(selectedItem.props as ApiResourceProps)} showExpanded={true} />;
						break;
					}
					case ToolboxApp.Notifications: {
						content = <ChannelContent channel={selectedItem.props as Channel} />;
						break;
					}
					case ToolboxApp.Pages: {
						content = <PageContent staticPage={selectedItem.props as PageInfo} />;
						break;
					}
					case ToolboxApp.Settings: {
						const panelProps = selectedItem.props as SettingsPanelProps;
						switch (panelProps.page) {
							case 'privacy': {
								content = <PrivacySettings {...(selectedItem.props as SettingsPanelProps)} />;
								break;
							}
							default: {
								console.warn(`Unknown panel: ${panelProps.page}`);
							}
						}
						break;
					}
				}
			}
		}

		// Click handler for expand button
		const expandItem = (item: ToolboxItem) => {
			// Handle expansion per app type
			switch (item.appType) {
				case ToolboxApp.Pages: {
					GetHistory().push((item.props as PageInfo).link);
				}
			}
		};

		// Prepare display names
		const appNames = {} as any;
		appNames[ToolboxApp.ApiExplorer] = 'API Explorer';
		appNames[ToolboxApp.Notifications] = 'Notifications';
		appNames[ToolboxApp.Pages] = 'Pages';
		appNames[ToolboxApp.Settings] = 'Settings';

		const items = selectedApp ? toolboxItems[selectedApp] : [];

		const mouseDown = (e: React.MouseEvent) => {
			if (e.button !== REACT_MOUSE_LEFT) return;
			e.preventDefault();
			setIsDragging(true);
		};
		const touchStart = (e: React.TouchEvent) => {
			e.preventDefault();
			setIsDragging(true);
		};
		const touchEnd = (e: React.TouchEvent) => {
			e.preventDefault();
			setIsDragging(false);
		};

		const setSelectedToolboxApp = (app: ToolboxApp) => {
			setItemFilter('');
			setDoShowHelp(false);
			AppSettings.setSelectedToolboxApp(app);
		};

		const setSelectedToolboxItem = (app: ToolboxApp, item: ToolboxItem | undefined) => {
			setDoShowHelp(false);
			AppSettings.setSelectedToolboxItem(app, item);
		};

		// Create open container
		container = (
			<div className="toolbox-open" style={{ width: `${toolboxSize?.width}px`, height: `${toolboxSize?.height}px` }}>
				<div className="header-bar">
					<span onMouseDown={mouseDown} onTouchStart={touchStart} onTouchEnd={touchEnd} className="header-grip">
						<GenesysDevIcon icon={GenesysDevIcons.AppGripNw} />
					</span>
					<GenesysDevIcon icon={GenesysDevIcons.AppChevronDown} onClick={() => setIsOpen(false)} />
				</div>
				<div className="content-panel">
					<div className="toolbox-navigation">
						<div className="toolbox-app-title">
							<h1>{selectedApp ? appNames[selectedApp] : 'Items'}</h1>
							{selectedApp !== ToolboxApp.Settings && (
								<GenesysDevIcon icon={GenesysDevIcons.AppQuestionSolid} className="toolbox-app-help" onClick={() => setDoShowHelp(true)} />
							)}
						</div>
						{(selectedApp === ToolboxApp.ApiExplorer || selectedApp === ToolboxApp.Pages) && (
							<DxTextbox
								className="item-filter"
								value={itemFilter}
								onChange={(value) => setItemFilter((value || '').toLowerCase().trim())}
								placeholder="Filter items..."
								icon={GenesysDevIcons.AppFilter}
								clearButton={true}
							/>
						)}
						<ul className="toolbox-items">
							{items
								.filter((item) => itemFilter === '' || item.title.toLowerCase().includes(itemFilter))
								.map((item, i) => (
									<li key={`${item.title}-${i}`} className={areToolboxItemsEquivalent(item, selectedItem) ? 'active' : ''}>
										<span onClick={() => selectedApp && setSelectedToolboxItem(selectedApp, item)}>{item.title}</span>
										{item.appType === ToolboxApp.Pages && (
											<GenesysDevIcon icon={GenesysDevIcons.AppExpand} onClick={() => expandItem(item)} />
										)}
										{item.disableUserRemove !== true && <GenesysDevIcon icon={GenesysDevIcons.AppTimes} onClick={() => removeItem(item)} />}
									</li>
								))}
						</ul>
						<div className="toolbox-apps">
							<ul>
								<li
									className={selectedApp === ToolboxApp.ApiExplorer ? 'active' : ''}
									onClick={() => setSelectedToolboxApp(ToolboxApp.ApiExplorer)}
								>
									<GenesysDevIcon icon={GenesysDevIcons.DestApiExplorer} />
									<span>API Explorer</span>
								</li>
								<li
									className={selectedApp === ToolboxApp.Notifications ? 'active' : ''}
									onClick={() => setSelectedToolboxApp(ToolboxApp.Notifications)}
								>
									<GenesysDevIcon icon={GenesysDevIcons.DestNotifications} />
									<span>Notifications</span>
								</li>
								<li className={selectedApp === ToolboxApp.Pages ? 'active' : ''} onClick={() => setSelectedToolboxApp(ToolboxApp.Pages)}>
									<GenesysDevIcon icon={GenesysDevIcons.DestPages} />
									<span>Pages</span>
								</li>
								<li
									className={selectedApp === ToolboxApp.Settings ? 'active' : ''}
									onClick={() => setSelectedToolboxApp(ToolboxApp.Settings)}
								>
									<GenesysDevIcon icon={GenesysDevIcons.DestCog} />
									<span>Settings</span>
								</li>
							</ul>
						</div>
					</div>
					<div className="toolbox-app-panel">
						<div className="app-container">{content}</div>
					</div>
				</div>
			</div>
		);
	}

	// Return the toolbox
	return <div className="dev-toolbox">{container}</div>;
}

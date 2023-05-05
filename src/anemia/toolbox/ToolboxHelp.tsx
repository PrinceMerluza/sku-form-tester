import React from 'react';
import NavigationManager from '../../../../helpers/NavigationManager';

import { PageInfo, ToolboxApp } from '../../../../types';
import PageContent from '../../../core/PageContent';

interface IProps {
	for?: ToolboxApp;
}

export default function ToolboxHelp(props: IProps) {
	switch (props.for) {
		case ToolboxApp.ApiExplorer: {
			const pageInfo = NavigationManager.getPage('/devapps/about/api-explorer', false) as PageInfo;
			if (pageInfo) return <PageContent staticPage={pageInfo} />;
			else break;
		}
		case ToolboxApp.Notifications: {
			const pageInfo = NavigationManager.getPage('/devapps/about/notifications', false) as PageInfo;
			if (pageInfo) return <PageContent staticPage={pageInfo} />;
			else break;
		}
		case ToolboxApp.Pages: {
			const pageInfo = NavigationManager.getPage('/devapps/about/pages', false) as PageInfo;
			if (pageInfo) return <PageContent staticPage={pageInfo} />;
			else break;
		}
	}

	// This should never actually happen in practice. It's a low-effort placeholder just in case something goes wrong.
	return <div>Welcome to the toolbox! Pick an app on the right to get started.</div>;
}

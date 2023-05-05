import React, { createElement } from 'react';
import { Link } from 'react-router-dom';
import { GenesysDevIcon, GenesysDevIcons } from 'genesys-dev-icons';

import AssetLoader from '../helpers/AssetLoader';
import TabbedContent from '../components/tabbedcontent/TabbedContent';

// Embeddable components
import CodeFence from '../components/codefence/CodeFence';
import QuickHit from '../components/embeddable/quickhit/QuickHit';
import SwaggerDiff from './../components/embeddable/SwaggerDiff/swaggerDiff';
import CardCatalog from '../components/cards/CardCatalog';
import DxLink from '../components/dxlink/DxLink';
import OpenAPIExplorer from '../components/tools/openapi/OpenAPIExplorer';
import AlertBlock from '../components/markdown/alertblock/AlertBlock';
import Changelog from '../components/changelog/Changelog';
import NotificationTool from '../components/tools/notifications/notificationtopics/NotificationTool';
import AvailableMediaTypeTool from '../components/tools/routing/availablemediatypes/AvailableMediaTypeTool';
import DataTable from '../components/markdown/datatable/DataTable';
import QuickHitListing from '../components/embeddable/quickhit/QuickHitListing';
import ApplicationInspector from '../components/tools/application-inspector/ApplicationInspector';
import PostmanFiles from '../components/embeddable/postmanfiles/PostmanFiles';
import ScreenShare from '../components/tools/screenshare/ScreenShare';
import WebChatAndMessenger from '../components/tools/webchat/WebChatAndMessenger';
import SdkDocExplorer from '../components/embeddable/sdkdocexplorer/SdkDocExplorer';
import PremiumAppSubmission from '../components/tools/premium-app-submission/PremiumAppSubmission';
import SKUWizard from '../components/tools/sku-wizard/SKUWizard';

const renderers = {
	alertBlock: (props: any) => {
		return <AlertBlock {...props} />;
	},
	customimage: (props: any) => {
		let src = props.src;
		if (src.startsWith('/')) {
			// Absolute path only
			src = AssetLoader.contentHost + src;
		} else if (!src.startsWith('http')) {
			// Relative path
			let rootDir = /(.+\/)/.exec(window.location.pathname);
			const rootDirPathname = rootDir ? rootDir[1] : '/';
			src = AssetLoader.contentHost + rootDirPathname + src;
		}
		return createElement('img', { title: props.title, src: src, alt: props.alt, className: 'markdown-image' });
	},
	codeFence: (props: any) => {
		return <CodeFence {...props} />;
	},
	dataTable: (props: any) => {
		return <DataTable {...props} />;
	},
	dxUiComponent: (props: any) => {
		switch (props.component.toLowerCase()) {
			// case 'applicationinspector': {
			// 	return <ApplicationInspector />;
			// }
			// case 'blogindex': {
			// 	return <CardCatalog source="/data/blogs.json" cardStyle="image" useCategorySubtitle={true} />;
			// }
			// case 'blueprintindex': {
			// 	return <CardCatalog source="/data/blueprints.json" cardStyle="image" useCategorySubtitle={true} />;
			// }
			// case 'changelog': {
			// 	return <Changelog />;
			// }
			// case 'sdkdocexplorer': {
			// 	return <SdkDocExplorer />;
			// }
			// case 'guideindex': {
			// 	return <CardCatalog source="/data/guides.json" cardStyle="plain" useCategorySubtitle={true} />;
			// }
			// case 'icon': {
			// 	return <GenesysDevIcon icon={props.props.icon} fontSize={props.props.fontSize} />;
			// }
			// case 'notificationtool': {
			// 	return <NotificationTool source="/data/notificationtopics.json" />;
			// }
			// case 'availablemediatypetool': {
			// 	return <AvailableMediaTypeTool source="/data/availablemediatypes.json" />;
			// }
			// case 'swaggerlive':
			// case 'openapiexplorer': {
			// 	return <OpenAPIExplorer {...props.props} />;
			// }
			// case 'postmanfiles': {
			// 	return <PostmanFiles />;
			// }
			// case 'quickhit': {
			// 	return <QuickHit {...props.props} />;
			// }
			// case 'quickhitlisting': {
			// 	return <QuickHitListing />;
			// }
			// case 'screenshare': {
			// 	return <ScreenShare />;
			// }
			// case 'swaggerdiff': {
			// 	return <SwaggerDiff />;
			// }
			// case 'webchatandmessenger': {
			// 	return <WebChatAndMessenger />;
			// }
			case 'premiumappsubmission': {
				return <PremiumAppSubmission />;
			}
			case 'skuwizard': {
				return <SKUWizard />;
			}
			default: {
				return <i>Failed to load component: {props.component}</i>;
			}
		}
	},
	link: (props: any) => {
		return <DxLink {...props} />;
	},
	customHeading: (props: any) => {
		if (!props.children) props.children = [];
		props.children.push(<GenesysDevIcon icon={GenesysDevIcons.AppLink} key={props.children.length} className="toc-link-icon" />);
		return (
			<React.Fragment>
				<Link to={'#' + props.name} id={props.name} className={'toc-link toc-link-h' + props.level}>
					{createElement(`h${props.level}`, {}, props.children)}
				</Link>
			</React.Fragment>
		);
	},
	paragraph: (props: any) => {
		let className = props.indentation > 0 ? ` indent-${props.indentation}` : '';
		return <p className={className}>{props.children}</p>;
	},
	toc: (props: any) => {
		// TOC is now deprecated in favor of InPageNav. This needs to stay here to suppress the "[toc]" syntax from the page
		return null;
		// return <ul className="toc-list">{props.children}</ul>;
	},
	tocLink: (props: any) => {
		// TOC is now deprecated in favor of InPageNav. It's still here to suppress it from the content.
		return null;
	},
	tabbedContent: (props: any) => {
		return <TabbedContent {...props} />;
	},
};

export default renderers;

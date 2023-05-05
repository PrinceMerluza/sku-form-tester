import React, { useState, useEffect } from 'react';

import { default as NavMan } from '../../../../helpers/NavigationManager';
import { Sitemap } from '../../../../helpers/NavigationManager.types';
import NavGroup from './NavGroup';

import './SiteNavigation.scss';

const IA_CATEGORY_KEYS = [
	'analyticsdatamanagement',
	'authorization',
	'billing',
	'commdigital',
	'gdprprivacy',
	'notificationsalerts',
	'organization',
	'platform',
	'routing',
	'telephony',
	'useragentman',
];

export default function SiteNavigation() {
	const [topics, setTopics] = useState({} as Sitemap);
	const [resources, setResources] = useState({} as Sitemap);

	useEffect(() => {
		const onSitemapLoadedHandler = (sitemap: Sitemap) => {
			let newTopics = {} as Sitemap;
			let newResources = {} as Sitemap;

			Object.entries(sitemap).forEach(([key, item]) => {
				if (IA_CATEGORY_KEYS.includes(key)) newTopics[key] = item;
				else newResources[key] = item;
			});

			setTopics(newTopics);
			setResources(newResources);
		};
		NavMan.onSitemapLoaded(onSitemapLoadedHandler);

		// Cleanup function
		return () => {
			NavMan.onSitemapLoaded(onSitemapLoadedHandler, true);
		};
	}, []);

	return (
		<div className="site-navigation">
			<div className="h7">Topics</div>
			{Object.entries(topics).map(([key, item]) => {
				return typeof item === 'object' ? <NavGroup relativeSitemap={item} level={1} key={key} /> : null;
			})}
			<div className="h7">Resources</div>
			{Object.entries(resources).map(([key, item]) => {
				return typeof item === 'object' ? <NavGroup relativeSitemap={item} level={1} key={key} /> : null;
			})}
		</div>
	);
}

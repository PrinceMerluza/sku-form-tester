import React, { useState, useEffect } from 'react';
import { Page, Sitemap } from '../../../../helpers/NavigationManager.types';
import { default as NavMan } from '../../../../helpers/NavigationManager';

import './NavGroup.scss';
import { GenesysDevIcon, GenesysDevIcons } from 'genesys-dev-icons';
import { Link } from 'react-router-dom';
import Tag from '../../../cards/Tag';

interface IProps {
	level: number;
	relativeSitemap: Sitemap;
}

export default function NavGroup(props: IProps) {
	const isInPath = () => NavMan.pathname.startsWith(props.relativeSitemap.index?.link || '!@#$');
	const [currentPath, setCurrentPath] = useState(NavMan.pathname);
	const [isOpen, setIsOpen] = useState(isInPath());

	// Constructor
	useEffect(() => {
		// Listen for navigation option changes
		const onPathnameChangedHandler = (path: string) => {
			// select new path
			setCurrentPath(path);

			// Force open when in path, but don't auto-close if it's not
			if (isInPath()) {
				setIsOpen(true);
			}
		};
		NavMan.onPathnameChanged(onPathnameChangedHandler);

		// Force the path to update; it may have changed since initialied in useState
		setCurrentPath(NavMan.pathname);
		setIsOpen(isInPath());

		// Cleanup function
		return () => {
			NavMan.onPathnameChanged(onPathnameChangedHandler, true);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Clamp level designation
	let level = props.level || 1;
	if (level < 1) level = 1;

	// Is it really a page?
	if (!props.relativeSitemap.isDir) {
		return makePageElement(props.relativeSitemap as unknown as Page);
	}

	// Don't show any children when this is set
	if (props.relativeSitemap.index?.suppressSidebarLinks) {
		return makePageElement(props.relativeSitemap.index);
	}

	// See if there are any children other than the index page
	let hasChildren = Object.values(props.relativeSitemap).some(
		(page: any) => typeof page === 'object' && ((page.link && !page.link.endsWith('/')) || (page.isDir && page.index))
	);

	// Display index as a page in the parent instead of a group if there are no non-index child pages in the group
	if (!hasChildren && props.relativeSitemap.index) {
		return makePageElement(props.relativeSitemap.index, true);
	}

	// Check group visibility
	if (!props.relativeSitemap.index || !NavMan.isVisible(props.relativeSitemap.index)) return null;

	// Build sub-links
	let subnav;
	if (isOpen) {
		const children = [] as JSX.Element[];

		// Add index page first
		children.push(
			<NavGroup
				relativeSitemap={props.relativeSitemap.index as unknown as Sitemap}
				level={level + 1}
				key={props.relativeSitemap.index.link || props.relativeSitemap.index.path}
			/>
		);

		// Process sitemap entries at this level

		Object.values(props.relativeSitemap)
			.filter((item) => {
				// Skip adding index page; already added
				if (props.relativeSitemap.index && item.link === props.relativeSitemap.index.link) return false;
				// Skip non-objects (strings are frontmatter properties)
				if (typeof item !== 'object') return false;

				// It must be a page
				return true;
			})
			.sort((a: Page | Sitemap, b: Page | Sitemap) => {
				const aTitle = a.index?.group || a.index?.title || a.title || '';
				const bTitle = b.index?.group || b.index?.title || b.title || '';
				const aOrder = a.index?.order || a.order;
				const bOrder = b.index?.order || b.order;
				if (aOrder && !bOrder) return 1; // Only A has order
				if (!aOrder && bOrder) return -1; // Only B has order
				if (bOrder < aOrder) return -1; // Order of A/B is incorrect (smaller goes first)
				if (aOrder < bOrder) return 1; // Order of A/B is correct (smaller goes first)
				return bTitle.localeCompare(aTitle, undefined, { numeric: true, sensitivity: 'base' }); // Sort by title
			})
			.reverse()
			.forEach((item) => {
				// Add pages and sitemaps as recursive nav groups
				children.push(<NavGroup relativeSitemap={item} level={level + 1} key={item.link || item.path} />);
			});

		// Assign content if we have any
		if (children.length > 0) {
			subnav = <div className={`nav-group ${isInPath() ? 'open' : ''}`}>{children}</div>;
		}
	}

	function makePageElement(page: Page, useGroupName?: boolean) {
		// Check visibility
		if (!NavMan.isVisible(page)) return null;
		return (
			<Link className={`nav-item nav-level-${level} ${page.link === currentPath ? 'active' : ''}`} to={page.link}>
				{useGroupName && page.group ? page.group : page.title} {page.isbeta ? <Tag>BETA</Tag> : undefined}
			</Link>
		);
	}

	// Group click handler function
	function navGroupClick() {
		setIsOpen(!isOpen);
	}

	// Return collapsible group
	return (
		<React.Fragment>
			<div className={`nav-item nav-level-${level} group-title ${isInPath() ? 'active' : ''}`} onClick={() => navGroupClick()}>
				<span>{props.relativeSitemap.index.group || props.relativeSitemap.index.title}</span>
				<button type="button" className="expando-button">
					<GenesysDevIcon icon={isOpen ? GenesysDevIcons.AppMinus : GenesysDevIcons.AppPlus} className="nav-group-image" />
				</button>
			</div>
			{subnav}
		</React.Fragment>
	);
}

import React from 'react';
import { Link } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { selectedThemeAtom } from '../../../../theme/ThemeAtom';
import { AnemiaTheme } from '../../../../types';

import logo from '../../../../images/developer-center-logo-desaturated.svg';
import logoDark from '../../../../images/developer-center-logo-desaturated-dark.svg';
import './Footer.scss';

interface FooterGroups {
	[groupName: string]: FooterLink[];
}

interface FooterLink {
	title: string;
	link: string;
}

const footerData: FooterGroups = {
	'Genesys Cloud resources': [
		{
			title: 'Beyond Training',
			link: 'https://beyond.genesys.com/explore/subscription/genesys-cloud-learning-subscription',
		},
		{
			title: 'Community Forum',
			link: 'https://community.genesys.com/communities/purecloud?CommunityKey=bab95e9c-6bbe-4a13-8ade-8ec0faf733d4',
		},
		{
			title: 'Knowledge Network',
			link: 'https://know.genesys.com/',
		},
		{
			title: 'Resource Center',
			link: 'https://help.mypurecloud.com/',
		},
		{
			title: 'Status',
			link: 'https://status.mypurecloud.com/',
		},
	],
	'App Foundry': [
		{
			title: 'Overview',
			link: '/appfoundry/',
		},
		{
			title: 'Available Apps',
			link: 'https://appfoundry.genesys.com/#/filter/purecloud',
		},
		{
			title: 'Contribute',
			link: '/https://appfoundry.genesys.com/#/getting-started',
		},
		{
			title: 'Style Guide',
			link: '/appfoundry/styleguide',
		},
	],
	'Connect with us': [
		{
			title: 'Github',
			link: 'https://github.com/MyPureCloud',
		},
		{
			title: 'Twitter',
			link: 'https://twitter.com/GenesysCloudDev',
		},
		{
			title: 'Developer Forum',
			link: '/forum/',
		},
		{
			title: 'Developer Blog',
			link: '/blog/',
		},
		{
			title: 'Genesys Blog',
			link: 'https://www.genesys.com/blog',
		},
		{
			title: 'DevCast Newsletter',
			link: '/devcast-newsletter',
		},
	],
};

export default function Footer() {
	const theme = useRecoilValue(selectedThemeAtom());
	let themeLogo;
	switch (theme) {
		case AnemiaTheme.DefaultDark: {
			themeLogo = logoDark;
			break;
		}
		default: {
			themeLogo = logo;
			break;
		}
	}

	return (
		<div className="layout-footer">
			<div className="footer-links">
				<div>
					<img className="footer-logo" src={themeLogo} alt="Genesys Cloud" />
				</div>
				{Object.entries(footerData).map(([groupName, links]) => (
					<div className="link-group" key={groupName}>
						<span className="group-title">{groupName}</span>
						{links.map((link, i) =>
							link.link.startsWith('/') ? (
								<Link to={link.link} key={i}>
									{link.title}
								</Link>
							) : (
								<a href={link.link} key={i} target="_blank" rel="noreferrer">
									{link.title}
								</a>
							)
						)}
					</div>
				))}
			</div>
			<div className="footer-footer">
				<span>Copyright © {new Date().getFullYear()} Genesys. All rights reserved.</span>
				<div className="bottom-right-links">
					<a href="https://www.genesys.com/company/legal/terms-of-use" target="_blank" rel="noreferrer">
						Terms of Use
					</a>{' '}
					|{' '}
					<a href="https://www.genesys.com/company/legal/privacy-policy" target="_blank" rel="noreferrer">
						Privacy Policy
					</a>
				</div>
			</div>
		</div>
	);
}

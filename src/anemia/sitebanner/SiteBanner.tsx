import React from 'react';
import DxLink from '../../../dxlink/DxLink';

import './SiteBanner.scss';

export default function SiteBanner() {
	return (
		<div className="layout-sitewide-banner">
			This is a really important message about something. It could be about anything we deem important enough to tell everyone. It might
			have <DxLink href="">links to places</DxLink>, but shouldn't have any images or non-text content. Messages shouldn't be longer than
			two lines on normal sized layouts.
		</div>
	);
}

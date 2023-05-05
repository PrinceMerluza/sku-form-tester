import React, { useState } from 'react';
import { GenesysDevIcon, GenesysDevIcons } from 'genesys-dev-icons';

import './AlertBlock.scss';

interface IProps {
	title?: string;
	alertType?: 'info' | 'success' | 'critical' | 'warning' | 'toast';
	collapsible?: boolean;
	autoCollapse?: boolean;
	indentation?: number;
	children?: any;
	className?: string;
}

export default function AlertBlock(props: IProps) {
	const isCollapsible = props.collapsible === false ? false : props.collapsible || props.autoCollapse || false;
	const [isCollapsed, setIsCollapsed] = useState(isCollapsible ? props.autoCollapse || false : false);

	let title;
	if (props.title) {
		title = (
			<div
				className={`alert-title${isCollapsible ? ' clickable' : ''}${isCollapsed ? ' collapsed' : ''}`}
				onClick={isCollapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
			>
				{props.title}
			</div>
		);
	}

	let icon;
	switch (props.alertType) {
		case 'info': {
			icon = <GenesysDevIcon className="info-icon" icon={GenesysDevIcons.AppInfoSolid} />;
			break;
		}
		case 'success': {
			icon = <GenesysDevIcon className="info-icon" icon={GenesysDevIcons.AppSuccessSolid} />;
			break;
		}
		case 'critical': {
			icon = <GenesysDevIcon className="info-icon" icon={GenesysDevIcons.AppCriticalSolid} />;
			break;
		}
		case 'warning': {
			icon = <GenesysDevIcon className="info-icon" icon={GenesysDevIcons.AppWarnSolid} />;
			break;
		}
	}
	if (icon && isCollapsible) {
		icon = (
			<span className="clickable" onClick={() => setIsCollapsed(!isCollapsed)}>
				{icon}
			</span>
		);
	}

	//TODO: remove the card fence classes and build a proper collapser
	return (
		<div
			className={`alert-container${props.indentation && props.indentation > 0 ? ` indent-${props.indentation}` : ''} ${
				props.className || ''
			}`}
		>
			<div className={`alert alert-${props.alertType}`} role="alert">
				{icon}
				<div className="alert-content">
					{title}
					{isCollapsed ? undefined : <div>{props.children}</div>}
				</div>
				{isCollapsible ? (
					<span className="clickable" onClick={() => setIsCollapsed(!isCollapsed)}>
						<GenesysDevIcon icon={isCollapsed ? GenesysDevIcons.AppChevronDown : GenesysDevIcons.AppChevronUp} />
					</span>
				) : undefined}
			</div>
		</div>
	);
}

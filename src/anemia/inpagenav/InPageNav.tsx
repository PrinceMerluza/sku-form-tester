import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heading } from '../../../../helpers/atoms/inPageHeadings';

import './InPageNav.scss';

interface IProps {
	headings: Heading[];
}

interface HeadingVisibilityList {
	[id: string]: boolean;
}

export default function InPageNav(props: IProps) {
	const headingVisibility = useRef<HeadingVisibilityList>({});
	const [visibleHeading, setVisibleHeading] = useState<string | undefined>();

	// Constructor
	useEffect(() => {
		const callback = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
			entries.forEach((element) => {
				headingVisibility.current[element.target.id] = element.isIntersecting;
			});

			const firstVisible = Object.keys(headingVisibility.current).find((id) => headingVisibility.current[id] === true);
			setVisibleHeading(firstVisible);
		};

		const observer = new IntersectionObserver(callback);

		// const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
		const headingElements = Array.from(document.querySelectorAll('.toc-link'));
		headingElements.forEach((element) => observer.observe(element));

		return () => observer.disconnect();
	}, []);

	return (
		<div className="in-page-nav">
			<span className="h7">On this page</span>
			<ul className="heading-list">
				{props.headings.map((heading) => (
					<li key={heading.link} className={heading.link === visibleHeading ? 'active' : ''}>
						<Link to={`#${heading.link}`}>{heading.title}</Link>
					</li>
				))}
			</ul>
		</div>
	);
}

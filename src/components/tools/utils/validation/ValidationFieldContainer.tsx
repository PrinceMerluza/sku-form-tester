import React, { useEffect, useState } from 'react';

import './ValidationFieldContainer.scss';

interface IProps {
	name: string;
	isFocused?: boolean;
	info?: string;
	errors: { [key: string]: Array<string> };
	children: React.ReactNode;
}

/**
 * This component should be a parent of a 'genesys-react-components' to show if there any errors in the field.
 * But purely for CSS purposes to extend the child style (ie red borders for error).
 * The 'errors' prop is the state containing ALL errors of the original form.
 * 'name' is the key to get the specific error for this field
 */
export default function ValidationFieldContainer(props: IProps) {
	const [isValid, setIsValid] = useState<boolean>(true);

	useEffect(() => {
		setIsValid(!props.errors[props.name]);
	}, [props.errors, props.name]);

	// If there are any errors on the field, show the alert block with message(s)
	return (
		<div className={`field-validation-container ${isValid ? '' : 'invalid'}`}>
			{props.children}
			{props.info && props.isFocused ? props.info : undefined}
			{props.errors[props.name] && !props.isFocused ? (
				<div className="error-box">
					<div>
						<strong>{`${props.name} error`}</strong>{' '}
					</div>
					{props.errors[props.name].map((error, idx) => (
						<p key={idx}>{props.errors[props.name][idx]}</p>
					))}
				</div>
			) : undefined}
		</div>
	);
}

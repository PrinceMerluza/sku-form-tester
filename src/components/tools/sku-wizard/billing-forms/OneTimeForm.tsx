import React, { useState, useEffect } from 'react';
import ValidationFieldContainer from '../../utils/validation/ValidationFieldContainer';
import { DxTextbox } from 'genesys-react-components';
import Validator from '../../utils/validation/Validator';

interface IProps {
	setOneTimeFee: React.Dispatch<React.SetStateAction<number | undefined>>;
	setFormHasErrors: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function OneTimeForm(props: IProps) {
	const setOneTimeFee = props.setOneTimeFee;
	const setFormHasErrors = props.setFormHasErrors;
	const [localOneTimeFee, setLocalOneTimeFee] = useState<number>();

	const [errors, setErrors] = useState<{ [key: string]: Array<string> }>({});

	// VALIDATION
	useEffect(() => {
		const newErrors: { [key: string]: Array<string> } = {};
		const validator: Validator = new Validator(newErrors);
		if (!localOneTimeFee) return;

		// Billing Data
		validator.validateGreaterThanOrEqual('one-time-fee', localOneTimeFee, 0, 'Price should be greater than 0.');

		setErrors(newErrors);

		setFormHasErrors(Object.keys(newErrors).length > 0);
		setOneTimeFee(localOneTimeFee);
	}, [setOneTimeFee, setFormHasErrors, localOneTimeFee]);

	const getAmountsForm = () => {
		return (
			<div>
				<div className="named-portion">
					<h2>Recurring Flat Fee</h2>
					<div>
						<div>
							<ValidationFieldContainer errors={errors} name="one-time-fee">
								<DxTextbox inputType="decimal" label="One Time Fee" onChange={(val) => setLocalOneTimeFee(parseFloat(val))} />
							</ValidationFieldContainer>
						</div>
					</div>
				</div>
			</div>
		);
	};

	return <div>{getAmountsForm()}</div>;
}

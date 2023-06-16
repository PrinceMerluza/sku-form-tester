import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import ValidationFieldContainer from '../../../utils/validation/ValidationFieldContainer';
import { DxTextbox } from 'genesys-react-components';
import Validator from '../../../utils/validation/Validator';
import { StartUpFee } from '../../types';

interface IProps {
	oneTimeFee: StartUpFee;
	setOneTimeFee: Dispatch<SetStateAction<StartUpFee | undefined>>;
}

export default function OneTimeForm(props: IProps) {
	const oneTimeFee = props.oneTimeFee;
	const setOneTimeFee = props.setOneTimeFee;

	const [errors, setErrors] = useState<{ [key: string]: Array<string> }>({});

	// // VALIDATION
	// useEffect(() => {
	// 	const newErrors: { [key: string]: Array<string> } = {};
	// 	const validator: Validator = new Validator(newErrors);
	// 	if (!localOneTimeFee) return;

	// 	// Billing Data
	// 	validator.validateGreaterThanOrEqual('one-time-fee', localOneTimeFee, 0, 'Price should be greater than 0.');

	// 	setErrors(newErrors);

	// 	setFormHasErrors(Object.keys(newErrors).length > 0);
	// 	setOneTimeFee(localOneTimeFee);
	// }, [setOneTimeFee, setFormHasErrors, localOneTimeFee]);

	const getAmountsForm = () => {
		return (
			<div>
				<div className="named-portion">
					<h2>{`${oneTimeFee.required ? 'Required' : 'Optional'} Quickstart Fee`}</h2>
					<div>
						<div>
							<ValidationFieldContainer errors={errors} name="one-time-fee">
								<DxTextbox
									inputType="text"
									label="Quickstart Display Name"
									placeholder="Product Quickstart"
									initialValue={oneTimeFee?.name}
									onChange={(val) => {
										setOneTimeFee((prevData) => {
											const tmpObj = Object.assign({}, prevData);
											tmpObj['name'] = val;

											return tmpObj;
										});
									}}
								/>
							</ValidationFieldContainer>
						</div>
						<div>
							<ValidationFieldContainer errors={errors} name="one-time-fee">
								<DxTextbox
									inputType="text"
									label="Quickstart Description"
									placeholder="Description of what the quickstart includes"
									initialValue={oneTimeFee?.description}
									onChange={(val) => {
										setOneTimeFee((prevData) => {
											const tmpObj = Object.assign({}, prevData);
											tmpObj['description'] = val;

											return tmpObj;
										});
									}}
								/>
							</ValidationFieldContainer>
						</div>
						<div>
							<ValidationFieldContainer errors={errors} name="one-time-fee">
								<DxTextbox
									inputType="decimal"
									label="Amount"
									initialValue={oneTimeFee?.oneTimeFee.toString()}
									onChange={(val) => {
										setOneTimeFee((prevData) => {
											const tmpObj = Object.assign({}, prevData);
											tmpObj['oneTimeFee'] = parseFloat(val);

											return tmpObj;
										});
									}}
								/>
							</ValidationFieldContainer>
						</div>
					</div>
				</div>
			</div>
		);
	};

	return <div>{getAmountsForm()}</div>;
}

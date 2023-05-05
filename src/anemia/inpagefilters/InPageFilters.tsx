import { DxButton, DxItemGroup } from 'genesys-react-components';
import React from 'react';
import { useRecoilValue } from 'recoil';
import { inPageFiltersAtom, setFilters } from '../../../../helpers/atoms/InPageFilters';

import './InPageFilters.scss';

interface IProps {}

export default function InPageFilters(props: IProps) {
	const filters = useRecoilValue(inPageFiltersAtom);

	const filterAll = (filterGroupPosition: number, isSelected: boolean) => {
		if (!filters || filters.length <= filterGroupPosition) return;
		const newFilters = [...filters];
		newFilters[filterGroupPosition] = { ...newFilters[filterGroupPosition] };
		newFilters[filterGroupPosition].options = newFilters[filterGroupPosition].options.map((item) => {
			return { ...item, isSelected };
		});
		setFilters(newFilters);
	};

	return (
		<div className="in-page-filter-container">
			{filters?.map((filterGroup, i) => (
				<div className="filter-group" key={i}>
					<span className="h7">{filterGroup.label}</span>
					<div className="filter-all-buttons">
						<DxButton type="link" onClick={() => filterAll(i, true)}>
							Select all
						</DxButton>{' '}
						|{' '}
						<DxButton type="link" onClick={() => filterAll(i, false)}>
							Clear all
						</DxButton>
					</div>
					<DxItemGroup
						items={filterGroup.options}
						format={filterGroup.mode === 'single' ? 'radio' : 'checkbox'}
						onItemChanged={filterGroup.onItemChanged}
						onItemsChanged={filterGroup.onItemsChanged}
					/>
				</div>
			))}
		</div>
	);
}

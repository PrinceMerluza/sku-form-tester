/* eslint-disable react-hooks/exhaustive-deps */
import { GenesysDevIcon, GenesysDevIcons } from 'genesys-dev-icons';
import { DxTextbox, DxToggle } from 'genesys-react-components';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import CopyButton from '../../copybutton/CopyButton';
import MarkdownDisplay from '../../markdowndisplay/MarkdownDisplay';
import Paginator, { Pagination } from '../../paginator/Paginator';

import './DataTable.scss';

interface IProps {
	rows: DataTableRow[];
	headerRow?: DataTableRow;
	className?: string;
	indentation?: number;
	sortable?: boolean;
	paginated?: boolean;
	filterable?: boolean;
}

interface ColumnFilterCollection {
	[colId: string]: ColumnFilter;
}

interface ColumnFilter {
	colId: number;
	dataType: 'string' | 'number' | 'datetime';
	filter: any;
	filterModifier?: FilterModifierGtLt;
}

type FilterModifierGtLt = 'greaterthan' | 'lessthan';

interface ColumnSort {
	colId?: number;
	sort: 'none' | 'ascending' | 'descending';
}

interface ColumnTypeCollection {
	[colId: string]: 'string' | 'number' | 'date';
}

interface RawColumnTypeCollection {
	[colId: string]: RawColumnTypeCount;
}

interface RawColumnTypeCount {
	colId: number;
	number: number;
	date: number;
	string: number;
}

export interface DataTableRow {
	cells: DataTableCell[];
}

export interface DataTableCell {
	raw?: string;
	content: string;
	parsedContent?: string | number | Date;
	align?: 'left' | 'center' | 'right';
	copyButton?: boolean;
}

const TABLE_CLASS_REGEX = /(?:^|\s)table(?:$|\s)/i;
const DEFAULT_PAGE_SIZE = 10;

export default function DataTable(props: IProps) {
	// filterRows filters the input rows using the configured filters
	const filterRows = (): DataTableRow[] => {
		// Return raw data if we don't have info to filter
		if (!columnTypes || Object.keys(columnTypes).length === 0 || !filters || Object.keys(filters).length === 0) return parsedRows;

		// Filter source rows
		let newRows = [] as DataTableRow[];
		let anyValidFilters = false;
		parsedRows.forEach((row) => {
			let filterMatch: boolean | undefined;
			Object.keys(filters)
				.map((i) => {
					let ii = parseInt(i);
					return ii;
				})
				// .map(parseInt)
				.forEach((colId) => {
					const filter = filters[colId];
					if (!filter || filter.filter === '' || filter.filter === undefined) return;
					switch (filter.dataType) {
						case 'datetime': {
							const m = filter.filter as moment.Moment | undefined;
							const value = row.cells[colId].parsedContent as Date | undefined;
							if (filterMatch === false || !moment.isMoment(m) || !m.isValid() || !value) return;
							const datePoint = m.toDate();
							filterMatch = filter.filterModifier === 'greaterthan' ? value > datePoint : value < datePoint;
							break;
						}
						case 'number': {
							if (filter.filter === '' || filter.filter === undefined || !filter.filterModifier || filterMatch === false) return;
							if (filter.filterModifier === 'greaterthan' && (row.cells[colId].parsedContent as number) >= filter.filter)
								filterMatch = true;
							else if (filter.filterModifier === 'lessthan' && (row.cells[colId].parsedContent as number) <= filter.filter)
								filterMatch = true;
							else if (filter.filterModifier !== undefined) filterMatch = false;
							// Didn't hit a valid filter, take no action
							if (filterMatch === undefined) return;
							break;
						}
						case 'string':
						default: {
							if (filter.filter === '' || filterMatch === false) return;
							filterMatch = (row.cells[colId].parsedContent as string).includes(filter.filter);
						}
					}
					anyValidFilters = true;
				});
			if (filterMatch === true) newRows.push(row);
		});

		return anyValidFilters ? newRows : parsedRows;
	};

	// sortRows sorts the filtered rows using the configured sorting
	const sortRows = (): DataTableRow[] => {
		// Abort if we can't sort
		if (!colsort || colsort.colId === undefined || filteredRows.length < 2 || !filteredRows[0].cells[colsort.colId]) return filteredRows;

		// Unsort rows
		if (colsort.sort === 'none') {
			return filteredRows;
		}

		// Sort rows
		const i = colsort.colId;
		const isAscending = colsort.sort === 'ascending';
		return [...filteredRows].sort((a, b) => {
			if ((a.cells[i].parsedContent as number) < (b.cells[i].parsedContent as number)) return isAscending ? -1 : 1;
			if ((a.cells[i].parsedContent as number) > (b.cells[i].parsedContent as number)) return isAscending ? 1 : -1;
			return 0;
		});
	};

	// paginateRows returns a subset of the sorted rows based on the pagination state
	const paginateRows = (): DataTableRow[] => {
		if (isPaginated) return sortedRows.slice(pagination.startItem - 1, pagination.endItem);
		return sortedRows;
	};

	const [parsedRows, setParsedRows] = useState([] as DataTableRow[]);
	// Filtered set of rows (first pass)
	const [filteredRows, setFilteredRows] = useState([] as DataTableRow[]);
	// Sorted set of rows (second pass)
	const [sortedRows, setSortedRows] = useState([] as DataTableRow[]);
	// Rows to display in the table (third pass, paginated)
	const [rows, setRows] = useState([] as DataTableRow[]);

	const [filters, setFilters] = useState({} as ColumnFilterCollection);
	const [colsort, setColsort] = useState({ sort: 'none' } as ColumnSort);
	const [pagination, setPagination] = useState({
		page: 1,
		pageSize: DEFAULT_PAGE_SIZE,
		startItem: 1,
		endItem: props.rows.length,
	} as Pagination);
	const [columnTypes, setColumnTypes] = useState({} as ColumnTypeCollection);
	const [isFilterOpen, setIsFilterOpen] = useState(false);

	// "Constructor"
	useEffect(() => {
		// Infer column types
		if (props.rows.length > 0 && props.rows[0].cells.length > 0) {
			// Seed columns
			const cellTypeData = {} as RawColumnTypeCollection;
			props.rows[0].cells.forEach((cell, i) => (cellTypeData[i] = { colId: i, number: 0, date: 0, string: 0 }));
			// Iterate rows and cells to infer and count types
			props.rows.forEach((row) => {
				row.cells.forEach((cell, i) => {
					if (!cell || !cell.content || !cellTypeData[i]) return;

					// Check number first (moment parses numbers as dates successfully)
					// Passing a string to isNaN uses built-in type coersion logic that's different than Number.parseFloat()
					if (!isNaN(cell.content as any) && !isNaN(parseFloat(cell.content))) {
						cellTypeData[i].number++;
						cell.parsedContent = parseFloat(cell.content);
						return;
					}

					// Check date
					if (moment(cell.content, 'M/D/YYYY', true).isValid() || moment(cell.content, 'M-D-YYYY', true).isValid()) {
						cellTypeData[i].date++;
						cell.parsedContent = Date.parse(cell.content);
						return;
					}

					// Default: string
					cellTypeData[i].string++;
					cell.parsedContent = cell.content.toLowerCase();
				});
			});

			// Assign column types
			const newColumnTypes = {} as ColumnTypeCollection;
			for (let i = 0; i < props.rows[0].cells.length; i++) {
				const maxCount = Math.max(cellTypeData[i].date, cellTypeData[i].number, cellTypeData[i].string);
				if (cellTypeData[i].date === maxCount) newColumnTypes[i] = 'date';
				else if (cellTypeData[i].number === maxCount) newColumnTypes[i] = 'number';
				else newColumnTypes[i] = 'string';
			}
			setColumnTypes(newColumnTypes);
			setParsedRows(props.rows);
		}
	}, []);

	// Filter changed
	useEffect(() => {
		const r = filterRows();
		setFilteredRows(r);
	}, [filters, columnTypes, parsedRows]);

	// Sort or filtered rows (source) changed
	useEffect(() => {
		const r = sortRows();
		setSortedRows(r);
	}, [colsort, filteredRows]);

	// Pagination or sorted rows (source) changed
	useEffect(() => {
		const r = paginateRows();
		setRows([...r]);
	}, [pagination, sortedRows]);

	// Consolidation props to identify conditions for rendering
	const isSortable = props.sortable || props.className?.includes('sortable') || props.className?.includes('sort-and-filter');
	const isFilterable = props.filterable || props.className?.includes('filterable') || props.className?.includes('sort-and-filter');
	let isPaginated = props.paginated === true || props.className?.includes('paginated');
	// Forcibly disable pagination
	if (props.paginated === false || props.className?.includes('nopagination')) isPaginated = false;

	// getSortCaret returns the FontAwesome glyph name to use for the column sort indicator based on the current sort configuration
	const getSortCaret = (columnId: number): GenesysDevIcons => {
		if (colsort.colId !== columnId || colsort.sort === 'none') return GenesysDevIcons.AppSort;
		return colsort.sort === 'descending' ? GenesysDevIcons.AppSortDown : GenesysDevIcons.AppSortUp;
	};

	// The filterChanged functions are raised when the user updates a filter column
	const stringFilterChanged = (colId: string, filterValue: string) => {
		const newFilters = { ...filters };
		newFilters[colId] = { colId: parseInt(colId), dataType: 'string', filter: filterValue.toLowerCase() };
		setFilters(newFilters);
	};
	const numberFilterChanged = (colId: string, filterValue: string) => {
		const newFilters = { ...filters };
		const i = parseFloat(filterValue);
		newFilters[colId] = { colId: parseInt(colId), dataType: 'number', filter: isNaN(i) ? undefined : i, filterModifier: 'lessthan' };
		if (filters[colId]) newFilters[colId].filterModifier = filters[colId].filterModifier;
		setFilters(newFilters);
	};
	const numberFilterModifierChanged = (colId: string, filterModifier: FilterModifierGtLt) => {
		const newFilters = { ...filters };
		if (!newFilters[colId]) newFilters[colId] = { colId: parseInt(colId), dataType: 'number', filter: undefined };
		newFilters[colId].filterModifier = filterModifier;
		setFilters(newFilters);
	};
	const dateFilterChanged = (colId: string, filterValue: string) => {
		const newFilters = { ...filters };
		newFilters[colId] = { colId: parseInt(colId), dataType: 'datetime', filter: moment(filterValue), filterModifier: 'lessthan' };
		if (filters[colId]) newFilters[colId].filterModifier = filters[colId].filterModifier;
		setFilters(newFilters);
	};
	const dateFilterModifierChanged = (colId: string, filterModifier: FilterModifierGtLt) => {
		const newFilters = { ...filters };
		if (!newFilters[colId]) newFilters[colId] = { colId: parseInt(colId), dataType: 'datetime', filter: undefined };
		newFilters[colId].filterModifier = filterModifier;
		setFilters(newFilters);
	};

	// paginationChanged is the callback for the Pagination control
	const paginationChanged = (pagination: Pagination) => {
		setPagination(pagination);
	};

	// sortChanged is raised when the user clicks a sortable column header
	const sortChanged = (columnId: string) => {
		const colId = parseInt(columnId);
		const newSort = { ...colsort };
		newSort.colId = colId;
		// Unset column on invalid id
		if (colId < 0 || (rows[0] && colId >= rows[0].cells.length)) newSort.colId = undefined;

		// Update sort order
		if (newSort.colId !== colsort.colId) {
			// New sorts are always descending first
			newSort.sort = 'ascending';
		} else {
			// Rotate sort order
			switch (newSort.sort) {
				case 'ascending': {
					newSort.sort = 'descending';
					break;
				}
				case 'descending': {
					newSort.sort = 'none';
					break;
				}
				default: {
					newSort.sort = 'ascending';
				}
			}
		}

		setColsort(newSort);
	};

	/***** Setup complete, build the component *****/

	// Build column headers
	let columnHeaders;
	if (props.headerRow) {
		columnHeaders = (
			<tr>
				{props.headerRow.cells.map((cell, i) => (
					<td
						key={i}
						align={cell?.align || 'left'}
						className={colsort.colId === i && colsort.sort !== 'none' ? '' : 'unsorted'}
						onClick={isSortable ? () => sortChanged(i.toString()) : undefined}
					>
						<div className={`header-container align-${cell?.align || 'left'}`}>
							{cell?.content ? <MarkdownDisplay markdown={cell.content} /> : null}
							{filters[i] && filters[i].filter !== '' && filters[i].filter !== undefined ? (
								<GenesysDevIcon icon={GenesysDevIcons.AppFilter} className="filter-active-icon" />
							) : (
								''
							)}
							{isSortable ? <GenesysDevIcon icon={getSortCaret(i)} className="sort-icon" /> : null}
						</div>
					</td>
				))}
			</tr>
		);
	}

	// Build filter row
	let filterRow;
	if (isFilterable && Object.keys(columnTypes).length > 0) {
		filterRow = (
			<React.Fragment>
				<tr className="filter-spacer"></tr>
				<tr className="filter-row">
					{Object.keys(columnTypes).map((colId, i) => {
						const columnType = columnTypes[colId];
						switch (columnType) {
							case 'date': {
								return (
									<td key={colId}>
										<div className="sort-date">
											<DxTextbox
												className="date-filter"
												label="Filter date"
												inputType="date"
												onChange={(value) => dateFilterChanged(colId, value)}
												initialValue={moment.isMoment(filters[i]?.filter) ? filters[i]?.filter.format('YYYY-MM-DD') : undefined}
											/>
											<DxToggle
												label="Comparison"
												falseIcon={GenesysDevIcons.AppChevronLeft}
												trueIcon={GenesysDevIcons.AppChevronRight}
												initialValue={filters[i]?.filterModifier === 'greaterthan'}
												onChange={(value) => dateFilterModifierChanged(colId, value === false ? 'lessthan' : 'greaterthan')}
											/>
										</div>
									</td>
								);
							}
							case 'number': {
								return (
									<td key={colId}>
										<div className="sort-numeric">
											<DxTextbox
												label="Value"
												inputType="decimal"
												onChange={(value) => numberFilterChanged(colId, value)}
												placeholder={props.headerRow?.cells[i]?.content}
												initialValue={filters[i]?.filter}
											/>
											<DxToggle
												label="Comparison"
												falseIcon={GenesysDevIcons.AppChevronLeft}
												trueIcon={GenesysDevIcons.AppChevronRight}
												initialValue={filters[i]?.filterModifier === 'greaterthan'}
												onChange={(value) => numberFilterModifierChanged(colId, value === false ? 'lessthan' : 'greaterthan')}
											/>
										</div>
									</td>
								);
							}
							case 'string':
							default: {
								return (
									<td key={colId}>
										<DxTextbox
											label="Filter text"
											inputType="text"
											icon={GenesysDevIcons.AppSearch}
											placeholder={props.headerRow?.cells[i]?.content}
											onChange={(value) => stringFilterChanged(colId, value)}
											clearButton={true}
											initialValue={filters[i]?.filter}
										/>
									</td>
								);
							}
						}
					})}
				</tr>
			</React.Fragment>
		);
	}

	// Build optional table header
	let thead;
	if (columnHeaders || filterRow) {
		thead = (
			<thead>
				{columnHeaders}
				{isFilterOpen ? filterRow : undefined}
			</thead>
		);
	}

	// Make sure classes always has "table"; sometimes it will be provided, sometimes not
	let tableClassName = props.className || '';
	if (tableClassName?.match(TABLE_CLASS_REGEX) === null) {
		tableClassName = 'table ' + tableClassName.trim();
	}

	return (
		<div
			className={`table-container${isPaginated ? ' paginated' : ''}${isSortable ? ' sortable' : ''}${isFilterable ? ' filterable' : ''}`}
		>
			<div className="filter-container">
				<div className="filter-toggle" style={{ visibility: isFilterable ? 'visible' : 'hidden' }}>
					<GenesysDevIcon icon={GenesysDevIcons.AppFilter} onClick={() => setIsFilterOpen(!isFilterOpen)} />
				</div>
				<table className={tableClassName} cellSpacing="0">
					{thead}
					<tbody>
						{rows.map((row, i) => (
							<tr key={i}>
								{row.cells.map((cell, ii) => (
									<td key={ii} align={cell?.align || 'left'}>
										{cell?.content ? (
											<div className={`align-${cell?.align || 'left'}`}>
												<MarkdownDisplay markdown={cell.content} />
												{cell.copyButton ? <CopyButton copyText={cell.content} /> : undefined}
											</div>
										) : null}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{isPaginated ? (
				<Paginator itemCount={sortedRows.length} onPaginationChanged={paginationChanged} minPageSize={DEFAULT_PAGE_SIZE} />
			) : undefined}
		</div>
	);
}

import parseIndentation from './util/IndentationParser';

export const Table = function () {
	const tokenizers = this.Parser.prototype.blockTokenizers;
	const methods = this.Parser.prototype.blockMethods;

	tokenizers.table = () => false;
	tokenizers.customtable = tokenize;
	methods.splice(methods.indexOf('table'), 0, 'customtable');
};

// Row has at least 2 cells: xxx|xxx
const isTableRegex = /^\s*(.+?)\s*\|\s*(.+)(?:\||$)/;
// Expression to identify leading pipe for removal
const cellNormalizerRegex = /^\s*\|{0,1}/;
// Capture everything up to the next (pipe) or (row wrap and EOL) or (EOL)
const cellContentRegex = /^\s*([^|]+?)\s*(\||\\\s*$|$)/;
// NOTE: This regex uses a negative lookbehind to match a pipe that is not preceeded by a backslash. Safari is the only mainstream browser that
//       doesn't support negative lookbehind, so we have to implement a workaround of replacing escaped pipes with a placeholder instead.
// const cellContentRegex = /^\s*(.+?)\s*((?<!\\)\||\\\s*$|$)/;
// Placeholder for escaped pipes
const ESCAPED_PIPE_PLACEHOLDER = '&&&&ESCAPEDPIPE&&&&';
// Row has at least 2 alignment cells: :---:|:---:
const isAlignmentRowRegex = /^.*\s*:*-+:*\s*\|\s*:*-+:*\s*\|{0,1}$/;
// Capture the left/right markers up to the next (pipe) or (EOL)
const alignmentCellRegex = /^\s*\|{0,1}\s*(:*)-+(:*)\s*(?:\||$)/;
// Capture table class spec
const tableClassRegex = /^\s*\{:\s*class\s*=\s*["'](.+?)["']\s*\}/i;

function tokenize(eat, value, silent) {
	try {
		// const tokenizeBlock = this.tokenizeBlock;
		const tableData = {
			className: 'table',
			headerRow: undefined,
			indentation: undefined,
			rows: [],
		};
		const lines = value.split('\n');
		let l = 0;

		// Is there a table?
		if (lines < 2 || !isTableRegex.exec(lines[0]) || !isTableRegex.exec(lines[1])) return false;

		if (silent) return true;

		// Set indentation
		tableData.indentation = parseIndentation(lines[0]).indentation;

		// Parse alignment and header
		let alignment = parseAlignmentLine(lines[1]);
		if (alignment) {
			// First row is header
			tableData.headerRow = parseLine(lines[0], alignment);
			l = 2;
		} else {
			alignment = parseAlignmentLine(lines[0]);
			// First row is alignment
			if (alignment) {
				l = 1;
			}
		}

		// Parse content rows
		let rowElements;
		do {
			rowElements = parseLine(lines[l], alignment);
			if (rowElements) {
				if (rowElements.isWrap && tableData.rows.length > 0) {
					// Add to previous row
					const row = tableData.rows[tableData.rows.length - 1];
					row.raw += rowElements.raw;
					rowElements.cells.forEach((cell, i) => (row.cells[i].content += `\n${cell.content}`));
				} else {
					// Add new row
					tableData.rows.push(rowElements);
				}
				l++;
			}
		} while (rowElements);

		// Strip added newline if table is at the end of the page
		if (lines.length === l) {
			tableData.rows[l - 3].raw = /(.*)\n?/.exec(tableData.rows[l - 3].raw)[1];
		}

		// Parse table class
		let tableClass = tableClassRegex.exec(lines.length > l ? lines[l] : '');
		if (tableClass) {
			tableData.className += ` ${tableClass[1]}`;
			l++;
		}

		// Return parsed element
		return eat(lines.slice(0, l).join('\n'))({
			// Expand table data into this object
			...tableData,
			type: 'dataTable',
		});
	} catch (err) {
		// console.error(err);
	}
}

function parseLine(line, alignment) {
	if (!isTableRegex.exec(line)) return;

	const row = { raw: line + '\n', cells: [] };
	let colspanColStart;
	let isCell = false;

	// Prepare content and find indentation
	const lineContent = parseIndentation(line);
	let remainingLine = lineContent.content;

	// Normalize row start to remove leading pipe
	let match = cellNormalizerRegex.exec(remainingLine);
	if (match) {
		remainingLine = remainingLine.substring(match[0].length);
	}

	// Parse cells
	let columnNumber = -1;
	do {
		columnNumber++;

		// Check for colspan
		if (remainingLine.startsWith('|')) {
			colspanColStart = colspanColStart || row.cells.length - 1;
			row.cells[colspanColStart].colspan = row.cells[colspanColStart].colspan || 1;
			row.cells[colspanColStart].colspan++;
			isCell = true;
			row.cells.push(undefined);
			remainingLine = remainingLine.substring(1);
			continue;
		}

		// Replace escaped pipes with placeholder -- this is a workaround beceause safari doesn't support negative lookbehind
		remainingLine = remainingLine.replaceAll(/\\\|/g, ESCAPED_PIPE_PLACEHOLDER);

		// Parse cell content
		const cellContentMatch = cellContentRegex.exec(remainingLine);
		isCell = cellContentMatch !== null;
		if (!isCell) continue;

		row.cells.push({
			content: cellContentMatch[1].replaceAll(ESCAPED_PIPE_PLACEHOLDER, '\\|'),
			align: alignment ? alignment[columnNumber] : 'left',
		});

		// Is multi-line?
		if (cellContentMatch[2] === '\\') {
			row.isWrap = true;
		}

		// Remove matched content
		remainingLine = remainingLine.substring(cellContentMatch[0].length);

		// Restore escaped pipes
		remainingLine = remainingLine.replaceAll(ESCAPED_PIPE_PLACEHOLDER, '\\|');
	} while (isCell);

	return row;
}

function parseAlignmentLine(line) {
	if (!isAlignmentRowRegex.exec(line)) return;

	const alignment = [];
	let match;
	do {
		// Parse cell content
		match = alignmentCellRegex.exec(line);
		if (!match) continue;

		// Determine alignment
		if (match[1] && match[2]) alignment.push('center');
		else if (match[2]) alignment.push('right');
		else alignment.push('left');

		// Remove matched content
		line = line.substring(match[0].length);
	} while (match);

	return alignment;
}

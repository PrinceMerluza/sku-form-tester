import parseIndentation from './util/IndentationParser';

export const List = function () {
	// Override tokenizer
	this.Parser.prototype.blockTokenizers.list = tokenize;
};

tokenize.notInLink = true;

const listItemRegex = /^(\s*)([-*+]|\d[.)])\s*(.+)\s*$/;
const areYouSureItsNotJustItalicRegex = /^\s*\*(?:[^* ].*\S|[^* ])\*/;
const areYouSureItsNotJustBoldRegex = /^\s*\*\*(?:[^* ].*\S|[^* ])\*\*/;
// Checks for the line starting with a floating point number
const areYouSureItsNotJustNumericRegex = /^\s*[0-9]+\.[0-9]+\s*/;
const startNumberRegex = /(\d+)/;

function tokenize(eat, value, silent) {
	try {
		const endsWithNewline = value.endsWith('\n');
		const lines = value.split('\n');
		const listData = [];
		let listText = '';

		// Iterate lines until falsy
		const reachedEnd = lines.every((line) => {
			// Look for list item
			let match = listItemRegex.exec(line);
			if (match) {
				// Abort if it's just bold or italic
				if (
					areYouSureItsNotJustBoldRegex.exec(line) ||
					areYouSureItsNotJustItalicRegex.exec(line) ||
					areYouSureItsNotJustNumericRegex.exec(line)
				)
					return false;

				// Determine indentation
				const level = parseIndentation(match[1]).indentation;

				listText += line + '\n';
				listData.push({
					level,
					bullet: match[2],
					text: match[3],
				});
				return true;
			}

			return false;
		});

		// Trim newline for case where list is on last line of the string without a trailing newline to avoid incorrect eating
		if (reachedEnd && !endsWithNewline) {
			listText = listText.substring(0, listText.length - 1);
		}

		// Abort conditions
		if (listData.length > 0) {
			if (silent) {
				return true;
			}
		} else {
			return false;
		}

		// Recurse list data and return tokenized elements
		return addList(eat(listText), this.tokenizeInline.bind(this), listData);
	} catch (err) {
		// console.error(err);
	}
}

function addList(addItem, tokenizeInline, listData, parent, level = 0) {
	let startNumber = startNumberRegex.exec(listData[0].bullet);

	// Create list element and append to parent
	const newItem = {
		type: 'list',
		ordered: startNumber !== null,
		start: startNumber ? startNumber[1] : undefined,
		children: [],
	};
	const listEl = addItem(newItem, parent);

	// Iterate over list data
	while (listData.length > 0) {
		if (listData[0].level === level) {
			// Add list item to list
			const item = listData.shift();
			addItem(
				{
					type: 'listItem',
					children: tokenizeInline(item.text, { line: 1, column: 1 }),
				},
				listEl
			);
		} else if (listData[0].level > level) {
			// Level is increasing
			addList(addItem, tokenizeInline, listData, listEl, level + 1);
		} else {
			// Level is decreasing, abort this loop and return whatever we created
			return listEl;
		}
	}

	return listEl;
}

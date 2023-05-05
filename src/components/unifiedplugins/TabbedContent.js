export const TabbedContent = function () {
	const tokenizers = this.Parser.prototype.blockTokenizers;
	const methods = this.Parser.prototype.blockMethods;

	// Set tokenizer
	tokenizers.tabbedContent = tokenize;

	// Insert processing for this type
	methods.unshift('tabbedContent');
};

tokenize.notInLink = true;

const tabRegex = /^%{3,}\s*(.+)\s*/i;
const endTabRegex = /^%{3,}\s*/i;

function tokenize(eat, value, silent) {
	try {
		const match = tabRegex.exec(value);

		if (match) {
			if (silent) {
				return true;
			}

			const lines = value.split('\n');
			const tabs = {};
			let title;
			let textToEat = '';
			let endline;
			lines.every((line) => {
				// New title?
				const titleMatch = tabRegex.exec(line);
				if (titleMatch) {
					title = titleMatch[1];
					tabs[title] = {
						rawTitle: titleMatch[0],
						formattedTitle: this.tokenizeInline(title, { line: 1, column: 1 }),
						content: '',
					};
					textToEat += titleMatch[0] + '\n';
					return true;
				}

				// End of block?
				const endMatch = endTabRegex.exec(line);
				if (endMatch) {
					endline = line + '\n';
					textToEat += endline;
					return false;
				}

				// Must be content
				tabs[title].content += line + '\n';
				textToEat += line + '\n';
				return true;
			});

			// Return raw data for consumption by react component
			return eat(textToEat)({
				type: 'tabbedContent',
				titles: Object.keys(tabs),
				panes: Object.values(tabs).map((tab) => tab.content),
			});
		}
	} catch (err) {
		// console.log(err);
	}
}

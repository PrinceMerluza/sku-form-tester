export const Headings = function () {
	const tokenizers = this.Parser.prototype.blockTokenizers;
	const methods = this.Parser.prototype.blockMethods;

	// Set interrupts
	this.Parser.prototype.interruptParagraph.push(['customHeading']);
	this.Parser.prototype.interruptList.push(['customHeading']);
	this.Parser.prototype.interruptBlockquote.push(['customHeading']);

	// Disable default heading tokenizer for # syntax
	tokenizers.atxHeading = () => false;
	// Disable default heading tokenizer for underline syntax
	tokenizers.setextHeading = () => false;

	// Set tokenizer
	tokenizers.customHeading = tokenize;

	// Add custom tokenizer to list
	methods.splice(methods.indexOf('atxHeading'), 0, 'customHeading');
};

tokenize.notInLink = true;

function tokenize(eat, value, silent) {
	try {
		const match = /^\s*?(#{1,6})\s*(.+?)\s*#*\s*$/i.exec(value.split('\n')[0]);
		if (match) {
			if (silent) {
				return true;
			}

			const name = match[2].replace(/[^a-z0-9]/gi, '-').toLowerCase();
			const legacyName = match[2].replace(/[^a-z0-9]/gi, '_').toLowerCase();

			return eat(match[0])({
				type: 'customHeading',
				level: match[1].length,
				name: name,
				legacyName: legacyName,
				children: this.tokenizeInline(match[2], { line: 1, column: 1 }),
			});
		}
	} catch (err) {
		// console.log(err);
	}
}

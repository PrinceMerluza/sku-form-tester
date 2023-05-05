export const TableOfContents = function () {
	const tokenizers = this.Parser.prototype.blockTokenizers;
	const methods = this.Parser.prototype.blockMethods;

	// Set tokenizer
	tokenizers.toc = tokenize;

	// Insert processing for this type
	methods.splice(methods.indexOf('alertBlock'), 0, 'toc');
};

tokenize.notInLink = true;

const codeFenceRegex = /^(?:```|~~~)/;
const headingRegex = /^\s*?(#{1,6})\s*(.+?)\s*#*\s*$/i;
const titleRegex = /[^a-z0-9]/gi;

function tokenize(eat, value, silent) {
	const match = /^ *(?:\[|:::)toc(?:\]|:::).*?\n/i.exec(value);

	if (match) {
		if (silent) {
			return true;
		}

		let children = getHeaders(value, this.tokenizeInline.bind(this));

		return eat(match[0])({
			type: 'toc',
			children: children,
		});
	}
}

function getHeaders(value, tokenizeInline) {
	try {
		const lines = value.split('\n');
		const children = [];
		let insideCodeFence = false;

		lines.forEach((line) => {
			// Check for code fences and ignore if inside one
			if (codeFenceRegex.exec(line)) return (insideCodeFence = !insideCodeFence);
			if (insideCodeFence) return;

			// Check for heading
			const match = headingRegex.exec(line);
			if (!match) return;

			// Add toc link
			const name = match[2].replace(titleRegex, '-').toLowerCase();
			children.push({
				type: 'tocLink',
				level: match[1].length,
				name: name,
				children: tokenizeInline(match[2], { line: 1, column: 1 }),
			});
		});

		return children;
	} catch (err) {
		// console.log(err);
	}
}

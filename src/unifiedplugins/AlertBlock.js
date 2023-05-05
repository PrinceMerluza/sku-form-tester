import parseIndentation from './util/IndentationParser';

export const AlertBlock = function () {
	const tokenizers = this.Parser.prototype.blockTokenizers;
	const methods = this.Parser.prototype.blockMethods;

	// Set tokenizer
	tokenizers.alertBlock = tokenize;

	// Insert processing for this type
	methods.splice(methods.indexOf('blockquote'), 0, 'alertBlock');
};

tokenize.notInLink = true;

//remove indentation from alert content
function filterIndentation(textContent) {
	const sliceIndex = textContent[0].indexOf(textContent[0].trim());
	const splitText = textContent[3].split(/(\r?\n){1,}/).filter((element) => element && !element.includes('\n') && !element.includes('\r')); //split regex matches one or more newline
	let fullText = '';
	for (let text of splitText) {
		fullText += text.substring(sliceIndex) + '\n\n';
	}
	textContent[3] = fullText;
}

function tokenize(eat, value, silent) {
	try {
		const match = /^(\s*):{3,}(.*)\n([\s\S]+?\n)\s*:{3,}.*/i.exec(value);

		if (match) {
			if (silent) return true;

			// Determine indentation
			const indentation = parseIndentation(match[1]).indentation;
			if (indentation) {
				filterIndentation(match);
			}

			let attrs = {};
			try {
				attrs = JSON.parse(match[2]);
			} catch (err) {
				attrs.alert = match[2] || 'vanilla';
			}

			// Overrides to reassign legacy options
			if (attrs.alert) {
				switch (attrs.alert.toLowerCase()) {
					case 'error':
					case 'danger': {
						attrs.alert = 'critical';
						break;
					}
					case 'vanilla':
					case 'secondary':
					case 'primary': {
						attrs.alert = 'info';
						break;
					}
					default: {
						attrs.alert = attrs.alert.toLowerCase();
					}
				}
			}

			return eat(match[0])({
				type: 'alertBlock',
				alertType: (attrs.alert || '').toLowerCase(),
				title: attrs.title,
				autoCollapse: attrs.autoCollapse,
				collapsible: attrs.collapsible,
				children: this.tokenizeBlock(match[3], { line: 1, column: 1 }),
				indentation,
			});
		}
	} catch (err) {
		// console.log(err);
	}
}

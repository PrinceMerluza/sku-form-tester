import parseIndentation from './util/IndentationParser';

export const Paragraph = function () {
	this.Parser.prototype.blockTokenizers.paragraph = tokenize;

	this.Parser.prototype.interruptParagraph.push(['list']);
};

tokenize.notInLink = true;

function tokenize(eat, value, silent) {
	try {
		const paragraphRegex = /\s*?([ \t]*)(.+)(\s*)\n/im;
		const newlineRegex = /\n/g;
		let str = value;
		let match;
		let p = '';

		//TODO: Consider doing this in a loop instead to save cycles; spreading matchAll ensures it runs to the end of the document every time
		let precheck = [...value.matchAll(newlineRegex)];
		if (precheck.length < 2) {
			const indentation = parseIndentation(value).indentation;
			return eat(value)({
				type: 'paragraph',
				children: this.tokenizeInline(value, { line: 1, column: 1 }),
				indentation,
			});
		}

		let indentation;
		while ((match = paragraphRegex.exec(str)) && str.length > 2) {
			if (!indentation) indentation = parseIndentation(match[1]).indentation;

			p += match[0];
			str = str.substr(match[0].length);

			let newlines = [...match[3].matchAll(newlineRegex)];
			if (newlines.length >= 1) {
				if (silent) {
					return true;
				}
				break;
			}

			if (interrupt(this.interruptParagraph, this.blockTokenizers, this, [eat, str, true])) {
				break;
			}
		}

		return eat(p)({
			type: 'paragraph',
			children: this.tokenizeInline(p, { line: 1, column: 1 }),
			indentation,
		});
	} catch (err) {
		// console.error(err);
	}
}

function interrupt(interruptors, tokenizers, ctx, params) {
	let index = -1;
	let interruptor;
	while (++index < interruptors.length) {
		interruptor = interruptors[index];
		if (tokenizers[interruptor[0]].apply(ctx, params)) {
			return true;
		}
	}
}

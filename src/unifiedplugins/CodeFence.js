import parseIndentation from './util/IndentationParser';

/*
 * This custom plugin completely replaces the built-in "code-fenced" and "code-indented" plugins with a single
 * plugin that implements custom behavior.
 */

export const CodeFence = function () {
	const tokenizers = this.Parser.prototype.blockTokenizers;
	const methods = this.Parser.prototype.blockMethods;

	// Set interrupts
	this.Parser.prototype.interruptParagraph.push(['codeFence']);
	this.Parser.prototype.interruptList.push(['codeFence']);
	this.Parser.prototype.interruptBlockquote.push(['codeFence']);

	// Disable existing tokenizers
	tokenizers.indentedCode = () => false;
	tokenizers.fencedCode = () => false;

	// Set new tokenizer
	tokenizers.codeFence = tokenize;

	// Add custom tokenizer to list
	methods.splice(methods.indexOf('fencedCode'), 0, 'codeFence');
};

tokenize.notInLink = true;

function tokenize(eat, value, silent) {
	try {
		// Check for code fences with different delimiters.
		// Doing this twice is more expensive, but it ensures that the open and close markers are matched correctly.
		let match = /^(?:\s*\n)*([ \t]*)`{3,}(.*)\n([\s\S]+?)\n\s*`{3,}.*(?:\n|$)/i.exec(value);
		if (!match) match = /^(?:\s*\n)*([ \t]*)~{3,}(.*)\n([\s\S]+?)\n\s*~{3,}.*(?:\n|$)/i.exec(value);

		if (match) {
			if (silent) {
				return true;
			}

			// Determine indentation
			const fenceIndentation = parseIndentation(match[1]).indentation;

			let attrs = {};
			try {
				attrs = JSON.parse(match[2]);
			} catch (err) {
				attrs.language = match[2] || '';
			}

			let indentation = 0;
			if (match[1]) {
				indentation = match[1].length;
			}

			let content = match[3];

			// Identify and strip inline language from first line. E.g. #!json
			const inlineLanguageMatch = /^#!(.*)\s*/.exec(content);
			if (inlineLanguageMatch) {
				attrs.language = inlineLanguageMatch[1].trim();
				content = content.substr(inlineLanguageMatch[0].length);
			}

			// Strip indentation
			if (indentation > 0) {
				const lines = content.split('\n');
				content = '';
				lines.forEach((line) => {
					if (line.length === indentation) return (content += '\n');
					content += line.substring(indentation) + '\n';
				});
			}

			// Check for language aliases
			switch ((attrs.language || '').toLowerCase()) {
				case 'sh': {
					attrs.language = 'shell';
					break;
				}
				default: {
					break;
				}
			}

			// Convert tabs to spaces
			if (attrs.tabsToSpaces) {
				let spaces = '';
				for (let i = 0; i < attrs.tabsToSpaces; i++) {
					spaces += ' ';
				}
				content = content.replace(/\t/gi, spaces);
			}

			// Replace escaped code fence markers
			content = content.replace(/^(\s*)\\([`~]{3,}.*$)/gm, '$1$2');

			return eat(match[0])({
				type: 'codeFence',
				title: attrs.title,
				maxHeight: attrs.maxHeight,
				autoCollapse: attrs.autoCollapse,
				language: attrs.language,
				showLineNumbers: attrs.showLineNumbers,
				noCollapse: attrs.noCollapse,
				value: content,
				indentation: fenceIndentation,
			});
		}
	} catch (err) {
		// console.log(err);
	}
}

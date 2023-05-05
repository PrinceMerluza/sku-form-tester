export const DxUiComponent = function () {
	// Set tokenizers
	this.Parser.prototype.inlineTokenizers.dxUiComponent = tokenizeInline;
	this.Parser.prototype.blockTokenizers.dxUiComponent = tokenize;

	// Add custom tokenizers to list
	this.Parser.prototype.inlineMethods.splice(0, 0, 'dxUiComponent');
	this.Parser.prototype.blockMethods.splice(0, 0, 'dxUiComponent');
	this.Parser.prototype.interruptParagraph.push(['dxUiComponent']);
};

tokenizeInline.notInLink = true;
tokenizeInline.locator = locate;

const propMatchRegex = /\s*(\S+?)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/i;

function locate(value, fromIndex) {
	if (!value) return -1;
	return value.toLowerCase().indexOf('<dxui:', fromIndex);
}

function tokenizeInline(eat, value, silent) {
	return tokenize(eat, value, silent, true);
}

function tokenize(eat, value, silent, inline) {
	try {
		const match = /^\s*<dxui:(\S+)\s*(.*?)\s*\/>/i.exec(value);
		if (match) {
			if (silent) {
				return true;
			}

			let propStr = match[2];
			let propMatch = propMatchRegex.exec(propStr);
			const props = {};
			while (propMatch) {
				props[propMatch[1]] = propMatch[2];
				propStr = propStr.substring(propMatch[0].length);
				propMatch = propMatchRegex.exec(propStr);
			}

			return eat(match[0])({
				type: 'dxUiComponent',
				component: match[1],
				inline: inline,
				props: props,
			});
		}
	} catch (err) {
		// console.log(err);
	}
}

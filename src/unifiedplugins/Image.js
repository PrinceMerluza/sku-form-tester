export const Image = function () {
	const methods = this.Parser.prototype.inlineMethods;

	this.Parser.prototype.inlineTokenizers.customimage = tokenize;
	methods.splice(methods.indexOf('html'), 0, 'customimage');
};

tokenize.notInLink = true;
tokenize.locator = locate;

function locate(value, fromIndex) {
	return value.indexOf('<', fromIndex);
}

function tokenize(eat, value, silent) {
	try {
		const linkRegex = /^\s*!\[(.*?)\]\((.+?)(?:\s["'](.*?)["'])?\)/i;
		const match = linkRegex.exec(value);
		if (match) {
			if (silent) return true;

			return eat(match[0])({
				type: 'customimage',
				title: match[1] || 'image',
				src: match[2],
				alt: match[3],
			});
		}
	} catch (err) {
		// console.log(err);
	}
}

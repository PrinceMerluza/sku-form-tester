const indentationRegex = /^([ \t]*)(.*?)[ \t]*(?:$|\n)/i;

interface IndentationData {
	indentation: number;
	content: string;
}

export default function parseIndentation(line: string): IndentationData {
	const match = indentationRegex.exec(line);
	let indentation = match ? match[1] : '';
	indentation = indentation.replace(/\t/g, '  ');

	return {
		// one space is an oopsie, two signals intent
		indentation: Math.floor(indentation.length / 2),
		content: match ? match[2] : line,
	};
}

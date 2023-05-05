import { MarkdownAbstractSyntaxTree, MdastPlugin, RenderProps } from 'react-markdown';
import { makeHeadingId } from '../helpers/atoms/inPageHeadings';

interface CustomHeadingSyntaxTree extends MarkdownAbstractSyntaxTree {
	name?: string;
}

export const HeadingTransformer = function (node: MarkdownAbstractSyntaxTree, renderProps?: RenderProps) {
	const headingIds: string[] = [];
	node.children?.forEach((child) => {
		if (child.type === 'customHeading') {
			let heading = child as CustomHeadingSyntaxTree;
			if (!heading.name) return;

			// Determine link
			const link = makeHeadingId(heading.name, headingIds);

			// Transform node's name to use the normalized link
			if (link !== heading.name) {
				heading.name = link;
			}
		}
	});
	return node;
} as MdastPlugin;

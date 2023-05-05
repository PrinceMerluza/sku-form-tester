import React from 'react';
import { default as ReactMarkdown } from 'react-markdown/with-html';

import { default as Renderers } from '../../unifiedplugins/Renderers';
import { AlertBlock } from '../../unifiedplugins/AlertBlock';
import { Headings } from '../../unifiedplugins/Headings';
import { Paragraph } from '../../unifiedplugins/Paragraph';
import { TableOfContents } from '../../unifiedplugins/TableOfContents';
import { CodeFence } from '../../unifiedplugins/CodeFence';
import { Table } from '../../unifiedplugins/Table';
import { Image } from '../../unifiedplugins/Image';
import { List } from '../../unifiedplugins/List';
import { TabbedContent } from '../../unifiedplugins/TabbedContent';
import { DxUiComponent } from '../../unifiedplugins/DxUiComponent';
import { HeadingTransformer } from '../../unifiedplugins/HeadingTransformer';

function MarkdownDisplay(props) {
	const plugins = [AlertBlock, Headings, Paragraph, TableOfContents, CodeFence, Table, Image, List, TabbedContent, DxUiComponent];
	const astPlugins = [HeadingTransformer];
	return <ReactMarkdown source={props.markdown} escapeHtml={false} plugins={plugins} renderers={Renderers} astPlugins={astPlugins} />;
}

export default MarkdownDisplay;

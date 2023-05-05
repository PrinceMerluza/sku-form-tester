import React from 'react';
import { default as ReactMarkdown } from 'react-markdown/with-html';

import { default as Renderers } from '../../unifiedplugins/Renderers';
import { AlertBlock } from '../../unifiedplugins/AlertBlock';
import { Paragraph } from '../../unifiedplugins/Paragraph';
import { CodeFence } from '../../unifiedplugins/CodeFence';
import { Table } from '../../unifiedplugins/Table';
import { Image } from '../../unifiedplugins/Image';
import { List } from '../../unifiedplugins/List';
import { TabbedContent } from '../../unifiedplugins/TabbedContent';
import { DxUiComponent } from '../../unifiedplugins/DxUiComponent';

function MarkdownDisplay(props) {
  const plugins = [
    AlertBlock,
    Paragraph,
    CodeFence,
    Table,
    Image,
    List,
    TabbedContent,
    DxUiComponent,
  ];
  const astPlugins = [HeadingTransformer];
  return (
    <ReactMarkdown
      source={props.markdown}
      escapeHtml={false}
      plugins={plugins}
      renderers={Renderers}
      astPlugins={astPlugins}
    />
  );
}

export default MarkdownDisplay;

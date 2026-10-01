import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from './App';
import { getPageMeta, renderHead } from './meta';
import './styles.css';

export function render(url: string) {
  const meta = getPageMeta(url);
  return {
    appHtml: renderToString(
      <StaticRouter location={url}>
        <App />
      </StaticRouter>,
    ),
    head: renderHead(url),
    status: meta.status,
  };
}

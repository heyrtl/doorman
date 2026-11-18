import { createDoorman } from '@heyrtl/doorman';
import { NextResponse } from 'next/server';
import { getArticle, home, toMarkdown } from './content.js';

const doorman = createDoorman({
  resolve(request) {
    const path = request.nextUrl.pathname;
    const article = path === '/' ? home : getArticle(path.slice('/docs/'.length));
    return article ? { markdown: toMarkdown(article) } : null;
  },
});

export function proxy(request) {
  return doorman(request, () => NextResponse.next());
}

// Only the demo's public page routes participate in negotiation.
export const config = { matcher: ['/', '/docs/:slug'] };

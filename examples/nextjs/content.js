export const home = {
  title: 'Doorman Next.js demo',
  text: 'This site serves HTML and Markdown from shared content.',
};

const articles = {
  'getting-started': {
    title: 'Getting started',
    text: 'The browser loads this guide after the page opens. Markdown readers receive it in the first response.',
  },
};

export function getArticle(slug) {
  return Object.hasOwn(articles, slug) ? articles[slug] : undefined;
}

export function toMarkdown({ title, text }) {
  return `# ${title}\n\n${text}\n`;
}

import { getArticle } from '../../../../content.js';

export async function GET(_request, { params }) {
  const { slug } = await params;
  const article = getArticle(slug);
  return article ? Response.json(article) : Response.json({ error: 'Not found' }, { status: 404 });
}

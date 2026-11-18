import { notFound } from 'next/navigation';
import { getArticle } from '../../../content.js';
import Article from './article.js';

export default async function Page({ params }) {
  const { slug } = await params;
  if (!getArticle(slug)) notFound();
  return <Article slug={slug} />;
}

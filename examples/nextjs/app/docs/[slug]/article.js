'use client';

import { useEffect, useState } from 'react';

export default function Article({ slug }) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/docs/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Could not load guide');
        return response.json();
      })
      .then(setResult)
      .catch(() => {
        if (!controller.signal.aborted) setResult({ error: true });
      });
    return () => controller.abort();
  }, [slug]);

  if (!result) return <p>Loading guide…</p>;
  if (result.error) return <p>Could not load guide.</p>;
  return <article><h1>{result.title}</h1><p>{result.text}</p></article>;
}

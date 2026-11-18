import { home } from '../content.js';

export default function Home() {
  return (
    <>
      <h1>{home.title}</h1>
      <p>{home.text}</p>
      <a href="/docs/getting-started">Try the client-rendered guide</a>
    </>
  );
}

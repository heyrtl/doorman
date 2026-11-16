import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { createDoorman } from '../src/index.js';

// The browser UI and Markdown renderer use the SAME source record.
const page = { title: 'Hello from Doorman', text: 'This content is rendered by JavaScript in the browser.' };
const doorman = createDoorman({
  resolve(request) {
    if (new URL(request.url).pathname !== '/') return null;
    return { markdown: `# ${page.title}\n\n${page.text}\n` };
  },
});

function app(request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
  if (new URL(request.url).pathname !== '/') return new Response('Not found', { status: 404 });
  const body = `<!doctype html><html lang="en"><head><title>Doorman demo</title></head>
<body><main id="content"></main><script>
const page = ${JSON.stringify(page)};
const heading = document.createElement('h1'); heading.textContent = page.title;
const paragraph = document.createElement('p'); paragraph.textContent = page.text;
document.getElementById('content').append(heading, paragraph);
</script></body></html>`;
  return new Response(request.method === 'HEAD' ? null : body, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

// Demo bridge only. Real apps should use their framework's native Fetch adapter.
export function createDemoServer() {
  return createServer(async (incoming, outgoing) => {
    try {
      const headers = new Headers();
      for (let i = 0; i < incoming.rawHeaders.length; i += 2) {
        headers.append(incoming.rawHeaders[i], incoming.rawHeaders[i + 1]);
      }
      const request = new Request(new URL(incoming.url, 'http://localhost'), { method: incoming.method, headers });
      const response = await doorman(request, app);
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(Buffer.from(await response.arrayBuffer()));
    } catch {
      outgoing.writeHead(500, { 'content-type': 'text/plain', 'cache-control': 'no-store' });
      outgoing.end('Internal server error');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createDemoServer().listen(3000, '127.0.0.1', () => {
    console.log('Doorman demo: http://localhost:3000');
  });
}

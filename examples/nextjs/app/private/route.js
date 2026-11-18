// Represents a route whose existing access policy rejects anonymous requests.
export function GET() {
  return Response.json({ error: 'Sign in required' }, {
    status: 401,
    headers: { 'Cache-Control': 'no-store' },
  });
}

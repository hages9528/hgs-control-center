import { NextResponse } from 'next/server';

export function middleware(request) {
  const path = request.nextUrl.pathname;

  // Health must stay reachable for deployment/readiness probes.
  if (path === '/api/health') return NextResponse.next();

  const user = process.env.DASHBOARD_USER;
  const pass = process.env.DASHBOARD_PASSWORD;
  const notionConfigured = Boolean(process.env.NOTION_API_KEY);

  // Fail closed before live HGS data can ever be exposed.
  if (notionConfigured && (!user || !pass)) {
    return new NextResponse('Dashboard authentication is not configured', { status: 503 });
  }

  // Setup mode: no live Notion data exists yet, so the landing page can show setup status.
  if (!user || !pass) return NextResponse.next();

  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Basic ')) {
    try {
      const decoded = atob(auth.slice(6));
      const idx = decoded.indexOf(':');
      if (idx >= 0) {
        const u = decoded.slice(0, idx);
        const p = decoded.slice(idx + 1);
        if (u === user && p === pass) return NextResponse.next();
      }
    } catch {}
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="HGS Control Center"' },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

import { NextResponse } from 'next/server';

export function proxy(request) {
  const path = request.nextUrl.pathname;

  if (path === '/api/health') return NextResponse.next();

  const user = process.env.DASHBOARD_USER;
  const pass = process.env.DASHBOARD_PASSWORD;
  const notionConfigured = Boolean(process.env.NOTION_API_KEY);

  if (notionConfigured && (!user || !pass)) {
    return new NextResponse('Dashboard authentication is not configured', { status: 503 });
  }

  if (!user || !pass) return NextResponse.next();

  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Basic ')) {
    try {
      const decoded = atob(auth.slice(6));
      const idx = decoded.indexOf(':');
      if (idx >= 0 && decoded.slice(0, idx) === user && decoded.slice(idx + 1) === pass) return NextResponse.next();
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

import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /fonts (inside /public)
     * 4. /icons (inside /public)
     * 5. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api|_next|fonts|icons|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function middleware(req: NextRequest) {
  const ROOT_HOSTNAME: string = process.env.ROOT_HOSTNAME!;
  // FIXME: quick hack to allow for an alternative prod root hostname
  const ROOT_HOSTNAME_ALT: string = process.env.ROOT_HOSTNAME_ALT ?? '';
  const url = req.nextUrl;

  // Get hostname (e.g. vercel.com, test.vercel.app, etc.)
  const hostname = req.headers.get('host') || ROOT_HOSTNAME;

  // If localhost, assign the host value manually
  // If prod, get the custom domain/subdomain value by removing the root URL
  // (in the case of "test.vercel.app", "vercel.app" is the root URL)
  const currentHost =
    process.env.NODE_ENV === 'production' && process.env.VERCEL === '1'
      ? hostname
          .replace(`.${ROOT_HOSTNAME}`, '')
          .replace(`.${ROOT_HOSTNAME_ALT}`, '')
      : hostname.replace(`.localhost:3000`, '');

  // rewrite every matched path to the `/_sites/[site] dynamic route
  url.pathname = `/_multitenant/${currentHost}${url.pathname}`;
  return NextResponse.rewrite(url);
}

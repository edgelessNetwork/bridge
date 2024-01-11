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

const CALDERA_DOMAINS_REGEXS = [
  /.*\.calderabridge.xyz/,
  /.*\.constellationbridge.xyz/,
  /.*\.calderabridge-test.xyz/,
  /.*\.calderabridge-nitro.xyz/,
  /.*\.localhost:3000/,

];

export default async function middleware(req: NextRequest) {
  const ROOT_HOSTNAME: string = process.env.ROOT_HOSTNAME!;
  const url = req.nextUrl;

  // Get hostname (e.g. vercel.com, test.vercel.app, etc.)
  const hostname = req.headers.get('host') || ROOT_HOSTNAME;
  const hostnameIsCaldera = CALDERA_DOMAINS_REGEXS.some((regexp) =>
    regexp.test(hostname)
  );

  // If using Caldera domain, get the name, else use the entire hostname
  const currentHost = hostnameIsCaldera ? hostname.split('.')[0] : hostname;
  // rewrite every matched path to the `/_sites/[site] dynamic route
  url.pathname = `/_multitenant/${currentHost}${url.pathname}`;
  return NextResponse.rewrite(url);
}

export function siteUrl() {
  const u = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000');
  return u.replace(/\/+$/, '');
}
export const absUrl = (path = '/') => siteUrl() + (path.startsWith('/') ? path : '/' + path);

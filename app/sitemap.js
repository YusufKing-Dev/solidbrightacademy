import { prisma } from '@/lib/db';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const base = siteUrl();
  const pages = [
    ['/', 1], ['/about', 0.8], ['/admissions', 0.9], ['/pre-basic', 0.8], ['/basic', 0.8],
    ['/college', 0.8], ['/announcements', 0.6], ['/contact', 0.7],
  ].map(([p, priority]) => ({ url: base + p, changeFrequency: 'monthly', priority }));

  let news = [];
  try {
    const rows = await prisma.announcement.findMany({
      where: { published: true, publishedAt: { lte: new Date() } },
      select: { id: true, updatedAt: true },
    });
    news = rows.map((a) => ({ url: `${base}/announcements/${a.id}`, lastModified: a.updatedAt, priority: 0.5 }));
  } catch (e) { /* database not ready */ }
  return [...pages, ...news];
}

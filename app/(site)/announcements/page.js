import Link from 'next/link';
import { prisma } from '@/lib/db';
import { fmtDate } from '@/lib/utils';

export const metadata = {
  title: 'Announcements | Solid Bright Academy Ilorin',
  description: 'News and announcements from Solid Bright Academy, Upper Gaa Akanbi, Ilorin, Kwara State.',
  alternates: { canonical: '/announcements' },
};

export default async function Announcements() {
  const news = await prisma.announcement.findMany({
    where: { published: true, publishedAt: { lte: new Date() } },
    orderBy: { publishedAt: 'desc' },
    take: 60,
  }).catch(() => []);

  return (
    <>
      <div className="page-head"><div className="container"><h1>Announcements</h1><p className="lead">News and notices from the school.</p></div></div>
      <section className="section">
        <div className="container">
          {news.length === 0 ? (
            <div className="empty"><strong>No announcements yet</strong>New announcements will appear here as soon as the school publishes them.</div>
          ) : (
            <div className="grid g3">
              {news.map((a) => (
                <Link key={a.id} href={`/announcements/${a.id}`} className="card news-card">
                  {a.imageUrl && <img src={a.imageUrl} alt="" loading="lazy" />}
                  <div className="news-meta">{a.category && <span className="tag">{a.category}</span>}{fmtDate(a.publishedAt)}</div>
                  <h3>{a.title}</h3>
                  <p className="muted">{a.content.length > 160 ? a.content.slice(0, 160).trim() + '…' : a.content}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

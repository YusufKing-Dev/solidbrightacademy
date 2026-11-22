import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { fmtDate, lines } from '@/lib/utils';
import ShareButtons from '@/components/ShareButtons';

async function load(id) {
  return prisma.announcement.findFirst({ where: { id, published: true, publishedAt: { lte: new Date() } } }).catch(() => null);
}

export async function generateMetadata({ params }) {
  const a = await load(params.id);
  if (!a) return { title: 'Announcement' };
  return { title: a.title, description: a.content.slice(0, 155), alternates: { canonical: `/announcements/${a.id}` } };
}

export default async function Announcement({ params }) {
  const a = await load(params.id);
  if (!a) notFound();
  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="news-meta">{a.category && <span className="tag">{a.category}</span>}{fmtDate(a.publishedAt)}</div>
          <h1>{a.title}</h1>
        </div>
      </div>
      <section className="section">
        <div className="container prose" style={{ maxWidth: 760 }}>
          {a.imageUrl && <img src={a.imageUrl} alt="" className="photo" style={{ marginBottom: 24 }} />}
          {lines(a.content).map((p, i) => (<p key={i}>{p}</p>))}
          <div style={{ marginTop: 28 }}>
            <p style={{ marginBottom: 8 }}><strong>Share this announcement</strong></p>
            <ShareButtons path={`/announcements/${a.id}`} title={a.title} />
          </div>
          <p style={{ marginTop: 24 }}><Link href="/announcements" className="btn btn-outline">Back to announcements</Link></p>
        </div>
      </section>
    </>
  );
}
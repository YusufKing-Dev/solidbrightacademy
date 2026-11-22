import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import ActionButton from '@/components/ActionButton';
import { setAnnouncementPublished, deleteAnnouncement } from '@/lib/actions/admin-site';
import { fmtDate } from '@/lib/utils';
import { CopyLinkButton } from '@/components/ShareButtons';

export const metadata = { title: 'Announcements', robots: { index: false, follow: false } };

export default async function AnnouncementsAdmin() {
  await requireUser('ADMIN');
  const list = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <>
      <div className="page-title"><h1>Announcements</h1><p>Only published announcements are visible to visitors and students.</p></div>
      <div className="panel">
        <div className="panel-head"><h2>{list.length} announcement{list.length === 1 ? '' : 's'}</h2><Link href="/admin/announcements/new" className="btn btn-primary btn-small">New announcement</Link></div>
        {list.length === 0 ? <div className="empty"><strong>No announcements yet</strong>Write the first one and publish it to the website.</div> : (
          <div className="table-wrap"><table className="rtable">
            <thead><tr><th>Title</th><th>Category</th><th>Date</th><th>Status</th><th></th></tr></thead>
            <tbody>{list.map((a) => (
              <tr key={a.id}>
                <td data-label="Title"><strong>{a.title}</strong></td><td data-label="Category">{a.category || '-'}</td><td data-label="Date">{a.publishedAt ? fmtDate(a.publishedAt) : '-'}</td>
                <td data-label="Status">{a.published ? <span className="pill green">Published</span> : <span className="pill grey">Hidden</span>}</td>
                <td className="wide"><div className="row">
                  <Link className="btn btn-small btn-outline" href={`/admin/announcements/${a.id}`}>Edit</Link>
                  {a.published && <CopyLinkButton path={`/announcements/${a.id}`} />}
                  <ActionButton action={setAnnouncementPublished.bind(null, a.id, !a.published)}>{a.published ? 'Unpublish' : 'Publish'}</ActionButton>
                  <ActionButton action={deleteAnnouncement.bind(null, a.id)} className="btn btn-small btn-danger" confirm="Delete this announcement?">Delete</ActionButton>
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
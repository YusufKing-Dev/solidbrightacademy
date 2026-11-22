import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { AppPill } from '@/components/Status';
import { fmtDate } from '@/lib/utils';

export const metadata = { title: 'Applications', robots: { index: false, follow: false } };

export default async function Applications({ searchParams }) {
  await requireUser('ADMIN');
  const q = String(searchParams?.q || '').trim();
  const status = ['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED', 'ARCHIVED'].includes(searchParams?.status) ? searchParams.status : '';
  const classApplying = String(searchParams?.classApplying || '');
  const apps = await prisma.application.findMany({
    where: {
      ...(status ? { status } : { status: { not: 'ARCHIVED' } }),
      ...(classApplying ? { classApplying } : {}),
      ...(q ? { OR: [{ applicantName: { contains: q, mode: 'insensitive' } }, { guardianName: { contains: q, mode: 'insensitive' } }, { guardianPhone: { contains: q } }] } : {}),
    },
    orderBy: { createdAt: 'desc' }, take: 300,
  });
  const classes = await prisma.schoolClass.findMany({ orderBy: { sortOrder: 'asc' } });
  return (
    <>
      <div className="page-title"><h1>Admission applications</h1><p>Archived applications are hidden unless you filter by Archived.</p></div>
      <div className="panel">
        <form method="get" className="toolbar">
          <label className="field"><span className="lbl">Search</span><input name="q" defaultValue={q} placeholder="Applicant, guardian or phone" /></label>
          <label className="field"><span className="lbl">Status</span>
            <select name="status" defaultValue={status}><option value="">Active (not archived)</option><option value="PENDING">Pending</option><option value="REVIEWED">Reviewed</option><option value="ACCEPTED">Accepted</option><option value="REJECTED">Rejected</option><option value="ARCHIVED">Archived</option></select>
          </label>
          <label className="field"><span className="lbl">Class</span><select name="classApplying" defaultValue={classApplying}><option value="">All classes</option>{classes.map((c) => (<option key={c.id} value={c.name}>{c.name}</option>))}</select></label>
          <button className="btn btn-outline" type="submit">Filter</button>
          <Link href="/admin/applications" className="btn btn-ghost">Clear</Link>
        </form>
        {apps.length === 0 ? <div className="empty"><strong>No applications found</strong>Applications from the website admission form appear here.</div> : (
          <div className="table-wrap"><table className="rtable">
            <thead><tr><th>Applicant</th><th>Class</th><th>Parent or guardian</th><th>Received</th><th>Status</th><th></th></tr></thead>
            <tbody>{apps.map((a) => (
              <tr key={a.id}>
                <td data-label="Applicant"><strong>{a.applicantName}</strong></td><td data-label="Class">{a.classApplying}</td>
                <td data-label="Parent or guardian">{a.guardianName}<br /><a href={`tel:${a.guardianPhone}`}>{a.guardianPhone}</a></td>
                <td data-label="Received">{fmtDate(a.createdAt)}</td><td data-label="Status"><AppPill status={a.status} /></td>
                <td><Link className="btn btn-small btn-outline" href={`/admin/applications/${a.id}`}>Open</Link></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}

import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const metadata = { title: 'Teachers', robots: { index: false, follow: false } };

export default async function Teachers() {
  await requireUser('ADMIN');
  const teachers = await prisma.teacher.findMany({
    include: { user: true, assignments: { include: { class: true } } },
    orderBy: { displayName: 'asc' },
  });
  return (
    <>
      <div className="page-title"><h1>Teachers</h1><p>Teacher accounts and class assignments.</p></div>
      <div className="panel">
        <div className="panel-head"><h2>{teachers.length} teacher{teachers.length === 1 ? '' : 's'}</h2><Link href="/admin/teachers/new" className="btn btn-primary btn-small">Add a teacher</Link></div>
        {teachers.length === 0 ? (
          <div className="empty"><strong>No teachers yet</strong>Add a teacher, set their login name and password, and assign classes.</div>
        ) : (
          <div className="table-wrap"><table className="rtable">
            <thead><tr><th>Name</th><th>Login name</th><th>Phone</th><th>Classes</th><th>Status</th><th></th></tr></thead>
            <tbody>{teachers.map((t) => (
              <tr key={t.id}>
                <td data-label="Name"><strong>{t.displayName}</strong></td>
                <td data-label="Login name">{t.user.username}</td>
                <td data-label="Phone">{t.phone || '-'}</td>
                <td data-label="Classes">{t.assignments.length ? t.assignments.map((a) => a.class.name).join(', ') : <span className="muted">None</span>}</td>
                <td data-label="Status">{t.user.active ? <span className="pill green">Active</span> : <span className="pill grey">Deactivated</span>}</td>
                <td><Link className="btn btn-small btn-outline" href={`/admin/teachers/${t.id}`}>Open</Link></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}

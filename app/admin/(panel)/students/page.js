import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import PortalToggle from '@/components/PortalToggle';
import { setPortalAccess } from '@/lib/actions/admin-people';
import { studentName } from '@/lib/utils';

export const metadata = { title: 'Students', robots: { index: false, follow: false } };
const PAGE = 50;

export default async function Students({ searchParams }) {
  await requireUser('ADMIN');
  const q = String(searchParams?.q || '').trim();
  const classId = String(searchParams?.classId || '');
  const access = String(searchParams?.access || '');
  const page = Math.max(1, parseInt(searchParams?.page, 10) || 1);

  const where = {
    ...(classId ? { classId } : {}),
    ...(access === 'on' ? { portalEnabled: true } : access === 'off' ? { portalEnabled: false } : {}),
    ...(q ? { OR: [
      { firstName: { contains: q, mode: 'insensitive' } }, { surname: { contains: q, mode: 'insensitive' } },
      { otherNames: { contains: q, mode: 'insensitive' } }, { admissionNo: { contains: q, mode: 'insensitive' } },
    ] } : {}),
  };
  const [classes, total, students] = await Promise.all([
    prisma.schoolClass.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.student.count({ where }),
    prisma.student.findMany({ where, include: { class: true, user: { select: { active: true } } }, orderBy: [{ class: { sortOrder: 'asc' } }, { surname: 'asc' }, { firstName: 'asc' }], skip: (page - 1) * PAGE, take: PAGE }),
  ]);
  const qs = (p) => { const u = new URLSearchParams(); if (q) u.set('q', q); if (classId) u.set('classId', classId); if (access) u.set('access', access); u.set('page', p); return '?' + u.toString(); };

  return (
    <>
      <div className="page-title"><h1>Students</h1><p>Student records and portal access.</p></div>
      <div className="panel">
        <div className="panel-head"><h2>{total} student{total === 1 ? '' : 's'}</h2><Link href="/admin/students/new" className="btn btn-primary btn-small">Register a student</Link></div>
        <form method="get" className="toolbar">
          <label className="field"><span className="lbl">Search</span><input name="q" defaultValue={q} placeholder="Name or admission number" /></label>
          <label className="field"><span className="lbl">Class</span>
            <select name="classId" defaultValue={classId}><option value="">All classes</option>{classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}</select>
          </label>
          <label className="field"><span className="lbl">Portal access</span>
            <select name="access" defaultValue={access}><option value="">All</option><option value="on">ON</option><option value="off">OFF</option></select>
          </label>
          <button className="btn btn-outline" type="submit">Filter</button>
          {(q || classId || access) && <Link href="/admin/students" className="btn btn-ghost">Clear</Link>}
        </form>

        {students.length === 0 ? (
          <div className="empty"><strong>No students found</strong>{total === 0 && !q && !classId && !access ? 'Register your first student to get started.' : 'Try a different search or filter.'}</div>
        ) : (
          <div className="table-wrap">
            <table className="rtable">
              <thead><tr><th>Name</th><th>Admission no</th><th>Class</th><th>Parent or guardian</th><th>Portal access</th><th></th></tr></thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td data-label="Name"><strong>{studentName(s)}</strong>{!s.user.active && <span className="pill grey" style={{ marginLeft: 8 }}>Inactive</span>}</td>
                    <td data-label="Admission no">{s.admissionNo}</td>
                    <td data-label="Class">{s.class.name}</td>
                    <td data-label="Parent or guardian">{s.guardianName}<br /><a href={`tel:${s.guardianPhone}`}>{s.guardianPhone}</a></td>
                    <td data-label="Portal access"><PortalToggle action={setPortalAccess.bind(null, s.id)} enabled={s.portalEnabled} name={studentName(s)} /></td>
                    <td><Link className="btn btn-small btn-outline" href={`/admin/students/${s.id}`}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > PAGE && (
          <div className="row" style={{ marginTop: 14 }}>
            {page > 1 && <Link className="btn btn-outline btn-small" href={qs(page - 1)}>Previous</Link>}
            <span className="muted small">Page {page} of {Math.ceil(total / PAGE)}</span>
            {page * PAGE < total && <Link className="btn btn-outline btn-small" href={qs(page + 1)}>Next</Link>}
          </div>
        )}
      </div>
    </>
  );
}

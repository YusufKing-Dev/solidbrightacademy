import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { getCurrent } from '@/lib/academic';
import ActionForm from '@/components/ActionForm';
import { setCurrentPeriod } from '@/lib/actions/admin-academic';
import { AppPill } from '@/components/Status';
import { fmtDate, TERM_NAMES } from '@/lib/utils';

export const metadata = { title: 'Admin Dashboard', robots: { index: false, follow: false } };

export default async function AdminHome() {
  await requireUser('ADMIN');
  const { session, term, termName } = await getCurrent();
  const [students, teachers, classes, pendingApps, pending, approved, published, on, off, sessions, recent] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.schoolClass.count(),
    prisma.application.count({ where: { status: 'PENDING' } }),
    prisma.resultSubmission.count({ where: { status: 'PENDING' } }),
    prisma.resultSubmission.count({ where: { status: 'APPROVED' } }),
    prisma.resultSubmission.count({ where: { published: true } }),
    prisma.student.count({ where: { portalEnabled: true } }),
    prisma.student.count({ where: { portalEnabled: false } }),
    prisma.academicSession.findMany({ orderBy: { name: 'desc' } }),
    prisma.application.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
  ]);

  return (
    <>
      <div className="page-title"><h1>Dashboard</h1><p>{session ? `Academic session ${session.name}, ${termName}` : 'Set the current session and term below.'}</p></div>

      <div className="stats">
        <Link href="/admin/students" className="stat"><strong>{students}</strong><span>Students</span></Link>
        <Link href="/admin/teachers" className="stat"><strong>{teachers}</strong><span>Teachers</span></Link>
        <Link href="/admin/classes" className="stat"><strong>{classes}</strong><span>Classes</span></Link>
        <Link href="/admin/applications" className={'stat' + (pendingApps ? ' hot' : '')}><strong>{pendingApps}</strong><span>Pending applications</span></Link>
        <Link href="/admin/results?status=PENDING" className={'stat' + (pending ? ' hot' : '')}><strong>{pending}</strong><span>Pending results</span></Link>
        <Link href="/admin/results?status=APPROVED" className="stat"><strong>{approved}</strong><span>Approved results</span></Link>
        <Link href="/admin/results" className="stat"><strong>{published}</strong><span>Published results</span></Link>
        <Link href="/admin/students?access=on" className="stat"><strong>{on}</strong><span>Portal ON</span></Link>
        <Link href="/admin/students?access=off" className="stat"><strong>{off}</strong><span>Portal OFF</span></Link>
      </div>

      <div className="panel">
        <h2>Current session and term</h2>
        <p className="muted small">This controls the whole system. Teachers enter results for this term, and all three dashboards show it.</p>
        {sessions.length === 0 ? (
          <div className="notice warn">No session exists yet. <Link href="/admin/sessions">Create the first session</Link>.</div>
        ) : (
          <ActionForm action={setCurrentPeriod} submit="Set as current" className="toolbar">
            <label className="field"><span className="lbl">Session</span>
              <select name="sessionId" defaultValue={session?.id}>{sessions.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}</select>
            </label>
            <label className="field"><span className="lbl">Term</span>
              <select name="termNumber" defaultValue={term?.number || 1}>{[1, 2, 3].map((n) => (<option key={n} value={n}>{TERM_NAMES[n]}</option>))}</select>
            </label>
          </ActionForm>
        )}
      </div>

      <div className="panel">
        <h2>Quick actions</h2>
        <div className="row">
          <Link className="btn btn-primary btn-small" href="/admin/students/new">Register a student</Link>
          <Link className="btn btn-primary btn-small" href="/admin/teachers/new">Add a teacher</Link>
          <Link className="btn btn-outline btn-small" href="/admin/results?status=PENDING">Review results</Link>
          <Link className="btn btn-outline btn-small" href="/admin/announcements/new">New announcement</Link>
          <Link className="btn btn-outline btn-small" href="/admin/applications">Applications</Link>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Latest admission applications</h2><Link className="btn btn-outline btn-small" href="/admin/applications">View all</Link></div>
        {recent.length === 0 ? <div className="empty"><strong>No applications yet</strong>Applications from the website appear here.</div> : (
          <div className="table-wrap"><table className="rtable">
            <thead><tr><th>Applicant</th><th>Class</th><th>Received</th><th>Status</th><th></th></tr></thead>
            <tbody>{recent.map((a) => (
              <tr key={a.id}><td data-label="Applicant"><strong>{a.applicantName}</strong></td><td data-label="Class">{a.classApplying}</td><td data-label="Received">{fmtDate(a.createdAt)}</td><td data-label="Status"><AppPill status={a.status} /></td><td><Link className="btn btn-small btn-outline" href={`/admin/applications/${a.id}`}>Open</Link></td></tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}

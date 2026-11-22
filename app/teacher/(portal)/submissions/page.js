import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { SubmissionPill } from '@/components/Status';
import { TERM_NAMES, fmtDateTime } from '@/lib/utils';

export const metadata = { title: 'My Submissions', robots: { index: false, follow: false } };

export default async function Submissions() {
  const user = await requireUser('TEACHER');
  const classIds = (await prisma.teacherClass.findMany({ where: { teacherId: user.teacher.id }, select: { classId: true } })).map((c) => c.classId);
  const subs = await prisma.resultSubmission.findMany({
    where: { classId: { in: classIds } },
    include: { class: true, subject: true, term: { include: { session: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });
  return (
    <>
      <div className="page-title"><h1>My submissions</h1><p>The status of every result sheet for your classes.</p></div>
      <div className="panel">
        {subs.length === 0 ? (
          <div className="empty"><strong>Nothing submitted yet</strong>Start entering results from the Enter results page.</div>
        ) : (
          <div className="table-wrap">
            <table className="rtable">
              <thead><tr><th>Class</th><th>Subject</th><th>Session and term</th><th>Status</th><th>Updated</th><th></th></tr></thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id}>
                    <td data-label="Class">{s.class.name}</td>
                    <td data-label="Subject">{s.subject.name}</td>
                    <td data-label="Session and term">{s.term.session.name}, {TERM_NAMES[s.term.number]}</td>
                    <td data-label="Status" className="wide"><SubmissionPill status={s.status} published={s.published} />{s.status === 'REJECTED' && s.rejectionReason && <div className="small" style={{ color: 'var(--danger)', marginTop: 6 }}>Reason: {s.rejectionReason}</div>}</td>
                    <td data-label="Updated">{fmtDateTime(s.updatedAt)}</td>
                    <td>{s.term.isCurrent ? <Link className="btn btn-small btn-outline" href={`/teacher/results/${s.classId}/${s.subjectId}`}>Open</Link> : <span className="muted small">Past term</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { getCurrent } from '@/lib/academic';
import { SubmissionPill } from '@/components/Status';

export const metadata = { title: 'Enter Results', robots: { index: false, follow: false } };

export default async function ResultsHome() {
  const user = await requireUser('TEACHER');
  const { session, term, termName } = await getCurrent();
  const links = await prisma.teacherClass.findMany({
    where: { teacherId: user.teacher.id },
    include: { class: { include: { classSubjects: { include: { subject: true } }, _count: { select: { students: true } } } } },
    orderBy: { class: { sortOrder: 'asc' } },
  });
  const subs = term
    ? await prisma.resultSubmission.findMany({ where: { termId: term.id, classId: { in: links.map((l) => l.classId) } } })
    : [];
  const subOf = (c, s) => subs.find((x) => x.classId === c && x.subjectId === s);

  return (
    <>
      <div className="page-title">
        <h1>Enter results</h1>
        <p>{term ? `Results you enter are saved for ${session.name}, ${termName}.` : 'The administrator has not set the current term yet.'}</p>
      </div>
      {!term && <div className="notice warn">Result entry opens once the administrator sets the current session and term.</div>}
      {links.length === 0 && <div className="panel empty"><strong>No classes assigned yet</strong>Ask the school administrator to assign you to a class.</div>}
      {links.map((l) => (
        <div className="panel" key={l.id}>
          <div className="panel-head"><h2>{l.class.name}</h2><span className="muted small">{l.class._count.students} students</span></div>
          {l.class.classSubjects.length === 0 ? (
            <div className="empty"><strong>No subjects set up for this class</strong>Ask the administrator to add subjects to {l.class.name}.</div>
          ) : (
            <div className="table-wrap">
              <table className="rtable">
                <thead><tr><th>Subject</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {[...l.class.classSubjects].sort((a, b) => a.subject.name.localeCompare(b.subject.name)).map((cs) => {
                    const sub = subOf(l.classId, cs.subjectId);
                    const locked = sub && (sub.status === 'PENDING' || sub.status === 'APPROVED');
                    return (
                      <tr key={cs.id}>
                        <td data-label="Subject"><strong>{cs.subject.name}</strong></td>
                        <td data-label="Status">{sub ? <SubmissionPill status={sub.status} published={sub.published} /> : <span className="pill grey">Not started</span>}</td>
                        <td>{term && <Link className="btn btn-small btn-outline" href={`/teacher/results/${l.classId}/${cs.subjectId}`}>{locked ? 'View' : sub ? 'Continue' : 'Start'}</Link>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

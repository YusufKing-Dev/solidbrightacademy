import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { finalizeExpired, pct } from '@/lib/cbt';
import { fmtDateTime } from '@/lib/utils';

export const metadata = { title: 'CBT Exams', robots: { index: false, follow: false } };

export default async function StudentCbt() {
  const user = await requireUser('STUDENT');
  const st = user.student;
  await finalizeExpired({ studentId: st.id });
  const exams = await prisma.cbtExam.findMany({
    where: { classId: st.classId, published: true },
    include: { subject: true, attempts: { where: { studentId: st.id } }, _count: { select: { questions: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const now = new Date();

  return (
    <>
      <div className="page-title"><h1>CBT exams</h1><p>Computer-based tests set by your teachers for {st.class.name}.</p></div>
      {exams.length === 0 ? (
        <div className="panel empty"><strong>No exams for you right now</strong>When a teacher publishes an exam for your class, it will appear here.</div>
      ) : (
        <div className="grid g2">
          {exams.map((e) => {
            const a = e.attempts[0];
            let badge = <span className="pill green">Open</span>;
            let action = <Link href={`/student/cbt/${e.id}`} className="btn btn-primary btn-small">Start exam</Link>;
            if (a && a.submittedAt) {
              badge = <span className="pill blue">Completed</span>;
              action = <Link href={`/student/cbt/${e.id}`} className="btn btn-outline btn-small">{e.showResult ? 'See my score' : 'View'}</Link>;
            } else if (a) {
              badge = <span className="pill yellow">In progress</span>;
              action = <Link href={`/student/cbt/${e.id}`} className="btn btn-yellow btn-small">Continue</Link>;
            } else if (e.startsAt && e.startsAt > now) {
              badge = <span className="pill grey">Opens {fmtDateTime(e.startsAt)}</span>;
              action = null;
            } else if (e.endsAt && e.endsAt < now) {
              badge = <span className="pill red">Closed</span>;
              action = null;
            }
            return (
              <div className="card" key={e.id}>
                <div className="row" style={{ justifyContent: 'space-between' }}><h3 style={{ margin: 0 }}>{e.title}</h3>{badge}</div>
                <p className="muted" style={{ margin: '8px 0 14px' }}>{e.subject.name}<br />{e._count.questions} questions, {e.durationMinutes} minutes</p>
                {a?.submittedAt && e.showResult && <p><strong>Score: {a.score} / {a.totalMarks} ({pct(a.score, a.totalMarks)}%)</strong></p>}
                {action}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
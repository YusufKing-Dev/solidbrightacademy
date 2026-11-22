import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { fmtDateTime } from '@/lib/utils';

export const metadata = { title: 'CBT Exams', robots: { index: false, follow: false } };

export default async function TeacherCbt() {
  const user = await requireUser('TEACHER');
  const classIds = (await prisma.teacherClass.findMany({ where: { teacherId: user.teacher.id }, select: { classId: true } })).map((c) => c.classId);
  const exams = await prisma.cbtExam.findMany({
    where: { classId: { in: classIds } },
    include: { class: true, subject: true, _count: { select: { questions: true, attempts: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return (
    <>
      <div className="page-title"><h1>CBT exams</h1><p>Create computer-based tests for your classes. Students take them in their portal.</p></div>
      <div className="panel">
        <div className="panel-head"><h2>{exams.length} exam{exams.length === 1 ? '' : 's'}</h2>{classIds.length > 0 && <Link href="/teacher/cbt/new" className="btn btn-primary btn-small">Create an exam</Link>}</div>
        {classIds.length === 0 ? (
          <div className="empty"><strong>No classes assigned yet</strong>Ask the school administrator to assign you to a class first.</div>
        ) : exams.length === 0 ? (
          <div className="empty"><strong>No exams yet</strong>Create your first CBT exam, add questions, then publish it.</div>
        ) : (
          <div className="table-wrap"><table className="rtable">
            <thead><tr><th>Exam</th><th>Class and subject</th><th>Questions</th><th>Taken by</th><th>Status</th><th></th></tr></thead>
            <tbody>{exams.map((e) => (
              <tr key={e.id}>
                <td data-label="Exam"><strong>{e.title}</strong><br /><span className="muted small">{e.durationMinutes} min{e.startsAt ? ', opens ' + fmtDateTime(e.startsAt) : ''}</span></td>
                <td data-label="Class and subject">{e.class.name}: {e.subject.name}</td>
                <td data-label="Questions">{e._count.questions}</td>
                <td data-label="Taken by">{e._count.attempts}</td>
                <td data-label="Status">{e.published ? <span className="pill green">Published</span> : <span className="pill grey">Draft</span>}</td>
                <td><Link className="btn btn-small btn-outline" href={`/teacher/cbt/${e.id}`}>Open</Link></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
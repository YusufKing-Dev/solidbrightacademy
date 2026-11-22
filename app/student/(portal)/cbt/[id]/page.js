import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { finalizeExpired, pct } from '@/lib/cbt';
import ActionForm from '@/components/ActionForm';
import CbtRunner from '@/components/CbtRunner';
import { startExam } from '@/lib/actions/cbt-student';
import { fmtDateTime } from '@/lib/utils';

export const metadata = { title: 'CBT Exam', robots: { index: false, follow: false } };

export default async function ExamPage({ params }) {
  const user = await requireUser('STUDENT');
  const st = user.student;
  const exam = await prisma.cbtExam.findFirst({ where: { id: params.id, classId: st.classId }, include: { subject: true, _count: { select: { questions: true } } } });
  if (!exam) notFound();
  await finalizeExpired({ examId: exam.id, studentId: st.id });
  const attempt = await prisma.cbtAttempt.findUnique({ where: { examId_studentId: { examId: exam.id, studentId: st.id } } });
  if (!exam.published && !attempt) notFound();

  // ---- finished: show the result
  if (attempt && attempt.submittedAt) {
    return (
      <>
        <div className="page-title"><h1>{exam.title}</h1><p><Link href="/student/cbt">All exams</Link>, {exam.subject.name}</p></div>
        <div className="panel score-box">
          <p className="muted">Your exam has been submitted.</p>
          {exam.showResult
            ? <><strong>{attempt.score} / {attempt.totalMarks}</strong><p>{pct(attempt.score, attempt.totalMarks)}%</p></>
            : <p>Your teacher will share your result.</p>}
          <Link href="/student/cbt" className="btn btn-primary">Back to exams</Link>
        </div>
      </>
    );
  }

  // ---- in progress: show the exam
  if (attempt) {
    const ids = Array.isArray(attempt.order) ? attempt.order : [];
    const rows = await prisma.cbtQuestion.findMany({ where: { examId: exam.id }, select: { id: true, text: true, options: true, sortOrder: true } });
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
    const ordered = (ids.length ? ids.map((id) => byId[id]).filter(Boolean) : rows.sort((a, b) => a.sortOrder - b.sortOrder))
      .map((r) => ({ id: r.id, text: r.text, options: r.options })); // the correct answer is never sent
    return (
      <CbtRunner
        attemptId={attempt.id}
        title={exam.title}
        questions={ordered}
        initialAnswers={attempt.answers || {}}
        deadline={attempt.deadline.getTime()}
        serverNow={Date.now()}
      />
    );
  }

  // ---- not started: instructions
  const now = new Date();
  const notYet = exam.startsAt && exam.startsAt > now;
  const closed = exam.endsAt && exam.endsAt < now;
  return (
    <>
      <div className="page-title"><h1>{exam.title}</h1><p><Link href="/student/cbt">All exams</Link>, {exam.subject.name}</p></div>
      <div className="panel">
        <dl className="dl">
          <div><dt>Questions</dt><dd>{exam._count.questions}</dd></div>
          <div><dt>Time allowed</dt><dd>{exam.durationMinutes} minutes</dd></div>
          {exam.startsAt && <div><dt>Opens</dt><dd>{fmtDateTime(exam.startsAt)}</dd></div>}
          {exam.endsAt && <div><dt>Closes</dt><dd>{fmtDateTime(exam.endsAt)}</dd></div>}
        </dl>
        {exam.instructions && <p style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>{exam.instructions}</p>}
        <ul className="history" style={{ marginTop: 16 }}>
          <li>You can take this exam only once. The timer starts when you press Start and keeps running if you leave the page.</li>
          <li>Your answers are saved as you choose them. When time is up, the exam is submitted for you.</li>
        </ul>
        <div style={{ marginTop: 20 }}>
          {notYet ? <div className="notice warn">This exam opens on {fmtDateTime(exam.startsAt)}.</div>
            : closed ? <div className="notice err">This exam is closed.</div>
            : <ActionForm action={startExam.bind(null, exam.id)} submit="Start exam" submitClass="btn btn-yellow" confirm="Start the exam now? The timer will begin immediately." />}
        </div>
      </div>
    </>
  );
}
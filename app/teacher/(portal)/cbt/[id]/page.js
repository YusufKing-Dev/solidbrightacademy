import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser, assertTeacherClass } from '@/lib/auth';
import ExamForm from '@/components/ExamForm';
import QuestionForm from '@/components/QuestionForm';
import ActionForm from '@/components/ActionForm';
import ActionButton from '@/components/ActionButton';
import { saveExam, setExamPublished, deleteExam, saveQuestion, deleteQuestion, importQuestions } from '@/lib/actions/cbt';
import { teacherTargets } from '@/lib/cbt';

export const metadata = { title: 'CBT Exam', robots: { index: false, follow: false } };
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export default async function ManageExam({ params }) {
  const user = await requireUser('TEACHER');
  const exam = await prisma.cbtExam.findUnique({
    where: { id: params.id },
    include: { class: true, subject: true, questions: { orderBy: { sortOrder: 'asc' } }, _count: { select: { attempts: true } } },
  });
  if (!exam || !(await assertTeacherClass(user, exam.classId))) notFound(); // only your own classes
  const targets = await teacherTargets(user);
  const locked = exam._count.attempts > 0;
  const total = exam.questions.reduce((n, q) => n + q.marks, 0);

  return (
    <>
      <div className="page-title"><h1>{exam.title}</h1><p><Link href="/teacher/cbt">All exams</Link>, {exam.class.name}: {exam.subject.name}</p></div>

      <div className="panel">
        <div className="row" style={{ marginBottom: 12 }}>
          {exam.published ? <span className="pill green">Published</span> : <span className="pill grey">Draft, not visible to students</span>}
          <span className="pill blue">{exam.questions.length} question{exam.questions.length === 1 ? '' : 's'}</span>
          <span className="pill blue">{total} marks</span>
          <span className="pill grey">{exam._count.attempts} taken</span>
        </div>
        <div className="row">
          {exam.published
            ? <ActionButton action={setExamPublished.bind(null, 'teacher', exam.id, false)} className="btn btn-small btn-outline" confirm="Unpublish this exam? Students will not be able to start it.">Unpublish</ActionButton>
            : <ActionButton action={setExamPublished.bind(null, 'teacher', exam.id, true)} className="btn btn-small btn-yellow" confirm="Publish this exam so the class can start it?">Publish to students</ActionButton>}
          <Link className="btn btn-small btn-primary" href={`/teacher/cbt/${exam.id}/results`}>Results</Link>
          <ActionButton action={deleteExam.bind(null, 'teacher', exam.id)} className="btn btn-small btn-danger" confirm="Delete this exam, its questions and all student attempts? This cannot be undone.">Delete exam</ActionButton>
        </div>
      </div>

      <div className="panel"><h2>Exam settings</h2><ExamForm action={saveExam.bind(null, exam.id)} exam={exam} targets={targets} /></div>

      <div className="panel">
        <h2>Questions</h2>
        {locked && <div className="notice warn">Students have already started this exam, so questions are locked. To change them, clear the attempts from the Results page first.</div>}
        {exam.questions.length === 0 ? <div className="empty"><strong>No questions yet</strong>Add them below, one by one or by pasting many at once.</div> : exam.questions.map((q, n) => (
          <details className="qcard" key={q.id}>
            <summary>{n + 1}. {q.text.length > 90 ? q.text.slice(0, 90) + '…' : q.text} <span className="muted small">({q.marks} mark{q.marks === 1 ? '' : 's'})</span></summary>
            <ol className="opts" type="A">{q.options.map((o, k) => (<li key={k} className={k === q.correctIndex ? 'right' : ''}>{o}{k === q.correctIndex ? ' (correct)' : ''}</li>))}</ol>
            {!locked && (
              <details style={{ marginTop: 12 }}>
                <summary className="btn btn-small btn-outline" style={{ display: 'inline-flex' }}>Edit question</summary>
                <div style={{ marginTop: 12 }}><QuestionForm action={saveQuestion.bind(null, exam.id, q.id)} q={q} /></div>
                <p style={{ marginTop: 10 }}><ActionButton action={deleteQuestion.bind(null, exam.id, q.id)} className="btn btn-small btn-danger" confirm="Delete this question?">Delete question</ActionButton></p>
              </details>
            )}
          </details>
        ))}
      </div>

      {!locked && (
        <>
          <div className="panel"><h2>Add a question</h2><QuestionForm action={saveQuestion.bind(null, exam.id, 'new')} submit="Add question" reset /></div>
          <div className="panel">
            <h2>Paste many questions at once</h2>
            <p className="muted small">Leave a blank line between questions. Put a star after the correct option, or add a line like “Answer: B”.</p>
            <pre style={{ background: 'var(--light)', padding: 12, borderRadius: 10, overflowX: 'auto', fontSize: '.9rem' }}>{`1. What is 2 + 2?
A. 3
B. 4*
C. 5

2. The capital of Nigeria is
A. Lagos
B. Abuja
C. Ilorin
Answer: B`}</pre>
            <ActionForm action={importQuestions.bind(null, exam.id)} submit="Add these questions" className="form-grid" resetOnSuccess>
              <label className="field"><span className="lbl">Questions</span><textarea name="bulk" rows={10} required /></label>
              <label className="field"><span className="lbl">Marks for each question</span><input name="marks" type="number" min="0.5" max="100" step="0.5" defaultValue={1} style={{ maxWidth: 120 }} /></label>
            </ActionForm>
          </div>
        </>
      )}
    </>
  );
}
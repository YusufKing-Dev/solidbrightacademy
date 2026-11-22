import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import ExamForm from '@/components/ExamForm';
import { saveExam } from '@/lib/actions/cbt';
import { teacherTargets } from '@/lib/cbt';

export const metadata = { title: 'Create CBT Exam', robots: { index: false, follow: false } };

export default async function NewExam() {
  const user = await requireUser('TEACHER');
  const targets = await teacherTargets(user);
  return (
    <>
      <div className="page-title"><h1>Create a CBT exam</h1><p><Link href="/teacher/cbt">All exams</Link>. You add the questions on the next page.</p></div>
      <div className="panel">
        {targets.length === 0
          ? <div className="empty"><strong>No classes assigned yet</strong>Ask the school administrator to assign you to a class.</div>
          : <ExamForm action={saveExam.bind(null, 'new')} targets={targets} submit="Create exam" />}
      </div>
    </>
  );
}
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser, assertTeacherClass } from '@/lib/auth';
import CbtResults from '@/components/CbtResults';

export const metadata = { title: 'CBT Results', robots: { index: false, follow: false } };

export default async function TeacherCbtResults({ params }) {
  const user = await requireUser('TEACHER');
  const exam = await prisma.cbtExam.findUnique({ where: { id: params.id }, include: { class: true, subject: true } });
  if (!exam || !(await assertTeacherClass(user, exam.classId))) notFound();
  return (
    <>
      <div className="page-title"><h1>{exam.title}: results</h1><p><Link href={`/teacher/cbt/${exam.id}`}>Back to the exam</Link>, {exam.class.name}: {exam.subject.name}</p></div>
      <div className="panel"><CbtResults exam={exam} scope="teacher" /></div>
    </>
  );
}
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import TeacherForm from '@/components/TeacherForm';
import { createTeacher } from '@/lib/actions/admin-people';

export const metadata = { title: 'Add Teacher', robots: { index: false, follow: false } };

export default async function NewTeacher() {
  await requireUser('ADMIN');
  const classes = await prisma.schoolClass.findMany({ orderBy: { sortOrder: 'asc' } });
  return (
    <>
      <div className="page-title"><h1>Add a teacher</h1><p>Set the login name and password, then choose the classes they teach.</p></div>
      <div className="panel"><TeacherForm action={createTeacher} classes={classes} submit="Create teacher" /></div>
    </>
  );
}

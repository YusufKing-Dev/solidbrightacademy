import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import StudentForm from '@/components/StudentForm';
import { createStudent } from '@/lib/actions/admin-people';

export const metadata = { title: 'Register Student', robots: { index: false, follow: false } };

export default async function NewStudent() {
  await requireUser('ADMIN');
  const classes = await prisma.schoolClass.findMany({ orderBy: { sortOrder: 'asc' } });
  // Suggest the next admission number in the SBA/YEAR/NNN pattern.
  const year = new Date().getFullYear();
  const prefix = `SBA/${year}/`;
  const last = await prisma.student.findMany({ where: { admissionNo: { startsWith: prefix } }, select: { admissionNo: true } });
  const max = last.reduce((m, s) => Math.max(m, parseInt(s.admissionNo.slice(prefix.length), 10) || 0), 0);
  const suggestion = prefix + String(max + 1).padStart(3, '0');
  return (
    <>
      <div className="page-title"><h1>Register a student</h1><p>This creates the student record and their portal login together.</p></div>
      <div className="panel"><StudentForm action={createStudent} classes={classes} suggestion={suggestion} submit="Register student" /></div>
    </>
  );
}

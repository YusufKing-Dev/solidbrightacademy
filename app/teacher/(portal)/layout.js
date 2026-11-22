import DashShell from '@/components/DashShell';
import CurrentTerm from '@/components/CurrentTerm';
import { requireUser } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { logoutAction } from '@/lib/actions/auth';

export default async function TeacherLayout({ children }) {
  const user = await requireUser('TEACHER');
  const s = await getSettings();
  const nav = [
    { href: '/teacher', label: 'Dashboard' },
    { href: '/teacher/classes', label: 'My classes' },
    { href: '/teacher/results', label: 'Enter results' },
    { href: '/teacher/submissions', label: 'Submissions' },
    { href: '/teacher/cbt', label: 'CBT exams' },
  ];
  return (
    <DashShell roleLabel="Teacher" home="/teacher" nav={nav} userName={user.teacher.displayName} logo={s.logo}
      logout={logoutAction.bind(null, 'TEACHER')} topExtra={<CurrentTerm />}>
      {children}
    </DashShell>
  );
}
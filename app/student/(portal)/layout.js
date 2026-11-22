import DashShell from '@/components/DashShell';
import CurrentTerm from '@/components/CurrentTerm';
import { requireUser } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { logoutAction } from '@/lib/actions/auth';
import { studentName } from '@/lib/utils';

export default async function StudentLayout({ children }) {
  const user = await requireUser('STUDENT');
  const s = await getSettings();
  const nav = [
    { href: '/student', label: 'Dashboard' },
    { href: '/student/results', label: 'Check results' },
    { href: '/student/cbt', label: 'CBT exams' },
  ];
  return (
    <DashShell roleLabel="Student Portal" home="/student" nav={nav} userName={studentName(user.student)} logo={s.logo}
      logout={logoutAction.bind(null, 'STUDENT')} topExtra={<CurrentTerm />}>
      {children}
    </DashShell>
  );
}
import DashShell from '@/components/DashShell';
import CurrentTerm from '@/components/CurrentTerm';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { logoutAction } from '@/lib/actions/auth';

export default async function AdminLayout({ children }) {
  const user = await requireUser('ADMIN');
  const [s, pendingResults, pendingApps, unread] = await Promise.all([
    getSettings(),
    prisma.resultSubmission.count({ where: { status: 'PENDING' } }),
    prisma.application.count({ where: { status: 'PENDING' } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
  ]);
  const nav = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/students', label: 'Students' },
    { href: '/admin/teachers', label: 'Teachers' },
    { href: '/admin/classes', label: 'Classes' },
    { href: '/admin/sessions', label: 'Session and term' },
    { href: '/admin/fees', label: 'School fees' },
    { href: '/admin/subjects', label: 'Subjects' },
    { href: '/admin/grading', label: 'Grading' },
    { href: '/admin/results', label: 'Results', badge: pendingResults || null },
    { href: '/admin/cbt', label: 'CBT exams' },
    { href: '/admin/applications', label: 'Applications', badge: pendingApps || null },
    { href: '/admin/messages', label: 'Messages', badge: unread || null },
    { href: '/admin/announcements', label: 'Announcements' },
    { href: '/admin/gallery', label: 'Gallery' },
    { href: '/admin/content', label: 'Website content' },
    { href: '/admin/audit', label: 'Activity log' },
  ];
  return (
    <DashShell roleLabel="Administrator" home="/admin" nav={nav} userName={user.username} logo={s.logo}
      logout={logoutAction.bind(null, 'ADMIN')} topExtra={<CurrentTerm />}>
      {children}
    </DashShell>
  );
}
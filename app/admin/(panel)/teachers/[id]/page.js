import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import TeacherForm from '@/components/TeacherForm';
import ActionForm from '@/components/ActionForm';
import ActionButton from '@/components/ActionButton';
import { updateTeacher, resetTeacherPassword, deleteTeacher } from '@/lib/actions/admin-people';
import { fmtDateTime } from '@/lib/utils';

export const metadata = { title: 'Teacher', robots: { index: false, follow: false } };

export default async function TeacherPage({ params, searchParams }) {
  await requireUser('ADMIN');
  const t = await prisma.teacher.findUnique({ where: { id: params.id }, include: { user: true, assignments: { include: { class: true } } } });
  if (!t) notFound();
  const classes = await prisma.schoolClass.findMany({ orderBy: { sortOrder: 'asc' } });
  return (
    <>
      <div className="page-title"><h1>{t.displayName}</h1><p><Link href="/admin/teachers">All teachers</Link></p></div>
      {searchParams?.created === '1' && (
        <div className="creds" role="status"><strong>Teacher created.</strong> Login name: <code>{t.user.username}</code> and the password you set. They will choose a new password at first login.</div>
      )}
      <div className="panel">
        <dl className="dl">
          <div><dt>Login name</dt><dd>{t.user.username}</dd></div>
          <div><dt>Status</dt><dd>{t.user.active ? <span className="pill green">Active</span> : <span className="pill grey">Deactivated</span>}</dd></div>
          <div><dt>Classes</dt><dd>{t.assignments.length ? t.assignments.map((a) => a.class.name).join(', ') : 'None assigned'}</dd></div>
          <div><dt>Last login</dt><dd>{t.user.lastLoginAt ? fmtDateTime(t.user.lastLoginAt) : 'Never'}</dd></div>
        </dl>
      </div>
      <div className="panel"><h2>Edit teacher</h2><TeacherForm action={updateTeacher.bind(null, t.id)} teacher={t} classes={classes} /></div>
      <div className="panel">
        <h2>Reset password</h2>
        <ActionForm action={resetTeacherPassword.bind(null, t.id)} submit="Reset password" submitClass="btn btn-outline btn-small" className="toolbar" confirm="Reset this teacher's password?">
          <label className="field"><span className="lbl">New password</span><input name="password" required minLength={6} maxLength={60} /></label>
        </ActionForm>
      </div>
      <div className="panel">
        <h2>Delete teacher</h2>
        <p className="muted small">A teacher with result records cannot be deleted. Untick “Account active” above to deactivate instead.</p>
        <ActionButton action={deleteTeacher.bind(null, t.id)} className="btn btn-small btn-danger" confirm={`Delete ${t.displayName} permanently?`}>Delete teacher</ActionButton>
      </div>
    </>
  );
}

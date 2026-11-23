import Link from 'next/link';
import { redirect } from 'next/navigation';
import ActionForm from '@/components/ActionForm';
import PasswordInput from '@/components/PasswordInput';
import { changePasswordAction } from '@/lib/actions/auth';
import { requireUser } from '@/lib/auth';
import { getSettings } from '@/lib/settings';

export default async function PasswordPage({ role, first }) {
  const user = await requireUser(role, { allowMustChange: true });
  // Students keep using their surname, so they have no change-password page.
  if (role === 'STUDENT' && !user.mustChangePassword) redirect('/student');
  const s = await getSettings();
  const must = user.mustChangePassword;
  return (
    <main className="auth">
      <div className="auth-card">
        <img src={s.logo} alt="" className="logo" width="84" height="84" />
        <h1>{must ? 'Choose a new password' : 'Change password'}</h1>
        <p className="sub">
          {must ? 'For your safety, please replace your first password before you continue.' : 'Enter your current password, then choose a new one.'}
        </p>
        <ActionForm action={changePasswordAction.bind(null, role)} submit="Save new password" submitClass="btn btn-primary btn-block" className="form-grid">
          <PasswordInput name="current" label={must ? 'Your first password' : 'Current password'} />
          <PasswordInput name="next" label="New password" autoComplete="new-password" minLength={6} />
          <PasswordInput name="confirm" label="Type the new password again" autoComplete="new-password" minLength={6} />
        </ActionForm>
        {!must && <div className="auth-links"><Link href={`/${role.toLowerCase()}`}>Back to dashboard</Link></div>}
      </div>
    </main>
  );
}
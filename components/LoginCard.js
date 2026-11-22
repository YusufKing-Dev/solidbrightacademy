import Link from 'next/link';
import { redirect } from 'next/navigation';
import ActionForm from '@/components/ActionForm';
import PasswordInput from '@/components/PasswordInput';
import { loginAction } from '@/lib/actions/auth';
import { getSessionUser } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { RESTRICTED_MESSAGE } from '@/lib/utils';
import { restrictedMessage } from '@/lib/fees';

export default async function LoginCard({ role, title, subtitle, userLabel, userHint, restricted, others }) {
  const s = await getSettings();
  const user = await getSessionUser(role);
  let restrictedText = RESTRICTED_MESSAGE;
  if (restricted && user?.student) restrictedText = await restrictedMessage(user.student.classId);
  if (user && user.role === role && (role !== 'STUDENT' || user.student?.portalEnabled)) {
    redirect(`/${role.toLowerCase()}`);
  }
  return (
    <main className="auth">
      <div className="auth-card">
        <img src={s.logo} alt={`${s.schoolName} logo`} className="logo" width="84" height="84" />
        <h1>{title}</h1>
        <p className="sub">{subtitle}</p>
        {restricted && <div className="notice warn" role="alert">{restrictedText}</div>}
        <ActionForm action={loginAction.bind(null, role)} submit="Log in" submitClass="btn btn-primary btn-block" className="form-grid">
          <label className="field">
            <span className="lbl">{userLabel}</span>
            <input name="username" required autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder={userHint} />
          </label>
          <PasswordInput name="password" label="Password" />
        </ActionForm>
        <div className="auth-links">
          <Link href="/">Back to the school website</Link>
          {others}
        </div>
      </div>
    </main>
  );
}
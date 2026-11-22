import PasswordPage from '@/components/PasswordPage';

export const metadata = { title: 'Change password', robots: { index: false, follow: false } };

export default function Page() {
  return <PasswordPage role="TEACHER" />;
}

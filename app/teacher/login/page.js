import Link from 'next/link';
import LoginCard from '@/components/LoginCard';

export const metadata = { title: 'Teacher Login', robots: { index: false, follow: false } };

export default function Page() {
  return (
    <LoginCard
      role="TEACHER"
      title="Teacher Login"
      subtitle="Use the login name and password given to you by the school administrator."
      userLabel="Login name"
      userHint="Mrs. Bello"
      others={<Link href="/student/login">Student Portal</Link>}
    />
  );
}

import Link from 'next/link';
import LoginCard from '@/components/LoginCard';

export const metadata = { title: 'Student Portal Login', robots: { index: false, follow: false } };

export default function Page({ searchParams }) {
  return (
    <LoginCard
      role="STUDENT"
      title="Student Portal"
      subtitle="Log in with your admission number. Your first password is your surname."
      userLabel="Admission number"
      userHint="SBA/2026/015"
      restricted={searchParams?.restricted === '1'}
      others={<Link href="/teacher/login">Teacher login</Link>}
    />
  );
}

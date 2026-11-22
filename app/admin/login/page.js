import LoginCard from '@/components/LoginCard';

export const metadata = { title: 'Administrator Login', robots: { index: false, follow: false } };

export default function Page() {
  return (
    <LoginCard role="ADMIN" title="Administrator Login" subtitle="School management dashboard." userLabel="Username" userHint="admin" />
  );
}

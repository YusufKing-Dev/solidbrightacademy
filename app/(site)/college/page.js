import LevelPage from '@/components/LevelPage';

export const metadata = {
  title: 'Secondary School in Ilorin | College at Solid Bright Academy',
  description:
    'Secondary education in Ilorin at Solid Bright Academy, Upper Gaa Akanbi. Our College section covers JSS 1 to JSS 3 and SS 1 to SS 3. Apply online.',
  alternates: { canonical: '/college' },
};

export default function Page() {
  return (
    <LevelPage
      section="COLLEGE"
      title="Secondary Education in Ilorin"
      intro="Our College section runs from JSS 1 to SS 3."
      field="collegeText"
      image="/images/gallery-4.jpg"
      paragraphs={[
        'Our vision is to help students acquire and uphold the attitudes, values, knowledge and skills that make them confident, responsible and lifelong learners.',
        'Families looking for a secondary school in Ilorin, in Gaa Akanbi or near Agbabiaka, can apply for JSS 1 to SS 3 online.',
      ]}
    />
  );
}

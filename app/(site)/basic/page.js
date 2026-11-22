import LevelPage from '@/components/LevelPage';

export const metadata = {
  title: 'Primary School in Ilorin | Basic Education at Solid Bright Academy',
  description:
    'Primary education in Ilorin at Solid Bright Academy, Upper Gaa Akanbi. Our Basic section covers Basic 1 to Basic 5. Apply for admission online.',
  alternates: { canonical: '/basic' },
};

export default function Page() {
  return (
    <LevelPage
      section="BASIC"
      title="Primary Education in Ilorin"
      intro="Our Basic section builds strong foundations from Basic 1 to Basic 5."
      field="basicText"
      image="/images/gallery-2.jpg"
      paragraphs={[
        'Pupils learn in a caring school that also makes time for events and clubs such as Science Day, Sports Day, Jet Club and Farmers’ Club.',
        'Looking for a private primary school in Ilorin? Solid Bright Academy is in Upper Gaa Akanbi, opposite Agbabiaka L.G.A. Primary School.',
      ]}
    />
  );
}

import LevelPage from '@/components/LevelPage';

export const metadata = {
  title: 'Nursery School in Ilorin | Pre-Basic at Solid Bright Academy',
  description:
    'Nursery and early childhood education in Ilorin at Solid Bright Academy, Upper Gaa Akanbi. Our Pre-Basic section begins with KG. Apply online.',
  alternates: { canonical: '/pre-basic' },
};

export default function Page() {
  return (
    <LevelPage
      section="PRE_BASIC"
      title="Nursery and Early Childhood Education in Ilorin"
      intro="Pre-Basic is where your child’s school journey begins at Solid Bright Academy."
      field="prebasicText"
      image="/images/gallery-1.jpg"
      paragraphs={[
        'The early years shape how children feel about learning. Our mission is a warm, nurturing and stimulating environment where children develop confidence and self-esteem.',
        'Parents searching for a nursery school in Ilorin, near Agbabiaka and Upper Gaa Akanbi, are welcome to visit or apply online.',
      ]}
    />
  );
}

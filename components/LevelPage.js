import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/settings';

// Shared layout for the Pre-Basic, Basic and College pages.
export default async function LevelPage({ section, title, intro, field, paragraphs, image }) {
  const s = await getSettings();
  const classes = await prisma.schoolClass.findMany({ where: { section }, orderBy: { sortOrder: 'asc' } }).catch(() => []);
  return (
    <>
      <div className="page-head">
        <div className="container"><h1>{title}</h1><p className="lead">{intro}</p></div>
      </div>
      <section className="section">
        <div className="container split">
          <div className="prose">
            <h2>What we offer</h2>
            <p>{s[field]}</p>
            {paragraphs.map((p, i) => (<p key={i}>{p}</p>))}
            {classes.length > 0 && (
              <>
                <h3>Classes</h3>
                <div className="chips" style={{ marginTop: 0 }}>{classes.map((c) => (<span key={c.id} className="chip">{c.name}</span>))}</div>
              </>
            )}
            <div className="hero-actions">
              <Link href="/admissions" className="btn btn-yellow">Apply for admission</Link>
              <Link href="/contact" className="btn btn-outline">Contact the school</Link>
            </div>
          </div>
          <img src={image} alt={`${title} at Solid Bright Academy, Upper Gaa Akanbi, Ilorin`} className="photo" loading="lazy" width="1100" height="828" />
        </div>
      </section>
      <section className="section section-light">
        <div className="container">
          <h2>Find us in Upper Gaa Akanbi, Ilorin</h2>
          <p>{s.address} Solid Bright Academy is close to Agbabiaka, and serves families in Gaa Akanbi and across Ilorin, Kwara State.</p>
        </div>
      </section>
    </>
  );
}

import Link from 'next/link';
import { getSettings } from '@/lib/settings';
import { lines } from '@/lib/utils';

export const metadata = {
  title: 'About Solid Bright Academy | Private School in Ilorin',
  description:
    'The story, mission and vision of Solid Bright Academy, a nursery, primary and secondary school at Upper Gaa Akanbi, Ilorin, Kwara State. Established as a lesson centre in 2010.',
  alternates: { canonical: '/about' },
};

export default async function About() {
  const s = await getSettings();
  const paras = String(s.history).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const values = lines(s.coreValues);
  const anthem = String(s.anthem || '').trim();
  const activities = lines(s.activities);

  return (
    <>
      <div className="page-head">
        <div className="container">
          <h1>About Solid Bright Academy</h1>
          <p className="lead">A private school in Upper Gaa Akanbi, Ilorin, teaching children from Pre-Basic to College.</p>
        </div>
      </div>

      <section className="section">
        <div className="container split">
          <div className="prose">
            <h2>Our story</h2>
            {paras.map((p, i) => (<p key={i}>{p}</p>))}
          </div>
          <img src={s.aboutImage} alt="Pupils at Solid Bright Academy in Ilorin" className="photo" loading="lazy" width="1100" height="828" />
        </div>
      </section>

      <section className="section section-light">
        <div className="container grid g2">
          <div className="card"><h2>Our mission</h2><p>{s.mission}</p></div>
          <div className="card"><h2>Our vision</h2><p>{s.vision}</p></div>
        </div>
      </section>

      {values.length > 0 && (
        <section className="section">
          <div className="container">
            <h2>Our core values</h2>
            <ul className="activity-list">{values.map((v) => (<li key={v}>{v}</li>))}</ul>
          </div>
        </section>
      )}

      <section className="section section-light">
        <div className="container">
          <div className="section-head">
            <h2>Our school sections</h2>
            <p className="lead">Nursery, primary and secondary education in Ilorin, all in one school.</p>
          </div>
          <div className="grid g3">
            <div className="card level"><h3>Pre-Basic</h3><p>{s.prebasicText}</p><Link className="more" href="/pre-basic">More about Pre-Basic</Link></div>
            <div className="card level l2"><h3>Basic</h3><p>{s.basicText}</p><Link className="more" href="/basic">More about Basic</Link></div>
            <div className="card level l3"><h3>College</h3><p>{s.collegeText}</p><Link className="more" href="/college">More about College</Link></div>
          </div>
        </div>
      </section>

      {activities.length > 0 && (
        <section className="section">
          <div className="container">
            <h2>Life at Solid Bright Academy</h2>
            <p className="lead">Beyond the classroom, our pupils take part in:</p>
            <ul className="activity-list">{activities.map((a) => (<li key={a}>{a}</li>))}</ul>
          </div>
        </section>
      )}

      {anthem && (
        <section className="section section-light">
          <div className="container">
            <h2>School anthem</h2>
            <p className="anthem">{anthem}</p>
          </div>
        </section>
      )}
    </>
  );
}

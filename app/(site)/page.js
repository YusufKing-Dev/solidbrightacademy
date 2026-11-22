import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSettings, whyItems, phoneList, telHref } from '@/lib/settings';
import { lines, fmtDate } from '@/lib/utils';
import GallerySlideshow from '@/components/GallerySlideshow';

export const metadata = {
  title: { absolute: 'Solid Bright Academy Ilorin | Nursery, Primary and Secondary School in Upper Gaa Akanbi' },
  description:
    'Solid Bright Academy is a private nursery, primary and secondary school in Ilorin, Kwara State. Find quality education near Agbabiaka, Upper Gaa Akanbi. Apply for admission online.',
  alternates: { canonical: '/' },
};

const LEVELS = [
  { key: 'PRE_BASIC', href: '/pre-basic', title: 'Pre-Basic', sub: 'Nursery and early childhood education', field: 'prebasicText', cls: '' },
  { key: 'BASIC', href: '/basic', title: 'Basic', sub: 'Primary education', field: 'basicText', cls: 'l2' },
  { key: 'COLLEGE', href: '/college', title: 'College', sub: 'Secondary education', field: 'collegeText', cls: 'l3' },
];

export default async function Home() {
  const s = await getSettings();
  const [gallery, news, classes] = await Promise.all([
    prisma.galleryImage.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }).catch(() => []),
    prisma.announcement.findMany({
      where: { published: true, publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: 'desc' }, take: 3,
    }).catch(() => []),
    prisma.schoolClass.findMany({ orderBy: { sortOrder: 'asc' } }).catch(() => []),
  ]);
  const phones = phoneList(s);
  const why = whyItems(s);

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="motto">{s.motto}</p>
            <h1>{s.heroTitle}</h1>
            <p className="lead">{s.heroText}</p>
            <div className="hero-actions">
              <Link href="/admissions" className="btn btn-yellow">Apply for Admission</Link>
              <Link href="/about" className="btn btn-outline">Learn More</Link>
            </div>
            <div className="chips" aria-label="School sections">
              <Link href="/pre-basic" className="chip">Pre-Basic</Link>
              <Link href="/basic" className="chip">Basic</Link>
              <Link href="/college" className="chip">College</Link>
            </div>
          </div>
          <div className="hero-media">
            <img src={s.heroImage} alt="The Solid Bright Academy school building in Upper Gaa Akanbi, Ilorin" width="720" height="540" fetchpriority="high" />
          </div>
        </div>
      </section>

      <section className="section" id="about">
        <div className="container split">
          <img src={s.aboutImage} alt="Pupils of Solid Bright Academy, Ilorin, gathered outside the school" className="photo" loading="lazy" width="1100" height="828" />
          <div>
            <h2>A school that has grown with its community</h2>
            <p>{s.aboutIntro}</p>
            <Link href="/about" className="btn btn-outline">Read our full story</Link>
          </div>
        </div>
      </section>

      <section className="section section-light" id="levels">
        <div className="container">
          <div className="section-head">
            <h2>Quality education in Ilorin, from nursery to secondary</h2>
            <p className="lead">Children can start in Pre-Basic and stay with us through Basic and College.</p>
          </div>
          <div className="grid g3">
            {LEVELS.map((l) => (
              <article key={l.key} className={'card level ' + l.cls}>
                <h3>{l.title}</h3>
                <p className="small muted"><strong>{l.sub}</strong></p>
                <p>{s[l.field]}</p>
                <div className="chips" style={{ marginTop: 0, marginBottom: 14 }}>
                  {classes.filter((c) => c.section === l.key).map((c) => (<span key={c.id} className="chip">{c.name}</span>))}
                </div>
                <Link href={l.href} className="more">Learn about {l.title}</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {why.length > 0 && (
        <section className="section" id="why">
          <div className="container">
            <div className="section-head"><h2>Why families choose Solid Bright Academy</h2></div>
            <div className="why">
              {why.map((w) => (
                <div className="why-item" key={w.title}>
                  <h3>{w.title}</h3>
                  {w.text && <p>{w.text}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="slide-section" aria-label="Photo gallery">
          <div className="container">
            <GallerySlideshow images={gallery.map((g) => ({ url: g.url, caption: g.caption }))} />
          </div>
        </section>
      )}

      <section className="cta-band" id="admissions">
        <div className="container split">
          <div>
            <h2>Apply for admission online</h2>
            <p>{s.admissionInfo}</p>
          </div>
          <div className="row"><Link href="/admissions" className="btn btn-yellow">Start your application</Link></div>
        </div>
      </section>

      {news.length > 0 && (
        <section className="section" id="news">
          <div className="container">
            <div className="panel-head">
              <h2>Latest announcements</h2>
              <Link href="/announcements" className="btn btn-outline btn-small">All announcements</Link>
            </div>
            <div className="grid g3">
              {news.map((a) => (
                <Link key={a.id} href={`/announcements/${a.id}`} className="card news-card">
                  {a.imageUrl && <img src={a.imageUrl} alt="" loading="lazy" />}
                  <div className="news-meta">{a.category && <span className="tag">{a.category}</span>}{fmtDate(a.publishedAt)}</div>
                  <h3>{a.title}</h3>
                  <p className="muted">{a.content.length > 130 ? a.content.slice(0, 130).trim() + '…' : a.content}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section section-light" id="proprietress">
        <div className="container prop">
          <img src={s.proprietressPhoto} alt={`${s.proprietressName}, ${s.proprietressTitle} of Solid Bright Academy`} loading="lazy" width="220" height="220" />
          <div>
            <h2>{s.proprietressName}</h2>
            <p className="muted"><strong>{s.proprietressTitle}, {s.schoolName}</strong></p>
            {lines(s.proprietressMessage).length > 0 && (
              <blockquote className="quote-block">
                {lines(s.proprietressMessage).map((p, i) => (<p key={i}>{p}</p>))}
              </blockquote>
            )}
          </div>
        </div>
      </section>

      <section className="section" id="contact">
        <div className="container split">
          <div>
            <h2>Contact us</h2>
            <p className="lead">Visit the school, call, or send a message. We are in Upper Gaa Akanbi, Ilorin.</p>
            <div className="row">
              <Link href="/contact" className="btn btn-primary">Send a message</Link>
              {s.whatsapp && <a className="btn btn-outline" href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener">WhatsApp us</a>}
            </div>
          </div>
          <ul className="contact-list">
            <li><strong>Address</strong>{s.address}</li>
            <li><strong>Phone</strong>{phones.map((p, i) => (<span key={p}>{i > 0 && ', '}<a href={telHref(p)}>{p}</a></span>))}</li>
            <li><strong>Email</strong><a href={`mailto:${s.email}`}>{s.email}</a></li>
          </ul>
        </div>
      </section>
    </>
  );
}
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import { getSettings, phoneList, telHref } from '@/lib/settings';
import { absUrl } from '@/lib/seo';

const abs = (u) => (u && u.startsWith('http') ? u : absUrl(u || '/'));

export default async function SiteLayout({ children }) {
  const s = await getSettings();
  const phones = phoneList(s);
  const ld = {
    '@context': 'https://schema.org',
    '@type': ['School', 'EducationalOrganization'],
    name: s.schoolName,
    alternateName: 'Solid Bright Academy Ilorin',
    url: absUrl('/'),
    logo: abs(s.logo),
    image: abs(s.heroImage),
    description: 'Private nursery, primary and secondary school in Upper Gaa Akanbi, Ilorin, Kwara State.',
    slogan: s.motto,
    foundingDate: '2011',
    telephone: s.hotline,
    email: s.email,
    address: { '@type': 'PostalAddress', streetAddress: s.address, addressLocality: 'Ilorin', addressRegion: 'Kwara State', addressCountry: 'NG' },
    areaServed: ['Ilorin', 'Upper Gaa Akanbi', 'Kwara State'],
    sameAs: [s.facebook, s.instagram].filter(Boolean),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <PublicHeader logo={s.logo} name={s.schoolName} />
      <div id="content">{children}</div>
      <footer className="site-footer">
        <div className="container foot-grid">
          <div>
            <div className="foot-brand">
              <img src={s.logo} alt={`${s.schoolName} logo`} className="foot-logo" width="64" height="64" />
              <strong>{s.schoolName}</strong>
            </div>
            <p>{s.motto}</p>
            <p className="small">Pre-Basic, Basic and College education in Upper Gaa Akanbi, Ilorin, Kwara State.</p>
          </div>
          <div>
            <h3>Explore</h3>
            <ul className="foot-list">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/about">About us</Link></li>
              <li><Link href="/pre-basic">Pre-Basic (Nursery)</Link></li>
              <li><Link href="/basic">Basic (Primary)</Link></li>
              <li><Link href="/college">College (Secondary)</Link></li>
              <li><Link href="/admissions">Admissions</Link></li>
              <li><Link href="/announcements">Announcements</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/student/login">Student Portal</Link></li>
              <li><Link href="/teacher/login">Teacher login</Link></li>
            </ul>
          </div>
          <div>
            <h3>Contact us</h3>
            <ul className="foot-list">
              <li>{s.address}</li>
              {phones.map((p) => (<li key={p}><a href={telHref(p)}>{p}</a></li>))}
              <li><a href={`mailto:${s.email}`}>{s.email}</a></li>
            </ul>
          </div>
        </div>
        <div className="container foot-base">
          <span>© {new Date().getFullYear()} {s.schoolName}. All rights reserved. <Link href="/admin/login">Admin</Link></span>
          <span className="credit">
            Made by <a href="https://hireyusuftech.online" target="_blank" rel="noopener">YusufTech</a>
          </span>
        </div>
      </footer>
    </>
  );
}

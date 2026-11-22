import { getSettings, phoneList, telHref } from '@/lib/settings';
import ActionForm from '@/components/ActionForm';
import HoneyFields from '@/components/HoneyFields';
import { submitContact } from '@/lib/actions/public';

export const metadata = {
  title: 'Contact Solid Bright Academy | Upper Gaa Akanbi, Ilorin',
  description:
    'Contact Solid Bright Academy at PA Jonathan Street, opposite Agbabiaka L.G.A. Primary School, Upper Gaa Akanbi, Ilorin, Kwara State. Phone, email and map.',
  alternates: { canonical: '/contact' },
};

export default async function Contact() {
  const s = await getSettings();
  const phones = phoneList(s);
  const map = `https://www.google.com/maps?q=${encodeURIComponent(s.address)}&output=embed`;
  const dir = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address)}`;

  return (
    <>
      <div className="page-head"><div className="container"><h1>Contact us</h1><p className="lead">We would be glad to hear from you.</p></div></div>
      <section className="section">
        <div className="container split" style={{ alignItems: 'start' }}>
          <div>
            <ul className="contact-list">
              <li><strong>Address</strong>{s.address}</li>
              <li><strong>Phone</strong>{phones.map((p, i) => (<span key={p}>{i > 0 && ', '}<a href={telHref(p)}>{p}</a></span>))}</li>
              <li><strong>Email</strong><a href={`mailto:${s.email}`}>{s.email}</a></li>
              {s.whatsapp && <li><strong>WhatsApp</strong><a href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener">Chat with the school</a></li>}
              {s.facebook && <li><strong>Facebook</strong><a href={s.facebook} target="_blank" rel="noopener">{s.facebook}</a></li>}
              {s.instagram && <li><strong>Instagram</strong><a href={s.instagram} target="_blank" rel="noopener">{s.instagram}</a></li>}
            </ul>
            <p style={{ marginTop: 18 }}><a className="btn btn-outline btn-small" href={dir} target="_blank" rel="noopener">Get directions</a></p>
          </div>
          <div>
            <h2>Send us a message</h2>
            <ActionForm action={submitContact} submit="Send message" replaceOnSuccess className="form-grid">
              <HoneyFields />
              <label className="field"><span className="lbl req">Your name</span><input name="name" required minLength={2} maxLength={100} autoComplete="name" /></label>
              <label className="field"><span className="lbl req">Email</span><input name="email" type="email" required autoComplete="email" /></label>
              <label className="field"><span className="lbl">Phone (optional)</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" /></label>
              <label className="field"><span className="lbl">Subject (optional)</span><input name="subject" maxLength={150} /></label>
              <label className="field"><span className="lbl req">Message</span><textarea name="message" required minLength={10} maxLength={3000} rows={5} /></label>
            </ActionForm>
          </div>
        </div>
      </section>
      <section className="section section-light">
        <div className="container">
          <iframe className="map" title="Map showing Solid Bright Academy in Upper Gaa Akanbi, Ilorin" src={map} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      </section>
    </>
  );
}

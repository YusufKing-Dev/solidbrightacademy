import './globals.css';
import './extra.css';
import { Lexend, Nunito_Sans } from 'next/font/google';
import Script from 'next/script';
import { getSettings } from '@/lib/settings';
import { siteUrl } from '@/lib/seo';

const lexend = Lexend({ subsets: ['latin'], variable: '--font-lexend', display: 'swap' });
const nunito = Nunito_Sans({ subsets: ['latin'], variable: '--font-nunito', display: 'swap' });

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const s = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: 'Solid Bright Academy Ilorin | Nursery, Primary and Secondary School in Upper Gaa Akanbi',
      template: '%s | Solid Bright Academy Ilorin',
    },
    description:
      'Solid Bright Academy is a private nursery, primary and secondary school in Ilorin, Kwara State, at Upper Gaa Akanbi near Agbabiaka. Quality early childhood, primary and secondary education.',
    applicationName: 'Solid Bright Academy',
    openGraph: {
      type: 'website', locale: 'en_NG', siteName: 'Solid Bright Academy Ilorin',
      images: [{ url: s.logo }],
    },
    twitter: { card: 'summary' },
    icons: { icon: s.logo, apple: s.logo },
    robots: { index: true, follow: true },
    verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  };
}

export default async function RootLayout({ children }) {
  const ga = /^G-[A-Z0-9]+$/i.test(process.env.NEXT_PUBLIC_GA_ID || '') ? process.env.NEXT_PUBLIC_GA_ID : null;
  return (
    <html lang="en" className={`${lexend.variable} ${nunito.variable}`}>
      <body>
        {children}
        {ga && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/admissions', label: 'Admissions' },
  { href: '/announcements', label: 'Announcements' },
  { href: '/contact', label: 'Contact' },
];

export default function PublicHeader({ logo, name }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const active = (h) => (h === '/' ? path === '/' : path.startsWith(h));

  return (
    <header className="site-header">
      <div className="container header-row">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <img src={logo} alt={`${name} logo`} className="brand-logo" width="52" height="52" />
          <span className="brand-name">{name}</span>
        </Link>
        <button type="button" className="menu-btn" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen((o) => !o)}>
          <span className="sr">Menu</span>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
        <nav id="site-nav" className={'site-nav' + (open ? ' open' : '')} aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={'nav-link' + (active(l.href) ? ' active' : '')} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link href="/student/login" className="btn btn-primary btn-small nav-cta" onClick={() => setOpen(false)}>
            Student Portal
          </Link>
        </nav>
      </div>
    </header>
  );
}

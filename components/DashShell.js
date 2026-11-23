'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Shared layout for the admin, teacher and student dashboards.
export default function DashShell({ roleLabel, home, nav, userName, logo, logout, topExtra, canChangePassword = true, children }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const active = (h) => (h === home ? path === home : path.startsWith(h));

  return (
    <div className="dash">
      <aside className={'dash-side' + (open ? ' open' : '')}>
        <Link href={home} className="dash-brand" onClick={() => setOpen(false)}>
          <span className="dash-logo"><img src={logo} alt="" width="40" height="40" /></span>
          <span><strong>Solid Bright Academy</strong><small>{roleLabel}</small></span>
        </Link>
        <nav className="dash-nav" aria-label={roleLabel + ' menu'}>
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={active(n.href) ? 'active' : ''} onClick={() => setOpen(false)}>
              {n.label}
              {n.badge ? <span className="badge">{n.badge}</span> : null}
            </Link>
          ))}
        </nav>
        <div className="dash-foot">
          <div className="dash-user">{userName}</div>
          {canChangePassword && <Link href={home + '/password'} className="dash-small" onClick={() => setOpen(false)}>Change password</Link>}
          <form action={logout}><button type="submit" className="btn btn-yellow btn-small btn-block">Log out</button></form>
          <Link href="/" className="dash-small" target="_blank">View school website</Link>
        </div>
      </aside>
      {open && <button type="button" className="dash-scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <div className="dash-main">
        <header className="dash-top">
          <button type="button" className="menu-btn dash-menu" aria-label="Open menu" onClick={() => setOpen(true)}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <div className="dash-top-extra">{topExtra}</div>
        </header>
        <main className="dash-content">{children}</main>
      </div>
    </div>
  );
}
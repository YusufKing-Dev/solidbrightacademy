'use client';
import { useEffect, useState } from 'react';

function useOrigin() {
  const [origin, setOrigin] = useState('');
  useEffect(() => { setOrigin(window.location.origin); }, []);
  return origin;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const t = document.createElement('textarea');
      t.value = text;
      t.style.position = 'fixed';
      t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      const done = document.execCommand('copy');
      document.body.removeChild(t);
      return done;
    } catch {
      return false;
    }
  }
}

// Small "Copy link" button (used in the admin list).
export function CopyLinkButton({ path, className = 'btn btn-small btn-outline' }) {
  const origin = useOrigin();
  const [state, setState] = useState('idle');
  async function onClick() {
    const ok = await copyText(origin + path);
    setState(ok ? 'done' : 'fail');
    setTimeout(() => setState('idle'), 2000);
  }
  return (
    <button type="button" className={className} onClick={onClick} disabled={!origin}>
      {state === 'done' ? 'Link copied' : state === 'fail' ? 'Copy failed' : 'Copy link'}
    </button>
  );
}

// Share row for the public announcement page.
export default function ShareButtons({ path, title }) {
  const origin = useOrigin();
  if (!origin) return null;
  const url = origin + path;
  const text = encodeURIComponent(title);
  const u = encodeURIComponent(url);
  const links = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}` },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: 'X', href: `https://twitter.com/intent/tweet?text=${text}&url=${u}` },
  ];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {links.map((l) => (
        <a key={l.label} className="btn btn-small btn-outline" href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>
      ))}
      <CopyLinkButton path={path} />
    </div>
  );
}
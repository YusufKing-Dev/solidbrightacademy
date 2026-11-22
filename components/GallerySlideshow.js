'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// One photo at a time. Moves on by itself every few seconds and loops forever.
// Pauses on hover or touch. Visitors can also swipe or use the arrows and dots.
export default function GallerySlideshow({ images, interval = 4500 }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);
  const resume = useRef(null);
  const n = images.length;

  const go = useCallback((d) => setI((x) => (x + d + n) % n), [n]);

  useEffect(() => {
    if (n < 2 || paused) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % n), interval);
    return () => clearInterval(t);
  }, [n, paused, interval]);

  useEffect(() => () => clearTimeout(resume.current), []);

  if (!n) return null;

  const hold = (ms) => {
    setPaused(true);
    clearTimeout(resume.current);
    resume.current = setTimeout(() => setPaused(false), ms);
  };

  return (
    <div
      className="slideshow"
      role="region"
      aria-roledescription="carousel"
      aria-label="Photos from Solid Bright Academy"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; hold(6000); }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      }}
    >
      {images.map((g, k) => (
        <div className={'slide' + (k === i ? ' active' : '')} key={k} aria-hidden={k === i ? undefined : 'true'}>
          <div className="slide-bg" style={{ backgroundImage: `url(${JSON.stringify(g.url)})` }} />
          <img
            src={g.url}
            alt={g.caption || 'Pupils and school life at Solid Bright Academy, Ilorin'}
            loading={k === 0 ? 'eager' : 'lazy'}
            decoding="async"
            draggable="false"
          />
        </div>
      ))}
      {n > 1 && (
        <>
          <button type="button" className="ss-btn ss-prev" aria-label="Previous photo" onClick={() => { go(-1); hold(6000); }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button type="button" className="ss-btn ss-next" aria-label="Next photo" onClick={() => { go(1); hold(6000); }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
          <div className="ss-dots">
            {images.map((_, k) => (
              <button type="button" key={k} className={'ss-dot' + (k === i ? ' on' : '')} aria-label={`Show photo ${k + 1}`} aria-current={k === i ? 'true' : undefined} onClick={() => { setI(k); hold(6000); }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
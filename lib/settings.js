import { cache } from 'react';
import { prisma } from './db';
import { DEFAULTS } from './defaults';
import { lines } from './utils';

export const getSettings = cache(async () => {
  let rows = [];
  try {
    rows = await prisma.siteSetting.findMany();
  } catch (e) {
    rows = [];
  }
  const s = { ...DEFAULTS };
  for (const r of rows) s[r.key] = r.value;
  return s;
});

export function whyItems(s) {
  return lines(s.whyChoose).map((l) => {
    const [t, ...rest] = l.split('|');
    return { title: t.trim(), text: rest.join('|').trim() };
  });
}

export const phoneList = (s) => [s.hotline, ...lines(s.otherPhones)].filter(Boolean);
export const telHref = (p) => 'tel:' + String(p).replace(/[^\d+]/g, '');

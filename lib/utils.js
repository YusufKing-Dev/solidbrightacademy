import { headers } from 'next/headers';
import { createHash } from 'crypto';

export const SECTION_LABEL = { PRE_BASIC: 'Pre-Basic', BASIC: 'Basic', COLLEGE: 'College' };
export const TERM_NAMES = { 1: '1st Term', 2: '2nd Term', 3: '3rd Term' };
export const RESTRICTED_MESSAGE =
  'Your portal access is currently restricted. Please contact the school administration regarding your school fees.';

export const normKey = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
export const normAdmission = (s) => String(s || '').trim().toUpperCase().replace(/\s+/g, '');
export const loginKey = (role, username) =>
  role === 'STUDENT' ? normAdmission(username).toLowerCase() : normKey(username);

export const studentName = (s) => [s.firstName, s.otherNames, s.surname].filter(Boolean).join(' ');

export function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Lagos',
  });
}
export function fmtDateTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos',
  });
}
export const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function str(fd, key, max = 500) {
  return String(fd.get(key) ?? '').trim().slice(0, max);
}

export function lines(text) {
  return String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);
}

export function getIpHash() {
  try {
    const h = headers();
    const ip = (h.get('x-forwarded-for') || h.get('x-real-ip') || 'unknown').split(',')[0].trim();
    return createHash('sha256').update(ip + (process.env.AUTH_SECRET || '')).digest('hex').slice(0, 32);
  } catch {
    return 'unknown';
  }
}

export const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
export const isPhone = (s) => /^\+?[\d\s-]{7,20}$/.test(s);

export const ok = (message, extra = {}) => ({ ok: true, message, ...extra });
export const fail = (error) => ({ ok: false, error });

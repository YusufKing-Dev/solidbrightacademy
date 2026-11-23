import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

// One cookie per role, so logging in as a teacher or student in the same
// browser never replaces an administrator's login.
const COOKIES = { ADMIN: 'sba_admin', TEACHER: 'sba_teacher', STUDENT: 'sba_student' };
const secretKey = () => {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error('AUTH_SECRET is missing or too short. Set a long random value in the environment variables.');
  return new TextEncoder().encode(s);
};

export const hashPassword = (p) => bcrypt.hash(p, 10);
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);
export const fakeCompare = () => bcrypt.compare('x', DUMMY_HASH);

// Initial passwords (a student's surname) are stored lower-cased and trimmed,
// so the first login works whatever capital letters the student types.
export const initialPassword = (surname) => String(surname || '').trim().toLowerCase();

export async function passwordMatches(user, input) {
  if (await bcrypt.compare(input, user.passwordHash)) return true;
  // Students keep their first password (the surname), so it is matched without
  // caring about capital letters or spaces. Teachers only get this until they
  // choose their own password.
  if (user.mustChangePassword || user.role === 'STUDENT') {
    const n = input.trim().toLowerCase();
    if (n && (await bcrypt.compare(n, user.passwordHash))) return true;
  }
  return false;
}

export async function createSession(user) {
  const maxAge = user.role === 'ADMIN' ? 60 * 60 * 12 : 60 * 60 * 24 * 7;
  const token = await new SignJWT({ uid: user.id, role: user.role, tv: user.tokenVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(secretKey());
  cookies().set(COOKIES[user.role], token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

export function destroySession(role) {
  if (COOKIES[role]) cookies().delete(COOKIES[role]);
}

// Loads the logged-in user from the database on EVERY request, so disabling an
// account, switching a student's portal access OFF, or resetting a password
// takes effect immediately.
export const getSessionUser = cache(async (role) => {
  if (!COOKIES[role]) return null;
  const token = cookies().get(COOKIES[role])?.value;
  if (!token) return null;
  let payload;
  try {
    ({ payload } = await jwtVerify(token, secretKey()));
  } catch {
    return null;
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.uid },
    include: { teacher: true, student: { include: { class: true } } },
  });
  if (!user || user.role !== role || !user.active || user.tokenVersion !== payload.tv) return null;
  return user;
});

export const homeFor = (role) => `/${role.toLowerCase()}`;

// Use at the top of every protected page and every server action.
export async function requireUser(role, opts = {}) {
  const user = await getSessionUser(role);
  const login = `/${role.toLowerCase()}/login`;
  if (!user || user.role !== role) redirect(login);
  if (role === 'TEACHER' && !user.teacher) redirect(login);
  if (role === 'STUDENT') {
    if (!user.student) redirect(login);
    if (!user.student.portalEnabled) redirect('/student/login?restricted=1');
  }
  if (user.mustChangePassword && !opts.allowMustChange) redirect(`/${role.toLowerCase()}/password?first=1`);
  return user;
}

// A teacher may only touch classes the administrator assigned to them.
export async function assertTeacherClass(user, classId) {
  const link = await prisma.teacherClass.findUnique({
    where: { teacherId_classId: { teacherId: user.teacher.id, classId } },
    include: { class: true },
  });
  if (!link) return null;
  return link.class;
}
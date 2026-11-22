'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import {
  hashPassword, passwordMatches, fakeCompare, createSession, destroySession,
  requireUser,
} from '@/lib/auth';
import { loginKey, getIpHash, ok, fail } from '@/lib/utils';
import { restrictedMessage } from '@/lib/fees';
import { loginBlocked, recordAttempt } from '@/lib/rate';

const ROLES = ['ADMIN', 'TEACHER', 'STUDENT'];

export async function loginAction(role, formData) {
  if (!ROLES.includes(role)) return fail('Invalid request.');
  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '');
  if (!username || !password) {
    return fail(role === 'STUDENT' ? 'Enter your admission number and password.' : 'Enter your username and password.');
  }

  const key = `${role}:${loginKey(role, username)}`;
  const ipKey = `ip:${getIpHash()}`;
  if (await loginBlocked([[key, 10], [ipKey, 40]])) {
    return fail('Too many failed attempts. Please wait 15 minutes and try again.');
  }

  const user = await prisma.user.findUnique({
    where: { usernameKey: loginKey(role, username) },
    include: { student: true, teacher: true },
  });

  let valid = false;
  if (user && user.role === role) valid = await passwordMatches(user, password);
  else await fakeCompare();

  if (!valid) {
    await recordAttempt(key, false);
    await recordAttempt(ipKey, false);
    return fail(
      role === 'STUDENT'
        ? 'Wrong admission number or password. Please check and try again.'
        : 'Wrong username or password. Please check and try again.'
    );
  }

  if (!user.active) return fail('This account has been deactivated. Please contact the school administration.');
  if (role === 'STUDENT' && user.student && !user.student.portalEnabled) {
    return { ok: false, restricted: true, error: await restrictedMessage(user.student.classId) };
  }
  if (role === 'TEACHER' && !user.teacher) return fail('This account is not set up as a teacher. Please contact the administrator.');
  if (role === 'STUDENT' && !user.student) return fail('This account is not set up as a student. Please contact the administrator.');

  await recordAttempt(key, true);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user);
  redirect(user.mustChangePassword ? `/${role.toLowerCase()}/password?first=1` : `/${role.toLowerCase()}`);
}

export async function logoutAction(role) {
  if (!ROLES.includes(role)) redirect('/');
  destroySession(role);
  redirect(`/${role.toLowerCase()}/login`);
}

export async function changePasswordAction(role, formData) {
  if (!ROLES.includes(role)) return fail('Invalid request.');
  const user = await requireUser(role, { allowMustChange: true });

  const cur = String(formData.get('current') || '');
  const next = String(formData.get('next') || '');
  const confirm = String(formData.get('confirm') || '');

  let curOk = await bcrypt.compare(cur, user.passwordHash);
  if (!curOk && user.mustChangePassword) curOk = await bcrypt.compare(cur.trim().toLowerCase(), user.passwordHash);
  if (!curOk) return fail('Your current password is not correct.');
  if (next.length < 6) return fail('Your new password must be at least 6 characters long.');
  if (next !== confirm) return fail('The new password and confirmation do not match.');
  if (next.trim().toLowerCase() === cur.trim().toLowerCase()) return fail('Please choose a password different from your current one.');

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next), mustChangePassword: false, tokenVersion: { increment: 1 } },
  });
  await createSession(updated);
  redirect(`/${user.role.toLowerCase()}`);
}
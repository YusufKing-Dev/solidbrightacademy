import { prisma } from './db';

const WINDOW_MS = 15 * 60 * 1000;

export async function loginBlocked(keys) {
  const since = new Date(Date.now() - WINDOW_MS);
  for (const [key, limit] of keys) {
    const n = await prisma.loginAttempt.count({ where: { key, success: false, createdAt: { gte: since } } });
    if (n >= limit) return true;
  }
  return false;
}

export async function recordAttempt(key, success) {
  await prisma.loginAttempt.create({ data: { key, success } });
  if (Math.random() < 0.02) {
    await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) } } });
  }
}

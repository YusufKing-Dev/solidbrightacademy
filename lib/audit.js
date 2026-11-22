import { prisma } from './db';

export async function audit(user, action, entity, entityId, details) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: user?.id || null,
        actorName: user ? (user.teacher?.displayName || user.username) : 'System',
        action,
        entity,
        entityId: entityId || null,
        details: details ? String(details).slice(0, 1000) : null,
      },
    });
  } catch (e) {
    console.error('audit failed', e);
  }
}

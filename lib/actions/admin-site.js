'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { CONTENT_FIELDS } from '@/lib/defaults';
import { str, isEmail, ok, fail } from '@/lib/utils';

const A = () => requireUser('ADMIN');

// ---------------------------------------------------------------- APPLICATIONS
export async function setApplicationStatus(id, status) {
  const admin = await A();
  if (!['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED', 'ARCHIVED'].includes(status)) return fail('Invalid status.');
  await prisma.application.update({ where: { id }, data: { status } });
  await audit(admin, 'APPLICATION_' + status, 'application', id);
  revalidatePath('/admin', 'layout');
  return ok(`Marked as ${status.toLowerCase()}.`);
}

export async function saveApplicationNote(id, fd) {
  await A();
  await prisma.application.update({ where: { id }, data: { adminNote: str(fd, 'adminNote', 1000) || null } });
  revalidatePath(`/admin/applications/${id}`);
  return ok('Note saved.');
}

export async function deleteApplication(id) {
  const admin = await A();
  await prisma.application.delete({ where: { id } });
  await audit(admin, 'APPLICATION_DELETED', 'application', id);
  revalidatePath('/admin', 'layout');
  redirect('/admin/applications');
}

// -------------------------------------------------------------------- MESSAGES
export async function setMessageRead(id, read) {
  await A();
  await prisma.contactMessage.update({ where: { id }, data: { isRead: !!read } });
  revalidatePath('/admin', 'layout');
  return ok(read ? 'Marked as read.' : 'Marked as unread.');
}

export async function deleteMessage(id) {
  await A();
  await prisma.contactMessage.delete({ where: { id } });
  revalidatePath('/admin', 'layout');
  return ok('Message deleted.');
}

// --------------------------------------------------------------- ANNOUNCEMENTS
export async function saveAnnouncement(id, fd) {
  const admin = await A();
  const title = str(fd, 'title', 150);
  const content = str(fd, 'content', 8000);
  const category = str(fd, 'category', 40) || null;
  const imageUrl = str(fd, 'imageUrl', 500) || null;
  const published = fd.get('published') === 'on';
  const dateRaw = str(fd, 'publishedAt', 20);
  if (title.length < 3) return fail('Enter a title.');
  if (content.length < 5) return fail('Write the announcement content.');
  let publishedAt = dateRaw ? new Date(dateRaw) : null;
  if (publishedAt && Number.isNaN(publishedAt.getTime())) return fail('Enter a valid publication date.');
  if (published && !publishedAt) publishedAt = new Date();

  const data = { title, content, category, imageUrl, published, publishedAt };
  if (id === 'new') {
    const a = await prisma.announcement.create({ data });
    await audit(admin, published ? 'ANNOUNCEMENT_PUBLISHED' : 'ANNOUNCEMENT_CREATED', 'announcement', a.id, title);
  } else {
    await prisma.announcement.update({ where: { id }, data });
    await audit(admin, 'ANNOUNCEMENT_UPDATED', 'announcement', id, title);
  }
  revalidatePath('/', 'layout');
  redirect('/admin/announcements');
}

export async function setAnnouncementPublished(id, published) {
  const admin = await A();
  const a = await prisma.announcement.findUnique({ where: { id } });
  if (!a) return fail('Announcement not found.');
  await prisma.announcement.update({
    where: { id },
    data: { published: !!published, publishedAt: published ? a.publishedAt || new Date() : a.publishedAt },
  });
  await audit(admin, published ? 'ANNOUNCEMENT_PUBLISHED' : 'ANNOUNCEMENT_UNPUBLISHED', 'announcement', id, a.title);
  revalidatePath('/', 'layout');
  return ok(published ? 'Published.' : 'Unpublished. It is now hidden from visitors and students.');
}

export async function deleteAnnouncement(id) {
  const admin = await A();
  await prisma.announcement.delete({ where: { id } });
  await audit(admin, 'ANNOUNCEMENT_DELETED', 'announcement', id);
  revalidatePath('/', 'layout');
  return ok('Announcement deleted.');
}

// --------------------------------------------------------------------- GALLERY
export async function addGalleryImage(fd) {
  const admin = await A();
  const url = str(fd, 'url', 500);
  if (!url) return fail('Choose an image to upload first.');
  const last = await prisma.galleryImage.findFirst({ orderBy: { sortOrder: 'desc' } });
  await prisma.galleryImage.create({ data: { url, caption: str(fd, 'caption', 150) || null, sortOrder: (last?.sortOrder ?? 0) + 1 } });
  await audit(admin, 'GALLERY_ADDED', 'gallery', null);
  revalidatePath('/', 'layout');
  return ok('Photo added to the homepage gallery.', { reset: true });
}

export async function deleteGalleryImage(id) {
  const admin = await A();
  await prisma.galleryImage.delete({ where: { id } });
  await audit(admin, 'GALLERY_REMOVED', 'gallery', id);
  revalidatePath('/', 'layout');
  return ok('Photo removed.');
}

export async function toggleGalleryImage(id, active) {
  await A();
  await prisma.galleryImage.update({ where: { id }, data: { active: !!active } });
  revalidatePath('/', 'layout');
  return ok(active ? 'Photo is showing.' : 'Photo is hidden.');
}

export async function moveGalleryImage(id, dir) {
  await A();
  const all = await prisma.galleryImage.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
  const i = all.findIndex((g) => g.id === id);
  const j = dir === 'up' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= all.length) return ok('');
  const order = all.map((g) => g.id);
  [order[i], order[j]] = [order[j], order[i]];
  await prisma.$transaction(order.map((gid, idx) => prisma.galleryImage.update({ where: { id: gid }, data: { sortOrder: idx + 1 } })));
  revalidatePath('/', 'layout');
  return ok('Order updated.');
}

// ------------------------------------------------------- WEBSITE CONTENT / SETTINGS
export async function saveFields(group, fd) {
  const admin = await A();
  const fields = CONTENT_FIELDS.filter((f) => f.group === group);
  const rows = [];
  for (const f of fields) {
    if (!fd.has(f.key)) continue;
    const value = String(fd.get(f.key) ?? '').trim().slice(0, 12000);
    if (f.key === 'notificationEmail' && !isEmail(value)) return fail('Enter a valid notification email address.');
    if (f.key === 'logo' && !value) continue; // never leave the site without a logo
    rows.push({ key: f.key, value });
  }
  await prisma.$transaction(
    rows.map((r) => prisma.siteSetting.upsert({ where: { key: r.key }, create: r, update: { value: r.value } }))
  );
  await audit(admin, 'CONTENT_SAVED', 'content', null, `${group}: ${rows.length} fields`);
  revalidatePath('/', 'layout');
  return ok('Saved. The website has been updated.');
}

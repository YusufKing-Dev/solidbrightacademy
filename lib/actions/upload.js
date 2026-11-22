'use server';

import { requireUser } from '@/lib/auth';
import { uploadImage } from '@/lib/storage';
import { ok, fail } from '@/lib/utils';

// Only the administrator can upload images.
export async function uploadImageAction(formData) {
  await requireUser('ADMIN');
  const file = formData.get('file');
  if (!file || typeof file === 'string' || !file.size) return fail('Choose an image first.');
  try {
    const url = await uploadImage(file, String(formData.get('folder') || 'general').replace(/[^a-z0-9-]/gi, ''));
    return ok('Image uploaded.', { url });
  } catch (e) {
    return fail(e.message || 'Upload failed.');
  }
}

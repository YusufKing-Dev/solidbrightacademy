import { randomUUID } from 'crypto';

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export async function uploadImage(file, folder = 'general') {
  const base = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_BUCKET || 'sba-uploads';
  if (!base || !key) {
    throw new Error('Image storage is not set up yet. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment variables.');
  }
  const ext = TYPES[file.type];
  if (!ext) throw new Error('Please choose a JPG, PNG or WebP image.');
  if (file.size > 4 * 1024 * 1024) throw new Error('The image is too large. Please choose one under 4 MB.');
  const path = `${folder}/${Date.now()}-${randomUUID()}.${ext}`;
  const res = await fetch(`${base}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': file.type, 'x-upsert': 'false' },
    body: Buffer.from(await file.arrayBuffer()),
  });
  if (!res.ok) throw new Error('Upload failed: ' + (await res.text()).slice(0, 200));
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

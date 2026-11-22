'use client';

import { useState } from 'react';
import { uploadImageAction } from '@/lib/actions/upload';

// Shrinks big phone photos before upload (keeps PNG transparency for logos).
async function shrink(file, maxSide = 1400) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  let blob = await new Promise((res) => canvas.toBlob(res, type, 0.82));
  if (blob && blob.size > 3.8 * 1024 * 1024) blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.7));
  return blob || file;
}

export default function ImageField({ name, defaultValue = '', label, folder = 'general', help, round = false }) {
  const [url, setUrl] = useState(defaultValue || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function onFile(e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setErr('');
    setBusy(true);
    try {
      const blob = await shrink(f);
      const fd = new FormData();
      fd.set('file', new File([blob], 'image', { type: blob.type }));
      fd.set('folder', folder);
      const r = await uploadImageAction(fd);
      if (r && r.ok) setUrl(r.url);
      else setErr((r && r.error) || 'Upload failed.');
    } catch (ex) {
      setErr('Could not upload that image. Try a smaller JPG or PNG.');
    }
    setBusy(false);
  }

  return (
    <div className="field imgfield">
      {label && <span className="lbl">{label}</span>}
      <div className={'imgprev' + (round ? ' round' : '')}>
        {url ? <img src={url} alt="" /> : <span>No image yet</span>}
      </div>
      <input type="hidden" name={name} value={url} readOnly />
      <div className="row">
        <label className="btn btn-small btn-outline">
          {busy ? 'Uploading…' : url ? 'Change image' : 'Choose image'}
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} hidden disabled={busy} />
        </label>
        {url && !busy && <button type="button" className="btn btn-small btn-ghost" onClick={() => setUrl('')}>Remove</button>}
      </div>
      {help && <span className="help">{help}</span>}
      {err && <span className="inline-err" role="alert">{err}</span>}
    </div>
  );
}

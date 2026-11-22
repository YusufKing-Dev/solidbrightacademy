import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import ActionForm from '@/components/ActionForm';
import ActionButton from '@/components/ActionButton';
import ImageField from '@/components/ImageField';
import { addGalleryImage, deleteGalleryImage, toggleGalleryImage, moveGalleryImage } from '@/lib/actions/admin-site';

export const metadata = { title: 'Gallery', robots: { index: false, follow: false } };

export default async function GalleryAdmin() {
  await requireUser('ADMIN');
  const imgs = await prisma.galleryImage.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
  return (
    <>
      <div className="page-title"><h1>Gallery</h1><p>These photos play one at a time as a slideshow on the homepage.</p></div>
      <div className="panel"><h2>Add a photo</h2>
        <ActionForm action={addGalleryImage} submit="Add to gallery" className="form-grid" resetOnSuccess>
          <ImageField name="url" label="Photo" folder="gallery" />
          <label className="field"><span className="lbl">Short description (for search engines and screen readers)</span><input name="caption" maxLength={150} placeholder="e.g. Pupils during Science Day" /></label>
        </ActionForm>
      </div>
      <div className="panel"><h2>{imgs.length} photo{imgs.length === 1 ? '' : 's'}</h2>
        {imgs.length === 0 ? <div className="empty"><strong>No photos yet</strong>Add the first photo above.</div> : (
          <div className="grid g3">
            {imgs.map((g, i) => (
              <div className="card" key={g.id} style={{ padding: 12 }}>
                <img src={g.url} alt={g.caption || ''} style={{ borderRadius: 10, aspectRatio: '4 / 3', objectFit: 'cover', width: '100%', opacity: g.active ? 1 : 0.4 }} loading="lazy" />
                <p className="small muted" style={{ margin: '8px 0' }}>{g.caption || 'No description'} {!g.active && <span className="pill grey">Hidden</span>}</p>
                <div className="row">
                  {i > 0 && <ActionButton action={moveGalleryImage.bind(null, g.id, 'up')}>Earlier</ActionButton>}
                  {i < imgs.length - 1 && <ActionButton action={moveGalleryImage.bind(null, g.id, 'down')}>Later</ActionButton>}
                  <ActionButton action={toggleGalleryImage.bind(null, g.id, !g.active)}>{g.active ? 'Hide' : 'Show'}</ActionButton>
                  <ActionButton action={deleteGalleryImage.bind(null, g.id)} className="btn btn-small btn-danger" confirm="Remove this photo?">Remove</ActionButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
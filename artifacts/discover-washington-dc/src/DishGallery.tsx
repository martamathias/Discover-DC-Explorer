import { useEffect, useRef, useState, type FormEvent } from 'react';
import './DishGallery.css';

type Dish = { id: number; title: string; caption: string; imageUrl: string; created_at: string; inspector_note: string | null };
async function jsonResponse(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error([body.error || 'The request failed.', body.inspection?.whatISee].filter(Boolean).join(' '));
  return body;
}
async function resizePhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPEG, PNG, or WebP photo. GIF files are not supported.');
  if (file.size > 3 * 1024 * 1024) throw new Error('Choose a photo under 3 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser cannot prepare the photo. Try another browser.');
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const result = canvas.toDataURL('image/jpeg', 0.85);
    if (result.length > 4 * 1024 * 1024) throw new Error('The prepared photo is too large. Choose a smaller image.');
    return result;
  } finally { bitmap.close(); }
}
export default function DishGallery() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState('');
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const selectionId = useRef(0);
  const load = async (signal?: AbortSignal) => {
    setLoading(true); setLoadError('');
    try { setDishes(await jsonResponse(await fetch('/api/dishes', { signal }))); }
    catch (err) { if (!signal?.aborted) setLoadError(err instanceof Error ? err.message : 'Could not load the gallery.'); }
    finally { if (!signal?.aborted) setLoading(false); }
  };
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || preparing || !image || !title.trim()) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const dish: Dish = await jsonResponse(await fetch('/api/dishes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), caption: caption.trim(), image }),
        signal: AbortSignal.timeout(45000),
      }));
      setDishes((current) => [dish, ...current]);
      setLoadError(''); setTitle(''); setCaption(''); setImage('');
      if (fileInput.current) fileInput.current.value = '';
      setNotice('Your photo passed inspection and was saved to the gallery.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save this photo.'); }
    finally { setBusy(false); }
  };
  return <section className="section dish-gallery" id="dish-gallery" aria-labelledby="dish-gallery-title">
    <div className="container">
      <div className="section-kicker">A taste of the city</div>
      <h2 className="section-heading" id="dish-gallery-title">Share your DC dish.</h2>
      <p className="section-lead">Add a food photo and a short description. The AI inspector checks it before it joins the public gallery.</p>
      <div className="dish-layout">
        <form className="dish-form" onSubmit={submit}>
          <label>Dish name<input required maxLength={120} value={title} disabled={busy} onChange={(event) => setTitle(event.target.value)} placeholder="What is on your plate?" /></label>
          <label>Caption<textarea maxLength={500} value={caption} disabled={busy} onChange={(event) => setCaption(event.target.value)} placeholder="Tell us a little about the dish" rows={3} /></label>
          <label>Photo<input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={async (event) => {
            const selected = event.target.files?.[0]; const id = ++selectionId.current;
            setImage(''); setError(''); setNotice(''); setPreparing(Boolean(selected));
            if (!selected) return;
            try { const photo = await resizePhoto(selected); if (id === selectionId.current) setImage(photo); }
            catch (err) { if (id === selectionId.current) setError(err instanceof Error ? err.message : 'Could not open this photo.'); }
            finally { if (id === selectionId.current) setPreparing(false); }
          }} /></label>
          <small>JPEG, PNG, or WebP under 3 MB. Photos are resized to a maximum of 1280 pixels. Approved photos and captions are public.</small>
          {image && <img className="dish-preview" src={image} alt="Your selected dish preview" />}
          <button className="button-primary" type="submit" disabled={busy || preparing || !image || !title.trim()}>{preparing ? 'Preparing photo…' : busy ? 'Inspecting and saving…' : 'Inspect and share photo'}</button>
          <p className="dish-notice" role="status">{notice}</p>
          {error && <p className="dish-error" role="alert">{error}</p>}
        </form>
        <div aria-live="polite">
          {loading && <p>Loading the dish gallery…</p>}
          {loadError && <div className="dish-error" role="alert"><p>{loadError}</p><button type="button" onClick={() => void load()}>Try loading again</button></div>}
          {!loading && !loadError && dishes.length === 0 && <p>No dishes yet. Share the first photo.</p>}
          <div className="dish-cards">{dishes.map((dish) => <article className="dish-card" key={dish.id}>
            <img src={dish.imageUrl} alt={dish.title} loading="lazy" />
            <div><h3>{dish.title}</h3><p>{dish.caption}</p><time dateTime={dish.created_at}>{new Date(dish.created_at).toLocaleDateString()}</time>
            {dish.inspector_note && <details><summary>What the AI inspector saw</summary><p>{dish.inspector_note}</p></details>}</div>
          </article>)}</div>
        </div>
      </div>
    </div>
  </section>;
}

'use client';
import { useState, useEffect } from 'react';

export default function Lightbox({ image, review, onClose, onReview }) {
  const [status, setStatus] = useState(review?.status || '');
  const [comment, setComment] = useState(review?.comment || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(review?.status || '');
    setComment(review?.comment || '');
  }, [image, review]);

  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function save() {
    if (status === 'flagged' && !comment.trim()) {
      alert('Please add a comment when flagging an image.');
      return;
    }
    setSaving(true);
    await onReview?.({ ...image, status, comment });
    setSaving(false);
    onClose();
  }

  if (!image) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 16, padding: 20, width: '90%', maxWidth: 520 }}
      >
        {/* Image */}
        <div style={{ width: '100%', aspectRatio: '4/3', background: '#f4f3f0', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
          {image.url ? (
            <img src={image.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>📷</div>
          )}
        </div>

        {/* Meta */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{image.outlet?.replace('-', ' ')} · {image.channel}</div>
          <div style={{ fontSize: 12, color: '#9e9d99', marginTop: 2 }}>{image.date} · {image.time} · {image.filename}</div>
        </div>

        {/* Flag notice */}
        {status === 'flagged' && (
          <div style={{ background: '#FCEBEB', color: '#A32D2D', fontSize: 12, padding: '8px 10px', borderRadius: 8, marginBottom: 12 }}>
            A comment is required when flagging — it will appear on the outlet dashboard.
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => setStatus(status === 'ok' ? '' : 'ok')}
            className={`btn ${status === 'ok' ? 'btn-green' : ''}`}
            style={{ flex: 1, padding: '9px 0', fontSize: 13 }}
          >✓ OK</button>
          <button
            onClick={() => setStatus(status === 'flagged' ? '' : 'flagged')}
            className={`btn ${status === 'flagged' ? 'btn-red' : ''}`}
            style={{ flex: 1, padding: '9px 0', fontSize: 13 }}
          >⚑ Flag</button>
        </div>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder={status === 'flagged' ? 'Comment required when flagging...' : 'Add a note...'}
          rows={2}
          style={{ width: '100%', marginBottom: 10, resize: 'none', borderColor: status === 'flagged' && !comment ? '#E24B4A' : undefined }}
        />

        {/* Save / Close */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} disabled={saving} style={{ flex: 1, padding: '9px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            {saving ? 'Saving...' : 'Save & close'}
          </button>
          <button onClick={onClose} className="btn" style={{ padding: '9px 16px', fontSize: 13 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

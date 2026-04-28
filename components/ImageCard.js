'use client';
import { useState } from 'react';

export default function ImageCard({ image, review, onReview, onClick }) {
  const [status, setStatus] = useState(review?.status || '');
  const [comment, setComment] = useState(review?.comment || '');
  const [saving, setSaving] = useState(false);

  async function saveReview(newStatus) {
    setSaving(true);
    const s = newStatus === status ? '' : newStatus;
    setStatus(s);
    await onReview?.({ ...image, status: s, comment });
    setSaving(false);
  }

  async function saveComment() {
    if (!comment.trim()) return;
    setSaving(true);
    await onReview?.({ ...image, status: status || 'flagged', comment });
    setSaving(false);
  }

  const borderColor = status === 'ok' ? '#1D9E75' : status === 'flagged' ? '#E24B4A' : 'rgba(0,0,0,0.1)';
  const borderWidth = status ? '1.5px' : '0.5px';

  return (
    <div style={{ background: '#fff', border: `${borderWidth} solid ${borderColor}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
      {/* Image thumbnail */}
      <div onClick={() => onClick?.(image)} style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', background: '#f4f3f0', position: 'relative' }}>
        {image.url ? (
          <img
            src={image.url}
            alt={`${image.outlet} ${image.channel}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div style={{ width: '100%', height: '100%', display: image.url ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#9e9d99' }}>
          📷
        </div>
        {status && (
          <div style={{ position: 'absolute', top: 6, right: 6 }}>
            <span className={`pill pill-${status}`}>{status}</span>
          </div>
        )}
      </div>

      {/* Meta */}
      <div style={{ padding: '8px 10px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{image.outlet?.replace('-', ' ')}</div>
        <div style={{ fontSize: 11, color: '#9e9d99' }}>{image.channel} · {image.time || image.date}</div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 5, padding: '7px 10px' }}>
        <button
          onClick={() => saveReview('ok')}
          className={`btn ${status === 'ok' ? 'btn-green' : ''}`}
          style={{ flex: 1, fontSize: 11, padding: '4px 0' }}
          disabled={saving}
        >✓ OK</button>
        <button
          onClick={() => saveReview('flagged')}
          className={`btn ${status === 'flagged' ? 'btn-red' : ''}`}
          style={{ flex: 1, fontSize: 11, padding: '4px 0' }}
          disabled={saving}
        >⚑ Flag</button>
      </div>

      {/* Comment box — always visible if flagged */}
      {status === 'flagged' && (
        <div style={{ display: 'flex', gap: 5, padding: '0 10px 10px' }}>
          <input
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Add comment (required)..."
            style={{ flex: 1, fontSize: 11, padding: '4px 7px', borderColor: comment ? 'rgba(0,0,0,0.15)' : '#E24B4A' }}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.key === 'Enter' && saveComment()}
          />
          <button onClick={saveComment} className="btn" style={{ fontSize: 11, padding: '4px 8px' }} disabled={saving}>
            {saving ? '...' : 'Save'}
          </button>
        </div>
      )}

      {/* Existing comment */}
      {status !== 'flagged' && comment && (
        <div style={{ padding: '0 10px 8px', fontSize: 11, color: '#6b6a66' }}>"{comment}"</div>
      )}
    </div>
  );
}

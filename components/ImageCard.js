'use client';

// Read-only thumbnail. All review actions (OK/flag/comment) happen in the
// lightbox — clicking the card opens it. We keep a small status pill on the
// corner so reviewed state is glanceable.
export default function ImageCard({ image, review, onClick }) {
  const status = review?.status || '';
  const comment = review?.comment || '';

  const borderColor = status === 'ok' ? '#1D9E75' : status === 'flagged' ? '#E24B4A' : 'rgba(0,0,0,0.1)';
  const borderWidth = status ? '1.5px' : '0.5px';

  return (
    <div
      onClick={() => onClick?.(image)}
      style={{ background: '#fff', border: `${borderWidth} solid ${borderColor}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}
    >
      {/* Image thumbnail */}
      <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', background: '#f4f3f0', position: 'relative' }}>
        {image.url ? (
          <img
            src={image.thumb || image.url}
            alt={`${image.outlet} ${image.channel}`}
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => {
              // If the CF-resized thumb 404s (e.g. Image Transformations not enabled),
              // fall back to the full-size signed URL once.
              if (image.thumb && e.target.src !== image.url) {
                e.target.src = image.url;
                return;
              }
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
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
      <div style={{ padding: '8px 10px 10px' }}>
        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{image.outlet?.replace('-', ' ')}</div>
        <div style={{ fontSize: 11, color: '#9e9d99' }}>{image.channel} · {image.time || image.date}</div>
        {comment && status === 'flagged' && (
          <div style={{ fontSize: 11, color: '#A32D2D', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            “{comment}”
          </div>
        )}
      </div>
    </div>
  );
}

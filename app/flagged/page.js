'use client';
import { useState, useEffect } from 'react';
import PortalLayout from '@/components/PortalLayout';
import Lightbox from '@/components/Lightbox';

export default function FlaggedPage() {
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/reviews?status=flagged');
    const data = await res.json();
    setFlagged(data.reviews?.filter(r => r.images) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleReview({ b2_key, b2_url, channel, outlet, date, time_str, filename, status, comment }) {
    const user = localStorage.getItem('flax_user') || 'Manager';
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ b2_key, b2_url, channel, outlet, date, time_str, filename, status, comment, reviewed_by: user }),
    });
    load();
  }

  // Group by outlet
  const byOutlet = {};
  for (const rev of flagged) {
    const o = rev.images?.outlet || 'Unknown';
    if (!byOutlet[o]) byOutlet[o] = [];
    byOutlet[o].push(rev);
  }

  return (
    <PortalLayout>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Flagged images</div>
          <span style={{ background: '#FCEBEB', color: '#A32D2D', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500 }}>
            {flagged.length} total
          </span>
        </div>

        {loading ? (
          <div style={{ color: '#9e9d99', fontSize: 13 }}>Loading...</div>
        ) : flagged.length === 0 ? (
          <div style={{ color: '#9e9d99', fontSize: 13, padding: 40, textAlign: 'center' }}>No flagged images. All clear!</div>
        ) : (
          Object.entries(byOutlet).map(([outlet, reviews]) => (
            <div key={outlet} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#6b6a66', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                {outlet.replace('-', ' ')}
                <span style={{ background: '#FCEBEB', color: '#A32D2D', padding: '1px 7px', borderRadius: 99, fontSize: 11 }}>{reviews.length} flagged</span>
              </div>

              {reviews.map(rev => (
                <div
                  key={rev.id}
                  style={{ background: '#fff', border: '1.5px solid #E24B4A', borderRadius: 12, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8, cursor: 'pointer' }}
                  onClick={() => setLightbox({ ...rev.images, url: rev.images?.b2_url })}
                >
                  <div style={{ width: 56, height: 56, background: '#FCEBEB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {rev.images?.b2_url ? (
                      <img src={rev.images.b2_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : <span style={{ fontSize: 24 }}>🗑️</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>
                      {rev.images?.channel} · {rev.images?.date} · {rev.images?.time_str}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b6a66', marginBottom: 6 }}>
                      {rev.comment || <span style={{ color: '#9e9d99' }}>No comment added</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#9e9d99' }}>Flagged by {rev.reviewed_by} · {new Date(rev.updated_at).toLocaleDateString('en-IN')}</div>

                    {/* Inline comment update */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }} onClick={e => e.stopPropagation()}>
                      <input
                        defaultValue={rev.comment || ''}
                        placeholder="Update comment..."
                        style={{ flex: 1, fontSize: 12, padding: '4px 8px' }}
                        onKeyDown={async e => {
                          if (e.key === 'Enter') {
                            await handleReview({ ...rev.images, status: 'flagged', comment: e.target.value });
                          }
                        }}
                      />
                      <button
                        className="btn btn-green"
                        style={{ fontSize: 11, padding: '4px 10px' }}
                        onClick={async (e) => {
                          const input = e.target.closest('div').querySelector('input');
                          await handleReview({ ...rev.images, status: 'ok', comment: input.value });
                        }}
                      >Mark OK</button>
                    </div>
                  </div>
                  <span style={{ background: '#FCEBEB', color: '#A32D2D', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500, flexShrink: 0 }}>flagged</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {lightbox && (
        <Lightbox
          image={lightbox}
          onClose={() => setLightbox(null)}
          onReview={handleReview}
        />
      )}
    </PortalLayout>
  );
}

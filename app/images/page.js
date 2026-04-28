'use client';
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import PortalLayout from '@/components/PortalLayout';
import ImageCard from '@/components/ImageCard';
import KPIBar from '@/components/KPIBar';
import Lightbox from '@/components/Lightbox';
import { OUTLETS, CHANNELS } from '@/lib/config';

export default function ImagesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#9e9d99', fontSize: 13 }}>Loading...</div>}>
      <ImagesPageInner />
    </Suspense>
  );
}

function ImagesPageInner() {
  const params = useSearchParams();
  const [images, setImages] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [kpiData, setKpiData] = useState({});

  const channel = params.get('channel') || '';
  const outlet = params.get('outlet') || '';
  const date = params.get('date') || new Date().toISOString().split('T')[0];

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (channel) qs.set('channel', channel);
    if (outlet) qs.set('outlet', outlet);
    if (date) qs.set('date', date);

    const [imgRes, revRes] = await Promise.all([
      fetch(`/api/images?${qs}`).then(r => r.json()),
      fetch(`/api/reviews?date=${date}`).then(r => r.json()),
    ]);

    setImages(imgRes.images || []);

    // Index reviews by b2_key
    const revMap = {};
    for (const rev of revRes.reviews || []) {
      if (rev.images?.b2_key) revMap[rev.images.b2_key] = rev;
    }
    setReviews(revMap);

    // Build KPI data: count images per outlet
    const kpi = {};
    for (const img of imgRes.images || []) {
      kpi[img.outlet] = (kpi[img.outlet] || 0) + 1;
    }
    setKpiData(kpi);
    setLoading(false);
  }, [channel, outlet, date]);

  useEffect(() => { load(); }, [load]);

  async function handleReview({ b2_key, b2_url, channel, outlet, date, time_str, filename, status, comment }) {
    const user = localStorage.getItem('flax_user') || 'Manager';
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ b2_key, b2_url, channel, outlet, date, time_str, filename, status, comment, reviewed_by: user }),
    });
    setReviews(prev => ({ ...prev, [b2_key]: { status, comment, reviewed_by: user } }));
  }

  const displayChannels = channel ? CHANNELS.filter(c => c.id === channel) : CHANNELS;

  return (
    <PortalLayout>
      <div style={{ padding: '0 0 20px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', background: '#fff' }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>
            {channel ? CHANNELS.find(c => c.id === channel)?.name : 'All channels'} · {outlet ? outlet.replace('-', ' ') : 'All outlets'} · {date}
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 13, color: '#9e9d99' }}>
            {loading ? 'Loading...' : `${images.length} images`}
          </div>
          <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500 }}>
            {Object.values(reviews).filter(r => r.status === 'flagged').length} flagged
          </div>
        </div>

        {/* KPI bar */}
        <KPIBar
          channel={channel || 'all'}
          data={kpiData}
          outlets={OUTLETS}
        />

        {/* Image grid */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9e9d99', fontSize: 13 }}>Loading images...</div>
        ) : images.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9e9d99', fontSize: 13 }}>No images found for selected filters.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, padding: '16px' }}>
            {images.map(img => (
              <ImageCard
                key={img.key}
                image={img}
                review={reviews[img.key]}
                onReview={handleReview}
                onClick={setLightbox}
              />
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <Lightbox
          image={lightbox}
          review={reviews[lightbox.key]}
          onClose={() => setLightbox(null)}
          onReview={handleReview}
        />
      )}
    </PortalLayout>
  );
}

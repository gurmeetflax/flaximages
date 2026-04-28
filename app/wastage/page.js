'use client';
import { useState, useEffect } from 'react';
import PortalLayout from '@/components/PortalLayout';
import ImageCard from '@/components/ImageCard';
import KPIBar from '@/components/KPIBar';
import Lightbox from '@/components/Lightbox';
import { OUTLETS } from '@/lib/config';

export default function WastagePage() {
  const [images, setImages] = useState([]);
  const [reviews, setReviews] = useState({});
  const [slackData, setSlackData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [kpiData, setKpiData] = useState({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      const date = new Date().toISOString().split('T')[0];
      const [imgRes, revRes] = await Promise.all([
        fetch(`/api/images?channel=wastage`).then(r => r.json()),
        fetch(`/api/reviews?date=${date}`).then(r => r.json()),
      ]);

      const imgs = imgRes.images || [];
      setImages(imgs);

      const revMap = {};
      for (const rev of revRes.reviews || []) {
        if (rev.images?.b2_key) revMap[rev.images.b2_key] = rev;
      }
      setReviews(revMap);

      // KPI: count wastage images per outlet
      const kpi = {};
      for (const img of imgs) kpi[img.outlet] = (kpi[img.outlet] || 0) + 1;
      setKpiData(kpi);
      setLoading(false);
    }
    load();
  }, []);

  async function handleReview(data) {
    const user = localStorage.getItem('flax_user') || 'Manager';
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, reviewed_by: user }),
    });
    setReviews(prev => ({ ...prev, [data.b2_key]: { status: data.status, comment: data.comment } }));
  }

  // Group images by outlet
  const byOutlet = {};
  for (const img of images) {
    if (!byOutlet[img.outlet]) byOutlet[img.outlet] = [];
    byOutlet[img.outlet].push(img);
  }

  return (
    <PortalLayout>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', background: '#fff' }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Wastage · All outlets</div>
          <div style={{ marginLeft: 'auto', fontSize: 13, color: '#9e9d99' }}>{loading ? 'Loading...' : `${images.length} images`}</div>
        </div>

        <KPIBar channel="wastage" data={kpiData} outlets={OUTLETS} />

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9e9d99', fontSize: 13 }}>Loading wastage images...</div>
        ) : (
          <div style={{ padding: 16 }}>
            {OUTLETS.map(outlet => {
              const outletImages = byOutlet[outlet.id] || [];
              const flagCount = outletImages.filter(img => reviews[img.key]?.status === 'flagged').length;
              if (outletImages.length === 0) return null;

              return (
                <div key={outlet.id} style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{outlet.name}</div>
                    <span style={{ fontSize: 12, color: '#9e9d99' }}>{outletImages.length} entries</span>
                    {flagCount > 0 && (
                      <span style={{ background: '#FCEBEB', color: '#A32D2D', padding: '1px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500 }}>
                        {flagCount} flagged
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                    {outletImages.map(img => (
                      <ImageCard
                        key={img.key}
                        image={img}
                        review={reviews[img.key]}
                        onReview={handleReview}
                        onClick={setLightbox}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
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

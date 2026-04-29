'use client';
import { Suspense, useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import PortalLayout from '@/components/PortalLayout';
import ImageCard from '@/components/ImageCard';
import KPIBar from '@/components/KPIBar';
import Lightbox from '@/components/Lightbox';
import { OUTLETS, CHANNELS } from '@/lib/config';

// Week starts Monday. Returns ISO date (YYYY-MM-DD) of the week's Monday.
function getWeekStart(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function formatWeekRange(weekStart) {
  const start = new Date(weekStart + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const sameYear = start.getFullYear() === end.getFullYear();
  return sameYear
    ? `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`
    : `${fmt(start)}, ${start.getFullYear()} – ${fmt(end)}, ${end.getFullYear()}`;
}

export default function ImagesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#9e9d99', fontSize: 13 }}>Loading...</div>}>
      <ImagesPageInner />
    </Suspense>
  );
}

const DEFAULT_CHANNEL = 'dispatchimages';
const todayStr = () => new Date().toISOString().split('T')[0];
const daysAgoStr = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

function ImagesPageInner() {
  const params = useSearchParams();
  const [images, setImages] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [kpiData, setKpiData] = useState({});

  // channel: null in URL → default to dispatchimages; '' → all channels; else → specific
  const channelRaw = params.get('channel');
  const channel = channelRaw === null ? DEFAULT_CHANNEL : channelRaw;
  const outlet = params.get('outlet') || '';
  const dateFrom = params.get('date_from') || daysAgoStr(7);
  const dateTo = params.get('date_to') || todayStr();

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (channel) qs.set('channel', channel);
    if (outlet) qs.set('outlet', outlet);
    qs.set('date_from', dateFrom);
    qs.set('date_to', dateTo);

    const [imgRes, revRes] = await Promise.all([
      fetch(`/api/images?${qs}`).then(r => r.json()),
      fetch(`/api/reviews?date=${dateTo}`).then(r => r.json()),
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
  }, [channel, outlet, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  async function handleReview(image) {
    const user = localStorage.getItem('flax_user') || 'Manager';
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...image, reviewed_by: user }),
    });
    setReviews(prev => ({
      ...prev,
      [image.key]: { status: image.status, comment: image.comment, reviewed_by: user },
    }));
  }

  const displayChannels = channel ? CHANNELS.filter(c => c.id === channel) : CHANNELS;

  // Per-outlet flagged counts (for KPI cards).
  const flaggedByOutlet = useMemo(() => {
    const out = {};
    for (const img of images) {
      const r = reviews[img.key];
      if (r?.status === 'flagged') {
        out[img.outlet] = (out[img.outlet] || 0) + 1;
      }
    }
    return out;
  }, [images, reviews]);

  // Group images into weekly buckets (Mon–Sun), newest week first.
  // Within each week, newest images first.
  const weekGroups = useMemo(() => {
    const groups = new Map();
    for (const img of images) {
      if (!img.date) continue;
      const week = getWeekStart(img.date);
      if (!groups.has(week)) groups.set(week, []);
      groups.get(week).push(img);
    }
    const sorted = [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
    for (const [, arr] of sorted) {
      arr.sort((a, b) => {
        const d = (b.date || '').localeCompare(a.date || '');
        if (d !== 0) return d;
        return (b.time || '').localeCompare(a.time || '');
      });
    }
    return sorted;
  }, [images]);

  return (
    <PortalLayout>
      <div style={{ padding: '0 0 20px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', background: '#fff' }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>
            {channel ? CHANNELS.find(c => c.id === channel)?.name : 'All channels'} · {outlet ? outlet.replace('-', ' ') : 'All outlets'} · {dateFrom === dateTo ? dateFrom : `${dateFrom} → ${dateTo}`}
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
          flagged={flaggedByOutlet}
          outlets={OUTLETS}
        />

        {/* Image grid */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9e9d99', fontSize: 13 }}>Loading images...</div>
        ) : images.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9e9d99', fontSize: 13 }}>No images found for selected filters.</div>
        ) : (
          <div style={{ padding: '16px' }}>
            {weekGroups.map(([weekStart, weekImages]) => {
              const flaggedInWeek = weekImages.filter(i => reviews[i.key]?.status === 'flagged').length;
              return (
                <section key={weekStart} style={{ marginBottom: 28 }}>
                  <div style={{
                    position: 'sticky', top: 0, zIndex: 5,
                    background: 'rgba(248,247,244,0.92)', backdropFilter: 'blur(6px)',
                    padding: '8px 4px 10px',
                    borderBottom: '0.5px solid rgba(0,0,0,0.06)',
                    marginBottom: 12,
                    display: 'flex', alignItems: 'baseline', gap: 10,
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{formatWeekRange(weekStart)}</div>
                    <div style={{ fontSize: 11, color: '#9e9d99' }}>{weekImages.length} {weekImages.length === 1 ? 'image' : 'images'}</div>
                    {flaggedInWeek > 0 && (
                      <span style={{ background: '#FCEBEB', color: '#A32D2D', padding: '1px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500 }}>
                        {flaggedInWeek} flagged
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                    {weekImages.map(img => (
                      <ImageCard
                        key={img.key}
                        image={img}
                        review={reviews[img.key]}
                        onClick={setLightbox}
                      />
                    ))}
                  </div>
                </section>
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

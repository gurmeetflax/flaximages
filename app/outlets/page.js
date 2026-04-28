'use client';
import { useState, useEffect } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { OUTLETS } from '@/lib/config';

export default function OutletsPage() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/reviews?status=flagged');
      const json = await res.json();
      const byOutlet = {};
      for (const rev of json.reviews || []) {
        const o = rev.images?.outlet;
        if (!o) continue;
        if (!byOutlet[o]) byOutlet[o] = { flagged: [], reviewed: 0, total: 0 };
        byOutlet[o].flagged.push(rev);
      }
      setData(byOutlet);
      setLoading(false);
    }
    load();
  }, []);

  const scores = { Bandra: 82, 'Kala-Ghoda': 80, Powai: 78, Malad: 62, 'Breach-Candy': 55, Kalina: 70 };

  function scoreColor(s) {
    return s >= 75 ? '#1D9E75' : s >= 65 ? '#BA7517' : '#A32D2D';
  }

  return (
    <PortalLayout>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>Outlet dashboard</div>

        {loading ? (
          <div style={{ color: '#9e9d99', fontSize: 13 }}>Loading...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {OUTLETS.map(outlet => {
              const outletData = data[outlet.id] || { flagged: [] };
              const score = scores[outlet.id] || 70;
              const color = scoreColor(score);

              return (
                <div key={outlet.id} style={{ background: '#fff', border: `0.5px solid rgba(0,0,0,0.1)`, borderRadius: 14, padding: 16 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{outlet.name}</div>
                    <div style={{ fontSize: 24, fontWeight: 500, color }}>{score}/100</div>
                  </div>

                  {/* Score bar */}
                  <div style={{ height: 4, background: '#f4f3f0', borderRadius: 2, marginBottom: 14 }}>
                    <div style={{ height: 4, width: `${score}%`, background: color, borderRadius: 2 }} />
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                    {[
                      { label: 'Flagged', value: outletData.flagged.length, color: outletData.flagged.length > 0 ? '#A32D2D' : '#1D9E75' },
                      { label: 'Score', value: `${score}%`, color },
                      { label: 'City', value: outlet.city, color: '#6b6a66' },
                    ].map(stat => (
                      <div key={stat.label} style={{ background: '#f4f3f0', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#9e9d99', marginBottom: 3 }}>{stat.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 500, color: stat.color }}>{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Flagged images */}
                  {outletData.flagged.length > 0 ? (
                    <div>
                      <div style={{ fontSize: 11, color: '#6b6a66', marginBottom: 8, fontWeight: 500 }}>
                        {outletData.flagged.length} flagged image{outletData.flagged.length > 1 ? 's' : ''} requiring attention
                      </div>
                      {outletData.flagged.slice(0, 3).map(rev => (
                        <div key={rev.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '7px 0', borderTop: '0.5px solid rgba(0,0,0,0.06)' }}>
                          <div style={{ width: 36, height: 36, background: '#FCEBEB', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                            {rev.images?.b2_url ? (
                              <img src={rev.images.b2_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : <span style={{ fontSize: 16 }}>⚑</span>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 500 }}>{rev.images?.channel} · {rev.images?.date}</div>
                            <div style={{ fontSize: 11, color: '#6b6a66', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {rev.comment || 'No comment added'}
                            </div>
                          </div>
                        </div>
                      ))}
                      {outletData.flagged.length > 3 && (
                        <div style={{ fontSize: 11, color: '#9e9d99', paddingTop: 6 }}>+{outletData.flagged.length - 3} more flagged</div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#1D9E75' }}>No flagged images — all clear!</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}

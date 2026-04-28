'use client';

export default function KPIBar({ channel, data, outlets }) {
  if (!data || !outlets) return null;

  const labels = {
    dispatchimages: { label: 'Dispatch posts', good: 8, bad: 4, unit: 'posts', invert: false },
    wastage: { label: 'Wastage entries', good: 3, bad: 6, unit: 'entries', invert: true },
    deepcleaning: { label: 'Days since clean', good: 2, bad: 5, unit: 'days', invert: true },
    outletchecklists: { label: 'Submitted today', good: 1, bad: 0, unit: '', invert: false, bool: true },
    naitems: { label: 'NA items today', good: 1, bad: 3, unit: 'items', invert: true },
  };

  const cfg = labels[channel] || { label: 'Images today', good: 5, bad: 2, unit: 'images', invert: false };

  function color(val) {
    if (cfg.bool) return val ? '#1D9E75' : '#E24B4A';
    if (!cfg.invert) return val >= cfg.good ? '#1D9E75' : val >= cfg.bad ? '#EF9F27' : '#E24B4A';
    return val <= cfg.good ? '#1D9E75' : val <= cfg.bad ? '#EF9F27' : '#E24B4A';
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${outlets.length}, 1fr)`, gap: 8, padding: '12px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
      {outlets.map(o => {
        const val = data[o.id] ?? 0;
        const c = color(val);
        return (
          <div key={o.id} style={{ background: '#f4f3f0', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9e9d99', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.name}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: c }}>
              {cfg.bool ? (val ? '✓' : '✗') : val}
            </div>
            <div style={{ fontSize: 10, color: '#9e9d99', marginTop: 2 }}>{cfg.unit}</div>
          </div>
        );
      })}
    </div>
  );
}

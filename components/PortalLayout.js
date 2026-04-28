'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { OUTLETS, CHANNELS } from '@/lib/config';

export default function PortalLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [outlet, setOutlet] = useState('');
  const [channel, setChannel] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [user, setUser] = useState('');

  useEffect(() => { setUser(localStorage.getItem('flax_user') || 'Manager'); }, []);

  function navigate(path, params = {}) {
    const url = new URL(path, window.location.origin);
    if (outlet) url.searchParams.set('outlet', outlet);
    if (channel) url.searchParams.set('channel', channel);
    if (date) url.searchParams.set('date', date);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    router.push(url.pathname + url.search);
  }

  const navItems = [
    { href: '/images', label: 'Images', icon: '🖼' },
    { href: '/wastage', label: 'Wastage', icon: '🗑' },
    { href: '/flagged', label: 'Flagged', icon: '⚑' },
    { href: '/outlets', label: 'Outlets', icon: '📊' },
  ];

  const isActive = (href) => pathname?.startsWith(href);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8f7f4' }}>
      {/* Sidebar */}
      <div style={{ width: 200, background: '#fff', borderRight: '0.5px solid rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>flax <span style={{ color: '#1D9E75' }}>ops</span></div>
          <div style={{ fontSize: 11, color: '#9e9d99', marginTop: 2 }}>Hi, {user}</div>
        </div>

        {/* Nav */}
        <div style={{ padding: '10px 8px' }}>
          <div style={{ fontSize: 10, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 6px', marginBottom: 6 }}>Views</div>
          {navItems.map(item => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 8px',
                borderRadius: 8, border: 'none', background: isActive(item.href) ? '#E1F5EE' : 'transparent',
                fontSize: 13, color: isActive(item.href) ? '#0F6E56' : '#6b6a66',
                fontWeight: isActive(item.href) ? 500 : 400, cursor: 'pointer', marginBottom: 2, textAlign: 'left'
              }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Outlet filter */}
        <div style={{ padding: '0 8px 8px' }}>
          <div style={{ fontSize: 10, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 6px 6px' }}>Outlet</div>
          <button
            onClick={() => { setOutlet(''); router.refresh(); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '6px 8px', borderRadius: 8, border: 'none', background: !outlet ? '#E1F5EE' : 'transparent', fontSize: 12, color: !outlet ? '#0F6E56' : '#6b6a66', fontWeight: !outlet ? 500 : 400, cursor: 'pointer', marginBottom: 2 }}
          >All outlets</button>
          {OUTLETS.map(o => (
            <button
              key={o.id}
              onClick={() => setOutlet(o.id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '6px 8px', borderRadius: 8, border: 'none', background: outlet === o.id ? '#E1F5EE' : 'transparent', fontSize: 12, color: outlet === o.id ? '#0F6E56' : '#6b6a66', fontWeight: outlet === o.id ? 500 : 400, cursor: 'pointer', marginBottom: 2 }}
            >{o.name}</button>
          ))}
        </div>

        {/* Channel filter */}
        <div style={{ padding: '0 8px 8px' }}>
          <div style={{ fontSize: 10, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 6px 6px' }}>Channel</div>
          <button
            onClick={() => setChannel('')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '6px 8px', borderRadius: 8, border: 'none', background: !channel ? '#f4f3f0' : 'transparent', fontSize: 12, color: '#6b6a66', cursor: 'pointer', marginBottom: 2 }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#888', display: 'inline-block', flexShrink: 0 }} />
            All channels
          </button>
          {CHANNELS.map(c => (
            <button
              key={c.id}
              onClick={() => setChannel(c.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '6px 8px', borderRadius: 8, border: 'none', background: channel === c.id ? '#f4f3f0' : 'transparent', fontSize: 12, color: channel === c.id ? '#1a1a1a' : '#6b6a66', fontWeight: channel === c.id ? 500 : 400, cursor: 'pointer', marginBottom: 2 }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.color, display: 'inline-block', flexShrink: 0 }} />
              {c.name}
            </button>
          ))}
        </div>

        {/* Date filter */}
        <div style={{ padding: '0 14px 14px', marginTop: 'auto' }}>
          <div style={{ fontSize: 10, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Date</div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', fontSize: 12 }} />
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

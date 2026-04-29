'use client';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { OUTLETS, CHANNELS } from '@/lib/config';

const todayStr = () => new Date().toISOString().split('T')[0];
const daysAgoStr = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

// channel: null in URL → default to 'dispatchimages'; '' (?channel=) → all channels; else → that channel
const DEFAULT_CHANNEL = 'dispatchimages';

function PortalLayoutBody({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);

  const outlet = searchParams.get('outlet') || '';
  const channelRaw = searchParams.get('channel');
  const channel = channelRaw === null ? DEFAULT_CHANNEL : channelRaw;
  const dateFrom = searchParams.get('date_from') || daysAgoStr(7);
  const dateTo = searchParams.get('date_to') || todayStr();

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!cancelled && data?.user) {
          setUser(data.user);
          // mirror to localStorage so existing handlers (reviews API) keep working
          try { localStorage.setItem('flax_user', data.user.name || data.user.email); } catch {}
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    try { localStorage.removeItem('flax_user'); } catch {}
    router.push('/login');
    router.refresh();
  }

  // Update URL with merged params; null deletes a key
  function updateParams(updates) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === undefined) params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    router.push(pathname + (qs ? '?' + qs : ''));
  }

  // Navigate to a different view, preserving current filters
  function goTo(path) {
    const qs = searchParams.toString();
    router.push(path + (qs ? '?' + qs : ''));
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
      <div style={{ width: 220, background: '#fff', borderRight: '0.5px solid rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '16px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 16, fontWeight: 500 }}>flax <span style={{ color: '#1D9E75' }}>ops</span></div>
            {user && (
              <button
                onClick={handleLogout}
                title="Sign out"
                style={{ background: 'none', border: 'none', color: '#9e9d99', fontSize: 11, cursor: 'pointer', padding: 0 }}
              >
                Sign out
              </button>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#9e9d99', marginTop: 2 }} title={user?.email || ''}>
            {user ? `Hi, ${user.name || user.email}` : 'Loading…'}
          </div>
        </div>

        {/* Date range — at top */}
        <div style={{ padding: '12px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 10, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Date range</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div>
              <div style={{ fontSize: 10, color: '#9e9d99', marginBottom: 2 }}>From</div>
              <input
                type="date"
                value={dateFrom}
                max={dateTo}
                onChange={e => updateParams({ date_from: e.target.value })}
                style={{ width: '100%', fontSize: 12 }}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#9e9d99', marginBottom: 2 }}>To</div>
              <input
                type="date"
                value={dateTo}
                min={dateFrom}
                onChange={e => updateParams({ date_to: e.target.value })}
                style={{ width: '100%', fontSize: 12 }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            <button
              onClick={() => updateParams({ date_from: todayStr(), date_to: todayStr() })}
              className="btn"
              style={{ flex: 1, fontSize: 10, padding: '3px 0' }}
            >Today</button>
            <button
              onClick={() => updateParams({ date_from: daysAgoStr(7), date_to: todayStr() })}
              className="btn"
              style={{ flex: 1, fontSize: 10, padding: '3px 0' }}
            >7d</button>
            <button
              onClick={() => updateParams({ date_from: daysAgoStr(30), date_to: todayStr() })}
              className="btn"
              style={{ flex: 1, fontSize: 10, padding: '3px 0' }}
            >30d</button>
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: '10px 8px' }}>
          <div style={{ fontSize: 10, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 6px', marginBottom: 6 }}>Views</div>
          {navItems.map(item => (
            <button
              key={item.href}
              onClick={() => goTo(item.href)}
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
            onClick={() => updateParams({ outlet: null })}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '6px 8px', borderRadius: 8, border: 'none', background: !outlet ? '#E1F5EE' : 'transparent', fontSize: 12, color: !outlet ? '#0F6E56' : '#6b6a66', fontWeight: !outlet ? 500 : 400, cursor: 'pointer', marginBottom: 2 }}
          >All outlets</button>
          {OUTLETS.map(o => (
            <button
              key={o.id}
              onClick={() => updateParams({ outlet: o.id })}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '6px 8px', borderRadius: 8, border: 'none', background: outlet === o.id ? '#E1F5EE' : 'transparent', fontSize: 12, color: outlet === o.id ? '#0F6E56' : '#6b6a66', fontWeight: outlet === o.id ? 500 : 400, cursor: 'pointer', marginBottom: 2 }}
            >{o.name}</button>
          ))}
        </div>

        {/* Channel filter */}
        <div style={{ padding: '0 8px 12px' }}>
          <div style={{ fontSize: 10, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 6px 6px' }}>Channel</div>
          <button
            onClick={() => updateParams({ channel: '' })}
            style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '6px 8px', borderRadius: 8, border: 'none', background: channelRaw === '' ? '#f4f3f0' : 'transparent', fontSize: 12, color: channelRaw === '' ? '#1a1a1a' : '#6b6a66', fontWeight: channelRaw === '' ? 500 : 400, cursor: 'pointer', marginBottom: 2 }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#888', display: 'inline-block', flexShrink: 0 }} />
            All channels
          </button>
          {CHANNELS.map(c => (
            <button
              key={c.id}
              onClick={() => updateParams({ channel: c.id })}
              style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '6px 8px', borderRadius: 8, border: 'none', background: channel === c.id ? '#f4f3f0' : 'transparent', fontSize: 12, color: channel === c.id ? '#1a1a1a' : '#6b6a66', fontWeight: channel === c.id ? 500 : 400, cursor: 'pointer', marginBottom: 2 }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.color, display: 'inline-block', flexShrink: 0 }} />
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <VersionBadge />
        {children}
      </div>
    </div>
  );
}

function VersionBadge() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0';
  const commit = process.env.NEXT_PUBLIC_BUILD_COMMIT || 'dev';
  const date = process.env.NEXT_PUBLIC_BUILD_DATE || '';
  return (
    <div
      title={date ? `Built ${date}` : ''}
      style={{
        position: 'fixed',
        top: 10,
        right: 14,
        zIndex: 50,
        fontSize: 10,
        color: '#9e9d99',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(4px)',
        padding: '2px 8px',
        borderRadius: 99,
        border: '0.5px solid rgba(0,0,0,0.08)',
        fontVariantNumeric: 'tabular-nums',
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
    >
      v{version} · {commit}
    </div>
  );
}

// Wrap in Suspense because PortalLayoutBody uses useSearchParams (Next 15 prerender requirement)
export default function PortalLayout({ children }) {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#9e9d99', fontSize: 13 }}>Loading…</div>}>
      <PortalLayoutBody>{children}</PortalLayoutBody>
    </Suspense>
  );
}

'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/images';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(next);
        router.refresh();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error — please retry');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8f7f4', padding: 16,
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 14,
        padding: 28, width: '100%', maxWidth: 360,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}>
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>
          flax <span style={{ color: '#1D9E75' }}>ops</span>
        </div>
        <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 24 }}>Sign in to continue</div>

        <label style={{ display: 'block', fontSize: 11, color: '#6b6a66', marginBottom: 4 }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoFocus
          autoComplete="username"
          placeholder="you@flaxitup.com"
          style={{ width: '100%', fontSize: 14, padding: '8px 10px', marginBottom: 14 }}
        />

        <label style={{ display: 'block', fontSize: 11, color: '#6b6a66', marginBottom: 4 }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          style={{ width: '100%', fontSize: 14, padding: '8px 10px', marginBottom: 14 }}
        />

        {error && (
          <div style={{
            background: '#FCEBEB', color: '#A32D2D', fontSize: 12, padding: '8px 10px',
            borderRadius: 8, marginBottom: 14,
          }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: 10, background: '#1D9E75', color: '#fff', border: 'none',
            borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <div style={{ marginTop: 16, fontSize: 11, color: '#9e9d99', textAlign: 'center' }}>
          Need access? Ask an admin to enable the <strong>images</strong> module on your account.
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9e9d99' }}>Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}

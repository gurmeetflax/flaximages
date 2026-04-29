import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/admin-supabase';
import { signSession } from '@/lib/session';

const SESSION_DAYS = 30;

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = (body?.email || '').toString().trim().toLowerCase();
  const password = (body?.password || '').toString();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  // Look up user in admin DB
  const { data: user, error } = await adminSupabase
    .from('flax_user_access')
    .select('id, email, name, role, modules, outlet_ids, password, is_active')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('Admin DB lookup error:', error);
    return NextResponse.json({ error: 'Auth service error' }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }
  if (!user.is_active) {
    return NextResponse.json({ error: 'Account is inactive' }, { status: 401 });
  }
  if (user.password !== password) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const modules = Array.isArray(user.modules) ? user.modules : [];
  const hasAccess = modules.includes('images') || modules.includes('all');
  if (!hasAccess) {
    return NextResponse.json(
      { error: "You don't have access to the images module. Ask an admin to enable it." },
      { status: 403 },
    );
  }

  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const sessionValue = await signSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    modules: user.modules,
    outlet_ids: user.outlet_ids,
    exp,
  });

  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
  res.cookies.set('flax_session', sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: '/',
  });
  return res;
}

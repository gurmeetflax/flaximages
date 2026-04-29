import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

export async function GET() {
  const c = await cookies();
  const session = c.get('flax_session')?.value;
  const user = await verifySession(session);
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      modules: user.modules,
      outlet_ids: user.outlet_ids,
    },
  });
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  const { b2_key, b2_url, channel, outlet, date, time_str, filename, status, comment, reviewed_by } = await req.json();

  try {
    // Upsert image record
    const { data: image, error: imgErr } = await supabase
      .from('images')
      .upsert({ b2_key, b2_url, channel, outlet, date, time_str, filename }, { onConflict: 'b2_key' })
      .select('id')
      .single();

    if (imgErr) throw imgErr;

    // Upsert review
    const { data: review, error: revErr } = await supabase
      .from('reviews')
      .upsert({
        image_id: image.id,
        status,
        comment,
        reviewed_by,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'image_id' })
      .select()
      .single();

    if (revErr) throw revErr;

    return NextResponse.json({ ok: true, review });
  } catch (err) {
    console.error('Review error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const outlet = searchParams.get('outlet');
  const date = searchParams.get('date');

  try {
    let query = supabase
      .from('reviews')
      .select('*, images(*)')
      .order('updated_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (outlet) query = query.eq('images.outlet', outlet);
    if (date) query = query.eq('images.date', date);

    const { data, error } = await query.limit(200);
    if (error) throw error;

    return NextResponse.json({ reviews: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

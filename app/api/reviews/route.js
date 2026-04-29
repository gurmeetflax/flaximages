import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSignedImageUrl } from '@/lib/b2';

// Build the bare (unsigned) B2 URL for a key so we never persist a 1-hour-expiring
// signed URL into the images table. Display code can re-sign if needed.
function bareB2Url(key) {
  const bucket = process.env.B2_BUCKET || 'flax-ops-images';
  const region = process.env.B2_REGION || 'us-east-005';
  return `https://${bucket}.s3.${region}.backblazeb2.com/${key}`;
}

export async function POST(req) {
  const body = await req.json();

  // Accept either the new image field shape ({key, url, time}) returned by
  // /api/images, or the explicit DB-column names. Normalise to DB columns.
  const b2_key = body.b2_key || body.key;
  const time_str = body.time_str || body.time || null;
  const channel = body.channel;
  const outlet = body.outlet;
  const date = body.date;
  const filename = body.filename;
  const status = body.status;
  const comment = body.comment ?? null;
  const reviewed_by = body.reviewed_by || null;

  if (!b2_key || !channel || !outlet || !date || !filename || !status) {
    return NextResponse.json(
      { error: 'Missing required field. Need b2_key/key, channel, outlet, date, filename, status.' },
      { status: 400 },
    );
  }

  // Always derive a stable URL from the key so the DB never stores a signed URL.
  const b2_url = bareB2Url(b2_key);

  try {
    // Upsert image record
    const { data: image, error: imgErr } = await supabase
      .from('images')
      .upsert({ b2_key, b2_url, channel, outlet, date, time_str, filename }, { onConflict: 'b2_key' })
      .select('id')
      .single();
    if (imgErr) throw imgErr;

    // Upsert review (one review per image_id)
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

    // We store the BARE (unsigned) b2_url in the DB for stability. When serving
    // the GET response, sign each URL on the fly so display code can `<img src>`
    // it directly. Build a CF-resized thumb too for grid use.
    const reqUrl = new URL(req.url);
    const origin = reqUrl.origin;
    const signed = await Promise.all((data || []).map(async (rev) => {
      const key = rev.images?.b2_key;
      if (!key) return rev;
      try {
        const signedUrl = await getSignedImageUrl(key);
        return {
          ...rev,
          images: {
            ...rev.images,
            b2_url: signedUrl,
            b2_thumb: `${origin}/cdn-cgi/image/width=120,quality=70,format=auto,fit=cover/${signedUrl}`,
          },
        };
      } catch {
        return rev;
      }
    }));

    return NextResponse.json({ reviews: signed });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

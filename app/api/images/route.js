import { NextResponse } from 'next/server';
import { listImages, listImagesRange, getSignedImageUrl } from '@/lib/b2';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const channel = searchParams.get('channel') || '';
  const outlet = searchParams.get('outlet') || '';
  const date = searchParams.get('date') || '';
  const dateFrom = searchParams.get('date_from') || '';
  const dateTo = searchParams.get('date_to') || '';

  try {
    const images = (dateFrom && dateTo)
      ? await listImagesRange({ channel, outlet, dateFrom, dateTo })
      : await listImages({ channel, outlet, date });

    // Generate signed URLs for each image (cap at 100 to keep response sane)
    const withUrls = await Promise.all(
      images.slice(0, 100).map(async img => {
        const url = await getSignedImageUrl(img.key);
        return { ...img, url };
      })
    );

    return NextResponse.json({ images: withUrls });
  } catch (err) {
    console.error('Images API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

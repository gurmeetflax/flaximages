import { NextResponse } from 'next/server';
import { listImages, getSignedImageUrl } from '@/lib/b2';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const channel = searchParams.get('channel') || '';
  const outlet = searchParams.get('outlet') || '';
  const date = searchParams.get('date') || '';

  try {
    const images = await listImages({ channel, outlet, date });

    // Generate signed URLs for each image
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

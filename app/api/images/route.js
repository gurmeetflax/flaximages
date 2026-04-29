import { NextResponse } from 'next/server';
import { listImages, listImagesRange, getSignedImageUrl } from '@/lib/b2';

// Cloudflare Image Transformations options for grid thumbnails. Pro plan required.
// width=400 keeps thumbnails small enough for fast loading on a typical grid cell.
// fit=cover crops to aspect ratio. format=auto serves AVIF/WebP where supported.
const THUMB_OPTS = 'width=400,quality=75,format=auto,fit=cover';

function buildThumbUrl(origin, sourceUrl) {
  // CF transformation URL pattern: <zone>/cdn-cgi/image/<options>/<source-url>
  // Source can be a full URL on a different host (B2 signed URL works).
  return `${origin}/cdn-cgi/image/${THUMB_OPTS}/${sourceUrl}`;
}

export async function GET(req) {
  const reqUrl = new URL(req.url);
  const origin = reqUrl.origin;
  const { searchParams } = reqUrl;
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
        return {
          ...img,
          url,                            // full-size for lightbox
          thumb: buildThumbUrl(origin, url), // resized via CF for grid
        };
      })
    );

    return NextResponse.json({ images: withUrls });
  } catch (err) {
    console.error('Images API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

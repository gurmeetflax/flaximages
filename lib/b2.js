import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { USER_MAP, OUTLET_TO_USER } from './config';

const b2 = new S3Client({
  region: process.env.B2_REGION || 'us-east-005',
  endpoint: process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com',
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APP_KEY,
  },
});

const BUCKET = process.env.B2_BUCKET || 'flax-ops-images';

export async function getSignedImageUrl(key, expiresIn = 3600) {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(b2, cmd, { expiresIn });
}

export async function listImages({ channel, outlet, date }) {
  // B2 keys are organised as channel/<slack_user_id>/date/...
  // Translate the outlet name (e.g. "Bandra") to its Slack user id for the prefix.
  const outletKey = outlet ? (OUTLET_TO_USER[outlet] || outlet) : '';
  const prefix = [channel, outletKey, date].filter(Boolean).join('/');
  const res = await b2.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix,
    MaxKeys: 200,
  }));
  return (res.Contents || []).map(obj => ({
    key: obj.Key,
    size: obj.Size,
    lastModified: obj.LastModified,
    ...parseKey(obj.Key),
  }));
}

// List images across a date range (inclusive). Caps at 31 days to bound work.
export async function listImagesRange({ channel, outlet, dateFrom, dateTo }) {
  const dates = [];
  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  if (isNaN(start) || isNaN(end) || end < start) return [];
  for (let d = new Date(start); d <= end && dates.length < 31; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }
  const results = await Promise.all(
    dates.map(date => listImages({ channel, outlet, date }))
  );
  return results.flat();
}

// Parse key: channel/<slack_user_id>/date/time_filename.jpg
// Translate the user id back to a friendly outlet name; unmapped users keep their id.
export function parseKey(key) {
  const parts = key.split('/');
  const userId = parts[1];
  const outletName = userId ? (USER_MAP[userId] || userId) : undefined;
  if (parts.length < 4) {
    return { channel: parts[0], outlet: outletName, date: parts[2], filename: parts[3] };
  }
  return {
    channel: parts[0],
    outlet: outletName,
    date: parts[2],
    filename: parts[3],
    time: parts[3]?.split('_')[0]?.replace(/-/g, ':'),
  };
}

export { b2, BUCKET };

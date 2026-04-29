// HMAC-signed session cookies. Works in Edge runtime (middleware) and Node
// (API routes) because it uses the Web Crypto API only.
//
// Cookie value shape: <base64url(payload_json)>.<base64url(hmac)>
// Payload includes a Date.now()-based exp; we reject expired cookies.

const ENC = new TextEncoder();
const DEC = new TextDecoder();

function b64uEncode(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64uDecode(str) {
  const pad = (4 - (str.length % 4)) % 4;
  const normalised = (str + '='.repeat(pad)).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(normalised);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function getKey() {
  const secret = process.env.SESSION_SECRET || 'dev-secret-change-in-production';
  return crypto.subtle.importKey(
    'raw',
    ENC.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signSession(payload) {
  const key = await getKey();
  const json = JSON.stringify(payload);
  const data = ENC.encode(json);
  const sig = await crypto.subtle.sign('HMAC', key, data);
  return b64uEncode(data) + '.' + b64uEncode(new Uint8Array(sig));
}

export async function verifySession(cookieValue) {
  if (!cookieValue || !cookieValue.includes('.')) return null;
  const [dataB64, sigB64] = cookieValue.split('.');
  if (!dataB64 || !sigB64) return null;
  try {
    const key = await getKey();
    const data = b64uDecode(dataB64);
    const sig = b64uDecode(sigB64);
    const ok = await crypto.subtle.verify('HMAC', key, sig, data);
    if (!ok) return null;
    const payload = JSON.parse(DEC.decode(data));
    if (typeof payload.exp === 'number' && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

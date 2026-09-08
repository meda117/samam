const json = (body, status = 200, origin = '') => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'Authorization, Content-Type',
    'vary': 'Origin'
  }
});

async function hmacSha1(secret, message) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function verifiedEmail(idToken, apiKey) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  const body = await response.json().catch(() => ({}));
  return response.ok ? body.users?.[0]?.email || '' : '';
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowedOrigin = String(env.ALLOWED_ORIGIN || '');
    if (!allowedOrigin || origin !== allowedOrigin) return json({ error: 'المصدر غير مسموح.' }, 403, allowedOrigin);
    if (request.method === 'OPTIONS') return new Response(null, { headers: { 'access-control-allow-origin': allowedOrigin, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'Authorization, Content-Type', 'vary': 'Origin' } });
    if (request.method !== 'POST') return json({ error: 'الطريقة غير مسموحة.' }, 405, allowedOrigin);

    const idToken = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || '';
    if (!idToken) return json({ error: 'سجّل دخول الأدمن أولًا.' }, 401, allowedOrigin);
    if (!env.IMAGEKIT_PRIVATE_KEY || !env.FIREBASE_WEB_API_KEY || !env.ADMIN_EMAIL) return json({ error: 'إعدادات خدمة الرفع غير مكتملة.' }, 500, allowedOrigin);

    const email = await verifiedEmail(idToken, env.FIREBASE_WEB_API_KEY);
    if (!email || email.toLowerCase() !== String(env.ADMIN_EMAIL).toLowerCase()) return json({ error: 'هذا الحساب غير مصرح له برفع الصور.' }, 403, allowedOrigin);

    const token = crypto.randomUUID();
    const expire = Math.floor(Date.now() / 1000) + 600;
    const signature = await hmacSha1(env.IMAGEKIT_PRIVATE_KEY, `${token}${expire}`);
    return json({ token, expire, signature }, 200, allowedOrigin);
  }
};

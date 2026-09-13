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

const preflight = (origin) => new Response(null, {
  headers: {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'Authorization, Content-Type',
    'access-control-max-age': '86400',
    'vary': 'Origin'
  }
});

const encoder = new TextEncoder();
let serviceTokenCache = { value: '', expiresAt: 0 };

function base64Url(value) {
  const bytes = typeof value === 'string' ? encoder.encode(value) : new Uint8Array(value);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function pemToArrayBuffer(pem) {
  const normalized = String(pem || '').replace(/-----BEGIN [^-]+-----|-----END [^-]+-----|\s/g, '');
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

async function hmacSha1(secret, message) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256(value) {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return base64Url(bytes);
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

async function firebaseAccessToken(env) {
  if (serviceTokenCache.value && Date.now() < serviceTokenCache.expiresAt) return serviceTokenCache.value;
  if (!env.FIREBASE_SERVICE_ACCOUNT) throw new Error('إعداد خدمة حماية أكواد الخصم غير مكتمل.');
  let account;
  try { account = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT); } catch (_) { throw new Error('صيغة حساب خدمة Firebase غير صحيحة.'); }
  if (!account.client_email || !account.private_key) throw new Error('بيانات حساب خدمة Firebase ناقصة.');
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.database',
    aud: 'https://oauth2.googleapis.com/token',
    iat: issuedAt,
    exp: issuedAt + 3600
  }));
  const privateKey = await crypto.subtle.importKey('pkcs8', pemToArrayBuffer(account.private_key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signed = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, encoder.encode(`${header}.${payload}`));
  const assertion = `${header}.${payload}.${base64Url(signed)}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) throw new Error('تعذر الاتصال بحساب خدمة Firebase.');
  serviceTokenCache = { value: body.access_token, expiresAt: Date.now() + Math.max(60, Number(body.expires_in || 3600) - 120) * 1000 };
  return serviceTokenCache.value;
}

function databaseUrl(env, path, token) {
  const root = String(env.FIREBASE_DATABASE_URL || '').replace(/\/$/, '');
  if (!/^https:\/\//.test(root)) throw new Error('أضف رابط Realtime Database إلى إعدادات العامل.');
  return `${root}/${path}.json?access_token=${encodeURIComponent(token)}`;
}

async function databaseRead(env, path, token, withEtag = false) {
  const response = await fetch(databaseUrl(env, path, token), { headers: withEtag ? { 'X-Firebase-ETag': 'true' } : {} });
  if (!response.ok) throw new Error('تعذر قراءة بيانات الخصم من Firebase.');
  return { value: await response.json().catch(() => null), etag: response.headers.get('etag') };
}

async function databaseWriteIfUnchanged(env, path, token, value, etag) {
  const response = await fetch(databaseUrl(env, path, token), {
    method: 'PUT',
    headers: { 'content-type': 'application/json', 'if-match': etag || '*' },
    body: JSON.stringify(value)
  });
  return response.status === 412 ? false : response.ok;
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 16) return '';
  return digits.startsWith('0') ? `966${digits.slice(1)}` : digits;
}

function activeServingOptions(product) {
  const options = product?.servingOptions;
  if (!options || typeof options !== 'object') return [];
  return [{ id: 'plain', ...options.plain }, { id: 'rice', ...options.rice }].filter((option) => option.enabled);
}

function pricingForItem(item, state) {
  const product = (state.products || []).find((entry) => entry.id === item?.productId && entry.active !== false);
  if (!product) return null;
  const quantity = Math.floor(Number(item.quantity || 0));
  if (!quantity || quantity > 99) return null;
  const servingOptions = activeServingOptions(product);
  let serving = null;
  if (servingOptions.length > 1) {
    serving = servingOptions.find((option) => option.id === item.servingId);
    if (!serving) return null;
  } else if (servingOptions.length === 1) serving = servingOptions[0];
  const sizes = serving ? (serving.sizes || []) : (product.sizes || []);
  let unit = Number(serving ? serving.basePrice : product.basePrice) || 0;
  let sizeLabel = '';
  if (sizes.length) {
    const size = sizes.find((entry) => entry.id === item.sizeId);
    if (!size) return null;
    unit = Number(size.price) || 0;
    sizeLabel = String(size.label || '');
  } else if (serving) return null;
  const needsRice = serving ? serving.id === 'rice' : Boolean(product.requiresRice);
  let rice = null;
  if (needsRice) {
    const allowedIds = serving?.id === 'rice' ? serving.riceAllowedIds : product.riceAllowedIds;
    rice = (state.riceTypes || []).find((entry) => entry.id === item.riceId && entry.active !== false && (allowedIds === null || allowedIds === undefined || allowedIds.includes(entry.id)));
    if (!rice) return null;
    unit += Number(rice.price) || 0;
  }
  return { productId: product.id, name: String(product.name || ''), servingLabel: serving?.id === 'plain' ? 'سادة' : (serving?.id === 'rice' ? 'مع الرز' : ''), sizeLabel, riceName: rice?.name || '', quantity, price: unit, lineTotal: unit * quantity };
}

function couponValidation(code, payload, state) {
  const coupon = (state.coupons || []).find((entry) => String(entry.code || '').toUpperCase() === code && entry.active !== false);
  if (!coupon) return { error: 'كود الخصم غير صالح أو متوقف.' };
  const method = (state.fulfillment?.methods || []).find((entry) => entry.id === payload.methodId && entry.enabled !== false && entry.active !== false && (entry.kind !== 'delivery' || state.fulfillment?.delivery?.enabled));
  if (!method) return { error: 'طريقة الاستلام غير متاحة.' };
  const methodIds = Array.isArray(coupon.methodIds) ? coupon.methodIds : [];
  if (methodIds.length && !methodIds.includes(method.id)) return { error: `هذا الكود غير متاح مع «${method.name}».` };
  const pricedItems = (payload.items || []).map((item) => pricingForItem(item, state));
  if (!pricedItems.length || pricedItems.some((item) => !item)) return { error: 'تعذر التحقق من أصناف الطلب. حدّث الصفحة وحاول مرة أخرى.' };
  const subtotal = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const productIds = coupon.scope === 'products' ? (coupon.productIds || []) : null;
  const eligibleItems = productIds ? pricedItems.filter((item) => productIds.includes(item.productId)) : pricedItems;
  const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + item.lineTotal, 0);
  if (!eligibleItems.length) return { error: 'لا يوجد في السلة صنف مشمول بهذا الكود.' };
  if (eligibleSubtotal < Number(coupon.minimum || 0)) return { error: 'لم يتحقق الحد الأدنى للأصناف المشمولة بهذا الكود.' };
  const requestedDiscount = coupon.type === 'fixed' ? Number(coupon.amount || 0) : eligibleSubtotal * (Number(coupon.amount || 0) / 100);
  const discount = Math.min(Math.max(0, requestedDiscount), eligibleSubtotal);
  const deliverySettings = state.fulfillment?.delivery || {};
  // لا يبقى التوصيل مجانًا إن خفّض الكود قيمة الأصناف إلى أقل من حد التوصيل المجاني.
  const payableProducts = Math.max(0, subtotal - discount);
  const freeDelivery = deliverySettings.freeEnabled && (!Number(deliverySettings.freeOver || 0) || payableProducts >= Number(deliverySettings.freeOver || 0));
  const delivery = method.kind === 'delivery' && deliverySettings.enabled && !freeDelivery ? Number(deliverySettings.fee || 0) : 0;
  return { coupon, method, pricedItems, eligibleItems, subtotal, eligibleSubtotal, delivery, discount, total: Math.max(0, subtotal + delivery - discount) };
}

async function redeemCoupon(request, env, origin) {
  let payload;
  try { payload = await request.json(); } catch (_) { return json({ error: 'بيانات الطلب غير صالحة.' }, 400, origin); }
  const code = String(payload?.code || '').trim().toUpperCase();
  const phone = normalizePhone(payload?.customer?.phone);
  const customerName = String(payload?.customer?.name || '').trim().slice(0, 120);
  const deviceId = String(payload?.deviceId || '').trim().slice(0, 180);
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  if (!code || !phone || !customerName || !deviceId || !ip || !Array.isArray(payload?.items) || !payload.items.length) return json({ error: 'أكمل بيانات العميل والطلب قبل استخدام الكود.' }, 400, origin);
  if (!env.COUPON_HASH_SALT) return json({ error: 'إعداد حماية أكواد الخصم غير مكتمل.' }, 503, origin);
  try {
    const token = await firebaseAccessToken(env);
    const currentState = (await databaseRead(env, 'restaurantState', token)).value;
    const order = couponValidation(code, payload, currentState || {});
    if (order.error) return json({ error: order.error }, 422, origin);
    const phoneKey = await sha256(`${env.COUPON_HASH_SALT}|phone|${phone}`);
    const deviceKey = await sha256(`${env.COUPON_HASH_SALT}|device|${deviceId}`);
    const ipKey = await sha256(`${env.COUPON_HASH_SALT}|ip|${ip}`);
    const path = `couponUsage/${order.coupon.id}`;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const snapshot = await databaseRead(env, path, token, true);
      const usage = snapshot.value && typeof snapshot.value === 'object' ? snapshot.value : {};
      const singleUse = order.coupon.singleUse !== false;
      if (singleUse && usage.phones?.[phoneKey]) return json({ error: 'تم استخدام هذا الكود سابقًا مع رقم الجوال هذا.' }, 409, origin);
      if (singleUse && usage.devices?.[deviceKey]) return json({ error: 'تم استخدام هذا الكود سابقًا من هذا الجهاز.' }, 409, origin);
      if (singleUse && usage.ips?.[ipKey]) return json({ error: 'تم استخدام هذا الكود سابقًا من هذه الشبكة.' }, 409, origin);
      const redemptionId = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      const next = { ...usage, phones: { ...(usage.phones || {}), [phoneKey]: redemptionId }, devices: { ...(usage.devices || {}), [deviceKey]: redemptionId }, ips: { ...(usage.ips || {}), [ipKey]: redemptionId }, entries: { ...(usage.entries || {}), [redemptionId]: { timestamp, customer: { name: customerName, phone }, method: { id: order.method.id, name: order.method.name, kind: order.method.kind }, order: { items: order.pricedItems, eligibleProductIds: order.eligibleItems.map((item) => item.productId), subtotal: order.subtotal, eligibleSubtotal: order.eligibleSubtotal, delivery: order.delivery, discount: order.discount, total: order.total } } } };
      if (await databaseWriteIfUnchanged(env, path, token, next, snapshot.etag)) return json({ ok: true, redemptionId, discount: order.discount, total: order.total, eligibleProductIds: order.eligibleItems.map((item) => item.productId) }, 200, origin);
    }
    return json({ error: 'تعذر تثبيت استخدام الكود؛ حاول مرة أخرى.' }, 409, origin);
  } catch (error) {
    return json({ error: error?.message || 'تعذر تأكيد كود الخصم.' }, 500, origin);
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowedOrigin = String(env.ALLOWED_ORIGIN || '');
    if (!allowedOrigin || origin !== allowedOrigin) return json({ error: 'المصدر غير مسموح.' }, 403, allowedOrigin);
    if (request.method === 'OPTIONS') return preflight(allowedOrigin);
    if (request.method !== 'POST') return json({ error: 'الطريقة غير مسموحة.' }, 405, allowedOrigin);
    const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
    if (path === '/coupon') return redeemCoupon(request, env, allowedOrigin);
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

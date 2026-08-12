const crypto = require('crypto');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

const imageKitPrivateKey = defineSecret('IMAGEKIT_PRIVATE_KEY');

exports.imagekitAuth = onCall(
  { region: 'asia-southeast1', secrets: [imageKitPrivateKey] },
  (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'يجب تسجيل دخول الأدمن لرفع الصور.');
    }

    const token = crypto.randomUUID();
    const expire = Math.floor(Date.now() / 1000) + (10 * 60);
    const signature = crypto
      .createHmac('sha1', imageKitPrivateKey.value())
      .update(`${token}${expire}`)
      .digest('hex');

    return { token, expire, signature };
  }
);

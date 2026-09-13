# إعداد Worker لرفع الصور وحماية أكواد الخصم

يستخدم الموقع Worker واحدًا على Cloudflare لأمرين:

- توقيع رفع صور ImageKit للأدمن فقط.
- تثبيت استخدام كود الخصم من الخادم قبل فتح واتساب، ومنعه للجوال أو الجهاز أو IP نفسه.

لا تضع أي مفتاح خاص في GitHub أو في `firebase-config.js`.

## 1. حدّث كود العامل

من **Cloudflare > Workers & Pages > samam-imagekit-auth > Edit code** استبدل المحتوى بملف:

`cloudflare-worker/imagekit-auth-worker.js`

ثم اضغط **Deploy**.

## 2. المتغيرات والأسرار

من **Settings > Variables and Secrets** أضف التالي، ثم اضغط **Deploy** بعد الإضافة:

| الاسم | النوع | القيمة |
| --- | --- | --- |
| `IMAGEKIT_PRIVATE_KEY` | Secret | مفتاح ImageKit الخاص |
| `FIREBASE_WEB_API_KEY` | Variable | قيمة `apiKey` من `firebase-config.js` |
| `ADMIN_EMAIL` | Variable | `samam@admin.com` |
| `ALLOWED_ORIGIN` | Variable | `https://smam.sa` بدون `/` أخيرة |
| `FIREBASE_DATABASE_URL` | Variable | `https://samam-resturant-default-rtdb.asia-southeast1.firebasedatabase.app` |
| `FIREBASE_SERVICE_ACCOUNT` | Secret | كامل محتوى ملف JSON الخاص بحساب خدمة Firebase |
| `COUPON_HASH_SALT` | Secret | نص عشوائي طويل، 32 حرفًا أو أكثر |

## 3. إنشاء `FIREBASE_SERVICE_ACCOUNT`

1. افتح Firebase Console للمشروع **samam-resturant**.
2. اضغط رمز الترس ثم **Project settings**.
3. افتح تبويب **Service accounts**.
4. اختر **Generate new private key**، ثم نزّل ملف JSON.
5. افتح الملف محليًا وانسخ محتواه كاملًا والصقه كـ **Secret** باسم `FIREBASE_SERVICE_ACCOUNT` في Cloudflare.
6. احفظ ملف JSON في مكان آمن واحذفه من مجلد المشروع إن وُجد. لا ترسله في المحادثة ولا ترفعه إلى GitHub.

حساب الخدمة يبقى داخل Worker فقط؛ والواجهة لا تتلقى مفتاحه ولا عنوان IP الحقيقي للعميل.

## 4. قواعد Firebase

من **Realtime Database > Rules** الصق محتوى `database.rules.json` ثم اضغط **Publish**.

السجل `couponUsage` لا يستطيع العميل قراءته أو تعديله. حساب الأدمن فقط يقرأه من لوحة التحكم، أما Worker فيسجل الاستخدام بامتياز حساب الخدمة.

## 5. رابط العامل في الموقع

اترك الرابطين في `firebase-config.js` بهذا الشكل، مع استبدال النطاق فقط إن اختلف رابط العامل لديك:

```js
authEndpoint: 'https://samam-imagekit-auth.abdelrhmanmeda.workers.dev',
couponEndpoint: 'https://samam-imagekit-auth.abdelrhmanmeda.workers.dev/coupon'
```

## كيف تعمل الحماية

عند إرسال طلب يحمل كود خصم، يعيد Worker حساب الأصناف والسعر والخصم من بيانات Firebase، ويتحقق من طريقة الاستلام. ثم يحجز الاستخدام ذريًا بواسطة رقم الجوال ومعرّف الجهاز وIP القادم من Cloudflare. لا تدخل رسوم التوصيل في الخصم، حتى لو كانت طريقة الاستلام هي التوصيل.

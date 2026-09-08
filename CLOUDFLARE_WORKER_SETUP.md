# تفعيل رفع صور ImageKit على الخطة المجانية

هذه الخدمة الصغيرة تصدر صلاحية رفع مؤقتة لـ ImageKit بعد التأكد من أن المستخدم هو حساب الأدمن في Firebase. لا تضع مفتاح ImageKit الخاص في ملفات الموقع أو GitHub.

## 1. أنشئ Worker

من Cloudflare Dashboard افتح **Workers & Pages** ثم أنشئ Worker جديدًا. استبدل الكود بمحتوى الملف:

`cloudflare-worker/imagekit-auth-worker.js`

ثم انشره وانسخ رابطه، مثل:

`https://samam-imagekit-auth.<اسمك>.workers.dev`

## 2. أضف المتغيرات والأسرار في إعدادات Worker

من **Settings → Variables and Secrets** أضف القيم التالية:

| الاسم | النوع | القيمة |
| --- | --- | --- |
| `IMAGEKIT_PRIVATE_KEY` | Secret | مفتاح ImageKit الخاص الجديد بعد تدويره |
| `FIREBASE_WEB_API_KEY` | Variable | قيمة `apiKey` الموجودة في `firebase-config.js` |
| `ADMIN_EMAIL` | Variable | بريد حساب الأدمن الذي أنشأته في Firebase Authentication |
| `ALLOWED_ORIGIN` | Variable | `https://meda117.github.io` |

إذا غيّرت نطاق الموقع لاحقًا، غيّر `ALLOWED_ORIGIN` إليه بدون `/` في النهاية.

## 3. اربط الموقع بالخدمة

داخل `firebase-config.js` ضع رابط Worker في `authEndpoint`:

```js
authEndpoint: 'https://samam-imagekit-auth.<اسمك>.workers.dev'
```

بعد رفع الملفات إلى GitHub، سجّل دخول الأدمن وافتح «محتوى الموقع». اختر صورة للهيرو أو أي لوجو ثم اضغط «حفظ محتوى الموقع».

الأصناف وأيقونات التطبيقات والشبكات تستخدم نفس خدمة الرفع تلقائيًا.

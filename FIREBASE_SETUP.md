# تشغيل Firebase وImageKit وخصومات الموقع

## 1. قواعد البيانات

من Firebase Console افتح **Realtime Database > Rules** والصق محتوى `database.rules.json` ثم اضغط **Publish**.

هذه القواعد تجعل بيانات المطعم قابلة للقراءة للعملاء، وتمنح الكتابة ولوحة استخدامات الأكواد لحساب الأدمن فقط:

`samam@admin.com`

## 2. حساب الأدمن

من **Authentication > Sign-in method** فعّل **Email/Password**، ثم أنشئ حساب الأدمن بالبريد نفسه. أضف `smam.sa` إلى **Authorized domains** إذا لم يكن موجودًا.

## 3. حفظ البيانات أول مرة

ارفع ملفات الموقع إلى الاستضافة، ثم افتح `admin.html` وسجل الدخول. اضغط حفظ مرة واحدة من لوحة التحكم ليتم نسخ البيانات الحالية إلى Realtime Database، وبعدها ستظهر التعديلات على كل الأجهزة.

## 4. الصور والخصومات

- Firebase هنا للبيانات فقط، لا لرفع الصور.
- صور المنتجات واللوجوهات تذهب إلى ImageKit عبر Cloudflare Worker.
- حماية أكواد الخصم وسجل استخدامها تستخدم Cloudflare Worker كذلك، لذلك اتبع ملف `CLOUDFLARE_WORKER_SETUP.md` بعد رفع هذا التحديث.

## ملاحظات أمان

- `firebase-config.js` يحتوي معرفات عامة ويمكن نشره.
- مفتاح ImageKit الخاص وملف Service Account و`COUPON_HASH_SALT` أسرار؛ لا تضعها في الملفات أو GitHub.
- عند الاشتباه في كشف أي مفتاح، دوّره فورًا من الخدمة المعنية.

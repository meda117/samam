# تشغيل Firebase وImageKit

## 1. حماية البيانات

من Firebase Console افتح **Realtime Database > Rules** والصق محتوى `database.rules.json` ثم اضغط Publish.

في **Authentication > Sign-in method** فعّل Email/Password وأنشئ حساب الأدمن من تبويب Users. أضف `meda117.github.io` داخل Authorized domains.

## 2. تثبيت ونشر Firebase Function لرفع الصور

من جذر المشروع نفّذ:

```powershell
npm install -g firebase-tools
firebase login
firebase use samam-resturant
firebase functions:secrets:set IMAGEKIT_PRIVATE_KEY
```

عند طلب القيمة، الصق **مفتاح ImageKit الخاص الجديد** فقط في الطرفية. لا تضعه داخل أي ملف أو GitHub.

ثم نفّذ:

```powershell
cd functions
npm install
cd ..
firebase deploy --only functions:imagekitAuth,database
```

## 3. أول حفظ

ارفع الملفات المعدلة إلى GitHub Pages، ثم افتح `admin.html` وسجّل دخولك بحساب Firebase. اضغط حفظ مرة واحدة من أي صفحة في لوحة التحكم ليتم نسخ البيانات الحالية إلى Realtime Database. بعدها ستظهر التعديلات لكل الأجهزة فورًا.

## ملاحظات

- بيانات Firebase وImageKit Public Key داخل `firebase-config.js` يمكن نشرها.
- لا يمكن رفع الصور قبل نشر `imagekitAuth` ووضع Secret.
- الوظيفة تستخدم ImageKit folder باسم `/samam` وتعيد رابط الصورة المباشر للمنتج.

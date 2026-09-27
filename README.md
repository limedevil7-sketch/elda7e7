# ويبسايت الدحيح

ملفات PDF ترفع إلى Supabase Storage ويحفظ سجلها في جدول materials، لذلك تظهر من الأجهزة الأخرى بعد النشر. لا يوجد حفظ محلي بديل عند فشل الرفع.

## الملفات

- index.html: واجهة الموقع وFirebase وSupabase مدموجة في ملف واحد.
- firebase.json وfirestore.rules: إعداد Firebase والأسئلة والرسائل المشتركة.
- supabase-setup.sql: سياسات وبيانات Supabase للمواد.

## إعداد Supabase

1. استخدم bucket باسم elday7e7 واجعله Public.
2. تأكد من وجود مستخدم المسؤول limedevil7@gmail.com في Supabase Authentication.
3. إذا لم تكن قد شغّلت سياسات الجدول والتخزين، شغّل supabase-setup.sql في SQL Editor.

## إعداد Firebase والأسئلة والرسائل

فعّل Anonymous Authentication وCloud Firestore، وأضف نطاق GitHub Pages ضمن Authorized domains، ثم انشر محتوى firestore.rules من Firebase Console > Firestore Database > Rules عبر زر Publish.

رسائل «سؤال لمنشئ الموقع» تحفظ في Firestore ضمن creatorInbox وتظهر لصندوق الوارد على الأجهزة المختلفة.

لتفعيل قراءة صندوق الوارد للمسؤول:

1. سجّل دخول lime_devil في الموقع.
2. من لوحة الإدارة انسخ Firebase UID.
3. افتح Firestore > Data وأنشئ مجموعة admins ومستندًا يكون معرّفه هو Firebase UID نفسه.
4. داخل المستند أضف الحقل active من النوع Boolean واجعل قيمته true.
5. حدّث صفحة الموقع وافتح «الرسائل».

## النشر

استبدل index.html وfirestore.rules في ملفات المشروع بالنسختين المرفقتين. ارفع index.html إلى GitHub Pages، وانشر قواعد Firestore من Firebase Console. لا تحتاج إلى رفع .firebaserc أو .gitignore يدويًا لصفحة GitHub Pages.
